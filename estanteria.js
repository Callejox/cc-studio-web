/* ============================================================
   CC STUDIO — estanteria.js
   Motor de la biblioteca 3D del archivo de proyectos.
   Lo usan la página independiente (estanteria.html) y el index
   (sección #works). En modo embed la rueda NO se captura: la
   página sigue scrolleando con normalidad y el estante se
   recorre con arrastre, flechas, botones y marcadores.
   ============================================================ */
import * as THREE from 'three';

export function initEstanteria({ canvas, embed = false } = {}) {

/* ---------- datos ---------- */
const PROJECTS = [
  { num:'01', title:'La Brisa Salou', url:'https://labrisasalou.com', img:'img/portfolio/labrisa.webp', cloth:'#46543F',
    svc:['Diseño y construcción web','Carta digital con QR','SEO local','GEO — visibilidad en buscadores de IA','Ficha de Google Business','Mantenimiento'] },
  { num:'02', title:'Rent a Boat Salou', url:'https://rentaboatsalou.com', img:'img/portfolio/rentaboat-salou.webp', cloth:'#33465C',
    svc:['Diseño y construcción web','Gestor de reservas a medida','Web en 4 idiomas (ES·EN·FR·CA)','SEO local + GEO','Analítica propia sin cookies','Automatización de operaciones'] },
  { num:'03', title:'Boat 4 Rent', url:'https://boat4renttarragona.com', img:'img/portfolio/boat4rent.webp', cloth:'#563A2E',
    svc:['Diseño y construcción web','Catálogo de flota','Tarifas y disponibilidad online','SEO local','GEO — visibilidad en buscadores de IA'] },
  { num:'04', title:'Pizzería Da Luca', url:'https://pizzeriadaluca.es', img:'img/portfolio/daluca.webp', cloth:'#5E3236',
    svc:['Diseño y construcción web','Carta digital','Pedidos a domicilio','SEO local','Ficha de Google Business'] },
  { num:'05', title:'Le Massage', url:'https://lemassage.es', img:'img/portfolio/lemassage.webp', cloth:'#4A3D52',
    svc:['Diseño y construcción web','Sistema de reservas online','Email marketing','Publicidad — Meta y Google Ads','SEO local + GEO'] },
];
const DESCS = [
  'Restaurante del paseo de Salou: una carta digital que se abre con QR y un SEO local pensado para llenar mesas.',
  'Alquiler de barcos con reservas en tiempo real, web en cuatro idiomas y analítica propia sin cookies.',
  'Flota, catálogo y tarifas online para el alquiler náutico en Tarragona.',
  'Pizzería de barrio con carta digital y pedidos a domicilio directamente desde su web.',
  'Centro de masajes con reservas online, mailing a clientas y campañas de publicidad.',
];
const FOIL = '#C2A15B', PAPER_EDGE = '#E4D5AF';

const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
const DUR = reduce ? 0 : 0.65;

let seed = 20260729 >>> 0;
const rand = () => {
  seed = (seed + 0x6D2B79F5) | 0;
  let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
  t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
};

/* ---------- texturas procedurales ---------- */
function tex(c) {
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  t.anisotropy = 8;
  return t;
}
function clothPaint(x, w, h, color) {
  x.fillStyle = color; x.fillRect(0, 0, w, h);
  const img = x.getImageData(0, 0, w, h), d = img.data;
  for (let i = 0; i < d.length; i += 4) {
    const n = (Math.random() - 0.5) * 22;
    d[i] += n; d[i+1] += n; d[i+2] += n;
  }
  x.putImageData(img, 0, 0);
  x.globalAlpha = 0.05;
  for (let y = 0; y < h; y += 3) { x.fillStyle = y % 6 ? '#000' : '#fff'; x.fillRect(0, y, w, 1); }
  for (let i = 0; i < w; i += 3) { x.fillStyle = i % 6 ? '#000' : '#fff'; x.fillRect(i, 0, 1, h); }
  x.globalAlpha = 0.07;
  for (let i = 0; i < 12; i++) {
    x.fillStyle = '#fff';
    x.save();
    x.translate(Math.random() * w, Math.random() * h);
    x.rotate(Math.random() * Math.PI);
    x.fillRect(0, 0, 20 + Math.random() * 60, 1 + Math.random() * 2);
    x.restore();
  }
  x.globalAlpha = 1;
  const v = x.createRadialGradient(w/2, h/2, Math.min(w,h)*0.3, w/2, h/2, Math.max(w,h)*0.75);
  v.addColorStop(0, 'rgba(0,0,0,0)');
  v.addColorStop(1, 'rgba(10,6,2,0.42)');
  x.fillStyle = v; x.fillRect(0, 0, w, h);
}
function foil(x, alpha = 0.85) {
  x.strokeStyle = FOIL; x.fillStyle = FOIL;
  x.globalAlpha = alpha;
}
function makeSpine(p) {
  const c = document.createElement('canvas'); c.width = 160; c.height = 640;
  const x = c.getContext('2d');
  clothPaint(x, 160, 640, p.cloth);
  const cyl = x.createLinearGradient(0, 0, 160, 0);
  cyl.addColorStop(0, 'rgba(0,0,0,.38)'); cyl.addColorStop(.18, 'rgba(255,255,255,.07)');
  cyl.addColorStop(.5, 'rgba(255,255,255,.10)');
  cyl.addColorStop(.82, 'rgba(255,255,255,.07)'); cyl.addColorStop(1, 'rgba(0,0,0,.38)');
  x.fillStyle = cyl; x.fillRect(0, 0, 160, 640);
  for (const y of [70, 150, 470, 550]) {
    x.fillStyle = 'rgba(255,255,255,.13)'; x.fillRect(12, y, 136, 3);
    x.fillStyle = 'rgba(0,0,0,.35)'; x.fillRect(12, y + 3, 136, 5);
    x.fillStyle = 'rgba(0,0,0,.18)'; x.fillRect(12, y - 3, 136, 2);
  }
  foil(x, .8);
  x.lineWidth = 1.5;
  x.strokeRect(20, 22, 120, 596);
  x.font = '24px Georgia, serif'; x.textAlign = 'center';
  x.fillText(p.num, 80, 52);
  x.save(); x.translate(80, 310); x.rotate(Math.PI / 2);
  x.font = 'italic 30px Georgia, serif'; x.textBaseline = 'middle';
  x.fillText(p.title, 0, 0);
  x.restore();
  x.font = '15px Georgia, serif';
  x.fillText('CC · STUDIO', 80, 600);
  x.globalAlpha = 1;
  return tex(c);
}
function makeCover(p) {
  const c = document.createElement('canvas'); c.width = 512; c.height = 640;
  const x = c.getContext('2d');
  clothPaint(x, 512, 640, p.cloth);
  foil(x, .8);
  x.lineWidth = 3; x.strokeRect(26, 26, 460, 588);
  x.lineWidth = 1; x.strokeRect(38, 38, 436, 564);
  x.font = 'italic 44px Georgia, serif'; x.textAlign = 'center';
  x.fillText(p.title, 256, 112, 400);
  x.font = '16px Georgia, serif';
  x.fillText('— CC STUDIO —', 256, 580);
  x.globalAlpha = 1;
  const t = tex(c);
  const img = new Image();
  img.onload = () => {
    const fw = 356, fh = 336, fx = (512 - fw) / 2, fy = 164;
    x.globalAlpha = 1;
    x.fillStyle = PAPER_EDGE; x.fillRect(fx - 9, fy - 9, fw + 18, fh + 18);
    const s = Math.max(fw / img.width, fh / img.height);
    const sw = fw / s, sh = fh / s;
    x.drawImage(img, (img.width - sw) / 2, (img.height - sh) / 2, sw, sh, fx, fy, fw, fh);
    x.fillStyle = 'rgba(90,70,40,.14)'; x.fillRect(fx, fy, fw, fh);
    foil(x, .9); x.lineWidth = 3; x.strokeRect(fx - 9, fy - 9, fw + 18, fh + 18);
    x.globalAlpha = 1;
    t.needsUpdate = true;
  };
  img.src = p.img;
  return t;
}
function makePaper(lines = false) {
  const c = document.createElement('canvas'); c.width = 256; c.height = 256;
  const x = c.getContext('2d');
  x.fillStyle = '#E8DBBB'; x.fillRect(0, 0, 256, 256);
  const img = x.getImageData(0, 0, 256, 256), d = img.data;
  for (let i = 0; i < d.length; i += 4) {
    const n = (Math.random() - 0.5) * 12;
    d[i] += n; d[i+1] += n; d[i+2] += n;
  }
  x.putImageData(img, 0, 0);
  for (let i = 0; i < 26; i++) {
    x.fillStyle = `rgba(140,105,55,${0.04 + Math.random() * 0.05})`;
    x.beginPath();
    x.arc(Math.random() * 256, Math.random() * 256, 2 + Math.random() * 9, 0, Math.PI * 2);
    x.fill();
  }
  if (lines) {
    for (let y = 0; y < 256; y += 2) {
      x.fillStyle = y % 4 ? 'rgba(120,95,55,.25)' : 'rgba(255,250,235,.35)';
      x.fillRect(0, y, 256, 1);
    }
  }
  return tex(c);
}
function makeWood(base = '#3E2C1E') {
  const c = document.createElement('canvas'); c.width = 512; c.height = 512;
  const x = c.getContext('2d');
  x.fillStyle = base; x.fillRect(0, 0, 512, 512);
  for (let i = 0; i < 150; i++) {
    const y = Math.random() * 512;
    x.strokeStyle = `rgba(${Math.random() > .5 ? '25,15,8' : '95,70,45'},${0.06 + Math.random() * 0.12})`;
    x.lineWidth = 1 + Math.random() * 3;
    x.beginPath();
    x.moveTo(0, y);
    x.bezierCurveTo(170, y + (Math.random()-.5)*22, 340, y + (Math.random()-.5)*22, 512, y + (Math.random()-.5)*14);
    x.stroke();
  }
  for (let i = 0; i < 5; i++) {
    const nx = Math.random()*512, ny = Math.random()*512;
    x.strokeStyle = 'rgba(20,12,6,.3)';
    for (let r = 2; r < 14; r += 3) { x.beginPath(); x.ellipse(nx, ny, r*1.6, r, 0, 0, Math.PI*2); x.stroke(); }
  }
  const v = x.createRadialGradient(256,256,120, 256,256,380);
  v.addColorStop(0,'rgba(0,0,0,0)'); v.addColorStop(1,'rgba(0,0,0,.35)');
  x.fillStyle = v; x.fillRect(0,0,512,512);
  const t = tex(c);
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  return t;
}

/* ---------- escena ---------- */
const renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.05;

const scene = new THREE.Scene();
scene.background = new THREE.Color('#171209');
scene.fog = new THREE.Fog('#171209', 5.5, 11);

const camera = new THREE.PerspectiveCamera(32, 1, 0.1, 30);

scene.add(new THREE.HemisphereLight(0xffe9c4, 0x1c130c, 0.5));
const sun = new THREE.DirectionalLight(0xffdcae, 1.5);
sun.position.set(2.5, 4, 3);
sun.castShadow = true;
sun.shadow.mapSize.set(2048, 2048);
sun.shadow.bias = -0.0004;
scene.add(sun);
const lamp = new THREE.PointLight(0xffb35c, 14, 8, 1.8);
lamp.position.set(0, 1.9, 1.4);
scene.add(lamp);

/* ---------- libros con tapa articulada ---------- */
const woodTex = makeWood();
const paperTex = makePaper(false);
const paperEdgeTex = makePaper(true);
const COVER_T = 0.018;

const books = [];
const hitMeshes = [];
let cursor = 0;
for (let i = 0; i < PROJECTS.length; i++) {
  const p = PROJECTS[i];
  const h = 1.14 + rand() * 0.1;
  const w = 0.34 + rand() * 0.07;
  const d = 0.7 + rand() * 0.06;

  const cloth = new THREE.MeshStandardMaterial({ color: p.cloth, roughness: 0.92 });
  const clothDark = new THREE.MeshStandardMaterial({ color: new THREE.Color(p.cloth).multiplyScalar(0.55), roughness: 0.95 });
  const paperM = new THREE.MeshStandardMaterial({ map: paperTex, roughness: 0.9 });
  const paperEdgeM = new THREE.MeshStandardMaterial({ map: paperEdgeTex, roughness: 0.9 });
  const coverT = makeCover(p);
  const coverM = new THREE.MeshStandardMaterial({ map: coverT, roughness: 0.85, bumpMap: coverT, bumpScale: 2.2 });
  const spineT = makeSpine(p);
  const spineM = new THREE.MeshStandardMaterial({ map: spineT, roughness: 0.85, bumpMap: spineT, bumpScale: 2.6 });

  const g = new THREE.Group();

  const pages = new THREE.Mesh(
    new THREE.BoxGeometry(w - COVER_T * 2, h * 0.96, d - COVER_T),
    [paperM, paperM, paperEdgeM, paperEdgeM, clothDark, paperEdgeM]
  );
  pages.position.z = -COVER_T / 2;
  pages.castShadow = true;
  g.add(pages);

  const back = new THREE.Mesh(new THREE.BoxGeometry(COVER_T, h, d), cloth);
  back.position.x = -(w - COVER_T) / 2;
  back.castShadow = true;
  g.add(back);

  const spine = new THREE.Mesh(
    new THREE.BoxGeometry(w, h, COVER_T),
    [cloth, cloth, cloth, cloth, spineM, cloth]
  );
  spine.position.z = (d - COVER_T) / 2;
  spine.castShadow = true;
  g.add(spine);

  const pivot = new THREE.Group();
  pivot.position.set((w - COVER_T) / 2, 0, (d - COVER_T) / 2);
  const front = new THREE.Mesh(
    new THREE.BoxGeometry(COVER_T, h, d - COVER_T),
    [coverM, paperM, cloth, cloth, cloth, cloth]
  );
  front.position.z = -(d - COVER_T) / 2;
  front.castShadow = true;
  pivot.add(front);
  g.add(pivot);

  g.position.set(cursor + w / 2, h / 2, 0);
  g.rotation.z = (rand() - 0.5) * 0.012;
  g.userData = { project: p, slot: i, baseX: g.position.x, baseY: g.position.y, pivot };
  scene.add(g);
  books.push(g);
  g.traverse(m => { if (m.isMesh) { m.userData.book = g; hitMeshes.push(m); } });
  cursor += w;
}
const shelfLen = cursor;

/* ---------- mueble ---------- */
const woodM = new THREE.MeshStandardMaterial({ map: woodTex, roughness: 0.72, bumpMap: woodTex, bumpScale: 3 });
function slab(sx, sy, sz, px, py, pz) {
  const m = new THREE.Mesh(new THREE.BoxGeometry(sx, sy, sz), woodM);
  m.position.set(px, py, pz);
  m.receiveShadow = true; m.castShadow = true;
  scene.add(m);
  return m;
}
slab(shelfLen + 2.4, 0.08, 1.1, shelfLen / 2, -0.04, -0.02);
slab(shelfLen + 2.4, 0.09, 1.1, shelfLen / 2, 1.62, -0.02);
slab(shelfLen + 2.4, 0.34, 0.07, shelfLen / 2, -0.25, 0.46);
const backP = new THREE.Mesh(
  new THREE.PlaneGeometry(shelfLen + 14, 9),
  new THREE.MeshStandardMaterial({ map: woodTex, color: '#6E5844', roughness: 0.9 })
);
backP.material.map = woodTex.clone();
backP.material.map.repeat.set(6, 4);
backP.material.map.needsUpdate = true;
backP.position.set(shelfLen / 2, 2, -0.58);
backP.receiveShadow = true;
scene.add(backP);
for (const bx of [-0.1, shelfLen + 0.1]) {
  const end = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.62, 0.78), woodM);
  end.position.set(bx, 0.31, 0);
  end.castShadow = true; end.receiveShadow = true;
  scene.add(end);
}

