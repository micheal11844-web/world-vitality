/** "2026-10-20 10:00 UTC" — one unambiguous format for every staff screen. */
export function formatUtc(iso: string | null | undefined): string | null {
  if (!iso) return null;
  const time = Date.parse(iso);
  if (Number.isNaN(time)) return null;
  return `${new Date(time).toISOString().slice(0, 16).replace("T", " ")} UTC`;
}
