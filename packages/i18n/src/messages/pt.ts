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
    "Isso exclui permanentemente e na hora sua conta, suas participações, suas notificações e os comentários que você escreveu. Se você é o proprietário da sua organização, os campos, propriedades e locais salvos nela também são excluídos (só é possível quando não restar mais ninguém nela; para deixá-la como está, passe-a antes a alguém que faça parte dela). Se você é membro da organização de outra pessoa, o que você adicionou permanece lá, sem o seu nome. Isso não pode ser desfeito; baixe seus dados antes se quiser uma cópia.",
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
  "errors.deleteOrganizationHasMembers":
    "Sua organização ainda tem outros membros ({count}). Transfira-a para um deles, ou remova-os na página “Equipe”, e depois exclua sua conta.",

  // ---- plan & billing (v95)
  "billing.title": "Plano e cobrança",
  "billing.back": "Voltar às configurações",
  "billing.seePlans": "Ver planos",
  "billing.plan.basic": "Básico",
  "billing.plan.standard": "Padrão",
  "billing.plan.premium": "Premium",
  "billing.plan.enterprise": "Enterprise",
  "billing.current.title": "Seu plano",
  "billing.state.free": "Você está no plano Básico gratuito.",
  "billing.state.lapsed":
    "Seu último pagamento não foi concluído, então por enquanto você está no Básico. Você pode atualizar seu cartão abaixo.",
  "billing.state.active": "Você está assinando o {plan}. Ele é renovado automaticamente.",
  "billing.state.ending":
    "Seu plano {plan} foi cancelado. Você o mantém até {date} e depois passa para o Básico. Nada é excluído.",
  "billing.state.endingNoDate":
    "Seu plano {plan} foi cancelado. Você o mantém até o fim do período pago e depois passa para o Básico. Nada é excluído.",
  "billing.state.pastDue":
    "Seu último pagamento não foi concluído. Seu plano {plan} continua ativo até {date} enquanto você atualiza seu cartão.",
  "billing.state.pastDueNoDate":
    "Seu último pagamento não foi concluído. Seu plano {plan} continua ativo por alguns dias enquanto você atualiza seu cartão.",
  "billing.state.manual":
    "Seu plano {plan} foi combinado diretamente conosco, então não há nada para gerenciar aqui.",
  "billing.member.note":
    "O plano da sua organização é gerenciado pelo proprietário. Você está usando o plano {plan} dele.",
  "billing.return.confirming":
    "Obrigado. Estamos confirmando seu pagamento com a Paystack, o que costuma levar alguns segundos. Se o seu plano ainda não mudou, atualize esta página.",
  "billing.return.refresh": "Atualizar",
  "billing.return.done": "Pagamento confirmado. Você está no plano {plan}.",
  "billing.limit.seats": "Pessoas na sua organização",
  "billing.limit.savedItems": "Campos, propriedades e locais salvos",
  "billing.limit.unlimited": "Sem limite definido",
  "billing.plans.title": "Planos",
  "billing.plans.free": "Grátis",
  "billing.plans.current": "Seu plano",
  "billing.plans.notOffered": "Ainda não disponível para compra.",
  "billing.plans.none": "Os planos ainda não podem ser comprados. Volte em breve.",
  "billing.interval.monthly": "Mensal",
  "billing.interval.annual": "Anual",
  "billing.interval.saving": "2 meses grátis",
  "billing.interval.label": "Período de cobrança",
  "billing.currency.label": "Moeda",
  "billing.currency.NGN": "Naira (₦)",
  "billing.currency.USD": "Dólares americanos ($)",
  "billing.price.monthly": "{price} / mês",
  "billing.price.annual": "{price} / ano",
  "billing.subscribe": "Assinar o {plan}",
  "billing.subscribe.failed":
    "Não foi possível iniciar o pagamento e nada foi cobrado. Tente novamente em instantes.",
  "billing.payNote":
    "Você paga na página segura da Paystack e nós nunca vemos os dados do seu cartão. O preço exibido é o preço cobrado. Cancele quando quiser e mantenha seu plano até o fim do período pago.",
  "billing.switchNote":
    "Para trocar entre planos pagos, cancele o atual e assine o outro quando ele terminar. A Paystack não consegue trocar uma assinatura em andamento.",
  "billing.alwaysFree":
    "Alertas meteorológicos oficiais, o Explorador Público e a exportação ou exclusão dos seus próprios dados são gratuitos em todos os planos.",
  "billing.ownerOnly": "Somente o proprietário da organização pode assinar ou mudar o plano.",
  "billing.manage.title": "Cartão e cancelamento",
  "billing.manage.cardBody":
    "Abre a página da Paystack, onde você pode trocar o cartão usado nas renovações.",
  "billing.manage.card": "Atualizar cartão na Paystack",
  "billing.manage.cardFailed":
    "Não foi possível abrir a página da Paystack agora. Tente novamente em instantes.",
  "billing.manage.cancel": "Cancelar assinatura",
  "billing.manage.cancelBody":
    "Você mantém seu plano até o fim do período pago e depois passa para o Básico. Nada é excluído; você apenas não poderá adicionar mais do que o Básico permite.",
  "billing.manage.cancelConfirm": "Sim, cancelar no fim do período",
  "billing.manage.cancelKeep": "Manter meu plano",
  "billing.manage.cancelDone":
    "Cancelamento solicitado. Esta página é atualizada assim que a Paystack o confirmar.",
  "billing.manage.cancelFailed":
    "Não foi possível cancelar agora e nada mudou. Tente novamente em instantes.",
  "settings.billing.title": "Plano e cobrança",
  "settings.billing.body": "Você está no plano {plan}.",
  "settings.billing.link": "Ver plano e cobrança",
  "settings.delete.billingNote":
    "Se você tem uma assinatura paga, nós a cancelamos primeiro na Paystack, para que você não seja cobrado novamente.",
  "errors.billingUnavailable": "A cobrança não está disponível agora. Tente novamente mais tarde.",
  "errors.billingOwnerOnly": "Somente o proprietário da organização pode mudar o plano dela.",
  "errors.billingAlreadySubscribed":
    "Você já tem uma assinatura. Você pode gerenciá-la na página do plano.",
  "errors.billingNotOffered": "Esse plano não está disponível para compra no momento.",
  "errors.billingNotSubscribed": "Não há nenhuma assinatura para gerenciar.",
  "errors.deleteCancelSubscriptionFailed":
    "Não conseguimos cancelar sua assinatura na Paystack, então sua conta não foi excluída (caso contrário você continuaria sendo cobrado). Tente novamente em instantes.",

  // ---- organisation card (v96)
  "settings.org.title": "Sua organização",
  "settings.org.owner": "Você é o proprietário desta organização.",
  "settings.org.member": "Você é membro desta organização. O proprietário a gerencia.",
  "settings.org.nameLabel": "Nome da organização",
  "settings.org.nameHelp":
    "Até {max} caracteres. Ele aparece na exportação dos seus dados e nas nossas ferramentas de suporte.",
  "settings.org.save": "Salvar nome da organização",
  "settings.org.people.title": "Pessoas na sua organização",
  "settings.org.people.count": "{count, plural, one {# pessoa} other {# pessoas}}",
  "settings.org.people.owner": "Proprietário",
  "settings.org.people.member": "Membro",
  "settings.org.people.you": "você",
  "settings.org.people.hint":
    "Para adicionar ou remover pessoas, abra um espaço de trabalho e escolha Equipe.",
  "settings.org.people.loadFailed":
    "Não foi possível carregar a lista de pessoas agora. Tente novamente.",
  "errors.orgNameInvalid": "Use entre 1 e {max} caracteres para o nome da organização.",
  "errors.orgRenameFailed": "Não foi possível renomear sua organização. Tente novamente.",
  "errors.orgOwnerOnly": "Somente o proprietário da organização pode renomeá-la.",

  // ---- search place result line
  "search.placeDescription": "Ver as condições atuais",

  // ---- first-use tutorial popup
  "chrome.tutorial.step": "Passo {current} de {total}",
  "chrome.tutorial.skip": "Pular",
  "chrome.tutorial.back": "Voltar",
  "chrome.tutorial.next": "Próximo",
  "chrome.tutorial.getStarted": "Começar",
  // ---- phone layout: menu button and bottom bar
  "chrome.nav.menu": "Menu",
  "chrome.nav.closeMenu": "Fechar menu",
  "chrome.nav.quickNav": "Navegação rápida",
  "chrome.nav.home": "Início",
  "chrome.nav.map": "Mapa",
  "chrome.nav.alerts": "Alertas",
  "chrome.nav.search": "Pesquisar",
  "chrome.nav.ai": "IA",

  // ---- offline use and installing the app
  "chrome.offline.offline": "Você está offline. O que você vê pode estar desatualizado.",
  "chrome.offline.savedCopy":
    "Você está vendo a cópia que abriu por último, salva {ago}. Reconecte-se e recarregue para ver as informações atuais.",
  "chrome.offline.reload": "Recarregar",
  "offline.title": "Você está offline",
  "offline.body":
    "O World Vitality não consegue acessar a internet agora. As páginas que você abriu recentemente ficam salvas neste dispositivo e abrem com um aviso indicando quando foram salvas. Todo o resto precisa de conexão.",
  "offline.retry": "Tentar novamente",
  "offline.dashboard": "Abrir o painel",
  "offline.privacy":
    "As páginas salvas ficam neste dispositivo e são removidas quando você sai da conta.",
  "settings.install.title": "Instalar neste dispositivo",
  "settings.install.body":
    "Adicione o World Vitality à tela inicial ou à área de trabalho para abri-lo como um aplicativo. As páginas que você abriu recentemente continuam disponíveis offline: ficam salvas apenas neste dispositivo e são removidas quando você sai da conta.",
  "settings.install.button": "Instalar o aplicativo",
  "settings.install.installed": "O World Vitality está instalado neste dispositivo.",
  "settings.install.hint":
    "Para instalar, abra o botão de compartilhar ou o menu do navegador e escolha “Adicionar à tela inicial” ou “Instalar aplicativo”.",
  "settings.install.appsLead": "Prefere um aplicativo para computador ou para Android?",
  "settings.install.appsLink": "Ver os downloads",

  // ---- Weather & Climate workspace (home page) and the location note shared by workspace pages
  "weather.currentConditions": "Condições atuais",
  "weather.status": "Situação",
  "weather.temperature": "Temperatura",
  "weather.alerts": "Alertas",
  "weather.noActiveAlerts": "Nenhum alerta ativo",
  "weather.trend": "Tendência",
  "weather.forecast": "Previsão",
  "weather.noForecast": "Nenhuma previsão disponível",
  "weather.historicalContext": "Contexto histórico",
  "weather.noBenchmark": "Ainda não há uma referência climática regional",
  "weather.gaps":
    "{count, plural, one {# dia ficou sem dados disponíveis.} other {# dias ficaram sem dados disponíveis.}}",
  "workspace.forecastGaps":
    "{count, plural, one {# dia de previsão ficou sem dados disponíveis.} other {# dias de previsão ficaram sem dados disponíveis.}}",
  "weather.aiPanel.emptyTitle": "Nada para interpretar ainda",
  "weather.aiPanel.emptyBody": "Abra Condições atuais para ver uma situação gerada por IA.",
  "workspace.locationNote.home": "Mostrando {place}, seu lugar principal.",
  "workspace.locationNote.change": "Alterar",
  "workspace.locationNote.demo": "Mostrando um local de demonstração ({place}).",
  "workspace.locationNote.setOwn": "Defina seu próprio lugar",
  "workspace.locationNote.demoTail": "para ver aqui as suas condições.",

  // ---- Shared workspace pieces: empty states, edit/delete, report buttons (v104)
  "workspace.aiPanel.emptyTitle": "Nada para interpretar ainda",
  "workspace.alerts": "Alertas",
  "workspace.noActiveAlerts": "Nenhum alerta ativo",
  "workspace.trend": "Tendência",
  "workspace.comparison": "Comparação",
  "workspace.map": "Mapa",
  "workspace.viewFullMap": "Ver o mapa completo →",
  "workspace.noBenchmark": "Ainda não há uma referência regional",
  "workspace.gaps":
    "{count, plural, one {# dia sem dados disponíveis.} other {# dias sem dados disponíveis.}}",
  "resource.edit": "Editar",
  "resource.delete": "Excluir",
  "resource.confirmDelete": "Confirmar exclusão?",
  "resource.save": "Salvar",
  "resource.name": "Nome",
  "resource.latitude": "Latitude",
  "resource.longitude": "Longitude",
  "resource.sessionUnverified": "Não foi possível verificar sua sessão. Entre novamente.",
  "resource.latitudeRange": "A latitude deve ser um número entre -90 e 90.",
  "resource.longitudeRange": "A longitude deve ser um número entre -180 e 180.",
  "report.generated": "Gerado em {when}",
  "report.print": "Imprimir / Salvar como PDF",
  "report.downloadCsv": "Baixar CSV",
  "report.accessDenied": "Acesso negado",
  "report.accessDeniedBody":
    "Esta função não tem permissão para criar relatórios neste espaço de trabalho.",

  // ---- Agriculture workspace (v104)
  "agri.aiPanel.emptyBody": "Abra Visão geral dos campos para ver uma situação gerada por IA.",
  "agri.soilMoisture": "Umidade do solo",
  "agri.temperature": "Temperatura",
  "agri.empty.noFields": "Ainda não há campos",
  "agri.empty.noFieldsVisible": "Nenhum campo visível para a sua função",
  "agri.empty.addAbove": "Adicione um campo acima para começar.",
  "agri.empty.scoped":
    "Seu acesso é limitado a campos específicos, e nenhum está atribuído a você no momento.",
  "agri.reportCard.body":
    "Retrato das condições atuais de cada campo que você pode ver, exportável em CSV ou PDF →",
  "agri.trend.emptyTitle": "Ainda não há histórico suficiente",
  "agri.trend.emptyBody": "Comparações de tendência precisam de dados de mais de uma temporada.",
  "agri.add.title": "Adicionar um campo",
  "agri.add.button": "Adicionar campo",
  "agri.add.success": "“{name}” adicionado.",
  "agri.comments.show": "Comentários ({count})",
  "agri.comments.hide": "Ocultar comentários",
  "agri.comments.none": "Ainda não há comentários.",
  "agri.comments.label": "Comentário",
  "agri.comments.add": "Adicionar um comentário",
  "agri.comments.post": "Publicar",
  "agri.comments.edited": "(editado)",
  "agri.err.nameRequired": "Digite o nome do campo.",
  "agri.err.noPermissionAdd":
    "Você não tem permissão para adicionar campos neste espaço de trabalho.",
  "agri.err.createFailed": "Não foi possível criar o campo. Tente novamente.",
  "agri.err.noPermissionEdit": "Você não tem permissão para editar este campo.",
  "agri.err.updateFailed": "Não foi possível atualizar o campo. Tente novamente.",
  "agri.err.noPermissionDelete": "Você não tem permissão para excluir este campo.",
  "agri.err.deleteFailed": "Não foi possível excluir o campo. Tente novamente.",
  "agri.err.commentEmpty": "O comentário não pode ficar vazio.",
  "agri.err.noPermissionComment": "Você não tem permissão para comentar neste campo.",
  "agri.err.postFailed": "Não foi possível publicar o comentário. Tente novamente.",
  "agri.err.editOwnOnly": "Você só pode editar os seus próprios comentários.",
  "agri.err.deleteOwnOnly": "Você só pode excluir os seus próprios comentários.",
  "agri.report.snapshotNote":
    "Este é um retrato das condições atuais de cada campo que você pode ver — não é um resumo de fim de safra nem uma comparação com as normas históricas (o aplicativo não tem dados de safras anteriores). Consulte a documentação de procedência dos dados do World Vitality para os detalhes das fontes.",
  "agri.report.noFieldsTitle": "Nenhum campo visível",
  "agri.report.noFieldsBody": "Não há campos para incluir neste relatório.",
  "agri.map.noFieldsBody":
    "Ainda não há campos para mostrar no mapa. Adicione um campo na página inicial do espaço de trabalho.",

  // ---- Map text shared by the resource maps; Agriculture map (v104)
  "map.moisture.veryDry": "muito seco",
  "map.moisture.dry": "seco",
  "map.moisture.moderate": "umidade moderada",
  "map.moisture.moist": "úmido",
  "map.moisture.saturated": "saturado",
  "agri.map.toggle": "Umidade do solo ({count, plural, one {# campo} other {# campos}})",
  "map.popupReading": "{name}: {label} ({value} de 1,0)",
  "map.popupNoReading": "{name}: sem leitura atual de umidade do solo",
  "agri.map.descNone": "Não há campos para mostrar no mapa.",
  "agri.map.descOn": "Mapa mostrando {count, plural, one {# campo} other {# campos}}. {items}",
  "agri.map.descOff":
    "Mapa mostrando {count, plural, one {# campo} other {# campos}}. A camada de umidade do solo está oculta.",
  "map.descItem": "{name}: {label} ({value} em uma escala de 0 a 1)",
  "map.descItemNoReading": "{name}: sem leitura atual",

  // ---- Shared: signed-in line, report link, map readings (v105)
  "workspace.signedInAs": "Conectado como: {role}",
  "report.open": "Abrir relatório",
  "report.notAvailable": "A exportação de relatórios não está disponível para a sua função",

  // ---- Insurance workspace (v105)
  "insurance.role.admin_owner": "Administrador",
  "insurance.role.operational_user": "Subscritor",
  "insurance.role.scoped_field_user": "Regulador de sinistros",
  "insurance.role.viewer_external": "Analista (somente leitura)",
  "insurance.aiPanel.emptyBody":
    "Abra Contexto de risco para subscrição para ver uma situação gerada por IA.",
  "insurance.home.intro":
    "Carteira segurada real ({count, plural, one {# imóvel} other {# imóveis}}). Apenas sinais de perigo individuais; sem pontuação de risco multiameaça sintetizada (veja as notas de escopo desta página).",
  "insurance.empty.noProperties": "Ainda não há imóveis segurados",
  "insurance.empty.noPropertiesVisible": "Nenhum imóvel visível para a sua função",
  "insurance.empty.addAbove": "Adicione um imóvel segurado acima para começar.",
  "insurance.empty.scoped":
    "Seu acesso é limitado a imóveis específicos, e nenhum está atribuído a você no momento.",
  "insurance.temperature": "Temperatura",
  "insurance.soilDrought": "Solo / relacionado à seca",
  "insurance.reportCard.body":
    "Gere um relatório de subscrição pronto para impressão, com fontes, registros de data e hora e uma entrada registrada na trilha de auditoria.",
  "insurance.add.title": "Adicionar um imóvel segurado",
  "insurance.add.button": "Adicionar imóvel",
  "insurance.add.success": "“{name}” adicionado.",
  "insurance.policyNumber": "Número da apólice",
  "insurance.address": "Endereço",
  "insurance.propertyAddress": "Endereço do imóvel",
  "insurance.err.policyRequired": "Informe um número de apólice.",
  "insurance.err.addressRequired": "Informe o endereço do imóvel.",
  "insurance.err.noPermissionAdd":
    "Você não tem permissão para adicionar imóveis segurados neste espaço de trabalho.",
  "insurance.err.createFailed": "Não foi possível criar o imóvel segurado. Tente novamente.",
  "insurance.err.noPermissionEdit": "Você não tem permissão para editar este imóvel.",
  "insurance.err.updateFailed": "Não foi possível atualizar o imóvel segurado. Tente novamente.",
  "insurance.err.noPermissionDelete": "Você não tem permissão para excluir este imóvel.",
  "insurance.err.deleteFailed": "Não foi possível excluir o imóvel segurado. Tente novamente.",
  "insurance.report.title": "Relatório de risco para subscrição",
  "insurance.report.count": "{count, plural, one {# imóvel} other {# imóveis}}",
  "insurance.report.scopeNote":
    "Este relatório abrange todos os imóveis segurados que você pode ver e mostra apenas sinais de perigo individuais — não uma pontuação de risco multiameaça sintetizada. Não é adequado, no estado em que está, para documentação real de subscrição, sinistros ou conformidade regulatória. O acesso ao relatório é registrado na trilha de auditoria deste espaço de trabalho. Consulte a documentação de procedência dos dados do World Vitality para os detalhes das fontes.",
  "insurance.report.noPropertiesTitle": "Nenhum imóvel visível",
  "insurance.report.noPropertiesBody": "Não há imóveis segurados para incluir neste relatório.",
  "insurance.map.noPropertiesBody":
    "Ainda não há imóveis segurados para mostrar no mapa. Adicione um imóvel na página inicial do espaço de trabalho.",
  "insurance.map.toggle": "Umidade do solo ({count, plural, one {# imóvel} other {# imóveis}})",
  "insurance.map.descNone": "Não há imóveis para mostrar no mapa.",
  "insurance.map.descOn":
    "Mapa mostrando {count, plural, one {# imóvel} other {# imóveis}}. {items}",
  "insurance.map.descOff":
    "Mapa mostrando {count, plural, one {# imóvel} other {# imóveis}}. A camada de umidade do solo está oculta.",

  // ---- Government & NGOs workspace (v105)
  "gov.role.admin_owner": "Administrador da agência",
  "gov.role.operational_user": "Analista",
  "gov.role.scoped_field_user": "Equipe de campo",
  "gov.role.viewer_external": "Agência parceira (somente leitura)",
  "gov.aiPanel.emptyBody": "Abra Visão geral da jurisdição para ver uma situação gerada por IA.",
  "gov.home.intro":
    "Locais monitorados reais ({count, plural, one {# local} other {# locais}}), não limites reais de jurisdição (veja as notas de escopo desta página).",
  "gov.empty.noLocations": "Ainda não há locais monitorados",
  "gov.empty.noLocationsVisible": "Nenhum local visível para a sua função",
  "gov.empty.addAbove": "Adicione um local monitorado acima para começar.",
  "gov.empty.scoped":
    "Seu acesso é limitado a locais específicos, e nenhum está atribuído a você no momento.",
  "gov.climate": "Clima",
  "gov.reportCard.body":
    "Gere um relatório pronto para impressão desta visão geral, com fontes e registros de data e hora.",
  "gov.add.title": "Adicionar um local monitorado",
  "gov.add.button": "Adicionar local",
  "gov.add.success": "“{name}” adicionado.",
  "gov.label": "Rótulo",
  "gov.locationLabel": "Rótulo do local",
  "gov.err.labelRequired": "Informe um rótulo para este local.",
  "gov.err.noPermissionAdd":
    "Você não tem permissão para adicionar locais monitorados neste espaço de trabalho.",
  "gov.err.createFailed": "Não foi possível adicionar o local monitorado. Tente novamente.",
  "gov.err.noPermissionEdit": "Você não tem permissão para editar este local.",
  "gov.err.updateFailed": "Não foi possível atualizar o local monitorado. Tente novamente.",
  "gov.err.noPermissionDelete": "Você não tem permissão para excluir este local.",
  "gov.err.deleteFailed": "Não foi possível excluir o local monitorado. Tente novamente.",
  "gov.report.title": "Relatório da visão geral da jurisdição",
  "gov.report.count": "{count, plural, one {# local} other {# locais}}",
  "gov.report.scopeNote":
    "Este relatório abrange todos os locais monitorados que você pode ver, não um limite real de jurisdição — não é adequado, no estado em que está, para documentação pública, de políticas ou para doadores. Consulte a documentação de procedência dos dados do World Vitality para os detalhes das fontes.",
  "gov.report.noLocationsTitle": "Nenhum local visível",
  "gov.report.noLocationsBody": "Não há locais monitorados para incluir neste relatório.",
  "gov.map.noLocationsBody":
    "Ainda não há locais monitorados para mostrar no mapa. Adicione um local na página inicial do espaço de trabalho.",
  "gov.map.toggle": "Umidade do solo ({count, plural, one {# local} other {# locais}})",
  "gov.map.descNone": "Não há locais para mostrar no mapa.",
  "gov.map.descOn": "Mapa mostrando {count, plural, one {# local} other {# locais}}. {items}",
  "gov.map.descOff":
    "Mapa mostrando {count, plural, one {# local} other {# locais}}. A camada de umidade do solo está oculta.",

  // ---- Shared map pieces for the sample-reference-site maps; status caption (v106)
  "workspace.status": "Situação",
  "map.mode.temperature": "Temperatura",
  "map.mode.generation": "Faixa de geração",
  "map.mode.routeRisk": "Faixa de risco da rota",
  "map.mode.siteRisk": "Risco do local",
  "map.mode.moisture": "Mostrar a umidade do solo",
  "map.mode.raw": "Leituras brutas",
  "map.verdict.cold": "frio",
  "map.verdict.cool": "fresco",
  "map.verdict.mild": "agradável",
  "map.verdict.warm": "quente",
  "map.verdict.hot": "muito quente",
  "map.verdict.belowCutIn": "abaixo da velocidade de partida",
  "map.verdict.ramping": "em ascensão",
  "map.verdict.rated": "potência nominal",
  "map.verdict.cutOut": "corte por vento forte",
  "map.verdict.clear": "livre",
  "map.verdict.elevated": "elevado",
  "map.verdict.high": "alto",
  "map.verdict.severe": "severo",
  "map.verdict.dry": "Seco",
  "map.verdict.somewhatWet": "Um pouco úmido",
  "map.verdict.wet": "Úmido",
  "map.tempValue": "{value} °C",
  "map.windValue": "vento de {value} m/s",
  "map.popup.pair": "{first} — {second}",
  "map.ref.coverage": "Locais de referência de amostra: {plotted} de {total} com dados",
  "map.ref.descOn":
    "Mapa de {count, plural, one {# local de referência de amostra} other {# locais de referência de amostra}}. {items}",
  "map.ref.descOff": "Mapa de locais de referência de amostra. A camada está oculta.",
  "site.ibadan": "Ibadan, Nigéria",
  "site.nairobi": "Nairóbi, Quênia",
  "site.rotterdam": "Roterdã, Países Baixos",
  "site.desMoines": "Des Moines, EUA",
  "site.chennai": "Chennai, Índia",
  "site.brisbane": "Brisbane, Austrália",

  // ---- Construction workspace (v106)
  "construction.aiPanel.emptyBody": "Abra Risco do local para ver uma situação gerada por IA.",
  "construction.title": "Situação das atividades de hoje",
  "construction.siteRiskStatus": "Situação de risco do local",
  "construction.siteRiskTimeline": "Linha do tempo de risco do local",
  "construction.activity.concretePour": "Concretagem",
  "construction.activity.craneOperation": "Operação de guindaste",
  "construction.activity.roofingWork": "Trabalhos de cobertura",
  "construction.activity.excavation": "Escavação (risco de enchente repentina)",
  "construction.status.go": "liberado",
  "construction.status.caution": "atenção",
  "construction.status.noGo": "impedido",

  // ---- Renewable Energy workspace (v106)
  "renewable.aiPanel.emptyBody": "Abra Perspectiva de geração para ver uma situação gerada por IA.",
  "renewable.title": "Perspectiva de geração dos ativos",
  "renewable.hydroNote":
    "O painel de hidrelétrica sempre lê uma estação fluviométrica fixa do USGS, não este local.",
  "renewable.outlookWind": "Perspectiva de geração: eólica (próximos 7 dias)",
  "renewable.outlookSolar": "Perspectiva de geração: solar (próximos 7 dias)",
  "renewable.statusWind": "Situação atual: eólica",
  "renewable.statusSolar": "Situação atual: solar",
  "renewable.statusHydro": "Situação atual: hidrelétrica (estação fluviométrica dos EUA)",
  "renewable.hydroGaps":
    "{count, plural, one {# leitura sem dados disponíveis.} other {# leituras sem dados disponíveis.}}",

  // ---- Logistics & Shipping workspace (v106)
  "logistics.aiPanel.emptyBody": "Abra Risco da rota para ver uma situação gerada por IA.",
  "logistics.title": "Situação do risco da rota",
  "logistics.outlook": "Perspectiva do risco da rota (próximos 7 dias)",
  "logistics.disruptionReports": "Relatórios de interrupções",
  "logistics.noDisruptions": "Ainda não há histórico de interrupções",

  // ---- Research workspace (v107)
  "research.aiPanel.title": "Aqui não há interpretação de IA, de propósito",
  "research.aiPanel.body":
    "Pesquisa mantém este painel bruto de propósito: os dados aparecem na tabela do Explorador de dados com toda a procedência, sem resumo por uma camada de IA.",
  "research.aiPanel.provenance":
    "Em vez disso, a procedência de cada registro (fonte, licença, hora da coleta e limitações conhecidas) é mostrada na própria tabela.",
  "research.dataset": "Conjunto de dados",
  "research.metrics": "Métricas",
  "research.results": "Resultados",
  "research.relationships": "Relações entre os dados",
  "research.source.nasaPower.label": "NASA POWER — Condições atuais",
  "research.source.nasaPower.description":
    "Dados de observação de domínio público, sem necessidade de chave de API.",
  "research.source.openMeteo.label": "Open-Meteo — Previsão de 7 dias",
  "research.source.openMeteo.description":
    "Plano gratuito, licença para uso não comercial (veja a coluna Licença deste conjunto de dados).",
  "research.fetch": "Buscar dados",
  "research.fetchFailed": "Não foi possível buscar esse conjunto de dados. Tente novamente.",
  "research.col.metric": "Métrica",
  "research.col.value": "Valor",
  "research.col.unit": "Unidade",
  "research.col.timestamp": "Data e hora",
  "research.col.type": "Tipo",
  "research.col.source": "Fonte",
  "research.col.license": "Licença",
  "research.col.limitations": "Limitações conhecidas",
  "research.type.observed": "observado",
  "research.type.forecast": "previsão",
  "research.noneStated": "Nenhuma informada",
  "research.records": "{count, plural, one {# registro} other {# registros}}",
  "research.gapsReported": "{count, plural, one {# lacuna informada} other {# lacunas informadas}}",
  "research.recordsAndGaps": "{records} — {gaps}",
  "research.empty.title": "Nenhum conjunto de dados carregado ainda",
  "research.empty.body": "Escolha um conjunto de dados acima e clique em “Buscar dados”.",
  "research.rel.intro":
    "Cada métrica bruta que esta plataforma ingere e os espaços de trabalho que ela realmente alimenta, derivados diretamente das ligações reais de capacidades da plataforma (ADR-0004, fase 1), e não de um modelo hipotético.",
  "research.rel.feeds": "Alimenta: {workspaces}",
  "research.rel.feedsMany":
    "Alimenta: {workspaces} — a mesma leitura, interpretada de forma diferente em cada área.",
  "research.metric.T2M.label": "Temperatura (T2M)",
  "research.metric.T2M.description":
    "A “temperatura a 2 metros” da NASA POWER, também obtida como previsão diária pelo Open-Meteo.",
  "research.metric.WS2M.label": "Velocidade do vento (WS2M)",
  "research.metric.WS2M.description":
    "A “velocidade do vento a 2 metros” da NASA POWER, também obtida como previsão diária pelo Open-Meteo, explicitamente em m/s para que as duas fontes sejam diretamente comparáveis.",
  "research.metric.GWETROOT.label": "Umidade do solo na zona radicular (GWETROOT)",
  "research.metric.GWETROOT.description":
    "O índice de umidade do solo na zona radicular da NASA POWER, de 0 (seco) a 1 (saturado).",

  // ---- Education workspace (v107)
  "edu.role.admin_owner": "Educador/Administrador",
  "edu.role.operational_user": "Educador",
  "edu.role.scoped_field_user": "Acesso limitado",
  "edu.role.viewer_external": "Convidado (somente leitura)",
  "edu.aiPanel.title": "Aqui não há painel lateral de IA",
  "edu.aiPanel.body":
    "As explicações dos dados deste espaço de trabalho aparecem na própria página, não em um painel lateral.",
  "edu.intro":
    "Dados reais e atuais, explicados no nível de ensino que você escolher. Para os educadores usarem em sala de aula; nenhuma conta ou dado de estudante é coletado neste espaço de trabalho.",
  "edu.demoLocation": "Local de sala de aula de demonstração",
  "edu.explainFor": "Explicar para",
  "edu.grade.k2": "Séries K–2",
  "edu.grade.g35": "Séries 3–5",
  "edu.grade.g68": "Séries 6–8",
  "edu.grade.g912": "Séries 9–12",
  "edu.card.temperature": "Temperatura",
  "edu.card.soilMoisture": "Umidade do solo",
  "edu.talkAbout": "Converse sobre isso: {prompt}",
  "edu.intro.k2.weather": "Vamos descobrir: está quente ou frio lá fora agora?",
  "edu.intro.k2.soil":
    "Vamos descobrir: o chão está com sede (seco) ou cheio de água (molhado) agora?",
  "edu.intro.g35.weather":
    "Veja o que dados reais de satélite nos dizem sobre a temperatura do ar neste local hoje.",
  "edu.intro.g35.soil":
    "Veja o que dados reais de satélite nos dizem sobre a umidade do solo neste local hoje.",
  "edu.intro.g68.weather":
    "Esta é uma leitura real e atual da temperatura do ar neste local, feita com dados de satélite da NASA.",
  "edu.intro.g68.soil":
    "Esta é uma leitura real e atual da umidade do solo neste local, feita com dados de satélite da NASA.",
  "edu.intro.g912.weather":
    "Leitura atual da temperatura do ar neste local, obtida de dados de satélite da NASA POWER:",
  "edu.intro.g912.soil":
    "Leitura atual da umidade do solo neste local, obtida de dados de satélite da NASA POWER:",
  "edu.conf.insufficientKid":
    "Ainda não temos informações suficientes para saber — tudo bem, os cientistas também dizem “eu não sei”!",
  "edu.conf.insufficient": "Não há dados recentes suficientes para responder com segurança agora.",
  "edu.conf.high": "Isto se baseia em várias leituras recentes, então temos bastante confiança.",
  "edu.conf.moderate":
    "Isto se baseia em algumas leituras recentes, então é uma estimativa razoável.",
  "edu.conf.low":
    "Isto se baseia em apenas uma leitura recente, então trate como uma estimativa aproximada.",
  "edu.conf.kid.high": "Conferimos isso várias vezes, então temos bastante certeza!",
  "edu.conf.kid.moderate": "Conferimos isso algumas vezes, então é um bom palpite.",
  "edu.conf.kid.low": "Conferimos isso só uma vez, então é só um primeiro palpite.",
  "edu.followUp.k2.weather": "O que você está vestindo para sair hoje? Combina com o tempo?",
  "edu.followUp.k2.soil": "Você viu uma poça ou terra seca e rachada perto de você recentemente?",
  "edu.followUp.g35.weather":
    "Como a temperatura de hoje se compara com o que você esperaria para esta época do ano?",
  "edu.followUp.g35.soil": "Por que os agricultores se importariam com o solo estar úmido ou seco?",
  "edu.followUp.g68.weather":
    "Quais fatores podem fazer a temperatura variar entre dois locais próximos?",
  "edu.followUp.g68.soil":
    "Como a umidade do solo pode afetar as plantas e os animais que vivem nesta área?",
  "edu.followUp.g912.weather":
    "Esta leitura reflete apenas as condições atuais, não uma tendência. De que dados adicionais você precisaria para identificar uma tendência climática, e não o tempo do dia a dia?",
  "edu.followUp.g912.soil":
    "As faixas de umidade deste provedor são a interpretação por limiares da própria plataforma, não um padrão agronômico citado (veja a documentação do código-fonte). Por que essa distinção importa ao usar esses dados em uma decisão real?",
  "edu.lesson.title": "Plano de aula de exemplo",
  "edu.lesson.intro":
    "Um ponto de partida baseado em dados reais e atuais. Não contém nomes nem dados reais de estudantes: adapte-o para a sua turma.",
  "edu.lesson.gradeLevel": "Nível de ensino",
  "edu.lesson.download": "Baixar o plano de aula",
  "edu.lesson.accessDeniedBody":
    "Este perfil não tem permissão para gerar documentos de plano de aula neste espaço de trabalho.",
  "edu.doc.title": "Plano de aula de exemplo",
  "edu.doc.subtitle": "Explorando o ambiente do nosso lugar",
  "edu.doc.gradeLevel": "Nível de ensino: {grade}",
  "edu.doc.location": "Local utilizado: {place}",
  "edu.doc.asOf": "Dados atualizados em: {when}",
  "edu.doc.disclaimer":
    "Este é um plano de aula de exemplo, um ponto de partida gerado a partir de dados ambientais reais e atuais. Não contém dados nem nomes reais de estudantes: adapte-o para a sua turma.",
  "edu.doc.objective": "Objetivo",
  "edu.doc.objective.k2":
    "Os estudantes vão observar e descrever o tempo e as condições do solo reais em um lugar real da Terra.",
  "edu.doc.objective.g35":
    "Os estudantes vão interpretar dados ambientais reais e relacioná-los com condições observáveis.",
  "edu.doc.objective.g68":
    "Os estudantes vão analisar dados ambientais reais, incluindo o nível de confiança, e discutir os fatores que os influenciam.",
  "edu.doc.objective.g912":
    "Os estudantes vão avaliar criticamente um conjunto de dados ambientais reais, incluindo o nível de confiança informado e as limitações conhecidas, e identificar quais dados adicionais seriam necessários para uma análise mais aprofundada.",
  "edu.doc.materials": "Materiais",
  "edu.doc.materials.app": "- Espaço de trabalho {workspace} do World Vitality ({explain} / {map})",
  "edu.doc.materials.discussion": "- Espaço para discussão em sala de aula",
  "edu.doc.procedure": "Procedimento",
  "edu.doc.step.open": "Abra a página “{explain}” e selecione este nível.",
  "edu.doc.step.weather": "Analisem juntos a leitura da temperatura: “{sentence}”",
  "edu.doc.step.soil": "Analisem juntos a leitura da umidade do solo: “{sentence}”",
  "edu.doc.discuss": "Conversem: {prompt}",
  "edu.doc.step.map": "Abra a página “{map}” e explore o mesmo local visualmente.",
  "edu.doc.step.confidence":
    "Peça aos estudantes que anotem o nível de confiança informado para cada leitura e discutam o que o aumentaria ou diminuiria.",
  "edu.doc.step.surprise":
    "Peça aos estudantes que compartilhem uma coisa que os surpreendeu nos dados.",
  "edu.doc.notes": "Notas para o educador",
  "edu.doc.notes.body":
    "Todos os dados exibidos são reais e atuais, obtidos de dados de satélite da NASA POWER (veja a documentação de procedência de dados desta plataforma). É um único local de demonstração, não necessariamente o da sua própria turma. Esta ferramenta não coleta nem armazena dados de estudantes.",

  // ---- Disaster Monitoring workspace (v107)
  "dm.aiPanel.title": "Aqui não há interpretação de IA, de propósito",
  "dm.aiPanel.body":
    "Os alertas são exibidos exatamente como emitidos pelo Serviço Meteorológico Nacional dos EUA (NWS), sem resumo, pontuação ou reinterpretação por este aplicativo.",
  "dm.aiPanel.ethics":
    "Este espaço de trabalho tem o maior peso ético da plataforma (Constituição, seções 7 e 9, tolerância zero). Siga sempre as orientações das autoridades locais.",
  "dm.place": "Los Angeles, Califórnia",
  "dm.notSubstitute":
    "Isto não substitui a orientação oficial: siga sempre as instruções das autoridades locais.",
  "dm.caveat.original": "Texto original da fonte (em inglês):",
  "dm.alerts.subtitle":
    "{place} · Fonte: Serviço Meteorológico Nacional dos EUA (weather.gov) · Somente EUA e territórios",
  "dm.alerts.failedTitle": "Não foi possível acessar o Serviço Meteorológico Nacional",
  "dm.alerts.failedBody":
    "Não foi possível obter os alertas agora. Consulte diretamente o weather.gov para obter informações oficiais.",
  "dm.alerts.noneTitle": "Nenhum alerta ativo",
  "dm.alerts.noneBody":
    "Nenhum alerta do Serviço Meteorológico Nacional está ativo para {place} no momento.",
  "dm.floods.title": "Locais afetados por enchentes",
  "dm.floods.subtitle": "{state} · Fonte: API de impacto de enchentes em tempo real do USGS",
  "dm.floods.notice":
    "Estas informações são preliminares ou provisórias e não receberam a aprovação final do USGS. Não devem ser usadas para decisões relativas à segurança pessoal ou pública.",
  "dm.floods.failedTitle": "Não foi possível acessar a API de impacto de enchentes do USGS",
  "dm.floods.failedBody":
    "Não foi possível obter os dados de enchentes agora. Consulte diretamente o waterdata.usgs.gov.",
  "dm.floods.noneTitle": "Nenhum local afetado por enchentes está ativo no momento",
  "dm.floods.noneBody":
    "Nenhum local de referência do USGS com enchente no momento foi informado em {state}.",
  "dm.shelters.title": "Abrigos designados próximos",
  "dm.shelters.subtitle":
    "A menos de 25 milhas (cerca de 40 km) de {place} · Fonte: FEMA / Cruz Vermelha Americana (HIFLD)",
  "dm.shelters.caveat":
    "Esta camada não deve ser usada para determinar o status operacional de uma instalação durante uma emergência em andamento. — FEMA/HIFLD",
  "dm.shelters.failedTitle": "Não foi possível acessar o serviço de instalações de abrigo",
  "dm.shelters.failedBody": "Não foi possível obter os dados de abrigos agora.",
  "dm.shelters.noneTitle": "Nenhum abrigo designado encontrado no raio de busca",
  "dm.shelters.capacity": "Capacidade de evacuação (designada): {count}",
  "dm.fires.title": "Detecções de incêndios ativos",
  "dm.fires.subtitle": "A ~1° de {place} · Fonte: NASA FIRMS (satélite VIIRS), últimas 24 horas",
  "dm.fires.caveat":
    "São anomalias térmicas detectadas por satélite (temperatura de superfície elevada), não incêndios florestais confirmados. Queimadas agrícolas e outras fontes de calor também podem aparecer aqui. — NASA FIRMS",
  "dm.fires.notConfiguredTitle": "Dados de detecção de incêndios não configurados",
  "dm.fires.notConfiguredBody":
    "Defina NASA_FIRMS_MAP_KEY nas variáveis de ambiente deste aplicativo para ativar esta seção.",
  "dm.fires.failedTitle": "Não foi possível acessar o NASA FIRMS",
  "dm.fires.failedBody": "Não foi possível obter os dados de detecção de incêndios agora.",
  "dm.fires.noneTitle": "Nenhuma detecção de incêndio no raio de busca",
  "dm.fires.noneBody":
    "Nenhuma anomalia térmica detectada por satélite perto de {place} nas últimas 24 horas.",
  "dm.fires.lineDay": "Confiança: {confidence} · Detecção diurna · Satélite: {satellite}",
  "dm.fires.lineNight": "Confiança: {confidence} · Detecção noturna · Satélite: {satellite}",
  "dm.fires.unknown": "não informado",
  "dm.fires.detected": "Detectado em {when} UTC",
  "dm.fires.frp": "Potência radiativa do fogo: {value} MW",
  "dm.fire.day": "Dia",
  "dm.fire.night": "Noite",
  "dm.map.kind.flood": "Local afetado por enchente",
  "dm.map.kind.shelter": "Abrigo designado",
  "dm.map.kind.fire": "Detecção de incêndio",
  "dm.map.layer.flood": "Locais afetados por enchentes ({count})",
  "dm.map.layer.shelter": "Abrigos designados ({count})",
  "dm.map.layer.fire": "Detecções de incêndios ({count})",
  "dm.map.popup": "{name} — {kind}",
  "dm.map.desc.none": "Não há dados de enchentes, abrigos ou incêndios para mostrar no mapa.",
  "dm.map.desc.allHidden": "Todas as camadas de perigos estão ocultas no momento.",
  "dm.map.desc.showing":
    "{count, plural, one {Mapa mostrando # local: {items}.} other {Mapa mostrando # locais: {items}.}}",
  "dm.map.item.flood":
    "{count, plural, one {# local afetado por enchente} other {# locais afetados por enchentes}}",
  "dm.map.item.shelter": "{count, plural, one {# abrigo designado} other {# abrigos designados}}",
  "dm.map.item.fire":
    "{count, plural, one {# detecção de incêndio} other {# detecções de incêndios}}",
  "dm.map.fallback.flood": "Local com enchente no momento, segundo a última verificação do USGS.",
  "dm.map.fallback.shelter": "Instalação de abrigo designada (apenas local de referência).",
  "dm.map.fireName": "Detecção de incêndio (confiança: {confidence})",
  "dm.map.fireSummary":
    "Anomalia térmica, {satellite}, {date} ({dayNight}). Não é um incêndio florestal confirmado.",

  // ---- Payment history, receipts and refunds (v111)
  "billing.history.title": "Histórico de pagamentos",
  "billing.history.unavailable":
    "Não foi possível carregar seu histórico de pagamentos agora. Tente novamente em instantes.",
  "billing.history.receipt": "Recibo",
  "billing.history.receiptAria": "Recibo do pagamento de {amount} em {date}",
  "billing.history.recentOnly": "Mostrando seus {count} pagamentos mais recentes.",
  "billing.history.note":
    "A Paystack também pode enviar por e-mail o próprio recibo de cada pagamento.",
  "billing.history.itemOther": "Pagamento",
  "billing.refund.inProgress": "Reembolso em andamento",
  "billing.refund.processed": "Reembolso processado",
  "billing.refund.failed": "O reembolso não foi concluído",
  "billing.receipt.title": "Recibo de pagamento",
  "billing.receipt.issuedBy": "Emitido por",
  "billing.receipt.account": "Conta",
  "billing.receipt.datePaid": "Data do pagamento",
  "billing.receipt.reference": "Referência do pagamento",
  "billing.receipt.item": "Item",
  "billing.receipt.itemPlan": "Assinatura do plano {plan}",
  "billing.receipt.itemOther": "Pagamento à World Vitality",
  "billing.receipt.amount": "Valor pago",
  "billing.receipt.method": "Pago por meio de",
  "billing.receipt.refundInProgress": "Um reembolso deste pagamento está em andamento.",
  "billing.receipt.refundProcessed": "Um reembolso deste pagamento foi processado.",
  "billing.receipt.refundFailed": "Um reembolso deste pagamento não foi concluído.",
  "billing.receipt.notInvoice":
    "Este documento é um comprovante do seu pagamento. Não é uma nota fiscal.",
  "billing.receipt.print": "Imprimir ou salvar como PDF",
  "billing.receipt.back": "Voltar para Plano e cobrança",

  // ---- Team page, plan limits and plan notices (v108)
  "team.title": "Equipe — {workspace}",
  "team.intro": "Convide pessoas para este espaço de trabalho e gerencie o acesso delas.",
  "team.denied.body":
    "Este papel não tem permissão para gerenciar os membros da equipe deste espaço de trabalho.",
  "team.invite.title": "Convidar alguém",
  "team.email": "E-mail",
  "team.role": "Papel",
  "team.invite.send": "Enviar convite",
  "team.invite.sent": "Convite enviado para {email}.",
  "team.invite.scope":
    "Limitar a recursos específicos (opcional: deixe desmarcado para acesso a todo o espaço de trabalho):",
  "team.you": "(você)",
  "team.youOwner": "(você · proprietário)",
  "team.owner": "(proprietário)",
  "team.remove": "Remover",
  "team.empty.title": "Ainda não há membros",
  "team.empty.body": "Convide alguém acima para começar.",
  "team.err.email": "Informe um endereço de e-mail válido.",
  "team.err.role": "Escolha um papel válido.",
  "team.err.noInvite": "Você não tem permissão para convidar pessoas para este espaço de trabalho.",
  "team.err.inviteFailed": "Não foi possível enviar o convite. Tente novamente.",
  "team.err.noRemove": "Você não tem permissão para remover pessoas deste espaço de trabalho.",
  "team.err.removeFailed": "Não foi possível remover o membro.",
  "team.err.ownerCannotBeRemoved": "O proprietário da organização não pode ser removido.",
  "team.err.lastAdmin":
    "Você não pode remover o último proprietário ou administrador deste espaço de trabalho.",
  "billing.limit.reached.seats":
    "Seu plano {plan} inclui até {limit, plural, one {# pessoa} other {# pessoas}}. Faça upgrade do plano para adicionar mais.",
  "billing.limit.reached.savedItems":
    "Seu plano {plan} inclui até {limit, plural, one {# item salvo} other {# itens salvos}} (campos, propriedades seguradas e locais monitorados são contados juntos). Faça upgrade do plano para adicionar mais.",
  "billing.limit.reached.workspaces":
    "Seu plano {plan} inclui até {limit, plural, one {# espaço de trabalho} other {# espaços de trabalho}}. Faça upgrade do plano para adicionar mais.",
  "billing.feature.included":
    "O recurso «{name}» está incluído no plano {lowest} e nos superiores. Seu plano é {plan}.",
  "billing.feature.includedMany":
    "O recurso «{name}» está incluído no plano {lowest} e nos superiores. Seu plano é {plan}.",
  "billing.feature.notPart": "O recurso «{name}» não faz parte do plano {plan}.",
  "billing.feature.notPartMany": "O recurso «{name}» não faz parte do plano {plan}.",
  "billing.feature.name.forecastOutlooks": "Previsões",
  "billing.feature.name.csvExport": "Exportação em CSV",
  "billing.feature.name.printReport": "Impressão e exportação em PDF",
  "billing.feature.name.auditableReport": "Relatório auditável",
  "billing.feature.name.teamTools": "Ferramentas de equipe",
  "billing.feature.name.emailAlerts": "Alertas por e-mail",
  "billing.feature.name.smsAlerts": "Alertas por SMS",
  "billing.feature.name.auditLog": "Registro de auditoria",
  "billing.feature.name.bulkExport": "Exportação em massa",
  "billing.feature.name.apiAccess": "Acesso à API",
  "billing.feature.name.integrations": "Integrações",
  "billing.feature.name.sso": "Login único",

  // ---- Team page — members without a profile (v108)
  "team.noProfile": "(perfil não encontrado)",

  // ---- Failed-payment notice (v109)
  "notifications.msg.paymentFailed.title": "Seu pagamento não foi concluído",
  "notifications.msg.paymentFailed.body":
    "Não conseguimos renovar o seu plano {plan}. Atualize seu cartão para mantê-lo.",

  // ---- Refund notice (v111)
  "notifications.msg.paymentRefunded.title": "Seu reembolso foi processado",
  "notifications.msg.paymentRefunded.body":
    "Processamos um reembolso do seu pagamento do plano {plan}. Pode levar alguns dias para aparecer na sua conta. Um reembolso não altera seu plano; para interromper as renovações, cancele em Plano e cobrança.",
  "notifications.msg.paymentRefunded.bodyNoPlan":
    "Processamos um reembolso do seu pagamento. Pode levar alguns dias para aparecer na sua conta. Um reembolso não altera seu plano; para interromper as renovações, cancele em Plano e cobrança.",

  // ---- Hand over ownership of the organisation (v105)
  "settings.org.transfer.title": "Transferir a propriedade",
  "settings.org.transfer.intro":
    "Passe sua organização para outra pessoa que já faça parte dela. Ela se torna a proprietária e assume o plano e a equipe; você continua como administrador até que ela remova você.",
  "settings.org.transfer.selectLabel": "Novo proprietário",
  "settings.org.transfer.selectPlaceholder": "Escolha uma pessoa",
  "settings.org.transfer.start": "Transferir a propriedade…",
  "settings.org.transfer.confirm":
    "Tornar {email} o proprietário da sua organização? Essa pessoa vai controlar o plano, a equipe e tudo o que está salvo nela. Você continua como administrador, mas ela pode remover você, e só ela pode devolver a organização.",
  "settings.org.transfer.yes": "Sim, transferir",
  "settings.org.transfer.done":
    "{email} agora é o proprietário da sua organização. Você é administrador.",
  "errors.orgTransferOwnerOnly": "Somente o proprietário da organização pode transferi-la.",
  "errors.orgTransferNotMember":
    "Essa pessoa não faz parte da sua organização, então não é possível passá-la a ela.",
  "errors.orgTransferPaidPlan":
    "Sua organização está no plano {plan}, que pertence ao proprietário e ainda não pode ser passado a outra pessoa. Você poderá transferi-la quando o plano terminar.",
  "errors.orgTransferFailed":
    "Não foi possível transferir sua organização. Nada foi alterado. Tente novamente.",

  // ---- Ownership-received notice (v105)
  "notifications.msg.ownershipReceived.title": "{who} tornou você o proprietário de {organisation}",
  "notifications.msg.ownershipReceived.body":
    "Agora você gerencia o plano e a equipe dela. Abra Configurações para ver as pessoas que fazem parte dela.",

  // ---- Landing page (v106)
  "landing.tagline": "Inteligência ambiental em tempo real, explicada com clareza.",
  "landing.explore": "Explorar o planeta",
  "landing.signIn": "Entrar",
  "landing.appsPrompt": "Prefere um app?",
  "landing.appsLink": "Baixar o app para computador ou Android",

  // ---- Sign-in, forgot-password and reset-password pages (v106)
  "auth.signIn.title": "Entrar",
  "auth.signUp.title": "Crie sua conta",
  "auth.accountDeleted": "Sua conta foi excluída.",
  "auth.resetSuccess": "Sua senha foi atualizada. Entre novamente.",
  "auth.inAppNote":
    "Neste app, entre com seu e-mail e sua senha. Se você costuma entrar com o Google, use “Esqueceu a senha?” para escolher primeiro uma senha.",
  "auth.google": "Continuar com o Google",
  "auth.or": "ou",
  "auth.email": "Endereço de e-mail",
  "auth.password": "Senha",
  "auth.forgotLink": "Esqueceu a senha?",
  "auth.remember": "Lembrar de mim neste dispositivo",
  "auth.signInButton": "Entrar",
  "auth.signUpButton": "Criar conta",
  "auth.haveAccount": "Já tem uma conta?",
  "auth.newHere": "Primeira vez aqui?",
  "auth.createLink": "Criar uma conta",
  "auth.callback.missingToken": "Esse link de acesso parece incompleto. Solicite um novo.",
  "auth.callback.verificationFailed":
    "Esse link de acesso expirou ou já foi usado. Solicite um novo.",
  "auth.callback.oauthFailed": "Não foi possível entrar com o Google. Tente novamente.",
  "auth.callback.oauthNotConfigured":
    "O acesso com o Google ainda não está configurado neste site. Por enquanto, use o e-mail.",
  "auth.callback.generic": "Algo deu errado. Solicite um novo link de acesso.",
  "auth.forgot.title": "Redefina sua senha",
  "auth.forgot.sent":
    "Verifique seu e-mail: se existir uma conta para {email}, enviamos um link para redefinir sua senha.",
  "auth.forgot.intro":
    "Informe o e-mail da sua conta e enviaremos um link para você criar uma nova senha.",
  "auth.forgot.send": "Enviar link",
  "auth.backToSignIn": "Voltar para entrar",
  "auth.reset.title": "Crie uma nova senha",
  "auth.reset.newPassword": "Nova senha",
  "auth.reset.confirm": "Confirme a nova senha",
  "auth.reset.submit": "Atualizar senha",
  "auth.reset.requestNew": "Solicitar um novo link",
  "auth.strength.veryWeak": "Muito fraca",
  "auth.strength.weak": "Fraca",
  "auth.strength.fair": "Razoável",
  "auth.strength.strong": "Forte",
  "auth.strength.veryStrong": "Muito forte",
  "auth.strength.aria": "Força da senha: {label}",
  "auth.err.invalidEmail": "Informe um e-mail válido.",
  "auth.err.sendLink": "Algo deu errado ao enviar o link. Tente novamente.",
  "auth.err.shortPassword": "A senha deve ter pelo menos 8 caracteres.",
  "auth.err.breached":
    "Esta senha já apareceu em um vazamento de dados conhecido. Escolha outra senha.",
  "auth.err.signUpFailed":
    "Não foi possível criar sua conta. Talvez seja preciso confirmar seu e-mail primeiro; se não, tente novamente.",
  "auth.err.enterBoth": "Informe seu e-mail e sua senha.",
  "auth.err.lockedIp":
    "Muitas tentativas malsucedidas a partir desta rede. Tente novamente em alguns minutos.",
  "auth.err.locked": "Muitas tentativas malsucedidas. Tente novamente em alguns minutos.",
  "auth.err.invalid": "E-mail ou senha inválidos.",
  "auth.err.resetRateLimited":
    "Muitas solicitações de redefinição para este e-mail. Tente novamente em alguns minutos.",
  "auth.err.resetExpired": "O link para redefinir sua senha expirou. Solicite um novo.",
  "auth.err.updateFailed": "Não foi possível atualizar sua senha. Tente novamente.",
  "auth.err.mismatch": "As senhas não coincidem.",

  // ---- public Explorer and the Globe
  "explore.title": "Explore o seu planeta",
  "explore.intro":
    "Busque qualquer lugar da Terra e veja um retrato real e honesto das condições atuais, sem precisar de conta.",
  "explore.placeLabel": "Nome do lugar",
  "explore.placePlaceholder": "Tente uma cidade, um povoado ou uma região…",
  "explore.submit": "Explorar",
  "explore.searching": "Buscando…",
  "explore.empty.title": "Nenhum lugar explorado ainda",
  "explore.empty.body": "Busque um lugar acima para ver algo verdadeiro sobre ele.",
  "explore.aiPanel.emptyTitle": "Nada para interpretar ainda",
  "explore.aiPanel.emptyBody": "Busque um lugar para ver uma análise gerada por IA sobre ele.",
  "explore.err.enterPlace": "Digite o nome de um lugar para explorar.",
  "explore.err.lookupFailed": "Não foi possível buscar esse lugar agora. Tente novamente.",
  "explore.err.invalidLink": "Esse link de lugar não é válido. Tente buscá-lo novamente.",
  "explore.err.dataFailed":
    "Encontramos esse lugar, mas não foi possível obter os dados ambientais dele agora. Tente novamente em instantes.",
  "globe.title": "O globo",
  "globe.summary":
    "{count, plural, one {# local} other {# locais}} em todos os espaços de trabalho aos quais você tem acesso: campos agrícolas, imóveis segurados e locais monitorados. O detalhe de perigos e situação fica em cada espaço de trabalho; esta é uma visão geral, não uma substituição.",
  "globe.loading": "Carregando o globo…",
  "globe.empty.title": "Nenhum local para mostrar",
  "globe.empty.body":
    "Nada a que você tem acesso em Agricultura, Seguros ou Governo e ONGs tem um local ainda.",
  "globe.fireDetection": "Detecção de fogo (confiança: {confidence})",

  // ---- browser-tab title
  "welcome.pageTitle": "Boas-vindas",

  // ---- Globe: instant map and live hazard layers
  "globe.live.loading": "A carregar as camadas em direto de inundações e abrigos…",
  "globe.live.count":
    "{count, plural, one {# ponto em direto de inundação ou abrigo} other {# pontos em direto de inundações e abrigos}} de fontes públicas.",
  "globe.live.none": "Não há pontos em direto de inundações ou abrigos para mostrar agora.",
  "globe.live.partial":
    "Algumas camadas em direto não puderam ser carregadas agora, por isso isto pode estar incompleto.",
  "globe.live.failed":
    "Não foi possível carregar as camadas de perigos em direto agora. Os seus próprios locais são mostrados.",
  "globe.preview.loading3d":
    "A carregar o globo 3D… o mapa plano já está ativo. Selecione um ponto para o abrir.",
  "globe.preview.no3d":
    "O globo 3D não funciona neste navegador, por isso é mostrado o mapa plano. Cada ponto abre a mesma página.",

  // ---- Globe: worldwide fire detections, public cameras and the details panel
  "globe.watch.loading":
    "A carregar deteções de incêndios por satélite e câmaras públicas de todo o mundo…",
  "globe.watch.summary":
    "{fires, plural, one {# zona de deteção de calor por satélite} other {# zonas de deteção de calor por satélite}} e {cameras, plural, one {# câmara pública} other {# câmaras públicas}} apresentadas. Selecione um ponto para o abrir.",
  "globe.watch.capped": "A mostrar as {shown} zonas mais intensas de {total} em todo o mundo.",
  "globe.watch.none":
    "Não há deteções de incêndios por satélite nem câmaras públicas para mostrar agora.",
  "globe.watch.firesNotConfigured":
    "As deteções de incêndios por satélite ainda não estão ativadas nesta aplicação.",
  "globe.watch.partial":
    "Algumas fontes de incêndios ou câmaras não puderam ser carregadas agora, por isso isto pode estar incompleto.",
  "globe.watch.failed": "Não foi possível carregar agora as deteções de incêndios nem as câmaras.",
  "globe.legend.fire": "Deteção de calor por satélite",
  "globe.legend.camera": "Câmara pública",
  "globe.marker.fire": "Deteção de calor por satélite em {latitude}, {longitude}",
  "globe.marker.camera": "Câmara pública: {name}",
  "globe.panel.label": "Detalhes",
  "globe.panel.close": "Fechar",
  "globe.panel.back": "Voltar à deteção de calor",
  "globe.panel.fire.title": "Deteção de calor por satélite",
  "globe.panel.fire.what":
    "Um satélite viu aqui um ponto com calor invulgar. Pode ser um incêndio florestal, mas também uma queima agrícola, um queimador de gás ou uma fábrica. Não é um incêndio confirmado.",
  "globe.panel.fire.detections": "{count, plural, one {# deteção} other {# deteções}} nesta zona",
  "globe.panel.fire.power": "Maior emissão de calor: {frp} MW",
  "globe.panel.fire.confidenceHigh": "Confiança do satélite: alta",
  "globe.panel.fire.confidenceNominal": "Confiança do satélite: média",
  "globe.panel.fire.latest": "Última passagem do satélite: {when}",
  "globe.panel.fire.position": "Localização: {latitude}, {longitude}",
  "globe.panel.cameras.title": "Câmaras públicas próximas",
  "globe.panel.cameras.none":
    "Nenhuma câmara pública das fontes desta aplicação está a menos de 25 km. Só existem câmaras na Califórnia, Nova Gales do Sul, Colúmbia Britânica, Londres e Finlândia.",
  "globe.panel.cameras.unavailable":
    "Não foi possível carregar agora as imagens das câmaras, por isso as câmaras próximas não são listadas.",
  "globe.panel.camera.title": "Câmara pública",
  "globe.panel.camera.distance": "A {distance} km da deteção, rumo a {direction}",
  "globe.panel.camera.source": "Imagem de {provider}",
  "globe.panel.camera.licence": "Licença: {licence}",
  "globe.panel.camera.refresh":
    "{minutes, plural, one {Atualiza aproximadamente a cada # minuto} other {Atualiza aproximadamente a cada # minutos}}",
  "globe.panel.camera.stillNote":
    "É uma imagem fixa que pode ter vários minutos, não vídeo em direto, e pode não mostrar o incêndio.",
  "globe.panel.camera.unavailable":
    "Não foi possível carregar esta imagem. A câmara pode estar offline.",
  "globe.panel.camera.alt": "Última imagem da câmara {name}",
  "globe.panel.camera.reload": "Recarregar imagem",
  "globe.panel.camera.loadedAt":
    "Carregada às {time} (seu horário). O relógio impresso na imagem mostra o horário local da câmera, que pode ser diferente.",
  "globe.panel.look.title": "Ver o local",
  "globe.panel.look.satellite": "Vista de satélite no Google Maps",
  "globe.panel.look.street": "Street View no Google Maps",
  "globe.panel.look.note":
    "Abre o Google Maps em uma nova aba. As imagens de satélite e do Street View são fotos armazenadas de datas anteriores, não vídeo ao vivo. Mostram como o local é, não se ele está pegando fogo agora.",
  "globe.panel.emergency.title": "Vê um incêndio real?",
  "globe.panel.emergency.callSpecific": "Ligue para os bombeiros: {number}",
  "globe.panel.emergency.callGeneral": "Ligue para os serviços de emergência: {number}",
  "globe.panel.emergency.advice":
    "Ligue apenas se acreditar que existe um incêndio real e atual. Um ponto de satélite ou uma imagem de câmara, por si só, podem estar errados ou desatualizados. Diga ao operador onde é e o que vê. Esta aplicação não é um alerta oficial e não substitui os serviços de emergência.",
  "globe.panel.emergency.general":
    "O 112 funciona na maioria dos telemóveis na maioria dos países. Se souber o número de emergência local, use esse.",
  "globe.compass.n": "norte",
  "globe.compass.ne": "nordeste",
  "globe.compass.e": "este",
  "globe.compass.se": "sudeste",
  "globe.compass.s": "sul",
  "globe.compass.sw": "sudoeste",
  "globe.compass.w": "oeste",
  "globe.compass.nw": "noroeste",
};
