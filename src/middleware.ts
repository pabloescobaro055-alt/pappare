import {NextRequest,NextResponse} from 'next/server';
import {contentSecurityPolicy} from './lib/content-security';
export function middleware(request:NextRequest){
 const nonce=btoa(String.fromCharCode(...crypto.getRandomValues(new Uint8Array(24))));
 const csp=contentSecurityPolicy(nonce,process.env.NODE_ENV==='development');
 const headers=new Headers(request.headers);
 headers.set('x-nonce',nonce);headers.set('x-page-path',request.nextUrl.pathname);headers.set('Content-Security-Policy',csp);
 const response=NextResponse.next({request:{headers}});
 response.headers.set('Content-Security-Policy',csp);
 response.headers.set('Cache-Control','private, no-store, max-age=0');
 response.headers.set('Referrer-Policy','no-referrer');
 return response;
}
export const config={matcher:['/((?!api/|_next/|assets/|favicon|apple-touch-icon|robots.txt|sitemap.xml).*)']};
