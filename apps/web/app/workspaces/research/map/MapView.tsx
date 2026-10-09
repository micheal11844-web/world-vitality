"use client";

import { ReferenceSitesMap } from "../../reference-sites-map";
import type { SiteReading } from "../../../../lib/reference-sites";

export interface MapViewProps {
  sites: SiteReading[];
  failedSites?: number;
}

/**
 * Research's map view: the shared multi-marker `ReferenceSitesMap`
 * in `"raw"` mode (raw, uninterpreted readings). Replaced this workspace's
 * single-hardcoded-point map — see `lib/reference-sites.ts` for what
 * the sites are and why they are labelled as samples.
 */
export function MapView({ sites, failedSites }: MapViewProps) {
  return <ReferenceSitesMap mode="raw" sites={sites} failedSites={failedSites} />;
}
