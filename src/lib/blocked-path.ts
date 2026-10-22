// These resources are never public routes in this Next.js application.
// Reject common scanner targets before rendering a full application page.
export function blockedPath(pathname:string):boolean {
 let path:string;
 try {path=decodeURIComponent(pathname);} catch {return true;}
 return /(?:^|\/)\.(?:env(?:[./]|$)|git(?:\/|$)|svn(?:\/|$)|hg(?:\/|$))|\.(?:php\d*|phtml|phar)(?:\/|$)/i.test(path);
}
