"use client";

import { ReferenceSitesMap } from "../../reference-sites-map";
import type { SiteReading } from "../../../../lib/reference-sites";

export interface MapViewProps {
  sites: SiteReading[];
  failedSites?: number;
}

/**
 * Education's map view: the shared multi-marker `ReferenceSitesMap`
 * in `"moisture"` mode (plain-language ground wetness). Replaced this workspace's
 * single-hardcoded-point map — see `lib/reference-sites.ts` for what
 * the sites are and why they are labelled as samples.
 */
export function MapView({ sites, failedSites }: MapViewProps) {
  return <ReferenceSitesMap mode="moisture" sites={sites} failedSites={failedSites} />;
}
