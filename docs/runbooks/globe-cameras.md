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
- **Teal: public cameras** from five agencies (below), thinned to one per ~5 km
  square and at most 600 per agency so the map stays readable.

Tapping a dot opens a side panel (a bottom sheet on a phone):

- **Heat detection:** what it is (and is not), how many detections, strongest
  heat output, satellite confidence, how long ago the satellite passed, the up to
  four nearest cameras with their pictures, distance and direction.
- **Camera:** the agency's own still picture, name, the agency's credit and licence
  link, how often it updates, a line that it is a still that can be minutes old.
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

Only the camera **lists** pass through the server. The **pictures** are loaded
from the agency's own host by the viewer's browser, only after they open a
camera (or a fire that lists it), with no referrer sent. Nothing is copied,
recorded or stored. The Globe page's Content-Security-Policy lets pictures (and
nothing else) come from those five hosts; `packages/hazard-feeds`'s
`csp-sources.test.ts` fails if `next.config.mjs` and the provider table drift apart.

There is **nothing for Nigeria or the rest of Africa**: no open, official public
camera feed was found that permits reuse. The panel says so ("Cameras are only
available in California, New South Wales, British Columbia, London and Finland").
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
known agency within 25 km: US/CA 911, GB 999, AU 000, FI 112. Otherwise the
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
     in the hundreds or thousands (Finland and California are the largest).
   - **`globe_cameras_empty {provider}` — the agency answered but no camera passed
     the checks. The format has probably changed: fix the reader in
     `packages/hazard-feeds/src/cameras.ts` and add a test with a sample of the new shape.**
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
