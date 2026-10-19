import type { Messages } from "./en.js";

/**
 * French (vouvoiement). AI-drafted; NOT yet reviewed by a native
 * speaker — `LOCALES` marks it `draft` and the language picker says so.
 */
export const fr: Messages = {
  // ---- common
  "common.continue": "Continuer",
  "common.back": "Retour",
  "common.cancel": "Annuler",
  "common.skipForNow": "Passer pour l’instant",
  "common.change": "Modifier",
  "common.saved": "Enregistré.",
  "common.signInAgain": "Veuillez vous reconnecter pour continuer.",
  "common.genericError": "Une erreur s’est produite. Veuillez réessayer.",
  "common.nothingHere": "Rien ici.",
  "common.listSeparator": ", ",

  // ---- app chrome
  "chrome.viewGlobe": "Voir le globe",
  "chrome.settings": "Paramètres",
  "chrome.signOut": "Se déconnecter",
  "chrome.sidebar.primary": "Principal",
  "chrome.sidebar.expand": "Développer la barre latérale (Ctrl+B)",
  "chrome.sidebar.collapse": "Réduire la barre latérale (Ctrl+B)",
  "chrome.sidebar.expandItem": "Développer {item}",
  "chrome.sidebar.collapseItem": "Réduire {item}",
  "chrome.aiPanel.open": "Ouvrir le panneau IA",
  "chrome.aiPanel.collapse": "Réduire le panneau IA",
  "chrome.aiPanel.region": "Assistant IA",
  "chrome.aiPanel.title": "Assistant",
  "chrome.search.label": "Rechercher dans World Vitality",
  "chrome.search.placeholder": "Rechercher des lieux, des sujets…",
  "chrome.search.hint": "Rechercher (appuyez sur / pour cibler)",
  "chrome.search.suggestions": "Suggestions de recherche",
  "chrome.search.noQuickMatches":
    "Aucun résultat rapide : appuyez sur Entrée pour rechercher « {query} »",
  "chrome.search.pressEnter": "Appuyez sur Entrée pour voir tous les résultats pour « {query} »",
  "chrome.search.kind.workspace": "Espace de travail",
  "chrome.search.kind.page": "Page",
  "chrome.search.kind.setting": "Paramètre",
  "chrome.search.kind.tool": "Outil",
  "chrome.search.kind.place": "Lieu",
  "chrome.bell.label": "Notifications",
  "chrome.bell.unread": "{count, plural, one {# non lue} other {# non lues}}",
  "chrome.bell.critical": "{count, plural, one {# critique} other {# critiques}}",

  // ---- navigation
  "nav.workspaces": "Espaces de travail",
  "nav.account": "Compte",
  "nav.home": "Accueil",
  "nav.notifications": "Notifications",
  "nav.settings": "Paramètres",
  "nav.map": "Carte",
  "nav.team": "Équipe",
  "nav.fieldOverview": "Aperçu des parcelles",
  "nav.fieldReport": "Rapport de parcelle",
  "nav.currentConditions": "Conditions actuelles",
  "nav.siteRisk": "Risque du site",
  "nav.generationOutlook": "Perspectives de production",
  "nav.datasetExplorer": "Explorateur de données",
  "nav.routeRisk": "Risque de l’itinéraire",
  "nav.activeAlerts": "Alertes actives",
  "nav.jurisdictionOverview": "Aperçu de la juridiction",
  "nav.formalReport": "Rapport formel",
  "nav.underwritingRiskContext": "Contexte de risque pour la souscription",
  "nav.auditableReport": "Rapport auditable",
  "nav.explainThisData": "Expliquer ces données",
  "nav.lessonPlan": "Plan de cours",

  // ---- workspaces
  "workspace.agriculture.name": "Agriculture",
  "workspace.agriculture.description": "Humidité du sol, météo et état des parcelles.",
  "workspace.weather.name": "Météo et climat",
  "workspace.weather.description":
    "Conditions actuelles et état des températures pour vos emplacements.",
  "workspace.construction.name": "Construction",
  "workspace.construction.description":
    "Niveau de risque du site pour les activités sensibles à la météo.",
  "workspace.renewable-energy.name": "Énergies renouvelables",
  "workspace.renewable-energy.description":
    "Perspectives de production éolienne pour vos installations.",
  "workspace.research.name": "Recherche",
  "workspace.research.description":
    "Explorez des données environnementales brutes avec leur provenance complète.",
  "workspace.logistics.name": "Logistique et transport",
  "workspace.logistics.description":
    "Niveau de risque des itinéraires pour les expéditions sensibles à la météo.",
  "workspace.disaster-monitoring.name": "Suivi des catastrophes",
  "workspace.disaster-monitoring.description":
    "Alertes officielles en direct du Service météorologique national américain (États-Unis uniquement).",
  "workspace.government-ngos.name": "Gouvernement et ONG",
  "workspace.government-ngos.description": "Aperçu multidomaine de la juridiction et rapports.",
  "workspace.insurance.name": "Assurance",
  "workspace.insurance.description":
    "Contexte de risque pour la souscription et rapports auditables.",
  "workspace.education.name": "Éducation",
  "workspace.education.description":
    "Explications des données par niveau scolaire et exemples de plans de cours pour les enseignants.",

  // ---- roles
  "role.admin_owner": "Propriétaire / administrateur",
  "role.operational_user": "Utilisateur opérationnel",
  "role.scoped_field_user": "Utilisateur de terrain (restreint)",
  "role.viewer_external": "Lecteur",

  // ---- personas
  "persona.farmer.label": "Agriculteur",
  "persona.farmer.description": "Je cultive la terre ou je m’en occupe.",
  "persona.builder.label": "Bâtisseur",
  "persona.builder.description": "Je planifie ou je dirige des chantiers.",
  "persona.energy.label": "Énergie",
  "persona.energy.description": "Je travaille dans l’éolien ou le solaire.",
  "persona.shipping.label": "Transport",
  "persona.shipping.description": "J’achemine des marchandises par route, mer ou air.",
  "persona.responder.label": "Intervention d’urgence",
  "persona.responder.description": "Je surveille les inondations, les incendies et autres dangers.",
  "persona.public-sector.label": "Gouvernement ou ONG",
  "persona.public-sector.description": "Je sers une communauté, une région ou un programme.",
  "persona.insurer.label": "Assureur",
  "persona.insurer.description": "J’évalue ou je tarife le risque environnemental.",
  "persona.researcher.label": "Chercheur",
  "persona.researcher.description": "J’analyse des données environnementales.",
  "persona.learner.label": "Élève ou enseignant",
  "persona.learner.description": "J’apprends ou j’enseigne avec des données réelles.",
  "persona.weather.label": "Passionné de météo",
  "persona.weather.description": "Je suis la météo et le climat.",
  "persona.curious.label": "Simple curiosité",
  "persona.curious.description": "Je veux explorer la planète.",

  // ---- dashboard
  "dashboard.yourPlace": "Votre lieu",
  "dashboard.yourWorkspaces": "Vos espaces de travail",
  "dashboard.changeRoleOrPlace": "Modifier votre rôle ou votre lieu",
  "dashboard.addPlacePrompt": "Ajoutez votre lieu pour voir ses conditions en direct juste ici.",
  "dashboard.setItUp": "Le configurer",
  "dashboard.recommended": "Recommandé pour vous",
  "dashboard.insightGaps":
    "{count, plural, one {# jour sans données disponibles.} other {# jours sans données disponibles.}}",
  "dashboard.insightFailed":
    "Impossible de charger les conditions en direct de votre lieu pour le moment. Elles reviendront à votre prochaine visite.",
  "dashboard.tutorial.welcomeTitle": "Bonjour, je suis Orbi",
  "dashboard.tutorial.welcomeBody":
    "Je serai là pour vous aider à vous repérer. Faisons un rapide tour d’horizon.",
  "dashboard.tutorial.workspacesTitle": "Vos espaces de travail",
  "dashboard.tutorial.workspacesBody":
    "Chaque carte ci-dessous est un espace de travail : un ensemble de données et d’outils pour un domaine, comme l’Agriculture. Cliquez sur l’un d’eux pour y entrer.",
  "dashboard.tutorial.aiTitle": "Le panneau IA",
  "dashboard.tutorial.aiBody":
    "Dans n’importe quel espace de travail, ouvrez le panneau IA pour poser des questions sur ses données. Il indique toujours son niveau de confiance — jamais une supposition déguisée en fait.",
  "dashboard.critical.label": "Critique",
  "dashboard.critical.region": "Alerte critique",
  "dashboard.critical.openFull": "Ouvrez les notifications pour lire le texte complet",
  "dashboard.critical.openMore":
    "Ouvrez les notifications — {count, plural, one {# autre critique} other {# autres critiques}}",

  // ---- welcome
  "welcome.step": "Étape {current} sur {total}",
  "welcome.role.title": "Dans quel rôle êtes-vous ici ?",
  "welcome.role.intro":
    "Je suis Orbi. Choisissez ce qui vous correspond le mieux et je vous guiderai au bon endroit — vous pouvez le modifier à tout moment dans les Paramètres.",
  "welcome.role.legend": "Votre rôle",
  "welcome.place.title": "Quel lieu compte le plus pour vous ?",
  "welcome.place.intro":
    "Je vous montrerai tout de suite ses conditions réelles. C’est la seule chose que je demande, et elle reste sur votre compte — vous pouvez la modifier ou la supprimer dans les Paramètres.",
  "welcome.place.inputLabel": "Village, ville ou région",
  "welcome.place.inputPlaceholder": "p. ex. Ibadan",
  "welcome.place.search": "Rechercher",
  "welcome.place.choose": "Choisissez le bon",
  "welcome.place.current":
    "Actuellement : {place}. Faites une recherche ci-dessus pour le changer.",
  "welcome.place.showMe": "Montrez-moi",
  "welcome.place.skipPlace": "Passer le lieu",
  "welcome.insight.title": "{place}, en ce moment",
  "welcome.insight.titleFallback": "Votre lieu, en ce moment",
  "welcome.insight.fetching": "Récupération des données en direct…",
  "welcome.insight.failed": "Impossible de charger les données en direct pour le moment.",
  "welcome.insight.takeMeTo": "Aller à {destination}",
  "welcome.insight.takeMeToExplorer": "Aller à l’Explorateur",

  // ---- notifications
  "notifications.title": "Notifications",
  "notifications.markAllRead": "Tout marquer comme lu",
  "notifications.preferences": "Préférences",
  "notifications.markRead": "Marquer comme lue",
  "notifications.dismiss": "Ignorer",
  "notifications.view": "Voir",
  "notifications.checkAgain": "Vérifier à nouveau",
  "notifications.setHomePlace": "Définir votre lieu de résidence",
  "notifications.fullOfficialText": "Texte officiel complet",
  "notifications.unread": "Non lue",
  "notifications.inboxEmpty": "Votre boîte de réception est vide.",
  "notifications.loadFailed":
    "Nous n’avons pas pu charger vos notifications pour le moment. Actualisez la page pour réessayer.",
  "notifications.tier.critical": "Critiques",
  "notifications.tier.alert": "Alertes",
  "notifications.tier.info": "Informatives",
  "notifications.tag.critical": "Critique",
  "notifications.tag.alert": "Alerte",
  "notifications.tag.info": "Info",
  "notifications.status.noPlace":
    "Les alertes météo officielles s’affichent pour votre lieu de résidence, et vous n’en avez pas encore défini.",
  "notifications.status.outOfCoverage":
    "Les alertes officielles affichées ici proviennent du Service météorologique national américain, qui couvre les États-Unis et leurs territoires. {place} se trouve en dehors de cette zone, donc aucune n’est affichée — cela ne signifie pas qu’il ne s’y passe rien.",
  "notifications.status.lastChecked": "Dernière vérification : {ago}.",
  "notifications.status.showing":
    "Affichage des alertes officielles du Service météorologique national pour {place}.",
  "notifications.status.none":
    "Aucune alerte officielle du Service météorologique national n’est affichée pour {place}.",
  "notifications.status.failed":
    "Nous n’avons pas pu joindre le Service météorologique national pour le moment ; il peut donc y avoir des alertes officielles qui ne s’affichent pas ici. Pour toute urgence, utilisez vos sources officielles locales.",
  "notifications.status.failedPlace":
    "Nous n’avons pas pu joindre le Service météorologique national pour le moment ; il peut donc y avoir des alertes officielles pour {place} qui ne s’affichent pas ici. Pour toute urgence, utilisez vos sources officielles locales.",
  "notifications.status.lastSuccess": "Dernière vérification réussie : {ago}.",
  "notifications.officialEnglishNote":
    "Le texte des alertes officielles est affiché exactement tel que le Service météorologique national l’a émis, en anglais : il n’est pas traduit, afin qu’aucun message d’urgence ne puisse être altéré.",
  "notifications.footnote":
    "World Vitality n’affiche les alertes officielles que lorsque l’application est ouverte — elle n’envoie pas encore de notifications push, SMS ou e-mail. En cas d’urgence, suivez les consignes des autorités locales.",
  "notifications.msg.someone": "Quelqu’un",
  "notifications.msg.fieldComment.title": "{who} a commenté {field}",
  "notifications.msg.memberAdded.title": "Vous avez maintenant accès à {workspace}",
  "notifications.msg.memberAdded.body": "Votre rôle : {role}.",

  // ---- settings
  "settings.title": "Paramètres",
  "settings.profile.title": "Profil",
  "settings.profile.email": "Adresse e-mail",
  "settings.profile.displayName": "Nom affiché",
  "settings.profile.displayNameHelp": "Visible par vos coéquipiers dans vos espaces de travail.",
  "settings.profile.save": "Enregistrer le nom",
  "settings.profile.memberSince": "Membre depuis le {date}.",
  "settings.roleAndPlace.title": "Votre rôle et votre lieu",
  "settings.roleAndPlace.notSetUp":
    "Vous ne les avez pas encore configurés. Dites-moi qui vous êtes et quel lieu compte pour vous, et j’afficherai ses conditions en direct sur votre tableau de bord et dans vos espaces de travail.",
  "settings.roleAndPlace.role": "Rôle :",
  "settings.roleAndPlace.homePlace": "Lieu de résidence :",
  "settings.roleAndPlace.notSet": "non défini",
  "settings.roleAndPlace.removed": "supprimé",
  "settings.roleAndPlace.setUp": "Configurer",
  "settings.roleAndPlace.remove": "Supprimer mon lieu",
  "settings.language.title": "Langue",
  "settings.language.label": "Langue des menus et des messages",
  "settings.language.draftNote":
    "Les langues autres que l’anglais sont rédigées par une IA et n’ont pas encore été relues par un locuteur natif — si quelque chose sonne faux, l’anglais reste toujours disponible.",
  "settings.language.scopeNote":
    "Les pages des espaces de travail, les explications des données et les alertes officielles restent en anglais pour l’instant.",
  "settings.language.draftTag": "brouillon",
  "settings.language.saved": "Langue mise à jour.",
  "settings.language.failed": "Impossible de changer la langue. Veuillez réessayer.",
  "settings.notifications.title": "Notifications",
  "settings.notifications.loadFailed":
    "Nous n’avons pas pu charger vos paramètres de notification pour le moment. Actualisez la page pour réessayer.",
  "settings.notifications.officialLegend": "Alertes météo officielles pour votre lieu de résidence",
  "settings.notifications.showAll":
    "Toutes les afficher, y compris les avis et communiqués mineurs",
  "settings.notifications.alertsOnly":
    "Uniquement les alertes et les alertes critiques — sans les avis mineurs",
  "settings.notifications.criticalAlways":
    "Les alertes critiques, qui touchent à la sécurité des personnes, sont toujours affichées et ne peuvent pas être désactivées.",
  "settings.notifications.collaboration":
    "Me prévenir quand un coéquipier commente une parcelle que j’ai créée",
  "settings.notifications.inAppNote":
    "Les notifications apparaissent uniquement dans l’application — World Vitality n’envoie pas encore de push, SMS ou e-mail, et ne vérifie les alertes officielles que lorsqu’elle est ouverte. Consultez votre",
  "settings.notifications.center": "Centre de notifications",
  "settings.notifications.save": "Enregistrer les paramètres de notification",
  "settings.notifications.saveFailed":
    "Impossible d’enregistrer vos paramètres de notification. Veuillez réessayer.",
  "settings.workspaces.title": "Vos espaces de travail",
  "settings.workspaces.none": "Vous n’êtes membre d’aucun espace de travail pour le moment.",
  "settings.workspaces.limited": "(limité à certains éléments)",
  "settings.download.title": "Télécharger vos données",
  "settings.download.body":
    "Un clic, sans attente : un fichier JSON contenant votre profil, votre rôle et votre lieu de résidence, vos paramètres de notification et votre boîte de réception, vos appartenances aux espaces de travail, tout ce que vous avez créé (parcelles, propriétés, emplacements) et les commentaires que vous avez écrits. Il n’inclut pas les données d’autres personnes ni les relevés environnementaux publics, et le fichier le précise.",
  "settings.download.button": "Télécharger mes données",
  "settings.delete.title": "Supprimer votre compte",
  "settings.delete.body":
    "Cela supprime définitivement et immédiatement votre compte, vos appartenances, vos notifications et les commentaires que vous avez écrits. Les parcelles, propriétés et emplacements que vous avez ajoutés appartiennent à l’espace de travail ; ils restent donc, sans votre nom. Cette action est irréversible ; téléchargez d’abord vos données si vous en voulez une copie.",
  "settings.delete.confirmLabel": "Saisissez {word} pour confirmer",
  "settings.delete.button": "Supprimer mon compte",

  // ---- search
  "search.title": "Recherche",
  "search.resultsFor": "Résultats pour « {query} »",
  "search.empty.title": "Recherchez ce que vous voulez",
  "search.empty.description":
    "Essayez un lieu, un sujet ou une page — par exemple : {examples}. Appuyez sur / n’importe où pour accéder à la zone de recherche.",
  "search.question.title": "Je ne peux pas répondre directement à cette question",
  "search.question.body":
    "La recherche trouve des espaces de travail, des pages et des lieux. Je n’ai pas de source fiable pour les questions ouvertes, donc je ne vais pas deviner. Voici où se trouvent les éléments de votre question.",
  "search.question.bodyWithPlace":
    "La recherche trouve des espaces de travail, des pages et des lieux. Je n’ai pas de source fiable pour les questions ouvertes, donc je ne vais pas deviner. Voici où se trouvent les éléments de votre question, y compris « {place} ».",
  "search.workspacesAndPages": "Espaces de travail et pages",
  "search.placesMatching": "Lieux correspondant à « {place} »",
  "search.places": "Lieux",
  "search.nothingMatched": "Aucun résultat pour « {query} »",
  "search.nothingMatchedHelp":
    "Essayez un nom de lieu, un sujet comme inondation ou solaire, ou une page comme équipe ou paramètres.",
  "search.placesFailed":
    "La recherche de lieux n’est pas disponible pour le moment ; seuls les espaces de travail et les pages sont affichés. Réessayez dans un instant.",
  "search.signedOutNote":
    "Les espaces de travail nécessitent un compte. Les lieux s’ouvrent dans l’Explorateur public sans compte.",
  "search.signIn": "Connectez-vous pour ouvrir les espaces de travail",

  // ---- search index (page names the search box finds)
  "searchIndex.dashboard.label": "Tableau de bord",
  "searchIndex.dashboard.description": "Vos espaces de travail au même endroit",
  "searchIndex.explorer.label": "Explorateur public",
  "searchIndex.explorer.description": "Consultez n’importe quel lieu sur Terre — sans compte",
  "searchIndex.globe.label": "Le globe",
  "searchIndex.globe.description": "Une vue 3D de la planète",
  "searchIndex.notifications.label": "Notifications",
  "searchIndex.notifications.description":
    "Alertes pour votre lieu de résidence et activité dans vos espaces de travail",
  "searchIndex.notificationPrefs.label": "Préférences de notification",
  "searchIndex.notificationPrefs.description":
    "Choisissez les alertes et l’activité que vous voyez",
  "searchIndex.settings.label": "Paramètres",
  "searchIndex.settings.description": "Votre profil et votre compte",
  "searchIndex.export.label": "Télécharger mes données",
  "searchIndex.export.description": "Export en un clic de tout ce qui est lié à votre compte",
  "searchIndex.delete.label": "Supprimer mon compte",
  "searchIndex.delete.description": "Supprimer définitivement votre compte",

  // ---- assistant panel empty state
  "chrome.aiPanel.emptyTitle": "Aucune conversation active",
  "chrome.aiPanel.emptyBody":
    "Ouvrez un espace de travail pour poser des questions sur ses données.",

  // ---- errors shown by form actions (these are produced on the server)
  "errors.typeTwoLetters":
    "Saisissez au moins deux lettres d’un village, d’une ville ou d’une région.",
  "errors.noPlaceFound":
    "Aucun lieu ne correspond à « {query} ». Essayez une autre orthographe ou une ville voisine.",
  "errors.placeLookupFailed":
    "Impossible de rechercher des lieux pour le moment. Veuillez réessayer.",
  "errors.pickRoleAndPlace": "Choisissez d’abord qui vous êtes et un lieu.",
  "errors.liveDataFailed":
    "Impossible d’obtenir les données en direct pour {place} pour le moment. Vous pouvez continuer : elles se chargeront dans votre espace de travail.",
  "errors.invalidRole": "Ce rôle ne fait pas partie des options.",
  "errors.invalidPlace": "Ce lieu n’est pas valide. Veuillez le rechercher à nouveau.",
  "errors.saveFailed": "Impossible d’enregistrer pour le moment. Veuillez réessayer.",
  "errors.removeFailed": "Impossible de supprimer pour le moment. Veuillez réessayer.",
  "errors.weatherServiceUnreachable":
    "Impossible de joindre le service météorologique pour le moment. Veuillez réessayer.",
  "errors.nameTooLong": "Gardez votre nom sous {max} caractères.",
  "errors.sessionExpired": "Votre session a expiré. Veuillez vous reconnecter.",
  "errors.nameSaveFailed": "Impossible d’enregistrer votre nom. Veuillez réessayer.",
  "errors.typeToConfirm": "Saisissez {word} pour confirmer.",
  "errors.deleteFailed": "Impossible de supprimer votre compte. Veuillez réessayer.",

  // ---- search place result line
  "search.placeDescription": "Voir les conditions actuelles",

  // ---- first-use tutorial popup
  "chrome.tutorial.step": "Étape {current} sur {total}",
  "chrome.tutorial.skip": "Passer",
  "chrome.tutorial.back": "Retour",
  "chrome.tutorial.next": "Suivant",
  "chrome.tutorial.getStarted": "Commencer",
  // ---- phone layout: menu button and bottom bar
  "chrome.nav.menu": "Menu",
  "chrome.nav.closeMenu": "Fermer le menu",
  "chrome.nav.quickNav": "Navigation rapide",
  "chrome.nav.home": "Accueil",
  "chrome.nav.map": "Carte",
  "chrome.nav.alerts": "Alertes",
  "chrome.nav.search": "Rechercher",
  "chrome.nav.ai": "IA",
};
