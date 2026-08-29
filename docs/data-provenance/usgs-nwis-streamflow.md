# Data Provenance — USGS NWIS (Streamflow)

Source used by `UsgsStreamflowConnector`
(`services/data-ingestion/src/connectors/usgs-streamflow-connector.ts`) —
the third ingestion connector, and the first one that is not
coordinate-based (BUILD_PLAN "STAGE — RENEWABLE ENERGY FOLLOW-UP:
HYDRO"), feeding `HydroFlowStatusProvider`'s streamflow-level status
capability. Same USGS organization Disaster Monitoring's flood-impact
data already relies on, but a genuinely different service within it.

## What it is

The USGS **National Water Information System (NWIS)**, specifically its
**Instantaneous Values (IV) service** — real-time streamflow discharge
and other time-series parameters measured at physical USGS gauge
stations across the US and its territories.

- Service docs: https://waterservices.usgs.gov/docs/instantaneous-values/
- Site/station explorer: https://waterdata.usgs.gov/nwis
- Parameter code used: `00060` (Discharge, cubic feet per second)

## Access

- **No API key or authentication required** — publicly accessible REST
  endpoint.
- Base URL: `https://waterservices.usgs.gov/nwis/iv/`
- Data is typically recorded at 15–60 minute intervals and transmitted to
  USGS every 1–4 hours; this connector requests only the current
  instantaneous value(s) for each configured station on each run.

## License

**Public domain**, as a work of the US federal government (17 U.S.C. §
105) — the same basis Disaster Monitoring's own USGS sources already
rely on. Recorded in every record's `provenance.license` field as
`"Public Domain (US Government Work)"`.

## Known limitations (recorded on every record via `provenance.knownLimitations`)

- **Fixed gauge stations, not arbitrary coordinates.** This is the one
  structural way this connector genuinely differs from every other
  connector in this codebase: `NasaPowerConnector`/`OpenMeteoConnector`
  accept any latitude/longitude on Earth; streamflow is only measured
  where a physical USGS gauge actually exists. `UsgsStreamflowConnector`
  is configured with real USGS site numbers, not coordinates a caller
  picks freely.
- **US and territories only.** No global coverage — the same geographic
  limitation Disaster Monitoring's USGS flood-impact and shelter data
  already carry.
- **Provisional vs. approved values.** USGS marks every reading with a
  qualifier code — most commonly `"A"` (approved, reviewed) or `"P"`
  (provisional, not yet reviewed and subject to revision). This
  connector reports both, honestly noting provisional status in
  `provenance.knownLimitations` rather than silently treating a
  provisional value as final — the exact caveat Disaster Monitoring's
  own USGS flood data already states ("preliminary/provisional... not to
  be used for permits").
- **No forecast counterpart.** Unlike NASA POWER (current + historical)
  and Open-Meteo (forecast), the NWIS IV service is observational/
  real-time only — there is no public USGS streamflow forecast API
  comparable to Open-Meteo's weather forecast. `HydroFlowStatusProvider`
  is therefore current-conditions only, with no outlook widget — a real
  gap, stated honestly in the workspace page's own doc comment, not an
  oversight.
- **Discharge is not generation output.** This connector reports
  streamflow (cubic feet per second) only — a resource-level condition,
  not an estimate of hydroelectric power output. This codebase has no
  turbine, penstock, or head (elevation drop) specification for any real
  hydro asset, and power output depends on all three; converting
  discharge into an output estimate without that data would be
  fabrication (Constitution AI Principle #2).

## Why USGS NWIS for hydro

Renewable Energy's PRD (A.4) names three asset types — solar, wind, and
hydro. Wind and solar were already closed via NASA POWER/Open-Meteo.
USGS NWIS was chosen for hydro because:

- No API key/auth flow to build, consistent with every other connector
  in this codebase.
- Already the same trusted organization/data family this app relies on
  for Disaster Monitoring's flood-impact and shelter data — a known
  quantity, not a first-time integration with an unfamiliar provider.
- Real, documented failure modes (provisional-vs-approved qualifiers, no
  data for an inactive/decommissioned station) worth exercising the
  ingestion interface's gap-reporting against, same reasoning
  `nasa-power.md` gives for why POWER was chosen for the first connector.
