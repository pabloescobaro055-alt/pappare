process.env.NODE_ENV='production';
const fs=require('node:fs'),{spawnSync}=require('node:child_process');
for(const name of ['CINEMA_ADMIN_SECRET','CINEMA_ADMIN_TOTP_SECRET','CINEMA_ADMIN_ALLOWED_IPS','CINEMA_SERVICE_SECRET'])delete process.env[name];
require('@next/env').loadEnvConfig(process.cwd(),false);
if(process.platform!=='linux'||!fs.existsSync('.env.production.local')||(process.env.CINEMA_ADMIN_SECRET||'').length<32||(process.env.CINEMA_SERVICE_SECRET||'').length<32||!/^[A-Z2-7]{32,128}$/.test(process.env.CINEMA_ADMIN_TOTP_SECRET||''))throw new Error('Configure admin 2FA on the VPS first');
process.env.CINEMA_ADMIN_ALLOWED_IPS??='';
function pm2(args){const r=spawnSync('pm2',args,{encoding:'utf8',env:process.env});if(r.status!==0)throw new Error('PM2 operation failed. Check PM2 logs separately.');return r.stdout;}
const apps=JSON.parse(pm2(['jlist'])),app=apps.find(x=>x.name==='pappare');
if(!app||fs.realpathSync(app.pm2_env.pm_cwd)!==fs.realpathSync(process.cwd()))throw new Error('PM2 pappare directory differs from the current directory');
pm2(['restart','pappare','--update-env']);
if(apps.some(x=>x.name==='pappare-cinema-notifications'))pm2(['restart','pappare-cinema-notifications','--update-env']);
pm2(['save']);console.log('Site restarted with admin 2FA. No secrets printed.');
