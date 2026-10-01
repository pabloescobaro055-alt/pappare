import type {Metadata} from 'next';
import {CinemaShell} from '@/components/cinema/shell';
import './cinema.css';
export const metadata:Metadata={title:'Киноужин в PAPPARE',robots:{index:false,follow:false},referrer:'no-referrer'};
export default function Layout({children}:{children:React.ReactNode}) {return <CinemaShell>{children}</CinemaShell>;}
