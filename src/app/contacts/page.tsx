import type { Metadata } from "next";
import Link from "next/link";
import { ArrowUpRight, Clock, Leaf, MapPin, Navigation, Phone } from "lucide-react";

import { Breadcrumbs } from "@/components/breadcrumbs";
import { Footer } from "@/components/footer";
import { JsonLd } from "@/components/json-ld";
import { ReservationForm } from "@/components/reservation-form";
import { SiteNav } from "@/components/site-nav";
import { SocialLinks } from "@/components/social-links";
import { Button } from "@/components/ui/button";
import { contactInfo } from "@/data/site";
import { pageMetadata, restaurant, restaurantJsonLd } from "@/lib/seo";

export const metadata: Metadata = pageMetadata("/contacts");

const mapLinks = [
  { title: "2ГИС", href: restaurant.twoGisUrl },
  { title: "Яндекс Карты", href: restaurant.yandexMapsUrl },
];

export default function ContactsPage() {
  return (
    <main className="min-h-screen bg-cream text-ink">
      <SiteNav />
      <Breadcrumbs
        items={[
          { name: "Главная", href: "/" },
          { name: "Контакты", href: "/contacts" },
        ]}
      />
      <JsonLd data={restaurantJsonLd()} />

      <section className="section-pad pt-8 md:pt-12">
        <div className="container grid gap-7 lg:grid-cols-[0.82fr_1.18fr] lg:gap-10">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.22em] text-clay">
              Контакты
            </p>
            <h1 className="mt-3 font-display text-4xl font-semibold leading-tight md:mt-4 md:text-7xl">
              Карта, маршрут и бронирование Pappare
            </h1>
            <p className="mt-4 max-w-xl text-base leading-7 text-ink/68 md:mt-6 md:text-lg md:leading-8">
              Постройте маршрут до Pappare Italiano через удобный сервис или
              оставьте заявку на стол для ближайшего вечера.
            </p>

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
              {mapLinks.map((link) => (
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
                <Link href={restaurant.twoGisUrl} target="_blank">
                  <Navigation size={18} />
                  Построить маршрут
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      <section id="reservation" className="section-pad bg-ink text-cream">
        <div className="container max-w-3xl">
          <p className="text-sm font-semibold uppercase tracking-[0.22em] text-amber">
            Бронирование
          </p>
          <h2 className="mt-3 font-display text-4xl font-semibold leading-tight md:mt-4 md:text-5xl">
            Забронировать стол
          </h2>
          <div className="mt-6 md:mt-8">
            <ReservationForm dark />
          </div>
        </div>
      </section>
      <Footer />
    </main>
  );
}
