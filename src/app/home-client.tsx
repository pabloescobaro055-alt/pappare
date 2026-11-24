"use client";

import { useMemo } from "react";
import Image from "next/image";
import Link from "next/link";
import { AnimatePresence, MotionConfig, motion } from "framer-motion";
import {
  ArrowUpRight,
  CalendarDays,
  Clock,
  Coffee,
  ExternalLink,
  Film,
  GlassWater,
  MapPin,
  Moon,
  Navigation,
  Phone,
  Pizza,
  Quote,
  Sparkles,
  Star,
  Sun,
  Utensils,
} from "lucide-react";

import { Footer } from "@/components/footer";
import { PremiumCarousel } from "@/components/premium-carousel";
import { ReservationForm } from "@/components/reservation-form";
import { SocialLinks } from "@/components/social-links";
import { useMood, type Mood } from "@/components/theme-provider";
import { Button } from "@/components/ui/button";
import { contactInfo, events } from "@/data/site";


type MoodContent = {
  title: string;
  description: string[];
  cta: string;
  ctaHref: string;
  heroImage: string;
  time: string;
};

const moodContent: Record<Mood, MoodContent> = {
  morning: {
    title: "Завтраки",
    description: ["Панини, каши и яйца.", "Обеденное предложение по будням.", "Детское меню для маленьких гостей."],
    cta: "Посмотреть завтраки",
    ctaHref: "/menu#breakfast",
    heroImage: "/assets/morning/morning-9.jpg",
    time: "с 08:00 до 12:00",
  },
  day: {
    title: "Итальянская кухня",
    description: ["Настоящая паста.", "Пицца из печи.", "Салаты и горячие блюда.", "Детское меню."],
    cta: "Посмотреть меню",
    ctaHref: "/menu#main",
    heroImage: "/assets/pappare-day-v2.png",
    time: "с 12:00 до 18:00",
  },
  night: {
    title: "Вечерний бар",
    description: ["Крафтовое пиво.", "Горячие закуски.", "Музыка."],
    cta: "Посмотреть меню",
    ctaHref: "/menu#evening",
    heroImage: "/assets/pappare-cinema-evening-v2.png",
    time: "с 18:00 до 22:00",
  },
};

const menuCards = [
  { title: "Завтраки", text: "Панини, фокачча, каши, яйца и кофе. С 08:00 до 12:00.", icon: Coffee, href: "/menu#breakfast" },
  { title: "Основное меню", text: "Закуски, салаты, горячее, паста и пицца.", icon: Pizza, href: "/menu#main" },
  { title: "Бар и напитки", text: "Кофе, лимонады, коктейли, чай, пиво и сидр.", icon: GlassWater, href: "/menu#bar" },
  { title: "Вечернее меню", text: "Бургеры, чимичанга, фритюр и пивная карта.", icon: Moon, href: "/menu#evening" },
  { title: "Обеденное предложение", text: "Суп, горячее, салат и чай за 650 ₽. По будням с 12:00 до 16:00.", icon: Utensils, href: "/menu#lunch" },
  { title: "Детское меню", text: "Куриный супчик, бантики, сырники и кальцоне.", icon: Sparkles, href: "/menu#kids" },
];

const morningGallery = [2, 3, 4, 5, 6, 7, 8, 9].map((number) => ({ src: `/assets/morning/morning-${number}.jpg`, label: `Завтраки Pappare · фото ${number - 1}` }));
const newHallGallery = [1, 2, 3, 4, 5].map((number) => ({ src: `/assets/new-hall/hall-${number}.jpg`, label: `Зал Pappare · фото ${number}` }));

const dayGallery = [
  ...newHallGallery,
  { src: "/assets/pappare-day-v2.png", label: "Дневной зал" },
  { src: "/assets/gallery-hall-wide.webp", label: "Общий зал" },
  { src: "/assets/gallery-hall-sun-table.webp", label: "Солнечный стол" },
  { src: "/assets/gallery-hall-window-table.webp", label: "Свет у окна" },
  { src: "/assets/gallery-hall-curtain-table.webp", label: "Тихий уголок" },
];

