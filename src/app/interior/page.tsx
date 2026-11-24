import type { Metadata } from "next";
import Image from "next/image";

import { Breadcrumbs } from "@/components/breadcrumbs";
import { Footer } from "@/components/footer";
import { JsonLd } from "@/components/json-ld";
import Link from "next/link";
import { SiteNav } from "@/components/site-nav";
import { pageMetadata, restaurantJsonLd } from "@/lib/seo";

export const metadata: Metadata = pageMetadata("/interior");

const gallery = [
  { src: "/assets/new-hall/hall-1.jpg", title: "Зал Pappare: общий вид" },
  { src: "/assets/new-hall/hall-2.jpg", title: "Зал Pappare: столы и растения" },
  { src: "/assets/new-hall/hall-3.jpg", title: "Зал Pappare у окна" },
  { src: "/assets/new-hall/hall-4.jpg", title: "Уютная часть зала Pappare" },
  { src: "/assets/new-hall/hall-5.jpg", title: "Столы у окна Pappare" },
  { src: "/assets/gallery-hall-wide.webp", title: "Общий зал Pappare" },
  { src: "/assets/gallery-hall-sun-table.webp", title: "Солнечный стол у окна" },
  { src: "/assets/gallery-hall-window-table.webp", title: "Теплый свет зала" },
  { src: "/assets/gallery-hall-curtain-table.webp", title: "Уютный уголок зала" },
  { src: "/assets/gallery-veranda-detail.webp", title: "Детали летней веранды" },
  { src: "/assets/gallery-veranda-table.webp", title: "Летняя веранда" },
  { src: "/assets/real-interior-hall.jpg", title: "Реальный зал Pappare" },
  { src: "/assets/real-interior-table.jpg", title: "Стол и детали сервировки" },
  { src: "/assets/real-interior-plant.jpg", title: "Зал у окна" },
  { src: "/assets/real-interior-light.jpg", title: "Теплый свет в зале" },
];

export default function InteriorPage() {
  return (
    <main className="theme-page min-h-screen bg-cream text-ink">
      <SiteNav />
      <Breadcrumbs
        items={[
          { name: "Главная", href: "/" },
          { name: "Интерьер", href: "/interior" },
        ]}
      />
      <JsonLd data={restaurantJsonLd()} />

      <section className="section-pad pt-8 md:pt-12">
        <div className="container">
          <h1 className="mt-3 max-w-4xl font-display text-4xl font-semibold leading-tight md:mt-4 md:text-7xl">
            Интерьер Pappare
          </h1>
          <p className="mt-4 max-w-2xl text-base leading-7 text-ink/68 md:mt-6 md:text-lg md:leading-8">
            В Pappare легко задержаться: теплый зал для вечерних встреч,
            спокойные столы у окна и мягкий свет для неспешного вечера.
          </p>

          <div className="mt-7 flex flex-wrap gap-5 text-sm font-semibold">
            <Link className="underline underline-offset-4" href="/contacts#reservation">Забронировать стол</Link>
            <Link className="underline underline-offset-4" href="/contacts">Адрес и маршрут</Link>
          </div>
          <div className="pappare-interior-grid mt-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {gallery.map((item, index) => (
              <figure key={item.src} className="relative aspect-[4/3] overflow-hidden rounded-2xl bg-linen">
                <Image src={item.src} alt={item.title} fill priority={index === 0}
                  sizes={index === 0 ? "100vw" : "(max-width: 639px) 100vw, (max-width: 1023px) 50vw, 33vw"}
                  className="object-cover" />
              </figure>
            ))}
          </div>
        </div>
      </section>
      <Footer />
    </main>
  );
}
