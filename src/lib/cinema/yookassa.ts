import {createHash} from 'node:crypto';
import {transaction} from './database';
import {loadEvent} from './events';
import {CinemaError,getOrder,applyYookassaPayment,type CinemaOrder,type PaymentData} from './orders';
import {yookassaReady} from './payment-config';
import {seatLabel} from '@/data/cinema-hall';

type ReceiptItem={description:string;quantity:string;amount:{value:string;currency:string};vat_code:number;payment_mode:string;payment_subject:string;measure:string};
type PaymentRequest={amount:{value:string;currency:string};capture:boolean;confirmation:{type:string;return_url:string};description:string;metadata:{order_id:string};receipt:{customer:{email:string};items:ReceiptItem[]}};
type YooPayment={id:string;status:string;paid:boolean;test:boolean;amount:{value:string;currency:string};recipient:{account_id:string};metadata:{order_id:string};confirmation?:{confirmation_url?:string};receipt_registration?:string};
const key=(value:string)=>createHash('sha256').update(value).digest('hex');
async function api(path:string,body?:unknown,idempotence?:string) {
 if(!yookassaReady())throw new CinemaError('ЮKassa не настроена',503);
 let response:Response;
 try{response=await fetch('https://api.yookassa.ru/v3/'+path,{method:body===undefined?'GET':'POST',headers:{Authorization:'Basic '+Buffer.from(process.env.YOOKASSA_SHOP_ID+':'+process.env.YOOKASSA_SECRET_KEY).toString('base64'),'Content-Type':'application/json',...(idempotence?{'Idempotence-Key':key(idempotence)}:{})},body:body===undefined?undefined:JSON.stringify(body),cache:'no-store',signal:AbortSignal.timeout(12000)});}catch{throw new CinemaError('ЮKassa временно недоступна. Попробуйте ещё раз.',503);}
 if(!response.ok)throw new CinemaError('ЮKassa не приняла запрос. Резерв сохранён; повторите попытку или позвоните администратору.',502);
 return response.json();
}
function validatePayment(data:YooPayment,order:CinemaOrder) {
 if(!data||typeof data.id!=='string'||!/^[-a-zA-Z0-9]{10,80}$/.test(data.id)||data.metadata?.order_id!==order.id||data.recipient?.account_id!==process.env.YOOKASSA_SHOP_ID||data.amount?.currency!=='RUB'||data.amount.value!==order.total.toFixed(2)||data.test!==(process.env.YOOKASSA_TEST==='true')||!['pending','succeeded','canceled'].includes(data.status)||(data.status==='succeeded'&&data.paid!==true))throw new CinemaError('Не удалось подтвердить данные платежа ЮKassa',409);
 if(order.payment.providerId&&order.payment.providerId!==data.id)throw new CinemaError('Платёж не относится к заказу',409);
}
function paymentData(data:YooPayment):PaymentData {
 const url=data.confirmation?.confirmation_url;
 if(url){let valid=false;try{const parsed=new URL(url);valid=parsed.protocol==='https:'&&(['yoomoney.ru','yookassa.ru'].some(host=>parsed.hostname===host||parsed.hostname.endsWith('.'+host)));}catch{}if(!valid)throw new CinemaError('Неверный адрес оплаты ЮKassa',502);}
 return {mode:'provider',provider:'yookassa',providerId:data.id,...(url?{url}:{}),receiptStatus:data.receipt_registration};
}
export async function createYookassaPayment(order:CinemaOrder) {
 if(!order.email)throw new CinemaError('В заказе нет email для чека. Оформите новый заказ после окончания резерва.',409);
 const event=await loadEvent(order.eventId);if(!event)throw new CinemaError('Киноужин не найден',404);
 const proposed:PaymentRequest={amount:{value:order.total.toFixed(2),currency:'RUB'},capture:true,confirmation:{type:'redirect',return_url:new URL('/kino/order/'+order.id+'/success',process.env.CINEMA_PUBLIC_ORIGIN).href},description:('Киноужин PAPPARE · '+event.title+' · '+event.date).slice(0,128),metadata:{order_id:order.id},receipt:{customer:{email:order.email},items:order.seatIds.map(id=>({description:('Киноужин '+event.title+' · '+event.date+' · '+seatLabel(id)).slice(0,128),quantity:'1.000',amount:{value:order.seatPrices[id].toFixed(2),currency:'RUB'},vat_code:1,payment_mode:'full_prepayment',payment_subject:'service',measure:'piece'}))}};
 // Persist the exact request before sending it: concurrent/retried requests use the same body and key.
 const body=await transaction(async db=>{await db.query('INSERT INTO cinema_payment_requests(order_id,data) VALUES($1,$2) ON CONFLICT(order_id) DO NOTHING',[order.id,JSON.stringify(proposed)]);const [row]=await db.query('SELECT data FROM cinema_payment_requests WHERE order_id=$1',[order.id]);return JSON.parse(String(row.data)) as PaymentRequest;});
 const data=await api('payments',body,order.id) as YooPayment;
 validatePayment(data,order);
 return applyYookassaPayment(order.id,paymentData(data),data.status as 'pending'|'succeeded'|'canceled');
}
export async function syncYookassaPayment(order:CinemaOrder) {
 if(order.payment.provider!=='yookassa'||!order.payment.providerId)return order;
 const data=await api('payments/'+encodeURIComponent(order.payment.providerId)) as YooPayment;
 validatePayment(data,order);
 return applyYookassaPayment(order.id,paymentData(data),data.status as 'pending'|'succeeded'|'canceled');
}
export async function yookassaWebhook(body:unknown) {
 const notification=body as {type?:string;event?:string;object?:{id?:string}};
 if(notification?.type!=='notification'||!['payment.succeeded','payment.canceled'].includes(notification.event||'')||typeof notification.object?.id!=='string'||!/^[-a-zA-Z0-9]{10,80}$/.test(notification.object.id))throw new CinemaError('Неверное уведомление');
 // Never trust the posted amount, metadata or status. Retrieve them using our shop credentials.
 const data=await api('payments/'+encodeURIComponent(notification.object.id)) as YooPayment;
 if(!data?.metadata?.order_id)throw new CinemaError('Неизвестный заказ',404);
 const order=await getOrder(data.metadata.order_id);validatePayment(data,order);
 const [attempt]=await transaction(db=>db.query('SELECT data FROM cinema_payment_requests WHERE order_id=$1',[order.id]));
 if(!attempt)throw new CinemaError('Оплата этого заказа не создавалась',409);
 return applyYookassaPayment(order.id,paymentData(data),data.status as 'pending'|'succeeded'|'canceled');
}
let reconciliationOffset=0;
export async function reconcileYookassaPayments() {
 if(!yookassaReady())return;
 const candidates=await transaction(db=>db.query("SELECT id FROM cinema_orders WHERE created_at>$1 AND status IN ('pending','expired','paid','paid_review') AND payment_data LIKE $2 AND (status IN ('pending','expired') OR (payment_data NOT LIKE $3 AND payment_data NOT LIKE $4)) ORDER BY id",[Date.now()-86400000,'%"provider":"yookassa"%','%"receiptStatus":"succeeded"%','%"receiptStatus":"canceled"%']));
 const offset=candidates.length?reconciliationOffset%candidates.length:0;
 const rows=[...candidates.slice(offset),...candidates.slice(0,offset)].slice(0,5);reconciliationOffset=offset+rows.length;
 for(const row of rows){try{await syncYookassaPayment(await getOrder(String(row.id)));}catch{console.error('YooKassa background verification failed; will retry');}}
}
export async function settleYookassaReceipt(id:string) {
 const order=await getOrder(id),event=await loadEvent(order.eventId);
 if(order.status!=='paid'||order.payment.provider!=='yookassa'||!event||Date.now()<Date.parse(event.startsAt))throw new CinemaError('Чек зачёта доступен после оказания услуги для оплаченного заказа',409);
 await syncYookassaPayment(order);
 const [saved]=await transaction(db=>db.query('SELECT data FROM cinema_settlement_receipts WHERE order_id=$1',[id]));
 if(saved){const receipt=JSON.parse(String(saved.data));const current=await api('receipts/'+encodeURIComponent(receipt.id));await transaction(db=>db.query('UPDATE cinema_settlement_receipts SET data=$1 WHERE order_id=$2',[JSON.stringify(current),id]));return current;}
 const [request]=await transaction(db=>db.query('SELECT data FROM cinema_payment_requests WHERE order_id=$1',[id]));
 if(!request)throw new CinemaError('Данные чека не найдены',409);
 const original=JSON.parse(String(request.data)) as PaymentRequest;
 const receipt=await api('receipts',{type:'payment',payment_id:order.payment.providerId,send:true,customer:original.receipt.customer,items:original.receipt.items.map(item=>({...item,payment_mode:'full_payment'})),settlements:[{type:'prepayment',amount:original.amount}]},id+':settlement');
 if(!receipt?.id||!['pending','succeeded','canceled'].includes(receipt.status))throw new CinemaError('Не удалось подтвердить создание чека',502);
 await transaction(async db=>{await db.query('INSERT INTO cinema_settlement_receipts(order_id,data) VALUES($1,$2) ON CONFLICT(order_id) DO UPDATE SET data=$2',[id,JSON.stringify(receipt)]);await db.query('INSERT INTO cinema_admin_audit(id,action,order_id,note,created_at) VALUES($1,$2,$3,$4,$5) ON CONFLICT(id) DO NOTHING',[key(id+':settlement'),'settlement',id,'Чек зачёта предоплаты: '+receipt.id,Date.now()]);});
 return receipt;
}
