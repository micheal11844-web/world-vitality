// Shared flat ESLint config, extended by every app/service/package.
// Kept intentionally minimal at Stage 0 — tightened as real code lands.
import js from "@eslint/js";
import tseslint from "typescript-eslint";
import reactHooks from "eslint-plugin-react-hooks";
import jsxA11y from "eslint-plugin-jsx-a11y";

export default tseslint.config(
  js.configs.recommended,
  ...tseslint.configs.recommended,
  {
    ignores: [
      "**/dist/**",
      "**/build/**",
      "**/.next/**",
      "**/.turbo/**",
      "**/node_modules/**",
      "**/next-env.d.ts",
    ],
  },
  {
    files: ["tools/**/*.mjs"],
    languageOptions: {
      globals: { global: "writable", process: "readonly" },
    },
  },
  {
    files: ["**/*.tsx"],
    plugins: {
      "react-hooks": reactHooks,
      "jsx-a11y": jsxA11y,
    },
    rules: {
      ...reactHooks.configs.recommended.rules,
      ...jsxA11y.configs.recommended.rules,
    },
  },
  {
    rules: {
      // No cross-service internal imports (Engineering Blueprint 4.4) —
      // enforced more strictly per-service once real code exists; this is
      // the repo-wide floor.
      "no-restricted-imports": [
        "warn",
        {
          patterns: [
            {
              group: ["**/services/*/src/internal/**", "**/services/*/internal/**"],
              message:
                "Do not import another service's internals directly — use its published API or public package interface (Engineering Blueprint 4.4).",
            },
          ],
        },
      ],
    },
  },
);
