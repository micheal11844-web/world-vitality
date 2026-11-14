# The Globe's fire and camera layers

What this is, where the data comes from, what it can and cannot tell a person,
and how to tell when a source has changed. Decision #027 explains why it exists.

## What a person sees

Open **View the Globe**. Two kinds of dot join the map after the page is already on screen:

- **Orange: satellite heat detections** from the whole world for the last day
  (NASA FIRMS, VIIRS near-real-time). Nearby detections are folded into one dot
  (about 11 km squares). Low-confidence detections are dropped. At most 2,500
  dots are shown; the page says "Showing the strongest N of M" when it cuts.
  Dots that have a public camera within 25 km are always kept.
- **Teal: public cameras** from six agencies (below), thinned to one per ~5 km
  square and at most 600 per agency so the map stays readable.

The 3D globe also shows **place names**: country names from the whole-Earth view (the
biggest first) and city names as you come closer, so a dot is never on a blank map. Country
names are in the person's language; city names are English (Decision #032).

Tapping a dot opens a side panel (a bottom sheet on a phone):

- **Heat detection:** what it is (and is not), how many detections, strongest
  heat output, satellite confidence, how long ago the satellite passed, the up to
  four nearest cameras with their pictures, distance and direction.
- **Camera:** the agency's own still picture with a **"Still picture, not live video"**
  label on it, name, the agency's credit and licence link, how often it updates, and a
  line that it can be minutes old. While the panel is open and the tab is in view the
  picture is fetched again by itself on the agency's own rhythm (1 to 5 minutes; 5 when
  the agency does not say), and a failed refresh keeps the picture already on screen.
- **Both:** "Seeing a real fire?" with a **call button** (`tel:`) and the advice to
  call only for a real, current fire. This is not an official alert and does not
  replace emergency services.

Keyboard and screen-reader users, and anyone on a device without WebGL, get the
same dots as real buttons on the flat map (strongest 500 fires, and a thinned set
of cameras). Escape closes the panel.

## Where the data comes from

| Layer            | Source                                                                                                        | How it is read                                  |
| ---------------- | ------------------------------------------------------------------------------------------------------------- | ----------------------------------------------- |
| Heat detections  | NASA FIRMS `area/csv/{key}/{source}/world/1`, for `VIIRS_SNPP_NRT`, `VIIRS_NOAA20_NRT` and `VIIRS_NOAA21_NRT` | Server, key `NASA_FIRMS_MAP_KEY`, cached 10 min |
| California       | Caltrans CWWP, 12 district files `cwwp2.dot.ca.gov/data/dN/cctv/cctvStatusDNN.json`                           | Server, cached 15 min                           |
| London           | TfL Unified API `api.tfl.gov.uk/Place/Type/JamCam`                                                            | Server, cached 15 min                           |
| New South Wales  | Live Traffic NSW `data.livetraffic.com/cameras/traffic-cam.json`                                              | Server, cached 15 min                           |
| Finland          | Digitraffic `tie.digitraffic.fi/api/weathercam/v1/stations`                                                   | Server, cached 15 min                           |
| British Columbia | DriveBC `www.drivebc.ca/api/webcams/`                                                                         | Server, cached 15 min                           |
| Singapore        | LTA via data.gov.sg `api.data.gov.sg/v1/transport/traffic-images`                                             | Server, cached **30 seconds** (see below)       |

Only the camera **lists** pass through the server. The **pictures** are loaded
from the agency's own host by the viewer's browser, only after they open a
camera (or a fire that lists it), with no referrer sent. Nothing is copied,
recorded or stored. The Globe page's Content-Security-Policy lets pictures (and
nothing else) come from those six hosts; `packages/hazard-feeds`'s
`csp-sources.test.ts` fails if `next.config.mjs` and the provider table drift apart.

