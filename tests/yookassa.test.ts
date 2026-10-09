import {test} from 'node:test';
import assert from 'node:assert/strict';
import {randomUUID} from 'node:crypto';
import path from 'node:path';
delete process.env.CINEMA_DATABASE_URL;
delete process.env.DATABASE_URL;
Object.assign(process.env,{NODE_ENV:'test'});
process.env.CINEMA_SQLITE_PATH=path.join(process.cwd(),'work','yookassa-test-'+randomUUID()+'.sqlite');
process.env.CINEMA_DEMO='false';
process.env.PAYMENT_PROVIDER='yookassa';
process.env.CINEMA_ONLINE_SALES='true';
process.env.YOOKASSA_SHOP_ID='1487524';
process.env.YOOKASSA_SECRET_KEY='fake-test-secret';
process.env.CINEMA_PUBLIC_ORIGIN='https://pappare.ru';
delete process.env.YOOKASSA_TEST;
import {movieEvents,canBook,canSelectSeats} from '../src/data/cinema';
import {saveEvent,loadEvent,setEventSales} from '../src/lib/cinema/events';
import {createOrder,getOrder,seatsFor,expire,notificationText,adminOrders} from '../src/lib/cinema/orders';
import {transaction} from '../src/lib/cinema/database';
import {preparePayment} from '../src/lib/cinema/payments';
import {yookassaWebhook,syncYookassaPayment,settleYookassaReceipt,reconcileYookassaPayments} from '../src/lib/cinema/yookassa';
import {onlineSalesEnabled} from '../src/lib/cinema/payment-config';

