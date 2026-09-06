# README visual regression

`npm run verify:readme-images` starts Storybook when it is not already running, drives the documentation scenario with Playwright, and compares the captured PNGs against the images used in the README. It writes the current captures and any pixel diffs into `docs/visual-review/`, which is ignored by Git.

The verification set currently covers the main documentation flow plus the managed identity inventory and details views:

- core app shell and solution filtering
- plugin package and plugin assembly lists
- package inspection and certificate review
- managed identity settings dialog
- managed identity list and details popup

When a capture differs in an interactive terminal, inspect that directory and answer the prompt to replace the changed files. For an intentional, non-interactive baseline refresh use:

```powershell
npm run verify:readme-images -- --update
```

For CI, use `npm run verify:readme-images -- --ci`; it exits non-zero on a difference and never updates the images. Set `STORYBOOK_URL` when Storybook is already running on a different URL.

The script treats new images as valid first-run baselines by copying them into `docs/` the first time they are generated, which makes adding new README screenshots a straightforward, controlled change.

The `08.file-inspection-dialog.png` image shows an OS-native file picker. Playwright exercises the command but cannot include that dialog in a browser screenshot, so the runner reports it as exercised-but-unverified rather than treating it as a passing visual comparison. The rest of the screenshot set is compared pixel-for-pixel against the static documentation assets.