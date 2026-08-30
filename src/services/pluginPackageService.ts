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

export interface ManagedIdentityRecord {
  id: string;
  name: string;
  applicationId: string | null;
  tenantId: string | null;
  credentialSource: number | null;
  subjectScope: number | null;
  version: number | null;
  stateCode: number | null;
  isManaged: boolean;
}

export interface PluginPackageRecord {
  id: string;
  name: string;
  uniqueName: string;
  version: string;
  packageName: string | null;
  fileId: string | null;
  managedIdentityId: string | null;
  managedIdentity: ManagedIdentityRecord | null;
  isManaged: boolean;
  stateCode: number | null;
  statusCode: number | null;
  createdOn: string;
  modifiedOn: string;
}

export interface SolutionRecord {
  id: string;
  uniqueName: string;
  version: string;
  isManaged: boolean;
  publisher: string;
  createdOn: string;
  modifiedOn: string;
  pluginCount: number;
  pluginPackageCount: number;
}

export interface PluginAssemblyRecord {
  id: string;
  name: string;
  version: string;
  managedIdentityId: string | null;
  managedIdentity: ManagedIdentityRecord | null;
  isManaged: boolean;
  createdOn: string;
  modifiedOn: string;
}

export interface PluginComponentTypes {
  pluginAssembly: number;
  pluginpackage: number;
}

const MANAGED_IDENTITY_EXPAND =
  "$expand=managedidentityid($select=managedidentityid,name,applicationid,tenantid,credentialsource,subjectscope,version,statecode,ismanaged)";

const PLUGIN_PACKAGE_QUERY = [
  "pluginpackages?$select=pluginpackageid,name,uniquename,version,package_name,fileid,ismanaged,statecode,statuscode,createdon,modifiedon,_managedidentityid_value",
  MANAGED_IDENTITY_EXPAND,
  "$orderby=name",
].join("&");

const PLUGIN_ASSEMBLY_QUERY = [
  "pluginassemblies?$select=pluginassemblyid,name,version,ismanaged,createdon,modifiedon,_managedidentityid_value",
  MANAGED_IDENTITY_EXPAND,
  "$filter=_packageid_value eq null",
  "$orderby=name",
].join("&");

const PLUGIN_COMPONENT_DEFINITIONS_QUERY = "solutioncomponentdefinitions?$select=primaryentityname,solutioncomponenttype" +
  "&$filter=primaryentityname eq 'pluginpackage'";

function createSolutionComponentsQuery(
  componentType: number,
): string {
  return "solutioncomponents?$select=_solutionid_value,objectid,componenttype" +
    `&$filter=componenttype eq ${componentType}`;
}

function asString(value: unknown): string | null {
  return typeof value === "string" && value.length > 0 ? value : null;
}

function asNumber(value: unknown): number | null {
  return typeof value === "number" ? value : null;
}

function mapManagedIdentity(value: unknown): ManagedIdentityRecord | null {
  if (typeof value !== "object" || value === null) {
    return null;
  }

  const record = value as Record<string, unknown>;
  const id = asString(record.managedidentityid);

  if (!id) {
    return null;
  }

  return {
    id,
    name: asString(record.name) ?? "(unnamed managed identity)",
    applicationId: asString(record.applicationid),
    tenantId: asString(record.tenantid),
    credentialSource: asNumber(record.credentialsource),
    subjectScope: asNumber(record.subjectscope),
    version: asNumber(record.version),
    stateCode: asNumber(record.statecode),
    isManaged: record.ismanaged === true,
  };
}

/** Callers without read access to managedidentity make the $expand fail, so retry without it. */
async function queryWithOptionalManagedIdentity(
  dataverseAPI: DataverseAPI.API,
  query: string,
): Promise<Record<string, unknown>[]> {
  try {
    const result = await dataverseAPI.queryData(query);
    return result.value;
  } catch {
    const fallbackQuery = query
      .split("&")
      .filter((segment) => segment !== MANAGED_IDENTITY_EXPAND)
      .join("&");
    const result = await dataverseAPI.queryData(fallbackQuery);
    return result.value;
  }
}

function mapPluginPackage(record: Record<string, unknown>): PluginPackageRecord {
  const id = asString(record.pluginpackageid);

  if (!id) {
    throw new Error("Dataverse returned a plugin package without pluginpackageid.");
  }

  return {
    id,
    name: asString(record.name) ?? "(unnamed package)",
    uniqueName: asString(record.uniquename) ?? "",
    version: asString(record.version) ?? "",
    packageName: asString(record.package_name),
    fileId: asString(record.fileid),
    managedIdentityId: asString(record._managedidentityid_value),
    managedIdentity: mapManagedIdentity(record.managedidentityid),
    isManaged: record.ismanaged === true,
    stateCode: asNumber(record.statecode),
    statusCode: asNumber(record.statuscode),
    createdOn: asString(record.createdon) ?? "",
    modifiedOn: asString(record.modifiedon) ?? "",
  };
}

