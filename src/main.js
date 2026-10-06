import * as THREE from 'three';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import './styles.css';

gsap.registerPlugin(ScrollTrigger);

const canvas = document.querySelector('.hero__canvas');
const hero = document.querySelector('.hero');
const sticky = document.querySelector('.hero__sticky');
const intro = document.querySelector('[data-hero-intro]');
const statement = document.querySelector('[data-hero-statement]');
const progressBar = document.querySelector('[data-progress]');
const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const mobile = window.matchMedia('(max-width: 760px)').matches;

const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(31, 1, 0.1, 100);
camera.position.set(0, 0, 14.8);

const renderer = new THREE.WebGLRenderer({
  canvas,
  antialias: true,
  alpha: true,
  powerPreference: 'high-performance',
});
renderer.setClearColor(0x111111, 0);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 0.92;

const logo = new THREE.Group();
scene.add(logo);

const materialSettings = {
  roughness: 0.33,
  metalness: 0.04,
  clearcoat: 0.18,
  clearcoatRoughness: 0.34,
};

const barMaterials = [
  new THREE.MeshPhysicalMaterial({ color: 0xd10912, ...materialSettings }),
  new THREE.MeshPhysicalMaterial({ color: 0xff4d1d, ...materialSettings }),
  new THREE.MeshPhysicalMaterial({ color: 0x75030a, ...materialSettings }),
  new THREE.MeshPhysicalMaterial({ color: 0x320103, ...materialSettings }),
];

const edgeMaterial = new THREE.LineBasicMaterial({
  color: 0xff5c27,
  transparent: true,
  opacity: 0.18,
});

function createBar(width, height, depth) {
  const cap = width * 0.54;
  const frontZ = depth / 2;
  const backZ = -depth / 2;
  const profile = [
    [-width / 2, -height / 2 + cap],
    [0, -height / 2],
    [width / 2, -height / 2 + cap],
    [width / 2, height / 2 - cap],
    [0, height / 2],
    [-width / 2, height / 2 - cap],
  ];
  const vertices = [];
  const groups = [];

  const addTriangle = (a, b, c, materialIndex) => {
    const start = vertices.length / 3;
    [a, b, c].forEach(([x, y, z]) => vertices.push(x, y, z));
    groups.push({ start, count: 3, materialIndex });
  };

  const point = (index, z) => [...profile[index], z];

  // Two intentionally distinct frontal facets create the REDMIX center ridge.
  addTriangle(point(0, frontZ), point(1, frontZ), point(4, frontZ), 0);
  addTriangle(point(0, frontZ), point(4, frontZ), point(5, frontZ), 0);
  addTriangle(point(1, frontZ), point(2, frontZ), point(3, frontZ), 1);
  addTriangle(point(1, frontZ), point(3, frontZ), point(4, frontZ), 1);

  // Rear cap.
  addTriangle(point(4, backZ), point(1, backZ), point(0, backZ), 3);
  addTriangle(point(5, backZ), point(4, backZ), point(0, backZ), 3);
  addTriangle(point(3, backZ), point(2, backZ), point(1, backZ), 3);
  addTriangle(point(4, backZ), point(3, backZ), point(1, backZ), 3);

  // Six depth faces, each kept flat-shaded.
  for (let index = 0; index < profile.length; index += 1) {
    const next = (index + 1) % profile.length;
    const materialIndex = index === 4 || index === 5 ? 2 : 3;
    addTriangle(point(index, frontZ), point(next, backZ), point(next, frontZ), materialIndex);
    addTriangle(point(index, frontZ), point(index, backZ), point(next, backZ), materialIndex);
  }

  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3));
  groups.forEach(({ start, count, materialIndex }) => geometry.addGroup(start, count, materialIndex));
  geometry.computeVertexNormals();

  const mesh = new THREE.Mesh(geometry, barMaterials);
  const edges = new THREE.LineSegments(new THREE.EdgesGeometry(geometry, 28), edgeMaterial);
  mesh.add(edges);
  return mesh;
}

const heights = [4.1, 5.3, 6.4, 5.3, 4.1];
const baseX = [-2.48, -1.24, 0, 1.24, 2.48];
const bars = heights.map((height, index) => {
  const bar = createBar(1.38, height, 0.86);
  bar.position.x = baseX[index];
  bar.userData.baseX = baseX[index];
  logo.add(bar);
  return bar;
});

