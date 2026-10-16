"use client";

import { useState } from "react";
import Link from "next/link";
import {
  AppShell,
  Card,
  StateDisplay,
  Text,
  type QueryKind,
  type SearchSuggestion,
} from "@world-vitality/ui-components";
import { useI18n } from "../../lib/i18n/i18n-provider";
import { AppBrand } from "../app-brand";
import { buildWorkspaceSidebarItems } from "../workspaces/workspace-nav";

export interface SearchViewProps {
  query: string;
  kind: QueryKind;
  topics: SearchSuggestion[];
  places: SearchSuggestion[];
  /** For a question: the place name pulled out of it, if any. */
  placeQuery: string | null;
  placesFailed: boolean;
  signedIn: boolean;
}

// These are queries that work today (the topic keywords are English), so
// they stay English even on a translated page.
const EXAMPLES = ["flood", "Lagos", "soil moisture", "invite a teammate", "solar"];

function ResultList({
  id,
  heading,
  items,
}: {
  id: string;
  heading: string;
  items: SearchSuggestion[];
}) {
  const { t } = useI18n();
  const headingId = `search-${id}`;
  return (
    <section aria-labelledby={headingId} style={{ display: "grid", gap: "var(--wv-space-sm)" }}>
      <Text variant="sectionTitle" as="h2" id={headingId}>
        {heading}
      </Text>
      <ul
        style={{
          listStyle: "none",
          margin: 0,
          padding: 0,
          display: "grid",
          gap: "var(--wv-space-sm)",
        }}
      >
        {items.map((item) => (
          <li key={`${item.kind}-${item.id}`}>
            <Card>
              <Link
                href={item.href}
                style={{
                  color: "var(--wv-text-primary)",
                  fontFamily: "var(--wv-font-sans)",
                  fontSize: "1rem",
                  fontWeight: 600,
                  textDecoration: "none",
                }}
              >
                {item.label}
              </Link>{" "}
              <Text variant="caption" as="span" style={{ color: "var(--wv-text-secondary)" }}>
                · {t(`chrome.search.kind.${item.kind}`)}
              </Text>
              {item.description && (
                <Text variant="body" style={{ color: "var(--wv-text-secondary)" }}>
                  {item.description}
                </Text>
              )}
            </Card>
          </li>
        ))}
      </ul>
    </section>
  );
}

/**
 * Global Search results page (PRD B.4) — see `page.tsx` for what each
 * kind of query does. Renders for signed-in and anonymous visitors
 * alike; only the account controls and sidebar "Home" link differ.
 */
export function SearchView({
  query,
  kind,
  topics,
  places,
  placeQuery,
  placesFailed,
  signedIn,
}: SearchViewProps) {
  const { t } = useI18n();
  const [aiPanelOpen, setAiPanelOpen] = useState(false);
  const hasResults = topics.length > 0 || places.length > 0;
  const hasGatedResults = topics.some((item) => item.kind === "workspace" || item.kind === "page");

  return (
    <AppShell
      brand={<AppBrand />}
      showAccountMenu={signedIn}
      sidebarSections={[
        {
          key: "workspaces",
          label: t("nav.workspaces"),
          items: [
            ...(signedIn ? [{ key: "home", label: t("nav.home"), href: "/dashboard" }] : []),
            ...buildWorkspaceSidebarItems(undefined, undefined, t),
          ],
        },
      ]}
      aiPanelOpen={aiPanelOpen}
      onToggleAiPanel={() => setAiPanelOpen((v) => !v)}
    >
      <div style={{ display: "grid", gap: "var(--wv-space-lg)", maxWidth: "44rem" }}>
        <div>
          <Text variant="pageTitle" as="h1">
            {t("search.title")}
          </Text>
          {query && (
            <Text variant="body" style={{ color: "var(--wv-text-secondary)" }}>
              {t("search.resultsFor", { query })}
            </Text>
          )}
        </div>

        {!query && (
          <StateDisplay
            status="empty"
            title={t("search.empty.title")}
            description={t("search.empty.description", {
              examples: EXAMPLES.join(t("common.listSeparator")),
            })}
          />
        )}

        {query && kind === "question" && (
          <Card>
            <Text variant="sectionTitle" as="h2">
              {t("search.question.title")}
            </Text>
            <Text variant="body" style={{ color: "var(--wv-text-secondary)" }}>
              {placeQuery
                ? t("search.question.bodyWithPlace", { place: placeQuery })
                : t("search.question.body")}
            </Text>
          </Card>
        )}

        {topics.length > 0 && (
          <ResultList id="topics" heading={t("search.workspacesAndPages")} items={topics} />
        )}

        {places.length > 0 && (
          <ResultList
            id="places"
            heading={
              placeQuery ? t("search.placesMatching", { place: placeQuery }) : t("search.places")
            }
            items={places}
          />
        )}

        {query && !hasResults && (
          <StateDisplay
            status="empty"
            title={t("search.nothingMatched", { query })}
            description={t("search.nothingMatchedHelp")}
          />
        )}

        {placesFailed && (
          <Text variant="caption" role="status" style={{ color: "var(--wv-text-secondary)" }}>
            {t("search.placesFailed")}
          </Text>
        )}

        {!signedIn && hasGatedResults && (
          <Text variant="caption" style={{ color: "var(--wv-text-secondary)" }}>
            {t("search.signedOutNote")} <Link href="/login">{t("search.signIn")}</Link>
          </Text>
        )}
      </div>
    </AppShell>
  );
}
