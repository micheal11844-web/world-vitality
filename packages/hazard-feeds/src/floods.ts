import { isUsableCoordinate } from "./cameras.js";

/**
 * Flood events from GDACS, the Global Disaster Alert and Coordination System run
 * by the UN (OCHA) and the European Commission. It is public and needs no key.
 *
 * **What these are, and are not.** Each event is an estimate from satellite and
 * river models (GloFAS, the Dartmouth Flood Observatory), not a report from the
 * ground and not an official warning for any street. The point is the middle of
 * a large area. Only large floods are listed; a flood that is not here can still
 * be real. The panel says all of this in the person's language.
 *
 * **Format.** Read from a real answer on 2026-11-13 (see the runbook): a GeoJSON
 * `FeatureCollection` whose features carry a `Point` and a `properties` object.
 * Three things from that read shape this file:
 *
 * - The list holds every kind of event (earthquakes, cyclones, fires, droughts
 *   and floods) even when `eventlist=FL` is asked for, so floods are picked here
 *   by `eventtype === "FL"` and nothing is trusted from the request filter.
 * - Dates are `2026-11-12T08:29:24`, with no zone. GDACS publishes them in UTC.
 * - Floods that had ended weeks earlier were still in the list, so "recent" is
 *   decided here (`maxAgeDays`), not by the request window.
 *
 * A change in the shape of the answer must be a visible failure, not a quiet
 * "no floods": a list that is not a feature collection throws, so the layer is
 * reported as unavailable. Single events that do not fit are skipped and counted.
 */

export type FloodAlert = "green" | "orange" | "red";

export interface GlobeFlood {
  /** GDACS event id (digits). */
  id: string;
  /** e.g. "Flood in India". */
  name: string;
  /** Country or countries as GDACS names them, or `null`. */
  country: string | null;
  /** ISO 3166-1 alpha-2, only when the event touches exactly one country (so an emergency number is never guessed). */
  countryCode: string | null;
  latitude: number;
  longitude: number;
  /** GDACS's highest alert level for the whole event (its estimate of humanitarian impact). */
  alert: FloodAlert;
  /** ISO 8601, UTC. */
  startedAt: string;
  /** ISO 8601, UTC, or `null` when GDACS gives no end. */
  endedAt: string | null;
  /** GDACS marks the event as still going. */
  ongoing: boolean;
  /** The event's page on gdacs.org, built from its ids. */
  reportUrl: string;
}

export interface GdacsFloodResult {
  floods: GlobeFlood[];
  /** Features in the answer, of every event type. */
  features: number;
  /** Flood events seen before the recency rule and before the checks below. */
  floodEvents: number;
  /** Flood events dropped because a field was unusable (not because they were old). */
  skipped: number;
}

export class GdacsFormatError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "GdacsFormatError";
  }
}

/** Floods that ended longer ago than this are left off the map. */
export const FLOOD_MAX_AGE_DAYS = 14;
/** The most events shown; GDACS lists far fewer large floods than this in two weeks. */
export const MAX_FLOODS = 300;
/** How far back the request asks for events, a little wider than the days shown. */
export const FLOOD_REQUEST_DAYS = 30;

const DAY_MS = 24 * 60 * 60 * 1000;
const ALERT_RANK: Record<FloodAlert, number> = { red: 3, orange: 2, green: 1 };
const GDACS_DATE = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d+)?(Z|[+-]\d{2}:?\d{2})?$/;

