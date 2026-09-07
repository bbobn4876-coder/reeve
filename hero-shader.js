// Animated mesh gradient using canvas + additive radial blobs.
// Keeps the site's violet palette; two layers (filled + wireframe) mimic the
// paper shader look without pulling in a WebGL library.

(function () {
  const filled = document.getElementById('heroShader');
  const wire = document.getElementById('heroShaderWire');
  if (!filled || !wire) return;

  const palette = [
    { r: 124, g: 92,  b: 255 }, // primary violet
    { r: 168, g: 85,  b: 247 }, // magenta-violet
    { r: 60,  g: 20,  b: 120 }, // deep purple
    { r: 20,  g: 12,  b: 40  }, // near-black bg accent
  ];

  const wirePalette = [
    { r: 180, g: 150, b: 255 },
    { r: 220, g: 200, b: 255 },
    { r: 90,  g: 60,  b: 200 },
  ];

  const blobs = palette.map((c, i) => makeBlob(c, i, 0.9));
  const wireBlobs = wirePalette.map((c, i) => makeBlob(c, i + 10, 0.55));

  function makeBlob(color, seed, speed) {
    const rand = mulberry32(seed * 9973 + 1);
    return {
      color,
      speed: speed * (0.7 + rand() * 0.6),
      ax: 0.2 + rand() * 0.6,
      ay: 0.2 + rand() * 0.6,
      rx: 0.25 + rand() * 0.35,
      ry: 0.25 + rand() * 0.35,
      phase: rand() * Math.PI * 2,
      rSize: 0.4 + rand() * 0.4,
    };
  }

  function mulberry32(a) {
    return function () {
      a |= 0; a = (a + 0x6D2B79F5) | 0;
      let t = a;
      t = Math.imul(t ^ (t >>> 15), t | 1);
      t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }

  function resize(cv) {
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const rect = cv.getBoundingClientRect();
    cv.width = Math.max(1, Math.floor(rect.width * dpr));
    cv.height = Math.max(1, Math.floor(rect.height * dpr));
    return dpr;
  }

  let dpr1 = resize(filled);
  let dpr2 = resize(wire);
  const ctx = filled.getContext('2d');
  const wctx = wire.getContext('2d');

  window.addEventListener('resize', () => {
    dpr1 = resize(filled);
    dpr2 = resize(wire);
  });

  const start = performance.now();

  function drawFilled(t) {
    const W = filled.width, H = filled.height;
    ctx.globalCompositeOperation = 'source-over';
    ctx.fillStyle = '#06060a';
    ctx.fillRect(0, 0, W, H);
    ctx.globalCompositeOperation = 'lighter';

    for (const b of blobs) {
      const cx = W * (b.ax + Math.sin(t * b.speed + b.phase) * b.rx * 0.5);
      const cy = H * (b.ay + Math.cos(t * b.speed * 0.85 + b.phase) * b.ry * 0.5);
      const r = Math.min(W, H) * b.rSize * (1 + Math.sin(t * b.speed * 1.3) * 0.15);
      const g = ctx.createRadialGradient(cx, cy, 0, cx, cy, r);
      const c = b.color;
      g.addColorStop(0, `rgba(${c.r},${c.g},${c.b},0.35)`);
      g.addColorStop(0.45, `rgba(${c.r},${c.g},${c.b},0.10)`);
      g.addColorStop(1, `rgba(${c.r},${c.g},${c.b},0)`);
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, W, H);
    }
  }

  function drawWire(t) {
    const W = wire.width, H = wire.height;
    wctx.clearRect(0, 0, W, H);
    wctx.globalCompositeOperation = 'lighter';

    const step = Math.max(60, Math.floor(Math.min(W, H) / 18));
    wctx.lineWidth = Math.max(1, dpr2 * 0.6);

    for (const b of wireBlobs) {
      const cx = W * (b.ax + Math.sin(t * b.speed + b.phase) * b.rx * 0.6);
      const cy = H * (b.ay + Math.cos(t * b.speed * 0.9 + b.phase) * b.ry * 0.6);
      const c = b.color;
      wctx.strokeStyle = `rgba(${c.r},${c.g},${c.b},0.10)`;
      for (let r = step; r < Math.max(W, H) * 0.9; r += step) {
        wctx.beginPath();
        wctx.arc(cx, cy, r + Math.sin(t * b.speed + r * 0.002) * 6, 0, Math.PI * 2);
        wctx.stroke();
      }
    }
  }

  function frame(now) {
    const t = (now - start) / 1000;
    drawFilled(t);
    drawWire(t * 0.75);
    requestAnimationFrame(frame);
  }
  requestAnimationFrame(frame);

  // Letter-by-letter reveal
  document.querySelectorAll('.reveal-line').forEach((line, li) => {
    const text = line.dataset.text || line.textContent || '';
    line.textContent = '';
    [...text].forEach((ch, i) => {
      const s = document.createElement('span');
      s.className = 'reveal-ch';
      s.textContent = ch === ' ' ? ' ' : ch;
      s.style.animationDelay = (li * 0.35 + i * 0.03) + 's';
      line.appendChild(s);
    });
  });

  // Accordions (one open at a time per group)
  document.querySelectorAll('[data-accordion]').forEach((group) => {
    const items = group.querySelectorAll('[data-acc]');
    items.forEach((btn) => {
      btn.addEventListener('click', () => {
        const willOpen = !btn.classList.contains('is-open');
        items.forEach((i) => i.classList.remove('is-open'));
        if (willOpen) btn.classList.add('is-open');
      });
    });
  });

  // Custom select dropdowns
  document.querySelectorAll('[data-select]').forEach((sel) => {
    const toggle = sel.querySelector('.select-toggle');
    const value = sel.querySelector('.select-value');
    const hidden = sel.querySelector('input[type="hidden"]');
    const options = sel.querySelectorAll('.select-menu li');

    toggle.addEventListener('click', (e) => {
      e.stopPropagation();
      const open = sel.classList.toggle('is-open');
      toggle.setAttribute('aria-expanded', open ? 'true' : 'false');
    });

    options.forEach((opt) => {
      opt.addEventListener('click', () => {
        options.forEach((o) => o.classList.remove('is-selected'));
        opt.classList.add('is-selected');
        const v = opt.dataset.value || opt.textContent || '';
        value.textContent = v;
        if (hidden) hidden.value = v;
        sel.classList.remove('is-open');
        toggle.setAttribute('aria-expanded', 'false');
      });
    });
  });

  document.addEventListener('click', (e) => {
    document.querySelectorAll('[data-select].is-open').forEach((sel) => {
      if (!sel.contains(e.target)) {
        sel.classList.remove('is-open');
        const tgl = sel.querySelector('.select-toggle');
        if (tgl) tgl.setAttribute('aria-expanded', 'false');
      }
    });
  });

  // Variable-font hover on nav links (stagger from center)
  document.querySelectorAll('.nav-link').forEach((link) => {
    const text = link.textContent || '';
    link.textContent = '';
    const chars = [...text];
    const center = (chars.length - 1) / 2;
    const step = 30; // ms per unit distance
    chars.forEach((ch, i) => {
      const span = document.createElement('span');
      span.className = 'vf-char';
      span.textContent = ch === ' ' ? ' ' : ch;
      const dist = Math.abs(i - center);
      span.style.setProperty('--vf-delay', (dist * step).toFixed(0) + 'ms');
      link.appendChild(span);
    });
  });

  // Floating header on scroll
  const header = document.getElementById('siteHeader');
  if (header) {
    const threshold = 40;
    const onScroll = () => {
      header.classList.toggle('is-floating', window.scrollY > threshold);
    };
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
  }
})();
