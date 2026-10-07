import {movieEvents,isPast,type MovieEvent} from '@/data/cinema';
import {seatIds} from '@/data/cinema-hall';
import {transaction,cinemaDatabaseUrl} from './database';
export async function loadEvents():Promise<MovieEvent[]> {
 if(process.env.NODE_ENV==='production'&&!cinemaDatabaseUrl())return movieEvents;
 return transaction(async db=>{const rows=await db.query('SELECT data FROM cinema_event_overrides');const map=new Map(movieEvents.map(e=>[e.id,e]));for(const r of rows){const e=JSON.parse(String(r.data));map.set(e.id,e);}return [...map.values()].sort((a,b)=>a.startsAt.localeCompare(b.startsAt));});
}
export async function loadEvent(id:string){return (await loadEvents()).find(e=>e.id===id);}
export async function loadEventSlug(slug:string){const events=await loadEvents();return events.find(e=>e.slug===slug)||(slug==='eat-pray-love'?events.find(e=>!isPast(e))||events[0]:undefined);}
export async function saveEvent(input:MovieEvent){
 const short=(v:unknown,max:number)=>typeof v==='string'&&v.trim().length>0&&v.length<=max;
 if(!short(input.id,100)||!/^[-a-z0-9]+$/.test(input.id)||!short(input.slug,100)||!/^[-a-z0-9]+$/.test(input.slug)||!short(input.title,120)||!/^\d{4}-\d{2}-\d{2}$/.test(input.date)||!/^([01]\d|2[0-3]):[0-5]\d$/.test(input.time)||!Number.isSafeInteger(input.pricePerSeat)||input.pricePerSeat<=0||input.pricePerSeat>100000)throw new Error('Проверьте название, дату, время и цену');
 const startsAt=input.date+'T'+input.time+':00+08:00';if(!Number.isFinite(Date.parse(startsAt))||new Date(input.date+'T00:00:00Z').toISOString().slice(0,10)!==input.date)throw new Error('Некорректная дата');
 const image=(v:string)=>typeof v==='string'&&/^\/(assets\/|api\/cinema\/media\/)[a-zA-Z0-9._/-]+$/.test(v)&&!v.includes('..');
 if(!image(input.image)||!image(input.heroImage)||!short(input.description,5000)||!short(input.shortDescription,500)||!short(input.menuDescription,1000)||!Array.isArray(input.menuCourses)||!input.menuCourses.length||input.menuCourses.length>20||input.menuCourses.some(c=>!short(c.category,100)||!short(c.name,500)))throw new Error('Проверьте фото, описание и меню');
 const event:MovieEvent={...input,startsAt,demo:false,status:input.status==='finished'?'finished':'active',saleStatus:'closed',venue:'PAPPARE · Иркутск'};
 await transaction(async db=>{const rows=await db.query('SELECT data FROM cinema_event_overrides');if(rows.some(r=>{const e=JSON.parse(String(r.data));return e.id!==event.id&&e.slug===event.slug;}))throw new Error('Этот адрес страницы уже используется');await db.query('INSERT INTO movie_events(id,data) VALUES($1,$2) ON CONFLICT(id) DO NOTHING',[event.id,JSON.stringify(event)]);await db.query('INSERT INTO cinema_event_overrides(id,data) VALUES($1,$2) ON CONFLICT(id) DO UPDATE SET data=$2',[event.id,JSON.stringify(event)]);for(const seat of seatIds)await db.query('INSERT INTO cinema_seats(event_id,id) VALUES($1,$2) ON CONFLICT(event_id,id) DO NOTHING',[event.id,seat]);});return event;
}
