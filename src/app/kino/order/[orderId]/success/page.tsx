import {OrderPage} from '@/components/cinema/order-page';
export const metadata={title:'Ваш заказ | PAPPARE',robots:{index:false,follow:false}};
export default async function Page({params}:{params:Promise<{orderId:string}>}) {return <OrderPage id={(await params).orderId}/>;}
