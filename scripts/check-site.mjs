import assert from 'node:assert/strict';
import {readFileSync,existsSync,readdirSync,statSync} from 'node:fs';
import {resolve,join} from 'node:path';
const base='https://redmix.com.ar/';
const routes=['','quienes-somos/','contacto/','servicios/hormigon-elaborado/','servicios/acarreo-bomba/','servicios/bombeo-hormigon/'];
const titles=new Set();
const descriptions=new Set();
for(const route of routes){
 const html=readFileSync(join('dist',route,'index.html'),'utf8');
 assert.equal((html.match(/<h1[\s>]/g)||[]).length,1,route+': one H1');
 const title=html.match(/<title>(.*?)<\/title>/s)?.[1];assert.ok(title&&!titles.has(title),route+': unique title');titles.add(title);
 const description=html.match(/name="description" content="([^"]+)"/)?.[1];
 assert.ok(description && description.length >= 70 && description.length <= 170 && !descriptions.has(description),route+': unique useful description');descriptions.add(description);
 assert.ok(html.includes(`rel="canonical" href="${base+route}"`),route+': canonical');
 assert.ok(/content-security-policy/i.test(html),route+': CSP');
 assert.ok(html.indexOf('name="viewport"') < html.indexOf('rel="preload"'),route+': viewport before responsive preloads');
 assert.ok(!html.includes('noindex'),route+': indexable');
 const entities=[];
 for(const [,raw] of html.matchAll(/<script[^>]*type="application\/ld\+json"[^>]*>(.*?)<\/script>/gs)) { const data=JSON.parse(raw); entities.push(...(Array.isArray(data)?data:[data])); }
 assert.ok(entities.some(e=>e['@type']==='WebPage'||e['@type']==='AboutPage'||e['@type']==='ContactPage'),route+': page entity');
 if(route)assert.ok(entities.some(e=>e['@type']==='BreadcrumbList'),route+': breadcrumb schema');
 if(route.startsWith('servicios/'))assert.ok(entities.some(e=>e['@type']==='Service'&&e.url===base+route&&e['@id']),route+': identified service');
 for(const [,value] of html.matchAll(/(?:href|src)="([^"]+)"/g)){
  if(!value.startsWith('/') || value.startsWith('//'))continue;
  const pathname=decodeURIComponent(value.split(/[?#]/)[0].replace(/^\//,''));
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
assert.ok(javascript<30000,'JS budget: '+javascript);
assert.ok(!assets.some(f=>/three\.module/.test(f)),'No unused 3D runtime');
console.log('PASS SEO, links, schema, security and JS budget:',javascript,'bytes');

const notFound=readFileSync('dist/404.html','utf8');assert.ok(notFound.includes('noindex, follow'),'404 excluded from indexing');assert.ok(!map.includes('/404'),'404 excluded from sitemap');
