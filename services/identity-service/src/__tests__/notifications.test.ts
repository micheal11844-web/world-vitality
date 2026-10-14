import { test } from "node:test";
import assert from "node:assert/strict";
import {
  DEFAULT_NOTIFICATION_SETTINGS,
  fieldCommentNotification,
  groupByTier,
  isNwsCoverageCountry,
  isStillActive,
  isSyncDue,
  membershipAddedNotification,
  officialAlertTier,
  officialAlertToNotification,
  safeInternalHref,
  summarize,
  timeAgo,
  truncateText,
  visibleNotifications,
  type Notification,
  type OfficialAlertInput,
} from "../notifications.js";

const NOW = new Date("2026-10-13T12:00:00Z");

function n(overrides: Partial<Notification> = {}): Notification {
  return {
    id: "n1",
    source: "official_alert",
    tier: "info",
    title: "t",
    body: null,
    detail: null,
    href: null,
    createdAt: "2026-10-13T10:00:00Z",
    expiresAt: null,
    readAt: null,
    dismissedAt: null,
    ...overrides,
  };
}

function alert(overrides: Partial<OfficialAlertInput> = {}): OfficialAlertInput {
  return {
    id: "urn:oid:1",
    event: "Flash Flood Warning",
    headline: "Flash Flood Warning issued for Travis County",
    severity: "Severe",
    urgency: "Immediate",
    certainty: "Observed",
    description: "Heavy rain is causing flooding.",
    instruction: "Move to higher ground now.",
    areaDesc: "Travis County",
    effective: "2026-10-13T11:30:00Z",
    expires: "2026-10-13T15:00:00Z",
    senderName: "NWS Austin/San Antonio TX",
    ...overrides,
  };
}

// ---- officialAlertTier --------------------------------------------------

test("Extreme severity is critical regardless of urgency (unless past)", () => {
  assert.equal(
    officialAlertTier({ severity: "Extreme", urgency: "Immediate", certainty: "Observed" }),
    "critical",
  );
  assert.equal(
    officialAlertTier({ severity: "Extreme", urgency: "Expected", certainty: "Likely" }),
    "critical",
  );
});

test("Severe + Immediate is critical; Severe otherwise is an alert", () => {
  assert.equal(officialAlertTier({ severity: "Severe", urgency: "Immediate" }), "critical");
  assert.equal(officialAlertTier({ severity: "Severe", urgency: "Expected" }), "alert");
  assert.equal(officialAlertTier({ severity: "Severe", urgency: "Future" }), "alert");
});

test("Moderate is an alert; Minor and Unknown are informational", () => {
  assert.equal(officialAlertTier({ severity: "Moderate", urgency: "Expected" }), "alert");
  assert.equal(officialAlertTier({ severity: "Minor", urgency: "Expected" }), "info");
  assert.equal(officialAlertTier({ severity: "Unknown", urgency: "Unknown" }), "info");
});

test("a Past event is not shown at all", () => {
  assert.equal(officialAlertTier({ severity: "Extreme", urgency: "Past" }), null);
});

test("an Unlikely certainty is capped below critical", () => {
  assert.equal(
    officialAlertTier({ severity: "Extreme", urgency: "Immediate", certainty: "Unlikely" }),
    "alert",
  );
});

test("matching is case-insensitive and whitespace-tolerant", () => {
  assert.equal(officialAlertTier({ severity: " severe ", urgency: "IMMEDIATE" }), "critical");
});

// ---- isStillActive ------------------------------------------------------

test("isStillActive", () => {
  assert.equal(isStillActive("2026-10-13T13:00:00Z", NOW), true);
  assert.equal(isStillActive("2026-10-13T11:00:00Z", NOW), false);
  assert.equal(isStillActive(null, NOW), true);
  assert.equal(isStillActive("not a date", NOW), true);
});

// ---- safeInternalHref ---------------------------------------------------

test("safeInternalHref only allows in-app paths", () => {
  assert.equal(safeInternalHref("/workspaces/agriculture"), "/workspaces/agriculture");
  assert.equal(safeInternalHref("/settings#notifications"), "/settings#notifications");
  assert.equal(safeInternalHref("//evil.example"), null);
  assert.equal(safeInternalHref("https://evil.example"), null);
  assert.equal(safeInternalHref("javascript:alert(1)"), null);
  assert.equal(safeInternalHref("/a\\b"), null);
  assert.equal(safeInternalHref("/a\nb"), null);
  assert.equal(safeInternalHref("/" + "x".repeat(250)), null);
  assert.equal(safeInternalHref(null), null);
  assert.equal(safeInternalHref(""), null);
});

// ---- truncateText -------------------------------------------------------

