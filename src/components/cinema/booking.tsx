'use client';
import Link from 'next/link';
import {useCallback,useEffect,useRef,useState} from 'react';
import {useRouter} from 'next/navigation';
import {X,ArrowUpRight,Clock3,ShieldCheck} from 'lucide-react';
import {type MovieEvent,canBook,dateLabel,money} from '@/data/cinema';
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
  const update=useCallback((o:CinemaOrder)=>{setOrder(o);onUpdate(o);},[onUpdate]);
  useEffect(()=>{let live=true;const t=setInterval(()=>setNow(Date.now()),1000);const poll=setInterval(async()=>{try{const d=await cinemaApi(`orders/${initial.id}`);if(live)update(d.order);}catch{if(live)setError('Проверка оплаты временно недоступна. Повторяем подключение…');}},4000);return()=>{live=false;clearInterval(t);clearInterval(poll);};},[initial.id,update]);
  useEffect(()=>{if(order.status==='paid')router.push(`/kino/order/${order.id}/success`);},[order.status,order.id,router]);
  const seconds=Math.max(0,Math.ceil((order.expiresAt-now)/1000));
  async function action(path:string){setBusy(true);setError('');try{const d=await cinemaApi(`orders/${order.id}/${path}`,{});update(d.order);}catch(e){setError((e as Error).message);}finally{setBusy(false);}}
  return <div className="payment-panel"><span className="eyebrow">ВАШ ВЕЧЕР ПОЧТИ НАЧАЛСЯ</span><h2>{order.status==='payment_check_required'?'Проверяем оплату':'Оплата киноужина'}</h2><strong className="payment-total">{money(order.total)}</strong><p>{order.seatIds.map(seatLabel).join(' · ')}</p>
    <div className="hold-timer"><Clock3 size={17}/>{seconds>0?`Резерв: ${Math.floor(seconds/60).toString().padStart(2,'0')}:${String(seconds%60).padStart(2,'0')}`:'Время резерва истекло'}</div>
    {seconds>0&&order.status!=='expired'?<>
      {!order.payment.mode&&<Button variant="warm" disabled={busy} onClick={()=>action('payment')}>{busy?'Подключаем оплату…':'Открыть оплату'}</Button>}
      {order.payment.mode==='demo'&&<div className="demo-payment"><ShieldCheck size={28}/><h3>Тестовый платёж</h3><p>Это демонстрация. Деньги не списываются, заявка в рабочий Telegram не отправляется.</p><Button variant="warm" disabled={busy} onClick={()=>action('demo-pay')}>{busy?'Подтверждаем…':'Подтвердить тестовую оплату'}</Button></div>}
      {order.payment.qrUrl&&<img className="payment-qr" src={order.payment.qrUrl} alt="QR-код СБП для оплаты заказа"/>}
      {order.payment.url&&<Button asChild variant="warm"><a href={order.payment.url} target="_blank" rel="noopener noreferrer">Открыть приложение банка <ArrowUpRight size={16}/></a></Button>}
      {order.payment.mode==='manual'&&<><p className="muted">Укажите номер заказа в комментарии к переводу. Подтверждение выполняет ресторан.</p><Button disabled={busy||order.status==='payment_check_required'} onClick={()=>action('check')}>{order.status==='payment_check_required'?'Передано на проверку':'Я оплатил'}</Button></>}
    </>:<><p>Места снова доступны другим гостям. Если вы уже перевели деньги, позвоните в ресторан.</p><a href="tel:+79149386660">+7 (914) 938-66-60</a><Link href="/kino">Выбрать вечер заново →</Link></>}
    {error&&<p className="cinema-error" role="alert">{error}</p>}<p className="order-number">Номер заказа: {order.id}</p><small>Сохраните ссылку на заказ. Она даёт доступ к его деталям.</small>
  </div>;
}
export function SeatSelectionPage({event}:{event:MovieEvent}) {
  const [viewId,setViewId]=useState<CinemaViewId|null>(null);
  const [seats,setSeats]=useState<Seat[]>([]),[selected,setSelected]=useState<string[]>([]),[error,setError]=useState(''),[loading,setLoading]=useState(true),[form,setForm]=useState(false),[busy,setBusy]=useState(false),[order,setOrder]=useState<CinemaOrder|null>(null),[showPayment,setShowPayment]=useState(false);
  const requestKey=useRef(''),restored=useRef(false);
  const refresh=useCallback(async()=>{try{const data=await cinemaApi(`events/${event.id}/seats`);setSeats(data.seats);setError('');}catch(e){setError((e as Error).message);}finally{setLoading(false);}},[event.id]);
  useEffect(()=>{void refresh();const t=setInterval(refresh,5000);return()=>clearInterval(t);},[refresh]);
  useEffect(()=>{try{const saved=sessionStorage.getItem(`cinema-selection-${event.id}`);if(saved){const parsed=JSON.parse(saved);if(Array.isArray(parsed))setSelected(parsed.filter(s=>typeof s==='string'));}const id=sessionStorage.getItem(`cinema-order-${event.id}`);if(id)void cinemaApi(`orders/${id}`).then(d=>{if(['pending','payment_check_required'].includes(d.order.status)){setOrder(d.order);setSelected(d.order.seatIds);}}).catch(()=>{});}catch{}restored.current=true;},[event.id]);
  useEffect(()=>{if(restored.current)try{sessionStorage.setItem(`cinema-selection-${event.id}`,JSON.stringify(selected));}catch{}},[selected,event.id]);
  useEffect(()=>{if(!loading&&!order)setSelected(old=>old.filter(id=>seats.some(s=>s.id===id&&s.status==='available')));},[seats,loading,order]);
  const total=selected.length*event.pricePerSeat,available=seats.filter(s=>s.status==='available').length;
  const valid=canBook(event)&&!loading&&!error&&available>0;
  function toggle(id:string){if(order)return;requestKey.current='';setSelected(old=>old.includes(id)?old.filter(s=>s!==id):[...old,id]);}
  const updateOrder=useCallback((o:CinemaOrder)=>setOrder(o),[]);
  async function submit(e:React.FormEvent<HTMLFormElement>){e.preventDefault();setBusy(true);setError('');const values=new FormData(e.currentTarget);requestKey.current ||= crypto.randomUUID();try{const data=await cinemaApi('orders',{eventId:event.id,seatIds:selected,name:values.get('name'),phone:values.get('phone'),telegram:values.get('telegram'),requestKey:requestKey.current});setOrder(data.order);try{sessionStorage.setItem(`cinema-order-${event.id}`,data.order.id);}catch{}setForm(false);setShowPayment(true);await refresh();}catch(e){setError((e as Error).message);}finally{setBusy(false);}}
  return <main className="booking-main"><div className="booking-heading"><div><span className="eyebrow">ВЫБЕРИТЕ СВОЙ РАКУРС</span><h1>{event.title}</h1></div><p>{dateLabel(event)} · {event.time}<span>PAPPARE, Иркутск · DEMO</span></p></div>
    <div className="booking-grid"><div className="hall-column">{loading?<div className="hall-loading" role="status">Готовим зал к вашему вечеру…</div>:<CinemaHall onView={setViewId} price={event.pricePerSeat} seats={seats} selected={selected} onToggle={toggle} locked={Boolean(order)||!valid}/>}{error&&<div className="cinema-error" role="alert">{error} <button onClick={refresh}>Повторить</button></div>}<VenueView viewId={viewId} onClose={()=>setViewId(null)}/></div>
    {!canBook(event)?<aside className="order-summary cinema-closed-summary"><span className="eyebrow">ТЕСТОВЫЙ ПРОСМОТР</span><h2>Схема зала</h2><p>Нажмите на два значка человека, чтобы увидеть зал с разных ракурсов.</p><p>Онлайн-бронирование и оплата для этого просмотра закрыты.</p><Link href={`/kino/${event.slug}`} className="order-link">Вернуться к меню вечера →</Link></aside>:<aside className="order-summary"><span className="eyebrow">ВЕЧЕР ДЛЯ ВАС</span><h2>За вашим столом</h2><p className="summary-intro">Выберите места 1 и 2 внутри овалов.<br/>Каждое место — отдельное впечатление.</p><div className="order-seats" aria-live="polite">{!selected.length?<div className="empty-selection"><span>↖</span><p>Ваш вечер начинается<br/>с выбора места</p></div>:selected.map(id=><div className="order-seat" key={id}><span>{seatLabel(id)}<small>{money(event.pricePerSeat)}</small></span>{!order&&<button aria-label={`Убрать ${seatLabel(id)}`} onClick={()=>toggle(id)}><X size={17}/></button>}</div>)}</div>
      <div className="order-bottom"><div className="order-total"><span>Итого <small>{selected.length} мест × {money(event.pricePerSeat)}</small></span><strong aria-live="polite">{money(total)}</strong></div><Button variant="warm" disabled={busy||(!order&&(!selected.length||!valid))} onClick={()=>order?setShowPayment(true):setForm(true)}>{order?'Вернуться к заказу':available===0&&!loading?'Все места заняты':'Перейти к оплате'}<ArrowUpRight size={17}/></Button><p className="summary-small"><Clock3 size={13}/> После оформления — резерв на 10 минут</p><p className="summary-demo">DEMO · тестовая оплата без списания</p></div>
    </aside>}</div>
    {form&&<Dialog onClose={()=>{if(!busy)setForm(false);}} title="Данные гостя"><span className="eyebrow">ПОЗНАКОМИМСЯ?</span><h2>Для вашего вечера</h2><p>{selected.length} мест · {money(total)}</p><form className="customer-form" onSubmit={submit}><label>Ваше имя<input name="name" autoComplete="given-name" minLength={2} maxLength={80} required placeholder="Как к вам обращаться"/></label><label>Телефон<input name="phone" type="tel" autoComplete="tel" required minLength={10} maxLength={24} placeholder="+7 999 123-45-67"/></label><label>Telegram <small>необязательно</small><input name="telegram" maxLength={80} placeholder="@username"/></label><p className="muted">Контакты нужны ресторану для связи по этому заказу.</p>{error&&<p className="cinema-error" role="alert">{error}</p>}<Button variant="warm" disabled={busy}>{busy?'Резервируем места…':`Забронировать · ${money(total)}`}</Button></form></Dialog>}
    {showPayment&&order&&<Dialog onClose={()=>setShowPayment(false)} title="Оплата киноужина"><PaymentPanel order={order} onUpdate={updateOrder}/><Link className="order-link" href={`/kino/order/${order.id}/success`}>Открыть страницу заказа →</Link></Dialog>}
  </main>;
}
