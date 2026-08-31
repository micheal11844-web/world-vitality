# Data Provenance — NASA FIRMS Fire/Thermal Detections

Source used by `apps/web/lib/nasa-firms.ts` (BUILD_PLAN "STAGE —
DISASTER MONITORING FOLLOW-UP: FIRE DETECTIONS"). Written to close a
real gap found in a subsequent review pass: this source has had solid
inline documentation in its own file since it shipped, but never had
the corresponding file here that `docs/README.md`'s own stated policy
requires. This file is that correction — no code or behavior changes
as a result.

## What it is

NASA **FIRMS** (Fire Information for Resource Management System) —
official NASA satellite fire/thermal-anomaly detection data.

- API docs: https://firms.modaps.eosdis.nasa.gov/api/area/csv
- Endpoint shape: `GET /api/area/csv/{MAP_KEY}/{SOURCE}/{west,south,east,north}/{DAY_RANGE}`
- Source used: `VIIRS_SNPP_NRT` — VIIRS's ~375 m resolution is
  meaningfully finer than MODIS's ~1 km; NRT ("Near Real-Time") is the
  appropriate freshness tier for a live-monitoring page
- `DAY_RANGE` of 1 — requests only today's detections, matching this
  page's "active" framing

## Access

**Requires a free, self-registered `MAP_KEY`** (needs an email
account) — this app cannot obtain one on its own. The owner registered
for one and provided it, following a step-by-step guide given earlier
in this project's history.

**The key itself is never hardcoded anywhere in this repository.**
Read only from `process.env.NASA_FIRMS_MAP_KEY`, set in Vercel's
environment variables — the same place `SUPABASE_SERVICE_ROLE_KEY` and
every other secret in this app already lives.
`fetchActiveFireDetections` fails gracefully (a clear, specific error)
if the variable isn't set, rather than silently returning no data.

## License

NASA FIRMS data is public domain (US government work), subject to
NASA's standard citation/acknowledgment guidance for its use.

## The single most important caveat about this data — stated explicitly, not left implicit

VIIRS/MODIS detect **thermal anomalies** — genuinely elevated surface
temperature signatures — **not confirmed wildfires specifically**.
Agricultural burning, industrial heat sources, and other non-wildfire
heat sources can and do appear in this same feed.
`FIRE_DETECTION_CAVEAT` in `nasa-firms.ts` is shown on-page, not
omitted.

## Known limitations

- **Honest uncertainty about the CSV response's exact column set.**
  FIRMS's documented VIIRS NRT CSV format is well-established
  (`latitude,longitude,bright_ti4,scan,track,acq_date,acq_time,
  satellite,confidence,version,bright_ti5,frp,daynight`), but this
  module could not be exercised against a live response from this
  sandbox (no outbound access to `firms.modaps.eosdis.nasa.gov`).
  Parsing reads the header row to map columns by name rather than
  assuming a fixed column order, tolerating the response not matching
  documentation exactly.
- Detection depends on satellite pass timing and cloud cover — a real
  fire can go undetected for a pass, and detections lag real-world
  events by the satellite's revisit interval.
