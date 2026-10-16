import { cache } from "react";
import type { UserPreferences } from "@world-vitality/identity-service";
import { getAccountService } from "./account";
import { getSessionUserId } from "./get-session-user-id";
import { logApplication } from "./logger";

/**
 * The signed-in user's preferences (onboarding persona + home place),
 * or `null` when there is no session **or the lookup failed**.
 *
 * Memoised per request (`cache`), so the page, its layout and the
 * language lookup share one read.
 *
 * `null` deliberately means "don't know", and callers treat it as
 * "carry on without personalisation" — in particular the Dashboard
 * only redirects to onboarding when it *positively* learns the user
 * hasn't onboarded (a real row/default with `onboardedAt === null`),
 * never on a failed lookup. A preferences outage must degrade to a
 * plain, working app, not trap people in a redirect loop.
 */
export const getMyPreferences = cache(async (): Promise<UserPreferences | null> => {
  const userId = await getSessionUserId();
  if (!userId) return null;
  try {
    return await getAccountService().getPreferences(userId);
  } catch (err) {
    logApplication.error("preferences_lookup_failed", err);
    return null;
  }
});
