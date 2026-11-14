/**
 * Who runs World Vitality, for the Terms of Service, the Privacy Policy and
 * the support chat. One place, so the name and the contact address cannot
 * drift apart between pages.
 *
 * The owner chose the **business** address on purpose (2026-11-14); a personal
 * address does not belong on a public page.
 */
export const BUSINESS_NAME = "joelflowstack";
export const BUSINESS_EMAIL = "joelflowstack@gmail.com";
export const BUSINESS_COUNTRY = "Nigeria";

/**
 * The date the Terms and Privacy Policy text last changed. Bump it (and
 * `docs/runbooks/legal-pages.md`) whenever the wording changes, so "Last
 * updated" on both pages is true.
 */
export const LEGAL_UPDATED = "2026-11-15";

/** A `mailto:` link to the business, optionally with a subject and a body. */
export function businessMailto(subject?: string, body?: string): string {
  const params: string[] = [];
  if (subject) params.push(`subject=${encodeURIComponent(subject)}`);
  if (body) params.push(`body=${encodeURIComponent(body)}`);
  return `mailto:${BUSINESS_EMAIL}${params.length > 0 ? `?${params.join("&")}` : ""}`;
}
