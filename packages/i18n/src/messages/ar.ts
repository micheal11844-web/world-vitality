import type { Messages } from "./en.js";

/**
 * Arabic (Modern Standard Arabic, right-to-left). AI-drafted; NOT yet
 * reviewed by a native speaker — `LOCALES` marks it `draft` and the
 * language picker says so. Plurals use all six CLDR categories.
 * Product and brand names (World Vitality, Orbi) stay in Latin script.
 */
export const ar: Messages = {
  // ---- common
  "common.continue": "متابعة",
  "common.back": "رجوع",
  "common.cancel": "إلغاء",
  "common.skipForNow": "تخطّي الآن",
  "common.change": "تغيير",
  "common.saved": "تم الحفظ.",
  "common.signInAgain": "يُرجى تسجيل الدخول مرة أخرى للمتابعة.",
  "common.genericError": "حدث خطأ ما. يُرجى المحاولة مرة أخرى.",
  "common.nothingHere": "لا يوجد شيء هنا.",
  "common.listSeparator": "، ",

  // ---- app chrome
  "chrome.viewGlobe": "عرض الكرة الأرضية",
  "chrome.settings": "الإعدادات",
  "chrome.signOut": "تسجيل الخروج",
  "chrome.sidebar.primary": "الرئيسي",
  "chrome.sidebar.expand": "توسيع الشريط الجانبي (Ctrl+B)",
  "chrome.sidebar.collapse": "طيّ الشريط الجانبي (Ctrl+B)",
  "chrome.sidebar.expandItem": "توسيع {item}",
  "chrome.sidebar.collapseItem": "طيّ {item}",
  "chrome.aiPanel.open": "فتح لوحة الذكاء الاصطناعي",
  "chrome.aiPanel.collapse": "طيّ لوحة الذكاء الاصطناعي",
  "chrome.aiPanel.region": "مساعد الذكاء الاصطناعي",
  "chrome.aiPanel.title": "المساعد",
  "chrome.search.label": "البحث في World Vitality",
  "chrome.search.placeholder": "ابحث عن أماكن ومواضيع…",
  "chrome.search.hint": "بحث (اضغط / للتركيز)",
  "chrome.search.suggestions": "اقتراحات البحث",
  "chrome.search.noQuickMatches": "لا توجد نتائج سريعة — اضغط Enter للبحث عن «{query}»",
  "chrome.search.pressEnter": "اضغط Enter لعرض كل النتائج عن «{query}»",
  "chrome.search.kind.workspace": "مساحة عمل",
  "chrome.search.kind.page": "صفحة",
  "chrome.search.kind.setting": "إعداد",
  "chrome.search.kind.tool": "أداة",
  "chrome.search.kind.place": "مكان",
  "chrome.bell.label": "الإشعارات",
  "chrome.bell.unread":
    "{count, plural, zero {لا إشعارات غير مقروءة} one {إشعار واحد غير مقروء} two {إشعاران غير مقروءين} few {# إشعارات غير مقروءة} many {# إشعارًا غير مقروء} other {# إشعار غير مقروء}}",
  "chrome.bell.critical":
    "{count, plural, zero {لا إشعارات حرجة} one {إشعار حرج واحد} two {إشعاران حرجان} few {# إشعارات حرجة} many {# إشعارًا حرجًا} other {# إشعار حرج}}",

  // ---- navigation
  "nav.workspaces": "مساحات العمل",
  "nav.account": "الحساب",
  "nav.home": "الرئيسية",
  "nav.notifications": "الإشعارات",
  "nav.settings": "الإعدادات",
  "nav.map": "الخريطة",
  "nav.team": "الفريق",
  "nav.fieldOverview": "نظرة عامة على الحقول",
  "nav.fieldReport": "تقرير الحقل",
  "nav.currentConditions": "الظروف الحالية",
  "nav.siteRisk": "مخاطر الموقع",
  "nav.generationOutlook": "توقعات التوليد",
  "nav.datasetExplorer": "مستكشف البيانات",
  "nav.routeRisk": "مخاطر المسار",
  "nav.activeAlerts": "التنبيهات النشطة",
  "nav.jurisdictionOverview": "نظرة عامة على النطاق الإداري",
  "nav.formalReport": "تقرير رسمي",
  "nav.underwritingRiskContext": "سياق المخاطر للاكتتاب",
  "nav.auditableReport": "تقرير قابل للتدقيق",
  "nav.explainThisData": "اشرح هذه البيانات",
  "nav.lessonPlan": "خطة الدرس",

  // ---- workspaces
  "workspace.agriculture.name": "الزراعة",
  "workspace.agriculture.description": "رطوبة التربة والطقس وظروف الحقول.",
  "workspace.weather.name": "الطقس والمناخ",
  "workspace.weather.description": "الظروف الحالية وحالة درجات الحرارة في مواقعك.",
  "workspace.construction.name": "البناء والتشييد",
  "workspace.construction.description": "حالة مخاطر الموقع للأنشطة الحساسة للطقس.",
  "workspace.renewable-energy.name": "الطاقة المتجددة",
  "workspace.renewable-energy.description": "توقعات توليد طاقة الرياح لأصولك.",
  "workspace.research.name": "البحث",
  "workspace.research.description": "استكشف البيانات البيئية الخام مع مصدرها الكامل.",
  "workspace.logistics.name": "اللوجستيات والشحن",
  "workspace.logistics.description": "حالة مخاطر المسار للشحنات الحساسة للطقس.",
  "workspace.disaster-monitoring.name": "رصد الكوارث",
  "workspace.disaster-monitoring.description":
    "تنبيهات رسمية مباشرة من هيئة الأرصاد الجوية الوطنية الأمريكية (الولايات المتحدة فقط).",
  "workspace.government-ngos.name": "الحكومات والمنظمات غير الحكومية",
  "workspace.government-ngos.description":
    "نظرة عامة متعددة المجالات على النطاق الإداري والتقارير.",
  "workspace.insurance.name": "التأمين",
  "workspace.insurance.description": "سياق المخاطر للاكتتاب وتقارير قابلة للتدقيق.",
  "workspace.education.name": "التعليم",
  "workspace.education.description":
    "شروحات للبيانات حسب المستوى الدراسي وخطط دروس نموذجية للمعلمين.",

  // ---- roles
  "role.admin_owner": "المالك / المسؤول",
  "role.operational_user": "مستخدم تشغيلي",
  "role.scoped_field_user": "مستخدم ميداني (محدود)",
  "role.viewer_external": "مشاهد",

  // ---- personas
  "persona.farmer.label": "مزارع",
  "persona.farmer.description": "أزرع المحاصيل أو أعتني بالأرض.",
  "persona.builder.label": "بنّاء",
  "persona.builder.description": "أخطط لأعمال البناء أو أديرها.",
  "persona.energy.label": "الطاقة",
  "persona.energy.description": "أعمل في طاقة الرياح أو الطاقة الشمسية.",
  "persona.shipping.label": "الشحن",
  "persona.shipping.description": "أنقل البضائع برًا أو بحرًا أو جوًا.",
  "persona.responder.label": "الاستجابة للطوارئ",
  "persona.responder.description": "أتابع الفيضانات والحرائق وغيرها من المخاطر.",
  "persona.public-sector.label": "جهة حكومية أو منظمة غير حكومية",
  "persona.public-sector.description": "أخدم مجتمعًا أو منطقة أو برنامجًا.",
  "persona.insurer.label": "شركة تأمين",
  "persona.insurer.description": "أقيّم المخاطر البيئية أو أسعّرها.",
  "persona.researcher.label": "باحث",
  "persona.researcher.description": "أحلل البيانات البيئية.",
  "persona.learner.label": "طالب أو معلم",
  "persona.learner.description": "أتعلم أو أعلّم باستخدام بيانات حقيقية.",
  "persona.weather.label": "متابع للطقس",
  "persona.weather.description": "أتابع الطقس والمناخ.",
  "persona.curious.label": "مجرد فضول",
  "persona.curious.description": "أريد أن أتجوّل في أنحاء الكوكب.",

  // ---- dashboard
  "dashboard.yourPlace": "مكانك",
  "dashboard.yourWorkspaces": "مساحات عملك",
  "dashboard.changeRoleOrPlace": "غيّر دورك أو مكانك",
  "dashboard.addPlacePrompt": "أضف مكانك لترى ظروفه المباشرة هنا.",
  "dashboard.setItUp": "إعداده",
  "dashboard.recommended": "موصى به لك",
  "dashboard.insightGaps":
    "{count, plural, zero {لا توجد أيام بلا بيانات.} one {يوم واحد لم تتوفر عنه بيانات.} two {يومان لم تتوفر عنهما بيانات.} few {# أيام لم تتوفر عنها بيانات.} many {# يومًا لم تتوفر عنها بيانات.} other {# يوم لم تتوفر عنها بيانات.}}",
  "dashboard.insightFailed": "تعذّر تحميل الظروف المباشرة لمكانك الآن. ستعود في زيارتك القادمة.",
  "dashboard.tutorial.welcomeTitle": "مرحبًا، أنا Orbi",
  "dashboard.tutorial.welcomeBody":
    "سأكون موجودًا لمساعدتك على التعرّف على التطبيق. لنلقِ نظرة سريعة.",
  "dashboard.tutorial.workspacesTitle": "مساحات عملك",
  "dashboard.tutorial.workspacesBody":
    "كل بطاقة أدناه هي مساحة عمل: مجموعة مركّزة من البيانات والأدوات لمجال واحد، مثل الزراعة. انقر على إحداها للدخول.",
  "dashboard.tutorial.aiTitle": "لوحة الذكاء الاصطناعي",
  "dashboard.tutorial.aiBody":
    "داخل أي مساحة عمل، افتح لوحة الذكاء الاصطناعي لتسأل عن بياناتها. وهي تخبرك دائمًا بمدى ثقتها — ولا تقدّم أبدًا تخمينًا في صورة حقيقة.",
  "dashboard.critical.label": "حرج",
  "dashboard.critical.region": "تنبيه حرج",
  "dashboard.critical.openFull": "افتح الإشعارات للاطلاع على النص الكامل",
  "dashboard.critical.openMore":
    "افتح الإشعارات — {count, plural, one {إشعار حرج آخر} two {إشعاران حرجان آخران} few {# إشعارات حرجة أخرى} many {# إشعارًا حرجًا آخر} other {# إشعار حرج آخر}}",

  // ---- welcome
  "welcome.step": "الخطوة {current} من {total}",
  "welcome.role.title": "بأي صفة أنت هنا؟",
  "welcome.role.intro":
    "أنا Orbi. اختر ما يناسبك أكثر وسأبدأ بك من المكان المناسب — يمكنك تغييره في أي وقت من الإعدادات.",
  "welcome.role.legend": "دورك",
  "welcome.place.title": "ما المكان الأهم بالنسبة لك؟",
  "welcome.place.intro":
    "سأعرض لك ظروفه الفعلية فورًا. هذا هو الشيء الوحيد الذي أطلبه، ويبقى في حسابك — يمكنك تغييره أو إزالته من الإعدادات.",
  "welcome.place.inputLabel": "البلدة أو المدينة أو المنطقة",
  "welcome.place.inputPlaceholder": "مثال: إبادان",
  "welcome.place.search": "بحث",
  "welcome.place.choose": "اختر المكان الصحيح",
  "welcome.place.current": "الحالي: {place}. ابحث أعلاه لتغييره.",
  "welcome.place.showMe": "أرني",
  "welcome.place.skipPlace": "تخطّي المكان",
  "welcome.insight.title": "{place}، الآن",
  "welcome.insight.titleFallback": "مكانك، الآن",
  "welcome.insight.fetching": "جارٍ جلب البيانات المباشرة…",
  "welcome.insight.failed": "تعذّر تحميل البيانات المباشرة الآن.",
  "welcome.insight.takeMeTo": "خذني إلى {destination}",
  "welcome.insight.takeMeToExplorer": "خذني إلى المستكشف",

  // ---- notifications
  "notifications.title": "الإشعارات",
  "notifications.markAllRead": "تعيين الكل كمقروء",
  "notifications.preferences": "التفضيلات",
  "notifications.markRead": "تعيين كمقروء",
  "notifications.dismiss": "تجاهل",
  "notifications.view": "عرض",
  "notifications.checkAgain": "تحقق مرة أخرى",
  "notifications.setHomePlace": "حدّد مكان إقامتك",
  "notifications.fullOfficialText": "النص الرسمي الكامل",
  "notifications.unread": "غير مقروء",
  "notifications.inboxEmpty": "صندوق الوارد فارغ.",
  "notifications.loadFailed": "تعذّر تحميل إشعاراتك الآن. حدّث الصفحة للمحاولة مرة أخرى.",
  "notifications.tier.critical": "حرجة",
  "notifications.tier.alert": "تنبيهات",
  "notifications.tier.info": "معلوماتية",
  "notifications.tag.critical": "حرج",
  "notifications.tag.alert": "تنبيه",
  "notifications.tag.info": "معلومة",
  "notifications.status.noPlace": "تُعرض تنبيهات الطقس الرسمية لمكان إقامتك، ولم تحدّد مكانًا بعد.",
  "notifications.status.outOfCoverage":
    "تأتي التنبيهات الرسمية هنا من هيئة الأرصاد الجوية الوطنية الأمريكية، التي تغطي الولايات المتحدة وأقاليمها. يقع {place} خارج هذه المنطقة، لذا لا يُعرض أي تنبيه — وهذا لا يعني أنه لا يحدث شيء هناك.",
  "notifications.status.lastChecked": "آخر فحص: {ago}.",
  "notifications.status.showing":
    "تُعرض تنبيهات رسمية من هيئة الأرصاد الجوية الوطنية بخصوص {place}.",
  "notifications.status.none":
    "لا تُعرض أي تنبيهات رسمية من هيئة الأرصاد الجوية الوطنية بخصوص {place}.",
  "notifications.status.failed":
    "تعذّر الاتصال بهيئة الأرصاد الجوية الوطنية الآن، لذلك قد توجد تنبيهات رسمية لا تظهر هنا. في أي أمر عاجل، استخدم المصادر الرسمية المحلية.",
  "notifications.status.failedPlace":
    "تعذّر الاتصال بهيئة الأرصاد الجوية الوطنية الآن، لذلك قد توجد تنبيهات رسمية بخصوص {place} لا تظهر هنا. في أي أمر عاجل، استخدم المصادر الرسمية المحلية.",
  "notifications.status.lastSuccess": "آخر فحص ناجح: {ago}.",
  "notifications.officialEnglishNote":
    "يُعرض نص التنبيهات الرسمية تمامًا كما أصدرته هيئة الأرصاد الجوية الوطنية، باللغة الإنجليزية — فهو غير مترجم حتى لا يمكن تغيير أي شيء في رسالة طوارئ.",
  "notifications.footnote":
    "يعرض World Vitality التنبيهات الرسمية فقط أثناء فتحه — ولا يرسل بعد إشعارات فورية أو رسائل نصية أو بريدًا إلكترونيًا. في حالات الطوارئ، اتبع تعليمات السلطات المحلية.",
  "notifications.msg.someone": "شخص ما",
  "notifications.msg.fieldComment.title": "علّق {who} على {field}",
  "notifications.msg.memberAdded.title": "أصبح لديك الآن وصول إلى {workspace}",
  "notifications.msg.memberAdded.body": "دورك هناك: {role}.",

  // ---- settings
  "settings.title": "الإعدادات",
  "settings.profile.title": "الملف الشخصي",
  "settings.profile.email": "البريد الإلكتروني",
  "settings.profile.displayName": "الاسم المعروض",
  "settings.profile.displayNameHelp": "يظهر لزملائك في مساحات عملك.",
  "settings.profile.save": "حفظ الاسم",
  "settings.profile.memberSince": "عضو منذ {date}.",
  "settings.roleAndPlace.title": "دورك ومكانك",
  "settings.roleAndPlace.notSetUp":
    "لم تُعدّ هذا بعد. أخبرني من أنت وما المكان الذي يهمّك، وسأعرض ظروفه المباشرة في لوحتك ومساحات عملك.",
  "settings.roleAndPlace.role": "الدور:",
  "settings.roleAndPlace.homePlace": "مكان الإقامة:",
  "settings.roleAndPlace.notSet": "غير محدد",
  "settings.roleAndPlace.removed": "تمت إزالته",
  "settings.roleAndPlace.setUp": "إعداد",
  "settings.roleAndPlace.remove": "إزالة مكاني",
  "settings.language.title": "اللغة",
  "settings.language.label": "لغة القوائم والرسائل",
  "settings.language.draftNote":
    "اللغات غير الإنجليزية يكتبها الذكاء الاصطناعي ولم يراجعها متحدث أصلي بعد — وإذا بدا شيء غير سليم، فالإنجليزية متاحة دائمًا.",
  "settings.language.scopeNote":
    "ما زالت صفحات مساحات العمل وشروحات البيانات والتنبيهات الرسمية بالإنجليزية في الوقت الحالي.",
  "settings.language.draftTag": "مسودة",
  "settings.language.saved": "تم تحديث اللغة.",
  "settings.language.failed": "تعذّر تغيير اللغة. يُرجى المحاولة مرة أخرى.",
  "settings.notifications.title": "الإشعارات",
  "settings.notifications.loadFailed":
    "تعذّر تحميل إعدادات الإشعارات الآن. حدّث الصفحة للمحاولة مرة أخرى.",
  "settings.notifications.officialLegend": "تنبيهات الطقس الرسمية لمكان إقامتك",
  "settings.notifications.showAll": "عرضها كلها، بما في ذلك الإشعارات والبيانات الطفيفة",
  "settings.notifications.alertsOnly": "التنبيهات والحرجة فقط — تخطَّ الإشعارات الطفيفة",
  "settings.notifications.criticalAlways":
    "التنبيهات الحرجة المتعلقة بسلامة الأرواح تُعرض دائمًا ولا يمكن إيقافها.",
  "settings.notifications.collaboration": "أبلغني عندما يعلّق زميل على حقل أنشأته",
  "settings.notifications.inAppNote":
    "تظهر الإشعارات داخل التطبيق فقط — لا يرسل World Vitality إشعارات فورية أو رسائل نصية أو بريدًا إلكترونيًا بعد، ولا يتحقق من التنبيهات الرسمية إلا أثناء فتحه. راجع",
  "settings.notifications.center": "مركز الإشعارات",
  "settings.notifications.save": "حفظ إعدادات الإشعارات",
  "settings.notifications.saveFailed": "تعذّر حفظ إعدادات الإشعارات. يُرجى المحاولة مرة أخرى.",
  "settings.workspaces.title": "مساحات عملك",
  "settings.workspaces.none": "لست عضوًا في أي مساحة عمل بعد.",
  "settings.workspaces.limited": "(مقتصر على عناصر محددة)",
  "settings.download.title": "نزّل بياناتك",
  "settings.download.body":
    "نقرة واحدة دون انتظار: ملف JSON يحتوي على ملفك الشخصي ودورك ومكان إقامتك وإعدادات الإشعارات وصندوق الوارد وعضوياتك في مساحات العمل وكل ما أنشأته (الحقول والعقارات والمواقع) والتعليقات التي كتبتها. لا يتضمن بيانات أشخاص آخرين ولا القراءات البيئية العامة، ويذكر الملف ذلك.",
  "settings.download.button": "تنزيل بياناتي",
  "settings.delete.title": "احذف حسابك",
  "settings.delete.body":
    "يؤدي هذا إلى حذف حسابك وعضوياتك وإشعاراتك والتعليقات التي كتبتها نهائيًا وفورًا. وإذا كنت مالك مؤسستك، فتُحذف أيضًا الحقول والعقارات والمواقع المحفوظة فيها (ولا يمكن ذلك إلا بعد إزالة جميع الأعضاء الآخرين منها؛ ولإبقائها كما هي، انقل ملكيتها أولًا إلى أحد أعضائها). وإذا كنت عضوًا في مؤسسة شخص آخر، فما أضفتَه يبقى هناك دون اسمك. لا يمكن التراجع عن ذلك؛ نزّل بياناتك أولًا إذا أردت نسخة.",
  "settings.delete.confirmLabel": "اكتب {word} للتأكيد",
  "settings.delete.button": "حذف حسابي",

  // ---- search
  "search.title": "البحث",
  "search.resultsFor": "نتائج البحث عن «{query}»",
  "search.empty.title": "ابحث عن أي شيء",
  "search.empty.description":
    "جرّب مكانًا أو موضوعًا أو صفحة — على سبيل المثال: {examples}. اضغط / في أي مكان للانتقال إلى مربع البحث.",
  "search.question.title": "لا أستطيع الإجابة عن هذا السؤال مباشرةً",
  "search.question.body":
    "يعثر البحث على مساحات العمل والصفحات والأماكن. ليس لدي مصدر موثوق للأسئلة المفتوحة، لذا لن أخمّن. إليك مواضع أجزاء سؤالك.",
  "search.question.bodyWithPlace":
    "يعثر البحث على مساحات العمل والصفحات والأماكن. ليس لدي مصدر موثوق للأسئلة المفتوحة، لذا لن أخمّن. إليك مواضع أجزاء سؤالك، بما في ذلك «{place}».",
  "search.workspacesAndPages": "مساحات العمل والصفحات",
  "search.placesMatching": "أماكن مطابقة لـ«{place}»",
  "search.places": "الأماكن",
  "search.nothingMatched": "لا شيء يطابق «{query}»",
  "search.nothingMatchedHelp":
    "جرّب اسم مكان، أو موضوعًا مثل الفيضان أو الطاقة الشمسية، أو صفحة مثل الفريق أو الإعدادات.",
  "search.placesFailed":
    "البحث عن الأماكن غير متاح الآن، لذا تُعرض مساحات العمل والصفحات فقط. حاول مرة أخرى بعد قليل.",
  "search.signedOutNote": "تتطلب مساحات العمل حسابًا. تُفتح الأماكن في المستكشف العام بلا حساب.",
  "search.signIn": "سجّل الدخول لفتح مساحات العمل",

  // ---- search index (page names the search box finds)
  "searchIndex.dashboard.label": "لوحة التحكم الرئيسية",
  "searchIndex.dashboard.description": "مساحات عملك في مكان واحد",
  "searchIndex.explorer.label": "المستكشف العام",
  "searchIndex.explorer.description": "ابحث عن أي مكان على الأرض — دون حاجة إلى حساب",
  "searchIndex.globe.label": "الكرة الأرضية",
  "searchIndex.globe.description": "عرض ثلاثي الأبعاد للكوكب",
  "searchIndex.notifications.label": "الإشعارات",
  "searchIndex.notifications.description": "تنبيهات مكان إقامتك والنشاط في مساحات عملك",
  "searchIndex.notificationPrefs.label": "تفضيلات الإشعارات",
  "searchIndex.notificationPrefs.description": "اختر التنبيهات والنشاط الذي تراه",
  "searchIndex.settings.label": "الإعدادات",
  "searchIndex.settings.description": "ملفك الشخصي وحسابك",
  "searchIndex.export.label": "تنزيل بياناتي",
  "searchIndex.export.description": "تصدير بنقرة واحدة لكل ما يرتبط بحسابك",
  "searchIndex.delete.label": "حذف حسابي",
  "searchIndex.delete.description": "إزالة حسابك نهائيًا",

  // ---- assistant panel empty state
  "chrome.aiPanel.emptyTitle": "لا توجد محادثة نشطة",
  "chrome.aiPanel.emptyBody": "افتح مساحة عمل لتسأل عن بياناتها.",

  // ---- errors shown by form actions (these are produced on the server)
  "errors.typeTwoLetters": "اكتب حرفين على الأقل من اسم بلدة أو مدينة أو منطقة.",
  "errors.noPlaceFound":
    "لم يتم العثور على مكان يطابق «{query}». جرّب تهجئة مختلفة أو مدينة قريبة.",
  "errors.placeLookupFailed": "تعذّر البحث عن الأماكن الآن. يُرجى المحاولة مرة أخرى.",
  "errors.pickRoleAndPlace": "اختر أولًا من أنت ومكانًا.",
  "errors.liveDataFailed":
    "تعذّر جلب البيانات المباشرة لـ{place} الآن. يمكنك المتابعة — ستُحمَّل في مساحة عملك.",
  "errors.invalidRole": "هذا الدور ليس من الخيارات المتاحة.",
  "errors.invalidPlace": "هذا المكان غير صالح. يُرجى البحث عنه مرة أخرى.",
  "errors.saveFailed": "تعذّر الحفظ الآن. يُرجى المحاولة مرة أخرى.",
  "errors.removeFailed": "تعذّرت الإزالة الآن. يُرجى المحاولة مرة أخرى.",
  "errors.weatherServiceUnreachable": "تعذّر الاتصال بخدمة الطقس الآن. يُرجى المحاولة مرة أخرى.",
  "errors.nameTooLong": "اجعل اسمك أقل من {max} حرفًا.",
  "errors.sessionExpired": "انتهت جلستك. يُرجى تسجيل الدخول مرة أخرى.",
  "errors.nameSaveFailed": "تعذّر حفظ اسمك. يُرجى المحاولة مرة أخرى.",
  "errors.typeToConfirm": "اكتب {word} للتأكيد.",
  "errors.deleteFailed": "تعذّر حذف حسابك. يُرجى المحاولة مرة أخرى.",
  "errors.deleteOrganizationHasMembers":
    "ما زال لدى مؤسستك أعضاء آخرون ({count}). انقل ملكيتها إلى أحدهم، أو أزِلهم من صفحة «الفريق»، ثم احذف حسابك.",

  // ---- plan & billing (v95)
  "billing.title": "الخطة والفوترة",
  "billing.back": "العودة إلى الإعدادات",
  "billing.seePlans": "عرض الخطط",
  "billing.plan.basic": "الأساسية",
  "billing.plan.standard": "القياسية",
  "billing.plan.premium": "المميزة",
  "billing.plan.enterprise": "المؤسسية",
  "billing.current.title": "خطتك",
  "billing.state.free": "أنت على الخطة الأساسية المجانية.",
  "billing.state.lapsed":
    "لم تنجح عملية الدفع الأخيرة، لذا أنت على الخطة الأساسية حاليًا. يمكنك تحديث بطاقتك أدناه.",
  "billing.state.active": "أنت مشترك في الخطة {plan}. يتجدد الاشتراك تلقائيًا.",
  "billing.state.ending":
    "تم إلغاء الخطة {plan}. تحتفظ بها حتى {date} ثم تنتقل إلى الخطة الأساسية. لا يُحذف أي شيء.",
  "billing.state.endingNoDate":
    "تم إلغاء الخطة {plan}. تحتفظ بها حتى نهاية الفترة التي دفعت ثمنها ثم تنتقل إلى الخطة الأساسية. لا يُحذف أي شيء.",
  "billing.state.pastDue":
    "لم تنجح عملية الدفع الأخيرة. تبقى الخطة {plan} فعّالة حتى {date} ريثما تحدّث بطاقتك.",
  "billing.state.pastDueNoDate":
    "لم تنجح عملية الدفع الأخيرة. تبقى الخطة {plan} فعّالة لبضعة أيام ريثما تحدّث بطاقتك.",
  "billing.state.manual": "تم الاتفاق على الخطة {plan} معنا مباشرة، لذا لا يوجد ما تديره هنا.",
  "billing.member.note": "مالك مؤسستك هو من يدير خطتها. أنت تستخدم الخطة {plan} الخاصة به.",
  "billing.return.confirming":
    "شكرًا لك. نتأكد من دفعتك لدى Paystack، وهذا يستغرق عادةً بضع ثوانٍ. إذا لم تتغير خطتك بعد، فحدّث هذه الصفحة.",
  "billing.return.refresh": "تحديث",
  "billing.return.done": "تم تأكيد الدفع. أنت الآن على الخطة {plan}.",
  "billing.limit.seats": "الأشخاص في مؤسستك",
  "billing.limit.savedItems": "الحقول والعقارات والمواقع المحفوظة",
  "billing.limit.unlimited": "بلا حد محدد",
  "billing.plans.title": "الخطط",
  "billing.plans.free": "مجانية",
  "billing.plans.current": "خطتك",
  "billing.plans.notOffered": "غير متاحة للشراء بعد.",
  "billing.plans.none": "لا يمكن شراء الخطط بعد. يُرجى العودة قريبًا.",
  "billing.interval.monthly": "شهريًا",
  "billing.interval.annual": "سنويًا",
  "billing.interval.saving": "شهران مجانًا",
  "billing.interval.label": "فترة الفوترة",
  "billing.currency.label": "العملة",
  "billing.currency.NGN": "النايرا (₦)",
  "billing.currency.USD": "الدولار الأمريكي ($)",
  "billing.price.monthly": "{price} / شهريًا",
  "billing.price.annual": "{price} / سنويًا",
  "billing.subscribe": "الاشتراك في الخطة {plan}",
  "billing.subscribe.failed":
    "تعذّر بدء عملية الدفع ولم يُخصم أي مبلغ. يُرجى المحاولة مرة أخرى بعد قليل.",
  "billing.payNote":
    "تدفع على صفحة Paystack الآمنة، ولا نرى بيانات بطاقتك أبدًا. السعر المعروض هو السعر المحصَّل. يمكنك الإلغاء في أي وقت والاحتفاظ بخطتك حتى نهاية الفترة المدفوعة.",
  "billing.switchNote":
    "للانتقال بين الخطط المدفوعة، ألغِ الخطة الحالية ثم اشترك في الأخرى بعد انتهائها. لا تستطيع Paystack تبديل اشتراك جارٍ.",
  "billing.alwaysFree":
    "تنبيهات الطقس الرسمية والمستكشف العام وتصدير بياناتك أو حذفها مجانية في جميع الخطط.",
  "billing.ownerOnly": "مالك المؤسسة وحده يستطيع الاشتراك أو تغيير الخطة.",
  "billing.manage.title": "البطاقة والإلغاء",
  "billing.manage.cardBody": "يفتح صفحة Paystack حيث يمكنك تغيير البطاقة المستخدمة في التجديدات.",
  "billing.manage.card": "تحديث البطاقة على Paystack",
  "billing.manage.cardFailed": "تعذّر فتح صفحة Paystack الآن. يُرجى المحاولة مرة أخرى بعد قليل.",
  "billing.manage.cancel": "إلغاء الاشتراك",
  "billing.manage.cancelBody":
    "تحتفظ بخطتك حتى نهاية الفترة المدفوعة ثم تنتقل إلى الخطة الأساسية. لا يُحذف أي شيء؛ لن تتمكن فقط من إضافة أكثر مما تسمح به الخطة الأساسية.",
  "billing.manage.cancelConfirm": "نعم، ألغِ في نهاية الفترة",
  "billing.manage.cancelKeep": "الإبقاء على خطتي",
  "billing.manage.cancelDone": "تم طلب الإلغاء. تتحدّث هذه الصفحة فور تأكيده من Paystack.",
  "billing.manage.cancelFailed":
    "تعذّر الإلغاء الآن ولم يتغير شيء. يُرجى المحاولة مرة أخرى بعد قليل.",
  "settings.billing.title": "الخطة والفوترة",
  "settings.billing.body": "أنت على الخطة {plan}.",
  "settings.billing.link": "عرض الخطة والفوترة",
  "settings.delete.billingNote":
    "إذا كان لديك اشتراك مدفوع، فنلغيه لدى Paystack أولًا حتى لا يُخصم منك مبلغ مرة أخرى.",
  "errors.billingUnavailable": "الفوترة غير متاحة الآن. يُرجى المحاولة لاحقًا.",
  "errors.billingOwnerOnly": "مالك المؤسسة وحده يستطيع تغيير خطتها.",
  "errors.billingAlreadySubscribed": "لديك اشتراك بالفعل. يمكنك إدارته من صفحة الخطة.",
  "errors.billingNotOffered": "هذه الخطة غير متاحة للشراء حاليًا.",
  "errors.billingNotSubscribed": "لا يوجد اشتراك لإدارته.",
  "errors.deleteCancelSubscriptionFailed":
    "تعذّر علينا إلغاء اشتراكك لدى Paystack، لذلك لم يُحذف حسابك (وإلا لاستمر الخصم منك). يُرجى المحاولة مرة أخرى بعد قليل.",

  // ---- organisation card (v96)
  "settings.org.title": "مؤسستك",
  "settings.org.owner": "أنت مالك هذه المؤسسة.",
  "settings.org.member": "أنت عضو في هذه المؤسسة. مالكها هو من يديرها.",
  "settings.org.nameLabel": "اسم المؤسسة",
  "settings.org.nameHelp": "حتى {max} حرفًا. يظهر في تصدير بياناتك وفي أدوات الدعم لدينا.",
  "settings.org.save": "حفظ اسم المؤسسة",
  "settings.org.people.title": "الأشخاص في مؤسستك",
  "settings.org.people.count":
    "{count, plural, one {# شخص} two {شخصان} few {# أشخاص} many {# شخصًا} other {# شخص}}",
  "settings.org.people.owner": "المالك",
  "settings.org.people.member": "عضو",
  "settings.org.people.you": "أنت",
  "settings.org.people.hint": "لإضافة أشخاص أو إزالتهم، افتح مساحة عمل واختر الفريق.",
  "settings.org.people.loadFailed": "تعذّر تحميل قائمة الأشخاص الآن. يُرجى المحاولة مرة أخرى.",
  "errors.orgNameInvalid": "استخدم ما بين 1 و{max} حرفًا لاسم المؤسسة.",
  "errors.orgRenameFailed": "تعذّر تغيير اسم مؤسستك. يُرجى المحاولة مرة أخرى.",
  "errors.orgOwnerOnly": "مالك المؤسسة وحده يستطيع تغيير اسمها.",

  // ---- search place result line
  "search.placeDescription": "عرض الظروف الحالية",

  // ---- first-use tutorial popup
  "chrome.tutorial.step": "الخطوة {current} من {total}",
  "chrome.tutorial.skip": "تخطّي",
  "chrome.tutorial.back": "رجوع",
  "chrome.tutorial.next": "التالي",
  "chrome.tutorial.getStarted": "ابدأ",
  // ---- phone layout: menu button and bottom bar
  "chrome.nav.menu": "القائمة",
  "chrome.nav.closeMenu": "إغلاق القائمة",
  "chrome.nav.quickNav": "تنقّل سريع",
  "chrome.nav.home": "الرئيسية",
  "chrome.nav.map": "الخريطة",
  "chrome.nav.alerts": "التنبيهات",
  "chrome.nav.search": "بحث",
  "chrome.nav.ai": "المساعد",

  // ---- offline use and installing the app
  "chrome.offline.offline": "أنت غير متصل بالإنترنت. قد يكون ما تراه قديمًا.",
  "chrome.offline.savedCopy":
    "تعرض الآن النسخة التي فتحتها آخر مرة، وقد حُفظت {ago}. أعد الاتصال ثم أعد التحميل لعرض المعلومات الحالية.",
  "chrome.offline.reload": "إعادة التحميل",
  "offline.title": "أنت غير متصل بالإنترنت",
  "offline.body":
    "لا يستطيع World Vitality الوصول إلى الإنترنت الآن. الصفحات التي فتحتها مؤخرًا محفوظة على هذا الجهاز وتُفتح مع ملاحظة توضح وقت حفظها. وكل ما عدا ذلك يحتاج إلى اتصال.",
  "offline.retry": "حاول مرة أخرى",
  "offline.dashboard": "افتح لوحة المعلومات",
  "offline.privacy": "تبقى الصفحات المحفوظة على هذا الجهاز وتُحذف عند تسجيل الخروج.",
  "settings.install.title": "التثبيت على هذا الجهاز",
  "settings.install.body":
    "أضف World Vitality إلى الشاشة الرئيسية أو سطح المكتب ليُفتح كتطبيق. تبقى الصفحات التي فتحتها مؤخرًا متاحة دون اتصال، وهي محفوظة على هذا الجهاز فقط وتُحذف عند تسجيل الخروج.",
  "settings.install.button": "تثبيت التطبيق",
  "settings.install.installed": "World Vitality مثبّت على هذا الجهاز.",
  "settings.install.hint":
    "للتثبيت، افتح زر المشاركة أو قائمة المتصفح واختر «إضافة إلى الشاشة الرئيسية» أو «تثبيت التطبيق».",
  "settings.install.appsLead": "هل تفضّل تطبيقًا لسطح المكتب أو لنظام أندرويد؟",
  "settings.install.appsLink": "عرض التنزيلات",

  // ---- Weather & Climate workspace (home page) and the location note shared by workspace pages
  "weather.currentConditions": "الظروف الحالية",
  "weather.status": "الحالة",
  "weather.temperature": "درجة الحرارة",
  "weather.alerts": "التنبيهات",
  "weather.noActiveAlerts": "لا توجد تنبيهات نشطة",
  "weather.trend": "الاتجاه",
  "weather.forecast": "التوقعات",
  "weather.noForecast": "لا توجد توقعات متاحة",
  "weather.historicalContext": "السياق التاريخي",
  "weather.noBenchmark": "لا يوجد بعد مرجع مناخي إقليمي",
  "weather.gaps":
    "{count, plural, zero {لا توجد أيام بلا بيانات.} one {يوم واحد لم تتوفر عنه بيانات.} two {يومان لم تتوفر عنهما بيانات.} few {# أيام لم تتوفر عنها بيانات.} many {# يومًا لم تتوفر عنها بيانات.} other {# يوم لم تتوفر عنها بيانات.}}",
  "workspace.forecastGaps":
    "{count, plural, zero {لا توجد أيام توقعات بلا بيانات.} one {يوم توقعات واحد لم تتوفر عنه بيانات.} two {يوما توقعات لم تتوفر عنهما بيانات.} few {# أيام توقعات لم تتوفر عنها بيانات.} many {# يومًا من التوقعات لم تتوفر عنها بيانات.} other {# يوم من التوقعات لم تتوفر عنها بيانات.}}",
  "weather.aiPanel.emptyTitle": "لا شيء لتفسيره بعد",
  "weather.aiPanel.emptyBody": "افتح «الظروف الحالية» لعرض حالة مولَّدة بالذكاء الاصطناعي.",
  "workspace.locationNote.home": "يُعرض {place}، مكان إقامتك.",
  "workspace.locationNote.change": "تغيير",
  "workspace.locationNote.demo": "يُعرض موقع تجريبي ({place}).",
  "workspace.locationNote.setOwn": "حدّد مكانك الخاص",
  "workspace.locationNote.demoTail": "لترى ظروفك هنا.",

  // ---- Shared workspace pieces: empty states, edit/delete, report buttons (v104)
  "workspace.aiPanel.emptyTitle": "لا شيء لتفسيره بعد",
  "workspace.alerts": "التنبيهات",
  "workspace.noActiveAlerts": "لا توجد تنبيهات نشطة",
  "workspace.trend": "الاتجاه",
  "workspace.comparison": "المقارنة",
  "workspace.map": "الخريطة",
  "workspace.viewFullMap": "عرض الخريطة كاملة ←",
  "workspace.noBenchmark": "لا يوجد بعد مرجع إقليمي",
  "workspace.gaps":
    "{count, plural, one {يوم واحد بلا بيانات متاحة.} two {يومان بلا بيانات متاحة.} few {# أيام بلا بيانات متاحة.} many {# يومًا بلا بيانات متاحة.} other {# يوم بلا بيانات متاحة.}}",
  "resource.edit": "تعديل",
  "resource.delete": "حذف",
  "resource.confirmDelete": "تأكيد الحذف؟",
  "resource.save": "حفظ",
  "resource.name": "الاسم",
  "resource.latitude": "خط العرض",
  "resource.longitude": "خط الطول",
  "resource.sessionUnverified": "تعذّر التحقق من جلستك. يُرجى تسجيل الدخول مرة أخرى.",
  "resource.latitudeRange": "يجب أن يكون خط العرض رقمًا بين -90 و90.",
  "resource.longitudeRange": "يجب أن يكون خط الطول رقمًا بين -180 و180.",
  "report.generated": "أُنشئ في {when}",
  "report.print": "طباعة / حفظ بصيغة PDF",
  "report.downloadCsv": "تنزيل ملف CSV",
  "report.accessDenied": "تم رفض الوصول",
  "report.accessDeniedBody": "ليست لهذا الدور صلاحية إنشاء تقارير في مساحة العمل هذه.",

  // ---- Agriculture workspace (v104)
  "agri.aiPanel.emptyBody": "افتح «نظرة عامة على الحقول» لعرض حالة مولَّدة بالذكاء الاصطناعي.",
  "agri.soilMoisture": "رطوبة التربة",
  "agri.temperature": "درجة الحرارة",
  "agri.empty.noFields": "لا توجد حقول بعد",
  "agri.empty.noFieldsVisible": "لا توجد حقول ظاهرة لدورك",
  "agri.empty.addAbove": "أضف حقلًا أعلاه للبدء.",
  "agri.empty.scoped": "صلاحيتك محصورة في حقول محددة، ولا يوجد حاليًا أي حقل مُسنَد إليك.",
  "agri.reportCard.body":
    "لقطة للظروف الحالية لكل حقل يمكنك رؤيته، قابلة للتصدير بصيغة CSV أو PDF ←",
  "agri.trend.emptyTitle": "لا يوجد سجل كافٍ بعد",
  "agri.trend.emptyBody": "تحتاج مقارنات الاتجاه إلى بيانات تزيد على موسم واحد.",
  "agri.add.title": "إضافة حقل",
  "agri.add.button": "إضافة الحقل",
  "agri.add.success": "تمت إضافة «{name}».",
  "agri.comments.show": "التعليقات ({count})",
  "agri.comments.hide": "إخفاء التعليقات",
  "agri.comments.none": "لا توجد تعليقات بعد.",
  "agri.comments.label": "تعليق",
  "agri.comments.add": "أضف تعليقًا",
  "agri.comments.post": "نشر",
  "agri.comments.edited": "(معدَّل)",
  "agri.err.nameRequired": "أدخل اسم الحقل.",
  "agri.err.noPermissionAdd": "ليست لديك صلاحية إضافة حقول في مساحة العمل هذه.",
  "agri.err.createFailed": "تعذّر إنشاء الحقل. يُرجى المحاولة مرة أخرى.",
  "agri.err.noPermissionEdit": "ليست لديك صلاحية تعديل هذا الحقل.",
  "agri.err.updateFailed": "تعذّر تحديث الحقل. يُرجى المحاولة مرة أخرى.",
  "agri.err.noPermissionDelete": "ليست لديك صلاحية حذف هذا الحقل.",
  "agri.err.deleteFailed": "تعذّر حذف الحقل. يُرجى المحاولة مرة أخرى.",
  "agri.err.commentEmpty": "لا يمكن أن يكون التعليق فارغًا.",
  "agri.err.noPermissionComment": "ليست لديك صلاحية التعليق على هذا الحقل.",
  "agri.err.postFailed": "تعذّر نشر التعليق. يُرجى المحاولة مرة أخرى.",
  "agri.err.editOwnOnly": "يمكنك تعديل تعليقاتك أنت فقط.",
  "agri.err.deleteOwnOnly": "يمكنك حذف تعليقاتك أنت فقط.",
  "agri.report.snapshotNote":
    "هذه لقطة للظروف الحالية لكل حقل يمكنك رؤيته — وليست ملخصًا لنهاية الموسم ولا مقارنةً بالمعدلات التاريخية (لا توجد في هذا التطبيق بيانات لمواسم سابقة). راجع وثائق مصدر البيانات في World Vitality لمعرفة تفاصيل المصادر.",
  "agri.report.noFieldsTitle": "لا توجد حقول ظاهرة",
  "agri.report.noFieldsBody": "لا توجد حقول لتضمينها في هذا التقرير.",
  "agri.map.noFieldsBody":
    "لا توجد حقول لعرضها على الخريطة بعد. أضف حقلًا من الصفحة الرئيسية لمساحة العمل.",

  // ---- Map text shared by the resource maps; Agriculture map (v104)
  "map.moisture.veryDry": "جاف جدًا",
  "map.moisture.dry": "جاف",
  "map.moisture.moderate": "رطوبة معتدلة",
  "map.moisture.moist": "رطب",
  "map.moisture.saturated": "مشبع",
  "agri.map.toggle":
    "رطوبة التربة ({count, plural, one {حقل واحد} two {حقلان} few {# حقول} many {# حقلًا} other {# حقل}})",
  "map.popupReading": "{name}: {label} ({value} من 1.0)",
  "map.popupNoReading": "{name}: لا توجد قراءة حالية لرطوبة التربة",
  "agri.map.descNone": "لا توجد حقول لعرضها على الخريطة.",
  "agri.map.descOn":
    "خريطة تعرض {count, plural, one {حقلًا واحدًا} two {حقلين} few {# حقول} many {# حقلًا} other {# حقل}}. {items}",
  "agri.map.descOff":
    "خريطة تعرض {count, plural, one {حقلًا واحدًا} two {حقلين} few {# حقول} many {# حقلًا} other {# حقل}}. طبقة رطوبة التربة مخفية حاليًا.",
  "map.descItem": "{name}: {label} ({value} على مقياس من 0 إلى 1)",
  "map.descItemNoReading": "{name}: لا توجد قراءة حالية",

  // ---- Shared: signed-in line, report link, map readings (v105)
  "workspace.signedInAs": "تم تسجيل الدخول بصفة: {role}",
  "report.open": "فتح التقرير",
  "report.notAvailable": "تصدير التقارير غير متاح لدورك",

  // ---- Insurance workspace (v105)
  "insurance.role.admin_owner": "مسؤول",
  "insurance.role.operational_user": "مكتتب",
  "insurance.role.scoped_field_user": "مسوّي المطالبات",
  "insurance.role.viewer_external": "محلل (للقراءة فقط)",
  "insurance.aiPanel.emptyBody":
    "افتح «سياق المخاطر للاكتتاب» لعرض حالة مولَّدة بالذكاء الاصطناعي.",
  "insurance.home.intro":
    "محفظة تأمين حقيقية ({count, plural, one {عقار واحد} two {عقاران} few {# عقارات} many {# عقارًا} other {# عقار}}). إشارات مخاطر فردية فقط، دون درجة مخاطر مركّبة متعددة الأخطار (راجع ملاحظات النطاق في هذه الصفحة).",
  "insurance.empty.noProperties": "لا توجد عقارات مؤمَّن عليها بعد",
  "insurance.empty.noPropertiesVisible": "لا توجد عقارات ظاهرة لدورك",
  "insurance.empty.addAbove": "أضف عقارًا مؤمَّنًا عليه أعلاه للبدء.",
  "insurance.empty.scoped": "صلاحيتك محصورة في عقارات محددة، ولا يوجد حاليًا أي عقار مُسنَد إليك.",
  "insurance.temperature": "درجة الحرارة",
  "insurance.soilDrought": "التربة / ذات الصلة بالجفاف",
  "insurance.reportCard.body":
    "أنشئ تقرير اكتتاب جاهزًا للطباعة، مع المصادر والطوابع الزمنية وإدخال مسجَّل في سجل التدقيق.",
  "insurance.add.title": "إضافة عقار مؤمَّن عليه",
  "insurance.add.button": "إضافة العقار",
  "insurance.add.success": "تمت إضافة «{name}».",
  "insurance.policyNumber": "رقم الوثيقة",
  "insurance.address": "العنوان",
  "insurance.propertyAddress": "عنوان العقار",
  "insurance.err.policyRequired": "أدخل رقم الوثيقة.",
  "insurance.err.addressRequired": "أدخل عنوان العقار.",
  "insurance.err.noPermissionAdd": "ليست لديك صلاحية إضافة عقارات مؤمَّن عليها في مساحة العمل هذه.",
  "insurance.err.createFailed": "تعذّر إنشاء العقار المؤمَّن عليه. يُرجى المحاولة مرة أخرى.",
  "insurance.err.noPermissionEdit": "ليست لديك صلاحية تعديل هذا العقار.",
  "insurance.err.updateFailed": "تعذّر تحديث العقار المؤمَّن عليه. يُرجى المحاولة مرة أخرى.",
  "insurance.err.noPermissionDelete": "ليست لديك صلاحية حذف هذا العقار.",
  "insurance.err.deleteFailed": "تعذّر حذف العقار المؤمَّن عليه. يُرجى المحاولة مرة أخرى.",
  "insurance.report.title": "تقرير مخاطر الاكتتاب",
  "insurance.report.count":
    "{count, plural, one {عقار واحد} two {عقاران} few {# عقارات} many {# عقارًا} other {# عقار}}",
  "insurance.report.scopeNote":
    "يشمل هذا التقرير كل عقار مؤمَّن عليه يمكنك رؤيته، ويعرض إشارات مخاطر فردية فقط — وليس درجة مخاطر مركّبة متعددة الأخطار. وهو غير مناسب بصورته الحالية للوثائق الفعلية الخاصة بالاكتتاب أو المطالبات أو الامتثال التنظيمي. يُسجَّل الاطّلاع على التقرير في سجل التدقيق الخاص بمساحة العمل هذه. راجع وثائق مصدر البيانات في World Vitality لمعرفة تفاصيل المصادر.",
  "insurance.report.noPropertiesTitle": "لا توجد عقارات ظاهرة",
  "insurance.report.noPropertiesBody": "لا توجد عقارات مؤمَّن عليها لإدراجها في هذا التقرير.",
  "insurance.map.noPropertiesBody":
    "لا توجد عقارات مؤمَّن عليها لعرضها على الخريطة بعد. أضف عقارًا من الصفحة الرئيسية لمساحة العمل.",
  "insurance.map.toggle":
    "رطوبة التربة ({count, plural, one {عقار واحد} two {عقاران} few {# عقارات} many {# عقارًا} other {# عقار}})",
  "insurance.map.descNone": "لا توجد عقارات لعرضها على الخريطة.",
  "insurance.map.descOn":
    "خريطة تعرض {count, plural, one {عقار واحد} two {عقاران} few {# عقارات} many {# عقارًا} other {# عقار}}. {items}",
  "insurance.map.descOff":
    "خريطة تعرض {count, plural, one {عقار واحد} two {عقاران} few {# عقارات} many {# عقارًا} other {# عقار}}. طبقة رطوبة التربة مخفية حاليًا.",

  // ---- Government & NGOs workspace (v105)
  "gov.role.admin_owner": "مسؤول الجهة",
  "gov.role.operational_user": "محلل",
  "gov.role.scoped_field_user": "موظف ميداني",
  "gov.role.viewer_external": "جهة شريكة (للقراءة فقط)",
  "gov.aiPanel.emptyBody":
    "افتح «نظرة عامة على النطاق الإداري» لعرض حالة مولَّدة بالذكاء الاصطناعي.",
  "gov.home.intro":
    "مواقع مراقَبة حقيقية ({count, plural, one {موقع واحد} two {موقعان} few {# مواقع} many {# موقعًا} other {# موقع}})، وليست حدودًا إدارية حقيقية (راجع ملاحظات النطاق في هذه الصفحة).",
  "gov.empty.noLocations": "لا توجد مواقع مراقَبة بعد",
  "gov.empty.noLocationsVisible": "لا توجد مواقع ظاهرة لدورك",
  "gov.empty.addAbove": "أضف موقعًا مراقَبًا أعلاه للبدء.",
  "gov.empty.scoped": "صلاحيتك محصورة في مواقع محددة، ولا يوجد حاليًا أي موقع مُسنَد إليك.",
  "gov.climate": "المناخ",
  "gov.reportCard.body":
    "أنشئ تقريرًا جاهزًا للطباعة لهذه النظرة العامة، مع المصادر والطوابع الزمنية.",
  "gov.add.title": "إضافة موقع مراقَب",
  "gov.add.button": "إضافة الموقع",
  "gov.add.success": "تمت إضافة «{name}».",
  "gov.label": "التسمية",
  "gov.locationLabel": "تسمية الموقع",
  "gov.err.labelRequired": "أدخل تسمية لهذا الموقع.",
  "gov.err.noPermissionAdd": "ليست لديك صلاحية إضافة مواقع مراقَبة في مساحة العمل هذه.",
  "gov.err.createFailed": "تعذّرت إضافة الموقع المراقَب. يُرجى المحاولة مرة أخرى.",
  "gov.err.noPermissionEdit": "ليست لديك صلاحية تعديل هذا الموقع.",
  "gov.err.updateFailed": "تعذّر تحديث الموقع المراقَب. يُرجى المحاولة مرة أخرى.",
  "gov.err.noPermissionDelete": "ليست لديك صلاحية حذف هذا الموقع.",
  "gov.err.deleteFailed": "تعذّر حذف الموقع المراقَب. يُرجى المحاولة مرة أخرى.",
  "gov.report.title": "تقرير النظرة العامة على النطاق الإداري",
  "gov.report.count":
    "{count, plural, one {موقع واحد} two {موقعان} few {# مواقع} many {# موقعًا} other {# موقع}}",
  "gov.report.scopeNote":
    "يشمل هذا التقرير كل موقع مراقَب يمكنك رؤيته، وليس حدًّا إداريًا حقيقيًا — وهو غير مناسب بصورته الحالية للوثائق العامة أو الخاصة بالسياسات أو بالجهات المانحة. راجع وثائق مصدر البيانات في World Vitality لمعرفة تفاصيل المصادر.",
  "gov.report.noLocationsTitle": "لا توجد مواقع ظاهرة",
  "gov.report.noLocationsBody": "لا توجد مواقع مراقَبة لإدراجها في هذا التقرير.",
  "gov.map.noLocationsBody":
    "لا توجد مواقع مراقَبة لعرضها على الخريطة بعد. أضف موقعًا من الصفحة الرئيسية لمساحة العمل.",
  "gov.map.toggle":
    "رطوبة التربة ({count, plural, one {موقع واحد} two {موقعان} few {# مواقع} many {# موقعًا} other {# موقع}})",
  "gov.map.descNone": "لا توجد مواقع لعرضها على الخريطة.",
  "gov.map.descOn":
    "خريطة تعرض {count, plural, one {موقع واحد} two {موقعان} few {# مواقع} many {# موقعًا} other {# موقع}}. {items}",
  "gov.map.descOff":
    "خريطة تعرض {count, plural, one {موقع واحد} two {موقعان} few {# مواقع} many {# موقعًا} other {# موقع}}. طبقة رطوبة التربة مخفية حاليًا.",

  // ---- Shared map pieces for the sample-reference-site maps; status caption (v106)
  "workspace.status": "الحالة",
  "map.mode.temperature": "درجة الحرارة",
  "map.mode.generation": "نطاق التوليد",
  "map.mode.routeRisk": "مستوى مخاطر المسار",
  "map.mode.siteRisk": "مخاطر الموقع",
  "map.mode.moisture": "إظهار رطوبة الأرض",
  "map.mode.raw": "القراءات الخام",
  "map.verdict.cold": "بارد",
  "map.verdict.cool": "بارد نسبيًا",
  "map.verdict.mild": "معتدل",
  "map.verdict.warm": "دافئ",
  "map.verdict.hot": "حار",
  "map.verdict.belowCutIn": "أقل من سرعة التشغيل",
  "map.verdict.ramping": "إنتاج متصاعد",
  "map.verdict.rated": "القدرة المقنَّنة",
  "map.verdict.cutOut": "إيقاف بسبب الرياح القوية",
  "map.verdict.clear": "سالك",
  "map.verdict.elevated": "متزايد",
  "map.verdict.high": "مرتفع",
  "map.verdict.severe": "شديد",
  "map.verdict.dry": "جاف",
  "map.verdict.somewhatWet": "رطب إلى حد ما",
  "map.verdict.wet": "رطب",
  "map.tempValue": "{value} °م",
  "map.windValue": "رياح بسرعة {value} م/ث",
  "map.popup.pair": "{first} — {second}",
  "map.ref.coverage": "مواقع مرجعية نموذجية: {plotted} من {total} تعرض بيانات",
  "map.ref.descOn":
    "خريطة لـ{count, plural, one {موقع مرجعي نموذجي واحد} two {موقعين مرجعيين نموذجيين} few {# مواقع مرجعية نموذجية} many {# موقعًا مرجعيًا نموذجيًا} other {# موقع مرجعي نموذجي}}. {items}",
  "map.ref.descOff": "خريطة لمواقع مرجعية نموذجية. الطبقة مخفية حاليًا.",
  "site.ibadan": "إبادان، نيجيريا",
  "site.nairobi": "نيروبي، كينيا",
  "site.rotterdam": "روتردام، هولندا",
  "site.desMoines": "دي موين، الولايات المتحدة",
  "site.chennai": "تشيناي، الهند",
  "site.brisbane": "بريسبان، أستراليا",

  // ---- Construction workspace (v106)
  "construction.aiPanel.emptyBody": "افتح «مخاطر الموقع» لعرض حالة مولَّدة بالذكاء الاصطناعي.",
  "construction.title": "حالة أنشطة اليوم",
  "construction.siteRiskStatus": "حالة مخاطر الموقع",
  "construction.siteRiskTimeline": "الجدول الزمني لمخاطر الموقع",
  "construction.activity.concretePour": "صبّ الخرسانة",
  "construction.activity.craneOperation": "تشغيل الرافعة",
  "construction.activity.roofingWork": "أعمال التسقيف",
  "construction.activity.excavation": "الحفر (خطر الفيضانات المفاجئة)",
  "construction.status.go": "مسموح",
  "construction.status.caution": "حذر",
  "construction.status.noGo": "غير مسموح",

  // ---- Renewable Energy workspace (v106)
  "renewable.aiPanel.emptyBody": "افتح «توقعات التوليد» لعرض حالة مولَّدة بالذكاء الاصطناعي.",
  "renewable.title": "توقعات التوليد للأصول",
  "renewable.hydroNote":
    "تقرأ بطاقة الطاقة المائية دائمًا بيانات محطة قياس ثابتة تابعة لهيئة المسح الجيولوجي الأمريكية (USGS)، وليس هذا المكان.",
  "renewable.outlookWind": "توقعات التوليد — الرياح (الأيام السبعة القادمة)",
  "renewable.outlookSolar": "توقعات التوليد — الطاقة الشمسية (الأيام السبعة القادمة)",
  "renewable.statusWind": "الحالة الحالية — الرياح",
  "renewable.statusSolar": "الحالة الحالية — الطاقة الشمسية",
  "renewable.statusHydro": "الحالة الحالية — الطاقة المائية (محطة قياس في الولايات المتحدة)",
  "renewable.hydroGaps":
    "{count, plural, one {قراءة واحدة بلا بيانات متاحة.} two {قراءتان بلا بيانات متاحة.} few {# قراءات بلا بيانات متاحة.} many {# قراءةً بلا بيانات متاحة.} other {# قراءة بلا بيانات متاحة.}}",

  // ---- Logistics & Shipping workspace (v106)
  "logistics.aiPanel.emptyBody": "افتح «مخاطر المسار» لعرض حالة مولَّدة بالذكاء الاصطناعي.",
  "logistics.title": "حالة مخاطر المسار",
  "logistics.outlook": "توقعات مخاطر المسار (الأيام السبعة القادمة)",
  "logistics.disruptionReports": "تقارير الاضطرابات",
  "logistics.noDisruptions": "لا يوجد سجل اضطرابات بعد",

  // ---- Research workspace (v107)
  "research.aiPanel.title": "لا يوجد تفسير بالذكاء الاصطناعي هنا، وهذا مقصود",
  "research.aiPanel.body":
    "يُبقي قسم البحث هذه اللوحة خامًا عمدًا: تظهر البيانات في جدول مستكشف البيانات مع كامل مصدرها، دون أن تلخّصها طبقة ذكاء اصطناعي.",
  "research.aiPanel.provenance":
    "وبدلًا من ذلك، يظهر مصدر كل سجل (المصدر والترخيص ووقت الجلب والقيود المعروفة) مباشرة في الجدول.",
  "research.dataset": "مجموعة البيانات",
  "research.metrics": "المقاييس",
  "research.results": "النتائج",
  "research.relationships": "العلاقات بين البيانات",
  "research.source.nasaPower.label": "NASA POWER — الظروف الحالية",
  "research.source.nasaPower.description":
    "بيانات رصد من الملكية العامة، ولا تتطلب مفتاح واجهة برمجية.",
  "research.source.openMeteo.label": "Open-Meteo — توقعات 7 أيام",
  "research.source.openMeteo.description":
    "الباقة المجانية، ترخيص للاستخدام غير التجاري (راجع عمود الترخيص في مجموعة البيانات هذه).",
  "research.fetch": "جلب البيانات",
  "research.fetchFailed": "تعذّر جلب مجموعة البيانات هذه. حاول مرة أخرى.",
  "research.col.metric": "المقياس",
  "research.col.value": "القيمة",
  "research.col.unit": "الوحدة",
  "research.col.timestamp": "الطابع الزمني",
  "research.col.type": "النوع",
  "research.col.source": "المصدر",
  "research.col.license": "الترخيص",
  "research.col.limitations": "القيود المعروفة",
  "research.type.observed": "مرصود",
  "research.type.forecast": "توقع",
  "research.noneStated": "لا توجد قيود مذكورة",
  "research.records":
    "{count, plural, one {سجل واحد} two {سجلان} few {# سجلات} many {# سجلًا} other {# سجل}}",
  "research.gapsReported":
    "{count, plural, one {فجوة واحدة مُبلَّغ عنها} two {فجوتان مُبلَّغ عنهما} few {# فجوات مُبلَّغ عنها} many {# فجوة مُبلَّغ عنها} other {# فجوة مُبلَّغ عنها}}",
  "research.recordsAndGaps": "{records} — {gaps}",
  "research.empty.title": "لم تُحمَّل أي مجموعة بيانات بعد",
  "research.empty.body": "اختر مجموعة بيانات أعلاه ثم اضغط «جلب البيانات».",
  "research.rel.intro":
    "كل مقياس خام تستوعبه هذه المنصة، ومساحات العمل التي يغذّيها فعليًا، مستمدًا مباشرة من الربط الفعلي لقدرات المنصة (ADR-0004، المرحلة 1) وليس من نموذج افتراضي.",
  "research.rel.feeds": "يغذّي: {workspaces}",
  "research.rel.feedsMany": "يغذّي: {workspaces} — القراءة نفسها، تُفسَّر بشكل مختلف بحسب المجال.",
  "research.metric.T2M.label": "درجة الحرارة (T2M)",
  "research.metric.T2M.description":
    "«درجة الحرارة على ارتفاع مترين» من NASA POWER، وتُجلب أيضًا كتوقعات يومية عبر Open-Meteo.",
  "research.metric.WS2M.label": "سرعة الرياح (WS2M)",
  "research.metric.WS2M.description":
    "«سرعة الرياح على ارتفاع مترين» من NASA POWER، وتُجلب أيضًا كتوقعات يومية عبر Open-Meteo، بوحدة م/ث صراحةً ليمكن مقارنة المصدرين مباشرة.",
  "research.metric.GWETROOT.label": "رطوبة التربة في منطقة الجذور (GWETROOT)",
  "research.metric.GWETROOT.description":
    "مؤشر رطوبة التربة في منطقة الجذور من NASA POWER، من 0 (جاف) إلى 1 (مشبع).",

  // ---- Education workspace (v107)
  "edu.role.admin_owner": "معلّم/مسؤول",
  "edu.role.operational_user": "معلّم",
  "edu.role.scoped_field_user": "وصول محدود",
  "edu.role.viewer_external": "ضيف (للقراءة فقط)",
  "edu.aiPanel.title": "لا توجد لوحة ذكاء اصطناعي جانبية هنا",
  "edu.aiPanel.body": "تظهر شروح بيانات مساحة العمل هذه داخل الصفحة نفسها، وليس في لوحة جانبية.",
  "edu.intro":
    "بيانات حقيقية وحالية، مشروحة بحسب المرحلة الدراسية التي تختارها. مخصّصة للمعلّمين لاستخدامها في الصف؛ ولا تُجمع أي حسابات أو بيانات للطلاب في مساحة العمل هذه.",
  "edu.demoLocation": "موقع صف تجريبي",
  "edu.explainFor": "مستوى الشرح",
  "edu.grade.k2": "من الروضة إلى الصف 2",
  "edu.grade.g35": "الصفوف من 3 إلى 5",
  "edu.grade.g68": "الصفوف من 6 إلى 8",
  "edu.grade.g912": "الصفوف من 9 إلى 12",
  "edu.card.temperature": "درجة الحرارة",
  "edu.card.soilMoisture": "رطوبة التربة",
  "edu.talkAbout": "ناقشوا ذلك: {prompt}",
  "edu.intro.k2.weather": "هيا نكتشف: هل الجو حار أم بارد في الخارج الآن؟",
  "edu.intro.k2.soil": "هيا نكتشف: هل الأرض عطشى (جافة) أم مليئة بالماء (مبتلّة) الآن؟",
  "edu.intro.g35.weather":
    "إليكم ما تخبرنا به بيانات الأقمار الصناعية الحقيقية عن درجة حرارة الهواء في هذا المكان اليوم.",
  "edu.intro.g35.soil":
    "إليكم ما تخبرنا به بيانات الأقمار الصناعية الحقيقية عن رطوبة التربة في هذا المكان اليوم.",
  "edu.intro.g68.weather":
    "هذه قراءة حقيقية وحالية لدرجة حرارة الهواء في هذا المكان، من بيانات الأقمار الصناعية التابعة لناسا.",
  "edu.intro.g68.soil":
    "هذه قراءة حقيقية وحالية لرطوبة التربة في هذا المكان، من بيانات الأقمار الصناعية التابعة لناسا.",
  "edu.intro.g912.weather":
    "قراءة حالية لدرجة حرارة الهواء في هذا المكان، مأخوذة من بيانات الأقمار الصناعية لدى NASA POWER:",
  "edu.intro.g912.soil":
    "قراءة حالية لرطوبة التربة في هذا المكان، مأخوذة من بيانات الأقمار الصناعية لدى NASA POWER:",
  "edu.conf.insufficientKid":
    "ليس لدينا معلومات كافية لنعرف بعد — ولا بأس بذلك، فالعلماء أيضًا يقولون «لا أعرف»!",
  "edu.conf.insufficient": "لا تتوفر بيانات حديثة كافية للإجابة بثقة في الوقت الحالي.",
  "edu.conf.high": "يستند هذا إلى عدة قراءات حديثة، لذا نحن واثقون إلى حد كبير.",
  "edu.conf.moderate": "يستند هذا إلى قراءتين أو ثلاث قراءات حديثة، لذا فهو تقدير معقول.",
  "edu.conf.low": "يستند هذا إلى قراءة حديثة واحدة فقط، لذا اعتبره تقديرًا تقريبيًا.",
  "edu.conf.kid.high": "تحقّقنا من هذا عدة مرات، لذا نحن متأكدون تمامًا تقريبًا!",
  "edu.conf.kid.moderate": "تحقّقنا من هذا مرتين أو ثلاثًا، لذا فهو تخمين جيد.",
  "edu.conf.kid.low": "تحقّقنا من هذا مرة واحدة فقط، لذا فهو مجرد تخمين أول.",
  "edu.followUp.k2.weather": "ماذا ترتدي في الخارج اليوم؟ هل يناسب ذلك الطقس؟",
  "edu.followUp.k2.soil": "هل رأيت مؤخرًا بركة ماء أو تربة جافة متشققة بالقرب منك؟",
  "edu.followUp.g35.weather": "كيف تقارن درجة حرارة اليوم بما تتوقعه في مثل هذا الوقت من السنة؟",
  "edu.followUp.g35.soil": "لماذا قد يهتم المزارعون بمدى رطوبة التربة أو جفافها؟",
  "edu.followUp.g68.weather": "ما العوامل التي قد تجعل درجة الحرارة تختلف بين مكانين متقاربين؟",
  "edu.followUp.g68.soil":
    "كيف قد تؤثر رطوبة التربة في النباتات والحيوانات التي تعيش في هذه المنطقة؟",
  "edu.followUp.g912.weather":
    "تعكس هذه القراءة الظروف الحالية فقط، لا اتجاهًا عامًا. ما البيانات الإضافية التي تحتاجها لتحديد اتجاه مناخي بدلًا من طقس يوم بيوم؟",
  "edu.followUp.g912.soil":
    "نطاقات الرطوبة لدى هذا المزوّد هي تفسير المنصة نفسها بالاعتماد على حدود معيّنة، وليست معيارًا زراعيًا موثّقًا (راجع توثيق شيفرته المصدرية). لماذا يهمّ هذا الفرق عند استخدام هذه البيانات في قرار حقيقي؟",
  "edu.lesson.title": "نموذج لخطة درس",
  "edu.lesson.intro":
    "نقطة انطلاق مبنية على بيانات حقيقية وحالية. لا تحتوي على أسماء أو بيانات حقيقية لطلاب — عدّلها لتناسب صفّك.",
  "edu.lesson.gradeLevel": "المرحلة الدراسية",
  "edu.lesson.download": "تنزيل خطة الدرس",
  "edu.lesson.accessDeniedBody":
    "ليس لهذا الدور صلاحية إنشاء مستندات خطط الدروس في مساحة العمل هذه.",
  "edu.doc.title": "نموذج لخطة درس",
  "edu.doc.subtitle": "نستكشف بيئتنا المحلية",
  "edu.doc.gradeLevel": "المرحلة الدراسية: {grade}",
  "edu.doc.location": "الموقع المستخدم: {place}",
  "edu.doc.asOf": "البيانات حتى: {when}",
  "edu.doc.disclaimer":
    "هذه خطة درس نموذجية كنقطة انطلاق، أُنشئت من بيانات بيئية حقيقية وحالية. لا تحتوي على بيانات أو أسماء حقيقية لطلاب — عدّلها لتناسب صفّك.",
  "edu.doc.objective": "الهدف",
  "edu.doc.objective.k2":
    "سيلاحظ الطلاب الطقس وحالة الأرض الحقيقيين في مكان حقيقي على الأرض ويصفونهما.",
  "edu.doc.objective.g35": "سيفسّر الطلاب بيانات بيئية حقيقية ويربطونها بظروف يمكن ملاحظتها.",
  "edu.doc.objective.g68":
    "سيحلّل الطلاب بيانات بيئية حقيقية، بما في ذلك مستوى الثقة فيها، ويناقشون العوامل المؤثرة فيها.",
  "edu.doc.objective.g912":
    "سيقيّم الطلاب نقديًا مجموعة بيانات بيئية حقيقية، بما في ذلك مستوى الثقة المعلن وقيودها المعروفة، ويحدّدون البيانات الإضافية اللازمة لتحليل أعمق.",
  "edu.doc.materials": "المواد",
  "edu.doc.materials.app": "- مساحة عمل {workspace} في World Vitality ({explain} / {map})",
  "edu.doc.materials.discussion": "- مساحة لنقاش الصف",
  "edu.doc.procedure": "الخطوات",
  "edu.doc.step.open": "افتح صفحة «{explain}» واختر هذه المرحلة الدراسية.",
  "edu.doc.step.weather": "راجعوا معًا قراءة درجة الحرارة: «{sentence}»",
  "edu.doc.step.soil": "راجعوا معًا قراءة رطوبة التربة: «{sentence}»",
  "edu.doc.discuss": "ناقشوا: {prompt}",
  "edu.doc.step.map": "افتح صفحة «{map}» واستكشف الموقع نفسه بصريًا.",
  "edu.doc.step.confidence":
    "اطلب من الطلاب تدوين مستوى الثقة المعلن لكل قراءة ومناقشة ما قد يزيده أو ينقصه.",
  "edu.doc.step.surprise": "اطلب من الطلاب أن يذكروا أمرًا واحدًا فاجأهم في البيانات.",
  "edu.doc.notes": "ملاحظات للمعلّم",
  "edu.doc.notes.body":
    "جميع البيانات المعروضة حقيقية وحالية، ومصدرها بيانات الأقمار الصناعية لدى NASA POWER (راجع توثيق مصدر البيانات في هذه المنصة). هذا موقع تجريبي واحد، وليس بالضرورة موقع صفّك. لا تجمع هذه الأداة أي بيانات للطلاب ولا تخزّنها.",

  // ---- Disaster Monitoring workspace (v107)
  "dm.aiPanel.title": "لا يوجد تفسير بالذكاء الاصطناعي هنا، وهذا مقصود",
  "dm.aiPanel.body":
    "تُعرض التنبيهات تمامًا كما تصدرها هيئة الأرصاد الجوية الوطنية الأمريكية (NWS)، دون أن يلخّصها هذا التطبيق أو يقيّمها أو يعيد تفسيرها.",
  "dm.aiPanel.ethics":
    "تحمل مساحة العمل هذه أعلى ثقل أخلاقي في المنصة (الدستور، القسمان 7 و9، تسامح معدوم). اتّبع دائمًا إرشادات السلطات المحلية.",
  "dm.place": "لوس أنجلوس، كاليفورنيا",
  "dm.notSubstitute": "هذا ليس بديلًا عن الإرشادات الرسمية — اتّبع دائمًا تعليمات السلطات المحلية.",
  "dm.caveat.original": "النص الأصلي من المصدر (بالإنجليزية):",
  "dm.alerts.subtitle":
    "{place} · المصدر: هيئة الأرصاد الجوية الوطنية الأمريكية (weather.gov) · الولايات المتحدة وأقاليمها فقط",
  "dm.alerts.failedTitle": "تعذّر الاتصال بهيئة الأرصاد الجوية الوطنية",
  "dm.alerts.failedBody":
    "تعذّر جلب التنبيهات الآن. يُرجى الرجوع مباشرة إلى weather.gov للحصول على المعلومات الرسمية.",
  "dm.alerts.noneTitle": "لا توجد تنبيهات نشطة",
  "dm.alerts.noneBody": "لا توجد حاليًا تنبيهات نشطة من هيئة الأرصاد الجوية الوطنية بشأن {place}.",
  "dm.floods.title": "مواقع تأثّرت بالفيضانات",
  "dm.floods.subtitle": "{state} · المصدر: واجهة USGS لتأثير الفيضانات في الوقت الفعلي",
  "dm.floods.notice":
    "هذه المعلومات أولية أو مؤقتة ولم تحصل على الموافقة النهائية من USGS. ويجب ألا تُستخدم في قرارات تتعلق بالسلامة الشخصية أو العامة.",
  "dm.floods.failedTitle": "تعذّر الاتصال بواجهة USGS لتأثير الفيضانات",
  "dm.floods.failedBody":
    "تعذّر جلب بيانات الفيضانات الآن. يُرجى الرجوع مباشرة إلى waterdata.usgs.gov.",
  "dm.floods.noneTitle": "لا توجد حاليًا مواقع متأثرة بالفيضانات",
  "dm.floods.noneBody": "لم يُبلَّغ عن أي مواقع مرجعية لدى USGS تشهد فيضانًا حاليًا في {state}.",
  "dm.shelters.title": "ملاجئ مخصصة قريبة",
  "dm.shelters.subtitle":
    "ضمن 25 ميلًا (نحو 40 كم) من {place} · المصدر: FEMA / الصليب الأحمر الأمريكي (HIFLD)",
  "dm.shelters.caveat":
    "يجب ألا تُستخدم هذه الطبقة لتحديد الحالة التشغيلية لأي منشأة أثناء حالة طوارئ قائمة. — FEMA/HIFLD",
  "dm.shelters.failedTitle": "تعذّر الاتصال بخدمة منشآت الإيواء",
  "dm.shelters.failedBody": "تعذّر جلب بيانات الملاجئ الآن.",
  "dm.shelters.noneTitle": "لم يُعثر على ملاجئ مخصصة ضمن النطاق",
  "dm.shelters.capacity": "سعة الإخلاء (المحددة): {count}",
  "dm.fires.title": "رصد حرائق نشطة",
  "dm.fires.subtitle":
    "ضمن نحو 1° من {place} · المصدر: NASA FIRMS (القمر الصناعي VIIRS)، آخر 24 ساعة",
  "dm.fires.caveat":
    "هذه شذوذات حرارية رصدتها الأقمار الصناعية (ارتفاع في حرارة السطح)، وليست حرائق غابات مؤكدة. وقد تظهر هنا أيضًا حرائق زراعية متعمدة ومصادر حرارة أخرى. — NASA FIRMS",
  "dm.fires.notConfiguredTitle": "بيانات رصد الحرائق غير مُعدّة",
  "dm.fires.notConfiguredBody":
    "عيّن NASA_FIRMS_MAP_KEY في متغيرات البيئة الخاصة بهذا التطبيق لتفعيل هذا القسم.",
  "dm.fires.failedTitle": "تعذّر الاتصال بـ NASA FIRMS",
  "dm.fires.failedBody": "تعذّر جلب بيانات رصد الحرائق الآن.",
  "dm.fires.noneTitle": "لا توجد عمليات رصد حرائق ضمن النطاق",
  "dm.fires.noneBody":
    "لم تُرصد أي شذوذات حرارية بواسطة الأقمار الصناعية قرب {place} خلال آخر 24 ساعة.",
  "dm.fires.lineDay": "الثقة: {confidence} · رصد نهاري · القمر الصناعي: {satellite}",
  "dm.fires.lineNight": "الثقة: {confidence} · رصد ليلي · القمر الصناعي: {satellite}",
  "dm.fires.unknown": "غير معروف",
  "dm.fires.detected": "رُصد في {when} UTC",
  "dm.fires.frp": "القدرة الإشعاعية للحريق: {value} ميغاواط",
  "dm.fire.day": "نهار",
  "dm.fire.night": "ليل",
  "dm.map.kind.flood": "موقع متأثر بالفيضان",
  "dm.map.kind.shelter": "ملجأ مخصص",
  "dm.map.kind.fire": "رصد حريق",
  "dm.map.layer.flood": "مواقع متأثرة بالفيضانات ({count})",
  "dm.map.layer.shelter": "ملاجئ مخصصة ({count})",
  "dm.map.layer.fire": "عمليات رصد الحرائق ({count})",
  "dm.map.popup": "{name} — {kind}",
  "dm.map.desc.none": "لا توجد بيانات فيضانات أو ملاجئ أو حرائق لعرضها على الخريطة.",
  "dm.map.desc.allHidden": "جميع طبقات المخاطر مخفية حاليًا.",
  "dm.map.desc.showing":
    "{count, plural, one {تعرض الخريطة موقعًا واحدًا: {items}.} two {تعرض الخريطة موقعين: {items}.} few {تعرض الخريطة # مواقع: {items}.} many {تعرض الخريطة # موقعًا: {items}.} other {تعرض الخريطة # موقع: {items}.}}",
  "dm.map.item.flood":
    "{count, plural, one {موقع واحد متأثر بالفيضان} two {موقعان متأثران بالفيضان} few {# مواقع متأثرة بالفيضان} many {# موقعًا متأثرًا بالفيضان} other {# موقع متأثر بالفيضان}}",
  "dm.map.item.shelter":
    "{count, plural, one {ملجأ مخصص واحد} two {ملجآن مخصصان} few {# ملاجئ مخصصة} many {# ملجأً مخصصًا} other {# ملجأ مخصص}}",
  "dm.map.item.fire":
    "{count, plural, one {رصد حريق واحد} two {رصدان للحريق} few {# عمليات رصد حريق} many {# عملية رصد حريق} other {# عملية رصد حريق}}",
  "dm.map.fallback.flood": "موقع يشهد فيضانًا حاليًا، بحسب آخر فحص أجرته USGS.",
  "dm.map.fallback.shelter": "منشأة إيواء مخصصة (موقع مرجعي فقط).",
  "dm.map.fireName": "رصد حريق (الثقة: {confidence})",
  "dm.map.fireSummary": "شذوذ حراري، {satellite}، {date} ({dayNight}). ليس حريق غابات مؤكدًا.",

  // ---- Team page, plan limits and plan notices (v108)
  "team.title": "الفريق — {workspace}",
  "team.intro": "ادعُ أشخاصًا إلى مساحة العمل هذه وأدِر صلاحيات وصولهم.",
  "team.denied.body": "ليس لهذا الدور صلاحية إدارة أعضاء الفريق في مساحة العمل هذه.",
  "team.invite.title": "دعوة شخص",
  "team.email": "البريد الإلكتروني",
  "team.role": "الدور",
  "team.invite.send": "إرسال الدعوة",
  "team.invite.sent": "تم إرسال الدعوة إلى {email}.",
  "team.invite.scope":
    "تقييد الوصول بموارد محددة (اختياري — اتركه دون تحديد للوصول إلى مساحة العمل كلها):",
  "team.you": "(أنت)",
  "team.youOwner": "(أنت · المالك)",
  "team.owner": "(المالك)",
  "team.remove": "إزالة",
  "team.empty.title": "لا يوجد أعضاء بعد",
  "team.empty.body": "ادعُ شخصًا من الأعلى للبدء.",
  "team.err.email": "أدخل عنوان بريد إلكتروني صالحًا.",
  "team.err.role": "اختر دورًا صالحًا.",
  "team.err.noInvite": "ليس لديك صلاحية دعوة أشخاص إلى مساحة العمل هذه.",
  "team.err.inviteFailed": "تعذّر إرسال الدعوة. يُرجى المحاولة مرة أخرى.",
  "team.err.noRemove": "ليس لديك صلاحية إزالة أشخاص من مساحة العمل هذه.",
  "team.err.removeFailed": "تعذّرت إزالة العضو.",
  "team.err.ownerCannotBeRemoved": "لا يمكن إزالة مالك المؤسسة.",
  "team.err.lastAdmin": "لا يمكنك إزالة آخر مالك أو مسؤول في مساحة العمل هذه.",
  "billing.limit.reached.seats":
    "تتضمن الخطة {plan} الخاصة بك ما يصل إلى {limit, plural, one {شخص واحد} two {شخصين} few {# أشخاص} many {# شخصًا} other {# شخص}}. قم بترقية خطتك لإضافة المزيد.",
  "billing.limit.reached.savedItems":
    "تتضمن الخطة {plan} الخاصة بك ما يصل إلى {limit, plural, one {عنصر واحد محفوظ} two {عنصرين محفوظين} few {# عناصر محفوظة} many {# عنصرًا محفوظًا} other {# عنصر محفوظ}} (تُحتسب الحقول والعقارات المؤمَّن عليها والمواقع المراقَبة معًا). قم بترقية خطتك لإضافة المزيد.",
  "billing.limit.reached.workspaces":
    "تتضمن الخطة {plan} الخاصة بك ما يصل إلى {limit, plural, one {مساحة عمل واحدة} two {مساحتي عمل} few {# مساحات عمل} many {# مساحة عمل} other {# مساحة عمل}}. قم بترقية خطتك لإضافة المزيد.",
  "billing.feature.included": "ميزة «{name}» متاحة في الخطة {lowest} وما فوقها. خطتك هي {plan}.",
  "billing.feature.includedMany":
    "ميزة «{name}» متاحة في الخطة {lowest} وما فوقها. خطتك هي {plan}.",
  "billing.feature.notPart": "ميزة «{name}» ليست جزءًا من الخطة {plan}.",
  "billing.feature.notPartMany": "ميزة «{name}» ليست جزءًا من الخطة {plan}.",
  "billing.feature.name.forecastOutlooks": "التوقعات",
  "billing.feature.name.csvExport": "تصدير CSV",
  "billing.feature.name.printReport": "الطباعة والتصدير بصيغة PDF",
  "billing.feature.name.auditableReport": "التقرير القابل للتدقيق",
  "billing.feature.name.teamTools": "أدوات الفريق",
  "billing.feature.name.emailAlerts": "تنبيهات البريد الإلكتروني",
  "billing.feature.name.smsAlerts": "تنبيهات الرسائل النصية",
  "billing.feature.name.auditLog": "سجل التدقيق",
  "billing.feature.name.bulkExport": "التصدير المجمّع",
  "billing.feature.name.apiAccess": "الوصول إلى واجهة API",
  "billing.feature.name.integrations": "عمليات التكامل",
  "billing.feature.name.sso": "تسجيل الدخول الموحّد",

  // ---- Team page — members without a profile (v108)
  "team.noProfile": "(لم يُعثر على ملف شخصي)",

  // ---- Failed-payment notice (v109)
  "notifications.msg.paymentFailed.title": "لم تتم عملية الدفع",
  "notifications.msg.paymentFailed.body":
    "تعذّر تجديد الخطة {plan} الخاصة بك. حدّث بطاقتك للاحتفاظ بها.",

  // ---- Hand over ownership of the organisation (v105)
  "settings.org.transfer.title": "نقل الملكية",
  "settings.org.transfer.intro":
    "سلّم مؤسستك إلى شخص آخر ينتمي إليها. يصبح مالكها ويتولى خطتها وفريقها، وتبقى أنت مسؤولًا فيها إلى أن يزيلك.",
  "settings.org.transfer.selectLabel": "المالك الجديد",
  "settings.org.transfer.selectPlaceholder": "اختر شخصًا",
  "settings.org.transfer.start": "نقل الملكية…",
  "settings.org.transfer.confirm":
    "هل تريد أن يصبح {email} مالك مؤسستك؟ سيتحكم في خطتها وفريقها وكل ما حُفظ فيها. تبقى أنت مسؤولًا، لكنه يستطيع إزالتك، ولا أحد غيره يستطيع إعادتها إليك.",
  "settings.org.transfer.yes": "نعم، انقلها",
  "settings.org.transfer.done": "أصبح {email} مالك مؤسستك. وأنت الآن مسؤول فيها.",
  "errors.orgTransferOwnerOnly": "مالك المؤسسة وحده يستطيع نقل ملكيتها.",
  "errors.orgTransferNotMember": "هذا الشخص ليس في مؤسستك، لذا لا يمكن نقل ملكيتها إليه.",
  "errors.orgTransferPaidPlan":
    "مؤسستك على الالخطة {plan}، وهي تخص مالكها ولا يمكن نقلها إلى شخص آخر بعد. يمكنك نقل الملكية بعد انتهاء الخطة.",
  "errors.orgTransferFailed": "تعذّر نقل ملكية مؤسستك. لم يتغير شيء. حاول مرة أخرى.",

  // ---- Ownership-received notice (v105)
  "notifications.msg.ownershipReceived.title": "جعلك {who} مالك {organisation}",
  "notifications.msg.ownershipReceived.body":
    "أصبحت الآن تدير خطتها وفريقها. افتح الإعدادات لرؤية الأشخاص المنتمين إليها.",

  // ---- Landing page (v106)
  "landing.tagline": "رؤى بيئية فورية، مشروحة بوضوح.",
  "landing.explore": "استكشف الكوكب",
  "landing.signIn": "تسجيل الدخول",
  "landing.appsPrompt": "تفضّل تطبيقًا؟",
  "landing.appsLink": "احصل على تطبيق سطح المكتب أو أندرويد",

  // ---- Sign-in, forgot-password and reset-password pages (v106)
  "auth.signIn.title": "تسجيل الدخول",
  "auth.signUp.title": "أنشئ حسابك",
  "auth.accountDeleted": "تم حذف حسابك.",
  "auth.resetSuccess": "تم تحديث كلمة المرور. يُرجى تسجيل الدخول.",
  "auth.inAppNote":
    "في هذا التطبيق، سجّل الدخول باستخدام بريدك الإلكتروني وكلمة المرور. إذا كنت تسجّل الدخول عادةً عبر Google، فاستخدم «نسيت كلمة المرور؟» لاختيار كلمة مرور أولًا.",
  "auth.google": "المتابعة باستخدام Google",
  "auth.or": "أو",
  "auth.email": "عنوان البريد الإلكتروني",
  "auth.password": "كلمة المرور",
  "auth.forgotLink": "نسيت كلمة المرور؟",
  "auth.remember": "تذكّرني على هذا الجهاز",
  "auth.signInButton": "تسجيل الدخول",
  "auth.signUpButton": "إنشاء حساب",
  "auth.haveAccount": "لديك حساب بالفعل؟",
  "auth.newHere": "جديد هنا؟",
  "auth.createLink": "إنشاء حساب",
  "auth.callback.missingToken": "يبدو أن رابط تسجيل الدخول هذا غير مكتمل. يُرجى طلب رابط جديد.",
  "auth.callback.verificationFailed":
    "انتهت صلاحية رابط تسجيل الدخول هذا أو سبق استخدامه. يُرجى طلب رابط جديد.",
  "auth.callback.oauthFailed": "تعذّر تسجيل الدخول عبر Google. يُرجى المحاولة مرة أخرى.",
  "auth.callback.oauthNotConfigured":
    "لم يُعدّ تسجيل الدخول عبر Google في هذا الموقع بعد. استخدم البريد الإلكتروني في الوقت الحالي.",
  "auth.callback.generic": "حدث خطأ ما. يُرجى طلب رابط تسجيل دخول جديد.",
  "auth.forgot.title": "إعادة تعيين كلمة المرور",
  "auth.forgot.sent":
    "تحقّق من بريدك الإلكتروني: إذا كان هناك حساب مرتبط بـ {email}، فقد أرسلنا إليه رابطًا لإعادة تعيين كلمة المرور.",
  "auth.forgot.intro":
    "أدخل البريد الإلكتروني المرتبط بحسابك وسنرسل إليك رابطًا لتعيين كلمة مرور جديدة.",
  "auth.forgot.send": "إرسال رابط إعادة التعيين",
  "auth.backToSignIn": "العودة إلى تسجيل الدخول",
  "auth.reset.title": "تعيين كلمة مرور جديدة",
  "auth.reset.newPassword": "كلمة المرور الجديدة",
  "auth.reset.confirm": "تأكيد كلمة المرور الجديدة",
  "auth.reset.submit": "تحديث كلمة المرور",
  "auth.reset.requestNew": "طلب رابط إعادة تعيين جديد",
  "auth.strength.veryWeak": "ضعيفة جدًا",
  "auth.strength.weak": "ضعيفة",
  "auth.strength.fair": "مقبولة",
  "auth.strength.strong": "قوية",
  "auth.strength.veryStrong": "قوية جدًا",
  "auth.strength.aria": "قوة كلمة المرور: {label}",
  "auth.err.invalidEmail": "أدخل عنوان بريد إلكتروني صالحًا.",
  "auth.err.sendLink": "حدث خطأ أثناء إرسال الرابط. يُرجى المحاولة مرة أخرى.",
  "auth.err.shortPassword": "يجب ألا تقل كلمة المرور عن 8 أحرف.",
  "auth.err.breached": "ظهرت كلمة المرور هذه في تسريب بيانات معروف. يُرجى اختيار كلمة مرور مختلفة.",
  "auth.err.signUpFailed":
    "تعذّر إنشاء حسابك. قد تحتاج إلى تأكيد بريدك الإلكتروني أولًا، أو حاول مرة أخرى.",
  "auth.err.enterBoth": "أدخل بريدك الإلكتروني وكلمة المرور.",
  "auth.err.lockedIp": "محاولات فاشلة كثيرة من هذه الشبكة. يُرجى المحاولة مرة أخرى بعد بضع دقائق.",
  "auth.err.locked": "محاولات فاشلة كثيرة. يُرجى المحاولة مرة أخرى بعد بضع دقائق.",
  "auth.err.invalid": "البريد الإلكتروني أو كلمة المرور غير صحيحة.",
  "auth.err.resetRateLimited":
    "طلبات إعادة تعيين كثيرة لهذا البريد الإلكتروني. يُرجى المحاولة مرة أخرى بعد بضع دقائق.",
  "auth.err.resetExpired": "انتهت صلاحية رابط إعادة تعيين كلمة المرور. يُرجى طلب رابط جديد.",
  "auth.err.updateFailed": "تعذّر تحديث كلمة المرور. يُرجى المحاولة مرة أخرى.",
  "auth.err.mismatch": "كلمتا المرور غير متطابقتين.",

  // ---- public Explorer and the Globe
  "explore.title": "استكشف كوكبك",
  "explore.intro":
    "ابحث عن أي مكان على الأرض لتحصل على لمحة حقيقية وصادقة عن ظروفه الحالية، دون الحاجة إلى حساب.",
  "explore.placeLabel": "اسم المكان",
  "explore.placePlaceholder": "جرّب مدينة أو بلدة أو منطقة…",
  "explore.submit": "استكشف",
  "explore.searching": "جارٍ البحث…",
  "explore.empty.title": "لم يتم استكشاف أي مكان بعد",
  "explore.empty.body": "ابحث عن مكان أعلاه لترى شيئًا صحيحًا عنه.",
  "explore.aiPanel.emptyTitle": "لا شيء لتفسيره بعد",
  "explore.aiPanel.emptyBody": "ابحث عن مكان لترى تحليلًا مولَّدًا بالذكاء الاصطناعي عنه.",
  "explore.err.enterPlace": "أدخل اسم مكان لاستكشافه.",
  "explore.err.lookupFailed": "تعذّر البحث عن هذا المكان الآن. يُرجى المحاولة مرة أخرى.",
  "explore.err.invalidLink": "رابط هذا المكان غير صالح. جرّب البحث عنه مرة أخرى.",
  "explore.err.dataFailed":
    "تم العثور على هذا المكان، لكن تعذّر جلب بياناته البيئية الآن. يُرجى المحاولة مرة أخرى بعد قليل.",
  "globe.title": "الكرة الأرضية",
  "globe.summary":
    "{count, plural, zero {لا مواقع} one {موقع واحد} two {موقعان} few {# مواقع} many {# موقعًا} other {# موقع}} عبر كل مساحات العمل التي يمكنك الوصول إليها: حقول زراعية وعقارات مؤمَّن عليها ومواقع مراقَبة. تفاصيل المخاطر والحالة موجودة في كل مساحة عمل؛ هذه نظرة عامة وليست بديلًا عنها.",
  "globe.loading": "جارٍ تحميل الكرة الأرضية…",
  "globe.empty.title": "لا توجد مواقع لعرضها",
  "globe.empty.body":
    "لا شيء يمكنك الوصول إليه في الزراعة أو التأمين أو الحكومة والمنظمات غير الحكومية له موقع بعد.",
  "globe.fireDetection": "رصد حريق (الثقة: {confidence})",

  // ---- browser-tab title
  "welcome.pageTitle": "مرحبًا بك",

  // ---- Globe: instant map and live hazard layers
  "globe.live.loading": "جارٍ تحميل طبقات المخاطر المباشرة (الفيضانات والملاجئ وكشف الحرائق)…",
  "globe.live.count":
    "{count, plural, zero {لا نقاط خطر مباشرة} one {نقطة خطر مباشرة واحدة} two {نقطتا خطر مباشرتان} few {# نقاط خطر مباشرة} many {# نقطة خطر مباشرة} other {# نقطة خطر مباشرة}} من مصادر عامة: الفيضانات والملاجئ وكشف الحرائق.",
  "globe.live.none": "لا توجد نقاط خطر مباشرة لعرضها الآن.",
  "globe.live.partial": "تعذّر تحميل بعض الطبقات المباشرة الآن، لذا قد يكون العرض ناقصًا.",
  "globe.live.failed": "تعذّر تحميل طبقات المخاطر المباشرة الآن. تظهر مواقعك الخاصة.",
  "globe.preview.loading3d":
    "جارٍ تحميل الكرة الأرضية ثلاثية الأبعاد… الخريطة المسطحة تعمل الآن. اختر نقطة لفتحها.",
  "globe.preview.no3d":
    "لا تعمل الكرة الأرضية ثلاثية الأبعاد في هذا المتصفح، لذا تظهر الخريطة المسطحة بدلًا منها. كل نقطة تفتح الصفحة نفسها.",
};
