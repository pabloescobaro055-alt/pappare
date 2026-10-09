'use client';
import Script from "next/script";
import {usePathname} from 'next/navigation';
import {useEffect} from 'react';

const counterId = 110977732;

export function YandexMetrika({nonce}:{nonce?:string}) {
  const pathname=usePathname();
  const privatePage=pathname.startsWith('/kino');
  useEffect(()=>{if(privatePage){const ym=(window as unknown as {ym?:(id:number,method:string)=>void}).ym;ym?.(counterId,'destruct');}},[privatePage]);
  if(privatePage)return null;
  return (
    <>
      <Script
        nonce={nonce}
        id="yandex-metrika"
        strategy="afterInteractive"
        dangerouslySetInnerHTML={{
          __html: `
            (function(){
            if(location.pathname.startsWith('/kino'))return;
            (function(m,e,t,r,i,k,a){
              m[i]=m[i]||function(){(m[i].a=m[i].a||[]).push(arguments)};
              m[i].l=1*new Date();
              for (var j=0; j<document.scripts.length; j++) {
                if (document.scripts[j].src === r) { return; }
              }
              k=e.createElement(t),a=e.getElementsByTagName(t)[0],k.async=1,k.src=r,a.parentNode.insertBefore(k,a)
            })(window, document, 'script', 'https://mc.yandex.ru/metrika/tag.js?id=${counterId}', 'ym');
            ym(${counterId}, 'init', {
              ssr: true,
              webvisor: false,
              clickmap: false,
              referrer: '',
              url: location.origin + location.pathname,
              accurateTrackBounce: true,
              trackLinks: true
            });
            })();
          `,
        }}
      />
      <noscript>
        <div>
          <img
            src={`https://mc.yandex.ru/watch/${counterId}`}
            style={{ position: "absolute", left: "-9999px" }}
            alt=""
          />
        </div>
      </noscript>
    </>
  );
}
