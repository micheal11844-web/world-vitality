import type { Translator } from "./translator-core.js";

/**
 * The strings for the shared app chrome (header, sidebar, search box,
 * notification bell, AI panel), in the shape `@world-vitality/ui-components`
 * expects from its `UiStringsProvider`. The shape is stated structurally
 * here — rather than imported — so neither package depends on the other;
 * the host app passes this straight to the provider and the compiler
 * checks the two still agree.
 */
export interface ChromeStrings {
  dir: "ltr" | "rtl";
  locale: string;
  listSeparator: string;
  formatNumber: (value: number) => string;
  /** "5 minutes ago" for an ISO timestamp, in this language. */
  formatRelativeTime: (iso: string) => string;
  viewGlobe: string;
  settings: string;
  signOut: string;
  sidebar: {
    primary: string;
    expand: string;
    collapse: string;
    expandItem: (item: string) => string;
    collapseItem: (item: string) => string;
  };
  aiPanel: { open: string; collapse: string; region: string; title: string };
  search: {
    label: string;
    placeholder: string;
    hint: string;
    suggestions: string;
    noQuickMatches: (query: string) => string;
    pressEnter: (query: string) => string;
    kind: { workspace: string; page: string; setting: string; tool: string; place: string };
  };
  bell: {
    label: string;
    unread: (count: number) => string;
    critical: (count: number) => string;
  };
  tutorial: {
    step: (current: number, total: number) => string;
    skip: string;
    back: string;
    next: string;
    getStarted: string;
  };
  nav: {
    menu: string;
    closeMenu: string;
    quickNav: string;
    home: string;
    map: string;
    alerts: string;
    search: string;
    ai: string;
  };
  /** The note shown while offline or viewing a copy saved on this device. */
  offline: {
    offline: string;
    savedCopy: (ago: string) => string;
    reload: string;
  };
}

export function buildChromeStrings(translator: Translator): ChromeStrings {
  const { t } = translator;
  return {
    dir: translator.dir,
    locale: translator.locale,
    listSeparator: t("common.listSeparator"),
    formatNumber: translator.number,
    formatRelativeTime: (iso) => translator.relativeTime(iso),
    viewGlobe: t("chrome.viewGlobe"),
    settings: t("chrome.settings"),
    signOut: t("chrome.signOut"),
    sidebar: {
      primary: t("chrome.sidebar.primary"),
      expand: t("chrome.sidebar.expand"),
      collapse: t("chrome.sidebar.collapse"),
      expandItem: (item) => t("chrome.sidebar.expandItem", { item }),
      collapseItem: (item) => t("chrome.sidebar.collapseItem", { item }),
    },
    aiPanel: {
      open: t("chrome.aiPanel.open"),
      collapse: t("chrome.aiPanel.collapse"),
      region: t("chrome.aiPanel.region"),
      title: t("chrome.aiPanel.title"),
    },
    search: {
      label: t("chrome.search.label"),
      placeholder: t("chrome.search.placeholder"),
      hint: t("chrome.search.hint"),
      suggestions: t("chrome.search.suggestions"),
      noQuickMatches: (query) => t("chrome.search.noQuickMatches", { query }),
      pressEnter: (query) => t("chrome.search.pressEnter", { query }),
      kind: {
        workspace: t("chrome.search.kind.workspace"),
        page: t("chrome.search.kind.page"),
        setting: t("chrome.search.kind.setting"),
        tool: t("chrome.search.kind.tool"),
        place: t("chrome.search.kind.place"),
      },
    },
    bell: {
      label: t("chrome.bell.label"),
      unread: (count) => t("chrome.bell.unread", { count }),
      critical: (count) => t("chrome.bell.critical", { count }),
    },
    tutorial: {
      step: (current, total) => t("chrome.tutorial.step", { current, total }),
      skip: t("chrome.tutorial.skip"),
      back: t("chrome.tutorial.back"),
      next: t("chrome.tutorial.next"),
      getStarted: t("chrome.tutorial.getStarted"),
    },
    nav: {
      menu: t("chrome.nav.menu"),
      closeMenu: t("chrome.nav.closeMenu"),
      quickNav: t("chrome.nav.quickNav"),
      home: t("chrome.nav.home"),
      map: t("chrome.nav.map"),
      alerts: t("chrome.nav.alerts"),
      search: t("chrome.nav.search"),
      ai: t("chrome.nav.ai"),
    },
    offline: {
      offline: t("chrome.offline.offline"),
      savedCopy: (ago) => t("chrome.offline.savedCopy", { ago }),
      reload: t("chrome.offline.reload"),
    },
  };
}
