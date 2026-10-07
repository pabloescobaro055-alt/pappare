'use client';
import Link from 'next/link';
import {useEffect,useState} from 'react';
import {ArrowUpRight} from 'lucide-react';
import {type MovieEvent,canBook,dateLabel,isPast,money} from '@/data/cinema';
export function Availability({event}:{event:MovieEvent}) {
  const [count,setCount]=useState<number|null>(null);
  useEffect(()=>{let live=true;async function poll(){try{const r=await fetch(`/api/cinema/events/${event.id}/seats`,{cache:'no-store'});if(!r.ok)throw new Error();const data=await r.json();if(live)setCount(data.seats.filter((s:{status:string})=>s.status==='available').length);}catch{if(live)setCount(null);}}void poll();const t=setInterval(poll,7000);return()=>{live=false;clearInterval(t);};},[event.id]);
  return <span className="availability">{count===null?'Наличие мест уточняется':count===0?'Все места заняты':`Свободно ${count} из 20 мест`}</span>;
}
export function EventCard({event}:{event:MovieEvent}) {return <article className="cinema-card">
  <Link href={`/kino/${event.slug}`} className="card-image"><img src={event.image} alt={`Афиша фильма «${event.title}»`}/><span>{isPast(event)?'Прошедший просмотр':canBook(event)?'Бронирование открыто':'Киноужин · 20 мест'}</span><i><ArrowUpRight/></i></Link>
  <div className="card-meta">{dateLabel(event)} <span>·</span> {event.time}<small>КИНОУЖИН</small></div>
  <Link href={`/kino/${event.slug}`}><h3>{event.title}</h3></Link><p>{event.shortDescription}</p>
  <div className="card-bottom">{event.pricePerSeat>0?<span>{money(event.pricePerSeat)} <small>/ гость</small></span>:<span>Меню из четырёх подач</span>}{canBook(event)?<Link href={`/kino/${event.slug}/seats`}>Выбрать места ↗</Link>:<Link href={`/kino/${event.slug}`}>Меню вечера ↗</Link>}</div>
  {canBook(event)&&<Availability event={event}/>}
</article>;}
