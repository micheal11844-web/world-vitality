import type { CSSProperties } from "react";
import { Text } from "@world-vitality/ui-components";
import { UpgradeLink } from "./upgrade-link";

/**
 * Shown where a feature the plan does not include would have been, with the
 * same "See plans" link the limit messages use. Renders nothing for `null`,
 * so a screen can write `<FeatureLockedNote message={locked} />` without a
 * separate check. Only ever has text while billing is on, so `/billing`
 * exists whenever the link is shown.
 *
 * Workspace pages are English-only (see `billing.md`), and so is this.
 */
export function FeatureLockedNote({
  message,
  style,
}: {
  message: string | null;
  /** Extra spacing for a page that places the note between blocks. */
  style?: CSSProperties;
}) {
  if (!message) return null;
  return (
    <Text
      variant="body"
      role="note"
      data-plan-notice=""
      style={{ color: "var(--wv-text-secondary)", marginTop: "var(--wv-space-xs)", ...style }}
    >
      {message}
      <UpgradeLink />
    </Text>
  );
}
