import Link from "next/link";
import { Text } from "@world-vitality/ui-components";
import type { WorkspaceLocation } from "../../lib/home-location";

/**
 * Says which place a workspace page's live data is for. Until
 * onboarding (PRD B.1) these pages silently used one hard-coded demo
 * location and never said so; now each says whether it's showing the
 * user's own home place or a labelled demo, with a link to set or
 * change it. `note` carries any widget-specific caveat (e.g. a widget
 * that reads a fixed station regardless of the chosen place).
 */
export function LocationNote({ location, note }: { location: WorkspaceLocation; note?: string }) {
  return (
    <Text
      variant="caption"
      style={{
        display: "block",
        color: "var(--wv-text-secondary)",
        margin: "calc(-1 * var(--wv-space-sm)) 0 var(--wv-space-lg)",
      }}
    >
      {location.isHome ? (
        <>
          Showing <strong>{location.label}</strong>, your home place.{" "}
          <Link href="/welcome?redo=1">Change</Link>
        </>
      ) : (
        <>
          Showing a demo location ({location.label}).{" "}
          <Link href="/welcome?redo=1">Set your own place</Link> to see your conditions here.
        </>
      )}
      {note ? ` ${note}` : ""}
    </Text>
  );
}
