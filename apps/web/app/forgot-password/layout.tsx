import type { ReactNode } from "react";
import { LocaleBoundary } from "../../lib/i18n/locale-boundary";
import { pageTitle } from "../../lib/i18n/page-title";

/** The forgot-password page in the visitor's language (device choice, else the browser's, else English). */
export default function LoginLayout({ children }: { children: ReactNode }) {
  return <LocaleBoundary>{children}</LocaleBoundary>;
}

export async function generateMetadata() {
  return pageTitle("auth.forgot.title");
}
