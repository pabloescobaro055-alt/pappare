"use client";

import { useMemo, type ComponentType } from "react";
import Image from "next/image";
import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";
import {
  ArrowUpRight,
  CalendarDays,
  Clock,
  Coffee,
  ExternalLink,
  GlassWater,
  MapPin,
  Moon,
  Music2,
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
import { contactInfo } from "@/data/site";

type IconType = ComponentType<{ size?: number; className?: string }>;

type MoodContent = {
  eyebrow: string;
  headline: string;
  title: string;
  description: string[];
  cta: string;
  ctaHref: string;
  heroImage: string;
  time: string;
  accent: string;
};

const moodContent: Record<Mood, MoodContent> = {
  morning: {
    eyebrow: "Утро в Pappare",
    headline: "Утро. День. Вечер.",
    title: "Хорошего утра",
    description: ["Завтраки с 08:00 до 12:00.", "Панини, каши и яйца.", "Обеденное предложение по будням.", "Детское меню для маленьких гостей."],
    cta: "Посмотреть завтраки",
    ctaHref: "/menu?mode=morning",
    heroImage: "/assets/morning/morning-9.jpg",
    time: "с 08:00 до 12:00",
    accent: "text-amber",
  },
  day: {
    eyebrow: "Дневная траттория",
    headline: "Утро. День. Вечер.",
    title: "Классическая Италия",
    description: ["Настоящая паста.", "Пицца из печи.", "Салаты и горячие блюда.", "Детское меню.", "Итальянское гостеприимство."],
    cta: "Посмотреть меню",
    ctaHref: "/menu?mode=day",
    heroImage: "/assets/pappare-day-mood.webp",
    time: "с 12:00 до 16:00",
    accent: "text-olive",
  },
  night: {
    eyebrow: "Вечерний бар",
    headline: "Утро. День. Вечер.",
    title: "Бар друзей",
    description: ["Крафтовое пиво.", "Горячие закуски.", "Музыка.", "Шутки.", "Хорошая компания.", "До поздней ночи."],
    cta: "Посмотреть меню",
    ctaHref: "/menu?mode=night",
    heroImage: "/assets/pappare-night-mood.webp",
    time: "с 18:00 до 22:00",
    accent: "text-amber",
  },
};

const morningMenu = [
  { title: "Завтраки", text: "Панини, фокачча, каши, яйца и кофе. С 08:00 до 12:00.", icon: Coffee, href: "/menu?mode=morning#breakfast" },
  { title: "Обеденное предложение", text: "Суп, горячее, салат и чай за 650 ₽. По будням с 12:00 до 16:00.", icon: Utensils, href: "/menu?mode=morning#lunch" },
  { title: "Детское меню", text: "Куриный супчик, бантики, сырники и кальцоне.", icon: Sparkles, href: "/menu?mode=morning#kids" },
];

const dayMenu = [
  { title: "Основное меню", text: "Закуски, салаты, горячее, паста, пицца и напитки.", icon: Pizza, href: "/menu?mode=day#main" },
  { title: "Детское меню", text: "Блюда для маленьких гостей.", icon: Sparkles, href: "/menu?mode=day#kids" },
];

const nightMenu = [
  { title: "Вечернее меню", text: "Бургеры, чимичанга, фритюр и пивная карта.", icon: GlassWater, href: "/menu?mode=night#evening" },
];

const morningGallery = [2, 3, 4, 5, 6, 7, 8, 9].map((number) => ({ src: `/assets/morning/morning-${number}.jpg`, label: `Завтраки Pappare · фото ${number - 1}` }));
const newHallGallery = [1, 2, 3, 4, 5].map((number) => ({ src: `/assets/new-hall/hall-${number}.jpg`, label: `Зал Pappare · фото ${number}` }));

const dayGallery = [
  ...newHallGallery,
  { src: "/assets/pappare-day-mood.webp", label: "Дневной зал" },
  { src: "/assets/gallery-hall-wide.webp", label: "Общий зал" },
  { src: "/assets/gallery-hall-sun-table.webp", label: "Солнечный стол" },
  { src: "/assets/gallery-hall-window-table.webp", label: "Свет у окна" },
  { src: "/assets/gallery-hall-curtain-table.webp", label: "Тихий уголок" },
];

const nightGallery = [
  ...newHallGallery,
  { src: "/assets/pappare-night-mood.webp", label: "Вечерний бар" },
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
    <motion.main
      animate={{ backgroundColor: mood !== "night" ? "#F5EFE7" : "#1C1B17", color: mood !== "night" ? "#2B2B2B" : "#F5EFE7" }}
      transition={sectionTransition}
      className={`overflow-hidden ${mood === "night" ? "night-mode-surface" : ""}`}
    >
      <Hero mood={mood} setMood={setMood} active={active} />
      {mood !== "morning" && <Siesta mood={mood} />}
      <Characters mood={mood} />
      <MenuPreview mood={mood} setMood={setMood} />
      <MoodGallery mood={mood} />
      <Reviews mood={mood} setMood={setMood} />
      <Reservation mood={mood} />
      <Contacts mood={mood} />
      <Footer />
    </motion.main>
  );
}

