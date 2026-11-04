import type { ReactNode } from "react";
import { LocaleBoundary } from "../../../lib/i18n/locale-boundary";

/**
 * Every Agriculture page (home, map, report) is translated, so the whole
 * route tree sits in one `LocaleBoundary`: it sets `lang` / `dir` for the
 * reader's language and gives the client components (forms, comments, the
 * shell) their translator. Interpretation text written by the engine is
 * still English and is marked as such where it appears.
 */
export default function AgricultureLayout({ children }: { children: ReactNode }) {
  return <LocaleBoundary>{children}</LocaleBoundary>;
}
