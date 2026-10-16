import type { Messages } from "./en.js";

/**
 * Portuguese (neutral wording, "você"). AI-drafted; NOT yet reviewed by
 * a native speaker — `LOCALES` marks it `draft` and the language picker
 * says so. Regional variants (pt-BR / pt-PT) both resolve here.
 */
export const pt: Messages = {
  // ---- common
  "common.continue": "Continuar",
  "common.back": "Voltar",
  "common.cancel": "Cancelar",
  "common.skipForNow": "Pular por enquanto",
  "common.change": "Alterar",
  "common.saved": "Salvo.",
  "common.signInAgain": "Entre novamente para continuar.",
  "common.genericError": "Algo deu errado. Tente novamente.",
  "common.nothingHere": "Nada aqui.",
  "common.listSeparator": ", ",

  // ---- app chrome
  "chrome.viewGlobe": "Ver o globo",
  "chrome.settings": "Configurações",
  "chrome.signOut": "Sair",
  "chrome.sidebar.primary": "Principal",
  "chrome.sidebar.expand": "Expandir a barra lateral (Ctrl+B)",
  "chrome.sidebar.collapse": "Recolher a barra lateral (Ctrl+B)",
  "chrome.sidebar.expandItem": "Expandir {item}",
  "chrome.sidebar.collapseItem": "Recolher {item}",
  "chrome.aiPanel.open": "Abrir o painel de IA",
  "chrome.aiPanel.collapse": "Recolher o painel de IA",
  "chrome.aiPanel.region": "Assistente de IA",
  "chrome.aiPanel.title": "Assistente",
  "chrome.search.label": "Pesquisar no World Vitality",
  "chrome.search.placeholder": "Pesquise lugares, temas…",
  "chrome.search.hint": "Pesquisar (pressione / para focar)",
  "chrome.search.suggestions": "Sugestões de pesquisa",
  "chrome.search.noQuickMatches":
    "Sem resultados rápidos: pressione Enter para pesquisar “{query}”",
  "chrome.search.pressEnter": "Pressione Enter para ver todos os resultados de “{query}”",
  "chrome.search.kind.workspace": "Espaço de trabalho",
  "chrome.search.kind.page": "Página",
  "chrome.search.kind.setting": "Configuração",
  "chrome.search.kind.tool": "Ferramenta",
  "chrome.search.kind.place": "Lugar",
  "chrome.bell.label": "Notificações",
  "chrome.bell.unread": "{count, plural, one {# não lida} other {# não lidas}}",
  "chrome.bell.critical": "{count, plural, one {# crítica} other {# críticas}}",

  // ---- navigation
  "nav.workspaces": "Espaços de trabalho",
  "nav.account": "Conta",
  "nav.home": "Início",
  "nav.notifications": "Notificações",
  "nav.settings": "Configurações",
  "nav.map": "Mapa",
  "nav.team": "Equipe",
  "nav.fieldOverview": "Visão geral dos campos",
  "nav.fieldReport": "Relatório do campo",
  "nav.currentConditions": "Condições atuais",
  "nav.siteRisk": "Risco do local",
  "nav.generationOutlook": "Perspectiva de geração",
  "nav.datasetExplorer": "Explorador de dados",
  "nav.routeRisk": "Risco da rota",
  "nav.activeAlerts": "Alertas ativos",
  "nav.jurisdictionOverview": "Visão geral da jurisdição",
  "nav.formalReport": "Relatório formal",
  "nav.underwritingRiskContext": "Contexto de risco para subscrição",
  "nav.auditableReport": "Relatório auditável",
  "nav.explainThisData": "Explicar estes dados",
  "nav.lessonPlan": "Plano de aula",

  // ---- workspaces
  "workspace.agriculture.name": "Agricultura",
  "workspace.agriculture.description": "Umidade do solo, clima e condições dos campos.",
  "workspace.weather.name": "Tempo e clima",
  "workspace.weather.description": "Condições atuais e situação da temperatura nos seus locais.",
  "workspace.construction.name": "Construção",
  "workspace.construction.description":
    "Situação de risco do local para atividades sensíveis ao clima.",
  "workspace.renewable-energy.name": "Energia renovável",
  "workspace.renewable-energy.description": "Perspectiva de geração eólica para os seus ativos.",
  "workspace.research.name": "Pesquisa",
  "workspace.research.description": "Explore dados ambientais brutos com toda a sua procedência.",
  "workspace.logistics.name": "Logística e transporte",
  "workspace.logistics.description": "Situação de risco da rota para cargas sensíveis ao clima.",
  "workspace.disaster-monitoring.name": "Monitoramento de desastres",
  "workspace.disaster-monitoring.description":
    "Alertas oficiais ao vivo do Serviço Meteorológico Nacional dos EUA (somente EUA).",
  "workspace.government-ngos.name": "Governo e ONGs",
  "workspace.government-ngos.description": "Visão multidomínio da jurisdição e relatórios.",
  "workspace.insurance.name": "Seguros",
  "workspace.insurance.description": "Contexto de risco para subscrição e relatórios auditáveis.",
  "workspace.education.name": "Educação",
  "workspace.education.description":
    "Explicações de dados por nível escolar e planos de aula de exemplo para educadores.",

  // ---- roles
  "role.admin_owner": "Proprietário / administrador",
  "role.operational_user": "Usuário operacional",
  "role.scoped_field_user": "Usuário de campo (restrito)",
  "role.viewer_external": "Visualizador",

  // ---- personas
  "persona.farmer.label": "Agricultor(a)",
  "persona.farmer.description": "Cultivo ou cuido da terra.",
  "persona.builder.label": "Construtor(a)",
  "persona.builder.description": "Planejo ou conduzo obras.",
  "persona.energy.label": "Energia",
  "persona.energy.description": "Trabalho com energia eólica ou solar.",
  "persona.shipping.label": "Transporte",
  "persona.shipping.description": "Movimento cargas por estrada, mar ou ar.",
  "persona.responder.label": "Resposta a emergências",
  "persona.responder.description": "Acompanho enchentes, incêndios e outros perigos.",
  "persona.public-sector.label": "Governo ou ONG",
  "persona.public-sector.description": "Atendo uma comunidade, região ou programa.",
  "persona.insurer.label": "Seguradora",
  "persona.insurer.description": "Avalio ou precifico o risco ambiental.",
  "persona.researcher.label": "Pesquisador(a)",
  "persona.researcher.description": "Analiso dados ambientais.",
  "persona.learner.label": "Estudante ou professor(a)",
  "persona.learner.description": "Aprendo ou ensino com dados reais.",
  "persona.weather.label": "Observador do tempo",
  "persona.weather.description": "Acompanho o tempo e o clima.",
  "persona.curious.label": "Só curiosidade",
  "persona.curious.description": "Quero dar uma olhada no planeta.",

  // ---- dashboard
  "dashboard.yourPlace": "Seu lugar",
  "dashboard.yourWorkspaces": "Seus espaços de trabalho",
  "dashboard.changeRoleOrPlace": "Alterar seu perfil ou lugar",
  "dashboard.addPlacePrompt": "Adicione seu lugar para ver aqui mesmo as condições ao vivo dele.",
  "dashboard.setItUp": "Configurar",
  "dashboard.recommended": "Recomendado para você",
  "dashboard.insightGaps":
    "{count, plural, one {# dia ficou sem dados disponíveis.} other {# dias ficaram sem dados disponíveis.}}",
  "dashboard.insightFailed":
    "Não foi possível carregar as condições ao vivo do seu lugar agora. Elas voltam na sua próxima visita.",
  "dashboard.tutorial.welcomeTitle": "Oi, eu sou o Orbi",
  "dashboard.tutorial.welcomeBody":
    "Vou estar por aqui para ajudar você a se orientar. Vamos dar uma olhada rápida.",
  "dashboard.tutorial.workspacesTitle": "Seus espaços de trabalho",
  "dashboard.tutorial.workspacesBody":
    "Cada cartão abaixo é um espaço de trabalho: um conjunto de dados e ferramentas para uma área, como Agricultura. Clique em um para entrar.",
  "dashboard.tutorial.aiTitle": "O painel de IA",
  "dashboard.tutorial.aiBody":
    "Dentro de qualquer espaço de trabalho, abra o painel de IA para fazer perguntas sobre os dados dele. Ele sempre diz o quanto tem de confiança — nunca um palpite disfarçado de fato.",
  "dashboard.critical.label": "Crítica",
  "dashboard.critical.region": "Alerta crítico",
  "dashboard.critical.openFull": "Abra as Notificações para ver o texto completo",
  "dashboard.critical.openMore":
    "Abra as Notificações — {count, plural, one {mais # crítica} other {mais # críticas}}",

  // ---- welcome
  "welcome.step": "Etapa {current} de {total}",
  "welcome.role.title": "Com qual perfil você está aqui?",
  "welcome.role.intro":
    "Eu sou o Orbi. Escolha o que melhor combina com você e eu levo você ao lugar certo — você pode mudar isso a qualquer momento em Configurações.",
  "welcome.role.legend": "Seu perfil",
  "welcome.place.title": "Qual lugar é mais importante para você?",
  "welcome.place.intro":
    "Vou mostrar as condições reais dele na hora. É a única coisa que peço, e ela fica na sua conta — você pode alterar ou remover em Configurações.",
  "welcome.place.inputLabel": "Vila, cidade ou região",
  "welcome.place.inputPlaceholder": "ex.: Ibadan",
  "welcome.place.search": "Pesquisar",
  "welcome.place.choose": "Escolha o correto",
  "welcome.place.current": "Atualmente: {place}. Pesquise acima para alterar.",
  "welcome.place.showMe": "Mostrar",
  "welcome.place.skipPlace": "Pular o lugar",
  "welcome.insight.title": "{place}, agora",
  "welcome.insight.titleFallback": "Seu lugar, agora",
  "welcome.insight.fetching": "Buscando dados ao vivo…",
  "welcome.insight.failed": "Não foi possível carregar os dados ao vivo agora.",
  "welcome.insight.takeMeTo": "Ir para {destination}",
  "welcome.insight.takeMeToExplorer": "Ir para o Explorador",

  // ---- notifications
  "notifications.title": "Notificações",
  "notifications.markAllRead": "Marcar tudo como lido",
  "notifications.preferences": "Preferências",
  "notifications.markRead": "Marcar como lida",
  "notifications.dismiss": "Dispensar",
  "notifications.view": "Ver",
  "notifications.checkAgain": "Verificar novamente",
  "notifications.setHomePlace": "Definir seu lugar principal",
  "notifications.fullOfficialText": "Texto oficial completo",
  "notifications.unread": "Não lida",
  "notifications.inboxEmpty": "Sua caixa de entrada está vazia.",
  "notifications.loadFailed":
    "Não foi possível carregar suas notificações agora. Atualize a página para tentar novamente.",
  "notifications.tier.critical": "Críticas",
  "notifications.tier.alert": "Alertas",
  "notifications.tier.info": "Informativas",
  "notifications.tag.critical": "Crítica",
  "notifications.tag.alert": "Alerta",
  "notifications.tag.info": "Info",
  "notifications.status.noPlace":
    "Os alertas meteorológicos oficiais são exibidos para o seu lugar principal, e você ainda não definiu um.",
  "notifications.status.outOfCoverage":
    "Os alertas oficiais daqui vêm do Serviço Meteorológico Nacional dos EUA, que cobre os EUA e seus territórios. {place} fica fora dessa área, então nenhum é exibido — isso não significa que nada esteja acontecendo lá.",
  "notifications.status.lastChecked": "Última verificação: {ago}.",
  "notifications.status.showing":
    "Exibindo alertas oficiais do Serviço Meteorológico Nacional para {place}.",
  "notifications.status.none":
    "Nenhum alerta oficial do Serviço Meteorológico Nacional está sendo exibido para {place}.",
  "notifications.status.failed":
    "Não foi possível acessar o Serviço Meteorológico Nacional agora, então pode haver alertas oficiais que não aparecem aqui. Para qualquer urgência, use suas fontes oficiais locais.",
  "notifications.status.failedPlace":
    "Não foi possível acessar o Serviço Meteorológico Nacional agora, então pode haver alertas oficiais para {place} que não aparecem aqui. Para qualquer urgência, use suas fontes oficiais locais.",
  "notifications.status.lastSuccess": "Última verificação bem-sucedida: {ago}.",
  "notifications.officialEnglishNote":
    "O texto dos alertas oficiais é exibido exatamente como o Serviço Meteorológico Nacional o emitiu, em inglês — ele não é traduzido, para que nada em uma mensagem de emergência possa ser alterado.",
  "notifications.footnote":
    "O World Vitality só mostra alertas oficiais enquanto está aberto — ele ainda não envia notificações push, SMS ou e-mail. Em emergências, siga as orientações das autoridades locais.",
  "notifications.msg.someone": "Alguém",
  "notifications.msg.fieldComment.title": "{who} comentou em {field}",
  "notifications.msg.memberAdded.title": "Você agora tem acesso a {workspace}",
  "notifications.msg.memberAdded.body": "Seu papel lá: {role}.",

  // ---- settings
  "settings.title": "Configurações",
  "settings.profile.title": "Perfil",
  "settings.profile.email": "Endereço de e-mail",
  "settings.profile.displayName": "Nome de exibição",
  "settings.profile.displayNameHelp": "Mostrado aos colegas nos seus espaços de trabalho.",
  "settings.profile.save": "Salvar nome",
  "settings.profile.memberSince": "Membro desde {date}.",
  "settings.roleAndPlace.title": "Seu perfil e seu lugar",
  "settings.roleAndPlace.notSetUp":
    "Você ainda não configurou isso. Conte quem você é e qual lugar importa para você, e eu mostro as condições ao vivo dele no seu painel e nos seus espaços de trabalho.",
  "settings.roleAndPlace.role": "Perfil:",
  "settings.roleAndPlace.homePlace": "Lugar principal:",
  "settings.roleAndPlace.notSet": "não definido",
  "settings.roleAndPlace.removed": "removido",
  "settings.roleAndPlace.setUp": "Configurar",
  "settings.roleAndPlace.remove": "Remover meu lugar",
  "settings.language.title": "Idioma",
  "settings.language.label": "Idioma dos menus e das mensagens",
  "settings.language.draftNote":
    "Os idiomas diferentes do inglês são redigidos por IA e ainda não foram revisados por um falante nativo — se algo soar estranho, o inglês está sempre disponível.",
  "settings.language.scopeNote":
    "Por enquanto, as páginas dos espaços de trabalho, as explicações dos dados e os alertas oficiais continuam em inglês.",
  "settings.language.draftTag": "rascunho",
  "settings.language.saved": "Idioma atualizado.",
  "settings.language.failed": "Não foi possível alterar o idioma. Tente novamente.",
  "settings.notifications.title": "Notificações",
  "settings.notifications.loadFailed":
    "Não foi possível carregar suas configurações de notificação agora. Atualize a página para tentar novamente.",
  "settings.notifications.officialLegend":
    "Alertas meteorológicos oficiais para o seu lugar principal",
  "settings.notifications.showAll": "Mostrar todos, incluindo avisos e comunicados menores",
  "settings.notifications.alertsOnly": "Somente alertas e os críticos — ocultar avisos menores",
  "settings.notifications.criticalAlways":
    "Alertas críticos, que envolvem risco à vida, são sempre exibidos e não podem ser desativados.",
  "settings.notifications.collaboration":
    "Avisar-me quando um colega comentar em um campo que eu criei",
  "settings.notifications.inAppNote":
    "As notificações aparecem somente no aplicativo — o World Vitality ainda não envia push, SMS ou e-mail, e só verifica alertas oficiais enquanto está aberto. Veja o seu",
  "settings.notifications.center": "Centro de notificações",
  "settings.notifications.save": "Salvar configurações de notificação",
  "settings.notifications.saveFailed":
    "Não foi possível salvar suas configurações de notificação. Tente novamente.",
  "settings.workspaces.title": "Seus espaços de trabalho",
  "settings.workspaces.none": "Você ainda não é membro de nenhum espaço de trabalho.",
  "settings.workspaces.limited": "(limitado a itens específicos)",
  "settings.download.title": "Baixe seus dados",
  "settings.download.body":
    "Um clique, sem espera: um arquivo JSON com seu perfil, seu papel e lugar principal, suas configurações de notificação e sua caixa de entrada, suas participações em espaços de trabalho, tudo o que você criou (campos, propriedades, locais) e os comentários que você escreveu. Ele não inclui dados de outras pessoas nem leituras ambientais públicas, e o arquivo informa isso.",
  "settings.download.button": "Baixar meus dados",
  "settings.delete.title": "Excluir sua conta",
  "settings.delete.body":
    "Isso exclui permanentemente e na hora sua conta, suas participações, suas notificações e os comentários que você escreveu. Os campos, propriedades e locais que você adicionou pertencem ao espaço de trabalho, então permanecem — sem o seu nome. Isso não pode ser desfeito; baixe seus dados antes se quiser uma cópia.",
  "settings.delete.confirmLabel": "Digite {word} para confirmar",
  "settings.delete.button": "Excluir minha conta",

  // ---- search
  "search.title": "Pesquisa",
  "search.resultsFor": "Resultados para “{query}”",
  "search.empty.title": "Pesquise qualquer coisa",
  "search.empty.description":
    "Tente um lugar, um tema ou uma página — por exemplo: {examples}. Pressione / em qualquer lugar para ir à caixa de pesquisa.",
  "search.question.title": "Não consigo responder a essa pergunta diretamente",
  "search.question.body":
    "A pesquisa encontra espaços de trabalho, páginas e lugares. Não tenho uma fonte confiável para perguntas abertas, então não vou adivinhar. Veja onde estão as partes da sua pergunta.",
  "search.question.bodyWithPlace":
    "A pesquisa encontra espaços de trabalho, páginas e lugares. Não tenho uma fonte confiável para perguntas abertas, então não vou adivinhar. Veja onde estão as partes da sua pergunta, incluindo “{place}”.",
  "search.workspacesAndPages": "Espaços de trabalho e páginas",
  "search.placesMatching": "Lugares correspondentes a “{place}”",
  "search.places": "Lugares",
  "search.nothingMatched": "Nada correspondeu a “{query}”",
  "search.nothingMatchedHelp":
    "Tente o nome de um lugar, um tema como enchente ou solar, ou uma página como equipe ou configurações.",
  "search.placesFailed":
    "A busca de lugares não está disponível agora, então só espaços de trabalho e páginas são exibidos. Tente novamente em instantes.",
  "search.signedOutNote":
    "Os espaços de trabalho exigem uma conta. Os lugares abrem no Explorador público sem conta.",
  "search.signIn": "Entre para abrir os espaços de trabalho",

  // ---- search index (page names the search box finds)
  "searchIndex.dashboard.label": "Painel inicial",
  "searchIndex.dashboard.description": "Seus espaços de trabalho em um só lugar",
  "searchIndex.explorer.label": "Explorador público",
  "searchIndex.explorer.description": "Consulte qualquer lugar da Terra — sem precisar de conta",
  "searchIndex.globe.label": "O globo",
  "searchIndex.globe.description": "Uma visão 3D do planeta",
  "searchIndex.notifications.label": "Notificações",
  "searchIndex.notifications.description":
    "Alertas do seu lugar principal e atividade nos seus espaços de trabalho",
  "searchIndex.notificationPrefs.label": "Preferências de notificação",
  "searchIndex.notificationPrefs.description": "Escolha quais alertas e atividades você vê",
  "searchIndex.settings.label": "Configurações",
  "searchIndex.settings.description": "Seu perfil e sua conta",
  "searchIndex.export.label": "Baixar meus dados",
  "searchIndex.export.description": "Exportação com um clique de tudo ligado à sua conta",
  "searchIndex.delete.label": "Excluir minha conta",
  "searchIndex.delete.description": "Remova sua conta permanentemente",

  // ---- assistant panel empty state
  "chrome.aiPanel.emptyTitle": "Nenhuma conversa ativa",
  "chrome.aiPanel.emptyBody": "Abra um espaço de trabalho para perguntar sobre os dados dele.",

  // ---- errors shown by form actions (these are produced on the server)
  "errors.typeTwoLetters": "Digite pelo menos duas letras de uma vila, cidade ou região.",
  "errors.noPlaceFound":
    "Nenhum lugar encontrado para “{query}”. Tente outra grafia ou uma cidade próxima.",
  "errors.placeLookupFailed": "Não foi possível buscar lugares agora. Tente novamente.",
  "errors.pickRoleAndPlace": "Escolha primeiro quem você é e um lugar.",
  "errors.liveDataFailed":
    "Não foi possível obter os dados ao vivo de {place} agora. Você ainda pode continuar — eles serão carregados no seu espaço de trabalho.",
  "errors.invalidRole": "Esse perfil não é uma das opções.",
  "errors.invalidPlace": "Esse lugar não é válido. Pesquise novamente.",
  "errors.saveFailed": "Não foi possível salvar agora. Tente novamente.",
  "errors.removeFailed": "Não foi possível remover agora. Tente novamente.",
  "errors.weatherServiceUnreachable":
    "Não foi possível acessar o serviço meteorológico agora. Tente novamente.",
  "errors.nameTooLong": "Mantenha seu nome com menos de {max} caracteres.",
  "errors.sessionExpired": "Sua sessão expirou. Entre novamente.",
  "errors.nameSaveFailed": "Não foi possível salvar seu nome. Tente novamente.",
  "errors.typeToConfirm": "Digite {word} para confirmar.",
  "errors.deleteFailed": "Não foi possível excluir sua conta. Tente novamente.",

  // ---- search place result line
  "search.placeDescription": "Ver as condições atuais",

  // ---- first-use tutorial popup
  "chrome.tutorial.step": "Passo {current} de {total}",
  "chrome.tutorial.skip": "Pular",
  "chrome.tutorial.back": "Voltar",
  "chrome.tutorial.next": "Próximo",
  "chrome.tutorial.getStarted": "Começar",
};
