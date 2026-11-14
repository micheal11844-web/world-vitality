import type { ReactNode } from "react";
import { LocaleBoundary } from "../../lib/i18n/locale-boundary";

/** Public, like the landing page: its language is the device's saved choice, else the browser's, else English. */
export default function LegalLayout({ children }: { children: ReactNode }) {
  return <LocaleBoundary>{children}</LocaleBoundary>;
}
