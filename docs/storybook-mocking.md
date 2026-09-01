# Storybook mocking setup

How the Storybook stories for this tool are wired, how the fixture data was captured, and what to
do when either needs to change.

## Why this exists

The tool runs inside Power Platform ToolBox (PPTB) and talks to two host objects that only exist
there: `window.toolboxAPI` and `window.dataverseAPI`. Outside PPTB both are `undefined`, so the app
renders an empty shell. Storybook replaces them with `ToolboxAPIMock` / `DataverseAPIMock` from
`@shko.online/pptb-mock` (Sinon stubs) fed with JSON captured from a real Dataverse environment.

## Refreshing the Power Platform ToolBox credit

The Introduction story credits the Power Platform ToolBox host platform. To refresh that credit:

1. Read the [desktop-app README](https://github.com/PowerPlatformToolBox/desktop-app) for the display name and canonical repository URL.
2. Check [the latest release](https://github.com/PowerPlatformToolBox/desktop-app/releases/latest) and record the tag marked **Latest**. Do not use an Insider `*-dev.*` prerelease.
3. Confirm the license in the repository-root [LICENSE](https://github.com/PowerPlatformToolBox/desktop-app/blob/main/LICENSE).
4. Update the display name, version, license label, and links together in the Introduction story's Credits section, then open the page in Storybook to check that the credit remains readable.

## Layout

| Path | Purpose |
| --- | --- |
| `stories/App.stories.tsx` | The four stories and the `MockProviders` decorator |
| `stories/mocks/dataverseMock.ts` | Stubs every `queryData` / `execute` / `retrieve` call the app makes |
| `stories/mocks/toolboxMock.ts` | Stubs theme, events, clipboard, save dialog, local file picker |
| `stories/mocks/connection.ts` | The `ToolBoxAPI.Connection` matching the captured environment |
| `stories/mocks/fixtures/*.json` | Raw OData responses, unmodified |
| `.storybook/public/mocks/*.nupkg`, `*.dll` | Real signed component payloads, served as static assets |

## Stories

| Story | Covers |
| --- | --- |
| `Disconnected` | Offline mode; only local file inspection is offered |
| `Connected` | Package and assembly lists with resolved managed identity names |
| `SolutionFiltered` | Solution picker narrowing the lists via `solutioncomponents` |
| `InspectedPackage` | Self-signed NuGet signature → certificate details and a v2 subject identifier |
| `InspectedAssembly` | Authenticode-signed assembly → issuer/subject-hash subject identifier |
| `UnsignedPackage` | Package with no `.signature.p7s` entry → the unsigned report path |

Each story drives the UI through a `play` function, so opening a story is enough to reach the state
it demonstrates. `Connected` starts by clicking **Refresh packages** because the app does not
auto-load component lists.

## How the mock is wired

`MockProviders` in the story file substitutes the context providers rather than the real
`ToolboxAPIProvider` / `ConnectionProvider` / `DataverseAPIProvider`, and reads
`context.parameters.connection` so a single decorator serves both connected and disconnected
stories. `.storybook/preview.tsx` deliberately has **no** provider decorators — it used to wrap
every story in the real providers, which shadowed nothing useful and ran against `undefined` host
objects.

`DataverseAPIMock` throws `Please mock the 'dataverseAPI.<method>' method based on your needs` for
any unstubbed call. That default is kept on purpose: an unmocked query is loud in the console and in
the in-app Event Log rather than silently rendering an empty table.

`queryData` is stubbed with `withArgs(<exact query string>)`. The strings in `dataverseMock.ts` are
byte-for-byte copies of what `src/services/pluginPackageService.ts` builds. **Any edit to a query in
that service must be mirrored in the mock**, or the story falls back to the throwing default.

Two calls are dynamic rather than fixed:

- `solutioncomponents?$select=objectid&$filter=_solutionid_value eq {id} and componenttype eq {type}`
  is issued per selected solution. The mock loops over every solution id that appears in either
  `solutioncomponents` fixture and registers a stub for **both** component types — including the
  combinations with no components. Registering only the non-empty pairs was the first bug found:
  selecting a solution that has plug-in assemblies but no plug-in packages hit the throwing default.
- `execute` uses a single `callsFake` switching on `operationName`, because
  `InitializeFileBlocksDownload` / `DownloadBlock` need to compute a response from the binary
  fixture rather than return a constant.

The binary path is driven by two id → file-name maps in `dataverseMock.ts`. Payloads are fetched
from `/mocks/<file>` (served by `staticDirs: ['../public', './public']`), cached at module scope,
and handed back the way Dataverse does: packages as Base64 blocks through
`InitializeFileBlocksDownload` / `DownloadBlock` (the continuation token is simply the file name),
assemblies as a Base64 `content` property from `retrieve`. Captured payloads are:

| Component | Signature |
| --- | --- |
| `albx_ShkoOnline.StorageMI.Plugins.nupkg` | Self-signed, and the only one with a managed identity |
| `mspp_Microsoft.PowerPages.AzureBlob.Plugins.nupkg` | Issuer-signed by Microsoft |
| `albx_AlbanianXrm.PluginPackage.nupkg` | Unsigned |
| `Microsoft.PowerPages.Core.Plugins.dll` | Authenticode, issuer-signed by Microsoft |

Ids outside those maps behave usefully rather than crashing: packages throw a message naming the
available payloads, assemblies resolve `{}` so the service produces its own "no stored binary
content" text, which is a legitimate state to see.

## How the fixtures were captured

The data came from a live environment through the integrated browser, using the signed-in session —
no credentials are stored anywhere.

The awkward part is that the browser automation tool can execute JavaScript in the page but cannot
write to disk, and returning ~350 KB of JSON through the agent transcript is wasteful. The
workaround was a throwaway Node HTTP sink:

1. A temporary script in `%TEMP%` listened on `127.0.0.1:7777`, sent `Access-Control-Allow-Origin: *`,
   and wrote each POST body to `stories/mocks/fixtures/<basename>`.
2. A single `page.evaluate` in the authenticated Dataverse tab fetched every OData query with
   `fetch('/api/data/v9.2/…')` and POSTed the pretty-printed response to the sink. Chrome permits
   mixed-content requests to `127.0.0.1`, so the HTTPS page can reach the plain-HTTP sink.
3. The same technique downloaded the `.nupkg` payloads via `InitializeFileBlocksDownload` +
   `DownloadBlock`, and the `.dll` via `pluginassemblies({id})?$select=content`, POSTing the raw
   `Uint8Array` to the sink.
4. The sink and its script were deleted afterwards.

Dead ends worth not repeating: `require`/`await import('node:fs')` is unavailable inside the
Playwright snippet, `page.request` fails with `Storage.getCookies: Method not found`, and
`page.waitForEvent('download')` never fires in the integrated browser.

### Refreshing the fixtures

Re-run the same flow against an environment you are signed in to. The queries to capture are exactly
the ones listed in `dataverseMock.ts`. Keep in mind:

- The data is committed **raw and un-anonymized** — org URL, tenant id, environment id and record
  GUIDs are real. That was a deliberate choice for a dev environment; re-check it if the fixtures are
  ever re-captured from somewhere else.
- `solutions.json` is the full, unfiltered solution list (~250 KB). The app drops solutions with no
  plug-in components at runtime, so most of it is never displayed. Trimming it to the ids present in
  the `solutioncomponents` fixtures would shrink it a lot without changing any story.
- `stories/mocks/connection.ts` and the values inside `retrievecurrentorganization.json` must
  describe the same environment, otherwise the generated subject identifier stops matching reality.
- `.storybook/preview.tsx` pins `MockDate` to `2026-08-30`. Fixtures captured later will render as
  future dates until that constant is bumped.

## Other config changes this required

- `.storybook/main.ts` aliases `buffer` to the npm polyfill (`buffer/`). Vite's dev server
  externalizes the `buffer` builtin, which broke `Buffer.from(...)` in the export path with
  *"Module "buffer" has been externalized for browser compatibility"*. The production Vite build
  resolves it from `node_modules` and is unaffected.

## Extending it

- **A new Dataverse query in the app** → add a matching `withArgs` stub plus a fixture. Run the story
  and watch the console; the throwing default tells you the exact string it expected.
- **A new scenario** (permission-restricted managed identity, empty environment, error states) → add
  a story with its own `parameters` and, if the data must differ, a factory argument on
  `createDataverseAPIMock` rather than a second copy of the file.
- **Another component payload** → download it the same way, drop it in `.storybook/public/mocks/`,
  and add one entry to `PACKAGE_BINARIES` or `ASSEMBLY_BINARIES`.
- **Play function selectors**: prefer roles with unique accessible names. Package names appear in both
  the *Name* and *Unique name* columns, so `findByText(packageName)` matches twice and fails; the
  row's `Inspect <name>` button is unique and is used as the readiness signal instead.
- **Typing into the name filter**: use `userEvent.paste`, not `userEvent.type`. Each keystroke
  re-renders the whole 143-row assembly table, and character-by-character typing takes long enough to
  blow the play function's timeout.
