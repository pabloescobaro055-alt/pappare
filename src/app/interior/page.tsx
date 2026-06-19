import type { Metadata } from "next";
import Image from "next/image";

import { Breadcrumbs } from "@/components/breadcrumbs";
import { Footer } from "@/components/footer";
import { JsonLd } from "@/components/json-ld";
import { SiteNav } from "@/components/site-nav";
import { pageMetadata, restaurantJsonLd } from "@/lib/seo";

export const metadata: Metadata = pageMetadata("/interior");

const gallery = [
  { src: "/assets/real-interior-hall.jpg", title: "Реальный зал Pappare" },
  { src: "/assets/real-interior-table.jpg", title: "Стол и детали сервировки" },
  { src: "/assets/real-interior-plant.jpg", title: "Зал у окна" },
  { src: "/assets/real-interior-light.jpg", title: "Теплый свет в зале" },
  { src: "/assets/interior-main.png", title: "Вечерний зал Pappare" },
  { src: "/assets/interior-detail.png", title: "Теплая деталь интерьера" },
  { src: "/assets/interior-wall.png", title: "Уютный зал с мягким светом" },
  { src: "/assets/interior-daylight.png", title: "Светлый зал днем" },
];

export default function InteriorPage() {
  return (
    <main className="min-h-screen bg-cream text-ink">
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
          <p className="text-sm font-semibold uppercase tracking-[0.22em] text-clay">
            Интерьер
          </p>
          <h1 className="mt-3 max-w-4xl font-display text-4xl font-semibold leading-tight md:mt-4 md:text-7xl">
            Атмосфера, ради которой хочется остаться
          </h1>
          <p className="mt-4 max-w-2xl text-base leading-7 text-ink/68 md:mt-6 md:text-lg md:leading-8">
            В Pappare легко задержаться: теплый зал для вечерних встреч,
            спокойные столы у окна и мягкий свет для неспешного вечера.
          </p>

          <div className="mt-8 grid auto-rows-[220px] gap-3 sm:auto-rows-[260px] md:mt-12 md:auto-rows-[340px] md:grid-cols-6 md:gap-4">
            {gallery.map((item, index) => (
              <figure
                key={item.src}
                className={`relative overflow-hidden rounded-lg shadow-soft ${
                  index === 0 ? "md:col-span-4 md:row-span-2" : "md:col-span-2"
                } ${index === 4 ? "md:col-span-3" : ""}`}
              >
                <Image
                  src={item.src}
                  alt={item.title}
                  fill
                  sizes="(max-width: 768px) 100vw, 40vw"
                  className="object-cover"
                />
              </figure>
            ))}
          </div>
        </div>
      </section>
      <Footer />
    </main>
  );
}
