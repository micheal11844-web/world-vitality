"use client";

import { useState, type CSSProperties } from "react";
import Link from "next/link";
import { AppShell, Text } from "@world-vitality/ui-components";
import { BUSINESS_EMAIL, LEGAL_UPDATED } from "@world-vitality/support";
import { useI18n } from "../../lib/i18n/i18n-provider";
import { LanguageSwitcher } from "../../lib/i18n/language-switcher";
import { AppBrand } from "../app-brand";
import { buildAppSidebar } from "../workspaces/workspace-nav";
import type { LegalSection } from "./legal-text";

const LINK_STYLE: CSSProperties = { color: "var(--wv-accent)", textDecoration: "underline" };
const BODY: CSSProperties = { margin: 0, lineHeight: 1.6 };

/** The business address is a mail link wherever it appears in the text. */
function withMailLinks(text: string) {
  const parts = text.split(BUSINESS_EMAIL);
  return parts.flatMap((part, i) =>
    i === 0
      ? [part]
      : [
          <a key={i} href={`mailto:${BUSINESS_EMAIL}`} style={LINK_STYLE}>
            {BUSINESS_EMAIL}
          </a>,
          part,
        ],
  );
}

/**
 * A legal document (Terms of Service or Privacy Policy) inside the app shell.
 * The words come from `legal-text.ts`, in English only; the page says in the
 * person's language that the English version is the one that applies.
 */
export function LegalView({
  kind,
  sections,
  signedIn,
}: {
  kind: "terms" | "privacy";
  sections: LegalSection[];
  signedIn: boolean;
}) {
  const { t, date } = useI18n();
  const [aiPanelOpen, setAiPanelOpen] = useState(false);
  const sidebar = buildAppSidebar({ current: "legal", signedIn, t });
  const other = kind === "terms" ? "privacy" : "terms";

  return (
    <AppShell
      brand={<AppBrand />}
      showAccountMenu={signedIn}
      sidebarSections={sidebar.sections}
      sidebarDefaultExpandedKeys={sidebar.defaultExpandedKeys}
      aiPanelOpen={aiPanelOpen}
      onToggleAiPanel={() => setAiPanelOpen((v) => !v)}
    >
      <article
        data-testid={`legal-${kind}`}
        style={{
          maxWidth: "44rem",
          display: "flex",
          flexDirection: "column",
          gap: "var(--wv-space-md)",
        }}
      >
        {signedIn ? null : (
          <div style={{ alignSelf: "flex-end" }}>
            <LanguageSwitcher compact />
          </div>
        )}
        <div>
          <Text variant="pageTitle" as="h1">
            {t(kind === "terms" ? "legal.terms.title" : "legal.privacy.title")}
          </Text>
          <Text variant="caption" style={{ display: "block", marginTop: "var(--wv-space-xs)" }}>
            {t("legal.updated", {
              date: date(`${LEGAL_UPDATED}T00:00:00Z`, {
                dateStyle: "long",
                timeZone: "UTC",
              }),
            })}
          </Text>
          <Text
            variant="body"
            style={{
              color: "var(--wv-text-secondary)",
              marginTop: "var(--wv-space-sm)",
              marginBottom: 0,
            }}
          >
            {t("legal.englishOnly")}
          </Text>
        </div>

        {/* The words themselves are English whatever the page language is. */}
        <div
          lang="en"
          dir="ltr"
          style={{
            display: "flex",
            flexDirection: "column",
            gap: "var(--wv-space-lg)",
            fontFamily: "var(--wv-font-sans)",
            color: "var(--wv-text-primary)",
          }}
        >
          {sections.map((section) => (
            <section key={section.id} aria-labelledby={`${kind}-${section.id}`}>
              <Text variant="sectionTitle" as="h2" id={`${kind}-${section.id}`}>
                {section.heading}
              </Text>
              <div style={{ display: "flex", flexDirection: "column", gap: "var(--wv-space-sm)" }}>
                {section.blocks.map((block, i) =>
                  "p" in block ? (
                    <p key={i} style={BODY}>
                      {withMailLinks(block.p)}
                    </p>
                  ) : (
                    <ul key={i} style={{ ...BODY, paddingInlineStart: "1.25rem" }}>
                      {block.ul.map((item, j) => (
                        <li key={j} style={{ marginBottom: "var(--wv-space-xs)" }}>
                          {withMailLinks(item)}
                        </li>
                      ))}
                    </ul>
                  ),
                )}
              </div>
            </section>
          ))}
        </div>

        <Text variant="caption">
          <Link href={`/${other}`} style={LINK_STYLE}>
            {t(other === "terms" ? "legal.terms.title" : "legal.privacy.title")}
          </Link>
          {" · "}
          <Link href="/sources" style={LINK_STYLE}>
            {t("credits.title")}
          </Link>
        </Text>
      </article>
    </AppShell>
  );
}
