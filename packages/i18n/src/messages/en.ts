/**
 * The source-of-truth message catalog. Every other language is a
 * `Messages` (a full `Record<MessageKey, string>`), so the compiler —
 * not a review — guarantees no language is missing a string, and a
 * test checks that placeholders and plural syntax line up too.
 *
 * Conventions: keys are `area.thing`; `{name}` is a variable; plurals
 * use `{count, plural, one {# day} other {# days}}`; text that is
 * ALL-CAPS in English is stored in sentence case and uppercased by CSS
 * (`text-transform`), because capitals don't exist in every script.
 */
export const en = {
  // ---- common
  "common.continue": "Continue",
  "common.back": "Back",
  "common.cancel": "Cancel",
  "common.skipForNow": "Skip for now",
  "common.change": "Change",
  "common.saved": "Saved.",
  "common.signInAgain": "Please sign in again to continue.",
  "common.genericError": "Something went wrong. Please try again.",
  "common.nothingHere": "Nothing here.",
  "common.listSeparator": ", ",

  // ---- app chrome (header, sidebar, search, bell, AI panel)
  "chrome.viewGlobe": "View the Globe",
  "chrome.settings": "Settings",
  "chrome.signOut": "Sign out",
  "chrome.sidebar.primary": "Primary",
  "chrome.sidebar.expand": "Expand sidebar (Ctrl+B)",
  "chrome.sidebar.collapse": "Collapse sidebar (Ctrl+B)",
  "chrome.sidebar.expandItem": "Expand {item}",
  "chrome.sidebar.collapseItem": "Collapse {item}",
  "chrome.aiPanel.open": "Open AI panel",
  "chrome.aiPanel.collapse": "Collapse AI panel",
  "chrome.aiPanel.region": "AI assistant",
  "chrome.aiPanel.title": "Assistant",
  "chrome.search.label": "Search World Vitality",
  "chrome.search.placeholder": "Search places, topics…",
  "chrome.search.hint": "Search (press / to focus)",
  "chrome.search.suggestions": "Search suggestions",
  "chrome.search.noQuickMatches": "No quick matches — press Enter to search for “{query}”",
  "chrome.search.pressEnter": "Press Enter for all results for “{query}”",
  "chrome.search.kind.workspace": "Workspace",
  "chrome.search.kind.page": "Page",
  "chrome.search.kind.setting": "Setting",
  "chrome.search.kind.tool": "Tool",
  "chrome.search.kind.place": "Place",
  "chrome.bell.label": "Notifications",
  "chrome.bell.unread": "{count} unread",
  "chrome.bell.critical": "{count} critical",

  // ---- navigation labels (sidebar)
  "nav.workspaces": "Workspaces",
  "nav.account": "Account",
  "nav.home": "Home",
  "nav.notifications": "Notifications",
  "nav.settings": "Settings",
  "nav.map": "Map",
  "nav.team": "Team",
  "nav.fieldOverview": "Field Overview",
  "nav.fieldReport": "Field Report",
  "nav.currentConditions": "Current Conditions",
  "nav.siteRisk": "Site Risk",
  "nav.generationOutlook": "Generation Outlook",
  "nav.datasetExplorer": "Dataset Explorer",
  "nav.routeRisk": "Route Risk",
  "nav.activeAlerts": "Active Alerts",
  "nav.jurisdictionOverview": "Jurisdiction Overview",
  "nav.formalReport": "Formal Report",
  "nav.underwritingRiskContext": "Underwriting Risk Context",
  "nav.auditableReport": "Auditable Report",
  "nav.explainThisData": "Explain This Data",
  "nav.lessonPlan": "Lesson Plan",

  // ---- workspaces (names are also the sidebar's top-level labels)
  "workspace.agriculture.name": "Agriculture",
  "workspace.agriculture.description": "Soil moisture, weather, and field conditions.",
  "workspace.weather.name": "Weather & Climate",
  "workspace.weather.description": "Current conditions and temperature status for your locations.",
  "workspace.construction.name": "Construction",
  "workspace.construction.description": "Site risk status for weather-sensitive activities.",
  "workspace.renewable-energy.name": "Renewable Energy",
  "workspace.renewable-energy.description": "Wind generation outlook for your assets.",
  "workspace.research.name": "Research",
  "workspace.research.description": "Explore raw environmental data with full provenance.",
  "workspace.logistics.name": "Logistics & Shipping",
  "workspace.logistics.description": "Route risk status for weather-sensitive shipments.",
  "workspace.disaster-monitoring.name": "Disaster Monitoring",
  "workspace.disaster-monitoring.description":
    "Live official National Weather Service alerts (U.S. only).",
  "workspace.government-ngos.name": "Government & NGOs",
  "workspace.government-ngos.description": "Multi-domain jurisdiction overview and reports.",
  "workspace.insurance.name": "Insurance",
  "workspace.insurance.description": "Underwriting risk context and auditable reports.",
  "workspace.education.name": "Education",
  "workspace.education.description":
    "Grade-level data explanations and sample lesson plans for educators.",

  // ---- roles in a workspace
  "role.admin_owner": "Owner / admin",
  "role.operational_user": "Operational user",
  "role.scoped_field_user": "Field user (scoped)",
  "role.viewer_external": "Viewer",

  // ---- onboarding personas
  "persona.farmer.label": "Farmer",
  "persona.farmer.description": "I grow crops or look after land.",
  "persona.builder.label": "Builder",
  "persona.builder.description": "I plan or run construction work.",
  "persona.energy.label": "Energy",
  "persona.energy.description": "I work with wind or solar power.",
  "persona.shipping.label": "Shipping",
  "persona.shipping.description": "I move goods by road, sea or air.",
  "persona.responder.label": "Emergency response",
  "persona.responder.description": "I watch for floods, fires and other hazards.",
  "persona.public-sector.label": "Government or NGO",
  "persona.public-sector.description": "I serve a community, region or programme.",
  "persona.insurer.label": "Insurer",
  "persona.insurer.description": "I assess or price environmental risk.",
  "persona.researcher.label": "Researcher",
  "persona.researcher.description": "I analyse environmental data.",
  "persona.learner.label": "Student or teacher",
  "persona.learner.description": "I learn or teach with real data.",
  "persona.weather.label": "Weather watcher",
  "persona.weather.description": "I follow the weather and climate.",
  "persona.curious.label": "Just curious",
  "persona.curious.description": "I want to look around the planet.",

  // ---- Home Dashboard
  "dashboard.yourPlace": "Your place",
  "dashboard.yourWorkspaces": "Your workspaces",
  "dashboard.changeRoleOrPlace": "Change your role or place",
  "dashboard.addPlacePrompt": "Add your place to see live conditions for it right here.",
  "dashboard.setItUp": "Set it up",
  "dashboard.recommended": "Recommended for you",
  "dashboard.insightGaps":
    "{count, plural, one {# day had no data available.} other {# days had no data available.}}",
  "dashboard.insightFailed":
    "Couldn’t load live conditions for your place right now. They’ll be back on your next visit.",
  "dashboard.tutorial.welcomeTitle": "Hi, I'm Orbi",
  "dashboard.tutorial.welcomeBody":
    "I'll be around to help you get oriented. Let's take a quick look around.",
  "dashboard.tutorial.workspacesTitle": "Your workspaces",
  "dashboard.tutorial.workspacesBody":
    "Each card below is a workspace — a focused set of data and tools for one domain, like Agriculture. Click one to dive in.",
  "dashboard.tutorial.aiTitle": "The AI panel",
  "dashboard.tutorial.aiBody":
    "Inside any workspace, open the AI panel to ask questions about its data. It always tells you how confident it is — never a guess dressed up as fact.",
  "dashboard.critical.label": "Critical",
  "dashboard.critical.region": "Critical alert",
  "dashboard.critical.openFull": "Open Notifications for the full text",
  "dashboard.critical.openMore": "Open Notifications — {count} more critical",

  // ---- Welcome (onboarding)
  "welcome.step": "Step {current} of {total}",
  "welcome.role.title": "Who are you here as?",
  "welcome.role.intro":
    "I’m Orbi. Pick the one that fits best and I’ll start you in the right place — you can change it any time in Settings.",
  "welcome.role.legend": "Your role",
  "welcome.place.title": "Which place matters most?",
  "welcome.place.intro":
    "I’ll show you real conditions for it right away. It’s the only thing I ask, and it stays on your account — you can change or remove it in Settings.",
  "welcome.place.inputLabel": "Town, city or region",
  "welcome.place.inputPlaceholder": "e.g. Ibadan",
  "welcome.place.search": "Search",
  "welcome.place.choose": "Choose the right one",
  "welcome.place.current": "Currently: {place}. Search above to change it.",
  "welcome.place.showMe": "Show me",
  "welcome.place.skipPlace": "Skip the place",
  "welcome.insight.title": "{place}, right now",
  "welcome.insight.titleFallback": "Your place, right now",
  "welcome.insight.fetching": "Fetching live data…",
  "welcome.insight.failed": "Couldn't load live data right now.",
  "welcome.insight.takeMeTo": "Take me to {destination}",
  "welcome.insight.takeMeToExplorer": "Take me to Explorer",

  // ---- Notification Center
  "notifications.title": "Notifications",
  "notifications.markAllRead": "Mark all as read",
  "notifications.preferences": "Preferences",
  "notifications.markRead": "Mark as read",
  "notifications.dismiss": "Dismiss",
  "notifications.view": "View",
  "notifications.checkAgain": "Check again",
  "notifications.setHomePlace": "Set your home place",
  "notifications.fullOfficialText": "Full official text",
  "notifications.unread": "Unread",
  "notifications.inboxEmpty": "Your inbox is empty.",
  "notifications.loadFailed":
    "We couldn’t load your notifications just now. Please refresh to try again.",
  "notifications.tier.critical": "Critical",
  "notifications.tier.alert": "Alerts",
  "notifications.tier.info": "Informational",
  "notifications.tag.critical": "Critical",
  "notifications.tag.alert": "Alert",
  "notifications.tag.info": "Info",
  "notifications.status.noPlace":
    "Official weather alerts are shown for your home place, and you haven’t set one yet.",
  "notifications.status.outOfCoverage":
    "Official alerts here come from the U.S. National Weather Service, which covers the U.S. and its territories. {place} is outside that area, so none are shown — that doesn’t mean nothing is happening there.",
  "notifications.status.lastChecked": "Last checked {ago}.",
  "notifications.status.showing":
    "Showing official alerts from the National Weather Service for {place}.",
  "notifications.status.none":
    "No official alerts from the National Weather Service are showing for {place}.",
  "notifications.status.failed":
    "We couldn’t reach the National Weather Service just now, so there may be official alerts that aren’t shown here. For anything urgent, use your local official sources.",
  "notifications.status.failedPlace":
    "We couldn’t reach the National Weather Service just now, so there may be official alerts for {place} that aren’t shown here. For anything urgent, use your local official sources.",
  "notifications.status.lastSuccess": "Last successful check: {ago}.",
  "notifications.officialEnglishNote":
    "Official alert text is shown exactly as the National Weather Service issued it, in English — it isn’t translated, so nothing in an emergency message can be altered.",
  "notifications.footnote":
    "World Vitality shows official alerts only while you have it open — it doesn’t send push, SMS or email notifications yet. For emergencies, follow your local authorities.",
  "notifications.msg.someone": "Someone",
  "notifications.msg.fieldComment.title": "{who} commented on {field}",
  "notifications.msg.memberAdded.title": "You now have access to {workspace}",
  "notifications.msg.memberAdded.body": "Your role there: {role}.",

  // ---- Settings
  "settings.title": "Settings",
  "settings.profile.title": "Profile",
  "settings.profile.email": "Email address",
  "settings.profile.displayName": "Display name",
  "settings.profile.displayNameHelp": "Shown to teammates in your workspaces.",
  "settings.profile.save": "Save name",
  "settings.profile.memberSince": "Member since {date}.",
  "settings.roleAndPlace.title": "Your role and place",
  "settings.roleAndPlace.notSetUp":
    "You haven’t set these up yet. Tell me who you are and the place you care about, and I’ll show live conditions for it on your dashboard and in your workspaces.",
  "settings.roleAndPlace.role": "Role:",
  "settings.roleAndPlace.homePlace": "Home place:",
  "settings.roleAndPlace.notSet": "not set",
  "settings.roleAndPlace.removed": "removed",
  "settings.roleAndPlace.setUp": "Set up",
  "settings.roleAndPlace.remove": "Remove my place",
  "settings.language.title": "Language",
  "settings.language.label": "Language for menus and messages",
  "settings.language.draftNote":
    "Languages other than English are drafted by AI and haven’t been reviewed by a native speaker yet — if something reads wrong, English is always available.",
  "settings.language.scopeNote":
    "Workspace pages, data explanations and official alerts are still in English for now.",
  "settings.language.draftTag": "draft",
  "settings.language.saved": "Language updated.",
  "settings.language.failed": "Couldn’t change the language. Please try again.",
  "settings.notifications.title": "Notifications",
  "settings.notifications.loadFailed":
    "We couldn’t load your notification settings just now. Refresh to try again.",
  "settings.notifications.officialLegend": "Official weather alerts for your home place",
  "settings.notifications.showAll": "Show all of them, including minor advisories and statements",
  "settings.notifications.alertsOnly": "Only alerts and critical ones — skip minor advisories",
  "settings.notifications.criticalAlways":
    "Critical, life-safety alerts are always shown and can’t be turned off.",
  "settings.notifications.collaboration": "Tell me when a teammate comments on a field I created",
  "settings.notifications.inAppNote":
    "Notifications appear in the app only — World Vitality doesn’t send push, SMS or email yet, and checks for official alerts only while it’s open. See your",
  "settings.notifications.center": "Notification Center",
  "settings.notifications.save": "Save notification settings",
  "settings.notifications.saveFailed":
    "Couldn’t save your notification settings. Please try again.",
  "settings.workspaces.title": "Your workspaces",
  "settings.workspaces.none": "You aren’t a member of any workspace yet.",
  "settings.workspaces.limited": "(limited to specific items)",
  "settings.download.title": "Download your data",
  "settings.download.body":
    "One click, no waiting: a JSON file with your profile, your role and home place, your notification settings and inbox, your workspace memberships, everything you created (fields, properties, locations) and the comments you wrote. It doesn’t include other people’s data or public environmental readings, and the file says so.",
  "settings.download.button": "Download my data",
  "settings.delete.title": "Delete your account",
  "settings.delete.body":
    "This permanently deletes your account, memberships, notifications and the comments you wrote, right away. Fields, properties and locations you added belong to the workspace, so they stay — without your name on them. This can’t be undone; download your data first if you want a copy.",
  "settings.delete.confirmLabel": "Type {word} to confirm",
  "settings.delete.button": "Delete my account",

  // ---- Search results page
  "search.title": "Search",
  "search.resultsFor": "Results for “{query}”",
  "search.empty.title": "Search anything",
  "search.empty.description":
    "Try a place, a topic or a page — for example: {examples}. Press / anywhere to jump to the search box.",
  "search.question.title": "I can’t answer that question directly",
  "search.question.body":
    "Search finds workspaces, pages and places. I don’t have a reliable source for open-ended questions, so I won’t guess. Here’s where the parts of your question live.",
  "search.question.bodyWithPlace":
    "Search finds workspaces, pages and places. I don’t have a reliable source for open-ended questions, so I won’t guess. Here’s where the parts of your question live, including “{place}”.",
  "search.workspacesAndPages": "Workspaces and pages",
  "search.placesMatching": "Places matching “{place}”",
  "search.places": "Places",
  "search.nothingMatched": "Nothing matched “{query}”",
  "search.nothingMatchedHelp":
    "Try a place name, a topic like flood or solar, or a page like team or settings.",
  "search.placesFailed":
    "Place lookup isn’t available right now, so only workspaces and pages are shown. Try again in a moment.",
  "search.signedOutNote":
    "Workspaces need an account. Places open in Public Explorer with no account.",
  "search.signIn": "Sign in to open workspaces",

  // ---- search index (page names the search box finds)
  "searchIndex.dashboard.label": "Home Dashboard",
  "searchIndex.dashboard.description": "Your workspaces in one place",
  "searchIndex.explorer.label": "Public Explorer",
  "searchIndex.explorer.description": "Look up any place on Earth — no account needed",
  "searchIndex.globe.label": "The Globe",
  "searchIndex.globe.description": "A 3D view of the planet",
  "searchIndex.notifications.label": "Notifications",
  "searchIndex.notifications.description":
    "Alerts for your home place and activity in your workspaces",
  "searchIndex.notificationPrefs.label": "Notification preferences",
  "searchIndex.notificationPrefs.description": "Choose which alerts and activity you see",
  "searchIndex.settings.label": "Settings",
  "searchIndex.settings.description": "Your profile and account",
  "searchIndex.export.label": "Download my data",
  "searchIndex.export.description": "One-click export of everything tied to your account",
  "searchIndex.delete.label": "Delete my account",
  "searchIndex.delete.description": "Permanently remove your account",

  // ---- assistant panel empty state
  "chrome.aiPanel.emptyTitle": "No active conversation",
  "chrome.aiPanel.emptyBody": "Open a workspace to ask about its data.",

  // ---- errors shown by form actions (these are produced on the server)
  "errors.typeTwoLetters": "Type at least two letters of a town, city or region.",
  "errors.noPlaceFound":
    "No place found matching “{query}”. Try a different spelling or a nearby city.",
  "errors.placeLookupFailed": "Couldn’t look up places right now. Please try again.",
  "errors.pickRoleAndPlace": "Pick who you are and a place first.",
  "errors.liveDataFailed":
    "Couldn’t fetch live data for {place} right now. You can still continue — it will load in your workspace.",
  "errors.invalidRole": "That role isn’t one of the options.",
  "errors.invalidPlace": "That place isn’t valid. Please search for it again.",
  "errors.saveFailed": "Couldn’t save that right now. Please try again.",
  "errors.removeFailed": "Couldn’t remove that right now. Please try again.",
  "errors.weatherServiceUnreachable":
    "Couldn’t reach the weather service just now. Please try again.",
  "errors.nameTooLong": "Keep your name under {max} characters.",
  "errors.sessionExpired": "Your session has expired. Please sign in again.",
  "errors.nameSaveFailed": "Couldn’t save your name. Please try again.",
  "errors.typeToConfirm": "Type {word} to confirm.",
  "errors.deleteFailed": "Couldn’t delete your account. Please try again.",

  // ---- search place result line
  "search.placeDescription": "See current conditions",

  // ---- first-use tutorial popup
  "chrome.tutorial.step": "Step {current} of {total}",
  "chrome.tutorial.skip": "Skip",
  "chrome.tutorial.back": "Back",
  "chrome.tutorial.next": "Next",
  "chrome.tutorial.getStarted": "Get started",
  // ---- phone layout: menu button and bottom bar
  "chrome.nav.menu": "Menu",
  "chrome.nav.closeMenu": "Close menu",
  "chrome.nav.quickNav": "Quick navigation",
  "chrome.nav.home": "Home",
  "chrome.nav.map": "Map",
  "chrome.nav.alerts": "Alerts",
  "chrome.nav.search": "Search",
  "chrome.nav.ai": "AI",

  // ---- offline use and installing the app
  "chrome.offline.offline": "You’re offline. What you see may be out of date.",
  "chrome.offline.savedCopy":
    "You’re viewing the copy you last opened, saved {ago}. Reconnect and reload for current information.",
  "chrome.offline.reload": "Reload",
  "offline.title": "You’re offline",
  "offline.body":
    "World Vitality can’t reach the internet right now. Pages you opened recently are saved on this device and open with a note showing when they were saved. Everything else needs a connection.",
  "offline.retry": "Try again",
  "offline.dashboard": "Open the dashboard",
  "offline.privacy": "Saved pages stay on this device and are removed when you sign out.",
  "settings.install.title": "Install on this device",
  "settings.install.body":
    "Add World Vitality to your home screen or desktop so it opens like an app. Pages you opened recently stay available offline — saved on this device only, and removed when you sign out.",
  "settings.install.button": "Install app",
  "settings.install.installed": "World Vitality is installed on this device.",
  "settings.install.hint":
    "To install, open your browser’s share or menu button and choose “Add to Home Screen” or “Install app”.",

  // ---- Weather & Climate workspace (home page) and the location note shared by workspace pages
  "weather.currentConditions": "Current Conditions",
  "weather.status": "Status",
  "weather.temperature": "Temperature",
  "weather.alerts": "Alerts",
  "weather.noActiveAlerts": "No active alerts",
  "weather.trend": "Trend",
  "weather.forecast": "Forecast",
  "weather.noForecast": "No forecast available",
  "weather.historicalContext": "Historical context",
  "weather.noBenchmark": "No regional climate benchmark yet",
  "weather.gaps":
    "{count, plural, one {# day had no data available.} other {# days had no data available.}}",
  "weather.forecastGaps":
    "{count, plural, one {# forecast day had no data available.} other {# forecast days had no data available.}}",
  "weather.aiPanel.emptyTitle": "Nothing to interpret yet",
  "weather.aiPanel.emptyBody": "Open Current Conditions to see an AI-generated status.",
  "workspace.locationNote.home": "Showing {place}, your home place.",
  "workspace.locationNote.change": "Change",
  "workspace.locationNote.demo": "Showing a demo location ({place}).",
  "workspace.locationNote.setOwn": "Set your own place",
  "workspace.locationNote.demoTail": "to see your conditions here.",
} as const;

export type MessageKey = keyof typeof en;
export type Messages = Record<MessageKey, string>;
