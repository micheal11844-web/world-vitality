"use server";

import {
  homePlaceLabel,
  parseHomePlace,
  personaById,
  personaDestination,
  type HomePlace,
} from "@world-vitality/identity-service";
import type { ConfidenceLevel } from "@world-vitality/interpretation-engine";
import { getAccountService } from "./account";
import { geocodeCandidates } from "./geocode";
import { getSessionUserId } from "./get-session-user-id";
import { tServer } from "./i18n/server";
import { logApplication, logTelemetry } from "./logger";
import { getPlaceInsight } from "./place-insight";

export interface SearchPlacesResult {
  ok: boolean;
  places?: HomePlace[];
  error?: string;
}

/**
 * Onboarding's place picker: up to five geocoder candidates for a
 * typed place. Signed-in only — onboarding sits behind the session
 * gate (the anonymous equivalent is Public Explorer).
 */
export async function searchHomePlacesAction(query: string): Promise<SearchPlacesResult> {
  if (!(await getSessionUserId()))
    return { ok: false, error: await tServer("errors.sessionExpired") };
  const trimmed = typeof query === "string" ? query.trim() : "";
  if (trimmed.length < 2 || trimmed.length > 100) {
    return { ok: false, error: await tServer("errors.typeTwoLetters") };
  }
  try {
    const found = await geocodeCandidates(trimmed, 5);
    const places = found.map((p) => parseHomePlace(p)).filter((p): p is HomePlace => p !== null);
    if (places.length === 0) {
      return {
        ok: false,
        error: await tServer("errors.noPlaceFound", { query: trimmed }),
      };
    }
    return { ok: true, places };
  } catch (err) {
    logApplication.error("onboarding_place_search_failed", err);
    return { ok: false, error: await tServer("errors.placeLookupFailed") };
  }
}

export interface PreviewInsightResult {
  ok: boolean;
  title?: string;
  summary?: string;
  explanation?: string;
  confidence?: ConfidenceLevel;
  unableToAnswer?: boolean;
  gapCount?: number;
  error?: string;
}

/** The live insight for the chosen role + place (see `getPlaceInsight`). */
export async function previewInsightAction(
  personaId: string,
  place: unknown,
): Promise<PreviewInsightResult> {
  if (!(await getSessionUserId()))
    return { ok: false, error: await tServer("errors.sessionExpired") };
  const persona = personaById(personaId);
  const home = parseHomePlace(place);
  if (!persona || !home) return { ok: false, error: await tServer("errors.pickRoleAndPlace") };
  try {
    const insight = await getPlaceInsight(persona.insight, home);
    return {
      ok: true,
      title: insight.title,
      summary: insight.result.summary,
      explanation: insight.result.explanation,
      confidence: insight.result.confidence,
      unableToAnswer: Boolean(insight.result.unableToAnswer),
      gapCount: insight.gapCount,
    };
  } catch (err) {
    logApplication.error("onboarding_insight_failed", err);
    return {
      ok: false,
      error: await tServer("errors.liveDataFailed", { place: homePlaceLabel(home) }),
    };
  }
}

export interface SaveOnboardingResult {
  ok: boolean;
  destination?: string;
  error?: string;
}

/**
 * Finishes onboarding: saves the role and (optional) home place and
 * returns where to go next — the role's workspace, or Public Explorer
 * for "just curious". A place needs a role to mean anything here, but a
 * role without a place is fine (saved as-is).
 */
export async function saveOnboardingAction(
  personaId: string | null,
  place: unknown,
): Promise<SaveOnboardingResult> {
  const userId = await getSessionUserId();
  if (!userId) return { ok: false, error: await tServer("errors.sessionExpired") };

  const persona = personaId ? personaById(personaId) : null;
  if (personaId && !persona) return { ok: false, error: await tServer("errors.invalidRole") };
  const home = place === null || place === undefined ? null : parseHomePlace(place);
  if (place !== null && place !== undefined && !home) {
    return { ok: false, error: await tServer("errors.invalidPlace") };
  }

  try {
    await getAccountService().saveOnboarding(userId, {
      persona: persona?.id ?? null,
      homePlace: home,
    });
  } catch (err) {
    logApplication.error("onboarding_save_failed", err);
    return { ok: false, error: await tServer("errors.saveFailed") };
  }

  logTelemetry.event("onboarding_completed", {
    persona: persona?.id ?? "none",
    hasPlace: home !== null,
  });
  return { ok: true, destination: persona ? personaDestination(persona) : "/dashboard" };
}

/**
 * "Skip for now" on a FIRST onboarding: remembers that they were asked
 * (so they're never asked again) with no role or place. Never wipes
 * answers a person already gave — if they've onboarded before, this is
 * a no-op, so a stray call can't erase their home place.
 */
export async function skipOnboardingAction(): Promise<{ ok: boolean; error?: string }> {
  const userId = await getSessionUserId();
  if (!userId) return { ok: false, error: await tServer("errors.sessionExpired") };
  try {
    const account = getAccountService();
    const existing = await account.getPreferences(userId);
    if (!existing.onboardedAt) {
      await account.saveOnboarding(userId, { persona: null, homePlace: null });
      logTelemetry.event("onboarding_skipped");
    }
    return { ok: true };
  } catch (err) {
    logApplication.error("onboarding_skip_failed", err);
    return { ok: false, error: await tServer("errors.saveFailed") };
  }
}

/**
 * "Remove my place" from Settings: forgets the home place but keeps the
 * role. The welcome flow promises a place "can be changed or removed in
 * Settings"; this is the removing half.
 */
export async function clearHomePlaceAction(): Promise<{ ok: boolean; error?: string }> {
  const userId = await getSessionUserId();
  if (!userId) return { ok: false, error: await tServer("errors.sessionExpired") };
  try {
    const account = getAccountService();
    const existing = await account.getPreferences(userId);
    await account.saveOnboarding(userId, { persona: existing.persona, homePlace: null });
    logTelemetry.event("home_place_removed");
    return { ok: true };
  } catch (err) {
    logApplication.error("onboarding_clear_place_failed", err);
    return { ok: false, error: await tServer("errors.removeFailed") };
  }
}
