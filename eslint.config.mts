import globals from "globals";
import tseslint from "typescript-eslint";
import pluginReact from "eslint-plugin-react";
import reactHooks from 'eslint-plugin-react-hooks';
import { defineConfig, globalIgnores } from "eslint/config";

export default defineConfig([
  globalIgnores([
    "node_modules",
    "dist",
  ]),
  {
    settings: {
      react: {
        // Automatically detects your installed React version
        version: "detect",
      },
    },
  },
  tseslint.configs.recommended,
  pluginReact.configs.flat.recommended,
  reactHooks.configs.flat.recommended,
  pluginReact.configs.flat['jsx-runtime'], 
  {
    files: ["src/**/*.{js,mjs,cjs,ts,mts,cts,jsx,tsx}"],
    ignores: ["node_modules", "dist"],
    plugins: { "tseslint": tseslint.plugin, pluginReact },
    languageOptions: {
      parserOptions: {
        ecmaFeatures: {
          jsx: true,
        },
      },
      globals: globals.browser,
    },
    rules: {
      "sort-imports": "error",
      "react-hooks/set-state-in-effect": 'off' // Need to figure out better code pattern for this, but for now, we will disable this rule to avoid false positives.
    },
  },
]);