/** The address of the flood list for the last `days` days (`eventlist=FL` is asked for, but not relied on). */
export function gdacsFloodListUrl(now: Date, days = FLOOD_REQUEST_DAYS): string {
  const day = (date: Date) => date.toISOString().slice(0, 10);
  const from = new Date(now.getTime() - days * DAY_MS);
  return (
    "https://www.gdacs.org/gdacsapi/api/events/geteventlist/SEARCH" +
    `?eventlist=FL&alertlevel=Green;Orange;Red&fromdate=${day(from)}&todate=${day(now)}`
  );
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

/** A GDACS date as milliseconds since 1970 (no zone means UTC), or `null` when it is not a date. */
export function parseGdacsDate(value: unknown): number | null {
  if (typeof value !== "string" || !GDACS_DATE.test(value)) return null;
  const ms = Date.parse(GDACS_DATE.exec(value)?.[1] ? value : `${value}Z`);
  return Number.isFinite(ms) ? ms : null;
}

function cleanText(value: unknown, max: number): string | null {
  if (typeof value !== "string") return null;
  // Control characters and runs of spaces have no place in a map label.
  const text = value
    .replace(/\p{Cc}/gu, " ")
    .replace(/\s+/g, " ")
    .trim();
  if (text === "") return null;
  return text.length > max ? `${text.slice(0, max - 1)}…` : text;
}

function parseAlert(value: unknown): FloodAlert | null {
  if (typeof value !== "string") return null;
  const level = value.trim().toLowerCase();
  return level === "red" || level === "orange" || level === "green" ? level : null;
}

/** GDACS sends booleans as the strings "true" and "false"; a real boolean is accepted too. */
function isTrue(value: unknown): boolean {
  return value === true || (typeof value === "string" && value.trim().toLowerCase() === "true");
}

function digits(value: unknown): string | null {
  if (typeof value === "number" && Number.isInteger(value) && value >= 0) return String(value);
  if (typeof value === "string" && /^\d{1,12}$/.test(value)) return value;
  return null;
}

/** The one country's code, only when the event touches exactly one country. */
function singleCountryCode(affected: unknown): string | null {
  if (!Array.isArray(affected)) return null;
  const codes = new Set<string>();
  for (const entry of affected) {
    const iso2 = isRecord(entry) && typeof entry.iso2 === "string" ? entry.iso2.trim() : "";
    if (/^[A-Za-z]{2}$/.test(iso2)) codes.add(iso2.toUpperCase());
  }
  return codes.size === 1 ? ([...codes][0] ?? null) : null;
}

interface Candidate {
  flood: GlobeFlood;
  modifiedAt: number;
}

/**
 * Picks the recent flood events out of a GDACS event list.
 *
 * Kept: events of type `FL` that are still going (`iscurrent`), or that ended
 * (or were last updated) within `maxAgeDays` of `now`. Events that start more
 * than a day in the future are not kept. When an event appears more than once
 * (one row per episode) the most recently updated row wins. Red first, then
 * orange, then green; still-going before ended; newer before older.
 *
 * Throws `GdacsFormatError` when the answer is not a feature list.
 */
export function parseGdacsFloods(
  body: unknown,
  { now = new Date(), maxAgeDays = FLOOD_MAX_AGE_DAYS }: { now?: Date; maxAgeDays?: number } = {},
): GdacsFloodResult {
  if (!isRecord(body) || !Array.isArray(body.features)) {
    throw new GdacsFormatError("GDACS answer is not a list of features");
  }
  const nowMs = now.getTime();
  const oldestMs = nowMs - maxAgeDays * DAY_MS;
  const byId = new Map<string, Candidate>();
  let floodEvents = 0;
  let skipped = 0;

  for (const feature of body.features as unknown[]) {
    if (!isRecord(feature) || !isRecord(feature.properties)) continue;
    const props = feature.properties;
    if (typeof props.eventtype !== "string" || props.eventtype.trim().toUpperCase() !== "FL") {
      continue;
    }
    floodEvents += 1;

    const id = digits(props.eventid);
    const alert = parseAlert(props.alertlevel);
    const startedMs = parseGdacsDate(props.fromdate);
    const geometry = isRecord(feature.geometry) ? feature.geometry : null;
    const coordinates =
      geometry && geometry.type === "Point" && Array.isArray(geometry.coordinates)
        ? geometry.coordinates
        : null;
    const longitude = coordinates?.[0];
    const latitude = coordinates?.[1];
    if (!id || !alert || startedMs === null || !isUsableCoordinate(latitude, longitude)) {
      skipped += 1;
      continue;
    }

    const endedMs = parseGdacsDate(props.todate);
    const modifiedMs = parseGdacsDate(props.datemodified) ?? endedMs ?? startedMs;
    const ongoing = isTrue(props.iscurrent);
    // When the event last moved: its end, or its last update if that is later.
    const lastActiveMs = Math.max(endedMs ?? startedMs, modifiedMs);
    if (startedMs > nowMs + DAY_MS) continue;
    if (!ongoing && lastActiveMs < oldestMs) continue;

    const episode = digits(props.episodeid);
    const reportUrl =
      `https://www.gdacs.org/report.aspx?eventtype=FL&eventid=${id}` +
      (episode ? `&episodeid=${episode}` : "");
    const flood: GlobeFlood = {
      id,
      name: cleanText(props.name, 120) ?? cleanText(props.eventname, 120) ?? "Flood",
      country: cleanText(props.country, 160),
      countryCode: singleCountryCode(props.affectedcountries),
      latitude: latitude as number,
      longitude: longitude as number,
      alert,
      startedAt: new Date(startedMs).toISOString(),
      endedAt: endedMs === null ? null : new Date(endedMs).toISOString(),
      ongoing,
      reportUrl,
    };
    const existing = byId.get(id);
    if (!existing || modifiedMs >= existing.modifiedAt)
      byId.set(id, { flood, modifiedAt: modifiedMs });
  }

  const floods = [...byId.values()]
    .map((candidate) => candidate.flood)
    .sort((a, b) => {
      if (ALERT_RANK[a.alert] !== ALERT_RANK[b.alert])
        return ALERT_RANK[b.alert] - ALERT_RANK[a.alert];
      if (a.ongoing !== b.ongoing) return a.ongoing ? -1 : 1;
      const aEnd = Date.parse(a.endedAt ?? a.startedAt);
      const bEnd = Date.parse(b.endedAt ?? b.startedAt);
      return bEnd - aEnd || a.id.localeCompare(b.id);
    })
    .slice(0, MAX_FLOODS);

  return { floods, features: body.features.length, floodEvents, skipped };
}
