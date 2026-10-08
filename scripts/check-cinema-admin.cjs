const fs=require('node:fs'),{spawnSync}=require('node:child_process');
async function main(){
 const file='.env.production.local';if(!fs.existsSync(file))throw Error('Нет .env.production.local. Скрипт настройки ещё не завершён.');
 const text=fs.readFileSync(file,'utf8');let key=text.match(/^CINEMA_ADMIN_SECRET=(.*)$/m)?.[1]?.trim()||'';
 if((key.startsWith('"')&&key.endsWith('"'))||(key.startsWith("'")&&key.endsWith("'")))key=key.slice(1,-1);
 console.log('Длина ключа в файле: '+key.length);if(key.length<32)throw Error('Ключ в файле слишком короткий или отсутствует.');
 const result=spawnSync('pm2',['jlist'],{encoding:'utf8'});if(result.status!==0)throw Error('Не удалось прочитать PM2.');
 const app=JSON.parse(result.stdout).find(p=>p.name==='pappare');if(!app)throw Error('Процесс pappare не найден.');
 console.log('PM2: '+app.pm2_env.status+'; папка: '+app.pm2_env.pm_cwd);
 const env=app.pm2_env.env||{};const runningKey=app.pm2_env.CINEMA_ADMIN_SECRET||env.CINEMA_ADMIN_SECRET;
 console.log('Ключ в настройках PM2: '+(!runningKey?'не задан (может загружаться из файла)':runningKey===key?'совпадает с файлом':'НЕ СОВПАДАЕТ с файлом'));
 const args=Array.isArray(app.pm2_env.args)?app.pm2_env.args.join(' '):String(app.pm2_env.args||'');
 const argument=args.match(/(?:--port|-p)(?:=|\s+)(\d+)/)?.[1];
 const port=Number(app.pm2_env.PORT||env.PORT||argument||3000);if(!Number.isInteger(port)||port<1||port>65535)throw Error('Не удалось определить порт сайта.');
 for(const [label,url] of [['Сайт на VPS','http://127.0.0.1:'+port+'/api/cinema/admin'],['Публичный сайт','https://pappare.ru/api/cinema/admin']]){
  try{const r=await fetch(url,{headers:{Authorization:'Bearer '+key},redirect:'error',signal:AbortSignal.timeout(12000)});console.log(label+': HTTP '+r.status);if(r.ok)console.log('Вход этим ключом работает.');else if(r.status===401)console.log('Работающий сайт не принимает ключ из файла.');else if(r.status===503)console.log('Ключ принят, но база не настроена.');else if(r.status===500)console.log('Серверная ошибка: нужно проверить подключение к базе.');else if(r.status===404)console.log('Запущена версия без кабинета или запрос попадает в другой сайт.');}
  catch{console.log(label+': не удалось выполнить запрос (порт, сеть или перенаправление).');}
 }
 console.log('Ключ и пароли не выводились. Этот вывод можно прислать в чат.');
}
main().catch(e=>{console.error(e.message);process.exitCode=1;});
