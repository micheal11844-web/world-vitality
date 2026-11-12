/**
 * An amount in the smallest currency unit (kobo / cents) as text in the
 * reader's language: their digits, a thousands separator that is always shown
 * (a language's default drops it on four-digit numbers, which looks uneven
 * next to the larger ones) and their decimal separator. The part after the
 * decimal point appears only when there is one, or always with
 * `alwaysDecimals` (a receipt shows "₦7,500.00").
 */
const SYMBOL = { NGN: "₦", USD: "$" } as const;

export function formatMoneyMinor(
  locale: string,
  amountMinor: number,
  currency: "NGN" | "USD",
  options: { alwaysDecimals?: boolean } = {},
): string {
  const whole = Math.trunc(amountMinor / 100);
  const minor = Math.abs(amountMinor % 100);
  const digits = new Intl.NumberFormat(locale, { useGrouping: false, maximumFractionDigits: 0 });
  const group =
    new Intl.NumberFormat(locale).formatToParts(1_000_000).find((part) => part.type === "group")
      ?.value ?? ",";
  const decimal =
    new Intl.NumberFormat(locale, { minimumFractionDigits: 1 })
      .formatToParts(1.5)
      .find((part) => part.type === "decimal")?.value ?? ".";
  const chars = Array.from(digits.format(whole));
  const grouped = chars
    .map((d, i) => (i > 0 && (chars.length - i) % 3 === 0 ? `${group}${d}` : d))
    .join("");
  const fraction =
    minor === 0 && !options.alwaysDecimals
      ? ""
      : `${decimal}${digits.format(Math.trunc(minor / 10))}${digits.format(minor % 10)}`;
  return `${SYMBOL[currency]}${grouped}${fraction}`;
}
