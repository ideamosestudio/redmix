// Run after build and design-qa: QA_OUT=<capture directory> node scripts/verify-design.mjs
import assert from 'node:assert/strict';
import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
const routes = ['','contacto/','quienes-somos/','servicios/hormigon-elaborado/','servicios/acarreo-bomba/','servicios/bombeo-hormigon/'];
for (const route of routes) {
  const html = readFileSync(join('dist',route,'index.html'),'utf8');
  const whatsapp = [...html.matchAll(/href="(https:\/\/wa\.me\/[^"?]+)/g)].map(m=>m[1]);
  assert.ok(whatsapp.length, `WhatsApp links on ${route}`);
  assert.ok(whatsapp.every(href=>href==='https://wa.me/5491138245680'));
  for (const href of ['tel:+5491138245680','tel:+5491133583377','mailto:info@redmix.com.ar','mailto:adm@redmix.com.ar']) assert.ok(html.includes(href));
  assert.ok(html.includes('data-email-form'));
}
const js = readFileSync('src/site.js','utf8');
assert.ok(js.includes('mailto:info@redmix.com.ar?subject='));
assert.ok(js.includes('if (!form.reportValidity()) return'));
assert.ok(js.includes("encodeURIComponent(body)"));
for (const file of readdirSync('src/styles').filter(f=>f.endsWith('.css')&&f!=='motion.css')) {
  assert.ok(!readFileSync(join('src/styles',file),'utf8').includes('!important'), `${file}: no specificity escape hatch`);
}
if (process.env.QA_OUT) {
  const report = JSON.parse(readFileSync(join(process.env.QA_OUT,'report.json'),'utf8'));
  assert.equal(report.length,48);
  assert.equal(new Set(report.map(p=>`${p.width}:${p.route}`)).size,48);
  for (const page of report) {
    assert.equal(page.viewport,page.width,'actual emulated viewport');
    assert.ok(page.scroll<=page.document+1,`document overflow ${page.width} ${page.route}`);
    assert.equal(page.overflow.length,0,`element overflow ${page.width} ${page.route}`);
    assert.equal(page.errors.length,0,`console errors ${page.width} ${page.route}`);
    assert.equal(page.images.length,0,`broken images ${page.width} ${page.route}`);
    assert.ok(page.canvas.every(c=>c.webgl&&c.width>0&&c.height>0));
    const expected = page.width<360?20:page.width<768?24:Math.min(48,Math.max(40,page.width*.033));
    for (const box of page.boxes.filter(b=>b.selector.startsWith('contact-form'))) assert.ok(Math.abs(parseFloat(box.padding)-expected)<.1,`computed form padding ${page.width}`);
    if(page.width<768) {
      const hero=page.boxes.find(b=>b.selector==='contact-hero section-shell');
      if(hero) { assert.equal(hero.top,0); assert.equal(parseFloat(hero.padding),120); }
      const cta=page.boxes.find(b=>b.selector==='final-cta__inner');
      if(cta) assert.equal(parseFloat(cta.padding),80);
    }
    if(page.width===1440) {
      const cta=page.boxes.find(b=>b.selector==='final-cta__inner');
      if(cta) assert.equal(cta.padding.split(' ')[1],'86.4px');
    }
  }
  console.log('PASS: 48 page/viewport cases, all four computed-style corrections, images, WebGL and console.');
}
console.log('PASS: commercial destinations, form handler, CSS specificity constraints.');
