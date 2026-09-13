import { chmodSync, existsSync, mkdirSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import process from 'node:process';
import { spawnSync } from 'node:child_process';

const rootDirectory = process.cwd();
const hooksDirectory = path.join(rootDirectory, '.githooks');
const preCommitPath = path.join(hooksDirectory, 'pre-commit');

const hookContent = `#!/bin/sh
node scripts/toggle-readme-images.mjs --validate
`;

export function setupGitHooks() {
  // Check if we are inside a git repository
  const gitCheck = spawnSync('git', ['rev-parse', '--is-inside-work-tree'], {
    cwd: rootDirectory,
    stdio: 'ignore',
  });

  if (gitCheck.status !== 0) {
    console.log('Not inside a Git repository. Skipping Git hook configuration.');
    return;
  }

  // Ensure .githooks directory exists
  if (!existsSync(hooksDirectory)) {
    mkdirSync(hooksDirectory, { recursive: true });
  }

  // Ensure pre-commit hook file exists
  writeFileSync(preCommitPath, hookContent, { encoding: 'utf8', mode: 0o755 });
  try {
    chmodSync(preCommitPath, 0o755);
  } catch {
    // Ignore on filesystems that do not support chmod
  }

  // Configure git core.hooksPath
  const configResult = spawnSync('git', ['config', 'core.hooksPath', '.githooks'], {
    cwd: rootDirectory,
    stdio: 'inherit',
  });

  if (configResult.status === 0) {
    console.log('✓ Configured Git hooks path to .githooks (pre-commit hook installed).');
  } else {
    console.warn('⚠️ Could not set git core.hooksPath automatically.');
  }
}

setupGitHooks();
