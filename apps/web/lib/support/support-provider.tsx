"use client";

import dynamic from "next/dynamic";
import { useMemo, useState, type ReactNode } from "react";
import type { Translator } from "@world-vitality/i18n";
import { GuideDockProvider } from "@world-vitality/ui-components";

// The chat window and the matcher's word lists are only downloaded the first
// time someone opens the help chat, not with every page.
const SupportPanel = dynamic(() => import("./support-panel").then((m) => m.SupportPanel), {
  ssr: false,
});

/**
 * Turns Orbi, in the corner of every translated page, into the "Help" button
 * that opens the help chat. Sits inside each page's `I18nProvider`, so the
 * pill and the chat speak the reader's language; pages that are not translated
 * yet have no provider and keep a plain Orbi.
 */
export function SupportProvider({
  translator,
  children,
}: {
  translator: Translator;
  children: ReactNode;
}) {
  const [open, setOpen] = useState(false);
  // Once opened the panel stays mounted (hidden) so the conversation survives closing.
  const [everOpened, setEverOpened] = useState(false);
  const label = translator.t("support.help");
  const ariaLabel = translator.t("support.openLabel");
  const dock = useMemo(
    () => ({
      label,
      ariaLabel,
      open,
      onActivate: () => {
        setEverOpened(true);
        setOpen(true);
      },
    }),
    [label, ariaLabel, open],
  );
  return (
    <GuideDockProvider value={dock}>
      {children}
      {everOpened && (
        <SupportPanel open={open} onClose={() => setOpen(false)} translator={translator} />
      )}
    </GuideDockProvider>
  );
}
