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
import managedIdentitiesFixture from './fixtures/managedidentities.json';
import pluginAssembliesFixture from './fixtures/pluginassemblies.json';
import pluginAssembliesStandaloneFixture from './fixtures/pluginassemblies-standalone.json';
import pluginPackagesFixture from './fixtures/pluginpackages.json';
import retrieveCurrentOrganizationFixture from './fixtures/retrievecurrentorganization.json';
import solutionComponentDefinitionsFixture from './fixtures/solutioncomponentdefinitions.json';
import solutionComponentNamesFixture from './fixtures/solutioncomponentnames.json';
import solutionComponentsPluginFixture from './fixtures/solutioncomponents-plugin.json';
import solutionComponentsPluginPackageFixture from './fixtures/solutioncomponents-pluginpackage.json';
import solutionsFixture from './fixtures/solutions.json';

/** Kept byte-identical to the query strings built in src/services/pluginPackageService.ts. */
const MANAGED_IDENTITY_EXPAND =
  '$expand=managedidentityid($select=managedidentityid,name,applicationid,tenantid,credentialsource,subjectscope,version,statecode,ismanaged,iscustomizable)';

const PLUGIN_PACKAGE_QUERY = [
  'pluginpackages?$select=pluginpackageid,name,uniquename,version,package_name,fileid,ismanaged,iscustomizable,statecode,statuscode,createdon,modifiedon,_managedidentityid_value',
  MANAGED_IDENTITY_EXPAND,
  '$orderby=name',
].join('&');

const PLUGIN_ASSEMBLY_QUERY = [
  'pluginassemblies?$select=pluginassemblyid,name,version,ismanaged,iscustomizable,createdon,modifiedon,_managedidentityid_value',
  MANAGED_IDENTITY_EXPAND,
  '$filter=_packageid_value eq null',
  '$orderby=name',
].join('&');

const PLUGIN_COMPONENT_DEFINITIONS_QUERY =
  "solutioncomponentdefinitions?$select=primaryentityname,solutioncomponenttype&$filter=primaryentityname eq 'pluginpackage'";

const MANAGED_IDENTITY_QUERY =
  'managedidentities?$select=managedidentityid,name,applicationid,tenantid,credentialsource,subjectscope,version,statecode,ismanaged,iscustomizable&$orderby=name';

const SOLUTION_COMPONENT_NAMES_QUERY =
  "solutioncomponentdefinitions?$select=name,primaryentityname&$filter=primaryentityname eq 'managedidentity' or primaryentityname eq 'pluginassembly' or primaryentityname eq 'pluginpackage'";

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

const toManagedProperty = (value: boolean) => ({ Value: value, CanBeChanged: false });