logo.rotation.set(THREE.MathUtils.degToRad(-1), THREE.MathUtils.degToRad(-2), 0);
logo.scale.setScalar(mobile ? 0.79 : 0.91);

const ambient = new THREE.HemisphereLight(0x54140d, 0x080404, 0.48);
scene.add(ambient);

const key = new THREE.DirectionalLight(0xff7a32, 2.7);
key.position.set(4.5, 6, 7);
scene.add(key);

const fill = new THREE.DirectionalLight(0xa8090a, 1.8);
fill.position.set(-6, 0.5, 4);
scene.add(fill);

const rim = new THREE.DirectionalLight(0xff3517, 1.5);
rim.position.set(1, -4, -5);
scene.add(rim);

let isVisible = true;
const render = () => {
  if (isVisible) renderer.render(scene, camera);
};

function resize() {
  const { clientWidth: width, clientHeight: height } = sticky;
  renderer.setSize(width, height, false);
  camera.aspect = width / height;
  camera.updateProjectionMatrix();
  render();
}

const resizeObserver = new ResizeObserver(resize);
resizeObserver.observe(sticky);

const visibilityObserver = new IntersectionObserver(([entry]) => {
  isVisible = entry.isIntersecting;
  if (isVisible) render();
}, { rootMargin: '100px' });
visibilityObserver.observe(canvas);

function buildScrollAnimation() {
  if (reducedMotion) {
    logo.position.x = mobile ? 0.7 : 2.5;
    logo.rotation.y = THREE.MathUtils.degToRad(2);
    logo.scale.setScalar(mobile ? 0.62 : 0.78);
    render();
    return;
  }

  const rotationY = THREE.MathUtils.degToRad(mobile ? 7 : 12);
  const rotationX = THREE.MathUtils.degToRad(mobile ? -2 : -4);
  const separation = mobile ? 0.16 : 0.29;
  const finalShift = mobile ? 1.35 : 3.0;
  const finalScale = mobile ? 0.49 : 0.76;

  const timeline = gsap.timeline({
    defaults: { ease: 'none' },
    scrollTrigger: {
      trigger: hero,
      start: 'top top',
      end: 'bottom bottom',
      scrub: 0.55,
      invalidateOnRefresh: true,
      onUpdate: ({ progress }) => {
        const float = Math.sin(Math.min(progress / 0.15, 1) * Math.PI) * 0.055;
        const mobileLift = mobile ? Math.max(0, (progress - 0.85) / 0.15) * 1.75 : 0;
        logo.position.y = float + mobileLift;
        progressBar.style.transform = `scaleY(${progress})`;
        render();
      },
    },
    onUpdate: render,
  });

  timeline
    .to(logo.rotation, { y: rotationY, x: rotationX, duration: 0.2 }, 0.15)
    .to(key.position, { x: 1.4, z: 5.3, duration: 0.2 }, 0.15)
    .to(fill, { intensity: 2.35, duration: 0.2 }, 0.15);

  bars.forEach((bar, index) => {
    const offset = index - 2;
    timeline.to(bar.position, {
      x: bar.userData.baseX + offset * separation,
      z: Math.abs(offset) * -0.12,
      duration: 0.2,
    }, 0.35);
  });

  timeline
    .to(camera.position, { z: mobile ? 13.7 : 13.35, duration: 0.15 }, 0.55)
    .to(intro, { opacity: 1, y: 0, duration: 0.1 }, 0.55)
    .to(intro, { opacity: 0, y: -18, duration: 0.06 }, 0.64);

  bars.forEach((bar) => {
    timeline.to(bar.position, {
      x: bar.userData.baseX,
      z: 0,
      duration: 0.15,
    }, 0.7);
  });

  timeline
    .to(logo.rotation, {
      y: THREE.MathUtils.degToRad(1.5),
      x: THREE.MathUtils.degToRad(-1),
      duration: 0.15,
    }, 0.7)
    .to(camera.position, { z: 14.25, duration: 0.15 }, 0.7)
    .to(logo.position, { x: finalShift, duration: 0.15 }, 0.85)
    .to(logo.scale, { x: finalScale, y: finalScale, z: finalScale, duration: 0.15 }, 0.85)
    .to(statement, { opacity: 1, y: 0, duration: 0.11 }, 0.87);

  render();
}

buildScrollAnimation();
window.addEventListener('load', () => ScrollTrigger.refresh(), { once: true });