/* ---------- estado ---------- */
let scroll = shelfLen / 2, scrollT = scroll;
const minX = books[0].userData.baseX, maxX = books[books.length - 1].userData.baseX;
let mode = 'browse';
let selected = null, hovered = null;
let zoomT = 1.3;

const raycaster = new THREE.Raycaster();
const pointer = new THREE.Vector2(-2, -2);
window.__shelf = { books, camera, pointer, raycaster,
  state: () => ({ mode, hovered: hovered?.userData?.project?.title ?? null, scroll, scrollT, dragMoved }) };

function resize() {
  const w = canvas.clientWidth || 1, h = canvas.clientHeight || 1;
  camera.aspect = w / h;
  camera.updateProjectionMatrix();
  renderer.setSize(w, h, false);
}
new ResizeObserver(resize).observe(canvas);
resize();

const clamp = (v, a, b) => Math.min(b, Math.max(a, v));

/* ---------- interacción ---------- */
const hint = document.getElementById('hint');
let hinted = false;
const useHint = () => { if (!hinted) { hinted = true; hint && hint.classList.add('off'); } };

let dragging = false, dragMoved = 0, px = 0;
canvas.addEventListener('pointerdown', e => {
  dragging = true; dragMoved = 0; px = e.clientX;
  canvas.setPointerCapture(e.pointerId);
});
canvas.addEventListener('pointermove', e => {
  const r = canvas.getBoundingClientRect();
  pointer.set(((e.clientX - r.left) / r.width) * 2 - 1, -((e.clientY - r.top) / r.height) * 2 + 1);
  if (!dragging || mode !== 'browse') return;
  const dx = e.clientX - px; px = e.clientX;
  dragMoved += Math.abs(dx);
  scrollT = clamp(scrollT - dx * 0.004, minX, maxX);
  if (Math.abs(dx) > 2) useHint();
});
const endDrag = () => { dragging = false; };
canvas.addEventListener('pointerup', endDrag);
canvas.addEventListener('pointercancel', endDrag);

