import {createHmac,createHash,randomBytes,timingSafeEqual} from 'node:crypto';
import {isIP} from 'node:net';
import type {NextRequest} from 'next/server';
import {transaction,cinemaDatabaseUrl,type Connection} from './cinema/database';

export class ReservationSecurityError extends Error {constructor(message:string,public status=400){super(message);}}
const localSecret=randomBytes(32).toString('hex');
function key(purpose:string){const configured=process.env.RESERVATION_RELAY_SECRET?.trim();const source=configured&&configured.length>=32?configured:process.env.TELEGRAM_BOT_TOKEN;return source?createHmac('sha256',source).update(purpose).digest('hex'):undefined;}
function formKey(){return key('reservation-form')||(process.env.CINEMA_ADMIN_SECRET?createHmac('sha256',process.env.CINEMA_ADMIN_SECRET).update('reservation-form').digest('hex'):process.env.NODE_ENV==='production'?undefined:localSecret);}
const mac=(secret:string,data:string)=>createHmac('sha256',secret).update(data).digest('hex');
function equal(a:string,b:string){return /^[a-f0-9]{64}$/.test(a)&&timingSafeEqual(Buffer.from(a,'hex'),Buffer.from(b,'hex'));}
export function requestIp(request:NextRequest){
 const forwarded=request.headers.get('x-forwarded-for')?.split(',').map(x=>x.trim()).filter(Boolean)||[];
 const candidate=request.headers.get('x-real-ip')?.trim()||forwarded.at(-1)||'';
 return isIP(candidate)?candidate:'unknown';
}
export function formToken(){const secret=formKey();if(!secret)throw new ReservationSecurityError('Форма временно недоступна. Позвоните в ресторан.',503);const value=Date.now()+'.'+randomBytes(24).toString('hex');return value+'.'+mac(secret,value);}
export function verifyFormToken(token:unknown,cookie:unknown){
 if(typeof token!=='string'||typeof cookie!=='string'||token!==cookie)return false;
 const [timestamp,nonce,signature,...extra]=token.split('.'),secret=formKey();
 const age=Date.now()-Number(timestamp);
 return Boolean(secret&&!extra.length&&/^\d+$/.test(timestamp)&&/^[a-f0-9]{48}$/.test(nonce||'')&&age>=2500&&age<1800000&&equal(signature||'',mac(secret!,timestamp+'.'+nonce)));
}
export function relayHeaders(raw:string){const secret=key('reservation-relay');if(!secret)throw new ReservationSecurityError('Доставка заявок не настроена. Позвоните в ресторан.',503);const timestamp=String(Date.now());return {'X-Pappare-Relay-Hop':'1','X-Pappare-Relay-Time':timestamp,'X-Pappare-Relay-Signature':mac(secret,timestamp+'.'+raw)};}
export function verifyRelay(request:NextRequest,raw:string){const secret=key('reservation-relay'),timestamp=request.headers.get('x-pappare-relay-time')||'',signature=request.headers.get('x-pappare-relay-signature')||'';return Boolean(secret&&request.headers.get('x-pappare-relay-hop')==='1'&&/^\d+$/.test(timestamp)&&Math.abs(Date.now()-Number(timestamp))<60000&&equal(signature,mac(secret!,timestamp+'.'+raw)));}

const memory=new Map<string,{count:number;reset:number}>();
const digest=(value:string)=>createHash('sha256').update(value).digest('hex');
// Persistent on the VPS, process-local fallback for the authenticated delivery service.
export async function guardReservation(ip:string,phone:string,time:string,nonce:string,connection?:Connection){
 const now=Date.now(),fingerprint=digest(phone+'|'+time.toLowerCase().replace(/\s+/g,' ').trim());
 const checks=[{id:'global',limit:20,window:600000},{id:'ip:'+digest(ip),limit:3,window:600000},{id:'phone:'+digest(phone),limit:2,window:1800000},{id:'cooldown:'+digest(phone),limit:1,window:60000},{id:'same:'+fingerprint,limit:1,window:1800000},{id:'token:'+digest(nonce),limit:1,window:1800000}];
 const persist=async(db:Connection)=>{
  await db.query('DELETE FROM reservation_security_limits WHERE reset_at<=$1',[now]);
  for(const c of checks){const [row]=await db.query('SELECT count FROM reservation_security_limits WHERE id=$1',[c.id]);if(row&&Number(row.count)>=c.limit)throw new ReservationSecurityError(c.id.startsWith('same:')?'Такая заявка уже отправлена. Дождитесь звонка администратора.':'Слишком частые заявки. Подождите или позвоните в ресторан.',429);}
  for(const c of checks)await db.query('INSERT INTO reservation_security_limits(id,count,reset_at) VALUES($1,1,$2) ON CONFLICT(id) DO UPDATE SET count=reservation_security_limits.count+1',[c.id,now+c.window]);
 };
 if(connection)return persist(connection);
 if(cinemaDatabaseUrl())return transaction(persist);
 for(const [id,row] of memory)if(row.reset<=now)memory.delete(id);
 for(const c of checks)if((memory.get(c.id)?.count||0)>=c.limit)throw new ReservationSecurityError('Такая заявка уже отправлена или запросы слишком частые. Позвоните в ресторан.',429);
 for(const c of checks){const row=memory.get(c.id);memory.set(c.id,{count:(row?.count||0)+1,reset:row?.reset||now+c.window});}
}

const attempts=new Map<string,{count:number;reset:number}>();
export function limitAttempts(ip:string){const now=Date.now();for(const [id,row] of attempts)if(row.reset<=now)attempts.delete(id);if(attempts.size>=10000&&!attempts.has(ip))return true;const row=attempts.get(ip)||{count:0,reset:now+600000};row.count++;attempts.set(ip,row);return row.count>12;}
