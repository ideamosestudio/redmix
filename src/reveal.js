// One observer, compositor-only transitions, and no scroll-position polling.
const reduced = matchMedia('(prefers-reduced-motion: reduce)');
const mobile = matchMedia('(max-width: 1023px), (pointer: coarse)');
const active = new Set();
const countFrames = new Set();
function reveal(element, delay = 0, fade = false) {
  if (!element || reduced.matches) return;
  // Mobile content remains fully visible; no delayed reveal during touch scrolling.
  if (mobile.matches) return;
  const animation = element.animate([
    { transform: 'translateY(16px)', opacity: fade ? .35 : 1 },
    { transform: 'translateY(0)', opacity: 1 },
  ], { duration: 600, delay, easing: 'cubic-bezier(.22,1,.36,1)' });
  active.add(animation);
  animation.finished.catch(() => {}).finally(() => active.delete(animation));
}
const observer = new IntersectionObserver(entries => {
  for (const entry of entries) {
    if (!entry.isIntersecting) continue;
    const element = entry.target;
    observer.unobserve(element);
    if (reduced.matches) continue;
    if (element.matches('[data-experience-counter]')) {
      const start = performance.now();
      const tick = time => {
        countFrames.delete(frame);
        const progress = Math.min(1, (time - start) / 1200);
        element.textContent = `+${Math.round(20 * (1 - (1 - progress) ** 3))}`;
        if (progress < 1) { frame = requestAnimationFrame(tick); countFrames.add(frame); }
      };
      let frame = requestAnimationFrame(tick); countFrames.add(frame);
    } else if (element.matches('[data-stagger]')) {
      element.querySelectorAll('[data-card]').forEach((card, index) => reveal(card, index * 80));
    } else reveal(element, 0, element.matches('.section-heading'));
  }
}, { rootMargin: '0px 0px 160px 0px' });
document.querySelectorAll('[data-reveal], [data-stagger], [data-experience-counter], .work-sequence__item').forEach(element => {
  // Hero text is visible immediately; translations do not delay its paint.
  if (element.matches('.page-hero__copy')) {
    [...element.children].forEach((child, index) => reveal(child, index * 70));
  } else observer.observe(element);
});
document.querySelectorAll('.concept-copy > *').forEach((element, index) => reveal(element, index * 80));
reduced.addEventListener('change', () => {
  if (!reduced.matches) return;
  active.forEach(animation => animation.cancel());
  countFrames.forEach(cancelAnimationFrame); countFrames.clear();
  document.querySelectorAll('[data-experience-counter]').forEach(element => { element.textContent = '+20'; });
});