export async function listPluginPackages(
  dataverseAPI: DataverseAPI.API,
): Promise<PluginPackageRecord[]> {
  const records = await queryWithOptionalManagedIdentity(dataverseAPI, PLUGIN_PACKAGE_QUERY);
  return records.map(mapPluginPackage);
}

export async function listPluginAssemblies(
  dataverseAPI: DataverseAPI.API,
): Promise<PluginAssemblyRecord[]> {
  const records = await queryWithOptionalManagedIdentity(dataverseAPI, PLUGIN_ASSEMBLY_QUERY);

  return records.map((record) => {
    const id = asString(record.pluginassemblyid);

    if (!id) {
      throw new Error("Dataverse returned a plugin assembly without pluginassemblyid.");
    }

    return {
      id,
      name: asString(record.name) ?? "(unnamed assembly)",
      version: asString(record.version) ?? "",
      managedIdentityId: asString(record._managedidentityid_value),
      managedIdentity: mapManagedIdentity(record.managedidentityid),
      isManaged: record.ismanaged === true,
      createdOn: asString(record.createdon) ?? "",
      modifiedOn: asString(record.modifiedon) ?? "",
    };
  });
}

export async function getPluginComponentTypes(
  dataverseAPI: DataverseAPI.API,
): Promise<PluginComponentTypes> {
  const result = await dataverseAPI.queryData(PLUGIN_COMPONENT_DEFINITIONS_QUERY);
  const componentTypes = new Map<string, number>();
  for (const record of result.value) {
    const entityName = asString(record.primaryentityname);
    const componentType = asNumber(record.solutioncomponenttype);

    if (entityName && componentType !== null) {
      componentTypes.set(entityName, componentType);
    }
  }

  const pluginAssembly = 91; // Platform HardCoded!  componentTypes.get("plugin");
  const pluginpackage = componentTypes.get("pluginpackage");

  if (pluginAssembly === undefined || pluginpackage === undefined) {
    throw new Error("Dataverse did not return solution component types for pluginassembly and pluginpackage.");
  }

  return { pluginAssembly, pluginpackage };
}

export async function listPluginSolutions(
  dataverseAPI: DataverseAPI.API,
  componentTypes: PluginComponentTypes,
): Promise<SolutionRecord[]> {
  const [
    solutionsResult,
    assemblyComponentsResult,
    packageComponentsResult,
    standaloneAssembliesResult,
  ] = await Promise.all([
    dataverseAPI.queryData(
      "solutions?$select=solutionid,ismanaged,uniquename,version,createdon,modifiedon&$expand=publisherid($select=friendlyname,uniquename)",
    ),
    dataverseAPI.queryData(
      createSolutionComponentsQuery(componentTypes.pluginAssembly),
    ),
    dataverseAPI.queryData(
      createSolutionComponentsQuery(componentTypes.pluginpackage),
    ),
    dataverseAPI.queryData(
      "pluginassemblies?$select=pluginassemblyid&$filter=_packageid_value eq null",
    ),
  ]);
  const standaloneAssemblyIds = new Set(
    standaloneAssembliesResult.value
      .map((record) => asString(record.pluginassemblyid))
      .filter((id): id is string => id !== null),
  );
  const componentCounts = new Map<string, { plugins: number; packages: number }>();
  console.log(assemblyComponentsResult.value, packageComponentsResult.value, standaloneAssemblyIds);
  for (const component of assemblyComponentsResult.value) {
    const solutionId = asString(component._solutionid_value);
    const assemblyId = asString(component.objectid);
    if (solutionId && assemblyId && standaloneAssemblyIds.has(assemblyId)) {
      const counts = componentCounts.get(solutionId) ?? { plugins: 0, packages: 0 };
      counts.plugins += 1;
      componentCounts.set(solutionId, counts);
    }
  }

  for (const component of packageComponentsResult.value) {
    const solutionId = asString(component._solutionid_value);
    if (solutionId) {
      const counts = componentCounts.get(solutionId) ?? { plugins: 0, packages: 0 };
      counts.packages += 1;
      componentCounts.set(solutionId, counts);
    }
  }

  return solutionsResult.value.map((record) => {
    const id = asString(record.solutionid);
    const uniqueName = asString(record.uniquename);

    if (!id || !uniqueName) {
      throw new Error("Dataverse returned a solution without solutionid or uniquename.");
    }

    return {
      id,
      uniqueName,
      version: asString(record.version) ?? "",
      isManaged: record.ismanaged === true,
      publisher: typeof record.publisherid === "object" && record.publisherid !== null
        ? asString((record.publisherid as Record<string, unknown>).friendlyname)
          ?? asString((record.publisherid as Record<string, unknown>).uniquename)
          ?? ""
        : "",
      createdOn: asString(record.createdon) ?? "",
      modifiedOn: asString(record.modifiedon) ?? "",
      pluginCount: componentCounts.get(id)?.plugins ?? 0,
      pluginPackageCount: componentCounts.get(id)?.packages ?? 0,
    };
  }).filter((solution) => solution.pluginCount > 0 || solution.pluginPackageCount > 0);
}

