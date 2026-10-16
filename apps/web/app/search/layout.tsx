import type { ReactNode } from "react";
import { LocaleBoundary } from "../../lib/i18n/locale-boundary";

/**
 * `/search` is public (signed-out visitors can search), so unlike the
 * account routes it has no session gate — only the language boundary.
 * The reader's language comes from their account when they have a
 * session, otherwise from the device cookie, the browser, or English.
 */
export default function SearchLayout({ children }: { children: ReactNode }) {
  return <LocaleBoundary>{children}</LocaleBoundary>;
}
