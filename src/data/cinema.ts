export type MovieEvent = {
  id: string; slug: string; title: string; date: string; time: string;
  startsAt: string; image: string; heroImage: string; shortDescription: string;
  description: string; menuDescription: string; pricePerSeat: number;
  status: 'active' | 'upcoming' | 'finished' | 'sold_out'; saleStatus: 'open' | 'closed';
  venue: string; demo: boolean; duration?: string; age?: string;
  menuCourses?: { category: string; name: string }[];
};
export const movieEvents: MovieEvent[] = [
  { id: 'test-eat-pray-love-20261004', slug: 'eat-pray-love', title: 'Ешь, молись, люби',
    date: '2026-10-04', time: '18:00', startsAt: '2026-10-04T18:00:00+08:00',
    image: '/assets/eat-pray-love-poster.png', heroImage: '/assets/eat-pray-love-poster.png',
    shortDescription: 'Тестовый просмотр фильма и ужин в итальянском настроении.',
    description: '4 октября в 18:00 смотрим «Ешь, молись, люби» в Pappare. К фильму подготовили меню из четырёх подач.',
    menuDescription: 'Меню вечера по афише Pappare:',
    menuCourses: [
      { category: 'Аперитив', name: 'Коктейль лимончелло' },
      { category: 'Паста', name: 'Спагетти all’Amatriciana' },
      { category: 'Пицца', name: 'Маргарита из Неаполя' },
      { category: 'Горячее', name: 'Стейк из фермерской индейки с соусом вишневый демиглас' },
    ],
    pricePerSeat: 0, status: 'upcoming', saleStatus: 'closed', venue: 'PAPPARE · Иркутск', demo: true },
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
