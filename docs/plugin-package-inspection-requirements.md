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

Provide a Power Platform ToolBox workflow that reads plugin package records from the connected Dataverse environment, inspects a selected NuGet package in memory, and generates the managed identity version 2 federated credential subject identifier from its signing certificate.

## Sources

- [Plugin Package table reference](https://learn.microsoft.com/en-us/power-apps/developer/data-platform/reference/entities/pluginpackage)
- [Set up managed identity for Dataverse plug-ins or plug-in packages](https://learn.microsoft.com/en-us/power-platform/admin/set-up-managed-identity)

## Functional Requirements

1. List plugin packages and standalone plugin assemblies from the connected environment using OData. For packages, show `pluginpackageid`, `name`, `uniquename`, `version`, `package_name`, `fileid`, state, status, and managed identity reference when available. Exclude plugin assemblies associated with a plugin package by filtering `pluginassemblies` where `_packageid_value eq null`.
2. Display packages and assemblies in separate tabs with client-side pagination. Show whether each component belongs to a managed or unmanaged solution, and provide Inspect and Export actions for packages and assemblies. Assemblies without stored binary content remain visible, but inspection and export must report that special or externally hosted assemblies cannot be processed.
3. Retrieve the `plugin` and `pluginpackage` solution component types from `solutioncomponentdefinitions`, list solutions containing either component type, and filter displayed plugin packages and plugin assemblies by the selected solution's `solutioncomponents` records. Show each solution's unique name, version, managed/unmanaged type, publisher, created date, and modified date.
4. Provide a solution-selection popup for environments with large numbers of solutions. Include a client-side text filter for solution metadata, sortable columns for unique name, version, solution type, publisher, created date, and modified date, and show ascending/descending direction icons in the clickable column headers. Clicking the current sort column toggles direction; clicking another column sorts ascending.
5. Use an unlabeled checkbox as the first solution-table column and allow selecting a solution by clicking its checkbox or anywhere in its row. Stage the selection until confirmation. A staged empty selection represents all solutions. The confirmation button must read `Select <solution unique name>` for a selected solution or `Select All Solutions` when no solution is selected, then apply the filter and close the popup.
6. Provide a client-side component name filter beside the component tabs. Plain text uses case-insensitive contains matching, and slash characters are removed before the filter value is stored.
7. Retrieve the selected package's `content` memo column only when the user chooses to inspect it, and decode the Base64 payload in memory. Package inspection opens the package with `@zip.js/zip.js` and reports it as signed when it contains the NuGet repository signature entry `.signature.p7s`.
8. Allow the user to select a local `.nupkg` or `.dll` through the Toolbox file picker without requiring a Dataverse connection. Route NuGet packages through NuGet signature inspection and plugin assemblies through Authenticode inspection. Read the selected file as binary data in memory only. Report unsigned assemblies as `This assembly is not signed.`
9. Allow the user to export a selected plugin package as a `.nupkg` file and a selected plugin assembly as a `.dll` file through the Toolbox file-system API. The native save dialog chooses the destination, the file name is prefilled from component metadata, and component bytes are downloaded only for the export operation.
10. Keep package, assembly, signature, and certificate bytes in memory only. Do not write to Dataverse or persist files locally.
11. Parse the signer certificate with `jkurwa` and show the issuer DN, subject DN, serial number, validity, fingerprint, certificate category, and an embedded CMS certificate chain tree from root to signer. Render issuer and subject DNs as readable X.509 attributes while preserving the raw values used for identity calculations. Show the chain and field/value details for a user-selected certificate in a dedicated in-app popup on request. Select the signer certificate by the CMS signer identifier rather than the first certificate in the embedded set. When `jkurwa` cannot decode a standard CMS signer identifier, use `PKI.js` to match the issuer-and-serial or subject-key-identifier signer reference, then continue certificate-detail processing with `jkurwa`.
12. Classify a package with one embedded CMS certificate as self-signed; classify a package with more than one embedded CMS certificate as trusted. Apply equivalent certificate inspection and classification behavior to Authenticode-signed assemblies.
13. Support trusted and self-signed signing certificates. This version reports signature presence and certificate metadata only; it does not validate CMS or Authenticode integrity, certificate trust, chain validity, or timestamp validity.
14. Accept editable tenant ID, environment ID, and cloud values in the Managed identity subject settings popup. Default to public cloud. Keep the generated Issuer and Subject identifier values in the inspection view directly below `View certificate details`; provide a Toolbox clipboard action for each generated value.
15. Produce the managed identity version 2 subject identifier:
   - Trusted certificate: issuer and subject SHA-256 hashes over the exact UTF-8 DN strings, encoded as Base64URL.
   - Self-signed certificate: SHA-256 hash over certificate DER bytes, encoded as Base64URL.
   - Tenant ID: convert the GUID to .NET `Guid.ToByteArray()` byte order before Base64URL encoding.
16. For a signed package or assembly, retrieve `TenantId` and `OrganizationId` using the `RetrieveCurrentOrganization` function, while allowing manual edits, then combine those values with cloud configuration to compute the Step 3 federated credential issuer and version 2 subject identifier.
17. Mark the row that produced the current inspection with a green checkmark in its Inspect action; while hovering that checkmark, show the inspect icon and indicate that the inspection can be run again. Mark the Inspect Local Package button when the current result came from a local file.
18. Refreshing packages must clear the current inspection result, inspected component indicator, generated identity result, and certificate-details popup state.

## Data Access

The Plugin Package entity set is `pluginpackages`. The list request excludes package payload fields. Package inspection uses `InitializeFileBlocksDownload` with a `pluginpackage` target and `FileAttributeName` set to `package`, then decodes and assembles each `DownloadBlock` Base64 payload in memory. `pluginassembly.content` is not a Dataverse File column and cannot use `InitializeFileBlocksDownload`; assembly inspection retrieves the `content_binary` property first and falls back to the Base64 `content` property. Solution listing queries solution metadata and the publisher navigation property, while component membership is resolved through `solutioncomponents`. Browser `fetch` is not used.

## Non-Goals

- Updating plugin packages.
- Claiming that the NuGet signature, timestamp, or certificate chain is valid.