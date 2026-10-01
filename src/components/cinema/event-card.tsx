'use client';
import Link from 'next/link';
import {useEffect,useState} from 'react';
import {ArrowUpRight} from 'lucide-react';
import {type MovieEvent,canBook,dateLabel,isPast,money} from '@/data/cinema';
export function Availability({event}:{event:MovieEvent}) {
  const [count,setCount]=useState<number|null>(null);
  useEffect(()=>{let live=true;async function poll(){try{const r=await fetch(`/api/cinema/events/${event.id}/seats`,{cache:'no-store'});if(!r.ok)throw new Error();const data=await r.json();if(live)setCount(data.seats.filter((s:{status:string})=>s.status==='available').length);}catch{if(live)setCount(null);}}void poll();const t=setInterval(poll,7000);return()=>{live=false;clearInterval(t);};},[event.id]);
  return <span className="availability">{count===null?'Наличие мест уточняется':count===0?'Все места заняты':`Свободно ${count} из 26 мест`}</span>;
}
export function EventCard({event}:{event:MovieEvent}) {return <article className="cinema-card">
  <Link href={`/kino/${event.slug}`} className="card-image"><img src={event.image} alt="Атмосфера PAPPARE — временное изображение события"/><span>{isPast(event)?'Пример':canBook(event)?'Бронирование открыто':'Скоро'}</span><i><ArrowUpRight/></i></Link>
  <div className="card-meta">{dateLabel(event)} <span>·</span> {event.time}<small>DEMO</small></div>
  <Link href={`/kino/${event.slug}`}><h3>{event.title}</h3></Link><p>{event.shortDescription}</p>
  <div className="card-bottom"><span>{money(event.pricePerSeat)} <small>/ гость</small></span>{canBook(event)?<Link href={`/kino/${event.slug}/seats`}>Выбрать места ↗</Link>:<span className="muted">{isPast(event)?'Демонстрационный вечер':'Скоро в продаже'}</span>}</div>
  {canBook(event)&&<Availability event={event}/>}
</article>;}
