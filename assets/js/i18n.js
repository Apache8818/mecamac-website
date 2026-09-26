/* ============================================================
   Mecamac — language (EN/AR) + theme (light/dark)
   Arabic strings live in ar.js, keyed by data-i18n. That file is ~130 KB, so
   it is fetched only when Arabic is actually wanted — an English visit never
   pays for it. English is whatever the HTML already contains, cached on load,
   so there is no second dictionary to keep in sync.
   ============================================================ */
(function () {
  'use strict';

  var LANG_KEY = 'mecamac-lang', THEME_KEY = 'mecamac-theme';
  var root = document.documentElement;
  var AR = window.MECAMAC_AR || {};
  var original = null, arLoading = false;
  var arSrc = (function () {
    var sc = document.querySelector('script[src*="assets/js/i18n.js"]');
    return (sc ? sc.getAttribute('src').replace(/i18n\.js$/, '') : 'assets/js/') + 'ar.js';
  })();
  // fetch the Arabic table on demand, then run `then`
  function withArabic(then) {
    if (window.MECAMAC_AR) { AR = window.MECAMAC_AR; then(); return; }
    if (arLoading) { document.addEventListener('mecamac-ar-ready', function h() { document.removeEventListener('mecamac-ar-ready', h); then(); }); return; }
    arLoading = true;
    var s = document.createElement('script');
    s.src = arSrc;
    s.onload = function () { AR = window.MECAMAC_AR || {}; arLoading = false; document.dispatchEvent(new Event('mecamac-ar-ready')); then(); };
    s.onerror = function () { arLoading = false; then(); };      // worst case: the page stays in English
    document.head.appendChild(s);
  }

  function store(k, v) { try { localStorage.setItem(k, v); } catch (e) {} }
  function read(k) { try { return localStorage.getItem(k); } catch (e) { return null; } }

  function cacheOriginals() {
    if (original) return;
    original = {};
    var els = document.querySelectorAll('[data-i18n]');
    for (var i = 0; i < els.length; i++) original[els[i].getAttribute('data-i18n')] = els[i].innerHTML;
  }

  function applyLang(lang) {
    if (lang === 'ar' && !window.MECAMAC_AR) { cacheOriginals(); withArabic(function () { applyLang('ar'); }); return; }
    // the inline <head> loader injects ar.js for a visitor whose stored language
    // is Arabic, and that script can finish running after this file has already
    // been parsed — so read the table here instead of trusting the parse-time copy
    if (window.MECAMAC_AR) AR = window.MECAMAC_AR;
    cacheOriginals();
    var ar = lang === 'ar';
    root.setAttribute('lang', ar ? 'ar' : 'en');
    root.setAttribute('dir', ar ? 'rtl' : 'ltr');

    var els = document.querySelectorAll('[data-i18n]');
    for (var i = 0; i < els.length; i++) {
      var el = els[i], k = el.getAttribute('data-i18n');
      var val = ar ? AR[k] : original[k];
      if (val !== undefined && val !== null && el.innerHTML !== val) el.innerHTML = val;
    }
    var ph = document.querySelectorAll('[data-i18n-ph]');
    for (var j = 0; j < ph.length; j++) {
      var p = ph[j], pk = p.getAttribute('data-i18n-ph');
      if (!p.getAttribute('data-ph-en')) p.setAttribute('data-ph-en', p.getAttribute('placeholder') || '');
      p.setAttribute('placeholder', ar && AR[pk] ? AR[pk] : p.getAttribute('data-ph-en'));
    }
    // static WhatsApp links carry their prefilled message in both languages
    var wa = document.querySelectorAll('a[data-wa-en]');
    for (var w = 0; w < wa.length; w++) {
      var a = wa[w], base = a.getAttribute('href').split('?')[0];
      var msg = ar ? (a.getAttribute('data-wa-ar') || a.getAttribute('data-wa-en')) : a.getAttribute('data-wa-en');
      a.setAttribute('href', base + '?text=' + encodeURIComponent(msg));
    }
    var btn = document.getElementById('lang-btn');
    if (btn) {
      btn.textContent = ar ? 'EN' : 'AR';
      btn.setAttribute('aria-label', ar ? 'Switch to English' : 'التبديل إلى العربية');
    }
    themeLabel();
    root.classList.remove('ar-pending');          // the page may show now
    store(LANG_KEY, ar ? 'ar' : 'en');
    document.dispatchEvent(new CustomEvent('langchange', { detail: { lang: ar ? 'ar' : 'en' } }));
  }

  function themeLabel() {
    var b = document.getElementById('theme-btn'); if (!b) return;
    var ar = root.getAttribute('lang') === 'ar', dark = root.getAttribute('data-theme') === 'dark';
    b.setAttribute('aria-label', dark
      ? (ar ? 'التبديل إلى الوضع الفاتح' : 'Switch to light mode')
      : (ar ? 'التبديل إلى الوضع الداكن' : 'Switch to dark mode'));
  }

  function applyTheme(mode) {
    root.setAttribute('data-theme', mode);
    store(THEME_KEY, mode);
    themeLabel();
  }

  function init() {
    var lang = read(LANG_KEY) || 'en';
    if (lang === 'ar') applyLang('ar'); else applyLang('en');   // 'en' also wires the bilingual WhatsApp links

    var lb = document.getElementById('lang-btn');
    if (lb) {
      lb.textContent = lang === 'ar' ? 'EN' : 'AR';
      lb.addEventListener('click', function () {
        applyLang(root.getAttribute('lang') === 'ar' ? 'en' : 'ar');
      });
    }
    var tb = document.getElementById('theme-btn');
    if (tb) tb.addEventListener('click', function () {
      applyTheme(root.getAttribute('data-theme') === 'dark' ? 'light' : 'dark');
    });
  }

  // This file sits at the end of <body> on every page, after every [data-i18n]
  // element, so it can translate immediately instead of waiting for
  // DOMContentLoaded — which on the simulator page comes 1.5 s later, behind
  // three.js. The theme/lang buttons are in the header, already parsed too.
  init();
})();
