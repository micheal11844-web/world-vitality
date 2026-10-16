/**
 * Notification Center core (PRD B.6; Experience Blueprint Section 12):
 * the pure rules for how notifications are tiered, filtered by the
 * user's settings, grouped for display and counted for the header bell.
 * No I/O here — `AccountService` stores them, `apps/web` fetches and
 * renders them — so every rule is unit-testable.
 *
 * **Three tiers, never sorted purely by recency** (Blueprint: "a
 * critical item can never be buried beneath routine ones"):
 *
 * - `critical` — a life-safety official alert. The visual language for
 *   this tier is reserved for it alone.
 * - `alert`    — an official alert worth attention but not an emergency.
 * - `info`     — everything routine, including collaboration activity.
 *
 * **Tiering is deliberately conservative and relays an official
 * agency's own classification.** World Vitality never invents a hazard
 * level from raw weather numbers (the Constitution's "zero tolerance"
 * rule for this domain — see `apps/web/lib/nws-alerts.ts`); `critical`
 * is only ever the National Weather Service's own `Extreme` severity,
 * or `Severe` + `Immediate`.
 */

export type NotificationTier = "critical" | "alert" | "info";

/** Display order, most severe first. */
export const TIER_ORDER: readonly NotificationTier[] = ["critical", "alert", "info"];

export const TIER_LABELS: Record<NotificationTier, string> = {
  critical: "Critical",
  alert: "Alerts",
  info: "Informational",
};

export type NotificationSource = "official_alert" | "collaboration";

/**
 * What a notification *says*, as data, for the ones the app writes
 * itself (collaboration events): an internal id plus string parameters.
 * The inbox renders the sentence in the reader's current language;
 * `title`/`body` keep the English rendering as the fallback. Official
 * alerts have none — the agency's own text is never re-worded.
 */
export type NotificationMessageKey = "field_comment" | "member_added";

export type NotificationMessageParams = Record<string, string>;

export function isNotificationMessageKey(value: unknown): value is NotificationMessageKey {
  return value === "field_comment" || value === "member_added";
}

export interface Notification {
  id: string;
  source: NotificationSource;
  tier: NotificationTier;
  title: string;
  /** One or two plain sentences, safe to show collapsed. */
  body: string | null;
  /** The full official text, shown on expand. Only official alerts have one. */
  detail: string | null;
  /** In-app path only (see `safeInternalHref`). */
  href: string | null;
  createdAt: string;
  /** When an official alert stops being active. `null` = never expires. */
  expiresAt: string | null;
  readAt: string | null;
  dismissedAt: string | null;
  messageKey: NotificationMessageKey | null;
  messageParams: NotificationMessageParams | null;
}

/** What goes in when a notification is created (the store assigns the rest). */
export interface NewNotification {
  source: NotificationSource;
  tier: NotificationTier;
  title: string;
  body?: string | null;
  detail?: string | null;
  href?: string | null;
  /** Makes creation idempotent per user (e.g. `nws:<alert id>`). */
  dedupeKey?: string | null;
  expiresAt?: string | null;
  /** Defaults to "now"; official alerts use their own issue time. */
  createdAt?: string | null;
  /** See `NotificationMessageKey`. Omit for official alerts. */
  messageKey?: NotificationMessageKey | null;
  messageParams?: NotificationMessageParams | null;
}

/** The `official_min_tier` choices: show every official alert, or only alerts and up. */
export type OfficialMinTier = "info" | "alert";

export interface NotificationSettings {
  /**
   * Smallest official-alert tier to show. `critical` is deliberately not
   * a choice: safety-critical alerts can't be switched off (Blueprint:
   * "sensible, safety-conscious defaults pre-set rather than requiring
   * every user to configure safety-critical alerts").
   */
  officialMinTier: OfficialMinTier;
  collaborationEnabled: boolean;
  /** When official alerts were last checked for this user (throttle). */
  alertsSyncedAt: string | null;
}

export const DEFAULT_NOTIFICATION_SETTINGS: NotificationSettings = {
  officialMinTier: "info",
  collaborationEnabled: true,
  alertsSyncedAt: null,
};

