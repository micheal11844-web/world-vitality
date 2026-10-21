import type { Messages } from "./en.js";

/**
 * Spanish (neutral, "tú"). AI-drafted; NOT yet reviewed by a native
 * speaker — `LOCALES` marks it `draft` and the language picker says so.
 */
export const es: Messages = {
  // ---- common
  "common.continue": "Continuar",
  "common.back": "Atrás",
  "common.cancel": "Cancelar",
  "common.skipForNow": "Omitir por ahora",
  "common.change": "Cambiar",
  "common.saved": "Guardado.",
  "common.signInAgain": "Inicia sesión de nuevo para continuar.",
  "common.genericError": "Algo salió mal. Inténtalo de nuevo.",
  "common.nothingHere": "No hay nada aquí.",
  "common.listSeparator": ", ",

  // ---- app chrome
  "chrome.viewGlobe": "Ver el globo",
  "chrome.settings": "Ajustes",
  "chrome.signOut": "Cerrar sesión",
  "chrome.sidebar.primary": "Principal",
  "chrome.sidebar.expand": "Expandir la barra lateral (Ctrl+B)",
  "chrome.sidebar.collapse": "Contraer la barra lateral (Ctrl+B)",
  "chrome.sidebar.expandItem": "Expandir {item}",
  "chrome.sidebar.collapseItem": "Contraer {item}",
  "chrome.aiPanel.open": "Abrir el panel de IA",
  "chrome.aiPanel.collapse": "Contraer el panel de IA",
  "chrome.aiPanel.region": "Asistente de IA",
  "chrome.aiPanel.title": "Asistente",
  "chrome.search.label": "Buscar en World Vitality",
  "chrome.search.placeholder": "Busca lugares, temas…",
  "chrome.search.hint": "Buscar (pulsa / para enfocar)",
  "chrome.search.suggestions": "Sugerencias de búsqueda",
  "chrome.search.noQuickMatches": "Sin coincidencias rápidas: pulsa Intro para buscar «{query}»",
  "chrome.search.pressEnter": "Pulsa Intro para ver todos los resultados de «{query}»",
  "chrome.search.kind.workspace": "Espacio de trabajo",
  "chrome.search.kind.page": "Página",
  "chrome.search.kind.setting": "Ajuste",
  "chrome.search.kind.tool": "Herramienta",
  "chrome.search.kind.place": "Lugar",
  "chrome.bell.label": "Notificaciones",
  "chrome.bell.unread": "{count, plural, one {# sin leer} other {# sin leer}}",
  "chrome.bell.critical": "{count, plural, one {# crítica} other {# críticas}}",

  // ---- navigation
  "nav.workspaces": "Espacios de trabajo",
  "nav.account": "Cuenta",
  "nav.home": "Inicio",
  "nav.notifications": "Notificaciones",
  "nav.settings": "Ajustes",
  "nav.map": "Mapa",
  "nav.team": "Equipo",
  "nav.fieldOverview": "Resumen de campos",
  "nav.fieldReport": "Informe de campo",
  "nav.currentConditions": "Condiciones actuales",
  "nav.siteRisk": "Riesgo del sitio",
  "nav.generationOutlook": "Previsión de generación",
  "nav.datasetExplorer": "Explorador de datos",
  "nav.routeRisk": "Riesgo de la ruta",
  "nav.activeAlerts": "Alertas activas",
  "nav.jurisdictionOverview": "Resumen de la jurisdicción",
  "nav.formalReport": "Informe formal",
  "nav.underwritingRiskContext": "Contexto de riesgo para suscripción",
  "nav.auditableReport": "Informe auditable",
  "nav.explainThisData": "Explicar estos datos",
  "nav.lessonPlan": "Plan de clase",

  // ---- workspaces
  "workspace.agriculture.name": "Agricultura",
  "workspace.agriculture.description": "Humedad del suelo, clima y condiciones de los campos.",
  "workspace.weather.name": "Tiempo y clima",
  "workspace.weather.description":
    "Condiciones actuales y estado de la temperatura en tus ubicaciones.",
  "workspace.construction.name": "Construcción",
  "workspace.construction.description":
    "Estado del riesgo del sitio para actividades sensibles al clima.",
  "workspace.renewable-energy.name": "Energía renovable",
  "workspace.renewable-energy.description":
    "Previsión de generación eólica para tus instalaciones.",
  "workspace.research.name": "Investigación",
  "workspace.research.description":
    "Explora datos ambientales en bruto con su procedencia completa.",
  "workspace.logistics.name": "Logística y transporte",
  "workspace.logistics.description": "Estado del riesgo de la ruta para envíos sensibles al clima.",
  "workspace.disaster-monitoring.name": "Monitoreo de desastres",
  "workspace.disaster-monitoring.description":
    "Alertas oficiales en vivo del Servicio Meteorológico Nacional de EE. UU. (solo EE. UU.).",
  "workspace.government-ngos.name": "Gobierno y ONG",
  "workspace.government-ngos.description": "Resumen multidominio de la jurisdicción e informes.",
  "workspace.insurance.name": "Seguros",
  "workspace.insurance.description": "Contexto de riesgo para suscripción e informes auditables.",
  "workspace.education.name": "Educación",
  "workspace.education.description":
    "Explicaciones de datos por nivel escolar y planes de clase de ejemplo para docentes.",

  // ---- roles
  "role.admin_owner": "Propietario / administrador",
  "role.operational_user": "Usuario operativo",
  "role.scoped_field_user": "Usuario de campo (acotado)",
  "role.viewer_external": "Observador",

  // ---- personas
  "persona.farmer.label": "Agricultor/a",
  "persona.farmer.description": "Cultivo o cuido la tierra.",
  "persona.builder.label": "Constructor/a",
  "persona.builder.description": "Planifico o dirijo obras de construcción.",
  "persona.energy.label": "Energía",
  "persona.energy.description": "Trabajo con energía eólica o solar.",
  "persona.shipping.label": "Transporte",
  "persona.shipping.description": "Muevo mercancías por carretera, mar o aire.",
  "persona.responder.label": "Respuesta a emergencias",
  "persona.responder.description": "Vigilo inundaciones, incendios y otros peligros.",
  "persona.public-sector.label": "Gobierno u ONG",
  "persona.public-sector.description": "Sirvo a una comunidad, una región o un programa.",
  "persona.insurer.label": "Aseguradora",
  "persona.insurer.description": "Evalúo o tarifico el riesgo ambiental.",
  "persona.researcher.label": "Investigador/a",
  "persona.researcher.description": "Analizo datos ambientales.",
  "persona.learner.label": "Estudiante o docente",
  "persona.learner.description": "Aprendo o enseño con datos reales.",
  "persona.weather.label": "Aficionado al tiempo",
  "persona.weather.description": "Sigo el tiempo y el clima.",
  "persona.curious.label": "Solo curiosidad",
  "persona.curious.description": "Quiero echar un vistazo al planeta.",

  // ---- dashboard
  "dashboard.yourPlace": "Tu lugar",
  "dashboard.yourWorkspaces": "Tus espacios de trabajo",
  "dashboard.changeRoleOrPlace": "Cambiar tu rol o tu lugar",
  "dashboard.addPlacePrompt": "Añade tu lugar para ver aquí mismo sus condiciones en vivo.",
  "dashboard.setItUp": "Configurarlo",
  "dashboard.recommended": "Recomendado para ti",
  "dashboard.insightGaps":
    "{count, plural, one {# día no tuvo datos disponibles.} other {# días no tuvieron datos disponibles.}}",
  "dashboard.insightFailed":
    "Ahora mismo no pudimos cargar las condiciones en vivo de tu lugar. Volverán en tu próxima visita.",
  "dashboard.tutorial.welcomeTitle": "Hola, soy Orbi",
  "dashboard.tutorial.welcomeBody":
    "Estaré por aquí para ayudarte a orientarte. Echemos un vistazo rápido.",
  "dashboard.tutorial.workspacesTitle": "Tus espacios de trabajo",
  "dashboard.tutorial.workspacesBody":
    "Cada tarjeta de abajo es un espacio de trabajo: un conjunto de datos y herramientas para un ámbito, como Agricultura. Haz clic en uno para entrar.",
  "dashboard.tutorial.aiTitle": "El panel de IA",
  "dashboard.tutorial.aiBody":
    "Dentro de cualquier espacio de trabajo, abre el panel de IA para hacer preguntas sobre sus datos. Siempre te dice con cuánta seguridad responde, nunca una suposición disfrazada de hecho.",
  "dashboard.critical.label": "Crítica",
  "dashboard.critical.region": "Alerta crítica",
  "dashboard.critical.openFull": "Abre Notificaciones para ver el texto completo",
  "dashboard.critical.openMore":
    "Abre Notificaciones: {count, plural, one {# crítica más} other {# críticas más}}",

  // ---- welcome
  "welcome.step": "Paso {current} de {total}",
  "welcome.role.title": "¿Con qué rol estás aquí?",
  "welcome.role.intro":
    "Soy Orbi. Elige el que mejor te describa y te llevaré al lugar adecuado; puedes cambiarlo cuando quieras en Ajustes.",
  "welcome.role.legend": "Tu rol",
  "welcome.place.title": "¿Qué lugar te importa más?",
  "welcome.place.intro":
    "Te mostraré sus condiciones reales enseguida. Es lo único que te pido y se queda en tu cuenta: puedes cambiarlo o quitarlo en Ajustes.",
  "welcome.place.inputLabel": "Pueblo, ciudad o región",
  "welcome.place.inputPlaceholder": "p. ej., Ibadán",
  "welcome.place.search": "Buscar",
  "welcome.place.choose": "Elige el correcto",
  "welcome.place.current": "Actualmente: {place}. Busca arriba para cambiarlo.",
  "welcome.place.showMe": "Mostrármelo",
  "welcome.place.skipPlace": "Omitir el lugar",
  "welcome.insight.title": "{place}, ahora mismo",
  "welcome.insight.titleFallback": "Tu lugar, ahora mismo",
  "welcome.insight.fetching": "Obteniendo datos en vivo…",
  "welcome.insight.failed": "Ahora mismo no se pudieron cargar los datos en vivo.",
  "welcome.insight.takeMeTo": "Llévame a {destination}",
  "welcome.insight.takeMeToExplorer": "Llévame al Explorador",

  // ---- notifications
  "notifications.title": "Notificaciones",
  "notifications.markAllRead": "Marcar todo como leído",
  "notifications.preferences": "Preferencias",
  "notifications.markRead": "Marcar como leída",
  "notifications.dismiss": "Descartar",
  "notifications.view": "Ver",
  "notifications.checkAgain": "Comprobar de nuevo",
  "notifications.setHomePlace": "Establece tu lugar de inicio",
  "notifications.fullOfficialText": "Texto oficial completo",
  "notifications.unread": "Sin leer",
  "notifications.inboxEmpty": "Tu bandeja está vacía.",
  "notifications.loadFailed":
    "Ahora mismo no pudimos cargar tus notificaciones. Actualiza la página para volver a intentarlo.",
  "notifications.tier.critical": "Críticas",
  "notifications.tier.alert": "Alertas",
  "notifications.tier.info": "Informativas",
  "notifications.tag.critical": "Crítica",
  "notifications.tag.alert": "Alerta",
  "notifications.tag.info": "Info",
  "notifications.status.noPlace":
    "Las alertas meteorológicas oficiales se muestran para tu lugar de inicio, y todavía no has establecido uno.",
  "notifications.status.outOfCoverage":
    "Las alertas oficiales de aquí provienen del Servicio Meteorológico Nacional de EE. UU., que cubre EE. UU. y sus territorios. {place} queda fuera de esa zona, así que no se muestra ninguna; eso no significa que allí no esté pasando nada.",
  "notifications.status.lastChecked": "Última comprobación: {ago}.",
  "notifications.status.showing":
    "Se muestran alertas oficiales del Servicio Meteorológico Nacional para {place}.",
  "notifications.status.none":
    "No se muestra ninguna alerta oficial del Servicio Meteorológico Nacional para {place}.",
  "notifications.status.failed":
    "Ahora mismo no pudimos conectar con el Servicio Meteorológico Nacional, así que puede haber alertas oficiales que no se muestran aquí. Para cualquier asunto urgente, usa tus fuentes oficiales locales.",
  "notifications.status.failedPlace":
    "Ahora mismo no pudimos conectar con el Servicio Meteorológico Nacional, así que puede haber alertas oficiales para {place} que no se muestran aquí. Para cualquier asunto urgente, usa tus fuentes oficiales locales.",
  "notifications.status.lastSuccess": "Última comprobación correcta: {ago}.",
  "notifications.officialEnglishNote":
    "El texto de las alertas oficiales se muestra exactamente como lo emitió el Servicio Meteorológico Nacional, en inglés: no se traduce, para que nada en un mensaje de emergencia pueda alterarse.",
  "notifications.footnote":
    "World Vitality muestra las alertas oficiales solo mientras lo tienes abierto; todavía no envía notificaciones push, SMS ni correos electrónicos. En una emergencia, sigue las indicaciones de las autoridades locales.",
  "notifications.msg.someone": "Alguien",
  "notifications.msg.fieldComment.title": "{who} comentó en {field}",
  "notifications.msg.memberAdded.title": "Ahora tienes acceso a {workspace}",
  "notifications.msg.memberAdded.body": "Tu rol allí: {role}.",

  // ---- settings
  "settings.title": "Ajustes",
  "settings.profile.title": "Perfil",
  "settings.profile.email": "Correo electrónico",
  "settings.profile.displayName": "Nombre para mostrar",
  "settings.profile.displayNameHelp": "Se muestra a tus compañeros en tus espacios de trabajo.",
  "settings.profile.save": "Guardar nombre",
  "settings.profile.memberSince": "Miembro desde el {date}.",
  "settings.roleAndPlace.title": "Tu rol y tu lugar",
  "settings.roleAndPlace.notSetUp":
    "Todavía no lo has configurado. Cuéntame quién eres y qué lugar te importa, y mostraré sus condiciones en vivo en tu panel y en tus espacios de trabajo.",
  "settings.roleAndPlace.role": "Rol:",
  "settings.roleAndPlace.homePlace": "Lugar de inicio:",
  "settings.roleAndPlace.notSet": "sin establecer",
  "settings.roleAndPlace.removed": "eliminado",
  "settings.roleAndPlace.setUp": "Configurar",
  "settings.roleAndPlace.remove": "Quitar mi lugar",
  "settings.language.title": "Idioma",
  "settings.language.label": "Idioma de los menús y los mensajes",
  "settings.language.draftNote":
    "Los idiomas distintos del inglés los redacta una IA y todavía no los ha revisado un hablante nativo; si algo suena mal, el inglés siempre está disponible.",
  "settings.language.scopeNote":
    "Por ahora, las páginas de los espacios de trabajo, las explicaciones de los datos y las alertas oficiales siguen en inglés.",
  "settings.language.draftTag": "borrador",
  "settings.language.saved": "Idioma actualizado.",
  "settings.language.failed": "No se pudo cambiar el idioma. Inténtalo de nuevo.",
  "settings.notifications.title": "Notificaciones",
  "settings.notifications.loadFailed":
    "Ahora mismo no pudimos cargar tus ajustes de notificaciones. Actualiza la página para volver a intentarlo.",
  "settings.notifications.officialLegend":
    "Alertas meteorológicas oficiales para tu lugar de inicio",
  "settings.notifications.showAll": "Mostrarlas todas, incluidos avisos y comunicados menores",
  "settings.notifications.alertsOnly": "Solo las alertas y las críticas; omitir avisos menores",
  "settings.notifications.criticalAlways":
    "Las alertas críticas, que ponen vidas en riesgo, siempre se muestran y no se pueden desactivar.",
  "settings.notifications.collaboration":
    "Avisarme cuando un compañero comente en un campo que creé",
  "settings.notifications.inAppNote":
    "Las notificaciones aparecen solo en la aplicación: World Vitality todavía no envía push, SMS ni correos electrónicos, y busca alertas oficiales solo mientras está abierto. Consulta tu",
  "settings.notifications.center": "Centro de notificaciones",
  "settings.notifications.save": "Guardar ajustes de notificaciones",
  "settings.notifications.saveFailed":
    "No se pudieron guardar tus ajustes de notificaciones. Inténtalo de nuevo.",
  "settings.workspaces.title": "Tus espacios de trabajo",
  "settings.workspaces.none": "Todavía no eres miembro de ningún espacio de trabajo.",
  "settings.workspaces.limited": "(limitado a elementos concretos)",
  "settings.download.title": "Descarga tus datos",
  "settings.download.body":
    "Con un clic y sin esperas: un archivo JSON con tu perfil, tu rol y tu lugar de inicio, tus ajustes de notificaciones y tu bandeja, tus membresías en espacios de trabajo, todo lo que creaste (campos, propiedades, ubicaciones) y los comentarios que escribiste. No incluye datos de otras personas ni lecturas ambientales públicas, y el archivo lo indica.",
  "settings.download.button": "Descargar mis datos",
  "settings.delete.title": "Eliminar tu cuenta",
  "settings.delete.body":
    "Esto elimina de forma permanente y al instante tu cuenta, tus membresías, tus notificaciones y los comentarios que escribiste. Los campos, propiedades y ubicaciones que añadiste pertenecen al espacio de trabajo, así que se quedan, sin tu nombre. No se puede deshacer; descarga tus datos antes si quieres una copia.",
  "settings.delete.confirmLabel": "Escribe {word} para confirmar",
  "settings.delete.button": "Eliminar mi cuenta",

  // ---- search
  "search.title": "Búsqueda",
  "search.resultsFor": "Resultados para «{query}»",
  "search.empty.title": "Busca lo que quieras",
  "search.empty.description":
    "Prueba con un lugar, un tema o una página, por ejemplo: {examples}. Pulsa / en cualquier momento para ir al cuadro de búsqueda.",
  "search.question.title": "No puedo responder esa pregunta directamente",
  "search.question.body":
    "La búsqueda encuentra espacios de trabajo, páginas y lugares. No tengo una fuente fiable para preguntas abiertas, así que no voy a adivinar. Aquí tienes dónde están las partes de tu pregunta.",
  "search.question.bodyWithPlace":
    "La búsqueda encuentra espacios de trabajo, páginas y lugares. No tengo una fuente fiable para preguntas abiertas, así que no voy a adivinar. Aquí tienes dónde están las partes de tu pregunta, incluido «{place}».",
  "search.workspacesAndPages": "Espacios de trabajo y páginas",
  "search.placesMatching": "Lugares que coinciden con «{place}»",
  "search.places": "Lugares",
  "search.nothingMatched": "Nada coincide con «{query}»",
  "search.nothingMatchedHelp":
    "Prueba con el nombre de un lugar, un tema como inundación o solar, o una página como equipo o ajustes.",
  "search.placesFailed":
    "La búsqueda de lugares no está disponible ahora mismo, así que solo se muestran espacios de trabajo y páginas. Inténtalo de nuevo en un momento.",
  "search.signedOutNote":
    "Los espacios de trabajo requieren una cuenta. Los lugares se abren en el Explorador público sin cuenta.",
  "search.signIn": "Inicia sesión para abrir los espacios de trabajo",

  // ---- search index (page names the search box finds)
  "searchIndex.dashboard.label": "Panel de inicio",
  "searchIndex.dashboard.description": "Tus espacios de trabajo en un solo lugar",
  "searchIndex.explorer.label": "Explorador público",
  "searchIndex.explorer.description": "Consulta cualquier lugar del mundo, sin necesidad de cuenta",
  "searchIndex.globe.label": "El globo",
  "searchIndex.globe.description": "Una vista 3D del planeta",
  "searchIndex.notifications.label": "Notificaciones",
  "searchIndex.notifications.description":
    "Alertas de tu lugar de inicio y actividad en tus espacios de trabajo",
  "searchIndex.notificationPrefs.label": "Preferencias de notificaciones",
  "searchIndex.notificationPrefs.description": "Elige qué alertas y actividad ves",
  "searchIndex.settings.label": "Ajustes",
  "searchIndex.settings.description": "Tu perfil y tu cuenta",
  "searchIndex.export.label": "Descargar mis datos",
  "searchIndex.export.description": "Exporta con un clic todo lo vinculado a tu cuenta",
  "searchIndex.delete.label": "Eliminar mi cuenta",
  "searchIndex.delete.description": "Elimina tu cuenta de forma permanente",

  // ---- assistant panel empty state
  "chrome.aiPanel.emptyTitle": "Ninguna conversación activa",
  "chrome.aiPanel.emptyBody": "Abre un espacio de trabajo para preguntar sobre sus datos.",

  // ---- errors shown by form actions (these are produced on the server)
  "errors.typeTwoLetters": "Escribe al menos dos letras de un pueblo, ciudad o región.",
  "errors.noPlaceFound":
    "No se encontró ningún lugar que coincida con «{query}». Prueba con otra ortografía o con una ciudad cercana.",
  "errors.placeLookupFailed": "Ahora mismo no se pudo buscar lugares. Inténtalo de nuevo.",
  "errors.pickRoleAndPlace": "Primero elige quién eres y un lugar.",
  "errors.liveDataFailed":
    "Ahora mismo no pudimos obtener datos en vivo de {place}. Puedes continuar igualmente: se cargarán en tu espacio de trabajo.",
  "errors.invalidRole": "Ese rol no es una de las opciones.",
  "errors.invalidPlace": "Ese lugar no es válido. Vuelve a buscarlo.",
  "errors.saveFailed": "Ahora mismo no se pudo guardar. Inténtalo de nuevo.",
  "errors.removeFailed": "Ahora mismo no se pudo quitar. Inténtalo de nuevo.",
  "errors.weatherServiceUnreachable":
    "Ahora mismo no pudimos conectar con el servicio meteorológico. Inténtalo de nuevo.",
  "errors.nameTooLong": "Mantén tu nombre por debajo de {max} caracteres.",
  "errors.sessionExpired": "Tu sesión ha caducado. Inicia sesión de nuevo.",
  "errors.nameSaveFailed": "No se pudo guardar tu nombre. Inténtalo de nuevo.",
  "errors.typeToConfirm": "Escribe {word} para confirmar.",
  "errors.deleteFailed": "No se pudo eliminar tu cuenta. Inténtalo de nuevo.",

  // ---- search place result line
  "search.placeDescription": "Ver las condiciones actuales",

  // ---- first-use tutorial popup
  "chrome.tutorial.step": "Paso {current} de {total}",
  "chrome.tutorial.skip": "Omitir",
  "chrome.tutorial.back": "Atrás",
  "chrome.tutorial.next": "Siguiente",
  "chrome.tutorial.getStarted": "Empezar",
  // ---- phone layout: menu button and bottom bar
  "chrome.nav.menu": "Menú",
  "chrome.nav.closeMenu": "Cerrar menú",
  "chrome.nav.quickNav": "Navegación rápida",
  "chrome.nav.home": "Inicio",
  "chrome.nav.map": "Mapa",
  "chrome.nav.alerts": "Alertas",
  "chrome.nav.search": "Buscar",
  "chrome.nav.ai": "IA",

  // ---- offline use and installing the app
  "chrome.offline.offline": "No tienes conexión. Lo que ves puede estar desactualizado.",
  "chrome.offline.savedCopy":
    "Estás viendo la copia que abriste por última vez, guardada {ago}. Vuelve a conectarte y recarga para ver la información actual.",
  "chrome.offline.reload": "Recargar",
  "offline.title": "No tienes conexión",
  "offline.body":
    "World Vitality no puede acceder a internet ahora mismo. Las páginas que abriste hace poco se guardan en este dispositivo y se abren con una nota que indica cuándo se guardaron. Todo lo demás necesita conexión.",
  "offline.retry": "Intentar de nuevo",
  "offline.dashboard": "Abrir el panel",
  "offline.privacy":
    "Las páginas guardadas se quedan en este dispositivo y se eliminan al cerrar sesión.",
  "settings.install.title": "Instalar en este dispositivo",
  "settings.install.body":
    "Añade World Vitality a tu pantalla de inicio o a tu escritorio para abrirlo como una aplicación. Las páginas que abriste hace poco siguen disponibles sin conexión: se guardan solo en este dispositivo y se eliminan al cerrar sesión.",
  "settings.install.button": "Instalar la aplicación",
  "settings.install.installed": "World Vitality está instalado en este dispositivo.",
  "settings.install.hint":
    "Para instalarlo, abre el botón de compartir o el menú de tu navegador y elige “Añadir a la pantalla de inicio” o “Instalar aplicación”.",
};
