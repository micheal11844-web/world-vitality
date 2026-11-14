"use client";

import { Fragment, useState, type CSSProperties } from "react";
import { AppShell, Card, Text } from "@world-vitality/ui-components";
import {
  CAMERA_PROVIDERS,
  CAMERA_PROVIDER_IDS,
  DATA_CREDIT_GROUPS,
  dataCreditsInGroup,
  type DataCredit,
} from "@world-vitality/hazard-feeds";
import { useI18n } from "../../lib/i18n/i18n-provider";
import { LanguageSwitcher } from "../../lib/i18n/language-switcher";
import { AppBrand } from "../app-brand";
import { buildAppSidebar } from "../workspaces/workspace-nav";
import { CREDIT_GROUP_TITLE, CREDIT_TEXT } from "./credit-text";

const EXTERNAL_LINK = { target: "_blank", rel: "noopener noreferrer" } as const;
const LINK_STYLE: CSSProperties = { color: "var(--wv-accent)", textDecoration: "underline" };
const LIST_STYLE: CSSProperties = {
  listStyle: "none",
  margin: 0,
  padding: 0,
  display: "flex",
  flexDirection: "column",
  gap: "var(--wv-space-sm)",
};
const SECTION_STYLE: CSSProperties = {
  display: "flex",
  flexDirection: "column",
  gap: "var(--wv-space-sm)",
};
const SECONDARY: CSSProperties = { color: "var(--wv-text-secondary)", margin: 0 };

/** One licence or terms line: "Licence: CC BY 4.0", the name linking to the terms. */
function LicenceLine({ name, url, label }: { name: string; url: string; label: string }) {
  return (
    <Text variant="caption" style={{ display: "block", marginTop: "var(--wv-space-xs)" }}>
      {label}:{" "}
      <a href={url} {...EXTERNAL_LINK} style={LINK_STYLE}>
        <bdi>{name}</bdi>
      </a>
    </Text>
  );
}

function SourceCard({ credit }: { credit: DataCredit }) {
  const { t } = useI18n();
  const text = CREDIT_TEXT[credit.id];
  return (
    <Card>
      <Text variant="sectionTitle" as="h3" style={{ margin: 0 }}>
        <a href={credit.url} {...EXTERNAL_LINK} style={LINK_STYLE}>
          <bdi>{credit.name}</bdi>
        </a>
      </Text>
      <Text variant="body" style={{ ...SECONDARY, marginTop: "var(--wv-space-xs)" }}>
        {t(text.use)}
      </Text>
      {text.note ? (
        <Text variant="caption" style={{ display: "block", marginTop: "var(--wv-space-xs)" }}>
          {t(text.note)}
        </Text>
      ) : null}
      {credit.licence ? (
        <LicenceLine
          name={credit.licence.name}
          url={credit.licence.url}
          label={t("credits.licence")}
        />
      ) : null}
    </Card>
  );
}

/**
 * The credits page, inside the app shell (signed in) or the anonymous
 * Explorer-style shell (signed out). Camera agencies come from the camera
 * registry, so a feed cannot be switched on without its credit and licence
 * appearing here.
 */
export function SourcesView({ signedIn }: { signedIn: boolean }) {
  const { t } = useI18n();
  const [aiPanelOpen, setAiPanelOpen] = useState(false);
  const sidebar = buildAppSidebar({ current: "sources", signedIn, t });

  return (
    <AppShell
      brand={<AppBrand />}
      showAccountMenu={signedIn}
      sidebarSections={sidebar.sections}
      sidebarDefaultExpandedKeys={sidebar.defaultExpandedKeys}
      aiPanelOpen={aiPanelOpen}
      onToggleAiPanel={() => setAiPanelOpen((v) => !v)}
    >
      <div
        style={{
          maxWidth: "44rem",
          display: "flex",
          flexDirection: "column",
          gap: "var(--wv-space-lg)",
        }}
      >
        {signedIn ? null : (
          <div style={{ alignSelf: "flex-end" }}>
            <LanguageSwitcher compact />
          </div>
        )}
        <div>
          <Text variant="pageTitle" as="h1">
            {t("credits.title")}
          </Text>
          <Text variant="body" style={{ ...SECONDARY, marginTop: "var(--wv-space-sm)" }}>
            {t("credits.intro")}
          </Text>
        </div>

        {DATA_CREDIT_GROUPS.map((group) => (
          <Fragment key={group}>
            <section aria-labelledby={`credits-${group}`} style={SECTION_STYLE}>
              <Text variant="sectionTitle" as="h2" id={`credits-${group}`}>
                {t(CREDIT_GROUP_TITLE[group])}
              </Text>
              <ul style={LIST_STYLE}>
                {dataCreditsInGroup(group).map((credit) => (
                  <li key={credit.id} data-testid={`credit-${credit.id}`}>
                    <SourceCard credit={credit} />
                  </li>
                ))}
              </ul>
            </section>
            {group === "hazards" ? <CameraSection /> : null}
          </Fragment>
        ))}
      </div>
    </AppShell>
  );
}

/** Camera agencies, one card each, straight from the camera registry. */
function CameraSection() {
  const { t } = useI18n();
  return (
    <section aria-labelledby="credits-cameras" style={SECTION_STYLE}>
      <Text variant="sectionTitle" as="h2" id="credits-cameras">
        {t("credits.group.cameras")}
      </Text>
      <Text variant="body" style={SECONDARY}>
        {t("credits.cameras.intro")}
      </Text>
      <ul style={LIST_STYLE}>
        {CAMERA_PROVIDER_IDS.map((id) => {
          const provider = CAMERA_PROVIDERS[id];
          return (
            <li key={id} data-testid={`credit-camera-${id}`}>
              <Card>
                <Text variant="sectionTitle" as="h3" style={{ margin: 0 }}>
                  <a href={provider.sourceUrl} {...EXTERNAL_LINK} style={LINK_STYLE}>
                    <bdi>{provider.attribution}</bdi>
                  </a>
                </Text>
                <LicenceLine
                  name={provider.licenceName}
                  url={provider.licenceUrl}
                  label={t("credits.licence")}
                />
              </Card>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
