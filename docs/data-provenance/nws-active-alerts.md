# Data Provenance — NWS Active Alerts

Source used by `apps/web/lib/nws-alerts.ts` — Disaster Monitoring's
first and primary real capability (BUILD_PLAN "STAGE — DISASTER
MONITORING WORKSPACE"). Written to close a real gap found in a
subsequent review pass: this source has had solid inline documentation
in its own file since it shipped, but never had the corresponding file
here that `docs/README.md`'s own stated policy requires ("Required for
every data provider before its connector goes live"). This file is that
correction — no code or behavior changes as a result.

## What it is

The U.S. National Weather Service's public **active alerts** API —
official, government-issued weather and hazard alerts (warnings,
watches, advisories) for the United States and its territories.

- API docs: https://www.weather.gov/documentation/services-web-api
- Endpoint used: `https://api.weather.gov/alerts/active`

## Access

- **No API key required.**
- NWS's documented requirement (not optional): every request must
  include a descriptive `User-Agent` header — included in every call
  this app makes.

## License

Public domain, as a work of the US federal government (NOAA/NWS).

## Why not a formal `DataIngestionConnector`

Deliberately **not** built as a `DataIngestionConnector`
(`NasaPowerConnector`/`OpenMeteoConnector`/`UsgsStreamflowConnector`'s
shared interface): that contract requires normalizing output into a
`NormalizedDataRecord` — a single numeric metric/value/unit/timestamp.
An alert is a structured event (headline, severity, urgency,
description, effective/expires window), not a numeric reading. Forcing
it into that shape would mean either fabricating a fake metric/value or
losing the actual alert content that matters. Same reasoning applied to
`geocode.ts` and `password-breach-check.ts` elsewhere in this app — a
real external data need that genuinely doesn't fit the ingestion
layer's shape, not a shortcut around it.

## Why relay, not interpret

Disaster Monitoring deliberately never runs AI interpretation on this
data, unlike every other workspace's threshold-classified "status."
The Constitution's own language for this workspace is explicit: "zero
tolerance" for anything resembling false precision or
engagement-optimization, calling it "the single highest-stakes
application of the Constitution's AI honesty principles." A
threshold-based "disaster risk score" invented from weather data this
app happens to already have would look like real hazard monitoring in
exactly the moment someone's life-safety decision depends on it being
real. Relaying an actual government agency's own already-official
alert, unmodified, doesn't have that problem — this is displayed
as-issued, with no added scoring, ranking, or synthesis.

## Known limitations

- Availability and update frequency depend on NWS's own service — not
  controlled by this app.
- No historical alert archive — this app shows only currently active
  alerts, not a searchable history.
