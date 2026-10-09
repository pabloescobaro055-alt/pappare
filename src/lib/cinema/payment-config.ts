export function yookassaReady() {
  return process.env.PAYMENT_PROVIDER==='yookassa' && process.env.CINEMA_DEMO==='false'
    && /^\d+$/.test(process.env.YOOKASSA_SHOP_ID||'') && Boolean(process.env.YOOKASSA_SECRET_KEY)
    && /^https:\/\//.test(process.env.CINEMA_PUBLIC_ORIGIN||'');
}
export const onlineSalesEnabled=()=>yookassaReady()&&process.env.CINEMA_ONLINE_SALES==='true';
