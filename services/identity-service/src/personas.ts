/**
 * Onboarding personas (PRD B.1): "the user states who they are and what
 * they care about (a farmer, a student, a researcher, 'just curious'),
 * and the platform routes them to the most relevant workspace."
 *
 * This is product content, not identity data, but it lives here —
 * beside `Role` and `UserPreferences` — because it is pure, framework-
 * free and needs unit tests, and `apps/web` has no test runner. Each
 * persona maps to exactly one destination, and to the one live
 * interpretation (`InsightKind`) used for the "real, personalized
 * insight within the first minute" — chosen from the interpretations
 * that really exist, not invented per persona.
 *
 * **Honest mapping.** Only four insight kinds exist as real
 * providers today (temperature, soil moisture, wind, construction
 * risk). Personas whose workspace has no provider of its own
 * (logistics, insurance, research, …) are shown current temperature
 * conditions for their place — a true statement about their place,
 * labelled as "current conditions", not dressed up as a
 * workspace-specific analysis the app can't yet do.
 */
export type InsightKind = "temperature" | "soil-moisture" | "wind" | "construction-risk";

export interface Persona {
  id: string;
  /** Short chip/card title. */
  label: string;
  /** One plain sentence, "I …" voice. */
  description: string;
  /** Matches a `WORKSPACE_LINKS` key in apps/web; `null` = Public Explorer. */
  workspaceKey: string | null;
  insight: InsightKind;
}

export const PERSONAS: readonly Persona[] = [
  {
    id: "farmer",
    label: "Farmer",
    description: "I grow crops or look after land.",
    workspaceKey: "agriculture",
    insight: "soil-moisture",
  },
  {
    id: "builder",
    label: "Builder",
    description: "I plan or run construction work.",
    workspaceKey: "construction",
    insight: "construction-risk",
  },
  {
    id: "energy",
    label: "Energy",
    description: "I work with wind or solar power.",
    workspaceKey: "renewable-energy",
    insight: "wind",
  },
  {
    id: "shipping",
    label: "Shipping",
    description: "I move goods by road, sea or air.",
    workspaceKey: "logistics",
    insight: "temperature",
  },
  {
    id: "responder",
    label: "Emergency response",
    description: "I watch for floods, fires and other hazards.",
    workspaceKey: "disaster-monitoring",
    insight: "temperature",
  },
  {
    id: "public-sector",
    label: "Government or NGO",
    description: "I serve a community, region or programme.",
    workspaceKey: "government-ngos",
    insight: "temperature",
  },
  {
    id: "insurer",
    label: "Insurer",
    description: "I assess or price environmental risk.",
    workspaceKey: "insurance",
    insight: "temperature",
  },
  {
    id: "researcher",
    label: "Researcher",
    description: "I analyse environmental data.",
    workspaceKey: "research",
    insight: "temperature",
  },
  {
    id: "learner",
    label: "Student or teacher",
    description: "I learn or teach with real data.",
    workspaceKey: "education",
    insight: "temperature",
  },
  {
    id: "weather",
    label: "Weather watcher",
    description: "I follow the weather and climate.",
    workspaceKey: "weather",
    insight: "temperature",
  },
  {
    id: "curious",
    label: "Just curious",
    description: "I want to look around the planet.",
    workspaceKey: null,
    insight: "temperature",
  },
];

export function isPersonaId(value: unknown): value is string {
  return typeof value === "string" && PERSONAS.some((p) => p.id === value);
}

export function personaById(id: string | null | undefined): Persona | null {
  if (!id) return null;
  return PERSONAS.find((p) => p.id === id) ?? null;
}

/** Where "take me there" goes: the persona's workspace, or Public Explorer. */
export function personaDestination(persona: Persona): string {
  return persona.workspaceKey ? `/workspaces/${persona.workspaceKey}` : "/explore";
}

/** A place the user chose as home. Coordinates are validated, never trusted. */
export interface HomePlace {
  name: string;
  region: string | null;
  country: string | null;
  latitude: number;
  longitude: number;
}

const MAX_PLACE_TEXT = 120;

function cleanText(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  if (!trimmed) return null;
  return trimmed.slice(0, MAX_PLACE_TEXT);
}

/**
 * Validates a home place from untrusted input (a Server Action
 * argument, which is a public endpoint). Returns `null` for anything
 * that isn't a complete, in-range place — never a half-valid object.
 */
export function parseHomePlace(input: unknown): HomePlace | null {
  if (typeof input !== "object" || input === null) return null;
  const raw = input as Record<string, unknown>;
  const name = cleanText(raw.name);
  const latitude = typeof raw.latitude === "number" ? raw.latitude : Number.NaN;
  const longitude = typeof raw.longitude === "number" ? raw.longitude : Number.NaN;
  if (!name) return null;
  if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) return null;
  if (latitude < -90 || latitude > 90 || longitude < -180 || longitude > 180) return null;
  return {
    name,
    region: cleanText(raw.region),
    country: cleanText(raw.country),
    latitude,
    longitude,
  };
}

/** "Paris, Texas, United States" — skips a part repeating the previous one. */
export function homePlaceLabel(place: HomePlace): string {
  const parts: string[] = [];
  for (const part of [place.name, place.region, place.country]) {
    if (part && part !== parts[parts.length - 1]) parts.push(part);
  }
  return parts.join(", ");
}