test("truncateText leaves short text alone and cuts long text on a word", () => {
  assert.equal(truncateText("  short   text ", 50), "short text");
  const out = truncateText("The quick brown fox jumps over the lazy dog", 20);
  assert.ok(out.endsWith("…"));
  assert.ok(out.length <= 20);
  assert.ok(!out.includes("  "));
});

// ---- visibleNotifications ----------------------------------------------

test("dismissed and expired notifications are hidden", () => {
  const items = [
    n({ id: "ok" }),
    n({ id: "dismissed", dismissedAt: "2026-10-13T11:00:00Z" }),
    n({ id: "expired", expiresAt: "2026-10-13T11:00:00Z" }),
  ];
  const visible = visibleNotifications(items, DEFAULT_NOTIFICATION_SETTINGS, NOW);
  assert.deepEqual(
    visible.map((x) => x.id),
    ["ok"],
  );
});

test("'alerts and up' hides informational official alerts but never critical or alert", () => {
  const items = [
    n({ id: "c", tier: "critical" }),
    n({ id: "a", tier: "alert" }),
    n({ id: "i", tier: "info" }),
  ];
  const visible = visibleNotifications(
    items,
    { officialMinTier: "alert", collaborationEnabled: true },
    NOW,
  );
  assert.deepEqual(visible.map((x) => x.id).sort(), ["a", "c"]);
});

test("turning collaboration off hides only collaboration items", () => {
  const items = [
    n({ id: "official", source: "official_alert", tier: "info" }),
    n({ id: "collab", source: "collaboration", tier: "info" }),
  ];
  const visible = visibleNotifications(
    items,
    { officialMinTier: "info", collaborationEnabled: false },
    NOW,
  );
  assert.deepEqual(
    visible.map((x) => x.id),
    ["official"],
  );
});

test("a critical alert can never be hidden by settings", () => {
  const items = [n({ id: "c", tier: "critical" })];
  for (const officialMinTier of ["info", "alert"] as const) {
    for (const collaborationEnabled of [true, false]) {
      assert.equal(
        visibleNotifications(items, { officialMinTier, collaborationEnabled }, NOW).length,
        1,
      );
    }
  }
});

// ---- groupByTier / summarize -------------------------------------------

test("groupByTier keeps tiers separate and orders unread-first, then newest", () => {
  const items = [
    n({ id: "info-new", tier: "info", createdAt: "2026-10-13T11:59:00Z" }),
    n({ id: "crit-old", tier: "critical", createdAt: "2026-10-12T01:00:00Z" }),
    n({ id: "alert-read-new", tier: "alert", createdAt: "2026-10-13T11:00:00Z", readAt: "x" }),
    n({ id: "alert-unread-old", tier: "alert", createdAt: "2026-10-13T08:00:00Z" }),
  ];
  const g = groupByTier(items);
  assert.deepEqual(
    g.critical.map((x) => x.id),
    ["crit-old"],
  );
  assert.deepEqual(
    g.alert.map((x) => x.id),
    ["alert-unread-old", "alert-read-new"],
  );
  assert.deepEqual(
    g.info.map((x) => x.id),
    ["info-new"],
  );
});

test("an old critical item still sits in the critical group above newer routine ones", () => {
  const g = groupByTier([
    n({ id: "routine", tier: "info", createdAt: "2026-10-13T11:59:00Z" }),
    n({ id: "crit", tier: "critical", createdAt: "2026-10-01T00:00:00Z" }),
  ]);
  assert.equal(g.critical[0]?.id, "crit");
});

test("summarize counts unread and critical-unread from the visible set", () => {
  const s = summarize([
    n({ tier: "critical" }),
    n({ tier: "critical", readAt: "x" }),
    n({ tier: "alert" }),
    n({ tier: "info", readAt: "x" }),
  ]);
  assert.deepEqual(s, { unread: 2, criticalUnread: 1 });
  assert.deepEqual(summarize([]), { unread: 0, criticalUnread: 0 });
});

// ---- timeAgo / isSyncDue -----------------------------------------------

test("timeAgo", () => {
  const ago = (ms: number) => new Date(NOW.getTime() - ms).toISOString();
  assert.equal(timeAgo(ago(10_000), NOW), "just now");
  assert.equal(timeAgo(ago(60_000), NOW), "1 minute ago");
  assert.equal(timeAgo(ago(5 * 60_000), NOW), "5 minutes ago");
  assert.equal(timeAgo(ago(3 * 3600_000), NOW), "3 hours ago");
  assert.equal(timeAgo(ago(2 * 86400_000), NOW), "2 days ago");
  assert.equal(timeAgo("garbage", NOW), "");
});

