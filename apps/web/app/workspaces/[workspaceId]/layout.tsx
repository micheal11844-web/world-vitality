import type { ReactNode } from "react";
import { LocaleBoundary } from "../../../lib/i18n/locale-boundary";

/**
 * Gives the Team page (the only route under this dynamic segment) its
 * translator and sets `lang` / `dir` for the reader's language, the same way
 * each workspace's own layout does.
 */
export default function WorkspaceTeamLayout({ children }: { children: ReactNode }) {
  return <LocaleBoundary>{children}</LocaleBoundary>;
}
