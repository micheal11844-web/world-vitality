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
    "Cela supprime définitivement et immédiatement votre compte, vos appartenances, vos notifications et les commentaires que vous avez écrits. Si vous êtes propriétaire de votre organisation, les parcelles, propriétés et emplacements qui y sont enregistrés sont supprimés aussi (possible uniquement lorsqu’il n’y reste plus personne d’autre). Si vous êtes membre de l’organisation de quelqu’un d’autre, ce que vous avez ajouté y reste, sans votre nom. Cette action est irréversible ; téléchargez d’abord vos données si vous en voulez une copie.",
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
  "errors.deleteOrganizationHasMembers":
    "Votre organisation compte encore d’autres membres ({count}). Retirez-les d’abord depuis la page « Équipe », puis supprimez votre compte.",

  // ---- plan & billing (v95)
  "billing.title": "Offre et facturation",
  "billing.back": "Retour aux paramètres",
  "billing.seePlans": "Voir les offres",
  "billing.plan.basic": "Basique",
  "billing.plan.standard": "Standard",
  "billing.plan.premium": "Premium",
  "billing.plan.enterprise": "Enterprise",
  "billing.current.title": "Votre offre",
  "billing.state.free": "Vous êtes sur l’offre Basique gratuite.",
  "billing.state.lapsed":
    "Votre dernier paiement n’a pas abouti ; vous êtes donc sur Basique pour le moment. Vous pouvez mettre à jour votre carte ci-dessous.",
  "billing.state.active": "Vous êtes abonné à {plan}. L’abonnement se renouvelle automatiquement.",
  "billing.state.ending":
    "Votre offre {plan} est résiliée. Vous la gardez jusqu’au {date}, puis vous passez à Basique. Rien n’est supprimé.",
  "billing.state.endingNoDate":
    "Votre offre {plan} est résiliée. Vous la gardez jusqu’à la fin de la période payée, puis vous passez à Basique. Rien n’est supprimé.",
  "billing.state.pastDue":
    "Votre dernier paiement n’a pas abouti. Votre offre {plan} reste active jusqu’au {date}, le temps de mettre à jour votre carte.",
  "billing.state.pastDueNoDate":
    "Votre dernier paiement n’a pas abouti. Votre offre {plan} reste active quelques jours, le temps de mettre à jour votre carte.",
  "billing.state.manual":
    "Votre offre {plan} a été convenue directement avec nous ; il n’y a donc rien à gérer ici.",
  "billing.member.note":
    "L’offre de votre organisation est gérée par son propriétaire. Vous utilisez son offre {plan}.",
  "billing.return.confirming":
    "Merci. Nous confirmons votre paiement auprès de Paystack, ce qui prend généralement quelques secondes. Si votre offre n’a pas encore changé, actualisez cette page.",
  "billing.return.refresh": "Actualiser",
  "billing.return.done": "Paiement confirmé. Vous êtes sur l’offre {plan}.",
  "billing.limit.seats": "Personnes dans votre organisation",
  "billing.limit.savedItems": "Champs, propriétés et lieux enregistrés",
  "billing.limit.unlimited": "Aucune limite fixée",
  "billing.plans.title": "Offres",
  "billing.plans.free": "Gratuit",
  "billing.plans.current": "Votre offre",
  "billing.plans.notOffered": "Pas encore disponible à l’achat.",
  "billing.plans.none": "Les offres ne peuvent pas encore être achetées. Revenez bientôt.",
  "billing.interval.monthly": "Mensuel",
  "billing.interval.annual": "Annuel",
  "billing.interval.saving": "2 mois offerts",
  "billing.interval.label": "Période de facturation",
  "billing.currency.label": "Devise",
  "billing.currency.NGN": "Naira (₦)",
  "billing.currency.USD": "Dollars américains ($)",
  "billing.price.monthly": "{price} / mois",
  "billing.price.annual": "{price} / an",
  "billing.subscribe": "Souscrire à {plan}",
  "billing.subscribe.failed":
    "Impossible de lancer le paiement ; rien n’a été débité. Réessayez dans un instant.",
  "billing.payNote":
    "Vous payez sur la page sécurisée de Paystack, et nous ne voyons jamais les données de votre carte. Le prix affiché est le prix facturé. Résiliez à tout moment et gardez votre offre jusqu’à la fin de la période payée.",
  "billing.switchNote":
    "Pour passer d’une offre payante à l’autre, résiliez l’offre actuelle et souscrivez à l’autre une fois qu’elle est terminée. Paystack ne peut pas modifier un abonnement en cours.",
  "billing.alwaysFree":
    "Les alertes météo officielles, l’Explorateur public, ainsi que l’export et la suppression de vos propres données sont gratuits sur toutes les offres.",
  "billing.ownerOnly": "Seul le propriétaire de l’organisation peut souscrire ou changer d’offre.",
  "billing.manage.title": "Carte et résiliation",
  "billing.manage.cardBody":
    "Ouvre la page de Paystack, où vous pouvez changer la carte utilisée pour les renouvellements.",
  "billing.manage.card": "Mettre à jour la carte sur Paystack",
  "billing.manage.cardFailed":
    "Impossible d’ouvrir la page de Paystack pour le moment. Réessayez dans un instant.",
  "billing.manage.cancel": "Résilier l’abonnement",
  "billing.manage.cancelBody":
    "Vous gardez votre offre jusqu’à la fin de la période payée, puis vous passez à Basique. Rien n’est supprimé ; vous ne pourrez simplement pas ajouter plus que ce que Basique permet.",
  "billing.manage.cancelConfirm": "Oui, résilier à la fin de la période",
  "billing.manage.cancelKeep": "Garder mon offre",
  "billing.manage.cancelDone":
    "Résiliation demandée. Cette page se met à jour dès que Paystack la confirme.",
  "billing.manage.cancelFailed":
    "Impossible de résilier pour le moment ; rien n’a changé. Réessayez dans un instant.",
  "settings.billing.title": "Offre et facturation",
  "settings.billing.body": "Vous êtes sur l’offre {plan}.",
  "settings.billing.link": "Voir l’offre et la facturation",
  "settings.delete.billingNote":
    "Si vous avez un abonnement payant, nous le résilions d’abord auprès de Paystack, pour que vous ne soyez plus débité.",
  "errors.billingUnavailable":
    "La facturation n’est pas disponible pour le moment. Réessayez plus tard.",
  "errors.billingOwnerOnly": "Seul le propriétaire de l’organisation peut changer son offre.",
  "errors.billingAlreadySubscribed":
    "Vous avez déjà un abonnement. Vous pouvez le gérer sur la page de l’offre.",
  "errors.billingNotOffered": "Cette offre n’est pas disponible à l’achat pour le moment.",
  "errors.billingNotSubscribed": "Il n’y a aucun abonnement à gérer.",
  "errors.deleteCancelSubscriptionFailed":
    "Nous n’avons pas pu résilier votre abonnement auprès de Paystack ; votre compte n’a donc pas été supprimé (sinon vous continueriez à être débité). Réessayez dans un instant.",

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

  // ---- offline use and installing the app
  "chrome.offline.offline": "Vous êtes hors ligne. Ce que vous voyez peut ne pas être à jour.",
  "chrome.offline.savedCopy":
    "Vous consultez la copie que vous avez ouverte en dernier, enregistrée {ago}. Reconnectez-vous et rechargez pour voir les informations actuelles.",
  "chrome.offline.reload": "Recharger",
  "offline.title": "Vous êtes hors ligne",
  "offline.body":
    "World Vitality n’a pas accès à Internet pour le moment. Les pages que vous avez ouvertes récemment sont enregistrées sur cet appareil et s’ouvrent avec une note indiquant quand elles ont été enregistrées. Tout le reste nécessite une connexion.",
  "offline.retry": "Réessayer",
  "offline.dashboard": "Ouvrir le tableau de bord",
  "offline.privacy":
    "Les pages enregistrées restent sur cet appareil et sont supprimées à la déconnexion.",
  "settings.install.title": "Installer sur cet appareil",
  "settings.install.body":
    "Ajoutez World Vitality à votre écran d’accueil ou à votre bureau pour l’ouvrir comme une application. Les pages que vous avez ouvertes récemment restent disponibles hors ligne : elles sont enregistrées uniquement sur cet appareil et supprimées à la déconnexion.",
  "settings.install.button": "Installer l’application",
  "settings.install.installed": "World Vitality est installée sur cet appareil.",
  "settings.install.hint":
    "Pour l’installer, ouvrez le bouton de partage ou le menu de votre navigateur et choisissez « Ajouter à l’écran d’accueil » ou « Installer l’application ».",

  // ---- Weather & Climate workspace (home page) and the location note shared by workspace pages
  "weather.currentConditions": "Conditions actuelles",
  "weather.status": "État",
  "weather.temperature": "Température",
  "weather.alerts": "Alertes",
  "weather.noActiveAlerts": "Aucune alerte active",
  "weather.trend": "Tendance",
  "weather.forecast": "Prévisions",
  "weather.noForecast": "Aucune prévision disponible",
  "weather.historicalContext": "Contexte historique",
  "weather.noBenchmark": "Pas encore de référence climatique régionale",
  "weather.gaps":
    "{count, plural, one {# jour sans données disponibles.} other {# jours sans données disponibles.}}",
  "weather.forecastGaps":
    "{count, plural, one {# jour de prévision sans données disponibles.} other {# jours de prévision sans données disponibles.}}",
  "weather.aiPanel.emptyTitle": "Rien à interpréter pour l’instant",
  "weather.aiPanel.emptyBody": "Ouvrez Conditions actuelles pour voir un état généré par l’IA.",
  "workspace.locationNote.home": "Affichage de {place}, votre lieu de résidence.",
  "workspace.locationNote.change": "Modifier",
  "workspace.locationNote.demo": "Affichage d’un lieu de démonstration ({place}).",
  "workspace.locationNote.setOwn": "Définissez votre propre lieu",
  "workspace.locationNote.demoTail": "pour voir ici vos conditions.",
};
