import * as THREE from 'three';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

const canvas = document.querySelector('.hero-canvas');
const hero = document.querySelector('.hero');
const objectWrap = document.querySelector('[data-object-wrap]');
const heroCopy = document.querySelector('[data-copy]');
const progressLine = document.querySelector('[data-progress]');
const motionPreference = window.matchMedia('(prefers-reduced-motion: reduce)');
let reducedMotion = motionPreference.matches;
let mobile = window.matchMedia('(max-width: 767px)').matches;
let tablet = window.matchMedia('(max-width: 1023px)').matches;

const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(30, 1, 0.1, 100);
camera.position.set(0, 0, mobile ? 16.8 : tablet ? 16.1 : 15.4);

const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true, powerPreference: 'high-performance' });
renderer.setClearColor(0x000000, 0);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.05;

function createConcreteTexture() {
  const textureCanvas = document.createElement('canvas');
  textureCanvas.width = 160; textureCanvas.height = 160;
  const context = textureCanvas.getContext('2d');
  const image = context.createImageData(160, 160);
  let seed = 8128;
  const random = () => { seed = (seed * 16807) % 2147483647; return (seed - 1) / 2147483646; };
  for (let index = 0; index < image.data.length; index += 4) {
    const grain = 105 + Math.floor(random() * 90);
    image.data[index] = grain; image.data[index + 1] = grain; image.data[index + 2] = grain; image.data[index + 3] = 255;
  }
  context.putImageData(image, 0, 0);
  const texture = new THREE.CanvasTexture(textureCanvas);
  texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
  texture.repeat.set(2.3, 4.8);
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}

const concreteTexture = createConcreteTexture();
const materialSettings = { map: concreteTexture, roughness: 0.38, metalness: 0.08, clearcoat: 0.48, clearcoatRoughness: 0.3, transparent: false, opacity: 1, depthWrite: true, polygonOffset: true, polygonOffsetFactor: 1, polygonOffsetUnits: 1 };
const materials = [
  new THREE.MeshPhysicalMaterial({ color: 0xb70f0b, emissive: 0x260300, emissiveIntensity: 0.18, ...materialSettings }),
  new THREE.MeshPhysicalMaterial({ color: 0xff4d28, emissive: 0x431000, emissiveIntensity: 0.22, ...materialSettings }),
  new THREE.MeshPhysicalMaterial({ color: 0x8f240c, emissive: 0x2d0900, emissiveIntensity: 0.3, ...materialSettings }),
  new THREE.MeshPhysicalMaterial({ color: 0xc43c12, emissive: 0x3c0d00, emissiveIntensity: 0.34, ...materialSettings }),
];
const edgeMaterial = new THREE.LineBasicMaterial({ color: 0xff786b, transparent: true, opacity: 0.28, depthWrite: false });

function createBar(width, height, depth) {
  const cap = width * 0.52;
  const frontZ = depth / 2; const backZ = -depth / 2;
  const profile = [[-width / 2, -height / 2 + cap], [0, -height / 2], [width / 2, -height / 2 + cap], [width / 2, height / 2 - cap], [0, height / 2], [-width / 2, height / 2 - cap]];
  const vertices = []; const groups = [];
  const point = (index, z) => [...profile[index], z];
  const triangle = (a, b, c, materialIndex) => {
    const start = vertices.length / 3;
    [a, b, c].forEach(([x, y, z]) => vertices.push(x, y, z));
    groups.push({ start, count: 3, materialIndex });
  };
  triangle(point(0, frontZ), point(1, frontZ), point(4, frontZ), 0);
  triangle(point(0, frontZ), point(4, frontZ), point(5, frontZ), 0);
  triangle(point(1, frontZ), point(2, frontZ), point(3, frontZ), 1);
  triangle(point(1, frontZ), point(3, frontZ), point(4, frontZ), 1);
  triangle(point(4, backZ), point(1, backZ), point(0, backZ), 3);
  triangle(point(5, backZ), point(4, backZ), point(0, backZ), 3);
  triangle(point(3, backZ), point(2, backZ), point(1, backZ), 3);
  triangle(point(4, backZ), point(3, backZ), point(1, backZ), 3);
  for (let index = 0; index < profile.length; index += 1) {
    const next = (index + 1) % profile.length;
    const materialIndex = index > 3 ? 2 : 3;
    triangle(point(index, frontZ), point(next, backZ), point(next, frontZ), materialIndex);
    triangle(point(index, frontZ), point(index, backZ), point(next, backZ), materialIndex);
  }
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3));
  groups.forEach(({ start, count, materialIndex }) => geometry.addGroup(start, count, materialIndex));
  geometry.computeVertexNormals();
  const mesh = new THREE.Mesh(geometry, materials);
  mesh.add(new THREE.LineSegments(new THREE.EdgesGeometry(geometry, 28), edgeMaterial));
  return mesh;
}

const logo = new THREE.Group();
scene.add(logo);
const heights = [3.8, 5.05, 6.35, 5.05, 3.8];
const expandedX = [-3.04, -1.52, 0, 1.52, 3.04];
const compressedX = [-2.16, -1.08, 0, 1.08, 2.16];
const bars = heights.map((height, index) => {
  const mesh = createBar(1.075, height, 1.18);
  mesh.position.set(compressedX[index], 0, 0);
  mesh.renderOrder = index; logo.add(mesh); return mesh;
});
logo.rotation.set(THREE.MathUtils.degToRad(-5), THREE.MathUtils.degToRad(-12), 0);
logo.scale.setScalar(mobile ? .92 : tablet ? 1 : 1.125);

