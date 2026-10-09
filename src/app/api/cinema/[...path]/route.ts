import {createHash,timingSafeEqual,randomUUID} from 'node:crypto';
import {loadEvents,loadEvent,saveEvent,setEventSales} from '@/lib/cinema/events';
import {onlineSalesEnabled} from '@/lib/cinema/payment-config';
import {transaction,cinemaDatabaseUrl} from '@/lib/cinema/database';
import {adminOrders,reserveByAdmin,cancelAdminReservation,markAdminPaid} from '@/lib/cinema/orders';
import sharp from 'sharp';
function admin(request:NextRequest){const secret=process.env.CINEMA_ADMIN_SECRET;const token=request.headers.get('authorization')||'';if(!secret||secret.length<32||!timingSafeEqual(createHash('sha256').update(token).digest(),createHash('sha256').update('Bearer '+secret).digest()))throw new CinemaError('Нет доступа',401);if(process.env.NODE_ENV==='production'&&!cinemaDatabaseUrl())throw new CinemaError('Для администрирования подключите PostgreSQL',503);}
import {NextRequest,NextResponse} from 'next/server';
import {movieEvents,isPast} from '@/data/cinema';
import {CinemaError,createOrder,getOrder,seatsFor,changeStatus,demoMode} from '@/lib/cinema/orders';
import {preparePayment,verifySignature} from '@/lib/cinema/payments';
import {syncYookassaPayment,yookassaWebhook,settleYookassaReceipt,reconcileYookassaPayments} from '@/lib/cinema/yookassa';
import {flushCinemaNotifications} from '@/lib/cinema/notifications';
export const runtime='nodejs';
export const dynamic='force-dynamic';
type Context={params:Promise<{path:string[]}>};
const json=(data:unknown,status=200)=>NextResponse.json(data,{status,headers:{'Cache-Control':'no-store','Referrer-Policy':'no-referrer'}});
const checkedPayments=new Map<string,number>();
function error(e:unknown) {if(e instanceof CinemaError)return json({message:e.message},e.status);console.error('Cinema API failed',e instanceof Error?e.message:'unknown');return json({message:'Не удалось связаться с сервером. Попробуйте ещё раз.'},500);}
export async function GET(request:NextRequest,context:Context) {
  try {
    const p=(await context.params).path;
    if(p[0]==='admin'){admin(request);return json({onlineSalesReady:onlineSalesEnabled(),events:await loadEvents(),orders:request.nextUrl.searchParams.get('eventId')?await adminOrders(request.nextUrl.searchParams.get('eventId')!):[]});}
    if(p[0]==='media'&&p.length===2){const rows=await transaction(db=>db.query('SELECT data FROM cinema_media WHERE id=$1',[p[1]]));if(!rows.length)return json({message:'Фото не найдено'},404);return new NextResponse(Buffer.from(String(rows[0].data),'base64'),{headers:{'Content-Type':'image/webp','Cache-Control':'public,max-age=31536000,immutable','X-Content-Type-Options':'nosniff'}});}
    if(p[0]==='events'&&p.length===1) return json({events:await Promise.all((await loadEvents()).filter(e=>!isPast(e)).map(async e=>({...e,available:(await seatsFor(e.id)).filter(s=>s.status==='available').length})))});
    if(p[0]==='events'&&p[2]==='seats') return json({seats:await seatsFor(p[1]),event:await loadEvent(p[1])});
    if(p[0]==='orders'&&p.length===2) {let order=await getOrder(p[1]);if(order.payment.provider==='yookassa'&&Date.now()-(checkedPayments.get(order.id)||0)>10000){checkedPayments.set(order.id,Date.now());if(checkedPayments.size>500)checkedPayments.delete(checkedPayments.keys().next().value!);try{order=await syncYookassaPayment(order);await flushCinemaNotifications();}catch(e){if(!(e instanceof CinemaError)||![502,503].includes(e.status))throw e;}}return json({order,event:await loadEvent(order.eventId)});}
    return json({message:'Не найдено'},404);
  }catch(e){return error(e);}
}
export async function POST(request:NextRequest,context:Context) {
  try {
    const p=(await context.params).path;
    if(p[0]==='yookassa'&&p[1]==='webhook'&&p.length===2){const raw=await request.text();if(raw.length>50000)throw new CinemaError('Слишком большой запрос');await yookassaWebhook(JSON.parse(raw));await flushCinemaNotifications();return json({ok:true});}
    if(p[0]==='webhook') {
      const raw=await request.text();
      if(!verifySignature(raw,request.headers.get('x-payment-signature'),request.headers.get('x-payment-timestamp'))) return json({message:'Unauthorized'},401);
      const body=JSON.parse(raw), order=await getOrder(body.orderId);
      if(order.payment.provider==='yookassa'||order.payment.mode!=='provider'||order.payment.providerId!==body.paymentId||body.currency!=='RUB'||body.status!=='paid'||!Number.isInteger(body.amount)) throw new CinemaError('Неверные данные платежа');
      await changeStatus(order.id,'paid',body.amount);await flushCinemaNotifications();return json({ok:true});
    }
    const origin=request.headers.get('origin');
    const expectedOrigin=process.env.CINEMA_PUBLIC_ORIGIN || `${request.nextUrl.protocol}//${request.headers.get('host')}`;
    if(origin && origin!==expectedOrigin) return json({message:'Недопустимый источник запроса'},403);
    if(p[0]==='admin'){
      admin(request);
      if(p[1]==='photo'){
        if(Number(request.headers.get('content-length'))>8000000)throw new CinemaError('Максимум 8 МБ');
        const buffer=Buffer.from(await request.arrayBuffer());if(buffer.length>8000000)throw new CinemaError('Максимум 8 МБ');
        let image:Buffer;try{image=await sharp(buffer,{limitInputPixels:24000000}).rotate().resize(1800,1800,{fit:'inside',withoutEnlargement:true}).webp({quality:85}).toBuffer();}catch{throw new CinemaError('Загрузите корректное фото JPG, PNG или WebP');}
        const id=randomUUID();await transaction(db=>db.query('INSERT INTO cinema_media(id,data) VALUES($1,$2)',[id,image.toString('base64')]));return json({url:'/api/cinema/media/'+id});
      }
      const raw=await request.text();if(raw.length>20000)throw new CinemaError('Слишком большой запрос');const body=JSON.parse(raw);
      if(p[1]==='event'){try{return json({event:await saveEvent(body)});}catch(e){throw new CinemaError((e as Error).message);}}
      if(p[1]==='sales'){try{return json({event:await setEventSales(body.id,body.enabled)});}catch(e){throw new CinemaError((e as Error).message);}}
      if(p[1]==='reserve'){const order=await reserveByAdmin(body);await flushCinemaNotifications();return json({order});}
      if(p[1]==='cancel'){const order=await cancelAdminReservation(body.id);await flushCinemaNotifications();return json({order});}
      if(p[1]==='paid'){const order=await markAdminPaid(body.id,body.note);await flushCinemaNotifications();return json({order});}
      if(p[1]==='settlement'){return json({receipt:await settleYookassaReceipt(body.id)});}
      return json({message:'Не найдено'},404);
    }
    if(p[0]==='notifications'&&p[1]==='retry') {
      admin(request);
      await reconcileYookassaPayments();
      await flushCinemaNotifications();return json({ok:true});
    }
    if(p[0]==='orders'&&p.length===1) {
      const raw=await request.text();if(raw.length>5000)throw new CinemaError('Слишком большой запрос');
      const body=JSON.parse(raw);if(!body||typeof body!=='object')throw new CinemaError('Некорректный запрос');
      const order=await createOrder(body,request.headers.get('x-forwarded-for')?.split(',')[0]?.trim()||'local');
      await flushCinemaNotifications();return json({order},201);
    }
    if(p[0]==='orders'&&p.length===3) {
      const order=await getOrder(p[1]);
      if(p[2]==='payment') {
        if(!['pending','payment_check_required'].includes(order.status))throw new CinemaError('Резерв больше не активен',409);
        return json({order:await preparePayment(order)});
      }
      if(p[2]==='check'&&order.payment.mode==='manual') {const updated=await changeStatus(order.id,'payment_check_required');await flushCinemaNotifications();return json({order:updated});}
      if(p[2]==='demo-pay'&&demoMode()&&order.payment.mode==='demo') return json({order:await changeStatus(order.id,'paid')});
      if(p[2]==='confirm'&&order.payment.provider!=='yookassa'&&process.env.CINEMA_ADMIN_SECRET&&request.headers.get('authorization')===`Bearer ${process.env.CINEMA_ADMIN_SECRET}`) {const updated=await changeStatus(order.id,'paid');await flushCinemaNotifications();return json({order:updated});}
    }
    return json({message:'Не найдено'},404);
  }catch(e){if(e instanceof SyntaxError)return json({message:'Некорректный JSON'},400);return error(e);}
}
