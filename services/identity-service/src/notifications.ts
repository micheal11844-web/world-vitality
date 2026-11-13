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

/**
 * Where a notification comes from. `heat_watch` is the app telling someone that a
 * satellite saw heat near a place they saved (Decision #033): not an agency's alert
 * and not a confirmed fire, so it is never `critical` and has its own switch.
 * `billing` is the app telling the owner
 * something about their plan (a failed payment). It is neither an agency's
 * alert nor a teammate's activity, so neither of the settings that narrow
 * those two (`officialMinTier`, `collaborationEnabled`) hides it.
 */
export type NotificationSource = "official_alert" | "collaboration" | "billing" | "heat_watch";

/**
 * What a notification *says*, as data, for the ones the app writes
 * itself (collaboration events): an internal id plus string parameters.
 * The inbox renders the sentence in the reader's current language;
 * `title`/`body` keep the English rendering as the fallback. Official
 * alerts have none — the agency's own text is never re-worded.
 */
export type NotificationMessageKey =
  | "field_comment"
  | "member_added"
  | "payment_failed"
  | "payment_refunded"
  | "ownership_received"
  | "heat_near_place";

export type NotificationMessageParams = Record<string, string>;

export function isNotificationMessageKey(value: unknown): value is NotificationMessageKey {
  return (
    value === "field_comment" ||
    value === "member_added" ||
    value === "payment_failed" ||
    value === "payment_refunded" ||
    value === "ownership_received" ||
    value === "heat_near_place"
  );
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
  /** Whether to be told when a satellite sees heat near a saved place. On unless switched off. */
  heatWatchEnabled: boolean;
  /** When official alerts were last checked for this user (throttle). */
  alertsSyncedAt: string | null;
  /** When satellite heat near this user's places was last checked (throttle). */
  heatSyncedAt: string | null;
}

