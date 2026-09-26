/* ============================================================
   Mecamac — before / after comparison slider
   <div class="cmp-slider" data-before="Structure" data-after="Handover">
     <img src="before.webp" alt=""> <img src="after.webp" alt="">
   </div>
   Pointer drag, touch, keyboard (← → Home End), labels in both languages via
   data-before-ar / data-after-ar. No dependencies.
   ============================================================ */
(function () {
  'use strict';
  var lang = function () { return document.documentElement.getAttribute('lang') === 'ar' ? 'ar' : 'en'; };
  document.querySelectorAll('.cmp-slider').forEach(function (box) {
    var imgs = box.querySelectorAll('img'); if (imgs.length < 2) return;
    var before = imgs[0], after = imgs[1];
    box.innerHTML = '';
    var a = document.createElement('div'); a.className = 'cmp-after'; a.appendChild(after);
    var b = document.createElement('div'); b.className = 'cmp-before'; b.appendChild(before);
    var handle = document.createElement('div'); handle.className = 'cmp-handle'; handle.setAttribute('role', 'slider'); handle.setAttribute('tabindex', '0'); handle.setAttribute('aria-valuemin', '0'); handle.setAttribute('aria-valuemax', '100');
    handle.innerHTML = '<span></span>';
    var lb = document.createElement('span'); lb.className = 'cmp-lbl cmp-lbl--b'; var la = document.createElement('span'); la.className = 'cmp-lbl cmp-lbl--a';
    box.appendChild(a); box.appendChild(b); box.appendChild(handle); box.appendChild(lb); box.appendChild(la);
    var pos = 50;
    function labels() { var L = lang(); lb.textContent = box.getAttribute('data-before' + (L === 'ar' ? '-ar' : '')) || box.getAttribute('data-before') || ''; la.textContent = box.getAttribute('data-after' + (L === 'ar' ? '-ar' : '')) || box.getAttribute('data-after') || ''; handle.setAttribute('aria-label', lb.textContent + ' / ' + la.textContent); }
    var rtl = function () { return getComputedStyle(box).direction === 'rtl'; };
    function set(p) { pos = Math.max(0, Math.min(100, p)); b.style.width = pos + '%'; if (rtl()) { handle.style.left = 'auto'; handle.style.right = pos + '%'; } else { handle.style.right = 'auto'; handle.style.left = pos + '%'; } handle.setAttribute('aria-valuenow', Math.round(pos)); }
    function fromEvent(e) { var r = box.getBoundingClientRect(), cx = (e.touches ? e.touches[0].clientX : e.clientX); var x = rtl() ? r.right - cx : cx - r.left; set(x / r.width * 100); }
    var down = false;
    box.addEventListener('pointerdown', function (e) { down = true; box.setPointerCapture && box.setPointerCapture(e.pointerId); fromEvent(e); e.preventDefault(); });
    window.addEventListener('pointermove', function (e) { if (down) fromEvent(e); });
    window.addEventListener('pointerup', function () { down = false; });
    handle.addEventListener('keydown', function (e) { var k = e.key, d = rtl() ? -1 : 1; if (k === 'ArrowLeft') set(pos - 4 * d); else if (k === 'ArrowRight') set(pos + 4 * d); else if (k === 'Home') set(0); else if (k === 'End') set(100); else return; e.preventDefault(); });
    labels(); set(50);
    document.addEventListener('langchange', function () { labels(); set(pos); });
  });
})();
