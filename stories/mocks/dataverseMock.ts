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

import { DataverseAPIMock } from '@shko.online/pptb-mock';
import pluginAssembliesFixture from './fixtures/pluginassemblies.json';
import pluginAssembliesStandaloneFixture from './fixtures/pluginassemblies-standalone.json';
import pluginPackagesFixture from './fixtures/pluginpackages.json';
import retrieveCurrentOrganizationFixture from './fixtures/retrievecurrentorganization.json';
import solutionComponentDefinitionsFixture from './fixtures/solutioncomponentdefinitions.json';
import solutionComponentsPluginFixture from './fixtures/solutioncomponents-plugin.json';
import solutionComponentsPluginPackageFixture from './fixtures/solutioncomponents-pluginpackage.json';
import solutionsFixture from './fixtures/solutions.json';

/** Kept byte-identical to the query strings built in src/services/pluginPackageService.ts. */
const MANAGED_IDENTITY_EXPAND =
  '$expand=managedidentityid($select=managedidentityid,name,applicationid,tenantid,credentialsource,subjectscope,version,statecode,ismanaged)';

const PLUGIN_PACKAGE_QUERY = [
  'pluginpackages?$select=pluginpackageid,name,uniquename,version,package_name,fileid,ismanaged,statecode,statuscode,createdon,modifiedon,_managedidentityid_value',
  MANAGED_IDENTITY_EXPAND,
  '$orderby=name',
].join('&');

const PLUGIN_ASSEMBLY_QUERY = [
  'pluginassemblies?$select=pluginassemblyid,name,version,ismanaged,createdon,modifiedon,_managedidentityid_value',
  MANAGED_IDENTITY_EXPAND,
  '$filter=_packageid_value eq null',
  '$orderby=name',
].join('&');

const PLUGIN_COMPONENT_DEFINITIONS_QUERY =
  "solutioncomponentdefinitions?$select=primaryentityname,solutioncomponenttype&$filter=primaryentityname eq 'pluginpackage'";

const SOLUTIONS_QUERY =
  'solutions?$select=solutionid,ismanaged,uniquename,version,createdon,modifiedon&$expand=publisherid($select=friendlyname,uniquename)';

const STANDALONE_ASSEMBLIES_QUERY =
  'pluginassemblies?$select=pluginassemblyid&$filter=_packageid_value eq null';

const componentsQuery = (componentType: number) =>
  `solutioncomponents?$select=_solutionid_value,objectid,componenttype&$filter=componenttype eq ${componentType}`;

const solutionComponentsQuery = (solutionId: string, componentType: number) =>
  `solutioncomponents?$select=objectid&$filter=_solutionid_value eq ${solutionId} and componenttype eq ${componentType}`;

/** Hard-coded to 91 by getPluginComponentTypes, so the definitions query only covers pluginpackage. */
const PLUGIN_ASSEMBLY_COMPONENT_TYPE = 91;
const PLUGIN_PACKAGE_COMPONENT_TYPE =
  solutionComponentDefinitionsFixture.value[0].solutioncomponenttype;

/** Component payloads captured as Storybook static assets, keyed by record id. */
const PACKAGE_BINARIES: Record<string, string> = {
  'db35d1e3-cda3-f111-b8db-00224899c4e3': 'albx_ShkoOnline.StorageMI.Plugins.nupkg',
  '61dbfe41-3773-4b7f-8146-913fe601954b': 'mspp_Microsoft.PowerPages.AzureBlob.Plugins.nupkg',
  'defb0355-316e-409e-8631-ef617624ac3b': 'albx_AlbanianXrm.PluginPackage.nupkg',
};

const ASSEMBLY_BINARIES: Record<string, string> = {
  '1d12029f-dbc8-48f4-8544-93a3da743658': 'Microsoft.PowerPages.Core.Plugins.dll',
};

/** Signed package used by the inspection story. */
export const SIGNED_PACKAGE_ID = 'db35d1e3-cda3-f111-b8db-00224899c4e3';
export const SIGNED_PACKAGE_NAME = 'albx_ShkoOnline.StorageMI.Plugins';
export const SIGNED_ASSEMBLY_NAME = 'Microsoft.PowerPages.Core.Plugins';
export const UNSIGNED_PACKAGE_NAME = 'albx_AlbanianXrm.PluginPackage';

type QueryResult = { value: Record<string, unknown>[] };

const asQueryResult = (fixture: { value: unknown[] }): QueryResult =>
  fixture as unknown as QueryResult;

const binaryCache = new Map<string, Promise<Uint8Array>>();

