"use client";

import { useState, useTransition, type CSSProperties } from "react";
import { useRouter } from "next/navigation";
import { AppShell, Button, ButtonLink, Card, Text } from "@world-vitality/ui-components";
import { TIER_ORDER, type NotificationTier } from "@world-vitality/identity-service";
import type { Translate } from "@world-vitality/i18n";
import { useI18n } from "../../lib/i18n/i18n-provider";
import { AppBrand } from "../app-brand";
import { buildWorkspaceSidebarItems } from "../workspaces/workspace-nav";
import {
  checkAlertsNowAction,
  dismissNotificationAction,
  markAllNotificationsReadAction,
  markNotificationReadAction,
} from "../../lib/notification-actions";

export interface NotificationItemView {
  id: string;
  tier: NotificationTier;
  source: "official_alert" | "collaboration";
  title: string;
  body: string | null;
  detail: string | null;
  href: string | null;
  /** Pre-formatted on the server ("5 minutes ago", in the reader's language) so server and client render the same text. */
  ago: string;
  unread: boolean;
}

export type AlertStatusView =
  | { kind: "no_place" }
  | { kind: "out_of_coverage"; place: string }
  | { kind: "checked"; place: string; checkedAgo: string | null }
  | { kind: "failed"; place: string | null; lastCheckedAgo: string | null };

export interface NotificationsViewProps {
  groups: Record<NotificationTier, NotificationItemView[]>;
  unreadCount: number;
  status: AlertStatusView;
  hasOfficialAlerts: boolean;
  loadFailed: boolean;
}

const stack = { display: "flex", flexDirection: "column", gap: "var(--wv-space-md)" } as const;

const secondary = { color: "var(--wv-text-secondary)" } as const;

/**
 * Tier styling. The critical treatment — heavy border, tinted ground,
 * the CRITICAL label with its "!" mark — is used here and nowhere else
 * (Experience Blueprint Section 12: reserved so it keeps its meaning).
 * Every tier also carries its name as text, so colour is never the only
 * signal.
 */
function tierCardStyle(tier: NotificationTier, unread: boolean): CSSProperties {
  if (tier === "critical") {
    return {
      border: "2px solid var(--wv-critical)",
      backgroundColor: "var(--wv-color-critical-50)",
    };
  }
  return {
    border: `1px solid ${unread ? "var(--wv-accent)" : "var(--wv-border)"}`,
    backgroundColor: "var(--wv-surface)",
  };
}

function statusMessage(status: AlertStatusView, hasOfficialAlerts: boolean, t: Translate): string {
  switch (status.kind) {
    case "no_place":
      return t("notifications.status.noPlace");
    case "out_of_coverage":
      return t("notifications.status.outOfCoverage", { place: status.place });
    case "checked": {
      const main = hasOfficialAlerts
        ? t("notifications.status.showing", { place: status.place })
        : t("notifications.status.none", { place: status.place });
      return status.checkedAgo
        ? `${main} ${t("notifications.status.lastChecked", { ago: status.checkedAgo })}`
        : main;
    }
    case "failed": {
      const main = status.place
        ? t("notifications.status.failedPlace", { place: status.place })
        : t("notifications.status.failed");
      return status.lastCheckedAgo
        ? `${main} ${t("notifications.status.lastSuccess", { ago: status.lastCheckedAgo })}`
        : main;
    }
  }
}

function TierLabel({ tier }: { tier: NotificationTier }) {
  const { t, dir } = useI18n();
  // Spaced capitals are an English-style emphasis: the capitals come from
  // CSS (so they only apply where a script has them) and the tracking is
  // dropped for Arabic, where it would pull joined letters apart.
  const tracking = dir === "rtl" ? 0 : "0.06em";
  if (tier === "critical") {
    return (
      <span
        style={{
          display: "inline-flex",
          alignItems: "center",
          gap: "0.375rem",
          fontSize: "0.75rem",
          fontWeight: 700,
          letterSpacing: tracking,
          textTransform: "uppercase",
          color: "var(--wv-critical)",
        }}
      >
        <span
          aria-hidden="true"
          style={{
            display: "inline-flex",
            alignItems: "center",
            justifyContent: "center",
            width: "1.125rem",
            height: "1.125rem",
            borderRadius: "999px",
            backgroundColor: "var(--wv-critical)",
            color: "#ffffff",
            fontSize: "0.75rem",
            lineHeight: 1,
          }}
        >
          !
        </span>
        {t("notifications.tag.critical")}
      </span>
    );
  }
  return (
    <span
      style={{
        fontFamily: "var(--wv-font-sans)",
        fontSize: "0.75rem",
        fontWeight: 600,
        letterSpacing: tracking,
        textTransform: "uppercase",
        color: "var(--wv-text-secondary)",
      }}
    >
      {tier === "alert" ? t("notifications.tag.alert") : t("notifications.tag.info")}
    </span>
  );
}

