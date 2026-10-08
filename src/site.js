import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

const motionPreference = window.matchMedia('(prefers-reduced-motion: reduce)');
const navbar = document.querySelector('[data-navbar]');
const menuToggle = document.querySelector('[data-menu-toggle]');
const menu = document.querySelector('[data-menu]');

const floatingWhatsApp = document.querySelector('.floating-whatsapp');
const protectedControls = [...document.querySelectorAll('.contact-form, .technical-cta, .contact-info')];

function updateNavbar() {
  navbar?.classList.toggle('is-scrolled', window.scrollY > 24);
  const scrollRange = document.documentElement.scrollHeight - window.innerHeight;
  navbar?.style.setProperty('--reading-progress', String(scrollRange > 0 ? Math.min(1, Math.max(0, window.scrollY / scrollRange)) : 0));
  if (!floatingWhatsApp) return;
  const floating = floatingWhatsApp.getBoundingClientRect();
  const overlaps = window.innerWidth < 768 && protectedControls.some((element) => {
    const rect = element.getBoundingClientRect();
    return rect.width && rect.bottom > floating.top - 12 && rect.top < floating.bottom + 12 && rect.right > floating.left - 12 && rect.left < floating.right;
  });
  floatingWhatsApp.classList.toggle('is-obstructing', overlaps);
}

updateNavbar();
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

// Dividers are CSS pseudo-elements: motion never inserts boxes or changes layout.
const motion = gsap.matchMedia();
motion.add('(prefers-reduced-motion: no-preference)', () => {
  const internalHero = document.querySelector('.page-hero__copy, .contact-hero > div');
  document.querySelectorAll('[data-reveal]').forEach(element => {
    if (element === internalHero || element.closest('.faq-item')) return;
    const reveal = gsap.timeline({ scrollTrigger: { trigger: element, start: 'top 94%', once: true } });
    reveal.from(element, { y: element.querySelector('h2') ? 12 : 20, opacity: element.querySelector('h2') ? 0.35 : 1, duration: .6, ease: 'power3.out', clearProps: 'transform,opacity' }, 0);
    if (element.matches('.section-heading')) {
      reveal.fromTo(element, { '--divider-scale': 0 }, { '--divider-scale': 1, duration: .55, ease: 'power3.out' }, 0);
    }
  });
  document.querySelectorAll('[data-stagger]').forEach(group => {
    gsap.from(group.querySelectorAll('[data-card]'), { y: 18, duration: .6, stagger: .08, ease: 'power3.out', clearProps: 'transform', scrollTrigger: { trigger: group, start: 'top 92%', once: true } });
  });
  if (document.querySelector('.hero-sticky')) {
    gsap.timeline({ defaults: { ease: 'power3.out', duration: .65, clearProps: 'transform,opacity,visibility' } })
      .from('.hero .eyebrow', { y: 12, opacity: 0 }, 0)
      .from('.hero h1 > span', { y: 20, opacity: 0, stagger: .1 }, .1)
      .from('.hero-intro', { y: 16, opacity: 0 }, .3)
      .from('.hero-actions', { y: 12, opacity: 0 }, .4)
      .from('.hero-orbits, .hero-signature', { opacity: 0, stagger: .08 }, .5);
  }
  const cinematicCopy = document.querySelector('.concept-copy');
  if (cinematicCopy) {
    gsap.from(cinematicCopy.children, { y: 18, opacity: 0, duration: .8, stagger: .1, ease: 'power3.out', clearProps: 'transform,opacity' });
  }
  if (internalHero) {
    gsap.from(internalHero.children, { y: 14, duration: .6, stagger: .09, ease: 'power3.out', clearProps: 'transform' });
  }
  document.querySelectorAll('[data-experience-counter]').forEach(counter => {
    const count = { value: 0 };
    gsap.to(count, { value: 20, duration: 1.2, ease: 'power2.out', onUpdate: () => { counter.textContent = `+${Math.round(count.value)}`; }, scrollTrigger: { trigger: counter, start: 'top 90%', once: true } });
  });
  return () => document.querySelectorAll('[data-experience-counter]').forEach(counter => { counter.textContent = '+20'; });
});

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
const lightMedia = gsap.matchMedia();
lightMedia.add('(hover: hover) and (pointer: fine) and (prefers-reduced-motion: no-preference)', () => {
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
 return () => cleanups.forEach(cleanup => cleanup());
});
document.querySelector('.footer-top')?.addEventListener('click', event => {
 event.preventDefault();
 window.scrollTo({ top: 0, behavior: motionPreference.matches ? 'instant' : 'smooth' });
 document.querySelector('.nav-logo')?.focus({ preventScroll: true });
});
