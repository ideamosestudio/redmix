// Run against a local preview. Chrome must expose CDP on QA_CDP_PORT (default 9223).
// QA_OUT is outside the source tree; no form submission or external link is triggered.
import { mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
const base = process.env.QA_BASE || 'http://127.0.0.1:4321/redmix/';
const out = process.env.QA_OUT;
if (!out) throw new Error('Set QA_OUT to the screenshot/report directory.');
mkdirSync(out, { recursive: true });
const target = await fetch(`http://127.0.0.1:${process.env.QA_CDP_PORT || 9223}/json/new?about:blank`, { method: 'PUT' }).then(r => r.json());
const ws = new WebSocket(target.webSocketDebuggerUrl);
await new Promise(r => ws.addEventListener('open', r, { once: true }));
let id = 0, loadedResolve;
const pending = new Map(), errors = [], report = [];
ws.onmessage = event => {
  const message = JSON.parse(event.data);
  if (message.method === 'Page.loadEventFired') loadedResolve?.();
  if (pending.has(message.id)) { pending.get(message.id)(message); pending.delete(message.id); }
  if (message.method === 'Runtime.exceptionThrown') errors.push(message.params.exceptionDetails.text + ': ' + message.params.exceptionDetails.exception?.description);
  if (message.method === 'Log.entryAdded' && message.params.entry.level === 'error') errors.push(message.params.entry.text);
};
const send = (method, params = {}) => new Promise((resolve, reject) => {
  const number = ++id;
  const timer = setTimeout(() => { pending.delete(number); reject(new Error(`Timeout: ${method}`)); }, 30000);
  pending.set(number, message => { clearTimeout(timer); message.error ? reject(new Error(JSON.stringify(message.error))) : resolve(message.result); });
  ws.send(JSON.stringify({ id: number, method, params }));
});
const evaluate = async expression => (await send('Runtime.evaluate', { expression, returnByValue: true, awaitPromise: true })).result.value;

try {
 await send('Page.enable');await send('Runtime.enable');await send('Log.enable');
 for(const width of [390,1366]) {
  await send('Emulation.setDeviceMetricsOverride',{width,height:900,deviceScaleFactor:1,mobile:width<768});
  const loaded=new Promise(r=>loadedResolve=r);await send('Page.navigate',{url:base});await loaded;await new Promise(r=>setTimeout(r,1000));
  if(!await evaluate("document.querySelector('video') && document.querySelector('h1') && document.documentElement.scrollWidth<=innerWidth"))throw Error('Home layout');
  if(!await evaluate("document.querySelector('.truck-poster img').complete && document.querySelector('.truck-poster img').naturalWidth > 0"))throw Error('Hero poster not loaded');
  if(width===390 && !await evaluate("document.querySelector('.truck-poster img').currentSrc.includes('760.webp')"))throw Error('Mobile poster source');
  const screenshot = await send('Page.captureScreenshot',{format:'png'});
  writeFileSync(join(out,'home-'+width+'.png'),Buffer.from(screenshot.data,'base64'));
  if(width===390){await evaluate("document.querySelector('[data-menu-toggle]').click()");await new Promise(r=>setTimeout(r,500));if(!await evaluate("document.body.classList.contains('menu-open')"))throw Error('Menu');await send('Input.dispatchKeyEvent',{type:'keyDown',key:'Escape',code:'Escape',windowsVirtualKeyCode:27});await new Promise(r=>setTimeout(r,500));}
  await evaluate("document.querySelector('[data-quote-service]').click()");if(!await evaluate("document.querySelector('.quote-guide__cta').href.includes('hormig')"))throw Error('Quote');
  await evaluate("document.querySelector('.site-footer').scrollIntoView({behavior:'instant'})");await new Promise(r=>setTimeout(r,800));
  if(!await evaluate("getComputedStyle(document.querySelector('.contact-form')).overflowY==='visible'"))throw Error('Form scrollbar');
  for(const selector of ['.footer-contact-link','.footer-nav-links a','.footer-editorial-services a']) {
   if(width===390)continue;
   await evaluate(`document.querySelector('${selector}').scrollIntoView({block:'center',behavior:'instant'})`);await new Promise(r=>setTimeout(r,100));
   const pos=await evaluate(`(()=>{const r=document.querySelector('${selector}').getBoundingClientRect();return{x:r.x+20,y:r.y+r.height/2}})()`);await send('Input.dispatchMouseEvent',{type:'mouseMoved',...pos});
   if(!await evaluate(`getComputedStyle(document.querySelector('${selector}')).textDecorationLine==='none'`))throw Error('Hover underline');
  }
  await send('Emulation.setEmulatedMedia',{features:[{name:'prefers-reduced-motion',value:'reduce'}]});await new Promise(r=>setTimeout(r,300));
  if(!await evaluate("document.querySelector('video').paused&&getComputedStyle(document.querySelector('.footer-orbit__ring')).animationName==='none'"))throw Error('Reduced motion');
  await send('Emulation.setEmulatedMedia',{features:[{name:'prefers-reduced-motion',value:'no-preference'}]});
  if(errors.length)throw Error(errors.join('\n'));
  console.log('PASS home, menu, quote, hover, form, reduced motion and CSP '+width);
 }
}finally{await send('Page.close').catch(()=>{});ws.close();}