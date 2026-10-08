import * as THREE from 'three';
const section = document.querySelector('[data-concept]');
const reduce = matchMedia('(prefers-reduced-motion: reduce)');
const button = document.querySelector('[data-motion-toggle]');
let paused = reduce.matches;
let visible = true;
const kind = section?.dataset.concept;
const label = () => { if (button) { button.textContent = `${paused ? 'Reproducir' : 'Pausar'} ${kind === 'descarga' ? 'video' : 'rotación'}`; button.setAttribute('aria-pressed', String(paused)); } };
label();
const video = document.querySelector('[data-concept-video]');
function syncVideo() { if (!video) return; if (paused || !visible || document.hidden) video.pause(); else video.play().catch(() => { paused = true; label(); }); }
let syncScene = () => {};
button?.addEventListener('click', () => { paused = !paused; label(); syncVideo(); syncScene(); });
reduce.addEventListener('change', () => { paused = reduce.matches; label(); syncVideo(); syncScene(); });
document.addEventListener('visibilitychange', () => { syncVideo(); syncScene(); });
if (section) new IntersectionObserver(([entry]) => { visible = entry.isIntersecting; syncVideo(); syncScene(); }).observe(section);
const truck = document.querySelector('[data-truck]');
if (truck) section.addEventListener('pointermove', event => { if (reduce.matches || event.pointerType !== 'mouse') return; const r=section.getBoundingClientRect(); truck.style.setProperty('--truck-x', `${(event.clientX/r.width-.5)*12}px`); truck.style.setProperty('--truck-y', `${((event.clientY-r.top)/r.height-.5)*8}px`); }, {passive:true});
section?.addEventListener('pointerleave', () => { truck?.style.setProperty('--truck-x','0px'); truck?.style.setProperty('--truck-y','0px'); });
const canvas = document.querySelector('[data-drum]');
if (canvas) {
 try {
  const scene = new THREE.Scene();
  const renderer = new THREE.WebGLRenderer({canvas, alpha:true, antialias:true});
  renderer.setPixelRatio(Math.min(devicePixelRatio,1.75)); renderer.outputColorSpace=THREE.SRGBColorSpace; renderer.toneMapping=THREE.ACESFilmicToneMapping; renderer.toneMappingExposure=1.5;
  const camera=new THREE.PerspectiveCamera(36,1,.1,100); camera.position.set(6,3.2,9); camera.lookAt(0,0,0);
  const rig=new THREE.Group(); scene.add(rig);
  const labelCanvas=document.createElement('canvas'); labelCanvas.width=2048;labelCanvas.height=1024;
  const ctx=labelCanvas.getContext('2d'); ctx.fillStyle='#c9261e';ctx.fillRect(0,0,2048,1024);
  ctx.fillStyle='#ede9df';ctx.fillRect(0,230,2048,65);ctx.fillRect(0,748,2048,45);
  ctx.font='bold 115px Arial';ctx.textAlign='center';ctx.fillText('REDMIX',510,575);ctx.fillText('REDMIX',1530,575);
  ctx.font='26px Arial';ctx.fillText('H O R M I G O N E R A',510,627);ctx.fillText('H O R M I G O N E R A',1530,627);
  const texture=new THREE.CanvasTexture(labelCanvas);texture.colorSpace=THREE.SRGBColorSpace;texture.anisotropy=renderer.capabilities.getMaxAnisotropy();
  const red=new THREE.MeshPhysicalMaterial({map:texture,roughness:.32,metalness:.25,clearcoat:1,clearcoatRoughness:.25});
  const steel=new THREE.MeshStandardMaterial({color:0x8b949d,roughness:.3,metalness:.8});
  const dark=new THREE.MeshStandardMaterial({color:0x24282d,roughness:.48,metalness:.65});
  const axle=new THREE.Group();axle.rotation.z=-1.25;rig.add(axle);
  const drum=new THREE.Group();axle.add(drum);
  const curve=new THREE.SplineCurve([new THREE.Vector2(.3,-2.25),new THREE.Vector2(.55,-1.98),new THREE.Vector2(1.2,-1.1),new THREE.Vector2(1.42,-.4),new THREE.Vector2(1.4,.65),new THREE.Vector2(1.14,1.28),new THREE.Vector2(.58,2),new THREE.Vector2(.38,2.3)]);
  drum.add(new THREE.Mesh(new THREE.LatheGeometry(curve.getPoints(80),96),red));
  for (const [y,r] of [[-.8,1.33],[.55,1.42],[2.3,.39],[-2.25,.31]]) { const ring=new THREE.Mesh(new THREE.TorusGeometry(r,.045,12,96),steel);ring.rotation.x=Math.PI/2;ring.position.y=y;drum.add(ring); }
  const opening=new THREE.Mesh(new THREE.CircleGeometry(.34,48),new THREE.MeshStandardMaterial({color:0x0b0c0e,side:THREE.DoubleSide}));opening.rotation.x=Math.PI/2;opening.position.y=2.28;drum.add(opening);
  // Longitudinal steel reinforcement ribs rotate with the drum.
  for(let a=0;a<6;a++){const angle=a*Math.PI/3;const rib=new THREE.Mesh(new THREE.BoxGeometry(.035,1.25,.035),steel);rib.position.set(Math.sin(angle)*1.419,.05,Math.cos(angle)*1.419);drum.add(rib);}
  const base=new THREE.Mesh(new THREE.BoxGeometry(5.5,.22,2.15),dark);base.position.y=-1.75;rig.add(base);
  for(const x of [-1.55,1.55])for(const z of [-.85,.85]){const support=new THREE.Mesh(new THREE.BoxGeometry(.23,.7,.28),steel);support.position.set(x,-1.34,z);rig.add(support);const roller=new THREE.Mesh(new THREE.CylinderGeometry(.28,.28,.27,24),dark);roller.rotation.z=Math.PI/2;roller.position.set(x,-.98,z);rig.add(roller);}
  const motor=new THREE.Mesh(new THREE.CylinderGeometry(.4,.4,.62,32),dark);motor.rotation.z=Math.PI/2;motor.position.set(-2.65,-.8,0);rig.add(motor);
  scene.add(new THREE.HemisphereLight(0xf0e9e0,0x36100b,2.1));
  const key=new THREE.DirectionalLight(0xffede0,5);key.position.set(4,6,7);scene.add(key);
  const rim=new THREE.DirectionalLight(0xff4025,6);rim.position.set(-5,3,-4);scene.add(rim);
  const fill=new THREE.DirectionalLight(0xb4c6e4,2);fill.position.set(-4,2,5);scene.add(fill);
  let frame=0,last=0,pointer=0;
  const render=()=>renderer.render(scene,camera);
  const animate=time=>{frame=0;if(paused||!visible||document.hidden)return;const dt=Math.min((time-last)/1000,.05);last=time;drum.rotation.y+=dt*.24;rig.rotation.y+=(pointer*.12-rig.rotation.y)*.04;render();frame=requestAnimationFrame(animate);};
  syncScene=()=>{cancelAnimationFrame(frame);frame=0;render();if(!paused&&visible&&!document.hidden){last=performance.now();frame=requestAnimationFrame(animate);}};
  new ResizeObserver(()=>{const r=canvas.parentElement.getBoundingClientRect();renderer.setSize(r.width,r.height,false);camera.aspect=r.width/r.height;camera.position.set(6,3.2,9);camera.position.multiplyScalar(Math.max(1,1.2/camera.aspect));camera.updateProjectionMatrix();render();}).observe(canvas.parentElement);
  section.addEventListener('pointermove',e=>{if(!reduce.matches&&e.pointerType==='mouse')pointer=(e.clientX/innerWidth-.5)*2;},{passive:true});
  syncScene();
 } catch(error) { canvas.hidden=true; document.querySelector('.concept-fallback').hidden=false; button?.setAttribute('hidden',''); }
}
