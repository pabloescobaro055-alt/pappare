"use client";

import Image from "next/image";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  ArrowUpRight,
  CalendarDays,
  Clock,
  ExternalLink,
  Leaf,
  MapPin,
  Menu as MenuIcon,
  Navigation,
  Phone,
  Quote,
  Star,
} from "lucide-react";

import { Footer } from "@/components/footer";
import { ReservationForm } from "@/components/reservation-form";
import { SocialLinks } from "@/components/social-links";
import { Button } from "@/components/ui/button";
import { menuGroups } from "@/data/menu";
import { reviews } from "@/data/reviews";
import { contactInfo, events, teamMembers } from "@/data/site";

const fadeUp = {
  hidden: { opacity: 0, y: 28 },
  show: { opacity: 1, y: 0 },
};

const gallery = [
  { src: "/assets/real-interior-hall.jpg", label: "Зал Pappare" },
  { src: "/assets/real-interior-table.jpg", label: "Детали стола" },
  { src: "/assets/real-interior-plant.jpg", label: "Зал у окна" },
  { src: "/assets/real-interior-light.jpg", label: "Теплый свет" },
  { src: "/assets/interior-main.png", label: "Вечерний зал" },
  { src: "/assets/interior-detail.png", label: "Теплая деталь" },
  { src: "/assets/interior-wall.png", label: "Уютные столы" },
  { src: "/assets/interior-daylight.png", label: "Светлый зал" },
];

const contactLinks = [
  { title: "2ГИС", href: contactInfo.twoGisUrl },
  { title: "Яндекс Карты", href: contactInfo.yandexMapsUrl },
];

export default function Home() {
  return (
    <main className="overflow-hidden bg-cream text-ink">
      <Hero />
      <About />
      <Menu />
      <Interior />
      <Events />
      <Reservation />
      <Reviews />
      <Team />
      <Contacts />
      <Footer />
    </main>
  );
}

function Hero() {
  return (
    <section className="relative min-h-[72svh] overflow-hidden bg-ink text-cream md:max-lg:min-h-[76svh] lg:min-h-[92vh]">
      <Image
        src="/assets/interior-main.png"
        alt="Интерьер Pappare Italiano с теплым светом, деревом и живыми растениями"
        fill
        priority
        sizes="100vw"
        className="object-cover"
      />
      <div className="absolute inset-0 bg-ink/42" />
      <div className="absolute inset-0 bg-gradient-to-t from-ink/78 via-transparent to-ink/42" />
      <div className="absolute inset-x-0 top-0 z-20">
        <div className="container flex h-16 items-center justify-between md:h-20">
          <Link href="#" className="font-display text-2xl font-semibold tracking-wide">
            Pappare
          </Link>
          <nav className="hidden items-center gap-7 text-sm text-cream/82 md:flex">
            <Link href="#about">О ресторане</Link>
            <Link href="/menu">Меню</Link>
            <Link href="/interior">Интерьер</Link>
            <Link href="/contacts">Контакты</Link>
          </nav>
          <Button asChild variant="outline" className="hidden md:inline-flex">
            <Link href="#reservation">
              <CalendarDays size={18} />
              Забронировать
            </Link>
          </Button>
        </div>
      </div>
      <div className="container relative z-10 flex min-h-[72svh] items-center justify-center pb-8 pt-18 text-center md:max-lg:min-h-[76svh] md:max-lg:pb-10 md:max-lg:pt-24 lg:min-h-[92vh] lg:pb-14 lg:pt-28">
        <motion.div
          initial="hidden"
          animate="show"
          transition={{ staggerChildren: 0.12 }}
          className="mx-auto max-w-3xl"
        >
          <motion.p
            variants={fadeUp}
            className="mb-3 text-xs font-medium uppercase tracking-[0.22em] text-cream/82 md:mb-5 md:text-sm md:tracking-[0.24em]"
          >
            Современная итальянская траттория
          </motion.p>
          <motion.h1
            variants={fadeUp}
            className="font-display text-5xl font-semibold leading-[0.92] md:max-lg:text-7xl lg:text-9xl"
          >
            Pappare Italiano
          </motion.h1>
          <motion.p variants={fadeUp} className="mx-auto mt-4 max-w-2xl text-base leading-7 text-cream/84 md:max-lg:mt-5 md:max-lg:text-lg md:max-lg:leading-7 lg:mt-7 lg:text-xl lg:leading-8">
            Теплый свет, натуральное дерево, живые растения и итальянская
            кухня без лишнего пафоса. Место, где вечер становится мягче.
          </motion.p>
          <motion.div variants={fadeUp} className="mt-6 flex flex-col justify-center gap-3 sm:flex-row md:max-lg:mt-7 lg:mt-10">
            <Button asChild variant="warm">
              <Link href="/menu">
                <MenuIcon size={18} />
                Меню
              </Link>
            </Button>
            <Button asChild variant="outline">
              <Link href="#reservation">
                <CalendarDays size={18} />
                Забронировать стол
              </Link>
            </Button>
          </motion.div>
          <motion.div variants={fadeUp} className="mt-4 flex justify-center md:max-lg:mt-5 lg:mt-8">
            <SocialLinks light />
          </motion.div>
        </motion.div>
      </div>
      <div className="absolute inset-x-0 bottom-0 z-10 h-8 bg-gradient-to-t from-cream to-transparent md:max-lg:h-12 lg:h-24" />
    </section>
  );
}