export function isOfficialMinTier(value: unknown): value is OfficialMinTier {
  return value === "info" || value === "alert";
}

export function isNotificationTier(value: unknown): value is NotificationTier {
  return value === "critical" || value === "alert" || value === "info";
}

/**
 * Maps a National Weather Service alert's own classification to a tier.
 * Returns `null` for an alert that should not be shown at all.
 *
 * - `urgency: "Past"`  → `null` (the event is over).
 * - `severity: "Extreme"` → `critical` (e.g. a tornado warning).
 * - `severity: "Severe"` + `urgency: "Immediate"` → `critical`
 *   (e.g. a flash flood warning: act now).
 * - other `Severe` / `Moderate` → `alert`.
 * - `Minor` and `Unknown` → `info`.
 * - `certainty: "Unlikely"` is never `critical`; it is capped at `alert`.
 *
 * Values are NWS's CAP vocabulary, matched case-insensitively.
 */
export function officialAlertTier(alert: {
  severity: string;
  urgency: string;
  certainty?: string;
}): NotificationTier | null {
  const severity = alert.severity.trim().toLowerCase();
  const urgency = alert.urgency.trim().toLowerCase();
  const certainty = (alert.certainty ?? "").trim().toLowerCase();

  if (urgency === "past") return null;

  let tier: NotificationTier;
  if (severity === "extreme" || (severity === "severe" && urgency === "immediate")) {
    tier = "critical";
  } else if (severity === "severe" || severity === "moderate") {
    tier = "alert";
  } else {
    tier = "info";
  }

  if (tier === "critical" && certainty === "unlikely") return "alert";
  return tier;
}

/** True when an official alert's own end time has not passed. A missing or unparseable end counts as active. */
export function isStillActive(expiresAt: string | null | undefined, now: Date): boolean {
  if (!expiresAt) return true;
  const end = Date.parse(expiresAt);
  if (Number.isNaN(end)) return true;
  return end > now.getTime();
}

/**
 * Accepts only an in-app path ("/…", not protocol-relative "//…", no
 * backslashes or control characters), so a stored `href` can never turn
 * a notification into an open redirect or a `javascript:` link.
 */
export function safeInternalHref(href: string | null | undefined): string | null {
  if (!href) return null;
  if (href.length > 200) return null;
  if (!href.startsWith("/") || href.startsWith("//")) return null;
  // eslint-disable-next-line no-control-regex
  if (/[\\\u0000-\u001f\u007f]/.test(href)) return null;
  return href;
}

/** Trims to `max` characters on a word boundary where possible, adding an ellipsis. */
export function truncateText(text: string, max: number): string {
  const clean = text.replace(/\s+/g, " ").trim();
  if (clean.length <= max) return clean;
  const slice = clean.slice(0, Math.max(0, max - 1));
  const lastSpace = slice.lastIndexOf(" ");
  const cut = lastSpace > max * 0.6 ? slice.slice(0, lastSpace) : slice;
  return `${cut.replace(/[\s.,;:!-]+$/, "")}…`;
}

/**
 * The notifications a user should currently see: not dismissed, not
 * expired, and passing their settings. Critical official alerts always
 * pass — settings can only narrow `info` (or, for the "alerts and up"
 * choice, `info`-tier official alerts) and collaboration items.
 */
export function visibleNotifications(
  all: readonly Notification[],
  settings: Pick<NotificationSettings, "officialMinTier" | "collaborationEnabled">,
  now: Date,
): Notification[] {
  return all.filter((n) => {
    if (n.dismissedAt) return false;
    if (!isStillActive(n.expiresAt, now)) return false;
    if (n.source === "collaboration") return settings.collaborationEnabled;
    if (n.tier === "info" && settings.officialMinTier === "alert") return false;
    return true;
  });
}

/**
 * Splits notifications into the three tiers. Within a tier, unread come
 * first and then newest first — but a tier is never merged with another,
 * so ordering inside one can't bury something in a more severe one.
 */
