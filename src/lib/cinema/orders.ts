import {loadEvent} from './events';
import type {MovieEvent} from '@/data/cinema';
import { randomBytes, createHash } from 'node:crypto';
import { canBook, isPast, eventById, money, dateLabel } from '@/data/cinema';
import { seatIds, seatLabel, type Seat } from '@/data/cinema-hall';
import { transaction, type Connection } from './database';

export class CinemaError extends Error { constructor(message:string, public status=400){super(message);} }
export type PaymentData = { mode:'demo'|'manual'|'provider'; url?:string; qrUrl?:string; providerId?:string; source?:'admin'; note?:string };
export type CinemaOrder = {id:string;eventId:string;name:string;phone:string;telegram:string;total:number;status:string;createdAt:number;expiresAt:number;seatIds:string[];payment:PaymentData};
export const demoMode = ()=>process.env.CINEMA_DEMO !== 'false';
export async function expire(db:Connection, now=Date.now()) {
  await db.query("UPDATE cinema_seats SET status='available',hold_order_id=NULL,hold_until=NULL WHERE status='held' AND hold_until<=$1",[now]);
  await db.query("UPDATE cinema_orders SET status='expired' WHERE status IN ('pending','payment_check_required') AND expires_at<=$1",[now]);
}
async function read(db:Connection,id:string):Promise<CinemaOrder> {
  const [r] = await db.query('SELECT * FROM cinema_orders WHERE id=$1',[id]);
  if (!r) throw new CinemaError('Заказ не найден',404);
  const seats = await db.query('SELECT seat_id FROM cinema_order_seats WHERE order_id=$1 ORDER BY seat_id',[id]);
  return {id:String(r.id),eventId:String(r.event_id),name:String(r.customer_name),phone:String(r.phone),telegram:String(r.telegram),total:Number(r.total_amount),status:String(r.status),createdAt:Number(r.created_at),expiresAt:Number(r.expires_at),seatIds:seats.map(s=>String(s.seat_id)),payment:JSON.parse(String(r.payment_data))};
}
export function notificationText(o:CinemaOrder,event?:MovieEvent) {
  const e = event || eventById(o.eventId);
  if(!e)return `КИНОУЖИН • Заказ: ${o.id} · ${o.status}`;
  return ['КИНОУЖИН • PAPPARE',`Фильм: ${e.title}`,`${dateLabel(e)} · ${e.time}`,`Гость: ${o.name}`,`Телефон: ${o.phone}`,o.telegram?`Telegram: ${o.telegram}`:'',...o.seatIds.map(seatLabel),`Количество: ${o.seatIds.length}`,`Сумма: ${money(o.total)}`,`Заказ: ${o.id}`,o.payment.source==='admin'?`Подтвердил администратор: ${o.payment.note}`:'',`Оплата: ${{pending:'ожидается',paid:'оплачено',payment_check_required:'требует проверки',expired:'резерв истёк',reserved:'не получена — телефонная бронь подтверждена',cancelled:'телефонная бронь отменена'}[o.status] || o.status}`].filter(Boolean).join('\n');
}
async function enqueue(db:Connection,o:CinemaOrder) {
  const [override]=await db.query('SELECT data FROM cinema_event_overrides WHERE id=$1',[o.eventId]);
  await db.query('INSERT INTO cinema_notifications(id,order_id,text) VALUES($1,$2,$3) ON CONFLICT(id) DO NOTHING',[`${o.id}:${o.status}`,o.id,notificationText(o,override?JSON.parse(String(override.data)):undefined)]);
}
export async function seatsFor(eventId:string):Promise<Seat[]> {
  if (!await loadEvent(eventId)) throw new CinemaError('Киноужин не найден',404);
  if (process.env.NODE_ENV === 'production' && demoMode() && !process.env.DATABASE_URL) return seatIds.map(id=>({id,status:'disabled'}));
  return transaction(async db=>{await expire(db);return (await db.query('SELECT id,status FROM cinema_seats WHERE event_id=$1 ORDER BY id',[eventId])) as unknown as Seat[];});
}
export async function getOrder(id:string) {return transaction(async db=>{await expire(db);return read(db,id);});}
export async function createOrder(body:Record<string,unknown>, ip:string) {
  if (process.env.NODE_ENV === 'production' && demoMode()) throw new CinemaError('Демонстрационная версия: продажи пока не открыты',403);
  const event = typeof body.eventId==='string' ? await loadEvent(body.eventId):undefined;
  if (!event || !canBook(event)) throw new CinemaError('Продажи на этот киноужин закрыты');
  if (!Array.isArray(body.seatIds) || !body.seatIds.length || body.seatIds.length>seatIds.length || body.seatIds.some(s=>typeof s!=='string'||!seatIds.includes(s)) || new Set(body.seatIds).size!==body.seatIds.length) throw new CinemaError('Проверьте выбранные места');
  const selected = body.seatIds as string[];
  const name = typeof body.name==='string'?body.name.trim():'';
  const phone = typeof body.phone==='string'?body.phone.trim():'';
  const telegram = typeof body.telegram==='string'?body.telegram.trim():'';
  if(name.length<2||name.length>80||!/^\+?[\d\s()\-]{10,24}$/.test(phone)||phone.replace(/\D/g,'').length<10||telegram.length>80) throw new CinemaError('Укажите имя и корректный телефон');
  if(typeof body.requestKey!=='string'||!/^[a-zA-Z0-9-]{20,80}$/.test(body.requestKey)) throw new CinemaError('Обновите страницу и повторите попытку');
  const key=body.requestKey;
  return transaction(async db=>{
    await expire(db);
    const [existing]=await db.query('SELECT id FROM cinema_orders WHERE request_key=$1',[key]);
    if(existing) {
      const old=await read(db,String(existing.id));
      if(old.eventId!==event.id || old.phone!==phone || old.name!==name || [...old.seatIds].sort().join()!==[...selected].sort().join()) throw new CinemaError('Ключ запроса уже использован',409);
      return old;
    }
    const now=Date.now(), rateId=createHash('sha256').update(ip).digest('hex');
    await db.query('DELETE FROM cinema_rate_limits WHERE reset_at<=$1',[now]);
    const [rate]=await db.query('SELECT count FROM cinema_rate_limits WHERE id=$1',[rateId]);
    if(rate && Number(rate.count)>=8) throw new CinemaError('Слишком много заказов. Попробуйте через 10 минут.',429);
    const available=await db.query("SELECT id FROM cinema_seats WHERE event_id=$1 AND status='available'",[event.id]);
    if(selected.some(s=>!available.some(r=>r.id===s))) throw new CinemaError('Одно из мест уже занято. Выберите другое.',409);
    const hold=Number(process.env.CINEMA_HOLD_MINUTES||10);
    if(!Number.isFinite(hold)||hold<=0||hold>60) throw new Error('Invalid hold duration');
    const id=`PC-${randomBytes(24).toString('hex')}`;
    const expires=now+hold*60000;
    await db.query('INSERT INTO cinema_orders(id,event_id,customer_name,phone,telegram,total_amount,status,created_at,expires_at,request_key) VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)',[id,event.id,name,phone,telegram,event.pricePerSeat*selected.length,'pending',now,expires,key]);
    for(const seat of selected) {
      await db.query("UPDATE cinema_seats SET status='held',hold_order_id=$1,hold_until=$2 WHERE event_id=$3 AND id=$4",[id,expires,event.id,seat]);
      await db.query('INSERT INTO cinema_order_seats(order_id,seat_id) VALUES($1,$2)',[id,seat]);
    }
    await db.query('INSERT INTO cinema_rate_limits(id,count,reset_at) VALUES($1,1,$2) ON CONFLICT(id) DO UPDATE SET count=cinema_rate_limits.count+1',[rateId,now+600000]);
    const order=await read(db,id);await enqueue(db,order);return order;
  });
}
export async function savePayment(id:string,payment:PaymentData) {
  return transaction(async db=>{await db.query('UPDATE cinema_orders SET payment_data=$1 WHERE id=$2',[JSON.stringify(payment),id]);return read(db,id);});
}
export async function changeStatus(id:string,status:'paid'|'payment_check_required', expectedAmount?:number) {
  return transaction(async db=>{
    await expire(db);const order=await read(db,id);
    if(expectedAmount!==undefined && expectedAmount!==order.total) throw new CinemaError('Сумма оплаты не совпадает',409);
    if(order.status==='paid') return order;
    if(!['pending','payment_check_required'].includes(order.status)) throw new CinemaError('Резерв истёк. Свяжитесь с рестораном для проверки платежа.',409);
    const held=await db.query("SELECT id FROM cinema_seats WHERE hold_order_id=$1 AND status='held'",[id]);
    if(held.length!==order.seatIds.length) throw new CinemaError('Места больше не зарезервированы',409);
    await db.query('UPDATE cinema_orders SET status=$1 WHERE id=$2',[status,id]);
    if(status==='paid') await db.query("UPDATE cinema_seats SET status='sold',hold_until=NULL WHERE hold_order_id=$1",[id]);
    const updated=await read(db,id);await enqueue(db,updated);return updated;
  });
}
export async function pendingNotifications() {return transaction(db=>db.query('SELECT * FROM cinema_notifications WHERE delivered=0 LIMIT 20'));}
export async function deliveredNotification(id:string) {return transaction(db=>db.query('UPDATE cinema_notifications SET delivered=1 WHERE id=$1',[id]));}

