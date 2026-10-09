import {randomUUID} from 'node:crypto';
import {loadEvents,loadEvent,saveEvent,setEventSales} from '@/lib/cinema/events';
import {onlineSalesEnabled} from '@/lib/cinema/payment-config';
import {requestIp} from '@/lib/reservation-security';
import {transaction,cinemaDatabaseUrl} from '@/lib/cinema/database';
import {adminOrders,reserveByAdmin,cancelAdminReservation,markAdminPaid} from '@/lib/cinema/orders';
import sharp from 'sharp';
import {authenticateAdmin,loginAdmin,logoutAdmin,machineAdmin,ADMIN_COOKIE} from '@/lib/cinema/admin-auth';
import {readLimitedBody,readLimitedBytes} from '@/lib/request-body';
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
    if(p[0]==='admin'){await authenticateAdmin(request);return json({onlineSalesReady:onlineSalesEnabled(),events:await loadEvents(),orders:request.nextUrl.searchParams.get('eventId')?await adminOrders(request.nextUrl.searchParams.get('eventId')!):[]});}
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
    if(p[0]==='yookassa'&&p[1]==='webhook'&&p.length===2){const raw=await readLimitedBody(request,50000);if(raw===null)throw new CinemaError('Слишком большой запрос',413);await yookassaWebhook(JSON.parse(raw));await flushCinemaNotifications();return json({ok:true});}
    if(p[0]==='webhook') {
      const raw=await readLimitedBody(request,50000);if(raw===null)return json({message:'Слишком большой запрос'},413);
      if(!verifySignature(raw,request.headers.get('x-payment-signature'),request.headers.get('x-payment-timestamp'))) return json({message:'Unauthorized'},401);
      const body=JSON.parse(raw), order=await getOrder(body.orderId);
      if(order.payment.provider==='yookassa'||order.payment.mode!=='provider'||order.payment.providerId!==body.paymentId||body.currency!=='RUB'||body.status!=='paid'||!Number.isInteger(body.amount)) throw new CinemaError('Неверные данные платежа');
      await changeStatus(order.id,'paid',body.amount);await flushCinemaNotifications();return json({ok:true});
    }
    const origin=request.headers.get('origin');
    const expectedOrigin=process.env.CINEMA_PUBLIC_ORIGIN || request.nextUrl.origin;
    const allowedOrigins=process.env.NODE_ENV==='production'?[expectedOrigin,'https://pappare.ru','https://www.pappare.ru']:[expectedOrigin];
    if(origin && !allowedOrigins.includes(origin)) return json({message:'Недопустимый источник запроса'},403);
    if(p[0]==='admin'){
      if(!origin||!allowedOrigins.includes(origin))return json({message:'Недопустимый источник запроса'},403);
      if(p[1]==='login'){
        const raw=await readLimitedBody(request,1000);if(raw===null)return json({message:'Слишком большой запрос'},413);
        const body=JSON.parse(raw);if(!body||typeof body!=='object'||Array.isArray(body))return json({message:'Некорректные данные'},400);
        const token=await loginAdmin(request,body);const response=json({ok:true});response.cookies.set(ADMIN_COOKIE,token,{httpOnly:true,secure:process.env.NODE_ENV==='production',sameSite:'strict',path:'/api/cinema',maxAge:3600});return response;
      }
      await authenticateAdmin(request);
      if(p[1]==='logout'){await logoutAdmin(request);const response=json({ok:true});response.cookies.set(ADMIN_COOKIE,'',{httpOnly:true,secure:process.env.NODE_ENV==='production',sameSite:'strict',path:'/api/cinema',maxAge:0});return response;}
      if(p[1]==='photo'){
        if(Number(request.headers.get('content-length'))>8000000)throw new CinemaError('Максимум 8 МБ');
        const allowedTypes=['image/jpeg','image/png','image/webp'];
        if(!allowedTypes.includes(request.headers.get('content-type')?.split(';')[0]||''))throw new CinemaError('Только JPG, PNG или WebP',415);
        const bytes=await readLimitedBytes(request,8000000);if(bytes===null)throw new CinemaError('Максимум 8 МБ',413);const buffer=Buffer.from(bytes);
        const jpeg=buffer.length>=3&&buffer[0]===255&&buffer[1]===216&&buffer[2]===255;
        const png=buffer.length>=8&&buffer.subarray(0,8).equals(Buffer.from([137,80,78,71,13,10,26,10]));
        const webp=buffer.length>=12&&buffer.subarray(0,4).toString()==='RIFF'&&buffer.subarray(8,12).toString()==='WEBP';
        if(!jpeg&&!png&&!webp)throw new CinemaError('Загрузите корректное фото JPG, PNG или WebP');
        let image:Buffer;try{const metadata=await sharp(buffer,{limitInputPixels:24000000}).metadata();if(!['jpeg','png','webp'].includes(metadata.format||''))throw new Error('Invalid photo');image=await sharp(buffer,{limitInputPixels:24000000}).rotate().resize(1800,1800,{fit:'inside',withoutEnlargement:true}).webp({quality:85}).toBuffer();}catch{throw new CinemaError('Загрузите корректное фото JPG, PNG или WebP');}
        const id=randomUUID();await transaction(db=>db.query('INSERT INTO cinema_media(id,data) VALUES($1,$2)',[id,image.toString('base64')]));return json({url:'/api/cinema/media/'+id});
      }
      const raw=await readLimitedBody(request,20000);if(raw===null)throw new CinemaError('Слишком большой запрос',413);const body=JSON.parse(raw);
      if(p[1]==='event'){try{return json({event:await saveEvent(body)});}catch(e){throw new CinemaError((e as Error).message);}}
      if(p[1]==='sales'){try{return json({event:await setEventSales(body.id,body.enabled)});}catch(e){throw new CinemaError((e as Error).message);}}
      if(p[1]==='reserve'){const order=await reserveByAdmin(body);await flushCinemaNotifications();return json({order});}
      if(p[1]==='cancel'){const order=await cancelAdminReservation(body.id);await flushCinemaNotifications();return json({order});}
      if(p[1]==='paid'){const order=await markAdminPaid(body.id,body.note);await flushCinemaNotifications();return json({order});}
      if(p[1]==='settlement'){return json({receipt:await settleYookassaReceipt(body.id)});}
      return json({message:'Не найдено'},404);
    }
    if(p[0]==='notifications'&&p[1]==='retry') {
      machineAdmin(request);
      await reconcileYookassaPayments();
      await flushCinemaNotifications();return json({ok:true});
    }
    if(p[0]==='orders'&&p.length===1) {
      if(!origin||!allowedOrigins.includes(origin)) return json({message:'Недопустимый источник запроса'},403);
      const raw=await readLimitedBody(request,5000);if(raw===null)throw new CinemaError('Слишком большой запрос',413);
      const body=JSON.parse(raw);if(!body||typeof body!=='object')throw new CinemaError('Некорректный запрос');
      const order=await createOrder(body,requestIp(request));
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
    }
    return json({message:'Не найдено'},404);
  }catch(e){if(e instanceof SyntaxError)return json({message:'Некорректный JSON'},400);return error(e);}
}
