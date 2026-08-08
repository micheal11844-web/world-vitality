import nextPlugin from "@next/eslint-plugin-next";
import shared from "./packages/config/eslint.config.js";

export default [
  ...shared,
  // apps/web is the only Next.js app in the monorepo — Next-specific rules
  // (image/font/script/head misuse, etc.) are scoped here rather than
  // added to the shared repo-wide config, since no other package/service
  // is a Next.js app. Uses @next/eslint-plugin-next's native flat-config
  // export directly (Next 15.5's eslint-config-next itself still ships
  // legacy eslintrc format only, requiring the @eslint/eslintrc FlatCompat
  // shim to bridge into flat config) — this achieves the same
  // core-web-vitals rule set without that extra shim/dependency, staying
  // consistent with the flat-config style already used repo-wide.
  {
    files: ["apps/web/**/*.{js,jsx,mjs,ts,tsx}"],
    ...nextPlugin.flatConfig.coreWebVitals,
  },
];