export async function adminOrders(eventId:string) {return transaction(async db=>{await expire(db);const rows=await db.query("SELECT id FROM cinema_orders WHERE event_id=$1 AND status IN ('reserved','paid','pending','payment_check_required') ORDER BY created_at DESC",[eventId]);return Promise.all(rows.map(r=>read(db,String(r.id))));});}
export async function reserveByAdmin(body:Record<string,unknown>) {
 const event=typeof body.eventId==='string'?await loadEvent(body.eventId):undefined;
 if(!event||isPast(event))throw new CinemaError('Киноужин недоступен');
 const selected=body.seatIds;
 if(!Array.isArray(selected)||!selected.length||selected.length>seatIds.length||selected.some(id=>!seatIds.includes(id))||new Set(selected).size!==selected.length)throw new CinemaError('Проверьте места');
 const name=typeof body.name==='string'?body.name.trim():'',phone=typeof body.phone==='string'?body.phone.trim():'';
 if(name.length<2||name.length>80||!/^\+?[\d\s()\-]{10,24}$/.test(phone)||phone.replace(/\D/g,'').length<10)throw new CinemaError('Укажите имя и телефон');
 const key=body.requestKey;if(typeof key!=='string'||!/^[a-zA-Z0-9-]{20,80}$/.test(key))throw new CinemaError('Некорректный ключ запроса');
 return transaction(async db=>{await expire(db);
 const [existing]=await db.query('SELECT id FROM cinema_orders WHERE request_key=$1',[key]);
 if(existing){const old=await read(db,String(existing.id));if(old.eventId!==event.id||old.name!==name||old.phone!==phone||old.seatIds.slice().sort().join()!==selected.slice().sort().join())throw new CinemaError('Ключ уже использован',409);return old;}
 const available=await db.query("SELECT id FROM cinema_seats WHERE event_id=$1 AND status='available'",[event.id]);
 if(selected.some(id=>!available.some(r=>r.id===id)))throw new CinemaError('Места уже заняты. Обновите схему.',409);
 const id='PC-'+randomBytes(24).toString('hex'),now=Date.now();
 await db.query('INSERT INTO cinema_orders(id,event_id,customer_name,phone,telegram,total_amount,status,created_at,expires_at,request_key) VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)',[id,event.id,name,phone,'',event.pricePerSeat*selected.length,'reserved',now,Date.parse(event.startsAt),key]);
 for(const seat of selected){await db.query("UPDATE cinema_seats SET status='sold',hold_order_id=$1,hold_until=NULL WHERE event_id=$2 AND id=$3",[id,event.id,seat]);await db.query('INSERT INTO cinema_order_seats(order_id,seat_id) VALUES($1,$2)',[id,seat]);}
 const order=await read(db,id);await enqueue(db,order);return order;});
}
export async function cancelAdminReservation(id:string){return transaction(async db=>{const o=await read(db,id);if(o.status==='cancelled')return o;if(o.status!=='reserved')throw new CinemaError('Здесь можно отменить только телефонную бронь без оплаты',409);await db.query("UPDATE cinema_seats SET status='available',hold_order_id=NULL,hold_until=NULL WHERE hold_order_id=$1",[id]);await db.query("UPDATE cinema_orders SET status='cancelled' WHERE id=$1",[id]);const updated=await read(db,id);await enqueue(db,updated);return updated;});}

export async function markAdminPaid(id:string,note:string){if(typeof note!=='string'||note.trim().length<5||note.length>500)throw new CinemaError('Укажите способ оплаты и подтверждение (не менее 5 символов)');return transaction(async db=>{const o=await read(db,id);if(o.status==='paid')return o;if(o.status!=='reserved')throw new CinemaError('Сначала сохраните телефонную бронь',409);await db.query("UPDATE cinema_orders SET status='paid',payment_data=$1 WHERE id=$2",[JSON.stringify({mode:'manual',source:'admin',note:note.trim()}),id]);await db.query('INSERT INTO cinema_admin_audit(id,action,order_id,note,created_at) VALUES($1,$2,$3,$4,$5)',[randomBytes(16).toString('hex'),'mark_paid',id,note.trim(),Date.now()]);const updated=await read(db,id);await enqueue(db,updated);return updated;});}
