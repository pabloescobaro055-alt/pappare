const fs=require('node:fs'),{spawnSync}=require('node:child_process');
if(process.platform!=='linux')throw new Error('Run on the VPS');
const main='/etc/nginx/nginx.conf',target='/etc/nginx/conf.d/pappare-server-tokens.conf';
if(!fs.readFileSync(main,'utf8').includes('/etc/nginx/conf.d/*.conf'))throw new Error('Nginx layout differs; configure server_tokens off manually');
const previous=fs.existsSync(target)?fs.readFileSync(target):null;
fs.writeFileSync(target,'# Hide the Nginx version in response headers.\nserver_tokens off;\n',{mode:0o644});
const test=spawnSync('nginx',['-t'],{encoding:'utf8'});
if(test.status!==0){if(previous)fs.writeFileSync(target,previous);else fs.unlinkSync(target);throw new Error('Nginx validation failed; change rolled back. Check nginx -t separately.');}
const reload=spawnSync('systemctl',['reload','nginx'],{encoding:'utf8'});
if(reload.status!==0){if(previous)fs.writeFileSync(target,previous);else fs.unlinkSync(target);throw new Error('Nginx reload failed; configuration restored. Check systemctl status nginx.');}
console.log('Nginx configuration validated and reloaded. server_tokens off set. No firewall or routing rules changed.');
