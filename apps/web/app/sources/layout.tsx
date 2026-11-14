import type { ReactNode } from "react";
import { LocaleBoundary } from "../../lib/i18n/locale-boundary";

/**
 * The credits page is public, so its language comes from the device's saved
 * choice, else the browser's `Accept-Language`, else English (the same order
 * the landing page uses), or from the account's choice when signed in.
 */
export default function SourcesLayout({ children }: { children: ReactNode }) {
  return <LocaleBoundary>{children}</LocaleBoundary>;
}
