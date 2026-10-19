"use client";

import { createContext, useContext, type ReactNode } from "react";

/** The kinds a search suggestion can be (mirrors `SearchSuggestion["kind"]`). */
export type SuggestionKind = "workspace" | "page" | "setting" | "tool" | "place";

/**
 * Every word the shared app chrome (header, sidebar, search box,
 * notification bell, AI panel) shows. Supplied by the host app through
 * `UiStringsProvider`, so this package can be fully translated without
 * depending on any particular i18n library — the host owns the catalogs
 * and the formatting rules (plurals, numerals); this package only
 * receives finished strings. With no provider, English is used, which
 * is also what every test in this package renders against.
 *
 * Parameterised messages are functions (not templates) because plural
 * rules differ per language and only the host knows them.
 */
export interface UiStrings {
  /** Reading direction of the current language — for glyphs that point somewhere. */
  dir: "ltr" | "rtl";
  /** BCP-47 language code, for number formatting. */
  locale: string;
  /** Joins parts of one spoken label ("Notifications, 3 unread"). */
  listSeparator: string;
  /** A count in the reader's numerals ("12" or "١٢"). */
  formatNumber: (value: number) => string;
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
    kind: Record<SuggestionKind, string>;
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
  /** The phone layout's menu button, drawer and bottom bar. */
  nav: {
    menu: string;
    closeMenu: string;
    /** Name of the bottom bar's navigation landmark. */
    quickNav: string;
    home: string;
    map: string;
    alerts: string;
    /** The magnifier that reveals the search row. */
    search: string;
    ai: string;
  };
}

export const DEFAULT_UI_STRINGS: UiStrings = {
  dir: "ltr",
  locale: "en",
  listSeparator: ", ",
  formatNumber: (value) => String(value),
  viewGlobe: "View the Globe",
  settings: "Settings",
  signOut: "Sign out",
  sidebar: {
    primary: "Primary",
    expand: "Expand sidebar (Ctrl+B)",
    collapse: "Collapse sidebar (Ctrl+B)",
    expandItem: (item) => `Expand ${item}`,
    collapseItem: (item) => `Collapse ${item}`,
  },
  aiPanel: {
    open: "Open AI panel",
    collapse: "Collapse AI panel",
    region: "AI assistant",
    title: "Assistant",
  },
  search: {
    label: "Search World Vitality",
    placeholder: "Search places, topics…",
    hint: "Search (press / to focus)",
    suggestions: "Search suggestions",
    noQuickMatches: (query) => `No quick matches — press Enter to search for “${query}”`,
    pressEnter: (query) => `Press Enter for all results for “${query}”`,
    kind: {
      workspace: "Workspace",
      page: "Page",
      setting: "Setting",
      tool: "Tool",
      place: "Place",
    },
  },
  bell: {
    label: "Notifications",
    unread: (count) => `${count} unread`,
    critical: (count) => `${count} critical`,
  },
  tutorial: {
    step: (current, total) => `Step ${current} of ${total}`,
    skip: "Skip",
    back: "Back",
    next: "Next",
    getStarted: "Get started",
  },
  nav: {
    menu: "Menu",
    closeMenu: "Close menu",
    quickNav: "Quick navigation",
    home: "Home",
    map: "Map",
    alerts: "Alerts",
    search: "Search",
    ai: "AI",
  },
};

const UiStringsContext = createContext<UiStrings>(DEFAULT_UI_STRINGS);

/** Supplies translated chrome strings to every shared component below it. */
export function UiStringsProvider({ value, children }: { value: UiStrings; children: ReactNode }) {
  return <UiStringsContext.Provider value={value}>{children}</UiStringsContext.Provider>;
}

export function useUiStrings(): UiStrings {
  return useContext(UiStringsContext);
}
