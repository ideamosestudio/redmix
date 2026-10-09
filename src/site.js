import './smooth-wheel.js';
import './reveal.js';

const motionPreference = window.matchMedia('(prefers-reduced-motion: reduce)');
const navbar = document.querySelector('[data-navbar]');
const menuToggle = document.querySelector('[data-menu-toggle]');
const menu = document.querySelector('[data-menu]');

const floatingWhatsApp = document.querySelector('.floating-whatsapp');
const protectedControls = [...document.querySelectorAll('.contact-form, .technical-cta, .contact-info, .final-contact-data, .site-footer')];

// Batch geometry reads before style writes to avoid forcing a second layout.
let scrollRange = 0;
const measurePage = () => { scrollRange = Math.max(0, document.documentElement.scrollHeight - innerHeight); };
new ResizeObserver(() => { measurePage(); updateNavbar(); }).observe(document.body);
function updateNavbar() {
  const top = window.scrollY;
  let overlaps = false;
  if (floatingWhatsApp && innerWidth < 768) {
    const floating = floatingWhatsApp.getBoundingClientRect();
    overlaps = protectedControls.some(element => {
      const rect = element.getBoundingClientRect();
      return rect.width && rect.bottom > floating.top - 12 && rect.top < floating.bottom + 12 && rect.right > floating.left - 12 && rect.left < floating.right;
    });
  }
  navbar?.classList.toggle('is-scrolled', top > 24);
  navbar?.style.setProperty('--reading-progress', String(scrollRange > 0 ? Math.min(1, Math.max(0, top / scrollRange)) : 0));
  floatingWhatsApp?.classList.toggle('is-obstructing', overlaps);
}

let navbarFrame = 0;
window.addEventListener('scroll', () => {
  if (navbarFrame) return;
  navbarFrame = requestAnimationFrame(() => { updateNavbar(); navbarFrame = 0; });
}, { passive: true });

function setMenu(open) {
  menuToggle?.setAttribute('aria-expanded', String(open));
  menuToggle?.setAttribute('aria-label', open ? 'Cerrar navegación' : 'Abrir navegación');
  menu?.classList.toggle('is-open', open);
  document.body.classList.toggle('menu-open', open);
  document.querySelectorAll('main,.hero-root,.concept-page,.site-footer').forEach(element => { element.inert = open; });
}
menuToggle?.addEventListener('click', () => setMenu(menuToggle.getAttribute('aria-expanded') !== 'true'));

menu?.querySelectorAll('a').forEach((link) => link.addEventListener('click', () => {
  setMenu(false);
}));

window.addEventListener('keydown', (event) => {
  if (menuToggle?.getAttribute('aria-expanded') !== 'true') return;
  if (event.key === 'Escape') { setMenu(false); menuToggle.focus(); }
  if (event.key === 'Tab') {
    const links = [...navbar.querySelectorAll('a,button')].filter(e => e.getClientRects().length && getComputedStyle(e).visibility !== 'hidden');
    const first = links[0], last = links.at(-1);
    if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
    if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
  }
});

window.addEventListener('resize', () => { if (window.innerWidth >= 1024) setMenu(false); setDropdown(dropdown?.classList.contains('is-open')); updateNavbar(); }, { passive: true });
document.addEventListener('focusin', updateNavbar);
const dropdown = document.querySelector('.nav-dropdown');
const dropdownButton = dropdown?.querySelector('button');
function setDropdown(open) {
  dropdown?.classList.toggle('is-open', open);
  dropdownButton?.setAttribute('aria-expanded', String(open || window.innerWidth < 1024));
}
dropdownButton?.addEventListener('click', () => setDropdown(!dropdown.classList.contains('is-open')));
dropdown?.addEventListener('pointerenter', event => { if (event.pointerType === 'mouse') setDropdown(true); });
dropdown?.addEventListener('pointerleave', () => { if (!dropdown.contains(document.activeElement)) setDropdown(false); });
dropdown?.addEventListener('focusin', () => setDropdown(true));
dropdown?.addEventListener('focusout', event => { if (!dropdown.contains(event.relatedTarget)) setDropdown(false); });
dropdown?.addEventListener('keydown', event => {
  if (event.key === 'Escape' && window.innerWidth >= 1024) {
    event.stopPropagation();
    // Moving focus out of a submenu link fires focusin. Close after that event.
    dropdownButton.focus();
    setDropdown(false);
  }
});
setDropdown(false);

