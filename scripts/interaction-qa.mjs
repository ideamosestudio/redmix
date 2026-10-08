import assert from 'node:assert/strict';
import { mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
const out = process.env.QA_OUT;
if (!out) throw new Error('Set QA_OUT.');
mkdirSync(out, { recursive: true });
const base = process.env.QA_BASE || 'http://127.0.0.1:4322/redmix/';
const target = await fetch(`http://127.0.0.1:${process.env.QA_CDP_PORT || 9223}/json/new?about:blank`, { method: 'PUT' }).then(r => r.json());
const ws = new WebSocket(target.webSocketDebuggerUrl);
await new Promise(r => ws.addEventListener('open', r, { once: true }));
let id = 0, loadedResolve;
const pending = new Map(), checks = [];
ws.onmessage = e => { const m = JSON.parse(e.data); if (m.method==='Page.loadEventFired') loadedResolve?.(); if (pending.has(m.id)) { pending.get(m.id)(m); pending.delete(m.id); } };
const send = (method, params = {}) => new Promise((resolve, reject) => {
  const n = ++id, timer = setTimeout(() => reject(new Error(method)), 30000);
  pending.set(n, m => { clearTimeout(timer); m.error ? reject(new Error(JSON.stringify(m.error))) : resolve(m.result); });
  ws.send(JSON.stringify({ id: n, method, params }));
});
const evaluate = async expression => (await send('Runtime.evaluate', { expression, returnByValue: true, awaitPromise: true })).result.value;
const wait = ms => new Promise(r => setTimeout(r, ms));
const check = (name, value) => { assert.ok(value, name); checks.push(name); console.log('PASS ' + name); };
const navigate = async (route, width, height = 900) => {
  await send('Page.bringToFront');
  await send('Emulation.setDeviceMetricsOverride', { width, height, deviceScaleFactor: 1, mobile: false });
  const loaded = new Promise(r => { loadedResolve = r; });
  await send('Page.navigate', { url: base + route }); await loaded;
  await evaluate('document.fonts.ready.then(()=>true)'); await wait(1000);
  check(`viewport ${route || 'home'} ${width}`, await evaluate('innerWidth') === width);
};
const point = selector => evaluate(`(()=>{const e=document.querySelector(${JSON.stringify(selector)});e.scrollIntoView({block:'center',behavior:'instant'});const r=e.getBoundingClientRect();return{x:r.x+r.width/2,y:r.y+r.height/2}})()`);
const click = async selector => { const p = await point(selector); await send('Input.dispatchMouseEvent', { type: 'mousePressed', button: 'left', clickCount: 1, ...p }); await send('Input.dispatchMouseEvent', { type: 'mouseReleased', button: 'left', clickCount: 1, ...p }); };
const screenshot = async name => { const s = await send('Page.captureScreenshot', { format: 'png' }); writeFileSync(join(out, name + '.png'), Buffer.from(s.data, 'base64')); };
try {
await send('Page.enable');
for (const width of [320,360,390,430,768]) {
  await navigate('', width);
  await click('[data-menu-toggle]'); await wait(650);
  const menu = await evaluate(`(()=>{const e=document.querySelector('.nav-budget--mobile'),s=getComputedStyle(e);return{padding:s.padding,height:e.offsetHeight,visible:s.opacity,open:document.querySelector('[data-menu-toggle]').getAttribute('aria-expanded'),inert:document.querySelector('main').inert,overflow:document.documentElement.scrollWidth>innerWidth}})()`);
  console.log(width, menu);
  check(`menu ${width}: 24px padding, touch size, focus isolation`, menu.padding === '16px 24px' && menu.height >= 48 && menu.visible === '1' && menu.open === 'true' && menu.inert && !menu.overflow);
  await screenshot(`menu-${width}`);
  await evaluate(`document.querySelector('.nav-dropdown__panel a').focus()`);
  await send('Input.dispatchKeyEvent', { type: 'keyDown', key: 'Escape', code: 'Escape' });
  check(`menu ${width}: Escape restores focus`, await evaluate(`document.activeElement.matches('[data-menu-toggle]')&&!document.querySelector('main').inert`));
}
await navigate('', 1440);
await evaluate(`document.querySelector('.nav-dropdown > button').focus()`); await wait(250);
check('desktop dropdown keyboard entry', await evaluate(`getComputedStyle(document.querySelector('.nav-dropdown__panel')).visibility==='visible'`));
await evaluate(`document.querySelector('.nav-dropdown__panel a').focus()`);
await send('Input.dispatchKeyEvent', { type: 'keyDown', key: 'Escape', code: 'Escape' }); await wait(600);
console.log('dropdown after Escape',await evaluate(`({cls:document.querySelector('.nav-dropdown').className,visibility:getComputedStyle(document.querySelector('.nav-dropdown__panel')).visibility,focus:document.activeElement.tagName})`));
check('desktop dropdown Escape', await evaluate(`getComputedStyle(document.querySelector('.nav-dropdown__panel')).visibility==='hidden'`));
for (const selector of ['.hero-actions .technical-cta--solid','.hero-actions .technical-cta:not(.technical-cta--solid)']) {
  const p = await point(selector);
  const before = await evaluate(`(()=>{const e=document.querySelector(${JSON.stringify(selector)}),s=getComputedStyle(e);return{width:e.offsetWidth,height:e.offsetHeight,tracking:s.letterSpacing}})()`);
  await send('Input.dispatchMouseEvent', { type: 'mouseMoved', ...p }); await wait(600);
  const after = await evaluate(`(()=>{const e=document.querySelector(${JSON.stringify(selector)}),s=getComputedStyle(e);return{width:e.offsetWidth,height:e.offsetHeight,tracking:s.letterSpacing,tick:getComputedStyle(e.querySelector('.tick')).width,transform:s.transform}})()`);
  check(`${selector}: hover stable layout/tracking + 13px corners`, before.width===after.width && before.height===after.height && before.tracking===after.tracking && after.tick==='13px');
  await send('Input.dispatchMouseEvent', { type: 'mousePressed', button: 'left', clickCount: 1, ...p }); await wait(150);
  check(`${selector}: active scale`, await evaluate(`getComputedStyle(document.querySelector(${JSON.stringify(selector)})).transform.includes('0.985')`));
  // Cancel the press off-target: do not navigate or contact WhatsApp.
  await send('Input.dispatchMouseEvent', { type: 'mouseMoved', x: 2, y: 100 });
  await send('Input.dispatchMouseEvent', { type: 'mouseReleased', button: 'left', clickCount: 1, x: 2, y: 100 });
  await evaluate(`document.querySelector(${JSON.stringify(selector)}).focus()`);
  await send('Input.dispatchKeyEvent', { type: 'keyDown', key: 'Tab', code: 'Tab', modifiers: 8 });
}
await navigate('servicios/hormigon-elaborado/',390);
await click('.faq-item summary'); await wait(300);
check('FAQ opens without padding mutation', await evaluate(`document.querySelector('.faq-item').open && getComputedStyle(document.querySelector('.faq-item')).paddingLeft==='0px'`));
await click('.faq-item summary'); await wait(300);
check('FAQ closes', await evaluate(`!document.querySelector('.faq-item').open`));
await navigate('contacto/',390);
await evaluate(`document.querySelector('.contact-form').scrollIntoView({block:'center',behavior:'instant'})`); await wait(200);
check('WhatsApp does not cover the mobile form', await evaluate(`getComputedStyle(document.querySelector('.floating-whatsapp')).visibility==='hidden'`));
check('form native required validation', await evaluate(`!document.querySelector('form').checkValidity()`));
await evaluate(`document.querySelector('[name=name]').value='QA local';document.querySelector('[name=phone]').value='1138245680';document.querySelector('[name=message]').value='Prueba local sin envío';document.querySelector('[name=name]').focus()`);
check('form valid, 16px input, min 48px touch height', await evaluate(`document.querySelector('form').checkValidity() && getComputedStyle(document.querySelector('input')).fontSize==='16px' && document.querySelector('input').offsetHeight>=48`));
await screenshot('contact-focus-390');
await send('Emulation.setEmulatedMedia', { features: [{ name: 'prefers-reduced-motion', value: 'reduce' }] });
for (const route of ['', 'quienes-somos/']) {
  await navigate(route,1440);
  const capture = () => send('Page.captureScreenshot',{format:'png'});
  const a = await capture(); await wait(400); const b = await capture();
  check(`reduced motion static canvas ${route || 'home'}`, a.data===b.data);
  check(`reduced motion no running animations ${route || 'home'}`, await evaluate(`document.getAnimations().filter(a=>a.playState==='running').length===0`));
  await screenshot(`reduced-${route ? 'about' : 'home'}`);
}
await send('Emulation.setEmulatedMedia',{features:[{name:'prefers-reduced-motion',value:'no-preference'}]}); await wait(1200);
const a = await send('Page.captureScreenshot',{format:'png'}); await wait(400); const b = await send('Page.captureScreenshot',{format:'png'});
check('Three.js resumes after preference change',a.data!==b.data);
await navigate('',390,600); await screenshot('home-short-390');
check('short viewport has accessible non-overlapping hero flow',await evaluate(`(()=>{const a=document.querySelector('.hero-copy').getBoundingClientRect(),b=document.querySelector('.hero-object').getBoundingClientRect(),c=document.querySelector('.hero-mobile-action').getBoundingClientRect();return a.bottom<=b.top+1&&b.bottom<=c.top+1})()`));
await send('Emulation.setScriptExecutionDisabled',{value:true});
await navigate('quienes-somos/',390); await screenshot('no-js-about-390');
check('content and correct experience visible without JS',await evaluate(`getComputedStyle(document.querySelector('h1')).opacity==='1' && document.querySelector('[data-experience-counter]').textContent==='+20'`));
await send('Emulation.setScriptExecutionDisabled',{value:false});
writeFileSync(join(out,'interactions.json'),JSON.stringify(checks,null,2));
} finally {
  await send('Page.close').catch(()=>{}); ws.close();
}
