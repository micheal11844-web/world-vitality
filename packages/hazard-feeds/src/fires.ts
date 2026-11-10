import type { FireCluster, FireConfidence, FireDetectionPoint } from "./types.js";

/**
 * Turns NASA FIRMS CSV into detection points, and folds nearby points into
 * clusters so a worldwide day (tens of thousands of detections) stays light
 * enough to draw and send.
 *
 * These are satellite **thermal anomalies**: places that look much hotter than
 * their surroundings when a satellite passed over. Wildfires are the main
 * cause, but agricultural burning, gas flares, factories and volcanoes show up
 * too, and a fire that started or went out between passes is missed or
 * shown late. Nothing in this module (or the Globe) calls a detection a
 * confirmed fire.
 */

const REQUIRED_COLUMNS = ["latitude", "longitude", "acq_date", "acq_time", "confidence"] as const;

/**
 * VIIRS gives `l` / `n` / `h`; MODIS gives a 0–100 number; both are mapped to
 * the same three words. Anything unreadable is treated as `low`, which the
 * clustering step drops, so an unrecognised value can never raise an alarm.
 */
export function parseConfidence(raw: string): FireConfidence {
  const value = raw.trim().toLowerCase();
  if (value === "h" || value === "high") return "high";
  if (value === "n" || value === "nominal") return "nominal";
  if (value === "l" || value === "low") return "low";
  if (/^\d{1,3}$/.test(value)) {
    const n = Number(value);
    return n >= 80 ? "high" : n >= 30 ? "nominal" : "low";
  }
  return "low";
}

/** FIRMS's `acq_date` (YYYY-MM-DD) and `acq_time` (HHMM, leading zeros often dropped) as a UTC ISO string, or `null`. */
export function parseAcquiredAt(date: string, time: string): string | null {
  const d = /^(\d{4})-(\d{2})-(\d{2})$/.exec(date.trim());
  const t = /^\d{1,4}$/.test(time.trim()) ? time.trim().padStart(4, "0") : "";
  if (!d || !t) return null;
  const hours = Number(t.slice(0, 2));
  const minutes = Number(t.slice(2));
  if (hours > 23 || minutes > 59) return null;
  const iso = `${d[1]}-${d[2]}-${d[3]}T${t.slice(0, 2)}:${t.slice(2)}:00.000Z`;
  const parsed = new Date(iso);
  // Rejects impossible dates such as 2026-02-31, which `Date` would roll over.
  return Number.isNaN(parsed.getTime()) || parsed.toISOString() !== iso ? null : iso;
}

/**
 * Parses a FIRMS area-API CSV. The header row decides the column positions
 * (FIRMS has added columns over the years), and it must contain the columns
 * this module needs.
 *
 * Throws when the text is not a FIRMS table at all, because FIRMS reports a
 * bad or rate-limited key with a plain-text message and a normal status code;
 * the caller logs that as a failed layer instead of showing "no fires". A
 * header with no rows is a real answer ("none detected") and returns `[]`.
 * A row that cannot be read is skipped.
 */
export function parseFirmsCsv(text: string): FireDetectionPoint[] {
  const lines = text.split(/\r?\n/);
  const header = (lines[0] ?? "").split(",").map((h) => h.trim().toLowerCase());
  const col = Object.fromEntries(header.map((name, index) => [name, index])) as Record<
    string,
    number | undefined
  >;
  if (!REQUIRED_COLUMNS.every((name) => col[name] !== undefined)) {
    throw new Error("FIRMS response is not a detections table");
  }
  const at = (cells: string[], name: string): string => {
    const index = col[name];
    return index === undefined ? "" : (cells[index] ?? "").trim();
  };

  const out: FireDetectionPoint[] = [];
  for (let i = 1; i < lines.length; i += 1) {
    const line = lines[i];
    if (!line) continue;
    const cells = line.split(",");
    const latText = at(cells, "latitude");
    const lonText = at(cells, "longitude");
    // `Number("")` is 0, so an empty cell must be rejected before conversion.
    if (latText === "" || lonText === "") continue;
    const latitude = Number(latText);
    const longitude = Number(lonText);
    if (
      !Number.isFinite(latitude) ||
      !Number.isFinite(longitude) ||
      latitude < -90 ||
      latitude > 90 ||
      longitude < -180 ||
      longitude > 180
    ) {
      continue;
    }
    const acquiredAt = parseAcquiredAt(at(cells, "acq_date"), at(cells, "acq_time"));
    if (!acquiredAt) continue;
    const frpText = at(cells, "frp");
    const frp = frpText === "" ? null : Number(frpText);
    out.push({
      latitude,
      longitude,
      acquiredAt,
      satellite: at(cells, "satellite").slice(0, 8),
      confidence: parseConfidence(at(cells, "confidence")),
      frp: frp !== null && Number.isFinite(frp) && frp >= 0 ? frp : null,
    });
  }
  return out;
}

