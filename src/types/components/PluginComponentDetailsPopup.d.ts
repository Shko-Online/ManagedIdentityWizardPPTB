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

import type { InspectedComponentType } from "../../services/pluginPackageInspector";
import type {
  ManagedIdentityRecord,
  PluginComponentEntity,
} from "../../services/pluginPackageService";
import type { ManagedIdentitySubjectResult } from "../../services/managedIdentitySubject";
import type { NugetSignatureInspection } from "../services/nugetSignatureInspector";

export interface PluginComponentDetails {
  componentType: InspectedComponentType;
  /** `null` for a file inspected from disk, which has no Dataverse record. */
  entityLogicalName: PluginComponentEntity | null;
  id: string | null;
  name: string;
  version: string;
  uniqueName: string | null;
  packageFileName: string | null;
  isManaged: boolean;
  isCustomizable: boolean;
  managedIdentity: ManagedIdentityRecord | null;
  hasManagedIdentity: boolean;
}

export interface PluginComponentDetailsPopupProps {
  component: PluginComponentDetails;
  inspection: NugetSignatureInspection | null;
  isInspecting: boolean;
  identityResult: ManagedIdentitySubjectResult | null;
  issuer: string;
  /** Empty when the tenant and environment are both known. */
  missingIdentitySettingLabels: string;
  environmentId: string;
  copyError: string | null;
  /** `null` for a file inspected from disk, which cannot be re-read from Dataverse. */
  onInspect: (() => void) | null;
  onExport: (() => void) | null;
  onCopy: (label: string, value: string) => void;
  onViewCertificate: () => void;
  onViewManagedIdentity: () => void;
  onManageAssociation?: () => void;
  onOpenSettings: () => void;
  onClose: () => void;
}
