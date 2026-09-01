import type { StorybookConfig } from '@storybook/react-vite';
import { mergeConfig } from 'vite';
import { resolveVersion } from '../scripts/resolve-version.mjs';

const config: StorybookConfig = {
  staticDirs: ['../public', './public'],
  "stories": [
    "../stories/**/*.mdx",
    "../stories/**/*.stories.@(js|jsx|mjs|ts|tsx)"
  ],
  "addons": [
    "@chromatic-com/storybook",
    "@storybook/addon-vitest",
    "@storybook/addon-a11y",
    "@storybook/addon-docs",
    "@storybook/addon-mcp"
  ],
  "framework": "@storybook/react-vite",
  // Vite dev externalizes the "buffer" builtin, so point it at the npm polyfill the app depends on.
  viteFinal: async (viteConfig) =>
    mergeConfig(viteConfig, {
      resolve: { alias: { buffer: 'buffer/' } },
      define: { __APP_VERSION__: JSON.stringify(await resolveVersion()) },
    }),
};
export default config;