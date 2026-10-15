// Chrome CDP test: run separately from Lighthouse to avoid measurement contention.
import assert from 'node:assert/strict';
const base = process.env.QA_BASE || 'http://127.0.0.1:4321/';
const tab = await fetch(`http://127.0.0.1:${process.env.QA_CDP_PORT || 9223}/json/new?about:blank`, { method: 'PUT' }).then(r => r.json());
const ws = new WebSocket(tab.webSocketDebuggerUrl);
await new Promise(resolve => ws.addEventListener('open', resolve, { once: true }));
let id = 0;
const pending = new Map();
ws.onmessage = ({ data }) => {
  const message = JSON.parse(data), handler = pending.get(message.id);
  if (handler) { pending.delete(message.id); handler(message); }
};
function send(method, params = {}) {
  return new Promise((resolve, reject) => {
    const number = ++id;
    const timer = setTimeout(() => { pending.delete(number); reject(new Error(method + ' timed out')); }, 15000);
    pending.set(number, response => { clearTimeout(timer); response.error ? reject(new Error(JSON.stringify(response.error))) : resolve(response.result); });
    ws.send(JSON.stringify({ id: number, method, params }));
  });
}
const evaluate = async expression => {
  const response = await send('Runtime.evaluate', { expression, returnByValue: true, awaitPromise: true });
  if (response.exceptionDetails) throw new Error(response.exceptionDetails.text);
  return response.result.value;
};
const wait = ms => new Promise(resolve => setTimeout(resolve, ms));
const wheel = deltaY => send('Input.dispatchMouseEvent', { type: 'mouseWheel', x: 600, y: 400, deltaX: 0, deltaY });
try {
  await send('Page.enable');
  await send('Emulation.setDeviceMetricsOverride', { width: 1366, height: 900, deviceScaleFactor: 1, mobile: false });
  await send('Page.navigate', { url: base });
  await wait(2000);
  assert.equal(await evaluate('document.documentElement.scrollWidth <= innerWidth'), true);
  await evaluate("document.querySelectorAll('img').forEach(i => i.loading = 'eager'); window.scrollTo({top:1000,behavior:'instant'})");
  await wait(1000);
  await evaluate('window.wheelSamples=[]; window.wheelSampling=true; requestAnimationFrame(function sample(t){wheelSamples.push({t,y:scrollY});if(wheelSampling)requestAnimationFrame(sample)})');
  const start = await evaluate('scrollY');
  await wheel(120);
  await wait(1300);
  const samples = await evaluate('wheelSampling=false;wheelSamples');
  const distance = samples.at(-1).y - start;
  const maxStep = Math.max(...samples.slice(1).map((item, i) => Math.abs(item.y - samples[i].y)));
  assert.ok(distance > 50 && distance < 90, `Slower travel: ${distance}`);
  assert.ok(samples.slice(1).every((item, i) => item.y >= samples[i].y), 'Monotonic downward motion');
  assert.ok(maxStep < 35, `No abrupt step: ${maxStep}`);
  await wheel(120); await wait(100); const reverseAt = await evaluate('scrollY');
  await wheel(-120); await wait(700);
  assert.ok(await evaluate('scrollY') < reverseAt, 'Prompt reversal');
  await wheel(120); await wait(60);
  await send('Input.dispatchKeyEvent', { type: 'keyDown', key: 'Escape', code: 'Escape' });
  const stopped = await evaluate('scrollY'); await wait(350);
  assert.ok(Math.abs(await evaluate('scrollY') - stopped) <= 1, 'Keyboard cancels residual motion');
  // Synthetic cancelable events verify that exclusions are not intercepted.
  const exclusions = await evaluate(`(()=>{
    const test=(node,options={})=>{const e=new WheelEvent('wheel',{deltaY:120,bubbles:true,cancelable:true,...options});node.dispatchEvent(e);return !e.defaultPrevented};
    const textarea=document.querySelector('textarea');
    const nested=document.createElement('div');nested.style.cssText='height:20px;overflow:auto';nested.innerHTML='<div style="height:200px"></div>';document.body.append(nested);
    const result={textarea:test(textarea),zoom:test(document.body,{ctrlKey:true}),horizontal:test(document.body,{deltaX:200}),trackpad:test(document.body,{deltaY:8}),nested:test(nested.firstChild)};
    document.body.classList.add('menu-open');result.menu=test(document.body);document.body.classList.remove('menu-open');nested.remove();return result;
  })()`);
  assert.ok(Object.values(exclusions).every(Boolean), JSON.stringify(exclusions));
  await send('Emulation.setEmulatedMedia', { features: [{ name: 'prefers-reduced-motion', value: 'reduce' }] });
  assert.equal(await evaluate("(()=>{const e=new WheelEvent('wheel',{deltaY:120,bubbles:true,cancelable:true});document.body.dispatchEvent(e);return e.defaultPrevented})()"), false);
  await send('Emulation.setEmulatedMedia', { features: [{ name: 'prefers-reduced-motion', value: 'no-preference' }] });
  await send('Emulation.setDeviceMetricsOverride', { width: 390, height: 844, deviceScaleFactor: 1, mobile: true });
  assert.equal(await evaluate("(()=>{const e=new WheelEvent('wheel',{deltaY:120,bubbles:true,cancelable:true});document.body.dispatchEvent(e);return e.defaultPrevented})()"), false);
  console.log(JSON.stringify({ pass: true, distance, maxStep, exclusions, reducedMotion: 'native', mobile: 'native' }));
} finally {
  await send('Page.close').catch(() => {});
  ws.close();
}
