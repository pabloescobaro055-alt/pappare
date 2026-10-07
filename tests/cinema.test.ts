import {test} from 'node:test';
import assert from 'node:assert/strict';
import {randomUUID,createHmac} from 'node:crypto';
import path from 'node:path';
process.env.CINEMA_DEMO='true';
process.env.CINEMA_SQLITE_PATH=path.join(process.cwd(),'work',`test-${randomUUID()}.sqlite`);
import {movieEvents,isPast,canBook} from '../src/data/cinema';
import {cinemaHallConfig,seatIds} from '../src/data/cinema-hall';
import {reserveByAdmin,cancelAdminReservation,markAdminPaid,adminOrders,createOrder,seatsFor,changeStatus,getOrder,notificationText,expire} from '../src/lib/cinema/orders';
import {transaction} from '../src/lib/cinema/database';
import {preparePayment,verifySignature} from '../src/lib/cinema/payments';

const event=movieEvents[0];
// Keep the test event bookable even after its public demonstration date passes.
event.date='2099-10-04';
event.startsAt='2099-10-04T18:00:00+08:00';
event.status='active';event.demo=true;
event.saleStatus='open';
event.pricePerSeat=3000;
movieEvents.push({...event,id:'test-closed-event',slug:'test-closed-event',status:'upcoming',saleStatus:'closed'});
function body(seats:string[],extra={}){return {eventId:event.id,seatIds:seats,name:'Тестовый гость',phone:'+70000000000',requestKey:randomUUID(),...extra};}
async function releaseAll(){await transaction(async db=>{await expire(db,Date.now()+3600000);});}
test('Cinema: pricing, concurrency, expiry, independent events and payments',async t=>{
  await t.test('10 tables and 20 unique seats',()=>{assert.equal(cinemaHallConfig.tables.length,10);assert.equal(cinemaHallConfig.tables.filter(t=>t.shape==='round').length,10);assert.equal(new Set(seatIds).size,20);});
  await t.test('production demo does not accept orders',async()=>{
    const env=process.env as Record<string,string|undefined>;
    const previous=env.NODE_ENV;
    env.NODE_ENV='production';
    try {
      assert.equal(canBook(event),false);
      assert.equal((await seatsFor(event.id)).length,20);
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
  await t.test('Telegram text uses correct event and total',async()=>{const o=await createOrder(body([seatIds[3],seatIds[4]]),'telegram');const text=notificationText(o);assert.match(text,/Ешь, молись, люби/);assert.match(text,/4 октября/);assert.match(text,/6\s000 ₽/);assert.match(text,/Количество: 2/);await releaseAll();});
  await t.test('webhook HMAC rejects forged or stale signatures',()=>{process.env.PAYMENT_WEBHOOK_SECRET='test-secret';const raw='{"orderId":"test"}',timestamp=String(Date.now());const signature=createHmac('sha256','test-secret').update(`${timestamp}.${raw}`).digest('hex');assert.equal(verifySignature(raw,signature,timestamp),true);assert.equal(verifySignature(raw+'x',signature,timestamp),false);assert.equal(verifySignature(raw,signature,'0'),false);});
  await t.test('persisted rate limiting rejects ninth order',async()=>{for(let i=0;i<8;i++){await createOrder(body([seatIds[5]]),'rate');await releaseAll();}await assert.rejects(createOrder(body([seatIds[5]]),'rate'),/Слишком много/);});
});

test('Admin bookings: concurrency, cancellation, manual payment and event persistence',async()=>{
 const {saveEvent,loadEvent}=await import('../src/lib/cinema/events');
 const e={...event,id:'admin-test-event',slug:'admin-test-event',date:'2099-10-11',time:'18:00',pricePerSeat:2500,saleStatus:'closed' as const};
 await saveEvent(e);assert.equal((await loadEvent(e.id))?.pricePerSeat,2500);
 const input={...body([seatIds[0]]),eventId:e.id};
 const race=await Promise.allSettled([reserveByAdmin(input),reserveByAdmin({...input,requestKey:randomUUID()})]);assert.equal(race.filter(r=>r.status==='fulfilled').length,1);
 const order=(await adminOrders(e.id))[0];assert.equal(order.status,'reserved');assert.equal((await seatsFor(e.id))[0].status,'sold');assert.match(notificationText(order,e),/не получена/);
 assert.equal((await reserveByAdmin(input)).id,order.id);
 await cancelAdminReservation(order.id);assert.equal((await seatsFor(e.id))[0].status,'available');
 const next=await reserveByAdmin({...input,requestKey:randomUUID()});await assert.rejects(markAdminPaid(next.id,''));await markAdminPaid(next.id,'Наличные: чек тест 123');assert.equal((await getOrder(next.id)).status,'paid');await assert.rejects(cancelAdminReservation(next.id));
 await saveEvent({...e,title:'Обновлённая афиша',pricePerSeat:2700});assert.equal((await loadEvent(e.id))?.title,'Обновлённая афиша');assert.equal((await getOrder(next.id)).total,2500);
});

test('Admin API denies missing credentials and foreign origin; uploads only images',async()=>{
 const {NextRequest}=await import('next/server');const {GET,POST}=await import('../src/app/api/cinema/[...path]/route');
 const key='local-unit-tests-only-32-characters-secret';process.env.CINEMA_ADMIN_SECRET=key;
 const ctx=(path:string[])=>({params:Promise.resolve({path})});
 assert.equal((await GET(new NextRequest('http://localhost/api/cinema/admin'),ctx(['admin']))).status,401);
 assert.equal((await POST(new NextRequest('http://localhost/api/cinema/admin/reserve',{method:'POST',headers:{origin:'https://foreign.invalid',host:'localhost',authorization:'Bearer '+key},body:'{}'}),ctx(['admin','reserve']))).status,403);
 assert.equal((await POST(new NextRequest('http://localhost/api/cinema/admin/photo',{method:'POST',headers:{authorization:'Bearer '+key},body:'not an image'}),ctx(['admin','photo']))).status,400);
 const sharp=(await import('sharp')).default;const pixels=await sharp({create:{width:10,height:10,channels:3,background:'#abc'}}).png().toBuffer();
 const result=await POST(new NextRequest('http://localhost/api/cinema/admin/photo',{method:'POST',headers:{authorization:'Bearer '+key},body:pixels}),ctx(['admin','photo']));assert.equal(result.status,200);const {url}=await result.json();const image=await GET(new NextRequest('http://localhost'+url),ctx(['media',url.split('/').pop()]));assert.equal(image.headers.get('content-type'),'image/webp');
 delete process.env.CINEMA_ADMIN_SECRET;
});
