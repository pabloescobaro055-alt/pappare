process.env.NODE_ENV='production';
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto');
require('@next/env').loadEnvConfig(process.cwd(),false);
if(process.platform!=='linux'||!fs.existsSync('package.json'))throw new Error('Run on the VPS in /var/www/pappare');
const file=path.resolve('.env.production.local');let content=fs.existsSync(file)?fs.readFileSync(file,'utf8'):'';
const backup='/root/pappare-security-backups';fs.mkdirSync(backup,{recursive:true,mode:0o700});
if(content)fs.writeFileSync(path.join(backup,'env-'+Date.now()+'.backup'),content,{mode:0o600});
function set(name,value){const pattern=new RegExp('^'+name+'=.*$','m');if(pattern.test(content))content=content.replace(pattern,name+'='+value);else content+='\n'+name+'='+value+'\n';}
let key=process.env.CINEMA_ADMIN_SECRET;if(!key||key.length<32)throw new Error('Existing admin key is missing or too short');
if(process.argv.includes('--rotate-key')){key=crypto.randomBytes(32).toString('hex');set('CINEMA_ADMIN_SECRET',key);}
let seed=process.env.CINEMA_ADMIN_TOTP_SECRET;
if(!seed||process.argv.includes('--rotate-totp')){const alphabet='ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';const bits=[...crypto.randomBytes(20)].map(n=>n.toString(2).padStart(8,'0')).join('');seed=bits.match(/.{5}/g).map(v=>alphabet[parseInt(v,2)]).join('');set('CINEMA_ADMIN_TOTP_SECRET',seed);}
if(!process.env.CINEMA_SERVICE_SECRET||process.env.CINEMA_SERVICE_SECRET.length<32)set('CINEMA_SERVICE_SECRET',crypto.randomBytes(32).toString('hex'));
fs.writeFileSync(file,content,{mode:0o600});fs.chmodSync(file,0o600);
console.log('Add a time-based code to your authenticator. Keep the following values private; do not send screenshots or paste them in chat.');
console.log('Account: PAPPARE admin');console.log('TOTP secret: '+seed);
console.log('Enrollment URI: otpauth://totp/PAPPARE:admin?secret='+seed+'&issuer=PAPPARE&algorithm=SHA1&digits=6&period=30');
if(process.argv.includes('--rotate-key'))console.log('NEW ADMIN KEY (save privately): '+key);
console.log('Restart using: node scripts/restart-admin-security.cjs');
