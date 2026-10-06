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
const materialSettings = { map: concreteTexture, roughness: 0.31, metalness: 0.12, clearcoat: 0.62, clearcoatRoughness: 0.24, transparent: false, opacity: 1, depthWrite: true, polygonOffset: true, polygonOffsetFactor: 1, polygonOffsetUnits: 1 };
const materials = [
  new THREE.MeshPhysicalMaterial({ color: 0xa80708, ...materialSettings }),
  new THREE.MeshPhysicalMaterial({ color: 0xff3f2d, ...materialSettings }),
  new THREE.MeshPhysicalMaterial({ color: 0x8e090b, ...materialSettings }),
  new THREE.MeshPhysicalMaterial({ color: 0x620607, ...materialSettings }),
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
  const mesh = createBar(1.12, height, 1.18);
  mesh.position.set(compressedX[index], 0, 0);
  mesh.renderOrder = index; logo.add(mesh); return mesh;
});
logo.rotation.set(THREE.MathUtils.degToRad(-5), THREE.MathUtils.degToRad(-12), 0);
logo.scale.setScalar(mobile ? .92 : 1.125);

scene.add(new THREE.HemisphereLight(0x8a1711, 0x080304, 0.92));
const key = new THREE.DirectionalLight(0xffe2d8, 3.1); key.position.set(3.8, 5.5, 7); scene.add(key);
const fill = new THREE.DirectionalLight(0xff4a36, 1.45); fill.position.set(-4, -1.5, 5); scene.add(fill);
const redLight = new THREE.PointLight(0xff1f12, 9, 15, 2); redLight.position.set(-3, -1, 5); scene.add(redLight);
const rim = new THREE.DirectionalLight(0xff3a28, 3.8); rim.position.set(-5, 2, -4); scene.add(rim);

let visible = true; let pointerX = 0; let pointerY = 0; let pointerEnergy = 0; let scrollProgress = 0;
const clock = new THREE.Clock();
function resize() { const { clientWidth, clientHeight } = objectWrap; renderer.setSize(clientWidth, clientHeight, false); camera.aspect = clientWidth / clientHeight; camera.updateProjectionMatrix(); }
function render() { renderer.render(scene, camera); }
function animate() {
  if (!visible || reducedMotion) return;
  const elapsed = clock.getElapsedTime();
  const targetY = THREE.MathUtils.degToRad(-8 + pointerX * (mobile ? 5 : 16) + Math.sin(scrollProgress * Math.PI) * 18);
  const targetX = THREE.MathUtils.degToRad(-3 - pointerY * (mobile ? 3 : 8) - Math.sin(scrollProgress * Math.PI) * 4);
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
    bar.position.y = Math.sin(elapsed * .9 + index * .65) * .035;
    bar.rotation.z = Math.sin(elapsed * .55 + index * .8) * .006 * (index - 2);
    bar.rotation.y += (((index - 2) * .055 * openAmount) - bar.rotation.y) * .1;
  });
  pointerEnergy *= .94;
  redLight.position.x = -2.4 + Math.sin(elapsed * .7) * 2.1;
  redLight.intensity = 9 + Math.sin(elapsed * .9) * 2.2;
  render(); requestAnimationFrame(animate);
}

new ResizeObserver(() => { resize(); render(); }).observe(objectWrap);
new IntersectionObserver(([entry]) => { const wasVisible = visible; visible = entry.isIntersecting; if (visible && !wasVisible) animate(); }, { rootMargin: '80px' }).observe(canvas);
window.addEventListener('pointermove', (event) => {
  pointerX = (event.clientX / window.innerWidth - .5) * 2;
  pointerY = (event.clientY / window.innerHeight - .5) * 2;
  pointerEnergy = Math.min(1, pointerEnergy + .38);
}, { passive: true });

if (!reducedMotion) {
  gsap.timeline({ scrollTrigger: { trigger: hero, start: 'top top', end: 'bottom bottom', scrub: .7, onUpdate: ({ progress }) => { scrollProgress = progress; progressLine.style.backgroundPosition = `${100 - progress * 100}% 0`; } } })
    .to(heroCopy, { opacity: .78, ease: 'none', duration: 1 }, 0)
    .to(camera.position, { z: mobile ? 15.1 : 13.5, ease: 'none', duration: 1 }, 0);
} else {
  bars.forEach((bar, index) => { bar.position.x = compressedX[index]; });
}

resize(); render(); animate();
window.addEventListener('load', () => ScrollTrigger.refresh(), { once: true });
