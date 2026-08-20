/**
 * Structured logging (BUILD_PLAN ticket 7.1), per Engineering Blueprint
 * Section 12: "Structured (not free-text), consistent schema across
 * services" and "Security logs — authentication, authorization, and
 * access-pattern events logged separately from general application
 * logs."
 *
 * **Honest scope.** This is the structured-logging half of Section 12,
 * built to a realistic bar for a solo-owned, pre-launch project — not
 * the full section. Not built, and flagged rather than faked:
 * - **Correlation/trace IDs** — Section 12 wants a single user action
 *   traceable across ingestion/interpretation/presentation. That needs
 *   a request-ID propagated through every service call, which none of
 *   the backend services currently accept or forward. Real work, not
 *   done here.
 * - **Monitoring dashboards / alerting** — needs a real observability
 *   vendor (Vercel's own observability, Sentry, Axiom, etc.). No vendor
 *   has been chosen or confirmed with the project owner, so nothing is
 *   wired up. Logs below go to Vercel's runtime log capture (visible via
 *   the Vercel dashboard/API) as a baseline, not a dashboard or an
 *   alert.
 * - **Audit logs** (immutable who-changed-what) — no admin/config
 *   mutation surface exists yet to audit.
 *
 * **Telemetry** (`logTelemetry`, added later — see its own doc comment
 * below) reuses this same `write()` pipeline under a third category,
 * `"telemetry"`, rather than a separate system — same reasoning as
 * `logSecurity` getting its own category instead of its own file: one
 * consistent log shape, distinguishable by category for later
 * routing/retention, not three different logging mechanisms to keep in
 * sync.
 *
 * What this *does* give, for real: every log line has a consistent
 * shape, security-relevant events are tagged distinctly from general
 * application events (`category: "security"` vs `"application"`) so
 * they could be routed/retained differently later without touching
 * every call site, and nothing here silently swallows an error the way
 * the original (pre-Stage-7) callback/action code did.
 */

export type LogCategory = "application" | "security" | "telemetry";
export type LogLevel = "info" | "warn" | "error";

export interface LogFields {
  [key: string]: string | number | boolean | undefined;
}

interface LogEntry {
  timestamp: string;
  level: LogLevel;
  category: LogCategory;
  message: string;
  fields?: LogFields;
}

function write(entry: LogEntry): void {
  const line = JSON.stringify(entry);
  if (entry.level === "error") {
    console.error(line);
  } else if (entry.level === "warn") {
    console.warn(line);
  } else {
    console.log(line);
  }
}

/**
 * General application events — request handling, data pipeline
 * results, anything that isn't specifically an auth/access event.
 */
export const logApplication = {
  info: (message: string, fields?: LogFields) =>
    write({
      timestamp: new Date().toISOString(),
      level: "info",
      category: "application",
      message,
      fields,
    }),
  warn: (message: string, fields?: LogFields) =>
    write({
      timestamp: new Date().toISOString(),
      level: "warn",
      category: "application",
      message,
      fields,
    }),
  error: (message: string, err: unknown, fields?: LogFields) =>
    write({
      timestamp: new Date().toISOString(),
      level: "error",
      category: "application",
      message,
      fields: { ...fields, errorMessage: err instanceof Error ? err.message : String(err) },
    }),
};

/**
 * Authentication/authorization/access-pattern events — logged under a
 * distinct category per Section 12, so they can be given stricter
 * retention/access controls later without re-touching every call site.
 * Never include a raw token, password, or full session value in
 * `fields` — log identifiers (email, userId) and outcomes, not secrets.
 */
export const logSecurity = {
  info: (message: string, fields?: LogFields) =>
    write({
      timestamp: new Date().toISOString(),
      level: "info",
      category: "security",
      message,
      fields,
    }),
  warn: (message: string, fields?: LogFields) =>
    write({
      timestamp: new Date().toISOString(),
      level: "warn",
      category: "security",
      message,
      fields,
    }),
  error: (message: string, err: unknown, fields?: LogFields) =>
    write({
      timestamp: new Date().toISOString(),
      level: "error",
      category: "security",
      message,
      fields: { ...fields, errorMessage: err instanceof Error ? err.message : String(err) },
    }),
};

/**
 * Product/usage telemetry — an external review flagged this as a real
 * gap (correctly; nothing tracked any user action anywhere in this
 * codebase before this) and it's built here to a realistic, honestly
 * bounded scope, same discipline as the rest of this file.
 *
 * **What this gives, for real:** every call site below adds one
 * structured event line to the same log pipeline `logApplication`/
 * `logSecurity` already use — visible in Vercel's runtime logs today,
 * queryable/exportable from there. Real events, not decorative:
 * workspace page views (server-rendered, so this captures genuine page
 * loads, not client-only navigation), the Research Dataset Explorer's
 * fetch attempts, and the auth funnel (magic link requested/verified,
 * password sign-up/sign-in, Google OAuth verified, password reset
 * requested/completed) — see each call site's own context for exactly
 * what's captured.
 *
 * **What this deliberately does NOT give yet, stated plainly rather
 * than silently implied:**
 * - **No aggregation, dashboard, or funnel visualization.** These are
 *   individual structured log lines, not a queryable events table or a
 *   product-analytics dashboard. Building either needs a real vendor
 *   decision (a hosted product-analytics tool, or a self-hosted
 *   events warehouse) — cost and, more importantly, a real
 *   consent/privacy-notice decision, neither made here. Do not wire
 *   one up without that conversation happening first.
 * - **No client-side interaction events** (sidebar collapse, AI panel
 *   toggle, button clicks that don't hit a Server Action). Capturing
 *   those would need a client → server telemetry endpoint, which
 *   doesn't exist — everything below rides on data that was already
 *   making a server round-trip anyway (a page render or a Server
 *   Action call), not new instrumentation infrastructure.
 * - **No per-user identity attached to events** — no user ID is
 *   logged on page-view events (only on already-identified auth
 *   events, where a `userId` was already being logged by
 *   `logSecurity` anyway). This is closer to anonymous usage counting
 *   than real user-journey analytics; a deliberate, conservative
 *   default given no consent mechanism exists, not an oversight.
 */
export const logTelemetry = {
  event: (name: string, fields?: LogFields) =>
    write({
      timestamp: new Date().toISOString(),
      level: "info",
      category: "telemetry",
      message: name,
      fields,
    }),
};
