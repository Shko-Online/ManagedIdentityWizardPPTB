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

1. List `pluginpackages` from the connected environment using OData, showing `pluginpackageid`, `name`, `uniquename`, `version`, `package_name`, `fileid`, state, status, and managed identity reference when available.
2. Retrieve the selected package's `content` memo column only when the user chooses to inspect it, and decode the Base64 payload in memory.
3. Keep package, signature, and certificate bytes in memory only. Do not write to Dataverse or persist files locally.
4. Open the package with `@zip.js/zip.js`. A package is reported as signed when it contains the NuGet repository signature entry `.signature.p7s`.
5. Parse the signer certificate with `jkurwa` and show the issuer DN, subject DN, serial number, validity, fingerprint, certificate category, and an embedded CMS certificate chain tree from root to signer. Render issuer and subject DNs as readable X.509 attributes while preserving the raw values used for identity calculations. Show the chain and field/value details for a user-selected certificate in a dedicated in-app popup on request. Select the signer certificate by the CMS signer identifier rather than the first certificate in the embedded set. When `jkurwa` cannot decode a standard CMS signer identifier, use `PKI.js` to match the issuer-and-serial or subject-key-identifier signer reference, then continue certificate-detail processing with `jkurwa`.
6. Classify a package with one embedded CMS certificate as self-signed; classify a package with more than one embedded CMS certificate as trusted.
7. Support trusted and self-signed signing certificates. This version reports signature presence and certificate metadata only; it does not validate CMS integrity, certificate trust, chain validity, or timestamp validity.
8. Accept editable tenant ID, environment ID, and cloud values. Default to public cloud.
9. Produce the managed identity version 2 subject identifier:
   - Trusted certificate: issuer and subject SHA-256 hashes over the exact UTF-8 DN strings, encoded as Base64URL.
   - Self-signed certificate: SHA-256 hash over certificate DER bytes, encoded as Base64URL.
   - Tenant ID: convert the GUID to .NET `Guid.ToByteArray()` byte order before Base64URL encoding.
10. For a signed package, retrieve `TenantId` and `OrganizationId` using the `RetrieveCurrentOrganization` function, while allowing manual edits, then combine those values with cloud configuration to compute the Step 3 federated credential issuer and version 2 subject identifier. Provide a Toolbox clipboard action for each generated value.
11. Allow the user to export a selected plugin package as a `.nupkg` file through the Toolbox file-system API. Toolbox's native save dialog chooses the destination, the file name is prefilled from package metadata, and package bytes are downloaded only for the export operation.
12. Allow the user to select a local `.nupkg` through the Toolbox file picker and inspect its signature and certificate details without requiring a Dataverse connection. Read the selected package as binary data in memory only.
13. Retrieve the `plugin` and `pluginpackage` solution component types from `solutioncomponentdefinitions`, list solutions containing either component type, and filter displayed plugin packages and plugin assemblies by the selected solution's `solutioncomponents` records.
14. Display packages and assemblies in separate tabs with client-side pagination. Show whether each component belongs to a managed or unmanaged solution, move the solution filter into the command toolbar, and provide Authenticode inspection and binary export actions for plugin assemblies.
15. Exclude plugin assemblies associated with a plugin package by filtering `pluginassemblies` where `_packageid_value eq null`. Keep assemblies without stored binary content visible, but report that special or externally hosted assemblies cannot be inspected or exported when an action is requested.
16. Provide a client-side name filter beside the component tabs. Plain text uses case-insensitive contains matching; Apply the filter only after the input loses focus or by pressing `Enter` key.

## Data Access

The Plugin Package entity set is `pluginpackages`. The list request excludes package payload fields. Package inspection uses `InitializeFileBlocksDownload` with a `pluginpackage` target and `FileAttributeName` set to `package`, then decodes and assembles each `DownloadBlock` Base64 payload in memory. `pluginassembly.content` is not a Dataverse File column and cannot use `InitializeFileBlocksDownload`; assembly inspection retrieves the `content_binary` property first and falls back to the Base64 `content` property. Browser `fetch` is not used.

## Non-Goals

- Updating plugin packages.
- Claiming that the NuGet signature, timestamp, or certificate chain is valid.