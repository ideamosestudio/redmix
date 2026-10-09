import assert from 'node:assert/strict';
import {readFileSync,existsSync,readdirSync,statSync} from 'node:fs';
import {resolve,join} from 'node:path';
const base='https://ideamosestudio.github.io/redmix/';
const routes=['','quienes-somos/','contacto/','servicios/hormigon-elaborado/','servicios/acarreo-bomba/','servicios/bombeo-hormigon/'];
const titles=new Set();
for(const route of routes){
 const html=readFileSync(join('dist',route,'index.html'),'utf8');
 assert.equal((html.match(/<h1[\s>]/g)||[]).length,1,route+': one H1');
 const title=html.match(/<title>(.*?)<\/title>/s)?.[1];assert.ok(title&&!titles.has(title),route+': unique title');titles.add(title);
 assert.ok(html.includes('name="description"'),route+': description');
 assert.ok(html.includes(`rel="canonical" href="${base+route}"`),route+': canonical');
 assert.ok(/content-security-policy/i.test(html),route+': CSP');
 assert.ok(!html.includes('noindex'),route+': indexable');
 for(const [,raw] of html.matchAll(/<script[^>]*type="application\/ld\+json"[^>]*>(.*?)<\/script>/gs)) JSON.parse(raw);
 for(const [,value] of html.matchAll(/(?:href|src)="([^"]+)"/g)){
  if(!value.startsWith('/redmix/'))continue;
  const pathname=decodeURIComponent(value.split(/[?#]/)[0].replace('/redmix/',''));
  const local=resolve('dist',pathname);assert.ok(local.startsWith(resolve('dist')),route+': local path');
  assert.ok(existsSync(local)||existsSync(local+'.html'),route+': missing '+value);
 }
 for(const [,attrs] of html.matchAll(/<img\b([^>]+)>/g)) assert.ok(/\balt=/.test(attrs)&&/\bwidth=/.test(attrs)&&/\bheight=/.test(attrs),route+': image dimensions and alt');
 for(const [,attrs] of html.matchAll(/<a\b([^>]+)>/g))if(attrs.includes('target="_blank"'))assert.ok(attrs.includes('noopener'),route+': safe external link');
 assert.ok(html.includes('mailto:info@redmix.com.ar'),route+': email');
 console.log('PASS',route||'home');
}
const map=readFileSync('dist/sitemap.xml','utf8');for(const r of routes)assert.ok(map.includes('<loc>'+base+r+'</loc>'));
assert.ok(existsSync('dist/llms.txt'));
assert.ok(!existsSync('dist/propuestas/index.html'),'Discarded demos must not ship');
const assets=readdirSync('dist/_astro');const javascript=assets.filter(f=>f.endsWith('.js')).reduce((total,f)=>total+statSync(join('dist/_astro',f)).size,0);
assert.ok(javascript<180000,'JS budget: '+javascript);
assert.ok(!assets.some(f=>/three\.module/.test(f)),'No unused 3D runtime');
console.log('PASS SEO, links, schema, security and JS budget:',javascript,'bytes');