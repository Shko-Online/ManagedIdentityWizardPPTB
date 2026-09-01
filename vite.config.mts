/// <reference types="vitest/config" />
/*
   Copyright 2026 Shko Online LLC <sales@shko.online>

   Licensed under the Apache License, Version 2.0 (the "License");
   you may not use this file except in compliance with the License.
   You may obtain a copy of the License at

       http://www.apache.org/licenses/LICENSE-2.0

   Unless required by applicable law or agreed to in writing, software
   distributed under the License is distributed on an "AS IS" BASIS,
   WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
   See the License for the specific language governing permissions and
   limitations under the License.
 */

import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import type { Plugin } from 'vite';

const importMetaUrlPolyfillVariableName = '__import_meta_url__';


/**
 * Plugin to fix HTML for PPTB compatibility
 * - Removes type="module" and crossorigin attributes since we're using IIFE format
 * - Moves script tags from head to end of body so DOM is ready when IIFE executes
 */
import path from 'node:path';
import { storybookTest } from '@storybook/addon-vitest/vitest-plugin';
import { playwright } from '@vitest/browser-playwright';
const dirname = import.meta.dirname;

// More info at: https://storybook.js.org/docs/next/writing-tests/integrations/vitest-addon

function fixHtmlForPPTB(): Plugin {
  return {
    name: 'fix-html-for-pptb',
    enforce: 'post',
    transformIndexHtml(html, context) {
      if (context.path !== '/' && context.path !== '/index.html') {
        return html;
      }

      // Remove type="module" and crossorigin from script tags
      // IIFE format doesn't need module type, and file:// URLs don't need crossorigin
      html = html.replace(/\s*type="module"/g, '');
      html = html.replace(/\s*crossorigin/g, '');
      // Clean up extra spaces around attributes
      html = html.replace(/\s+>/g, '>');

      // Move script tags from head to end of body
      // IIFE executes immediately, so DOM must be ready
      const scriptRegex = /(<script[^>]*src="[^"]*"[^>]*><\/script>)/g;
      const scripts: string[] = [];

      // Extract all script tags
      html = html.replace(scriptRegex, match => {
        scripts.push(match);
        return ''; // Remove from current position
      });

      // Insert scripts before closing body tag
      if (scripts.length > 0) {
        const scriptsHtml = '\n  ' + scripts.join('\n  ');
        html = html.replace('</body>', scriptsHtml + '\n</body>');
      }
      return html;
    }
  };
}

// https://vitejs.dev/config/
export default defineConfig(configEnv => {
  return {
    plugins: [react(), fixHtmlForPPTB()],
    base: './',
    build: {
      outDir: 'dist',
      assetsDir: 'assets',
      sourcemap: configEnv.mode === 'development',
      // PPTB requires one IIFE bundle, including the ZIP inspection dependencies.
      chunkSizeWarningLimit: 1_600,
      rolldownOptions: {
        transform: {
          define: {
            'import.meta': '{}',
            'import.meta.url': importMetaUrlPolyfillVariableName,
          },
        },
        output: {
          // Use IIFE format for compatibility with iframe srcdoc loading
          // ES modules can have issues when loaded via file:// URLs in iframes
          format: 'iife',
          // Bundle everything into a single file to avoid module loading issues
          manualChunks: undefined,
          intro:
            "var _documentCurrentScript = typeof document !== 'undefined' ? document.currentScript : null;" +
            `var ${importMetaUrlPolyfillVariableName} = (_documentCurrentScript && _documentCurrentScript.tagName.toUpperCase() === 'SCRIPT' && _documentCurrentScript.src || new URL('main.js', document.baseURI).href)`,
        }
      }
    },
    test: {
      projects: [{
        extends: true,
        plugins: [
          // The plugin will run tests for the stories defined in your Storybook config
          // See options at: https://storybook.js.org/docs/next/writing-tests/integrations/vitest-addon#storybooktest
          storybookTest({
            configDir: path.join(dirname, '.storybook')
          })],
        test: {
          name: 'storybook',
          browser: {
            enabled: true,
            headless: true,
            provider: playwright({}),
            instances: [{
              browser: 'chromium'
            }]
          }
        }
      }]
    }
  };
});