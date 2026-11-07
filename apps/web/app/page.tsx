import Link from "next/link";
import Image from "next/image";
import { buttonStyle, Text } from "@world-vitality/ui-components";
import { AppDownloadsLink } from "./app-downloads-link";
import { LanguageSwitcher } from "../lib/i18n/language-switcher";
import { LocaleBoundary } from "../lib/i18n/locale-boundary";
import { getTranslator } from "../lib/i18n/server";

/**
 * The landing page, in the visitor's language: the device's saved choice,
 * else what the browser asks for, else English. A visitor who isn't signed in
 * can change it with the picker in the corner (saved on this device only; it
 * follows the person to other devices once they sign in and choose one).
 */
export default async function LandingPage() {
  const { t } = await getTranslator();
  return (
    <LocaleBoundary>
      <main
        style={{
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: "var(--wv-space-lg)",
          position: "relative",
        }}
      >
        <div
          style={{
            position: "absolute",
            top: "var(--wv-space-md)",
            insetInlineEnd: "var(--wv-space-md)",
          }}
        >
          <LanguageSwitcher compact />
        </div>
        <div style={{ maxWidth: "32rem", textAlign: "start" }}>
          <Image
            src="/brand/world-vitality-mark.png"
            alt="World Vitality"
            width={900}
            height={560}
            style={{ height: "2.5rem", width: "auto", marginBottom: "var(--wv-space-lg)" }}
            priority
          />
          <Text variant="pageTitle" as="h1">
            World Vitality
          </Text>
          <Text
            variant="body"
            style={{
              color: "var(--wv-text-secondary)",
              margin: "var(--wv-space-sm) 0 var(--wv-space-lg)",
            }}
          >
            {t("landing.tagline")}
          </Text>
          <div style={{ display: "flex", flexWrap: "wrap", gap: "var(--wv-space-sm)" }}>
            <Link href="/explore" style={buttonStyle("secondary")}>
              {t("landing.explore")}
            </Link>
            <Link href="/login" style={buttonStyle("primary")}>
              {t("landing.signIn")}
            </Link>
          </div>
          <div style={{ marginTop: "var(--wv-space-md)" }}>
            <AppDownloadsLink />
          </div>
        </div>
      </main>
    </LocaleBoundary>
  );
}