const nightGallery = [
  ...newHallGallery,
  { src: "/assets/pappare-cinema-evening-v2.png", label: "Киноужин при свечах" },
  { src: "/assets/real-interior-hall.jpg", label: "Теплый свет" },
  { src: "/assets/real-interior-light.jpg", label: "Детали освещения" },
  { src: "/assets/gallery-veranda-table.webp", label: "Вечерняя веранда" },
  { src: "/assets/gallery-veranda-detail.webp", label: "Детали сервировки" },
];

const restaurantReviews = [
  { name: "Ирина С.", text: "Очень уютное место. Брали две пиццы, пасту и тирамису. Все принесли быстро, тесто у пиццы просто великолепное." },
  { name: "Мария К.", text: "Отмечали семейный ужин. Красивый интерьер, приятный свет и очень аккуратная подача блюд." },
  { name: "Екатерина Л.", text: "Редко пишу отзывы, но здесь действительно вкусно. Брускетты, ризотто и десерты понравились всей компании." },
];

const barReviews = [
  { name: "Александр П.", text: "Зашли случайно после прогулки. В итоге просидели почти три часа. Отличная атмосфера и очень внимательный персонал." },
  { name: "Дмитрий В.", text: "Настоящая итальянская пицца с воздушными бортиками. Продукты свежие, готовят сразу после заказа." },
  { name: "Константин Е.", text: "Одно из немногих мест, где хочется попробовать почти все меню. Были несколько раз, разочарований не было." },
];

const fadeUp = {
  hidden: { opacity: 0, y: 28 },
  show: { opacity: 1, y: 0 },
};

const sectionTransition = {
  duration: 0.72,
  ease: [0.22, 1, 0.36, 1],
} as const;

export default function Home() {
  const { mood, setMood } = useMood();
  const active = moodContent[mood];

  return (
    <MotionConfig reducedMotion="user">
    <motion.main
      animate={{ backgroundColor: mood !== "night" ? "#F5EFE7" : "#1C1B17", color: mood !== "night" ? "#2B2B2B" : "#F5EFE7" }}
      transition={sectionTransition}
      className={`pappare-home overflow-hidden ${mood === "night" ? "night-mode-surface" : ""}`}
    >
      <Hero mood={mood} setMood={setMood} active={active} />
      <VisitDetails />
      <MenuPreview mood={mood} />
      <Events mood={mood} />
      <CinemaPreview />
      <MoodGallery mood={mood} />
      <Reviews mood={mood} setMood={setMood} />
      <Reservation mood={mood} />
      <Contacts mood={mood} />
      <Footer />
    </motion.main>
    </MotionConfig>
  );
}

function Hero({ mood, setMood, active }: { mood: Mood; setMood: (mood: Mood) => void; active: MoodContent }) {
  return (
    <section className="pappare-hero border-b border-current/15">
      <header className="border-b border-current/15">
        <nav aria-label="Основная навигация" className="container flex min-h-14 flex-wrap items-center justify-between gap-x-3 text-sm lg:min-h-16">
          <a href="#menu">Меню</a>
          <a href="#events">События</a>
          <Link href="/kino">Киноужин</Link>
          <a href="#gallery" className="hidden sm:inline-flex">Галерея</a>
          <a href="#contacts">Контакты</a>
          <a href="#reservation" className="hidden font-semibold md:inline-flex">Бронь стола</a>
        </nav>
      </header>
      <div className="container grid items-stretch gap-6 pb-8 pt-6 lg:grid-cols-[0.85fr_1.15fr] lg:gap-12 lg:pb-12 lg:pt-10">
        <div className="flex min-w-0 flex-col justify-center lg:py-8">
          <h1 className="font-display text-[clamp(3.25rem,8vw,7rem)] font-semibold leading-[0.85] tracking-[-0.035em]">Pappare</h1>
          <p className="mt-3 text-base font-medium">Итальянская траттория в Иркутске</p>
          <div className="mt-5 lg:mt-8"><DayNightSwitch mood={mood} setMood={setMood} /></div>
          <div aria-live="polite" className="mt-5 min-h-24 lg:mt-7">
            <p className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
              <span className="font-display text-3xl font-semibold leading-none">{active.title}</span>
              <span className="text-sm tabular-nums">{active.time}</span>
            </p>
            <p className="mt-2 max-w-md text-sm leading-relaxed opacity-85 sm:text-base">{active.description.join(" ")}</p>
          </div>
          <div className="mt-2 flex flex-wrap gap-2 lg:mt-5">
            <Button asChild variant="warm"><Link href={active.ctaHref}>{active.cta}<ArrowUpRight size={16} /></Link></Button>
            <Button asChild className="pappare-book"><a href="#reservation">Забронировать стол</a></Button>
          </div>
        </div>
        <div className="relative aspect-[4/3] overflow-hidden rounded-2xl bg-walnut sm:aspect-[16/10] lg:aspect-auto lg:min-h-[min(58vw,560px)]">
          <Image key={active.heroImage} src={active.heroImage} alt={heroImageAlt[mood]} fill
            priority={mood === "day"} loading={mood === "day" ? undefined : "eager"}
            sizes="(max-width: 1023px) 100vw, 55vw" className="pappare-hero-photo object-cover" />
        </div>
      </div>
    </section>
  );
}

