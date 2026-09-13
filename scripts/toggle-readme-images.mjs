import { existsSync, readdirSync } from 'node:fs';
import { readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import process from 'node:process';
import { fileURLToPath } from 'node:url';

const REMOTE_PREFIX = 'https://raw.githubusercontent.com/Shko-Online/ManagedIdentityWizardPPTB/refs/heads/main/';
const rootDirectory = process.cwd();
const readmePath = path.join(rootDirectory, 'README.md');
const docsDirectory = path.join(rootDirectory, 'docs');

/**
 * Extracts all image references from README.md content.
 * @param {string} content
 */
export function extractReadmeImages(content) {
  const lines = content.split(/\r?\n/);
  const references = [];

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const lineNumber = i + 1;

    // Markdown image syntax: ![alt](url)
    const mdRegex = /!\[(.*?)\]\((.*?)\)/g;
    let mdMatch;
    while ((mdMatch = mdRegex.exec(line)) !== null) {
      const [fullMatch, alt, rawSrc] = mdMatch;
      const src = rawSrc.trim();
      const isRemoteDocs = src.startsWith(REMOTE_PREFIX + 'docs/') || src.startsWith(REMOTE_PREFIX + './docs/');
      const isLocalDocs = /^(\.\/)?docs\//.test(src);
      const isDocsImage = isRemoteDocs || isLocalDocs;

      let relativePath = null;
      let filename = null;
      if (isRemoteDocs) {
        relativePath = src.slice(REMOTE_PREFIX.length).replace(/^\.\//, '');
        filename = path.basename(relativePath);
      } else if (isLocalDocs) {
        relativePath = src.replace(/^\.\//, '');
        filename = path.basename(relativePath);
      }

      references.push({
        type: 'markdown',
        lineNumber,
        alt,
        src,
        isDocsImage,
        isRemote: isRemoteDocs,
        isLocal: isLocalDocs,
        relativePath,
        filename,
        fullMatch,
      });
    }

    // HTML image syntax: <img src="url" ... />
    const htmlRegex = /<img\s+[^>]*src=["'](.*?)["'][^>]*>/gi;
    let htmlMatch;
    while ((htmlMatch = htmlRegex.exec(line)) !== null) {
      const [fullMatch, rawSrc] = htmlMatch;
      const src = rawSrc.trim();
      const isRemoteDocs = src.startsWith(REMOTE_PREFIX + 'docs/') || src.startsWith(REMOTE_PREFIX + './docs/');
      const isLocalDocs = /^(\.\/)?docs\//.test(src);
      const isDocsImage = isRemoteDocs || isLocalDocs;

      let relativePath = null;
      let filename = null;
      if (isRemoteDocs) {
        relativePath = src.slice(REMOTE_PREFIX.length).replace(/^\.\//, '');
        filename = path.basename(relativePath);
      } else if (isLocalDocs) {
        relativePath = src.replace(/^\.\//, '');
        filename = path.basename(relativePath);
      }

      references.push({
        type: 'html',
        lineNumber,
        alt: '',
        src,
        isDocsImage,
        isRemote: isRemoteDocs,
        isLocal: isLocalDocs,
        relativePath,
        filename,
        fullMatch,
      });
    }
  }

  return references;
}

/**
 * Converts all remote docs image URLs in README.md to local relative paths.
 * @param {string} content
 */
export function convertToLocal(content) {
  // Replace remote prefix before docs/ with just docs/
  let updated = content.replaceAll(REMOTE_PREFIX + 'docs/', 'docs/');
  updated = updated.replaceAll(REMOTE_PREFIX + './docs/', 'docs/');
  return updated;
}

/**
 * Converts all local docs image paths in README.md to remote GitHub raw URLs.
 * @param {string} content
 */
export function convertToRemote(content) {
  // Replace markdown images: ![alt](docs/...) or ![alt](./docs/...)
  let updated = content.replace(
    /!\[(.*?)\]\((\.?\/)?docs\/([^)]+)\)/g,
    `![$1](${REMOTE_PREFIX}docs/$3)`
  );

  // Replace HTML images: <img ... src="docs/..." ...>
  updated = updated.replace(
    /(<img\s+[^>]*src=["'])(\.?\/)?docs\/([^"']+)(["'][^>]*>)/gi,
    `$1${REMOTE_PREFIX}docs/$3$4`
  );

  return updated;
}

/**
 * Validates the state of README.md.
 * Returns { valid: boolean, errors: string[], summary: object }
 * @param {string} content
 */
export function validateReadme(content) {
  const references = extractReadmeImages(content);
  const docsReferences = references.filter((r) => r.isDocsImage);
  const errors = [];
  const localReferences = [];
  const missingFiles = [];

  for (const ref of docsReferences) {
    if (ref.isLocal) {
      localReferences.push(ref);
      errors.push(
        `Line ${ref.lineNumber}: Local path "${ref.src}" is used. Expected prefix "${REMOTE_PREFIX}".`
      );
    }

    if (ref.relativePath) {
      const diskPath = path.join(rootDirectory, ref.relativePath);
      if (!existsSync(diskPath)) {
        missingFiles.push({ ...ref, diskPath });
        errors.push(
          `Line ${ref.lineNumber}: Image file "${ref.relativePath}" not found on disk at ${diskPath}.`
        );
      }
    }
  }

  return {
    valid: errors.length === 0,
    errors,
    summary: {
      totalDocsImages: docsReferences.length,
      remoteCount: docsReferences.filter((r) => r.isRemote).length,
      localCount: localReferences.length,
      missingCount: missingFiles.length,
      references: docsReferences,
    },
  };
}

async function listDocsImages(references) {
  const docsImagesOnDisk = existsSync(docsDirectory)
    ? readdirSync(docsDirectory).filter((f) => /\.(png|jpe?g|gif|svg|webp)$/i.test(f))
    : [];

  const referencedFilenames = new Set(references.filter((r) => r.filename).map((r) => r.filename));

  console.log('\n=== README.md Docs Images Usage ===');
  console.log(`Prefix: ${REMOTE_PREFIX}\n`);

  if (references.length === 0) {
    console.log('No docs image references found in README.md.');
  } else {
    for (const ref of references) {
      const diskPath = path.join(rootDirectory, ref.relativePath);
      const exists = existsSync(diskPath);
      const stateBadge = ref.isRemote ? '[REMOTE]' : '[LOCAL] ';
      const fileBadge = exists ? '[EXISTS]' : '[MISSING]';
      console.log(`  ${stateBadge} ${fileBadge} L${String(ref.lineNumber).padEnd(4)} ${ref.relativePath}`);
      console.log(`           URL/Src: ${ref.src}`);
      if (ref.alt) console.log(`           Alt:     ${ref.alt}`);
    }
  }

  const unused = docsImagesOnDisk.filter((f) => !referencedFilenames.has(f));
  if (unused.length > 0) {
    console.log('\nImages in docs/ not currently referenced in README.md:');
    for (const file of unused) {
      console.log(`  - docs/${file}`);
    }
  }

  console.log('\nUsage:');
  console.log('  node scripts/toggle-readme-images.mjs --local     Switch README images to local relative paths (for markdown preview)');
  console.log('  node scripts/toggle-readme-images.mjs --revert    Revert README images to remote GitHub raw URLs (before commit)');
  console.log('  node scripts/toggle-readme-images.mjs --validate  Validate that all README images use the required remote prefix\n');
}

async function main() {
  const args = process.argv.slice(2);
  const isLocal = args.includes('--local');
  const isRemote = args.includes('--remote') || args.includes('--revert');
  const isValidate = args.includes('--validate') || args.includes('--check');
  const isList = args.includes('--list') || args.includes('--status') || args.includes('-l');

  if (!existsSync(readmePath)) {
    console.error(`Error: README.md not found at ${readmePath}`);
    process.exit(1);
  }

  const content = await readFile(readmePath, 'utf8');

  if (isValidate) {
    const result = validateReadme(content);
    if (!result.valid) {
      console.error('\n❌ Pre-commit Check Failed: README.md validation errors detected!\n');
      for (const err of result.errors) {
        console.error(`  • ${err}`);
      }
      console.error(
        `\nCommit blocked: README.md images must use the remote prefix before committing:\n${REMOTE_PREFIX}\n`
      );
      console.error('To fix this, revert images back to remote URLs by running:');
      console.error('  npm run readme:revert\n  # or: node scripts/toggle-readme-images.mjs --revert\n');
      process.exit(1);
    }

    console.log(
      `✓ README.md validation passed (${result.summary.totalDocsImages} docs image references verified with remote prefix).`
    );
    return;
  }

  if (isLocal) {
    const updated = convertToLocal(content);
    if (updated === content) {
      console.log('README.md already uses local image paths.');
    } else {
      await writeFile(readmePath, updated, 'utf8');
      console.log('✓ Converted README.md docs image references to local relative paths.');
    }
    const references = extractReadmeImages(updated);
    await listDocsImages(references);
    return;
  }

  if (isRemote) {
    const updated = convertToRemote(content);
    if (updated === content) {
      console.log('README.md already uses remote image URLs.');
    } else {
      await writeFile(readmePath, updated, 'utf8');
      console.log('✓ Reverted README.md docs image references to remote GitHub raw URLs.');
    }
    const references = extractReadmeImages(updated);
    await listDocsImages(references);
    return;
  }

  // Default: inspect and list
  const references = extractReadmeImages(content);
  await listDocsImages(references);
}

const currentFilePath = fileURLToPath(import.meta.url);
if (process.argv[1] && path.resolve(process.argv[1]) === path.resolve(currentFilePath)) {
  main().catch((err) => {
    console.error(err);
    process.exit(1);
  });
}
