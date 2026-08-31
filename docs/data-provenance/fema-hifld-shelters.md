# Data Provenance — FEMA/HIFLD Designated Shelters

Source used by `apps/web/lib/fema-shelters.ts` (BUILD_PLAN "STAGE —
DISASTER MONITORING WORKSPACE FOLLOW-UP: FLOOD + SHELTER DATA").
Written to close a real gap found in a subsequent review pass: this
source has had solid inline documentation in its own file since it
shipped, but never had the corresponding file here that
`docs/README.md`'s own stated policy requires. This file is that
correction — no code or behavior changes as a result.

## What it is

FEMA/American Red Cross **designated shelter facility locations**,
from the Homeland Infrastructure Foundation-Level Data (HIFLD) Open
portal's `national_shelter_system_facilities` layer.

- Layer: `national_shelter_system_facilities` (layer id 7), confirmed
  from that FeatureServer's own published layer metadata
- Endpoint: `https://maps.nccs.nasa.gov/mapping/rest/services/hifld_open/emergency_services/FeatureServer/7`
- Queried via the standard Esri ArcGIS REST API spatial-query pattern —
  a long-established, widely-documented public contract, not this
  app's own invention

## Access

**No API key required.**

## License

Public domain (HIFLD Open portal, a US federal government data
program).

## The single most important thing about this data — stated verbatim, not softened

From FEMA/HIFLD's own layer description:

> "THIS LAYER SHOULD NOT BE USED TO DETERMINE THE OPERATIONAL STATUS OF
> A FACILITY DURING AN ACTIVE EMERGENCY."

These are **designated potential shelter locations — a reference list,
not live open/closed status.** This exact caveat
(`SHELTER_STATUS_CAVEAT` in `fema-shelters.ts`) is displayed on-page
verbatim, never summarized or softened into something that reads as
more reassuring than the source's own warning.

## Known limitations

- **Honest uncertainty about field names beyond the confirmed core
  set.** The layer's own published metadata confirms `name`/`fema_id`/
  `arc_id`/`evac_cap` exist, but this module could not fetch a live
  response from this sandbox (no outbound access to
  `maps.nccs.nasa.gov`) to confirm address/city/state field names —
  parsing is deliberately defensive, matching
  `usgs-flood-impacts.ts`'s same honest-uncertainty approach.
- **Not live capacity or occupancy data** — a shelter appearing here
  says nothing about whether it is currently open, staffed, or has
  space available during an actual emergency, per the caveat above.
