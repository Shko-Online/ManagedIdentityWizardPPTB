# README visual regression

`npm run verify:readme-images` starts Storybook when it is not already running, drives the
documentation scenario with Playwright, and compares the captured PNGs against the images used by
the README. It writes the current captures and pixel diffs to `docs/visual-review/`, which is
ignored by Git.

When a capture differs in an interactive terminal, inspect that directory and answer the prompt to
replace the changed files. For an intentional, non-interactive baseline refresh use:

```powershell
npm run verify:readme-images -- --update
```

For CI, use `npm run verify:readme-images -- --ci`; it exits non-zero on a difference and never
updates images. Set `STORYBOOK_URL` when Storybook is already running on a different URL.

The `08.file-inspection-dialog.png` image shows an OS-native file picker. Playwright exercises the
command but cannot include that dialog in a browser screenshot, so the runner reports it as
unverified rather than treating it as a passing visual comparison.