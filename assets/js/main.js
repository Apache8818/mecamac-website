// Progressive enhancement gate: animations only when JS runs
document.documentElement.classList.add('js');

// ---------- Mobile navigation ----------
const toggle = document.querySelector('.nav-toggle');
const links = document.querySelector('.nav-links');

if (toggle && links) {
  const backdrop = document.createElement('div');
  backdrop.className = 'nav-backdrop';
  document.body.appendChild(backdrop);

  let scrollY = 0;

  const setMenu = (open) => {
    if (open) {
      // pin the page where it is — body{overflow:hidden} on its own sends iOS
      // back to the top, and the reader loses their place
      scrollY = window.scrollY || window.pageYOffset || 0;
      document.body.style.top = -scrollY + 'px';
      document.body.classList.add('nav-open');
    } else if (document.body.classList.contains('nav-open')) {
      document.body.classList.remove('nav-open');
      document.body.style.top = '';
      // while the body was fixed the document had no height, so the browser
      // clamps a restore issued in the same frame. Force layout first.
      void document.body.offsetHeight;
      window.scrollTo({ top: scrollY, left: 0, behavior: 'instant' });
      // focus must not be left inside a panel that is now hidden
      if (links.contains(document.activeElement)) toggle.focus({ preventScroll: true });
    }
    links.classList.toggle('open', open);
    backdrop.classList.toggle('show', open);
    toggle.setAttribute('aria-expanded', String(open));
    // links behind a closed panel must not be reachable by keyboard
    links.querySelectorAll('a').forEach(a => {
      if (window.innerWidth <= 1200) a.tabIndex = open ? 0 : -1;
      else a.removeAttribute('tabindex');
    });
    if (open) {
      const first = links.querySelector('a');
      if (first) setTimeout(() => first.focus({ preventScroll: true }), 160);
    }
  };
  const isOpen = () => links.classList.contains('open');

  toggle.setAttribute('aria-expanded', 'false');
  toggle.setAttribute('aria-controls', 'primary-nav');
  toggle.setAttribute('type', 'button');   // never submit, never navigate
  toggle.setAttribute('aria-label', 'Menu');
  links.id = links.id || 'primary-nav';
  if (window.innerWidth <= 1200) links.querySelectorAll('a').forEach(a => { a.tabIndex = -1; });

  // pointerdown fires even where a stray overlay swallows the click
  const fire = (e) => { e.preventDefault(); e.stopPropagation(); setMenu(!isOpen()); };
  toggle.addEventListener('click', fire);
  toggle.addEventListener('pointerdown', (e) => {
    if (e.pointerType === 'touch') fire(e);
  });

  // Let the link navigate; just close the panel behind it
  links.addEventListener('click', (e) => { if (e.target.closest('a')) setMenu(false); });

  // keep tab focus inside the open panel
  links.addEventListener('keydown', (e) => {
    if (e.key !== 'Tab' || !isOpen()) return;
    const items = [toggle, ...links.querySelectorAll('a')];
    const i = items.indexOf(document.activeElement);
    if (i === -1) return;
    const next = e.shiftKey ? i - 1 : i + 1;
    if (next < 0 || next >= items.length) { e.preventDefault(); items[e.shiftKey ? items.length - 1 : 0].focus(); }
  });

  backdrop.addEventListener('click', () => setMenu(false));
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape' && isOpen()) { setMenu(false); toggle.focus(); } });
  // an in-page jump scrolls behind the panel — close it first
  window.addEventListener('hashchange', () => { if (isOpen()) setMenu(false); });

  let rt;
  window.addEventListener('resize', () => {
    clearTimeout(rt);
    rt = setTimeout(() => {
      if (window.innerWidth > 1200) {
        if (isOpen()) setMenu(false);
        links.querySelectorAll('a').forEach(a => a.removeAttribute('tabindex'));
      } else if (!isOpen()) {
        links.querySelectorAll('a').forEach(a => { a.tabIndex = -1; });
      }
    }, 120);
  });
}

// ---------- Horizontal scrollers: show that they scroll ----------
// A table or filter row wider than the phone reads as text that got cut off.
document.querySelectorAll('.scroll-wrap').forEach(wrap => {
  const box = wrap.querySelector('.table-scroll') || wrap.firstElementChild;
  if (!box) return;
  const sync = () => {
    const over = box.scrollWidth - box.clientWidth;
    wrap.classList.toggle('can-scroll', over > 4);
    wrap.classList.toggle('at-end', over > 4 && Math.abs(box.scrollLeft) >= over - 4);
  };
  box.addEventListener('scroll', sync, { passive: true });
  window.addEventListener('resize', sync);
  sync();
  if ('ResizeObserver' in window) new ResizeObserver(sync).observe(box);
});
document.querySelectorAll('.filter-nav').forEach(nav => {
  const sync = () => {
    const over = nav.scrollWidth - nav.clientWidth;
    nav.classList.toggle('at-end', over <= 4 || Math.abs(nav.scrollLeft) >= over - 4);
  };
  nav.addEventListener('scroll', sync, { passive: true });
  window.addEventListener('resize', sync);
  sync();
});

