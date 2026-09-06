> # Copyright Notice
>
> Copyright 2026 Shko Online LLC <sales@shko.online>
> 
> Licensed under the Apache License, Version 2.0 (the "License");
> you may not use this file except in compliance with the License.
> You may obtain a copy of the License at
> 
>     http://www.apache.org/licenses/LICENSE-2.0
> 
> Unless required by applicable law or agreed to in writing, software
> distributed under the License is distributed on an "AS IS" BASIS,
> WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
> See the License for the specific language governing permissions and
> limitations under the License.

# Plugin Package Inspector Requirements

## Purpose

Provide a Power Platform ToolBox workflow for inspecting plugin packages and plugin assemblies, reviewing their signing status, computing managed identity subject identifiers, and managing managed identity associations for signed and customizable components in Dataverse.

## Sources

- [Plugin Package table reference](https://learn.microsoft.com/en-us/power-apps/developer/data-platform/reference/entities/pluginpackage)
- [Plugin Assembly table reference](https://learn.microsoft.com/en-us/power-apps/developer/data-platform/reference/entities/pluginassembly)
- [managedidentity EntityType reference](https://learn.microsoft.com/en-us/power-apps/developer/data-platform/webapi/reference/managedidentity)
- [Set up managed identity for Dataverse plug-ins or plug-in packages](https://learn.microsoft.com/en-us/power-platform/admin/set-up-managed-identity)

## Current Scope

The tool is now a managed identity inspector and lifecycle companion rather than a narrow package-signature calculator. It must support:

- loading plugin packages and standalone plugin assemblies from a connected Dataverse environment
- filtering by selected solution and by component name
- sorting and paginating data client-side in the package, assembly, and managed identity tables
- reading and displaying related managed identity metadata
- inspecting package and assembly signatures
- calculating managed identity subject identifiers from the signing certificate
- creating, editing, and reviewing managed identities
- assigning or dissociating managed identities only when the component is signed and allows customizations
- keeping the details and edit flows in a single popup and keeping the managed identity action in the details popup rather than in each row action

## Functional Requirements

1. List plugin packages and standalone plugin assemblies from the connected environment using OData. For packages, return `pluginpackageid`, `name`, `uniquename`, `version`, `package_name`, `fileid`, state, status, solution membership, and the related managed identity reference when present. Exclude plugin assemblies associated with a plugin package by filtering `pluginassemblies` where `_packageid_value eq null`.
2. Read managed identity metadata through the `managedidentityid` navigation property on plugin package and plugin assembly records. When the managed identity record cannot be read, show `Restricted` in the managed identity column instead of breaking the list.
3. Display packages and assemblies in separate tabs with client-side sorting and pagination. Show whether each component is managed or unmanaged, whether it allows customizations, and the related managed identity name or placeholder.
4. Add a managed identity count column to the filtered view and include managed identities in the selected-solution result set when those records are relevant to the filtered solution.
5. Provide a solution-selection popup for environments with large numbers of solutions. Include a text filter, sortable solution columns, ascending/descending sort icons, and pagination. Clicking the current sort column toggles direction; clicking another column sorts ascending.
6. Use a checkbox-driven selection model for the solution picker. A staged empty selection represents all solutions. The confirmation button text must read `Select <solution unique name>` for a selected solution or `Select All Solutions` when no solution is selected.
7. Provide a client-side component name filter beside the tabs. Matching is case-insensitive and uses the visible component names. Slash characters are removed from the stored filter value before matching.
8. Retrieve the selected package's `content` memo column only when the user chooses to inspect it, and decode the Base64 payload in memory. Package inspection opens the package with `@zip.js/zip.js` and reports it as signed when it contains the NuGet repository signature entry `.signature.p7s`.
9. Allow the user to select a local `.nupkg` or `.dll` through the Toolbox file picker without requiring a Dataverse connection. Route NuGet packages through NuGet signature inspection and plugin assemblies through Authenticode inspection. Read the selected file as binary data in memory only.
10. Allow the user to export a selected plugin package as a `.nupkg` file and a selected plugin assembly as a `.dll` file using the Toolbox file-system API. The native save dialog chooses the destination, the file name is prefilled from component metadata, and bytes are only downloaded during the export operation.
11. Keep package, assembly, signature, and certificate bytes in memory only. Do not write to Dataverse or persist files locally.
12. Parse the CMS envelope and emit signer certificate information with `PKI.js`. Show the issuer DN, subject DN, serial number, validity, fingerprint, certificate category, and certificate chain metadata. Render DNs in readable X.509 attribute form while preserving the raw values used for identity calculations. Use `attributeType=value` pairs joined by `/`, with the X.500 attribute name when known and the raw OID as a fallback.
13. Support trusted and self-signed certificates. The tool reports signature presence and certificate metadata only; it does not validate CMS or Authenticode integrity, certificate trust, chain validity, or timestamp validity.
14. Compute and surface the managed identity subject identifier for signed packages and assemblies. For a trusted certificate, hash the issuer and subject DNs using SHA-256 over the exact UTF-8 strings and encode the result as Base64URL. For a self-signed certificate, hash the DER certificate bytes using SHA-256 and encode the result as lowercase hexadecimal.
15. Read `TenantId` and `EnvironmentId` using the `RetrieveCurrentOrganization` function when relevant, while allowing manual edits. Default the cloud setting to public cloud. Keep the generated Issuer and Subject identifier values in the inspection detail view directly below the certificate action and provide clipboard actions for each generated value.
16. Show the associated managed identity name in the inspection summary next to the signature and signer metadata. When the component has no associated identity, show the appropriate no-association message. When the related record could not be read, show the restricted message instead. When an identity is available, offer a `View managed identity details` action.
17. Provide a managed identity details popup that includes the identity name, application ID, tenant ID, credential source, subject scope, federated credential subject version, status, and managed/unmanaged type, with option-set values mapped to readable labels. Unrecognized values render as `Unknown (<value>)`. Provide clipboard actions for application ID and tenant ID. Close the popup with Escape or by clicking outside.
18. Prefill the tenant ID setting from the inspected component's managed identity when the field is still empty, before falling back to `RetrieveCurrentOrganization`. A manually entered value always wins. Warn in the managed identity details popup and the event log when the managed identity tenant differs from the tenant used to compute the subject identifier, and when the identity's federated credential subject version is not version 2.
19. Mark the row that produced the current inspection with a green checkmark in its Inspect action. When hovered, show the inspect icon again to indicate that the inspection can be run again. Mark the local-file inspect control in the same way when the current result came from a local file.
20. Refreshing packages must clear the current inspection result, inspected component indicator, generated identity result, certificate detail popup state, and any inspected managed identity state.
21. Show a managed identity list with search, sorting, pagination, usage counts, and action buttons. Include create and edit flows for managed identities, but block editing when the identity does not allow customizations and keep the form read-only in that case.
22. Keep the details and edit workflow in a single popup. The details view can switch to edit mode when the identity is customizable, and the same popup may manage associated package and assembly links without creating a second separate dialog.
23. Enforce the domain rules consistently across the UI:
   - Only signed components can be assigned a managed identity.
   - Only customizable components can be assigned or edited.
   - Unsigned plugin packages or assemblies show the correct guidance instead of allowing assignment.
   - Managed identities can be associated or dissociated only when the target component is signed and customizable.
   - The row-level managed identity action is removed; managed identity assignment remains in the details popup only.
24. Add descriptive hover tooltips to all compact action buttons so users can understand the purpose of each action without reading the surrounding text.
25. Expose the current managed identity settings in a dedicated dialog so the user can configure the tenant, environment, and cloud values used by the generated issuer and subject identifier.

## Data Access

The plugin package entity set is `pluginpackages`. The list request excludes package payload fields. The managed identity entity set is `managedidentities` is read through the `managedidentityid` navigation property on `pluginpackage` and `pluginassembly` records, so no separate read is required unless the caller lacks access to the expanded record. Solution listing queries solution metadata and publisher data, while component membership is resolved through `solutioncomponents`. Browser `fetch` is not used. Package inspection uses `InitializeFileBlocksDownload` with a `pluginpackage` target and `FileAttributeName` set to `package`, then decodes and assembles each `DownloadBlock` Base64 payload in memory. `pluginassembly.content` is not a Dataverse file column and cannot use `InitializeFileBlocksDownload`; assembly inspection retrieves the `content_binary` property first and falls back to the Base64 `content` property.

## Storybook and Mock Data Requirements

The Storybook experience must reflect the real domain data model. Mock data must include all valid combinations of plugin package and plugin assembly records across signed/unsigned, managed/unmanaged, and customizable/non-customizable states, while excluding invalid scenarios such as unsigned + managed relationships. The mock binary payloads must resolve to realistic signed and unsigned NuGet package content and should map the package names to the proper embedded .nupkg fixtures used by the UI.

## Non-Goals

- Updating plugin packages in Dataverse.
- Creating or updating managed identity records outside the inspected tool workflow.
- Validating the federated credential registration in Microsoft Entra ID.
- Claiming that the NuGet signature, timestamp, or chain is valid.
- Allowing assignment of managed identities to unsigned or non-customizable components.
