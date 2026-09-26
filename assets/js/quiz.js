/* ============================================================
   Mecamac — "Is your home ready?" readiness quiz (Smart Buildings page)
   Six questions → wired (ABB KNX) or wireless (LifeSmart)
   recommendation with the reasons, then simulator + visit + WhatsApp.
   Scores live in Q[].o[].s = [wired, wireless].
   ============================================================ */
(function () {
  'use strict';
  var host = document.getElementById('ready-quiz'); if (!host) return;
  var lang = function () { return document.documentElement.getAttribute('lang') === 'ar' ? 'ar' : 'en'; };

  var Q = [
    { q: { en: 'Where is your home today?', ar: 'وين بيتك اليوم؟' }, o: [
      { en: 'New build — walls still open', ar: 'بناء جديد — الجدران لسا مفتوحة', s: [3, 0], r: { en: 'walls are open, so a wired bus costs little to run', ar: 'الجدران مفتوحة، فتمديد الناقل السلكي كلفته بسيطة' } },
      { en: 'Under finishing', ar: 'في مرحلة التشطيب', s: [1, 0], r: { en: 'at finishing stage we run the bus where containment already exists and go wireless in the rooms that have none', ar: 'بمرحلة التشطيب بنمدّد الناقل حيث في تمديدات جاهزة وبنستخدم اللاسلكي بالغرف اللي ما فيها' } },
      { en: 'Finished and lived in', ar: 'جاهز ومسكون', s: [0, 3], r: { en: 'a finished home should not be chased for cables', ar: 'البيت الجاهز ما ينفع نكسّر فيه لتمديد كابلات' } },
      { en: 'Renovation planned', ar: 'مخطط للتجديد', s: [1, 1], r: { en: 'a renovation lets us mix a wired backbone with wireless rooms', ar: 'التجديد يسمح بدمج عمود سلكي مع غرف لاسلكية' } } ] },
    { q: { en: 'How big is it?', ar: 'قديش حجمه؟' }, o: [
      { en: 'Apartment', ar: 'شقة', s: [0, 2], r: { en: 'apartments rarely justify a full bus system', ar: 'الشقق نادراً ما تبرّر نظام ناقل كامل' } },
      { en: 'Villa up to 400 m²', ar: 'فيلا حتى 400 م²', s: [1, 1], r: null },
      { en: 'Villa 400–800 m²', ar: 'فيلا 400–800 م²', s: [2, 0], r: { en: 'at this size device count favours a wired backbone', ar: 'بهذا الحجم عدد الأجهزة يرجّح عموداً سلكياً' } },
      { en: 'Palace or estate, 800 m²+', ar: 'قصر أو مجمع، أكثر من 800 م²', s: [3, 0], r: { en: 'palace-scale estates need the reliability and reach of KNX', ar: 'القصور والمجمعات تحتاج موثوقية KNX ومداه' } } ] },
    { q: { en: 'What matters most to you?', ar: 'شو الأهم بالنسبة لك؟' }, o: [
      { en: 'Reliability for decades', ar: 'موثوقية لعقود', s: [3, 0], r: { en: 'you asked for decades of reliability — that is what a wired bus is for', ar: 'طلبت موثوقية لعقود — وهذا ما صُمم له الناقل السلكي' } },
      { en: 'Installed fast, no disruption', ar: 'تركيب سريع بدون إزعاج', s: [0, 3], r: { en: 'wireless installs in days without disruption', ar: 'اللاسلكي يتركّب بأيام بدون إزعاج' } },
      { en: 'Lowest cost', ar: 'أقل تكلفة', s: [0, 2], r: { en: 'wireless gives the lowest cost per room', ar: 'اللاسلكي يعطي أقل كلفة لكل غرفة' } },
      { en: 'App, scenes and voice', ar: 'التطبيق والمشاهد والصوت', s: [1, 1], r: null } ] },
    { q: { en: 'What do you want to control?', ar: 'شو تبي تتحكم فيه؟' }, o: [
      { en: 'Lighting only', ar: 'الإنارة فقط', s: [0, 2], r: null },
      { en: 'Lighting, blinds and AC', ar: 'الإنارة والستائر والتكييف', s: [1, 1], r: null },
      { en: 'Whole home — plus access, cameras, audio', ar: 'البيت كله — مع الدخول والكاميرات والصوت', s: [2, 0], r: { en: 'a whole-home scope integrates best on one bus with a proper head-end', ar: 'نطاق البيت الكامل يتكامل أفضل على ناقل واحد مع وحدة تحكم مركزية' } },
      { en: 'Several properties — hotel or portfolio', ar: 'عدة عقارات — فندق أو محفظة', s: [1, 0], r: { en: 'managing several properties needs one wired standard across them all', ar: 'إدارة عدة عقارات تحتاج معياراً سلكياً واحداً عبرها كلها' } } ] },
    { q: { en: 'If the internet drops?', ar: 'لو انقطع الإنترنت؟' }, o: [
      { en: 'Everything must keep working locally', ar: 'كل شي لازم يضل يشتغل محلياً', s: [2, 0], r: { en: 'you want local logic, which KNX runs on the controller itself', ar: 'تريد منطقاً محلياً، وهذا ما يشغّله KNX على وحدة التحكم نفسها' } },
      { en: 'Cloud is fine for me', ar: 'السحابة تناسبني', s: [0, 2], r: null } ] },
    { q: { en: 'When do you want it done?', ar: 'متى تبيه جاهز؟' }, o: [
      { en: 'As soon as possible', ar: 'بأسرع وقت', s: [0, 3], r: { en: 'speed points to wireless', ar: 'السرعة ترجّح اللاسلكي' } },
      { en: 'Within one to three months', ar: 'خلال شهر إلى ثلاثة', s: [1, 1], r: null },
      { en: 'Still at design stage', ar: 'لسا بمرحلة التصميم', s: [3, 0], r: { en: 'design stage is the moment to plan a wired backbone', ar: 'مرحلة التصميم هي الوقت المناسب لتخطيط عمود سلكي' } } ] }
  ];
  var R = {
    wired: { brand: 'abb', en: { name: 'Wired — ABB i-bus® KNX', sub: 'The backbone for new builds, palaces and anything that must still work in year twenty.' }, ar: { name: 'سلكي — ABB i-bus® KNX', sub: 'العمود الفقري للمباني الجديدة والقصور وكل ما يجب أن يعمل في السنة العشرين.' } },
    wireless: { brand: 'lifesmart', en: { name: 'Wireless — LifeSmart CoSS', sub: 'Installed in days in a finished home, no chasing, full app and scene control.' }, ar: { name: 'لاسلكي — LifeSmart CoSS', sub: 'يتركّب بأيام في بيت جاهز، بدون تكسير، وتحكم كامل بالتطبيق والمشاهد.' } }
  };
  var T = {
    en: { of: 'of', back: 'Back', again: 'Start again', res: 'Our recommendation', why: 'Why', sim: 'Build it in the 3D simulator', visit: 'Book a showroom visit', wa: 'Send my answers to an engineer', close: 'Close call — both work; an engineer will weigh the site details.', waMsg: 'Hello Mecamac, I took the readiness quiz on your website:' },
    ar: { of: 'من', back: 'رجوع', again: 'ابدأ من جديد', res: 'توصيتنا', why: 'ليش', sim: 'ابنِه في المحاكي 3D', visit: 'احجز زيارة للشوروم', wa: 'أرسل إجاباتي لمهندس', close: 'النتيجة متقاربة — الاثنان يناسبان؛ المهندس يحسمها بتفاصيل الموقع.', waMsg: 'مرحباً ميكاماك، جرّبت اختبار الجاهزية على موقعكم:' }
  };
  var base = (function () { var s = document.querySelector('script[src*="quiz.js"]'); return s ? s.getAttribute('src').replace(/assets\/js\/quiz\.js$/, '') : ''; })();
  var state = { i: 0, a: [] };

  function render() {
    var L = lang(), t = T[L];
    if (state.i < Q.length) {
      var q = Q[state.i];
      host.innerHTML = '<div class="rq-card"><div class="rq-top"><span class="rq-n">' + (state.i + 1) + ' ' + t.of + ' ' + Q.length + '</span><div class="rq-bar"><i style="width:' + ((state.i) / Q.length * 100) + '%"></i></div></div>' +
        '<h3 class="rq-q">' + q.q[L] + '</h3><div class="rq-opts">' + q.o.map(function (o, k) { return '<button type="button" class="rq-opt" data-k="' + k + '">' + o[L] + '</button>'; }).join('') + '</div>' +
        (state.i ? '<button type="button" class="rq-back">← ' + t.back + '</button>' : '') + '</div>';
      host.querySelectorAll('.rq-opt').forEach(function (b) { b.addEventListener('click', function () { state.a[state.i] = +b.dataset.k; state.i++; render(); host.scrollIntoView({ block: 'nearest', behavior: 'smooth' }); }); });
      var back = host.querySelector('.rq-back'); if (back) back.addEventListener('click', function () { state.i--; render(); });
      return;
    }
    // result
    var sc = [0, 0], reasons = [];
    Q.forEach(function (q, i) { var o = q.o[state.a[i]]; sc[0] += o.s[0]; sc[1] += o.s[1]; if (o.r) reasons.push({ w: o.s, txt: o.r[L] }); });
    var keys = ['wired', 'wireless'], top = sc.indexOf(Math.max.apply(null, sc)), sorted = sc.slice().sort(function (a, b) { return b - a; }), close = sorted[0] - sorted[1] <= 1;
    var k = keys[top], rec = R[k];
    var why = reasons.filter(function (r) { return r.w[top] >= 2; }).slice(0, 3).map(function (r) { return r.txt; });
    var answers = Q.map(function (q, i) { return q.q[L] + ' — ' + q.o[state.a[i]][L]; });
    var wa = 'https://wa.me/96872160022?text=' + encodeURIComponent([t.waMsg, ''].concat(answers).concat(['', (L === 'ar' ? 'التوصية: ' : 'Recommendation: ') + rec[L].name]).join('\n'));
    host.innerHTML = '<div class="rq-card rq-res"><p class="eyebrow">' + t.res + '</p><h3>' + rec[L].name + '</h3><p class="rq-sub">' + rec[L].sub + '</p>' +
      (close ? '<p class="rq-close">' + t.close + '</p>' : '') +
      (why.length ? '<p class="rq-whyk">' + t.why + '</p><ul class="rq-why">' + why.map(function (w) { return '<li>' + w + '</li>'; }).join('') + '</ul>' : '') +
      '<div class="rq-score" aria-hidden="true">' + keys.map(function (kk, i) { return '<span class="' + (i === top ? 'on' : '') + '"><b>' + R[kk][L].name.split(' — ')[0] + '</b><i style="width:' + Math.round(Math.min(100, sc[i] / 14 * 100)) + '%"></i></span>'; }).join('') + '</div>' +
      '<div class="rq-actions"><a class="btn btn-cyan" href="' + base + 'smart-villa/index.html?brand=' + rec.brand + '">' + t.sim + '</a><a class="btn btn-ghost" href="' + base + 'contact/index.html#visit">' + t.visit + '</a><a class="btn btn-ghost" href="' + wa + '" target="_blank" rel="noopener">' + t.wa + '</a></div>' +
      '<button type="button" class="rq-back">' + t.again + '</button></div>';
    host.querySelector('.rq-back').addEventListener('click', function () { state = { i: 0, a: [] }; render(); });
  }
  render();
  document.addEventListener('langchange', render);
})();
