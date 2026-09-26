/* ============================================================
   Mecamac — Smart Villa Simulator
   A procedural villa in three.js where every control visibly acts:
   doors swing open, the garage door and the gate travel, blinds run down
   the glass, the AC louvre opens and blows cold air, and smoke, gas,
   leak, motion and CCTV devices report their state in the model.
   No models, no textures, no server — everything is generated here.
   ============================================================ */
(function () {
  'use strict';
  if (!window.THREE) return;
  var T3 = window.THREE;

  /* ---------- copy in both languages (static labels use data-i18n) ---------- */
  var TXT = {
    en: {
      rooms: { majlis: 'Majlis', living: 'Living room', kitchen: 'Kitchen', entrance: 'Entrance hall',
               master: 'Master bedroom', bed2: 'Bedroom 2', family: 'Family lounge', study: 'Study' },
      floor: { 0: 'Ground floor', 1: 'First floor' },
      dev: { controller: 'Automation controller / gateway', panel: '10" wall control panel', keypad: 'Room keypad (ABB Yurika)',
             dimmer: 'Lighting dimmer channel', blind: 'Blind / curtain actuator', thermostat: 'Room thermostat (AC control)',
             lock: 'Smart door lock', gate: 'Gate & garage door operator', sensor: 'Presence & climate sensor',
             smoke: 'Smoke detector', gas: 'Gas (LPG) detector', leak: 'Water-leak detector', siren: 'Alarm panel & siren',
             contact: 'Door / window contact', camera: 'Camera', intercom: 'Video door station',
             audio: 'Audio zone', irrigation: 'Irrigation controller' },
      brands: { abb: 'ABB i-bus® KNX · wired', lifesmart: 'LifeSmart · wireless' },
      locked: 'Locked', unlocked: 'Unlocked', open: 'Open', closed: 'Closed',
      armed: 'Armed', disarmed: 'Disarmed', on: 'On', off: 'Off', normal: 'All normal', clear: 'Clear alarm', test: 'Test alarm',
      garage: 'Garage door', gate: 'Gate', security: 'Intruder alarm', irrigation: 'Irrigation', cameras: 'Cameras', safety: 'Life safety',
      lightsOn: 'lights', blindsAt: 'blinds', already: 'already', noBlinds: 'no blinds in this room', scene: 'scene',
      smoke: 'Smoke', gas: 'Gas', leak: 'Water leak', motion: 'Motion',
      smokeAlarm: 'Smoke detected', gasAlarm: 'Gas detected', leakAlarm: 'Water leak', motionAlarm: 'Motion while armed',
      askNote: 'An indicative device list, not a quotation — no prices here. Send it and an engineer comes back with the figure.',
      wa: 'Send my list on WhatsApp', tip: 'Tap a room to control it',
      waMsg: 'Hello Mecamac, I built a smart-villa plan on your website and I would like a price for it:',
      sqm: 'm²', roomsLabel: 'rooms', units: '×', pages: ['Comfort', 'Access', 'Safety']
    },
    ar: {
      rooms: { majlis: 'المجلس', living: 'غرفة المعيشة', kitchen: 'المطبخ', entrance: 'المدخل',
               master: 'غرفة النوم الرئيسية', bed2: 'غرفة نوم ٢', family: 'صالة العائلة', study: 'المكتب' },
      floor: { 0: 'الطابق الأرضي', 1: 'الطابق الأول' },
      dev: { controller: 'وحدة تحكم / بوابة الأتمتة', panel: 'لوحة تحكم حائطية ١٠ بوصة', keypad: 'مفتاح غرفة (ABB Yurika)',
             dimmer: 'قناة تعتيم إنارة', blind: 'مشغّل ستائر', thermostat: 'ثيرموستات غرفة (تحكم بالتكييف)',
             lock: 'قفل باب ذكي', gate: 'مشغّل بوابة وباب كراج', sensor: 'مستشعر حضور ومناخ',
             smoke: 'حساس دخان', gas: 'حساس غاز', leak: 'حساس تسرب ماء', siren: 'لوحة إنذار وصفارة',
             contact: 'حساس فتح باب/شباك', camera: 'كاميرا', intercom: 'إنتركم فيديو',
             audio: 'منطقة صوت', irrigation: 'وحدة تحكم ري' },
      brands: { abb: 'ABB i-bus® KNX · سلكي', lifesmart: 'LifeSmart · لاسلكي' },
      locked: 'مقفل', unlocked: 'مفتوح', open: 'مفتوح', closed: 'مغلق',
      armed: 'مفعّل', disarmed: 'متوقف', on: 'يعمل', off: 'متوقف', normal: 'كل شي طبيعي', clear: 'إلغاء الإنذار', test: 'تجربة إنذار',
      garage: 'باب الكراج', gate: 'البوابة', security: 'إنذار السرقة', irrigation: 'الري', cameras: 'الكاميرات', safety: 'أمان الأرواح',
      lightsOn: 'الإنارة', blindsAt: 'الستائر', already: 'أصلاً', noBlinds: 'ما في ستائر بهالغرفة', scene: 'مشهد',
      smoke: 'دخان', gas: 'غاز', leak: 'تسرب ماء', motion: 'حركة',
      smokeAlarm: 'دخان', gasAlarm: 'تسرب غاز', leakAlarm: 'تسرب ماء', motionAlarm: 'حركة والنظام مفعّل',
      askNote: 'قائمة أجهزة استرشادية وليست عرض سعر — ما في أسعار هنا. أرسلها ويرجعلك المهندس بالرقم.',
      wa: 'أرسل قائمتي على واتساب', tip: 'اضغط على غرفة للتحكم بها',
      waMsg: 'مرحباً ميكاماك، جهّزت خطة فيلا ذكية على موقعكم وأرغب بمعرفة السعر:',
      sqm: 'م²', roomsLabel: 'غرف', units: '×', pages: ['الراحة', 'الدخول', 'الأمان']
    }
  };
  var lang = function () { return document.documentElement.getAttribute('lang') === 'ar' ? 'ar' : 'en'; };
  var t = function (path) {
    var o = TXT[lang()], parts = path.split('.');
    for (var i = 0; i < parts.length && o; i++) o = o[parts[i]];
    return o == null ? path : o;
  };
  var fmtNum = function (n) {
    var s = Math.round(n).toLocaleString('en-US');
    return lang() === 'ar' ? s.replace(/[0-9]/g, function (d) { return '٠١٢٣٤٥٦٧٨٩'[d]; }) : s;
  };

  /* ---------- the villa ---------- */
  // x/z in metres from the villa's front-left corner; w/d = width/depth
  var ROOMS = [
    { id: 'majlis',   floor: 0, x: 0,   z: 0, w: 5.5, d: 5, lights: 3, blinds: true,  ac: true, lock: false, door: false, color: 0xC6A97E, win: 'left',  gas: false, leak: false },
    { id: 'living',   floor: 0, x: 5.5, z: 0, w: 5,   d: 5, lights: 3, blinds: true,  ac: true, lock: false, door: false, color: 0xD2BE98, win: 'back',  gas: false, leak: false },
    { id: 'kitchen',  floor: 0, x: 10.5, z: 0, w: 3.5, d: 5, lights: 2, blinds: true, ac: true, lock: false, door: false, color: 0xDCD6C8, win: 'right', gas: true,  leak: true },
    { id: 'entrance', floor: 0, x: 0,   z: 5, w: 14,  d: 4, lights: 4, blinds: false, ac: true, lock: true,  door: true,  color: 0xE6E0D3, win: 'front', gas: false, leak: false },
    { id: 'master',   floor: 1, x: 0,   z: 0, w: 7,   d: 5, lights: 2, blinds: true,  ac: true, lock: true,  door: true,  color: 0xCBB093, win: 'left',  gas: false, leak: true },
    { id: 'bed2',     floor: 1, x: 7,   z: 0, w: 7,   d: 5, lights: 2, blinds: true,  ac: true, lock: false, door: true,  color: 0xD4BEA5, win: 'right', gas: false, leak: false },
    { id: 'family',   floor: 1, x: 0,   z: 5, w: 8,   d: 4, lights: 3, blinds: true,  ac: true, lock: false, door: false, color: 0xDCD3C3, win: 'front', gas: false, leak: false },
    { id: 'study',    floor: 1, x: 8,   z: 5, w: 6,   d: 4, lights: 2, blinds: true,  ac: true, lock: false, door: true,  color: 0xC6BDAD, win: 'front', gas: false, leak: false }
  ];
  var FLOOR_H = 3.1, WALL_H = 1.05, WALL_T = 0.16, SLAB_T = 0.22;
  var VW = 14, VD = 9;                       // villa footprint

  /* ---------- state ---------- */
  var state = {
    rooms: {}, night: false, floor: 0, selected: 'living', brand: 'abb', page: 0,
    home: { garage: false, gate: false, armed: false, irrigation: false, cameras: true, alarm: null },
    est: { size: 450, floors: 2, features: { lighting: true, blinds: true, ac: true, access: true, safety: true, security: false, cameras: false, audio: false, irrigation: false } }
  };
  ROOMS.forEach(function (r) { state.rooms[r.id] = { light: 0.85, blinds: 1, temp: 22, locked: false }; });
  (function () { var m = /[?&]brand=(abb|lifesmart)/.exec(location.search); if (m) state.brand = m[1]; })();   // the readiness quiz hands over its platform

  var SCENES = {
    welcome: function (r, s) { s.light = 0.9; s.blinds = 1; s.temp = 22; s.locked = false; },
    evening: function (r, s) { s.light = r.floor === 0 ? 0.55 : 0.35; s.blinds = 0.45; s.temp = 23; },
    cinema:  function (r, s) { s.light = r.id === 'living' ? 0.12 : (r.id === 'entrance' ? 0.25 : 0); s.blinds = r.id === 'living' ? 0 : s.blinds; },
    night:   function (r, s) { s.light = (r.id === 'entrance' || r.id === 'family') ? 0.18 : 0; s.blinds = 0; s.temp = 21; s.locked = !!r.lock; },
    away:    function (r, s) { s.light = 0; s.blinds = 0; s.temp = 26; s.locked = !!r.lock; }
  };
  var SCENE_HOME = {   // what the whole house does in each scene
    welcome: { gate: true, garage: false, armed: false },
    evening: { gate: false, garage: false, armed: false },
    cinema:  { gate: false, garage: false, armed: false },
    night:   { gate: false, garage: false, armed: true },
    away:    { gate: false, garage: false, armed: true, irrigation: false }
  };

  /* ---------- three.js setup ---------- */
  var host = document.getElementById('villa-3d');
  if (!host) return;
  var canvas = document.createElement('canvas');
  host.appendChild(canvas);
  var renderer = null, noGL = false;
  try { renderer = new T3.WebGLRenderer({ canvas: canvas, antialias: true, alpha: false, powerPreference: 'high-performance', preserveDrawingBuffer: true }); }
  catch (e) { noGL = true; }
  if (noGL) {
    host.removeChild(canvas); host.classList.add('no-gl');
    var img = document.createElement('img'); img.src = '../assets/img/villa-sim.webp'; img.alt = ''; img.className = 'sv-fallback';
    var note = document.createElement('p'); note.className = 'sv-nogl';
    note.textContent = lang() === 'ar' ? 'المعاينة ثلاثية الأبعاد تحتاج WebGL وهو معطّل في هذا المتصفح — المخطط ولوحة التحكم يعملان بشكل طبيعي.' : 'The 3D view needs WebGL, which this browser has switched off — the planner and the control panel still work.';
    host.appendChild(img); host.appendChild(note);
    renderer = { setPixelRatio: function () {}, setSize: function () {}, render: function () {}, shadowMap: {}, domElement: canvas, toneMappingExposure: 1 };
  }
  var isSmall = window.matchMedia('(max-width: 820px)').matches;
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, isSmall ? 1.5 : 2));
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = T3.PCFSoftShadowMap;
  renderer.toneMapping = T3.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.05;
  renderer.outputColorSpace = T3.SRGBColorSpace;

  var scene = new T3.Scene();
  var camera = new T3.PerspectiveCamera(38, 1, 0.1, 200);
  var target = new T3.Vector3(VW / 2, 1.2, VD / 2 + 2.2);

  var SKY = { day: new T3.Color(0xCFE7F5), night: new T3.Color(0x03101C) };
  var GROUND = { day: new T3.Color(0xD9C9A4), night: new T3.Color(0x1B2431) };
  var FOG = { day: new T3.Color(0xCFE7F5), night: new T3.Color(0x03101C) };
  scene.background = SKY.day.clone();
  scene.fog = new T3.Fog(FOG.day.clone(), 42, 105);

  var hemi = new T3.HemisphereLight(0xEAF4FF, 0x8A7A5E, 0.85);
  scene.add(hemi);
  var sun = new T3.DirectionalLight(0xFFF3DF, 2.2);
  sun.position.set(18, 26, 12);
  sun.castShadow = true;
  sun.shadow.mapSize.set(isSmall ? 1024 : 2048, isSmall ? 1024 : 2048);
  sun.shadow.camera.left = -24; sun.shadow.camera.right = 24;
  sun.shadow.camera.top = 24; sun.shadow.camera.bottom = -24;
  sun.shadow.camera.near = 2; sun.shadow.camera.far = 90;
  sun.shadow.bias = -0.0006;
  scene.add(sun);
  var moon = new T3.DirectionalLight(0x9FC4FF, 0.35);
  moon.position.set(-14, 18, -10);
  scene.add(moon);

  /* ---------- shared materials and small builders ---------- */
  var M = {
    stone: new T3.MeshStandardMaterial({ color: 0xF0E8DA, roughness: 0.9 }),
    stoneDark: new T3.MeshStandardMaterial({ color: 0xD9CEBC, roughness: 0.95 }),
    wood: new T3.MeshStandardMaterial({ color: 0x9A6E45, roughness: 0.7 }),
    woodDark: new T3.MeshStandardMaterial({ color: 0x6B4A2E, roughness: 0.7 }),
    wallTop: new T3.MeshStandardMaterial({ color: 0xFFFFFF, roughness: 0.6 }),
    metal: new T3.MeshStandardMaterial({ color: 0x39434C, roughness: 0.45, metalness: 0.5 }),
    steel: new T3.MeshStandardMaterial({ color: 0xB9C0C7, roughness: 0.35, metalness: 0.7 }),
    white: new T3.MeshStandardMaterial({ color: 0xF7F7F7, roughness: 0.5 }),
    glass: new T3.MeshPhysicalMaterial({ color: 0xBFE3F2, roughness: 0.05, metalness: 0, transparent: true, opacity: 0.35, transmission: 0.6 }),
    green: new T3.MeshStandardMaterial({ color: 0x4C8F4F, roughness: 0.95 }),
    grass: new T3.MeshStandardMaterial({ color: 0x6FA06A, roughness: 1 }),
    water: new T3.MeshPhysicalMaterial({ color: 0x2E9FC4, roughness: 0.12, metalness: 0, transmission: 0.25, emissive: 0x0A4256, emissiveIntensity: 0.3 })
  };
  function box(w, h, d, mat, x, y, z, parent, shadow) {
    var m = new T3.Mesh(new T3.BoxGeometry(w, h, d), mat);
    m.position.set(x, y, z);
    if (shadow !== false) { m.castShadow = true; m.receiveShadow = true; }
    (parent || scene).add(m);
    return m;
  }
  function led(color, size, parent) {
    var m = new T3.Mesh(new T3.SphereGeometry(size || 0.05, 10, 10), new T3.MeshStandardMaterial({ color: color, emissive: color, emissiveIntensity: 1.4, roughness: 0.3 }));
    (parent || scene).add(m); return m;
  }
  function setLed(mesh, hex, intensity) { if (!mesh) return; mesh.material.color.setHex(hex); mesh.material.emissive.setHex(hex); mesh.material.emissiveIntensity = intensity; }
  // a canvas-drawn label that always faces the camera — this is how temperature becomes visible
  function labelSprite(scaleX, scaleY) {
    var cv = document.createElement('canvas'); cv.width = 256; cv.height = 128;
    var tex = new T3.CanvasTexture(cv); if (T3.SRGBColorSpace) tex.colorSpace = T3.SRGBColorSpace;
    var sp = new T3.Sprite(new T3.SpriteMaterial({ map: tex, transparent: true, depthTest: false, depthWrite: false }));
    sp.scale.set(scaleX || 1.2, scaleY || 0.6, 1); sp.renderOrder = 10;
    sp.userData.draw = function (text, bg, fg) {
      var c = cv.getContext('2d'); c.clearRect(0, 0, 256, 128);
      c.fillStyle = bg; c.beginPath();
      if (c.roundRect) { c.roundRect(8, 26, 240, 76, 38); c.fill(); }
      else { c.fillRect(8, 26, 240, 76); }
      c.fillStyle = fg; c.font = '600 52px system-ui, -apple-system, Segoe UI, sans-serif'; c.textAlign = 'center'; c.textBaseline = 'middle';
      c.fillText(text, 128, 66);
      tex.needsUpdate = true;
    };
    return sp;
  }
  // slatted blind fabric so the travel is obvious
  var blindTex = (function () {
    var cv = document.createElement('canvas'); cv.width = 16; cv.height = 64;
    var c = cv.getContext('2d');
    c.fillStyle = '#9C907A'; c.fillRect(0, 0, 16, 64);
    c.fillStyle = 'rgba(60,48,30,.5)';
    for (var y = 0; y < 64; y += 8) c.fillRect(0, y, 16, 1.6);
    var tx = new T3.CanvasTexture(cv); tx.wrapS = tx.wrapT = T3.RepeatWrapping; tx.repeat.set(1, 6);
    if (T3.SRGBColorSpace) tx.colorSpace = T3.SRGBColorSpace;
    return tx;
  })();
  var blindMat = new T3.MeshStandardMaterial({ map: blindTex, color: 0xFFFFFF, roughness: 0.95, side: T3.DoubleSide });

  var imgBase = (function () { var sc = document.querySelector('script[src*="assets/js/villa.js"]'); return (sc ? sc.getAttribute('src').replace(/assets\/js\/villa\.js$/, '') : '../') + 'assets/img/'; })();
  // ABB Yurika catalogue finishes (plate colours sampled from ABB product photography); the plate front carries the real product face
  var FINISH = { white: { c: 0xF2F2F2, m: 0.1, r: 0.5 }, gold: { c: 0xD9CCBF, m: 0.5, r: 0.4 }, silver: { c: 0x5E6066, m: 0.6, r: 0.4 }, black: { c: 0x232323, m: 0.2, r: 0.6 }, steel: { c: 0xD5D6DC, m: 0.9, r: 0.3 }, antique: { c: 0x9A9376, m: 0.8, r: 0.35 }, mocha: { c: 0xA98974, m: 0.7, r: 0.4 } };
  var kpFaceTex = {}, texLoader = new T3.TextureLoader();
  function kpFace(finish) {
    if (!kpFaceTex[finish]) { var tx = texLoader.load(imgBase + 'sim-yurika-' + finish + '.webp'); if (T3.SRGBColorSpace) tx.colorSpace = T3.SRGBColorSpace; kpFaceTex[finish] = new T3.MeshStandardMaterial({ map: tx, roughness: 0.35, metalness: 0.15 }); }
    return kpFaceTex[finish];
  }

  /* ---------- the plot ---------- */
  var PLOT = { x0: -6.6, x1: VW + 6.6, z0: -4.4, z1: VD + 9.4 };
  var plotW = PLOT.x1 - PLOT.x0, plotD = PLOT.z1 - PLOT.z0, plotCx = (PLOT.x0 + PLOT.x1) / 2, plotCz = (PLOT.z0 + PLOT.z1) / 2;
  var groundMat = new T3.MeshStandardMaterial({ color: GROUND.day.clone(), roughness: 1 });
  var ground = new T3.Mesh(new T3.PlaneGeometry(130, 130), groundMat);
  ground.rotation.x = -Math.PI / 2; ground.position.set(VW / 2, -0.01, VD / 2);
  ground.receiveShadow = true; scene.add(ground);
  // paved plot
  var paving = box(plotW, 0.12, plotD, new T3.MeshStandardMaterial({ color: 0xEDE6D8, roughness: 0.92 }), plotCx, 0.06, plotCz, scene, false);
  paving.receiveShadow = true;
  // driveway from the gate to the front door
  for (var dv = 0; dv < 6; dv++) box(4.2, 0.02, 0.95, M.stoneDark, VW / 2, 0.13, VD + 2.6 + dv * 1.15, scene, false);
  for (var dh = 0; dh < 5; dh++) box(0.95, 0.02, 3.4, M.stoneDark, VW / 2 + 2.6 + dh * 1.15, 0.13, VD + 6.6, scene, false);   // spur to the garage
  // lawn
  [[PLOT.x0 + 2.0, VD + 4.4, 3.2, 9.2], [PLOT.x0 + 2.0, 1.0, 3.2, 8.0]].forEach(function (p) {
    var g = box(p[2], 0.06, p[3], M.grass, p[0], 0.12, p[1], scene, false); g.receiveShadow = true;
  });
  // pool, off to the left, with lights in the wall
  var poolX = VW / 2 - 3.0, poolZ = VD + 4.8;
  var poolEdge = box(7.7, 0.18, 3.9, new T3.MeshStandardMaterial({ color: 0xF6F1E6, roughness: 0.8 }), poolX, 0.09, poolZ, scene, false);
  poolEdge.receiveShadow = true;
  box(7, 0.34, 3.2, M.water, poolX, 0.06, poolZ, scene, false);
  var poolLights = [];
  [-2.2, 0, 2.2].forEach(function (o) {
    var l = new T3.PointLight(0x5FD8F5, 0, 6, 2); l.position.set(poolX + o, 0.25, poolZ); scene.add(l); poolLights.push(l);
  });
  // pergola beside the pool, clear of the façade
  (function pergola() {
    var g = new T3.Group(); g.position.set(VW / 2 + 3.6, 0, VD + 5.0); scene.add(g);
    [-2.2, 2.2].forEach(function (x) { [-1.3, 1.3].forEach(function (z) { box(0.18, 2.6, 0.18, M.woodDark, x, 1.3, z, g); }); });
    box(5.0, 0.16, 0.18, M.wood, 0, 2.68, -1.3, g); box(5.0, 0.16, 0.18, M.wood, 0, 2.68, 1.3, g);
    for (var i = 0; i < 9; i++) box(0.1, 0.12, 2.9, M.wood, -2.1 + i * 0.525, 2.8, 0, g);
    box(3.0, 0.4, 1.0, M.woodDark, 0, 0.3, 0, g);        // a bench under it
  })();
  // planters along the façade
  for (var pb = 0; pb < 6; pb++) {
    var px = 1.2 + pb * 2.4;
    if (px > VW / 2 - 2.4 && px < VW / 2 + 2.4) continue;   // keep the path to the door clear
    box(1.1, 0.45, 0.7, M.stoneDark, px, 0.3, VD + 1.1, scene);
    var bush = new T3.Mesh(new T3.SphereGeometry(0.42, 12, 10), M.green); bush.position.set(px, 0.72, VD + 1.1); bush.castShadow = true; bush.scale.y = 0.8; scene.add(bush);
  }
  // palms
  function palm(x, z, h) {
    var g = new T3.Group();
    var trunk = new T3.Mesh(new T3.CylinderGeometry(0.12, 0.2, h, 8), new T3.MeshStandardMaterial({ color: 0x8B6B47, roughness: 1 }));
    trunk.position.y = h / 2; trunk.castShadow = true; g.add(trunk);
    for (var i = 0; i < 7; i++) {
      var leaf = new T3.Mesh(new T3.ConeGeometry(0.28, 2.4, 5), new T3.MeshStandardMaterial({ color: 0x3E8A4C, roughness: 0.9 }));
      leaf.position.y = h; leaf.rotation.z = Math.PI / 2.6; leaf.rotation.y = (i / 7) * Math.PI * 2;
      leaf.geometry.translate(0, -1.0, 0); leaf.castShadow = true; g.add(leaf);
    }
    g.position.set(x, 0, z); scene.add(g);
  }
  palm(PLOT.x0 + 1.6, VD + 7.6, 4.2); palm(PLOT.x0 + 1.4, VD + 1.6, 3.6); palm(PLOT.x0 + 1.8, -1.6, 4.6); palm(VW + 2.2, -2.4, 3.8);

  // boundary wall, with the sliding gate at the front
  var bwMat = new T3.MeshStandardMaterial({ color: 0xEFE8DA, roughness: 0.95 });
  box(plotW, 1.3, 0.3, bwMat, plotCx, 0.65, PLOT.z0, scene);                       // back
  box(0.3, 1.3, plotD, bwMat, PLOT.x0, 0.65, plotCz, scene);                       // left
  box(0.3, 1.3, plotD, bwMat, PLOT.x1, 0.65, plotCz, scene);                       // right
  var gapL = VW / 2 - 3.3, gapR = VW / 2 + 3.3;
  box(gapL - PLOT.x0, 1.3, 0.3, bwMat, (PLOT.x0 + gapL) / 2, 0.65, PLOT.z1, scene);
  box(PLOT.x1 - gapR, 1.3, 0.3, bwMat, (gapR + PLOT.x1) / 2, 0.65, PLOT.z1, scene);
  var pierLamps = [];
  [gapL, gapR].forEach(function (x) {
    box(0.5, 1.9, 0.5, M.stoneDark, x, 0.95, PLOT.z1, scene);
    var lamp = box(0.24, 0.3, 0.24, new T3.MeshStandardMaterial({ color: 0xFFEFC8, emissive: 0xFFC96B, emissiveIntensity: 0 }), x, 2.05, PLOT.z1, scene, false);
    pierLamps.push(lamp);
  });
  var gate = new T3.Group(); gate.position.set(VW / 2, 0, PLOT.z1); scene.add(gate);
  (function () {
    box(6.4, 0.14, 0.14, M.metal, 0, 1.42, 0, gate);
    box(6.4, 0.14, 0.14, M.metal, 0, 0.16, 0, gate);
    for (var i = 0; i < 16; i++) box(0.1, 1.3, 0.1, M.metal, -3.1 + i * 0.41, 0.78, 0, gate);
  })();
  var gateX = { cur: 0, tgt: 0 };

  // garage on the right of the plot; its door faces the driveway and lifts
  var garage = new T3.Group(); garage.position.set(VW + 3.4, 0, VD + 2.6); garage.rotation.y = Math.PI / 2; scene.add(garage);   // opening faces the driveway
  (function () {
    var W = 4.0, D = 6.4, H = 2.9;
    box(W, 0.2, D, M.stoneDark, 0, 0.1, 0, garage, false);
    box(0.25, H, D, M.stone, W / 2, H / 2, 0, garage);                 // back wall (towards the boundary)
    box(W, H, 0.25, M.stone, 0, H / 2, -D / 2, garage);
    box(W, H, 0.25, M.stone, 0, H / 2, D / 2, garage);
    box(W + 0.4, 0.24, D + 0.4, M.stoneDark, 0, H + 0.12, 0, garage);  // roof slab
    var door = new T3.Group(); door.position.set(-W / 2 + 0.1, 0, 0); garage.add(door);
    for (var i = 0; i < 5; i++) box(0.1, 0.5, D - 0.4, new T3.MeshStandardMaterial({ color: 0xE8E4DC, roughness: 0.6, metalness: 0.15 }), 0, 0.3 + i * 0.52, 0, door);
    garage.userData.door = door;
    var car = new T3.Group(); car.position.set(0.5, 0, 0.2); garage.add(car);
    box(1.7, 0.55, 4.1, new T3.MeshStandardMaterial({ color: 0x2A3A4A, roughness: 0.35, metalness: 0.4 }), 0, 0.62, 0, car);
    box(1.5, 0.45, 2.1, new T3.MeshStandardMaterial({ color: 0x17222C, roughness: 0.2, metalness: 0.3 }), 0, 1.08, -0.1, car);
    [[-0.78, 1.4], [0.78, 1.4], [-0.78, -1.4], [0.78, -1.4]].forEach(function (w) {
      var t1 = new T3.Mesh(new T3.CylinderGeometry(0.34, 0.34, 0.22, 14), new T3.MeshStandardMaterial({ color: 0x15181B, roughness: 0.9 }));
      t1.rotation.z = Math.PI / 2; t1.position.set(w[0], 0.34, w[1]); car.add(t1);
    });
  })();
  var garageY = { cur: 0, tgt: 0 };

  // CCTV cameras on poles + a video door station at the entrance
  var cams = [];
  [[PLOT.x0 + 0.8, PLOT.z1 - 0.9, 0.9], [PLOT.x1 - 0.8, PLOT.z1 - 0.9, -0.9], [PLOT.x1 - 0.8, PLOT.z0 + 0.9, -2.4], [PLOT.x0 + 0.8, PLOT.z0 + 0.9, 2.4]].forEach(function (p) {
    var g = new T3.Group(); g.position.set(p[0], 0, p[1]); scene.add(g);
    box(0.12, 3.0, 0.12, M.metal, 0, 1.5, 0, g);
    var head = new T3.Group(); head.position.set(0, 3.0, 0); g.add(head);
    box(0.42, 0.2, 0.2, M.white, 0.12, 0, 0, head);
    var dot = led(0xE64545, 0.035, head); dot.position.set(0.34, 0, 0);
    head.rotation.y = p[2];
    cams.push({ head: head, dot: dot, base: p[2] });
  });
  // irrigation sprinklers in the planted areas
  var sprinklers = [];
  [[PLOT.x0 + 2.0, VD + 2.4], [PLOT.x0 + 2.0, VD + 6.6], [PLOT.x0 + 2.0, 0.5], [PLOT.x0 + 2.0, 3.5], [VW + 2.0, -1.6], [VW / 2 + 3.6, VD + 7.4]].forEach(function (p) {
    var g = new T3.Group(); g.position.set(p[0], 0.15, p[1]); scene.add(g);
    box(0.1, 0.22, 0.1, M.stoneDark, 0, 0.11, 0, g, false);
    var spray = new T3.Mesh(new T3.ConeGeometry(0.9, 1.1, 14, 1, true), new T3.MeshBasicMaterial({ color: 0x9FE3F5, transparent: true, opacity: 0, depthWrite: false, side: T3.DoubleSide }));
    spray.position.y = 0.75; spray.rotation.x = Math.PI; g.add(spray);
    sprinklers.push(spray);
  });

  /* ---------- rooms ---------- */
  var floorGroups = [new T3.Group(), new T3.Group()];
  floorGroups[1].position.y = FLOOR_H;
  scene.add(floorGroups[0]); scene.add(floorGroups[1]);
  var roomObjs = {}, pickables = [], labels = [];

  ROOMS.forEach(function (r) {
    var g = floorGroups[r.floor];
    var cx = r.x + r.w / 2, cz = r.z + r.d / 2;
    var o = { r: r };
    // slab
    o.floorMat = new T3.MeshStandardMaterial({ color: r.color, roughness: 0.85 });
    o.slab = box(r.w - 0.02, SLAB_T, r.d - 0.02, o.floorMat, cx, SLAB_T / 2, cz, g);
    o.slab.userData.room = r.id; pickables.push(o.slab);
    // low walls (dollhouse cut)
    box(r.w, WALL_H, WALL_T, M.stone, cx, SLAB_T + WALL_H / 2, r.z + WALL_T / 2, g);
    box(r.w, WALL_H, WALL_T, M.stone, cx, SLAB_T + WALL_H / 2, r.z + r.d - WALL_T / 2, g);
    box(WALL_T, WALL_H, r.d, M.stone, r.x + WALL_T / 2, SLAB_T + WALL_H / 2, cz, g);
    box(WALL_T, WALL_H, r.d, M.stone, r.x + r.w - WALL_T / 2, SLAB_T + WALL_H / 2, cz, g);
    box(r.w, 0.04, WALL_T + 0.02, M.wallTop, cx, SLAB_T + WALL_H + 0.02, r.z + WALL_T / 2, g, false);
    box(r.w, 0.04, WALL_T + 0.02, M.wallTop, cx, SLAB_T + WALL_H + 0.02, r.z + r.d - WALL_T / 2, g, false);
    box(WALL_T + 0.02, 0.04, r.d, M.wallTop, r.x + WALL_T / 2, SLAB_T + WALL_H + 0.02, cz, g, false);
    box(WALL_T + 0.02, 0.04, r.d, M.wallTop, r.x + r.w - WALL_T / 2, SLAB_T + WALL_H + 0.02, cz, g, false);
    // rug + furniture
    var furnMat = new T3.MeshStandardMaterial({ color: 0x5B6B78, roughness: 0.9 });
    var furn2 = new T3.MeshStandardMaterial({ color: 0x8C7B6B, roughness: 0.9 });
    var rugMat = new T3.MeshStandardMaterial({ color: 0xB9A88C, roughness: 1 });
    if (r.id !== 'entrance') { var rug = box(Math.min(r.w - 1.4, 3.4), 0.02, Math.min(r.d - 1.4, 2.4), rugMat, cx, SLAB_T + 0.011, cz, g, false); rug.receiveShadow = true; }
    if (r.id === 'majlis') { box(r.w - 1.6, 0.42, 0.8, furnMat, cx, SLAB_T + 0.21, r.z + 0.7, g); box(0.8, 0.42, r.d - 1.8, furnMat, r.x + 0.7, SLAB_T + 0.21, cz, g); box(1.0, 0.34, 0.6, furn2, cx, SLAB_T + 0.17, cz + 0.4, g); }
    if (r.id === 'living') { box(2.6, 0.42, 0.9, furnMat, cx, SLAB_T + 0.21, cz + 1.2, g); box(1.2, 0.36, 0.6, furn2, cx, SLAB_T + 0.18, cz - 0.1, g); box(1.9, 0.9, 0.08, new T3.MeshStandardMaterial({ color: 0x0B1620 }), cx, SLAB_T + 0.7, r.z + 0.3, g, false); }
    if (r.id === 'kitchen') { box(r.w - 0.8, 0.9, 0.6, new T3.MeshStandardMaterial({ color: 0xDADADA, roughness: 0.4 }), cx, SLAB_T + 0.45, r.z + 0.5, g); box(1.4, 0.9, 0.9, new T3.MeshStandardMaterial({ color: 0xF2F2F2, roughness: 0.4 }), cx, SLAB_T + 0.45, cz + 0.4, g); }
    if (r.id === 'entrance') { box(1.0, 0.9, 1.0, furn2, r.x + 2.2, SLAB_T + 0.45, cz, g); box(1.0, 0.9, 1.0, furn2, r.x + r.w - 2.2, SLAB_T + 0.45, cz, g); }
    if (r.id === 'master') { box(2.2, 0.5, 2.4, new T3.MeshStandardMaterial({ color: 0xEDE8E0, roughness: 0.95 }), cx, SLAB_T + 0.25, cz + 0.2, g); box(2.2, 0.16, 0.5, furn2, cx, SLAB_T + 0.6, cz - 1.15, g); }
    if (r.id === 'bed2') { box(1.8, 0.5, 2.2, new T3.MeshStandardMaterial({ color: 0xE6EEF0, roughness: 0.95 }), cx, SLAB_T + 0.25, cz + 0.2, g); }
    if (r.id === 'family') { box(2.4, 0.42, 0.9, furnMat, cx, SLAB_T + 0.21, cz + 0.9, g); box(1.0, 0.36, 0.6, furn2, cx, SLAB_T + 0.18, cz - 0.4, g); }
    if (r.id === 'study') { box(1.8, 0.05, 0.8, furn2, cx, SLAB_T + 0.72, cz, g, false); box(0.1, 0.7, 0.1, M.metal, cx - 0.8, SLAB_T + 0.36, cz, g, false); box(0.1, 0.7, 0.1, M.metal, cx + 0.8, SLAB_T + 0.36, cz, g, false); }

    // ceiling lights
    o.lights = [];
    var lightMat = new T3.MeshStandardMaterial({ color: 0xFFF6DE, emissive: 0xFFD98A, emissiveIntensity: 1.4, roughness: 0.3 });
    for (var i = 0; i < r.lights; i++) {
      var lx = r.x + (r.w / (r.lights + 1)) * (i + 1);
      var disc = new T3.Mesh(new T3.CylinderGeometry(0.16, 0.16, 0.05, 20), lightMat.clone());
      disc.position.set(lx, SLAB_T + WALL_H + 0.9, cz); g.add(disc); o.lights.push(disc);
      box(0.03, 0.5, 0.03, M.metal, lx, SLAB_T + WALL_H + 1.15, cz, g, false);
    }
    o.pl = new T3.PointLight(0xFFD9A0, 0, Math.max(r.w, r.d) * 1.5, 2);
    o.pl.position.set(cx, SLAB_T + WALL_H + 0.8, cz); g.add(o.pl);
    o.glow = new T3.Mesh(new T3.CircleGeometry(Math.min(r.w, r.d) * 0.42, 32), new T3.MeshBasicMaterial({ color: 0xFFE2A8, transparent: true, opacity: 0, depthWrite: false }));
    o.glow.rotation.x = -Math.PI / 2; o.glow.position.set(cx, SLAB_T + 0.012, cz); g.add(o.glow);
    o.shade = new T3.Mesh(new T3.PlaneGeometry(r.w - 0.2, r.d - 0.2), new T3.MeshBasicMaterial({ color: 0x0A1A26, transparent: true, opacity: 0, depthWrite: false }));
    o.shade.rotation.x = -Math.PI / 2; o.shade.position.set(cx, SLAB_T + 0.016, cz); g.add(o.shade);

    // window, glass and a roller blind that visibly travels
    o.blind = null; o.glass = null;
    if (r.blinds || r.id === 'entrance') {
      var wW = Math.min(r.w, r.d) * 0.78, wH = WALL_H * 0.86;
      var wx = cx, wz = cz, rotY = 0, inward = new T3.Vector3(0, 0, 0);
      if (r.win === 'back') { wz = r.z + WALL_T / 2; inward.set(0, 0, 1); }
      if (r.win === 'front') { wz = r.z + r.d - WALL_T / 2; inward.set(0, 0, -1); }
      if (r.win === 'left') { wx = r.x + WALL_T / 2; rotY = Math.PI / 2; inward.set(1, 0, 0); }
      if (r.win === 'right') { wx = r.x + r.w - WALL_T / 2; rotY = Math.PI / 2; inward.set(-1, 0, 0); }
      var wy = SLAB_T + WALL_H * 0.55;
      var frame = box(wW + 0.14, wH + 0.14, WALL_T + 0.06, M.metal, wx, wy, wz, g, false); frame.rotation.y = rotY;
      o.glass = box(wW, wH, WALL_T + 0.08, M.glass.clone(), wx, wy, wz, g, false); o.glass.rotation.y = rotY;
      if (r.blinds) {
        // head box, so the blind reads as a real roller
        var head = box(wW + 0.18, 0.14, 0.16, M.white, 0, 0, 0, g, false);
        head.position.set(wx, wy + wH / 2 + 0.11, wz); head.rotation.y = rotY;
        head.position.add(inward.clone().multiplyScalar(-(WALL_T * 0.5 + 0.06)));
        o.blind = new T3.Mesh(new T3.PlaneGeometry(wW + 0.26, wH + 0.22), blindMat.clone());
        o.blind.material.map = blindTex.clone(); o.blind.material.map.needsUpdate = true;
        o.blind.geometry.translate(0, -(wH + 0.22) / 2, 0);        // pivot at the top rail
        o.blind.position.set(wx, wy + wH / 2, wz); o.blind.rotation.y = rotY;
        o.blind.position.add(inward.clone().multiplyScalar(-(WALL_T * 0.5 + 0.05)));   // outside the glass: a roller shutter on the façade
        o.blind.scale.y = 0.02; g.add(o.blind);
        o.blindH = wH;
      }
    }
    // split AC unit with a louvre that opens and three puffs of cold air
    o.acLed = null; o.louvre = null; o.puffs = [];
    if (r.ac) {
      var acX = r.x + r.w - 1.0, acZ = r.z + 0.34;
      box(1.0, 0.3, 0.26, M.white, acX, SLAB_T + WALL_H - 0.18, acZ, g, false);
      o.louvre = box(0.92, 0.06, 0.18, new T3.MeshStandardMaterial({ color: 0xEDEDED, roughness: 0.5 }), 0, 0, 0, g, false);
      o.louvre.geometry.translate(0, 0, 0.09);
      o.louvre.position.set(acX, SLAB_T + WALL_H - 0.31, acZ + 0.08);
      o.acLed = led(0x56C6E6, 0.04, g); o.acLed.position.set(acX + 0.42, SLAB_T + WALL_H - 0.18, acZ + 0.15);
      for (var pi = 0; pi < 3; pi++) {
        var puff = new T3.Mesh(new T3.PlaneGeometry(0.5, 0.28), new T3.MeshBasicMaterial({ color: 0x9FE3F5, transparent: true, opacity: 0, depthWrite: false, side: T3.DoubleSide }));
        puff.position.set(acX, SLAB_T + WALL_H - 0.36, acZ + 0.2 + pi * 0.1); puff.rotation.x = -0.5; g.add(puff);
        o.puffs.push({ m: puff, phase: pi / 3, x: acX, y: SLAB_T + WALL_H - 0.36, z: acZ + 0.2 });
      }
      // the room temperature, floating over the room — this is what makes a temperature change visible
      o.tempLabel = labelSprite(1.5, 0.75); o.floor = r.floor;
      o.tempLabel.position.set(cx, SLAB_T + WALL_H + 1.55, cz); g.add(o.tempLabel); labels.push(o);
    }
    // a real door on a hinge: unlocking swings it open, locking closes it
    o.door = null;
    if (r.door) {
      var dW = 1.1, dx = r.id === 'entrance' ? cx - 0.2 : r.x + 0.95, dz = r.z + r.d - WALL_T / 2;
      var hinge = new T3.Group(); hinge.position.set(dx - dW / 2, SLAB_T, dz); g.add(hinge);
      var leaf = box(dW, WALL_H, 0.08, M.woodDark, dW / 2, WALL_H / 2, 0, hinge);
      box(0.06, 0.06, 0.1, M.steel, dW - 0.16, WALL_H * 0.5, 0.06, hinge, false);     // handle
      o.door = hinge;
      o.doorLed = led(0x2ECC71, 0.05, g);
      o.doorLed.position.set(dx + dW / 2 + 0.12, SLAB_T + WALL_H * 0.62, dz + 0.14);
      if (r.id === 'entrance') {                                   // video door station beside the front door
        box(0.16, 0.26, 0.04, new T3.MeshStandardMaterial({ color: 0x1B2229, roughness: 0.4 }), dx + dW / 2 + 0.42, SLAB_T + WALL_H * 0.6, dz + 0.12, g, false);
      }
    }
    // ABB Yurika keypad by the door
    var kpX = r.x + r.w - 0.55, kpZ = r.z + r.d - WALL_T - 0.03;
    var kpSide = new T3.MeshStandardMaterial({ color: 0xF2F2F2, roughness: 0.5, metalness: 0.1 });
    o.kpPlate = box(0.2, 0.2, 0.025, [kpSide, kpSide, kpSide, kpSide, kpFace('white'), kpFace('white')], kpX, SLAB_T + WALL_H * 0.6, kpZ, g, false);

    // life-safety and security devices
    var ceil = SLAB_T + WALL_H + 0.72;
    o.smoke = new T3.Mesh(new T3.CylinderGeometry(0.15, 0.15, 0.06, 18), M.white);
    o.smoke.position.set(cx - Math.min(1.4, r.w * 0.25), ceil, cz - Math.min(1.2, r.d * 0.25)); g.add(o.smoke);
    o.smokeLed = led(0x2ECC71, 0.032, g); o.smokeLed.position.copy(o.smoke.position); o.smokeLed.position.y -= 0.05;
    o.motion = new T3.Mesh(new T3.SphereGeometry(0.09, 12, 10, 0, Math.PI * 2, 0, Math.PI / 2), new T3.MeshStandardMaterial({ color: 0xF2F2F2, roughness: 0.5 }));
    o.motion.rotation.x = Math.PI; o.motion.position.set(r.x + 0.42, ceil - 0.02, r.z + 0.42); g.add(o.motion);
    o.motionLed = led(0x7A8894, 0.028, g); o.motionLed.position.set(r.x + 0.42, ceil - 0.12, r.z + 0.42);
    o.gasLed = null; o.leakLed = null;
    if (r.gas) {
      box(0.16, 0.22, 0.07, M.white, r.x + 0.5, SLAB_T + 0.45, r.z + WALL_T + 0.05, g, false);
      o.gasLed = led(0x2ECC71, 0.03, g); o.gasLed.position.set(r.x + 0.5, SLAB_T + 0.52, r.z + WALL_T + 0.11);
    }
    if (r.leak) {
      box(0.14, 0.05, 0.14, M.white, r.x + r.w - 0.6, SLAB_T + 0.04, r.z + 0.6, g, false);
      o.leakLed = led(0x2ECC71, 0.026, g); o.leakLed.position.set(r.x + r.w - 0.6, SLAB_T + 0.09, r.z + 0.6);
    }
    // a red wash over the room when this room is in alarm
    o.alarmWash = new T3.Mesh(new T3.BoxGeometry(r.w - 0.1, WALL_H + 1.2, r.d - 0.1), new T3.MeshBasicMaterial({ color: 0xFF2E2E, transparent: true, opacity: 0, depthWrite: false }));
    o.alarmWash.position.set(cx, SLAB_T + (WALL_H + 1.2) / 2, cz); g.add(o.alarmWash);

    roomObjs[r.id] = o;
  });
  // slabs, plinth, parapet, porch
  var ffSlab = box(VW + 0.4, 0.18, VD + 0.4, new T3.MeshStandardMaterial({ color: 0xEDE8DE, roughness: 0.9 }), VW / 2, -0.1, VD / 2, floorGroups[1]);
  ffSlab.userData.noPick = true;
  box(VW + 0.6, 0.3, VD + 0.6, new T3.MeshStandardMaterial({ color: 0xE6DFD0, roughness: 0.9 }), VW / 2, -0.16, VD / 2, floorGroups[0]);
  box(3.6, 0.16, 1.4, new T3.MeshStandardMaterial({ color: 0xE6DFD0, roughness: 0.9 }), VW / 2, 0.08, VD + 0.7, floorGroups[0]);
  // façade uplights that come on at night
  var facadeLights = [];
  [2.5, 7, 11.5].forEach(function (x) {
    var l = new T3.PointLight(0xFFC98A, 0, 7, 2); l.position.set(x, 0.5, VD + 1.4); scene.add(l); facadeLights.push(l);
  });

  // selection ring
  var ring = new T3.Mesh(new T3.RingGeometry(0.9, 1.0, 48), new T3.MeshBasicMaterial({ color: 0x56C6E6, transparent: true, opacity: 0.9, side: T3.DoubleSide, depthWrite: false }));
  ring.rotation.x = -Math.PI / 2; ring.visible = false; scene.add(ring);

  /* ---------- camera orbit ---------- */
  var orbit = { az: 0.68, pol: 1.05, dist: isSmall ? 38 : 30, tAz: 0.68, tPol: 1.05, tDist: isSmall ? 38 : 30 };
  function placeCamera() {
    var az = orbit.az, pol = orbit.pol, d = orbit.dist;
    camera.position.set(target.x + d * Math.sin(pol) * Math.sin(az), target.y + d * Math.cos(pol), target.z + d * Math.sin(pol) * Math.cos(az));
    camera.lookAt(target);
  }
  var drag = { on: false, x: 0, y: 0, moved: 0, pinch: 0 };
  canvas.addEventListener('pointerdown', function (e) { drag.on = true; drag.moved = 0; drag.x = e.clientX; drag.y = e.clientY; });
  window.addEventListener('pointermove', function (e) {
    if (!drag.on) return;
    var dx = e.clientX - drag.x, dy = e.clientY - drag.y; drag.x = e.clientX; drag.y = e.clientY;
    drag.moved += Math.abs(dx) + Math.abs(dy);
    orbit.tAz -= dx * 0.006; orbit.tPol = Math.min(1.35, Math.max(0.45, orbit.tPol - dy * 0.005));
  });
  window.addEventListener('pointerup', function () { drag.on = false; });
  canvas.addEventListener('wheel', function (e) { e.preventDefault(); userZoomed = true; orbit.tDist = Math.min(62, Math.max(16, orbit.tDist + e.deltaY * 0.02)); }, { passive: false });
  canvas.addEventListener('touchstart', function (e) { if (e.touches.length === 2) drag.pinch = Math.hypot(e.touches[0].clientX - e.touches[1].clientX, e.touches[0].clientY - e.touches[1].clientY); }, { passive: true });
  canvas.addEventListener('touchmove', function (e) {
    if (e.touches.length === 2 && drag.pinch) { userZoomed = true; var p = Math.hypot(e.touches[0].clientX - e.touches[1].clientX, e.touches[0].clientY - e.touches[1].clientY); orbit.tDist = Math.min(62, Math.max(16, orbit.tDist - (p - drag.pinch) * 0.05)); drag.pinch = p; }
  }, { passive: true });
  canvas.style.touchAction = 'none';

  var ray = new T3.Raycaster(), ndc = new T3.Vector2();
  canvas.addEventListener('click', function (e) {
    if (drag.moved > 6) return;
    var rect = canvas.getBoundingClientRect();
    ndc.set(((e.clientX - rect.left) / rect.width) * 2 - 1, -((e.clientY - rect.top) / rect.height) * 2 + 1);
    ray.setFromCamera(ndc, camera);
    var hits = ray.intersectObjects(pickables, false);
    for (var i = 0; i < hits.length; i++) {
      var id = hits[i].object.userData.room;
      if (!id) continue;
      if (roomObjs[id].r.floor !== state.floor) continue;
      select(id); return;
    }
  });

  // the pinned box is squarer than the old wide stage (4:3 on desktop, ~1:1 on a
  // phone) — back the camera off as the box gets squarer so the whole villa,
  // including the far rooms and their labels, stays inside the frame
  var userZoomed = false;
  function resize() {
    var w = host.clientWidth, h = host.clientHeight || Math.round(w * 0.66);
    renderer.setSize(w, h, false);
    camera.aspect = w / h; camera.updateProjectionMatrix();
    if (!userZoomed) {
      var base = isSmall ? 38 : 30;
      var fit = base * Math.min(1.32, Math.max(1, 1.62 / camera.aspect));
      orbit.tDist = fit; if (!orbit._placed) { orbit.dist = fit; orbit._placed = true; }
    }
  }
  window.addEventListener('resize', resize); resize();
  // the pinned box changes height with the phone's address bar and on rotation,
  // not only on window resize — follow the box itself
  if ('ResizeObserver' in window) { try { new ResizeObserver(function () { resize(); }).observe(host); } catch (e) {} }

  /* ---------- state → scene ---------- */
  var lerp = function (a, b, k) { return a + (b - a) * k; };
  var dayK = 1, floorK = 0, ghostMats = [];
  floorGroups[1].traverse(function (o) {
    if (!o.isMesh) return;
    var cl = function (m) { var c = m.clone(); c.transparent = true; ghostMats.push(c); return c; };
    if (Array.isArray(o.material)) { var seen = new Map(); o.material = o.material.map(function (m) { if (!seen.has(m)) seen.set(m, cl(m)); return seen.get(m); }); }
    else o.material = cl(o.material);
  });

  function alarmOf(id) { var a = state.home.alarm; return a && a.room === id ? a : null; }
  function tempColour(temp) { return temp <= 21 ? 0x56C6E6 : (temp >= 25 ? 0xF0B35B : 0x7FD8F0); }
  function applyRoom(id) {
    var o = roomObjs[id], s = state.rooms[id], r = o.r;
    var warm = state.night ? 1 : 0.55;
    o.lights.forEach(function (d) { d.material.emissiveIntensity = 0.15 + s.light * 2.2; });
    o.pl.intensity = s.light * (state.night ? 2.6 : 0.9) * warm;
    o.glow.material.opacity = s.light * (state.night ? 0.42 : 0.12);
    if (o.blind) o.blind.userData.tgt = 0.02 + (1 - s.blinds) * 0.98;       // 1 = open (raised)
    if (o.glass) o.glass.material.opacity = 0.2 + 0.25 * s.blinds;
    if (o.shade && r.blinds) o.shade.material.opacity = (1 - s.blinds) * 0.5;   // shutters down = a darker room
    if (o.acLed) { var c = tempColour(s.temp); setLed(o.acLed, c, s.temp <= 21 ? 1.8 : (s.temp >= 25 ? 0.4 : 1.0)); }
    if (o.louvre) o.louvre.userData.tgt = s.temp <= 23 ? -0.75 : 0;          // flap drops open when cooling
    if (o.tempLabel) {
      var cold = s.temp <= 21, warmSet = s.temp >= 25;
      o.tempLabel.userData.draw(fmtNum(s.temp) + '°C', cold ? 'rgba(12,60,80,.92)' : (warmSet ? 'rgba(86,52,10,.92)' : 'rgba(14,32,46,.9)'), cold ? '#8FE6FF' : (warmSet ? '#FFD79A' : '#EAF4FA'));
    }
    if (o.door) o.door.userData.tgt = r.lock ? (s.locked ? 0 : -Math.PI * 0.52) : -0.5;   // a lockable door swings open when you unlock it
    if (o.doorLed) { var dc = s.locked ? 0xE64545 : 0x2ECC71; setLed(o.doorLed, dc, 1.6); }
    if (o.motionLed) { var armed = state.home.armed; setLed(o.motionLed, armed ? 0x56C6E6 : 0x7A8894, armed ? 1.6 : 0.25); }
    var al = alarmOf(id);
    if (o.smokeLed) setLed(o.smokeLed, al && al.type === 'smoke' ? 0xFF2E2E : 0x2ECC71, al && al.type === 'smoke' ? 2.4 : 0.7);
    if (o.gasLed) setLed(o.gasLed, al && al.type === 'gas' ? 0xFF2E2E : 0x2ECC71, al && al.type === 'gas' ? 2.4 : 0.7);
    if (o.leakLed) setLed(o.leakLed, al && al.type === 'leak' ? 0xFF2E2E : 0x2ECC71, al && al.type === 'leak' ? 2.4 : 0.7);
  }
  function applyAll() { ROOMS.forEach(function (r) { applyRoom(r.id); }); applyHome(); }
  function applyHome() {
    gateX.tgt = state.home.gate ? -5.6 : 0;
    garageY.tgt = state.home.garage ? 2.45 : 0;
  }

  /* ---------- render loop ---------- */
  var visible = true, queued = false, lastT = performance.now();
  var ease = function (a, b, perFrame, dt) { return lerp(a, b, 1 - Math.pow(1 - perFrame, dt * 60)); };
  function frame() {
    queued = false;
    if (!visible) return;
    queued = true; requestAnimationFrame(frame);
    var now = performance.now(), dt = Math.min(0.1, (now - lastT) / 1000); lastT = now;
    var tsec = now / 1000;
    orbit.az = ease(orbit.az, orbit.tAz, 0.12, dt); orbit.pol = ease(orbit.pol, orbit.tPol, 0.12, dt); orbit.dist = ease(orbit.dist, orbit.tDist, 0.12, dt);
    placeCamera();
    // day / night
    var dk = state.night ? 0 : 1;
    dayK = ease(dayK, dk, 0.06, dt);
    scene.background.copy(SKY.night).lerp(SKY.day, dayK);
    scene.fog.color.copy(FOG.night).lerp(FOG.day, dayK);
    groundMat.color.copy(GROUND.night).lerp(GROUND.day, dayK);
    sun.intensity = 2.2 * dayK; hemi.intensity = 0.12 + 0.75 * dayK; moon.intensity = 0.35 * (1 - dayK);
    renderer.toneMappingExposure = 0.75 + 0.3 * dayK;
    var nightK = 1 - dayK;
    poolLights.forEach(function (l) { l.intensity = 1.6 * nightK; });
    facadeLights.forEach(function (l) { l.intensity = 1.4 * nightK; });
    pierLamps.forEach(function (l) { l.material.emissiveIntensity = 1.6 * nightK; });
    // floor focus
    var fk = state.floor === 1 ? 1 : 0;
    floorK = ease(floorK, fk, 0.1, dt);
    floorGroups[1].position.y = FLOOR_H + (1 - floorK) * 4.2;
    var op = 0.12 + 0.88 * floorK;
    for (var i = 0; i < ghostMats.length; i++) ghostMats[i].opacity = op;
    // temperature labels follow their floor: the ghosted floor's labels fade with it, so they
    // never sit at full strength on top of the floor you are actually controlling
    for (var li = 0; li < labels.length; li++) {
      var lo = labels[li];
      if (lo.tempLabel) lo.tempLabel.material.opacity = lo.floor === 1 ? (0.08 + 0.92 * floorK) : (1 - 0.9 * floorK);
    }
    // moving parts — slow enough to be seen
    gateX.cur = ease(gateX.cur, gateX.tgt, 0.05, dt); gate.position.x = VW / 2 + gateX.cur;
    garageY.cur = ease(garageY.cur, garageY.tgt, 0.05, dt); garage.userData.door.position.y = garageY.cur;
    garage.userData.door.children.forEach(function (pn) { pn.visible = pn.position.y + garageY.cur < 2.55; });   // panels disappear into the head as the door lifts
    var alarm = state.home.alarm, pulse = 0.5 + 0.5 * Math.sin(tsec * 7);
    ROOMS.forEach(function (r) {
      var o = roomObjs[r.id], s = state.rooms[r.id];
      if (o.blind && o.blind.userData.tgt != null) o.blind.scale.y = ease(o.blind.scale.y, o.blind.userData.tgt, 0.06, dt);
      if (o.door && o.door.userData.tgt != null) o.door.rotation.y = ease(o.door.rotation.y, o.door.userData.tgt, 0.07, dt);
      if (o.louvre && o.louvre.userData.tgt != null) o.louvre.rotation.x = ease(o.louvre.rotation.x, o.louvre.userData.tgt, 0.08, dt);
      // cold air drifting out of an AC that is actually cooling
      if (o.puffs.length) {
        var cooling = s.temp <= 23 ? 1 : 0;
        o.puffs.forEach(function (p) {
          p.phase = (p.phase + dt * 0.55) % 1;
          p.m.position.z = p.z + p.phase * 1.5;
          p.m.position.y = p.y - p.phase * 0.45;
          p.m.material.opacity = cooling * 0.34 * Math.sin(p.phase * Math.PI);
        });
      }
      // alarm wash + flashing detector
      var mine = alarm && alarm.room === r.id;
      o.alarmWash.material.opacity = mine ? 0.1 + 0.16 * pulse : 0;
      if (mine) {
        var lamp = alarm.type === 'gas' ? o.gasLed : (alarm.type === 'leak' ? o.leakLed : o.smokeLed);
        if (lamp) lamp.material.emissiveIntensity = 0.6 + 3 * pulse;
      }
      if (o.motionLed && state.home.armed && !alarm) o.motionLed.material.emissiveIntensity = 0.8 + 0.8 * (0.5 + 0.5 * Math.sin(tsec * 1.6 + r.x));
    });
    // sprinklers
    var irr = state.home.irrigation ? 1 : 0;
    sprinklers.forEach(function (sp, k) { sp.material.opacity = irr * (0.16 + 0.1 * Math.sin(tsec * 3 + k)); sp.rotation.y = tsec * 1.2 + k; });
    // cameras sweep while enabled
    cams.forEach(function (c, k) {
      c.head.rotation.y = c.base + (state.home.cameras ? Math.sin(tsec * 0.25 + k) * 0.5 : 0);
      c.dot.material.emissiveIntensity = state.home.cameras ? (alarm ? 0.5 + 3 * pulse : 1.2) : 0.08;
    });
    // selection ring
    var so = roomObjs[state.selected];
    if (so) {
      var r2 = so.r; ring.visible = true;
      ring.position.set(r2.x + r2.w / 2, (r2.floor === 1 ? floorGroups[1].position.y : 0) + SLAB_T + 0.02, r2.z + r2.d / 2);
      var sc = Math.min(r2.w, r2.d) * 0.5; ring.scale.set(sc, sc, sc);
      ring.material.opacity = 0.55 + 0.35 * Math.sin(tsec * 3);
    }
    renderer.render(scene, camera);
  }

  /* ---------- UI ---------- */
  var $ = function (s) { return document.querySelector(s); };
  var roomChips = $('#v-rooms'), roomTitle = $('#v-room-title'), lightRange = $('#v-light'), blindRange = $('#v-blinds'),
      tempVal = $('#v-temp-val'), lockBtn = $('#v-lock'), lockWrap = $('#v-lock-wrap'), blindWrap = $('#v-blind-wrap'),
      nightBtn = $('#v-night'), sysList = $('#v-system'), askBox = $('#v-ask'), waBtn = $('#v-wa'), tipEl = $('#v-tip'),
      garageBtn = $('#v-garage'), gateBtn = $('#v-gate'), armBtn = $('#v-arm'), irrigBtn = $('#v-irrig'), camBtn = $('#v-cams'),
      safetyList = $('#v-safety'), testBtn = $('#v-test'), pagesEl = $('#wp-pages'), dotsEl = $('#wp-dots'), bannerEl = $('#wp-banner');

  function buildRoomChips() {
    roomChips.innerHTML = '';
    ROOMS.filter(function (r) { return r.floor === state.floor; }).forEach(function (r) {
      var b = document.createElement('button'); b.type = 'button'; b.className = 'wp-tab' + (r.id === state.selected ? ' on' : '');
      b.textContent = t('rooms.' + r.id); b.dataset.room = r.id;
      b.addEventListener('click', function () { select(r.id); });
      roomChips.appendChild(b);
    });
    document.querySelectorAll('[data-floor]').forEach(function (b) { b.classList.toggle('on', Number(b.dataset.floor) === state.floor); });
  }
  function select(id) {
    state.selected = id;
    if (roomObjs[id].r.floor !== state.floor) state.floor = roomObjs[id].r.floor;
    buildRoomChips(); syncControls();
  }
  function setPage(n) {
    state.page = n;
    if (pagesEl) pagesEl.querySelectorAll('.wp-page').forEach(function (p, i) { p.classList.toggle('on', i === n); p.hidden = i !== n; });
    if (dotsEl) dotsEl.querySelectorAll('button').forEach(function (d, i) {
      var on = i === n; d.classList.toggle('on', on);
      if (on) d.setAttribute('aria-current', 'true'); else d.removeAttribute('aria-current');
    });
  }
  function syncControls() {
    var r = roomObjs[state.selected].r, s = state.rooms[state.selected], h = state.home, L = lang();
    roomTitle.textContent = t('rooms.' + r.id);
    lightRange.value = Math.round(s.light * 100);
    blindWrap.hidden = !r.blinds; blindRange.value = Math.round(s.blinds * 100);
    var lv = $('#wp-light-val'), bv = $('#wp-blind-val');
    if (lv) lv.textContent = fmtNum(Math.round(s.light * 100)) + '%';
    if (bv) bv.textContent = fmtNum(Math.round(s.blinds * 100)) + '%';
    tempVal.textContent = fmtNum(s.temp) + '°';
    lockWrap.hidden = !r.lock;
    lockBtn.classList.toggle('locked', s.locked);
    lockBtn.querySelector('span').textContent = s.locked ? t('locked') : t('unlocked');
    nightBtn.classList.toggle('on', state.night);
    // access page
    if (garageBtn) { garageBtn.classList.toggle('on', h.garage); garageBtn.querySelector('span').textContent = h.garage ? t('open') : t('closed'); }
    if (gateBtn) { gateBtn.classList.toggle('on', h.gate); gateBtn.querySelector('span').textContent = h.gate ? t('open') : t('closed'); }
    if (armBtn) { armBtn.classList.toggle('on', h.armed); armBtn.querySelector('span').textContent = h.armed ? t('armed') : t('disarmed'); }
    if (irrigBtn) { irrigBtn.classList.toggle('on', h.irrigation); irrigBtn.querySelector('span').textContent = h.irrigation ? t('on') : t('off'); }
    if (camBtn) { camBtn.classList.toggle('on', h.cameras); camBtn.querySelector('span').textContent = h.cameras ? t('on') : t('off'); }
    // safety page
    if (safetyList) {
      var a = h.alarm;
      var rows = [['smoke', t('smoke')], ['gas', t('gas')], ['leak', t('leak')], ['motion', t('motion')]];
      safetyList.innerHTML = rows.map(function (row) {
        var bad = a && a.type === row[0];
        var where = bad ? t('rooms.' + a.room) : t('normal');
        return '<li class="' + (bad ? 'bad' : 'ok') + '"><i></i><b>' + row[1] + '</b><span>' + where + '</span></li>';
      }).join('');
    }
    if (testBtn) testBtn.textContent = h.alarm ? t('clear') : t('test');
    if (bannerEl) {
      var al = h.alarm;
      bannerEl.hidden = !al;
      if (al) bannerEl.textContent = t(al.type + 'Alarm') + ' · ' + t('rooms.' + al.room);
    }
    document.querySelectorAll('.wp-screen').forEach(function (e) { e.classList.toggle('alarm', !!h.alarm); });
    applyRoom(state.selected); applyHome();
  }
  lightRange.addEventListener('input', function () { state.rooms[state.selected].light = lightRange.value / 100; applyRoom(state.selected); var lv = $('#wp-light-val'); if (lv) lv.textContent = fmtNum(lightRange.value) + '%'; });
  blindRange.addEventListener('input', function () { state.rooms[state.selected].blinds = blindRange.value / 100; applyRoom(state.selected); var bv = $('#wp-blind-val'); if (bv) bv.textContent = fmtNum(blindRange.value) + '%'; });
  (function clock() { var c = $('#wp-clock'); if (c) { var d = new Date(); c.textContent = ('0' + d.getHours()).slice(-2) + ':' + ('0' + d.getMinutes()).slice(-2); } setTimeout(clock, 20000); })();
  var outT = $('.wp-out i'); if (outT) outT.textContent = fmtNum(state.night ? 29 : 36) + '°';
  document.querySelectorAll('[data-temp]').forEach(function (b) {
    b.addEventListener('click', function () { var s = state.rooms[state.selected]; s.temp = Math.min(26, Math.max(18, s.temp + Number(b.dataset.temp))); syncControls(); });
  });
  lockBtn.addEventListener('click', function () { var s = state.rooms[state.selected]; s.locked = !s.locked; syncControls(); });
  nightBtn.addEventListener('click', function () { state.night = !state.night; syncControls(); if (outT) outT.textContent = fmtNum(state.night ? 29 : 36) + '°'; });
  if (garageBtn) garageBtn.addEventListener('click', function () { state.home.garage = !state.home.garage; syncControls(); });
  if (gateBtn) gateBtn.addEventListener('click', function () { state.home.gate = !state.home.gate; syncControls(); });
  if (irrigBtn) irrigBtn.addEventListener('click', function () { state.home.irrigation = !state.home.irrigation; syncControls(); });
  if (camBtn) camBtn.addEventListener('click', function () { state.home.cameras = !state.home.cameras; syncControls(); });
  if (armBtn) armBtn.addEventListener('click', function () {
    state.home.armed = !state.home.armed;
    if (!state.home.armed && state.home.alarm && state.home.alarm.type === 'motion') state.home.alarm = null;
    applyAll(); syncControls();
  });
  if (testBtn) testBtn.addEventListener('click', function () {
    if (state.home.alarm) state.home.alarm = null;
    else {
      // pick a believable device for the selected room: gas in the kitchen, leak where there is one, otherwise smoke
      var r = roomObjs[state.selected].r;
      var type = r.gas ? 'gas' : (r.leak ? 'leak' : 'smoke');
      state.home.alarm = { room: r.id, type: type };
    }
    applyAll(); syncControls();
  });
  document.querySelectorAll('[data-floor]').forEach(function (b) {
    b.addEventListener('click', function () {
      state.floor = Number(b.dataset.floor);
      var first = ROOMS.filter(function (r) { return r.floor === state.floor; })[0];
      if (roomObjs[state.selected].r.floor !== state.floor) state.selected = first.id;
      buildRoomChips(); syncControls();
    });
  });
  if (dotsEl) dotsEl.querySelectorAll('button').forEach(function (d, i) { d.addEventListener('click', function () { setPage(i); }); });
  document.querySelectorAll('[data-page]').forEach(function (b) { if (b.tagName === 'BUTTON') b.addEventListener('click', function () { setPage(Number(b.dataset.page)); }); });
  document.querySelectorAll('[data-scene]').forEach(function (b) {
    b.addEventListener('click', function () {
      var key = b.dataset.scene, fn = SCENES[key]; if (!fn) return;
      ROOMS.forEach(function (r) { fn(r, state.rooms[r.id]); });
      var hs = SCENE_HOME[key] || {};
      Object.keys(hs).forEach(function (k) { state.home[k] = hs[k]; });
      if (key === 'night' || key === 'cinema') state.night = true;
      if (key === 'welcome') state.night = false;
      document.querySelectorAll('[data-scene]').forEach(function (x) { x.classList.toggle('on', x === b); });
      applyAll(); syncControls();
    });
  });

  /* ---------- your system — devices only, never a price ---------- */
  var estSize = $('#e-size'), estSizeOut = $('#e-size-out');
  function roomsFor(size) { return Math.max(4, Math.round(size / 38)); }   // ~38 m² per controlled space, corridors included
  function tally() {
    var f = state.est.features, n = roomsFor(state.est.size), fl = state.est.floors;
    var items = [];
    items.push(['controller', 1]);
    items.push(['panel', Math.max(1, fl)]);
    items.push(['keypad', n]);
    if (f.lighting) items.push(['dimmer', Math.round(n * 2.4)]);
    if (f.blinds) items.push(['blind', Math.round(n * 0.7)]);
    if (f.ac) items.push(['thermostat', Math.round(n * 0.85)]);
    if (f.access) { items.push(['lock', 1 + Math.max(0, fl - 1)]); items.push(['gate', 2]); items.push(['intercom', 1]); }
    items.push(['sensor', Math.round(n * 0.6)]);
    if (f.safety) { items.push(['smoke', Math.round(n * 0.9)]); items.push(['gas', 1]); items.push(['leak', Math.max(2, Math.round(n * 0.25))]); }
    if (f.security) { items.push(['contact', Math.round(n * 0.8)]); items.push(['siren', 1]); }
    if (f.cameras) items.push(['camera', 4 + fl * 2]);
    if (f.audio) items.push(['audio', Math.round(n * 0.4)]);
    if (f.irrigation) items.push(['irrigation', 1]);
    return items;
  }
  function renderSystem() {
    var items = tally(), L = lang();
    sysList.innerHTML = '';
    items.forEach(function (it) {
      var li = document.createElement('li');
      li.innerHTML = '<b>' + fmtNum(it[1]) + ' ' + t('units') + '</b><span>' + t('dev.' + it[0]) + '</span>';
      sysList.appendChild(li);
    });
    if (askBox) askBox.innerHTML = '<small>' + t('askNote') + '</small>';
    estSizeOut.textContent = fmtNum(state.est.size) + ' ' + t('sqm') + ' · ' + fmtNum(roomsFor(state.est.size)) + ' ' + t('roomsLabel');
    var lines = [t('waMsg'), ''];
    lines.push((L === 'ar' ? 'المنصة: ' : 'Platform: ') + t('brands.' + state.brand));
    lines.push((L === 'ar' ? 'المساحة: ' : 'Built-up area: ') + state.est.size + ' m² · ' + state.est.floors + (L === 'ar' ? ' طوابق' : ' floors'));
    lines.push((L === 'ar' ? 'الأنظمة: ' : 'Systems: ') + Object.keys(state.est.features).filter(function (k) { return state.est.features[k]; }).join(', '));
    lines.push('');
    items.forEach(function (it) { lines.push('• ' + it[1] + ' × ' + t('dev.' + it[0])); });
    lines.push('', (L === 'ar' ? 'أرجو إرسال السعر لهذه القائمة.' : 'Please send me a price for this list.'));
    waBtn.href = 'https://wa.me/96872160022?text=' + encodeURIComponent(lines.join('\n'));
    var chk = document.getElementById('v-check');
    if (chk) chk.href = 'checklist.html?brand=' + state.brand + '&size=' + state.est.size + '&floors=' + state.est.floors + '&f=' + Object.keys(state.est.features).filter(function (k) { return state.est.features[k]; }).join(',') + '&lang=' + L;
  }
  document.querySelectorAll('[data-brand]').forEach(function (b) {
    b.classList.toggle('on', b.dataset.brand === state.brand);
    b.addEventListener('click', function () { state.brand = b.dataset.brand; document.querySelectorAll('[data-brand]').forEach(function (x) { x.classList.toggle('on', x === b); }); renderSystem(); });
  });
  document.querySelectorAll('[data-feature]').forEach(function (c) {
    c.checked = !!state.est.features[c.dataset.feature];
    c.addEventListener('change', function () { state.est.features[c.dataset.feature] = c.checked; renderSystem(); });
  });
  if (estSize) estSize.addEventListener('input', function () { state.est.size = Number(estSize.value); renderSystem(); });
  document.querySelectorAll('[data-floors]').forEach(function (b) {
    b.addEventListener('click', function () { state.est.floors = Number(b.dataset.floors); document.querySelectorAll('[data-floors]').forEach(function (x) { x.classList.toggle('on', x === b); }); renderSystem(); });
  });

  /* ---------- room keypad: ABB Yurika ---------- */
  function kpSync() {
    var s = state.rooms[state.selected], r = roomObjs[state.selected].r;
    var lit = function (id, on) { var e = document.getElementById(id); if (e) e.classList.toggle('on', !!on); };
    lit('kp-l-power-l', s.light <= 0.02); lit('kp-l-power-r', s.light > 0.02);
    lit('kp-l-dim-l', false); lit('kp-l-dim-r', s.light > 0.02 && s.light < 0.98);
    lit('kp-l-blind-l', r.blinds && s.blinds < 0.5); lit('kp-l-blind-r', r.blinds && s.blinds >= 0.5);
    lit('kp-l-scene-l', state.night); lit('kp-l-scene-r', !state.night);
    var row = document.querySelector('.yk-row[data-kp="blind"]'); if (row) row.classList.toggle('off', !r.blinds);
    document.querySelectorAll('.yk-key[data-kp="blind"]').forEach(function (b) { b.classList.toggle('off', !r.blinds); });
    var rt = document.getElementById('kp-rt'); if (rt) rt.textContent = fmtNum(s.temp) + (lang() === 'ar' ? '٫٠' : '.0');
  }
  // every press says out loud what it did — the villa is above the fold, the keypad is below it
  var kpEcho = null;
  function echo(msg) {
    var e = document.getElementById('kp-echo'); if (!e) return;
    e.textContent = msg; e.classList.add('on');
    clearTimeout(kpEcho); kpEcho = setTimeout(function () { e.classList.remove('on'); }, 2600);
  }
  document.querySelectorAll('.yk-key').forEach(function (b) {
    b.addEventListener('click', function () {
      var kind = b.dataset.kp, right = b.dataset.side === 'r', s = state.rooms[state.selected], r = roomObjs[state.selected].r;
      var room = t('rooms.' + r.id), before = { l: s.light, b: s.blinds };
      b.classList.add('pressed'); setTimeout(function () { b.classList.remove('pressed'); }, 220);
      var l = document.getElementById('kp-l-' + kind + '-' + (right ? 'r' : 'l')); if (l) { l.classList.add('on'); setTimeout(kpSync, 400); }
      if (kind === 'power') s.light = right ? 0.85 : 0;
      if (kind === 'dim') s.light = Math.max(0, Math.min(1, s.light + (right ? 0.15 : -0.15)));
      if (kind === 'blind') { if (r.blinds) s.blinds = right ? 1 : 0; else echo(room + ' · ' + t('noBlinds')); }
      if (kind === 'scene') { var fn = SCENES[right ? 'welcome' : 'evening']; ROOMS.forEach(function (x) { fn(x, state.rooms[x.id]); }); state.night = !right; document.querySelectorAll('[data-scene]').forEach(function (x) { x.classList.toggle('on', x.dataset.scene === (right ? 'welcome' : 'evening')); }); applyAll(); }
      if (kind === 'power' || kind === 'dim') {
        var same = Math.abs(before.l - s.light) < 0.001;
        echo(room + ' · ' + t('lightsOn') + ' ' + fmtNum(Math.round(s.light * 100)) + '%' + (same ? ' (' + t('already') + ')' : ''));
      } else if (kind === 'blind' && r.blinds) {
        echo(room + ' · ' + t('blindsAt') + ' ' + fmtNum(Math.round(s.blinds * 100)) + '%' + (Math.abs(before.b - s.blinds) < 0.001 ? ' (' + t('already') + ')' : ''));
      } else if (kind === 'scene') {
        echo(t('scene') + ' · ' + (right ? (lang() === 'ar' ? 'ترحيب' : 'Welcome') : (lang() === 'ar' ? 'مساء' : 'Evening')));
      }
      syncControls(); kpSync();
    });
  });
  document.querySelectorAll('.kp-finishes button').forEach(function (b) {
    b.addEventListener('click', function () {
      var f = FINISH[b.dataset.finish]; if (!f) return;
      document.querySelectorAll('.kp-finishes button').forEach(function (x) { x.classList.toggle('on', x === b); });
      var plate = document.querySelector('.yk'); if (plate) plate.dataset.finish = b.dataset.finish;
      var face = kpFace(b.dataset.finish);
      ROOMS.forEach(function (r) {
        var mats = roomObjs[r.id].kpPlate.material, side = mats[0];
        side.color.setHex(f.c); side.metalness = f.m; side.roughness = f.r;
        [mats[4], mats[5]].forEach(function (m) { if (m.map !== face.map) { m.map = face.map; m.needsUpdate = true; } });
      });
    });
  });
  var _sync = syncControls; syncControls = function () { _sync(); kpSync(); };

  document.addEventListener('langchange', function () { buildRoomChips(); syncControls(); renderSystem(); if (tipEl) tipEl.textContent = t('tip'); });

  window.MECAMAC_VILLA = { state: state, t: t, select: select, applyAll: applyAll, render: renderSystem, setPage: setPage };   // handy for QA and for the concierge

  /* ---------- go ---------- */
  setPage(0); buildRoomChips(); syncControls(); applyAll(); renderSystem();
  if (tipEl) tipEl.textContent = t('tip');
  placeCamera(); frame();
  var onScreen = true, menuOpen = false;
  function setVisible(v) { visible = v; if (v && !queued) frame(); }
  function refresh() { setVisible(onScreen && !menuOpen && !document.hidden); }
  if ('IntersectionObserver' in window) new IntersectionObserver(function (en) { onScreen = en[0].isIntersecting; refresh(); }, { threshold: 0 }).observe(host);
  document.addEventListener('visibilitychange', refresh);
  // the mobile menu opens over the villa — stop rendering so the panel animates smoothly
  if ('MutationObserver' in window) new MutationObserver(function () { var o = document.body.classList.contains('nav-open'); if (o !== menuOpen) { menuOpen = o; refresh(); } }).observe(document.body, { attributes: true, attributeFilter: ['class'] });
})();
