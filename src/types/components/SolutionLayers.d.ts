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

import type { LayeredComponentEntity } from "../services/pluginPackageService";

export interface SolutionLayersProps {
  entityLogicalName: LayeredComponentEntity;
  componentId: string;
  /** Drives the warning that editing a managed component creates an unmanaged customization. */
  isManaged: boolean;
  /** Suppresses that warning when the component is locked and cannot be changed anyway. */
  isCustomizable: boolean;
  /** Wording for the warning, for example "managed identity" or "plugin package". */
  componentLabel: string;
  /** Needed to build the maker portal link; the command is hidden without it. */
  environmentId: string;
}
