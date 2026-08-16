# Data Provenance — Open-Meteo

Source used by `OpenMeteoConnector`
(`services/data-ingestion/src/connectors/open-meteo-connector.ts`) — the
second, genuinely different ingestion connector (BUILD_PLAN Stage 10
ticket 10.6, closing the deferred-list "second data-provider connector"
item), feeding `WeatherForecastProvider`'s short/medium/long-range
forecast capability.

## What it is

**Open-Meteo** — an open-source weather API aggregating output from
national weather services' own forecast models (e.g. ECMWF, DWD, NOAA)
into a single, consistent JSON interface. This connector uses the
**Forecast API**'s **daily** endpoint, requesting
`temperature_2m_max`/`temperature_2m_min`.

- Docs: https://open-meteo.com/en/docs
- Terms of use / licensing: https://open-meteo.com/en/terms

Structurally different from NASA POWER in every way that matters for
validating ADR-0002/0003's ingestion/interpretation boundary: a
different API shape (daily arrays keyed by date, not
per-parameter-per-date objects), a different domain (forward-looking
forecast, not historical/current observation), and a different
underlying model source. No changes to `DataIngestionConnector` were
needed to accommodate it — only an additive, backward-compatible schema
change (`NormalizedDataRecord.recordType`/`forecastIssuedAt`) to
represent something NASA POWER's data never needed to: a value that
hasn't happened yet. That's the actual, concrete evidence the interface
holds up against a second, deliberately different provider — not just
design intent.

## Access

- **No API key or authentication required** for the free tier — plain
  HTTP GET, JSON response.
- Free-tier limits (subject to change — verify against Open-Meteo's own
  current terms before relying on exact figures): roughly 10,000 calls
  per day, 5,000 per hour, 600 per minute. This project's usage (one
  request per page load, per location) is far below these limits at
  current scale, but worth monitoring if traffic grows.

## Licensing — **real limitation, not a formality**

Open-Meteo's data is licensed **CC BY 4.0** (attribution required — same
license family as NASA POWER), **but the free tier is explicitly
restricted to non-commercial use** per Open-Meteo's Terms of Use. This
is a genuinely different, more restrictive condition than NASA POWER's
CC BY 4.0, which permits commercial use freely.

**Why this is being used anyway, right now:** World Vitality is
pre-launch, pre-revenue, and not yet operating commercially (BUILD_PLAN
Stage 8.2, limited beta, hasn't even started — see BUILD_PLAN's own
current status). Non-commercial use is accurate for the project's actual
current state.

**What this means going forward, stated plainly rather than left to be
discovered later:** if/when World Vitality begins operating
commercially — charging for access, running the "Third-Party Workspace
Marketplace" from the deferred list, or otherwise generating revenue
from the platform — this specific data source stops being appropriately
licensed for that use. At that point, either upgrade to one of
Open-Meteo's paid commercial-use plans, or replace this connector with
a commercially-licensed alternative. Recorded here, in
`provenance.knownLimitations` on every record this connector produces,
and in `OpenMeteoConnector`'s own doc comment — three places, not
buried in one, given how easy a licensing condition like this is to
lose track of once a connector is "just working" and nobody revisits
why.

Recorded in every record's `provenance.license` field as `"CC-BY-4.0"`,
with `provenance.attributionUrl` pointing at Open-Meteo's docs.

## Known limitations (recorded on every record via `provenance.knownLimitations`)

- **Non-commercial-use restriction** — see above; the single most
  important limitation of this source, more consequential than the
  technical ones below.
- **Daily resolution only, averaged**: this connector requests daily
  min/max and averages them into one representative value per day — a
  standard meteorological convention, not a full hourly-resolution
  forecast. A more granular forecast (Open-Meteo does support hourly
  data) would need a real, separate design decision about how the
  interpretation layer should consume sub-daily granularity — not done
  here.
- **Model-predicted, not observed**: every record from this connector
  carries `recordType: "forecast"`. Accuracy genuinely decreases with
  lead time — this is _represented_, not just noted in prose, via
  `forecastIssuedAt` and `WeatherForecastProvider`'s lead-time-based
  confidence gradient (see that provider's own doc comment for why this
  matters as a real Constitution Section 9 / AI Principles concern, not
  a stylistic choice).

## Why Open-Meteo for the second connector

Per ADR-0003's Standing Action Item, the Stage 1 ingestion interface
needed validating against a provider whose data genuinely doesn't look
like the first one, not just a second parameter through the same API
(which Stage 10's temperature-status capability already did, and
explicitly flagged as not fully satisfying this same requirement — see
BUILD_PLAN's deferred-list entry). Open-Meteo was chosen because:

- No API key/auth flow to build, matching this project's existing
  preference (NASA POWER shares this property) — keeps the _interface_
  validation focused on data-shape differences, not credential-handling
  differences, which would be a separate, real, but different kind of
  validation.
- Directly supports the PRD's explicit "short/medium/long-range
  confidence gradient" description for Weather & Climate — a real
  product need, not a synthetic test case invented just to exercise a
  second connector.
- Has a real, documented, non-trivial licensing condition
  (non-commercial-use) worth exercising this project's data-provenance
  documentation discipline against, rather than a source with no real
  caveats to record.
