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

const KIND_LABEL: Record<SearchSuggestion["kind"], string> = {
  workspace: "Workspace",
  page: "Page",
  setting: "Setting",
  tool: "Tool",
  place: "Place",
};

const EXAMPLES = ["flood", "Lagos", "soil moisture", "invite a teammate", "solar"];

function ResultList({ heading, items }: { heading: string; items: SearchSuggestion[] }) {
  const headingId = `search-${heading.toLowerCase().replace(/[^a-z]+/g, "-")}`;
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
                · {KIND_LABEL[item.kind]}
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
  const [aiPanelOpen, setAiPanelOpen] = useState(false);
  const hasResults = topics.length > 0 || places.length > 0;
  const hasGatedResults = topics.some((t) => t.kind === "workspace" || t.kind === "page");

  return (
    <AppShell
      brand={<AppBrand />}
      showAccountMenu={signedIn}
      sidebarSections={[
        {
          key: "workspaces",
          label: "Workspaces",
          items: [
            ...(signedIn ? [{ key: "home", label: "Home", href: "/dashboard" }] : []),
            ...buildWorkspaceSidebarItems(),
          ],
        },
      ]}
      aiPanelOpen={aiPanelOpen}
      onToggleAiPanel={() => setAiPanelOpen((v) => !v)}
    >
      <div style={{ display: "grid", gap: "var(--wv-space-lg)", maxWidth: "44rem" }}>
        <div>
          <Text variant="pageTitle" as="h1">
            Search
          </Text>
          {query && (
            <Text variant="body" style={{ color: "var(--wv-text-secondary)" }}>
              Results for “{query}”
            </Text>
          )}
        </div>

        {!query && (
          <StateDisplay
            status="empty"
            title="Search anything"
            description={`Try a place, a topic or a page — for example: ${EXAMPLES.join(", ")}. Press / anywhere to jump to the search box.`}
          />
        )}

        {query && kind === "question" && (
          <Card>
            <Text variant="sectionTitle" as="h2">
              I can’t answer that question directly
            </Text>
            <Text variant="body" style={{ color: "var(--wv-text-secondary)" }}>
              Search finds workspaces, pages and places. I don’t have a reliable source for
              open-ended questions, so I won’t guess. Here’s where the parts of your question live
              {placeQuery ? `, including “${placeQuery}”` : ""}.
            </Text>
          </Card>
        )}

        {topics.length > 0 && <ResultList heading="Workspaces and pages" items={topics} />}

        {places.length > 0 && (
          <ResultList
            heading={placeQuery ? `Places matching “${placeQuery}”` : "Places"}
            items={places}
          />
        )}

        {query && !hasResults && (
          <StateDisplay
            status="empty"
            title={`Nothing matched “${query}”`}
            description="Try a place name, a topic like flood or solar, or a page like team or settings."
          />
        )}

        {placesFailed && (
          <Text variant="caption" role="status" style={{ color: "var(--wv-text-secondary)" }}>
            Place lookup isn’t available right now, so only workspaces and pages are shown. Try
            again in a moment.
          </Text>
        )}

        {!signedIn && hasGatedResults && (
          <Text variant="caption" style={{ color: "var(--wv-text-secondary)" }}>
            Workspaces need an account — <Link href="/login">sign in</Link> to open them. Places
            open in Public Explorer with no account.
          </Text>
        )}
      </div>
    </AppShell>
  );
}