// ---------- Scroll reveal (fail-safe) ----------
const revealEls = document.querySelectorAll('.reveal');

if (!('IntersectionObserver' in window)) {
  // No observer support — never leave content invisible
  revealEls.forEach(el => el.classList.add('in'));
} else {
  // threshold 0 + margin: reveal as soon as any part approaches the viewport
  const io = new IntersectionObserver((entries) => {
    entries.forEach(e => { if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); } });
  }, { threshold: 0, rootMargin: '140px 0px 140px 0px' });
  revealEls.forEach(el => io.observe(el));

  // Safety net: a fast flick-scroll can outrun the observer, and anything the
  // reader has already scrolled past must never be left blank.
  let raf = null;
  const sweep = () => {
    raf = null;
    const vh = window.innerHeight;
    revealEls.forEach(el => {
      if (el.classList.contains('in')) return;
      const r = el.getBoundingClientRect();
      if (r.top < vh + 140 && r.bottom > -140) { el.classList.add('in'); io.unobserve(el); }
    });
  };
  const queueSweep = () => { if (!raf) raf = requestAnimationFrame(sweep); };
  window.addEventListener('scroll', queueSweep, { passive: true });
  window.addEventListener('resize', queueSweep, { passive: true });
  window.addEventListener('load', queueSweep);
}

// Stagger reveal delays inside grids
document.querySelectorAll('.grid, .awards-grid, .stats, .contact-cards').forEach(grid => {
  [...grid.children].forEach((el, i) => {
    if (el.classList.contains('reveal')) el.style.transitionDelay = `${Math.min(i * 90, 540)}ms`;
  });
});

// Ken Burns hero slideshow
const slides = document.querySelectorAll('.hero-slides .slide');
const dots = document.querySelectorAll('.hero-dots button');
if (slides.length > 1) {
  let cur = 0, timer;
  const show = (i) => {
    slides[cur].classList.remove('active');
    if (dots[cur]) dots[cur].classList.remove('active');
    cur = i % slides.length;
    slides[cur].classList.add('active');
    if (dots[cur]) dots[cur].classList.add('active');
  };
  const play = () => { timer = setInterval(() => show(cur + 1), 6000); };
  show(0); play();
  dots.forEach((d, i) => d.addEventListener('click', () => { clearInterval(timer); show(i); play(); }));
}

// Animated counters — the real figure is in the HTML, so a visitor with no JS,
// no IntersectionObserver or reduced motion still reads the number rather than 0.
const counters = document.querySelectorAll('[data-count]');
const noMotion = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
if (counters.length && 'IntersectionObserver' in window && !noMotion) {
  const cio = new IntersectionObserver((entries) => {
    entries.forEach(e => {
      if (!e.isIntersecting) return;
      cio.unobserve(e.target);
      const el = e.target, target = parseInt(el.dataset.count, 10);
      const dur = 1400, t0 = performance.now();
      const tick = (t) => {
        const p = Math.min((t - t0) / dur, 1);
        const eased = 1 - Math.pow(1 - p, 3);
        el.firstChild.textContent = Math.round(target * eased);
        if (p < 1) requestAnimationFrame(tick);
      };
      requestAnimationFrame(tick);
    });
  }, { threshold: 0.5 });
  counters.forEach(el => {
    // only zero it out once we know the animation will actually run
    if (el.firstChild && el.firstChild.nodeType === 3) el.firstChild.textContent = '0';
    cio.observe(el);
  });
}

// Project filters
document.querySelectorAll('.filter-nav').forEach(nav => {
  const scope = nav.dataset.scope ? document.getElementById(nav.dataset.scope) : document;
  nav.addEventListener('click', (e) => {
    const btn = e.target.closest('button'); if (!btn) return;
    nav.querySelectorAll('button').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    const f = btn.dataset.filter;
    scope.querySelectorAll('.proj-item').forEach(item => {
      item.classList.toggle('hidden', f !== 'all' && item.dataset.cat !== f);
    });
  });
});

// ---------- Consultation wizard + WhatsApp handoff ----------
// navigate directly: window.open is blocked on many mobile browsers
const WA_NUMBER = '96872160022';
const waForm = document.getElementById('wa-form');

