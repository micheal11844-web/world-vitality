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
  "settings.notifications.heatWatch":
    "Tell me when a satellite sees heat within 10 km of a place I saved",
  "settings.notifications.heatWatchHelp":
    "Satellite heat is not a confirmed fire: it is often farm burning or a gas flare. It is checked only while World Vitality is open, and one notice is sent per place per day.",
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
    "This permanently deletes your account, memberships, notifications and the comments you wrote, right away. If you own your organisation, the fields, properties and locations saved in it are deleted too (you can only do this once everyone else has been removed from it; to leave it as it is, hand it over to someone in it first). If you are a member of someone else’s organisation, what you added stays there, without your name on it. This can’t be undone; download your data first if you want a copy.",
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
  "errors.deleteOrganizationHasMembers":
    "Your organisation still has other members ({count}). Hand it over to one of them, or remove them on the Team page, then delete your account.",

  // ---- plan & billing (v95)
  "billing.title": "Plan & billing",
  "billing.back": "Back to settings",
  "billing.seePlans": "See plans",
  "billing.plan.basic": "Basic",
  "billing.plan.standard": "Standard",
  "billing.plan.premium": "Premium",
  "billing.plan.enterprise": "Enterprise",
  "billing.current.title": "Your plan",
  "billing.state.free": "You’re on the free Basic plan.",
  "billing.state.lapsed":
    "Your last payment didn’t go through, so you’re on Basic for now. You can update your card below.",
  "billing.state.active": "You’re subscribed to {plan}. It renews automatically.",
  "billing.state.ending":
    "Your {plan} plan is cancelled. You keep it until {date}, then you move to Basic. Nothing is deleted.",
  "billing.state.endingNoDate":
    "Your {plan} plan is cancelled. You keep it until the end of the period you paid for, then you move to Basic. Nothing is deleted.",
  "billing.state.pastDue":
    "Your last payment didn’t go through. Your {plan} plan stays on until {date} while you update your card.",
  "billing.state.pastDueNoDate":
    "Your last payment didn’t go through. Your {plan} plan stays on for a few days while you update your card.",
  "billing.state.manual":
    "Your {plan} plan is set up by agreement with us, so there’s nothing to manage here.",
  "billing.member.note":
    "Your organisation’s plan is managed by its owner. You’re using their {plan} plan.",
  "billing.return.confirming":
    "Thanks. We’re confirming your payment with Paystack, which usually takes a few seconds. If your plan hasn’t changed yet, refresh this page.",
  "billing.return.refresh": "Refresh",
  "billing.return.done": "Payment confirmed. You’re on the {plan} plan.",
  "billing.limit.seats": "People in your organisation",
  "billing.limit.savedItems": "Saved fields, properties and locations",
  "billing.limit.unlimited": "No set limit",
  "billing.plans.title": "Plans",
  "billing.plans.free": "Free",
  "billing.plans.current": "Your plan",
  "billing.plans.notOffered": "Not available to buy yet.",
  "billing.plans.none": "Plans can’t be bought just yet. Please check back soon.",
  "billing.interval.monthly": "Monthly",
  "billing.interval.annual": "Yearly",
  "billing.interval.saving": "2 months free",
  "billing.interval.label": "Billing period",
  "billing.currency.label": "Currency",
  "billing.currency.NGN": "Naira (₦)",
  "billing.currency.USD": "US dollars ($)",
  "billing.price.monthly": "{price} / month",
  "billing.price.annual": "{price} / year",
  "billing.subscribe": "Subscribe to {plan}",
  "billing.subscribe.failed":
    "Couldn’t start the payment, and nothing was charged. Please try again in a moment.",
  "billing.payNote":
    "You pay on Paystack’s secure page, and we never see your card details. The price shown is the price charged. Cancel any time and keep your plan until the end of the period you paid for.",
  "billing.switchNote":
    "To move between paid plans, cancel the current one and subscribe to the other once it ends. Paystack can’t switch a running subscription.",
  "billing.alwaysFree":
    "Official weather alerts, the Public Explorer, and exporting or deleting your own data are free on every plan.",
  "billing.ownerOnly": "Only the owner of the organisation can subscribe or change the plan.",
  "billing.manage.title": "Card and cancellation",
  "billing.manage.cardBody":
    "Opens Paystack’s page, where you can change the card used for renewals.",
  "billing.manage.card": "Update card on Paystack",
  "billing.manage.cardFailed":
    "Couldn’t open Paystack’s page right now. Please try again in a moment.",
  "billing.manage.cancel": "Cancel subscription",
  "billing.manage.cancelBody":
    "You keep your plan until the end of the period you’ve paid for, then move to Basic. Nothing is deleted; you just can’t add more than Basic allows.",
  "billing.manage.cancelConfirm": "Yes, cancel at the end of the period",
  "billing.manage.cancelKeep": "Keep my plan",
  "billing.manage.cancelDone":
    "Cancellation requested. This page updates as soon as Paystack confirms it.",
  "billing.manage.cancelFailed":
    "Couldn’t cancel just now, and nothing has changed. Please try again in a moment.",
  "settings.billing.title": "Plan & billing",
  "settings.billing.body": "You’re on the {plan} plan.",
  "settings.billing.link": "See plan & billing",
  "settings.delete.billingNote":
    "If you have a paid subscription, we cancel it with Paystack first, so you aren’t charged again.",
  "errors.billingUnavailable": "Billing isn’t available right now. Please try again later.",
  "errors.billingOwnerOnly": "Only the owner of the organisation can change its plan.",
  "errors.billingAlreadySubscribed":
    "You already have a subscription. You can manage it on the plan page.",
  "errors.billingNotOffered": "That plan isn’t available to buy right now.",
  "errors.billingNotSubscribed": "There’s no subscription to manage.",
  "errors.deleteCancelSubscriptionFailed":
    "We couldn’t cancel your subscription with Paystack, so your account has not been deleted (otherwise you would keep being charged). Please try again in a moment.",

  // ---- organisation card (v96)
  "settings.org.title": "Your organisation",
  "settings.org.owner": "You own this organisation.",
  "settings.org.member": "You’re a member of this organisation. Its owner manages it.",
  "settings.org.nameLabel": "Organisation name",
  "settings.org.nameHelp":
    "Up to {max} characters. It appears in your data export and in our support tools.",
  "settings.org.save": "Save organisation name",
  "settings.org.people.title": "People in your organisation",
  "settings.org.people.count": "{count, plural, one {# person} other {# people}}",
  "settings.org.people.owner": "Owner",
  "settings.org.people.member": "Member",
  "settings.org.people.you": "you",
  "settings.org.people.hint": "To add or remove people, open a workspace and choose Team.",
  "settings.org.people.loadFailed": "Couldn’t load the list of people just now. Please try again.",
  "errors.orgNameInvalid": "Use between 1 and {max} characters for the organisation name.",
  "errors.orgRenameFailed": "Couldn’t rename your organisation. Please try again.",
  "errors.orgOwnerOnly": "Only the owner of the organisation can rename it.",

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
  "settings.install.appsLead": "Prefer a desktop or Android app?",
  "settings.install.appsLink": "See the downloads",

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
  "workspace.forecastGaps":
    "{count, plural, one {# forecast day had no data available.} other {# forecast days had no data available.}}",
  "weather.aiPanel.emptyTitle": "Nothing to interpret yet",
  "weather.aiPanel.emptyBody": "Open Current Conditions to see an AI-generated status.",
  "workspace.locationNote.home": "Showing {place}, your home place.",
  "workspace.locationNote.change": "Change",
  "workspace.locationNote.demo": "Showing a demo location ({place}).",
  "workspace.locationNote.setOwn": "Set your own place",
  "workspace.locationNote.demoTail": "to see your conditions here.",

  // ---- Shared workspace pieces: empty states, edit/delete, report buttons (v104)
  "workspace.aiPanel.emptyTitle": "Nothing to interpret yet",
  "workspace.alerts": "Alerts",
  "workspace.noActiveAlerts": "No active alerts",
  "workspace.trend": "Trend",
  "workspace.comparison": "Comparison",
  "workspace.map": "Map",
  "workspace.viewFullMap": "View full map →",
  "workspace.noBenchmark": "No regional benchmark yet",
  "workspace.gaps":
    "{count, plural, one {# day had no data available.} other {# days had no data available.}}",
  "resource.edit": "Edit",
  "resource.delete": "Delete",
  "resource.confirmDelete": "Confirm delete?",
  "resource.save": "Save",
  "resource.name": "Name",
  "resource.latitude": "Latitude",
  "resource.longitude": "Longitude",
  "resource.sessionUnverified": "Your session could not be verified. Please sign in again.",
  "resource.latitudeRange": "Latitude must be a number between -90 and 90.",
  "resource.longitudeRange": "Longitude must be a number between -180 and 180.",
  "report.generated": "Generated {when}",
  "report.print": "Print / Save as PDF",
  "report.downloadCsv": "Download CSV",
  "report.accessDenied": "Access denied",
  "report.accessDeniedBody":
    "This role does not have permission to create reports in this workspace.",

  // ---- Agriculture workspace (v104)
  "agri.aiPanel.emptyBody": "Open Field Overview to see an AI-generated status.",
  "agri.soilMoisture": "Soil moisture",
  "agri.temperature": "Temperature",
  "agri.empty.noFields": "No fields yet",
  "agri.empty.noFieldsVisible": "No fields visible for your role",
  "agri.empty.addAbove": "Add a field above to get started.",
  "agri.empty.scoped":
    "Your access is scoped to specific fields, and none are currently assigned to you.",
  "agri.reportCard.body":
    "Current-conditions snapshot for every field you can see, exportable as CSV or PDF →",
  "agri.trend.emptyTitle": "Not enough history yet",
  "agri.trend.emptyBody": "Trend comparisons need more than one season of data.",
  "agri.add.title": "Add a field",
  "agri.add.button": "Add field",
  "agri.add.success": "“{name}” added.",
  "agri.comments.show": "Comments ({count})",
  "agri.comments.hide": "Hide comments",
  "agri.comments.none": "No comments yet.",
  "agri.comments.label": "Comment",
  "agri.comments.add": "Add a comment",
  "agri.comments.post": "Post",
  "agri.comments.edited": "(edited)",
  "agri.err.nameRequired": "Enter a field name.",
  "agri.err.noPermissionAdd": "You do not have permission to add fields in this workspace.",
  "agri.err.createFailed": "Failed to create field. Please try again.",
  "agri.err.noPermissionEdit": "You do not have permission to edit this field.",
  "agri.err.updateFailed": "Failed to update field. Please try again.",
  "agri.err.noPermissionDelete": "You do not have permission to delete this field.",
  "agri.err.deleteFailed": "Failed to delete field. Please try again.",
  "agri.err.commentEmpty": "Comment can’t be empty.",
  "agri.err.noPermissionComment": "You do not have permission to comment on this field.",
  "agri.err.postFailed": "Failed to post comment. Please try again.",
  "agri.err.editOwnOnly": "You can only edit your own comments.",
  "agri.err.deleteOwnOnly": "You can only delete your own comments.",
  "agri.report.snapshotNote":
    "This is a current-conditions snapshot for every field you can see — not a season-end summary and not a comparison against historical norms (no prior-season data exists in this app). See World Vitality’s data provenance documentation for source details.",
  "agri.report.noFieldsTitle": "No fields visible",
  "agri.report.noFieldsBody": "There are no fields to include in this report.",
  "agri.map.noFieldsBody":
    "There are no fields to show on the map yet. Add a field from the workspace home page.",

  // ---- Map text shared by the resource maps; Agriculture map (v104)
  "map.moisture.veryDry": "very dry",
  "map.moisture.dry": "dry",
  "map.moisture.moderate": "moderate moisture",
  "map.moisture.moist": "moist",
  "map.moisture.saturated": "saturated",
  "agri.map.toggle": "Soil moisture ({count, plural, one {# field} other {# fields}})",
  "map.popupReading": "{name}: {label} ({value} of 1.0)",
  "map.popupNoReading": "{name}: no current soil moisture reading",
  "agri.map.descNone": "No fields to show on the map.",
  "agri.map.descOn": "Map showing {count, plural, one {# field} other {# fields}}. {items}",
  "agri.map.descOff":
    "Map showing {count, plural, one {# field} other {# fields}}. Soil moisture overlay is currently hidden.",
  "map.descItem": "{name}: {label} ({value} on a 0 to 1 scale)",
  "map.descItemNoReading": "{name}: no current reading",

  // ---- Shared: signed-in line, report link, map readings (v105)
  "workspace.signedInAs": "Signed in as: {role}",
  "report.open": "Open Report",
  "report.notAvailable": "Report export not available for your role",

  // ---- Insurance workspace (v105)
  "insurance.role.admin_owner": "Admin",
  "insurance.role.operational_user": "Underwriter",
  "insurance.role.scoped_field_user": "Claims Adjuster",
  "insurance.role.viewer_external": "Analyst (read-only)",
  "insurance.aiPanel.emptyBody": "Open Underwriting Risk Context to see an AI-generated status.",
  "insurance.home.intro":
    "Real insured portfolio ({count, plural, one {# property} other {# properties}}). Individual hazard signals only; no synthesized multi-hazard risk score (see this page’s honest-scope notes).",
  "insurance.empty.noProperties": "No insured properties yet",
  "insurance.empty.noPropertiesVisible": "No properties visible for your role",
  "insurance.empty.addAbove": "Add an insured property above to get started.",
  "insurance.empty.scoped":
    "Your access is scoped to specific properties, and none are currently assigned to you.",
  "insurance.temperature": "Temperature",
  "insurance.soilDrought": "Soil / drought-adjacent",
  "insurance.reportCard.body":
    "Generate a print-ready underwriting report, with sources, timestamps, and a logged audit trail entry.",
  "insurance.add.title": "Add an insured property",
  "insurance.add.button": "Add property",
  "insurance.add.success": "“{name}” added.",
  "insurance.policyNumber": "Policy number",
  "insurance.address": "Address",
  "insurance.propertyAddress": "Property address",
  "insurance.err.policyRequired": "Enter a policy number.",
  "insurance.err.addressRequired": "Enter a property address.",
  "insurance.err.noPermissionAdd":
    "You do not have permission to add insured properties in this workspace.",
  "insurance.err.createFailed": "Failed to create insured property. Please try again.",
  "insurance.err.noPermissionEdit": "You do not have permission to edit this property.",
  "insurance.err.updateFailed": "Failed to update insured property. Please try again.",
  "insurance.err.noPermissionDelete": "You do not have permission to delete this property.",
  "insurance.err.deleteFailed": "Failed to delete insured property. Please try again.",
  "insurance.report.title": "Underwriting Risk Report",
  "insurance.report.count": "{count, plural, one {# property} other {# properties}}",
  "insurance.report.scopeNote":
    "This report covers every insured property you can see, and shows individual hazard signals only — not a synthesized multi-hazard risk score. Not suitable for real underwriting, claims, or regulatory documentation as-is. Report access is logged to this workspace’s audit trail. See World Vitality’s data provenance documentation for source details.",
  "insurance.report.noPropertiesTitle": "No properties visible",
  "insurance.report.noPropertiesBody": "There are no insured properties to include in this report.",
  "insurance.map.noPropertiesBody":
    "There are no insured properties to show on the map yet. Add a property from the workspace home page.",
  "insurance.map.toggle": "Soil moisture ({count, plural, one {# property} other {# properties}})",
  "insurance.map.descNone": "No properties to show on the map.",
  "insurance.map.descOn":
    "Map showing {count, plural, one {# property} other {# properties}}. {items}",
  "insurance.map.descOff":
    "Map showing {count, plural, one {# property} other {# properties}}. Soil moisture overlay is currently hidden.",

  // ---- Government & NGOs workspace (v105)
  "gov.role.admin_owner": "Agency Admin",
  "gov.role.operational_user": "Analyst",
  "gov.role.scoped_field_user": "Field Staff",
  "gov.role.viewer_external": "Partner Agency (view-only)",
  "gov.aiPanel.emptyBody": "Open Jurisdiction Overview to see an AI-generated status.",
  "gov.home.intro":
    "Real monitored locations ({count, plural, one {# location} other {# locations}}), not real jurisdiction boundaries (see this page’s honest-scope notes).",
  "gov.empty.noLocations": "No monitored locations yet",
  "gov.empty.noLocationsVisible": "No locations visible for your role",
  "gov.empty.addAbove": "Add a monitored location above to get started.",
  "gov.empty.scoped":
    "Your access is scoped to specific locations, and none are currently assigned to you.",
  "gov.climate": "Climate",
  "gov.reportCard.body":
    "Generate a print-ready report of this overview, with sources and timestamps.",
  "gov.add.title": "Add a monitored location",
  "gov.add.button": "Add location",
  "gov.add.success": "“{name}” added.",
  "gov.label": "Label",
  "gov.locationLabel": "Location label",
  "gov.err.labelRequired": "Enter a label for this location.",
  "gov.err.noPermissionAdd":
    "You do not have permission to add monitored locations in this workspace.",
  "gov.err.createFailed": "Failed to add monitored location. Please try again.",
  "gov.err.noPermissionEdit": "You do not have permission to edit this location.",
  "gov.err.updateFailed": "Failed to update monitored location. Please try again.",
  "gov.err.noPermissionDelete": "You do not have permission to delete this location.",
  "gov.err.deleteFailed": "Failed to delete monitored location. Please try again.",
  "gov.report.title": "Jurisdiction Overview Report",
  "gov.report.count": "{count, plural, one {# location} other {# locations}}",
  "gov.report.scopeNote":
    "This report covers every monitored location you can see, not a real jurisdiction boundary — not suitable for public, policy, or donor documentation as-is. See World Vitality’s data provenance documentation for source details.",
  "gov.report.noLocationsTitle": "No locations visible",
  "gov.report.noLocationsBody": "There are no monitored locations to include in this report.",
  "gov.map.noLocationsBody":
    "There are no monitored locations to show on the map yet. Add a location from the workspace home page.",
  "gov.map.toggle": "Soil moisture ({count, plural, one {# location} other {# locations}})",
  "gov.map.descNone": "No locations to show on the map.",
  "gov.map.descOn": "Map showing {count, plural, one {# location} other {# locations}}. {items}",
  "gov.map.descOff":
    "Map showing {count, plural, one {# location} other {# locations}}. Soil moisture overlay is currently hidden.",

  // ---- Shared map pieces for the sample-reference-site maps; status caption (v106)
  "workspace.status": "Status",
  "map.mode.temperature": "Temperature",
  "map.mode.generation": "Generation band",
  "map.mode.routeRisk": "Route risk band",
  "map.mode.siteRisk": "Site risk",
  "map.mode.moisture": "Show ground wetness",
  "map.mode.raw": "Raw readings",
  "map.verdict.cold": "cold",
  "map.verdict.cool": "cool",
  "map.verdict.mild": "mild",
  "map.verdict.warm": "warm",
  "map.verdict.hot": "hot",
  "map.verdict.belowCutIn": "below cut-in",
  "map.verdict.ramping": "ramping",
  "map.verdict.rated": "rated output",
  "map.verdict.cutOut": "cut-out",
  "map.verdict.clear": "clear",
  "map.verdict.elevated": "elevated",
  "map.verdict.high": "high",
  "map.verdict.severe": "severe",
  "map.verdict.dry": "Dry",
  "map.verdict.somewhatWet": "Somewhat wet",
  "map.verdict.wet": "Wet",
  "map.tempValue": "{value}°C",
  "map.windValue": "{value} m/s wind",
  "map.popup.pair": "{first} — {second}",
  "map.ref.coverage": "Sample reference sites — {plotted} of {total} reporting",
  "map.ref.descOn":
    "Map of {count, plural, one {# sample reference site} other {# sample reference sites}}. {items}",
  "map.ref.descOff": "Map of sample reference sites. The overlay is currently hidden.",
  "site.ibadan": "Ibadan, Nigeria",
  "site.nairobi": "Nairobi, Kenya",
  "site.rotterdam": "Rotterdam, Netherlands",
  "site.desMoines": "Des Moines, USA",
  "site.chennai": "Chennai, India",
  "site.brisbane": "Brisbane, Australia",

  // ---- Construction workspace (v106)
  "construction.aiPanel.emptyBody": "Open Site Risk to see an AI-generated status.",
  "construction.title": "Today’s Activity Status",
  "construction.siteRiskStatus": "Site risk status",
  "construction.siteRiskTimeline": "Site risk timeline",
  "construction.activity.concretePour": "Concrete pour",
  "construction.activity.craneOperation": "Crane operation",
  "construction.activity.roofingWork": "Roofing work",
  "construction.activity.excavation": "Excavation (flash-flood risk)",
  "construction.status.go": "go",
  "construction.status.caution": "caution",
  "construction.status.noGo": "no-go",

  // ---- Renewable Energy workspace (v106)
  "renewable.aiPanel.emptyBody": "Open Generation Outlook to see an AI-generated status.",
  "renewable.title": "Asset Generation Outlook",
  "renewable.hydroNote": "The hydro widget always reads a fixed USGS river gauge, not this place.",
  "renewable.outlookWind": "Generation outlook — wind (next 7 days)",
  "renewable.outlookSolar": "Generation outlook — solar (next 7 days)",
  "renewable.statusWind": "Current status — wind",
  "renewable.statusSolar": "Current status — solar",
  "renewable.statusHydro": "Current status — hydro (US gauge station)",
  "renewable.hydroGaps":
    "{count, plural, one {# reading had no data available.} other {# readings had no data available.}}",

  // ---- Logistics & Shipping workspace (v106)
  "logistics.aiPanel.emptyBody": "Open Route Risk to see an AI-generated status.",
  "logistics.title": "Route Risk Status",
  "logistics.outlook": "Route risk outlook (next 7 days)",
  "logistics.disruptionReports": "Disruption reports",
  "logistics.noDisruptions": "No disruption history yet",

  // ---- Research workspace (v107)
  "research.aiPanel.title": "No AI interpretation here, by design",
  "research.aiPanel.body":
    "Research keeps this panel deliberately raw — data appears in the Dataset Explorer table with full provenance, not summarized by an AI layer.",
  "research.aiPanel.provenance":
    "Every record's own provenance (source, license, retrieval time, known limitations) is shown inline in the table instead.",
  "research.dataset": "Dataset",
  "research.metrics": "Metrics",
  "research.results": "Results",
  "research.relationships": "Data relationships",
  "research.source.nasaPower.label": "NASA POWER — Current Conditions",
  "research.source.nasaPower.description": "Public-domain observational data, no API key required.",
  "research.source.openMeteo.label": "Open-Meteo — 7-Day Forecast",
  "research.source.openMeteo.description":
    "Free-tier, non-commercial-use license (see this dataset's own License column).",
  "research.fetch": "Fetch dataset",
  "research.fetchFailed": "Couldn't fetch that dataset. Please try again.",
  "research.col.metric": "Metric",
  "research.col.value": "Value",
  "research.col.unit": "Unit",
  "research.col.timestamp": "Timestamp",
  "research.col.type": "Type",
  "research.col.source": "Source",
  "research.col.license": "License",
  "research.col.limitations": "Known limitations",
  "research.type.observed": "observed",
  "research.type.forecast": "forecast",
  "research.noneStated": "None stated",
  "research.records": "{count, plural, one {# record} other {# records}}",
  "research.gapsReported": "{count, plural, one {# gap reported} other {# gaps reported}}",
  "research.recordsAndGaps": "{records} — {gaps}",
  "research.empty.title": "No dataset loaded yet",
  "research.empty.body": "Pick a dataset above and click “Fetch dataset”.",
  "research.rel.intro":
    "Every raw metric this platform ingests, and which workspace(s) it actually feeds — derived directly from this platform's real capability wiring (ADR-0004, Phase 1), not a hypothetical model.",
  "research.rel.feeds": "Feeds: {workspaces}",
  "research.rel.feedsMany":
    "Feeds: {workspaces} — the same reading, interpreted differently by domain.",
  "research.metric.T2M.label": "Temperature (T2M)",
  "research.metric.T2M.description":
    "NASA POWER's “Temperature at 2 Meters” — also fetched as a daily forecast via Open-Meteo.",
  "research.metric.WS2M.label": "Wind Speed (WS2M)",
  "research.metric.WS2M.description":
    "NASA POWER's “Wind Speed at 2 Meters” — also fetched as a daily forecast via Open-Meteo, explicitly in m/s so both sources are directly comparable.",
  "research.metric.GWETROOT.label": "Root-Zone Soil Wetness (GWETROOT)",
  "research.metric.GWETROOT.description":
    "NASA POWER's root-zone soil moisture index, 0 (dry) to 1 (saturated).",

  // ---- Education workspace (v107)
  "edu.role.admin_owner": "Educator/Admin",
  "edu.role.operational_user": "Educator",
  "edu.role.scoped_field_user": "Limited Access",
  "edu.role.viewer_external": "Guest (read-only)",
  "edu.aiPanel.title": "No AI side-panel here",
  "edu.aiPanel.body":
    "This workspace's data explanations appear inline on the page, not in a side panel.",
  "edu.intro":
    "Real current data, explained at the grade level you pick. For educators to use in class; no student accounts or data are collected anywhere in this workspace.",
  "edu.demoLocation": "Demo Classroom Location",
  "edu.explainFor": "Explain for",
  "edu.grade.k2": "Grades K–2",
  "edu.grade.g35": "Grades 3–5",
  "edu.grade.g68": "Grades 6–8",
  "edu.grade.g912": "Grades 9–12",
  "edu.card.temperature": "Temperature",
  "edu.card.soilMoisture": "Soil Moisture",
  "edu.talkAbout": "Talk about it: {prompt}",
  "edu.intro.k2.weather": "Let's find out: is it hot or cold outside right now?",
  "edu.intro.k2.soil":
    "Let's find out: is the ground thirsty (dry) or full of water (wet) right now?",
  "edu.intro.g35.weather":
    "Here's what real satellite data tells us about the air temperature at this location today.",
  "edu.intro.g35.soil":
    "Here's what real satellite data tells us about how wet the soil is at this location today.",
  "edu.intro.g68.weather":
    "This is a real, current reading of the air temperature at this location, from NASA satellite data.",
  "edu.intro.g68.soil":
    "This is a real, current reading of how wet the soil is at this location, from NASA satellite data.",
  "edu.intro.g912.weather":
    "Current-conditions reading for the air temperature at this location, sourced from NASA POWER satellite data:",
  "edu.intro.g912.soil":
    "Current-conditions reading for how wet the soil is at this location, sourced from NASA POWER satellite data:",
  "edu.conf.insufficientKid":
    "We don't have enough information to know yet — that's okay, scientists say 'I don't know' too!",
  "edu.conf.insufficient": "There isn't enough recent data to answer this confidently right now.",
  "edu.conf.high": "This is based on several recent readings, so we're fairly confident.",
  "edu.conf.moderate":
    "This is based on a couple of recent readings, so it's a reasonable estimate.",
  "edu.conf.low": "This is based on just one recent reading, so treat it as a rough estimate.",
  "edu.conf.kid.high": "We checked this a few times, so we're pretty sure!",
  "edu.conf.kid.moderate": "We checked this a couple of times, so it's a good guess.",
  "edu.conf.kid.low": "We only checked this once, so it's just a first guess.",
  "edu.followUp.k2.weather": "What are you wearing outside today? Does it match?",
  "edu.followUp.k2.soil": "Have you seen a puddle or dry, cracked dirt near you lately?",
  "edu.followUp.g35.weather":
    "How does today's temperature compare to what you'd expect for this time of year?",
  "edu.followUp.g35.soil": "Why might farmers care about how wet or dry the soil is?",
  "edu.followUp.g68.weather":
    "What factors might cause temperature to vary between two nearby locations?",
  "edu.followUp.g68.soil":
    "How might soil moisture affect the plants and animals living in this area?",
  "edu.followUp.g912.weather":
    "This reading reflects current conditions only, not a trend. What additional data would you need to identify a climate trend rather than day-to-day weather?",
  "edu.followUp.g912.soil":
    "This provider's moisture bands are the platform's own threshold interpretation, not a cited agronomic standard (see its source code documentation). Why does that distinction matter when using this data for a real decision?",
  "edu.lesson.title": "Sample Lesson Plan",
  "edu.lesson.intro":
    "A starting point, grounded in real current data. Contains no real student names or data — adapt it for your own class.",
  "edu.lesson.gradeLevel": "Grade level",
  "edu.lesson.download": "Download Lesson Plan",
  "edu.lesson.accessDeniedBody":
    "This role does not have permission to generate lesson plan documents in this workspace.",
  "edu.doc.title": "Sample lesson plan",
  "edu.doc.subtitle": "Exploring Our Local Environment",
  "edu.doc.gradeLevel": "Grade level: {grade}",
  "edu.doc.location": "Location used: {place}",
  "edu.doc.asOf": "Data current as of: {when}",
  "edu.doc.disclaimer":
    "This is a sample/starting-point lesson plan generated from real, current environmental data. It contains no real student data or names — adapt it for your own class.",
  "edu.doc.objective": "Objective",
  "edu.doc.objective.k2":
    "Students will observe and describe real weather and ground conditions at a real place on Earth.",
  "edu.doc.objective.g35":
    "Students will interpret real environmental data and connect it to observable conditions.",
  "edu.doc.objective.g68":
    "Students will analyze real environmental data, including its confidence level, and discuss factors affecting it.",
  "edu.doc.objective.g912":
    "Students will critically evaluate a real environmental dataset, including its stated confidence and known limitations, and identify what additional data would be needed for deeper analysis.",
  "edu.doc.materials": "Materials",
  "edu.doc.materials.app": "- World Vitality {workspace} workspace ({explain} / {map})",
  "edu.doc.materials.discussion": "- Class discussion space",
  "edu.doc.procedure": "Procedure",
  "edu.doc.step.open": "Open the {explain} page and select this grade band.",
  "edu.doc.step.weather": "Review the temperature reading together: “{sentence}”",
  "edu.doc.step.soil": "Review the soil moisture reading together: “{sentence}”",
  "edu.doc.discuss": "Discuss: {prompt}",
  "edu.doc.step.map": "Open the {map} page and explore the same location visually.",
  "edu.doc.step.confidence":
    "Ask students to note the stated confidence level for each reading and discuss what would increase or decrease it.",
  "edu.doc.step.surprise": "Ask students to share one thing that surprised them about the data.",
  "edu.doc.notes": "Notes for the educator",
  "edu.doc.notes.body":
    "All data shown is real and current, sourced from NASA POWER satellite data (see this platform's data-provenance documentation). This is a single demo location, not necessarily your own class's location. This tool does not collect or store any student data.",

  // ---- Disaster Monitoring workspace (v107)
  "dm.aiPanel.title": "No AI interpretation here, by design",
  "dm.aiPanel.body":
    "Alerts are shown exactly as issued by the National Weather Service — not summarized, scored, or reinterpreted by this app.",
  "dm.aiPanel.ethics":
    "This workspace carries the platform's highest ethical weight (Constitution Section 7 and 9, zero tolerance). Always follow guidance from local authorities.",
  "dm.place": "Los Angeles, CA",
  "dm.notSubstitute":
    "This is not a substitute for official guidance — always follow instructions from local authorities.",
  "dm.caveat.original": "Original wording from the source (English):",
  "dm.alerts.subtitle":
    "{place} · Source: National Weather Service (weather.gov) · U.S. and territories only",
  "dm.alerts.failedTitle": "Couldn't reach the National Weather Service",
  "dm.alerts.failedBody":
    "Alerts couldn't be fetched right now. Please check weather.gov directly for official information.",
  "dm.alerts.noneTitle": "No active alerts",
  "dm.alerts.noneBody": "No National Weather Service alerts are currently active for {place}.",
  "dm.floods.title": "Flood Impact Locations",
  "dm.floods.subtitle": "{state} · Source: USGS Real-Time Flood Impact API",
  "dm.floods.notice":
    "This information is preliminary/provisional and has not received final USGS approval. Not to be used for decisions concerning personal or public safety.",
  "dm.floods.failedTitle": "Couldn't reach the USGS Flood Impact API",
  "dm.floods.failedBody":
    "Flood data couldn't be fetched right now. Please check waterdata.usgs.gov directly.",
  "dm.floods.noneTitle": "No flood impact locations currently active",
  "dm.floods.noneBody": "No currently-flooding USGS reference locations reported in {state}.",
  "dm.shelters.title": "Nearby Designated Shelters",
  "dm.shelters.subtitle": "Within 25 miles of {place} · Source: FEMA / American Red Cross (HIFLD)",
  "dm.shelters.caveat":
    "This layer should not be used to determine the operational status of a facility during an active emergency. — FEMA/HIFLD",
  "dm.shelters.failedTitle": "Couldn't reach the shelter facilities service",
  "dm.shelters.failedBody": "Shelter data couldn't be fetched right now.",
  "dm.shelters.noneTitle": "No designated shelters found within range",
  "dm.shelters.capacity": "Evacuation capacity (designated): {count}",
  "dm.fires.title": "Active Fire Detections",
  "dm.fires.subtitle":
    "Within ~1° of {place} · Source: NASA FIRMS (VIIRS satellite), last 24 hours",
  "dm.fires.caveat":
    "These are satellite-detected thermal anomalies (elevated surface temperature), not confirmed wildfires. Agricultural burning and other heat sources can also appear here. — NASA FIRMS",
  "dm.fires.notConfiguredTitle": "Fire detection data not configured",
  "dm.fires.notConfiguredBody":
    "Set NASA_FIRMS_MAP_KEY in this app's environment variables to enable this section.",
  "dm.fires.failedTitle": "Couldn't reach NASA FIRMS",
  "dm.fires.failedBody": "Fire detection data couldn't be fetched right now.",
  "dm.fires.noneTitle": "No fire detections in range",
  "dm.fires.noneBody": "No satellite thermal anomalies detected near {place} in the last 24 hours.",
  "dm.fires.lineDay": "Confidence: {confidence} · Day detection · Satellite: {satellite}",
  "dm.fires.lineNight": "Confidence: {confidence} · Night detection · Satellite: {satellite}",
  "dm.fires.unknown": "unknown",
  "dm.fires.detected": "Detected {when} UTC",
  "dm.fires.frp": "Fire Radiative Power: {value} MW",
  "dm.fire.day": "Day",
  "dm.fire.night": "Night",
  "dm.map.kind.flood": "Flood impact location",
  "dm.map.kind.shelter": "Designated shelter",
  "dm.map.kind.fire": "Fire detection",
  "dm.map.layer.flood": "Flood impact locations ({count})",
  "dm.map.layer.shelter": "Designated shelters ({count})",
  "dm.map.layer.fire": "Fire detections ({count})",
  "dm.map.popup": "{name} — {kind}",
  "dm.map.desc.none": "No flood, shelter, or fire data to show on the map.",
  "dm.map.desc.allHidden": "All hazard layers are currently hidden.",
  "dm.map.desc.showing":
    "{count, plural, one {Map showing # location: {items}.} other {Map showing # locations: {items}.}}",
  "dm.map.item.flood":
    "{count, plural, one {# flood impact location} other {# flood impact locations}}",
  "dm.map.item.shelter":
    "{count, plural, one {# designated shelter} other {# designated shelters}}",
  "dm.map.item.fire": "{count, plural, one {# fire detection} other {# fire detections}}",
  "dm.map.fallback.flood": "Currently-flooding location, per USGS's last check.",
  "dm.map.fallback.shelter": "Designated shelter facility (reference location only).",
  "dm.map.fireName": "Fire detection ({confidence} confidence)",
  "dm.map.fireSummary":
    "Thermal anomaly, {satellite}, {date} ({dayNight}). Not a confirmed wildfire.",

  // ---- Payment history, receipts and refunds (v111)
  "billing.history.title": "Payment history",
  "billing.history.unavailable":
    "We couldn’t load your payment history just now. Try again in a moment.",
  "billing.history.receipt": "Receipt",
  "billing.history.receiptAria": "Receipt for the {amount} payment on {date}",
  "billing.history.recentOnly": "Showing your {count} most recent payments.",
  "billing.history.note": "Paystack may also email you its own receipt for each payment.",
  "billing.history.itemOther": "Payment",
  "billing.refund.inProgress": "Refund in progress",
  "billing.refund.processed": "Refund processed",
  "billing.refund.failed": "Refund didn’t complete",
  "billing.receipt.title": "Payment receipt",
  "billing.receipt.issuedBy": "Issued by",
  "billing.receipt.account": "Account",
  "billing.receipt.datePaid": "Date paid",
  "billing.receipt.reference": "Payment reference",
  "billing.receipt.item": "Item",
  "billing.receipt.itemPlan": "{plan} plan subscription",
  "billing.receipt.itemOther": "World Vitality payment",
  "billing.receipt.amount": "Amount paid",
  "billing.receipt.method": "Paid through",
  "billing.receipt.refundInProgress": "A refund for this payment is in progress.",
  "billing.receipt.refundProcessed": "A refund was processed for this payment.",
  "billing.receipt.refundFailed": "A refund for this payment didn’t complete.",
  "billing.receipt.notInvoice": "This is a record of your payment. It is not a tax invoice.",
  "billing.receipt.print": "Print or save as PDF",
  "billing.receipt.back": "Back to Plan & billing",

  // ---- Team page, plan limits and plan notices (v108)
  "team.title": "Team — {workspace}",
  "team.intro": "Invite people to this workspace and manage their access.",
  "team.denied.body":
    "This role does not have permission to manage team members for this workspace.",
  "team.invite.title": "Invite someone",
  "team.email": "Email",
  "team.role": "Role",
  "team.invite.send": "Send Invite",
  "team.invite.sent": "Invite sent to {email}.",
  "team.invite.scope":
    "Scope to specific resources (optional — leave unchecked for workspace-wide access):",
  "team.you": "(you)",
  "team.youOwner": "(you · owner)",
  "team.owner": "(owner)",
  "team.remove": "Remove",
  "team.empty.title": "No members yet",
  "team.empty.body": "Invite someone above to get started.",
  "team.err.email": "Enter a valid email address.",
  "team.err.role": "Choose a valid role.",
  "team.err.noInvite": "You do not have permission to invite people to this workspace.",
  "team.err.inviteFailed": "Failed to send invite. Please try again.",
  "team.err.noRemove": "You do not have permission to remove people from this workspace.",
  "team.err.removeFailed": "Failed to remove member.",
  "team.err.ownerCannotBeRemoved": "The organisation's owner can't be removed.",
  "team.err.lastAdmin": "You can't remove the last owner or admin of this workspace.",
  "billing.limit.reached.seats":
    "Your {plan} plan includes up to {limit, plural, one {# person} other {# people}}. Upgrade your plan to add more.",
  "billing.limit.reached.savedItems":
    "Your {plan} plan includes up to {limit, plural, one {# saved item} other {# saved items}} (fields, insured properties and monitored locations count together). Upgrade your plan to add more.",
  "billing.limit.reached.workspaces":
    "Your {plan} plan includes up to {limit, plural, one {# workspace} other {# workspaces}}. Upgrade your plan to add more.",
  "billing.feature.included":
    "{name} is included in the {lowest} plan and above. Your plan is {plan}.",
  "billing.feature.includedMany":
    "{name} are included in the {lowest} plan and above. Your plan is {plan}.",
  "billing.feature.notPart": "{name} is not part of the {plan} plan.",
  "billing.feature.notPartMany": "{name} are not part of the {plan} plan.",
  "billing.feature.name.forecastOutlooks": "Forecast outlooks",
  "billing.feature.name.csvExport": "CSV export",
  "billing.feature.name.printReport": "Print and PDF export",
  "billing.feature.name.auditableReport": "The auditable report",
  "billing.feature.name.teamTools": "Team tools",
  "billing.feature.name.emailAlerts": "Email alerts",
  "billing.feature.name.smsAlerts": "SMS alerts",
  "billing.feature.name.auditLog": "The audit log",
  "billing.feature.name.bulkExport": "Bulk export",
  "billing.feature.name.apiAccess": "API access",
  "billing.feature.name.integrations": "Integrations",
  "billing.feature.name.sso": "Single sign-on",

  // ---- Team page — members without a profile (v108)
  "team.noProfile": "(no profile found)",

  // ---- Failed-payment notice (v109)
  "notifications.msg.paymentFailed.title": "Your payment didn’t go through",
  "notifications.msg.paymentFailed.body":
    "We couldn’t renew your {plan} plan. Update your card to keep it.",

  // ---- Refund notice (v111)
  "notifications.msg.paymentRefunded.title": "Your refund has been processed",
  "notifications.msg.paymentRefunded.body":
    "We processed a refund for your {plan} plan payment. It can take a few days to show in your account. A refund doesn’t change your plan; to stop renewals, cancel from Billing.",
  "notifications.msg.paymentRefunded.bodyNoPlan":
    "We processed a refund for your payment. It can take a few days to show in your account. A refund doesn’t change your plan; to stop renewals, cancel from Billing.",

  // ---- Hand over ownership of the organisation (v105)
  "settings.org.transfer.title": "Hand over ownership",
  "settings.org.transfer.intro":
    "Give your organisation to someone else in it. They become its owner and take over its plan and team; you stay on as an admin until they remove you.",
  "settings.org.transfer.selectLabel": "New owner",
  "settings.org.transfer.selectPlaceholder": "Choose a person",
  "settings.org.transfer.start": "Hand over ownership…",
  "settings.org.transfer.confirm":
    "Make {email} the owner of your organisation? They will control its plan, its team and everything saved in it. You stay on as an admin, but they can remove you, and only they can hand it back.",
  "settings.org.transfer.yes": "Yes, hand it over",
  "settings.org.transfer.done": "{email} is now the owner of your organisation. You’re an admin.",
  "errors.orgTransferOwnerOnly": "Only the owner of the organisation can hand it over.",
  "errors.orgTransferNotMember":
    "That person isn’t in your organisation, so it can’t be handed to them.",
  "errors.orgTransferPaidPlan":
    "Your organisation is on the {plan} plan, which belongs to its owner and can’t be moved to someone else yet. You can hand it over once the plan has ended.",
  "errors.orgTransferFailed":
    "Couldn’t hand over your organisation. Nothing was changed. Please try again.",

  // ---- Ownership-received notice (v105)
  "notifications.msg.ownershipReceived.title": "{who} made you the owner of {organisation}",
  "notifications.msg.ownershipReceived.body":
    "You now manage its plan and team. Open Settings to see the people in it.",

  // ---- Heat near a saved place (v116)
  "notifications.msg.heatNear.title": "Satellite heat near {place}",
  "notifications.msg.heatNear.body":
    "A satellite saw heat about {km} km from {place}, {when}. This is not a confirmed fire: it may be farm burning or a gas flare. Open the Globe to take a look.",
  "notifications.msg.heatNear.bodyMany":
    "A satellite saw heat about {km} km from {place}, {when} ({count} detections). This is not a confirmed fire: it may be farm burning or a gas flare. Open the Globe to take a look.",

  // ---- Landing page (v106)
  "landing.tagline": "Real-time environmental intelligence, interpreted plainly.",
  "landing.explore": "Explore the planet",
  "landing.signIn": "Sign in",
  "landing.appsPrompt": "Prefer an app?",
  "landing.appsLink": "Get the desktop or Android app",
  "nav.sources": "Data sources",
  "landing.sources": "Data sources and credits",
  "credits.title": "Data sources and credits",
  "credits.intro":
    "World Vitality brings together public data from the organisations below, and we are grateful to them. They do not run, check or endorse this app. Some of what you see is an estimate from a model, not an official warning. In an emergency, call your local emergency number and follow official instructions.",
  "credits.group.weather": "Weather and places",
  "credits.group.hazards": "Fires, floods and emergencies",
  "credits.group.cameras": "Live traffic cameras",
  "credits.group.maps": "Maps and software",
  "credits.group.security": "Account security",
  "credits.licence": "Licence",
  "credits.cameras.intro":
    "Each picture comes straight from the agency that runs the camera. World Vitality does not copy, store or change it.",
  "credits.weatherBy": "Weather data by",
  "credits.placesBy": "Place search by",
  "credits.placesData": "Location data based on",
  "credits.use.open-meteo": "Weather forecasts and place search.",
  "credits.use.geonames": "The names and positions of the places the search finds.",
  "credits.use.nasa-power": "Past weather, climate and solar data.",
  "credits.use.nws": "Official weather alerts for the United States.",
  "credits.use.nasa-firms": "Satellite heat detections, shown on the Globe as possible fires.",
  "credits.use.gdacs": "Recent large flood events, shown on the Globe.",
  "credits.use.usgs-rtfi":
    "Places in the United States where flooding is affecting roads, bridges and buildings right now.",
  "credits.use.fema-shelters": "Shelter locations in the United States.",
  "credits.use.openstreetmap": "The map tiles on the workspace maps.",
  "credits.use.natural-earth": "The picture of Earth on the Globe.",
  "credits.use.cesium": "Draws the Globe.",
  "credits.use.maplibre": "Draws the workspace maps.",
  "credits.use.pwned-passwords":
    "Warns you when a password you choose has appeared in a known data breach. Only the first five characters of a scrambled copy are sent, never the password.",
  "credits.note.geonames": "Location data based on GeoNames.",
  "credits.note.nasa-power":
    "Data obtained from the NASA Langley Research Center (LaRC) POWER Project, funded through the NASA Earth Science Division.",
  "credits.note.nws": "Alerts are passed on as the National Weather Service issued them.",
  "credits.note.nasa-firms":
    "Near-real-time detections are not science quality, and a detection is not a confirmed fire.",
  "credits.note.gdacs":
    "GDACS is run by the United Nations and the European Commission. Events are estimates from satellite and river models, not official warnings, and a smaller flood may not be listed.",
  "credits.note.usgs-rtfi":
    "From the U.S. Geological Survey (USGS), an agency of the U.S. government.",
  "credits.note.fema-shelters":
    "FEMA and American Red Cross shelter facilities, from the HIFLD Open portal. This is a list of designated places, not whether a shelter is open now.",
  "credits.note.openstreetmap": "© OpenStreetMap contributors.",
  "credits.note.natural-earth": "Natural Earth II imagery, in the public domain.",

  // ---- Sign-in, forgot-password and reset-password pages (v106)
  "auth.signIn.title": "Sign in",
  "auth.signUp.title": "Create your account",
  "auth.accountDeleted": "Your account has been deleted.",
  "auth.resetSuccess": "Your password has been updated. Please sign in.",
  "auth.inAppNote":
    "In this app, sign in with your email and password. If you usually sign in with Google, use “Forgot password?” to choose a password first.",
  "auth.google": "Continue with Google",
  "auth.or": "or",
  "auth.email": "Email address",
  "auth.password": "Password",
  "auth.forgotLink": "Forgot password?",
  "auth.remember": "Remember me on this device",
  "auth.signInButton": "Sign in",
  "auth.signUpButton": "Create account",
  "auth.haveAccount": "Already have an account?",
  "auth.newHere": "New here?",
  "auth.createLink": "Create an account",
  "auth.callback.missingToken": "That sign-in link looks incomplete. Please request a new one.",
  "auth.callback.verificationFailed":
    "That sign-in link has expired or already been used. Please request a new one.",
  "auth.callback.oauthFailed": "Google sign-in didn't go through. Please try again.",
  "auth.callback.oauthNotConfigured":
    "Google sign-in isn't set up yet on this deployment. Use email sign-in for now.",
  "auth.callback.generic": "Something went wrong. Please request a new sign-in link.",
  "auth.forgot.title": "Reset your password",
  "auth.forgot.sent":
    "Check your email — if an account exists for {email}, we've sent a link to reset your password.",
  "auth.forgot.intro":
    "Enter the email address on your account and we'll send you a link to set a new password.",
  "auth.forgot.send": "Send reset link",
  "auth.backToSignIn": "Back to sign in",
  "auth.reset.title": "Set a new password",
  "auth.reset.newPassword": "New password",
  "auth.reset.confirm": "Confirm new password",
  "auth.reset.submit": "Update password",
  "auth.reset.requestNew": "Request a new reset link",
  "auth.strength.veryWeak": "Very weak",
  "auth.strength.weak": "Weak",
  "auth.strength.fair": "Fair",
  "auth.strength.strong": "Strong",
  "auth.strength.veryStrong": "Very strong",
  "auth.strength.aria": "Password strength: {label}",
  "auth.err.invalidEmail": "Enter a valid email address.",
  "auth.err.sendLink": "Something went wrong sending the link. Please try again.",
  "auth.err.shortPassword": "Password must be at least 8 characters.",
  "auth.err.breached":
    "This password has appeared in a known data breach. Please choose a different password.",
  "auth.err.signUpFailed":
    "Couldn't create your account. You may need to confirm your email first, or try again.",
  "auth.err.enterBoth": "Enter your email and password.",
  "auth.err.lockedIp":
    "Too many failed attempts from this network. Please try again in a few minutes.",
  "auth.err.locked": "Too many failed attempts. Please try again in a few minutes.",
  "auth.err.invalid": "Invalid email or password.",
  "auth.err.resetRateLimited":
    "Too many reset requests for this email. Please try again in a few minutes.",
  "auth.err.resetExpired": "Your password reset link has expired. Please request a new one.",
  "auth.err.updateFailed": "Couldn't update your password. Please try again.",
  "auth.err.mismatch": "Passwords don't match.",

  // ---- public Explorer and the Globe
  "explore.title": "Explore Your Planet",
  "explore.intro":
    "Search any place on Earth for a real, honest snapshot of its current conditions — no account needed.",
  "explore.placeLabel": "Place name",
  "explore.placePlaceholder": "Try a city, town, or region…",
  "explore.submit": "Explore",
  "explore.searching": "Searching…",
  "explore.empty.title": "Nowhere explored yet",
  "explore.empty.body": "Search a place above to see something true about it.",
  "explore.aiPanel.emptyTitle": "Nothing to interpret yet",
  "explore.aiPanel.emptyBody": "Search a place to see an AI-generated insight about it.",
  "explore.err.enterPlace": "Enter a place name to explore.",
  "explore.err.lookupFailed": "Couldn’t look up that place right now. Please try again.",
  "explore.err.invalidLink": "That place link isn’t valid. Try searching for it again.",
  "explore.err.dataFailed":
    "Found that place, but couldn’t fetch its environmental data right now. Please try again shortly.",
  "globe.title": "The Globe",
  "globe.summary":
    "{count, plural, one {# location} other {# locations}} across every workspace you have access to — Agriculture fields, insured properties, and monitored locations. Individual hazard/status detail lives in each workspace; this is an overview, not a replacement.",
  "globe.loading": "Loading the globe…",
  "globe.empty.title": "No locations to show",
  "globe.empty.body":
    "Nothing you have access to across Agriculture, Insurance, or Government & NGOs has a location yet.",
  "globe.fireDetection": "Fire detection ({confidence} confidence)",

  // ---- browser-tab title
  "welcome.pageTitle": "Welcome",

  // ---- Globe: instant map and live hazard layers
  "globe.live.loading": "Loading live flood and shelter layers…",
  "globe.live.count":
    "{count, plural, one {# live flood or shelter point} other {# live flood and shelter points}} from public sources.",
  "globe.live.none": "No live flood or shelter points to show right now.",
  "globe.live.partial":
    "Some live layers could not be loaded right now, so this may be incomplete.",
  "globe.live.failed":
    "The live hazard layers could not be loaded right now. Your own locations are shown.",
  "globe.preview.loading3d":
    "Loading the 3D globe… the flat map is already live. Select a dot to open it.",
  "globe.preview.no3d":
    "The 3D globe can’t run in this browser, so the flat map is shown instead. Every dot opens the same page.",

  // ---- Globe: worldwide fire detections, public cameras and the details panel
  "globe.watch.loading": "Loading worldwide satellite fire detections and public cameras…",
  "globe.watch.summary":
    "{fires, plural, one {# satellite heat detection area} other {# satellite heat detection areas}} and {cameras, plural, one {# public camera} other {# public cameras}} shown. Select a dot to open it.",
  "globe.watch.capped": "Showing the strongest {shown} of {total} areas worldwide.",
  "globe.watch.none": "No satellite fire detections or public cameras to show right now.",
  "globe.watch.firesNotConfigured":
    "Satellite fire detections are not switched on for this app yet.",
  "globe.watch.partial":
    "Some fire or camera sources could not be loaded right now, so this may be incomplete.",
  "globe.watch.failed": "Fire detections and cameras could not be loaded right now.",
  "globe.legend.fire": "Satellite heat detection",
  "globe.legend.camera": "Public camera",
  "globe.marker.fire": "Satellite heat detection at {latitude}, {longitude}",
  "globe.marker.camera": "Public camera: {name}",
  "globe.panel.label": "Details",
  "globe.panel.close": "Close",
  "globe.panel.back": "Back to the heat detection",
  "globe.panel.fire.title": "Satellite heat detection",
  "globe.panel.fire.what":
    "A satellite saw an unusually hot spot here. It may be a wildfire, but it can also be farm burning, a gas flare or a factory. It is not a confirmed fire.",
  "globe.panel.fire.detections":
    "{count, plural, one {# detection} other {# detections}} in this area",
  "globe.panel.fire.power": "Strongest heat output: {frp} MW",
  "globe.panel.fire.confidenceHigh": "Satellite confidence: high",
  "globe.panel.fire.confidenceNominal": "Satellite confidence: medium",
  "globe.panel.fire.latest": "Latest satellite pass: {when}",
  "globe.panel.fire.position": "Location: {latitude}, {longitude}",
  "globe.panel.cameras.title": "Public cameras nearby",
  "globe.panel.cameras.none":
    "No public camera from this app’s sources is within 25 km. Cameras are only available in California, New South Wales, British Columbia, London, Finland and Singapore.",
  "globe.panel.cameras.unavailable":
    "Camera pictures could not be loaded right now, so nearby cameras are not listed.",
  "globe.panel.camera.title": "Public camera",
  "globe.panel.camera.distance": "{distance} km from the detection, towards the {direction}",
  "globe.panel.camera.source": "Picture from {provider}",
  "globe.panel.camera.licence": "Licence: {licence}",
  "globe.panel.camera.refresh":
    "{minutes, plural, one {Updates about every # minute} other {Updates about every # minutes}}",
  "globe.panel.camera.stillNote":
    "This is a still picture that can be several minutes old, not live video, and it may not show the fire.",
  "globe.panel.camera.unavailable": "This picture could not be loaded. The camera may be offline.",
  "globe.panel.camera.alt": "Latest picture from the camera {name}",
  "globe.panel.camera.stillBadge": "Still picture, not live video",
  "globe.panel.camera.autoRefresh":
    "{minutes, plural, one {While this is open, the picture reloads by itself about every # minute.} other {While this is open, the picture reloads by itself about every # minutes.}}",
  "globe.panel.camera.reload": "Reload picture",
  "globe.panel.camera.takenAt": "Picture taken at {time} (your time).",
  "globe.panel.camera.openForLatest": "Open for the latest picture",
  "globe.panel.camera.loadedAt":
    "Loaded at {time} (your time). A clock printed on the picture shows the camera’s own local time, which may differ.",
  "globe.panel.look.title": "Look at the place",
  "globe.panel.look.satellite": "Satellite view in Google Maps",
  "globe.panel.look.street": "Street View in Google Maps",
  "globe.panel.look.note":
    "Opens Google Maps in a new tab. Its satellite and Street View pictures are stored photos from earlier dates, not live video. They show what the place is like, not whether it is burning now.",
  "globe.panel.emergency.title": "Seeing a real fire?",
  "globe.panel.emergency.callSpecific": "Call the fire service: {number}",
  "globe.panel.emergency.callGeneral": "Call emergency services: {number}",
  "globe.panel.emergency.advice":
    "Only call if you believe there is a real, current fire. A satellite point or a camera picture alone can be wrong or out of date. Tell the dispatcher where it is and what you can see. This app is not an official alert and does not replace emergency services.",
  "globe.panel.emergency.general":
    "112 works on most mobile phones in most countries. If you know your local emergency number, use that instead.",
  // ---- Globe: worldwide flood events (GDACS)
  "globe.floods.loading": "Loading flood events from GDACS…",
  "globe.floods.count":
    "{count, plural, one {# recent flood event} other {# recent flood events}} from GDACS (the UN and EU alert system) in the last {days} days. Select a blue dot to open it.",
  "globe.floods.none":
    "GDACS lists no large flood from the last {days} days right now. A local flood can still be happening.",
  "globe.floods.failed": "Flood events from GDACS could not be loaded right now.",
  "globe.legend.flood": "Flood event (GDACS)",
  "globe.marker.flood": "Flood event: {place}",
  "globe.panel.flood.title": "Flood event",
  "globe.panel.flood.what":
    "The UN and EU disaster alert system (GDACS) lists a flood here. It is estimated from satellite and river models, and the dot marks the middle of a large area, not a street. It is not an official warning for your place, and a smaller flood may not be listed.",
  "globe.panel.flood.alert.red": "GDACS alert level: red (high impact)",
  "globe.panel.flood.alert.orange": "GDACS alert level: orange (medium impact)",
  "globe.panel.flood.alert.green": "GDACS alert level: green (low impact)",
  "globe.panel.flood.ongoing": "Still going. Started {from}",
  "globe.panel.flood.period": "{from} to {to}",
  "globe.panel.flood.started": "Started {from}",
  "globe.panel.flood.position": "Middle of the area: {latitude}, {longitude}",
  "globe.panel.flood.report": "Read the GDACS report",
  "globe.panel.flood.emergencyTitle": "In danger from floodwater?",
  "globe.panel.flood.emergencyAdvice":
    "If people are in danger, move to higher ground and call emergency services. Follow your local authorities. This app is not an official warning and does not replace emergency services.",
  "globe.compass.n": "north",
  "globe.compass.ne": "north-east",
  "globe.compass.e": "east",
  "globe.compass.se": "south-east",
  "globe.compass.s": "south",
  "globe.compass.sw": "south-west",
  "globe.compass.w": "west",
  "globe.compass.nw": "north-west",
} as const;

export type MessageKey = keyof typeof en;
export type Messages = Record<MessageKey, string>;
