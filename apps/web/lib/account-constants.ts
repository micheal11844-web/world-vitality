/**
 * Shared by the account Server Actions and the Settings page. Lives in
 * its own file because a `"use server"` module may only export async
 * functions — constants exported from `account-actions.ts` would break
 * the build.
 */
export const MAX_DISPLAY_NAME_LENGTH = 80;
/** The word a person types to confirm account deletion. */
export const DELETE_CONFIRMATION_WORD = "DELETE";
