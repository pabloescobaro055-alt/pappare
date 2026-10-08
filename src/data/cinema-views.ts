export const cinemaViews = [
  { id: 'table-1', x: 344, y: 705, scale: 1, label: 'Вид из дальней части зала', image: '/assets/cinema-view-from-table-1.png', video: '/assets/cinema-view-from-table-1.mp4', poster: '/assets/cinema-view-from-table-1-poster.webp', alt: 'Зал PAPPARE из дальней части в направлении экрана' },
  { id: 'right-corner', x: 618, y: 407, scale: .72, label: 'Вид из правой части зала', image: '/assets/cinema-view-from-right-corner.png', video: '/assets/cinema-view-from-right-corner.mp4', poster: '/assets/cinema-view-from-right-corner-poster.webp', alt: 'Зал PAPPARE из правого угла: столы, окно и зелёные шторы' },
] as const;
export type CinemaViewId = typeof cinemaViews[number]['id'];