There is **nothing for Nigeria or the rest of Africa**: no open, official public
camera feed was found that permits reuse. The panel says so ("Cameras are only
available in California, New South Wales, British Columbia, London, Finland and Singapore").
A fire elsewhere is still shown, with the general emergency guidance.

## Why a fire can look late (and what was done about it)

- **The satellites.** Each VIIRS satellite passes over a given place only a few
  times a day, and NASA says detections reach FIRMS up to about 3 hours after a
  pass. A fire that starts just after a pass waits for the next one. Since v110
  the Globe reads three satellites (Suomi NPP, NOAA-20, NOAA-21; same instrument,
  staggered orbits), so a place is looked at more often. If one satellite's file
  cannot be read the others are still shown; only if all three fail is it a
  failure (the log line `globe_world_fires_loaded` names any that failed in
  `failedSources`). The panel always says when the latest pass was.
- **Our cache.** The world file is kept 10 minutes (it was 30) and the browser
  keeps the answer 2 minutes. Shortening further buys little: NASA adds data
  every few minutes at best, and each refresh is several megabytes.
- **Not available through this feed:** the geostationary satellites
  (GOES, Meteosat, Himawari) see a whole hemisphere every 10 to 15 minutes and
  would catch a fire sooner, but they are not in the FIRMS download this app
  uses. Adding them means another data source; not built.
- **Camera pictures.** An agency camera publishes each new still at the same web
  address, and a browser may keep the old one. Pictures are now requested with a
  changing `?wv=` number (a new one every minute, and every time the person taps
  **Reload picture**), and the panel says when the picture was loaded in the
  person's own time. A clock printed **on** the picture is the camera's own local
  time: London is currently 1 hour behind Lagos, California 9 hours.

## Why a camera shows a picture and not video

Every agency the Globe reads publishes **still pictures that are replaced every
few minutes**, not a continuous video stream, so that is what the Globe shows
(Decision #029). What was read on 2026-11-11, and what it means:

| Agency                          | What its open feed gives                                                                                                                                              | Used?                            |
| ------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------- |
| Transport for London            | Stills only, roughly every 5 to 10 minutes. TfL's own live video is not in the public API (from a community FAQ, not a TfL document).                                 | Yes                              |
| Caltrans (California)           | Stills, plus an optional `streamingVideoURL` per camera that many districts leave as "Not Reported". The format is not stated in the field description.               | Stills                           |
| NSW, DriveBC, Digitraffic       | Stills (what the readers use).                                                                                                                                        | Yes                              |
| NZ Transport Agency             | Stills every 30 seconds; registered developers only, with a username and password.                                                                                    | No (needs the owner to register) |
| Washington State DOT            | Stills every 1 to 5 minutes; needs an access code.                                                                                                                    | No (needs the owner to register) |
| Ontario 511                     | Needs a key; 10 calls per minute; Open Government Licence - Ontario.                                                                                                  | No (needs the owner to register) |
| Singapore (LTA via data.gov.sg) | Stills every 20 seconds, `https://api.data.gov.sg/v1/transport/traffic-images`. Singapore Open Data Licence (commercial use allowed with attribution); no key needed. | **Yes (2026-11-11)**             |

**Singapore (built 2026-11-11 from a real response the owner pasted).** The
feed is `{ items: [{ timestamp, cameras: [{ timestamp, image, location: {
latitude, longitude }, camera_id, image_metadata }] }] }`, about 90 cameras, each
picture 1920 by 1080. Three things are different from the other agencies:

- **Every new picture has a new address** (`images.data.gov.sg/api/traffic-images/<year>/<month>/<uuid>.jpg`).
  An address in a cached list is therefore out of date within seconds. These
  cameras carry `freshAddress` and `takenAt`; the camera panel asks
  `GET /api/globe/camera-picture?id=lta-<number>` for the latest address when it
  opens, when **Reload picture** is pressed, and every minute while it stays open
  (swapped in only after it has loaded; a failed lookup keeps the picture on
  screen). The server answers from a 30-second shared copy of the agency's list,
  so any number of viewers cost the agency at most two requests a minute.
- **The list gives no name**, so a camera is called "Singapore road camera 2701".
- **The panel shows when the picture was taken** ("Picture taken at 08:35 PM (your
  time)"), from the agency's own timestamp.

In the "cameras near a fire" list a Singapore camera shows "Open for the latest
picture" instead of a thumbnail, because the address the list holds could be
minutes old; opening it fetches the current one. Fire and camera rows from the
other agencies are unchanged.

The feed needs no key. If Singapore starts answering `429` (too many requests
without a key), `globe_cameras_failed {provider: "lta"}` appears in the logs and
Singapore cameras drop out until it recovers; the agency offers a free key for
higher limits, which would then need to be sent as a header (not built).
The licence page (`https://data.gov.sg/open-data-licence`) was opened on 2026-11-11: it
allows commercial use with a conspicuous notice naming the source and linking the
licence, which the panel gives ("Picture from Traffic Images, Land Transport Authority
(LTA), Singapore, via data.gov.sg" and a link to the licence).

**Video from California.** The Globe logs one line per list refresh,
`globe_caltrans_video_offered {cameras, withVideo, hosts, extensions}`. Read it
after opening the Globe once. If `withVideo` is large and `extensions` is `m3u8`
(HLS), playing it is possible, but it needs: a player library, the video host
added to the page's CSP (`media-src` and `connect-src`), a check of Caltrans'
conditions of use (the CWWP page lists "Conditions Of Use" but they were not
readable here), a fallback to the still, and a decision about bandwidth. Do not
build it blind.

**Africa.** No open, reusable camera feed for Nigeria or the rest of Africa was
found. Cameras belonging to a city or state would need that body's written
permission; unsecured or private streams are never used.

## Google Maps: links only, and why not the imagery

The fire and camera panels end with "Look at the place": two plain links that
open Google Maps in a new tab at that spot (satellite view, and Street View).
Nothing from Google is loaded by the Globe itself. These are Google's documented
"Maps URLs" (no key, no cost). The panel says they are **stored photos from
earlier dates, not live video**.

Google's imagery is **not live**. Street View is photographs taken on a past
date (the date is shown in its corner); the satellite layer is stored imagery
too. Embedding it in the Globe is also not allowed: Google's terms, as passed on
by Cesium for Google content, forbid use where failure could cause death or
injury (emergency response is named) and forbid showing Google imagery together
with a non-Google map. For a fresher look from space, NASA GIBS (free, public,
daily true-colour and fire layers, and 10-minute GOES images for the Americas) is
the candidate; not built.

## Sources left out on purpose

Florida FL511 (personal use only), Houston TranStar (no linking to images without
written permission), New York City DOT (needs a signed agreement). Private
cameras, security cameras and unsecured streams are never used, and the Globe
never records or stores a picture.

## Emergency numbers

A specific number is offered only when the country is known from a camera of a
known agency within 25 km: US/CA 911, GB 999, AU 000, FI 112, SG 995 (Singapore's fire and ambulance number; 999 is the police). Otherwise the
button says **112** and the panel explains that 112 works on most mobile phones
in most countries and to use the local number if known. Countries are never
guessed from coordinates.

## What to say when someone asks "is it a fire?"

A heat detection is a place a satellite saw as much hotter than its
surroundings. Wildfires are the main cause, but crop burning, gas flares, steel
works and volcanoes appear too, and a fire that starts or ends between two
passes is missed or shown late. The satellite passes a place only a few times a
day. A camera picture may be minutes old and may point somewhere else. Together
they can help a person decide whether to call; neither proves a fire.

## Checking it is working (after each deploy)

1. Open the Globe once while signed in, wait about 20 seconds.
2. In Vercel → project `world-vitality` → Logs (or the MCP `get_runtime_logs`),
   look for `globe_` lines:
   - `globe_cameras_loaded {provider, count}` — one per agency, the count should be
     in the hundreds or thousands (Finland and California are the largest; Singapore about 90).
   - **`globe_cameras_empty {provider}` — the agency answered but no camera passed
     the checks. The format has probably changed: fix the reader in
     `packages/hazard-feeds/src/cameras.ts` and add a test with a sample of the new shape.**
   - `globe_caltrans_video_offered {cameras, withVideo, hosts, extensions}` — how many
     California cameras list a video address (see "Why a camera shows a picture and not
     video"). Information only; the Globe still shows stills.
   - `globe_cameras_failed {provider, errorMessage}` — the agency was down, slow
     (12 s limit) or blocked the server. Not a code bug unless it persists.
   - `globe_world_fires_loaded {detections}` — usually tens of thousands.
   - `globe_fires_failed` with "FIRMS response is not a detections table" — the key
     is wrong, rate-limited (5,000 requests per 10 minutes) or the service changed.
   - `*_using_stale_*` — a refresh failed and the previous list was used.
3. In the browser, open a camera and confirm the picture appears. If the panel says
   "This picture could not be loaded", the agency may be refusing the request
   (see "Not verified" below) or the camera is offline.

## Not verified

The build environment has no access to these agencies' servers, so:

- The feed formats were written from the agencies' published formats and the
  open-source God's Eye View project's readers (MIT), and are tested on sample
  payloads, **not on live ones**. First live check is step 1 above.
- The licence names in `packages/hazard-feeds/src/providers.ts` were taken from that
  project's source notes and the agencies' public pages and were **not re-read
  against each agency's current terms**. Read each linked licence once before
  promoting the feature widely. Caltrans' wording ("public traffic camera data, no
  charge") is a description, not a licence name.
- Some image hosts may refuse requests with no `Referer` or from unfamiliar
  origins; the panel then shows the "could not be loaded" line.
- Not tested on a real phone, in Safari or in Firefox (Chromium only).

## Changing it

- Add or remove an agency: `packages/hazard-feeds/src/providers.ts` (table), `cameras.ts`
  (reader), `apps/web/lib/camera-feeds.ts` (address), `apps/web/next.config.mjs`
  (`img-src` for `/globe`), plus tests. The CSP test fails until all agree.
- Change how many fires are shown: `DEFAULT_MAX_FIRES` in `fire-watch.ts`.
- Change the satellites read: `SOURCES` in `apps/web/lib/global-fires.ts` (FIRMS source names).
- Change the search radius for "cameras nearby": `NEARBY_CAMERA_RADIUS_KM`.
- Change which place names appear, or from how far: `COUNTRY_VISIBLE_M` and `CITY_VISIBLE_M` in
  `packages/hazard-feeds/src/places.ts`. The names themselves are `places-data.ts`, generated
  once from Natural Earth (`ne_110m_admin_0_countries` label points; `ne_50m_populated_places_simple`
  capitals plus cities of about one million, no scientific stations or historic places). Add a
  row by hand for a missing city: `[name, longitude, latitude, tier]`, tier 0 (very large) to 2.
- Change how close or far a person can zoom: `MIN_ZOOM_DISTANCE_M` / `MAX_ZOOM_DISTANCE_M` in
  `apps/web/app/globe/globe-viewer.tsx`.

## Heat alerts near your places (v116, Decision #033)

**What it does.** When a satellite heat detection (the same NASA FIRMS data the Globe
shows) is within 10 km of a place someone saved (home place, a field, an insured
property, a monitored location they can open), they get an **Alert** in the Notification
Center and on the bell: "Satellite heat near North field. A satellite saw heat about 4 km
from North field, 2 hours ago. This is not a confirmed fire: it may be farm burning or a
gas flare. Open the Globe to take a look." Its link opens the Globe with that fire area
already selected, where the cameras nearby, "Look at the place" and the call button are.

**What it does not do.** It runs **only while someone has the app open** (the bell asks
every few minutes; the check runs at most every 15 minutes per person). Nothing is pushed
to a phone, SMS or email, and nobody is woken up. A detection is not a confirmed fire.
Nobody with no saved place gets anything.

**Rules worth knowing.** An `alert`, never `critical`. One per place per day (a dismissed
one is not brought back that day). Low-confidence detections and anything older than a day
are ignored. The person can turn it off in Settings → Notifications. Needs
`NASA_FIRMS_MAP_KEY` (without it the check quietly does nothing).

**When it seems not to work.** Read the logs within an hour (Vercel keeps about an hour on
the free plan): `heat_watch_checked` (`places`, `withHeat`) means a check ran;
`heat_watch_failed` means NASA could not be read (the next try is 15 minutes later);
`heat_watch_places_capped` means more than 50 places were saved and only 50 were checked;
`notification_summary_heat_failed` means the start of the check failed (a database read).
No log line at all usually means the person has the switch off, was checked less than 15
minutes ago, or has no saved place or no `NASA_FIRMS_MAP_KEY`. A database error naming
`heat_watch_enabled`, `heat_synced_at` or `notifications_source_check` means migration 0023
has not been applied (see `docs/runbooks/apply-migrations.md`).

**Changing it.** The distance and limits: `HEAT_WATCH_RADIUS_KM`, `HEAT_SYNC_INTERVAL_MS`,
`HEAT_WATCH_MAX_PLACES` in `services/identity-service/src/notifications.ts`. The text: the
`notifications.msg.heatNear.*` and `settings.notifications.heatWatch*` keys in the five
catalogs. How a Globe link picks the fire: `FOCUS_MATCH_KM` in `apps/web/app/globe/globe-shell.tsx`.
Reaching people when the app is closed needs email, SMS or push: a vendor, a cost and a
consent decision, not built.