export function groupByTier(
  items: readonly Notification[],
): Record<NotificationTier, Notification[]> {
  const groups: Record<NotificationTier, Notification[]> = { critical: [], alert: [], info: [] };
  for (const item of items) groups[item.tier].push(item);
  for (const tier of TIER_ORDER) {
    groups[tier].sort((a, b) => {
      const unreadA = a.readAt ? 1 : 0;
      const unreadB = b.readAt ? 1 : 0;
      if (unreadA !== unreadB) return unreadA - unreadB;
      return Date.parse(b.createdAt) - Date.parse(a.createdAt);
    });
  }
  return groups;
}

export interface NotificationSummary {
  /** Unread, visible notifications. */
  unread: number;
  /** Of those, how many are critical. Drives the bell's reserved styling. */
  criticalUnread: number;
}

/** Counts for the header bell, from the already-visible set. */
export function summarize(visible: readonly Notification[]): NotificationSummary {
  let unread = 0;
  let criticalUnread = 0;
  for (const n of visible) {
    if (n.readAt) continue;
    unread += 1;
    if (n.tier === "critical") criticalUnread += 1;
  }
  return { unread, criticalUnread };
}

/** "5 minutes ago", "2 hours ago", "3 days ago", "just now". Plain, no locale machinery. */
export function timeAgo(iso: string, now: Date): string {
  const then = Date.parse(iso);
  if (Number.isNaN(then)) return "";
  const seconds = Math.max(0, Math.round((now.getTime() - then) / 1000));
  if (seconds < 45) return "just now";
  const minutes = Math.round(seconds / 60);
  if (minutes < 60) return `${minutes} minute${minutes === 1 ? "" : "s"} ago`;
  const hours = Math.round(minutes / 60);
  if (hours < 24) return `${hours} hour${hours === 1 ? "" : "s"} ago`;
  const days = Math.round(hours / 24);
  return `${days} day${days === 1 ? "" : "s"} ago`;
}

/** How long official alerts are trusted before a re-check (milliseconds). */
export const ALERT_SYNC_INTERVAL_MS = 10 * 60 * 1000;

/** Minimum gap between *manual* "check again" presses (milliseconds). */
export const MANUAL_SYNC_MIN_GAP_MS = 60 * 1000;

/**
 * Whether official alerts are due for a re-check. `minGapMs` is the
 * interval that must have elapsed since the last check — the automatic
 * interval normally, the shorter manual gap for an explicit press.
 */
export function isSyncDue(
  alertsSyncedAt: string | null,
  now: Date,
  minGapMs: number = ALERT_SYNC_INTERVAL_MS,
): boolean {
  if (!alertsSyncedAt) return true;
  const last = Date.parse(alertsSyncedAt);
  if (Number.isNaN(last)) return true;
  return now.getTime() - last >= minGapMs;
}

/** Notifications older than this are pruned on sync. */
export const NOTIFICATION_RETENTION_DAYS = 90;

/** The fields of a National Weather Service alert this module needs (mirrors `NwsAlert` in apps/web). */
export interface OfficialAlertInput {
  id: string;
  event: string;
  headline: string;
  severity: string;
  urgency: string;
  certainty: string;
  description: string;
  instruction: string | null;
  areaDesc: string;
  effective: string;
  expires: string;
  senderName: string;
}

const TITLE_MAX = 160;
const BODY_MAX = 240;
const DETAIL_MAX = 3900;

function parseableOrNull(iso: string | null | undefined): string | null {
  if (!iso) return null;
  return Number.isNaN(Date.parse(iso)) ? null : iso;
}

/**
 * Turns one active official alert into a notification — or `null` when
 * it shouldn't be shown (event over, or its end time has passed).
 *
 * The agency's own words are relayed, not rewritten: the collapsed
 * summary is the alert's official instruction when it has one (that *is*
 * the action-oriented text), otherwise its headline; the expanded detail
 * carries the full description, instruction, area and issuer. Truncation
 * only ever shortens, never paraphrases.
 */
