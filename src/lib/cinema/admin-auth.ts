import {createHash,createHmac,randomBytes,timingSafeEqual} from 'node:crypto';
import {isIP} from 'node:net';
import type {NextRequest} from 'next/server';
import {transaction,cinemaDatabaseUrl} from './database';
import {CinemaError} from './orders';
import {requestIp} from '../reservation-security';
export const ADMIN_COOKIE='pappare-cinema-admin';
const ttl=3600000;
const hash=(v:string)=>createHash('sha256').update(v).digest('hex');
const eq=(a:string,b:string)=>timingSafeEqual(createHash('sha256').update(a).digest(),createHash('sha256').update(b).digest());
function secret(){const value=process.env.CINEMA_ADMIN_SECRET;if(!value||value.length<32)throw new CinemaError('Вход администратора не настроен',503);return value;}
function sessionKey(){return createHmac('sha256',secret()).update('admin-session:'+ (process.env.CINEMA_ADMIN_TOTP_SECRET||'')).digest();}
export function totp(secret:string,counter:number){
 const alphabet='ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';let bits='';for(const c of secret.toUpperCase().replace(/\s/g,'')){const n=alphabet.indexOf(c);if(n<0)throw new Error('Invalid TOTP secret');bits+=n.toString(2).padStart(5,'0');}
 const bytes=Buffer.from(bits.match(/.{8}/g)?.map(b=>parseInt(b,2))||[]);if(bytes.length<20)throw new Error('TOTP secret too short');
 const input=Buffer.alloc(8);input.writeBigUInt64BE(BigInt(counter));const digest=createHmac('sha1',bytes).update(input).digest();const offset=digest[digest.length-1]&15;
 return String((digest.readUInt32BE(offset)&0x7fffffff)%1000000).padStart(6,'0');
}
export function verifyTotp(code:unknown,seed:string,now=Date.now()):number|undefined{
 if(typeof code!=='string'||!/^\d{6}$/.test(code))return undefined;
 const counter=Math.floor(now/30000);
 for(const n of [counter,counter-1,counter+1])if(eq(code,totp(seed,n)))return n;
 return undefined;
}
function allowIp(request:NextRequest){
 const entries=(process.env.CINEMA_ADMIN_ALLOWED_IPS||'').split(',').map(x=>x.trim()).filter(Boolean);
 if(entries.length&&(!entries.every(ip=>Boolean(isIP(ip)))||!entries.includes(requestIp(request))))throw new CinemaError('Доступ из этой сети запрещён',403);
}
export function machineAdmin(request:NextRequest){
 const service=process.env.CINEMA_SERVICE_SECRET;
 if(!service||service.length<32||!eq(request.headers.get('authorization')||'','Bearer '+service))throw new CinemaError('Нет доступа',401);
 if(process.env.NODE_ENV==='production'&&!cinemaDatabaseUrl())throw new CinemaError('Для администрирования подключите PostgreSQL',503);
}
export async function authenticateAdmin(request:NextRequest){
 allowIp(request);
 const token=request.cookies.get(ADMIN_COOKIE)?.value||'';
 const [id,expires,signature,...extra]=token.split('.');
 const value=id+'.'+expires;
 if(extra.length||!/^[a-f0-9]{64}$/.test(id||'')||!/^[a-f0-9]{64}$/.test(signature||'')||!/^\d+$/.test(expires||'')||Number(expires)<=Date.now()||!eq(signature,createHmac('sha256',sessionKey()).update(value).digest('hex')))throw new CinemaError('Войдите в панель администратора',401);
 if(process.env.NODE_ENV==='production'&&!/^[A-Z2-7]{32,128}$/.test(process.env.CINEMA_ADMIN_TOTP_SECRET?.trim().toUpperCase()||''))throw new CinemaError('Настройте двухфакторный вход на VPS',503);
 if(process.env.NODE_ENV==='production'&&!cinemaDatabaseUrl())throw new CinemaError('Для администрирования подключите PostgreSQL',503);
 const [row]=await transaction(db=>db.query('SELECT expires_at FROM cinema_admin_sessions WHERE id=$1',[hash(id)]));
 if(!row||Number(row.expires_at)<=Date.now())throw new CinemaError('Сессия завершена. Войдите заново',401);
}
export async function loginAdmin(request:NextRequest,input:{key?:unknown;code?:unknown}){
 allowIp(request);const configured=secret();
 if(process.env.NODE_ENV==='production'&&!cinemaDatabaseUrl())throw new CinemaError('Для администрирования подключите PostgreSQL',503);
 const seed=process.env.CINEMA_ADMIN_TOTP_SECRET?.trim().toUpperCase();
 if(process.env.NODE_ENV==='production'&&!seed)throw new CinemaError('Настройте двухфакторный вход на VPS',503);
 if(seed&&!/^[A-Z2-7]{32,128}$/.test(seed))throw new CinemaError('Двухфакторный вход настроен некорректно',503);
 const now=Date.now(),ip=hash(requestIp(request));
 const outcome=await transaction(async db=>{
  await db.query('DELETE FROM cinema_admin_login_limits WHERE reset_at<=$1',[now]);
  await db.query('DELETE FROM cinema_admin_sessions WHERE expires_at<=$1',[now]);
  const [limit]=await db.query('SELECT count FROM cinema_admin_login_limits WHERE id=$1',[ip]);
  if(limit&&Number(limit.count)>=5)return {blocked:true};
  const correctKey=typeof input.key==='string'&&eq(input.key,configured);
  const counter=seed&&correctKey?verifyTotp(input.code,seed,now):undefined;
  let valid=correctKey&&(!seed||counter!==undefined);
  if(valid&&seed){const [used]=await db.query('SELECT counter FROM cinema_admin_totp WHERE id=$1',[hash(seed)]);if(used&&counter!<=Number(used.counter))valid=false;}
  if(!valid){await db.query('INSERT INTO cinema_admin_login_limits(id,count,reset_at) VALUES($1,1,$2) ON CONFLICT(id) DO UPDATE SET count=cinema_admin_login_limits.count+1',[ip,now+900000]);return {invalid:true};}
  if(seed)await db.query('INSERT INTO cinema_admin_totp(id,counter) VALUES($1,$2) ON CONFLICT(id) DO UPDATE SET counter=$2',[hash(seed),counter]);
  await db.query('DELETE FROM cinema_admin_login_limits WHERE id=$1',[ip]);
  const id=randomBytes(32).toString('hex'),expires=now+ttl;
  await db.query('INSERT INTO cinema_admin_sessions(id,expires_at) VALUES($1,$2)',[hash(id),expires]);
  const value=id+'.'+expires;return {token:value+'.'+createHmac('sha256',sessionKey()).update(value).digest('hex')};
 });
 if(outcome.blocked)throw new CinemaError('Слишком много попыток входа. Подождите 15 минут',429);
 if(outcome.invalid||!outcome.token)throw new CinemaError('Неверный ключ или код подтверждения',401);
 return outcome.token;
}
export async function logoutAdmin(request:NextRequest){const id=request.cookies.get(ADMIN_COOKIE)?.value.split('.')[0];if(id&&/^[a-f0-9]{64}$/.test(id))await transaction(db=>db.query('DELETE FROM cinema_admin_sessions WHERE id=$1',[hash(id)]));}
