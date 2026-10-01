export const cinemaViews = [
  { id: 'table-1', x: 344, y: 705, scale: 1, label: 'Вид от стола 1', image: '/assets/cinema-view-from-table-1.png', alt: 'Зал PAPPARE от стола 1 в направлении окна' },
  { id: 'right-corner', x: 618, y: 407, scale: .72, label: 'Вид из правой части зала', image: '/assets/cinema-view-from-right-corner.png', alt: 'Зал PAPPARE из правого угла: столы, окно и зелёные шторы' },
] as const;
export type CinemaViewId = typeof cinemaViews[number]['id'];
