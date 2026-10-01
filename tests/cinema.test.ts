import {test} from 'node:test';
import assert from 'node:assert/strict';
import {randomUUID,createHmac} from 'node:crypto';
import path from 'node:path';
process.env.CINEMA_DEMO='true';
process.env.CINEMA_SQLITE_PATH=path.join(process.cwd(),'work',`test-${randomUUID()}.sqlite`);
import {movieEvents,isPast,canBook} from '../src/data/cinema';
import {cinemaHallConfig,seatIds} from '../src/data/cinema-hall';
import {createOrder,seatsFor,changeStatus,getOrder,notificationText,expire} from '../src/lib/cinema/orders';
import {transaction} from '../src/lib/cinema/database';
import {preparePayment,verifySignature} from '../src/lib/cinema/payments';

const event=movieEvents[0];
// Keep the test event bookable even after its public demonstration date passes.
event.date='2099-09-25';
event.startsAt='2099-09-25T19:30:00+08:00';
function body(seats:string[],extra={}){return {eventId:event.id,seatIds:seats,name:'Тестовый гость',phone:'+70000000000',requestKey:randomUUID(),...extra};}
async function releaseAll(){await transaction(async db=>{await expire(db,Date.now()+3600000);});}
test('Cinema: pricing, concurrency, expiry, independent events and payments',async t=>{
  await t.test('13 tables, 7 round, 6 square, 26 unique seats',()=>{assert.equal(cinemaHallConfig.tables.length,13);assert.equal(cinemaHallConfig.tables.filter(t=>t.shape==='round').length,7);assert.equal(new Set(seatIds).size,26);});
  await t.test('production demo does not accept orders',async()=>{
    const env=process.env as Record<string,string|undefined>;
    const previous=env.NODE_ENV;
    env.NODE_ENV='production';
    try {
      assert.equal(canBook(event),false);
      assert.equal((await seatsFor(event.id)).length,26);
      await assert.rejects(createOrder(body([seatIds[0]]),'public'),error=>error instanceof Error&&error.message.includes('продажи пока не открыты'));
    } finally {env.NODE_ENV=previous;}
  });
  await t.test('server pricing 1 / 2 / 5, ignoring client total',async()=>{for(const n of [1,2,5]){const o=await createOrder(body(seatIds.slice(0,n),{total:1}),randomUUID());assert.equal(o.total,n*3000);await releaseAll();}});
  await t.test('duplicate seat IDs and unknown seats rejected',async()=>{await assert.rejects(createOrder(body([seatIds[0],seatIds[0]]),'bad'));await assert.rejects(createOrder(body(['fake']),'bad'));});
  await t.test('two concurrent clients cannot hold same seat',async()=>{const result=await Promise.allSettled([createOrder(body([seatIds[0]]),'race1'),createOrder(body([seatIds[0]]),'race2')]);assert.equal(result.filter(r=>r.status==='fulfilled').length,1);assert.equal(result.filter(r=>r.status==='rejected').length,1);await releaseAll();});
  await t.test('request retry is idempotent',async()=>{const input=body([seatIds[0]]);const a=await createOrder(input,'retry'),b=await createOrder(input,'retry');assert.equal(a.id,b.id);await releaseAll();});
  await t.test('hold expires and stale payment cannot steal reallocated seats',async()=>{const a=await createOrder(body([seatIds[0]]),'expire');await releaseAll();assert.equal((await getOrder(a.id)).status,'expired');const b=await createOrder(body([seatIds[0]]),'newguest');await assert.rejects(changeStatus(a.id,'paid'));assert.equal((await getOrder(b.id)).status,'pending');await releaseAll();});
  await t.test('same seat IDs belong independently to different events',async()=>{await createOrder(body([seatIds[0]]),'event1');assert.equal((await seatsFor(movieEvents[1].id)).find(s=>s.id===seatIds[0])?.status,'available');await releaseAll();});
  await t.test('closed event cannot be booked; historical events detected',async()=>{await assert.rejects(createOrder(body([seatIds[0]],{eventId:movieEvents[1].id}),'closed'));assert.equal(isPast({...event,startsAt:'2020-01-01T00:00:00Z'}),true);});
  await t.test('demo payment, duplicate callbacks, sold seat not selectable',async()=>{const order=await preparePayment(await createOrder(body([seatIds[1]]),'pay'));assert.equal(order.payment.mode,'demo');await assert.rejects(changeStatus(order.id,'paid',1));const paid=await changeStatus(order.id,'paid',3000);assert.equal(paid.status,'paid');assert.equal((await changeStatus(order.id,'paid',3000)).status,'paid');await assert.rejects(createOrder(body([seatIds[1]]),'steal'));});
  await t.test('manual claim does not mark seats sold',async()=>{const o=await createOrder(body([seatIds[2]]),'manual');await changeStatus(o.id,'payment_check_required');assert.equal((await seatsFor(event.id)).find(s=>s.id===seatIds[2])?.status,'held');await releaseAll();});
  await t.test('Telegram text uses correct event and total',async()=>{const o=await createOrder(body([seatIds[3],seatIds[4]]),'telegram');const text=notificationText(o);assert.match(text,/Рататуй/);assert.match(text,/25 сентября/);assert.match(text,/6\s000 ₽/);assert.match(text,/Количество: 2/);await releaseAll();});
  await t.test('webhook HMAC rejects forged or stale signatures',()=>{process.env.PAYMENT_WEBHOOK_SECRET='test-secret';const raw='{"orderId":"test"}',timestamp=String(Date.now());const signature=createHmac('sha256','test-secret').update(`${timestamp}.${raw}`).digest('hex');assert.equal(verifySignature(raw,signature,timestamp),true);assert.equal(verifySignature(raw+'x',signature,timestamp),false);assert.equal(verifySignature(raw,signature,'0'),false);});
  await t.test('persisted rate limiting rejects ninth order',async()=>{for(let i=0;i<8;i++){await createOrder(body([seatIds[5]]),'rate');await releaseAll();}await assert.rejects(createOrder(body([seatIds[5]]),'rate'),/Слишком много/);});
});
