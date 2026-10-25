"use client";

import Link from "next/link";
import { Card, Text } from "@world-vitality/ui-components";
import type { MessageKey } from "@world-vitality/i18n";
import { useI18n } from "../../lib/i18n/i18n-provider";

interface WorkspaceCard {
  /** Matches `WORKSPACE_LINKS` keys and `Persona.workspaceKey`. */
  key: string;
  /** Catalog keys, so the name and description follow the reader's language. */
  nameKey: MessageKey;
  descriptionKey: MessageKey;
  href: string;
}

export const WORKSPACE_CARDS: WorkspaceCard[] = [
  {
    key: "agriculture",
    nameKey: "workspace.agriculture.name",
    descriptionKey: "workspace.agriculture.description",
    href: "/workspaces/agriculture",
  },
  {
    key: "weather",
    nameKey: "workspace.weather.name",
    descriptionKey: "workspace.weather.description",
    href: "/workspaces/weather",
  },
  {
    key: "construction",
    nameKey: "workspace.construction.name",
    descriptionKey: "workspace.construction.description",
    href: "/workspaces/construction",
  },
  {
    key: "renewable-energy",
    nameKey: "workspace.renewable-energy.name",
    descriptionKey: "workspace.renewable-energy.description",
    href: "/workspaces/renewable-energy",
  },
  {
    key: "research",
    nameKey: "workspace.research.name",
    descriptionKey: "workspace.research.description",
    href: "/workspaces/research",
  },
  {
    key: "logistics",
    nameKey: "workspace.logistics.name",
    descriptionKey: "workspace.logistics.description",
    href: "/workspaces/logistics",
  },
  {
    key: "disaster-monitoring",
    nameKey: "workspace.disaster-monitoring.name",
    descriptionKey: "workspace.disaster-monitoring.description",
    href: "/workspaces/disaster-monitoring",
  },
  {
    key: "government-ngos",
    nameKey: "workspace.government-ngos.name",
    descriptionKey: "workspace.government-ngos.description",
    href: "/workspaces/government-ngos",
  },
  {
    key: "insurance",
    nameKey: "workspace.insurance.name",
    descriptionKey: "workspace.insurance.description",
    href: "/workspaces/insurance",
  },
  {
    key: "education",
    nameKey: "workspace.education.name",
    descriptionKey: "workspace.education.description",
    href: "/workspaces/education",
  },
];

/**
 * The grid of workspace cards, shared by the Home dashboard and the
 * Workspaces page so the two can never drift apart. The user's own
 * workspace (from onboarding, PRD B.1) comes first and is labelled; the
 * rest keep the standard order.
 */
export function WorkspaceCardGrid({ recommendedKey = null }: { recommendedKey?: string | null }) {
  const { t } = useI18n();
  const orderedCards = [
    ...WORKSPACE_CARDS.filter((c) => c.key === recommendedKey),
    ...WORKSPACE_CARDS.filter((c) => c.key !== recommendedKey),
  ];

  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fill, minmax(16rem, 1fr))",
        gap: "var(--wv-space-md)",
      }}
    >
      {orderedCards.map((card) => {
        const recommended = card.key === recommendedKey;
        return (
          <Link
            key={card.key}
            href={card.href}
            // block + full height, with the card filling it: otherwise each card is only
            // as tall as its own text and a row of cards ends at ragged heights.
            style={{ display: "block", height: "100%", textDecoration: "none", color: "inherit" }}
          >
            <Card style={{ height: "100%", boxSizing: "border-box" }}>
              {recommended && (
                <Text
                  variant="caption"
                  style={{ color: "var(--wv-accent)", textTransform: "uppercase" }}
                >
                  {t("dashboard.recommended")}
                </Text>
              )}
              <Text variant="sectionTitle" as="h2">
                {t(card.nameKey)}
              </Text>
              <Text
                variant="body"
                style={{ color: "var(--wv-text-secondary)", marginTop: "var(--wv-space-xs)" }}
              >
                {t(card.descriptionKey)}
              </Text>
            </Card>
          </Link>
        );
      })}
    </div>
  );
}