function Hero({ mood, setMood, active }: { mood: Mood; setMood: (mood: Mood) => void; active: MoodContent }) {
  return (
    <section className="relative min-h-[100svh] overflow-hidden text-cream">
      <AnimatePresence mode="wait">
        <motion.div
          key={active.heroImage}
          initial={{ opacity: 0, scale: 1.04 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 1.02 }}
          transition={sectionTransition}
          className="absolute inset-0"
        >
          <Image src={active.heroImage} alt={mood === "morning" ? "Завтрак в Pappare" : mood === "day" ? "Дневной интерьер Pappare" : "Вечерний бар Pappare"} fill priority sizes="100vw" className={`object-cover ${mood === "night" ? "night-hero-image" : ""}`} />
        </motion.div>
      </AnimatePresence>
      <motion.div
        animate={{
          background:
            mood !== "night"
              ? "linear-gradient(90deg, rgba(33,35,25,.42), rgba(33,35,25,.08) 45%, rgba(33,35,25,.34)), linear-gradient(180deg, rgba(33,35,25,.45), rgba(33,35,25,.22) 42%, rgba(33,35,25,.68))"
              : "linear-gradient(90deg, rgba(35,29,20,.36), rgba(35,29,20,.10) 45%, rgba(35,29,20,.42)), linear-gradient(180deg, rgba(35,29,20,.38), rgba(35,29,20,.12) 42%, rgba(35,29,20,.52))",
        }}
        transition={sectionTransition}
        className="absolute inset-0"
      />
      <Header mood={mood} />
      <div className="container relative z-10 flex min-h-[100svh] flex-col justify-center pb-12 pt-24">
        <motion.div initial="hidden" animate="show" transition={{ staggerChildren: 0.12 }} className="mx-auto flex max-w-5xl flex-col items-center text-center">
          <motion.p variants={fadeUp} className="text-xs font-medium uppercase tracking-[0.32em] text-cream/78 md:text-sm">Pappare Italiano</motion.p>
          <motion.div variants={fadeUp} className="mt-6"><LogoMark /></motion.div>
          <AnimatePresence mode="wait">
            <motion.div key={mood} initial={{ opacity: 0, y: 18, filter: "blur(8px)" }} animate={{ opacity: 1, y: 0, filter: "blur(0px)" }} exit={{ opacity: 0, y: -18, filter: "blur(8px)" }} transition={sectionTransition} className="mt-7">
              <p className="text-sm uppercase tracking-[0.34em] text-cream/76 md:text-base">{active.headline}</p>
              <h1 className="mt-5 font-display text-5xl font-semibold leading-[0.95] md:text-8xl">{active.title}</h1>
            </motion.div>
          </AnimatePresence>
          <motion.div variants={fadeUp} className="mt-8"><DayNightSwitch mood={mood} setMood={setMood} /></motion.div>
          <AnimatePresence mode="wait">
            <motion.div key={`${mood}-text`} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} transition={sectionTransition} className="mt-8 flex max-w-4xl justify-center">
              <MoodPanel content={active} active icon={mood === "morning" ? Coffee : mood === "day" ? Sun : Moon} />
            </motion.div>
          </AnimatePresence>
          <motion.div variants={fadeUp} className="mt-9 flex flex-col gap-3 sm:flex-row">
            <Button asChild className="h-[3.25rem] border border-cream/20 bg-cream px-7 text-ink hover:bg-linen"><Link href={active.ctaHref}>{active.cta}</Link></Button>
            <Button asChild variant="outline" className="h-[3.25rem] px-7"><Link href="#reservation"><CalendarDays size={18} />Забронировать стол</Link></Button>
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
}