/* En modo embed la rueda NO se toca: la página scrollea con normalidad */
if (!embed) {
  canvas.addEventListener('wheel', e => {
    e.preventDefault();
    if (mode !== 'browse') return;
    scrollT = clamp(scrollT + (e.deltaY + e.deltaX) * 0.0016, minX, maxX);
    useHint();
  }, { passive: false });
}

let inView = true;
if (embed) {
  new IntersectionObserver(es => { inView = es[0].isIntersecting; if (inView) wakeLoop(); },
    { rootMargin: '150px 0px' }).observe(canvas);
}

addEventListener('keydown', e => {
  if (e.key === 'Escape' && mode === 'inspect') closeBook();
  if (mode !== 'browse' || (embed && !inView)) return;
  if (e.key === 'ArrowRight') { scrollT = clamp(scrollT + 0.45, minX, maxX); useHint(); }
  if (e.key === 'ArrowLeft')  { scrollT = clamp(scrollT - 0.45, minX, maxX); useHint(); }
});

canvas.addEventListener('click', () => {
  if (dragMoved > 6 || mode !== 'browse') return;
  if (hovered) openBook(hovered);
});

document.getElementById('prev').addEventListener('click', () => { if (mode === 'browse') scrollT = clamp(scrollT - 0.6, minX, maxX); });
document.getElementById('next').addEventListener('click', () => { if (mode === 'browse') scrollT = clamp(scrollT + 0.6, minX, maxX); });

