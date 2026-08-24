/**
 * Disaster Monitoring's fire-detection signal (BUILD_PLAN "STAGE —
 * DISASTER MONITORING FOLLOW-UP: FIRE DETECTIONS"): NASA FIRMS (Fire
 * Information for Resource Management System) area API — free,
 * official NASA satellite fire-detection data, requiring a
 * self-registered `MAP_KEY` this app cannot obtain on its own (needs
 * an email account) — the owner registered for one and provided it,
 * per the step-by-step guide given earlier in this project's history.
 *
 * **The key itself is never hardcoded here or anywhere in this
 * repository.** Read from `process.env.NASA_FIRMS_MAP_KEY` only — the
 * owner must set this in Vercel's environment variables (Project
 * Settings → Environment Variables), the same place
 * `SUPABASE_SERVICE_ROLE_KEY` and every other secret in this app
 * already lives. `fetchActiveFireDetections` fails gracefully (throws
 * a clear, specific error) if the variable isn't set, rather than
 * silently returning no data or crashing the page build.
 *
 * Endpoint shape confirmed from FIRMS's own published API
 * documentation (firms.modaps.eosdis.nasa.gov/api/area/csv):
 * `GET /api/area/csv/{MAP_KEY}/{SOURCE}/{west,south,east,north}/{DAY_RANGE}`.
 * `VIIRS_SNPP_NRT` chosen as the source — VIIRS's ~375 m resolution is
 * meaningfully finer than MODIS's ~1 km, and NRT ("Near Real-Time") is
 * the appropriate freshness tier for a live-monitoring page. `DAY_RANGE`
 * of 1 requests only today's detections, matching this page's "active"
 * framing.
 *
 * **The single most important honest caveat about this data, stated
 * explicitly rather than left implicit:** VIIRS/MODIS detect thermal
 * anomalies — genuinely elevated surface temperature signatures — not
 * confirmed wildfires specifically. Agricultural burning, industrial
 * heat sources, and other non-wildfire heat sources can and do appear
 * in this same feed. `FIRE_DETECTION_CAVEAT` below is shown on-page,
 * not omitted.
 *
 * **Honest uncertainty about the CSV response's exact column set:**
 * FIRMS's documented VIIRS NRT CSV format is well-established
 * (`latitude,longitude,bright_ti4,scan,track,acq_date,acq_time,
 * satellite,confidence,version,bright_ti5,frp,daynight`), but this
 * module could not be exercised against a live response from this
 * sandbox (no outbound access to firms.modaps.eosdis.nasa.gov) —
 * parsing reads the header row to map columns by name rather than
 * assuming a fixed column order, which tolerates the response not
 * matching this comment's expectation exactly.
 */

const FIRMS_AREA_API_BASE = "https://firms.modaps.eosdis.nasa.gov/api/area/csv";
const SOURCE = "VIIRS_SNPP_NRT";
const DAY_RANGE = 1;

export const FIRE_DETECTION_CAVEAT =
  "These are satellite-detected thermal anomalies (elevated surface temperature), not confirmed wildfires. Agricultural burning and other heat sources can also appear here. — NASA FIRMS";

export interface FireDetection {
  latitude: number;
  longitude: number;
  acquiredDate: string;
  acquiredTime: string;
  satellite: string;
  confidence: string;
  frp: number | null;
  dayNight: string;
}

function parseCsv(text: string): Record<string, string>[] {
  const lines = text.trim().split("\n");
  if (lines.length < 2) return [];
  const headers = lines[0]!.split(",").map((h) => h.trim());
  return lines.slice(1).map((line) => {
    const cells = line.split(",");
    const row: Record<string, string> = {};
    headers.forEach((header, i) => {
      row[header] = (cells[i] ?? "").trim();
    });
    return row;
  });
}

/**
 * Fetches active fire/thermal-anomaly detections within a bounding box
 * around a point over the last `DAY_RANGE` day(s). Returns an empty
 * array for "no detections in range" — a normal, good-news outcome,
 * not an error. Throws on a missing `NASA_FIRMS_MAP_KEY` (a
 * configuration problem, distinct from "no data") or an actual
 * network/API failure.
 */
export async function fetchActiveFireDetections(
  latitude: number,
  longitude: number,
  boxDegrees = 1,
): Promise<FireDetection[]> {
  const mapKey = process.env.NASA_FIRMS_MAP_KEY;
  if (!mapKey) {
    throw new Error(
      "NASA_FIRMS_MAP_KEY is not configured. Set it in Vercel's environment variables to enable fire detection data.",
    );
  }

  const west = longitude - boxDegrees;
  const south = latitude - boxDegrees;
  const east = longitude + boxDegrees;
  const north = latitude + boxDegrees;
  const area = `${west},${south},${east},${north}`;

  const url = `${FIRMS_AREA_API_BASE}/${mapKey}/${SOURCE}/${area}/${DAY_RANGE}`;
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`NASA FIRMS API returned ${response.status}`);
  }

  const text = await response.text();
  const rows = parseCsv(text);

  return rows
    .map((row) => ({
      latitude: Number.parseFloat(row.latitude ?? ""),
      longitude: Number.parseFloat(row.longitude ?? ""),
      acquiredDate: row.acq_date ?? "",
      acquiredTime: row.acq_time ?? "",
      satellite: row.satellite ?? "",
      confidence: row.confidence ?? "",
      frp: row.frp ? Number.parseFloat(row.frp) : null,
      dayNight: row.daynight ?? "",
    }))
    .filter((d) => Number.isFinite(d.latitude) && Number.isFinite(d.longitude));
}
