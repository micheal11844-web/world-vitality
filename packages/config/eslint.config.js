// Shared flat ESLint config, extended by every app/service/package.
// Kept intentionally minimal at Stage 0 — tightened as real code lands.
import js from "@eslint/js";
import tseslint from "typescript-eslint";

export default tseslint.config(
  js.configs.recommended,
  ...tseslint.configs.recommended,
  {
    ignores: ["**/dist/**", "**/build/**", "**/.next/**", "**/.turbo/**", "**/node_modules/**"]
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
                "Do not import another service's internals directly — use its published API or public package interface (Engineering Blueprint 4.4)."
            }
          ]
        }
      ]
    }
  }
);
