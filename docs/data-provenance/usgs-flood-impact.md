# Data Provenance — USGS Real-Time Flood Impact (RT-FI)

Source used by `apps/web/lib/usgs-flood-impacts.ts` (BUILD_PLAN "STAGE
— DISASTER MONITORING WORKSPACE FOLLOW-UP: FLOOD + SHELTER DATA").
Written to close a real gap found in a subsequent review pass: this
source has had solid inline documentation in its own file since it
shipped, but never had the corresponding file here that
`docs/README.md`'s own stated policy requires. This file is that
correction — no code or behavior changes as a result.

## What it is

The USGS **Real-Time Flood Impact (RT-FI)** API — real, currently
flooding infrastructure locations (embankments, roads, bridges,
pedestrian paths, buildings) at USGS reference points nationwide. Not
an inferred or AI-derived flood risk score — a direct relay of USGS's
own already-flagged locations.

- Base URL: `https://api.waterdata.usgs.gov/rtfi-api`
- `GET /referencepoints/flooding` — currently-flooding locations,
  nationwide (this endpoint takes no location parameter)
- `GET /referencepoints/state/{stateCode}` — a state's full
  reference-point list, used here to filter the nationwide flooding
  list down to one state

## Access

**No API key required** for the request volume this app makes.

## License

Public domain, as a work of the US federal government (USGS).

## Known limitations

- **Endpoint shape confirmed from a real, working third-party
  implementation's source code, not USGS's own published schema.**
  This sandbox has no outbound network access to
  `api.waterdata.usgs.gov`, so USGS's own OpenAPI schema for this
  response (`/rtfi-api/openapi.json`) could not be fetched or
  confirmed directly. Parsing is deliberately defensive — reads
  common/likely field names, falls back gracefully rather than
  throwing — and this module is explicitly not verified against a live
  response from this build environment.
- **US and territories only** — same geographic limitation every USGS
  source in this app shares (see also
  `docs/data-provenance/usgs-nwis-streamflow.md`).
- **Provisional data, stated by USGS itself, not softened here:** per
  USGS's own RT-FI API documentation, this data "has not received
  final approval by the U.S. Geological Survey" and "data users are
  cautioned to consider carefully the provisional nature of the
  information before using it for decisions that concern personal or
  public safety."
