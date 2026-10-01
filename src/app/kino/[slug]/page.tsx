import Link from 'next/link';
import {notFound} from 'next/navigation';
import {eventBySlug,canBook,dateLabel,money} from '@/data/cinema';
import {Availability} from '@/components/cinema/event-card';
import {Button} from '@/components/ui/button';
export default async function MovieEventPage({params}:{params:Promise<{slug:string}>}) {
  const event=eventBySlug((await params).slug);if(!event)notFound();
  return <main className="movie-page cinema-container"><div className="movie-art"><img src={event.heroImage} alt="Вечерняя атмосфера ресторана PAPPARE"/><span className="eyebrow">КИНО, КОТОРОЕ МОЖНО ПОПРОБОВАТЬ</span></div><div className="movie-details"><span className="eyebrow">КИНОУЖИН · DEMO DATA</span><h1>{event.title}</h1><div className="movie-meta">{dateLabel(event)} · {event.time}<br/>{event.venue}</div><p className="movie-lead">{event.shortDescription}</p><p>{event.description}</p><h2>История в нескольких подачах</h2><p>{event.menuDescription}</p><div className="movie-purchase"><strong>{money(event.pricePerSeat)} <small>/ одно место</small></strong><Availability event={event}/>{canBook(event)?<Button asChild variant="warm"><Link href={`/kino/${event.slug}/seats`}>Выбрать места ↗</Link></Button>:<Button disabled>{event.status==='sold_out'?'Все места заняты':'Продажи закрыты'}</Button>}<Link href={`/kino/${event.slug}/seats`} className="text-sm underline underline-offset-4">Посмотреть схему зала →</Link></div><p className="demo-note">Тестовое событие. Дату и меню подтвердим перед открытием продаж.</p></div></main>;
}
