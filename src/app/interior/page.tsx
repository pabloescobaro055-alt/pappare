import type { Metadata } from "next";
import Image from "next/image";

import { Breadcrumbs } from "@/components/breadcrumbs";
import { Footer } from "@/components/footer";
import { JsonLd } from "@/components/json-ld";
import { PremiumCarousel } from "@/components/premium-carousel";
import { SiteNav } from "@/components/site-nav";
import { pageMetadata, restaurantJsonLd } from "@/lib/seo";

export const metadata: Metadata = pageMetadata("/interior");

const gallery = [
  { src: "/assets/real-interior-hall.jpg", title: "Реальный зал Pappare" },
  { src: "/assets/real-interior-table.jpg", title: "Стол и детали сервировки" },
  { src: "/assets/real-interior-plant.jpg", title: "Зал у окна" },
  { src: "/assets/real-interior-light.jpg", title: "Теплый свет в зале" },
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

          <PremiumCarousel
            ariaLabel="Галерея интерьера Pappare"
            className="mt-8 md:mt-12"
            slideClassName="w-[82vw] sm:w-[66vw] md:w-[62vw] xl:w-[58vw]"
          >
            {gallery.map((item) => (
              <figure key={item.src} className="group relative aspect-[4/5] overflow-hidden rounded-lg shadow-soft sm:aspect-[5/4] lg:aspect-[16/9]">
                <Image
                  src={item.src}
                  alt={item.title}
                  fill
                  loading="lazy"
                  sizes="(max-width: 640px) 82vw, (max-width: 1024px) 66vw, 58vw"
                  className="object-cover transition duration-700 group-hover:scale-105"
                />
              </figure>
            ))}
          </PremiumCarousel>
        </div>
      </section>
      <Footer />
    </main>
  );
}
