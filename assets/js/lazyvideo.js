/* ============================================================
   Mecamac — load the section videos only when they are about to be seen.
   The markup ships the sources as data-src, so a visitor who never scrolls
   to a clip never downloads it. Reduced motion and data-saver visitors keep
   the poster and download nothing at all.
   ============================================================ */
(function () {
  'use strict';
  var vids = [].slice.call(document.querySelectorAll('video[data-lazy]'));
  if (!vids.length) return;

  var reduce = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;
  var conn = navigator.connection || navigator.mozConnection || navigator.webkitConnection;
  var thrifty = !!(conn && (conn.saveData || /^([23]g|slow-2g)$/.test(conn.effectiveType || '')));
  var stilled = document.documentElement.getAttribute('data-motion') === 'off';
  if (reduce || thrifty || stilled) return;      // the poster is the right answer for all three

  function load(v) {
    if (v.dataset.loaded) return;
    v.dataset.loaded = '1';
    var srcs = v.querySelectorAll('source[data-src]');
    for (var i = 0; i < srcs.length; i++) srcs[i].setAttribute('src', srcs[i].getAttribute('data-src'));
    v.load();
    var p = v.play();
    if (p && p.catch) p.catch(function () {});   // autoplay can still be refused; the poster stays
  }
  if (!('IntersectionObserver' in window)) { vids.forEach(load); return; }
  var io = new IntersectionObserver(function (entries) {
    entries.forEach(function (e) { if (e.isIntersecting) { load(e.target); io.unobserve(e.target); } });
  }, { rootMargin: '400px 0px' });
  vids.forEach(function (v) { io.observe(v); });
})();
