import {test} from 'node:test';
import assert from 'node:assert/strict';
import {randomUUID,createHash} from 'node:crypto';
import {NextRequest} from 'next/server';
import {POST,GET} from '../src/app/api/reservations/route';
import {formToken,relayHeaders,verifyRelay,verifyFormToken,requestIp,guardReservation} from '../src/lib/reservation-security';
import {transaction} from '../src/lib/cinema/database';
import path from 'node:path';
Object.assign(process.env,{NODE_ENV:'test',CINEMA_DEMO:'true',TELEGRAM_BOT_TOKEN:'test-only-token',TELEGRAM_CHAT_ID:'test-chat',RESERVATION_RELAY_SECRET:'test-only-shared-relay-secret-123456789',RESERVATION_RELAY_URL:'direct',CINEMA_SQLITE_PATH:path.join(process.cwd(),'work','guard-'+randomUUID()+'.sqlite')});
delete process.env.DATABASE_URL;delete process.env.CINEMA_DATABASE_URL;delete process.env.VERCEL;
test('reservation abuse protection without external notifications',async t=>{
 const originalFetch=globalThis.fetch;let sent=0;
 globalThis.fetch=async url=>{assert.equal(String(url),'https://api.telegram.org/bottest-only-token/sendMessage');sent++;return Response.json({ok:true,result:{message_id:sent}});};
 const token=()=>{const now=Date.now;Date.now=()=>now()-10000;try{return formToken();}finally{Date.now=now;}};
 let n=0;
 function request(extra:Record<string,unknown>={},headers:Record<string,string>={}){const value=token();return new NextRequest('https://pappare.ru/api/reservations',{method:'POST',headers:{origin:'https://pappare.ru','content-type':'application/json','x-real-ip':'192.0.2.'+(++n),cookie:'pappare-reservation='+value,...headers},body:JSON.stringify({name:'Ирина',phone:'+79149386661',time:'19:00',guests:2,company:'',submittedAt:Date.now()-10000,formToken:value,...extra})});}
 try{
  await t.test('bad names, fake phone, malformed time and guests cannot send messages',async()=>{
   for(const body of [{name:'t'},{phone:'+79990000000'},{time:'test'},{time:{}},{comment:[]},{guests:true},{guests:[1]},{guests:31},{guests:1.5},{guests:'wrong'},{name:'x'.repeat(81)},{comment:'x'.repeat(501)},{company:'bot'}])assert.equal((await POST(request(body))).status,400);
   assert.equal(sent,0);
  });
  await t.test('origin, cookie and signature must all be valid',async()=>{
   assert.equal((await POST(request({}, {origin:'https://evil.example'}))).status,403);
   assert.equal((await POST(request({}, {origin:''}))).status,403);
   assert.equal((await POST(request({}, {cookie:''}))).status,403);
   assert.equal((await POST(request({formToken:'forged'}))).status,403);
   assert.equal(verifyFormToken(token(),token()),false);const fresh=formToken();assert.equal(verifyFormToken(fresh,fresh),false);
   assert.equal(sent,0);
  });
  await t.test('oversized streamed request is rejected without a notification',async()=>{
   const r=new NextRequest('https://pappare.ru/api/reservations',{method:'POST',headers:{origin:'https://pappare.ru','content-type':'application/json','x-real-ip':'198.51.100.90'},body:'x'.repeat(100000)});assert.equal((await POST(r)).status,413);assert.equal(sent,0);
  });
  await t.test('same phone/time cannot resend even after IP and comment change',async()=>{
   assert.equal((await POST(request())).status,200);assert.equal(sent,1);
   for(let i=0;i<6;i++)assert.equal((await POST(request({comment:'changed '+i}))).status,429);
   assert.equal(sent,1);
  });
  await t.test('concurrent duplicate reservation attempts send once',async()=>{
   const results=await Promise.all([POST(request({phone:'+79149386662'})),POST(request({phone:'+79149386662'}))]);assert.deepEqual(results.map(r=>r.status).sort(),[200,429]);assert.equal(sent,2);
  });
  await t.test('rightmost proxy address ignores forged first forwarded IP',()=>{
   const r=new NextRequest('https://pappare.ru',{headers:{'x-forwarded-for':'198.51.100.1, 192.0.2.20'}});assert.equal(requestIp(r),'192.0.2.20');
  });
  await t.test('signed relay rejects forged, changed and stale bodies; public Vercel API closes',async()=>{
   process.env.VERCEL='1';assert.equal((await GET(new NextRequest('https://pappare.vercel.app/api/reservations'))).status,403);
   assert.equal((await POST(request())).status,401);
   const raw=JSON.stringify({name:'Ирина',phone:'+79149386663',time:'20:00',guests:2,submittedAt:Date.now()-10000});const headers=relayHeaders(raw);const r=new NextRequest('https://pappare.vercel.app/api/reservations',{method:'POST',headers:{'content-type':'application/json','x-real-ip':'198.51.100.50',...headers},body:raw});
   assert.equal(verifyRelay(r,raw),true);assert.equal(verifyRelay(r,raw+' '),false);
   assert.equal((await POST(r)).status,200);assert.equal(sent,3);
   const old=Date.now;Date.now=()=>old()+120000;try{assert.equal(verifyRelay(r,raw),false);}finally{Date.now=old;}
   delete process.env.VERCEL;
  });
  await t.test('IP limit survives a separate limiter call and rejects fourth booking',async()=>{
   for(let i=0;i<3;i++)await guardReservation('203.0.113.10','+7914938667'+i,'18:00',randomUUID());
   await assert.rejects(guardReservation('203.0.113.10','+79149386679','18:00',randomUUID()));
   const rows=await transaction(db=>db.query('SELECT count FROM reservation_security_limits WHERE id=$1',['global']));
   // Memory fallback is used without production PostgreSQL; schema remains safe for migration.
   assert.equal(rows.length,0);
  });
  await t.test('persistent limiter survives separate transactions and concurrent requests',async()=>{
   const checks=await Promise.allSettled([transaction(db=>guardReservation('198.51.100.100','+79149386001','21:00','first',db)),transaction(db=>guardReservation('198.51.100.101','+79149386001','21:00','second',db))]);
   assert.equal(checks.filter(r=>r.status==='fulfilled').length,1);assert.equal(checks.filter(r=>r.status==='rejected').length,1);
   await assert.rejects(transaction(db=>guardReservation('198.51.100.102','+79149386001','21:00','third',db)));
   const id='phone:'+createHash('sha256').update('+79149386001').digest('hex');const rows=await transaction(db=>db.query('SELECT count FROM reservation_security_limits WHERE id=$1',[id]));assert.equal(Number(rows[0].count),1);
  });
 }finally{globalThis.fetch=originalFetch;}
});
