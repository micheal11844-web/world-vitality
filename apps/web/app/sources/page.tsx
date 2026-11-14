import type { Metadata } from "next";
import { getSessionUserId } from "../../lib/get-session-user-id";
import { getTranslator } from "../../lib/i18n/server";
import { SourcesView } from "./sources-view";

// The sidebar and header depend on whether someone is signed in.
export const dynamic = "force-dynamic";

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getTranslator();
  return { title: `${t("credits.title")} — World Vitality` };
}

/**
 * Public "Data sources and credits" page: who the data, maps and software come
 * from, with each source's link and licence. Open to everyone (a licence such
 * as CC BY 4.0 is only met if the credit can be seen), so it sits outside the
 * signed-in route trees; signed-in visitors get the normal app shell around it.
 * What it lists comes from `packages/hazard-feeds/src/data-credits.ts` and the
 * camera registry, so nothing here is hand-copied.
 */
export default async function SourcesPage() {
  const userId = await getSessionUserId();
  return <SourcesView signedIn={userId !== null} />;
}
