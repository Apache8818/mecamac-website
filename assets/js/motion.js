/* ============================================================
   Mecamac — WCAG 2.2.2 "Pause, Stop, Hide"
   Every hero and section clip starts on its own, loops, and runs
   well past five seconds behind live text, so the visitor must be
   able to stop it. One control in the header does that for the
   whole page and the choice follows them from page to page.

   It works in both directions: a visitor who arrives with
   "reduce motion" set gets the posters (plexus.js / lazyvideo.js
   never fetch the files), and pressing play here loads and starts
   them deliberately. The button hides itself on pages with no
   autoplaying video.
   ============================================================ */
(function () {
  'use strict';
  var KEY = 'mecamac-motion';
  var btn = document.getElementById('motion-btn');
  if (!btn) return;

  function read() { try { return localStorage.getItem(KEY); } catch (e) { return null; } }
  function write(v) { try { localStorage.setItem(KEY, v); } catch (e) { } }
  function clips() { return [].slice.call(document.querySelectorAll('video[autoplay]')); }

  if (!clips().length) { btn.hidden = true; return; }

  var reduce = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;
  var stored = read();
  var playing = stored ? stored === 'on' : !reduce;

  // the two loaders bail out for reduced-motion and data-saver visitors,
  // so pressing play has to be able to fetch the sources itself
  function ensureSrc(v) {
    if (v.dataset.motionLoaded) return;
    v.dataset.motionLoaded = '1';
    var changed = false;
    if (v.dataset.src && !v.getAttribute('src')) {
      var small = window.matchMedia('(max-width: 820px)').matches;
      v.src = (small && v.dataset.srcMobile) ? v.dataset.srcMobile : v.dataset.src;
      changed = true;
    }
    var ss = v.querySelectorAll('source[data-src]');
    for (var i = 0; i < ss.length; i++) {
      if (!ss[i].getAttribute('src')) { ss[i].setAttribute('src', ss[i].getAttribute('data-src')); changed = true; }
    }
    if (changed) { v.muted = true; v.setAttribute('playsinline', ''); v.load(); }
  }

  function label() {
    var ar = document.documentElement.lang === 'ar';
    return playing
      ? (ar ? 'إيقاف حركة الفيديو في الخلفية' : 'Pause background video')
      : (ar ? 'تشغيل حركة الفيديو في الخلفية' : 'Play background video');
  }

  function paint() {
    btn.setAttribute('data-state', playing ? 'playing' : 'paused');
    btn.setAttribute('aria-label', label());
    btn.title = label();
    // the two loaders read this before they fetch anything, so a visitor who
    // has asked for stillness downloads no video at all on the next page
    if (playing) document.documentElement.removeAttribute('data-motion');
    else document.documentElement.setAttribute('data-motion', 'off');
  }

  function start(v) {
    ensureSrc(v);
    var p = v.play();
    if (p && p.catch) p.catch(function () { });
  }

  // Pressing play has to take over the loading the two loaders skipped — but it
  // must stay lazy, or one press would pull every clip on the page at once.
  var io = null;
  function watchRest() {
    if (io || !('IntersectionObserver' in window)) { clips().forEach(start); return; }
    io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) { if (e.isIntersecting) { start(e.target); io.unobserve(e.target); } });
    }, { rootMargin: '400px 0px' });
    clips().forEach(function (v) { io.observe(v); });
  }

  function apply(save) {
    paint();
    if (playing) {
      watchRest();
    } else {
      if (io) { io.disconnect(); io = null; }
      clips().forEach(function (v) { if (!v.paused) v.pause(); });
    }
    if (save) write(playing ? 'on' : 'off');
  }

  // a clip that loads later (lazy, or scrolled into view) must not
  // start up again behind a visitor who has already asked for stillness
  document.addEventListener('play', function (e) {
    if (!playing && e.target && e.target.tagName === 'VIDEO') e.target.pause();
  }, true);

  btn.addEventListener('click', function () { playing = !playing; apply(true); });
  document.addEventListener('langchange', function () { btn.setAttribute('aria-label', label()); btn.title = label(); });

  // On load, touch the clips only when this visitor differs from the default,
  // otherwise plexus.js and lazyvideo.js own the loading — calling apply() here
  // unconditionally would fetch every clip on the page and defeat lazy loading.
  paint();
  if (!playing) apply(false);                       // stop anything already running
  else if (stored === 'on' && reduce) apply(false); // asked for motion the loaders skipped
})();
