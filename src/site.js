import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const navbar = document.querySelector('[data-navbar]');
const menuToggle = document.querySelector('[data-menu-toggle]');
const menu = document.querySelector('[data-menu]');

function updateNavbar() {
  navbar?.classList.toggle('is-scrolled', window.scrollY > 24);
}

updateNavbar();
window.addEventListener('scroll', updateNavbar, { passive: true });

menuToggle?.addEventListener('click', () => {
  const open = menuToggle.getAttribute('aria-expanded') !== 'true';
  menuToggle.setAttribute('aria-expanded', String(open));
  menu?.classList.toggle('is-open', open);
  document.body.classList.toggle('menu-open', open);
});

menu?.querySelectorAll('a').forEach((link) => link.addEventListener('click', () => {
  menuToggle?.setAttribute('aria-expanded', 'false');
  menu.classList.remove('is-open');
  document.body.classList.remove('menu-open');
}));

if (!reducedMotion) {
  document.querySelectorAll('[data-reveal]').forEach((element) => {
    const isImage = element.matches('[data-image-reveal]');
    const horizontal = element.matches('.image-reveal--horizontal');
    const flow = element.matches('.image-reveal--flow');
    const initialClip = horizontal ? 'inset(0 100% 0 0)' : flow ? 'inset(0 0 0 100%)' : isImage ? 'inset(0 0 100% 0)' : 'inset(0 0 12% 0)';
    gsap.fromTo(element,
      { autoAlpha: 0, x: horizontal ? 42 : flow ? -30 : 0, y: isImage && !horizontal && !flow ? 36 : 24, clipPath: initialClip },
      { autoAlpha: 1, x: 0, y: 0, clipPath: 'inset(0 0 0% 0)', duration: isImage ? 1.25 : .85, ease: 'power3.out', scrollTrigger: { trigger: element, start: 'top 88%', once: true } },
    );
  });

  document.querySelectorAll('[data-stagger]').forEach((group) => {
    const cards = group.querySelectorAll('[data-card]');
    gsap.from(cards, { autoAlpha: 0, y: 32, duration: .8, stagger: .12, ease: 'power3.out', scrollTrigger: { trigger: group, start: 'top 82%', once: true } });
  });

  document.querySelectorAll('[data-image-reveal] picture img').forEach((image) => {
    gsap.fromTo(image, { yPercent: -3, scale: 1.045 }, { yPercent: 3, scale: 1, ease: 'none', scrollTrigger: { trigger: image, start: 'top bottom', end: 'bottom top', scrub: .8 } });
  });
}

document.querySelectorAll('[data-whatsapp-form]').forEach((form) => {
  form.addEventListener('submit', (event) => {
    event.preventDefault();
    if (!form.reportValidity()) return;
    const data = new FormData(form);
    const clean = (value) => String(value ?? '').replace(/[<>]/g, '').trim();
    const message = [
      'Hola Redmix, quisiera realizar una consulta.',
      '',
      `Nombre: ${clean(data.get('name'))}`,
      `Email: ${clean(data.get('email'))}`,
      `Teléfono: ${clean(data.get('phone'))}`,
      `Mensaje: ${clean(data.get('message'))}`,
    ].join('\n');
    window.open(`https://wa.me/5491138245680?text=${encodeURIComponent(message)}`, '_blank', 'noopener,noreferrer');
  });
});
