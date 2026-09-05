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

/** Well-known solutionid of the Default Solution, which layers are always inspected through. */
const DEFAULT_SOLUTION_ID = "fd140aaf-4df4-11dd-bd17-0019b9312238";

const objectSegments: Record<LayeredComponentEntity, string> = {
  managedidentity: "managedidentities",
  pluginassembly: "pluginassemblies",
  pluginpackage: "pluginpackages",
};

export function getSolutionLayersUrl(
  environmentId: string,
  entityLogicalName: LayeredComponentEntity,
  componentId: string,
): string {
  return `https://make.powerapps.com/environments/${environmentId.trim()}/solutions/${DEFAULT_SOLUTION_ID}` +
    `/objects/${objectSegments[entityLogicalName]}/${componentId}/layers`;
}