export function NotificationsView({
  groups,
  unreadCount,
  status,
  hasOfficialAlerts,
  loadFailed,
}: NotificationsViewProps) {
  const { t, locale } = useI18n();
  const router = useRouter();
  const [aiPanelOpen, setAiPanelOpen] = useState(false);
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | undefined>();

  function run(action: () => Promise<{ ok: boolean; error?: string }>) {
    setError(undefined);
    startTransition(async () => {
      const result = await action();
      if (!result.ok) setError(result.error);
      router.refresh();
    });
  }

  // An agency's alert text is shown exactly as issued, in English, and is
  // marked as such (language + direction) when the page is in another
  // language. The app's own notifications follow the page.
  const textLang = (item: NotificationItemView) =>
    item.source === "official_alert" && locale !== "en"
      ? ({ lang: "en", dir: "ltr" } as const)
      : {};

  const total = TIER_ORDER.reduce((sum, tier) => sum + groups[tier].length, 0);
  const showCheckAgain = status.kind === "checked" || status.kind === "failed";

  return (
    <AppShell
      brand={<AppBrand />}
      sidebarSections={[
        {
          key: "workspaces",
          label: t("nav.workspaces"),
          items: [
            { key: "home", label: t("nav.home"), href: "/dashboard" },
            ...buildWorkspaceSidebarItems(undefined, undefined, t),
          ],
        },
        {
          key: "account",
          label: t("nav.account"),
          items: [
            {
              key: "notifications",
              label: t("nav.notifications"),
              href: "/notifications",
              active: true,
            },
            { key: "settings", label: t("nav.settings"), href: "/settings" },
          ],
        },
      ]}
      aiPanelOpen={aiPanelOpen}
      onToggleAiPanel={() => setAiPanelOpen((v) => !v)}
    >
      <div style={{ ...stack, maxWidth: "44rem" }}>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            flexWrap: "wrap",
            gap: "var(--wv-space-md)",
          }}
        >
          <Text variant="pageTitle" as="h1">
            {t("notifications.title")}
          </Text>
          <div style={{ display: "flex", alignItems: "center", gap: "var(--wv-space-sm)" }}>
            {unreadCount > 0 && (
              <Button
                variant="secondary"
                size="sm"
                loading={pending}
                onClick={() => run(markAllNotificationsReadAction)}
              >
                {t("notifications.markAllRead")}
              </Button>
            )}
            <ButtonLink href="/settings#notifications" size="sm">
              {t("notifications.preferences")}
            </ButtonLink>
          </div>
        </div>

        {loadFailed && (
          <Text variant="body" role="alert" style={{ color: "var(--wv-critical)" }}>
            {t("notifications.loadFailed")}
          </Text>
        )}

        <Card>
          <div style={stack}>
            <Text variant="body" role="status">
              {statusMessage(status, hasOfficialAlerts, t)}
            </Text>
            {/* Only rendered when there is something to put in it: an empty
                row still takes a flex gap and left a hollow strip at the foot of
                this card. */}
            {(status.kind === "no_place" || showCheckAgain) && (
              <div style={{ display: "flex", gap: "var(--wv-space-sm)", flexWrap: "wrap" }}>
                {status.kind === "no_place" && (
                  <ButtonLink href="/welcome?redo=1" size="sm">
                    {t("notifications.setHomePlace")}
                  </ButtonLink>
                )}
                {showCheckAgain && (
                  <Button
                    variant="secondary"
                    size="sm"
                    loading={pending}
                    onClick={() => run(checkAlertsNowAction)}
                  >
                    {t("notifications.checkAgain")}
                  </Button>
                )}
              </div>
            )}
          </div>
        </Card>

        {error && (
          <Text variant="caption" role="alert" style={{ color: "var(--wv-critical)" }}>
            {error}
          </Text>
        )}

        {TIER_ORDER.map((tier) => {
          const items = groups[tier];
          // An empty Critical section is deliberately not rendered: a
          // "Critical — nothing" row would read as an all-clear, which
          // this page can't promise (see the status card above).
          if (tier === "critical" && items.length === 0) return null;
          return (
            <section key={tier} aria-labelledby={`tier-${tier}`} style={stack}>
              <Text variant="sectionTitle" as="h2" id={`tier-${tier}`}>
                {t(`notifications.tier.${tier}`)}
              </Text>
              {items.length === 0 ? (
                <Text variant="body" style={secondary}>
                  {t("common.nothingHere")}
                </Text>
              ) : (
                <ul style={{ ...stack, listStyle: "none", margin: 0, padding: 0 }}>
                  {items.map((item) => (
                    <li
                      key={item.id}
                      style={{
                        ...tierCardStyle(item.tier, item.unread),
                        borderRadius: "var(--wv-radius-md)",
                        padding: "var(--wv-space-md)",
                        display: "flex",
                        flexDirection: "column",
                        gap: "var(--wv-space-sm)",
                      }}
                    >
                      <div
                        style={{
                          display: "flex",
                          justifyContent: "space-between",
                          alignItems: "baseline",
                          gap: "var(--wv-space-sm)",
                          flexWrap: "wrap",
                        }}
                      >
                        <TierLabel tier={item.tier} />
                        <Text variant="caption" style={secondary}>
                          {item.unread && (
                            <span style={{ fontWeight: 700 }}>{t("notifications.unread")} · </span>
                          )}
                          {item.ago}
                        </Text>
                      </div>
                      <Text
                        variant="body"
                        as="h3"
                        style={{ fontWeight: 600, margin: 0 }}
                        {...textLang(item)}
                      >
                        {item.title}
                      </Text>
                      {item.body && (
                        <Text variant="body" {...textLang(item)}>
                          {item.body}
                        </Text>
                      )}
                      {item.detail && (
                        <details style={{ fontFamily: "var(--wv-font-sans)" }}>
                          <summary style={{ cursor: "pointer", fontSize: "0.875rem" }}>
                            {t("notifications.fullOfficialText")}
                          </summary>
                          <p
                            {...textLang(item)}
                            style={{
                              whiteSpace: "pre-wrap",
                              margin: "var(--wv-space-sm) 0 0",
                              fontFamily: "var(--wv-font-sans)",
                              fontSize: "0.875rem",
                              lineHeight: 1.5,
                            }}
                          >
                            {item.detail}
                          </p>
                        </details>
                      )}
                      <div style={{ display: "flex", gap: "var(--wv-space-sm)", flexWrap: "wrap" }}>
                        {item.href && (
                          <ButtonLink href={item.href} size="sm">
                            {t("notifications.view")}
                          </ButtonLink>
                        )}
                        {item.unread && (
                          <Button
                            variant="secondary"
                            size="sm"
                            disabled={pending}
                            onClick={() => run(() => markNotificationReadAction(item.id))}
                          >
                            {t("notifications.markRead")}
                          </Button>
                        )}
                        <Button
                          variant="ghost"
                          size="sm"
                          disabled={pending}
                          onClick={() => run(() => dismissNotificationAction(item.id))}
                        >
                          {t("notifications.dismiss")}
                        </Button>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </section>
          );
        })}

        {total === 0 && !loadFailed && (
          <Text variant="body" style={secondary}>
            {t("notifications.inboxEmpty")}
          </Text>
        )}

        {locale !== "en" && hasOfficialAlerts && (
          <Text variant="caption" style={secondary}>
            {t("notifications.officialEnglishNote")}
          </Text>
        )}

        <Text variant="caption" style={secondary}>
          {t("notifications.footnote")}
        </Text>
      </div>
    </AppShell>
  );
}
