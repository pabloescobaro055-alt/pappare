export type MovieEvent = {
  id: string; slug: string; title: string; date: string; time: string;
  startsAt: string; image: string; heroImage: string; shortDescription: string;
  description: string; menuDescription: string; pricePerSeat: number;
  status: 'active' | 'upcoming' | 'finished' | 'sold_out'; saleStatus: 'open' | 'closed';
  venue: string; demo: boolean; duration?: string; age?: string;
};
// DEMO DATA: replace here before opening real sales. Images are restaurant placeholders.
export const movieEvents: MovieEvent[] = [
  { id: 'demo-ratatouille-20260925', slug: 'ratatouille', title: 'Рататуй',
    date: '2026-09-25', time: '19:30', startsAt: '2026-09-25T19:30:00+08:00',
    image: '/assets/gallery-hall-sun-table.webp', heroImage: '/assets/pappare-night-mood.webp',
    shortDescription: 'Париж, маленькая кухня и большая любовь к еде.',
    description: 'Есть фильмы, после которых хочется готовить. А есть вечера, когда всё уже приготовлено для вас. Смотрим историю Реми, узнаём знакомые вкусы и наслаждаемся неспешным ужином.',
    menuDescription: 'Несколько подач, вдохновлённых атмосферой фильма. Точное меню появится после анонса вечера. Если у вас есть аллергии, свяжитесь с рестораном до покупки.',
    pricePerSeat: 3000, status: 'active', saleStatus: 'open', venue: 'PAPPARE · Иркутск', demo: true },
  { id: 'demo-panda-20261009', slug: 'kung-fu-panda', title: 'Кунг-фу Панда',
    date: '2026-10-09', time: '19:30', startsAt: '2026-10-09T19:30:00+08:00',
    image: '/assets/gallery-hall-window-table.webp', heroImage: '/assets/gallery-hall-wide.webp',
    shortDescription: 'Секретного ингредиента не существует. Кроме хорошей компании.',
    description: 'Тёплый вечер с любимой историей и блюдами, которые продолжают её за вашим столом.',
    menuDescription: 'Гастрономическая программа готовится. Состав и число подач уточним ближе к анонсу.',
    pricePerSeat: 3000, status: 'upcoming', saleStatus: 'closed', venue: 'PAPPARE · Иркутск', demo: true },
];
export const cinemaCopy = {
  intro: 'Вечер, в котором кино выходит за пределы экрана. Мы подаём блюда, связанные со сценами и атмосферой фильма, — а вы пробуете историю на вкус.',
};
export const eventBySlug = (slug: string) => movieEvents.find(e => e.slug === slug);
export const eventById = (id: string) => movieEvents.find(e => e.id === id);
export const isPast = (event: MovieEvent, now = Date.now()) => Date.parse(event.startsAt) <= now || event.status === 'finished';
export const canBook = (event: MovieEvent) => !(process.env.NODE_ENV === 'production' && event.demo) && !isPast(event) && event.status === 'active' && event.saleStatus === 'open';
export const money = (value: number) => `${new Intl.NumberFormat('ru-RU').format(value)} ₽`;
export const dateLabel = (event: MovieEvent) => new Intl.DateTimeFormat('ru-RU', {day:'numeric', month:'long', timeZone:'Asia/Irkutsk'}).format(new Date(event.startsAt));