export async function getSolutionComponentObjectIds(
  dataverseAPI: DataverseAPI.API,
  solutionId: string,
  componentType: number,
): Promise<Set<string>> {
  const query = "solutioncomponents?$select=objectid" +
    `&$filter=_solutionid_value eq ${solutionId} and componenttype eq ${componentType}`;
  const result = await dataverseAPI.queryData(query);

  return new Set(
    result.value
      .map((record) => asString(record.objectid))
      .filter((id): id is string => id !== null),
  );
}

function decodeBase64(value: string): Uint8Array {
  try {
    const binary = atob(value.replace(/\s/g, ""));
    const bytes = new Uint8Array(binary.length);

    for (let index = 0; index < binary.length; index += 1) {
      bytes[index] = binary.charCodeAt(index);
    }

    return bytes;
  } catch {
    throw new Error("The plugin package content is not valid Base64 data.");
  }
}

function asPositiveNumber(value: unknown, propertyName: string): number {
  const numberValue = typeof value === "number" ? value : Number(value);

  if (!Number.isSafeInteger(numberValue) || numberValue < 1) {
    throw new Error(`The download response has an invalid ${propertyName} value.`);
  }

  return numberValue;
}

async function getFileColumnContent(
  dataverseAPI: DataverseAPI.API,
  target: Record<string, string>,
  fileAttributeName: string,
): Promise<Uint8Array> {
  const initializeResponse = await dataverseAPI.execute({
    operationName: "InitializeFileBlocksDownload",
    operationType: "action",
    parameters: {
      Target: target,
      FileAttributeName: fileAttributeName,
    },
  });

  const fileContinuationToken = asString(initializeResponse.FileContinuationToken);
  const fileSizeInBytes = asPositiveNumber(initializeResponse.FileSizeInBytes, "FileSizeInBytes");

  if (!fileContinuationToken) {
    throw new Error("The file download could not be initialized because no continuation token was returned.");
  }

  const isChunkingSupported = initializeResponse.IsChunkingSupported === true;
  const blockLength = isChunkingSupported ? Math.min(4 * 1024 * 1024, fileSizeInBytes) : fileSizeInBytes;
  const fileBytes = new Uint8Array(fileSizeInBytes);

  for (let offset = 0; offset < fileSizeInBytes; offset += blockLength) {
    const response = await dataverseAPI.execute({
      operationName: "DownloadBlock",
      operationType: "action",
      parameters: {
        Offset: offset,
        BlockLength: Math.min(blockLength, fileSizeInBytes - offset),
        FileContinuationToken: fileContinuationToken,
      },
    });
    const block = asString(response.Data);

    if (!block) {
      throw new Error(`The download block at offset ${offset} did not contain data.`);
    }

    const blockBytes = decodeBase64(block);
    fileBytes.set(blockBytes, offset);
  }

  return fileBytes;
}

export async function getPluginPackageContent(
  dataverseAPI: DataverseAPI.API,
  pluginPackageId: string,
): Promise<Uint8Array> {
  return getFileColumnContent(dataverseAPI, {
    "@odata.type": "Microsoft.Dynamics.CRM.pluginpackage",
    pluginpackageid: pluginPackageId,
  }, "package");
}

export async function getPluginAssemblyContent(
  dataverseAPI: DataverseAPI.API,
  pluginAssemblyId: string,
): Promise<Uint8Array> {
  const record = await dataverseAPI.retrieve(
    "pluginassembly",
    pluginAssemblyId,
    ["content_binary", "content"],
  );
  const binaryContent = record.content_binary;

  if (binaryContent instanceof Uint8Array) {
    return new Uint8Array(binaryContent);
  }

  if (Array.isArray(binaryContent) && binaryContent.every((byte) => typeof byte === "number")) {
    return new Uint8Array(binaryContent);
  }

  const content = asString(binaryContent) ?? asString(record.content);

  if (!content) {
    throw new Error("This plugin assembly has no stored binary content. Special or externally hosted assemblies cannot be inspected or exported.");
  }

  return decodeBase64(content);
}