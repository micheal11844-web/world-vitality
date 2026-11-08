import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getTranslator } from "../../lib/i18n/server";
import { getMyPreferences } from "../../lib/preferences";
import { WelcomeView } from "./welcome-view";

export const dynamic = "force-dynamic";

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getTranslator();
  return {
    title: `${t("welcome.pageTitle")} — World Vitality`,
    robots: { index: false, follow: false },
  };
}

/**
 * Adaptive onboarding (PRD B.1). First sign-in lands here (the
 * Dashboard redirects people who haven't onboarded); anyone who has
 * already onboarded is sent on to the Dashboard unless they came back
 * on purpose (`?redo=1`, from Settings), in which case their previous
 * answers pre-fill the flow.
 */
export default async function WelcomePage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const redo = params.redo === "1";
  const prefs = await getMyPreferences();

  if (prefs?.onboardedAt && !redo) redirect("/dashboard");

  return (
    <WelcomeView
      isRedo={redo && Boolean(prefs?.onboardedAt)}
      initialPersonaId={prefs?.persona ?? null}
      initialPlace={prefs?.homePlace ?? null}
    />
  );
}
