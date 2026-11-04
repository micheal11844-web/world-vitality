import type { ReactNode } from "react";
import { LocaleBoundary } from "../../../lib/i18n/locale-boundary";

/**
 * Gives every page under this workspace its translator and sets `lang` / `dir`
 * for the reader's language. The shared sample-site map on the map page reads
 * its labels from it.
 */
export default function WorkspaceLayout({ children }: { children: ReactNode }) {
  return <LocaleBoundary>{children}</LocaleBoundary>;
}
