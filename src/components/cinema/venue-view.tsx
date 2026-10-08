'use client';
import {useRef,useEffect,useState} from 'react';
import {X} from 'lucide-react';
import {cinemaViews,type CinemaViewId} from '@/data/cinema-views';
export function VenueView({viewId,onClose}:{viewId:CinemaViewId|null;onClose:()=>void}) {
  const dialog=useRef<HTMLDialogElement>(null);
  const video=useRef<HTMLVideoElement>(null);
  const [media,setMedia]=useState<'video'|'photo'>('video');
  const open=viewId!==null;
  const view=cinemaViews.find(item=>item.id===viewId)||cinemaViews[0];
  useEffect(()=>{
    const el=dialog.current;
    if(!open){el?.close();return;}
    const previous=document.activeElement as HTMLElement|null;
    setMedia('video');
    el?.showModal();
    return ()=>{video.current?.pause();previous?.focus();};
  },[open,viewId]);
  return <dialog ref={dialog} className="cinema-dialog venue-dialog" aria-label={view.label} onCancel={onClose} onClose={onClose} onClick={e=>{if(e.target===e.currentTarget)onClose();}}>
      <button className="dialog-close" aria-label="Закрыть просмотр зала" onClick={onClose}><X size={20}/></button>
      {open&&<>
        {media==='video'?<video key={view.id} ref={video} className="venue-video" controls playsInline preload="metadata" poster={view.poster} aria-label={`Видео: ${view.label.toLowerCase()}`}>
          <source src={view.video} type="video/mp4"/>
          Ваш браузер не поддерживает видео. <a href={view.video}>Открыть ролик</a>.
        </video>:<button className="venue-photo-close" onClick={onClose} aria-label="Закрыть фотографию зала"><img src={view.image} alt={view.alt}/></button>}
      </>}
      <div><div className="venue-media-switch" role="group" aria-label="Видео или фото зала"><button type="button" aria-pressed={media==='video'} onClick={()=>setMedia('video')}>Видео</button><button type="button" aria-pressed={media==='photo'} onClick={()=>{video.current?.pause();setMedia('photo');}}>Фото</button></div><span className="eyebrow">{view.label.toUpperCase()}</span><h2>Здесь пройдёт ваш вечер</h2><p>Посмотрите, как выглядит киноужин с этой точки зала. Перед показом столы могут немного переместить, чтобы улучшить обзор.</p><small>{media==='video'?'Видео с киноужина в PAPPARE. Нажмите ▶ для воспроизведения.':'Фотография зала до установки экрана.'}</small></div>
    </dialog>;
}