function Header({ mood }: { mood: Mood }) {
  return (
    <div className="absolute inset-x-0 top-0 z-20">
      <div className="container flex h-[4.5rem] items-center justify-between md:h-24">
        <Link href="/" className="font-display text-2xl font-semibold tracking-wide text-cream">Pappare</Link>
        <nav className="hidden items-center gap-8 text-sm uppercase tracking-[0.18em] text-cream/78 md:flex">
          <a href="#characters">Утро / День / Вечер</a><a href="#menu">Меню</a><a href="#gallery">Галерея</a><a href="#reviews">Отзывы</a><a href="#contacts">Контакты</a>
        </nav>
        <Button asChild variant="outline" className={mood !== "night" ? "hidden border-cream/75 bg-cream/8 md:inline-flex" : "hidden md:inline-flex"}><Link href="#reservation">Забронировать</Link></Button>
      </div>
    </div>
  );
}

function LogoMark() {
  return <div className="relative"><div className="absolute inset-x-6 top-1/2 h-px -translate-y-1/2 bg-cream/24" /><div className="relative px-2 font-display text-[clamp(3.1rem,12vw,12rem)] font-semibold leading-none tracking-[0.025em] text-cream sm:px-6 sm:tracking-[0.06em]">PAPPARE</div></div>;
}

function DayNightSwitch({ mood, setMood }: { mood: Mood; setMood: (mood: Mood) => void }) {
  const modes: { id: Mood; label: string; icon: IconType }[] = [
    { id: "morning", label: "Утро", icon: Coffee },
    { id: "day", label: "День", icon: Sun },
    { id: "night", label: "Вечер", icon: Moon },
  ];
  return (
    <div className="relative rounded-full border border-cream/24 bg-cream/16 p-1.5 shadow-[0_24px_80px_rgba(0,0,0,.24)] backdrop-blur-xl">
      <div className="relative grid w-[min(88vw,450px)] grid-cols-3">
        <motion.div animate={{ x: `${modes.findIndex((mode) => mode.id === mood) * 100}%` }} transition={sectionTransition} className="absolute inset-y-0 left-0 w-1/3 rounded-full bg-cream" />
        {modes.map(({ id, label, icon: Icon }) => <button key={id} type="button" onClick={() => setMood(id)} aria-pressed={mood === id} className={`relative z-10 flex h-14 items-center justify-center gap-1.5 rounded-full text-xs font-medium uppercase tracking-[0.1em] transition-colors sm:gap-2 sm:text-sm ${mood === id ? "text-ink" : "text-cream/78"}`}><Icon size={17} />{label}</button>)}
      </div>
    </div>
  );
}

