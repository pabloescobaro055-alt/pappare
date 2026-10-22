// Read-only triage. Never print PM2 environment values, credentials or request bodies.
const fs=require('node:fs'),{spawnSync}=require('node:child_process');
if(process.platform!=='linux')throw new Error('Run this script on the VPS from /var/www/pappare');
function run(command,args){return spawnSync(command,args,{encoding:'utf8',timeout:15000,maxBuffer:8*1024*1024});}
console.log('Read-only security check; this does not establish that the server is uncompromised.');
console.log('Time:',new Date().toISOString());
console.log('Git revision:',run('git',['rev-parse','--short','HEAD']).stdout?.trim()||'unavailable');
console.log('Node:',process.version);
for(const name of ['next','sharp']){
 try {console.log(name+':',require(name+'/package.json').version);}catch{console.log(name+': unavailable');}
}
const pm2=run('pm2',['jlist']);
try {
 const entries=JSON.parse(pm2.stdout);
 const app=entries.find(x=>x.name==='pappare');
 if(!app)console.log('PM2 pappare: not found');
 else {
  const e=app.pm2_env||{};
  console.log('PM2 pappare:',JSON.stringify({status:e.status,cwd:e.pm_cwd,restarts:e.restart_time,startedAt:e.pm_uptime?new Date(e.pm_uptime).toISOString():null}));
  console.log('PM2 security settings:',JSON.stringify({adminKeyConfigured:(e.CINEMA_ADMIN_SECRET||'').length>=32,totpConfigured:!!e.CINEMA_ADMIN_TOTP_SECRET,serviceKeyConfigured:(e.CINEMA_SERVICE_SECRET||'').length>=32,ipAllowlistConfigured:!!e.CINEMA_ADMIN_ALLOWED_IPS}));
 }
}catch {console.log('PM2 status unavailable');}
for(const [name,command,args] of [
 ['Nginx configuration','nginx',['-t']],
 ['Listening TCP ports','ss',['-ltn']],
 ['UFW','ufw',['status']],
]){
 const r=run(command,args);
 console.log('\n'+name+':\n'+(r.stdout||r.stderr||'unavailable').trim());
}
const access='/var/log/nginx/access.log';
if(fs.existsSync(access)){
 const r=run('tail',['-n','10000',access]);
 const counts={parsed:0,scannerRequests:0,scanner2xx:0,http401:0,http429:0,http5xx:0};
 for(const line of (r.stdout||'').split('\n')){
  const m=line.match(/"[A-Z]+\s+(\S+)\s+HTTP\/[^\"]+"\s+(\d{3})\s/);if(!m)continue;
  counts.parsed++;const code=Number(m[2]);
  let path=m[1].split('?')[0];try{path=decodeURIComponent(path);}catch{}
  if(/\.(?:php\d*|phtml|phar)(?:\/|$)|(?:^|\/)\.(?:env|git|svn|hg)(?:[./]|$)/i.test(path)){counts.scannerRequests++;if(code>=200&&code<300)counts.scanner2xx++;}
  if(code===401)counts.http401++;if(code===429)counts.http429++;if(code>=500)counts.http5xx++;
 }
 console.log('\nLast 10,000 lines of default Nginx access log, aggregate only:',JSON.stringify(counts));
 console.log('Scanner requests alone are not evidence of compromise; 2xx requires investigation. Site-specific and rotated logs are not included.');
}else console.log('Default Nginx access log not found; site may use a different log path.');
console.log('\nNo configuration changed. No keys, cookies or raw request contents printed.');
