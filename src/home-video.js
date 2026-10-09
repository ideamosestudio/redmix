const section = document.querySelector('[data-concept]');
const video = section?.querySelector('video');
const button = section?.querySelector('[data-motion-toggle]');
const reduced = matchMedia('(prefers-reduced-motion: reduce)');
const connection = navigator.connection;
let paused = reduced.matches || Boolean(connection?.saveData);
let visible = false;
let ready = document.readyState === 'complete';
function sync() {
 if (!video || !button) return;
 button.textContent = (paused ? 'Reproducir' : 'Pausar') + ' rotación';
 button.setAttribute('aria-pressed', String(paused));
 if (paused || !visible || document.hidden || !ready) video.pause();
 else video.play().catch(() => { paused = true; sync(); });
}
button?.addEventListener('click', () => { paused = !paused; ready = true; sync(); });
reduced.addEventListener('change', () => { paused = reduced.matches; sync(); });
document.addEventListener('visibilitychange', sync);
window.addEventListener('load', () => { ready = true; sync(); }, { once: true });
if (section) new IntersectionObserver(([entry]) => { visible = entry.isIntersecting; sync(); }).observe(section);
sync();
