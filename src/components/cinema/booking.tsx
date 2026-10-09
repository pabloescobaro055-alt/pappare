'use client';
import {seatPrice,selectionTotal,eventPriceLabel} from '@/data/cinema-pricing';

import Link from 'next/link';
import {useCallback,useEffect,useRef,useState} from 'react';
import {useRouter} from 'next/navigation';
import {X,ArrowUpRight,Clock3,ShieldCheck} from 'lucide-react';
import {type MovieEvent,canBook,canSelectSeats,dateLabel,money} from '@/data/cinema';
import {seatLabel,type Seat} from '@/data/cinema-hall';
import type {CinemaOrder} from '@/lib/cinema/orders';
import {CinemaHall} from './hall';
import {VenueView} from './venue-view';
import type {CinemaViewId} from '@/data/cinema-views';
import {Button} from '@/components/ui/button';
export async function cinemaApi(path:string,body?:unknown) {
  const response=await fetch(`/api/cinema/${path}`,{method:body===undefined?'GET':'POST',headers:body===undefined?{}:{'Content-Type':'application/json'},body:body===undefined?undefined:JSON.stringify(body),cache:'no-store'});
  const data=await response.json();if(!response.ok)throw new Error(data.message||'Не удалось выполнить запрос');return data;
}
function Dialog({children,onClose,title}:{children:React.ReactNode;onClose:()=>void;title:string}) {
  const ref=useRef<HTMLDialogElement>(null);
  useEffect(()=>{const el=ref.current;const previous=document.activeElement as HTMLElement|null;el?.showModal();return()=>{el?.close();previous?.focus();};},[]);
  return <dialog ref={ref} className="cinema-dialog" onCancel={e=>{e.preventDefault();onClose();}} aria-label={title}><button className="dialog-close" aria-label="Закрыть" onClick={onClose}><X size={20}/></button>{children}</dialog>;
}
export function PaymentPanel({order:initial,onUpdate}:{order:CinemaOrder;onUpdate:(o:CinemaOrder)=>void}) {
  const [order,setOrder]=useState(initial),[error,setError]=useState(''),[busy,setBusy]=useState(false),[now,setNow]=useState(Date.now());
  const router=useRouter();
  useEffect(()=>setOrder(initial),[initial]);
  const update=useCallback((o:CinemaOrder)=>{setOrder(o);onUpdate(o);},[onUpdate]);
  useEffect(()=>{let live=true;const t=setInterval(()=>setNow(Date.now()),1000);const poll=setInterval(async()=>{try{const d=await cinemaApi(`orders/${initial.id}`);if(live)update(d.order);}catch{if(live)setError('Проверка оплаты временно недоступна. Повторяем подключение…');}},4000);return()=>{live=false;clearInterval(t);clearInterval(poll);};},[initial.id,update]);
  useEffect(()=>{if(order.status==='paid')router.push(`/kino/order/${order.id}/success`);},[order.status,order.id,router]);
  const seconds=Math.max(0,Math.ceil((order.expiresAt-now)/1000));
  async function action(path:string){setBusy(true);setError('');try{const d=await cinemaApi(`orders/${order.id}/${path}`,{});update(d.order);if(path==='payment'&&d.order.payment.provider==='yookassa'&&d.order.payment.url)window.location.assign(d.order.payment.url);}catch(e){setError((e as Error).message);}finally{setBusy(false);}}
  return <div className="payment-panel"><span className="eyebrow">ВАШ ВЕЧЕР ПОЧТИ НАЧАЛСЯ</span><h2>{order.status==='payment_check_required'?'Проверяем оплату':'Оплата киноужина'}</h2><strong className="payment-total">{money(order.total)}</strong><p>{order.seatIds.map(seatLabel).join(' · ')}</p>
    <div className="hold-timer"><Clock3 size={17}/>{seconds>0?`Резерв: ${Math.floor(seconds/60).toString().padStart(2,'0')}:${String(seconds%60).padStart(2,'0')}`:'Время резерва истекло'}</div>
    {seconds>0&&!['expired','cancelled','paid_review'].includes(order.status)?<>
      {!order.payment.mode&&<Button variant="warm" disabled={busy} onClick={()=>action('payment')}>{busy?'Подключаем оплату…':'Открыть оплату'}</Button>}
      {order.payment.mode==='demo'&&<div className="demo-payment"><ShieldCheck size={28}/><h3>Тестовый платёж</h3><p>Это демонстрация. Деньги не списываются, заявка в рабочий Telegram не отправляется.</p><Button variant="warm" disabled={busy} onClick={()=>action('demo-pay')}>{busy?'Подтверждаем…':'Подтвердить тестовую оплату'}</Button></div>}
      {order.payment.qrUrl&&<img className="payment-qr" src={order.payment.qrUrl} alt="QR-код СБП для оплаты заказа"/>}
      {order.payment.url&&<Button asChild variant="warm"><a href={order.payment.url} target="_blank" rel="noopener noreferrer">{order.payment.provider==='yookassa'?'Оплатить через ЮKassa':'Открыть приложение банка'} <ArrowUpRight size={16}/></a></Button>}
      {order.payment.mode==='manual'&&<><p className="muted">Укажите номер заказа в комментарии к переводу. Подтверждение выполняет ресторан.</p><Button disabled={busy||order.status==='payment_check_required'} onClick={()=>action('check')}>{order.status==='payment_check_required'?'Передано на проверку':'Я оплатил'}</Button></>}
    </>:<><p>{order.status==='paid_review'?'Оплата получена после окончания резерва. Места не закреплены. Администратор получил уведомление — свяжитесь с рестораном для новой брони или возврата.':order.status==='cancelled'?'Платёж отменён. Места освобождены.':'Резерв истёк. Если вы оплатили, дождитесь проверки и свяжитесь с рестораном.'}</p><a href="tel:+79149386660">+7 (914) 938-66-60</a><Link href="/kino">Выбрать вечер заново →</Link></>}
    {error&&<p className="cinema-error" role="alert">{error}</p>}<p className="order-number">Номер заказа: {order.id}</p><small>Сохраните ссылку на заказ. Она даёт доступ к его деталям.</small>
  </div>;
}
export function SeatSelectionPage({event:initialEvent}:{event:MovieEvent}) {
  const [event,setEvent]=useState(initialEvent);
  const [viewId,setViewId]=useState<CinemaViewId|null>(null);
  const [seats,setSeats]=useState<Seat[]>([]),[selected,setSelected]=useState<string[]>([]),[error,setError]=useState(''),[loading,setLoading]=useState(true),[form,setForm]=useState(false),[busy,setBusy]=useState(false),[order,setOrder]=useState<CinemaOrder|null>(null),[showPayment,setShowPayment]=useState(false);
  const requestKey=useRef(''),restored=useRef(false);
  const refresh=useCallback(async()=>{try{const data=await cinemaApi(`events/${event.id}/seats`);setSeats(data.seats);if(data.event)setEvent(data.event);setError('');}catch(e){setError((e as Error).message);}finally{setLoading(false);}},[event.id]);
  useEffect(()=>{void refresh();const t=setInterval(refresh,5000);return()=>clearInterval(t);},[refresh]);
  useEffect(()=>{try{const saved=sessionStorage.getItem(`cinema-selection-${event.id}`);if(saved){const parsed=JSON.parse(saved);if(Array.isArray(parsed))setSelected(parsed.filter(s=>typeof s==='string'));}const id=sessionStorage.getItem(`cinema-order-${event.id}`);if(id)void cinemaApi(`orders/${id}`).then(d=>{if(['pending','payment_check_required'].includes(d.order.status)){setOrder(d.order);setSelected(d.order.seatIds);}}).catch(()=>{});}catch{}restored.current=true;},[event.id]);
  useEffect(()=>{if(restored.current)try{sessionStorage.setItem(`cinema-selection-${event.id}`,JSON.stringify(selected));}catch{}},[selected,event.id]);
  useEffect(()=>{if(!loading&&!order)setSelected(old=>old.filter(id=>seats.some(s=>s.id===id&&s.status==='available')));},[seats,loading,order]);
  const total=order?.total??selectionTotal(event,selected),available=seats.filter(s=>s.status==='available').length;
  const valid=canSelectSeats(event)&&!loading&&!error&&available>0;
  function toggle(id:string){if(order)return;requestKey.current='';setSelected(old=>old.includes(id)?old.filter(s=>s!==id):[...old,id]);}
  const updateOrder=useCallback((o:CinemaOrder)=>setOrder(o),[]);
  async function submit(e:React.FormEvent<HTMLFormElement>){e.preventDefault();setBusy(true);setError('');const values=new FormData(e.currentTarget);requestKey.current ||= crypto.randomUUID();try{const data=await cinemaApi('orders',{eventId:event.id,seatIds:selected,expectedTotal:total,name:values.get('name'),phone:values.get('phone'),telegram:values.get('telegram'),email:values.get('email'),terms:values.get('terms')==='on',requestKey:requestKey.current});setOrder(data.order);try{sessionStorage.setItem(`cinema-order-${event.id}`,data.order.id);}catch{}setForm(false);setShowPayment(true);await refresh();const payment=await cinemaApi(`orders/${data.order.id}/payment`,{});setOrder(payment.order);if(payment.order.payment.provider==='yookassa'&&payment.order.payment.url)window.location.assign(payment.order.payment.url);}catch(e){setError((e as Error).message);}finally{setBusy(false);}}
  return <main className="booking-main"><div className="booking-heading"><div><span className="eyebrow">ВЫБЕРИТЕ СВОЙ РАКУРС</span><h1>{event.title}</h1></div><p>{dateLabel(event)} · {event.time}<span>PAPPARE, Иркутск</span></p></div>
    <div className="booking-grid"><div className="hall-column">{loading?<div className="hall-loading" role="status">Готовим зал к вашему вечеру…</div>:<CinemaHall onView={setViewId} price={event.pricePerSeat} tablePrices={event.tablePrices} seats={seats} selected={selected} onToggle={toggle} locked={Boolean(order)||!valid}/>}{error&&<div className="cinema-error" role="alert">{error} <button onClick={refresh}>Повторить</button></div>}<VenueView viewId={viewId} onClose={()=>setViewId(null)}/></div>
    <aside className="order-summary"><span className="eyebrow">ВЕЧЕР ДЛЯ ВАС</span><h2>За вашим столом</h2><p className="summary-intro">Нажмите на стол, чтобы выбрать свободные места целиком, или на место 1 и 2 отдельно.<br/>Под каждым столом — цена за одного гостя.</p><div className="order-seats" aria-live="polite">{!selected.length?<div className="empty-selection"><span>↖</span><p>Ваш вечер начинается<br/>с выбора места</p></div>:selected.map(id=><div className="order-seat" key={id}><span>{seatLabel(id)}<small>{money(order?.seatPrices?.[id]??seatPrice(event,id))}</small></span>{!order&&<button aria-label={`Убрать ${seatLabel(id)}`} onClick={()=>toggle(id)}><X size={17}/></button>}</div>)}</div>
      <div className="order-bottom"><div className="order-total"><span>Итого <small>{selected.length} мест · стоимость по выбранным столам</small></span><strong aria-live="polite">{money(total)}</strong></div>{canBook(event)||order?<><Button variant="warm" disabled={busy||(!order&&(!selected.length||!valid))} onClick={()=>order?setShowPayment(true):setForm(true)}>{order?'Вернуться к заказу':available===0&&!loading?'Все места заняты':'Перейти к оплате'}<ArrowUpRight size={17}/></Button><p className="summary-small"><Clock3 size={13}/> После оформления — резерв на 10 минут</p>{event.demo&&<p className="summary-demo">Тестовая оплата без списания</p>}</>:<><Button asChild variant="warm"><a href="tel:+79149386660">Позвонить администратору<ArrowUpRight size={17}/></a></Button><p className="summary-small">+7 (914) 938-66-60</p><p className="summary-small">{canSelectSeats(event)?'Выбор на схеме не закрепляет места. Назовите администратору дату и номера выбранных столов, чтобы подтвердить бронь. Онлайн-оплата скоро появится.':'Вечер завершён или недоступен для бронирования.'}</p><p className="summary-small">Третье место за столом — по согласованию с администратором.</p></>}</div>
    </aside></div>
    {form&&<Dialog onClose={()=>{if(!busy)setForm(false);}} title="Данные гостя"><span className="eyebrow">ПОЗНАКОМИМСЯ?</span><h2>Для вашего вечера</h2><p>{selected.length} мест · {money(total)}</p><form className="customer-form" onSubmit={submit}><label>Ваше имя<input name="name" autoComplete="given-name" minLength={2} maxLength={80} required placeholder="Как к вам обращаться"/></label><label>Телефон<input name="phone" type="tel" autoComplete="tel" required minLength={10} maxLength={24} placeholder="+7 999 123-45-67"/></label><label>Email для электронного чека<input name="email" type="email" autoComplete="email" required maxLength={254} placeholder="you@example.ru"/></label><label>Telegram <small>необязательно</small><input name="telegram" maxLength={80} placeholder="@username"/></label><p className="muted">Контакты нужны ресторану для связи по этому заказу. <Link href="/kino/privacy" target="_blank">Обработка персональных данных</Link>.</p><label><input type="checkbox" required name="terms"/> Я ознакомился с <Link href="/kino/terms" target="_blank">условиями бронирования, оплаты и возврата</Link> и принимаю их.</label>{error&&<p className="cinema-error" role="alert">{error}</p>}<Button variant="warm" disabled={busy}>{busy?'Резервируем места…':`Забронировать · ${money(total)}`}</Button></form></Dialog>}
    {showPayment&&order&&<Dialog onClose={()=>setShowPayment(false)} title="Оплата киноужина"><PaymentPanel order={order} onUpdate={updateOrder}/><Link className="order-link" href={`/kino/order/${order.id}/success`}>Открыть страницу заказа →</Link></Dialog>}
  </main>;
}
