'use client';
import {useRef,useState} from 'react';
import {Minus,Plus,RotateCcw} from 'lucide-react';
import {cinemaHallConfig as config,seatLabel,type Seat} from '@/data/cinema-hall';
import {cinemaViews,type CinemaViewId} from '@/data/cinema-views';
export function CinemaHall({seats,selected,onToggle,locked=false,price,onView}:{seats:Seat[];selected:string[];onToggle:(id:string)=>void;locked?:boolean;price:number;onView:(id:CinemaViewId)=>void}) {
  const [zoom,setZoom]=useState(1),[active,setActive]=useState<number|null>(null);
  const scroll=useRef<HTMLDivElement>(null),drag=useRef<{x:number;y:number;left:number;top:number}|null>(null);
  const state=(id:string)=>selected.includes(id)?'selected':seats.find(s=>s.id===id)?.status||'disabled';
  return <div className="hall-wrap"><div className="hall-tools"><span>ПЛАН ВАШЕГО ВЕЧЕРА</span><div><button aria-label="Уменьшить схему" onClick={()=>setZoom(z=>Math.max(1,z-.25))} disabled={zoom===1}><Minus size={16}/></button><button aria-label="Увеличить схему" onClick={()=>setZoom(z=>Math.min(2.5,z+.25))}><Plus size={16}/></button><button aria-label="Сбросить масштаб" onClick={()=>setZoom(1)}><RotateCcw size={15}/></button></div></div>
    <div className="hall-scroll" ref={scroll} onPointerDown={e=>{if(zoom>1&&(e.target as Element).closest('[role="button"]')===null&&e.pointerType==='mouse'){drag.current={x:e.clientX,y:e.clientY,left:e.currentTarget.scrollLeft,top:e.currentTarget.scrollTop};e.currentTarget.setPointerCapture(e.pointerId);}}} onPointerMove={e=>{if(drag.current){e.currentTarget.scrollLeft=drag.current.left-(e.clientX-drag.current.x);e.currentTarget.scrollTop=drag.current.top-(e.clientY-drag.current.y);}}} onPointerUp={()=>drag.current=null} onPointerCancel={()=>drag.current=null}>
      <svg className="cinema-hall" viewBox={config.viewBox} style={{width:`${zoom*100}%`,height:`${zoom*100}%`}} aria-label="Схема PAPPARE: 13 столов и 26 мест" role="group">
        <defs><pattern id="floor" width="44" height="44" patternUnits="userSpaceOnUse"><path d="M44 0H0V44" fill="none" stroke="currentColor" strokeWidth=".6" opacity=".13"/></pattern><filter id="screen-glow"><feGaussianBlur stdDeviation="9"/></filter></defs>
        <path d={config.walls} className="hall-floor"/><path d={config.walls} fill="url(#floor)"/>
        <path d="M330 145V260H645 M382 546V748" className="inner-wall"/>
        <path d="M448 145H492" className="door-gap"/><path d="M448 145V191 A46 46 0 0 0 492 145" className="door-arc"/>
        <text x="476" y="114" className="hall-label" textAnchor="middle">ВХОД ↓</text>
        <path d={`M${config.screen.x1} ${config.screen.y1}L${config.screen.x2} ${config.screen.y2}`} className="screen-light" filter="url(#screen-glow)"/><path d={`M${config.screen.x1} ${config.screen.y1}L${config.screen.x2} ${config.screen.y2}`} className="screen-line"/>
        <text transform="translate(180 184) rotate(-46)" textAnchor="middle" className="screen-label">ЭКРАН</text>
        <path d="M530 182Q580 220 599 291" className="walking-path"/><text x="570" y="221" className="hall-caption">проход</text>
        <g className="plants" aria-hidden="true">{[[355,264],[630,269]].map(([x,y],i)=><g key={i} transform={`translate(${x} ${y})`}><circle r="15"/><ellipse rx="8" ry="21" transform="rotate(35)"/><ellipse rx="8" ry="21" transform="rotate(-45)"/></g>)}</g>
        {config.tables.map(table=><g key={table.id} transform={`translate(${table.x} ${table.y}) rotate(${table.rotation})`} className={`hall-table ${active===table.number?'table-active':''}`}>
          <g role="button" tabIndex={0} aria-label={`Стол ${table.number}, два места`} onClick={()=>setActive(table.number)} onKeyDown={e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();setActive(table.number);}}}>
            <rect x={table.orientation==='vertical'?-30:-44} y={table.orientation==='vertical'?-44:-30} width={table.orientation==='vertical'?60:88} height={table.orientation==='vertical'?88:60} rx="30" className="table-top"/>
            <text className="table-number" x={table.orientation==='vertical'?40:0} y={table.orientation==='vertical'?0:-42} textAnchor="middle" dominantBaseline="central">{String(table.number).padStart(2,'0')}</text>
          </g>
          {table.seats.map(seat=>{const status=state(seat.id),disabled=locked||!['available','selected'].includes(status);return <g key={seat.id} transform={`translate(${seat.x} ${seat.y})`} className={`hall-seat seat-${status}`} role="button" tabIndex={0} aria-disabled={disabled} aria-pressed={status==='selected'} aria-label={`${seatLabel(seat.id)}, ${{available:'свободно',selected:'выбрано вами',held:'временно забронировано',sold:'занято',disabled:'недоступно'}[status]}, цена ${price} рублей`} onClick={()=>{setActive(table.number);if(!disabled)onToggle(seat.id);}} onKeyDown={e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();if(!disabled)onToggle(seat.id);}if(['ArrowLeft','ArrowRight','ArrowUp','ArrowDown'].includes(e.key)){e.preventDefault();const nodes=Array.from(e.currentTarget.ownerSVGElement!.querySelectorAll<SVGGElement>('.hall-seat'));const i=nodes.indexOf(e.currentTarget);nodes[(i+(['ArrowLeft','ArrowUp'].includes(e.key)?nodes.length-1:1))%nodes.length]?.focus();}}}>
            <title>{seatLabel(seat.id)}</title><circle r="21" fill="transparent" stroke="none"/><circle className="seat-cushion" r="17"/>
            <text textAnchor="middle" dominantBaseline="central" className="seat-symbol">{status==='selected'?'✓':status==='sold'?'×':status==='held'?'–':status==='disabled'?'×':seat.number}</text>
          </g>;})}
        </g>)}
        {cinemaViews.map(view=><g key={view.id} className="hall-viewpoint" transform={`translate(${view.x} ${view.y})`} role="button" tabIndex={0} aria-label={`Посмотреть фотографию: ${view.label.toLowerCase()}`} onClick={()=>onView(view.id)} onKeyDown={e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();onView(view.id);}}}>
          <title>Нажмите, чтобы посмотреть зал отсюда</title>
          <circle r="25" fill="transparent"/>
          <g transform={`scale(${view.scale})`}>
          <circle className="viewpoint-halo" r="25"/>
          <circle cx="0" cy="-10" r="5" fill="currentColor"/>
          <path d="M-9 3Q-9-3 0-3Q9-3 9 3M0-3V10M0 10L-6 19M0 10L6 19" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round"/>
          </g>
          {view.id==='table-1'&&<text x="0" y="37" textAnchor="middle">ВИД ЗАЛА</text>}
        </g>)}
      </svg>
    </div><div className="seat-legend">{[['available','Свободно'],['selected','Ваш выбор'],['held','В резерве'],['sold','Занято'],['disabled','Недоступно']].map(([s,label])=><span key={s}><i className={`legend-${s}`}>{s==='selected'?'✓':s==='sold'||s==='disabled'?'×':s==='held'?'–':''}</i>{label}</span>)}</div>
    <p className="hall-footnote">Овал — один стол · Нажмите на место 1 или 2 · Схему можно увеличить</p>
  </div>;
}
