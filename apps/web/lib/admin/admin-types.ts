/**
 * Shapes passed between the admin Server Actions and the client screens.
 * Dates are already formatted on the server, and workspace and role names
 * are already turned into words, so the client just prints them.
 */

export interface LookupUserView {
  userId: string;
  email: string | null;
  displayName: string | null;
  createdAt: string | null;
  /** `null` means the sign-in system could not be reached. */
  emailConfirmed: boolean | null;
  lastSignInAt: string | null;
  onboarded: boolean;
  language: string | null;
  memberships: { workspace: string; role: string; scoped: boolean }[];
}

export type LookupActionResult =
  | { status: "denied" }
  | { status: "invalid"; message: string }
  | { status: "not_found" }
  | { status: "error"; message: string }
  | { status: "found"; user: LookupUserView };

export interface SourceCheckView {
  id: string;
  healthy: boolean;
  detail: string | null;
  milliseconds: number;
}

export type CheckActionResult =
  | { status: "denied" }
  | { status: "error"; message: string }
  | { status: "ok"; checkedAt: string; results: SourceCheckView[] };
