import type { SearchEntry } from "@world-vitality/ui-components";
import { createTranslator, type LocaleCode, type Translate } from "@world-vitality/i18n";
import { WORKSPACE_LINKS, subLinkLabel, workspaceLabel } from "../app/workspaces/workspace-nav";

/**
 * The searchable map of the app (PRD B.4's "data-topic queries"),
 * built from the same `WORKSPACE_LINKS` the sidebar uses — so a page
 * that exists in the nav is searchable, and search can never link to a
 * page the sidebar doesn't know about — plus a few app-level
 * destinations.
 *
 * Keywords are hand-written: they're the words people would actually
 * type for each destination ("flood" → Disaster Monitoring). That's
 * deliberate and honest — this is keyword matching over a small, known
 * set of pages, not semantic search. Add a word here when you notice
 * people (or the maintainer) searching for something that should have
 * matched.
 *
 * Search only *links*; every destination keeps its own access gate, so
 * a signed-out visitor who follows a workspace result lands on the
 * login page, exactly as clicking the same item in the sidebar does.
 */
const WORKSPACE_KEYWORDS: Record<string, { description: string; keywords: string[] }> = {
  agriculture: {
    description: "Fields, soil moisture and crop conditions",
    keywords: [
      "crop",
      "crops",
      "farm",
      "farming",
      "field",
      "soil",
      "moisture",
      "irrigation",
      "planting",
      "harvest",
      "drought",
      "yield",
      "farmer",
    ],
  },
  weather: {
    description: "Current conditions and the forecast",
    keywords: [
      "weather",
      "climate",
      "temperature",
      "forecast",
      "heat",
      "cold",
      "rain",
      "wind",
      "conditions",
      "hot",
      "temperature",
    ],
  },
  construction: {
    description: "Site risk for pours, cranes and roofing",
    keywords: [
      "construction",
      "site",
      "concrete",
      "crane",
      "roofing",
      "building",
      "builder",
      "pour",
      "safety",
      "wind",
    ],
  },
  "renewable-energy": {
    description: "Wind and solar generation outlook",
    keywords: [
      "solar",
      "wind",
      "turbine",
      "energy",
      "renewable",
      "generation",
      "power",
      "electricity",
      "clean",
    ],
  },
  research: {
    description: "Raw datasets and an explorer for analysts",
    keywords: [
      "research",
      "dataset",
      "datasets",
      "data",
      "science",
      "scientist",
      "analysis",
      "nasa",
      "csv",
      "researcher",
    ],
  },
  logistics: {
    description: "Weather risk along shipping routes",
    keywords: [
      "shipping",
      "route",
      "routes",
      "logistics",
      "freight",
      "port",
      "ports",
      "transport",
      "delivery",
      "cargo",
      "road",
      "fleet",
    ],
  },
  "disaster-monitoring": {
    description: "Active alerts, hazards and shelters",
    keywords: [
      "disaster",
      "alert",
      "alerts",
      "flood",
      "flooding",
      "wildfire",
      "fire",
      "earthquake",
      "storm",
      "hurricane",
      "emergency",
      "shelter",
      "shelters",
      "warning",
      "hazard",
    ],
  },
  "government-ngos": {
    description: "Jurisdiction overview and formal reports",
    keywords: [
      "government",
      "ngo",
      "ngos",
      "jurisdiction",
      "humanitarian",
      "policy",
      "public",
      "municipal",
      "relief",
      "aid",
    ],
  },
  insurance: {
    description: "Underwriting context with an audit trail",
    keywords: [
      "insurance",
      "insurer",
      "underwriting",
      "risk",
      "claim",
      "claims",
      "audit",
      "premium",
      "portfolio",
    ],
  },
  education: {
    description: "Explain environmental data and plan lessons",
    keywords: [
      "education",
      "school",
      "schools",
      "classroom",
      "teacher",
      "teaching",
      "lesson",
      "student",
      "students",
      "learn",
      "explain",
      "class",
    ],
  },
};

const SUB_PAGE_KEYWORDS: Record<string, string[]> = {
  home: [],
  map: ["map", "maps", "location", "locations", "markers", "pins"],
  report: ["report", "reports", "print", "pdf", "export", "audit"],
  "lesson-plan": ["lesson", "plan", "teaching", "class", "curriculum"],
  team: [
    "team",
    "members",
    "invite",
    "teammate",
    "teammates",
    "colleagues",
    "roles",
    "permissions",
    "access",
    "collaborators",
  ],
};

/**
 * App-level destinations. Labels and descriptions come from the
 * catalog (`searchIndex.*`) so they read in the searcher's language;
 * the keywords stay English on purpose and are matched in every language
 * (see `buildSearchIndex`).
 */
