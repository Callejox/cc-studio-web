/* ============================================================
   CC STUDIO — script.js
   ============================================================ */

document.addEventListener('DOMContentLoaded', () => {

  /* ---------- Smooth scroll (Lenis) ---------- */
  const lenis = new Lenis({ duration: 1.2 });
  function raf(time) { lenis.raf(time); requestAnimationFrame(raf); }
  requestAnimationFrame(raf);

  /* ---------- Animaciones al scroll (AOS) ---------- */
  AOS.init({ duration: 800, easing: 'ease-out-cubic', once: true, offset: 100 });

  /* ---------- Grano de película (canvas: fotogramas de ruido ciclados) ---------- */
  (function () {
    const canvas = document.getElementById('grainCanvas');
    if (!canvas) return;
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reduce || window.innerWidth <= 768) { canvas.style.display = 'none'; return; }
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const SCALE = 1.6;      // resolución del ruido (menor = grano más grueso, más barato)
    const FRAMES = 8;       // fotogramas pre-horneados
    const FPS = 24;
    const DENSITY = 0.5;    // fracción de píxeles encendidos
    let w = 0, h = 0, frames = [], idx = 0, lastT = 0, raf = 0;

    function bake() {
      w = Math.ceil(window.innerWidth / SCALE);
      h = Math.ceil(window.innerHeight / SCALE);
      canvas.width = w; canvas.height = h;
      frames = [];
      for (let f = 0; f < FRAMES; f++) {
        const img = ctx.createImageData(w, h);
        const buf = new Uint32Array(img.data.buffer);
        for (let p = 0; p < buf.length; p++) {
          if (Math.random() < DENSITY) buf[p] = 0xffffffff; // blanco opaco
        }
        frames.push(img);
      }
    }
    function tick(t) {
      raf = requestAnimationFrame(tick);
      if (document.visibilityState === 'hidden') return;
      if (t - lastT < 1000 / FPS) return;
      lastT = t;
      idx = (idx + 1) % FRAMES;
      ctx.putImageData(frames[idx], 0, 0);
    }
    let resizeTimer;
    addEventListener('resize', () => {
      clearTimeout(resizeTimer);
      resizeTimer = setTimeout(bake, 180);
    });
    bake();
    raf = requestAnimationFrame(tick);
  })();

  /* ---------- Preloader / pantalla de intro ---------- */
  const pre = document.getElementById('preloader');
  const count = document.getElementById('preloaderCount');
  if (pre && count) {
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    // Comenta la línea siguiente para ver el preloader en CADA recarga (desarrollo):
    const yaVisto = sessionStorage.getItem('ccIntroVisto');
    if (reduce || yaVisto) {
      pre.style.display = 'none';
    } else {
      document.body.style.overflow = 'hidden';
      let n = 0, cerrado = false;
      const cerrar = () => {
        if (cerrado) return;
        cerrado = true;
        clearInterval(timer);
        setTimeout(() => {
          pre.classList.add('is-hidden');
          document.body.style.overflow = '';
          sessionStorage.setItem('ccIntroVisto', '1');
          pre.addEventListener('transitionend', () => {
            pre.style.display = 'none';
            if (window.AOS) AOS.refresh();
          }, { once: true });
        }, 350);
      };
      const timer = setInterval(() => {
        n += Math.floor(Math.random() * 8) + 3;
        if (n >= 100) { n = 100; cerrar(); }
        count.textContent = String(n).padStart(2, '0');
      }, 45);
      // Failsafe: si los timers se throttlean (pestaña en 2º plano), cierra igual al volver.
      setTimeout(cerrar, 4000);
    }
  }

  /* ---------- Scroll suave en enlaces de ancla (navbar, hero, CTAs) ---------- */
  document.querySelectorAll('a[href^="#"]').forEach(link => {
    link.addEventListener('click', e => {
      const id = link.getAttribute('href');
      if (id.length < 2) return;                 // ignora href="#"
      const target = document.querySelector(id);
      if (!target) return;
      e.preventDefault();
      lenis.scrollTo(target, { offset: -70 });   // -70 compensa el navbar fijo
    });
  });

  /* ---------- Navbar frosted glass al hacer scroll ---------- */
  const nav = document.querySelector('nav');
  window.addEventListener('scroll', () => {
    nav.classList.toggle('scrolled', window.scrollY > 60);
  });

  /* ---------- Cursor personalizado con rastro tipo cometa (solo punteros finos) ---------- */
  if (window.matchMedia('(pointer:fine)').matches &&
      !window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    const N = 14;                    // nº de puntos del rastro
    const dot = document.createElement('div');
    dot.className = 'cursor-dot';
    document.body.appendChild(dot);

    const trail = [];
    for (let i = 0; i < N; i++) {
      const t = document.createElement('div');
      t.className = 'cursor-trail';
      const size = Math.max(2, 7 * (1 - i / N));
      t.style.width = size + 'px';
      t.style.height = size + 'px';
      t.style.opacity = String(0.45 * (1 - i / N));
      document.body.appendChild(t);
      trail.push({ el: t, x: 0, y: 0 });
    }

    let mx = 0, my = 0, dx = 0, dy = 0;
    addEventListener('mousemove', e => { mx = e.clientX; my = e.clientY; });
    (function loop() {
      dx += (mx - dx) * 0.35; dy += (my - dy) * 0.35;
      dot.style.left = dx + 'px'; dot.style.top = dy + 'px';
      let px = dx, py = dy;
      for (const p of trail) {
        p.x += (px - p.x) * 0.35; p.y += (py - p.y) * 0.35;
        p.el.style.left = p.x + 'px'; p.el.style.top = p.y + 'px';
        px = p.x; py = p.y;
      }
      requestAnimationFrame(loop);
    })();

    // crece sobre elementos interactivos
    document.querySelectorAll('a, button, .card, .proyecto-enlace, .faq-q').forEach(el => {
      el.addEventListener('mouseenter', () => dot.classList.add('is-hover'));
      el.addEventListener('mouseleave', () => dot.classList.remove('is-hover'));
    });
  }

  /* ---------- Contador animado (estadísticas) ---------- */
  document.querySelectorAll('.counter').forEach(el => {
    new IntersectionObserver(([e]) => {
      if (!e.isIntersecting) return;
      const tgt = +el.dataset.target, step = tgt / 60;
      let cur = 0;
      const t = setInterval(() => {
        cur += step; el.textContent = Math.floor(cur);
        if (cur >= tgt) { clearInterval(t); el.textContent = tgt; }
      }, 16);
    }, { threshold: 0.5 }).observe(el);
  });

  /* ---------- Menú móvil (hamburger) ---------- */
  const toggle = document.querySelector('.nav-toggle');
  const mobileMenu = document.querySelector('.nav-mobile');
  if (toggle && mobileMenu) {
    toggle.addEventListener('click', () => {
      const open = toggle.classList.toggle('open');
      mobileMenu.classList.toggle('open', open);
      toggle.setAttribute('aria-expanded', open);
    });
    mobileMenu.querySelectorAll('a').forEach(link => {
      link.addEventListener('click', () => {
        toggle.classList.remove('open');
        mobileMenu.classList.remove('open');
        toggle.setAttribute('aria-expanded', 'false');
      });
    });
  }

  /* ---------- Acordeón de preguntas frecuentes ---------- */
  document.querySelectorAll('.faq-item').forEach(item => {
    const btn = item.querySelector('.faq-q');
    const answer = item.querySelector('.faq-a');
    btn.addEventListener('click', () => {
      const isOpen = item.classList.toggle('open');
      btn.setAttribute('aria-expanded', isOpen);
      answer.style.maxHeight = isOpen ? answer.scrollHeight + 'px' : null;
    });
  });

  /* ---------- Mensaje de confirmación tras enviar el formulario ---------- */
  if (new URLSearchParams(window.location.search).get('enviado') === '1') {
    const form = document.querySelector('.contacto-form');
    if (form) {
      const ok = document.createElement('div');
      ok.className = 'form-ok';
      ok.textContent = '¡Mensaje enviado! Te respondemos en menos de 24 horas.';
      form.parentNode.insertBefore(ok, form);
      form.reset();
    }
  }

  /* ---------- Mockups de dispositivo del hero ---------- */
  (function () {
    const inner = document.getElementById('devicesInner');
    if (!inner) return;

    const projects = [
      { src: 'img/portfolio/labrisa.png',        tag: 'La Brisa · Escritorio + Móvil' },
      { src: 'img/portfolio/rentaboat-salou.png', tag: 'Rent a Boat · Escritorio + Móvil' },
      { src: 'img/portfolio/boat4rent.png',       tag: 'Boat 4 Rent · Escritorio + Móvil' },
      { src: 'img/portfolio/daluca.png',          tag: 'Da Luca · Escritorio + Móvil' },
      { src: 'img/portfolio/lemassage.png',       tag: 'Le Massage · Escritorio + Móvil' }
    ];
    const tagEl = document.getElementById('deviceTag');
    // cada .device-screen tiene dos capas <img> para el crossfade
    const screens = [...inner.querySelectorAll('.device-screen')].map(s => ({
      imgs: [...s.querySelectorAll('.ds-img')],
      active: 0
    }));

    let cur = 0;
    function show(i) {
      screens.forEach(s => {
        const next = 1 - s.active;
        s.imgs[next].src = projects[i].src;
        s.imgs[next].classList.add('is-active');
        s.imgs[s.active].classList.remove('is-active');
        s.active = next;
      });
      if (tagEl) tagEl.textContent = projects[i].tag;
    }
    // carga inicial (sin transición en ambas capas para evitar parpadeo)
    screens.forEach(s => { s.imgs[0].src = projects[0].src; });
    if (tagEl) tagEl.textContent = projects[0].tag;

    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (!reduce) {
      setInterval(() => { cur = (cur + 1) % projects.length; show(cur); }, 3600);

      // Inclinación 3D siguiendo el ratón (parallax suave)
      let tx = 0, ty = 0, cx = 0, cy = 0;
      addEventListener('mousemove', e => {
        tx = e.clientX / window.innerWidth - 0.5;
        ty = e.clientY / window.innerHeight - 0.5;
      });
      (function loop() {
        cx += (tx - cx) * 0.07; cy += (ty - cy) * 0.07;
        inner.style.setProperty('--ry', (-14 + cx * 20) + 'deg');
        inner.style.setProperty('--rx', (6 - cy * 12) + 'deg');
        requestAnimationFrame(loop);
      })();
    }
  })();

  /* ---------- Reveal de proyectos al hacer scroll ---------- */
  (function () {
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const items = document.querySelectorAll('#portfolio [data-reveal]');
    if (reduce || !('IntersectionObserver' in window)) {
      items.forEach(el => el.classList.add('is-visible'));
      return;
    }
    const io = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) { entry.target.classList.add('is-visible'); io.unobserve(entry.target); }
      });
    }, { threshold: 0.2, rootMargin: '0px 0px -10% 0px' });
    items.forEach(el => io.observe(el));
  })();

});
