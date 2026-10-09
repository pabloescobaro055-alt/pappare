const fs=require('node:fs');
const {spawnSync}=require('node:child_process');
const {loadEnvConfig}=require('@next/env');
// Drop stale PM2/payment environment in this helper only, then load the VPS file.
for(const name of ['CINEMA_DEMO','CINEMA_PUBLIC_ORIGIN','PAYMENT_PROVIDER','YOOKASSA_SHOP_ID','YOOKASSA_SECRET_KEY','YOOKASSA_TEST','CINEMA_ONLINE_SALES'])delete process.env[name];
loadEnvConfig(process.cwd(),false);
if(process.platform!=='linux'||!fs.existsSync('.env.production.local'))throw new Error('Run on the VPS in /var/www/pappare after configuring .env.production.local');
if(process.env.PAYMENT_PROVIDER!=='yookassa'||!/^\d+$/.test(process.env.YOOKASSA_SHOP_ID||'')||!process.env.YOOKASSA_SECRET_KEY||process.env.YOOKASSA_SECRET_KEY==='ВАШ_СЕКРЕТНЫЙ_КЛЮЧ'||process.env.CINEMA_DEMO!=='false')throw new Error('YooKassa settings are incomplete; check .env.production.local');
function pm2(args){const result=spawnSync('pm2',args,{encoding:'utf8',env:process.env});if(result.status!==0)throw new Error('PM2 command failed. Check PM2 status separately.');return result.stdout;}
const processes=JSON.parse(pm2(['jlist']));
const app=processes.find(p=>p.name==='pappare');
if(!app||fs.realpathSync(app.pm2_env.pm_cwd)!==fs.realpathSync(process.cwd()))throw new Error('PM2 pappare directory does not match the current directory');
// The worker contacts the same local port; do not guess when PM2 already has a configured port.
const args=Array.isArray(app.pm2_env.args)?app.pm2_env.args:[];const portIndex=args.findIndex(a=>a==='-p'||a==='--port');
process.env.PORT=String(app.pm2_env.PORT||(portIndex>=0?args[portIndex+1]:3000));
pm2(['restart','pappare','--update-env']);
if(processes.some(p=>p.name==='pappare-cinema-notifications'))pm2(['restart','pappare-cinema-notifications','--update-env']);
else pm2(['start','scripts/cinema-notifications-worker.cjs','--name','pappare-cinema-notifications']);
pm2(['save']);
console.log('Site and notification retry worker restarted. Secrets were not printed. Check the checkout and YooKassa webhook.');
