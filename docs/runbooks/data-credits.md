# Data credits (v118, Decision #035)

Who our data, maps and software come from, where each is credited in the app, what is
known about its licence, and how to add a source without forgetting the credit.

## What is in the app

- **A public page, `/sources`** ("Data sources and credits"), open to anyone, signed in or
  not, in the five languages. Linked from the sidebar ("Data sources"), the landing page
  and the Globe's legend row.
- **A credit line next to the data**, where a licence asks for one (`app/data-credit.tsx`):
  - `Weather data by Open-Meteo.com` (linked to https://open-meteo.com/) at the end of every
    forecast card: Weather, Construction, Logistics, Renewable Energy (two cards), and the
    Research Dataset Explorer when the rows came from Open-Meteo. It is shown only when a
    forecast is actually displayed (not when the plan locks the forecast, not when the
    source failed).
  - `Place search by Open-Meteo.com · Location data based on GeoNames` where a place-search
    result is shown: Explore (after a result), the sign-up place step, and Global Search
    place results.
  - Each ends with a link to `/sources`.
- **One list.** `packages/hazard-feeds/src/data-credits.ts` holds every source's name, link
  and (only when stated) licence. The page is built from it, plus the camera agencies from
  `CAMERA_PROVIDERS`, so a camera feed cannot be switched on without its credit and licence
  appearing. The sentences are in `apps/web/app/sources/credit-text.ts`, a `Record` over the
  ids: a new id does not compile until its sentences exist (and, through the catalog type,
  in all five languages).
- Tests: `packages/hazard-feeds/src/__tests__/data-credits.test.ts` (secure links, no
  invented licences, Open-Meteo's link). Browser test (not in the repo): every source and
  camera listed in five languages, links open in a new tab with `noopener`, 360 px has no
  sideways scroll, the credit is beside each forecast and absent when the forecast fails.

## Source by source

"Read" means the source's own page was read on 2026-11-14 (or earlier, as noted).

| Source                                        | Credited as                                                                                                                                   | What its own terms say                                                                                                                                                                                                                                                                                                                                                                                                               | Status                                                                      |
| --------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | --------------------------------------------------------------------------- |
| **Open-Meteo** forecasts                      | "Weather data by Open-Meteo.com" + link, beside forecasts                                                                                     | CC BY 4.0. "You must include a link next to any location Open-Meteo data are displayed." Free tier is **non-commercial**; commercial use needs a paid plan and `OPEN_METEO_API_KEY`.                                                                                                                                                                                                                                                 | Credit done. **Paid plan still to buy before charging** (owner).            |
| **Open-Meteo** place search                   | "Place search by Open-Meteo.com" beside results                                                                                               | Same licence.                                                                                                                                                                                                                                                                                                                                                                                                                        | Credit done.                                                                |
| **GeoNames** (behind the search)              | "Location data based on GeoNames" + link                                                                                                      | Open-Meteo's geocoding page lists "Location data based on GeoNames" as its attribution; GeoNames is CC BY 4.0.                                                                                                                                                                                                                                                                                                                       | Credit done. Read 2026-11-14.                                               |
| **NASA POWER**                                | Name, link, "CC BY 4.0" and "NASA Langley Research Center (LaRC) POWER Project, funded through the NASA Earth Science Division" on `/sources` | CC BY 4.0, stated in POWER's own project metadata (`power.larc.nasa.gov/llms.txt`) and on the NASA-managed AWS Open Data entry ("no restrictions on the use, access, and/or download", cite NASA POWER). CC BY 4.0 allows commercial use with credit. The main referencing page asks for the same acknowledgement and is silent on a licence.                                                                                        | Credited. **Commercial use allowed with credit (read 2026-11-15).**         |
| **NASA FIRMS**                                | Name and link; "not a confirmed fire" caveat on `/sources`                                                                                    | NASA's open-data policy ("full and open sharing"); near-real-time data are "not science quality". The official acknowledgement wording could not be fetched, so it is credited by name and link only.                                                                                                                                                                                                                                | Credited by name. Wording to confirm.                                       |
| **GDACS**                                     | Name, link and "CC BY 4.0" on `/sources`; GDACS named in every flood panel and the legend                                                     | **CC BY 4.0**, section 8 of GDACS's Terms of use ("available free of charge and ... licensed under the Creative Commons Attribution 4.0 International (CC BY 4.0), unless specified otherwise for third party or derived products"). Credit wording is not specified. GDACS's JRC team confirmed by email (2026-11-17) that one request every 15 minutes is fine and that stricter limits may come, with notice to registered users. | Credited. **Licence read and confirmed in writing (Decision #034 update).** |
| **U.S. National Weather Service**             | Name and link                                                                                                                                 | U.S. government open data (documented API; descriptive `User-Agent` required, which the app sends).                                                                                                                                                                                                                                                                                                                                  | Credited by name. Not re-read.                                              |
| **USGS Real-Time Flood Impact**               | Name and link                                                                                                                                 | U.S. government data.                                                                                                                                                                                                                                                                                                                                                                                                                | Credited by name. Not re-read.                                              |
| **FEMA National Shelter System (HIFLD Open)** | Name and link; "list of designated places, not open or closed now"                                                                            | Described in code as public domain; the layer's own warning is shown on the page where shelters appear. HIFLD Open moves around; the app reads a NASA-hosted copy.                                                                                                                                                                                                                                                                   | Credited by name. Not re-read.                                              |
| **Camera agencies** (6)                       | Each agency's own credit text, linked to its feed, plus its licence name and link (from `CAMERA_PROVIDERS`)                                   | Per agency; see the registry comment for why FL511, Houston TranStar and NYC DOT are excluded.                                                                                                                                                                                                                                                                                                                                       | Credited. Licences as recorded when each was added.                         |
| **OpenStreetMap**                             | "© OpenStreetMap contributors" on the map and on `/sources`                                                                                   | ODbL; the attribution is also drawn on each workspace map.                                                                                                                                                                                                                                                                                                                                                                           | Credited. Not re-read.                                                      |
| **Natural Earth II**                          | Name and link                                                                                                                                 | Public domain (their terms page).                                                                                                                                                                                                                                                                                                                                                                                                    | Credited. Not re-read.                                                      |
| **CesiumJS**, **MapLibre GL JS**              | Name, link, licence (Apache 2.0, BSD 3-Clause)                                                                                                | Open-source licences of the libraries.                                                                                                                                                                                                                                                                                                                                                                                               | Credited. Not re-read.                                                      |
| **Have I Been Pwned: Pwned Passwords**        | Name and link                                                                                                                                 | "no licencing or attribution requirements on the Pwned Passwords API"; a credit "is welcomed". Read 2026-11-14.                                                                                                                                                                                                                                                                                                                      | Credited (optional).                                                        |

## Open points (need a person, not code)

1. ~~**GDACS**~~ **Closed 2026-11-17.** GDACS's Terms of use (the PDF they pointed to, section 8) license
   their content and data under **CC BY 4.0**, free of charge, "unless specified otherwise for third party or
   derived products". That allows commercial use with credit. The owner asked through the contact form (2026-11-16)
   and the JRC's GDACS team replied (2026-11-17): the answers are in their FAQ and Terms of use, **one request every
   15 minutes is fine**, and "we are in monitoring mode and may implement stricter constraints on the use of APIs in the
   future", with notice "to registered users". They also asked how the owner found GDACS and for screenshots of the app.
   Still true: the credit wording is not specified (we credit by name and link, with the licence on `/sources`);
   the flood events seen carry `source: GLOFAS` (a Copernicus/EU system), but the third-party carve-out means a
   source other than GLOFAS in the feed would be worth reading about; and the owner is not registered with GDACS yet,
   so the "notice in due time" promise reaches no one: **registering for API notices, if GDACS offers it, is a to-do for
   the owner.** (A copy of the Terms dated March 2025 that was read on 2026-11-15 did not appear to contain section 8, and
   could not be re-checked; the copy at the address GDACS gave is the one that applies. Their FAQ page is built with
   scripts and could not be read.)
2. ~~**NASA POWER**~~ **Closed 2026-11-15.** The licence is CC BY 4.0 (POWER's own
   `llms.txt` and the NASA-managed AWS Open Data entry, which adds "There are no restrictions on
   the use, access, and/or download of data"). That allows commercial use with credit, so the
   data may sit in a paid product. What it still asks of us: the credit (done on `/sources`),
   a link to the licence (done), and no suggestion that NASA endorses the product (NASA's
   data-use policy). The main docs pages state no licence, so if NASA ever changes the
   statement, re-read `llms.txt` and the referencing page. An optional courtesy: POWER "kindly
   requests" a note of publications that use its data, to `larc-power-project@mail.nasa.gov`.
3. **FIRMS**: confirm NASA's current acknowledgement text and use it on `/sources`.
4. **Open-Meteo paid plan** and `OPEN_METEO_API_KEY` in Vercel before the first paying
   customer. The credit stays after upgrading (the paid licence keeps the attribution
   rule unless Open-Meteo says otherwise).
5. **Terms of Service and Privacy Policy** exist since v119 (`legal-pages.md`); they still need a
   Nigerian lawyer's read.

## Adding a source

1. Add its id to `DataCreditId` and an entry to `DATA_CREDITS` in `data-credits.ts`
   (name, link, group; a `licence` **only if its own pages state one**).
2. Add its sentences to `CREDIT_TEXT` and the five catalogs (`credits.use.<id>`, and
   `credits.note.<id>` when it has a credit line or a caveat that must travel with the data).
3. If its licence asks for a credit next to the data, put it there (extend `DataCredit` or
   add a similar small component) and add a browser check.
4. Add a row to the table above, with what was read and when.
5. A camera feed needs none of this beyond its `CAMERA_PROVIDERS` entry (its credit and
   licence fields are required by the type, and the page lists every provider).
