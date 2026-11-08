import type { ReactNode } from "react";
import { LocaleBoundary } from "../../lib/i18n/locale-boundary";

/**
 * Public Explorer is translated, so its route sits in a `LocaleBoundary`: it
 * sets `lang` / `dir` for the reader's language and gives the client
 * components their translator. The page is open to anonymous visitors, so the
 * language comes from the device's saved choice, else the browser's
 * `Accept-Language`, else English (the same order the landing page uses).
 * The interpretation the engine writes is English and is marked as such
 * where it appears.
 */
export default function ExploreLayout({ children }: { children: ReactNode }) {
  return <LocaleBoundary>{children}</LocaleBoundary>;
}
