/* ============================================================
   Mecamac Concierge — voice + text assistant, bilingual, serverless.
   v1 answers from a curated knowledge base below (no network at all).
   Set CONCIERGE.endpoint to a small proxy (see concierge-worker/worker.js)
   and every question is answered by Claude instead, with the same
   facts, tone and WhatsApp hand-off.
   ============================================================ */
(function () {
  'use strict';

  var CONCIERGE = {
    endpoint: '',                     // e.g. 'https://concierge.mecamac.workers.dev' — leave empty for the built-in answers
    wa: '96872160022',
    speak: true                       // read every answer aloud unless the visitor mutes (the choice is remembered)
  };

  var root = document.documentElement;
  var L = function () { return root.getAttribute('lang') === 'ar' ? 'ar' : 'en'; };
  var A = 'en';                                               // language of the current answer
  function qLang(q) { return /[\u0600-\u06FF]/.test(q) ? 'ar' : (/[A-Za-z]/.test(q) ? 'en' : L()); }
  var base = (function () {                                   // site root relative to this page
    var s = document.querySelector('script[src*="concierge.js"]');
    var src = s ? s.getAttribute('src') : 'assets/js/concierge.js';
    return src.replace(/assets\/js\/concierge\.js$/, '');
  })();

  var UI = {
    en: { title: 'Mecamac Concierge', sub: 'Ask about systems, brands, the showroom or a price', ph: 'Type or tap the mic…', mic: 'Speak', send: 'Send',
          hi: 'Hello — I am the Mecamac concierge. Ask me about smart homes, HVAC, MEP, data centres, our brands or the showroom. You can speak or type, in English or Arabic.',
          engineer: 'Talk to an engineer on WhatsApp', listening: 'Listening…', nomic: 'Voice input is not available in this browser — please type.',
          fallback: 'I want to get this exactly right, so let me hand you to an engineer. Tap below and your question goes straight to WhatsApp.',
          chips: ['What do you do?', 'Smart home for my villa', 'Where is the showroom?', 'Wired or wireless?', 'How much does it cost?', 'RUUD air conditioning'],
          mute: 'Mute voice', unmute: 'Read answers aloud', close: 'Close', open: 'Ask the Mecamac concierge',
          spk: 'Speech language', noArVoice: 'This device has no Arabic voice installed, so the Arabic answer is written, not spoken. On Windows: Settings → Time & language → Language → Arabic → Speech. On iPhone and Android an Arabic voice is usually already there.' },
    ar: { title: 'مساعد ميكاماك', sub: 'اسأل عن الأنظمة والعلامات والشوروم أو السعر', ph: 'اكتب أو اضغط الميكروفون…', mic: 'تكلّم', send: 'إرسال',
          hi: 'أهلاً — أنا مساعد ميكاماك. اسألني عن المنازل الذكية أو التكييف أو الكهروميكانيك أو مراكز البيانات أو علاماتنا أو الشوروم. تقدر تتكلم أو تكتب، بالعربي أو الإنجليزي.',
          engineer: 'تكلّم مع مهندس على واتساب', listening: 'أسمعك…', nomic: 'الإدخال الصوتي غير متاح في هذا المتصفح — اكتب سؤالك من فضلك.',
          fallback: 'حتى أعطيك جواباً دقيقاً، بحوّلك لمهندس. اضغط تحت وسؤالك بيروح مباشرة على واتساب.',
          chips: ['شو بتشتغلوا؟', 'منزل ذكي لفيلتي', 'وين الشوروم؟', 'سلكي ولا لاسلكي؟', 'قديش التكلفة؟', 'تكييف RUUD'],
          mute: 'كتم الصوت', unmute: 'اقرأ الأجوبة بصوت', close: 'إغلاق', open: 'اسأل مساعد ميكاماك',
          spk: 'لغة الصوت', noArVoice: 'ما في صوت عربي مثبّت على هذا الجهاز، فالجواب بالعربي مكتوب بدون صوت. على ويندوز: الإعدادات ← الوقت واللغة ← اللغة ← العربية ← الكلام. على الآيفون والأندرويد الصوت العربي موجود عادة.' }
  };

  /* ---------- knowledge base ---------- */
  var KB = [
    { id: 'greet', kw: { en: ['hello', 'hi', 'hey', 'good morning', 'good evening', 'salam'], ar: ['مرحبا', 'اهلا', 'هلا', 'السلام عليكم', 'صباح الخير', 'مساء الخير'] },
      a: { en: 'Hello! What are you planning — a smart villa, an HVAC package, an MEP scope, or a data centre? Ask me anything, or tap a suggestion below.',
           ar: 'أهلاً وسهلاً! شو مخطط — فيلا ذكية، حزمة تكييف، نطاق كهروميكانيك، أو مركز بيانات؟ اسألني أي شي أو اضغط اقتراح تحت.' } },
    { id: 'what', kw: { en: ['what do you do', 'who are you', 'about mecamac', 'services', 'what is mecamac', 'company'], ar: ['شو بتشتغلوا', 'مين انتو', 'عن ميكاماك', 'خدمات', 'شو ميكاماك', 'الشركة'] },
      a: { en: 'Mecamac is a Muscat-based electromechanical contractor with four disciplines under one roof: smart buildings (ABB KNX, LifeSmart, PIERRE, Yale, Intesis), HVAC (exclusive RUUD distributor for Oman), MEP contracting with our own Kingspan duct factory, and mission-critical data centres. Head office and factory in Al Misfah; Smart Experience Centre in Qurum.',
           ar: 'ميكاماك مقاول كهروميكانيكي مقره مسقط بأربعة تخصصات تحت سقف واحد: المباني الذكية (ABB KNX، LifeSmart، PIERRE، Yale، Intesis)، التكييف (الموزّع الحصري لـ RUUD في عُمان)، مقاولات الكهروميكانيك مع مصنع مجاري هواء Kingspan خاص بنا، ومراكز البيانات الحرجة. المركز الرئيسي والمصنع بالمسفاة، ومركز التجربة الذكية بالقرم.' },
      links: [{ en: 'Smart Buildings', ar: 'المباني الذكية', href: 'services/smart-building/index.html' }, { en: 'HVAC', ar: 'التكييف', href: 'services/hvac/index.html' }, { en: 'Contracting', ar: 'المقاولات', href: 'services/contracting/index.html' }, { en: 'Data Centres', ar: 'مراكز البيانات', href: 'services/data-center/index.html' }] },
    { id: 'smarthome', kw: { en: ['smart home', 'smart villa', 'home automation', 'automation', 'automate', 'knx', 'my villa', 'smart building', 'bms'], ar: ['منزل ذكي', 'بيت ذكي', 'فيلا ذكية', 'اتمتة', 'أتمتة', 'تحكم ذكي', 'فيلتي', 'مبنى ذكي', 'اوتوميشن'] },
      a: { en: 'We design, install and program complete smart homes: lighting scenes, blinds, climate, access, cameras and audio on one app and wall panels. For new builds we use wired ABB KNX; for finished homes LifeSmart or PIERRE wireless. Try the 3D simulator to see how your villa would behave, then send the plan to an engineer.',
           ar: 'نصمّم ونركّب ونبرمج منازل ذكية كاملة: مشاهد الإنارة، الستائر، التكييف، الدخول، الكاميرات والصوت على تطبيق واحد ولوحات حائطية. للمباني الجديدة نستخدم ABB KNX السلكي، وللمنازل الجاهزة LifeSmart أو PIERRE اللاسلكية. جرّب المحاكي ثلاثي الأبعاد لتشوف كيف بتتصرف فيلتك، وبعدها أرسل الخطة لمهندس.' },
      links: [{ en: 'Open the 3D simulator', ar: 'افتح المحاكي 3D', href: 'smart-villa/index.html' }] },
    { id: 'wired', kw: { en: ['wired', 'wireless', 'knx or', 'lifesmart or', 'difference', 'retrofit', 'existing home', 'finished', 'renovation', 'which system'], ar: ['سلكي', 'لاسلكي', 'الفرق', 'بيت جاهز', 'منزل جاهز', 'مسكون', 'تجديد', 'اي نظام', 'أي نظام'] },
      a: { en: 'Wired KNX (ABB) is the backbone for new builds and full refurbishments — every device on a bus, logic running locally for decades. Wireless (LifeSmart CoSS or PIERRE Wave) is the answer for finished homes: no chasing walls, installed in days, full app control. Many villas mix both. The honest rule: if the walls are still open, go wired.',
           ar: 'KNX السلكي (ABB) هو الأساس للمباني الجديدة والتجديدات الشاملة — كل جهاز على ناقل، والمنطق يعمل محلياً لعقود. اللاسلكي (LifeSmart CoSS أو PIERRE Wave) هو الحل للمنازل الجاهزة: بدون تكسير، يتركّب بأيام، وتحكم كامل بالتطبيق. كثير من الفلل تجمع الاثنين. القاعدة الصادقة: إذا الجدران لسا مفتوحة، اختر السلكي.' },
      links: [{ en: 'Compare wired and wireless', ar: 'قارن السلكي واللاسلكي', href: 'services/smart-building/index.html#choose' }] },
    { id: 'price', kw: { en: ['how much', 'cost', 'price', 'budget', 'estimate', 'quote', 'quotation', 'expensive', 'cheap', 'omr', 'rial'], ar: ['قديش', 'كم', 'سعر', 'تكلفة', 'كلفة', 'ميزانية', 'تقدير', 'عرض سعر', 'غالي', 'رخيص', 'ريال'] },
      a: { en: 'It depends on the size of the house, wired or wireless, and what you want to control. The 3D simulator gives you an approximate range in seconds from your built-up area and features — for budgeting only, not a quotation. An engineer confirms the final price after a site survey, and the consultation is free.',
           ar: 'بيعتمد على حجم البيت، سلكي أو لاسلكي، وشو بدك تتحكم فيه. المحاكي ثلاثي الأبعاد بيعطيك نطاقاً تقريبياً بثوانٍ من مساحتك ومميزاتك — لتقدير الميزانية فقط وليس عرض سعر. المهندس بيأكد السعر النهائي بعد معاينة الموقع، والاستشارة مجانية.' },
      links: [{ en: 'Get an indicative range', ar: 'احصل على نطاق تقديري', href: 'smart-villa/index.html' }, { en: 'Free consultation', ar: 'استشارة مجانية', href: 'contact/index.html#consult' }] },
    { id: 'showroom', kw: { en: ['showroom', 'experience centre', 'experience center', 'visit', 'qurum', 'demo', 'see it', 'try'], ar: ['شوروم', 'صالة العرض', 'صالة عرض', 'مركز التجربة', 'زيارة', 'القرم', 'اشوف', 'أشوف', 'اجرب', 'أجرب'] },
      a: { en: 'The Smart Experience Centre is at Bank Muscat Building, Qurum Commercial District, Muscat — a working environment where you operate the panels, locks, scenes and apps yourself. Open Sunday to Thursday 8:00–18:00 and Saturday 9:00–14:00. Pick a day and time on the booking page and an engineer confirms on WhatsApp.',
           ar: 'مركز التجربة الذكية في مبنى بنك مسقط، منطقة القرم التجارية، مسقط — بيئة حقيقية تشغّل فيها اللوحات والأقفال والمشاهد والتطبيقات بنفسك. مفتوح من الأحد إلى الخميس ٨:٠٠–١٨:٠٠ والسبت ٩:٠٠–١٤:٠٠. اختر اليوم والوقت من صفحة الحجز ويؤكدها المهندس على واتساب.' },
      links: [{ en: 'Book a visit', ar: 'احجز زيارة', href: 'contact/index.html#visit' }, { en: 'Directions & contact', ar: 'الموقع والتواصل', href: 'contact/index.html#find-us' }] },
    { id: 'office', kw: { en: ['head office', 'office', 'address', 'location', 'where are you', 'misfah', 'factory', 'warehouse'], ar: ['المركز الرئيسي', 'مكتب', 'عنوان', 'موقع', 'وينكم', 'المسفاة', 'مصنع', 'مستودع'] },
      a: { en: 'Head office, operations, factory and warehousing: Block 293, Way 9307, Al Misfah Industrial Area, Muscat (P.O. Box 1671, PC 133). The showroom is separate, in Qurum.',
           ar: 'المركز الرئيسي والعمليات والمصنع والمستودعات: مربع 293، سكة 9307، المسفاة الصناعية، مسقط (ص.ب 1671، الرمز 133). صالة العرض منفصلة في القرم.' },
      links: [{ en: 'Open in Google Maps', ar: 'افتح في خرائط Google', href: 'https://www.google.com/maps?q=Mecamac,+Al+Misfah+Industrial+Area,+Muscat,+Oman' }] },
    { id: 'contact', kw: { en: ['phone', 'number', 'call', 'whatsapp', 'email', 'contact', 'reach', 'talk to'], ar: ['رقم', 'هاتف', 'اتصال', 'اتصل', 'واتساب', 'ايميل', 'إيميل', 'بريد', 'تواصل', 'احكي'] },
      a: { en: 'Call or WhatsApp +968 7216 0022 or +968 9968 0012. Landline +968 2456 4868. Email info@mecamac.com. An engineer replies, not a call centre.',
           ar: 'اتصال أو واتساب: +968 7216 0022 أو +968 9968 0012. الخط الأرضي +968 2456 4868. البريد info@mecamac.com. اللي بيرد مهندس، مش مركز اتصال.' },
      links: [{ en: 'WhatsApp now', ar: 'واتساب الآن', href: 'https://wa.me/96872160022' }] },
    { id: 'hours', kw: { en: ['hours', 'open', 'opening', 'timing', 'when', 'friday', 'weekend'], ar: ['ساعات', 'دوام', 'مفتوح', 'اوقات', 'أوقات', 'الجمعة', 'متى'] },
      a: { en: 'Sunday to Thursday 8:00–18:00, Saturday 9:00–14:00, Friday closed. WhatsApp is read outside those hours too.',
           ar: 'الأحد إلى الخميس ٨:٠٠–١٨:٠٠، السبت ٩:٠٠–١٤:٠٠، الجمعة مغلق. الواتساب بنقراه خارج هالأوقات كمان.' } },
    { id: 'ruud', kw: { en: ['ruud', 'air conditioning', 'air conditioner', 'ac unit', 'vrf', 'split', 'ducted', 'cassette', 'chiller', 'cooling', 'hvac'], ar: ['رود', 'ruud', 'تكييف', 'مكيف', 'مكيّف', 'تبريد', 'سبليت', 'كاسيت', 'دكت', 'تشيلر'] },
      a: { en: 'Mecamac is the exclusive RUUD distributor for Oman — VRF, packaged, ducted, cassette and wall-mount units stocked in Muscat with factory warranty, plus RUUD Cloud Control to run the AC from your phone. We also design chilled-water plants and district-cooling connections for larger buildings.',
           ar: 'ميكاماك الموزّع الحصري لـ RUUD في عُمان — وحدات VRF ومجمّعة ومخفية وكاسيت وحائطية متوفرة بمسقط بضمان المصنع، مع RUUD Cloud Control لتشغيل التكييف من جوالك. كما نصمّم محطات المياه المبردة ووصلات التبريد المركزي للمباني الكبيرة.' },
      links: [{ en: 'RUUD range', ar: 'تشكيلة RUUD', href: 'services/hvac/index.html' }] },
    { id: 'duct', kw: { en: ['duct', 'ducting', 'kingspan', 'palduct', 'pre-insulated', 'fabrication', 'cnc'], ar: ['دكت', 'مجاري هواء', 'مجاري الهواء', 'كينغسبان', 'كنجسبان', 'معزول', 'تصنيع'] },
      a: { en: 'We run the only Kingspan-authorised PalDuct CNC facility in Oman, at Al Misfah: pre-insulated ductwork cut, closed and delivered from our own workshop, with fire-rated samples available for consultants.',
           ar: 'نشغّل المصنع الوحيد المعتمد من Kingspan لتقنية PalDuct في عُمان، بالمسفاة: مجاري هواء معزولة مسبقاً تُقطع وتُغلق وتُسلَّم من ورشتنا، مع عيّنات مقاومة للحريق للاستشاريين.' },
      links: [{ en: 'Ductwork & fabrication', ar: 'مجاري الهواء والتصنيع', href: 'services/hvac/index.html' }] },
    { id: 'mep', kw: { en: ['mep', 'contracting', 'contractor', 'electrical', 'plumbing', 'mechanical', 'subcontract', 'main contractor', 'tender', 'prequalification', 'fit-out', 'fit out'], ar: ['كهروميكانيك', 'مقاولات', 'مقاول', 'كهرباء', 'سباكة', 'ميكانيك', 'باطن', 'مناقصة', 'تأهيل', 'تشطيب'] },
      a: { en: 'We deliver MEP packages under main contractors and EPCs, or directly for owners: mechanical, electrical and public-health services designed as one set, installed by our own crews, and commissioned with INTU. Manufacturer authorisation letters and references are issued for tenders on request.',
           ar: 'ننفّذ حزم الكهروميكانيك تحت المقاولين الرئيسيين وشركات EPC، أو مباشرة للمُلّاك: أنظمة ميكانيكية وكهربائية وصحية مصمّمة كمجموعة واحدة، بفرقنا الخاصة، وتشغيل مع INTU. خطابات الاعتماد من المصنّعين والمراجع تُقدَّم للمناقصات عند الطلب.' },
      links: [{ en: 'Contracting & MEP', ar: 'المقاولات والكهروميكانيك', href: 'services/contracting/index.html' }] },
    { id: 'dc', kw: { en: ['data centre', 'data center', 'datacenter', 'server room', 'colocation', 'ups', 'crac', 'equinix', 'tier'], ar: ['مركز بيانات', 'مراكز بيانات', 'داتا سنتر', 'غرفة سيرفر', 'سيرفرات', 'يو بي اس'] },
      a: { en: 'Mission-critical power, cooling and containment for data halls and server rooms — delivered for Equinix, Omantel, Ooredoo and Detasad among others, with factory and site acceptance testing and integrated systems tests before handover.',
           ar: 'طاقة وتبريد واحتواء للقاعات الحرجة وغرف السيرفرات — نُفّذت لـ Equinix وOmantel وOoredoo وDetasad وغيرهم، مع اختبارات قبول في المصنع والموقع واختبار أنظمة متكامل قبل التسليم.' },
      links: [{ en: 'Data Centres', ar: 'مراكز البيانات', href: 'services/data-center/index.html' }] },
    { id: 'brands', kw: { en: ['brands', 'partners', 'abb', 'lifesmart', 'pierre', 'yale', 'intesis', 'authorised', 'authorized', 'distributor', 'dealer'], ar: ['علامات', 'شركاء', 'وكيل', 'وكالة', 'موزع', 'موزّع', 'معتمد', 'ابب', 'لايف سمارت', 'بيير', 'ييل'] },
      a: { en: 'Seven principal partnerships held directly: ABB (KNX system integrator), LifeSmart (wireless automation), PIERRE (smart home platform), Yale (access), Intesis by HMS (protocol gateways), RUUD (exclusive AC distributor) and Kingspan (PalDuct fabricator). Genuine equipment, factory warranty and stock in Muscat.',
           ar: 'سبع شراكات رئيسية مباشرة: ABB (مكامل أنظمة KNX)، LifeSmart (أتمتة لاسلكية)، PIERRE (منصة منزل ذكي)، Yale (الدخول)، Intesis من HMS (بوابات البروتوكولات)، RUUD (الموزّع الحصري للتكييف) وKingspan (تصنيع PalDuct). معدات أصلية وضمان مصنع ومخزون بمسقط.' },
      links: [{ en: 'Principal brands', ar: 'العلامات الرئيسية', href: 'index.html#brands' }] },
    { id: 'app', kw: { en: ['app', 'phone', 'mobile', 'remote', 'control from', 'from my phone', 'control it', 'away from home', 'alexa', 'google', 'voice control', 'siri'], ar: ['تطبيق', 'جوال', 'موبايل', 'عن بعد', 'من جوالي', 'من الجوال', 'أليكسا', 'اليكسا', 'قوقل', 'جوجل', 'تحكم صوتي', 'صوت'] },
      a: { en: 'Yes — every system ships with a maintained app: rooms, scenes, schedules, cameras and door status, with Alexa and Google Assistant voice control. Accounts are set up in your name and handed over documented, and local scenes keep running if the internet drops.',
           ar: 'نعم — كل نظام بيجي مع تطبيق محدّث: الغرف والمشاهد والجداول والكاميرات وحالة الباب، مع تحكم صوتي عبر Alexa وGoogle Assistant. الحسابات تُنشأ باسمك وتُسلَّم موثّقة، والمشاهد المحلية تستمر حتى لو انقطع الإنترنت.' } },
    { id: 'security', kw: { en: ['camera', 'cameras', 'security', 'lock', 'door lock', 'access', 'intercom', 'cctv', 'alarm'], ar: ['كاميرا', 'كاميرات', 'امن', 'أمن', 'قفل', 'اقفال', 'أقفال', 'انتركم', 'إنتركم', 'انذار', 'إنذار'] },
      a: { en: 'Yale smart locks, video door entry, cameras and sensors are integrated into the same scenes as lighting and climate — one press on "Away" locks the doors, drops the blinds and arms the cameras. See it running on real units in Qurum.',
           ar: 'أقفال Yale الذكية والإنتركم المرئي والكاميرات والمستشعرات مدمجة بنفس مشاهد الإنارة والتكييف — ضغطة وحدة على «خارج المنزل» بتقفل الأبواب وتنزّل الستائر وتفعّل الكاميرات. شوفها شغّالة على وحدات حقيقية بالقرم.' } },
    { id: 'energy', kw: { en: ['energy', 'saving', 'save', 'electricity', 'bill', 'efficient', 'consumption'], ar: ['طاقة', 'توفير', 'وفر', 'كهرباء', 'فاتورة', 'استهلاك'] },
      a: { en: 'Most of the saving comes from climate: scheduling and setback of AC when rooms are empty, plus lighting scenes that never leave a floor lit overnight. RUUD Cloud Control and KNX thermostats make that automatic; the estimator on the simulator page shows what is involved.',
           ar: 'أكبر توفير من التكييف: جدولة وتخفيض التبريد لما الغرف فاضية، ومشاهد إنارة ما بتترك طابقاً مضاءً طول الليل. RUUD Cloud Control وثيرموستات KNX بيخلّوا هالشي تلقائياً؛ والمقدّر بصفحة المحاكي بيوريك المطلوب.' } },
    { id: 'warranty', kw: { en: ['warranty', 'guarantee', 'maintenance', 'amc', 'service', 'support', 'after sales', 'after-sales'], ar: ['ضمان', 'صيانة', 'عقد صيانة', 'خدمة', 'دعم', 'ما بعد البيع'] },
      a: { en: 'Factory warranty on every principal-brand unit, a defects-liability period on our installation, and annual maintenance contracts (AMC) with our own service engineers in Muscat.',
           ar: 'ضمان مصنع على كل وحدة من العلامات الرئيسية، وفترة مسؤولية عيوب على تركيبنا، وعقود صيانة سنوية بمهندسي خدمة خاصين بنا في مسقط.' } },
    { id: 'projects', kw: { en: ['projects', 'references', 'clients', 'portfolio', 'experience', 'done before', 'st regis', 'hotel'], ar: ['مشاريع', 'مراجع', 'عملاء', 'اعمال', 'أعمال', 'خبرة', 'فندق'] },
      a: { en: 'More than 100 delivered packages: St. Regis Al Mouj, Equinix, Omantel and Ooredoo data centres, Oman Investment Authority, ASYAD, Cheltenham College, Dhofar Beach Resort and over fifty private villas. The projects page has the featured briefs and the full register.',
           ar: 'أكثر من ١٠٠ حزمة مسلّمة: سانت ريجيس الموج، مراكز بيانات Equinix وOmantel وOoredoo، جهاز الاستثمار العُماني، أسياد، كلية تشلتنهام، منتجع شاطئ ظفار، وأكثر من خمسين فيلا خاصة. صفحة المشاريع فيها المختارات والسجل الكامل.' },
      links: [{ en: 'Projects', ar: 'المشاريع', href: 'projects/index.html' }] },
    { id: 'areas', kw: { en: ['where do you work', 'salalah', 'sohar', 'duqm', 'nizwa', 'dubai', 'saudi', 'riyadh', 'gcc', 'outside muscat', 'cover'], ar: ['وين بتشتغلوا', 'صلالة', 'صحار', 'الدقم', 'نزوى', 'دبي', 'السعودية', 'الرياض', 'الخليج', 'خارج مسقط', 'تغطية'] },
      a: { en: 'All of Oman — Muscat, Sohar, Duqm, Nizwa, Salalah and everywhere between — with offices in Dubai, Riyadh and Beirut for GCC projects.',
           ar: 'كل عُمان — مسقط وصحار والدقم ونزوى وصلالة وما بينها — مع مكاتب في دبي والرياض وبيروت لمشاريع الخليج.' } },
    { id: 'simulator', kw: { en: ['simulator', '3d', 'simulation', 'demo house', 'virtual'], ar: ['محاكي', 'محاكاة', 'ثلاثي', '3d', 'افتراضي'] },
      a: { en: 'The Smart Villa Simulator lets you tap rooms in a 3D villa and control them from an ABB SmartTouch\u00ae 10 panel and an ABB Yurika keypad — scenes, blinds, climate and locks — then see the system you would need with an indicative budget and send it to an engineer. You can also hold your phone to the wall and see both devices at their real size.',
           ar: 'محاكي الفيلا الذكية بيخليك تضغط على الغرف بفيلا ثلاثية الأبعاد وتتحكم فيها من شاشة ABB SmartTouch\u00ae 10 ومفتاح ABB Yurika — مشاهد وستائر وتكييف وأقفال — وتشوف النظام اللي بتحتاجه مع ميزانية تقريبية وترسله لمهندس. وكمان فيك ترفع جوالك ع الحيط وتشوف الجهازين بحجمهم الحقيقي.' },
      links: [{ en: 'Open the simulator', ar: 'افتح المحاكي', href: 'smart-villa/index.html' }] },
    { id: 'consult', kw: { en: ['consultation', 'consult', 'meeting', 'engineer', 'book', 'appointment', 'survey', 'site visit'], ar: ['استشارة', 'اجتماع', 'مهندس', 'حجز', 'موعد', 'معاينة', 'زيارة موقع'] },
      a: { en: 'Consultations are free. Tell us who you are (owner, developer, consultant or main contractor) and what you need, and an engineer replies on WhatsApp — usually the same day. Site surveys in Muscat are arranged within the week.',
           ar: 'الاستشارة مجانية. قلّنا مين انت (مالك، مطوّر، استشاري أو مقاول رئيسي) وشو بدك، ومهندس بيرد عليك على واتساب — عادةً بنفس اليوم. معاينات المواقع بمسقط بتترتب خلال الأسبوع.' },
      links: [{ en: 'Start a consultation', ar: 'ابدأ استشارة', href: 'contact/index.html#consult' }] },
    { id: 'thanks', kw: { en: ['thanks', 'thank you', 'great', 'bye', 'goodbye', 'ok'], ar: ['شكرا', 'شكراً', 'مشكور', 'يعطيك العافية', 'باي', 'تمام', 'اوكي'] },
      a: { en: 'You are welcome. Whenever you are ready, an engineer is one WhatsApp message away.', ar: 'العفو. وقت ما تكون جاهز، المهندس على بُعد رسالة واتساب.' } }
  ];

  /* ---------- matching ---------- */
  function norm(s) {
    return String(s).toLowerCase()
      .replace(/[ً-ْـ]/g, '')             // tashkeel + tatweel
      .replace(/[إأآ]/g, 'ا').replace(/ة/g, 'ه').replace(/ى/g, 'ي')
      .replace(/[^\p{L}\p{N}\s]/gu, ' ').replace(/\s+/g, ' ').trim();
  }
  // tokens: Arabic "ال" prefixes stripped, English plurals folded — applied to the question and the keywords alike
  function tokens(s) {
    return norm(s).split(' ').filter(Boolean).map(function (w) {
      if (/^[\u0600-\u06FF]/.test(w)) return w.replace(/^(وال|بال|كال|فال|لل|ال)(?=.{3,})/, '');
      return w.length > 4 ? w.replace(/ies$/, 'y').replace(/(es|s)$/, '') : w;
    });
  }
  function tokMatch(a, b) {                       // question token vs keyword token
    if (a === b) return true;
    if (/[\u0600-\u06FF]/.test(b)) return (b.length >= 3 && a.indexOf(b) === 0) || (b.length >= 4 && a.indexOf(b) !== -1);   // مكتبكم / ومكتبنا
    return false;
  }
  function match(q) {
    var qt = tokens(q), best = null, bestScore = 0;
    KB.forEach(function (k) {
      var score = 0;
      ['en', 'ar'].forEach(function (l) {
        k.kw[l].forEach(function (w) {
          var kt = tokens(w); if (!kt.length) return;
          for (var i = 0; i + kt.length <= qt.length; i++) {
            var ok = true;
            for (var j = 0; j < kt.length; j++) if (!tokMatch(qt[i + j], kt[j])) { ok = false; break; }
            if (ok) { score += 2 + kt.length; break; }          // longer phrases weigh more
          }
        });
      });
      if (score > bestScore) { bestScore = score; best = k; }
    });
    return bestScore >= 3 ? best : null;                        // one real keyword hit is enough; noise falls through to a human
  }

  /* ---------- DOM ---------- */
  var ui = UI[L()];
  var fab = document.createElement('button');
  fab.className = 'cg-fab'; fab.type = 'button'; fab.setAttribute('aria-label', ui.open); fab.setAttribute('aria-expanded', 'false');
  fab.innerHTML = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 3a4 4 0 0 1 4 4v5a4 4 0 0 1-8 0V7a4 4 0 0 1 4-4z"/><path d="M5 11a7 7 0 0 0 14 0M12 18v3"/></svg><span class="cg-fab-ring"></span>';
  var panel = document.createElement('section');
  panel.className = 'cg-panel'; panel.setAttribute('aria-label', ui.title); panel.hidden = true;
  panel.innerHTML =
    '<header class="cg-head"><span class="cg-mark" aria-hidden="true"></span><div><b class="cg-title"></b><small class="cg-sub"></small></div>' +
    '<button class="cg-mute" type="button"></button><button class="cg-close" type="button" aria-label="Close">×</button></header>' +
    '<div class="cg-log" role="log" aria-live="polite"></div>' +
    '<div class="cg-chips"></div>' +
    '<form class="cg-form"><input class="cg-in" type="text" autocomplete="off" maxlength="300" aria-label="Ask the Mecamac concierge"/><button class="cg-lang" type="button"></button><button class="cg-mic" type="button"></button><button class="cg-send" type="submit"></button></form>';
  document.body.appendChild(fab); document.body.appendChild(panel);
  var log = panel.querySelector('.cg-log'), chips = panel.querySelector('.cg-chips'), form = panel.querySelector('.cg-form'),
      input = panel.querySelector('.cg-in'), micBtn = panel.querySelector('.cg-mic'), sendBtn = panel.querySelector('.cg-send'), langBtn = panel.querySelector('.cg-lang'),
      muteBtn = panel.querySelector('.cg-mute'), closeBtn = panel.querySelector('.cg-close');
  var history = [];     // {role:'user'|'bot', text}
  var muted = (function () { try { return localStorage.getItem('mecamac-cg-mute') === '1'; } catch (e) { return false; } })();
  var lastWasVoice = false, greeted = false;
  var sLang = L();          // language the mic listens in and the answer is spoken in — the visitor can flip it
  var warnedNoVoice = false;

  function applyUi() {
    ui = UI[L()]; A = L();
    panel.querySelector('.cg-title').textContent = ui.title; panel.querySelector('.cg-sub').textContent = ui.sub;
    input.setAttribute('placeholder', ui.ph); input.setAttribute('aria-label', ui.open); micBtn.setAttribute('aria-label', ui.mic); micBtn.title = ui.mic;
    sendBtn.setAttribute('aria-label', ui.send); sendBtn.textContent = ui.send;
    muteBtn.textContent = muted ? '🔇' : '🔊'; muteBtn.setAttribute('aria-label', muted ? ui.unmute : ui.mute); muteBtn.title = muted ? ui.unmute : ui.mute;
    closeBtn.setAttribute('aria-label', ui.close); fab.setAttribute('aria-label', ui.open);
    langBtn.textContent = sLang === 'ar' ? 'ع' : 'EN'; langBtn.title = ui.spk + ': ' + (sLang === 'ar' ? 'العربية' : 'English'); langBtn.setAttribute('aria-label', langBtn.title);
    micBtn.innerHTML = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 3a4 4 0 0 1 4 4v5a4 4 0 0 1-8 0V7a4 4 0 0 1 4-4z"/><path d="M5 11a7 7 0 0 0 14 0M12 18v3"/></svg>';
    chips.innerHTML = '';
    ui.chips.forEach(function (c) { var b = document.createElement('button'); b.type = 'button'; b.className = 'cg-chip'; b.textContent = c; b.addEventListener('click', function () { ask(c, false); }); chips.appendChild(b); });
  }
  function bubble(role, html) {
    var d = document.createElement('div'); d.className = 'cg-msg ' + role; d.innerHTML = html; log.appendChild(d); log.scrollTop = log.scrollHeight; return d;
  }
  function esc(s) { return String(s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }
  function href(h) { return /^https?:/.test(h) ? h : base + h; }
  function waLink(extra) {
    var l = A, lines = [l === 'ar' ? 'مرحباً ميكاماك، سؤال من موقعكم:' : 'Hello Mecamac, a question from your website:', ''];
    history.filter(function (m) { return m.role === 'user'; }).slice(-4).forEach(function (m) { lines.push('• ' + m.text); });
    if (extra) lines.push('• ' + extra);
    lines.push('', (l === 'ar' ? 'الصفحة: ' : 'Page: ') + location.href.split('#')[0]);
    return 'https://wa.me/' + CONCIERGE.wa + '?text=' + encodeURIComponent(lines.join('\n'));
  }
  function answerHtml(k) {
    var l = A, h = '<p>' + esc(k.a[l]) + '</p>';
    if (k.links) h += '<div class="cg-links">' + k.links.map(function (x) { return '<a href="' + href(x.href) + '"' + (/^https?:/.test(x.href) ? ' target="_blank" rel="noopener"' : '') + '>' + esc(x[l]) + '</a>'; }).join('') + '</div>';
    return h;
  }
  function fallbackHtml(q) {
    return '<p>' + esc(UI[A].fallback) + '</p><div class="cg-links"><a class="cg-wa" href="' + waLink(q) + '" target="_blank" rel="noopener">' + esc(UI[A].engineer) + '</a></div>';
  }
  /* ---------- speech out: Arabic needs a real Arabic voice, and the list loads late ---------- */
  var VOICES = [];
  function loadVoices() { try { VOICES = window.speechSynthesis.getVoices() || []; } catch (e) { VOICES = []; } }
  if ('speechSynthesis' in window) {
    loadVoices();
    if (typeof window.speechSynthesis.addEventListener === 'function') window.speechSynthesis.addEventListener('voiceschanged', loadVoices);
    else window.speechSynthesis.onvoiceschanged = loadVoices;
    setTimeout(loadVoices, 400); setTimeout(loadVoices, 1500);   // Chrome fills the list asynchronously
  }
  function pickVoice(l) {
    if (!VOICES.length) loadVoices();
    var want = l === 'ar' ? 'ar' : 'en';
    var cand = VOICES.filter(function (v) { return String(v.lang || '').toLowerCase().replace('_', '-').indexOf(want) === 0; });
    if (!cand.length) return null;
    var score = function (v) {
      var n = (v.name || '').toLowerCase(), lg = String(v.lang || '').toLowerCase().replace('_', '-'), sc = 0;
      if (/natural|neural|premium|enhanced|siri/.test(n)) sc += 6;
      if (/google/.test(n)) sc += 4;
      if (/microsoft/.test(n)) sc += 2;
      if (v.localService) sc += 1;
      if (want === 'ar' && /ar-(sa|xa|eg|ae|om|jo|kw|qa|bh|lb|ps|ma|dz|tn|ly|iq|ye|sy)/.test(lg)) sc += 2;
      if (want === 'en' && /en-(gb|ae|sa)/.test(lg)) sc += 2;
      return sc;
    };
    cand.sort(function (a, b) { return score(b) - score(a); });
    return cand[0];
  }
  function hasVoice(l) { return !!pickVoice(l); }
  // long answers are cut off by some engines — speak them sentence by sentence
  function chunks(text) {
    var parts = String(text).replace(/\s+/g, ' ').trim().split(/(?<=[.!?؟।\u061F\u06D4])\s+/), out = [], cur = '';
    parts.forEach(function (p) { if ((cur + ' ' + p).trim().length > 180) { if (cur) out.push(cur.trim()); cur = p; } else cur += ' ' + p; });
    if (cur.trim()) out.push(cur.trim());
    return out.length ? out : [String(text)];
  }
  // Speech synthesis has three well-known traps, and every answer has to get past all of them:
  //  · Chrome drops an utterance whose object is garbage-collected mid-sentence, so each one is
  //    held in `queue` until its own onend fires;
  //  · Chrome swallows a speak() issued in the same tick as cancel(), so the first chunk waits 90 ms;
  //  · Safari and iOS only start speaking after a real tap has "unlocked" the engine, which
  //    unlock() does on the first tap anywhere in the concierge.
  var queue = [], unlocked = false, keepAlive = null;
  function unlock() {
    if (unlocked || !('speechSynthesis' in window)) return;
    unlocked = true;
    try { var u = new SpeechSynthesisUtterance(''); u.volume = 0; window.speechSynthesis.speak(u); window.speechSynthesis.resume(); } catch (e) {}
  }
  function speakNow(text) {
    var l = A, v = pickVoice(l);
    if (l === 'ar' && !v) {                       // no Arabic voice on this device — say so once, do not read Arabic with an English voice
      if (!warnedNoVoice) { warnedNoVoice = true; bubble('bot', '<p>' + esc(UI[A].noArVoice) + '</p>').setAttribute('dir', 'rtl'); }
      return;
    }
    var clean = String(text).replace(/\+968\s?/g, '').replace(/[«»"]/g, '').replace(/<[^>]+>/g, ' ');
    var parts = chunks(clean);
    parts.forEach(function (part, i) {
      var u = new SpeechSynthesisUtterance(part);
      u.lang = v ? v.lang : (l === 'ar' ? 'ar-SA' : 'en-GB');
      if (v) { try { u.voice = v; } catch (e) { /* a rejected voice object must never silence the answer — lang alone still speaks */ } }
      u.rate = l === 'ar' ? 0.95 : 1; u.pitch = 1;
      queue.push(u);
      u.onend = u.onerror = function () { var k = queue.indexOf(u); if (k > -1) queue.splice(k, 1); if (!queue.length && keepAlive) { clearInterval(keepAlive); keepAlive = null; } };
      setTimeout(function () { try { window.speechSynthesis.speak(u); } catch (e) {} }, 90 + i * 30);
    });
    // Chrome desktop pauses long speech after ~15 s unless nudged; resume() is a no-op otherwise
    if (!keepAlive) keepAlive = setInterval(function () { try { window.speechSynthesis.resume(); } catch (e) {} }, 5000);
  }
  function speak(text) {
    if (muted || !CONCIERGE.speak || !('speechSynthesis' in window)) return;
    try {
      window.speechSynthesis.cancel(); queue.length = 0;
      // the voice list arrives asynchronously in Chrome: if it is still empty, give it a moment
      // before deciding there is no Arabic voice on this device
      if (!VOICES.length) { loadVoices(); }
      if (!VOICES.length) { setTimeout(function () { loadVoices(); speakNow(text); }, 350); }
      else speakNow(text);
    } catch (e) {}
  }
  function typing() { var d = bubble('bot', '<span class="cg-dots"><i></i><i></i><i></i></span>'); return d; }

  function ask(q, voice, forceLang) {
    q = String(q || '').trim(); if (!q) return;
    lastWasVoice = !!voice; A = forceLang || qLang(q);
    history.push({ role: 'user', text: q }); var ub = bubble('user', esc(q)); ub.setAttribute('dir', A === 'ar' ? 'rtl' : 'ltr');
    input.value = '';
    var t = typing();
    if (CONCIERGE.endpoint) {
      fetch(CONCIERGE.endpoint, { method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ lang: A, page: location.pathname, messages: history.slice(-8) }) })
        .then(function (r) { return r.json(); })
        .then(function (j) { t.setAttribute('dir', A === 'ar' ? 'rtl' : 'ltr'); t.innerHTML = '<p>' + esc(j.reply || '') + '</p>' + (j.handoff ? '<div class="cg-links"><a class="cg-wa" href="' + waLink() + '" target="_blank" rel="noopener">' + esc(UI[A].engineer) + '</a></div>' : ''); history.push({ role: 'bot', text: j.reply || '' }); speak(j.reply || ''); log.scrollTop = log.scrollHeight; })
        .catch(function () { local(); });
    } else setTimeout(local, 380 + Math.min(900, q.length * 12));
    function local() {
      var k = match(q);
      t.setAttribute('dir', A === 'ar' ? 'rtl' : 'ltr');
      t.innerHTML = k ? answerHtml(k) : fallbackHtml(q);
      // every answer ends with a way to reach a person
      if (k && k.id !== 'contact' && k.id !== 'thanks' && k.id !== 'greet') t.innerHTML += '<a class="cg-handoff" href="' + waLink() + '" target="_blank" rel="noopener">' + esc(UI[A].engineer) + ' ↗</a>';
      history.push({ role: 'bot', text: k ? k.a[A] : UI[A].fallback });
      speak(k ? k.a[A] : UI[A].fallback);
      log.scrollTop = log.scrollHeight;
    }
  }

  /* ---------- voice input ---------- */
  var SR = window.SpeechRecognition || window.webkitSpeechRecognition;
  var rec = null, listening = false;
  function startListening() {
    if (!SR) { bubble('bot', '<p>' + esc(ui.nomic) + '</p>'); return; }
    if (listening) { try { rec.stop(); } catch (e) {} return; }
    rec = new SR(); rec.lang = sLang === 'ar' ? 'ar-SA' : 'en-GB'; rec.interimResults = true; rec.maxAlternatives = 1;   // the chip next to the mic picks the language
    var finalText = '';
    rec.onstart = function () { listening = true; micBtn.classList.add('on'); input.setAttribute('placeholder', ui.listening); };
    rec.onresult = function (e) {
      var s = '';
      for (var i = e.resultIndex; i < e.results.length; i++) { s += e.results[i][0].transcript; if (e.results[i].isFinal) finalText += e.results[i][0].transcript; }
      input.value = finalText || s;
    };
    rec.onerror = function () { stopListening(); };
    rec.onend = function () { stopListening(); var q = (finalText || input.value).trim(); if (q) ask(q, true, sLang); };
    try { rec.start(); } catch (e) { stopListening(); }
  }
  function stopListening() { listening = false; micBtn.classList.remove('on'); input.setAttribute('placeholder', ui.ph); }

  /* ---------- open / close ---------- */
  function open() {
    applyUi(); panel.hidden = false; fab.setAttribute('aria-expanded', 'true'); fab.classList.add('open'); document.body.classList.add('cg-open');
    if (!greeted) { greeted = true; bubble('bot', '<p>' + esc(ui.hi) + '</p>'); history.push({ role: 'bot', text: ui.hi }); }
    setTimeout(function () { input.focus({ preventScroll: true }); }, 60);
  }
  function close() { panel.hidden = true; fab.setAttribute('aria-expanded', 'false'); fab.classList.remove('open'); document.body.classList.remove('cg-open'); if (listening) try { rec.stop(); } catch (e) {} if ('speechSynthesis' in window) window.speechSynthesis.cancel(); fab.focus(); }
  fab.addEventListener('click', function () { unlock(); panel.hidden ? open() : close(); });
  closeBtn.addEventListener('click', close);
  document.addEventListener('keydown', function (e) { if (e.key === 'Escape' && !panel.hidden) close(); });
  form.addEventListener('submit', function (e) { e.preventDefault(); unlock(); ask(input.value, false); });
  langBtn.addEventListener('click', function () {
    sLang = sLang === 'ar' ? 'en' : 'ar';
    langBtn.textContent = sLang === 'ar' ? 'ع' : 'EN';
    langBtn.title = ui.spk + ': ' + (sLang === 'ar' ? 'العربية' : 'English'); langBtn.setAttribute('aria-label', langBtn.title);
    if (listening) { try { rec.stop(); } catch (e) {} }
  });
  micBtn.addEventListener('click', function () { unlock(); startListening(); });
  muteBtn.addEventListener('click', function () {
    unlock(); muted = !muted; applyUi();
    try { localStorage.setItem('mecamac-cg-mute', muted ? '1' : '0'); } catch (e) {}
    if (muted && 'speechSynthesis' in window) window.speechSynthesis.cancel();
  });
  document.addEventListener('langchange', function () { applyUi(); });
  if (!SR) fab.classList.add('text-only');
  applyUi();

  // the simulator can hand a plan to the concierge for context
  window.MECAMAC_CONCIERGE = { open: open, ask: ask, config: CONCIERGE };
  // any <a data-concierge> / <button data-concierge="question"> anywhere on the page opens the concierge
  document.addEventListener('click', function (e) {
    var el = e.target.closest && e.target.closest('[data-concierge]'); if (!el) return;
    e.preventDefault(); open();
    var q = el.getAttribute('data-concierge'); if (q) setTimeout(function () { ask(q, false); }, 250);
  });
})();
