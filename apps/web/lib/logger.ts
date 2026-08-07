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
 * What this *does* give, for real: every log line has a consistent
 * shape, security-relevant events are tagged distinctly from general
 * application events (`category: "security"` vs `"application"`) so
 * they could be routed/retained differently later without touching
 * every call site, and nothing here silently swallows an error the way
 * the original (pre-Stage-7) callback/action code did.
 */

export type LogCategory = "application" | "security";
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
