import type { ReactNode } from "react";
import { LocaleBoundary } from "../../lib/i18n/locale-boundary";

/** The reset-password page in the visitor's language (device choice, else the browser's, else English). */
export default function LoginLayout({ children }: { children: ReactNode }) {
  return <LocaleBoundary>{children}</LocaleBoundary>;
}
