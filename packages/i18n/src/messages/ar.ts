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
    "يؤدي هذا إلى حذف حسابك وعضوياتك وإشعاراتك والتعليقات التي كتبتها نهائيًا وفورًا. وإذا كنت مالك مؤسستك، فتُحذف أيضًا الحقول والعقارات والمواقع المحفوظة فيها (ولا يمكن ذلك إلا بعد إزالة جميع الأعضاء الآخرين منها). وإذا كنت عضوًا في مؤسسة شخص آخر، فما أضفتَه يبقى هناك دون اسمك. لا يمكن التراجع عن ذلك؛ نزّل بياناتك أولًا إذا أردت نسخة.",
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
    "ما زال لدى مؤسستك أعضاء آخرون ({count}). أزِلهم أولًا من صفحة «الفريق» ثم احذف حسابك.",

  // ---- plan & billing (v95)
  "billing.title": "الخطة والفوترة",
  "billing.back": "العودة إلى الإعدادات",
  "billing.seePlans": "عرض الخطط",
  "billing.plan.basic": "الأساسية",
  "billing.plan.standard": "القياسية",
  "billing.plan.premium": "المميزة",
  "billing.plan.enterprise": "المؤسسات",
  "billing.current.title": "خطتك",
  "billing.state.free": "أنت على الخطة الأساسية المجانية.",
  "billing.state.lapsed":
    "لم تنجح عملية الدفع الأخيرة، لذا أنت على الخطة الأساسية حاليًا. يمكنك تحديث بطاقتك أدناه.",
  "billing.state.active": "أنت مشترك في خطة {plan}. يتجدد الاشتراك تلقائيًا.",
  "billing.state.ending":
    "تم إلغاء خطة {plan}. تحتفظ بها حتى {date} ثم تنتقل إلى الخطة الأساسية. لا يُحذف أي شيء.",
  "billing.state.endingNoDate":
    "تم إلغاء خطة {plan}. تحتفظ بها حتى نهاية الفترة التي دفعت ثمنها ثم تنتقل إلى الخطة الأساسية. لا يُحذف أي شيء.",
  "billing.state.pastDue":
    "لم تنجح عملية الدفع الأخيرة. تبقى خطة {plan} فعّالة حتى {date} ريثما تحدّث بطاقتك.",
  "billing.state.pastDueNoDate":
    "لم تنجح عملية الدفع الأخيرة. تبقى خطة {plan} فعّالة لبضعة أيام ريثما تحدّث بطاقتك.",
  "billing.state.manual": "تم الاتفاق على خطة {plan} معنا مباشرة، لذا لا يوجد ما تديره هنا.",
  "billing.member.note": "مالك مؤسستك هو من يدير خطتها. أنت تستخدم خطة {plan} الخاصة به.",
  "billing.return.confirming":
    "شكرًا لك. نتأكد من دفعتك لدى Paystack، وهذا يستغرق عادةً بضع ثوانٍ. إذا لم تتغير خطتك بعد، فحدّث هذه الصفحة.",
  "billing.return.refresh": "تحديث",
  "billing.return.done": "تم تأكيد الدفع. أنت الآن على خطة {plan}.",
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
  "billing.subscribe": "الاشتراك في خطة {plan}",
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
  "settings.billing.body": "أنت على خطة {plan}.",
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
  "weather.forecastGaps":
    "{count, plural, zero {لا توجد أيام توقعات بلا بيانات.} one {يوم توقعات واحد لم تتوفر عنه بيانات.} two {يوما توقعات لم تتوفر عنهما بيانات.} few {# أيام توقعات لم تتوفر عنها بيانات.} many {# يومًا من التوقعات لم تتوفر عنها بيانات.} other {# يوم من التوقعات لم تتوفر عنها بيانات.}}",
  "weather.aiPanel.emptyTitle": "لا شيء لتفسيره بعد",
  "weather.aiPanel.emptyBody": "افتح «الظروف الحالية» لعرض حالة مولَّدة بالذكاء الاصطناعي.",
  "workspace.locationNote.home": "يُعرض {place}، مكان إقامتك.",
  "workspace.locationNote.change": "تغيير",
  "workspace.locationNote.demo": "يُعرض موقع تجريبي ({place}).",
  "workspace.locationNote.setOwn": "حدّد مكانك الخاص",
  "workspace.locationNote.demoTail": "لترى ظروفك هنا.",
};
