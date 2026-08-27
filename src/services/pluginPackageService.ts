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

export interface PluginPackageRecord {
  id: string;
  name: string;
  uniqueName: string;
  version: string;
  packageName: string | null;
  fileId: string | null;
  managedIdentityId: string | null;
  stateCode: number | null;
  statusCode: number | null;
}

const PLUGIN_PACKAGE_QUERY = [
  "pluginpackages?$select=pluginpackageid,name,uniquename,version,package_name,fileid,statecode,statuscode,_managedidentityid_value",
  "$orderby=name",
].join("&");

function asString(value: unknown): string | null {
  return typeof value === "string" && value.length > 0 ? value : null;
}

function asNumber(value: unknown): number | null {
  return typeof value === "number" ? value : null;
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
    stateCode: asNumber(record.statecode),
    statusCode: asNumber(record.statuscode),
  };
}

export async function listPluginPackages(
  dataverseAPI: DataverseAPI.API,
): Promise<PluginPackageRecord[]> {
  const result = await dataverseAPI.queryData(PLUGIN_PACKAGE_QUERY);
  return result.value.map(mapPluginPackage);
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

export async function getPluginPackageContent(
  dataverseAPI: DataverseAPI.API,
  pluginPackageId: string,
): Promise<Uint8Array> {
  const initializeResponse = await dataverseAPI.execute({
    operationName: "InitializeFileBlocksDownload",
    operationType: "action",
    parameters: {
      Target: {
        "@odata.type": "Microsoft.Dynamics.CRM.pluginpackage",
        pluginpackageid: pluginPackageId,
      },
      FileAttributeName: "package",
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