const markersEl = document.getElementById('markers');
const markerBtns = PROJECTS.map((p, i) => {
  const b = document.createElement('button');
  b.className = 'marker'; b.title = p.title; b.setAttribute('aria-label', p.title);
  b.addEventListener('click', () => {
    if (mode === 'inspect') closeBook();
    scrollT = books[i].userData.baseX;
    useHint();
  });
  markersEl.appendChild(b);
  return b;
});

/* ---------- abrir / cerrar ---------- */
const spread = document.getElementById('spread');
const sFrame = document.getElementById('sFrame');
function openBook(g) {
  mode = 'opening'; selected = g;
  const p = g.userData.project;
  document.getElementById('sTitle').textContent = p.title;
  document.getElementById('sDesc').textContent = DESCS[g.userData.slot];
  document.getElementById('sLink').href = p.url;
  const svc = document.getElementById('sSvc');
  svc.innerHTML = '';
  p.svc.forEach(s => { const li = document.createElement('li'); li.textContent = s; svc.appendChild(li); });
  scrollT = g.userData.baseX;
  zoomT = 1.3;
  gsap.to(g.position, { x: g.userData.baseX, y: 0.85, z: 1.15, duration: DUR, ease: 'power3.out' });
  gsap.to(g.rotation, { y: -Math.PI / 2, x: 0.04, z: 0, duration: DUR, ease: 'power3.out',
    onComplete: () => {
      gsap.to(g.userData.pivot.rotation, { y: -2.35, duration: reduce ? 0 : 0.85, ease: 'power2.inOut',
        onComplete: revealSpread });
      gsap.to(g.position, { z: 1.35, duration: reduce ? 0 : 0.85, ease: 'power2.inOut' });
      if (reduce) revealSpread();
    } });
  if (reduce) {
    g.position.set(g.userData.baseX, 0.85, 1.35);
    g.rotation.set(0.04, -Math.PI / 2, 0);
    g.userData.pivot.rotation.y = -2.35;
    revealSpread();
  }
}
function revealSpread() {
  if (!selected) return;
  mode = 'inspect';
  sFrame.src = selected.userData.project.url;
  spread.classList.add('open');
  document.documentElement.style.overflow = 'hidden';   /* congela la página de detrás */
  window.__lenis && window.__lenis.stop();              /* y también el scroll suave */
  document.getElementById('sClose').focus();
}
function closeBook() {
  const g = selected; if (!g) return;
  mode = 'opening';
  spread.classList.remove('open');
  document.documentElement.style.overflow = '';
  window.__lenis && window.__lenis.start();
  sFrame.src = 'about:blank';
  gsap.to(g.userData.pivot.rotation, { y: 0, duration: reduce ? 0 : 0.6, ease: 'power2.inOut',
    onComplete: () => {
      gsap.to(g.position, { x: g.userData.baseX, y: g.userData.baseY, z: 0, duration: DUR, ease: 'power3.inOut' });
      gsap.to(g.rotation, { x: 0, y: 0, z: 0, duration: DUR, ease: 'power3.inOut',
        onComplete: () => { mode = 'browse'; selected = null; } });
    } });
  if (reduce) {
    g.userData.pivot.rotation.y = 0;
    g.position.set(g.userData.baseX, g.userData.baseY, 0);
    g.rotation.set(0, 0, 0);
    mode = 'browse'; selected = null;
  }
}
document.getElementById('sClose').addEventListener('click', closeBook);
document.getElementById('spreadVeil').addEventListener('click', closeBook);
window.__shelf.open = openBook;
window.__shelf.close = closeBook;