function appEntries(t: Translate): SearchEntry[] {
  return [
    {
      id: "app-dashboard",
      kind: "page",
      label: t("searchIndex.dashboard.label"),
      description: t("searchIndex.dashboard.description"),
      href: "/dashboard",
      keywords: ["home", "dashboard", "overview", "my workspaces", "start"],
    },
    {
      id: "app-explore",
      kind: "tool",
      label: t("searchIndex.explorer.label"),
      description: t("searchIndex.explorer.description"),
      href: "/explore",
      keywords: [
        "explore",
        "explorer",
        "place",
        "city",
        "town",
        "location",
        "anywhere",
        "public",
        "lookup",
      ],
    },
    {
      id: "app-globe",
      kind: "tool",
      label: t("searchIndex.globe.label"),
      description: t("searchIndex.globe.description"),
      href: "/globe",
      keywords: ["globe", "earth", "planet", "3d", "world", "satellite"],
    },
    {
      id: "app-notifications",
      kind: "page",
      label: t("searchIndex.notifications.label"),
      description: t("searchIndex.notifications.description"),
      href: "/notifications",
      keywords: [
        "notifications",
        "notification",
        "alerts",
        "alert",
        "inbox",
        "warnings",
        "warning",
        "bell",
        "unread",
        "emergency",
      ],
    },
    {
      id: "app-settings-notifications",
      kind: "setting",
      label: t("searchIndex.notificationPrefs.label"),
      description: t("searchIndex.notificationPrefs.description"),
      href: "/settings#notifications",
      keywords: [
        "notification",
        "notifications",
        "preferences",
        "alerts",
        "mute",
        "quiet",
        "email",
      ],
    },
    {
      id: "app-settings-language",
      kind: "setting",
      label: t("settings.language.title"),
      description: t("settings.language.label"),
      href: "/settings#language",
      keywords: [
        "language",
        "languages",
        "translate",
        "translation",
        "spanish",
        "french",
        "portuguese",
        "arabic",
        "english",
        "idioma",
        "langue",
        "língua",
      ],
    },
    {
      id: "app-settings",
      kind: "setting",
      label: t("searchIndex.settings.label"),
      description: t("searchIndex.settings.description"),
      href: "/settings",
      keywords: ["settings", "profile", "account", "display name", "name", "preferences", "me"],
    },
    {
      id: "app-settings-export",
      kind: "setting",
      label: t("searchIndex.export.label"),
      description: t("searchIndex.export.description"),
      href: "/settings#download-data",
      keywords: ["download", "export", "my data", "backup", "gdpr", "privacy", "copy"],
    },
    {
      id: "app-settings-delete",
      kind: "setting",
      label: t("searchIndex.delete.label"),
      description: t("searchIndex.delete.description"),
      href: "/settings#delete-account",
      keywords: ["delete", "remove", "close account", "deactivate", "erase", "privacy"],
    },
  ];
}

/**
 * Builds the full index. Cheap (~60 entries); called per request, not cached.
 *
 * Pass the searcher's language to get names and descriptions in it.
 * What is and isn't translated, stated plainly: *names and descriptions*
 * are (so "Agricultura" finds Agriculture), but the hand-written topic
 * *keywords* ("flood", "crop"…) stay English and are matched in every
 * language — they are synonyms, and translating them is content work
 * not done yet. English remains the default and is unchanged.
 */
export function buildSearchIndex(locale: LocaleCode = "en"): SearchEntry[] {
  const translator = createTranslator(locale);
  const t = translator.t;
  const translated = locale !== "en";
  const entries: SearchEntry[] = [];

  for (const workspace of WORKSPACE_LINKS) {
    const meta = WORKSPACE_KEYWORDS[workspace.key];
    entries.push({
      id: `ws-${workspace.key}`,
      kind: "workspace",
      label: workspaceLabel(workspace, translated ? t : undefined),
      description: translated
        ? t(`workspace.${workspace.key}.description` as Parameters<Translate>[0])
        : meta?.description,
      href: workspace.href,
      keywords: [...(meta?.keywords ?? []), workspace.key.replace(/-/g, " ")],
    });
    for (const sub of workspace.subLinks) {
      if (sub.key === "home") continue; // the workspace entry itself
      entries.push({
        id: `ws-${workspace.key}-${sub.key}`,
        kind: "page",
        label: `${workspaceLabel(workspace, translated ? t : undefined)} — ${subLinkLabel(workspace, sub, translated ? t : undefined)}`,
        description: undefined,
        href: sub.href,
        keywords: SUB_PAGE_KEYWORDS[sub.key] ?? [],
        // The workspace's topic words, weighted low: "flood map" finds
        // Disaster Monitoring — Map, but plain "flood" doesn't list every sub-page.
        inheritedKeywords: meta?.keywords ?? [],
      });
    }
  }

  return [...entries, ...appEntries(t)];
}
