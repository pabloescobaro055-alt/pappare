export const contactInfo = {
  address: "Переулок Богданова, 4, Иркутск",
  addressStreet: "Переулок Богданова, 4",
  city: "Иркутск",
  hours: "Ежедневно 08:00–22:00",
  phone: "+7 (914) 938-66-60",
  phoneHref: "tel:+79149386660",
  twoGisUrl: "https://2gis.ru/irkutsk/firm/70000001110409148",
  yandexMapsUrl:
    "https://yandex.ru/maps/org/pappare/188785765668/?indoorLevel=1&ll=104.283373%2C52.285743&z=17.42",
  mapEmbedUrl:
    "https://widgets.2gis.com/widget?type=firmsonmap&options=%7B%22pos%22%3A%7B%22lat%22%3A52.285743%2C%22lon%22%3A104.283373%2C%22zoom%22%3A17%7D%2C%22opt%22%3A%7B%22city%22%3A%22irkutsk%22%7D%2C%22org%22%3A%2270000001110409148%22%7D",
};

export const socialLinks = [
  {
    id: "telegram",
    title: "Telegram",
    href: "https://t.me/pappare",
  },
  {
    id: "instagram",
    title: "Instagram",
    href: "https://www.instagram.com/pappare.irk/",
  },
  {
    id: "max",
    title: "MAX",
    href: "https://max.ru/join/JInOU4D_O6tSZDIdt4wOKbyDIYDrnABrDZFG66r0-UA",
  },
] as const;

export const events = [
  {
    id: "twilight-halloween-2026",
    date: "2026-10-31",
    dateLabel: "31 октября · Хэллоуин",
    title: "Хэллоуин в стиле «Сумерек»",
    image: "/assets/events/twilight-halloween-2026.png",
    imageAlt: "Белла, Эдвард и семья Калленов — «Сумерки»",
    description: "31 октября собираемся в Pappare, чтобы вместе пересмотреть самые культовые части любимой саги «Сумерки». Знакомые герои, любимые сцены и атмосфера самого жуткого праздника года!",
    quiz: "В финале — квиз по фильму и символичный подарок победителю: золотая луковица. Поклонники истории Эдварда и Беллы поймут эту отсылку!",
    invitation: "Мы знаем, как порадовать любителей «Сумерек», и уже готовимся к Хэллоуину. Приходите за любимой историей и праздничным настроением — к событию подготовим специальное меню.",
    highlights: ["Вход абсолютно бесплатный", "Специальное меню", "Квиз и подарок"],
  },
] as const;

export const teamMembers = [
  {
    id: "chef",
    name: "Скоро представим",
    role: "Команда Pappare",
    description:
      "Здесь появятся фотографии, имена и короткие истории людей, которые создают атмосферу ресторана.",
    photo: "/assets/interior-detail.png",
  },
];
