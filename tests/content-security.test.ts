import {test} from 'node:test';
import assert from 'node:assert/strict';
import {contentSecurityPolicy} from '../src/lib/content-security';
test('production CSP blocks injected scripts, embeds and outside form submissions',()=>{
 const policy=contentSecurityPolicy('test-nonce');
 assert.match(policy,/script-src 'self' 'nonce-test-nonce' 'strict-dynamic'/);
 assert.ok(!policy.split(';').find(x=>x.trim().startsWith('script-src'))!.includes('unsafe-inline'));
 assert.ok(!policy.includes('unsafe-eval'));assert.match(policy,/object-src 'none'/);assert.match(policy,/frame-ancestors 'none'/);assert.match(policy,/form-action 'self'/);
 assert.ok(contentSecurityPolicy('test',true).includes('unsafe-eval'));
});
