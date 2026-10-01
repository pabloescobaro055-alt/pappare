'use client';
export default function ErrorPage({reset}:{reset:()=>void}) {return <main className="order-page"><h1>Небольшой антракт</h1><p>Не удалось загрузить страницу.</p><button onClick={reset}>Попробовать ещё раз</button></main>;}
