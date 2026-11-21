import type { ReactNode } from "react";
import { LocaleBoundary } from "../../../lib/i18n/locale-boundary";
import { pageTitle } from "../../../lib/i18n/page-title";

/**
 * Gives every page under this workspace its translator and sets `lang` / `dir`
 * for the reader's language. Official alert text inside the pages stays as the
 * issuing agency wrote it and is marked as English.
 */
export default function WorkspaceLayout({ children }: { children: ReactNode }) {
  return <LocaleBoundary>{children}</LocaleBoundary>;
}

export async function generateMetadata() {
  return pageTitle("workspace.disaster-monitoring.name");
}
