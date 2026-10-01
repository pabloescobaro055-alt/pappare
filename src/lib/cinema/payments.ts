import {createHmac, timingSafeEqual} from 'node:crypto';
import {CinemaError, demoMode, savePayment, type CinemaOrder, type PaymentData} from './orders';

function httpsUrl(value:unknown):string|undefined {
  if(typeof value!=='string'||!value) return undefined;
  try {return new URL(value).protocol==='https:'?value:undefined;}catch{return undefined;}
}
export async function preparePayment(order:CinemaOrder):Promise<CinemaOrder> {
  if(order.payment.mode) return order;
  let payment:PaymentData;
  if(demoMode()) payment={mode:'demo'};
  else if(process.env.PAYMENT_PROVIDER==='manual') {
    const qrUrl=httpsUrl(process.env.SBP_QR_URL),url=httpsUrl(process.env.SBP_PAYMENT_URL);
    if(!qrUrl) throw new CinemaError('Оплата временно недоступна. Резерв сохранён.',503);
    payment={mode:'manual',qrUrl,url};
  } else if(process.env.PAYMENT_PROVIDER==='gateway') {
    const endpoint=httpsUrl(process.env.PAYMENT_GATEWAY_URL);
    if(!endpoint||!process.env.PAYMENT_SECRET) throw new CinemaError('Платёжный провайдер не настроен',503);
    // Adapter contract documented in CINEMA.md. Gateway translates to the bank API.
    const response=await fetch(endpoint,{method:'POST',headers:{'Content-Type':'application/json',Authorization:`Bearer ${process.env.PAYMENT_SECRET}`,'Idempotency-Key':order.id},body:JSON.stringify({orderId:order.id,amount:order.total,currency:'RUB',expiresAt:order.expiresAt}),signal:AbortSignal.timeout(12000)});
    if(!response.ok) throw new CinemaError('Провайдер недоступен. Попробуйте ещё раз.',502);
    const data=await response.json();
    if(!httpsUrl(data.url)||typeof data.id!=='string') throw new CinemaError('Некорректный ответ провайдера',502);
    payment={mode:'provider',url:httpsUrl(data.url),qrUrl:httpsUrl(data.qrUrl),providerId:data.id};
  } else throw new CinemaError('Оплата ещё не настроена',503);
  return savePayment(order.id,payment);
}
export function verifySignature(raw:string,signature:string|null,timestamp:string|null) {
  const secret=process.env.PAYMENT_WEBHOOK_SECRET;
  if(!secret||!signature||!timestamp||!/^[a-f0-9]{64}$/.test(signature)||Math.abs(Date.now()-Number(timestamp))>300000||!Number.isFinite(Number(timestamp))) return false;
  return timingSafeEqual(Buffer.from(signature,'hex'),createHmac('sha256',secret).update(`${timestamp}.${raw}`).digest());
}