// A single cancellable animation per FAQ; no padding changes on hover/open.
document.querySelectorAll('.faq-item').forEach(details => {
  const summary = details.querySelector('summary');
  let animation, expanded = details.open;
  summary.addEventListener('click', event => {
    if (motionPreference.matches) { expanded = !details.open; return; }
    event.preventDefault();
    const start = details.getBoundingClientRect().height;
    animation?.cancel();
    expanded = !expanded;
    details.open = true;
    const end = expanded ? details.getBoundingClientRect().height : summary.getBoundingClientRect().height + 1;
    details.style.overflow = 'hidden';
    animation = details.animate({ height: [`${start}px`, `${end}px`] }, { duration: 250, easing: 'cubic-bezier(.22,1,.36,1)' });
    animation.onfinish = () => { details.open = expanded; details.style.overflow = ''; animation = null; };
  });
  motionPreference.addEventListener('change', () => { animation?.cancel(); details.open = expanded; details.style.overflow = ''; });
});

document.querySelectorAll('[data-email-form]').forEach((form) => {
  form.addEventListener('submit', (event) => {
    event.preventDefault();
    if (!form.reportValidity()) return;
    const data = new FormData(form);
    const clean = (value) => String(value ?? '').replace(/[<>]/g, '').trim();
    const body = [
      'Hola REDMIX, quisiera realizar una consulta desde el sitio web.', '',
      `Nombre: ${clean(data.get('name'))}`,
      `Teléfono: ${clean(data.get('phone'))}`,
      `Mensaje: ${clean(data.get('message'))}`,
    ].join('\n');
    window.location.href = `mailto:info@redmix.com.ar?subject=${encodeURIComponent('Consulta desde el sitio REDMIX')}&body=${encodeURIComponent(body)}`;
  });
});

// Pointer lighting is local to cards and disabled for touch/reduced motion.
const lightMedia = matchMedia('(hover: hover) and (pointer: fine) and (prefers-reduced-motion: no-preference)');
let clearLighting = () => {};
function syncLighting() {
 clearLighting();
 if (!lightMedia.matches) return;
 const cleanups = [];
 document.querySelectorAll('.service-card,.product-card').forEach(card => {
  let frame = 0, x = 0, y = 0;
  const move = event => {
   const rect = card.getBoundingClientRect(); x = event.clientX - rect.left; y = event.clientY - rect.top;
   if (!frame) frame = requestAnimationFrame(() => { card.style.setProperty('--light-x', x + 'px'); card.style.setProperty('--light-y', y + 'px'); frame = 0; });
  };
  card.addEventListener('pointermove', move, { passive: true });
  cleanups.push(() => { card.removeEventListener('pointermove', move); cancelAnimationFrame(frame); card.style.removeProperty('--light-x'); card.style.removeProperty('--light-y'); });
 });
 clearLighting = () => cleanups.forEach(cleanup => cleanup());
}
lightMedia.addEventListener('change', syncLighting);
syncLighting();

// Keep decorative motion running only while it can be seen.
const motionRegions = document.querySelectorAll('.service-marquee, .footer-orbit');
const visibleRegions = new Set();
function syncRegions() {
  motionRegions.forEach(region => region.classList.toggle('motion-visible', !document.hidden && visibleRegions.has(region)));
}
const motionObserver = new IntersectionObserver(entries => {
  entries.forEach(entry => entry.isIntersecting ? visibleRegions.add(entry.target) : visibleRegions.delete(entry.target));
  syncRegions();
}, { rootMargin: '120px' });
motionRegions.forEach(region => motionObserver.observe(region));
document.addEventListener('visibilitychange', syncRegions);
