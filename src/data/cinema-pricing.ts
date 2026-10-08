import type {MovieEvent} from './cinema';
import {money} from './cinema';
import {cinemaHallConfig} from './cinema-hall';

export const tablePrice = (event:MovieEvent,tableId:string) => event.tablePrices?.[tableId] ?? event.pricePerSeat;
export const seatPrice = (event:MovieEvent,seatId:string) => tablePrice(event,`table-${Number(seatId.slice(1,3))}`);
export const selectionTotal = (event:MovieEvent,ids:string[]) => ids.reduce((total,id)=>total+seatPrice(event,id),0);
export function eventPriceLabel(event:MovieEvent) {
  const prices=cinemaHallConfig.tables.map(table=>tablePrice(event,table.id));
  const min=Math.min(...prices),max=Math.max(...prices);
  return min===max?money(min):`${money(min)}–${money(max)}`;
}