function SectionTitle({
  eyebrow,
  title,
  text,
}: {
  eyebrow: string;
  title: string;
  text: string;
}) {
  return (
    <motion.div
      initial="hidden"
      whileInView="show"
      viewport={{ once: true, margin: "-80px" }}
      variants={fadeUp}
      transition={{ duration: 0.6 }}
      className="mx-auto mb-8 max-w-3xl text-center md:mb-14"
    >
      <p className="text-xs font-semibold uppercase tracking-[0.2em] text-clay md:text-sm md:tracking-[0.22em]">
        {eyebrow}
      </p>
      <h2 className="mt-3 font-display text-3xl font-semibold leading-tight text-ink md:mt-4 md:text-6xl">
        {title}
      </h2>
      <p className="mt-3 text-base leading-7 text-ink/68 md:mt-5 md:text-lg md:leading-8">{text}</p>
    </motion.div>
  );
}

function About() {
  return (
    <section id="about" className="section-pad bg-cream">
      <div className="container grid items-center gap-7 lg:grid-cols-[0.9fr_1.1fr] lg:gap-12">
        <motion.div
          initial={{ opacity: 0, x: -28 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true }}
          className="relative aspect-[4/3] overflow-hidden rounded-lg shadow-soft md:aspect-[4/5]"
        >
          <Image
            src="/assets/interior-detail.png"
            alt="Теплый интерьер Pappare Italiano"
            fill
            sizes="(max-width: 1024px) 100vw, 42vw"
            className="object-cover"
          />
        </motion.div>
        <motion.div
          initial="hidden"
          whileInView="show"
          viewport={{ once: true }}
          transition={{ staggerChildren: 0.1 }}
        >
          <motion.p variants={fadeUp} className="text-sm font-semibold uppercase tracking-[0.22em] text-clay">
            О ресторане
          </motion.p>
          <motion.h2 variants={fadeUp} className="mt-3 font-display text-4xl font-semibold leading-tight md:mt-4 md:text-7xl">
            Итальянский вечер без лишней спешки
          </motion.h2>
          <motion.p variants={fadeUp} className="mt-4 text-base leading-7 text-ink/70 md:mt-6 md:text-lg md:leading-8">
            Pappare Italiano — это место для теплого ужина, разговора за
            бокалом вина и любимых итальянских вкусов. Здесь легко встретиться
            с друзьями, провести вечер вдвоем или зайти на пасту после долгого
            дня.
          </motion.p>
          <motion.p variants={fadeUp} className="mt-4 text-base leading-7 text-ink/70 md:mt-5 md:text-lg md:leading-8">
            Внутри спокойно, мягко и по-европейски уютно: хочется заказать
            закуски на стол, выбрать пасту или пиццу и остаться на десерт.
          </motion.p>
        </motion.div>
      </div>
    </section>
  );
}

