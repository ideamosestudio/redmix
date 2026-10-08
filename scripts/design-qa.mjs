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
await send('Page.enable'); await send('Runtime.enable'); await send('Log.enable');
const routes = ['', 'quienes-somos/', 'contacto/', 'servicios/hormigon-elaborado/', 'servicios/acarreo-bomba/', 'servicios/bombeo-hormigon/'];
const widths = (process.env.QA_WIDTHS || '320,360,390,430,768,1024,1440,1920').split(',').map(Number);
for (const width of widths) {
  await send('Emulation.setDeviceMetricsOverride', { width, height: 900, deviceScaleFactor: 1, mobile: false });
  for (const route of routes) {
    errors.length = 0;
    await send('Page.bringToFront');
    const loaded = new Promise(r => { loadedResolve = r; });
    await send('Page.navigate', { url: base + route });
    await loaded;
    await evaluate(`(async()=>{await document.fonts.ready;document.querySelectorAll('img').forEach(i=>i.loading='eager');await Promise.all([...document.images].map(i=>i.decode().catch(()=>{})));window.scrollTo(0,0)})()`);
    await new Promise(r => setTimeout(r, 850));
    const metrics = await evaluate(`(()=>{
      const box=e=>{const s=getComputedStyle(e),r=e.getBoundingClientRect();return {selector:e.className,tag:e.tagName,left:r.left,top:r.top,width:r.width,height:r.height,padding:s.padding,margin:s.margin,gap:s.gap,font:s.fontSize,lineHeight:s.lineHeight,fontFamily:s.fontFamily,fontWeight:s.fontWeight,letterSpacing:s.letterSpacing}};
      return {viewport:innerWidth,document:document.documentElement.clientWidth,scroll:document.documentElement.scrollWidth,
        boxes:[...document.querySelectorAll('.section-shell,.page-hero,.final-cta__inner,.final-cta,.contact-form,.hero-copy,.nav-budget--mobile,.technical-cta,.text-link,h1,h2')].map(box),
        fonts:[...document.fonts].filter(f=>f.family.includes('Barlow')&&f.status==='loaded').map(f=>({family:f.family,weight:f.weight})),
        overflow:[...document.querySelectorAll('h1,h2,h3,p,input,textarea,.technical-cta,.service-card,.product-card')].filter(e=>{const r=e.getBoundingClientRect();return r.width && (r.right>document.documentElement.clientWidth+1||r.left< -1||e.scrollWidth>e.clientWidth+2)}).map(e=>({text:e.textContent.slice(0,100),...box(e)})),
        links:[...document.querySelectorAll('a[href^="https://wa.me"],a[href^="tel:"],a[href^="mailto:"]')].map(e=>e.getAttribute('href')),
        canvas:[...document.querySelectorAll('canvas.hero-canvas')].map(c=>({width:c.width,height:c.height,webgl:!!c.getContext('webgl2')})),
        images:[...document.images].filter(i=>!i.complete||!i.naturalWidth).map(i=>i.src)};
    })()`);
    const slug = route.replaceAll('/', '-') || 'home';
    const screenshot = await send('Page.captureScreenshot', { format: 'png', captureBeyondViewport: true, clip: { x: 0, y: 0, width, height: await evaluate('document.documentElement.scrollHeight'), scale: 1 } });
    writeFileSync(join(out, `${width}-${slug}.png`), Buffer.from(screenshot.data, 'base64'));
    report.push({ width, route, ...metrics, errors: [...errors] });
    writeFileSync(join(out, 'report.json'), JSON.stringify(report, null, 2));
    console.log(`${width} ${route || 'home'} overflow=${metrics.overflow.length} errors=${errors.length}`);
  }
}
writeFileSync(join(out, 'report.json'), JSON.stringify(report, null, 2));
} finally {
  await send('Page.close').catch(()=>{}); ws.close();
}
