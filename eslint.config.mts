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
        // "detect" crashes on eslint-plugin-react 7.37.5 + ESLint 10 (context.getFilename removed)
        version: "18.3.1",
      },
    },
  },
  tseslint.configs.recommended,
  {
    // Only apply React-specific configs to source files, not to config files like this one
    files: ["src/**/*.{js,mjs,cjs,ts,mts,cts,jsx,tsx}"],
    ...pluginReact.configs.flat.recommended,
  },
  {
    files: ["src/**/*.{js,mjs,cjs,ts,mts,cts,jsx,tsx}"],
    ...reactHooks.configs.flat.recommended,
  },
  {
    files: ["src/**/*.{js,mjs,cjs,ts,mts,cts,jsx,tsx}"],
    ...pluginReact.configs.flat['jsx-runtime'],
  },
  {
    files: ["src/**/*.{js,mjs,cjs,ts,mts,cts,jsx,tsx}"],
    ignores: ["node_modules", "dist"],
    plugins: { "tseslint": tseslint.plugin, pluginReact },
    languageOptions: {
      parserOptions: {
        ecmaFeatures: {
          jsx: true,
        },
      }
    },
    rules: {
      "sort-imports": "error",
      "react-hooks/set-state-in-effect": 'off' // Need to figure out better code pattern for this, but for now, we will disable this rule to avoid false positives.
    },
  },
]);
