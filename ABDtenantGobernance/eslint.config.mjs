import { defineConfig, globalIgnores } from "eslint/config";
import nextjs from "@repo/eslint-config/nextjs";

const eslintConfig = defineConfig([
  ...nextjs,
  globalIgnores([
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
    "scripts/**",
    "scratch_i18n.js",
  ]),
]);

export default eslintConfig;