test("isSyncDue respects the interval and treats missing/garbage as due", () => {
  const ago = (ms: number) => new Date(NOW.getTime() - ms).toISOString();
  assert.equal(isSyncDue(null, NOW), true);
  assert.equal(isSyncDue("garbage", NOW), true);
  assert.equal(isSyncDue(ago(5 * 60_000), NOW), false);
  assert.equal(isSyncDue(ago(11 * 60_000), NOW), true);
  assert.equal(isSyncDue(ago(30_000), NOW, 60_000), false);
  assert.equal(isSyncDue(ago(61_000), NOW, 60_000), true);
});

// ---- officialAlertToNotification ---------------------------------------

test("an active severe/immediate alert becomes a critical notification relaying official text", () => {
  const out = officialAlertToNotification(alert(), NOW);
  assert.ok(out);
  assert.equal(out.tier, "critical");
  assert.equal(out.source, "official_alert");
  assert.equal(out.title, "Flash Flood Warning");
  assert.equal(out.body, "Move to higher ground now.");
  assert.equal(out.dedupeKey, "nws:urn:oid:1");
  assert.equal(out.expiresAt, "2026-10-13T15:00:00Z");
  assert.equal(out.createdAt, "2026-10-13T11:30:00Z");
  assert.ok(out.detail?.includes("Heavy rain is causing flooding."));
  assert.ok(out.detail?.includes("What to do: Move to higher ground now."));
  assert.ok(out.detail?.includes("Issued by: NWS Austin/San Antonio TX"));
  assert.equal(out.href, null);
});

test("falls back to the headline when there is no instruction", () => {
  const out = officialAlertToNotification(alert({ instruction: null }), NOW);
  assert.equal(out?.body, "Flash Flood Warning issued for Travis County");
});

test("expired or past alerts produce nothing", () => {
  assert.equal(officialAlertToNotification(alert({ expires: "2026-10-13T11:00:00Z" }), NOW), null);
  assert.equal(officialAlertToNotification(alert({ urgency: "Past" }), NOW), null);
});

test("a future effective time is not used as the created time", () => {
  const out = officialAlertToNotification(alert({ effective: "2026-10-14T00:00:00Z" }), NOW);
  assert.equal(out?.createdAt, NOW.toISOString());
});

test("an unparseable expiry is stored as no expiry, not a bad string", () => {
  const out = officialAlertToNotification(alert({ expires: "soon" }), NOW);
  assert.equal(out?.expiresAt, null);
});

test("very long official text is only ever shortened", () => {
  const long = "word ".repeat(2000);
  const out = officialAlertToNotification(alert({ description: long, instruction: long }), NOW);
  assert.ok(out);
  assert.ok((out.body ?? "").length <= 240);
  assert.ok((out.detail ?? "").length <= 3900);
});

// ---- collaboration builders --------------------------------------------

test("field comment notification uses display name, else the email's local part only", () => {
  const withName = fieldCommentNotification({
    commentId: "c1",
    fieldName: "North Field",
    commenterDisplayName: "Ada",
    commenterEmail: "ada@example.com",
    commentBody: "Looks dry.",
  });
  assert.equal(withName.title, "Ada commented on North Field");
  assert.equal(withName.dedupeKey, "comment:c1");
  assert.equal(withName.tier, "info");
  assert.equal(withName.source, "collaboration");

  const noName = fieldCommentNotification({
    commentId: "c2",
    fieldName: "North Field",
    commenterDisplayName: null,
    commenterEmail: "ada.lovelace@example.com",
    commentBody: "x",
  });
  assert.equal(noName.title, "ada.lovelace commented on North Field");
  assert.ok(!noName.title.includes("@"));
});

test("membership notification links to the workspace and is idempotent per day", () => {
  const a = membershipAddedNotification({
    workspaceId: "agriculture",
    workspaceLabel: "Agriculture",
    roleLabel: "Operational user",
    now: NOW,
  });
  assert.equal(a.href, "/workspaces/agriculture");
  assert.equal(a.title, "You now have access to Agriculture");
  assert.equal(a.dedupeKey, "member:agriculture:2026-10-13");
});

test("isNwsCoverageCountry: U.S. and territories yes, elsewhere no, unknown null", () => {
  assert.equal(isNwsCoverageCountry("United States"), true);
  assert.equal(isNwsCoverageCountry("  puerto rico "), true);
  assert.equal(isNwsCoverageCountry("Guam"), true);
  assert.equal(isNwsCoverageCountry("Nigeria"), false);
  assert.equal(isNwsCoverageCountry("Canada"), false);
  assert.equal(isNwsCoverageCountry(null), null);
  assert.equal(isNwsCoverageCountry(""), null);
});
