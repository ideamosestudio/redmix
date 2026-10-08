// Production-preview typography regression: no external links or form submissions.
import assert from 'node:assert/strict';
import { mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
const out = process.env.QA_OUT;
assert.ok(out, 'Set QA_OUT outside the repository');
mkdirSync(out, { recursive: true });
const base = process.env.QA_BASE || 'http://127.0.0.1:4322/redmix/';
const target = await fetch(`http://127.0.0.1:${process.env.QA_CDP_PORT || 9224}/json/new?about:blank`, { method: 'PUT' }).then(r => r.json());
const ws = new WebSocket(target.webSocketDebuggerUrl);
await new Promise(r => ws.addEventListener('open', r, { once: true }));
let id = 0, loaded;
const pending = new Map(), report = [];
ws.onmessage = e => { const m = JSON.parse(e.data); if (m.method === 'Page.loadEventFired') loaded?.(); pending.get(m.id)?.(m); };
const send = (method, params = {}) => new Promise((resolve, reject) => {
  const n = ++id, timer = setTimeout(() => { pending.delete(n); reject(new Error(method)); }, 30000);
  pending.set(n, m => { clearTimeout(timer); pending.delete(n); m.error ? reject(new Error(JSON.stringify(m.error))) : resolve(m.result); });
  ws.send(JSON.stringify({ id: n, method, params }));
});
const evaluate = async expression => {
  const r = await send('Runtime.evaluate', { expression, returnByValue: true, awaitPromise: true });
  assert.ok(!r.exceptionDetails, JSON.stringify(r.exceptionDetails));
  return r.result.value;
};
const wait = ms => new Promise(r => setTimeout(r, ms));
const screenshot = async (name, clip) => { const r = await send('Page.captureScreenshot', { format: 'png', ...(clip ? { captureBeyondViewport: true, clip: { ...clip, scale: 1 } } : {}) }); writeFileSync(join(out, name + '.png'), Buffer.from(r.data, 'base64')); };
const near = (actual, expected, label) => assert.ok(Math.abs(actual - expected) < .12, `${label}: ${actual} != ${expected}`);
function measure() {
  const box = e => { const r = e.getBoundingClientRect(); return { x:r.x,y:r.y,width:r.width,height:r.height,bottom:r.bottom,right:r.right }; };
  const style = e => { const s = getComputedStyle(e); return Object.fromEntries(['fontFamily','fontSize','fontWeight','lineHeight','letterSpacing','paddingTop','paddingRight','paddingBottom','paddingLeft','marginBottom','minHeight','textAlign','justifyContent','gap','display','gridTemplateColumns','textTransform'].map(k=>[k,s[k]])); };
  const data = e => ({...style(e),box:box(e)});
  const cards = [...document.querySelectorAll('.service-card')].map(card => {
    const body = card.querySelector('.service-card__body'), meta=card.querySelector('.service-card__meta'), h=card.querySelector('h3'), p=body.querySelector('p'), actions=card.querySelector('.service-card__actions');
    const range=document.createRange(); range.selectNodeContents(h.querySelector('a'));
    const lines=[...range.getClientRects()].filter(r=>r.width>0);
    return {body:data(body),meta:data(meta),title:{...data(h),text:h.textContent,lines:lines.length,clipped:h.scrollWidth>h.clientWidth+1},paragraph:data(p),actions:data(actions),image:data(card.querySelector('.service-card__image')),metaTitle:box(h).y-box(meta).bottom,titleParagraph:box(p).y-box(h).bottom,paragraphActions:box(actions).y-box(p).bottom,buttonGap:box(actions.children[1]).y-box(actions.children[0]).bottom};
  });
  return {viewport:innerWidth,gutter:parseFloat(getComputedStyle(document.querySelector('.services-section')).paddingLeft),sectionPadding:parseFloat(getComputedStyle(document.querySelector('.services-section')).paddingTop),grid:data(document.querySelector('.services-grid')),cards,
    buttons:[...document.querySelectorAll('.technical-cta')].map(e=>{const r=box(e),parts=[...e.querySelectorAll(':scope > span,:scope > .cta-arrow')].map(box);const left=Math.min(...parts.map(p=>p.x)),right=Math.max(...parts.map(p=>p.right)),top=Math.min(...parts.map(p=>p.y)),bottom=Math.max(...parts.map(p=>p.bottom));return{compact:e.classList.contains('technical-cta--compact'),...data(e),centerX:(left+right)/2-(r.x+r.width/2),centerY:(top+bottom)/2-(r.y+r.height/2)}}),
    nav:[...document.querySelectorAll('.nav-links > a:not(.nav-budget),.nav-dropdown > button')].map(data),budget:data(document.querySelector(innerWidth<1024?'.nav-budget--mobile':'.nav-budget--desktop')),
    submenu:[...document.querySelectorAll('.nav-dropdown__panel a')].map(data),
    loaded:[...document.fonts].filter(f=>f.family.includes('Barlow')&&f.status==='loaded').map(f=>({family:f.family,weight:f.weight})),
    hero:data(document.querySelector('h1')),bodyFont:getComputedStyle(document.querySelector('.service-card__body p')).fontFamily,
    technicalFont:getComputedStyle(document.querySelector('.service-card__meta')).fontFamily,
    overflow:document.documentElement.scrollWidth>document.documentElement.clientWidth+1};
}
try {
  await send('Page.enable'); await send('DOM.enable'); await send('CSS.enable');
  await send('Emulation.setEmulatedMedia', { features:[{name:'prefers-reduced-motion',value:'reduce'}] });
  for (const width of [320,360,390,430,767,768,1023,1024,1199,1200,1440,1920]) {
    await send('Page.bringToFront');
    await send('Emulation.setDeviceMetricsOverride',{width,height:900,deviceScaleFactor:1,mobile:false});
    const ready=new Promise(r=>{loaded=r;}); await send('Page.navigate',{url:base}); await ready;
    await evaluate(`(async()=>{await document.fonts.ready;document.querySelectorAll('img').forEach(i=>i.loading='eager');await Promise.all([...document.images].map(i=>i.decode().catch(()=>{})))})()`);
    await wait(300);
    const m=await evaluate(`(${measure.toString()})()`);
    const desktop=width>=1200,mobile=width<768,small=width<360;
    const font=desktop?30:mobile?(small?24:26):28, line=desktop?1.08:mobile?1.12:1.1;
    assert.equal(m.overflow,false); assert.ok(m.hero.fontFamily.includes('Esperano'));
    assert.ok(m.bodyFont.includes('Roboto')); assert.ok(m.technicalFont.includes('Montserrat'));
    assert.deepEqual(m.loaded.map(f=>f.weight).sort(),['600','700']);
    near(m.gutter,desktop?Math.min(104,width*.06):mobile?(small?20:24):Math.max(32,Math.min(72,width*.0926-39.12)),'gutter');
    near(m.sectionPadding,desktop?112:mobile?(small?72:80):96,'section padding');
    near(parseFloat(m.grid.gap),mobile?16:24,'card gap');
    for (const c of m.cards) {
      for (const side of ['Top','Right','Bottom','Left']) near(parseFloat(c.body['padding'+side]),small?20:24,'card padding');
      assert.ok(c.title.fontFamily.includes('Barlow Semi Condensed')); assert.equal(c.title.fontWeight,'700');
      near(parseFloat(c.title.fontSize),font,'title size'); near(parseFloat(c.title.lineHeight),font*line,'title leading'); near(parseFloat(c.title.letterSpacing),font*-.015,'title tracking');
      near(parseFloat(c.title.minHeight),desktop?64.8:0,'title reserved height'); assert.equal(c.title.textTransform,'uppercase'); assert.equal(c.title.clipped,false);
      near(parseFloat(c.meta.paddingBottom),16,'metadata padding'); near(c.metaTitle,24,'metadata to title'); near(c.titleParagraph,16,'title to paragraph');
      assert.ok(c.paragraphActions>=23.9,'paragraph to actions minimum 24, remaining flex space aligns desktop actions'); near(c.buttonGap,12,'button gap');
      if (desktop) assert.ok(c.title.lines<=2,'desktop title fits two lines');
      if (!mobile&&!desktop) { near(c.body.box.width/c.image.box.width,1.15,'horizontal card ratio'); near(c.body.box.y,c.image.box.y,'horizontal card alignment'); }
      else near(c.body.box.y,c.image.box.bottom,'vertical card alignment');
    }
    for (const b of m.buttons.filter(b=>b.box.width>0)) { near(b.centerX,0,'button content centered horizontally'); near(b.centerY,0,'button content centered vertically'); }
    if(desktop) for(const c of m.cards.slice(1)){near(c.paragraph.box.y,m.cards[0].paragraph.box.y,'aligned descriptions');near(c.actions.box.bottom,m.cards[0].actions.box.bottom,'aligned actions');}
    for(const b of m.buttons){assert.ok(b.fontFamily.includes('Barlow Semi Condensed'));assert.equal(b.fontWeight,'600');near(parseFloat(b.fontSize),14,'button font');near(parseFloat(b.lineHeight),18.2,'button leading');near(parseFloat(b.letterSpacing),.56,'button tracking');near(parseFloat(b.minHeight),b.compact?48:56,'button height');near(parseFloat(b.paddingTop),b.compact?12:16,'button padding y');near(parseFloat(b.paddingLeft),b.compact?20:24,'button padding x');assert.equal(b.justifyContent,'center');assert.equal(b.textAlign,'center');}
    for(const n of m.nav){assert.ok(n.fontFamily.includes('Barlow'));near(parseFloat(n.fontSize),width<1024?17:13,'nav font');near(parseFloat(n.lineHeight),(width<1024?17:13)*1.3,'nav leading');near(parseFloat(n.paddingTop),16,'nav y');near(parseFloat(n.paddingLeft),width<1024?24:0,'nav x');}
    near(parseFloat(m.budget.fontSize),width<1024?14:13,'budget font');near(parseFloat(m.budget.paddingLeft),width<1024?24:16,'budget x');near(parseFloat(m.budget.paddingTop),width<1024?16:12,'budget y');near(parseFloat(m.budget.minHeight),width<1024?56:48,'budget height');
    const doc=await send('DOM.getDocument');const node=await send('DOM.querySelector',{nodeId:doc.root.nodeId,selector:'.service-card h3 a'});const fonts=await send('CSS.getPlatformFontsForNode',{nodeId:node.nodeId});
    assert.ok(fonts.fonts.some(f=>f.familyName==='Barlow Semi Condensed'&&f.isCustomFont&&f.glyphCount>0),'actual rendered Barlow glyphs');m.renderedFonts=fonts.fonts;
    const actionNode=await send('DOM.querySelector',{nodeId:doc.root.nodeId,selector:'.service-card .technical-cta span'});const actionFonts=await send('CSS.getPlatformFontsForNode',{nodeId:actionNode.nodeId});
    assert.ok(actionFonts.fonts.some(f=>f.familyName.startsWith('Barlow Semi Condensed')&&f.isCustomFont&&f.glyphCount>0),'actual rendered Barlow action glyphs: '+JSON.stringify(actionFonts));m.renderedActionFonts=actionFonts.fonts;
    await screenshot(`${width}-header`);
    await evaluate(`document.querySelector('.services-section').scrollIntoView({behavior:'instant'})`);
    const clip=await evaluate(`(()=>{const r=document.querySelector('.services-section').getBoundingClientRect();return{x:0,y:Math.max(0,r.y+scrollY),width:innerWidth,height:r.height}})()`);
    await screenshot(`${width}-services`,clip);
    if(width<1024){await evaluate(`window.scrollTo({top:0,behavior:'instant'});document.querySelector('[data-menu-toggle]').click()`);await wait(400);await screenshot(`${width}-menu`);assert.equal(await evaluate(`document.querySelector('[data-menu-toggle]').getAttribute('aria-expanded')`),'true');for(const a of m.submenu)near(parseFloat(a.fontSize),14,'submenu font');}
    report.push({width,...m});writeFileSync(join(out,'typography.json'),JSON.stringify(report,null,2));
    console.log(`PASS ${width}: title ${font}/${line}, padding ${small?20:24}, gutter ${m.gutter}, sections ${m.sectionPadding}, lines ${m.cards.map(c=>c.title.lines).join('/')}`);
  }
} finally { await send('Page.close').catch(()=>{}); ws.close(); }
