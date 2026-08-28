import { defineConfig, globalIgnores } from "eslint/config";
import eslintReact from "@eslint-react/eslint-plugin";
import eslintJs from "@eslint/js";
import reactHooks from 'eslint-plugin-react-hooks';
import tseslint from "typescript-eslint";

export default defineConfig([
  globalIgnores([
    "node_modules",
    "dist",
  ]),
   {
    files: ["src/**/*.ts", "src/**/*.tsx"],
    // Extend recommended rule sets from:
    // 1. ESLint JS's recommended rules
    // 2. TypeScript ESLint recommended rules
    // 3. ESLint React's recommended-typescript rules
    extends: [
      eslintJs.configs.recommended,
      tseslint.configs.recommended,
      eslintReact.configs["recommended-typescript"],
    ],
    // Configure language/parsing options
    languageOptions: {
      // Use TypeScript ESLint parser for TypeScript files
      parser: tseslint.parser,
      parserOptions: {
        // Enable project service for better TypeScript integration
        projectService: true,
        tsconfigRootDir: (import.meta as any).dirname,
      },
    },
    // Custom rule overrides (modify rule levels or disable rules)
    rules: {
       "sort-imports": "error",
       "@eslint-react/set-state-in-effect": "off" // Need to figure out better code pattern for this, but for now, we will disable this rule to avoid false positives.
    },
  },
  {
    files: ["src/**/*.{js,mjs,cjs,ts,mts,cts,jsx,tsx}"],
    ...reactHooks.configs.flat.recommended,
  },
  {
    files: ["src/**/*.{js,mjs,cjs,ts,mts,cts,jsx,tsx}"],
    ignores: ["node_modules", "dist"],
    plugins: { "tseslint": tseslint.plugin },
    languageOptions: {
      parserOptions: {
        ecmaFeatures: {
          jsx: true,
        },
      }
    },
    rules: {
      "react-hooks/set-state-in-effect": 'off' // Need to figure out better code pattern for this, but for now, we will disable this rule to avoid false positives.
    },
  },
]);
