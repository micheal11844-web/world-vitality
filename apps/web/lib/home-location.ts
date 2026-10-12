import { homePlaceLabel } from "@world-vitality/identity-service";
import { getMyPreferences } from "./preferences";

/** A location a workspace page fetches data for, and how to describe it. */
export interface WorkspaceLocation {
  id: string;
  latitude: number;
  longitude: number;
  /** Human label, e.g. "Ibadan, Oyo, Nigeria". */
  label: string;
  /** `true` when this is the user's own home place, `false` for the demo fallback. */
  isHome: boolean;
}

/**
 * The location a workspace's home page should show: the user's home
 * place from onboarding when they have one, otherwise the workspace's
 * own demo location (the hard-coded coordinates every location-driven
 * page used before onboarding existed — kept as the honest fallback,
 * and labelled as a demo so nobody mistakes it for their own place).
 *
 * `isHome` lets the page say which one it is; see `LocationNote`.
 */
export async function resolveWorkspaceLocation(demo: {
  id: string;
  latitude: number;
  longitude: number;
  label: string;
}): Promise<WorkspaceLocation> {
  const prefs = await getMyPreferences();
  const place = prefs?.homePlace;
  if (place) {
    return {
      id: "home-place",
      latitude: place.latitude,
      longitude: place.longitude,
      label: homePlaceLabel(place),
      isHome: true,
    };
  }
  return { ...demo, isHome: false };
}