if (waForm) {
  const panels = waForm.querySelectorAll('.wiz-panel');
  const chips  = waForm.querySelectorAll('.wiz-steps li');

  const show = (n) => {
    panels.forEach(p => p.classList.toggle('on', p.dataset.panel === String(n)));
    chips.forEach(c => {
      const i = Number(c.dataset.step);
      c.classList.toggle('on', i === n);
      c.classList.toggle('done', i < n);
    });
    const top = waForm.getBoundingClientRect().top + window.scrollY - 90;
    if (window.scrollY > top) window.scrollTo({ top, behavior: 'smooth' });
    const first = waForm.querySelector('.wiz-panel.on input, .wiz-panel.on textarea');
    if (first && n === 3) first.focus({ preventScroll: true });
  };

  waForm.addEventListener('click', (e) => {
    const btn = e.target.closest('[data-go]');
    if (btn) { e.preventDefault(); show(Number(btn.dataset.go)); }
  });

  // let a step be confirmed with the keyboard
  waForm.addEventListener('keydown', (e) => {
    if (e.key !== 'Enter') return;
    const panel = e.target.closest('.wiz-panel');
    if (!panel || panel.dataset.panel === '3') return;
    e.preventDefault();
    show(Number(panel.dataset.panel) + 1);
  });

  waForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const val = (id) => (document.getElementById(id)?.value || '').trim();
    const pick = (name) => (waForm.querySelector(`input[name="${name}"]:checked`)?.value || '—');

    const name = val('cf-name');
    if (!name) {
      const f = document.getElementById('cf-name');
      f.focus(); f.style.borderColor = '#E0645A';
      setTimeout(() => { f.style.borderColor = ''; }, 1800);
      return;
    }
    const lines = [
      'Hello Mecamac,', '',
      'I am a: ' + pick('who'),
      'I need: ' + pick('need'), '',
      'Name: ' + name
    ];
    if (val('cf-org'))   lines.push('Company: ' + val('cf-org'));
    if (val('cf-phone')) lines.push('Phone: ' + val('cf-phone'));
    if (val('cf-email')) lines.push('Email: ' + val('cf-email'));
    if (val('cf-msg'))   lines.push('', val('cf-msg'));

    window.location.href = 'https://wa.me/' + WA_NUMBER + '?text=' + encodeURIComponent(lines.join('\n'));
  });
}

// ---------- Video playback (mobile-safe) ----------
const vids = document.querySelectorAll('video');
if (vids.length) {
  vids.forEach(v => {
    v.muted = true;              // property, not just attribute — required by iOS
    v.setAttribute('playsinline', '');
    const tryPlay = () => { const p = v.play(); if (p) p.catch(() => {}); };
    tryPlay();
    v.addEventListener('loadeddata', tryPlay, { once: true });
  });
  // Only play what is on screen
  const vio = new IntersectionObserver((entries) => {
    entries.forEach(e => {
      if (e.isIntersecting) { const p = e.target.play(); if (p) p.catch(() => {}); }
      else e.target.pause();
    });
  }, { threshold: 0.2 });
  vids.forEach(v => vio.observe(v));
  // Some browsers block autoplay until the first interaction
  document.addEventListener('touchstart', () => vids.forEach(v => { const p = v.play(); if (p) p.catch(() => {}); }), { once: true, passive: true });
}


// ---------- Project brief overlay ----------
const briefOverlay = document.getElementById('brief-overlay');
if (briefOverlay) {
  const el = id => document.getElementById(id);
  const closeBtn = el('brief-close');
  let lastFocus = null;

  const openBrief = (card) => {
    lastFocus = card;
    // an empty src= makes the browser re-request the page — set it only when real
    const img = el('brief-img');
    if (card.dataset.img) { img.src = card.dataset.img; img.hidden = false; }
    else { img.removeAttribute('src'); img.hidden = true; }
    img.alt = card.dataset.title || '';
    el('brief-sector').textContent = card.dataset.sector || '';
    el('brief-title').textContent = card.dataset.title || '';
    el('brief-meta').textContent = card.dataset.meta || '';
    el('brief-desc').textContent = card.dataset.desc || '';

    const facts = el('brief-facts');
    facts.innerHTML = '';
    (card.dataset.facts || '').split('|').filter(Boolean).forEach(pair => {
      const [k, v] = pair.split('::');
      if (!k || !v) return;
      const wrap = document.createElement('div');
      const dt = document.createElement('dt'); dt.textContent = k;
      const dd = document.createElement('dd'); dd.innerHTML = v;
      wrap.append(dt, dd); facts.appendChild(wrap);
    });

    briefOverlay.classList.add('open');
    document.body.classList.add('nav-open');
    closeBtn.focus();
  };

  const closeBrief = () => {
    briefOverlay.classList.remove('open');
    document.body.classList.remove('nav-open');
    if (lastFocus) lastFocus.focus();
  };

  document.querySelectorAll('.proj-item').forEach(card => {
    card.addEventListener('click', () => openBrief(card));
    card.addEventListener('keydown', e => {
      if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); openBrief(card); }
    });
  });

  closeBtn.addEventListener('click', closeBrief);
  briefOverlay.addEventListener('click', e => { if (e.target === briefOverlay) closeBrief(); });
  document.addEventListener('keydown', e => {
    if (e.key === 'Escape' && briefOverlay.classList.contains('open')) closeBrief();
  });
}


