/**
 * Who a receipt says it was issued by. The owner sets `BILLING_RECEIPT_SELLER`
 * to the business's legal name, address and tax number once they have them,
 * one line per `|`: `World Vitality Ltd | 12 Example Street, Lagos | TIN 1234567-0001`.
 * Until then a receipt says only "World Vitality". The text is shown as plain
 * lines (never as markup), at most five, each trimmed and length-capped.
 */
export const DEFAULT_RECEIPT_SELLER = "World Vitality";
const MAX_LINES = 5;
const MAX_LINE_CHARS = 120;

export function receiptSellerLines(raw: string | null | undefined): string[] {
  const lines = (raw ?? "")
    .split("|")
    .map((line) => line.replace(/\s+/g, " ").trim())
    .filter((line) => line.length > 0)
    .slice(0, MAX_LINES)
    .map((line) => line.slice(0, MAX_LINE_CHARS));
  return lines.length > 0 ? lines : [DEFAULT_RECEIPT_SELLER];
}
