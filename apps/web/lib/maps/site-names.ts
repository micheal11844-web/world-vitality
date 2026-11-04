import type { MessageKey } from "@world-vitality/i18n";

/**
 * The sample reference sites (`lib/reference-sites.ts`) have fixed ids, so
 * their place names can be shown in the reader's language. A site this table
 * does not know (one added later without a message) keeps the name it has.
 */
const SITE_NAME_KEYS: Record<string, MessageKey> = {
  "ref-ibadan": "site.ibadan",
  "ref-nairobi": "site.nairobi",
  "ref-rotterdam": "site.rotterdam",
  "ref-des-moines": "site.desMoines",
  "ref-chennai": "site.chennai",
  "ref-brisbane": "site.brisbane",
};

export function siteNameKey(siteId: string): MessageKey | undefined {
  return SITE_NAME_KEYS[siteId];
}
