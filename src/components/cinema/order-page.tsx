'use client';
import Link from 'next/link';
import {useCallback,useEffect,useState} from 'react';
import {Check} from 'lucide-react';
import {type MovieEvent,dateLabel,money} from '@/data/cinema';
import {seatLabel} from '@/data/cinema-hall';
import type {CinemaOrder} from '@/lib/cinema/orders';
import {cinemaApi,PaymentPanel} from './booking';
export function OrderPage({id}:{id:string}) {
  const [event,setEvent]=useState<MovieEvent|null>(null);
  const [order,setOrder]=useState<CinemaOrder|null>(null),[error,setError]=useState('');
  const update=useCallback((o:CinemaOrder)=>setOrder(o),[]);
  useEffect(()=>{void cinemaApi(`orders/${id}`).then(d=>{setOrder(d.order);setEvent(d.event);}).catch(e=>setError(e.message));},[id]);
  if(error)return <main className="order-page"><h1>Не удалось открыть заказ</h1><p role="alert">{error}</p><Link href="/kino">К киноужинам</Link></main>;
  if(!order||!event)return <main className="order-page" role="status">Загружаем ваш вечер…</main>;
  if(order.status!=='paid')return <main className="order-page"><PaymentPanel order={order} onUpdate={update}/></main>;

  return <main className="order-page order-success"><div className="success-mark"><Check size={28}/></div><span className="eyebrow">ДО ВСТРЕЧИ В PAPPARE</span><h1>Ваш вечер<br/><em>забронирован.</em></h1><h2>{event.title}</h2><p>{dateLabel(event)} · {event.time}<br/>PAPPARE · переулок Богданова, 4</p><div className="ticket-details">{order.seatIds.map(id=><p key={id}>{seatLabel(id)}</p>)}<strong>{money(order.total)}</strong></div><p className="order-number">{order.id}</p>{order.payment.mode==='demo'&&<p className="demo-note">Тестовая покупка завершена. Деньги не списаны. Это не билет на реальное мероприятие.</p>}<Link className="order-link" href="/kino">К другим вечерам →</Link></main>;
}
