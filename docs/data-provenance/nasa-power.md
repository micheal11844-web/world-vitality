# Data Provenance — NASA POWER

Source used by `NasaPowerConnector` (`services/data-ingestion/src/connectors/nasa-power-connector.ts`),
the first concrete ingestion connector (BUILD_PLAN Stage 2).

## What it is

NASA's **POWER** project (Prediction Of Worldwide Energy Resources) —
global meteorology, surface solar energy, and agroclimatology data derived
from NASA satellite observation and reanalysis models (MERRA-2, CERES),
not direct ground sensors.

- Docs: https://power.larc.nasa.gov/docs/
- API reference: https://power.larc.nasa.gov/docs/services/api/
- Parameter dictionary: https://power.larc.nasa.gov/parameters/
- Methodology: https://power.larc.nasa.gov/docs/methodology/

This connector uses the **Daily API**, **Point** endpoint, **AG**
(Agroclimatology) community by default — chosen to feed BUILD_PLAN Stage
4's recommended first interpretation capability (agriculture soil-moisture
status).

## Access

- **No API key or authentication required** — publicly accessible REST
  endpoint.
- Base URL: `https://power.larc.nasa.gov/api/temporal/daily/point`
- Rate limiting exists but is not tightly documented with a published
  number as of this writing; NASA's own guidance is to cache/reuse
  responses rather than repeatedly requesting the same location, and to
  avoid submitting duplicate requests for the same grid cell.

## License

NASA data is produced by a U.S. government agency and is, per longstanding
U.S. government policy, generally **not subject to copyright domestically**
and treated as public domain. POWER's own documentation does not impose
additional license terms or require a specific attribution string, but
does ask users to reference the methodology page when publishing derived
work.

Recorded in every record's `provenance.license` field as `"public-domain"`,
with `provenance.attributionUrl` pointing at the methodology page.

## Known limitations (recorded on every record via `provenance.knownLimitations`)

- **Spatial resolution**: data is provided on a 0.5° × 0.5° grid. A "point"
  request returns the value for the grid cell containing that
  latitude/longitude — not a value specific to the exact coordinate.
- **Not ground-truth**: values are derived from satellite/reanalysis
  models (MERRA-2 for meteorological parameters, GEWEX/CERES for solar),
  not in-situ sensors. Accuracy varies by parameter, location, and time
  period.
- **Missing data**: POWER represents unavailable data with a sentinel
  fill value (`-999` by default, exposed as `header.fill_value` in the API
  response) rather than omitting the field. `NasaPowerConnector` detects
  this and reports it as an explicit `IngestionGap` — see
  `parsePowerResponse` in the connector source.

## Why POWER for the first connector

Per ADR-0003's Standing Action Item, the Stage 1 interfaces needed
validating against a real, non-trivial provider before being treated as
settled. POWER was chosen over alternatives because:

- No API key/auth flow to build before Stage 2 could even start.
- Directly supports the Stage 4 agriculture use case (Constitution
  doesn't specify which domain to launch first, but BUILD_PLAN 4.1
  recommends soil-moisture status, and POWER's AG community is built for
  exactly this).
- Has real, documented failure modes (fill values, grid-resolution
  caveats) worth exercising the ingestion interface's gap-reporting
  against, rather than a toy/always-clean data source.
