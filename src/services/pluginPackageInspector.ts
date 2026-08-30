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

import { ManagedIdentityRecord, PluginAssemblyRecord, PluginPackageRecord } from "./pluginPackageService";
import { getCommonName } from "../utils/distinguishedName";

const credentialSourceLabels: Record<number, string> = {
  0: "Client secret",
  1: "Key vault",
  2: "Is managed",
  3: "Microsoft first-party certificate",
};

const subjectScopeLabels: Record<number, string> = {
  0: "Global scope",
  1: "Environment scope",
  2: "Dev only scope",
};

const managedIdentityStateLabels: Record<number, string> = {
  0: "Active",
  1: "Inactive",
};

const managedIdentityVersionLabels: Record<number, string> = {
  1: "Version 1",
  2: "Version 2",
};

function toOptions(labels: Record<number, string>): Array<{ value: number; label: string }> {
  return Object.entries(labels).map(([value, label]) => ({ value: Number(value), label }));
}

export const credentialSourceOptions = toOptions(credentialSourceLabels);
export const subjectScopeOptions = toOptions(subjectScopeLabels);
export const managedIdentityStateOptions = toOptions(managedIdentityStateLabels);
export const managedIdentityVersionOptions = toOptions(managedIdentityVersionLabels);

function getOptionLabel(labels: Record<number, string>, value: number | null): string {
  if (value === null) {
    return "-";
  }

  return labels[value] ?? `Unknown (${value})`;
}

export function getCredentialSourceLabel(value: number | null): string {
  return getOptionLabel(credentialSourceLabels, value);
}

export function getSubjectScopeLabel(value: number | null): string {
  return getOptionLabel(subjectScopeLabels, value);
}

export function getManagedIdentityStateLabel(value: number | null): string {
  return getOptionLabel(managedIdentityStateLabels, value);
}

export function getManagedIdentityVersionLabel(value: number | null): string {
  return getOptionLabel(managedIdentityVersionLabels, value);
}

export function getManagedIdentityTooltip(managedIdentity: ManagedIdentityRecord): string {
  return [
    managedIdentity.name,
    `Application ID: ${managedIdentity.applicationId ?? "-"}`,
    `Tenant ID: ${managedIdentity.tenantId ?? "-"}`,
    `Credential source: ${getCredentialSourceLabel(managedIdentity.credentialSource)}`,
    `Subject scope: ${getSubjectScopeLabel(managedIdentity.subjectScope)}`,
    `FIC subject: ${getManagedIdentityVersionLabel(managedIdentity.version)}`,
  ].join("\n");
}

export function hasTenantMismatch(
  managedIdentity: ManagedIdentityRecord | null,
  tenantId: string,
): boolean {
  const recordTenantId = managedIdentity?.tenantId?.trim();
  const currentTenantId = tenantId.trim();

  if (!recordTenantId || !currentTenantId) {
    return false;
  }

  return recordTenantId.toLowerCase() !== currentTenantId.toLowerCase();
}

export function getStatus(packageRecord: PluginPackageRecord): string {
  if (packageRecord.stateCode === 0) {
    return "Active";
  }

  if (packageRecord.stateCode === 1) {
    return "Inactive";
  }

  return "Unknown";
}

export function getExportFileName(packageRecord: PluginPackageRecord): string {
  const filename = packageRecord.packageName?.split(/[\\/]/).pop();

  if (filename && filename.toLowerCase().endsWith(".nupkg")) {
    return filename;
  }

  return `${packageRecord.uniqueName || packageRecord.id}.nupkg`;
}

export function getAssemblyExportFileName(assemblyRecord: PluginAssemblyRecord): string {
  return assemblyRecord.name.toLowerCase().endsWith(".dll")
    ? assemblyRecord.name
    : `${assemblyRecord.name}.dll`;
}



export function getCertificateIdentity(distinguishedName: string): string {
  return getCommonName(distinguishedName) ?? distinguishedName;
}

export type InspectedComponentType = "assembly" | "package";
export type SolutionSortKey = "uniqueName" | "version" | "isManaged" | "publisher" | "createdOn" | "modifiedOn" | "pluginCount" | "pluginPackageCount";

export function getSignedLabel(componentType: InspectedComponentType, isSelfSigned: boolean): string {
  const certificateType = isSelfSigned ? "Self-Signed" : "Issuer-Signed";
  const componentTypeLabel = componentType === "assembly" ? "Plugin Assembly" : "Plugin Package";
  return `${certificateType} ${componentTypeLabel}`;
}

export function formatSolutionDate(value: string): string {
  if (!value) {
    return "";
  }

  const date = new Date(value);
  return date.toISOString().slice(0, 10);
}

export function formatSolutionDateTime(value: string): string {
  if (!value) {
    return "";
  }

  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? value : date.toLocaleString();
}

export function createNameMatcher(filter: string): (name: string) => boolean {
  const trimmedFilter = filter.trim();

  if (!trimmedFilter) {
    return () => true;
  }

  const normalizedFilter = trimmedFilter.toLocaleLowerCase();
  return (name) => String(name ?? "").toLocaleLowerCase().includes(normalizedFilter);
}