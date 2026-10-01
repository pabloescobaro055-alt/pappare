'use client';
import Link from 'next/link';
import {useEffect,useState} from 'react';
import {usePathname} from 'next/navigation';
import {Moon,Sun,ArrowLeft} from 'lucide-react';
export function CinemaShell({children}:{children:React.ReactNode}) {
  const [theme,setTheme]=useState('dark');
  const pathname=usePathname();
  const seats=pathname.endsWith('/seats');
  useEffect(()=>{try{const saved=localStorage.getItem('pappare-cinema-theme');if(saved==='light')setTheme(saved);}catch{}},[]);
  function toggle(){const next=theme==='dark'?'light':'dark';setTheme(next);try{localStorage.setItem('pappare-cinema-theme',next);}catch{}}
  return <div className={`cinema ${seats?'cinema-booking':''}`} data-theme={theme}>
    <header className="cinema-header">
      <Link className="cinema-brand" href="/">Pappare<span>ITALIANO</span></Link>
      <nav aria-label="Навигация киноужинов">{pathname==='/kino'?<><Link href="/menu">Меню</Link><a href="#evenings">Ближайшие вечера</a></>:<Link href={seats?pathname.replace('/seats',''):'/kino'}><ArrowLeft size={15}/> {seats?'К киноужину':'Все киноужины'}</Link>}</nav>
      <button className="theme-switch" onClick={toggle} aria-label={theme==='dark'?'Включить светлую тему':'Включить тёмную тему'}>{theme==='dark'?<Sun size={18}/>:<Moon size={18}/>}</button>
    </header>
    {children}
    {!seats&&<footer className="cinema-footer"><Link href="/">Pappare Italiano</Link><span>Иркутск · переулок Богданова, 4</span><a href="tel:+79149386660">+7 (914) 938-66-60</a></footer>}
  </div>;
}
