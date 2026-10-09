import {test} from 'node:test';
import assert from 'node:assert/strict';
import path from 'node:path';
import {randomUUID} from 'node:crypto';
import {NextRequest} from 'next/server';
import {totp,verifyTotp,ADMIN_COOKIE} from '../src/lib/cinema/admin-auth';
import {GET,POST} from '../src/app/api/cinema/[...path]/route';
Object.assign(process.env,{NODE_ENV:'test',CINEMA_DEMO:'true',CINEMA_ADMIN_SECRET:'test-master-key-not-a-live-secret-123456789',CINEMA_ADMIN_TOTP_SECRET:'GEZDGNBVGY3TQOJQGEZDGNBVGY3TQOJQ',CINEMA_SQLITE_PATH:path.join(process.cwd(),'work','auth-'+randomUUID()+'.sqlite')});
delete process.env.CINEMA_DATABASE_URL;delete process.env.DATABASE_URL;delete process.env.CINEMA_PUBLIC_ORIGIN;
const ctx=(p:string[])=>({params:Promise.resolve({path:p})});
const req=(p:string,body?:unknown,headers:Record<string,string>={})=>new NextRequest('http://localhost/api/cinema/admin'+p,{method:body===undefined?'GET':'POST',headers:{origin:'http://localhost','content-type':'application/json',...headers},body:body===undefined?undefined:JSON.stringify(body)});
test('admin MFA, sessions and safe uploads',async t=>{
 const now=Date.now,base=now();let time=base;Date.now=()=>time;
 const seed=process.env.CINEMA_ADMIN_TOTP_SECRET!,key=process.env.CINEMA_ADMIN_SECRET!;let cookie='';
 try{
  await t.test('RFC TOTP vector and invalid codes',()=>{assert.equal(totp(seed,1),'287082');assert.equal(verifyTotp('287082',seed,59000),1);assert.equal(verifyTotp('<script>',seed),undefined);});
  await t.test('Bearer alone and missing OTP cannot access the admin API',async()=>{
   assert.equal((await GET(req('',undefined,{authorization:'Bearer '+key}),ctx(['admin']))).status,401);
   assert.equal((await POST(req('/login',{key}),ctx(['admin','login']))).status,401);
  });
  await t.test('valid MFA creates secure session; OTP cannot be replayed',async()=>{
   const input={key,code:totp(seed,Math.floor(time/30000))};
   const login=await POST(req('/login',input),ctx(['admin','login']));assert.equal(login.status,200);const header=login.headers.get('set-cookie')!;assert.match(header,/HttpOnly/i);assert.match(header,/SameSite=strict/i);cookie=header.split(';')[0];
   assert.equal((await GET(req('',undefined,{cookie}),ctx(['admin']))).status,200);
   assert.equal((await POST(req('/login',input,{'x-real-ip':'192.0.2.2'}),ctx(['admin','login']))).status,401);
  });
  await t.test('foreign-origin writes and executable uploads are rejected',async()=>{
   assert.equal((await POST(req('/sales',{id:'x',enabled:true},{cookie,origin:'https://evil.example'}),ctx(['admin','sales']))).status,403);
   for(const type of ['image/svg+xml','text/html','application/javascript']){
    const upload=new NextRequest('http://localhost/api/cinema/admin/photo',{method:'POST',headers:{origin:'http://localhost',cookie,'content-type':type},body:'<svg onload="alert(1)"></svg>'});assert.equal((await POST(upload,ctx(['admin','photo']))).status,415);
   }
   const forged=new NextRequest('http://localhost/api/cinema/admin/photo',{method:'POST',headers:{origin:'http://localhost',cookie,'content-type':'image/png'},body:'<script>alert(1)</script>'});assert.equal((await POST(forged,ctx(['admin','photo']))).status,400);
  });
  await t.test('logout revokes a copied session',async()=>{
   assert.equal((await POST(req('/logout',{}, {cookie}),ctx(['admin','logout']))).status,200);assert.equal((await GET(req('',undefined,{cookie}),ctx(['admin']))).status,401);
  });
  await t.test('fifth failed attempt blocks this IP; other IP stays usable',async()=>{
   for(let i=0;i<5;i++)assert.equal((await POST(req('/login',{key:'wrong',code:'000000'},{'x-real-ip':'192.0.2.50'}),ctx(['admin','login']))).status,401);
   time+=30000;
   assert.equal((await POST(req('/login',{key,code:totp(seed,Math.floor(time/30000))},{'x-real-ip':'192.0.2.50'}),ctx(['admin','login']))).status,429);
   const login=await POST(req('/login',{key,code:totp(seed,Math.floor(time/30000))},{'x-real-ip':'192.0.2.51'}),ctx(['admin','login']));assert.equal(login.status,200);cookie=login.headers.get('set-cookie')!.split(';')[0];
  });
  await t.test('session expires and key rotation invalidates it',async()=>{
   process.env.CINEMA_ADMIN_SECRET=key+'rotated';assert.equal((await GET(req('',undefined,{cookie}),ctx(['admin']))).status,401);process.env.CINEMA_ADMIN_SECRET=key;
   time+=3600001;assert.equal((await GET(req('',undefined,{cookie}),ctx(['admin']))).status,401);
  });
  await t.test('IP allowlist rejects other addresses',async()=>{
   process.env.CINEMA_ADMIN_ALLOWED_IPS='192.0.2.99';assert.equal((await POST(req('/login',{key,code:'000000'},{'x-real-ip':'192.0.2.98'}),ctx(['admin','login']))).status,403);delete process.env.CINEMA_ADMIN_ALLOWED_IPS;
  });
  await t.test('service key can retry notifications but cannot enter the admin API',async()=>{
   const service='test-service-only-key-1234567890123456789';process.env.CINEMA_SERVICE_SECRET=service;
   const call=(value:string)=>new NextRequest('http://localhost/api/cinema/notifications/retry',{method:'POST',headers:{authorization:'Bearer '+value},body:'{}'});
   assert.equal((await POST(call(key),ctx(['notifications','retry']))).status,401);
   assert.equal((await POST(call(service),ctx(['notifications','retry']))).status,200);
   assert.equal((await GET(req('',undefined,{authorization:'Bearer '+service}),ctx(['admin']))).status,401);
  });
 }finally{Date.now=now;}
});