export function officialAlertToNotification(
  alert: OfficialAlertInput,
  now: Date,
): NewNotification | null {
  const tier = officialAlertTier(alert);
  if (!tier) return null;
  if (!isStillActive(alert.expires, now)) return null;

  const title = truncateText(alert.event || alert.headline || "Weather alert", TITLE_MAX);
  const summarySource = alert.instruction?.trim() || alert.headline?.trim() || alert.description;
  const detailParts = [
    alert.headline?.trim(),
    alert.description?.trim(),
    alert.instruction?.trim() ? `What to do: ${alert.instruction.trim()}` : "",
    alert.areaDesc ? `Area: ${alert.areaDesc}` : "",
    alert.senderName ? `Issued by: ${alert.senderName}` : "",
  ].filter(Boolean);

  // Use the alert's own issue time for ordering/display, never a future one.
  const effective = parseableOrNull(alert.effective);
  const createdAt =
    effective && Date.parse(effective) <= now.getTime() ? effective : now.toISOString();

  return {
    source: "official_alert",
    tier,
    title,
    body: summarySource ? truncateText(summarySource, BODY_MAX) : null,
    detail: detailParts.length ? truncateText(detailParts.join("\n\n"), DETAIL_MAX) : null,
    href: null,
    dedupeKey: `nws:${alert.id}`.slice(0, 190),
    expiresAt: parseableOrNull(alert.expires),
    createdAt,
  };
}

/**
 * "Someone commented on a field you created." Informational. Names the
 * commenter by display name, falling back to the part of their email
 * before the "@" — never the full address.
 */
export function fieldCommentNotification(input: {
  commentId: string;
  fieldName: string;
  commenterDisplayName: string | null;
  commenterEmail: string | null;
  commentBody: string;
}): NewNotification {
  const named =
    input.commenterDisplayName?.trim() || input.commenterEmail?.split("@")[0]?.trim() || "";
  const who = named || "Someone";
  return {
    source: "collaboration",
    tier: "info",
    title: truncateText(`${who} commented on ${input.fieldName}`, TITLE_MAX),
    body: truncateText(input.commentBody, BODY_MAX),
    href: "/workspaces/agriculture",
    dedupeKey: `comment:${input.commentId}`,
    messageKey: "field_comment",
    // `who` is "" when the commenter is unknown, so the reader's language supplies "Someone".
    messageParams: { who: named, field: input.fieldName },
  };
}

/** "You now have access to <workspace>." Informational, links to the workspace. */
export function membershipAddedNotification(input: {
  workspaceId: string;
  workspaceLabel: string;
  /** The role id (e.g. `operational_user`) — rendered in the reader's language. */
  roleId: string;
  roleLabel: string;
  now: Date;
}): NewNotification {
  return {
    source: "collaboration",
    tier: "info",
    title: truncateText(`You now have access to ${input.workspaceLabel}`, TITLE_MAX),
    body: `Your role there: ${input.roleLabel}.`,
    href: safeInternalHref(`/workspaces/${input.workspaceId}`),
    dedupeKey: `member:${input.workspaceId}:${input.now.toISOString().slice(0, 10)}`,
    messageKey: "member_added",
    messageParams: {
      workspaceId: input.workspaceId,
      workspaceLabel: input.workspaceLabel,
      roleId: input.roleId,
      roleLabel: input.roleLabel,
    },
  };
}

const NWS_COVERAGE_COUNTRIES = new Set([
  "united states",
  "united states of america",
  "usa",
  "us",
  "u.s.",
  "puerto rico",
  "guam",
  "american samoa",
  "northern mariana islands",
  "u.s. virgin islands",
  "us virgin islands",
  "virgin islands, u.s.",
  "united states virgin islands",
]);

/**
 * Whether a home place's country is one the National Weather Service
 * covers (the U.S. and its territories). `null` when the country is
 * unknown — callers then try the API and let it say.
 *
 * This exists so the inbox never says "no active alerts" for a place
 * no alert source covers: absence of coverage is not good news.
 */
export function isNwsCoverageCountry(country: string | null | undefined): boolean | null {
  if (!country?.trim()) return null;
  return NWS_COVERAGE_COUNTRIES.has(country.trim().toLowerCase());
}