const buildMatrixRecords = () => {
  const identities: Record<string, unknown>[] = [];
  const packages: Record<string, unknown>[] = [];
  const assemblies: Record<string, unknown>[] = [];

  const combos = [
    { signed: true, managed: true, customizable: true },
    { signed: true, managed: true, customizable: false },
    { signed: true, managed: false, customizable: true },
    { signed: true, managed: false, customizable: false },
    { signed: false, managed: false, customizable: true },
    { signed: false, managed: false, customizable: false },
  ] as const;

  const buildIdentity = (suffix: string, customizable: boolean) => {
    const id = crypto.randomUUID();
    const identity = {
      managedidentityid: id,
      name: `Mock Identity ${suffix}`,
      applicationid: `11111111-1111-1111-1111-${suffix.padStart(12, '0')}`.slice(0, 36),
      tenantid: 'f0f0f0f0-1111-2222-3333-444455556666',
      credentialsource: 2,
      subjectscope: 1,
      version: 2,
      statecode: 0,
      ismanaged: true,
      iscustomizable: toManagedProperty(customizable),
    };
    identities.push(identity);
    return identity;
  };

  for (const [index, combo] of combos.entries()) {
    const packageSuffix = `${combo.signed ? 'signed' : 'unsigned'}-${combo.managed ? 'managed' : 'unmanaged'}-${combo.customizable ? 'customizable' : 'fixed'}`;
    const assemblySuffix = packageSuffix;

    const packageId = `mock-package-${index}`;
    const assemblyId = `mock-assembly-${index}`;
    const packageName = `mock_Package_${packageSuffix.replace(/[^a-zA-Z0-9]/g, '_')}`;
    const assemblyName = `mock_Assembly_${assemblySuffix.replace(/[^a-zA-Z0-9]/g, '_')}`;

    const packageManagedIdentity = combo.managed
      ? buildIdentity(packageName, combo.customizable)
      : null;
    const assemblyManagedIdentity = combo.managed
      ? buildIdentity(`${assemblyName}_mi`, combo.customizable)
      : null;

    const packageRecord = {
      pluginpackageid: packageId,
      name: packageName,
      uniquename: packageName,
      version: '1.0.0',
      package_name: combo.signed ? `${packageName}.nupkg` : `${packageName}_unsigned.nupkg`,
      fileid: null,
      ismanaged: combo.managed,
      iscustomizable: toManagedProperty(combo.customizable),
      statecode: 0,
      statuscode: 1,
      createdon: '2024-01-01T00:00:00Z',
      modifiedon: '2024-01-02T00:00:00Z',
      _managedidentityid_value: packageManagedIdentity ? packageManagedIdentity.managedidentityid : null,
      managedidentityid: packageManagedIdentity,
    };

    const assemblyRecord = {
      pluginassemblyid: assemblyId,
      name: assemblyName,
      version: '1.0.0',
      ismanaged: combo.managed,
      iscustomizable: toManagedProperty(combo.customizable),
      createdon: '2024-01-01T00:00:00Z',
      modifiedon: '2024-01-02T00:00:00Z',
      _managedidentityid_value: assemblyManagedIdentity ? assemblyManagedIdentity.managedidentityid : null,
      managedidentityid: assemblyManagedIdentity,
    };

    packages.push(packageRecord);
    assemblies.push(assemblyRecord);

    if (combo.signed) {
      PACKAGE_BINARIES[packageId] = 'albx_ShkoOnline.StorageMI.Plugins.nupkg';
      ASSEMBLY_BINARIES[assemblyId] = 'Microsoft.PowerPages.Core.Plugins.dll';
    } else {
      PACKAGE_BINARIES[packageId] = 'albx_AlbanianXrm.PluginPackage.nupkg';
    }
  }

  return { identities, packages, assemblies };
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
  const generated = buildMatrixRecords();

  // Mutable copies so create/update calls made by the tool are visible on the next query.
  const identities = [
    ...structuredClone(managedIdentitiesFixture.value),
    ...generated.identities,
  ] as Record<string, unknown>[];
  const packages = [
    ...structuredClone(pluginPackagesFixture.value),
    ...generated.packages,
  ] as Record<string, unknown>[];
  const assemblies = [
    ...structuredClone(pluginAssembliesFixture.value),
    ...generated.assemblies,
  ] as Record<string, unknown>[];

  // The captures predate the iscustomizable column; lock the managed records so both states show.
  for (const record of [...identities, ...packages, ...assemblies]) {
    record.iscustomizable = { Value: record.ismanaged !== true, CanBeChanged: false };
  }

  for (const component of [...packages, ...assemblies]) {
    const identity = component.managedidentityid as Record<string, unknown> | null;

    if (identity) {
      identity.iscustomizable = { Value: identity.ismanaged !== true, CanBeChanged: false };
    }
  }

  const findIdentity = (id: string) =>
    identities.find((identity) => identity.managedidentityid === id) ?? null;

  api.queryData.withArgs(PLUGIN_PACKAGE_QUERY).callsFake(async () => ({ value: packages }));
  api.queryData
    .withArgs("pluginpackages?$select=pluginpackageid,_managedidentityid_value")
    .callsFake(async () => ({
      value: packages.map((record) => ({
        pluginpackageid: record.pluginpackageid,
        _managedidentityid_value: record._managedidentityid_value ?? null,
      })),
    }));
  api.queryData.withArgs(PLUGIN_ASSEMBLY_QUERY).callsFake(async () => ({ value: assemblies }));
  api.queryData
    .withArgs("pluginassemblies?$select=pluginassemblyid,_managedidentityid_value")
    .callsFake(async () => ({
      value: assemblies.map((record) => ({
        pluginassemblyid: record.pluginassemblyid,
        _managedidentityid_value: record._managedidentityid_value ?? null,
      })),
    }));
  api.queryData.withArgs(MANAGED_IDENTITY_QUERY).callsFake(async () => ({
    value: identities
      .slice()
      .sort((left, right) => String(left.name).localeCompare(String(right.name))),
  }));
  api.create.withArgs('managedidentity').callsFake(async (_entityLogicalName, record) => {
    const id = crypto.randomUUID();
    identities.push({ ...record, managedidentityid: id, statecode: 0, ismanaged: false });
    return { id };
  });
  api.update.callsFake(async (entityLogicalName, id, record) => {
    if (entityLogicalName === 'managedidentity') {
      const identity = findIdentity(id);

      if (!identity) {
        throw new Error(`No managed identity with id ${id}.`);
      }

      Object.assign(identity, record);
      return;
    }

    const idAttribute =
      entityLogicalName === 'pluginpackage' ? 'pluginpackageid' : 'pluginassemblyid';
    const component = (entityLogicalName === 'pluginpackage' ? packages : assemblies).find(
      (candidate) => candidate[idAttribute] === id,
    );

    if (!component) {
      throw new Error(`No ${entityLogicalName} with id ${id}.`);
    }

    const bind = record['managedidentityid@odata.bind'];
    const identityId =
      typeof bind === 'string' ? (/\(([^)]+)\)/.exec(bind)?.[1] ?? null) : null;
    component._managedidentityid_value = identityId;
    component.managedidentityid = identityId ? findIdentity(identityId) : null;
  });

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

  api.queryData
    .withArgs(SOLUTION_COMPONENT_NAMES_QUERY)
    .resolves(asQueryResult(solutionComponentNamesFixture));

  // Layer queries are per component, so they are answered by the default behaviour; sinon still
  // prefers the withArgs stubs above for every other query.
  api.queryData.callsFake(async (odataQuery) => {
    const match = /msdyn_componentid eq '([^']+)' and msdyn_solutioncomponentname eq '([^']+)'/.exec(
      odataQuery,
    );

    if (!match) {
      throw new Error(`Please mock the 'dataverseAPI.queryData' method for '${odataQuery}'.`);
    }

    const [, componentId, solutionComponentName] = match;
    const owner =
      identities.find((identity) => identity.managedidentityid === componentId) ??
      packages.find((candidate) => candidate.pluginpackageid === componentId) ??
      assemblies.find((candidate) => candidate.pluginassemblyid === componentId);

    return {
      value: owner?.ismanaged
        ? [
            {
              msdyn_componentlayerid: `${componentId}-active`,
              msdyn_name: solutionComponentName,
              msdyn_solutionname: 'Active',
              msdyn_publishername: 'Shko Online',
              msdyn_order: 2,
              msdyn_overwritetime: '1900-01-01T00:00:00Z',
            },
            {
              msdyn_componentlayerid: `${componentId}-managed`,
              msdyn_name: solutionComponentName,
              msdyn_solutionname: 'Shko Online Storage Managed Identity',
              msdyn_publishername: 'Shko Online',
              msdyn_order: 1,
              msdyn_overwritetime: '2026-02-14T09:12:00Z',
            },
          ]
        : [
            {
              msdyn_componentlayerid: `${componentId}-active`,
              msdyn_name: solutionComponentName,
              msdyn_solutionname: 'Active',
              msdyn_publishername: 'Shko Online',
              msdyn_order: 1,
              msdyn_overwritetime: '1900-01-01T00:00:00Z',
            },
          ],
    };
  });

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