function Menu() {
  return (
    <section id="menu" className="section-pad bg-linen/65">
      <div className="container">
        <SectionTitle
          eyebrow="Меню"
          title="Италия в спокойной современной подаче"
          text="Основные разделы меню собраны прямо на сайте: удобно смотреть с телефона и быстро выбрать блюдо перед визитом."
        />
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {menuGroups.map((group, index) => (
            <motion.article
              key={group.id}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.08 }}
              className="rounded-lg bg-cream p-5 shadow-soft md:p-6"
            >
              <p className="font-display text-3xl font-semibold">{group.title}</p>
              <p className="mt-2 text-sm leading-6 text-ink/62 md:mt-3 md:min-h-14">{group.description}</p>
              <p className="mt-4 text-sm font-medium text-clay md:mt-5">
                {group.sections.reduce((total, section) => total + section.items.length, 0)} позиций
              </p>
            </motion.article>
          ))}
        </div>
        <div className="mt-7 flex justify-center md:mt-10">
          <Button asChild variant="warm">
            <Link href="/menu">
              Смотреть меню
              <ArrowUpRight size={18} />
            </Link>
          </Button>
        </div>
      </div>
    </section>
  );
}

function Interior() {
  return (
    <section id="interior" className="section-pad bg-cream">
      <div className="container">
        <SectionTitle
          eyebrow="Интерьер"
          title="Теплый зал, растения и итальянские детали"
          text="Фотографии зала передают главное: сюда хочется прийти на спокойный итальянский вечер."
        />
        <div className="grid auto-rows-[220px] gap-3 sm:auto-rows-[260px] md:auto-rows-[320px] md:grid-cols-6 md:gap-4">
          {gallery.map((item, index) => (
            <motion.figure
              key={item.src}
              initial={{ opacity: 0, scale: 0.96 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.07 }}
              className={`group relative overflow-hidden rounded-lg shadow-soft ${
                index === 0 ? "md:col-span-4 md:row-span-2" : "md:col-span-2"
              } ${index === 4 ? "md:col-span-3" : ""}`}
            >
              <Image
                src={item.src}
                alt={item.label}
                fill
                sizes="(max-width: 768px) 100vw, 33vw"
                className="object-cover transition duration-700 group-hover:scale-105"
              />
              <figcaption className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-ink/72 to-transparent p-4 text-sm text-cream md:p-5">
                {item.label}
              </figcaption>
            </motion.figure>
          ))}
        </div>
      </div>
    </section>
  );
}

function Events() {
  const event = events[0];

  return (
    <section className="section-pad bg-linen/65">
      <div className="container grid items-center gap-7 lg:grid-cols-[0.95fr_1.05fr] lg:gap-10">
        <div className="relative aspect-[4/3] overflow-hidden rounded-lg shadow-soft">
          <Image
            src={event.image}
            alt={event.title}
            fill
            sizes="(max-width: 1024px) 100vw, 46vw"
            className="object-cover"
          />
        </div>
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.22em] text-clay">
            Афиша
          </p>
          <h2 className="mt-3 font-display text-4xl font-semibold leading-tight md:mt-4 md:text-7xl">
            {event.title}
          </h2>
          <p className="mt-4 text-base leading-7 text-ink/70 md:mt-6 md:text-lg md:leading-8">{event.description}</p>
          <p className="mt-5 w-fit rounded-full bg-cream px-5 py-3 text-sm font-medium text-walnut md:mt-7">
            {event.date}
          </p>
        </div>
      </div>
    </section>
  );
}

function Reservation() {
  return (
    <section id="reservation" className="section-pad bg-ink text-cream">
      <div className="container grid gap-7 lg:grid-cols-[0.85fr_1.15fr] lg:gap-10">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.22em] text-amber">
            Бронирование
          </p>
          <h2 className="mt-3 font-display text-4xl font-semibold leading-tight md:mt-4 md:text-7xl">
            Выберите вечер, мы подготовим стол
          </h2>
          <p className="mt-4 max-w-xl leading-7 text-cream/70 md:mt-6 md:leading-8">
            Оставьте имя, телефон и удобное время. Команда Pappare свяжется,
            чтобы подтвердить бронь и подготовить стол.
          </p>
        </div>
        <ReservationForm dark />
      </div>
    </section>
  );
}

