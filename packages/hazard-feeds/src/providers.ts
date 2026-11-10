import type { CameraProviderId, CameraProviderInfo } from "./types.js";

/**
 * The only camera feeds the Globe connects to, and what each one requires.
 *
 * **How a source gets on this list.** It is an official, public traffic or
 * road-weather camera service published by the agency that runs the
 * cameras, under terms that let other apps show the pictures with credit
 * (open-data licences, or a stated "no charge" public feed). Sources whose
 * terms forbid reuse are left out on purpose even though the cameras are
 * visible on their own websites: Florida's FL511 (personal use only), Houston
 * TranStar (no linking to images without written permission) and New York
 * City DOT (needs a signed agreement). Nothing here is a private camera, a
 * security camera, or an unsecured stream found by scanning.
 *
 * The camera pictures are loaded straight from the agency by the viewer's
 * browser, only when that viewer opens a camera, and are never copied,
 * stored or altered by World Vitality. `imageOrigin` pins every picture
 * address to the agency's own host, so a changed or poisoned feed cannot make
 * the Globe load a picture from anywhere else.
 */
export const CAMERA_PROVIDERS: Record<CameraProviderId, CameraProviderInfo> = {
  caltrans: {
    id: "caltrans",
    attribution: "California Department of Transportation (Caltrans)",
    licenceName: "Public traffic camera data, no charge (Caltrans CWWP)",
    licenceUrl: "https://cwwp2.dot.ca.gov/",
    sourceUrl: "https://cwwp2.dot.ca.gov/",
    countryCode: "US",
    imageOrigin: "https://cwwp2.dot.ca.gov/",
    cspImageSource: "https://cwwp2.dot.ca.gov",
  },
  tfl: {
    id: "tfl",
    attribution: "Powered by TfL Open Data",
    licenceName: "TfL Open Data terms",
    licenceUrl: "https://tfl.gov.uk/info-for/open-data-users/",
    sourceUrl: "https://api.tfl.gov.uk/Place/Type/JamCam",
    countryCode: "GB",
    imageOrigin: "https://s3-eu-west-1.amazonaws.com/jamcams.tfl.gov.uk/",
    cspImageSource: "https://s3-eu-west-1.amazonaws.com/jamcams.tfl.gov.uk/",
  },
  nsw: {
    id: "nsw",
    attribution: "Live Traffic NSW, Transport for NSW",
    licenceName: "Creative Commons Attribution 4.0 (CC BY 4.0)",
    licenceUrl: "https://creativecommons.org/licenses/by/4.0/",
    sourceUrl: "https://opendata.transport.nsw.gov.au/",
    countryCode: "AU",
    imageOrigin: "https://webcams.transport.nsw.gov.au/",
    cspImageSource: "https://webcams.transport.nsw.gov.au",
  },
  digitraffic: {
    id: "digitraffic",
    attribution: "Fintraffic / digitraffic.fi",
    licenceName: "Creative Commons Attribution 4.0 (CC BY 4.0)",
    licenceUrl: "https://www.digitraffic.fi/en/terms-of-service/",
    sourceUrl: "https://www.digitraffic.fi/en/road-traffic/",
    countryCode: "FI",
    imageOrigin: "https://weathercam.digitraffic.fi/",
    cspImageSource: "https://weathercam.digitraffic.fi",
  },
  drivebc: {
    id: "drivebc",
    attribution: "DriveBC, Government of British Columbia",
    licenceName: "Open Government Licence – British Columbia",
    licenceUrl: "https://www2.gov.bc.ca/gov/content/data/open-data/open-government-licence-bc",
    sourceUrl: "https://www.drivebc.ca/",
    countryCode: "CA",
    imageOrigin: "https://www.drivebc.ca/images/",
    cspImageSource: "https://www.drivebc.ca",
  },
};

export const CAMERA_PROVIDER_IDS = Object.keys(CAMERA_PROVIDERS) as CameraProviderId[];

/** Every `img-src` source the camera pictures need, for the Globe page's Content-Security-Policy. */
export const CAMERA_IMAGE_CSP_SOURCES: string[] = CAMERA_PROVIDER_IDS.map(
  (id) => CAMERA_PROVIDERS[id].cspImageSource,
);
