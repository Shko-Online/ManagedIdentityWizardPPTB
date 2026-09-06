# Storybook mocking setup

How the Storybook stories for this tool are wired, how the fixture data was captured, and which patterns remain important when the app evolves.

## Why this exists

The tool runs inside Power Platform ToolBox (PPTB) and talks to two host objects that only exist there: `window.toolboxAPI` and `window.dataverseAPI`. Outside PPTB both are `undefined`, so the app renders an empty shell. Storybook replaces them with mock implementations built from the real captured environment so the UI can be exercised without a live Dataverse connection.

## Current architecture

The Stories layer intentionally does not mount the real PPTB providers. Instead, `MockProviders` in `stories/App.stories.tsx` swaps in:

- `ToolboxAPIContext.Provider` with the browser and file-system stubs from `stories/mocks/toolboxMock.ts`
- `DataverseAPIContext.Provider` with the mocked OData layer from `stories/mocks/dataverseMock.ts`
- `ConnectionContext.Provider` seeded from `stories/mocks/connection.ts`
- `MenuRootProvider` so dialogs and popovers render in the expected document root
- `LogsProvider` so event log messages show during the stories

This keeps the stories focused on the application behavior while keeping the host API surface accurate.

## Layout

| Path | Purpose |
| --- | --- |
| `stories/App.stories.tsx` | The stories and the shared `MockProviders` decorator |
| `stories/mocks/dataverseMock.ts` | Mocks `queryData`, `retrieve`, `execute`, and host utility calls |
| `stories/mocks/toolboxMock.ts` | Stubs clipboard, file picker, browser open, and save dialogs |
| `stories/mocks/connection.ts` | The `ToolBoxAPI.Connection` matching the captured environment |
| `stories/mocks/fixtures/*.json` | Raw OData responses and supporting environment metadata |
| `.storybook/public/mocks/*.nupkg`, `*.dll` | Signed and unsigned payloads used by inspection and export flows |

## Stories

| Story | Covers |
| --- | --- |
| `Disconnected` | Offline mode; only local file inspection is available |
| `Connected` | Package and assembly lists with resolved identity names |
| `SolutionFiltered` | Solution picker narrowing the lists via `solutioncomponents` |
| `InspectedPackage` | Signed NuGet package inspection and attached managed identity data |
| `InspectedAssembly` | Signed assembly inspection and generated subject identifier |
| `UnsignedPackage` | Unsigned package path and the supported guidance copy |
| `ManagedIdentityList` | Managed identity inventory, sorting, and filtering |
| `CreatedManagedIdentity` | New identity creation flow |
| `AssociatedComponentTabs` | Identity details and associated package tab |
| `LockedManagedIdentity` | Read-only form when a managed identity is not customizable |
| `PluginPackageSolutionLayers` | Solution layers details for package records |

Each story drives the UI through a `play` function so the app state is reached by interaction rather than by static markup.

## Current mock behaviors that matter

### Query stubs are exact

`DataverseAPIMock` throws a loud default for any unstubbed call. That is intentional: the story should fail loudly if a query string changes and the mock is not updated. `queryData` uses exact `withArgs(<exact query string>)` matching, and the strings are mirrored from the service layer in `src/services/pluginPackageService.ts`.

If the app adds or refactors a query string, the corresponding mock must be updated in the same change or the story will hit the throwing default instead of the intended data path.

### Solution queries are per-solution and per-type

The mock supports dynamic solution queries such as:

- `solutioncomponents?$select=objectid&$filter=_solutionid_value eq {id} and componenttype eq {type}`

It registers the relevant stubs for every solution and for both plugin package and plugin assembly component types, including empty combinations. This is important because a selected solution may have assemblies without packages, or packages without assemblies; the mock must cover both valid and empty outcomes.

### Binary payloads are served and returned the Dataverse way

The binary path is driven by id-to-file maps in `dataverseMock.ts`. Payloads are served by static Storybook assets and then returned in the same shapes the app expects:

- NuGet packages are returned as Base64 blocks through `InitializeFileBlocksDownload` / `DownloadBlock`
- Assemblies are returned via the `content` or `content_binary` property in the retrieval response

All of the current fixtures reflect the real domain constraints:

