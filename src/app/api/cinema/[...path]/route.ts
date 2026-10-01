import {NextRequest,NextResponse} from 'next/server';
import {movieEvents,isPast} from '@/data/cinema';
import {CinemaError,createOrder,getOrder,seatsFor,changeStatus,demoMode} from '@/lib/cinema/orders';
import {preparePayment,verifySignature} from '@/lib/cinema/payments';
import {flushCinemaNotifications} from '@/lib/cinema/notifications';
export const runtime='nodejs';
export const dynamic='force-dynamic';
type Context={params:Promise<{path:string[]}>};
const json=(data:unknown,status=200)=>NextResponse.json(data,{status,headers:{'Cache-Control':'no-store','Referrer-Policy':'no-referrer'}});
function error(e:unknown) {if(e instanceof CinemaError)return json({message:e.message},e.status);console.error('Cinema API failed',e instanceof Error?e.message:'unknown');return json({message:'Не удалось связаться с сервером. Попробуйте ещё раз.'},500);}
export async function GET(request:NextRequest,context:Context) {
  try {
    const p=(await context.params).path;
    if(p[0]==='events'&&p.length===1) return json({events:await Promise.all(movieEvents.filter(e=>!isPast(e)).map(async e=>({...e,available:(await seatsFor(e.id)).filter(s=>s.status==='available').length})))});
    if(p[0]==='events'&&p[2]==='seats') return json({seats:await seatsFor(p[1])});
    if(p[0]==='orders'&&p.length===2) return json({order:await getOrder(p[1])});
    return json({message:'Не найдено'},404);
  }catch(e){return error(e);}
}
export async function POST(request:NextRequest,context:Context) {
  try {
    const p=(await context.params).path;
    if(p[0]==='webhook') {
      const raw=await request.text();
      if(!verifySignature(raw,request.headers.get('x-payment-signature'),request.headers.get('x-payment-timestamp'))) return json({message:'Unauthorized'},401);
      const body=JSON.parse(raw), order=await getOrder(body.orderId);
      if(order.payment.mode!=='provider'||order.payment.providerId!==body.paymentId||body.currency!=='RUB'||body.status!=='paid'||!Number.isInteger(body.amount)) throw new CinemaError('Неверные данные платежа');
      await changeStatus(order.id,'paid',body.amount);await flushCinemaNotifications();return json({ok:true});
    }
    const origin=request.headers.get('origin');
    const expectedOrigin=process.env.CINEMA_PUBLIC_ORIGIN || `${request.nextUrl.protocol}//${request.headers.get('host')}`;
    if(origin && origin!==expectedOrigin) return json({message:'Недопустимый источник запроса'},403);
    if(p[0]==='notifications'&&p[1]==='retry') {
      if(!process.env.CINEMA_ADMIN_SECRET||request.headers.get('authorization')!==`Bearer ${process.env.CINEMA_ADMIN_SECRET}`)return json({message:'Unauthorized'},401);
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
      if(p[2]==='confirm'&&process.env.CINEMA_ADMIN_SECRET&&request.headers.get('authorization')===`Bearer ${process.env.CINEMA_ADMIN_SECRET}`) {const updated=await changeStatus(order.id,'paid');await flushCinemaNotifications();return json({order:updated});}
    }
    return json({message:'Не найдено'},404);
  }catch(e){if(e instanceof SyntaxError)return json({message:'Некорректный JSON'},400);return error(e);}
}
