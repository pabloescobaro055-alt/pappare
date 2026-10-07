// Coordinates follow the supplied annotated floor plan. Dimensions/clearances must be
// verified on site; this is a seating proposal, not an architectural measurement.
export type HallTable = { id: string; number: number; shape: 'round' | 'square'; orientation: 'vertical' | 'horizontal'; x: number; y: number; rotation: number; seats: {id: string; number: number; x: number; y: number}[] };
// Visual groups are ovals regardless of physical table shape. Lower wing follows
// the vertical walls; right wing follows the horizontal walls. No diagonal rotation.
// Shared rows and columns keep the ovals aligned; IDs remain stable for bookings.
const positions: [number, number, number][] = [
  [350,490,0], [450,490,0], [550,490,0],
  [550,400,0], [250,400,0], [350,400,0], [450,400,0],
  [450,310,0], [250,310,0], [290,220,0],
];
export const cinemaHallConfig = {
  viewBox: '50 60 690 710',
  walls: 'M 65 257 L 250 65 L 330 145 L 713 145 L 713 355 L 645 408 L 645 546 L 382 546 L 382 748 L 175 748 L 175 369 Z',
  screen: { x1: 65, y1: 257, x2: 250, y2: 65 },
  entrance: { x: 460, y: 145 },
  tables: positions.map(([x,y,rotation], i): HallTable => ({
    id: `table-${i+1}`, number:i+1, shape:'round', orientation:i===9?'vertical':'horizontal', x,y,rotation,
    seats:[1,2].map(n=>({id:`T${String(i+1).padStart(2,'0')}-S${n}`,number:n,x:i===9?0:(n===1?-22:22),y:i===9?(n===1?-22:22):0})),
  })),
};
export const seatIds = cinemaHallConfig.tables.flatMap(t=>t.seats.map(s=>s.id));
export const seatLabel = (id: string) => `Стол ${Number(id.slice(1,3))} · место ${id.slice(-1)}`;
export type SeatState = 'available' | 'held' | 'sold' | 'disabled';
export type Seat = { id: string; status: SeatState };