const heroImageAlt: Record<Mood, string> = {
  morning: "Завтрак на террасе Pappare",
  day: "Дневной интерьер Pappare",
  night: "Киноужин при свечах в Pappare",
};

function DayNightSwitch({ mood, setMood }: { mood: Mood; setMood: (mood: Mood) => void }) {
  const modes = [
    { id: "morning", label: "Утро", icon: Coffee },
    { id: "day", label: "День", icon: Sun },
    { id: "night", label: "Вечер", icon: Moon },
  ] as const;
  return (
    <div role="group" aria-label="Время дня" className="pappare-moods grid max-w-[26rem] grid-cols-3 gap-1 rounded-full border border-current/20 p-1">
      {modes.map(({ id, label, icon: Icon }) => (
        <button key={id} type="button" onClick={() => setMood(id)} aria-pressed={mood === id}
          className="flex min-h-11 items-center justify-center gap-1.5 rounded-full text-sm font-semibold transition-colors">
          <Icon size={16} aria-hidden="true" />{label}
        </button>
      ))}
    </div>
  );
}

function SectionTitle({ eyebrow, title, text, mood }: { eyebrow: string; title: string; text: string; mood: Mood }) {
  return (
    <motion.div initial="hidden" whileInView="show" viewport={{ once: true, margin: "-80px" }} variants={fadeUp} transition={{ duration: 0.6 }} className="mx-auto mb-10 max-w-3xl text-center md:mb-14">
      <p className={`text-xs font-semibold uppercase tracking-[0.24em] md:text-sm ${mood !== "night" ? "text-clay" : "text-amber"}`}>{eyebrow}</p>
      <h2 className="mt-4 font-display text-4xl font-semibold leading-tight md:text-7xl">{title}</h2>
      <p className={`mt-4 text-base leading-7 md:text-lg md:leading-8 ${mood !== "night" ? "text-ink/68" : "text-cream/82"}`}>{text}</p>
    </motion.div>
  );
}

function VisitDetails() {
  return (
    <section id="characters" aria-label="Как нас найти" className="border-b border-current/15">
      <div className="container flex flex-wrap items-center justify-between gap-x-8 gap-y-2 py-5 text-sm sm:text-base">
        <a className="inline-flex min-h-11 items-center gap-2" href="#contacts"><MapPin size={18} />{contactInfo.address}</a>
        <p className="flex min-h-11 items-center gap-2"><Clock size={18} />{contactInfo.hours}</p>
        <a className="inline-flex min-h-11 items-center gap-2" href={contactInfo.phoneHref}><Phone size={17} />{contactInfo.phone}</a>
      </div>
    </section>
  );
}

