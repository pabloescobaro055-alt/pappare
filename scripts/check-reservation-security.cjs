require('@next/env').loadEnvConfig(process.cwd(),false);
const bot=Boolean(process.env.TELEGRAM_BOT_TOKEN);
const shared=Boolean(process.env.RESERVATION_RELAY_SECRET?.trim().length>=32);
console.log('Ключ для подписанной доставки: '+(shared?'отдельный секрет настроен':bot?'используется ключ бота':'НЕ НАСТРОЕН — задайте одинаковый RESERVATION_RELAY_SECRET на VPS и Vercel'));
console.log('Постоянные ограничения заявок: '+(process.env.CINEMA_DATABASE_URL||process.env.DATABASE_URL?'база настроена':'только память процесса'));
console.log('Кнопки Telegram: '+(process.env.TELEGRAM_ADMIN_IDS?'разрешены перечисленным ID':'только администраторам чата'));
(async()=>{try{const r=await fetch('https://pappare.vercel.app/api/reservations',{signal:AbortSignal.timeout(10000)});console.log('Vercel публичный вход: HTTP '+r.status+(r.status===403&&r.headers.get('x-pappare-reservation-security')==='v1'?' — обновление защиты работает, вход закрыт':' — проверьте выкладку обновления'));}catch{console.log('Vercel: проверка сети недоступна');}})();
