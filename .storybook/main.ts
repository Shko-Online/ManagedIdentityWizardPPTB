import type { StorybookConfig } from '@storybook/react-vite';
import { mergeConfig } from 'vite';

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
  viteFinal: (viteConfig) =>
    mergeConfig(viteConfig, { resolve: { alias: { buffer: 'buffer/' } } }),
};
export default config;