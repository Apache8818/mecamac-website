/* ============================================================
   Mecamac — "see it on your wall": lazy model-viewer (Apache-2.0, self-hosted)
   The 1 MB library loads only when the block is near the viewport or on tap.
   GLB for Android/WebXR (ar-placement=wall), USDZ for iOS Quick Look.
   Two genuine ABB products at catalogue dimensions — the same two the
   simulator above is built around:
     abb-smarttouch10  ST/U10.1.11-825 · 254.6 × 180.2 mm, 14 mm proud
   Opened from a file:// copy the model cannot be fetched, so the still
   product image stays and the block says why.
   ============================================================ */
(function () {
  'use strict';
  var block = document.getElementById('ar-block'); if (!block) return;
  var loaded = false, base = (function () { var s = document.querySelector('script[src*="assets/js/wall-ar.js"]'); return s ? s.getAttribute('src').replace(/assets\/js\/wall-ar\.js$/, '') : '../'; })();
  function label() { return document.documentElement.lang === 'ar' ? 'شوفه على حيطتك' : 'View on your wall'; }
  function mount() {
    if (loaded) return; loaded = true;
    var sc = document.createElement('script'); sc.src = base + 'assets/js/model-viewer-umd.min.js';
    sc.onload = function () {
      block.querySelectorAll('.ar-view').forEach(function (v) {
        var mv = document.createElement('model-viewer');
        mv.setAttribute('src', v.dataset.src); mv.setAttribute('ios-src', v.dataset.ios); mv.setAttribute('alt', v.dataset.alt);
        mv.setAttribute('ar', ''); mv.setAttribute('ar-modes', 'webxr scene-viewer quick-look'); mv.setAttribute('ar-placement', 'wall'); mv.setAttribute('ar-scale', 'fixed');
        mv.setAttribute('camera-controls', ''); mv.setAttribute('auto-rotate', ''); mv.setAttribute('auto-rotate-delay', '2500'); mv.setAttribute('rotation-per-second', '10deg'); mv.setAttribute('shadow-intensity', '0.5'); mv.setAttribute('exposure', '1'); mv.setAttribute('interaction-prompt', 'none');
        mv.setAttribute('camera-orbit', v.dataset.orbit || '18deg 80deg 0.6m'); mv.setAttribute('camera-target', '0m 0m 0m'); mv.setAttribute('field-of-view', '28deg'); mv.setAttribute('min-camera-orbit', 'auto auto 0.12m'); mv.setAttribute('max-camera-orbit', 'auto auto 1.2m'); mv.setAttribute('loading', 'eager');
        var btn = document.createElement('button'); btn.setAttribute('slot', 'ar-button'); btn.className = 'ar-btn'; btn.type = 'button';
        btn.innerHTML = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M3 7V4h3M21 7V4h-3M3 17v3h3M21 17v3h-3"/><rect x="7" y="8" width="10" height="8" rx="1.5"/></svg><span>' + label() + '</span>';
        mv.appendChild(btn);
        var still = v.querySelector('img');
        mv.addEventListener('error', function () { v.innerHTML = ''; if (still) v.appendChild(still); v.classList.remove('is-3d'); });
        mv.addEventListener('load', function () { v.classList.add('is-3d'); });
        if (still) still.remove();
        v.appendChild(mv);
        if (v.dataset.poster) mv.setAttribute('poster', v.dataset.poster);
      });
      block.classList.add('ar-ready');
    };
    document.head.appendChild(sc);
  }
  // from a local copy (file://) a browser refuses to fetch the model — keep the photo
  if (location.protocol === 'file:') {
    block.classList.add('ar-local');
    var n = document.createElement('p'); n.className = 'ar-note ar-local-note';
    n.textContent = document.documentElement.lang === 'ar'
      ? 'المعاينة ثلاثية الأبعاد تحتاج الموقع مرفوعاً على سيرفر (أو خادم محلي) — من ملف على الجهاز المتصفح ما بيسمح بتحميل الموديل، فالصورة أعلاه هي صورة المنتج الحقيقية.'
      : 'The 3D preview needs the site served over http — opened as a local file the browser will not fetch the model, so the real product photo is shown instead.';
    block.appendChild(n);
    var lb0 = document.getElementById('ar-load'); if (lb0) lb0.hidden = true;
    return;
  }
  var loadBtn = document.getElementById('ar-load'); if (loadBtn) loadBtn.addEventListener('click', mount);
  if ('IntersectionObserver' in window && !(navigator.connection && navigator.connection.saveData)) {
    var io = new IntersectionObserver(function (es) { es.forEach(function (e) { if (e.isIntersecting) { mount(); io.disconnect(); } }); }, { rootMargin: '300px' });
    io.observe(block);
  }
  document.addEventListener('langchange', function () { block.querySelectorAll('.ar-btn span').forEach(function (s) { s.textContent = label(); }); });
})();
