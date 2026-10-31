"use client";

import Link from "next/link";
import { useOptionalI18n } from "../lib/i18n/i18n-provider";

/**
 * The "See plans" link shown beside a plan-limit message ("Your Basic plan
 * includes up to 3 saved items…"). Workspace pages are not translated yet,
 * so this speaks the reader's language when it can and stays English when it
 * cannot, instead of throwing (`useOptionalI18n`). Only ever rendered when a
 * limit was actually hit, which can only happen while billing is on, so
 * `/billing` always exists when this is shown.
 */
export function UpgradeLink() {
  const i18n = useOptionalI18n();
  return (
    <Link
      href="/billing"
      style={{ color: "var(--wv-accent)", marginInlineStart: "var(--wv-space-xs)" }}
    >
      {i18n ? i18n.t("billing.seePlans") : "See plans"}
    </Link>
  );
}
