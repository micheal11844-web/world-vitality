/**
 * Shared by the account Server Actions and the Settings page. Lives in
 * its own file because a `"use server"` module may only export async
 * functions — constants exported from `account-actions.ts` would break
 * the build.
 */
export const MAX_DISPLAY_NAME_LENGTH = 80;
/** The word a person types to confirm account deletion. */
export const DELETE_CONFIRMATION_WORD = "DELETE";
/**
 * The longest organisation name the form allows. The same limit lives in
 * identity-service (`MAX_ORGANIZATION_NAME_LENGTH`, which the Server Action
 * and the database enforce); this copy exists because a client component
 * must not import that package (it would pull the database client into the
 * browser). The server's check is the authoritative one.
 */
export const MAX_ORGANIZATION_NAME_LENGTH = 100;
