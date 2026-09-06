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

import type {
  ManagedIdentityInput,
  ManagedIdentityRecord,
  PluginAssemblyRecord,
  PluginPackageRecord,
} from "../../services/pluginPackageService";

export interface ManagedIdentityDetailsPopupProps {
  managedIdentity: ManagedIdentityRecord;
  /** Plugin packages currently bound to this identity. */
  associatedPackages: PluginPackageRecord[];
  /** Plugin assemblies currently bound to this identity. */
  associatedAssemblies: PluginAssemblyRecord[];
  tenantId: string;
  environmentId: string;
  /** Failure from the last copy attempt, shown inside the popup. */
  copyError: string | null;
  onCopy: (label: string, value: string) => void;
  onUpdate?: (changes: Partial<ManagedIdentityInput>) => void;
  onManageAssociation?: (component: PluginPackageRecord | PluginAssemblyRecord) => void;
  onClose: () => void;
}