export const DEFAULT_NOTIFICATION_SETTINGS: NotificationSettings = {
  officialMinTier: "info",
  collaborationEnabled: true,
  heatWatchEnabled: true,
  alertsSyncedAt: null,
  heatSyncedAt: null,
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
  settings: Pick<NotificationSettings, "officialMinTier" | "collaborationEnabled"> &
    Partial<Pick<NotificationSettings, "heatWatchEnabled">>,
  now: Date,
): Notification[] {
  return all.filter((n) => {
    if (n.dismissedAt) return false;
    if (!isStillActive(n.expiresAt, now)) return false;
    // A plan notice is the owner's own business and about money: settings
    // that quiet teammates' activity or informational weather do not apply.
    if (n.source === "billing") return true;
    if (n.source === "collaboration") return settings.collaborationEnabled;
    // Heat near a saved place has its own switch, and is never narrowed by the
    // official-alert setting (it is not an agency's alert).
    if (n.source === "heat_watch") return settings.heatWatchEnabled ?? true;
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

/**
 * "Your payment didn't go through." Written when Paystack reports that a
 * renewal charge failed. An `alert`, not `critical`: it needs attention
 * soon (the plan keeps working through a grace period) but is not a safety
 * matter. One per subscription per day however often Paystack retries.
 * Links to the plan screen, where the card can be updated.
 */
export function paymentFailedNotification(input: {
  subscriptionCode: string;
  /** The plan id (e.g. `standard`) — rendered in the reader's language. */
  plan: string;
  /** English name of the plan, the stored fallback. */
  planLabel: string;
  now: Date;
}): NewNotification {
  return {
    source: "billing",
    tier: "alert",
    title: truncateText("Your payment didn't go through", TITLE_MAX),
    body: truncateText(
      `We couldn't renew your ${input.planLabel} plan. Update your card to keep it.`,
      BODY_MAX,
    ),
    href: "/billing",
    dedupeKey: `payment_failed:${input.subscriptionCode}:${input.now.toISOString().slice(0, 10)}`,
    messageKey: "payment_failed",
    messageParams: { plan: input.plan, planLabel: input.planLabel },
  };
}

/**
 * "Your refund has been processed." Written when Paystack reports that a
 * refund for one of the person's payments is done. Informational: it is good
 * news, and nothing needs doing. It says the plan is NOT changed by a refund
 * (the plan follows the subscription, and ending that is a separate step the
 * person controls from the plan screen), so nobody assumes a refund cancelled
 * their renewals. No amount: Paystack's refund events do not say plainly
 * which unit theirs is in. One per payment, however often Paystack repeats it.
 */
export function refundProcessedNotification(input: {
  /** The refunded payment's Paystack reference. */
  reference: string;
  /** The plan id (e.g. `standard`) — rendered in the reader's language. `""` when it was not one of ours. */
  plan: string;
  /** English name of the plan, the stored fallback. */
  planLabel: string;
}): NewNotification {
  const what = input.planLabel ? `your ${input.planLabel} plan payment` : "your payment";
  return {
    source: "billing",
    tier: "info",
    title: truncateText("Your refund has been processed", TITLE_MAX),
    body: truncateText(
      `We processed a refund for ${what}. It can take a few days to show in your account. A refund doesn’t change your plan; to stop renewals, cancel from Billing.`,
      BODY_MAX,
    ),
    href: "/billing",
    dedupeKey: `payment_refunded:${input.reference}`,
    messageKey: "payment_refunded",
    messageParams: { plan: input.plan, planLabel: input.planLabel },
  };
}

/**
 * "<someone> made you the owner of <organisation>." Written for the person an
 * organisation was handed to, so they learn it from the app and not by
 * finding Settings changed. Informational (the organisation and its people
 * are the same as yesterday; what moved is who is responsible for its plan).
 * Names the previous owner by display name, falling back to the part of their
 * email before the "@" — never the full address. One per hand-over: the key
 * carries the moment, so a hand-back later the same day still tells them.
 */
export function ownershipReceivedNotification(input: {
  organizationId: string;
  organizationName: string;
  fromDisplayName: string | null;
  fromEmail: string | null;
  now: Date;
}): NewNotification {
  const named = input.fromDisplayName?.trim() || input.fromEmail?.split("@")[0]?.trim() || "";
  const who = named || "Someone";
  return {
    source: "collaboration",
    tier: "info",
    title: truncateText(`${who} made you the owner of ${input.organizationName}`, TITLE_MAX),
    body: "You now manage its plan and team. Open Settings to see the people in it.",
    href: "/settings",
    dedupeKey: `ownership:${input.organizationId}:${input.now.toISOString()}`.slice(0, 190),
    messageKey: "ownership_received",
    // `who` is "" when the previous owner is unknown, so the reader's language supplies "Someone".
    messageParams: { who: named, organisation: input.organizationName },
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

/** How far from a saved place a satellite heat detection still counts as "near" (kilometres). */
export const HEAT_WATCH_RADIUS_KM = 10;

/** Minimum gap between checks of satellite heat near one user's places (milliseconds). */
export const HEAT_SYNC_INTERVAL_MS = 15 * 60 * 1000;

/** Most places checked for one person, so one account with a huge list cannot make a check slow. */
export const HEAT_WATCH_MAX_PLACES = 50;

/**
 * "A satellite saw heat near <place>." Written when a satellite heat detection
 * (NASA FIRMS) lies within `HEAT_WATCH_RADIUS_KM` of a place the person saved: their
 * home place, a field, an insured property or a monitored location.
 *
 * An `alert`, never `critical`: a detection is not a confirmed fire (it is often
 * farm burning or a gas flare), and `critical` is reserved for an agency's own
 * life-safety alert. The text says so, in the person's language, and points to the
 * Globe, where the detection, any public camera near it and the call button are.
 * One per place per day, however often it is checked: the key carries the day.
 * Expires after a day, the age of the data it came from.
 */
export function heatNearPlaceNotification(input: {
  /** A stable id for the saved place, e.g. `agriculture-<field id>` or `home`. */
  placeId: string;
  placeLabel: string;
  /** Distance to the nearest detection, in kilometres. */
  distanceKm: number;
  /** Detections within the radius. */
  detections: number;
  /** When the satellite passed over the nearest one (ISO 8601). */
  passAt: string;
  /** Where the nearest detection is, for the link to the Globe. */
  latitude: number;
  longitude: number;
  now: Date;
}): NewNotification {
  const km = Math.max(1, Math.round(input.distanceKm));
  const place = truncateText(input.placeLabel, 80);
  const when = timeAgo(input.passAt, input.now);
  const many = input.detections > 1 ? ` (${input.detections} detections)` : "";
  return {
    source: "heat_watch",
    tier: "alert",
    title: truncateText(`Satellite heat near ${place}`, TITLE_MAX),
    body: truncateText(
      `A satellite saw heat about ${km} km from ${place}${when ? `, ${when}` : ""}${many}. This is not a confirmed fire: it may be farm burning or a gas flare. Open the Globe to take a look.`,
      BODY_MAX,
    ),
    href: safeInternalHref(
      `/globe?heat=${input.latitude.toFixed(3)},${input.longitude.toFixed(3)}`,
    ),
    dedupeKey: `heat:${input.placeId}:${input.now.toISOString().slice(0, 10)}`.slice(0, 190),
    expiresAt: new Date(input.now.getTime() + 24 * 60 * 60 * 1000).toISOString(),
    messageKey: "heat_near_place",
    messageParams: {
      place,
      km: String(km),
      detections: String(input.detections),
      passAt: input.passAt,
    },
  };
}
