// Smooth only desktop wheel input; other ways of navigating remain native.
const finePointer = matchMedia('(pointer:fine)');
const reducedMotion = matchMedia('(prefers-reduced-motion:reduce)');
let frame = 0, target = scrollY, lastTime = 0, written = scrollY, direction = 0;
const limit = () => Math.max(0, document.documentElement.scrollHeight - innerHeight);
const clamp = value => Math.max(0, Math.min(limit(), value));
function stop() {
 cancelAnimationFrame(frame); frame = 0; lastTime = 0; direction = 0;
 target = written = scrollY;
}
function nativeArea(event) {
 if (document.body.classList.contains('menu-open')) return true;
 return event.composedPath().some(node => {
  if (!(node instanceof Element) || node === document.body || node === document.documentElement) return false;
  if (node.matches('input,textarea,select,[contenteditable]:not([contenteditable="false"]),dialog,[role="dialog"],[data-native-scroll]')) return true;
  const style = getComputedStyle(node);
  return /(auto|scroll|overlay)/.test(style.overflowY) && node.scrollHeight > node.clientHeight + 1;
 });
}
function tick(time) {
 const dt = lastTime ? Math.min(40, time - lastTime) : 16;
 lastTime = time; target = clamp(target);
 const next = scrollY + (target - scrollY) * (1 - Math.exp(-dt / 115));
 written = Math.abs(target - next) < .8 ? target : next;
 window.scrollTo({top:written, behavior:'instant'});
 written = scrollY;
 if (Math.abs(target - scrollY) < 1) { stop(); return; }
 frame = requestAnimationFrame(tick);
}
window.addEventListener('wheel', event => {
 if (!finePointer.matches || reducedMotion.matches || innerWidth < 1024 || !event.cancelable || event.ctrlKey || event.metaKey || event.altKey || event.shiftKey || !event.deltaY || Math.abs(event.deltaX) > Math.abs(event.deltaY) || nativeArea(event)) { stop(); return; }
 const delta = event.deltaY * (event.deltaMode === 1 ? 18 : event.deltaMode === 2 ? innerHeight : 1);
 // Pixel-precise trackpad movement already carries native inertia.
 if (event.deltaMode === 0 && Math.abs(delta) < 45) { stop(); return; }
 const nextDirection = Math.sign(delta);
 if (!frame || direction !== nextDirection) target = scrollY;
 direction = nextDirection;
 target = clamp(target + Math.max(-240, Math.min(240, delta * .85)));
 if (Math.abs(target - scrollY) < 1) { stop(); return; }
 event.preventDefault();
 if (!frame) { written = scrollY; frame = requestAnimationFrame(tick); }
}, {passive:false});
window.addEventListener('scroll', () => { if (frame && Math.abs(scrollY - written) > 3) stop(); }, {passive:true});
for (const type of ['pointerdown','touchstart','keydown','resize','blur']) window.addEventListener(type, stop, {passive:true});
document.addEventListener('visibilitychange', stop);
finePointer.addEventListener('change', stop);
reducedMotion.addEventListener('change', stop);
