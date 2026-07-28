/* ============================================================
   CC STUDIO — Prototipo estilo editorial (código propio)
   ============================================================ */
document.addEventListener('DOMContentLoaded', () => {
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ---------- Scroll suave (Lenis) ---------- */
  let lenis = null;
  if (typeof Lenis !== 'undefined' && !reduce) {
    lenis = new Lenis({ duration: 1.2 });
    const raf = t => { lenis.raf(t); requestAnimationFrame(raf); };
    requestAnimationFrame(raf);
  }
  document.querySelectorAll('a[href^="#"]').forEach(a => {
    a.addEventListener('click', e => {
      const id = a.getAttribute('href');
      if (id.length < 2) return;
      const t = document.querySelector(id);
      if (!t) return;
      e.preventDefault();
      if (lenis) lenis.scrollTo(t, { offset: -60 });
      else t.scrollIntoView({ behavior: 'smooth' });
    });
  });

  /* ---------- Vídeo del hero: respetar reduced-motion ---------- */
  const heroVideo = document.querySelector('.pp-hero__bg video');
  if (heroVideo && reduce) {
    heroVideo.removeAttribute('autoplay');
    heroVideo.pause();
  }

  /* ---------- Vídeos perezosos: cargan al acercarse (data-src) ---------- */
  document.querySelectorAll('video[data-src]').forEach(v => {
    if (reduce) { v.removeAttribute('autoplay'); return; }
    const ioV = new IntersectionObserver(entries => {
      if (entries[0].isIntersecting) { v.src = v.dataset.src; ioV.disconnect(); }
    }, { rootMargin: '100% 0px' });
    ioV.observe(v);
  });

  /* ---------- Onda líquida del CTA (canvas, colores de la marca) ---------- */
  (function () {
    const cv = document.getElementById('ppWave');
    if (!cv) return;
    const ctx = cv.getContext('2d');
    const section = cv.closest('.pp-contact');
    if (!ctx || !section) return;

    // Se dibuja a media resolución (va desenfocada por CSS) para rendimiento
    const scale = 0.5 * Math.min(devicePixelRatio || 1, 1.5);
    let W = 0, H = 0;
    function resizeWave() {
      const r = section.getBoundingClientRect();
      W = cv.width = Math.max(2, Math.round(r.width * scale));
      H = cv.height = Math.max(2, Math.round(r.height * scale));
    }
    resizeWave();
    addEventListener('resize', resizeWave);

    // Tres cintas: azul acero, verde salvia y azul hielo de la marca
    const layers = [
      { c1: 'rgba(91,139,176,.85)',  c2: 'rgba(107,143,113,.45)', amp: .16, speed: .22, yBase: .52, freq: 1.2, ph: 0,   thick: .20 },
      { c1: 'rgba(107,143,113,.70)', c2: 'rgba(91,139,176,.35)',  amp: .12, speed: .16, yBase: .64, freq: 1.7, ph: 2.1, thick: .15 },
      { c1: 'rgba(178,205,228,.55)', c2: 'rgba(91,139,176,.28)',  amp: .10, speed: .28, yBase: .46, freq: 2.3, ph: 4.2, thick: .10 }
    ];

    let t = 0, last = 0, running = false, rafWave = 0;
    function frame(now) {
      const dt = Math.min((now - last) / 1000, 0.05); last = now;
      t += dt;
      ctx.clearRect(0, 0, W, H);
      ctx.globalCompositeOperation = 'lighter';
      const steps = 26;
      for (const L of layers) {
        const g = ctx.createLinearGradient(0, 0, W, 0);
        g.addColorStop(0, 'rgba(0,0,0,0)');
        g.addColorStop(.25, L.c2);
        g.addColorStop(.55, L.c1);
        g.addColorStop(.85, L.c2);
        g.addColorStop(1, 'rgba(0,0,0,0)');
        ctx.fillStyle = g;
        ctx.beginPath();
        const yb = H * L.yBase;
        for (let s = 0; s <= steps; s++) {
          const u = s / steps, x = W * u;
          const y = yb
            + Math.sin(u * Math.PI * 2 * L.freq + t * L.speed * 3 + L.ph) * H * L.amp
            + Math.sin(u * Math.PI * L.freq - t * L.speed * 2) * H * L.amp * 0.5;
          s === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
        }
        for (let s = steps; s >= 0; s--) {
          const u = s / steps, x = W * u;
          const y = yb + H * L.thick
            + Math.sin(u * Math.PI * 2 * L.freq + t * L.speed * 3 + L.ph + 0.9) * H * L.amp * 1.15;
          ctx.lineTo(x, y);
        }
        ctx.closePath();
        ctx.fill();
      }
      if (running) rafWave = requestAnimationFrame(frame);
    }

    if (reduce) {
      last = performance.now();
      frame(last);                       // un solo fotograma estático
    } else {
      const ioWave = new IntersectionObserver(entries => {
        const v = entries[0].isIntersecting;
        if (v && !running) { running = true; last = performance.now(); rafWave = requestAnimationFrame(frame); }
        else if (!v && running) { running = false; cancelAnimationFrame(rafWave); }
      }, { rootMargin: '10% 0px' });
      ioWave.observe(section);
    }
  })();

  /* ---------- Aviso de cookies (gobierna el píxel de Meta) ---------- */
  (function () {
    const banner = document.getElementById('ppCookies');
    if (!banner) return;
    if (!localStorage.getItem('cc-cookies')) banner.hidden = false;
    document.getElementById('ppCookiesOk').addEventListener('click', () => {
      localStorage.setItem('cc-cookies', 'accepted');
      banner.hidden = true;
      if (window.ccLoadTrackers) window.ccLoadTrackers();
    });
    document.getElementById('ppCookiesNo').addEventListener('click', () => {
      localStorage.setItem('cc-cookies', 'rejected');
      banner.hidden = true;
    });
  })();

  /* ---------- Navbar al hacer scroll + WhatsApp flotante ---------- */
  const nav = document.getElementById('ppNav');
  const wa = document.getElementById('ppWa');
  addEventListener('scroll', () => {
    nav.classList.toggle('scrolled', scrollY > 60);
    if (wa) wa.classList.toggle('on', scrollY > innerHeight * 0.8);
  }, { passive: true });

  /* ---------- Menú móvil ---------- */
  const toggle = document.getElementById('ppToggle');
  const mobile = document.getElementById('ppMobile');
  if (toggle && mobile) {
    toggle.addEventListener('click', () => {
      const open = toggle.classList.toggle('open');
      mobile.classList.toggle('open', open);
      toggle.setAttribute('aria-expanded', open);
    });
    mobile.querySelectorAll('a').forEach(a => a.addEventListener('click', () => {
      toggle.classList.remove('open');
      mobile.classList.remove('open');
      toggle.setAttribute('aria-expanded', 'false');
    }));
  }

  /* ---------- Acordeón FAQ ---------- */
  document.querySelectorAll('.pp-faq__item').forEach(item => {
    const btn = item.querySelector('.pp-faq__q');
    const ans = item.querySelector('.pp-faq__a');
    btn.addEventListener('click', () => {
      const open = item.classList.toggle('open');
      btn.setAttribute('aria-expanded', open);
      ans.style.maxHeight = open ? ans.scrollHeight + 'px' : null;
    });
  });

  /* ---------- Confirmación tras enviar el formulario ---------- */
  if (new URLSearchParams(location.search).get('enviado') === '1') {
    const form = document.querySelector('.pp-form');
    if (form) {
      const ok = document.createElement('p');
      ok.className = 'pp-form__ok';
      ok.textContent = '¡Mensaje enviado! Te respondemos en menos de 24 horas.';
      form.parentNode.insertBefore(ok, form);
      form.reset();
    }
  }

  /* ---------- Preloader ---------- */
  const loader = document.getElementById('pp-loader');
  const count = document.getElementById('ppCount');
  if (loader && count) {
    if (reduce) { loader.style.display = 'none'; }
    else {
      document.body.style.overflow = 'hidden';
      let n = 0, done = false;
      const finish = () => {
        if (done) return; done = true;
        clearInterval(iv);
        setTimeout(() => {
          loader.classList.add('done');
          document.body.style.overflow = '';
          revealHero();
          loader.addEventListener('transitionend', () => loader.style.display = 'none', { once: true });
        }, 300);
      };
      const iv = setInterval(() => {
        n += Math.floor(Math.random() * 8) + 3;
        if (n >= 100) { n = 100; finish(); }
        count.textContent = String(n).padStart(2, '0');
      }, 45);
      setTimeout(finish, 4000); // failsafe
    }
  } else { document.body.style.overflow = ''; }

  /* ---------- Grano de película (canvas) ---------- */
  (function () {
    const cv = document.getElementById('ppGrain');
    if (!cv || reduce || window.innerWidth <= 768) { if (cv) cv.style.display = 'none'; return; }
    const ctx = cv.getContext('2d'); if (!ctx) return;
    // Grano fino, denso y tenue -> aspecto filmíco fluido (menos "ruido")
    const SCALE = 1.25, FRAMES = 12, FPS = 20, DENSITY = 0.6, ALPHA = 0xa0;
    let w, h, frames = [], idx = 0, last = 0;
    function bake() {
      w = Math.ceil(innerWidth / SCALE); h = Math.ceil(innerHeight / SCALE);
      cv.width = w; cv.height = h; frames = [];
      const px = (ALPHA << 24) | 0x00ffffff;   // blanco con alfa parcial (más suave)
      for (let f = 0; f < FRAMES; f++) {
        const im = ctx.createImageData(w, h), buf = new Uint32Array(im.data.buffer);
        for (let p = 0; p < buf.length; p++) if (Math.random() < DENSITY) buf[p] = px;
        frames.push(im);
      }
    }
    function tick(t) {
      requestAnimationFrame(tick);
      if (document.visibilityState === 'hidden' || t - last < 1000 / FPS) return;
      last = t; idx = (idx + 1) % FRAMES; ctx.putImageData(frames[idx], 0, 0);
    }
    let rt; addEventListener('resize', () => { clearTimeout(rt); rt = setTimeout(bake, 180); });
    bake(); requestAnimationFrame(tick);
  })();

  /* ---------- Cursor con rastro ---------- */
  if (window.matchMedia('(pointer:fine)').matches && !reduce) {
    const N = 12;
    const dot = document.createElement('div'); dot.className = 'pp-cursor-dot'; document.body.appendChild(dot);
    const trail = [];
    for (let i = 0; i < N; i++) {
      const t = document.createElement('div'); t.className = 'pp-cursor-trail';
      const s = Math.max(2, 6 * (1 - i / N));
      t.style.width = s + 'px'; t.style.height = s + 'px'; t.style.opacity = String(0.4 * (1 - i / N));
      document.body.appendChild(t); trail.push({ el: t, x: 0, y: 0 });
    }
    let mx = 0, my = 0, dx = 0, dy = 0;
    addEventListener('mousemove', e => { mx = e.clientX; my = e.clientY; });
    (function loop() {
      dx += (mx - dx) * .35; dy += (my - dy) * .35;
      dot.style.left = dx + 'px'; dot.style.top = dy + 'px';
      let px = dx, py = dy;
      for (const p of trail) { p.x += (px - p.x) * .35; p.y += (py - p.y) * .35; p.el.style.left = p.x + 'px'; p.el.style.top = p.y + 'px'; px = p.x; py = p.y; }
      requestAnimationFrame(loop);
    })();
    document.querySelectorAll('a, button, .pp-work__link, .pp-caps li').forEach(el => {
      el.addEventListener('mouseenter', () => dot.classList.add('hover'));
      el.addEventListener('mouseleave', () => dot.classList.remove('hover'));
    });
  }

  /* ---------- Reveals al hacer scroll ---------- */
  const io = new IntersectionObserver((entries) => {
    entries.forEach(en => { if (en.isIntersecting) { en.target.classList.add('in'); io.unobserve(en.target); } });
  }, { threshold: 0.15, rootMargin: '0px 0px -10% 0px' });
  document.querySelectorAll('[data-reveal], [data-reveal-line]').forEach(el => {
    if (reduce) { el.classList.add('in'); return; }
    io.observe(el);
  });

  // El hero se revela al cerrar el preloader
  function revealHero() {
    document.querySelectorAll('.pp-hero [data-reveal-line]').forEach((el, i) => {
      setTimeout(() => el.classList.add('in'), 120 * i);
    });
    document.querySelectorAll('.pp-hero [data-reveal]').forEach((el, i) => {
      setTimeout(() => el.classList.add('in'), 300 + 120 * i);
    });
    scramble(document.querySelector('.pp-hero [data-scramble]'));
  }
  if (reduce) { revealHero(); }

  /* ---------- Efecto scramble de texto ---------- */
  function scramble(el) {
    if (!el || reduce) return;
    const final = el.dataset._t || (el.dataset._t = el.textContent);
    const chars = '·—/#*<>[]{}0123456789abcdef';
    let frame = 0;
    const total = final.length;
    const iv = setInterval(() => {
      let out = '';
      for (let i = 0; i < total; i++) {
        if (i < frame) out += final[i];
        else if (final[i] === ' ') out += ' ';
        else out += chars[Math.floor(Math.random() * chars.length)];
      }
      el.textContent = out;
      frame += 0.5;
      if (frame >= total) { clearInterval(iv); el.textContent = final; }
    }, 30);
  }

  /* ---------- Mockups de dispositivo del hero (cambian + siguen el ratón) ---------- */
  (function () {
    const devices = document.getElementById('ppDevices');
    if (!devices) return;
    const tag = document.getElementById('ppDevTag');
    const projects = [
      { desktop: 'img/portfolio/labrisa.webp',         movil: 'img/portfolio/labrisa-movil.webp',         name: 'La Brisa' },
      { desktop: 'img/portfolio/rentaboat-salou.webp', movil: 'img/portfolio/rentaboat-salou-movil.webp', name: 'Rent a Boat' },
      { desktop: 'img/portfolio/boat4rent.webp',       movil: 'img/portfolio/boat4rent-movil.webp',       name: 'Boat 4 Rent' },
      { desktop: 'img/portfolio/daluca.webp',          movil: 'img/portfolio/daluca-movil.webp',          name: 'Da Luca' },
      { desktop: 'img/portfolio/lemassage.webp',       movil: 'img/portfolio/lemassage-movil.webp',       name: 'Le Massage' }
    ];
    // screens en orden DOM: [0] portátil (escritorio), [1] móvil
    const screens = [...devices.querySelectorAll('.pp-screen')].map((s, i) => ({
      imgs: [...s.querySelectorAll('.pp-ds-img')], active: 0, key: i === 0 ? 'desktop' : 'movil'
    }));
    let cur = 0;
    screens.forEach(s => { s.imgs[0].src = projects[0][s.key]; });
    if (tag) tag.textContent = projects[0].name + ' · Escritorio + Móvil';

    if (!reduce) {
      setInterval(() => {
        cur = (cur + 1) % projects.length;
        screens.forEach(s => {
          const next = 1 - s.active;
          s.imgs[next].src = projects[cur][s.key];
          s.imgs[next].classList.add('is-active');
          s.imgs[s.active].classList.remove('is-active');
          s.active = next;
        });
        if (tag) tag.textContent = projects[cur].name + ' · Escritorio + Móvil';
      }, 3600);

      let tx = 0, ty = 0, cx = 0, cy = 0;
      addEventListener('mousemove', e => { tx = e.clientX / innerWidth - .5; ty = e.clientY / innerHeight - .5; });
      (function loop() {
        cx += (tx - cx) * .07; cy += (ty - cy) * .07;
        devices.style.setProperty('--ry', (-14 + cx * 20) + 'deg');
        devices.style.setProperty('--rx', (6 - cy * 12) + 'deg');
        requestAnimationFrame(loop);
      })();
    }
  })();

  /* ---------- Hero morph v53: partículas que forman el logo ----------
     Miles de puntos blancos dispersos convergen, según se scrollea,
     hacia los píxeles reales del logotipo CC Studio (redibujado en un
     canvas oculto con las fuentes de la web y muestreado). El punto de
     marca sale azul él solo porque el color se hereda del píxel. */
  const ccMorph = (function () {
    const canvas = document.getElementById('heroMorph');
    if (!canvas) return null;
    const ctx = canvas.getContext('2d');
    if (!ctx) return null;

    const clamp  = (v,a,b) => Math.min(b, Math.max(a, v));
    const lerp   = (a,b,t) => a + (b - a) * t;
    const smooth = (a,b,x) => { const t = clamp((x - a) / (b - a), 0, 1); return t * t * (3 - 2 * t); };
    let seed = 20260728 >>> 0;
    const rand = () => {
      seed = (seed + 0x6D2B79F5) | 0;
      let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };

    /* 1) Redibujar el logo en un canvas oculto (viewBox 360×300 a 2x) */
    const LW = 720, LH = 600;
    function paintLogo() {
      const off = document.createElement('canvas');
      off.width = LW; off.height = LH;
      const o = off.getContext('2d');
      try { o.letterSpacing = '-12px'; } catch (e) {}
      o.font = "800 300px Poppins, Arial, sans-serif";
      o.fillStyle = '#F3F3F4';
      o.fillText('CC', 68, 364);
      try { o.letterSpacing = '0px'; } catch (e) {}
      o.beginPath(); o.arc(600, 140, 18, 0, Math.PI * 2);
      o.fillStyle = '#5B8BB0'; o.fill();
      o.fillStyle = '#F3F3F4';
      o.fillRect(80, 420, 560, 4);
      // STUDIO en Poppins (geométrica y redonda) y más grande: legible en puntos
      try { o.letterSpacing = '26px'; } catch (e) {}
      o.font = "600 60px Poppins, Arial, sans-serif";
      o.fillText('STUDIO', 84, 520);
      return o.getImageData(0, 0, LW, LH);
    }

    /* 2) Muestrear píxeles opacos → destinos de partícula.
       Muestreo por zonas: el punto azul y los textos pequeños necesitan
       más resolución que las letras CC (enormes) para leerse igual. */
    let P = [];              // partículas
    let boxRatio = LH / LW;  // alto/ancho de la caja real del logo

    // Sprites circulares por color: puntos redondos sin coste por frame
    const SPRITES = {};
    function sprite(r, g, b) {
      const k = r + ',' + g + ',' + b;
      if (SPRITES[k]) return SPRITES[k];
      const c = document.createElement('canvas');
      c.width = c.height = 16;
      const s = c.getContext('2d');
      s.fillStyle = `rgb(${r},${g},${b})`;
      s.beginPath(); s.arc(8, 8, 7, 0, Math.PI * 2); s.fill();
      SPRITES[k] = c;
      return c;
    }
    function buildParticles() {
      const img = paintLogo();
      const mobile = window.innerWidth < 768;
      const maxN = mobile ? 1600 : 3200;
      const inDot = (x, y) => x > 570 && x < 630 && y > 110 && y < 170;
      const inCC  = (x, y) => x > 55 && x < 575 && y > 140 && y < 390;

      const sample = (region, step) => {
        const out = [];
        for (let y = 0; y < LH; y += step) {
          for (let x = 0; x < LW; x += step) {
            if (!region(x, y)) continue;
            const i = (y * LW + x) * 4;
            if (img.data[i + 3] > 128) out.push([x, y, img.data[i], img.data[i + 1], img.data[i + 2]]);
          }
        }
        return out;
      };

      // Punto azul: máxima densidad · resto de rasgos finos: densidad alta
      const dotPts  = sample(inDot, 2);
      const finePts = sample((x, y) => !inDot(x, y) && !inCC(x, y), mobile ? 3 : 2);
      // CC: paso adaptativo hasta encajar en el presupuesto restante
      const budget = Math.max(400, maxN - dotPts.length - finePts.length);
      let step = mobile ? 5 : 4, ccPts = [];
      do {
        ccPts = sample(inCC, step);
        step++;
      } while (ccPts.length > budget && step < 14);

      // Caja real del dibujo: centra el logo por lo que existe de verdad
      const all = dotPts.concat(finePts, ccPts);
      let minX = 1e9, maxX = -1e9, minY = 1e9, maxY = -1e9;
      for (const [x, y] of all) {
        if (x < minX) minX = x; if (x > maxX) maxX = x;
        if (y < minY) minY = y; if (y > maxY) maxY = y;
      }
      const bcx = (minX + maxX) / 2, bcy = (minY + maxY) / 2;
      boxRatio = (maxY - minY) / (maxX - minX);

      P = all.map(([x, y, r, g, b]) => ({
        tx: (x - bcx) / (maxX - minX),               // destino normalizado (centro 0,0)
        ty: (y - bcy) / (maxX - minX),               // misma escala en ambos ejes
        sx: rand() * 1.3 - 0.65, sy: rand() * 1.3 - 0.65, // origen disperso (fracción del lienzo)
        delay: rand() * 0.45,
        size: 1.3 + rand() * 1.5,
        spr: sprite(r, g, b),
        tw: rand() * Math.PI * 2,
        r, g, b
      }));
    }

    let W = 0, H = 0, last = 0, copyTop = 0, copyRight = 0;
    function resize() {
      const dpr = Math.min(window.devicePixelRatio || 1, window.innerWidth < 768 ? 1.5 : 2);
      W = canvas.clientWidth; H = canvas.clientHeight;
      canvas.width = Math.round(W * dpr);
      canvas.height = Math.round(H * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      // Dónde empieza el TEXTO visible (la meta, no el contenedor con su
      // padding superior) y dónde acaba su columna: el logo no lo invade
      const cr = canvas.getBoundingClientRect();
      const firstText = document.querySelector('.pp-hero__meta') ||
                        document.querySelector('.pp-hero__content');
      copyTop = firstText
        ? firstText.getBoundingClientRect().top - cr.top
        : H * 0.55;
      const contentEl = document.querySelector('.pp-hero__content');
      copyRight = contentEl
        ? contentEl.getBoundingClientRect().right - cr.left
        : W * 0.5;
      draw(last);
    }

    function draw(t) {
      last = t = clamp(t, 0, 1);
      // Fondo de la marca (se enfría un punto al final, como en v52)
      const cool = smooth(0.6, 1, t);
      const bg = ctx.createLinearGradient(0, 0, 0, H);
      bg.addColorStop(0, `rgb(${10 + cool * 2},${10 + cool * 5},${11 + cool * 9})`);
      bg.addColorStop(1, `rgb(${20 - cool * 4},${20 + cool},${22 + cool * 5})`);
      ctx.fillStyle = bg;
      ctx.fillRect(0, 0, W, H);

      // Composición (medidas reales del texto tomadas en resize):
      //  - Escritorio: el logo ocupa EN GRANDE la columna libre a la
      //    derecha del bloque de texto, centrado en vertical.
      //  - Móvil: centrado, entre el menú y el inicio del texto.
      let cx, cy, logoW, logoH;
      if (W > 900) {
        const left = Math.min(copyRight + 32, W * 0.55);
        const availW = W - left - 32;
        logoW = Math.min(availW * 0.92, 780);
        logoH = logoW * boxRatio;
        const maxH = H * 0.72;
        if (logoH > maxH) { const f = maxH / logoH; logoW *= f; logoH *= f; }
        cx = left + availW / 2;
        cy = Math.max(H * 0.48, H * 0.14 + logoH / 2);
      } else {
        cx = W * 0.5;
        const bandTop = Math.max(H * 0.12, 112);   // por debajo del menú fijo
        const bandBottom = Math.min(copyTop - 28, H * 0.62);
        logoW = Math.min(W * 0.8, 680);
        logoH = logoW * boxRatio;
        const maxLogoH = Math.max(120, bandBottom - bandTop);
        if (logoH > maxLogoH) { const f = maxLogoH / logoH; logoW *= f; logoH *= f; }
        cy = (bandTop + bandBottom) / 2;
      }

      const formT = smooth(0.04, 0.82, t);          // progreso global de formación
      const settle = smooth(0.78, 1, t);            // logo asentado
      const scale = 1 + 0.03 * settle;

      // Halo azul suave detrás del logo cuando se asienta
      if (settle > 0.01) {
        const halo = ctx.createRadialGradient(cx, cy, 0, cx, cy, logoW * 0.75);
        halo.addColorStop(0, `rgba(91,139,176,${0.16 * settle})`);
        halo.addColorStop(1, 'rgba(91,139,176,0)');
        ctx.fillStyle = halo;
        ctx.fillRect(0, 0, W, H);
      }

      for (const p of P) {
        const q = smooth(p.delay, p.delay + 0.55, formT);   // progreso individual
        // deriva orgánica mientras está suelta
        const wobX = Math.sin(p.tw + t * 5) * 14 * (1 - q);
        const wobY = Math.cos(p.tw * 1.3 + t * 4) * 12 * (1 - q);
        const x = lerp(cx + p.sx * W, cx + p.tx * logoW * scale, q) + wobX;
        const y = lerp(cy + p.sy * H, cy + p.ty * logoW * scale, q) + wobY;
        // parpadeo sutil sueltas → alpha estable formadas
        const twinkle = 0.45 + 0.35 * Math.sin(p.tw + t * 8) ** 2;
        const a = lerp(twinkle * 0.8, 0.95, q);
        const s = p.size * lerp(1, 0.85, q);
        ctx.globalAlpha = a;
        ctx.drawImage(p.spr, x - s / 2, y - s / 2, s, s);
      }
      ctx.globalAlpha = 1;
    }

    // Las fuentes deben estar listas antes de muestrear el logo
    const boot = () => { buildParticles(); resize(); if (reduce) draw(1); };
    if (document.fonts && document.fonts.ready) {
      Promise.all([
        document.fonts.load("800 300px Poppins"),
        document.fonts.ready
      ]).then(boot).catch(boot);
    } else boot();

    let rTimer;
    addEventListener('resize', () => { clearTimeout(rTimer); rTimer = setTimeout(resize, 150); }, { passive: true });
    return { draw };
  })();

  /* ---------- Efectos de scroll cinematográficos (GSAP + ScrollTrigger) ---------- */
  (function () {
    if (!window.gsap || !window.ScrollTrigger || reduce) return;
    gsap.registerPlugin(ScrollTrigger);

    // Sincronizar Lenis (scroll suave) con ScrollTrigger
    if (lenis) lenis.on('scroll', ScrollTrigger.update);

    // A) Hero fijado: el orbe se transforma con el scroll y el titular
    //    cruza entre sus tres fases (web → software → lema)
    if (ccMorph) {
      const phases = Array.from(document.querySelectorAll('.pp-hero__titles .pp-hero__title'));
      const RANGES = [[0, 0.30], [0.36, 0.64], [0.72, 1]];
      const smooth = (a, b, x) => {
        const t = Math.min(1, Math.max(0, (x - a) / (b - a)));
        return t * t * (3 - 2 * t);
      };
      const crossfade = (p) => {
        phases.forEach((el, i) => {
          const [a, b] = RANGES[i];
          const inA  = i === 0 ? 1 : smooth(a, a + 0.07, p);
          const outA = i === phases.length - 1 ? 1 : 1 - smooth(b - 0.07, b, p);
          const alpha = Math.min(inA, outA);
          el.style.opacity = alpha.toFixed(3);
          el.style.transform = `translateY(${((1 - alpha) * 16).toFixed(1)}px)`;
          el.style.filter = `blur(${((1 - alpha) * 6).toFixed(1)}px)`;
          el.style.visibility = alpha > 0.005 ? 'visible' : 'hidden';
        });
      };
      ScrollTrigger.create({
        trigger: '.pp-hero',
        start: 'top top',
        end: window.innerWidth < 768 ? '+=220%' : '+=260%',
        pin: true,
        scrub: 0.35,
        anticipatePin: 1,
        onUpdate: (self) => { ccMorph.draw(self.progress); crossfade(self.progress); }
      });
      addEventListener('load', () => ScrollTrigger.refresh());
    }

    // C) Parallax sutil de cada marco de proyecto.
    // Amplitud contenida (±24px) para que el marco nunca invada el nombre/servicios de arriba.
    document.querySelectorAll('.pp-work__media').forEach(m => {
      gsap.fromTo(m, { y: 24 }, {
        y: -24, ease: 'none',
        scrollTrigger: { trigger: m, start: 'top bottom', end: 'bottom top', scrub: true }
      });
    });

    // D) Título de contacto: crece ligeramente al llegar (cierre con peso)
    gsap.fromTo('.pp-contact__title',
      { scale: 0.92 },
      {
        scale: 1, ease: 'none',
        scrollTrigger: { trigger: '.pp-contact', start: 'top bottom', end: 'top 30%', scrub: true }
      });

    // D2) Títulos: reveal palabra a palabra (máscara + subida en cascada)
    function splitWords(root) {
      const walk = (node) => {
        [...node.childNodes].forEach(child => {
          if (child.nodeType === 3) {
            const frag = document.createDocumentFragment();
            child.textContent.split(/(\s+)/).forEach(part => {
              if (!part) return;
              if (/^\s+$/.test(part)) { frag.appendChild(document.createTextNode(' ')); return; }
              const w = document.createElement('span'); w.className = 'pp-w';
              const i = document.createElement('span'); i.className = 'pp-wi';
              i.textContent = part; w.appendChild(i); frag.appendChild(w);
            });
            node.replaceChild(frag, child);
          } else if (child.nodeType === 1 && child.tagName !== 'BR') {
            walk(child);
          }
        });
      };
      walk(root);
    }
    // Disparo por IntersectionObserver (inmune a cambios de layout por imágenes lazy)
    const ioWords = new IntersectionObserver(entries => {
      entries.forEach(en => {
        if (!en.isIntersecting) return;
        ioWords.unobserve(en.target);
        gsap.to(en.target.querySelectorAll('.pp-wi'),
          { yPercent: 0, duration: 1, ease: 'expo.out', stagger: 0.06 });
      });
    }, { threshold: 0.3 });
    document.querySelectorAll('[data-words]').forEach(el => {
      splitWords(el);
      const inners = el.querySelectorAll('.pp-wi');
      if (!inners.length) return;
      gsap.set(inners, { yPercent: 120 });
      ioWords.observe(el);
    });

    // E) Cubo desnudo + campo de palabras: se forma al entrar y gira mostrando los trabajos
    const cube = document.getElementById('ppCube');
    if (cube) {
      const scene = document.querySelector('.pp-cube-scene');
      const parts = [...cube.querySelectorAll('.pp-cface, .pp-ccap')];
      const tl = gsap.timeline({
        scrollTrigger: {
          trigger: '.pp-cube-scene',
          start: 'top top',
          end: '+=260%',          // el scroll "dura" 2.6 pantallas mientras la escena queda fijada
          pin: true,
          scrub: 1,
          anticipatePin: 1
        }
      });
      // Fase 1 · formación: caras y tapas llegan desde fuera y se ensamblan
      tl.fromTo(parts,
        { '--z': '560px', opacity: 0 },
        { '--z': '180px', opacity: 1, duration: 0.28, stagger: 0.03, ease: 'power2.out' }, 0)
        .fromTo(cube, { '--spin': '-70deg' }, { '--spin': '0deg', duration: 0.28, ease: 'power2.out' }, 0)
      // Fase 2 · rotación mostrando cada trabajo
        .to(cube, { '--spin': '-270deg', duration: 0.66, ease: 'none' }, 0.34)
      // El campo de palabras deriva y el texto gigante cruza por detrás
        .fromTo('.pp-field--l .pp-field__stack', { yPercent: 7 }, { yPercent: -14, duration: 1, ease: 'none' }, 0)
        .fromTo('.pp-field--r .pp-field__stack', { yPercent: 14 }, { yPercent: -7, duration: 1, ease: 'none' }, 0)
        .fromTo('.pp-giant', { xPercent: 10 }, { xPercent: -55, duration: 1, ease: 'none' }, 0)
        .to('.pp-cube-hint', { opacity: 0, duration: 0.08 }, 0.9);

      // Vida propia: giro lento continuo + balanceo suave (independiente del scroll)
      let idle = 0;
      const t0 = performance.now();
      (function idleLoop() {
        idle += 0.045;
        const t = (performance.now() - t0) / 1000;
        cube.style.setProperty('--idle', idle + 'deg');
        cube.style.setProperty('--wob', (Math.sin(t * 0.55) * 6) + 'deg');
        requestAnimationFrame(idleLoop);
      })();

      // El ratón inclina el cubo y desplaza el campo de palabras (parallax)
      if (window.matchMedia('(pointer:fine)').matches) {
        let mx = 0, my = 0, ax = 0, ay = 0;
        addEventListener('mousemove', e => {
          mx = e.clientX / innerWidth - .5;
          my = e.clientY / innerHeight - .5;
        });
        (function tiltLoop() {
          ax += (my - ax) * .06; ay += (mx - ay) * .06;
          cube.style.setProperty('--tx', (-ax * 10) + 'deg');
          cube.style.setProperty('--ty', (ay * 16) + 'deg');
          if (scene) {
            scene.style.setProperty('--fx', (ay * 26) + 'px');
            scene.style.setProperty('--fy', (ax * 18) + 'px');
          }
          requestAnimationFrame(tiltLoop);
        })();
      }
    }

    // F) Escaparate de servicios: imágenes pequeñas que pasan a distinta velocidad
    document.querySelectorAll('.pp-caps-float').forEach((img, i) => {
      gsap.fromTo(img, { y: 90 + i * 50 }, {
        y: -(110 + i * 60), ease: 'none',
        scrollTrigger: { trigger: '#studio', start: 'top bottom', end: 'bottom top', scrub: true }
      });
    });

    // G) Entradas especiales de los packs: PRO llega en meteorito, LAB sale de una probeta
    (function () {
      const plans = document.querySelector('.pp-plans');
      const pro = document.querySelector('.pp-plan--feat');
      const lab = document.querySelector('.pp-plan--lab');
      const pricing = document.getElementById('pricing');
      if (!plans || !pro || !lab || !pricing) return;
      // En móvil las tarjetas van apiladas (muy altas) y el efecto no luce ni se
      // dispararía bien: se quedan con el reveal estándar y siempre visibles.
      if (matchMedia('(max-width: 780px)').matches) return;
      // estas dos tarjetas dejan de usar el reveal genérico: las controla el efecto
      io.unobserve(pro); io.unobserve(lab);
      pro.classList.add('pp-plan--fx'); lab.classList.add('pp-plan--fx');
      const proScale = () => matchMedia('(min-width: 781px)').matches ? 1.03 : 1;

      function meteoro() {
        const cx = pro.offsetLeft + pro.offsetWidth / 2;
        const cy = pro.offsetTop + pro.offsetHeight * 0.3;
        const m = document.createElement('div'); m.className = 'pp-meteor'; plans.appendChild(m);
        const tlm = gsap.timeline();
        // caída en diagonal desde arriba a la derecha (visible: entra ya encendido)
        tlm.fromTo(m, { x: cx + 560, y: cy - 660, opacity: 1 },
                      { x: cx - 13, y: cy - 13, duration: 0.8, ease: 'power2.in' })
           .to(m, { opacity: 0, duration: 0.1, onComplete: () => m.remove() })
        // impacto: onda + chispas + temblor
           .add(() => {
             const ring = document.createElement('div'); ring.className = 'pp-impact'; plans.appendChild(ring);
             gsap.fromTo(ring, { width: 12, height: 12, left: cx - 6, top: cy - 6, opacity: 1 },
               { width: 280, height: 280, left: cx - 140, top: cy - 140, opacity: 0, duration: 0.7, ease: 'power2.out', onComplete: () => ring.remove() });
             for (let i = 0; i < 12; i++) {
               const s = document.createElement('div'); s.className = 'pp-spark'; plans.appendChild(s);
               const a = Math.random() * Math.PI * 2, d = 60 + Math.random() * 130;
               gsap.fromTo(s, { left: cx, top: cy, opacity: 1 },
                 { left: cx + Math.cos(a) * d, top: cy + Math.sin(a) * d, opacity: 0, duration: 0.5 + Math.random() * 0.4, ease: 'power2.out', onComplete: () => s.remove() });
             }
             gsap.fromTo(plans, { x: -7 }, { x: 7, duration: 0.05, repeat: 5, yoyo: true, clearProps: 'x' });
           }, '>-0.05')
        // la oferta emerge del impacto
           .fromTo(pro, { opacity: 0, scale: 0.55, y: -36 },
                        { opacity: 1, scale: proScale(), y: 0, duration: 0.6, ease: 'back.out(2.1)' }, '>-0.02')
           .fromTo(pro, { boxShadow: '0 0 0 1px rgba(91,139,176,1), 0 0 90px rgba(91,139,176,.6)' },
                        { boxShadow: '0 0 0 1px rgba(91,139,176,1), 0 30px 60px rgba(91,139,176,.12)', duration: 0.9 }, '<+0.1');
        return tlm;
      }

      function probeta() {
        const cx = lab.offsetLeft + lab.offsetWidth / 2;
        const cy = lab.offsetTop + Math.min(lab.offsetHeight * 0.35, 190);
        const f = document.createElement('div'); f.className = 'pp-flask';
        f.style.left = (cx - 60) + 'px'; f.style.top = (cy - 80) + 'px';
        f.innerHTML =
          '<svg viewBox="0 0 120 150" fill="none" stroke="#5B8BB0" stroke-width="3" stroke-linecap="round">' +
          '<path class="fl-liq" stroke="none" fill="rgba(91,139,176,.3)" d="M37 104h46l7 16a13 13 0 0 1-12 18H42a13 13 0 0 1-12-18z"/>' +
          '<g class="fl-neck"><path d="M46 10h28M52 10v36M68 10v36"/></g>' +
          '<g class="fl-left"><path d="M52 46 26 112a15 15 0 0 0 14 22h20"/></g>' +
          '<g class="fl-right"><path d="M68 46l26 66a15 15 0 0 1-14 22H60"/></g>' +
          '<circle class="fl-b1" cx="52" cy="122" r="4"/><circle class="fl-b2" cx="66" cy="128" r="3"/><circle class="fl-b3" cx="59" cy="116" r="2.5"/>' +
          '</svg>';
        plans.appendChild(f);
        const q = s => f.querySelector(s);
        const tlf = gsap.timeline();
        // aparece la probeta y burbujea cada vez más fuerte
        tlf.fromTo(f, { opacity: 0, scale: 0.7 }, { opacity: 1, scale: 1, duration: 0.35, ease: 'back.out(1.6)' })
           .fromTo(['.fl-b1', '.fl-b2', '.fl-b3'].map(q), { y: 0, opacity: 1 },
                   { y: -34, opacity: 0, duration: 0.4, stagger: 0.12, repeat: 2, ease: 'power1.out' })
           .to(f, { rotation: 5, duration: 0.06, repeat: 7, yoyo: true, ease: 'none' }, '<+0.4')
        // ¡se rompe!
           .add(() => {
             gsap.to(q('.fl-left'),  { x: -55, y: 44, rotation: -40, opacity: 0, duration: 0.6, ease: 'power2.out' });
             gsap.to(q('.fl-right'), { x: 55,  y: 44, rotation: 40,  opacity: 0, duration: 0.6, ease: 'power2.out' });
             gsap.to(q('.fl-neck'),  { y: -66, rotation: 24, opacity: 0, duration: 0.6, ease: 'power2.out' });
             gsap.to(q('.fl-liq'),   { opacity: 0, duration: 0.25 });
             for (let i = 0; i < 12; i++) {
               const d = document.createElement('div'); d.className = 'pp-drop'; plans.appendChild(d);
               const a = -Math.PI / 2 + (Math.random() - 0.5) * 2.2, v = 70 + Math.random() * 110;
               gsap.fromTo(d, { left: cx, top: cy + 20, opacity: 1 },
                 { left: cx + Math.cos(a) * v, top: cy + 20 + Math.sin(a) * v + 60, opacity: 0, duration: 0.7 + Math.random() * 0.3, ease: 'power1.out', onComplete: () => d.remove() });
             }
           })
        // la oferta sale del estallido
           .fromTo(lab, { opacity: 0, scale: 0.7 }, { opacity: 1, scale: 1, duration: 0.55, ease: 'back.out(2)' }, '<+0.15')
           .to(f, { opacity: 0, duration: 0.3, onComplete: () => f.remove() }, '<');
        return tlf;
      }

      // Se dispara cuando las TARJETAS están bien visibles (no al asomar la sección)
      const ioFx = new IntersectionObserver(entries => {
        entries.forEach(en => {
          if (!en.isIntersecting) return;
          ioFx.disconnect();
          gsap.delayedCall(0.15, meteoro);
          gsap.delayedCall(1.2, probeta);
        });
      }, { threshold: 0.45 });
      ioFx.observe(plans);
    })();

    // Recalcular posiciones cuando cargan las imágenes/preloader.
    // Las imágenes lazy cargan tarde y desplazan el layout: refresh con debounce.
    addEventListener('load', () => ScrollTrigger.refresh());
    let refreshT;
    document.querySelectorAll('img[loading="lazy"]').forEach(im => {
      im.addEventListener('load', () => {
        clearTimeout(refreshT);
        refreshT = setTimeout(() => ScrollTrigger.refresh(), 200);
      });
    });
  })();

  /* ---------- Icono vectorial que sigue al cursor sobre los servicios ---------- */
  if (window.matchMedia('(pointer:fine)').matches && !reduce) {
    // Iconos propios en línea, trazo redondeado, color del acento
    const ICONS = {
      diseno:       '<path d="M15.5 4.5l4 4L9 19c-1 1-3.6 1.7-5 1 .7-1.4 0-4 1-5z"/><path d="M13.5 6.5l4 4"/><circle cx="19" cy="17.5" r="1.8"/>',
      medida:       '<path d="M4 7h9M18.6 7H20M4 12h3M10.6 12H20M4 17h11M18.6 17H20"/><circle cx="15.2" cy="7" r="1.8"/><circle cx="8.8" cy="12" r="1.8"/><circle cx="16.8" cy="17" r="1.8"/>',
      renovacion:   '<path d="M20 11a8 8 0 0 0-14.9-3M4 13a8 8 0 0 0 14.9 3"/><path d="M5 4v4h4M19 20v-4h-4"/>',
      seo:          '<circle cx="10.5" cy="10.5" r="6.5"/><path d="M15.4 15.4L21 21"/><path d="M10.5 7.6a2.5 2.5 0 0 1 2.5 2.5c0 1.8-2.5 3.9-2.5 3.9S8 11.9 8 10.1a2.5 2.5 0 0 1 2.5-2.5z"/>',
      reservas:     '<rect x="3.5" y="5" width="17" height="15.5" rx="2"/><path d="M3.5 9.5h17M8 3v4M16 3v4"/><path d="M9 14.5l2.2 2.2 4.3-4.7"/>',
      identidad:    '<path d="M7.5 7.7A6.5 6.5 0 0 1 18.5 12c0 3-.5 5.3-1.3 7"/><path d="M5.6 11a6.5 6.5 0 0 1 .5-2"/><path d="M12 8.9a3.5 3.5 0 0 1 3.5 3.5c0 2.4-.4 4.5-1.2 6.3"/><path d="M8.6 13.3c0 2.3-.5 4.2-1.3 5.6"/><path d="M12 12.5c0 2.8-.6 5.1-1.6 7"/>',
      mantenimiento:'<circle cx="12" cy="12" r="3.1"/><path d="M12 4.2v2.4M12 17.4v2.4M4.2 12h2.4M17.4 12h2.4M6.5 6.5l1.7 1.7M15.8 15.8l1.7 1.7M17.5 6.5l-1.7 1.7M8.2 15.8l-1.7 1.7"/>'
    };
    const items = [...document.querySelectorAll('.pp-caps li[data-icon]')];
    if (items.length) {
      const thumb = document.createElement('div');
      thumb.className = 'pp-caps-thumb';
      document.body.appendChild(thumb);
      addEventListener('mousemove', e => {
        thumb.style.left = e.clientX + 'px';
        thumb.style.top = e.clientY + 'px';
      });
      items.forEach(li => {
        li.addEventListener('mouseenter', () => {
          const ic = ICONS[li.dataset.icon];
          if (!ic) return;
          thumb.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' + ic + '</svg>';
          thumb.classList.add('on');
        });
        li.addEventListener('mouseleave', () => thumb.classList.remove('on'));
      });
    }
  }

  /* ---------- Esfera de partículas 3D del estudio ---------- */
  (function () {
    const cv = document.getElementById('ppSphere');
    if (!cv) return;
    const ctx = cv.getContext('2d');
    if (!ctx) return;

    // Distribución de Fibonacci sobre la esfera (como el componente original)
    const N = 3000;
    const pts = new Float32Array(N * 3);
    for (let i = 0; i < N; i++) {
      const phi = Math.acos(1 - (2 * (i + 0.5)) / N);
      const theta = Math.PI * (1 + Math.sqrt(5)) * i;
      pts[i * 3]     = Math.sin(phi) * Math.cos(theta);
      pts[i * 3 + 1] = Math.sin(phi) * Math.sin(theta);
      pts[i * 3 + 2] = Math.cos(phi);
    }

    // Paleta de la marca: azul acero -> azul hielo, cuantizada para rendimiento
    const COLORS = [];
    for (let k = 0; k < 32; k++) {
      const m = k / 31;
      COLORS.push('rgb(' +
        Math.round(91 + m * (190 - 91)) + ',' +
        Math.round(139 + m * (215 - 139)) + ',' +
        Math.round(176 + m * (235 - 176)) + ')');
    }

    const dpr = Math.min(devicePixelRatio || 1, 2);
    let size = 0, R = 0;
    function resizeSphere() {
      const holder = cv.parentElement.getBoundingClientRect();
      size = Math.min(holder.width, 560);   // tamaño generoso, solo limitado por el ancho
      cv.width = size * dpr; cv.height = size * dpr;
      cv.style.width = size + 'px'; cv.style.height = size + 'px';
      R = size * 0.36 * dpr;
    }
    resizeSphere();
    addEventListener('resize', resizeSphere);

    // Rotación: giro automático + arrastre con inercia; clic corto = ondular
    let rx = -0.35, ry = 0.4, vx = 0, vy = 0;
    let dragging = false, moved = false, lx = 0, ly = 0;
    let waving = true, t = 0, last = 0;   // la onda viene activada de serie

    cv.addEventListener('pointerdown', e => {
      dragging = true; moved = false; lx = e.clientX; ly = e.clientY;
      cv.setPointerCapture(e.pointerId);
    });
    cv.addEventListener('pointermove', e => {
      if (!dragging) return;
      const dx = e.clientX - lx, dy = e.clientY - ly;
      lx = e.clientX; ly = e.clientY;
      ry += dx * 0.006; rx += dy * 0.006;
      vy = dx * 0.006; vx = dy * 0.006;
      if (Math.abs(dx) + Math.abs(dy) > 3) moved = true;
    });
    cv.addEventListener('pointerup', () => {
      dragging = false;
      if (!moved) waving = !waving;   // clic sin arrastre: activa/desactiva la onda
    });

    function frame(now) {
      const dt = Math.min((now - last) / 1000, 0.05); last = now;
      if (!dragging) {
        ry += vy + 0.0022;            // giro perezoso constante
        rx += vx;
        vx *= 0.94; vy *= 0.94;       // inercia amortiguada
      }
      if (waving) t += dt * 0.5;   // ritmo de la ondulación (más visible que el original)

      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.clearRect(0, 0, cv.width, cv.height);
      ctx.globalCompositeOperation = 'lighter';

      const cX = Math.cos(rx), sX = Math.sin(rx);
      const cY = Math.cos(ry), sY = Math.sin(ry);
      const half = cv.width / 2;

      for (let i = 0; i < N; i++) {
        let x = pts[i * 3], y = pts[i * 3 + 1], z = pts[i * 3 + 2];
        // rotación Y y X
        let x1 = x * cY + z * sY;
        let z1 = -x * sY + z * cY;
        let y1 = y * cX - z1 * sX;
        z1 = y * sX + z1 * cX;
        // onda de expansión (misma fórmula que el original)
        const k = waving ? 1 + Math.sin(t * 0.3 + i * 0.03) * 0.14 : 1;
        const depth = z1 * 0.5 + 0.5;              // 0 detrás, 1 delante
        const shift = waving ? Math.sin(t * 0.4 + i * 0.08) * 0.5 + 0.5 : Math.random();
        ctx.globalAlpha = 0.18 + depth * 0.6;
        ctx.fillStyle = COLORS[(shift * 31) | 0];
        const px = half + x1 * k * R;
        const py = half + y1 * k * R;
        const s = (0.9 + depth * 1.6) * dpr;
        ctx.fillRect(px, py, s, s);
      }
      ctx.globalAlpha = 1;
      if (running) rafSphere = requestAnimationFrame(frame);
    }

    // Solo anima con la sección a la vista
    let running = false, rafSphere = 0;
    if (reduce) {
      // estático: un solo fotograma, sin giro ni onda
      last = performance.now(); running = false; frame(last);
    } else {
      const ioSphere = new IntersectionObserver(entries => {
        const v = entries[0].isIntersecting;
        if (v && !running) { running = true; last = performance.now(); rafSphere = requestAnimationFrame(frame); }
        else if (!v && running) { running = false; cancelAnimationFrame(rafSphere); }
      }, { rootMargin: '10% 0px' });
      ioSphere.observe(cv);
    }
  })();

  /* ---------- Palabras bajo la esfera: una a una, en el mismo sitio ---------- */
  (function () {
    const emit = document.getElementById('ppEmit');
    if (!emit) return;
    const words = [...emit.children];
    if (!words.length) return;
    let i = 0, timer = null;
    words[0].classList.add('is-in');
    function next() {
      const cur = words[i];
      cur.classList.remove('is-in');
      cur.classList.add('is-out');
      setTimeout(() => cur.classList.remove('is-out'), 600);
      i = (i + 1) % words.length;
      words[i].classList.add('is-in');
    }
    // Rota solo mientras la esfera está a la vista
    const ioEmit = new IntersectionObserver(entries => {
      if (entries[0].isIntersecting) { if (!timer) timer = setInterval(next, 2600); }
      else if (timer) { clearInterval(timer); timer = null; }
    }, { rootMargin: '5% 0px' });
    ioEmit.observe(emit);
  })();

  /* ---------- Baraja 3D de soluciones: se desliza con el scroll ---------- */
  (function () {
    const deck = document.getElementById('ppDeck');
    if (!deck) return;
    const BASE = 'translate3d(-50%, -50%, 0) rotateX(0deg) rotateY(-25deg) rotateZ(-120deg)';
    if (reduce) { deck.style.transform = BASE; return; }
    const sec = deck.closest('.pp-solutions');
    function slideDeck() {
      const r = sec.getBoundingClientRect();
      if (r.bottom < -200 || r.top > innerHeight + 200) return;   // fuera de vista
      const prog = r.top + r.height / 2 - innerHeight / 2;        // px respecto al centro
      deck.style.transform = BASE + ' translateY(' + (prog * 0.12).toFixed(1) + 'px)';
    }
    addEventListener('scroll', slideDeck, { passive: true });
    slideDeck();

    /* v56 — Selección PEGAJOSA, sin ningún temblor posible:
       la carta elegida sale entera (clase .is-out) y SE QUEDA fuera
       hasta que el ratón se pose sobre otra carta. No hay deselección
       al salir de la baraja (era la causa del parpadeo en los bordes:
       salir → volver → re-entrar → bucle). Y un cambio de carta solo se
       acepta si el puntero se ha desplazado de verdad (>18px netos)
       desde donde se hizo la selección actual: los "enter" que provocan
       las propias cartas al deslizarse bajo un puntero quieto, y los
       microtemblores del ratón, se ignoran. */
    const cards = [...deck.querySelectorAll('.pp-deck__card')];
    let selected = null, selX = 0, selY = 0;
    function select(card, e) {
      if (selected) selected.classList.remove('is-out');
      selected = card;
      selected.classList.add('is-out');
      selX = e.clientX; selY = e.clientY;
    }
    cards.forEach(card => {
      card.addEventListener('pointerenter', e => {
        if (card === selected) return;
        if (!selected || Math.hypot(e.clientX - selX, e.clientY - selY) > 18) {
          select(card, e);
        }
      });
    });
  })();

  /* ---------- Slider acordeón del archivo de proyectos ---------- */
  (function () {
    const cat = document.getElementById('ppCat');
    if (!cat) return;
    const cards = [...cat.querySelectorAll('.pp-catcard')];
    const thumbs = [...cat.querySelectorAll('.pp-cat__thumb')];
    function activate(i) {
      cards.forEach((c, j) => c.classList.toggle('active', i === j));
      thumbs.forEach((t, j) => t.classList.toggle('is-hidden', i === j));
      const sc = cards[i].querySelector('.pp-cat__scroll');
      if (sc) sc.scrollTop = 0;
    }
    cards.forEach((c, i) => c.addEventListener('click', e => {
      if (e.target.closest('.pp-cat__link')) return;  // el enlace no re-activa
      if (!c.classList.contains('active')) activate(i);
    }));
    thumbs.forEach((t, i) => t.addEventListener('click', () => activate(i)));
  })();

  /* ---------- Scramble de etiquetas mono al entrar en pantalla ---------- */
  if (!reduce) {
    const ioScr = new IntersectionObserver(entries => {
      entries.forEach(en => {
        if (en.isIntersecting) { scramble(en.target); ioScr.unobserve(en.target); }
      });
    }, { threshold: 0.6 });
    document.querySelectorAll('main .pp-mono:not([data-scramble])').forEach(el => ioScr.observe(el));
  }
});
