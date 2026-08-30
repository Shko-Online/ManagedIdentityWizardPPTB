import { spawn } from 'node:child_process';
import { createInterface } from 'node:readline/promises';
import { cp, mkdir, readFile, rm, writeFile } from 'node:fs/promises';
import path from 'node:path';
import process from 'node:process';
import { chromium } from 'playwright';
import pixelmatch from 'pixelmatch';
import { PNG } from 'pngjs';

const rootDirectory = process.cwd();
const docsDirectory = path.join(rootDirectory, 'docs');
const reviewDirectory = path.join(docsDirectory, 'visual-review');
const storybookUrl = process.env.STORYBOOK_URL ?? 'http://127.0.0.1:6006';
const update = process.argv.includes('--update');
const ci = process.argv.includes('--ci');
const viewport = { width: 1600, height: 1100 };

const screenshotDefinitions = [
  { file: '01.managed-identity-wizard.png', capture: initialScreen },
  { file: '02.solution-filter-flyout.png', capture: solutionFlyout },
  { file: '03.solution-filter-popup.png', capture: solutionPicker },
  { file: '04.plugin-packages-list.png', capture: packageList },
  { file: '05.plugin-assemblies-list.png', capture: assemblyList },
  { file: '06.inspect-plugin-action.png', capture: inspectAction },
  { file: '07.export-plugin-action.png', capture: exportAction },
  { file: '09.inspection-form.png', capture: inspectionForm },
  { file: '10.managed-identity-settings.png', capture: settingsFlyout },
  { file: '11.managed-identity-settings-popup.png', capture: settingsDialog },
  { file: '12.view-certificate-details-button.png', capture: certificateAction },
  { file: '13.certificate-details.png', capture: certificateDialog },
];

async function loadApp(browser) {
  const page = await browser.newPage({ viewport });
  await page.goto(`${storybookUrl}/iframe.html?id=app--documentation&viewMode=story`);
  await page.getByRole('button', { name: 'Refresh packages' }).waitFor();
  await page.getByRole('button', { name: 'More inspector actions' }).click();
  await page.getByRole('menuitem', { name: /^Solution:/ }).waitFor();
  await page.keyboard.press('Escape');
  return page;
}

async function refresh(page) {
  await page.getByRole('button', { name: 'Refresh packages' }).click();
  await page.getByRole('button', { name: /^Inspect albx_ShkoOnline.StorageMI.Plugins$/ }).waitFor();
}

async function inspectPackage(page) {
  await refresh(page);
  await page.getByRole('button', { name: /^Inspect albx_ShkoOnline.StorageMI.Plugins/ }).click();
  await page.getByRole('button', { name: 'View certificate details' }).waitFor({ timeout: 20_000 });
}

async function initialScreen(page, target) {
  await page.screenshot({ path: target });
}

async function solutionFlyout(page, target) {
  await page.getByRole('button', { name: 'More inspector actions' }).click();
  await page.locator('[role="menu"]').screenshot({ path: target });
}

async function solutionPicker(page, target) {
  await page.getByRole('button', { name: 'More inspector actions' }).click();
  await page.getByRole('menuitem', { name: /^Solution:/ }).click();
  await page.getByRole('dialog', { name: 'Select solution' }).screenshot({ path: target });
}

async function packageList(page, target) {
  await refresh(page);
  await page.getByRole('table', { name: 'Plugin packages' }).screenshot({ path: target });
}

async function assemblyList(page, target) {
  await refresh(page);
  await page.getByRole('tab', { name: /^Plugin assemblies/ }).click();
  await page.getByRole('table', { name: 'Plugin assemblies' }).screenshot({ path: target });
}

async function inspectAction(page, target) {
  await refresh(page);
  await page.getByRole('button', { name: /^Inspect albx_ShkoOnline.StorageMI.Plugins$/ }).screenshot({ path: target });
}

async function exportAction(page, target) {
  await refresh(page);
  await page.getByRole('button', { name: 'Export albx_ShkoOnline.StorageMI.Plugins' }).screenshot({ path: target });
}

async function inspectionForm(page, target) {
  await inspectPackage(page);
  await page.locator('text=Subject identifier').locator('..').screenshot({ path: target });
}

async function settingsFlyout(page, target) {
  await page.getByRole('button', { name: 'More inspector actions' }).click();
  await page.locator('[role="menu"]').screenshot({ path: target });
}

