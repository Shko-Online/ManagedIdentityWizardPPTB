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

import type { ManagedIdentityInput, ManagedIdentityRecord } from "../../services/pluginPackageService";

export interface ManagedIdentityEditorDialogProps {
  /** Omitted opens the dialog in create mode. */
  managedIdentity?: ManagedIdentityRecord;
  defaultTenantId: string;
  environmentId: string;
  isSaving: boolean;
  /** Failure from the last save attempt, shown inside the dialog. */
  saveError: string | null;
  onCreate: (input: ManagedIdentityInput) => void;
  /** Only the fields the user actually changed. */
  onUpdate: (changes: Partial<ManagedIdentityInput>) => void;
  onClose: () => void;
}
