// Restrict only non-loopback INPUT traffic to TCP/3000, for both IP families.
// Does not enable UFW, flush rules, change default policies or touch SSH.
const fs=require('node:fs'),http=require('node:http'),{spawnSync}=require('node:child_process');
const marker='# Managed by PAPPARE protect-backend-port.cjs';
const helper='/usr/local/sbin/pappare-backend-guard';
const unit='/etc/systemd/system/pappare-backend-guard.service';
const service='pappare-backend-guard.service';
const rule=['!','-i','lo','-p','tcp','--dport','3000','-m','comment','--comment','pappare-backend-3000','-j','REJECT','--reject-with','tcp-reset'];
function run(command,args){return spawnSync(command,args,{encoding:'utf8',timeout:20000});}
function checked(command,args){const r=run(command,args);if(r.status!==0)throw new Error(command+' '+args.slice(0,2).join(' ')+' failed; no credentials printed');return r;}
function executable(name){const candidate=['/usr/sbin/','/sbin/','/usr/bin/','/bin/'].map(dir=>dir+name).find(p=>fs.existsSync(p));if(!candidate)throw new Error(name+' is unavailable; no changes made');return candidate;}
function health(){return new Promise((resolve,reject)=>{
 const r=http.get('http://127.0.0.1:3000/kino/admin',{headers:{Host:'pappare.ru'}},response=>{response.resume();response.on('end',()=>response.statusCode===200?resolve():reject(new Error('Local admin page is not HTTP 200')));});
 r.setTimeout(15000,()=>r.destroy(new Error('Local application timeout')));r.on('error',reject);
});}
async function main(){
 if(process.platform!=='linux'||process.getuid?.()!==0)throw new Error('Run on the VPS as root');
 const ipv4=executable('iptables'),ipv6=executable('ip6tables'),systemctl=executable('systemctl'),nginx=executable('nginx');
 checked(nginx,['-t']);
 const config=checked(nginx,['-T']).stdout.split('\n').map(line=>line.replace(/#.*/, '')).join('\n');
 if(!/proxy_pass\s+http:\/\/(?:127\.0\.0\.1|localhost|\[::1\]):3000(?:[\/;\s])/.test(config))throw new Error('Local Nginx upstream on port 3000 not found; no changes made');
 await health();
 const shell=marker+'\n#!/bin/sh\nset -eu\n'+[ipv4,ipv6].map(binary=>
  binary+' -w 10 -C INPUT '+rule.join(' ')+' 2>/dev/null || '+binary+' -w 10 -I INPUT 1 '+rule.join(' ')+'\n').join('');
 const source=marker+'\n[Unit]\nDescription=Protect PAPPARE backend TCP port 3000\nAfter=network.target ufw.service nftables.service netfilter-persistent.service\nBefore=nginx.service\n\n[Service]\nType=oneshot\nRemainAfterExit=yes\nExecStart=/bin/sh '+helper+'\n\n[Install]\nWantedBy=multi-user.target\n';
 const files=[[helper,shell,0o700],[unit,source,0o644]];
 // Refuse to overwrite a custom unit or helper, even if similarly named.
 for(const [file,content] of files)if(fs.existsSync(file)&&(fs.lstatSync(file).isSymbolicLink()||fs.readFileSync(file,'utf8')!==content))throw new Error('Existing guard configuration differs: '+file+'; no changes made');
 const added=[],created=[];
 const wasEnabled=run(systemctl,['is-enabled',service]).status===0;
 const wasActive=run(systemctl,['is-active',service]).status===0;
 try {
  for(const binary of [ipv4,ipv6]){
   // Query first, so repeating this command never inserts duplicate rules.
   const result=run(binary,['-w','10','-C','INPUT',...rule]);
   if(result.status!==0&&result.status!==1)throw new Error('Cannot inspect firewall rules');
   if(result.status!==0){checked(binary,['-w','10','-I','INPUT','1',...rule]);added.push(binary);}
  }
  await health();
  for(const [file,content,mode] of files)if(!fs.existsSync(file)){fs.writeFileSync(file,content,{mode,flag:'wx'});created.push(file);}
  checked(systemctl,['daemon-reload']);checked(systemctl,['enable','--now',service]);
  for(const binary of [ipv4,ipv6])checked(binary,['-w','10','-C','INPUT',...rule]);
  console.log('TCP/3000 is blocked for non-loopback incoming traffic in IPv4 and IPv6.');
  console.log('Local application: HTTP 200. Guard enabled for server reboot.');
  console.log('Ports 22, 80, 443 and existing firewall policies were not changed.');
  console.log('Verify https://pappare.ru/ externally; ss can still show *:3000 because protection is at the firewall.');
 } catch(error){
  if(!wasActive)run(systemctl,['stop',service]);
  if(!wasEnabled)run(systemctl,['disable',service]);
  const rollback=[];
  for(const binary of added)if(run(binary,['-w','10','-D','INPUT',...rule]).status!==0)rollback.push(binary+' rule');
  for(const file of created)try{fs.unlinkSync(file);}catch{rollback.push(file);}
  run(systemctl,['daemon-reload']);
  throw new Error(error.message+(rollback.length?'; rollback incomplete: '+rollback.join(', '):'; new changes rolled back'));
 }
}
main().catch(error=>{console.error(error.message);process.exitCode=1;});