interface Bucket {
  latSum: number;
  lonSum: number;
  count: number;
  maxFrp: number | null;
  best: "high" | "nominal";
  latest: string;
  satellite: string;
  row: number;
  column: number;
}

/**
 * Folds detections into a grid of `cellDegrees` squares (0.1° is about 11 km at
 * the equator). Low-confidence detections are dropped first. Each cluster sits
 * at the average position of its detections, reports the strongest power and
 * best confidence among them, and the time of the newest. Ordered strongest
 * first (high confidence, then power, then count).
 */
export function clusterFires(
  points: readonly FireDetectionPoint[],
  { cellDegrees = 0.1 }: { cellDegrees?: number } = {},
): FireCluster[] {
  const buckets = new Map<string, Bucket>();
  for (const point of points) {
    if (point.confidence === "low") continue;
    const row = Math.floor((point.latitude + 90) / cellDegrees);
    const column = Math.floor((point.longitude + 180) / cellDegrees);
    const key = `${row}_${column}`;
    const bucket = buckets.get(key);
    if (!bucket) {
      buckets.set(key, {
        latSum: point.latitude,
        lonSum: point.longitude,
        count: 1,
        maxFrp: point.frp,
        best: point.confidence,
        latest: point.acquiredAt,
        satellite: point.satellite,
        row,
        column,
      });
      continue;
    }
    bucket.latSum += point.latitude;
    bucket.lonSum += point.longitude;
    bucket.count += 1;
    if (point.frp !== null && (bucket.maxFrp === null || point.frp > bucket.maxFrp)) {
      bucket.maxFrp = point.frp;
    }
    if (point.confidence === "high") bucket.best = "high";
    // ISO strings in one format compare correctly as text.
    if (point.acquiredAt > bucket.latest) {
      bucket.latest = point.acquiredAt;
      bucket.satellite = point.satellite;
    }
  }

  const clusters: FireCluster[] = [];
  for (const b of buckets.values()) {
    clusters.push({
      id: `fire-${b.row}_${b.column}`,
      latitude: round(b.latSum / b.count),
      longitude: round(b.lonSum / b.count),
      count: b.count,
      maxFrp: b.maxFrp === null ? null : Math.round(b.maxFrp * 10) / 10,
      confidence: b.best,
      latestAcquiredAt: b.latest,
      satellite: b.satellite,
    });
  }
  return clusters.sort(strongestFirst);
}

function round(value: number): number {
  return Math.round(value * 10_000) / 10_000;
}

const CONFIDENCE_RANK = { high: 1, nominal: 0 } as const;

function strongestFirst(a: FireCluster, b: FireCluster): number {
  return (
    CONFIDENCE_RANK[b.confidence] - CONFIDENCE_RANK[a.confidence] ||
    (b.maxFrp ?? -1) - (a.maxFrp ?? -1) ||
    b.count - a.count ||
    a.id.localeCompare(b.id)
  );
}

/**
 * Keeps at most `max` clusters. Clusters for which `mustKeep` is true (the
 * ones with a camera nearby, which are the ones a person can actually check)
 * are kept first; the rest of the allowance goes to the strongest of what is
 * left. The result stays strongest-first.
 */
export function capClusters(
  clusters: readonly FireCluster[],
  max: number,
  mustKeep: (cluster: FireCluster) => boolean = () => false,
): FireCluster[] {
  const kept: FireCluster[] = [];
  const rest: FireCluster[] = [];
  for (const cluster of clusters) (mustKeep(cluster) ? kept : rest).push(cluster);
  const room = Math.max(0, max - kept.length);
  return [...kept.slice(0, max), ...rest.slice(0, room)].sort(strongestFirst);
}
