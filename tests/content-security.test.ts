import {test} from 'node:test';
import assert from 'node:assert/strict';
import {contentSecurityPolicy} from '../src/lib/content-security';
import {blockedPath} from '../src/lib/blocked-path';

test('scanner targets are rejected while real pages and certificate validation remain available',()=>{
 for(const path of ['/.env','/.env.production.local','/.git/config','/.svn/entries','/app/pluck-4.7.13/files/shell.phar','/login.php','/x.PHP8/path','/%2eenv','/%zz'])assert.equal(blockedPath(path),true,path);
 for(const path of ['/','/kino/admin','/kino/eat-pray-love-24-october/seats','/.well-known/acme-challenge/token','/menu','/api/cinema/yookassa/webhook','/assets/photo.webp'])assert.equal(blockedPath(path),false,path);
});
test('production CSP blocks injected scripts, embeds and outside form submissions',()=>{
 const policy=contentSecurityPolicy('test-nonce');
 assert.match(policy,/script-src 'self' 'nonce-test-nonce' 'strict-dynamic'/);
 assert.ok(!policy.split(';').find(x=>x.trim().startsWith('script-src'))!.includes('unsafe-inline'));
 assert.ok(!policy.includes('unsafe-eval'));assert.match(policy,/object-src 'none'/);assert.match(policy,/frame-ancestors 'none'/);assert.match(policy,/form-action 'self'/);
 assert.ok(contentSecurityPolicy('test',true).includes('unsafe-eval'));
});
