import { fixupConfigRules } from "@eslint/compat";
import nextConfig from 'eslint-config-next/core-web-vitals';
import nextTs from 'eslint-config-next/typescript';

const eslintConfig = [
  ...fixupConfigRules(nextConfig),
  ...fixupConfigRules(nextTs),
  {
    rules: {
      "no-console": "warn",
      "@typescript-eslint/no-explicit-any": "warn",
      "react-hooks/set-state-in-effect": "off",
      "react-hooks/purity": "off",
      "react-hooks/immutability": "off"
    }
  },
  {
    ignores: [
      "**/.next/**",
      "**/node_modules/**",
      "**/out/**",
      "**/build/**",
      "**/dist/**",
      "**/*.log",
      "eslint.config.mjs"
    ],
  }
];

export default eslintConfig;
