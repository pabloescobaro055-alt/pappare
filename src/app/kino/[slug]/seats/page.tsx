import {notFound} from 'next/navigation';
import {eventBySlug} from '@/data/cinema';
import {SeatSelectionPage} from '@/components/cinema/booking';
export default async function Page({params}:{params:Promise<{slug:string}>}) {const event=eventBySlug((await params).slug);if(!event)notFound();return <SeatSelectionPage event={event}/>;}
