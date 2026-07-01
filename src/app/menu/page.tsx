import type { Metadata } from "next";
import fs from "node:fs";
import path from "node:path";

import { Breadcrumbs } from "@/components/breadcrumbs";
import { Footer } from "@/components/footer";
import { JsonLd } from "@/components/json-ld";
import { MenuItemCard } from "@/components/menu-item-card";
import { SiteNav } from "@/components/site-nav";
import { menuGroups } from "@/data/menu";
import { pageMetadata, restaurantJsonLd, siteUrl } from "@/lib/seo";

export const metadata: Metadata = pageMetadata("/menu");

const dishImagesDirectory = path.join(process.cwd(), "public", "assets", "dishes");
const supportedImageExtensions = new Set([".jpg", ".jpeg", ".png", ".webp", ".avif"]);
const stopWords = new Set(["с", "со", "из", "и", "в", "на", "по"]);
const excludedDishImageKeys = new Set(
  [
    ["main", "Салаты", "Цезарь с креветкой"],
    ["main", "Салаты", "Цезарь с семгой"],
    ["main", "Паста", "С томлеными щеками"],
    ["main", "Паста", "С томлеными щечками"],
    ["main", "Паста", "Болоньезе"],
    ["main", "Паста", "Путанеска"],
    ["main", "Пицца", "С курицей и грибами"],
    ["lunch", "Салаты", "Салат с курицей и грибами"],
    ["lunch", "Салаты", "Свекла с сыром фета"],
    ["lunch", "Салаты", "Оливье с говядиной"],
    ["lunch", "Горячее", "Паста с красной рыбой"],
  ].map(([groupId, sectionTitle, itemName]) => dishImageExclusionKey(groupId, sectionTitle, itemName)),
);

type DishImage = {
  fileName: string;
  name: string;
  normalizedName: string;
  tokens: string[];
  src: string;
};

function normalizeText(value: string) {
  return value
    .toLocaleLowerCase("ru-RU")
    .replace(/ё/g, "е")
    .replace(/([а-я])\1+/g, "$1")
    .replace(/[^a-zа-я0-9]+/gi, " ")
    .trim()
    .replace(/\s+/g, " ");
}

function dishImageExclusionKey(groupId: string, sectionTitle: string, itemName: string) {
  return [groupId, sectionTitle, itemName].map(normalizeText).join("|");
}

function stemToken(token: string) {
  return token.replace(/(ями|ами|ого|его|ыми|ими|ой|ый|ий|ая|ое|ые|ую|ью|ия|ей|ам|ям|ом|ем|ах|ях|ов|ев|а|я|ы|и|е|у|ю|ь)$/i, "");
}

function getTokens(value: string) {
  return normalizeText(value)
    .split(" ")
    .filter((token) => token && !stopWords.has(token))
    .map(stemToken)
    .filter(Boolean);
}

function isTokenMatch(left: string, right: string) {
  return left === right || (Math.min(left.length, right.length) >= 4 && (left.startsWith(right) || right.startsWith(left)));
}

function buildDishImageIndex() {
  if (!fs.existsSync(dishImagesDirectory)) {
    return [];
  }

  return fs
    .readdirSync(dishImagesDirectory)
    .filter((fileName) => supportedImageExtensions.has(path.extname(fileName).toLocaleLowerCase("ru-RU")))
    .map((fileName) => {
      const name = path.parse(fileName).name;

      return {
        fileName,
        name,
        normalizedName: normalizeText(name),
        tokens: getTokens(name),
        src: `/assets/dishes/${encodeURIComponent(fileName)}`,
      };
    });
}

function scoreTokens(candidateTokens: string[], imageTokens: string[]) {
  if (!candidateTokens.length || !imageTokens.length) {
    return 0;
  }

  let matches = 0;
  for (const imageToken of imageTokens) {
    if (candidateTokens.some((candidateToken) => isTokenMatch(candidateToken, imageToken))) {
      matches += 1;
    }
  }

  return matches / imageTokens.length;
}

function findDishImage(groupId: string, sectionTitle: string, itemName: string, images: DishImage[]) {
  if (excludedDishImageKeys.has(dishImageExclusionKey(groupId, sectionTitle, itemName))) {
    return undefined;
  }

  const candidates = [`${sectionTitle} ${itemName}`, itemName];
  const exactMap = new Map(images.map((image) => [image.normalizedName, image]));

  for (const candidate of candidates) {
    const exactMatch = exactMap.get(normalizeText(candidate));
    if (exactMatch) {
      return exactMatch.src;
    }
  }

  let bestMatch: DishImage | undefined;
  let bestScore = 0;

  for (const candidate of candidates) {
    const candidateTokens = getTokens(candidate);

    for (const image of images) {
      const firstTokenMatches = Boolean(candidateTokens[0] && image.tokens[0] && isTokenMatch(candidateTokens[0], image.tokens[0]));
      const score = scoreTokens(candidateTokens, image.tokens);

      if (firstTokenMatches && score >= 0.5 && score > bestScore) {
        bestMatch = image;
        bestScore = score;
      }
    }
  }

  return bestMatch?.src;
}

export default function MenuPage() {
  const dishImages = buildDishImageIndex();
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
    <main className="min-h-screen bg-cream text-ink">
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
            Итальянская кухня для неспешного вечера
          </h1>
          <p className="mt-4 max-w-2xl text-base leading-7 text-ink/68 md:mt-6 md:text-lg md:leading-8">
            Закуски к вину, салаты, паста, пицца, горячие блюда, десерты и
            барная карта. Все позиции удобно смотреть прямо на сайте.
          </p>

          <nav className="mt-6 flex gap-2 overflow-x-auto pb-2 md:mt-10" aria-label="Разделы меню">
            {menuGroups.map((group) => (
              <a
                key={group.id}
                href={`#${group.id}`}
                className="whitespace-nowrap rounded-full border border-walnut/20 bg-linen/60 px-4 py-2.5 text-sm font-medium text-ink/72 transition hover:border-clay hover:text-clay md:px-5 md:py-3"
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
                            imageSrc={findDishImage(group.id, section.title, item.name, dishImages)}
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
