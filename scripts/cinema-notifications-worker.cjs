// Run under PM2 from the application directory. No credentials are printed.
require('@next/env').loadEnvConfig(process.cwd(),false);
if(!process.env.CINEMA_ADMIN_SECRET)throw new Error('Cinema admin secret is not configured');
const port=process.env.PORT||3000;
let busy=false;
async function retry(){
 if(busy)return;busy=true;
 try{
  const response=await fetch('http://127.0.0.1:'+port+'/api/cinema/notifications/retry',{method:'POST',headers:{Authorization:'Bearer '+process.env.CINEMA_ADMIN_SECRET},signal:AbortSignal.timeout(300000)});
  if(!response.ok)console.error('Cinema notification retry: HTTP '+response.status);
 }catch{console.error('Cinema notification retry: server unavailable');}finally{busy=false;}
}
void retry();setInterval(retry,30000);
