'use client';
import {useRef,useEffect} from 'react';
import {X} from 'lucide-react';
import {cinemaViews,type CinemaViewId} from '@/data/cinema-views';
export function VenueView({viewId,onClose}:{viewId:CinemaViewId|null;onClose:()=>void}) {
  const dialog=useRef<HTMLDialogElement>(null);
  const open=viewId!==null;
  const view=cinemaViews.find(item=>item.id===viewId)||cinemaViews[0];
  useEffect(()=>{const el=dialog.current;if(open){el?.showModal();}else{el?.close();}},[open]);
  return <dialog ref={dialog} className="cinema-dialog venue-dialog" aria-label={view.label} onCancel={onClose} onClose={onClose} onClick={e=>{if(e.target===e.currentTarget)onClose();}}>
      <button className="dialog-close" aria-label="Закрыть фотографию" onClick={onClose}><X size={20}/></button>
      <button className="venue-photo-close" onClick={onClose} aria-label="Закрыть фотографию зала"><img src={view.image} alt={view.alt}/></button>
      <div><span className="eyebrow">{view.label.toUpperCase()}</span><h2>Здесь пройдёт ваш вечер</h2><p>Экран разместится у окна в дальней части зала. Перед показом столы могут немного переместить, чтобы улучшить обзор.</p><small>Фотография зала до установки экрана.</small></div>
    </dialog>;
}
