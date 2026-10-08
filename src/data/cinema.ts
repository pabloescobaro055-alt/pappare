export type MovieEvent = {
  id: string; slug: string; title: string; date: string; time: string;
  startsAt: string; image: string; heroImage: string; shortDescription: string;
  description: string; menuDescription: string; pricePerSeat: number;
  tablePrices?: Record<string, number>;
  status: 'active' | 'upcoming' | 'finished' | 'sold_out'; saleStatus: 'open' | 'closed';
  venue: string; demo: boolean; duration?: string; age?: string;
  menuCourses?: { category: string; name: string }[];
};
export const movieEvents: MovieEvent[] = [11].map(day => (
  { id: `eat-pray-love-202610${day}`, slug: `eat-pray-love-${day}-october`, title: 'Ешь, молись, люби',
    date: `2026-10-${day}`, time: '18:00', startsAt: `2026-10-${day}T18:00:00+08:00`,
    image: '/assets/eat-pray-love-poster.png', heroImage: '/assets/eat-pray-love-poster.png',
    shortDescription: 'Любимое кино и итальянский ужин из четырёх подач.',
    description: 'В 18:00 смотрим «Ешь, молись, люби» в Pappare. К фильму подготовили меню из четырёх подач.',
    menuDescription: 'В стоимость входят четыре подачи:',
    menuCourses: [
      { category: 'Аперитив', name: 'Коктейль лимончелло' },
      { category: 'Паста', name: 'Спагетти all’Amatriciana' },
      { category: 'Пицца', name: 'Маргарита из Неаполя' },
      { category: 'Горячее', name: 'Стейк из фермерской индейки с соусом вишневый демиглас' },
    ],
    pricePerSeat: 2500, status: 'active', saleStatus: 'closed', venue: 'PAPPARE · Иркутск', demo: false }));
export const cinemaCopy = {
  intro: 'Вечер, в котором кино выходит за пределы экрана. Мы подаём блюда, связанные со сценами и атмосферой фильма, — а вы пробуете историю на вкус.',
};
export const eventBySlug = (slug: string) => movieEvents.find(e => e.slug === slug) || (slug === 'eat-pray-love' ? movieEvents.find(e => !isPast(e)) || movieEvents[0] : undefined);
export const eventById = (id: string) => movieEvents.find(e => e.id === id);
export const isPast = (event: MovieEvent, now = Date.now()) => Date.parse(event.startsAt) <= now || event.status === 'finished';
export const canBook = (event: MovieEvent) => !(process.env.NODE_ENV === 'production' && event.demo) && !isPast(event) && event.status === 'active' && event.saleStatus === 'open';
export const canSelectSeats = (event:MovieEvent) => !isPast(event) && event.status==='active';
export const money = (value: number) => `${new Intl.NumberFormat('ru-RU').format(value)} ₽`;
export const dateLabel = (event: MovieEvent) => new Intl.DateTimeFormat('ru-RU', {day:'numeric', month:'long', timeZone:'Asia/Irkutsk'}).format(new Date(event.startsAt));