function MenuPreview({ mood }: { mood: Mood }) {
  return (
    <section id="menu" className="section-pad">
      <div className="container grid items-start gap-8 lg:grid-cols-[0.85fr_1.15fr] lg:gap-12">
        <div>
          <h2 className="font-display text-5xl font-semibold leading-none md:text-7xl">Меню Pappare</h2>
          <div className="relative mt-6 aspect-[4/3] overflow-hidden rounded-2xl bg-linen">
            <Image src="/assets/menu-20261008/dish-046.jpg" alt="Пицца «Маргарита»" fill
              sizes="(max-width: 1023px) 100vw, 44vw" className="object-cover" />
          </div>
        </div>
        <ul className="divide-y divide-current/15 border-y border-current/15" aria-label="Разделы меню">
          {menuCards.map(({ title, href, text, icon: Icon }) => (
            <li key={href}>
              <Link href={href} className="group grid min-h-20 grid-cols-[auto_1fr_auto] items-center gap-4 py-4">
                <Icon size={21} aria-hidden="true" className={mood === "night" ? "text-amber" : "text-clay"} />
                <span>
                  <span className="block font-display text-2xl font-semibold leading-tight">{title}</span>
                  <span className="mt-1 block text-sm leading-snug opacity-80">{text}</span>
                </span>
                <ArrowUpRight size={18} aria-hidden="true" className="transition-transform motion-safe:group-hover:-translate-y-0.5 motion-safe:group-hover:translate-x-0.5" />
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}

function Events({ mood }: { mood: Mood }) {
  return (
    <section id="events" aria-labelledby="events-title" className={`section-pad scroll-mt-8 ${mood === "night" ? "bg-[#10130f]" : "bg-linen/55"}`}>
      <div className="container">
        <h2 id="events-title" className="font-display text-4xl font-semibold md:text-6xl">События в Pappare</h2>
        <Link href="/kino" className="mt-3 inline-flex min-h-11 items-center gap-2 underline underline-offset-4">Афиша киноужинов <ArrowUpRight size={16} /></Link>
        <div className="mt-7 grid gap-6 md:mt-10">
          {events.map((event) => (
            <details key={event.id} className="overflow-hidden rounded-2xl border border-current/15">
              <summary className="cursor-pointer px-5 py-4 sm:px-8">
                <span className="ml-2 font-semibold">{event.title}</span>
                <span className="ml-3 text-sm opacity-80">31 октября 2026 · Архив</span>
              </summary>
              <article className="bg-[#18211f] text-cream">
              <div className="relative aspect-[1500/662] bg-[#0c1211]">
                <Image src={event.image} alt={event.imageAlt} fill sizes="(max-width: 1280px) 100vw, 1200px" className="object-contain" loading="lazy" />
              </div>
              <div className="grid gap-6 p-6 sm:p-8 lg:grid-cols-[1fr_0.65fr] lg:gap-12 lg:p-10">
                <div>
                  <time dateTime={event.date} className="inline-flex items-center gap-2 text-sm font-semibold text-amber"><CalendarDays size={18} />{event.dateLabel}</time>
                  <h3 className="mt-4 font-display text-4xl font-semibold leading-tight md:text-5xl">{event.title}</h3>
                  <p className="mt-5 leading-7 text-cream/85">{event.description}</p>
                  <p className="mt-4 leading-7 text-cream/85">{event.invitation}</p>
                </div>
                <div className="flex flex-col items-start justify-center rounded-2xl border border-amber/25 bg-cream/5 p-5 sm:p-6">
                  <ul className="flex flex-wrap gap-2" aria-label="Программа события">
                    {event.highlights.map((highlight) => <li key={highlight} className="rounded-full border border-amber/35 px-3 py-2 text-sm text-amber">{highlight}</li>)}
                  </ul>
                  <p className="mt-5 leading-7 text-cream/85">{event.quiz}</p>
                </div>
              </div>
              </article>
            </details>
          ))}
        </div>
      </div>
    </section>
  );
}

function CinemaPreview() {
  return <section className="section-pad bg-[#171c15] text-cream" aria-labelledby="cinema-preview-title"><div className="container">
    <Link href="/kino" className="group grid overflow-hidden rounded-[1.75rem] border border-amber/20 bg-[#22291e] shadow-[0_24px_80px_rgba(0,0,0,.22)] md:grid-cols-[0.85fr_1.15fr]">
      <div className="relative min-h-64 overflow-hidden md:min-h-80"><Image src="/assets/pappare-cinema-evening-v2.png" alt="Вечерняя атмосфера Pappare" fill sizes="(max-width: 768px) 100vw, 45vw" className="object-cover transition duration-700 group-hover:scale-105" /><div className="absolute inset-0 bg-gradient-to-t from-[#171c15]/55 to-transparent md:bg-gradient-to-r" /></div>
      <div className="flex flex-col justify-center p-7 sm:p-10 md:p-12"><p className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.24em] text-amber"><Film size={18} /> Киноужины Pappare</p><h2 id="cinema-preview-title" className="mt-5 font-display text-4xl font-semibold leading-tight sm:text-5xl">Кино, которое можно попробовать</h2><p className="mt-4 max-w-xl leading-7 text-cream/72">История на экране продолжается за вашим столом. Загляните в раздел киноужинов и посмотрите, как устроен вечер.</p><span className="mt-7 inline-flex w-fit items-center gap-2 border-b border-amber pb-1 text-sm font-semibold text-amber">Открыть киноужины <ArrowUpRight size={18} /></span><p className="mt-4 text-xs text-cream/50">Актуальная афиша, цены и схема зала — в разделе киноужинов. Бронирование: +7 (914) 938-66-60.</p></div>
    </Link>
  </div></section>;
}

function MoodGallery({ mood }: { mood: Mood }) {
  const gallery = mood === "morning" ? morningGallery : mood === "day" ? dayGallery : nightGallery;
  return <section id="gallery" className={`section-pad ${mood !== "night" ? "bg-linen/55" : "bg-[#10130f]"}`}>
    <div className="container">
      <SectionTitle eyebrow="Галерея" title={mood === "morning" ? "Утро в Pappare" : mood === "day" ? "Наш зал" : "Теплый зал вечером"} text={mood === "morning" ? "Завтраки, которые хочется рассмотреть поближе." : "Фотографии зала Pappare."} mood={mood} />
      <AnimatePresence mode="wait"><motion.div key={mood} initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -24 }} transition={sectionTransition}>
        <PremiumCarousel ariaLabel={mood === "morning" ? "Фотографии завтраков Pappare" : "Фотографии зала Pappare"} slideClassName="w-[82vw] sm:w-[66vw] md:w-[62vw] xl:w-[58vw]">{gallery.map((item) => <figure key={item.src} className="group relative aspect-[4/5] overflow-hidden rounded-[1.5rem] shadow-soft sm:aspect-[5/4] lg:aspect-[16/9]"><Image src={item.src} alt={item.label} fill loading="lazy" sizes="(max-width: 640px) 82vw, (max-width: 1024px) 66vw, 58vw" className="object-cover transition duration-700 group-hover:scale-105" /><figcaption className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-ink/72 to-transparent p-5 text-sm text-cream">{item.label}</figcaption></figure>)}</PremiumCarousel>
        {mood === "morning" && <div className="mt-8 grid gap-5 md:grid-cols-2">{[1, 2].map((number) => <video key={number} controls playsInline preload="metadata" poster={`/assets/morning/morning-${number === 1 ? 2 : 7}.jpg`} className="aspect-[9/16] max-h-[620px] w-full rounded-[1.5rem] bg-ink object-cover"><source src={`/assets/morning/morning-${number}.mp4`} type="video/mp4" />Ваш браузер не поддерживает видео.</video>)}</div>}
      </motion.div></AnimatePresence>
    </div>
  </section>;
}

function Reviews({ mood, setMood }: { mood: Mood; setMood: (mood: Mood) => void }) {
  const reviews = useMemo(() => (mood !== "night" ? restaurantReviews : barReviews), [mood]);
  return <section id="reviews" className={`section-pad ${mood !== "night" ? "bg-cream" : "bg-[#151814]"}`}><div className="container"><SectionTitle eyebrow="Отзывы" title={mood !== "night" ? "Отзывы о ресторане" : "Отзывы о баре"} text="Фильтр помогает показать разные причины прийти: за итальянской кухней днем или за вечерним настроением." mood={mood} /><div className="mx-auto mb-8 flex w-fit rounded-full border border-current/10 p-1"><button type="button" onClick={() => setMood("day")} className={`rounded-full px-5 py-3 text-sm font-medium transition ${mood !== "night" ? "bg-ink text-cream" : "text-current/62"}`}>О ресторане</button><button type="button" onClick={() => setMood("night")} className={`rounded-full px-5 py-3 text-sm font-medium transition ${mood === "night" ? "bg-amber text-ink" : "text-current/62"}`}>О баре</button></div><AnimatePresence mode="wait"><motion.div key={mood} initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -24 }} transition={sectionTransition}><PremiumCarousel ariaLabel={mood !== "night" ? "Отзывы о ресторане Pappare" : "Отзывы о баре Pappare"} slideClassName="w-[82vw] sm:w-[58vw] md:w-[42vw] lg:w-[30vw]">{reviews.map((review) => <article key={review.name} className={`h-full rounded-[1.5rem] border p-6 shadow-soft md:p-7 ${mood !== "night" ? "border-walnut/10 bg-linen/45" : "border-amber/15 bg-cream/[0.06]"}`}><div className="mb-5 flex items-center justify-between"><Quote className={mood !== "night" ? "text-clay" : "text-amber"} size={26} /><div className="flex gap-1 text-amber" aria-label="5 из 5">{Array.from({ length: 5 }).map((_, index) => <Star key={index} size={16} fill="currentColor" />)}</div></div><p className={`leading-7 ${mood !== "night" ? "text-ink/72" : "text-cream/72"}`}>{review.text}</p><p className="mt-5 font-medium">{review.name}</p></article>)}</PremiumCarousel></motion.div></AnimatePresence><div className="mt-8 flex justify-center"><Button asChild variant={mood !== "night" ? "ghost" : "outline"}><Link href="https://2gis.ru/irkutsk/firm/70000001110409148/tab/reviews" target="_blank">Смотреть отзывы в 2ГИС<ExternalLink size={18} /></Link></Button></div></div></section>;
}

function Reservation({ mood }: { mood: Mood }) {
  return <section id="reservation" className={`section-pad ${mood !== "night" ? "bg-ink text-cream" : "bg-[#0d0f0c] text-cream"}`}><div className="container grid gap-8 lg:grid-cols-[0.85fr_1.15fr] lg:gap-12"><div><p className="text-sm font-semibold uppercase tracking-[0.24em] text-amber">Бронирование</p><h2 className="mt-4 font-display text-4xl font-semibold leading-tight md:text-7xl">Выберите настроение, мы подготовим стол</h2><p className="mt-5 max-w-xl leading-7 text-cream/70 md:text-lg md:leading-8">Оставьте имя, телефон, удобное время и количество гостей. Команда Pappare свяжется, чтобы подтвердить бронь.</p><div className="mt-7"><SocialLinks light /></div></div><ReservationForm dark /></div></section>;
}

function Contacts({ mood }: { mood: Mood }) {
  const contactLinks = [{ title: "2ГИС", href: contactInfo.twoGisUrl }, { title: "Яндекс Карты", href: contactInfo.yandexMapsUrl }];
  return <section id="contacts" className={`section-pad ${mood !== "night" ? "bg-cream" : "bg-[#151814]"}`}><div className="container grid gap-8 lg:grid-cols-[0.8fr_1.2fr] lg:gap-12"><div><p className={`text-sm font-semibold uppercase tracking-[0.24em] ${mood !== "night" ? "text-clay" : "text-amber"}`}>Контакты</p><h2 className="mt-4 font-display text-4xl font-semibold leading-tight md:text-7xl">Pappare ждет вас в Иркутске</h2><div className={`mt-7 grid gap-4 ${mood !== "night" ? "text-ink/72" : "text-cream/72"}`}><p className="flex items-center gap-3"><MapPin className={mood !== "night" ? "text-olive" : "text-amber"} size={20} />{contactInfo.address}</p><p className="flex items-center gap-3"><Phone className={mood !== "night" ? "text-olive" : "text-amber"} size={20} /><Link href={contactInfo.phoneHref}>{contactInfo.phone}</Link></p><p className="flex items-center gap-3"><Clock className={mood !== "night" ? "text-olive" : "text-amber"} size={20} />{contactInfo.hours}</p></div><div className="mt-7 flex flex-wrap gap-3">{contactLinks.map((link) => <Button key={link.title} asChild className={mood !== "night" ? undefined : "bg-amber text-ink hover:bg-cream"}><Link href={link.href} target="_blank">{link.title}<ArrowUpRight size={18} /></Link></Button>)}</div></div><div className="overflow-hidden rounded-[1.5rem] bg-ink shadow-soft"><div className="relative min-h-[300px] md:min-h-[430px]"><iframe title="Карта Pappare Italiano в 2ГИС" src={contactInfo.mapEmbedUrl} className="absolute inset-0 h-full w-full border-0" loading="lazy" /></div><div className="flex flex-col gap-4 bg-ink p-5 text-cream md:flex-row md:items-center md:justify-between"><span className="text-sm text-cream/76">Откройте карту и постройте маршрут до Pappare.</span><Button asChild variant="outline"><Link href={contactInfo.twoGisUrl} target="_blank"><Navigation size={18} />Построить маршрут</Link></Button></div></div></div></section>;
}