async function settingsDialog(page, target) {
  await page.getByRole('button', { name: 'More inspector actions' }).click();
  await page.getByRole('menuitem', { name: 'Managed identity settings' }).click();
  await page.getByRole('dialog', { name: 'Managed identity subject settings' }).screenshot({ path: target });
}

async function certificateAction(page, target) {
  await inspectPackage(page);
  await page.getByRole('button', { name: 'View certificate details' }).screenshot({ path: target });
}

async function certificateDialog(page, target) {
  await inspectPackage(page);
  await page.getByRole('button', { name: 'View certificate details' }).click();
  await page.getByRole('dialog', { name: 'Certificate details' }).screenshot({ path: target });
}

async function exerciseNativeFilePicker(browser) {
  const page = await loadApp(browser);
  const fileChooser = page.waitForEvent('filechooser');
  await page.getByRole('button', { name: 'Inspect local package' }).click();
  await fileChooser;
  await page.close();
}

function comparePng(expectedBuffer, actualBuffer) {
  const expected = PNG.sync.read(expectedBuffer);
  const actual = PNG.sync.read(actualBuffer);
  if (expected.width !== actual.width || expected.height !== actual.height) {
    return { changed: true, diff: actual };
  }

  const diff = new PNG({ width: expected.width, height: expected.height });
  const changedPixels = pixelmatch(expected.data, actual.data, diff.data, expected.width, expected.height, {
    threshold: 0.1,
  });
  return { changed: changedPixels > 0, diff };
}

async function startStorybook() {
  let response;
  try {
    response = await fetch(storybookUrl);
  } catch {
    // The local server is started below.
  }
  if (response?.ok) {
    const index = await fetch(`${storybookUrl}/index.json`);
    const stories = await index.json();
    if (stories.entries?.['app--documentation']) return null;
    throw new Error(
      `The Storybook server at ${storybookUrl} does not include app--documentation. Restart it or set STORYBOOK_URL.`,
    );
  }

  const command = process.platform === 'win32' ? 'npx.cmd' : 'npx';
  const child = spawn(command, ['storybook', 'dev', '--ci', '--port', '6006'], {
    cwd: rootDirectory,
    stdio: 'inherit',
  });
  for (let attempt = 0; attempt < 60; attempt += 1) {
    await new Promise((resolve) => setTimeout(resolve, 500));
    try {
      const response = await fetch(storybookUrl);
      if (response.ok) return child;
    } catch {
      // Keep waiting while Storybook compiles.
    }
  }
  child.kill();
  throw new Error(`Storybook did not become available at ${storybookUrl}.`);
}

async function main() {
  await rm(reviewDirectory, { recursive: true, force: true });
  await mkdir(reviewDirectory, { recursive: true });
  const storybook = await startStorybook();
  const browser = await chromium.launch();
  const changed = [];

  try {
    for (const definition of screenshotDefinitions) {
      const page = await loadApp(browser);
      const actualPath = path.join(reviewDirectory, definition.file);
      await definition.capture(page, actualPath);
      await page.close();

      const expectedPath = path.join(docsDirectory, definition.file);
      const comparison = comparePng(await readFile(expectedPath), await readFile(actualPath));
      if (comparison.changed) {
        changed.push(definition.file);
        await writeFile(path.join(reviewDirectory, `${definition.file}.diff.png`), PNG.sync.write(comparison.diff));
      }
    }
    await exerciseNativeFilePicker(browser);
  } finally {
    await browser.close();
    if (storybook) storybook.kill();
  }

  console.log('08.file-inspection-dialog.png was exercised but not compared: OS-native file dialogs are outside browser screenshots.');
  if (changed.length === 0) {
    console.log('README screenshots are up to date.');
    return;
  }

  console.log(`Changed screenshots: ${changed.join(', ')}`);
  console.log(`Review actual and diff images in ${path.relative(rootDirectory, reviewDirectory)}.`);
  let shouldUpdate = update;
  if (!update && !ci && process.stdin.isTTY) {
    const prompt = createInterface({ input: process.stdin, output: process.stdout });
    shouldUpdate = /^y(es)?$/i.test(await prompt.question('Update the changed docs images? [y/N] '));
    prompt.close();
  }
  if (shouldUpdate) {
    await Promise.all(changed.map((file) => cp(path.join(reviewDirectory, file), path.join(docsDirectory, file))));
    console.log('Updated README screenshots.');
    return;
  }
  process.exitCode = 1;
}

await main();