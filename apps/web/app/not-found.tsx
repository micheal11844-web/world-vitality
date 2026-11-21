import type { Metadata } from "next";
import { cookies } from "next/headers";
import { ERROR_TEXTS } from "@world-vitality/i18n/error-texts";
import { MessageScreen } from "../lib/errors/message-screen";
import { SESSION_COOKIE } from "../lib/constants";
import { getRequestLocale } from "../lib/i18n/request-locale";
import { SITE_NAME } from "../lib/i18n/page-title";

/** The tab says "can't find that page" rather than just the site's name. */
export async function generateMetadata(): Promise<Metadata> {
  const locale = await getRequestLocale();
  return { title: `${ERROR_TEXTS[locale].notFoundTitle} — ${SITE_NAME}` };
}

/**
 * "Page not found" for every address the app does not have (and for pages it hides on purpose,
 * such as Billing while billing is off), in place of Next's bare 404 with no way onward. Offers
 * the two places most people want: home (the dashboard when a session cookie is present, the
 * start page otherwise) and Explore, which needs no account.
 */
export default async function NotFound() {
  const locale = await getRequestLocale();
  const text = ERROR_TEXTS[locale];
  const signedIn = (await cookies()).has(SESSION_COOKIE);
  return (
    <MessageScreen
      lang={locale}
      dir={text.dir}
      title={text.notFoundTitle}
      body={text.notFoundBody}
      actions={[
        { label: text.home, href: signedIn ? "/dashboard" : "/", primary: true },
        { label: text.explore, href: "/explore" },
      ]}
    />
  );
}