function loadBinary(fileName: string): Promise<Uint8Array> {
  let bytes = binaryCache.get(fileName);

  if (!bytes) {
    bytes = fetch(`/mocks/${fileName}`).then(async (response) => {
      if (!response.ok) {
        throw new Error(`Unable to load /mocks/${fileName} (${response.status}).`);
      }

      return new Uint8Array(await response.arrayBuffer());
    });
    binaryCache.set(fileName, bytes);
  }

  return bytes;
}

function toBase64(bytes: Uint8Array): string {
  const chunkSize = 0x8000;
  let binary = '';

  for (let offset = 0; offset < bytes.length; offset += chunkSize) {
    binary += String.fromCharCode(...bytes.subarray(offset, offset + chunkSize));
  }

  return btoa(binary);
}

export function createDataverseAPIMock(): DataverseAPIMock {
  const api = new DataverseAPIMock();

  api.queryData.withArgs(PLUGIN_PACKAGE_QUERY).resolves(asQueryResult(pluginPackagesFixture));
  api.queryData.withArgs(PLUGIN_ASSEMBLY_QUERY).resolves(asQueryResult(pluginAssembliesFixture));
  api.queryData
    .withArgs(STANDALONE_ASSEMBLIES_QUERY)
    .resolves(asQueryResult(pluginAssembliesStandaloneFixture));
  api.queryData
    .withArgs(PLUGIN_COMPONENT_DEFINITIONS_QUERY)
    .resolves(asQueryResult(solutionComponentDefinitionsFixture));
  api.queryData.withArgs(SOLUTIONS_QUERY).resolves(asQueryResult(solutionsFixture));
  api.queryData
    .withArgs(componentsQuery(PLUGIN_ASSEMBLY_COMPONENT_TYPE))
    .resolves(asQueryResult(solutionComponentsPluginFixture));
  api.queryData
    .withArgs(componentsQuery(PLUGIN_PACKAGE_COMPONENT_TYPE))
    .resolves(asQueryResult(solutionComponentsPluginPackageFixture));

  const componentsByType = [
    [PLUGIN_ASSEMBLY_COMPONENT_TYPE, solutionComponentsPluginFixture.value],
    [PLUGIN_PACKAGE_COMPONENT_TYPE, solutionComponentsPluginPackageFixture.value],
  ] as const;

  // Every solution offered by the picker is queried for both component types, including the
  // types it has no components of, so each pair needs a stub even when the answer is empty.
  const solutionIds = new Set(
    componentsByType.flatMap(([, components]) =>
      components.map((component) => component._solutionid_value),
    ),
  );

  for (const [componentType, components] of componentsByType) {
    for (const solutionId of solutionIds) {
      api.queryData.withArgs(solutionComponentsQuery(solutionId, componentType)).resolves({
        value: components
          .filter((component) => component._solutionid_value === solutionId)
          .map((component) => ({ objectid: component.objectid })),
      });
    }
  }

  api.execute.callsFake(async (request) => {
    const parameters = (request.parameters ?? {}) as Record<string, unknown>;

    switch (request.operationName) {
      case 'RetrieveCurrentOrganization':
        return retrieveCurrentOrganizationFixture as unknown as Record<string, unknown>;

      case 'InitializeFileBlocksDownload': {
        const target = parameters.Target as Record<string, unknown> | undefined;
        const packageId = target?.pluginpackageid as string ?? '';
        const fileName = PACKAGE_BINARIES[packageId];

        if (!fileName) {
          throw new Error(
            `No package payload was captured for ${packageId}. Available: ${Object.values(PACKAGE_BINARIES).join(', ')}.`,
          );
        }

        const bytes = await loadBinary(fileName);
        return {
          FileContinuationToken: fileName,
          FileSizeInBytes: bytes.length,
          IsChunkingSupported: true,
          FileName: fileName,
        };
      }

      case 'DownloadBlock': {
        const bytes = await loadBinary(String(parameters.FileContinuationToken));
        const offset = Number(parameters.Offset ?? 0);
        const blockLength = Number(parameters.BlockLength ?? bytes.length);
        return { Data: toBase64(bytes.subarray(offset, offset + blockLength)) };
      }

      default:
        throw new Error(`Unmocked Dataverse operation '${request.operationName}'.`);
    }
  });

  // Assemblies without a captured payload fall through to the service's "no stored content" message.
  api.retrieve.withArgs('pluginassembly').callsFake(async (_entityLogicalName, id) => {
    const fileName = ASSEMBLY_BINARIES[id];
    return fileName ? { content: toBase64(await loadBinary(fileName)) } : {};
  });

  return api;
}

export default createDataverseAPIMock;
