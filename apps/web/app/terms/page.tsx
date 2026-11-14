import type { Metadata } from "next";
import { getSessionUserId } from "../../lib/get-session-user-id";
import { getTranslator } from "../../lib/i18n/server";
import { LegalView } from "../legal/legal-view";
import { TERMS_SECTIONS } from "../legal/legal-text";

export const dynamic = "force-dynamic";

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getTranslator();
  return { title: `${t("legal.terms.title")} — World Vitality` };
}

/** The public Terms of Service. The text is in `legal/legal-text.ts`. */
export default async function TermsPage() {
  const userId = await getSessionUserId();
  return <LegalView kind="terms" sections={TERMS_SECTIONS} signedIn={userId !== null} />;
}
