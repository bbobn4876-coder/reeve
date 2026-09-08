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
    const words = text.split(' ');
    let charIndex = 0;
    words.forEach((word, wi) => {
      const wordSpan = document.createElement('span');
      wordSpan.className = 'reveal-word';
      [...word].forEach((ch) => {
        const s = document.createElement('span');
        s.className = 'reveal-ch';
        s.textContent = ch;
        s.style.animationDelay = (li * 0.35 + charIndex * 0.03) + 's';
        wordSpan.appendChild(s);
        charIndex += 1;
      });
      line.appendChild(wordSpan);
      if (wi < words.length - 1) {
        const space = document.createElement('span');
        space.className = 'reveal-space';
        space.textContent = ' ';
        line.appendChild(space);
        charIndex += 1;
      }
    });
  });

  // Accordions (one open at a time per group)
  document.querySelectorAll('[data-accordion]').forEach((group) => {
    const items = group.querySelectorAll('[data-acc]');
    items.forEach((btn) => {
      btn.addEventListener('click', () => {
        const willOpen = !btn.classList.contains('is-open');
        items.forEach((i) => {
          i.classList.remove('is-open');
          i.setAttribute('aria-expanded', 'false');
        });
        if (willOpen) {
          btn.classList.add('is-open');
          btn.setAttribute('aria-expanded', 'true');
        }
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

  // Mobile burger menu
  const burger = document.getElementById('burger');
  const mobileMenu = document.getElementById('mobileMenu');
  if (burger && mobileMenu) {
    const closeMenu = () => {
      document.body.classList.remove('menu-open');
      mobileMenu.classList.remove('is-open');
      mobileMenu.setAttribute('aria-hidden', 'true');
      burger.setAttribute('aria-expanded', 'false');
    };
    const toggleMenu = () => {
      const open = !mobileMenu.classList.contains('is-open');
      document.body.classList.toggle('menu-open', open);
      mobileMenu.classList.toggle('is-open', open);
      mobileMenu.setAttribute('aria-hidden', open ? 'false' : 'true');
      burger.setAttribute('aria-expanded', open ? 'true' : 'false');
    };
    burger.addEventListener('click', toggleMenu);
    mobileMenu.querySelectorAll('a').forEach((a) => a.addEventListener('click', closeMenu));
  }

  // Modals (Privacy / Terms / Cookies)
  const openModal = (id) => {
    const m = document.getElementById('modal-' + id);
    if (!m) return;
    m.classList.add('is-open');
    m.setAttribute('aria-hidden', 'false');
    document.body.classList.add('menu-open');
  };
  const closeModal = (m) => {
    m.classList.remove('is-open');
    m.setAttribute('aria-hidden', 'true');
    if (!document.querySelector('.mobile-menu.is-open')) {
      document.body.classList.remove('menu-open');
    }
  };
  document.querySelectorAll('[data-modal]').forEach((trigger) => {
    trigger.addEventListener('click', (e) => {
      e.preventDefault();
      openModal(trigger.dataset.modal);
    });
  });
  document.querySelectorAll('.modal').forEach((m) => {
    m.querySelectorAll('[data-modal-close]').forEach((el) => {
      el.addEventListener('click', () => closeModal(m));
    });
  });
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      document.querySelectorAll('.modal.is-open').forEach(closeModal);
    }
  });

  // Contact form → Telegram
  // The bot token and chat id live in window.REEVE_CONFIG, loaded from
  // config.js (see config.example.js). config.js is gitignored so the
  // token never lands in the repository. Even so, once the page is live
  // any visitor can read the token from DevTools — for a real deployment
  // move this sendMessage call behind a serverless proxy that holds the
  // token server-side, and rotate the token via @BotFather.
  const cfg = (window.REEVE_CONFIG || {});
  const TG_BOT_TOKEN = cfg.TG_BOT_TOKEN || '';
  const TG_CHAT_ID = cfg.TG_CHAT_ID || '';

  const form = document.getElementById('contactForm');
  if (form) {
    const error = form.querySelector('.form-error');
    const button = form.querySelector('button[type="submit"]');
    const tgInput = form.querySelector('#telegramInput');

    // Auto-prefix @ on Telegram field
    if (tgInput) {
      const ensureAt = () => {
        const v = tgInput.value;
        if (v.length === 0) return;
        if (v[0] !== '@') tgInput.value = '@' + v.replace(/^@+/, '');
      };
      tgInput.addEventListener('focus', () => {
        if (!tgInput.value) tgInput.value = '@';
        requestAnimationFrame(() => {
          const end = tgInput.value.length;
          try { tgInput.setSelectionRange(end, end); } catch (_) {}
        });
      });
      tgInput.addEventListener('input', ensureAt);
      tgInput.addEventListener('blur', () => {
        if (tgInput.value === '@') tgInput.value = '';
      });
    }

    const buildMessage = (data) => {
      const lines = [
        '📨 New brief from reeve.agency',
        '',
        `Telegram: ${data.telegram || '—'}`,
        `Email: ${data.email || '—'}`,
        `Company: ${data.company || '—'}`,
        `Budget: ${data.budget || '—'}`,
        '',
        'Message:',
        data.message || '—',
      ];
      return lines.join('\n');
    };

    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      error.hidden = true;
      if (!form.reportValidity()) return;

      const fd = new FormData(form);
      const data = Object.fromEntries(fd.entries());
      button.disabled = true;
      const originalLabel = button.textContent;
      button.textContent = 'Sending…';

      if (!TG_BOT_TOKEN || !TG_CHAT_ID) {
        console.warn('REEVE_CONFIG is missing — create config.js with TG_BOT_TOKEN and TG_CHAT_ID.');
        error.textContent = 'Config is missing. Create config.js with TG_BOT_TOKEN and TG_CHAT_ID.';
        error.hidden = false;
        button.disabled = false;
        button.textContent = originalLabel;
        return;
      }

      try {
        const res = await fetch(`https://api.telegram.org/bot${TG_BOT_TOKEN}/sendMessage`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            chat_id: TG_CHAT_ID,
            text: buildMessage(data),
            disable_web_page_preview: true,
          }),
        });
        const json = await res.json().catch(() => ({}));
        if (!res.ok || json.ok === false) throw new Error(json.description || res.statusText);

        button.textContent = originalLabel;
        form.reset();
        // reset custom select to first option
        form.querySelectorAll('[data-select]').forEach((sel) => {
          const opts = sel.querySelectorAll('.select-menu li');
          opts.forEach((o) => o.classList.remove('is-selected'));
          const first = opts[0];
          if (first) {
            first.classList.add('is-selected');
            sel.querySelector('.select-value').textContent = first.dataset.value || first.textContent;
            const hidden = sel.querySelector('input[type="hidden"]');
            if (hidden) hidden.value = first.dataset.value || first.textContent;
          }
        });
        openModal('sent');
      } catch (err) {
        console.error('Telegram send failed:', err);
        error.textContent = 'Send failed: ' + (err && err.message ? err.message : 'unknown error') +
          '. Please email us directly.';
        error.hidden = false;
        button.textContent = originalLabel;
      } finally {
        button.disabled = false;
      }
    });
  }

  // Floating header on scroll (hysteresis to avoid jitter, rAF-throttled)
  const header = document.getElementById('siteHeader');
  if (header) {
    const enterAt = 60;
    const leaveAt = 20;
    let ticking = false;
    let floating = false;
    const update = () => {
      const y = window.scrollY;
      if (!floating && y > enterAt) {
        floating = true;
        header.classList.add('is-floating');
      } else if (floating && y < leaveAt) {
        floating = false;
        header.classList.remove('is-floating');
      }
      ticking = false;
    };
    const onScroll = () => {
      if (!ticking) {
        ticking = true;
        requestAnimationFrame(update);
      }
    };
    update();
    window.addEventListener('scroll', onScroll, { passive: true });
  }
})();