function MoodPanel({ content, active, icon: Icon }: { content: MoodContent; active: boolean; icon: IconType }) {
  return (
    <motion.div animate={{ opacity: active ? 1 : 0.58, scale: active ? 1 : 0.97 }} transition={sectionTransition} className="mx-auto max-w-sm">
      <div className="mb-4 flex items-center justify-center gap-3 text-cream/82"><Icon className={active ? content.accent : "text-cream/58"} size={23} /><span className="text-sm uppercase tracking-[0.22em]">{content.time}</span></div>
      <div className="flex flex-wrap justify-center gap-x-3 gap-y-1 text-base leading-7 text-cream/84 md:text-lg">{content.description.map((line) => <span key={line}>{line}</span>)}</div>
    </motion.div>
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

function Siesta({ mood }: { mood: Mood }) {
  return (
    <motion.section animate={{ backgroundColor: mood !== "night" ? "#F5EFE7" : "#211F19" }} transition={sectionTransition} className="section-pad">
      <div className="container">
        <motion.div initial={{ opacity: 0, y: 26 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={sectionTransition} className={`mx-auto grid max-w-5xl items-center gap-8 rounded-[2rem] border p-7 shadow-soft md:grid-cols-[0.8fr_1.2fr] md:p-10 ${mood !== "night" ? "border-walnut/10 bg-linen/55" : "border-amber/15 bg-cream/[0.06] text-cream"}`}>
          <SiestaIllustration mood={mood} />
          <div><p className={`text-sm font-semibold uppercase tracking-[0.24em] ${mood !== "night" ? "text-clay" : "text-amber"}`}>Сиеста</p><h2 className="mt-3 font-display text-4xl font-semibold md:text-6xl">16:00 – 18:00</h2><p className={`mt-4 max-w-2xl text-lg leading-8 ${mood !== "night" ? "text-ink/68" : "text-cream/70"}`}>Мы закрываем двери всего на пару часов, чтобы вечером открыть их уже совсем в другом настроении.</p></div>
        </motion.div>
      </div>
    </motion.section>
  );
}

function SiestaIllustration({ mood }: { mood: Mood }) {
  return <div className="relative mx-auto h-44 w-64"><div className={`absolute bottom-8 left-6 right-6 h-px ${mood !== "night" ? "bg-walnut/30" : "bg-amber/30"}`} /><motion.div animate={{ x: mood !== "night" ? 12 : 130, y: mood !== "night" ? 0 : 30, opacity: mood !== "night" ? 1 : 0.35 }} transition={sectionTransition} className="absolute left-5 top-8 flex h-16 w-16 items-center justify-center rounded-full bg-amber text-ink shadow-glow"><Sun size={28} /></motion.div><motion.div animate={{ x: mood !== "night" ? 6 : 120, y: mood !== "night" ? 28 : 6, opacity: mood !== "night" ? 0.32 : 1 }} transition={sectionTransition} className="absolute left-8 top-10 flex h-14 w-14 items-center justify-center rounded-full bg-cream text-ink shadow-glow"><Moon size={24} /></motion.div><div className={`absolute bottom-8 left-24 h-16 w-24 rounded-t-full border ${mood !== "night" ? "border-walnut/30" : "border-amber/30"}`} /><div className={`absolute bottom-5 left-14 h-5 w-36 rounded-full ${mood !== "night" ? "bg-walnut/15" : "bg-amber/15"}`} /></div>;
}

function Characters({ mood }: { mood: Mood }) {
  return (
    <section id="characters" className={`section-pad ${mood !== "night" ? "bg-linen/55" : "bg-[#211F19]"}`}>
      <div className="container"><SectionTitle eyebrow="Три настроения" title="Один ресторан. Весь день." text="Начните день с завтрака, загляните на обед или проведите вечер с друзьями." mood={mood} />
        <div className="grid gap-5 md:grid-cols-3"><CharacterCard mood={mood} title="Утром" icon={Coffee} items={["Завтраки 08:00–12:00", "Панини и фокачча", "Каши и яйца", "Кофе"]} active={mood === "morning"} /><CharacterCard mood={mood} title="Днем" icon={Sun} items={["Основное меню", "Итальянская кухня", "Детское меню"]} active={mood === "day"} /><CharacterCard mood={mood} title="Вечером" icon={Moon} items={["Вечернее меню", "Бургеры и закуски", "Пивная карта"]} active={mood === "night"} /></div>
      </div>
    </section>
  );
}

function CharacterCard({ mood, title, icon: Icon, items, active }: { mood: Mood; title: string; icon: IconType; items: string[]; active: boolean }) {
  return <motion.article initial={{ opacity: 0, y: 26 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} whileHover={{ y: -4 }} animate={{ scale: active ? 1 : 0.985, opacity: active ? 1 : 0.82 }} transition={sectionTransition} className={`rounded-[2rem] border p-7 md:p-9 ${mood !== "night" ? "border-walnut/10 bg-cream shadow-soft" : "border-amber/15 bg-cream/[0.055] shadow-[0_24px_80px_rgba(0,0,0,.24)]"}`}><div className="flex items-center gap-4"><div className={`flex h-14 w-14 items-center justify-center rounded-full ${active ? "bg-amber text-ink" : mood !== "night" ? "bg-linen text-olive" : "bg-cream/10 text-cream/70"}`}><Icon size={26} /></div><h3 className="font-display text-4xl font-semibold">{title}</h3></div><div className="mt-7 grid gap-3">{items.map((item) => <p key={item} className={`border-b pb-3 text-lg ${mood !== "night" ? "border-walnut/10 text-ink/72" : "border-cream/10 text-cream/72"}`}>{item}</p>)}</div></motion.article>;
}

function MenuPreview({ mood, setMood }: { mood: Mood; setMood: (mood: Mood) => void }) {
  const items = mood === "morning" ? morningMenu : mood === "day" ? dayMenu : nightMenu;
  return (
    <section id="menu" className={`section-pad ${mood !== "night" ? "bg-cream" : "bg-[#1C1B17]"}`}><div className="container"><SectionTitle eyebrow="Меню" title="Меню на каждый момент дня" text="Выберите время, чтобы увидеть подходящие блюда и актуальные цены." mood={mood} />
      <div className="mx-auto mb-8 flex w-fit rounded-full border border-current/10 p-1">{([ ["morning", "Утро"], ["day", "День"], ["night", "Вечер"] ] as const).map(([id, label]) => <button key={id} type="button" onClick={() => setMood(id)} aria-pressed={mood === id} className={`rounded-full px-4 py-3 text-sm font-medium transition sm:px-5 ${mood === id ? mood === "night" ? "bg-amber text-ink" : "bg-ink text-cream" : "text-current/62"}`}>{label}</button>)}</div>
      <AnimatePresence mode="wait"><motion.div key={mood} initial={{ opacity: 0, x: mood !== "night" ? -30 : 30 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: mood !== "night" ? 30 : -30 }} transition={sectionTransition} className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">{items.map((item) => <MenuMoodCard key={item.title} mood={mood} item={item} />)}</motion.div></AnimatePresence>
      <div className="mt-8 flex justify-center"><Button asChild className={mood !== "night" ? "bg-clay text-white hover:bg-walnut" : "bg-amber text-ink hover:bg-cream"}><Link href={`/menu?mode=${mood}`}>Посмотреть меню<ArrowUpRight size={18} /></Link></Button></div>
    </div></section>
  );
}

function MenuMoodCard({ mood, item }: { mood: Mood; item: { title: string; text: string; icon: IconType; href: string } }) {
  const Icon = item.icon;
  return <motion.article whileHover={{ y: -5, scale: 1.015 }} className={`rounded-[1.5rem] border p-6 transition ${mood !== "night" ? "border-walnut/10 bg-linen/42 shadow-soft" : "border-amber/15 bg-cream/[0.055] shadow-[0_24px_80px_rgba(0,0,0,.2)]"}`}><Icon className={mood !== "night" ? "text-olive" : "text-amber"} size={28} /><h3 className="mt-5 font-display text-3xl font-semibold">{item.title}</h3><p className={`mt-3 leading-7 ${mood !== "night" ? "text-ink/64" : "text-cream/64"}`}>{item.text}</p><Link href={item.href} className="mt-5 inline-flex items-center gap-1 text-sm font-semibold underline underline-offset-4">Смотреть позиции <ArrowUpRight size={16} /></Link></motion.article>;
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



