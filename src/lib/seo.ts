import type { Metadata } from "next";

export const siteUrl = "https://pappare.ru";

export const restaurant = {
  name: "Pappare Italiano",
  description:
    "Pappare Italiano - современная итальянская траттория в Иркутске на переулке Богданова, 4 с итальянской кухней, уютной атмосферой и вечерним бронированием.",
  streetAddress: "Переулок Богданова, 4",
  city: "Иркутск",
  region: "Иркутская область",
  country: "RU",
  phone: "+7 914 938-66-60",
  cuisine: ["Italian", "European"],
  priceRange: "$$",
  twoGisUrl: "https://2gis.ru/irkutsk/firm/70000001110409148",
  yandexMapsUrl:
    "https://yandex.ru/maps/org/pappare/188785765668/?indoorLevel=1&ll=104.283373%2C52.285743&z=17.42",
  reviewsUrl: "https://2gis.ru/irkutsk/firm/70000001110409148/tab/reviews",
  image: `${siteUrl}/assets/interior-main.png`,
};

export const pages = [
  {
    path: "/",
    title: "Pappare Italiano | Итальянская траттория в Иркутске",
    description:
      "Pappare Italiano - уютная современная траттория в Иркутске: итальянская кухня, теплый интерьер, натуральное дерево, растения и вечерняя атмосфера.",
  },
  {
    path: "/menu",
    title: "Меню Pappare Italiano | Итальянская кухня и бар",
    description:
      "Меню Pappare Italiano: паста, антипасти, горячие блюда, десерты, вина, коктейли и напитки для неспешного итальянского вечера.",
  },
  {
    path: "/interior",
    title: "Интерьер Pappare Italiano | Теплый свет, дерево и растения",
    description:
      "Интерьер Pappare Italiano: светлые стены, натуральное дерево, графитовые детали, терракотовые кашпо, живые растения и янтарное освещение.",
  },
  {
    path: "/contacts",
    title: "Контакты Pappare Italiano | Карта, маршрут и бронирование",
    description:
      "Контакты Pappare Italiano в Иркутске: карта, маршрут через 2ГИС и Яндекс Карты, бронирование стола и отзывы гостей.",
  },
] as const;

export function pageMetadata(path: (typeof pages)[number]["path"]): Metadata {
  const page = pages.find((item) => item.path === path) ?? pages[0];
  const canonical = `${siteUrl}${page.path}`;

  return {
    title: page.title,
    description: page.description,
    applicationName: restaurant.name,
    authors: [{ name: restaurant.name }],
    creator: restaurant.name,
    publisher: restaurant.name,
    alternates: {
      canonical,
      languages: {
        ru: canonical,
        "x-default": canonical,
      },
    },
    keywords: [
      "Pappare Italiano",
      "Паппаре Иркутск",
      "итальянский ресторан Иркутск",
      "итальянская кухня Иркутск",
      "траттория Иркутск",
      "ресторан Иркутск",
      "уютный ресторан Иркутск",
      "паста Иркутск",
      "бар Иркутск",
      "забронировать ресторан Иркутск",
    ],
    robots: {
      index: true,
      follow: true,
      googleBot: {
        index: true,
        follow: true,
        "max-image-preview": "large",
        "max-snippet": -1,
        "max-video-preview": -1,
      },
    },
    openGraph: {
      title: page.title,
      description: page.description,
      url: canonical,
      siteName: restaurant.name,
      images: [
        {
          url: restaurant.image,
          width: 1200,
          height: 630,
          alt: "Интерьер Pappare Italiano",
        },
      ],
      locale: "ru_RU",
      type: "website",
    },
    twitter: {
      card: "summary_large_image",
      title: page.title,
      description: page.description,
      images: [restaurant.image],
    },
  };
}

export function restaurantJsonLd() {
  return {
    "@context": "https://schema.org",
    "@type": ["Restaurant", "LocalBusiness"],
    "@id": `${siteUrl}/#restaurant`,
    name: restaurant.name,
    description: restaurant.description,
    url: siteUrl,
    image: [restaurant.image],
    servesCuisine: restaurant.cuisine,
    priceRange: restaurant.priceRange,
    address: {
      "@type": "PostalAddress",
      streetAddress: restaurant.streetAddress,
      addressLocality: restaurant.city,
      addressRegion: restaurant.region,
      addressCountry: restaurant.country,
    },
    telephone: restaurant.phone,
    openingHoursSpecification: [
      {
        "@type": "OpeningHoursSpecification",
        dayOfWeek: [
          "Monday",
          "Tuesday",
          "Wednesday",
          "Thursday",
          "Friday",
          "Saturday",
          "Sunday",
        ],
        opens: "08:00",
        closes: "16:00",
      },
      {
        "@type": "OpeningHoursSpecification",
        dayOfWeek: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"],
        opens: "18:00",
        closes: "22:00",
      },
    ],
    areaServed: {
      "@type": "City",
      name: restaurant.city,
    },
    hasMenu: `${siteUrl}/menu`,
    sameAs: [restaurant.twoGisUrl, restaurant.yandexMapsUrl],
    potentialAction: [
      {
        "@type": "ReserveAction",
        target: `${siteUrl}/contacts#reservation`,
        name: "Забронировать стол",
      },
      {
        "@type": "ViewAction",
        target: restaurant.twoGisUrl,
        name: "Построить маршрут в 2ГИС",
      },
      {
        "@type": "ViewAction",
        target: restaurant.yandexMapsUrl,
        name: "Открыть Pappare в Яндекс Картах",
      },
    ],
  };
}

export function websiteJsonLd() {
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    "@id": `${siteUrl}/#website`,
    url: siteUrl,
    name: restaurant.name,
    inLanguage: "ru-RU",
    publisher: {
      "@id": `${siteUrl}/#restaurant`,
    },
  };
}

export function breadcrumbJsonLd(items: Array<{ name: string; href: string }>) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: item.name,
      item: `${siteUrl}${item.href}`,
    })),
  };
}
