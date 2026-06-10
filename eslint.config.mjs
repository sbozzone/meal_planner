import { defineConfig, globalIgnores } from "eslint/config";
import nextCoreWebVitals from "eslint-config-next/core-web-vitals";
import nextTypescript from "eslint-config-next/typescript";

export default defineConfig([
  ...nextCoreWebVitals,
  ...nextTypescript,
  {
    rules: {
      // This rule flags every setState reached from an async function called
      // in an effect — even after an `await` — so it false-positives on all
      // of our fetch-on-mount hooks (useDishes, useMealPlan, ...) and
      // sync-form-state-on-open sheets. Re-evaluate when the rule learns to
      // distinguish post-await updates.
      "react-hooks/set-state-in-effect": "off",
    },
  },
  globalIgnores([".next/**", "out/**", "build/**", "next-env.d.ts"]),
]);
