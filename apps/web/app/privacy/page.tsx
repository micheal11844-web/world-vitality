import type { Metadata } from "next";
import { getSessionUserId } from "../../lib/get-session-user-id";
import { getTranslator } from "../../lib/i18n/server";
import { LegalView } from "../legal/legal-view";
import { PRIVACY_SECTIONS } from "../legal/legal-text";

export const dynamic = "force-dynamic";

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getTranslator();
  return { title: `${t("legal.privacy.title")} — World Vitality` };
}

/** The public Privacy Policy. The text is in `legal/legal-text.ts`. */
export default async function PrivacyPage() {
  const userId = await getSessionUserId();
  return <LegalView kind="privacy" sections={PRIVACY_SECTIONS} signedIn={userId !== null} />;
}
