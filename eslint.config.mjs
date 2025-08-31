import { dirname } from "path";
import { fileURLToPath } from "url";
import { FlatCompat } from "@eslint/eslintrc";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const compat = new FlatCompat({
  baseDirectory: __dirname,
});

const eslintConfig = [
  ...compat.extends("next/core-web-vitals", "next/typescript"),
  {
    rules: {
      // Re-enable any type checking
      "@typescript-eslint/no-explicit-any": "error",
      // Keep unused vars as warnings for now
      "@typescript-eslint/no-unused-vars": "warn",
      "no-unused-vars": "warn",
      // Add other rules as needed
    },
  },
];

export default eslintConfig;
