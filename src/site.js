import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const navbar = document.querySelector('[data-navbar]');
const menuToggle = document.querySelector('[data-menu-toggle]');
const menu = document.querySelector('[data-menu]');

document.documentElement.classList.add('motion-ready');

const imageRevealObserver = new IntersectionObserver((entries, observer) => {
  entries.forEach((entry) => {
    if (!entry.isIntersecting) return;
    entry.target.classList.add('is-visible');
    observer.unobserve(entry.target);
  });
}, { rootMargin: '0px 0px 10% 0px' });
document.querySelectorAll('[data-image-reveal]').forEach((image) => imageRevealObserver.observe(image));

function updateNavbar() {
  navbar?.classList.toggle('is-scrolled', window.scrollY > 24);
}

updateNavbar();
let navbarFrame = 0;
window.addEventListener('scroll', () => {
  if (navbarFrame) return;
  navbarFrame = requestAnimationFrame(() => { updateNavbar(); navbarFrame = 0; });
}, { passive: true });

menuToggle?.addEventListener('click', () => {
  const open = menuToggle.getAttribute('aria-expanded') !== 'true';
  menuToggle.setAttribute('aria-expanded', String(open));
  menuToggle.setAttribute('aria-label', open ? 'Cerrar navegación' : 'Abrir navegación');
  menu?.classList.toggle('is-open', open);
  document.body.classList.toggle('menu-open', open);
});

menu?.querySelectorAll('a').forEach((link) => link.addEventListener('click', () => {
  menuToggle?.setAttribute('aria-expanded', 'false');
  menu.classList.remove('is-open');
  document.body.classList.remove('menu-open');
}));

window.addEventListener('keydown', (event) => {
  if (event.key !== 'Escape' || menuToggle?.getAttribute('aria-expanded') !== 'true') return;
  menuToggle.setAttribute('aria-expanded', 'false');
  menuToggle.setAttribute('aria-label', 'Abrir navegación');
  menu?.classList.remove('is-open');
  document.body.classList.remove('menu-open');
  menuToggle.focus();
});

if (!reducedMotion) {
  document.querySelectorAll('[data-reveal]').forEach((element) => {
    const isImage = element.matches('[data-image-reveal]');
    const horizontal = element.matches('.image-reveal--horizontal');
    const flow = element.matches('.image-reveal--flow');
    gsap.fromTo(element,
      isImage
        ? { autoAlpha: 1, x: horizontal ? 24 : flow ? -18 : 0, scale: 1.012 }
        : { autoAlpha: 1, y: 14 },
      isImage
        ? { autoAlpha: 1, x: 0, scale: 1, duration: 1.05, ease: 'power3.out', scrollTrigger: { trigger: element, start: 'top 94%', once: true } }
        : { autoAlpha: 1, y: 0, duration: .72, ease: 'power3.out', scrollTrigger: { trigger: element, start: 'top 94%', once: true } },
    );
  });

  document.querySelectorAll('[data-stagger]').forEach((group) => {
    const cards = group.querySelectorAll('[data-card]');
    gsap.from(cards, { autoAlpha: 1, y: 28, duration: .8, stagger: .11, ease: 'power3.out', scrollTrigger: { trigger: group, start: 'top 90%', once: true } });
  });

  document.querySelectorAll('[data-image-reveal] picture img').forEach((image) => {
    gsap.fromTo(image, { yPercent: -3, scale: 1.045 }, { yPercent: 3, scale: 1, ease: 'none', scrollTrigger: { trigger: image, start: 'top bottom', end: 'bottom top', scrub: .8 } });
  });

  document.querySelectorAll('.service-card__image img, .product-card picture img').forEach((image, index) => {
    gsap.fromTo(image,
      { scale: 1.045, xPercent: index % 2 ? 1.2 : -1.2 },
      { scale: 1, xPercent: 0, duration: 1.05, ease: 'power3.out', scrollTrigger: { trigger: image, start: 'top 94%', once: true } },
    );
  });

  const hero = document.querySelector('.hero-sticky');
  if (hero) {
    const timeline = gsap.timeline({ defaults: { ease: 'power3.out' } });
    timeline
      .from('.measure, .object-tag, .hero-foot', { autoAlpha: 0, duration: .35, stagger: .04 }, .08)
      .from('.blueprint path, .blueprint circle', { strokeDasharray: 260, strokeDashoffset: 260, duration: .6 }, .12)
      .from('.hero .eyebrow', { y: 8, duration: .35 }, .22)
      .from('.hero h1 > span', { y: 16, duration: .62, stagger: .08 }, .3)
      .from('.hero-intro', { y: 8, duration: .42 }, .62)
      .from('.hero-actions, .hero-mobile-action', { y: 8, duration: .42 }, .74);
  }

  if (window.matchMedia('(pointer:fine)').matches) {
    document.querySelectorAll('.service-card__image').forEach((frame) => {
      const image = frame.querySelector('img');
      frame.addEventListener('pointermove', (event) => {
        const rect = frame.getBoundingClientRect();
        gsap.to(image, { x: ((event.clientX - rect.left) / rect.width - .5) * 4, y: ((event.clientY - rect.top) / rect.height - .5) * 4, duration: .45, ease: 'power2.out' });
      });
      frame.addEventListener('pointerleave', () => gsap.to(image, { x: 0, y: 0, duration: .5, ease: 'power2.out' }));
    });
  }
}

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
    window.location.href = `mailto:info@redmixhormigonera.com.ar?subject=${encodeURIComponent('Consulta desde el sitio REDMIX')}&body=${encodeURIComponent(body)}`;
  });
});
