const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm'),{EventEmitter}=require('node:events');
const source=fs.readFileSync(require('node:path').join(__dirname,'../scripts/protect-backend-port.cjs'),'utf8').replace('main().catch','globalThis.result=main().catch');
function fixture(failEnable=false){
 const files=new Map(),rules=new Set(),calls=[];let enabled=false,active=false,healthStatus=200;
 const sandbox={console:{log(){},error(){}},process:{platform:'linux',getuid:()=>0},require(name){
  if(name==='node:fs')return {
   existsSync:file=>/^\/usr\/(?:sbin\/(?:ip6?tables|nginx)|bin\/systemctl)$/.test(file)||files.has(file),
   lstatSync:()=>({isSymbolicLink:()=>false}),readFileSync:file=>files.get(file),
   writeFileSync:(file,content)=>files.set(file,content),unlinkSync:file=>files.delete(file),
  };
  if(name==='node:http')return {get(url,options,callback){
   assert.equal(url,'http://127.0.0.1:3000/kino/admin');
   const request=new EventEmitter();request.setTimeout=()=>request;
   queueMicrotask(()=>{const response=new EventEmitter();response.statusCode=healthStatus;response.resume=()=>{};callback(response);queueMicrotask(()=>response.emit('end'));});
   return request;
  }};
  if(name==='node:child_process')return {spawnSync(command,args){
   calls.push([command,...args]);let status=0,stdout='';
   if(command.endsWith('/nginx')&&args[0]==='-T')stdout='proxy_pass http://127.0.0.1:3000;';
   if(command.endsWith('/iptables')||command.endsWith('/ip6tables')){
    const operation=args[2];assert.equal(args[3],'INPUT');assert.equal(args[args.indexOf('--dport')+1],'3000');
    assert.equal(args.includes('-F'),false);assert.equal(args.includes('-P'),false);
    if(operation==='-C')status=rules.has(command)?0:1;
    else if(operation==='-I'){assert.equal(args[4],'1');rules.add(command);}
    else if(operation==='-D')rules.delete(command);
    else throw new Error('Unexpected firewall operation');
   }else if(command.endsWith('/systemctl')){
    if(args[0]==='is-enabled')status=enabled?0:1;
    if(args[0]==='is-active')status=active?0:1;
    if(args[0]==='enable'){status=failEnable?1:0;if(!status){enabled=true;active=true;}}
    if(args[0]==='disable')enabled=false;if(args[0]==='stop')active=false;
   }
   return {status,stdout,stderr:''};
  }};
  throw new Error('Unexpected dependency');
 }};
 return {files,rules,calls,sandbox,setHealth(status){healthStatus=status;},async run(){delete sandbox.process.exitCode;const context={...sandbox};vm.runInNewContext(source,context);await context.result;return sandbox.process.exitCode||0;}};
}
test('backend guard protects both IP families, preserves other ports and is idempotent',async()=>{
 const f=fixture();assert.equal(await f.run(),0);assert.equal(f.rules.size,2);assert.equal(f.files.size,2);
 const unit=f.files.get('/etc/systemd/system/pappare-backend-guard.service');assert.match(unit,/WantedBy=multi-user.target/);
 const first=f.calls.filter(c=>c.includes('-I')).length;assert.equal(first,2);
 assert.equal(await f.run(),0);assert.equal(f.calls.filter(c=>c.includes('-I')).length,first);
});
test('failed persistence rolls back only new rules and files',async()=>{
 const f=fixture(true);f.rules.add('/usr/sbin/iptables');
 assert.equal(await f.run(),1);assert.deepEqual([...f.rules],['/usr/sbin/iptables']);assert.equal(f.files.size,0);
});
test('unhealthy local application prevents firewall changes',async()=>{
 const f=fixture();f.setHealth(503);assert.equal(await f.run(),1);assert.equal(f.rules.size,0);assert.equal(f.files.size,0);
});
