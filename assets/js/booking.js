/* ============================================================
   Mecamac — book a showroom visit (Smart Experience Centre, Qurum)
   Day strip → time slot → who / what → WhatsApp confirmation + .ics file.
   No server: the request is a WhatsApp message and the calendar file is
   generated in the browser. Oman is UTC+4 all year, so the .ics uses UTC.
   ============================================================ */
(function () {
  'use strict';
  var host = document.getElementById('visit-booking'); if (!host) return;

  var CFG = {
    wa: '96872160022',
    slotMinutes: 45,
    // opening hours by weekday (0 = Sunday … 6 = Saturday); [firstStart, lastStart] in 24h decimal
    hours: { 0: [9, 17], 1: [9, 17], 2: [9, 17], 3: [9, 17], 4: [9, 17], 5: null, 6: [9.5, 13] },
    days: 14,                       // how many days ahead to offer
    place: { en: 'Mecamac Smart Experience Centre — Bank Muscat Building, Qurum Commercial District, Muscat', ar: 'مركز ميكاماك للتجربة الذكية — مبنى بنك مسقط، منطقة القرم التجارية، مسقط' },
    maps: 'https://www.google.com/maps?q=Bank+Muscat+Building,+Qurum+Commercial+District,+Muscat,+Oman'
  };
  var T = {
    en: { pickDay: '1 · Pick a day', pickTime: '2 · Pick a time', who: '3 · Who is visiting', what: '4 · What would you like to see', name: 'Your name (optional)',
          who_opts: [['owner', 'Homeowner'], ['consultant', 'Consultant'], ['contractor', 'Main contractor'], ['developer', 'Developer / operator']],
          what_opts: [['smart', 'Smart home & panels'], ['hvac', 'RUUD air conditioning'], ['both', 'Both'], ['dc', 'Data centre systems']],
          closed: 'Closed on Fridays', summary: 'Your visit', confirm: 'Confirm on WhatsApp', ics: 'Add to calendar', none: 'Choose a day and a time to see the summary.',
          note: 'Requests are confirmed by a person on WhatsApp within working hours — nothing is booked automatically. Visits last about 45 minutes; no charge.',
          today: 'Today', tomorrow: 'Tomorrow', at: 'at', waHi: 'Hello Mecamac, I would like to visit the Smart Experience Centre in Qurum.', waWhen: 'Preferred time', waWho: 'Visitor', waWhat: 'Interested in', waName: 'Name', minutes: 'min' },
    ar: { pickDay: '١ · اختر اليوم', pickTime: '٢ · اختر الوقت', who: '٣ · مين الزائر', what: '٤ · شو تحب تشوف', name: 'اسمك (اختياري)',
          who_opts: [['owner', 'صاحب منزل'], ['consultant', 'استشاري'], ['contractor', 'مقاول رئيسي'], ['developer', 'مطوّر / مشغّل']],
          what_opts: [['smart', 'المنزل الذكي واللوحات'], ['hvac', 'تكييف RUUD'], ['both', 'الاثنين'], ['dc', 'أنظمة مراكز البيانات']],
          closed: 'مغلق يوم الجمعة', summary: 'زيارتك', confirm: 'أكّد على واتساب', ics: 'أضف إلى التقويم', none: 'اختر يوماً ووقتاً ليظهر الملخص.',
          note: 'الطلبات يؤكدها شخص على واتساب خلال ساعات العمل — لا يوجد حجز تلقائي. الزيارة حوالي ٤٥ دقيقة، وبدون رسوم.',
          today: 'اليوم', tomorrow: 'غداً', at: 'الساعة', waHi: 'مرحباً ميكاماك، أرغب بزيارة مركز التجربة الذكية في القرم.', waWhen: 'الوقت المفضل', waWho: 'الزائر', waWhat: 'مهتم بـ', waName: 'الاسم', minutes: 'دقيقة' }
  };
  var lang = function () { return document.documentElement.getAttribute('lang') === 'ar' ? 'ar' : 'en'; };
  var t = function (k) { return T[lang()][k]; };
  var state = { day: null, slot: null, who: 'owner', what: 'smart', name: '' };

  host.innerHTML = '<div class="bk-grid"><div class="bk-form">' +
    '<p class="bk-step" id="bk-l-day"></p><div class="bk-days" role="listbox"></div>' +
    '<p class="bk-step" id="bk-l-time"></p><div class="bk-slots" role="listbox"></div>' +
    '<p class="bk-step" id="bk-l-who"></p><div class="bk-chips" data-k="who"></div>' +
    '<p class="bk-step" id="bk-l-what"></p><div class="bk-chips" data-k="what"></div>' +
    '<label class="bk-name"><span id="bk-l-name"></span><input type="text" id="bk-name" maxlength="60" autocomplete="name"/></label>' +
    '</div><aside class="bk-sum"><p class="eyebrow" id="bk-l-sum"></p><div class="bk-card" id="bk-card"></div><p class="bk-note" id="bk-note"></p></aside></div>';
  var daysEl = host.querySelector('.bk-days'), slotsEl = host.querySelector('.bk-slots'), card = host.querySelector('#bk-card'), nameIn = host.querySelector('#bk-name');

  // All times are Muscat wall-clock (UTC+4, no DST) whatever the visitor's own time zone:
  // a "Muscat date" is a Date whose UTC fields hold the Muscat local time.
  var OFF = 4 * 3600000;
  function nowM() { return new Date(Date.now() + OFF); }
  function mdate(y, m, d, h, min) { return new Date(Date.UTC(y, m, d, h || 0, min || 0)); }
  function fmtDate(d, opts) { opts.timeZone = 'UTC'; try { return new Intl.DateTimeFormat(lang() === 'ar' ? 'ar-OM' : 'en-GB', opts).format(d); } catch (e) { return d.toUTCString(); } }
  function fmtTime(h) { return fmtDate(mdate(2000, 0, 1, Math.floor(h), Math.round((h % 1) * 60)), { hour: 'numeric', minute: '2-digit' }); }
  function pad(n) { return (n < 10 ? '0' : '') + n; }
  function dayList() {
    var out = [], n = nowM();
    for (var i = 0; i < CFG.days; i++) out.push(mdate(n.getUTCFullYear(), n.getUTCMonth(), n.getUTCDate() + i));
    return out;
  }
  function slotsFor(d) {
    var h = CFG.hours[d.getUTCDay()]; if (!h) return [];
    var out = [], step = CFG.slotMinutes / 60, n = nowM();
    for (var x = h[0]; x <= h[1] + 1e-9; x += step) {
      var s = mdate(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate(), Math.floor(x), Math.round((x % 1) * 60));
      if (s.getTime() > n.getTime() + 60 * 60 * 1000) out.push(x);   // at least an hour from now (Muscat time)
    }
    return out;
  }
  function render() {
    var L = lang();
    host.querySelector('#bk-l-day').textContent = t('pickDay'); host.querySelector('#bk-l-time').textContent = t('pickTime');
    host.querySelector('#bk-l-who').textContent = t('who'); host.querySelector('#bk-l-what').textContent = t('what');
    host.querySelector('#bk-l-name').textContent = t('name'); host.querySelector('#bk-l-sum').textContent = t('summary'); host.querySelector('#bk-note').textContent = t('note');
    // days
    daysEl.innerHTML = '';
    dayList().forEach(function (d, i) {
      var closed = !CFG.hours[d.getUTCDay()] || (i === 0 && !slotsFor(d).length);
      var b = document.createElement('button'); b.type = 'button'; b.className = 'bk-day' + (closed ? ' off' : '') + (state.day && +state.day === +d ? ' on' : ''); b.disabled = closed;
      b.setAttribute('role', 'option'); b.setAttribute('aria-selected', !!(state.day && +state.day === +d));
      var top = i === 0 ? t('today') : i === 1 ? t('tomorrow') : fmtDate(d, { weekday: 'short' });
      b.innerHTML = '<span>' + top + '</span><b>' + fmtDate(d, { day: 'numeric' }) + '</b><small>' + fmtDate(d, { month: 'short' }) + '</small>';
      if (closed && d.getUTCDay() === 5) b.title = t('closed');
      b.addEventListener('click', function () { state.day = d; state.slot = null; render(); });
      daysEl.appendChild(b);
    });
    // slots
    slotsEl.innerHTML = '';
    if (state.day) {
      var sl = slotsFor(state.day);
      if (!sl.length) { var p = document.createElement('p'); p.className = 'bk-empty'; p.textContent = t('closed'); slotsEl.appendChild(p); }
      sl.forEach(function (x) {
        var b = document.createElement('button'); b.type = 'button'; b.className = 'bk-slot' + (state.slot === x ? ' on' : ''); b.textContent = fmtTime(x);
        b.setAttribute('role', 'option'); b.setAttribute('aria-selected', state.slot === x);
        b.addEventListener('click', function () { state.slot = x; render(); }); slotsEl.appendChild(b);
      });
    }
    // chips
    host.querySelectorAll('.bk-chips').forEach(function (box) {
      var k = box.dataset.k; box.innerHTML = '';
      T[L][k + '_opts'].forEach(function (o) {
        var b = document.createElement('button'); b.type = 'button'; b.className = 'bk-chip' + (state[k] === o[0] ? ' on' : ''); b.textContent = o[1];
        b.setAttribute('aria-pressed', state[k] === o[0]);
        b.addEventListener('click', function () { state[k] = o[0]; render(); }); box.appendChild(b);
      });
    });
    // summary
    if (state.day && state.slot !== null) {
      var d = state.day, start = mdate(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate(), Math.floor(state.slot), Math.round((state.slot % 1) * 60));
      var end = new Date(start.getTime() + CFG.slotMinutes * 60000);
      var whoTxt = T[L].who_opts.filter(function (o) { return o[0] === state.who; })[0][1], whatTxt = T[L].what_opts.filter(function (o) { return o[0] === state.what; })[0][1];
      var whenTxt = fmtDate(start, { weekday: 'long', day: 'numeric', month: 'long' }) + ' · ' + fmtTime(state.slot) + '–' + fmtTime(state.slot + CFG.slotMinutes / 60);
      var lines = [t('waHi'), '', t('waWhen') + ': ' + whenTxt, t('waWho') + ': ' + whoTxt, t('waWhat') + ': ' + whatTxt];
      if (state.name) lines.push(t('waName') + ': ' + state.name);
      var wa = 'https://wa.me/' + CFG.wa + '?text=' + encodeURIComponent(lines.join('\n'));
      var ics = makeIcs(start, end, L, whatTxt);
      card.innerHTML = '<div class="bk-when"><b>' + whenTxt + '</b><span>' + CFG.place[L] + '</span></div>' +
        '<div class="bk-meta"><span>' + whoTxt + '</span><span>' + whatTxt + '</span><span>' + CFG.slotMinutes + ' ' + t('minutes') + '</span></div>' +
        '<div class="bk-actions"><a class="btn btn-cyan" href="' + wa + '" target="_blank" rel="noopener">' + t('confirm') + '</a>' +
        '<a class="btn btn-ghost bk-ics" download="mecamac-showroom-visit.ics" href="' + ics + '">' + t('ics') + '</a></div>';
    } else card.innerHTML = '<p class="bk-empty">' + t('none') + '</p>';
  }
  function utc(d, isMuscat) { var x = isMuscat ? new Date(d.getTime() - OFF) : d; return x.getUTCFullYear() + pad(x.getUTCMonth() + 1) + pad(x.getUTCDate()) + 'T' + pad(x.getUTCHours()) + pad(x.getUTCMinutes()) + '00Z'; }
  function makeIcs(start, end, L, whatTxt) {
    var body = ['BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//Mecamac//Showroom visit//EN', 'CALSCALE:GREGORIAN', 'METHOD:PUBLISH', 'BEGIN:VEVENT',
      'UID:' + start.getTime() + '@mecamac.com', 'DTSTAMP:' + utc(new Date()), 'DTSTART:' + utc(start, true), 'DTEND:' + utc(end, true),
      'SUMMARY:' + (L === 'ar' ? 'زيارة مركز ميكاماك للتجربة الذكية' : 'Mecamac Smart Experience Centre — visit'),
      'LOCATION:' + CFG.place[L].replace(/,/g, '\\,'),
      'DESCRIPTION:' + (L === 'ar' ? 'مهتم بـ: ' : 'Interested in: ') + whatTxt + '\\n' + CFG.maps + '\\n+968 7216 0022',
      'URL:' + CFG.maps, 'BEGIN:VALARM', 'TRIGGER:-PT2H', 'ACTION:DISPLAY', 'DESCRIPTION:Mecamac visit', 'END:VALARM', 'END:VEVENT', 'END:VCALENDAR'].join('\r\n');
    return 'data:text/calendar;charset=utf-8,' + encodeURIComponent(body);
  }
  nameIn.addEventListener('input', function () { state.name = nameIn.value.trim(); render(); });
  render();
  document.addEventListener('langchange', render);
})();
