/* ============================================================
   Mecamac — hero plexus
   Draws the network motif from the brand identity: nodes drifting
   on a dark field, joined by lines that fade with distance.
   Sizing is capped at 2× DPR and the node count scales with area,
   so it stays cheap on phones. Pauses when off-screen or hidden.
   ============================================================ */
(function () {
  'use strict';
  var reduce = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;

  document.querySelectorAll('.hero-stage__canvas').forEach(function (cv) {
    var ctx = cv.getContext('2d', { alpha: true });
    if (!ctx) return;

    var nodes = [], w = 0, h = 0, dpr = 1, raf = null, visible = true;
    var LINK = 150;                       // px at CSS scale
    var accent = '134,214,240';

    function size() {
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      var r = cv.getBoundingClientRect();
      w = Math.max(r.width, 1); h = Math.max(r.height, 1);
      cv.width = Math.round(w * dpr); cv.height = Math.round(h * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      build();
    }

    function build() {
      var target = Math.round(Math.min(Math.max((w * h) / 17000, 26), 110));
      nodes = [];
      for (var i = 0; i < target; i++) {
        nodes.push({
          x: Math.random() * w,
          y: Math.random() * h,
          vx: (Math.random() - 0.5) * 0.22,
          vy: (Math.random() - 0.5) * 0.22,
          r: Math.random() * 1.6 + 0.9,
          p: Math.random() * Math.PI * 2      // phase for the twinkle
        });
      }
    }

    function draw(t) {
      raf = null;
      ctx.clearRect(0, 0, w, h);

      // links first so nodes sit on top
      for (var i = 0; i < nodes.length; i++) {
        var a = nodes[i];
        for (var j = i + 1; j < nodes.length; j++) {
          var b = nodes[j];
          var dx = a.x - b.x, dy = a.y - b.y;
          var d2 = dx * dx + dy * dy;
          if (d2 > LINK * LINK) continue;
          var o = (1 - Math.sqrt(d2) / LINK) * 0.30;
          ctx.strokeStyle = 'rgba(' + accent + ',' + o.toFixed(3) + ')';
          ctx.lineWidth = 1;
          ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y); ctx.stroke();
        }
      }
      for (var k = 0; k < nodes.length; k++) {
        var n = nodes[k];
        var tw = 0.55 + 0.45 * Math.sin(t / 1400 + n.p);
        ctx.fillStyle = 'rgba(' + accent + ',' + (0.55 * tw).toFixed(3) + ')';
        ctx.beginPath(); ctx.arc(n.x, n.y, n.r, 0, Math.PI * 2); ctx.fill();

        if (reduce) continue;
        n.x += n.vx; n.y += n.vy;
        if (n.x < -20) n.x = w + 20; else if (n.x > w + 20) n.x = -20;
        if (n.y < -20) n.y = h + 20; else if (n.y > h + 20) n.y = -20;
      }
      if (!reduce && visible) raf = requestAnimationFrame(draw);
    }

    function start() { if (!raf) raf = requestAnimationFrame(draw); }
    function stop() { if (raf) { cancelAnimationFrame(raf); raf = null; } }

    size();
    start();

    var rt;
    window.addEventListener('resize', function () {
      clearTimeout(rt); rt = setTimeout(function () { size(); start(); }, 160);
    }, { passive: true });

    // don't burn frames while the hero is scrolled away or the tab is hidden
    if ('IntersectionObserver' in window) {
      new IntersectionObserver(function (es) {
        visible = es[0].isIntersecting;
        if (visible) start(); else stop();
      }, { threshold: 0 }).observe(cv);
    }
    document.addEventListener('visibilitychange', function () {
      if (document.hidden) stop(); else if (visible) start();
    });
  });
})();


/* ============================================================
   Hero video source selection
   <source media="..."> is only honoured inside <picture>; browsers
   ignore it on <video>, so phones were downloading the 1080p file.
   Pick the rendition here instead, and skip video entirely when the
   visitor has asked for reduced motion or is on a metered connection.
   ============================================================ */
(function () {
  'use strict';
  var vids = document.querySelectorAll('.hero-stage__video[data-src]');
  if (!vids.length) return;

  var reduce = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;
  var conn = navigator.connection || navigator.mozConnection || navigator.webkitConnection;
  var thrifty = !!(conn && (conn.saveData || /^([23]g|slow-2g)$/.test(conn.effectiveType || '')));

  // poster alone is the right answer for these three cases — the third is a
  // visitor who pressed pause in the header, whose choice the <head> stamped on <html>
  var stilled = document.documentElement.getAttribute('data-motion') === 'off';
  if (reduce || thrifty || stilled) return;

  var small = window.matchMedia('(max-width: 820px)').matches;

  vids.forEach(function (v) {
    v.src = (small && v.dataset.srcMobile) ? v.dataset.srcMobile : v.dataset.src;
    v.muted = true;
    v.setAttribute('playsinline', '');
    v.load();
    var p = v.play();
    if (p && p.catch) p.catch(function () {});   // autoplay may still be blocked
  });
})();