| Component | Signature / state |
| --- | --- |
| `albx_ShkoOnline.StorageMI.Plugins.nupkg` | Signed and associated with a managed identity |
| `mspp_Microsoft.PowerPages.AzureBlob.Plugins.nupkg` | Signed issuer-signed package |
| `albx_AlbanianXrm.PluginPackage.nupkg` | Unsigned package |
| `Microsoft.PowerPages.Core.Plugins.dll` | Signed Authenticode assembly |

The invalid `unsigned + managed` combination is intentionally excluded from the mock matrix so the storybook represents valid domain rules rather than impossible states.

### Browser operations are stubbed

The toolbox mock covers the browser actions the app relies on:

- `window.open` or equivalent browser-open calls must open a new window rather than a blank tab in Storybook
- clipboard copy actions are mocked in-process
- local file pickers are mocked to return a fake file object
- save/export dialogs resolve to an output path rather than a real native file chooser

## Fixture capture workflow

The data came from a real Dataverse environment through the browser session, and the same approach remains the reliable way to refresh mock data when needed.

The process used a temporary local HTTP sink in the authenticated browser session:

1. A script in `%TEMP%` or a local throwaway path listened on `127.0.0.1:7777`, added `Access-Control-Allow-Origin: *`, and wrote each POST body to a file under `stories/mocks/fixtures`.
2. A `page.evaluate` in the signed-in Dataverse tab fetched each OData query and posted the pretty-printed JSON to the sink.
3. The same method downloaded `.nupkg` and `.dll` payloads and saved them into the static mock folder.
4. The temporary sink script was deleted once the capture completed.

This was necessary because the browser automation tool cannot write files directly and returning large JSON payloads through the agent transcript is impractical.

### Refreshing the fixtures

Re-run the same capture flow against a signed-in environment. Keep in mind:

- The data is committed raw and un-anonymized because the dev environment contained real organization IDs, GUIDs, tenant IDs, and environment metadata.
- `solutions.json` is the full unfiltered list; the app drops solutions without relevant plug-in component records at runtime.
- `stories/mocks/connection.ts` and the `retrievecurrentorganization` fixtures must describe the same environment, or the generated subject identifiers stop matching the live values.
- `.storybook/preview.tsx` pins `MockDate` to a specific date; if fixtures are refreshed later, the date control may need to be bumped to keep the rendered dates in a stable range.

## Other config changes this required

- `.storybook/main.ts` aliases `buffer` to the npm polyfill (`buffer/`). The browser build externalizes the builtin `buffer`, which broke `Buffer.from(...)` in export handling. The production Vite build resolves it correctly from `node_modules`.
- The app and stories assume the browser is running with a host connection already in place; the mock system must therefore represent the same host behavior, not just the Dataverse payloads.

## Extending it

- **A new Dataverse query in the app** → add a matching `withArgs` stub and, when necessary, a fixture. The default throw is useful because it tells you the exact expected query string.
- **A new scenario** (permission-restricted identity, empty environment, error states) → add a story with its own `parameters` and, if the data must differ, a factory argument on `createDataverseAPIMock` instead of copy-pasting the entire mock file.
- **Another component payload** → download it the same way, place it under `.storybook/public/mocks/`, and add one entry to `PACKAGE_BINARIES` or `ASSEMBLY_BINARIES`.
- **Selector robustness** → prefer accessible roles with unique names. Package names may appear in both the Name and Unique name columns, so `findByText` is not reliable for row readiness checks; the unique `Inspect <name>` button is the safe signal.
- **Typing into name filters** → use `userEvent.paste`, not `userEvent.type`. The tables rerender on every keystroke, and character-by-character typing is slow enough to exceed play-function timeouts.

## Current rules the mock must honor

The mock matrix should reflect the business rules the UI enforces:

- only signed components may be assigned a managed identity
- only customizable targets may receive or lose a managed identity
- unsigned + managed is invalid and should not be represented in the mock set
- signed + customizable + unassigned is the valid assignment scenario for new identity association
- details and edit flow must remain in a single popup and the action remains in the details popup rather than the row actions

This keeps the Storybook visuals aligned with the actual product constraints and prevents invalid states from appearing in the documentation or regression checks.