scene.add(new THREE.HemisphereLight(0xa32a16, 0x160502, 1.12));
const key = new THREE.DirectionalLight(0xffc17e, 3.45); key.position.set(3.8, 5.5, 7); scene.add(key);
const fill = new THREE.DirectionalLight(0xff5a32, 1.8); fill.position.set(-4, -1.5, 5); scene.add(fill);
const redLight = new THREE.PointLight(0xff1f12, 9, 15, 2); redLight.position.set(-3, -1, 5); scene.add(redLight);
const rim = new THREE.DirectionalLight(0xff3a28, 3.8); rim.position.set(-5, 2, -4); scene.add(rim);

let visible = true; let pointerX = 0; let pointerY = 0; let pointerEnergy = 0; let scrollProgress = 0;
let frame = 0;
let fittedDistance = camera.position.z;
const clock = new THREE.Clock();
function resize() {
  mobile = window.innerWidth < 768; tablet = window.innerWidth < 1024;
  const { clientWidth, clientHeight } = objectWrap;
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, mobile ? 1.5 : 2));
  renderer.setSize(clientWidth, clientHeight, false);
  camera.aspect = clientWidth / Math.max(1, clientHeight);
  logo.scale.setScalar(mobile ? .92 : tablet ? 1 : 1.125);
  // Fit the fully expanded mark, not only its closed pose, to narrow canvases.
  fittedDistance = Math.max(mobile ? 16.8 : tablet ? 16.1 : 15.4,
    Math.max(7.8, 9.2 / Math.max(.1, camera.aspect)) / (2 * Math.tan(THREE.MathUtils.degToRad(camera.fov / 2))));
  camera.position.z = fittedDistance;
  camera.updateProjectionMatrix();
}
function render() { renderer.render(scene, camera); }
function animate() {
  frame = 0;
  if (!visible || reducedMotion || document.hidden) return;
  const elapsed = clock.getElapsedTime();
  const targetY = THREE.MathUtils.degToRad(-8 + pointerX * (mobile ? 5 : tablet ? 9 : 16) + Math.sin(scrollProgress * Math.PI) * (mobile ? 10 : 18));
  const targetX = THREE.MathUtils.degToRad(-3 - pointerY * (mobile ? 3 : tablet ? 5 : 8) - Math.sin(scrollProgress * Math.PI) * 4);
  logo.rotation.y += (targetY - logo.rotation.y) * .1;
  logo.rotation.x += (targetX - logo.rotation.x) * .1;
  logo.position.y = Math.sin(elapsed * .72) * .075;
  const scrollOpen = Math.sin(scrollProgress * Math.PI);
  const mouseOpen = pointerEnergy * (1 - scrollOpen) * .32;
  const openAmount = Math.min(1, scrollOpen + mouseOpen);
  bars.forEach((bar, index) => {
    const targetBarX = THREE.MathUtils.lerp(compressedX[index], expandedX[index], openAmount);
    const targetBarZ = (index - 2) * .14 * openAmount;
    bar.position.x += (targetBarX - bar.position.x) * .11;
    bar.position.z += (targetBarZ - bar.position.z) * .11;
    bar.position.y = 0;
    bar.rotation.z = 0;
    bar.rotation.y += (((index - 2) * .055 * openAmount) - bar.rotation.y) * .1;
  });
  pointerEnergy *= .94;
  redLight.position.x = -2.4 + Math.sin(elapsed * .7) * 2.1;
  redLight.intensity = 10;
  render(); frame = requestAnimationFrame(animate);
}
function syncAnimation() {
  cancelAnimationFrame(frame); frame = 0;
  if (visible && !reducedMotion && !document.hidden) frame = requestAnimationFrame(animate);
}

new ResizeObserver(() => { resize(); render(); }).observe(objectWrap);
new IntersectionObserver(([entry]) => { visible = entry.isIntersecting; syncAnimation(); }, { rootMargin: '80px' }).observe(canvas);
document.addEventListener('visibilitychange', syncAnimation);
motionPreference.addEventListener('change', () => { reducedMotion = motionPreference.matches; syncAnimation(); render(); });
window.addEventListener('pointermove', (event) => {
  pointerX = (event.clientX / window.innerWidth - .5) * 2;
  pointerY = (event.clientY / window.innerHeight - .5) * 2;
  pointerEnergy = Math.min(1, pointerEnergy + .38);
}, { passive: true });

const motion = gsap.matchMedia();
motion.add('(prefers-reduced-motion: no-preference) and (min-width: 1024px) and (min-height: 800px)', () => {
if (hero) {
  gsap.timeline({ scrollTrigger: { trigger: hero, start: 'top top', end: 'bottom bottom', scrub: .7, invalidateOnRefresh: true, onUpdate: ({ progress }) => { scrollProgress = progress; progressLine.style.backgroundPosition = `${100 - progress * 100}% 0`; } } })
    .to(heroCopy, { opacity: .78, ease: 'none', duration: 1 }, 0)
    .to(camera.position, { z: () => fittedDistance * .98, ease: 'none', duration: 1 }, 0);
} else if (objectWrap) {
  ScrollTrigger.create({
    trigger: objectWrap,
    start: 'top bottom',
    end: 'bottom top',
    scrub: .7,
    onUpdate: ({ progress }) => { scrollProgress = progress; },
  });
}
return () => { scrollProgress = 0; };
});

resize(); render(); syncAnimation();
window.addEventListener('load', () => ScrollTrigger.refresh(), { once: true });
