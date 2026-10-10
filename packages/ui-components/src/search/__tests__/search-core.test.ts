import { test } from "node:test";
import assert from "node:assert/strict";
import {
  classifyQuery,
  extractPlaceCandidate,
  normalizeQuery,
  rankEntries,
  topicTokens,
  type SearchEntry,
} from "../search-core.js";

const ENTRIES: SearchEntry[] = [
  {
    id: "weather",
    kind: "workspace",
    label: "Weather & Climate",
    description: "Current conditions and forecasts",
    href: "/workspaces/weather",
    keywords: ["temperature", "forecast", "rain", "heat", "wind"],
  },
  {
    id: "disaster",
    kind: "workspace",
    label: "Disaster Monitoring",
    description: "Active alerts and shelters",
    href: "/workspaces/disaster-monitoring",
    keywords: ["flood", "wildfire", "earthquake", "alert", "emergency"],
  },
  {
    id: "logistics",
    kind: "workspace",
    label: "Logistics & Shipping",
    href: "/workspaces/logistics",
    keywords: ["cargo", "freight", "route", "port"],
  },
  {
    id: "agri-team",
    kind: "page",
    label: "Agriculture — Team",
    description: "Invite teammates and manage roles",
    href: "/workspaces/agriculture/team",
    keywords: ["invite", "teammate", "members", "roles", "soil moisture"],
  },
  {
    id: "settings",
    kind: "setting",
    label: "Settings",
    href: "/settings",
    keywords: ["profile", "display name", "account"],
  },
];

test("normalizeQuery lowercases, strips accents and punctuation", () => {
  assert.equal(normalizeQuery("  São   Paulo!! "), "sao paulo");
  assert.equal(normalizeQuery("What's the weather?"), "whats the weather");
});

test("topicTokens drops stopwords", () => {
  assert.deepEqual(topicTokens("will it rain in Lagos tomorrow?"), ["rain", "lagos"]);
});

test("classifyQuery recognises questions, keywords and empty input", () => {
  assert.equal(classifyQuery(""), "empty");
  assert.equal(classifyQuery("   "), "empty");
  assert.equal(classifyQuery("is it going to flood near me"), "question");
  assert.equal(classifyQuery("flood risk?"), "question");
  assert.equal(classifyQuery("how do I invite a teammate"), "question");
  // A bare question word, or a short keyword phrase, is not a question.
  assert.equal(classifyQuery("how"), "keywords");
  assert.equal(classifyQuery("flood"), "keywords");
  assert.equal(classifyQuery("soil moisture"), "keywords");
  assert.equal(classifyQuery("lagos"), "keywords");
});

test("extractPlaceCandidate pulls the place after the last preposition", () => {
  assert.equal(extractPlaceCandidate("is it going to flood near Lagos tomorrow?"), "Lagos");
  assert.equal(extractPlaceCandidate("will it rain in Paris, France today"), "Paris, France");
  assert.equal(extractPlaceCandidate("how hot is it in São Paulo right now?"), "São Paulo");
});

test("extractPlaceCandidate refuses to guess for 'near me' or no place", () => {
  assert.equal(extractPlaceCandidate("is it going to flood near me"), null);
  assert.equal(extractPlaceCandidate("is it going to flood near here?"), null);
  assert.equal(extractPlaceCandidate("what is soil moisture"), null);
  assert.equal(extractPlaceCandidate("flood in"), null);
  assert.equal(extractPlaceCandidate(""), null);
});

test("rankEntries finds a workspace by topic keyword", () => {
  const [top] = rankEntries(ENTRIES, "flood");
  assert.equal(top?.entry.id, "disaster");
});

test("rankEntries: exact label beats keyword matches", () => {
  const [top] = rankEntries(ENTRIES, "settings");
  assert.equal(top?.entry.id, "settings");
});

test("rankEntries matches on prefixes only for 3+ letter tokens", () => {
  assert.equal(rankEntries(ENTRIES, "carg")[0]?.entry.id, "logistics");
  // "ca" is too short to prefix-match keyword "cargo".
  assert.equal(
    rankEntries(ENTRIES, "ca").some((r) => r.entry.id === "logistics"),
    false,
  );
});

test("rankEntries handles multi-word phrases and question phrasing", () => {
  assert.equal(rankEntries(ENTRIES, "soil moisture")[0]?.entry.id, "agri-team");
  assert.equal(rankEntries(ENTRIES, "how do I invite a teammate?")[0]?.entry.id, "agri-team");
  assert.equal(rankEntries(ENTRIES, "will it rain in Lagos tomorrow?")[0]?.entry.id, "weather");
});

test("rankEntries returns nothing for unmatched or empty queries", () => {
  assert.deepEqual(rankEntries(ENTRIES, "zzzzqqq"), []);
  assert.deepEqual(rankEntries(ENTRIES, ""), []);
  assert.deepEqual(rankEntries(ENTRIES, "   "), []);
});

test("rankEntries is stable and respects the limit", () => {
  const same: SearchEntry[] = [1, 2, 3, 4].map((n) => ({
    id: `e${n}`,
    kind: "page",
    label: `Thing ${n}`,
    href: `/t/${n}`,
    keywords: ["widget"],
  }));
  const ranked = rankEntries(same, "widget", 3);
  assert.deepEqual(
    ranked.map((r) => r.entry.id),
    ["e1", "e2", "e3"],
  );
});

test("inherited keywords rank a sub-page below its workspace, and weak matches are cut", () => {
  const entries: SearchEntry[] = [
    {
      id: "ws",
      kind: "workspace",
      label: "Disaster Monitoring",
      href: "/ws",
      keywords: ["flood"],
    },
    {
      id: "ws-map",
      kind: "page",
      label: "Disaster Monitoring — Map",
      href: "/ws/map",
      keywords: ["map"],
      inheritedKeywords: ["flood"],
    },
    {
      id: "ws-team",
      kind: "page",
      label: "Disaster Monitoring — Team",
      href: "/ws/team",
      keywords: ["team"],
      inheritedKeywords: ["flood"],
    },
  ];
  // Plain "flood": only the workspace survives the 40% cutoff (15 vs 5).
  assert.deepEqual(
    rankEntries(entries, "flood").map((r) => r.entry.id),
    ["ws"],
  );
  // "flood map": the map page wins (inherited 5 + keyword 15 = 20 > 15).
  const ranked = rankEntries(entries, "flood map").map((r) => r.entry.id);
  assert.equal(ranked[0], "ws-map");
  assert.equal(ranked.includes("ws-team"), false);
});