function Reviews() {
  return (
    <section className="section-pad bg-paper">
      <div className="container">
        <SectionTitle
          eyebrow="Отзывы"
          title="Гости отмечают атмосферу"
          text="Короткие впечатления гостей и быстрый переход к карточке ресторана в 2ГИС."
        />
        <div className="grid gap-5 md:grid-cols-3">
          {reviews.map((review, index) => (
            <motion.article
              key={review.name}
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.08 }}
              className="rounded-lg bg-cream p-5 shadow-soft md:p-7"
            >
              <div className="mb-4 flex items-center justify-between md:mb-5">
                <Quote className="text-clay" size={26} />
                <div className="flex gap-1 text-amber" aria-label="5 из 5">
              {Array.from({ length: review.rating }).map((_, starIndex) => (
                    <Star key={starIndex} size={16} fill="currentColor" />
                  ))}
                </div>
              </div>
              <p className="leading-7 text-ink/72">{review.text}</p>
              <p className="mt-4 font-medium text-walnut md:mt-6">{review.name}</p>
            </motion.article>
          ))}
        </div>
        <div className="mt-7 flex justify-center md:mt-9">
          <Button asChild variant="ghost">
            <Link href="https://2gis.ru/irkutsk/firm/70000001110409148/tab/reviews" target="_blank">
              Смотреть отзывы в 2ГИС
              <ExternalLink size={18} />
            </Link>
          </Button>
        </div>
      </div>
    </section>
  );
}

function Team() {
  return (
    <section className="section-pad bg-linen/65">
      <div className="container">
        <SectionTitle
          eyebrow="Команда"
          title="Наша команда"
          text="Скоро здесь появятся фотографии и истории людей, которые встречают гостей, готовят блюда и создают настроение Pappare."
        />
        <div className="grid gap-5 md:grid-cols-3">
          {teamMembers.map((member) => (
            <article key={member.id} className="overflow-hidden rounded-lg bg-cream shadow-soft">
              <div className="relative aspect-[4/3]">
                <Image
                  src={member.photo}
                  alt={member.name}
                  fill
                  sizes="(max-width: 768px) 100vw, 33vw"
                  className="object-cover"
                />
              </div>
              <div className="p-5 md:p-6">
                <h3 className="font-display text-3xl font-semibold">{member.name}</h3>
                <p className="mt-2 text-sm font-medium text-clay">{member.role}</p>
                <p className="mt-3 leading-7 text-ink/64 md:mt-4">{member.description}</p>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}

function Contacts() {
  return (
    <section id="contacts" className="section-pad bg-cream">
      <div className="container grid gap-7 lg:grid-cols-[0.8fr_1.2fr] lg:gap-10">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.22em] text-clay">
            Контакты
          </p>
          <h2 className="mt-3 font-display text-4xl font-semibold leading-tight md:mt-4 md:text-7xl">
            Pappare ждет вас в Иркутске
          </h2>
          <div className="mt-6 grid gap-3 text-ink/72 md:mt-8 md:gap-4">
            <p className="flex items-center gap-3">
              <MapPin className="text-olive" size={20} />
              {contactInfo.address}
            </p>
            <p className="flex items-center gap-3">
              <Phone className="text-olive" size={20} />
              <Link href={contactInfo.phoneHref}>{contactInfo.phone}</Link>
            </p>
            <p className="flex items-center gap-3">
              <Clock className="text-olive" size={20} />
              {contactInfo.hours}
            </p>
          </div>
          <div className="mt-5 md:mt-7">
            <SocialLinks />
          </div>
          <div className="mt-6 flex flex-wrap gap-3 md:mt-8">
            {contactLinks.map((link) => (
              <Button key={link.title} asChild variant={link.title === "2ГИС" ? "warm" : "default"}>
                <Link href={link.href} target="_blank">
                  {link.title}
                  <ArrowUpRight size={18} />
                </Link>
              </Button>
            ))}
          </div>
        </div>
        <div className="overflow-hidden rounded-lg bg-ink shadow-soft">
          <div className="relative min-h-[280px] md:min-h-[430px]">
            <iframe
              title="Карта Pappare Italiano"
              src="https://yandex.ru/map-widget/v1/?ll=104.283373%2C52.285743&mode=search&oid=188785765668&ol=biz&z=17.42"
              className="absolute inset-0 h-full w-full border-0"
              loading="lazy"
            />
          </div>
          <div className="flex flex-col gap-4 bg-ink p-5 text-cream md:flex-row md:items-center md:justify-between">
            <div className="flex items-center gap-3">
              <Leaf className="text-amber" size={22} />
              <span className="text-sm text-cream/76">Откройте карту и постройте маршрут до Pappare.</span>
            </div>
            <Button asChild variant="outline">
              <Link href={contactInfo.twoGisUrl} target="_blank">
                <Navigation size={18} />
                Построить маршрут
              </Link>
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
}