/* ============================================================
   MOTION — scroll progress, header state, hero parallax,
   and page transitions.
   All of it is skipped when the visitor asks for reduced motion.
   ============================================================ */
(function () {
  'use strict';
  var reduce = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ---- page transitions ---------------------------------- */
  var supportsVT = typeof document.startViewTransition === 'function'
                && CSS.supports('selector(::view-transition)');
  if (!supportsVT) document.documentElement.classList.add('no-vt');

  if (!supportsVT && !reduce) {
    // fade the page out before following an internal link
    document.addEventListener('click', function (e) {
      var a = e.target.closest && e.target.closest('a[href]');
      if (!a) return;
      if (a.target === '_blank' || a.hasAttribute('download')) return;
      if (e.defaultPrevented) return;
      if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey || e.button !== 0) return;
      // mailto:/tel: resolve to a null origin, so this also skips them
      if (a.origin !== location.origin) return;
      var href = a.getAttribute('href');
      if (!href || href.charAt(0) === '#') return;          // in-page anchor
      if (a.pathname === location.pathname && a.hash) return;

      e.preventDefault();
      document.body.classList.add('page-exit');
      setTimeout(function () { location.href = a.href; }, 240);
    });
    // returning via the bfcache must not leave the page faded out
    window.addEventListener('pageshow', function (ev) {
      if (ev.persisted) document.body.classList.remove('page-exit');
    });
  }

  if (reduce) return;

  /* ---- scroll progress + header state + hero parallax ----- */
  var bar = document.createElement('div');
  bar.className = 'scroll-progress';
  bar.setAttribute('aria-hidden', 'true');
  document.body.appendChild(bar);

  var heroMedia = document.querySelector('.hero-video video, .hero .hero-figure img');
  var ticking = false;

  function frame() {
    ticking = false;
    var y = window.scrollY || 0;
    var max = document.documentElement.scrollHeight - window.innerHeight;
    bar.style.transform = 'scaleX(' + (max > 0 ? Math.min(y / max, 1) : 0) + ')';
    document.body.classList.toggle('scrolled', y > 40);
    if (heroMedia && y < window.innerHeight) {
      heroMedia.style.transform = 'translate3d(0,' + (y * 0.14) + 'px,0) scale(1.06)';
    }
  }
  function onScroll() { if (!ticking) { ticking = true; requestAnimationFrame(frame); } }

  window.addEventListener('scroll', onScroll, { passive: true });
  window.addEventListener('resize', onScroll, { passive: true });
  frame();
})();


/* ---------- Magnetic CTAs + card tilt (fine pointers only) ---------- */
(function () {
  'use strict';
  if (window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  if (!window.matchMedia || !matchMedia('(hover:hover) and (pointer:fine)').matches) return;

  // primary buttons drift a little toward the cursor
  document.querySelectorAll('.btn-cyan').forEach(function (btn) {
    var raf = null, tx = 0, ty = 0;
    function apply() { raf = null; btn.style.transform = 'translate(' + tx + 'px,' + ty + 'px)'; }
    btn.addEventListener('mousemove', function (e) {
      var r = btn.getBoundingClientRect();
      tx = ((e.clientX - r.left) / r.width - 0.5) * 10;
      ty = ((e.clientY - r.top) / r.height - 0.5) * 6 - 2;
      if (!raf) raf = requestAnimationFrame(apply);
    });
    btn.addEventListener('mouseleave', function () {
      tx = 0; ty = 0;
      btn.style.transform = '';
    });
  });

  // cards lean a couple of degrees toward the cursor
  document.querySelectorAll('.grid > .card').forEach(function (card) {
    var raf = null, rx = 0, ry = 0;
    function apply() {
      raf = null;
      card.style.transform = 'translateY(-5px) perspective(900px) rotateX(' + rx + 'deg) rotateY(' + ry + 'deg)';
    }
    card.addEventListener('mousemove', function (e) {
      var r = card.getBoundingClientRect();
      ry = ((e.clientX - r.left) / r.width - 0.5) * 3.2;
      rx = -((e.clientY - r.top) / r.height - 0.5) * 3.2;
      if (!raf) raf = requestAnimationFrame(apply);
    });
    card.addEventListener('mouseleave', function () { card.style.transform = ''; });
  });
})();
