/* ============================================================
   Mecamac — cooling energy calculator (HVAC page)
   Deliberately no money: no tariff, no bill, no OMR. It answers one
   question — how much LESS energy a modern inverter system with smart
   control uses — and it answers it conservatively, so the real result
   should be at least this good, never worse.
   Every assumption lives in CFG so an engineer can tune it.
   Method: floor area → tons of cooling → thermal kWh/year from run-hours
   and a conservative load factor → electrical kWh via the equipment EER,
   today and after. The difference is the saving.
   ============================================================ */
(function () {
  'use strict';
  var host = document.getElementById('energy-calc'); if (!host) return;

  var CFG = {
    m2PerTon: 18,            // conservative: one ton per 18 m² (12–20 typical in Oman) — fewer tons, smaller claim
    loadFactor: 0.50,        // conservative average compressor duty over the cooling season
    kwPerTon: 3.517,         // thermal kW per ton of refrigeration
    smartSetback: 0.10,      // conservative extra saving from scheduling, occupancy setback and scene control
    newEER: 3.7,             // conservative seasonal EER of a modern RUUD inverter system
    co2PerKwh: 0.45,         // kg CO₂ per grid kWh in Oman (gas-fired generation, indicative)
    existing: [              // the four system types we actually meet in Omani villas; EERs are set on the
                             // generous side for the EXISTING equipment, so the saving is understated
      { id: 'cassette', eer: 2.9, en: 'Ceiling cassette units', ar: 'وحدات كاسيت سقفية' },
      { id: 'ducted', eer: 2.8, en: 'Concealed ducted units', ar: 'وحدات دكت مخفية' },
      { id: 'split', eer: 3.0, en: 'Wall / floor split units', ar: 'وحدات سبليت جداري / أرضي' },
      { id: 'package', eer: 2.7, en: 'Packaged units', ar: 'وحدات باكج' }
    ]
  };
  var T = {
    en: { area: 'Conditioned area', ac: 'Cooling today', hours: 'Run hours per day', months: 'Cooling months per year',
          today: 'Cooling energy today', after: 'With RUUD inverter + smart control', kwh: 'kWh / year', save: 'You would use', less: 'less cooling energy',
          saved: 'kWh saved per year', co2: 'kg CO₂ avoided per year', tons: 'tons of cooling', method: 'How this is worked out',
          methodTxt: 'Area → tons of cooling (one ton per 18 m²) → thermal energy from your run hours and a 50 % seasonal load factor → electrical energy through the efficiency (EER) of each system. Seasonal EER taken as 2.7 for packaged, 2.8 for concealed ducted, 2.9 for cassettes and 3.0 for wall splits, against a modest 3.7 for the RUUD inverter system. The figures are kept deliberately conservative — the existing equipment is credited generously — so a real installation should do better than this, not worse.',
          note: 'An energy estimate, not a bill and not a quotation — it deliberately understates the saving. Real consumption depends on insulation, glazing, occupancy and set-points; a site survey and your last twelve bills give the accurate figure. For prices, message us.',
          wa: 'Send these numbers and ask for a price', waMsg: 'Hello Mecamac, I ran the cooling calculator on your website and I would like a price:' },
    ar: { area: 'المساحة المكيَّفة', ac: 'التكييف الحالي', hours: 'ساعات التشغيل يومياً', months: 'أشهر التكييف في السنة',
          today: 'طاقة التكييف اليوم', after: 'مع RUUD إنفرتر + تحكم ذكي', kwh: 'ك.و.س / سنة', save: 'استهلاكك بيصير', less: 'أقل في طاقة التكييف',
          saved: 'ك.و.س موفَّرة في السنة', co2: 'كغ CO₂ مُجنَّبة سنوياً', tons: 'طن تبريد', method: 'كيف حسبناها',
          methodTxt: 'المساحة ← أطنان التبريد (طن لكل ١٨ م²) ← الطاقة الحرارية من ساعات تشغيلك ومعامل حِمل موسمي ٥٠٪ ← الطاقة الكهربائية عبر كفاءة كل نظام (EER). الكفاءة الموسمية: ٢٫٧ للباكج، ٢٫٨ للدكت المخفي، ٢٫٩ للكاسيت، ٣٫٠ للسبليت الجداري، مقابل ٣٫٧ فقط لنظام RUUD إنفرتر. الأرقام محافظة عن قصد — أعطينا الأجهزة الحالية كفاءة كريمة — فالنتيجة الفعلية المفروض تكون أفضل من هيك لا أسوأ.',
          note: 'تقدير للطاقة وليس فاتورة ولا عرض سعر — ومقصود إنه يقلّل من حجم التوفير لا يبالغ فيه. الاستهلاك الفعلي يعتمد على العزل والزجاج والإشغال ودرجات الضبط؛ معاينة الموقع وفواتير سنة كاملة تعطي الرقم الدقيق. للأسعار راسلنا.',
          wa: 'أرسل هذه الأرقام واطلب السعر', waMsg: 'مرحباً ميكاماك، جرّبت حاسبة التكييف على موقعكم وأرغب بمعرفة السعر:' }
  };
  var lang = function () { return document.documentElement.getAttribute('lang') === 'ar' ? 'ar' : 'en'; };
  var t = function (k) { return T[lang()][k]; };
  var fmt = function (n, d) { try { return new Intl.NumberFormat(lang() === 'ar' ? 'ar-EG' : 'en-GB', { maximumFractionDigits: d || 0 }).format(n); } catch (e) { return String(Math.round(n)); } };
  var state = { area: 400, ac: 'split', hours: 14, months: 10 };

  host.innerHTML = '<div class="en-grid"><div class="en-form">' +
    '<label class="en-row"><span id="en-l-area"></span><div class="en-range"><input type="range" id="en-area" min="100" max="2000" step="10"/><output id="en-area-out"></output></div></label>' +
    '<div class="en-row"><span id="en-l-ac"></span><div class="en-chips" id="en-ac"></div></div>' +
    '<label class="en-row"><span id="en-l-hours"></span><div class="en-range"><input type="range" id="en-hours" min="6" max="24" step="1"/><output id="en-hours-out"></output></div></label>' +
    '<label class="en-row"><span id="en-l-months"></span><div class="en-range"><input type="range" id="en-months" min="6" max="12" step="1"/><output id="en-months-out"></output></div></label>' +
    '<details class="en-method"><summary id="en-m-k"></summary><p id="en-m-txt"></p></details>' +
    '</div><div class="en-out" aria-live="polite"><div class="en-cards"><div class="en-card"><p class="en-k" id="en-k-today"></p><b id="en-kwh-today"></b><span id="en-tons"></span></div>' +
    '<div class="en-card en-card--after"><p class="en-k" id="en-k-after"></p><b id="en-kwh-after"></b><span id="en-saved"></span></div></div>' +
    '<div class="en-save"><p class="en-k" id="en-k-save"></p><b id="en-pct"></b><div class="en-meta"><span id="en-co2"></span></div>' +
    '<a class="btn btn-cyan" id="en-wa" target="_blank" rel="noopener"></a></div><p class="en-note" id="en-note"></p></div></div>';
  var $ = function (id) { return host.querySelector('#' + id); };

  function calc() {
    var ex = CFG.existing.filter(function (x) { return x.id === state.ac; })[0];
    var tons = state.area / CFG.m2PerTon;
    var thermal = tons * CFG.kwPerTon * state.hours * (state.months * 30.4) * CFG.loadFactor;   // kWh thermal / year
    var kwhToday = thermal / ex.eer;
    var kwhAfter = thermal / CFG.newEER * (1 - CFG.smartSetback);
    if (kwhAfter > kwhToday) kwhAfter = kwhToday;          // never promise a saving that is not there
    return { tons: tons, kwhToday: kwhToday, kwhAfter: kwhAfter };
  }
  function render() {
    var L = lang();
    $('en-l-area').textContent = t('area'); $('en-l-ac').textContent = t('ac'); $('en-l-hours').textContent = t('hours'); $('en-l-months').textContent = t('months');
    $('en-area').value = state.area; $('en-area-out').textContent = fmt(state.area) + ' m²';
    $('en-hours').value = state.hours; $('en-hours-out').textContent = fmt(state.hours) + ' h';
    $('en-months').value = state.months; $('en-months-out').textContent = fmt(state.months);
    $('en-m-k').textContent = t('method'); $('en-m-txt').textContent = t('methodTxt');
    var ac = $('en-ac'); ac.innerHTML = '';
    CFG.existing.forEach(function (x) { var b = document.createElement('button'); b.type = 'button'; b.className = 'en-chip' + (state.ac === x.id ? ' on' : ''); b.textContent = x[L]; b.setAttribute('aria-pressed', state.ac === x.id); b.addEventListener('click', function () { state.ac = x.id; render(); }); ac.appendChild(b); });
    var r = calc(), saved = r.kwhToday - r.kwhAfter, pct = r.kwhToday ? saved / r.kwhToday : 0;
    // round the claim DOWN, so the number shown is never more than the model says
    var pctShown = Math.floor(pct * 100), savedShown = Math.floor(saved / 100) * 100;
    $('en-k-today').textContent = t('today'); $('en-k-after').textContent = t('after'); $('en-k-save').textContent = t('save');
    $('en-kwh-today').textContent = fmt(Math.round(r.kwhToday / 100) * 100) + ' ' + t('kwh');
    $('en-kwh-after').textContent = fmt(Math.round(r.kwhAfter / 100) * 100) + ' ' + t('kwh');
    $('en-tons').textContent = fmt(r.tons, 1) + ' ' + t('tons');
    $('en-saved').textContent = '− ' + fmt(savedShown) + ' ' + t('saved');
    $('en-pct').textContent = fmt(pctShown) + '% ' + t('less');
    $('en-co2').textContent = fmt(Math.floor(saved * CFG.co2PerKwh / 10) * 10) + ' ' + t('co2');
    $('en-note').textContent = t('note');
    var ex = CFG.existing.filter(function (x) { return x.id === state.ac; })[0];
    var lines = [t('waMsg'), '', (L === 'ar' ? 'المساحة: ' : 'Area: ') + state.area + ' m²', (L === 'ar' ? 'التكييف الحالي: ' : 'Cooling today: ') + ex[L],
      (L === 'ar' ? 'التشغيل: ' : 'Run: ') + state.hours + ' h × ' + state.months + (L === 'ar' ? ' أشهر' : ' months'),
      (L === 'ar' ? 'الطاقة اليوم: ' : 'Energy today: ') + Math.round(r.kwhToday) + ' kWh/yr',
      (L === 'ar' ? 'مع RUUD إنفرتر + تحكم ذكي: ' : 'With RUUD inverter + smart control: ') + Math.round(r.kwhAfter) + ' kWh/yr',
      (L === 'ar' ? 'توفير تقديري (محافظ): ' : 'Estimated saving (conservative): ') + pctShown + '%'];
    var wa = $('en-wa'); wa.textContent = t('wa'); wa.href = 'https://wa.me/96872160022?text=' + encodeURIComponent(lines.join('\n'));
  }
  $('en-area').addEventListener('input', function () { state.area = +this.value; render(); });
  $('en-hours').addEventListener('input', function () { state.hours = +this.value; render(); });
  $('en-months').addEventListener('input', function () { state.months = +this.value; render(); });
  render();
  document.addEventListener('langchange', render);
})();
