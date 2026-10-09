import type { Metadata } from "next";
import { Suspense } from "react";

import { Breadcrumbs } from "@/components/breadcrumbs";
import { Footer } from "@/components/footer";
import { JsonLd } from "@/components/json-ld";
import { MenuItemCard } from "@/components/menu-item-card";
import { MenuThemeSync } from "@/components/menu-theme-sync";
import { SiteNav } from "@/components/site-nav";
import { currentMenuGroups } from "@/data/current-menu";
import { getMenuPhotos } from "@/data/menu-photos";
import { pageMetadata, restaurantJsonLd, siteUrl } from "@/lib/seo";

export const metadata: Metadata = pageMetadata("/menu");

export default function MenuPage() {
  const menuGroups = currentMenuGroups;

  const menuJsonLd = {
    "@context": "https://schema.org",
    "@type": "Menu",
    "@id": `${siteUrl}/menu#menu`,
    name: "Меню Pappare Italiano",
    url: `${siteUrl}/menu`,
    provider: {
      "@id": `${siteUrl}/#restaurant`,
    },
    hasMenuSection: menuGroups.flatMap((group) => group.sections).map((section) => ({
      "@type": "MenuSection",
      name: section.title,
      description: section.intro,
      hasMenuItem: section.items.map((item) => ({
        "@type": "MenuItem",
        name: item.name,
        description: item.description,
        offers: {
          "@type": "Offer",
          price: item.price.replace(/[^\d]/g, ""),
          priceCurrency: "RUB",
        },
      })),
    })),
  };

  return (
    <main className="theme-page menu-page min-h-screen bg-cream text-ink">
      <Suspense fallback={null}>
        <MenuThemeSync />
      </Suspense>
      <SiteNav />
      <Breadcrumbs
        items={[
          { name: "Главная", href: "/" },
          { name: "Меню", href: "/menu" },
        ]}
      />
      <JsonLd data={restaurantJsonLd()} />
      <JsonLd data={menuJsonLd} />

      <section className="section-pad pt-8 md:pt-12">
        <div className="container">
          <p className="text-sm font-semibold uppercase tracking-[0.22em] text-clay">
            Меню
          </p>
          <h1 className="mt-3 max-w-4xl font-display text-4xl font-semibold leading-tight md:mt-4 md:text-7xl">
            Всё меню Pappare
          </h1>
          <p className="mt-4 max-w-2xl text-base leading-7 text-ink/68 md:mt-6 md:text-lg md:leading-8">
            Завтраки, основное меню, бар, вечернее и обеденное предложения и блюда для детей. Все разделы доступны в любое время просмотра сайта.
          </p>

          <nav className="mt-6 grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-6 md:mt-10" aria-label="Разделы меню">
            {menuGroups.map((group) => (
              <a
                key={group.id}
                href={`#${group.id}`}
                className="flex min-h-12 items-center justify-center rounded-full border border-walnut/20 bg-linen/60 px-3 py-2.5 text-center text-sm font-medium leading-tight text-ink/72 transition hover:border-clay hover:text-clay md:px-4 md:py-3"
              >
                {group.title}
              </a>
            ))}
          </nav>

          <div className="mt-8 grid gap-8 md:mt-12 md:gap-12">
            {menuGroups.map((group) => (
              <section
                key={group.id}
                id={group.id}
                className="scroll-mt-24"
              >
                <div className="mb-5 flex flex-col justify-between gap-3 border-b border-walnut/15 pb-5 md:mb-6 md:gap-4 md:pb-6 md:flex-row md:items-end">
                  <div>
                    <h2 className="font-display text-4xl font-semibold md:text-5xl">
                      {group.title}
                    </h2>
                    <p className="mt-2 max-w-2xl leading-7 text-ink/62 md:mt-3">
                      {group.description}
                    </p>
                  </div>
                  <p className="text-sm font-medium text-clay">
                    {group.sections.reduce((total, section) => total + section.items.length, 0)} позиций
                  </p>
                </div>

                <div className="grid gap-4 md:gap-6">
                  {group.sections.map((section) => (
                    <div key={section.id} className="rounded-lg bg-linen/50 p-4 shadow-soft md:p-8">
                      <div className="mb-4 md:mb-6">
                        <h3 className="font-display text-3xl font-semibold">{section.title}</h3>
                        <p className="mt-2 text-sm leading-6 text-ink/62 md:text-base md:leading-7">{section.intro}</p>
                      </div>
                      <div className="grid gap-4 md:grid-cols-2">
                        {section.items.map((item) => (
                          <MenuItemCard
                            key={`${section.id}-${item.name}`}
                            item={item}
                            photos={getMenuPhotos(group.id, section.id, item.name)}
                          />
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            ))}
          </div>
        </div>
      </section>
      <Footer />
    </main>
  );
}
