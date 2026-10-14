"use client";

import { useState, useTransition, type CSSProperties } from "react";
import { useRouter } from "next/navigation";
import { AppShell, Button, Card, Text } from "@world-vitality/ui-components";
import { TIER_LABELS, TIER_ORDER, type NotificationTier } from "@world-vitality/identity-service";
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
  /** Pre-formatted on the server ("5 minutes ago") so server and client render the same text. */
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

const linkButton: CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  minHeight: "2.75rem",
  padding: "0 0.875rem",
  borderRadius: "var(--wv-radius-sm)",
  border: "1px solid var(--wv-border)",
  color: "var(--wv-text-primary)",
  textDecoration: "none",
  fontFamily: "var(--wv-font-sans)",
  fontSize: "0.875rem",
};

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

function statusMessage(status: AlertStatusView, hasOfficialAlerts: boolean): string {
  switch (status.kind) {
    case "no_place":
      return "Official weather alerts are shown for your home place, and you haven’t set one yet.";
    case "out_of_coverage":
      return `Official alerts here come from the U.S. National Weather Service, which covers the U.S. and its territories. ${status.place} is outside that area, so none are shown — that doesn’t mean nothing is happening there.`;
    case "checked": {
      const when = status.checkedAgo ? ` Last checked ${status.checkedAgo}.` : "";
      return hasOfficialAlerts
        ? `Showing official alerts from the National Weather Service for ${status.place}.${when}`
        : `No official alerts from the National Weather Service are showing for ${status.place}.${when}`;
    }
    case "failed": {
      const place = status.place ? ` for ${status.place}` : "";
      const last = status.lastCheckedAgo ? ` Last successful check: ${status.lastCheckedAgo}.` : "";
      return `We couldn’t reach the National Weather Service just now, so there may be official alerts${place} that aren’t shown here.${last} For anything urgent, use your local official sources.`;
    }
  }
}

function TierLabel({ tier }: { tier: NotificationTier }) {
  if (tier === "critical") {
    return (
      <span
        style={{
          display: "inline-flex",
          alignItems: "center",
          gap: "0.375rem",
          fontSize: "0.75rem",
          fontWeight: 700,
          letterSpacing: "0.06em",
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
        CRITICAL
      </span>
    );
  }
  return (
    <span
      style={{
        fontFamily: "var(--wv-font-sans)",
        fontSize: "0.75rem",
        fontWeight: 600,
        letterSpacing: "0.06em",
        color: "var(--wv-text-secondary)",
      }}
    >
      {tier === "alert" ? "ALERT" : "INFO"}
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

  const total = TIER_ORDER.reduce((sum, tier) => sum + groups[tier].length, 0);
  const showCheckAgain = status.kind === "checked" || status.kind === "failed";

  return (
    <AppShell
      brand={<AppBrand />}
      sidebarSections={[
        {
          key: "workspaces",
          label: "Workspaces",
          items: [
            { key: "home", label: "Home", href: "/dashboard" },
            ...buildWorkspaceSidebarItems(),
          ],
        },
        {
          key: "account",
          label: "Account",
          items: [
            { key: "notifications", label: "Notifications", href: "/notifications", active: true },
            { key: "settings", label: "Settings", href: "/settings" },
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
            Notifications
          </Text>
          <div style={{ display: "flex", alignItems: "center", gap: "var(--wv-space-sm)" }}>
            {unreadCount > 0 && (
              <Button
                variant="secondary"
                size="sm"
                loading={pending}
                onClick={() => run(markAllNotificationsReadAction)}
              >
                Mark all as read
              </Button>
            )}
            <a href="/settings#notifications" style={linkButton}>
              Preferences
            </a>
          </div>
        </div>

        {loadFailed && (
          <Text variant="body" role="alert" style={{ color: "var(--wv-critical)" }}>
            We couldn’t load your notifications just now. Please refresh to try again.
          </Text>
        )}

        <Card>
          <div style={stack}>
            <Text variant="body" role="status">
              {statusMessage(status, hasOfficialAlerts)}
            </Text>
            <div style={{ display: "flex", gap: "var(--wv-space-sm)", flexWrap: "wrap" }}>
              {status.kind === "no_place" && (
                <a href="/welcome?redo=1" style={linkButton}>
                  Set your home place
                </a>
              )}
              {showCheckAgain && (
                <Button
                  variant="secondary"
                  size="sm"
                  loading={pending}
                  onClick={() => run(checkAlertsNowAction)}
                >
                  Check again
                </Button>
              )}
            </div>
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
                {TIER_LABELS[tier]}
              </Text>
              {items.length === 0 ? (
                <Text variant="body" style={secondary}>
                  Nothing here.
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
                          {item.unread && <span style={{ fontWeight: 700 }}>Unread · </span>}
                          {item.ago}
                        </Text>
                      </div>
                      <Text variant="body" as="h3" style={{ fontWeight: 600, margin: 0 }}>
                        {item.title}
                      </Text>
                      {item.body && <Text variant="body">{item.body}</Text>}
                      {item.detail && (
                        <details style={{ fontFamily: "var(--wv-font-sans)" }}>
                          <summary style={{ cursor: "pointer", fontSize: "0.875rem" }}>
                            Full official text
                          </summary>
                          <p
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
                          <a href={item.href} style={linkButton}>
                            View
                          </a>
                        )}
                        {item.unread && (
                          <Button
                            variant="secondary"
                            size="sm"
                            disabled={pending}
                            onClick={() => run(() => markNotificationReadAction(item.id))}
                          >
                            Mark as read
                          </Button>
                        )}
                        <Button
                          variant="ghost"
                          size="sm"
                          disabled={pending}
                          onClick={() => run(() => dismissNotificationAction(item.id))}
                        >
                          Dismiss
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
            Your inbox is empty.
          </Text>
        )}

        <Text variant="caption" style={secondary}>
          World Vitality shows official alerts only while you have it open — it doesn’t send push,
          SMS or email notifications yet. For emergencies, follow your local authorities.
        </Text>
      </div>
    </AppShell>
  );
}
