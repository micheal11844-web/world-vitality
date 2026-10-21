"use client";

import { Button, Card, Text } from "@world-vitality/ui-components";
import { useI18n } from "../../lib/i18n/i18n-provider";
import { useInstallState } from "../../lib/pwa/install";

const sectionGap = { display: "flex", flexDirection: "column", gap: "var(--wv-space-md)" } as const;

/**
 * "Install on this device" (Experience Blueprint §16): one button where the
 * browser offers installing, a plain instruction where it doesn't, and a
 * confirmation once it's done. Says what is kept on the device for offline
 * use and when it goes — the same promise the service worker keeps.
 */
export function InstallCard() {
  const { t } = useI18n();
  const { state, install } = useInstallState();

  return (
    <Card>
      <div style={sectionGap}>
        <Text variant="sectionTitle" as="h2">
          {t("settings.install.title")}
        </Text>
        {state === "installed" ? (
          <Text variant="body" style={{ color: "var(--wv-text-secondary)" }}>
            {t("settings.install.installed")}
          </Text>
        ) : (
          <>
            <Text variant="body" style={{ color: "var(--wv-text-secondary)" }}>
              {t("settings.install.body")}
            </Text>
            {state === "available" ? (
              <div>
                <Button type="button" onClick={() => void install()}>
                  {t("settings.install.button")}
                </Button>
              </div>
            ) : (
              <Text variant="caption" style={{ color: "var(--wv-text-secondary)" }}>
                {t("settings.install.hint")}
              </Text>
            )}
          </>
        )}
      </div>
    </Card>
  );
}