/* ---------- bucle ---------- */
let rafOn = false;
document.addEventListener('visibilitychange', () => {
  if (document.visibilityState === 'visible') wakeLoop();
});
function wakeLoop() { if (!rafOn) { rafOn = true; requestAnimationFrame(tick); } }

function tick() {
  if (document.visibilityState !== 'visible' || (embed && !inView && mode === 'browse')) {
    rafOn = false;
    return;
  }
  requestAnimationFrame(tick);

  const k = reduce ? 1 : 0.09;
  scroll += (scrollT - scroll) * k;

  const aspectFix = Math.max(1, 1.25 / camera.aspect);
  const inspecting = mode !== 'browse';
  const camZ = (inspecting ? 2.15 * zoomT : 3.35) * aspectFix;
  const camY = inspecting ? 0.86 : 0.85;
  camera.position.set(scroll, camY, camZ);
  camera.lookAt(scroll, inspecting ? 0.8 : 0.55, 0);
  sun.position.set(scroll + 2.5, 4, 3);
  sun.target.position.set(scroll, 0, 0);
  sun.target.updateMatrixWorld();
  lamp.position.x = scroll;

  if (mode === 'browse') {
    raycaster.setFromCamera(pointer, camera);
    const hits = raycaster.intersectObjects(hitMeshes);
    const target = hits.length ? hits[0].object.userData.book : null;
    if (target !== hovered) {
      if (hovered) gsap.to(hovered.position, { z: 0, duration: 0.35, ease: 'power2.out' });
      hovered = target;
      if (hovered) gsap.to(hovered.position, { z: 0.16, duration: 0.35, ease: 'power2.out' });
      canvas.style.cursor = hovered ? 'pointer' : 'grab';
    }
    let ni = 0, nd = 1e9;
    books.forEach((b, i) => {
      const dd = Math.abs(b.userData.baseX - scroll);
      if (dd < nd) { nd = dd; ni = i; }
    });
    markerBtns.forEach((b, i) => b.classList.toggle('on', i === ni));
  }

  renderer.render(scene, camera);
}
wakeLoop();
}
