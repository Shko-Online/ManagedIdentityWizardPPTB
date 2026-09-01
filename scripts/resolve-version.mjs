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

import { execFileSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { Writable } from 'node:stream';
import { fileURLToPath } from 'node:url';

const packageJsonUrl = new URL('../package.json', import.meta.url);

/** Swallows the semantic-release dry-run log output. */
const sink = () => new Writable({ write: (_chunk, _encoding, done) => done() });

async function nextReleaseVersion() {
  try {
    const { default: semanticRelease } = await import('semantic-release');
    const result = await semanticRelease(
      {
        dryRun: true,
        ci: false,
        // Only the analyzer is needed to compute the version, and it needs no credentials.
        plugins: ['@semantic-release/commit-analyzer'],
      },
      { cwd: fileURLToPath(new URL('..', import.meta.url)), stdout: sink(), stderr: sink() },
    );
    return result && result.nextRelease ? result.nextRelease.version : undefined;
  } catch {
    return undefined;
  }
}

function latestTagVersion() {
  try {
    const tag = execFileSync('git', ['describe', '--tags', '--abbrev=0', '--match', 'v*'], {
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'ignore'],
    }).trim();
    return tag.replace(/^v/, '') || undefined;
  } catch {
    return undefined;
  }
}

function packageJsonVersion() {
  return JSON.parse(readFileSync(packageJsonUrl, 'utf8')).version;
}

/**
 * Resolves the version to stamp into build artifacts:
 * RELEASE_VERSION env var -> semantic-release next version -> last released tag -> package.json.
 */
export async function resolveVersion() {
  return (
    process.env.RELEASE_VERSION ||
    (await nextReleaseVersion()) ||
    latestTagVersion() ||
    packageJsonVersion()
  );
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  process.stdout.write(await resolveVersion());
}
