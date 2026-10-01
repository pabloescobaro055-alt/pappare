import Link from 'next/link';
import {ArrowUpRight,Utensils,Film,Wine} from 'lucide-react';
import {movieEvents,cinemaCopy,isPast,canBook,dateLabel,money} from '@/data/cinema';
import {EventCard} from '@/components/cinema/event-card';
import {Button} from '@/components/ui/button';
export const dynamic='force-dynamic';
export default function CinemaLanding() {
  const active=movieEvents.filter(e=>!isPast(e)&&e.status!=='upcoming');
  const upcoming=movieEvents.filter(e=>!isPast(e)&&e.status==='upcoming');
  const examples=movieEvents.filter(e=>e.demo&&isPast(e));
  const hero=active[0]||upcoming[0]||examples[0];
  return <main>
    <section className="cinema-hero" style={{backgroundImage:`url('${hero?.heroImage||'/assets/pappare-night-mood.webp'}')`}}>
      <div className="hero-shade"/><div className="hero-content"><div className="eyebrow">PAPPARE PRESENTS <span/> КИНО & ВКУС</div>
      <p className="hero-kicker">Киноужин в PAPPARE</p><h1>Любимое кино.<br/><em>На вкус.</em></h1>
      <p className="hero-description">Когда история на экране<br/>продолжается за вашим столом.</p>
      {hero&&<div className="hero-event"><div><span className="eyebrow">{isPast(hero)?'ПРИМЕР КИНОУЖИНА · DEMO':'БЛИЖАЙШИЙ ВЕЧЕР · DEMO'}</span><h2>{hero.title}</h2><p>{dateLabel(hero)} · {hero.time} <span className="hero-dot">/</span> {money(hero.pricePerSeat)} за гостя</p></div><Button asChild variant="warm"><Link href={`/kino/${hero.slug}${canBook(hero)?'/seats':''}`}>{canBook(hero)?'Выбрать места':'О вечере'}<ArrowUpRight size={18}/></Link></Button></div>}
      </div><div className="hero-bottom"><span>ИРКУТСК · ПЕРЕУЛОК БОГДАНОВА, 4</span><a href="#about">Откройте новый вечер ↓</a></div>
    </section>
    <section className="cinema-intro cinema-container" id="about"><div><span className="eyebrow">НЕ ПРОСТО СМОТРЕТЬ</span><h2>Почувствовать<br/><em>каждую сцену.</em></h2></div><div><p>{cinemaCopy.intro}</p><div className="experience"><span><Film size={20}/>Любимое кино</span><span><Utensils size={20}/>Авторские подачи</span><span><Wine size={20}/>Тёплая компания</span></div></div></section>
    <section className="cinema-container evenings" id="evenings"><div className="section-heading"><div><span className="eyebrow">У КАЖДОГО ВЕЧЕРА — СВОЯ ИСТОРИЯ</span><h2>Ближайшие киноужины</h2></div><span className="muted">13 столов. 26 гостей.<br/>Один особенный вечер.</span></div>
      <div className="event-grid">{active.map(e=><EventCard key={e.id} event={e}/>)}{!active.length&&<p>Новые вечера скоро появятся здесь.</p>}</div>
      {upcoming.length>0&&<><h2 className="soon-title">Скоро за нашим столом</h2><div className="event-grid">{upcoming.map(e=><EventCard key={e.id} event={e}/>)}</div></>}
      {examples.length>0&&<><h2 className="soon-title">Примеры киноужинов</h2><div className="event-grid">{examples.map(e=><EventCard key={e.id} event={e}/>)}</div></>}
    </section><aside className="demo-note cinema-container">Демонстрационная версия. Даты, фильмы и меню — DEMO DATA. На фотографиях — ресторан; изображения фильмов добавим к анонсу. Реальные продажи не открыты.</aside>
  </main>;
}
