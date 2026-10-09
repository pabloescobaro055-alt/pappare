import {eventPriceLabel} from '@/data/cinema-pricing';
import {loadEventSlug} from '@/lib/cinema/events';
export const dynamic='force-dynamic';
import Link from 'next/link';
import {notFound} from 'next/navigation';
import {eventBySlug,canBook,canSelectSeats,dateLabel,money} from '@/data/cinema';
import {Availability} from '@/components/cinema/event-card';
import {Button} from '@/components/ui/button';
export default async function MovieEventPage({params}:{params:Promise<{slug:string}>}) {
  const event=await loadEventSlug((await params).slug);if(!event)notFound();
  return <main className="movie-page cinema-container"><div className="movie-art"><img src={event.heroImage} alt={`Афиша фильма «${event.title}»`}/><span className="eyebrow">КИНО, КОТОРОЕ МОЖНО ПОПРОБОВАТЬ</span></div><div className="movie-details"><span className="eyebrow">КИНОУЖИН · 20 МЕСТ</span><h1>{event.title}</h1><div className="movie-meta">{dateLabel(event)} · {event.time}<br/>{event.venue}</div><p className="movie-lead">{event.shortDescription}</p><p>{event.description}</p><h2>Меню вечера</h2><p>{event.menuDescription}</p>{event.menuCourses&&<ol className="movie-menu">{event.menuCourses.map((course,index)=><li key={course.category}><span>{String(index+1).padStart(2,'0')}</span><div><small>{course.category}</small><strong>{course.name}</strong></div></li>)}</ol>}<div className="movie-purchase">{event.pricePerSeat>0&&<strong>{eventPriceLabel(event)} <small>/ одно место</small></strong>}{canSelectSeats(event)?<><Availability event={event}/><Button asChild variant="warm"><Link href={`/kino/${event.slug}/seats`}>Выбрать места ↗</Link></Button>{!canBook(event)&&<p>Бронирование по телефону: <a href="tel:+79149386660">+7 (914) 938-66-60</a>. Онлайн-оплата скоро появится.</p>}</>:<p>{event.bookingPaused?'Бронирование временно остановлено. Информация у администратора:':'Бронирование у администратора:'} <a href="tel:+79149386660">+7 (914) 938-66-60</a></p>}<Link href={`/kino/${event.slug}/seats`} className="text-sm underline underline-offset-4">Посмотреть схему зала →</Link></div><p className="demo-note">На схеме 10 столов по два места. За столом можно разместиться втроём — согласуйте третье место с администратором по телефону +7 (914) 938-66-60. Доступность онлайн-оплаты указана при выборе мест.</p><p><Link href="/kino/terms">Условия бронирования, оплаты и возврата →</Link></p></div></main>;
}
