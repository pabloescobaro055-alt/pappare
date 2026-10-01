import {OrderPage} from '@/components/cinema/order-page';
export default async function Page({params}:{params:Promise<{orderId:string}>}) {return <OrderPage id={(await params).orderId}/>;}
