import {movieEvents,isPast,type MovieEvent} from '@/data/cinema';
import {seatIds,cinemaHallConfig} from '@/data/cinema-hall';
import {transaction,cinemaDatabaseUrl} from './database';
import {onlineSalesEnabled} from './payment-config';
export async function loadEvents():Promise<MovieEvent[]> {
 if(process.env.NODE_ENV==='production'&&!cinemaDatabaseUrl())return movieEvents;
 return transaction(async db=>{const rows=await db.query('SELECT data FROM cinema_event_overrides');const map=new Map(movieEvents.map(e=>[e.id,e]));for(const r of rows){const e=JSON.parse(String(r.data));map.set(e.id,e);}return [...map.values()].map(e=>e.bookingPaused?{...e,saleStatus:'closed' as const}:onlineSalesEnabled()&&e.status==='active'?{...e,saleStatus:'open' as const,demo:false}:e).sort((a,b)=>a.startsAt.localeCompare(b.startsAt));});
}
export async function loadEvent(id:string){return (await loadEvents()).find(e=>e.id===id);}
export async function setEventSales(id:unknown,enabled:unknown){
 if(typeof id!=='string'||typeof enabled!=='boolean')throw new Error('Укажите сеанс и состояние бронирования');
 if(enabled&&!onlineSalesEnabled())throw new Error('Сначала настройте ЮKassa и включите CINEMA_ONLINE_SALES на VPS');
 await transaction(async db=>{
  const [row]=await db.query('SELECT data FROM cinema_event_overrides WHERE id=$1',[id]);
  const event:MovieEvent|undefined=row?JSON.parse(String(row.data)):movieEvents.find(e=>e.id===id);
  if(!event)throw new Error('Сохраните афишу перед изменением бронирования');
  if(enabled&&(isPast(event)||event.status!=='active'))throw new Error('Сеанс уже начался или завершён. Создайте следующий вечер с новой датой');
  event.bookingPaused=!enabled;
  await db.query('INSERT INTO cinema_event_overrides(id,data) VALUES($1,$2) ON CONFLICT(id) DO UPDATE SET data=$2',[id,JSON.stringify(event)]);
 });
 return loadEvent(id);
}
export async function loadEventSlug(slug:string){const events=await loadEvents();return events.find(e=>e.slug===slug)||(slug==='eat-pray-love'?events.find(e=>!isPast(e))||events[0]:undefined);}
export async function saveEvent(input:MovieEvent){
 const short=(v:unknown,max:number)=>typeof v==='string'&&v.trim().length>0&&v.length<=max;
 if(!short(input.id,100)||!/^[-a-z0-9]+$/.test(input.id)||!short(input.slug,100)||!/^[-a-z0-9]+$/.test(input.slug)||!short(input.title,120)||!/^\d{4}-\d{2}-\d{2}$/.test(input.date)||!/^([01]\d|2[0-3]):[0-5]\d$/.test(input.time)||!Number.isSafeInteger(input.pricePerSeat)||input.pricePerSeat<=0||input.pricePerSeat>100000)throw new Error('Проверьте название, дату, время и цену');
 const startsAt=input.date+'T'+input.time+':00+08:00';if(!Number.isFinite(Date.parse(startsAt))||new Date(input.date+'T00:00:00Z').toISOString().slice(0,10)!==input.date)throw new Error('Некорректная дата');
 const image=(v:string)=>typeof v==='string'&&/^\/(assets\/|api\/cinema\/media\/)[a-zA-Z0-9._/-]+$/.test(v)&&!v.includes('..');
 if(!image(input.image)||!image(input.heroImage)||!short(input.description,5000)||!short(input.shortDescription,500)||!short(input.menuDescription,1000)||!Array.isArray(input.menuCourses)||!input.menuCourses.length||input.menuCourses.length>20||input.menuCourses.some(c=>!short(c.category,100)||!short(c.name,500)))throw new Error('Проверьте фото, описание и меню');
 const tablePrices:Record<string,number>={};
 if(input.tablePrices!==undefined){
  if(!input.tablePrices||typeof input.tablePrices!=='object'||Array.isArray(input.tablePrices))throw new Error('Проверьте цены столов');
  for(const [id,price] of Object.entries(input.tablePrices)){
   if(!cinemaHallConfig.tables.some(table=>table.id===id)||!Number.isSafeInteger(price)||price<=0||price>100000)throw new Error('Цена места за столом должна быть целым числом от 1 до 100 000 ₽');
   tablePrices[id]=price;
  }
 }
 const event:MovieEvent={...input,tablePrices,startsAt,demo:false,status:input.status==='finished'?'finished':'active',saleStatus:'closed',venue:'PAPPARE · Иркутск'};
 await transaction(async db=>{const rows=await db.query('SELECT data FROM cinema_event_overrides');const previous=rows.map(r=>JSON.parse(String(r.data)) as MovieEvent).find(e=>e.id===event.id);event.bookingPaused=previous?.bookingPaused??!movieEvents.some(e=>e.id===event.id);if(rows.some(r=>{const e=JSON.parse(String(r.data));return e.id!==event.id&&e.slug===event.slug;}))throw new Error('Этот адрес страницы уже используется');await db.query('INSERT INTO movie_events(id,data) VALUES($1,$2) ON CONFLICT(id) DO NOTHING',[event.id,JSON.stringify(event)]);await db.query('INSERT INTO cinema_event_overrides(id,data) VALUES($1,$2) ON CONFLICT(id) DO UPDATE SET data=$2',[event.id,JSON.stringify(event)]);for(const seat of seatIds)await db.query('INSERT INTO cinema_seats(event_id,id) VALUES($1,$2) ON CONFLICT(event_id,id) DO NOTHING',[event.id,seat]);});return event;
}
