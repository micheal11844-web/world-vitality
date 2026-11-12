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
    "Cela supprime définitivement et immédiatement votre compte, vos appartenances, vos notifications et les commentaires que vous avez écrits. Si vous êtes propriétaire de votre organisation, les parcelles, propriétés et emplacements qui y sont enregistrés sont supprimés aussi (possible uniquement lorsqu’il n’y reste plus personne d’autre ; pour la laisser intacte, transférez-la d’abord à quelqu’un qui en fait partie). Si vous êtes membre de l’organisation de quelqu’un d’autre, ce que vous avez ajouté y reste, sans votre nom. Cette action est irréversible ; téléchargez d’abord vos données si vous en voulez une copie.",
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
    "Votre organisation compte encore d’autres membres ({count}). Transférez-la à l’un d’eux, ou retirez-les depuis la page « Équipe », puis supprimez votre compte.",

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

  // ---- organisation card (v96)
  "settings.org.title": "Votre organisation",
  "settings.org.owner": "Vous êtes le propriétaire de cette organisation.",
  "settings.org.member": "Vous êtes membre de cette organisation. Son propriétaire la gère.",
  "settings.org.nameLabel": "Nom de l’organisation",
  "settings.org.nameHelp":
    "Jusqu’à {max} caractères. Il apparaît dans l’export de vos données et dans nos outils d’assistance.",
  "settings.org.save": "Enregistrer le nom de l’organisation",
  "settings.org.people.title": "Personnes dans votre organisation",
  "settings.org.people.count": "{count, plural, one {# personne} other {# personnes}}",
  "settings.org.people.owner": "Propriétaire",
  "settings.org.people.member": "Membre",
  "settings.org.people.you": "vous",
  "settings.org.people.hint":
    "Pour ajouter ou retirer des personnes, ouvrez un espace de travail et choisissez Équipe.",
  "settings.org.people.loadFailed":
    "Impossible de charger la liste des personnes pour le moment. Réessayez.",
  "errors.orgNameInvalid": "Utilisez entre 1 et {max} caractères pour le nom de l’organisation.",
  "errors.orgRenameFailed": "Impossible de renommer votre organisation. Réessayez.",
  "errors.orgOwnerOnly": "Seul le propriétaire de l’organisation peut la renommer.",

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
  "settings.install.appsLead": "Vous préférez une application pour ordinateur ou pour Android ?",
  "settings.install.appsLink": "Voir les téléchargements",

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
  "workspace.forecastGaps":
    "{count, plural, one {# jour de prévision sans données disponibles.} other {# jours de prévision sans données disponibles.}}",
  "weather.aiPanel.emptyTitle": "Rien à interpréter pour l’instant",
  "weather.aiPanel.emptyBody": "Ouvrez Conditions actuelles pour voir un état généré par l’IA.",
  "workspace.locationNote.home": "Affichage de {place}, votre lieu de résidence.",
  "workspace.locationNote.change": "Modifier",
  "workspace.locationNote.demo": "Affichage d’un lieu de démonstration ({place}).",
  "workspace.locationNote.setOwn": "Définissez votre propre lieu",
  "workspace.locationNote.demoTail": "pour voir ici vos conditions.",

  // ---- Shared workspace pieces: empty states, edit/delete, report buttons (v104)
  "workspace.aiPanel.emptyTitle": "Rien à interpréter pour l’instant",
  "workspace.alerts": "Alertes",
  "workspace.noActiveAlerts": "Aucune alerte active",
  "workspace.trend": "Tendance",
  "workspace.comparison": "Comparaison",
  "workspace.map": "Carte",
  "workspace.viewFullMap": "Voir la carte complète →",
  "workspace.noBenchmark": "Pas encore de référence régionale",
  "workspace.gaps":
    "{count, plural, one {# jour sans données disponibles.} other {# jours sans données disponibles.}}",
  "resource.edit": "Modifier",
  "resource.delete": "Supprimer",
  "resource.confirmDelete": "Confirmer la suppression ?",
  "resource.save": "Enregistrer",
  "resource.name": "Nom",
  "resource.latitude": "Latitude",
  "resource.longitude": "Longitude",
  "resource.sessionUnverified": "Impossible de vérifier votre session. Reconnectez-vous.",
  "resource.latitudeRange": "La latitude doit être un nombre compris entre -90 et 90.",
  "resource.longitudeRange": "La longitude doit être un nombre compris entre -180 et 180.",
  "report.generated": "Généré le {when}",
  "report.print": "Imprimer / Enregistrer en PDF",
  "report.downloadCsv": "Télécharger le CSV",
  "report.accessDenied": "Accès refusé",
  "report.accessDeniedBody":
    "Ce rôle n’a pas l’autorisation de créer des rapports dans cet espace de travail.",

  // ---- Agriculture workspace (v104)
  "agri.aiPanel.emptyBody": "Ouvrez Aperçu des parcelles pour voir un état généré par l’IA.",
  "agri.soilMoisture": "Humidité du sol",
  "agri.temperature": "Température",
  "agri.empty.noFields": "Aucune parcelle pour l’instant",
  "agri.empty.noFieldsVisible": "Aucune parcelle visible pour votre rôle",
  "agri.empty.addAbove": "Ajoutez une parcelle ci-dessus pour commencer.",
  "agri.empty.scoped":
    "Votre accès est limité à certaines parcelles, et aucune ne vous est attribuée pour le moment.",
  "agri.reportCard.body":
    "Instantané des conditions actuelles de chaque parcelle que vous pouvez voir, exportable en CSV ou PDF →",
  "agri.trend.emptyTitle": "Pas encore assez d’historique",
  "agri.trend.emptyBody": "Les comparaisons de tendance demandent plus d’une saison de données.",
  "agri.add.title": "Ajouter une parcelle",
  "agri.add.button": "Ajouter la parcelle",
  "agri.add.success": "« {name} » ajoutée.",
  "agri.comments.show": "Commentaires ({count})",
  "agri.comments.hide": "Masquer les commentaires",
  "agri.comments.none": "Aucun commentaire pour l’instant.",
  "agri.comments.label": "Commentaire",
  "agri.comments.add": "Ajouter un commentaire",
  "agri.comments.post": "Publier",
  "agri.comments.edited": "(modifié)",
  "agri.err.nameRequired": "Saisissez un nom de parcelle.",
  "agri.err.noPermissionAdd":
    "Vous n’avez pas l’autorisation d’ajouter des parcelles dans cet espace de travail.",
  "agri.err.createFailed": "Impossible de créer la parcelle. Réessayez.",
  "agri.err.noPermissionEdit": "Vous n’avez pas l’autorisation de modifier cette parcelle.",
  "agri.err.updateFailed": "Impossible de mettre à jour la parcelle. Réessayez.",
  "agri.err.noPermissionDelete": "Vous n’avez pas l’autorisation de supprimer cette parcelle.",
  "agri.err.deleteFailed": "Impossible de supprimer la parcelle. Réessayez.",
  "agri.err.commentEmpty": "Le commentaire ne peut pas être vide.",
  "agri.err.noPermissionComment": "Vous n’avez pas l’autorisation de commenter cette parcelle.",
  "agri.err.postFailed": "Impossible de publier le commentaire. Réessayez.",
  "agri.err.editOwnOnly": "Vous ne pouvez modifier que vos propres commentaires.",
  "agri.err.deleteOwnOnly": "Vous ne pouvez supprimer que vos propres commentaires.",
  "agri.report.snapshotNote":
    "Ceci est un instantané des conditions actuelles de chaque parcelle que vous pouvez voir — ni un bilan de fin de saison, ni une comparaison avec les normales historiques (cette application ne contient aucune donnée des saisons précédentes). Consultez la documentation de World Vitality sur la provenance des données pour le détail des sources.",
  "agri.report.noFieldsTitle": "Aucune parcelle visible",
  "agri.report.noFieldsBody": "Il n’y a aucune parcelle à inclure dans ce rapport.",
  "agri.map.noFieldsBody":
    "Il n’y a pas encore de parcelle à afficher sur la carte. Ajoutez une parcelle depuis la page d’accueil de l’espace de travail.",

  // ---- Map text shared by the resource maps; Agriculture map (v104)
  "map.moisture.veryDry": "très sec",
  "map.moisture.dry": "sec",
  "map.moisture.moderate": "humidité modérée",
  "map.moisture.moist": "humide",
  "map.moisture.saturated": "saturé",
  "agri.map.toggle": "Humidité du sol ({count, plural, one {# parcelle} other {# parcelles}})",
  "map.popupReading": "{name} : {label} ({value} sur 1,0)",
  "map.popupNoReading": "{name} : aucune mesure actuelle d’humidité du sol",
  "agri.map.descNone": "Aucune parcelle à afficher sur la carte.",
  "agri.map.descOn":
    "Carte montrant {count, plural, one {# parcelle} other {# parcelles}}. {items}",
  "agri.map.descOff":
    "Carte montrant {count, plural, one {# parcelle} other {# parcelles}}. La couche d’humidité du sol est masquée.",
  "map.descItem": "{name} : {label} ({value} sur une échelle de 0 à 1)",
  "map.descItemNoReading": "{name} : aucune mesure actuelle",

  // ---- Shared: signed-in line, report link, map readings (v105)
  "workspace.signedInAs": "Connecté en tant que : {role}",
  "report.open": "Ouvrir le rapport",
  "report.notAvailable": "L’export de rapports n’est pas disponible pour votre rôle",

  // ---- Insurance workspace (v105)
  "insurance.role.admin_owner": "Administrateur",
  "insurance.role.operational_user": "Souscripteur",
  "insurance.role.scoped_field_user": "Expert en sinistres",
  "insurance.role.viewer_external": "Analyste (lecture seule)",
  "insurance.aiPanel.emptyBody":
    "Ouvrez Contexte de risque pour la souscription pour voir un état généré par l’IA.",
  "insurance.home.intro":
    "Portefeuille assuré réel ({count, plural, one {# bien} other {# biens}}). Signaux de danger individuels uniquement ; aucun score de risque multirisque synthétisé (voir les notes de portée de cette page).",
  "insurance.empty.noProperties": "Aucun bien assuré pour le moment",
  "insurance.empty.noPropertiesVisible": "Aucun bien visible pour votre rôle",
  "insurance.empty.addAbove": "Ajoutez un bien assuré ci-dessus pour commencer.",
  "insurance.empty.scoped":
    "Votre accès est limité à certains biens, et aucun ne vous est attribué pour le moment.",
  "insurance.temperature": "Température",
  "insurance.soilDrought": "Sol / lié à la sécheresse",
  "insurance.reportCard.body":
    "Générez un rapport de souscription prêt à imprimer, avec les sources, les horodatages et une entrée consignée dans la piste d’audit.",
  "insurance.add.title": "Ajouter un bien assuré",
  "insurance.add.button": "Ajouter le bien",
  "insurance.add.success": "« {name} » ajouté.",
  "insurance.policyNumber": "Numéro de police",
  "insurance.address": "Adresse",
  "insurance.propertyAddress": "Adresse du bien",
  "insurance.err.policyRequired": "Saisissez un numéro de police.",
  "insurance.err.addressRequired": "Saisissez l’adresse du bien.",
  "insurance.err.noPermissionAdd":
    "Vous n’avez pas l’autorisation d’ajouter des biens assurés dans cet espace de travail.",
  "insurance.err.createFailed": "Impossible de créer le bien assuré. Veuillez réessayer.",
  "insurance.err.noPermissionEdit": "Vous n’avez pas l’autorisation de modifier ce bien.",
  "insurance.err.updateFailed": "Impossible de mettre à jour le bien assuré. Veuillez réessayer.",
  "insurance.err.noPermissionDelete": "Vous n’avez pas l’autorisation de supprimer ce bien.",
  "insurance.err.deleteFailed": "Impossible de supprimer le bien assuré. Veuillez réessayer.",
  "insurance.report.title": "Rapport de risque pour la souscription",
  "insurance.report.count": "{count, plural, one {# bien} other {# biens}}",
  "insurance.report.scopeNote":
    "Ce rapport couvre tous les biens assurés que vous pouvez voir et ne présente que des signaux de danger individuels — pas un score de risque multirisque synthétisé. Il ne convient pas tel quel à une documentation réelle de souscription, de sinistres ou de conformité réglementaire. L’accès au rapport est consigné dans la piste d’audit de cet espace de travail. Consultez la documentation de World Vitality sur la provenance des données pour le détail des sources.",
  "insurance.report.noPropertiesTitle": "Aucun bien visible",
  "insurance.report.noPropertiesBody": "Aucun bien assuré à inclure dans ce rapport.",
  "insurance.map.noPropertiesBody":
    "Il n’y a pas encore de bien assuré à afficher sur la carte. Ajoutez un bien depuis la page d’accueil de l’espace de travail.",
  "insurance.map.toggle": "Humidité du sol ({count, plural, one {# bien} other {# biens}})",
  "insurance.map.descNone": "Aucun bien à afficher sur la carte.",
  "insurance.map.descOn": "Carte montrant {count, plural, one {# bien} other {# biens}}. {items}",
  "insurance.map.descOff":
    "Carte montrant {count, plural, one {# bien} other {# biens}}. La couche d’humidité du sol est masquée.",

  // ---- Government & NGOs workspace (v105)
  "gov.role.admin_owner": "Administrateur de l’agence",
  "gov.role.operational_user": "Analyste",
  "gov.role.scoped_field_user": "Personnel de terrain",
  "gov.role.viewer_external": "Agence partenaire (lecture seule)",
  "gov.aiPanel.emptyBody": "Ouvrez Aperçu de la juridiction pour voir un état généré par l’IA.",
  "gov.home.intro":
    "Sites surveillés réels ({count, plural, one {# site} other {# sites}}), et non de véritables limites de juridiction (voir les notes de portée de cette page).",
  "gov.empty.noLocations": "Aucun site surveillé pour le moment",
  "gov.empty.noLocationsVisible": "Aucun site visible pour votre rôle",
  "gov.empty.addAbove": "Ajoutez un site surveillé ci-dessus pour commencer.",
  "gov.empty.scoped":
    "Votre accès est limité à certains sites, et aucun ne vous est attribué pour le moment.",
  "gov.climate": "Climat",
  "gov.reportCard.body":
    "Générez un rapport prêt à imprimer de cet aperçu, avec les sources et les horodatages.",
  "gov.add.title": "Ajouter un site surveillé",
  "gov.add.button": "Ajouter le site",
  "gov.add.success": "« {name} » ajouté.",
  "gov.label": "Libellé",
  "gov.locationLabel": "Libellé du site",
  "gov.err.labelRequired": "Saisissez un libellé pour ce site.",
  "gov.err.noPermissionAdd":
    "Vous n’avez pas l’autorisation d’ajouter des sites surveillés dans cet espace de travail.",
  "gov.err.createFailed": "Impossible d’ajouter le site surveillé. Veuillez réessayer.",
  "gov.err.noPermissionEdit": "Vous n’avez pas l’autorisation de modifier ce site.",
  "gov.err.updateFailed": "Impossible de mettre à jour le site surveillé. Veuillez réessayer.",
  "gov.err.noPermissionDelete": "Vous n’avez pas l’autorisation de supprimer ce site.",
  "gov.err.deleteFailed": "Impossible de supprimer le site surveillé. Veuillez réessayer.",
  "gov.report.title": "Rapport d’aperçu de la juridiction",
  "gov.report.count": "{count, plural, one {# site} other {# sites}}",
  "gov.report.scopeNote":
    "Ce rapport couvre tous les sites surveillés que vous pouvez voir, et non une véritable limite de juridiction — il ne convient pas tel quel à une documentation publique, politique ou destinée aux donateurs. Consultez la documentation de World Vitality sur la provenance des données pour le détail des sources.",
  "gov.report.noLocationsTitle": "Aucun site visible",
  "gov.report.noLocationsBody": "Aucun site surveillé à inclure dans ce rapport.",
  "gov.map.noLocationsBody":
    "Il n’y a pas encore de site surveillé à afficher sur la carte. Ajoutez un site depuis la page d’accueil de l’espace de travail.",
  "gov.map.toggle": "Humidité du sol ({count, plural, one {# site} other {# sites}})",
  "gov.map.descNone": "Aucun site à afficher sur la carte.",
  "gov.map.descOn": "Carte montrant {count, plural, one {# site} other {# sites}}. {items}",
  "gov.map.descOff":
    "Carte montrant {count, plural, one {# site} other {# sites}}. La couche d’humidité du sol est masquée.",

  // ---- Shared map pieces for the sample-reference-site maps; status caption (v106)
  "workspace.status": "État",
  "map.mode.temperature": "Température",
  "map.mode.generation": "Niveau de production",
  "map.mode.routeRisk": "Niveau de risque de l’itinéraire",
  "map.mode.siteRisk": "Risque du site",
  "map.mode.moisture": "Afficher l’humidité du sol",
  "map.mode.raw": "Mesures brutes",
  "map.verdict.cold": "froid",
  "map.verdict.cool": "frais",
  "map.verdict.mild": "doux",
  "map.verdict.warm": "chaud",
  "map.verdict.hot": "très chaud",
  "map.verdict.belowCutIn": "sous le seuil de démarrage",
  "map.verdict.ramping": "montée en puissance",
  "map.verdict.rated": "puissance nominale",
  "map.verdict.cutOut": "arrêt par vent fort",
  "map.verdict.clear": "dégagé",
  "map.verdict.elevated": "accru",
  "map.verdict.high": "élevé",
  "map.verdict.severe": "sévère",
  "map.verdict.dry": "Sec",
  "map.verdict.somewhatWet": "Assez humide",
  "map.verdict.wet": "Humide",
  "map.tempValue": "{value} °C",
  "map.windValue": "vent de {value} m/s",
  "map.popup.pair": "{first} — {second}",
  "map.ref.coverage": "Sites de référence d’exemple : {plotted} sur {total} avec données",
  "map.ref.descOn":
    "Carte de {count, plural, one {# site de référence d’exemple} other {# sites de référence d’exemple}}. {items}",
  "map.ref.descOff": "Carte de sites de référence d’exemple. La couche est masquée.",
  "site.ibadan": "Ibadan, Nigéria",
  "site.nairobi": "Nairobi, Kenya",
  "site.rotterdam": "Rotterdam, Pays-Bas",
  "site.desMoines": "Des Moines, États-Unis",
  "site.chennai": "Chennai, Inde",
  "site.brisbane": "Brisbane, Australie",

  // ---- Construction workspace (v106)
  "construction.aiPanel.emptyBody": "Ouvrez Risque du site pour voir un état généré par l’IA.",
  "construction.title": "État des activités du jour",
  "construction.siteRiskStatus": "État du risque du site",
  "construction.siteRiskTimeline": "Chronologie du risque du site",
  "construction.activity.concretePour": "Coulage du béton",
  "construction.activity.craneOperation": "Utilisation de la grue",
  "construction.activity.roofingWork": "Travaux de toiture",
  "construction.activity.excavation": "Excavation (risque de crue soudaine)",
  "construction.status.go": "autorisé",
  "construction.status.caution": "prudence",
  "construction.status.noGo": "à éviter",

  // ---- Renewable Energy workspace (v106)
  "renewable.aiPanel.emptyBody":
    "Ouvrez Perspectives de production pour voir un état généré par l’IA.",
  "renewable.title": "Perspectives de production des actifs",
  "renewable.hydroNote":
    "Le module hydroélectrique lit toujours une station de jaugeage fixe de l’USGS, et non ce lieu.",
  "renewable.outlookWind": "Perspectives de production : éolien (7 prochains jours)",
  "renewable.outlookSolar": "Perspectives de production : solaire (7 prochains jours)",
  "renewable.statusWind": "État actuel : éolien",
  "renewable.statusSolar": "État actuel : solaire",
  "renewable.statusHydro": "État actuel : hydroélectricité (station de jaugeage aux États-Unis)",
  "renewable.hydroGaps":
    "{count, plural, one {# mesure sans données disponibles.} other {# mesures sans données disponibles.}}",

  // ---- Logistics & Shipping workspace (v106)
  "logistics.aiPanel.emptyBody": "Ouvrez Risque de l’itinéraire pour voir un état généré par l’IA.",
  "logistics.title": "État du risque de l’itinéraire",
  "logistics.outlook": "Perspectives du risque de l’itinéraire (7 prochains jours)",
  "logistics.disruptionReports": "Signalements de perturbations",
  "logistics.noDisruptions": "Aucun historique de perturbations pour le moment",

  // ---- Research workspace (v107)
  "research.aiPanel.title": "Pas d’interprétation de l’IA ici, volontairement",
  "research.aiPanel.body":
    "Recherche garde volontairement ce panneau brut : les données apparaissent dans le tableau de l’Explorateur de données avec toute leur provenance, sans résumé par une couche d’IA.",
  "research.aiPanel.provenance":
    "À la place, la provenance de chaque enregistrement (source, licence, heure de récupération, limites connues) est affichée directement dans le tableau.",
  "research.dataset": "Jeu de données",
  "research.metrics": "Métriques",
  "research.results": "Résultats",
  "research.relationships": "Relations entre les données",
  "research.source.nasaPower.label": "NASA POWER — Conditions actuelles",
  "research.source.nasaPower.description":
    "Données d’observation du domaine public, sans clé d’API requise.",
  "research.source.openMeteo.label": "Open-Meteo — Prévisions à 7 jours",
  "research.source.openMeteo.description":
    "Offre gratuite, licence d’usage non commercial (voir la colonne Licence de ce jeu de données).",
  "research.fetch": "Récupérer les données",
  "research.fetchFailed": "Impossible de récupérer ce jeu de données. Veuillez réessayer.",
  "research.col.metric": "Métrique",
  "research.col.value": "Valeur",
  "research.col.unit": "Unité",
  "research.col.timestamp": "Horodatage",
  "research.col.type": "Type",
  "research.col.source": "Source",
  "research.col.license": "Licence",
  "research.col.limitations": "Limites connus",
  "research.type.observed": "observé",
  "research.type.forecast": "prévision",
  "research.noneStated": "Aucune indiquée",
  "research.records": "{count, plural, one {# enregistrement} other {# enregistrements}}",
  "research.gapsReported": "{count, plural, one {# lacune signalée} other {# lacunes signalées}}",
  "research.recordsAndGaps": "{records} — {gaps}",
  "research.empty.title": "Aucun jeu de données chargé pour l’instant",
  "research.empty.body":
    "Choisissez un jeu de données ci-dessus, puis cliquez sur « Récupérer les données ».",
  "research.rel.intro":
    "Chaque métrique brute que cette plateforme ingère, et les espaces de travail qu’elle alimente réellement, déduits directement du câblage réel des capacités de la plateforme (ADR-0004, phase 1), et non d’un modèle hypothétique.",
  "research.rel.feeds": "Alimente : {workspaces}",
  "research.rel.feedsMany":
    "Alimente : {workspaces} — la même mesure, interprétée différemment selon le domaine.",
  "research.metric.T2M.label": "Température (T2M)",
  "research.metric.T2M.description":
    "La « température à 2 mètres » de NASA POWER, également obtenue sous forme de prévision quotidienne via Open-Meteo.",
  "research.metric.WS2M.label": "Vitesse du vent (WS2M)",
  "research.metric.WS2M.description":
    "La « vitesse du vent à 2 mètres » de NASA POWER, également obtenue sous forme de prévision quotidienne via Open-Meteo, explicitement en m/s pour que les deux sources soient directement comparables.",
  "research.metric.GWETROOT.label": "Humidité du sol en zone racinaire (GWETROOT)",
  "research.metric.GWETROOT.description":
    "L’indice d’humidité du sol en zone racinaire de NASA POWER, de 0 (sec) à 1 (saturé).",

  // ---- Education workspace (v107)
  "edu.role.admin_owner": "Enseignant/Administrateur",
  "edu.role.operational_user": "Enseignant",
  "edu.role.scoped_field_user": "Accès limité",
  "edu.role.viewer_external": "Invité (lecture seule)",
  "edu.aiPanel.title": "Pas de panneau latéral d’IA ici",
  "edu.aiPanel.body":
    "Les explications des données de cet espace de travail s’affichent directement dans la page, pas dans un panneau latéral.",
  "edu.intro":
    "Des données réelles et actuelles, expliquées au niveau scolaire que vous choisissez. Conçu pour les enseignants, en classe ; aucun compte ni donnée d’élève n’est collecté dans cet espace de travail.",
  "edu.demoLocation": "Lieu de classe de démonstration",
  "edu.explainFor": "Expliquer pour",
  "edu.grade.k2": "Niveaux K–2",
  "edu.grade.g35": "Niveaux 3–5",
  "edu.grade.g68": "Niveaux 6–8",
  "edu.grade.g912": "Niveaux 9–12",
  "edu.card.temperature": "Température",
  "edu.card.soilMoisture": "Humidité du sol",
  "edu.talkAbout": "Parlons-en : {prompt}",
  "edu.intro.k2.weather": "Découvrons : fait-il chaud ou froid dehors en ce moment ?",
  "edu.intro.k2.soil":
    "Découvrons : le sol a-t-il soif (il est sec) ou est-il plein d’eau (il est mouillé) en ce moment ?",
  "edu.intro.g35.weather":
    "Voici ce que de vraies données satellites nous disent sur la température de l’air à cet endroit aujourd’hui.",
  "edu.intro.g35.soil":
    "Voici ce que de vraies données satellites nous disent sur l’humidité du sol à cet endroit aujourd’hui.",
  "edu.intro.g68.weather":
    "Ceci est une mesure réelle et actuelle de la température de l’air à cet endroit, issue de données satellites de la NASA.",
  "edu.intro.g68.soil":
    "Ceci est une mesure réelle et actuelle de l’humidité du sol à cet endroit, issue de données satellites de la NASA.",
  "edu.intro.g912.weather":
    "Mesure actuelle de la température de l’air à cet endroit, issue des données satellites de NASA POWER :",
  "edu.intro.g912.soil":
    "Mesure actuelle de l’humidité du sol à cet endroit, issue des données satellites de NASA POWER :",
  "edu.conf.insufficientKid":
    "Nous n’avons pas encore assez d’informations pour le savoir — ce n’est pas grave, les scientifiques disent aussi « je ne sais pas » !",
  "edu.conf.insufficient":
    "Il n’y a pas assez de données récentes pour répondre avec confiance pour le moment.",
  "edu.conf.high": "Cela repose sur plusieurs mesures récentes, nous sommes donc plutôt confiants.",
  "edu.conf.moderate":
    "Cela repose sur quelques mesures récentes, c’est donc une estimation raisonnable.",
  "edu.conf.low":
    "Cela repose sur une seule mesure récente, considérez-le donc comme une estimation approximative.",
  "edu.conf.kid.high": "Nous l’avons vérifié plusieurs fois, alors nous en sommes presque sûrs !",
  "edu.conf.kid.moderate":
    "Nous l’avons vérifié deux ou trois fois, c’est donc une bonne estimation.",
  "edu.conf.kid.low":
    "Nous ne l’avons vérifié qu’une seule fois, ce n’est donc qu’une première estimation.",
  "edu.followUp.k2.weather": "Que portes-tu dehors aujourd’hui ? Est-ce que cela correspond ?",
  "edu.followUp.k2.soil":
    "As-tu vu récemment une flaque ou de la terre sèche et craquelée près de chez toi ?",
  "edu.followUp.g35.weather":
    "Comment la température d’aujourd’hui se compare-t-elle à ce que tu attendrais à cette période de l’année ?",
  "edu.followUp.g35.soil":
    "Pourquoi les agriculteurs pourraient-ils se soucier de l’humidité ou de la sécheresse du sol ?",
  "edu.followUp.g68.weather":
    "Quels facteurs pourraient faire varier la température entre deux endroits proches ?",
  "edu.followUp.g68.soil":
    "Comment l’humidité du sol pourrait-elle influencer les plantes et les animaux qui vivent dans cette région ?",
  "edu.followUp.g912.weather":
    "Cette mesure ne reflète que les conditions actuelles, pas une tendance. De quelles données supplémentaires auriez-vous besoin pour identifier une tendance climatique plutôt que la météo du quotidien ?",
  "edu.followUp.g912.soil":
    "Les niveaux d’humidité de ce fournisseur sont l’interprétation par seuils propre à la plateforme, et non une norme agronomique citée (voir la documentation de son code source). Pourquoi cette distinction compte-t-elle lorsqu’on utilise ces données pour une décision réelle ?",
  "edu.lesson.title": "Exemple de plan de cours",
  "edu.lesson.intro":
    "Un point de départ fondé sur des données réelles et actuelles. Il ne contient aucun nom ni donnée d’élève réels : adaptez-le à votre propre classe.",
  "edu.lesson.gradeLevel": "Niveau scolaire",
  "edu.lesson.download": "Télécharger le plan de cours",
  "edu.lesson.accessDeniedBody":
    "Ce rôle n’a pas l’autorisation de générer des plans de cours dans cet espace de travail.",
  "edu.doc.title": "Exemple de plan de cours",
  "edu.doc.subtitle": "À la découverte de notre environnement local",
  "edu.doc.gradeLevel": "Niveau scolaire : {grade}",
  "edu.doc.location": "Lieu utilisé : {place}",
  "edu.doc.asOf": "Données à jour au : {when}",
  "edu.doc.disclaimer":
    "Ceci est un exemple de plan de cours, un point de départ généré à partir de données environnementales réelles et actuelles. Il ne contient aucune donnée ni aucun nom d’élève réels : adaptez-le à votre propre classe.",
  "edu.doc.objective": "Objectif",
  "edu.doc.objective.k2":
    "Les élèves observeront et décriront la météo et l’état du sol réels en un lieu réel de la Terre.",
  "edu.doc.objective.g35":
    "Les élèves interpréteront des données environnementales réelles et les relieront à des conditions observables.",
  "edu.doc.objective.g68":
    "Les élèves analyseront des données environnementales réelles, y compris leur niveau de confiance, et discuteront des facteurs qui les influencent.",
  "edu.doc.objective.g912":
    "Les élèves évalueront de façon critique un jeu de données environnementales réelles, y compris son niveau de confiance annoncé et ses limites connues, et détermineront quelles données supplémentaires seraient nécessaires pour une analyse plus approfondie.",
  "edu.doc.materials": "Matériel",
  "edu.doc.materials.app": "- Espace de travail {workspace} de World Vitality ({explain} / {map})",
  "edu.doc.materials.discussion": "- Un espace de discussion en classe",
  "edu.doc.procedure": "Déroulement",
  "edu.doc.step.open": "Ouvrez la page « {explain} » et sélectionnez ce niveau.",
  "edu.doc.step.weather": "Examinez ensemble la mesure de la température : « {sentence} »",
  "edu.doc.step.soil": "Examinez ensemble la mesure de l’humidité du sol : « {sentence} »",
  "edu.doc.discuss": "Discutez : {prompt}",
  "edu.doc.step.map": "Ouvrez la page « {map} » et explorez visuellement le même lieu.",
  "edu.doc.step.confidence":
    "Demandez aux élèves de noter le niveau de confiance indiqué pour chaque mesure et de discuter de ce qui l’augmenterait ou le diminuerait.",
  "edu.doc.step.surprise":
    "Demandez aux élèves de partager une chose qui les a surpris dans les données.",
  "edu.doc.notes": "Notes pour l’enseignant",
  "edu.doc.notes.body":
    "Toutes les données affichées sont réelles et actuelles, issues des données satellites de NASA POWER (voir la documentation de provenance des données de cette plateforme). Il s’agit d’un seul lieu de démonstration, pas nécessairement celui de votre propre classe. Cet outil ne collecte ni ne conserve aucune donnée d’élève.",

  // ---- Disaster Monitoring workspace (v107)
  "dm.aiPanel.title": "Pas d’interprétation de l’IA ici, volontairement",
  "dm.aiPanel.body":
    "Les alertes sont affichées exactement telles que les émet le Service météorologique national des États-Unis (NWS), sans être résumées, notées ni réinterprétées par cette application.",
  "dm.aiPanel.ethics":
    "Cet espace de travail porte le poids éthique le plus élevé de la plateforme (Constitution, sections 7 et 9, tolérance zéro). Suivez toujours les consignes des autorités locales.",
  "dm.place": "Los Angeles, Californie",
  "dm.notSubstitute":
    "Ceci ne remplace pas les consignes officielles : suivez toujours les instructions des autorités locales.",
  "dm.caveat.original": "Texte original de la source (en anglais) :",
  "dm.alerts.subtitle":
    "{place} · Source : Service météorologique national des États-Unis (weather.gov) · États-Unis et territoires uniquement",
  "dm.alerts.failedTitle": "Impossible de joindre le Service météorologique national",
  "dm.alerts.failedBody":
    "Les alertes n’ont pas pu être récupérées pour le moment. Consultez directement weather.gov pour obtenir des informations officielles.",
  "dm.alerts.noneTitle": "Aucune alerte active",
  "dm.alerts.noneBody":
    "Aucune alerte du Service météorologique national n’est actuellement active pour {place}.",
  "dm.floods.title": "Sites touchés par des inondations",
  "dm.floods.subtitle": "{state} · Source : API d’impact des inondations en temps réel de l’USGS",
  "dm.floods.notice":
    "Ces informations sont préliminaires ou provisoires et n’ont pas reçu l’approbation finale de l’USGS. Elles ne doivent pas servir à prendre des décisions concernant la sécurité personnelle ou publique.",
  "dm.floods.failedTitle": "Impossible de joindre l’API d’impact des inondations de l’USGS",
  "dm.floods.failedBody":
    "Les données sur les inondations n’ont pas pu être récupérées pour le moment. Consultez directement waterdata.usgs.gov.",
  "dm.floods.noneTitle": "Aucun site touché par des inondations n’est actuellement actif",
  "dm.floods.noneBody":
    "Aucun site de référence de l’USGS actuellement inondé n’est signalé en {state}.",
  "dm.shelters.title": "Abris désignés à proximité",
  "dm.shelters.subtitle":
    "À moins de 25 miles (environ 40 km) de {place} · Source : FEMA / Croix-Rouge américaine (HIFLD)",
  "dm.shelters.caveat":
    "Cette couche ne doit pas servir à déterminer l’état de fonctionnement d’une installation pendant une urgence en cours. — FEMA/HIFLD",
  "dm.shelters.failedTitle": "Impossible de joindre le service des installations d’abri",
  "dm.shelters.failedBody":
    "Les données sur les abris n’ont pas pu être récupérées pour le moment.",
  "dm.shelters.noneTitle": "Aucun abri désigné trouvé dans le rayon",
  "dm.shelters.capacity": "Capacité d’évacuation (désignée) : {count}",
  "dm.fires.title": "Détections d’incendies actifs",
  "dm.fires.subtitle":
    "À ~1° de {place} · Source : NASA FIRMS (satellite VIIRS), dernières 24 heures",
  "dm.fires.caveat":
    "Il s’agit d’anomalies thermiques détectées par satellite (température de surface élevée), et non d’incendies de forêt confirmés. Les brûlages agricoles et d’autres sources de chaleur peuvent aussi apparaître ici. — NASA FIRMS",
  "dm.fires.notConfiguredTitle": "Données de détection d’incendies non configurées",
  "dm.fires.notConfiguredBody":
    "Définissez NASA_FIRMS_MAP_KEY dans les variables d’environnement de cette application pour activer cette section.",
  "dm.fires.failedTitle": "Impossible de joindre NASA FIRMS",
  "dm.fires.failedBody":
    "Les données de détection d’incendies n’ont pas pu être récupérées pour le moment.",
  "dm.fires.noneTitle": "Aucune détection d’incendie dans le rayon",
  "dm.fires.noneBody":
    "Aucune anomalie thermique détectée par satellite près de {place} au cours des dernières 24 heures.",
  "dm.fires.lineDay": "Confiance : {confidence} · Détection de jour · Satellite : {satellite}",
  "dm.fires.lineNight": "Confiance : {confidence} · Détection de nuit · Satellite : {satellite}",
  "dm.fires.unknown": "non précisé",
  "dm.fires.detected": "Détecté le {when} UTC",
  "dm.fires.frp": "Puissance radiative du feu : {value} MW",
  "dm.fire.day": "Jour",
  "dm.fire.night": "Nuit",
  "dm.map.kind.flood": "Site touché par une inondation",
  "dm.map.kind.shelter": "Abri désigné",
  "dm.map.kind.fire": "Détection d’incendie",
  "dm.map.layer.flood": "Sites touchés par des inondations ({count})",
  "dm.map.layer.shelter": "Abris désignés ({count})",
  "dm.map.layer.fire": "Détections d’incendies ({count})",
  "dm.map.popup": "{name} — {kind}",
  "dm.map.desc.none": "Aucune donnée d’inondation, d’abri ou d’incendie à afficher sur la carte.",
  "dm.map.desc.allHidden": "Toutes les couches de dangers sont actuellement masquées.",
  "dm.map.desc.showing":
    "{count, plural, one {Carte affichant # site : {items}.} other {Carte affichant # sites : {items}.}}",
  "dm.map.item.flood":
    "{count, plural, one {# site touché par une inondation} other {# sites touchés par des inondations}}",
  "dm.map.item.shelter": "{count, plural, one {# abri désigné} other {# abris désignés}}",
  "dm.map.item.fire":
    "{count, plural, one {# détection d’incendie} other {# détections d’incendies}}",
  "dm.map.fallback.flood": "Site actuellement inondé, selon la dernière vérification de l’USGS.",
  "dm.map.fallback.shelter": "Installation d’abri désignée (lieu de référence uniquement).",
  "dm.map.fireName": "Détection d’incendie (confiance : {confidence})",
  "dm.map.fireSummary":
    "Anomalie thermique, {satellite}, {date} ({dayNight}). Ce n’est pas un incendie de forêt confirmé.",

  // ---- Payment history, receipts and refunds (v111)
  "billing.history.title": "Historique des paiements",
  "billing.history.unavailable":
    "Nous n’avons pas pu charger votre historique de paiements pour le moment. Réessayez dans un instant.",
  "billing.history.receipt": "Reçu",
  "billing.history.receiptAria": "Reçu du paiement de {amount} du {date}",
  "billing.history.recentOnly": "Vos {count} paiements les plus récents sont affichés.",
  "billing.history.note":
    "Paystack peut aussi vous envoyer par e-mail son propre reçu pour chaque paiement.",
  "billing.history.itemOther": "Paiement",
  "billing.refund.inProgress": "Remboursement en cours",
  "billing.refund.processed": "Remboursement effectué",
  "billing.refund.failed": "Le remboursement n’a pas abouti",
  "billing.receipt.title": "Reçu de paiement",
  "billing.receipt.issuedBy": "Émis par",
  "billing.receipt.account": "Compte",
  "billing.receipt.datePaid": "Date du paiement",
  "billing.receipt.reference": "Référence du paiement",
  "billing.receipt.item": "Article",
  "billing.receipt.itemPlan": "Abonnement à l’offre {plan}",
  "billing.receipt.itemOther": "Paiement à World Vitality",
  "billing.receipt.amount": "Montant payé",
  "billing.receipt.method": "Payé via",
  "billing.receipt.refundInProgress": "Un remboursement de ce paiement est en cours.",
  "billing.receipt.refundProcessed": "Un remboursement de ce paiement a été effectué.",
  "billing.receipt.refundFailed": "Un remboursement de ce paiement n’a pas abouti.",
  "billing.receipt.notInvoice":
    "Ce document atteste votre paiement. Ce n’est pas une facture fiscale.",
  "billing.receipt.print": "Imprimer ou enregistrer en PDF",
  "billing.receipt.back": "Retour à Offre et facturation",

  // ---- Team page, plan limits and plan notices (v108)
  "team.title": "Équipe — {workspace}",
  "team.intro": "Invitez des personnes dans cet espace de travail et gérez leur accès.",
  "team.denied.body":
    "Ce rôle n’a pas l’autorisation de gérer les membres de l’équipe de cet espace de travail.",
  "team.invite.title": "Inviter quelqu’un",
  "team.email": "E-mail",
  "team.role": "Rôle",
  "team.invite.send": "Envoyer l’invitation",
  "team.invite.sent": "Invitation envoyée à {email}.",
  "team.invite.scope":
    "Limiter à certaines ressources (facultatif : laissez décoché pour un accès à tout l’espace de travail) :",
  "team.you": "(vous)",
  "team.youOwner": "(vous · propriétaire)",
  "team.owner": "(propriétaire)",
  "team.remove": "Retirer",
  "team.empty.title": "Aucun membre pour l’instant",
  "team.empty.body": "Invitez quelqu’un ci-dessus pour commencer.",
  "team.err.email": "Saisissez une adresse e-mail valide.",
  "team.err.role": "Choisissez un rôle valide.",
  "team.err.noInvite":
    "Vous n’avez pas l’autorisation d’inviter des personnes dans cet espace de travail.",
  "team.err.inviteFailed": "L’invitation n’a pas pu être envoyée. Veuillez réessayer.",
  "team.err.noRemove":
    "Vous n’avez pas l’autorisation de retirer des personnes de cet espace de travail.",
  "team.err.removeFailed": "Le membre n’a pas pu être retiré.",
  "team.err.ownerCannotBeRemoved": "Le propriétaire de l’organisation ne peut pas être retiré.",
  "team.err.lastAdmin":
    "Vous ne pouvez pas retirer le dernier propriétaire ou administrateur de cet espace de travail.",
  "billing.limit.reached.seats":
    "Votre offre {plan} inclut jusqu’à {limit, plural, one {# personne} other {# personnes}}. Passez à une offre supérieure pour en ajouter.",
  "billing.limit.reached.savedItems":
    "Votre offre {plan} inclut jusqu’à {limit, plural, one {# élément enregistré} other {# éléments enregistrés}} (les champs, les propriétés assurées et les lieux surveillés sont comptés ensemble). Passez à une offre supérieure pour en ajouter.",
  "billing.limit.reached.workspaces":
    "Votre offre {plan} inclut jusqu’à {limit, plural, one {# espace de travail} other {# espaces de travail}}. Passez à une offre supérieure pour en ajouter.",
  "billing.feature.included":
    "La fonctionnalité « {name} » est incluse dans l’offre {lowest} et les offres supérieures. Votre offre est {plan}.",
  "billing.feature.includedMany":
    "La fonctionnalité « {name} » est incluse dans l’offre {lowest} et les offres supérieures. Votre offre est {plan}.",
  "billing.feature.notPart": "La fonctionnalité « {name} » ne fait pas partie de l’offre {plan}.",
  "billing.feature.notPartMany":
    "La fonctionnalité « {name} » ne fait pas partie de l’offre {plan}.",
  "billing.feature.name.forecastOutlooks": "Prévisions",
  "billing.feature.name.csvExport": "Export CSV",
  "billing.feature.name.printReport": "Impression et export PDF",
  "billing.feature.name.auditableReport": "Rapport auditable",
  "billing.feature.name.teamTools": "Outils d’équipe",
  "billing.feature.name.emailAlerts": "Alertes par e-mail",
  "billing.feature.name.smsAlerts": "Alertes par SMS",
  "billing.feature.name.auditLog": "Journal d’audit",
  "billing.feature.name.bulkExport": "Export en masse",
  "billing.feature.name.apiAccess": "Accès à l’API",
  "billing.feature.name.integrations": "Intégrations",
  "billing.feature.name.sso": "Authentification unique",

  // ---- Team page — members without a profile (v108)
  "team.noProfile": "(profil introuvable)",

  // ---- Failed-payment notice (v109)
  "notifications.msg.paymentFailed.title": "Votre paiement n’a pas abouti",
  "notifications.msg.paymentFailed.body":
    "Nous n’avons pas pu renouveler votre offre {plan}. Mettez à jour votre carte pour la conserver.",

  // ---- Refund notice (v111)
  "notifications.msg.paymentRefunded.title": "Votre remboursement a été effectué",
  "notifications.msg.paymentRefunded.body":
    "Nous avons effectué un remboursement de votre paiement pour l’offre {plan}. Il peut falloir quelques jours pour qu’il apparaisse sur votre compte. Un remboursement ne modifie pas votre offre ; pour arrêter les renouvellements, résiliez depuis Offre et facturation.",
  "notifications.msg.paymentRefunded.bodyNoPlan":
    "Nous avons effectué un remboursement de votre paiement. Il peut falloir quelques jours pour qu’il apparaisse sur votre compte. Un remboursement ne modifie pas votre offre ; pour arrêter les renouvellements, résiliez depuis Offre et facturation.",

  // ---- Hand over ownership of the organisation (v105)
  "settings.org.transfer.title": "Transférer la propriété",
  "settings.org.transfer.intro":
    "Confiez votre organisation à une autre personne qui en fait partie. Elle en devient propriétaire et reprend son offre et son équipe ; vous restez administrateur jusqu’à ce qu’elle vous retire.",
  "settings.org.transfer.selectLabel": "Nouveau propriétaire",
  "settings.org.transfer.selectPlaceholder": "Choisissez une personne",
  "settings.org.transfer.start": "Transférer la propriété…",
  "settings.org.transfer.confirm":
    "Faire de {email} le propriétaire de votre organisation ? Cette personne en contrôlera l’offre, l’équipe et tout ce qui y est enregistré. Vous restez administrateur, mais elle peut vous retirer, et elle seule peut vous la rendre.",
  "settings.org.transfer.yes": "Oui, la transférer",
  "settings.org.transfer.done":
    "{email} est maintenant propriétaire de votre organisation. Vous en êtes administrateur.",
  "errors.orgTransferOwnerOnly": "Seul le propriétaire de l’organisation peut la transférer.",
  "errors.orgTransferNotMember":
    "Cette personne ne fait pas partie de votre organisation ; elle ne peut pas en devenir propriétaire.",
  "errors.orgTransferPaidPlan":
    "Votre organisation a l’offre {plan}, qui appartient à son propriétaire et ne peut pas encore être transmise à quelqu’un d’autre. Vous pourrez la transférer une fois l’offre terminée.",
  "errors.orgTransferFailed":
    "Impossible de transférer votre organisation. Rien n’a été modifié. Veuillez réessayer.",

  // ---- Ownership-received notice (v105)
  "notifications.msg.ownershipReceived.title":
    "{who} a fait de vous le propriétaire de {organisation}",
  "notifications.msg.ownershipReceived.body":
    "Vous gérez désormais son offre et son équipe. Ouvrez Paramètres pour voir les personnes qui en font partie.",

  // ---- Landing page (v106)
  "landing.tagline": "L’intelligence environnementale en temps réel, expliquée simplement.",
  "landing.explore": "Explorer la planète",
  "landing.signIn": "Se connecter",
  "landing.appsPrompt": "Vous préférez une application ?",
  "landing.appsLink": "Obtenir l’application pour ordinateur ou Android",

  // ---- Sign-in, forgot-password and reset-password pages (v106)
  "auth.signIn.title": "Se connecter",
  "auth.signUp.title": "Créez votre compte",
  "auth.accountDeleted": "Votre compte a été supprimé.",
  "auth.resetSuccess": "Votre mot de passe a été mis à jour. Veuillez vous connecter.",
  "auth.inAppNote":
    "Dans cette application, connectez-vous avec votre adresse e-mail et votre mot de passe. Si vous vous connectez habituellement avec Google, utilisez « Mot de passe oublié ? » pour choisir d’abord un mot de passe.",
  "auth.google": "Continuer avec Google",
  "auth.or": "ou",
  "auth.email": "Adresse e-mail",
  "auth.password": "Mot de passe",
  "auth.forgotLink": "Mot de passe oublié ?",
  "auth.remember": "Se souvenir de moi sur cet appareil",
  "auth.signInButton": "Se connecter",
  "auth.signUpButton": "Créer un compte",
  "auth.haveAccount": "Vous avez déjà un compte ?",
  "auth.newHere": "Nouveau ici ?",
  "auth.createLink": "Créer un compte",
  "auth.callback.missingToken":
    "Ce lien de connexion semble incomplet. Veuillez en demander un nouveau.",
  "auth.callback.verificationFailed":
    "Ce lien de connexion a expiré ou a déjà été utilisé. Veuillez en demander un nouveau.",
  "auth.callback.oauthFailed": "La connexion avec Google n’a pas abouti. Veuillez réessayer.",
  "auth.callback.oauthNotConfigured":
    "La connexion avec Google n’est pas encore configurée sur ce site. Utilisez l’adresse e-mail pour le moment.",
  "auth.callback.generic":
    "Une erreur s’est produite. Veuillez demander un nouveau lien de connexion.",
  "auth.forgot.title": "Réinitialisez votre mot de passe",
  "auth.forgot.sent":
    "Consultez votre messagerie : si un compte existe pour {email}, nous avons envoyé un lien pour réinitialiser votre mot de passe.",
  "auth.forgot.intro":
    "Saisissez l’adresse e-mail de votre compte et nous vous enverrons un lien pour définir un nouveau mot de passe.",
  "auth.forgot.send": "Envoyer le lien",
  "auth.backToSignIn": "Retour à la connexion",
  "auth.reset.title": "Définissez un nouveau mot de passe",
  "auth.reset.newPassword": "Nouveau mot de passe",
  "auth.reset.confirm": "Confirmez le nouveau mot de passe",
  "auth.reset.submit": "Mettre à jour le mot de passe",
  "auth.reset.requestNew": "Demander un nouveau lien",
  "auth.strength.veryWeak": "Très faible",
  "auth.strength.weak": "Faible",
  "auth.strength.fair": "Moyen",
  "auth.strength.strong": "Fort",
  "auth.strength.veryStrong": "Très fort",
  "auth.strength.aria": "Solidité du mot de passe : {label}",
  "auth.err.invalidEmail": "Saisissez une adresse e-mail valide.",
  "auth.err.sendLink": "Une erreur s’est produite lors de l’envoi du lien. Veuillez réessayer.",
  "auth.err.shortPassword": "Le mot de passe doit contenir au moins 8 caractères.",
  "auth.err.breached":
    "Ce mot de passe a déjà été exposé dans une fuite de données connue. Veuillez en choisir un autre.",
  "auth.err.signUpFailed":
    "Impossible de créer votre compte. Vous devez peut-être d’abord confirmer votre adresse e-mail ; sinon, réessayez.",
  "auth.err.enterBoth": "Saisissez votre adresse e-mail et votre mot de passe.",
  "auth.err.lockedIp":
    "Trop de tentatives échouées depuis ce réseau. Veuillez réessayer dans quelques minutes.",
  "auth.err.locked": "Trop de tentatives échouées. Veuillez réessayer dans quelques minutes.",
  "auth.err.invalid": "Adresse e-mail ou mot de passe incorrect.",
  "auth.err.resetRateLimited":
    "Trop de demandes de réinitialisation pour cette adresse e-mail. Veuillez réessayer dans quelques minutes.",
  "auth.err.resetExpired":
    "Votre lien de réinitialisation a expiré. Veuillez en demander un nouveau.",
  "auth.err.updateFailed": "Impossible de mettre à jour votre mot de passe. Veuillez réessayer.",
  "auth.err.mismatch": "Les mots de passe ne correspondent pas.",

  // ---- public Explorer and the Globe
  "explore.title": "Explorez votre planète",
  "explore.intro":
    "Recherchez n’importe quel lieu sur Terre pour obtenir un aperçu réel et honnête de ses conditions actuelles, sans compte nécessaire.",
  "explore.placeLabel": "Nom du lieu",
  "explore.placePlaceholder": "Essayez une ville, un village ou une région…",
  "explore.submit": "Explorer",
  "explore.searching": "Recherche…",
  "explore.empty.title": "Aucun lieu exploré pour l’instant",
  "explore.empty.body":
    "Recherchez un lieu ci-dessus pour découvrir quelque chose de vrai à son sujet.",
  "explore.aiPanel.emptyTitle": "Rien à interpréter pour l’instant",
  "explore.aiPanel.emptyBody":
    "Recherchez un lieu pour voir une analyse générée par l’IA à son sujet.",
  "explore.err.enterPlace": "Saisissez le nom d’un lieu à explorer.",
  "explore.err.lookupFailed":
    "Impossible de rechercher ce lieu pour le moment. Veuillez réessayer.",
  "explore.err.invalidLink":
    "Ce lien de lieu n’est pas valide. Essayez de le rechercher à nouveau.",
  "explore.err.dataFailed":
    "Ce lieu a été trouvé, mais ses données environnementales n’ont pas pu être récupérées pour le moment. Veuillez réessayer dans un instant.",
  "globe.title": "Le globe",
  "globe.summary":
    "{count, plural, one {# lieu} other {# lieux}} dans tous les espaces de travail auxquels vous avez accès : champs agricoles, biens assurés et lieux surveillés. Le détail des dangers et des statuts se trouve dans chaque espace de travail ; ceci est une vue d’ensemble, pas un remplacement.",
  "globe.loading": "Chargement du globe…",
  "globe.empty.title": "Aucun lieu à afficher",
  "globe.empty.body":
    "Rien de ce à quoi vous avez accès dans Agriculture, Assurance ou Gouvernement et ONG n’a encore de lieu.",
  "globe.fireDetection": "Détection d’incendie (confiance : {confidence})",

  // ---- browser-tab title
  "welcome.pageTitle": "Bienvenue",

  // ---- Globe: instant map and live hazard layers
  "globe.live.loading": "Chargement des couches en direct (inondations et abris)…",
  "globe.live.count":
    "{count, plural, one {# point en direct d’inondation ou d’abri} other {# points en direct d’inondations et d’abris}} issus de sources publiques.",
  "globe.live.none": "Aucun point en direct d’inondation ou d’abri à afficher pour le moment.",
  "globe.live.partial":
    "Certaines couches en direct n’ont pas pu être chargées pour le moment ; l’affichage peut être incomplet.",
  "globe.live.failed":
    "Les couches de dangers en direct n’ont pas pu être chargées pour le moment. Vos propres lieux sont affichés.",
  "globe.preview.loading3d":
    "Chargement du globe 3D… la carte à plat est déjà active. Sélectionnez un point pour l’ouvrir.",
  "globe.preview.no3d":
    "Le globe 3D ne fonctionne pas dans ce navigateur ; la carte à plat est affichée à la place. Chaque point ouvre la même page.",

  // ---- Globe: worldwide fire detections, public cameras and the details panel
  "globe.watch.loading":
    "Chargement des détections d’incendie par satellite et des caméras publiques du monde entier…",
  "globe.watch.summary":
    "{fires, plural, one {# zone de détection de chaleur par satellite affichée} other {# zones de détection de chaleur par satellite affichées}} et {cameras, plural, one {# caméra publique affichée} other {# caméras publiques affichées}}. Sélectionnez un point pour l’ouvrir.",
  "globe.watch.capped": "Affichage des {shown} zones les plus intenses sur {total} dans le monde.",
  "globe.watch.none":
    "Aucune détection d’incendie par satellite ni caméra publique à afficher pour le moment.",
  "globe.watch.firesNotConfigured":
    "Les détections d’incendie par satellite ne sont pas encore activées dans cette application.",
  "globe.watch.partial":
    "Certaines sources d’incendies ou de caméras n’ont pas pu être chargées pour le moment ; l’affichage peut être incomplet.",
  "globe.watch.failed":
    "Les détections d’incendie et les caméras n’ont pas pu être chargées pour le moment.",
  "globe.legend.fire": "Détection de chaleur par satellite",
  "globe.legend.camera": "Caméra publique",
  "globe.marker.fire": "Détection de chaleur par satellite à {latitude}, {longitude}",
  "globe.marker.camera": "Caméra publique : {name}",
  "globe.panel.label": "Détails",
  "globe.panel.close": "Fermer",
  "globe.panel.back": "Retour à la détection de chaleur",
  "globe.panel.fire.title": "Détection de chaleur par satellite",
  "globe.panel.fire.what":
    "Un satellite a repéré ici un point anormalement chaud. Ce peut être un feu de forêt, mais aussi un brûlage agricole, une torchère de gaz ou une usine. Ce n’est pas un incendie confirmé.",
  "globe.panel.fire.detections":
    "{count, plural, one {# détection} other {# détections}} dans cette zone",
  "globe.panel.fire.power": "Puissance thermique maximale : {frp} MW",
  "globe.panel.fire.confidenceHigh": "Confiance du satellite : élevée",
  "globe.panel.fire.confidenceNominal": "Confiance du satellite : moyenne",
  "globe.panel.fire.latest": "Dernier passage du satellite : {when}",
  "globe.panel.fire.position": "Position : {latitude}, {longitude}",
  "globe.panel.cameras.title": "Caméras publiques à proximité",
  "globe.panel.cameras.none":
    "Aucune caméra publique des sources de cette application n’est à moins de 25 km. Les caméras n’existent qu’en Californie, en Nouvelle-Galles du Sud, en Colombie-Britannique, à Londres, en Finlande et à Singapour.",
  "globe.panel.cameras.unavailable":
    "Les images des caméras n’ont pas pu être chargées pour le moment ; les caméras proches ne sont donc pas listées.",
  "globe.panel.camera.title": "Caméra publique",
  "globe.panel.camera.distance": "À {distance} km de la détection, direction {direction}",
  "globe.panel.camera.source": "Image fournie par {provider}",
  "globe.panel.camera.licence": "Licence : {licence}",
  "globe.panel.camera.refresh":
    "{minutes, plural, one {Mise à jour environ toutes les # minute} other {Mise à jour environ toutes les # minutes}}",
  "globe.panel.camera.stillNote":
    "Il s’agit d’une image fixe qui peut dater de plusieurs minutes, et non d’une vidéo en direct ; elle peut ne pas montrer l’incendie.",
  "globe.panel.camera.unavailable":
    "Cette image n’a pas pu être chargée. La caméra est peut-être hors ligne.",
  "globe.panel.camera.alt": "Dernière image de la caméra {name}",
  "globe.panel.camera.stillBadge": "Image fixe, pas de vidéo en direct",
  "globe.panel.camera.autoRefresh":
    "{minutes, plural, one {Tant que ce panneau est ouvert, l’image se recharge toute seule environ chaque minute.} other {Tant que ce panneau est ouvert, l’image se recharge toute seule environ toutes les # minutes.}}",
  "globe.panel.camera.reload": "Recharger l’image",
  "globe.panel.camera.takenAt": "Image prise à {time} (votre heure).",
  "globe.panel.camera.openForLatest": "Ouvrez pour voir l’image la plus récente",
  "globe.panel.camera.loadedAt":
    "Chargée à {time} (votre heure). L’horloge incrustée dans l’image indique l’heure locale de la caméra, qui peut différer.",
  "globe.panel.look.title": "Voir le lieu",
  "globe.panel.look.satellite": "Vue satellite dans Google Maps",
  "globe.panel.look.street": "Street View dans Google Maps",
  "globe.panel.look.note":
    "Ouvre Google Maps dans un nouvel onglet. Ses images satellite et Street View sont des photos enregistrées à des dates antérieures, pas de la vidéo en direct. Elles montrent à quoi ressemble le lieu, pas s’il brûle en ce moment.",
  "globe.panel.emergency.title": "Vous voyez un vrai incendie ?",
  "globe.panel.emergency.callSpecific": "Appelez les pompiers : {number}",
  "globe.panel.emergency.callGeneral": "Appelez les secours : {number}",
  "globe.panel.emergency.advice":
    "N’appelez que si vous pensez qu’il y a un incendie réel et en cours. Un point satellite ou une image de caméra seuls peuvent être erronés ou dépassés. Indiquez à l’opérateur où cela se passe et ce que vous voyez. Cette application n’est pas une alerte officielle et ne remplace pas les services d’urgence.",
  "globe.panel.emergency.general":
    "Le 112 fonctionne sur la plupart des téléphones mobiles dans la plupart des pays. Si vous connaissez le numéro d’urgence local, utilisez-le plutôt.",
  "globe.compass.n": "nord",
  "globe.compass.ne": "nord-est",
  "globe.compass.e": "est",
  "globe.compass.se": "sud-est",
  "globe.compass.s": "sud",
  "globe.compass.sw": "sud-ouest",
  "globe.compass.w": "ouest",
  "globe.compass.nw": "nord-ouest",
};
