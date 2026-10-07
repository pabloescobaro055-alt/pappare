// Run on the existing Linux VPS as the same root user that owns PM2 pappare.
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto'),{spawnSync}=require('node:child_process');
function run(cmd,args,input){const r=spawnSync(cmd,args,{encoding:'utf8',input,stdio:input?['pipe','pipe','pipe']:'inherit'});if(r.status!==0)throw Error('Команда не завершилась: '+cmd+' (код '+r.status+'). Настройки сайта не изменены.');return r.stdout;}
async function main(){
 if(process.platform!=='linux'||!process.getuid||process.getuid()!==0)throw Error('Запустите на VPS от root, который владеет процессом PM2 pappare.');
 if(!fs.existsSync('package.json')||JSON.parse(fs.readFileSync('package.json')).name!=='pappare-site')throw Error('Перейдите в папку сайта /var/www/pappare.');
 const processes=JSON.parse(spawnSync('pm2',['jlist'],{encoding:'utf8'}).stdout||'[]');const app=processes.find(p=>p.name==='pappare');if(!app)throw Error('В PM2 этого пользователя нет процесса pappare.');
 const appDir=app.pm2_env.pm_cwd;if(path.resolve(appDir)!==process.cwd())throw Error('PM2 использует другую папку: '+appDir);
 require('@next/env').loadEnvConfig(process.cwd(),false);
 const running=app.pm2_env.env||app.pm2_env;
 let url=running.CINEMA_DATABASE_URL||process.env.CINEMA_DATABASE_URL||running.DATABASE_URL||process.env.DATABASE_URL;
 let secret=running.CINEMA_ADMIN_SECRET||process.env.CINEMA_ADMIN_SECRET;
 if(!url){
  if(!fs.existsSync('/usr/bin/psql')){if(!fs.existsSync('/usr/bin/apt-get'))throw Error('Автоустановка поддерживает Ubuntu/Debian.');run('apt-get',['update']);run('apt-get',['install','-y','postgresql']);}
  run('systemctl',['start','postgresql']);
  const suffix=crypto.randomBytes(4).toString('hex'),role='pappare_kino_'+suffix,db=role,password=crypto.randomBytes(32).toString('hex');
  const backup='/root/pappare-setup-backups';fs.mkdirSync(backup,{recursive:true,mode:0o700});
  url='postgresql://'+role+':'+password+'@127.0.0.1:5432/'+db;
  // Save recovery details privately before provisioning; no credentials are printed.
  fs.writeFileSync(backup+'/database-'+suffix+'.env','CINEMA_DATABASE_URL='+url+'\n',{mode:0o600});
  run('runuser',['-u','postgres','--','psql','-v','ON_ERROR_STOP=1'],"CREATE ROLE "+role+" LOGIN PASSWORD '"+password+"';\nCREATE DATABASE "+db+" OWNER "+role+";\n");
  console.log('Создана отдельная база киноужинов.');
 }
 const {Client}=require('pg');const client=new Client({connectionString:url,connectionTimeoutMillis:7000});
 try{await client.connect();await client.query('SELECT 1');await client.query('BEGIN');await client.query('CREATE TABLE cinema_setup_check(id INTEGER)');await client.query('ROLLBACK');}catch{throw Error('Не удалось проверить подключение и права PostgreSQL. Проверьте существующий адрес базы; настройки сайта не изменены.');}finally{await client.end();}
 if(!secret||secret.length<32)secret=crypto.randomBytes(32).toString('hex');
 const file='.env.production.local',backup='/root/pappare-setup-backups';fs.mkdirSync(backup,{recursive:true,mode:0o700});
 if(fs.existsSync(file))fs.writeFileSync(backup+'/production-'+Date.now()+'.env',fs.readFileSync(file),{mode:0o600});
 let text=fs.existsSync(file)?fs.readFileSync(file,'utf8'):'';
 const values={CINEMA_DATABASE_URL:url,CINEMA_ADMIN_SECRET:secret,CINEMA_DEMO:'false',CINEMA_PUBLIC_ORIGIN:'https://pappare.ru'};
 for(const [key,value] of Object.entries(values)){const re=new RegExp('^'+key+'=.*$','m');text=re.test(text)?text.replace(re,()=>key+'='+value):text.replace(/\s*$/,'')+'\n'+key+'='+value+'\n';}
 fs.writeFileSync(file,text,{mode:0o600});fs.chmodSync(file,0o600);
 // Explicitly pass these values so prior PM2 environment does not override the file.
 Object.assign(process.env,values);
 run('pm2',['restart','pappare','--update-env']);run('pm2',['save']);
 console.log('База проверена. Настройки сохранены. pappare перезапущен.');
 console.log('Ключ входа хранится в /var/www/pappare/.env.production.local, строка CINEMA_ADMIN_SECRET. Не отправляйте файл и ключ в чат.');
 console.log('Откройте https://pappare.ru/kino/admin. Онлайн-продажи пока закрыты.');
}
main().catch(e=>{console.error(e.message);process.exitCode=1;});
