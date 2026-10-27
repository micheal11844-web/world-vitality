import Link from "next/link";
import { Text } from "@world-vitality/ui-components";
import { createTranslator, type Translate } from "@world-vitality/i18n";
import type { WorkspaceLocation } from "../../lib/home-location";

/** Stands in for the place name while the sentence is translated, so the name can be set in bold. */
const PLACE = "";

/**
 * Says which place a workspace page's live data is for. Until
 * onboarding (PRD B.1) these pages silently used one hard-coded demo
 * location and never said so; now each says whether it's showing the
 * user's own home place or a labelled demo, with a link to set or
 * change it. `note` carries any widget-specific caveat (e.g. a widget
 * that reads a fixed station regardless of the chosen place).
 *
 * `t` is passed by pages that are translated (the reader's language);
 * pages that are not yet leave it out and get English, so this one
 * component can be shared without putting English text on a page that
 * declares another language. `note` is passed through as given.
 */
export function LocationNote({
  location,
  note,
  t,
}: {
  location: WorkspaceLocation;
  note?: string;
  t?: Translate;
}) {
  const translate = t ?? createTranslator("en").t;
  // The browser's default link blue clashes with the palette; keep the
  // underline (a link inside a sentence must not rely on colour alone).
  const link = { color: "var(--wv-accent)" } as const;

  /**
   * The sentence with the place name put in, wherever the language puts
   * it — in bold for the user's own home place, plain for a demo one (as
   * this note has always read).
   */
  const withPlace = (sentence: string, bold: boolean) => {
    const [before = "", after = ""] = sentence.split(PLACE);
    const name = <bdi>{location.label}</bdi>;
    return (
      <>
        {before}
        {bold ? <strong>{name}</strong> : name}
        {after}
      </>
    );
  };

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
          {withPlace(translate("workspace.locationNote.home", { place: PLACE }), true)}{" "}
          <Link href="/welcome?redo=1" style={link}>
            {translate("workspace.locationNote.change")}
          </Link>
        </>
      ) : (
        <>
          {withPlace(translate("workspace.locationNote.demo", { place: PLACE }), false)}{" "}
          <Link href="/welcome?redo=1" style={link}>
            {translate("workspace.locationNote.setOwn")}
          </Link>{" "}
          {translate("workspace.locationNote.demoTail")}
        </>
      )}
      {note ? ` ${note}` : ""}
    </Text>
  );
}
