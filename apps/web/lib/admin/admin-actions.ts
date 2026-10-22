"use server";

import { ROLE_LABELS } from "../role-labels";
import { WORKSPACE_LINKS } from "../../app/workspaces/workspace-nav";
import { logApplication, logSecurity } from "../logger";
import { getStaffService, staffForAction } from "../staff";
import { formatUtc } from "./format";
import { runSourceChecks } from "./source-checks";
import type { CheckActionResult, LookupActionResult } from "./admin-types";

/**
 * Server Actions for the staff console. A Server Action is a public
 * endpoint, so each one re-checks the staff permission itself rather than
 * trusting the page that happened to render the button. A caller who is not
 * allowed gets "denied" and nothing else — no hint of what exists.
 *
 * Searches go through here (a POST) rather than a `?q=` in the URL so an
 * email address never lands in the address bar, browser history or the
 * hosting provider's request logs.
 */

const LANGUAGE_NAMES: Record<string, string> = {
  en: "English",
  es: "Spanish",
  fr: "French",
  pt: "Portuguese",
  ar: "Arabic",
};

const workspaceName = (id: string) => WORKSPACE_LINKS.find((w) => w.key === id)?.label ?? id;

export async function lookupUserAction(query: string): Promise<LookupActionResult> {
  const staff = await staffForAction("users:lookup");
  if (!staff) return { status: "denied" };
  if (typeof query !== "string" || query.length > 320) {
    return { status: "invalid", message: "Enter an email address or a user id." };
  }

  try {
    const result = await getStaffService().lookupUserForSupport(
      { userId: staff.userId, email: staff.email },
      query,
    );
    if (result.kind === "invalid") return { status: "invalid", message: result.message };
    logSecurity.info("admin_user_lookup", {
      staffUserId: staff.userId,
      outcome: result.kind,
    });
    if (result.kind === "not_found") return { status: "not_found" };
    const u = result.user;
    return {
      status: "found",
      user: {
        userId: u.userId,
        email: u.email,
        displayName: u.displayName,
        createdAt: formatUtc(u.createdAt),
        emailConfirmed: u.emailConfirmed,
        lastSignInAt: formatUtc(u.lastSignInAt),
        onboarded: u.onboarded,
        language: u.language ? (LANGUAGE_NAMES[u.language] ?? u.language) : null,
        memberships: u.memberships.map((m) => ({
          workspace: workspaceName(m.workspaceId),
          role: ROLE_LABELS[m.role] ?? m.role,
          scoped: m.scoped,
        })),
      },
    };
  } catch (err) {
    logApplication.error("admin_user_lookup_failed", err, { staffUserId: staff.userId });
    return {
      status: "error",
      message:
        "The lookup did not complete. If it could not be written to the audit log, nothing is shown. Try again, and if it keeps failing check the database.",
    };
  }
}

export async function checkSourcesAction(): Promise<CheckActionResult> {
  const staff = await staffForAction("sources:view");
  if (!staff) return { status: "denied" };
  try {
    // Written first, like every audited action: no log, no check.
    await getStaffService().recordStaffAction({
      actor: { userId: staff.userId, email: staff.email },
      action: "sources.check",
      detail: "Ran live health checks on the data sources",
    });
    const results = await runSourceChecks();
    return { status: "ok", checkedAt: new Date().toISOString(), results };
  } catch (err) {
    logApplication.error("admin_source_check_failed", err, { staffUserId: staff.userId });
    return {
      status: "error",
      message: "The checks did not run. If the audit log could not be written, nothing is checked.",
    };
  }
}