test('YooKassa checkout and authenticated notifications',async t=>{
 const originalFetch=globalThis.fetch;
 const payments=new Map<string,any>(),requests=new Map<string,{id:string;body:any}>();let receiptCalls=0;
 globalThis.fetch=async(input,init)=>{
  const url=String(input),headers=init?.headers as Record<string,string>;
  assert.match(url,/^https:\/\/api\.yookassa\.ru\/v3\//);
  assert.equal(headers.Authorization,'Basic '+Buffer.from('1487524:fake-test-secret').toString('base64'));
  if(url.endsWith('/payments')&&init?.method==='POST'){
   const body=JSON.parse(String(init.body)),idempotence=headers['Idempotence-Key'];assert.equal(idempotence.length,64);
   const existing=requests.get(idempotence);if(existing){assert.deepEqual(body,existing.body);return Response.json(payments.get(existing.id));}
   const id=randomUUID();requests.set(idempotence,{id,body});
   const payment={id,status:'pending',paid:false,test:false,amount:body.amount,recipient:{account_id:'1487524'},metadata:body.metadata,confirmation:{confirmation_url:'https://yoomoney.ru/checkout/'+id},receipt_registration:'pending'};
   payments.set(id,payment);return Response.json(payment);
  }
  if(url.endsWith('/receipts')&&init?.method==='POST'){
   const body=JSON.parse(String(init.body));assert.equal(body.items[0].payment_mode,'full_payment');assert.equal(body.settlements[0].type,'prepayment');receiptCalls++;return Response.json({id:'receipt-'+randomUUID(),status:'succeeded'});
  }
  if(url.includes('/receipts/'))return Response.json({id:url.split('/').at(-1),status:'succeeded'});
  const data=payments.get(url.split('/').at(-1)!);assert.ok(data);return Response.json(data);
 };
 const event={...movieEvents[0],id:'yoo-test',slug:'yoo-test',date:'2099-10-11',startsAt:'2099-10-11T18:00:00+08:00',tablePrices:{'table-1':3500}};
 await saveEvent(event);await setEventSales(event.id,true);
 const input=(seats:string[],extra={})=>({eventId:event.id,seatIds:seats,name:'Гость',phone:'+79140000000',email:'guest@example.ru',terms:true,requestKey:randomUUID(),...extra});
 const succeed=(id:string)=>Object.assign(payments.get(id),{status:'succeeded',paid:true,receipt_registration:'succeeded'});
 try{
  await t.test('sales need explicit credentials and toggle; email and terms required',async()=>{
   assert.equal((await loadEvent(event.id))?.saleStatus,'open');process.env.CINEMA_ONLINE_SALES='false';assert.equal(onlineSalesEnabled(),false);assert.equal((await loadEvent(event.id))?.saleStatus,'closed');process.env.CINEMA_ONLINE_SALES='true';
   await assert.rejects(createOrder(input(['T01-S1'],{email:''}),'bademail'));await assert.rejects(createOrder(input(['T01-S1'],{terms:false}),'badterms'));
  });
  await t.test('server price snapshot, receipt email/VAT, redirect and idempotence',async()=>{
   const order=await createOrder(input(['T01-S1','T02-S1']),'checkout');assert.equal(order.total,6000);assert.equal(order.email,'guest@example.ru');
   const checkout=await preparePayment(order);assert.equal(checkout.payment.provider,'yookassa');assert.match(checkout.payment.url!,/^https:\/\/yoomoney.ru\//);
   const request=[...requests.values()][0].body;assert.equal(request.capture,true);assert.equal(request.amount.value,'6000.00');assert.equal(request.receipt.customer.email,'guest@example.ru');assert.equal(request.receipt.items[0].vat_code,1);assert.equal(request.receipt.items[0].payment_mode,'full_prepayment');assert.equal(request.receipt.items[0].payment_subject,'service');assert.match(request.confirmation.return_url,/\/kino\/order\/PC-.*\/success$/);
   await preparePayment(order);assert.equal(payments.size,1);
   succeed(checkout.payment.providerId!);
   const callback={type:'notification',event:'payment.succeeded',object:{id:checkout.payment.providerId,status:'canceled',amount:{value:'0.01'}}};
   const paid=await yookassaWebhook(callback);assert.equal(paid.status,'paid');assert.equal((await yookassaWebhook(callback)).status,'paid');
   assert.equal((await seatsFor(event.id)).find(s=>s.id==='T01-S1')?.status,'sold');
   const notifications=await transaction(db=>db.query('SELECT id FROM cinema_notifications WHERE id=$1',[order.id+':paid']));assert.equal(notifications.length,1);
   await saveEvent({...event,date:'2020-10-11'});await settleYookassaReceipt(order.id);await settleYookassaReceipt(order.id);assert.equal(receiptCalls,1);await saveEvent(event);
  });
  await t.test('forged success cannot change a pending bank payment',async()=>{
   const order=await preparePayment(await createOrder(input(['T03-S1']),'forged'));
   const pending=await yookassaWebhook({type:'notification',event:'payment.succeeded',object:{id:order.payment.providerId,status:'succeeded',paid:true}});assert.equal(pending.status,'pending');
   const bank=payments.get(order.payment.providerId!);succeed(bank.id);
   const amount=bank.amount;bank.amount={value:'1.00',currency:'RUB'};await assert.rejects(syncYookassaPayment(order));bank.amount=amount;
   bank.test=true;await assert.rejects(syncYookassaPayment(order));bank.test=false;
   bank.recipient.account_id='other-shop';await assert.rejects(syncYookassaPayment(order));bank.recipient.account_id='1487524';
   assert.equal((await getOrder(order.id)).status,'pending');assert.equal((await syncYookassaPayment(order)).status,'paid');
  });
  await t.test('canceled payment releases held seats',async()=>{
   const order=await preparePayment(await createOrder(input(['T04-S1']),'cancel'));
   Object.assign(payments.get(order.payment.providerId!),{status:'canceled'});assert.equal((await syncYookassaPayment(order)).status,'cancelled');assert.equal((await seatsFor(event.id)).find(s=>s.id==='T04-S1')?.status,'available');
  });
  await t.test('late paid order never takes another guest seat and alerts administrator',async()=>{
   const old=await preparePayment(await createOrder(input(['T05-S1']),'late'));await transaction(db=>expire(db,Date.now()+3600000));
   const next=await createOrder(input(['T05-S1']),'next');succeed(old.payment.providerId!);
   const reviewed=await syncYookassaPayment(old);assert.equal(reviewed.status,'paid_review');assert.match(notificationText(reviewed,await loadEvent(event.id)),/ОПЛАТА ПОЛУЧЕНА/);assert.equal((await getOrder(next.id)).status,'pending');assert.ok((await adminOrders(event.id)).some(o=>o.id===old.id));
   const held=await transaction(db=>db.query('SELECT hold_order_id FROM cinema_seats WHERE event_id=$1 AND id=$2',[event.id,'T05-S1']));assert.equal(held[0].hold_order_id,next.id);
  });
  await t.test('background verification recovers missing callback and alerts once on receipt failure',async()=>{
   const order=await preparePayment(await createOrder(input(['T06-S1']),'background'));succeed(order.payment.providerId!);payments.get(order.payment.providerId!).receipt_registration='canceled';
   await reconcileYookassaPayments();assert.equal((await getOrder(order.id)).status,'paid');
   await syncYookassaPayment(await getOrder(order.id));const warnings=await transaction(db=>db.query('SELECT id FROM cinema_notifications WHERE id=$1',[order.id+':receipt-failed']));assert.equal(warnings.length,1);
  });
  await t.test('pause persists through edits; next evening has fresh seats and explicit reopening',async()=>{
   const existing=await createOrder(input(['T07-S1']),'before-pause');
   await setEventSales(event.id,false);const paused=(await loadEvent(event.id))!;
   assert.equal(paused.bookingPaused,true);assert.equal(canBook(paused),false);assert.equal(canSelectSeats(paused),false);
   await assert.rejects(createOrder(input(['T08-S1']),'during-pause'));
   await saveEvent({...paused,title:'Изменённая афиша',bookingPaused:false});assert.equal((await loadEvent(event.id))?.bookingPaused,true);
   const checkout=await preparePayment(existing);succeed(checkout.payment.providerId!);assert.equal((await syncYookassaPayment(checkout)).status,'paid');
   const next={...event,id:'next-evening',slug:'next-evening',date:'2099-10-18',bookingPaused:false};await saveEvent(next);
   assert.equal((await loadEvent(next.id))?.bookingPaused,true);assert.equal((await seatsFor(next.id)).filter(s=>s.status==='available').length,20);
   assert.equal((await seatsFor(event.id)).find(s=>s.id==='T07-S1')?.status,'sold');
   process.env.CINEMA_ONLINE_SALES='false';await assert.rejects(setEventSales(next.id,true));process.env.CINEMA_ONLINE_SALES='true';
   await setEventSales(next.id,true);assert.equal(canBook((await loadEvent(next.id))!),true);
   await saveEvent({...next,date:'2020-10-18'});await assert.rejects(setEventSales(next.id,true));
   await assert.rejects(setEventSales('unknown',false));await assert.rejects(setEventSales(event.id,'true'));
   assert.equal((await getOrder(existing.id)).status,'paid');
  });
 }finally{globalThis.fetch=originalFetch;}
});
