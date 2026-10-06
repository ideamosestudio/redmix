import * as THREE from 'three';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

const canvas = document.querySelector('.hero-canvas');
const hero = document.querySelector('.hero');
const objectWrap = document.querySelector('[data-object-wrap]');
const heroCopy = document.querySelector('[data-copy]');
const progressLine = document.querySelector('[data-progress]');
const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const mobile = window.matchMedia('(max-width: 720px)').matches;

const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(30, 1, 0.1, 100);
camera.position.set(0, 0, mobile ? 16.8 : 15.4);

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
const materialSettings = { map: concreteTexture, roughness: 0.34, metalness: 0.16, clearcoat: 0.56, clearcoatRoughness: 0.26, transparent: true, opacity: 0.84, depthWrite: false };
const materials = [
  new THREE.MeshPhysicalMaterial({ color: 0xa80708, ...materialSettings }),
  new THREE.MeshPhysicalMaterial({ color: 0xff3f2d, ...materialSettings }),
  new THREE.MeshPhysicalMaterial({ color: 0x5a0204, ...materialSettings, opacity: 0.77 }),
  new THREE.MeshPhysicalMaterial({ color: 0x240102, ...materialSettings, opacity: 0.72 }),
];
const edgeMaterial = new THREE.LineBasicMaterial({ color: 0xff6d5e, transparent: true, opacity: 0.2, depthWrite: false });

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
const expandedX = [-2.36, -1.18, 0, 1.18, 2.36];
const compressedX = [-1.65, -.82, 0, .82, 1.65];
const bars = heights.map((height, index) => {
  const mesh = createBar(1.42, height, 1.18);
  mesh.position.set(compressedX[index], 0, Math.abs(index - 2) * -0.13);
  mesh.renderOrder = index; logo.add(mesh); return mesh;
});
logo.rotation.set(THREE.MathUtils.degToRad(-4), THREE.MathUtils.degToRad(-10), 0);
logo.scale.setScalar(mobile ? .74 : .9);

scene.add(new THREE.HemisphereLight(0x66100d, 0x080304, 0.72));
const key = new THREE.DirectionalLight(0xffe2d8, 2.3); key.position.set(3.8, 5.5, 7); scene.add(key);
const redLight = new THREE.PointLight(0xff1f12, 11, 15, 2); redLight.position.set(-3, -1, 5); scene.add(redLight);
const rim = new THREE.DirectionalLight(0xff3a28, 3.8); rim.position.set(-5, 2, -4); scene.add(rim);

let visible = true; let pointerX = 0; let pointerY = 0; let scrollProgress = 0;
const clock = new THREE.Clock();
function resize() { const { clientWidth, clientHeight } = objectWrap; renderer.setSize(clientWidth, clientHeight, false); camera.aspect = clientWidth / clientHeight; camera.updateProjectionMatrix(); }
function render() { renderer.render(scene, camera); }
function animate() {
  if (!visible || reducedMotion) return;
  const elapsed = clock.getElapsedTime();
  const targetY = THREE.MathUtils.degToRad(-10 + pointerX * 3.5 + scrollProgress * 14);
  const targetX = THREE.MathUtils.degToRad(-4 - pointerY * 2.2 - scrollProgress * 2);
  logo.rotation.y += (targetY - logo.rotation.y) * .045;
  logo.rotation.x += (targetX - logo.rotation.x) * .045;
  logo.position.y = Math.sin(elapsed * .72) * .055;
  redLight.intensity = 10.5 + Math.sin(elapsed * .9) * 1.5;
  render(); requestAnimationFrame(animate);
}

new ResizeObserver(() => { resize(); render(); }).observe(objectWrap);
new IntersectionObserver(([entry]) => { const wasVisible = visible; visible = entry.isIntersecting; if (visible && !wasVisible) animate(); }, { rootMargin: '80px' }).observe(canvas);
window.addEventListener('pointermove', (event) => { pointerX = (event.clientX / window.innerWidth - .5) * 2; pointerY = (event.clientY / window.innerHeight - .5) * 2; }, { passive: true });

if (!reducedMotion) {
  gsap.timeline({ scrollTrigger: { trigger: hero, start: 'top top', end: 'bottom bottom', scrub: .7, onUpdate: ({ progress }) => { scrollProgress = progress; progressLine.style.backgroundPosition = `${100 - progress * 100}% 0`; } } })
    .to(heroCopy, { opacity: .78, ease: 'none', duration: 1 }, 0)
    .to(camera.position, { z: mobile ? 15.5 : 14.2, ease: 'none', duration: 1 }, 0);
  bars.forEach((bar, index) => {
    gsap.to(bar.position, { x: expandedX[index], z: (index - 2) * .14, ease: 'none', scrollTrigger: { trigger: hero, start: 'top top', end: 'bottom bottom', scrub: .7 } });
  });
} else {
  bars.forEach((bar, index) => { bar.position.x = expandedX[index]; });
}

resize(); render(); animate();
window.addEventListener('load', () => ScrollTrigger.refresh(), { once: true });
