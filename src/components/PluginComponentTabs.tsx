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

import { Button, Input } from "@fluentui/react-components";
import useStyles from "../styles/PluginComponentTabs";

export type PluginComponentTab = "packages" | "assemblies";

type PluginComponentTabsProps = {
  activeTab: PluginComponentTab;
  packageCount: number;
  assemblyCount: number;
  filter: string;
  onActiveTabChange: (tab: PluginComponentTab) => void;
  onFilterChange: (filter: string) => void;
};

export const PluginComponentTabs: React.FC<PluginComponentTabsProps> = ({
  activeTab,
  packageCount,
  assemblyCount,
  filter,
  onActiveTabChange,
  onFilterChange,
}) => {
  const styles = useStyles();

  return (
    <div className={styles.tabs} role="tablist" aria-label="Component type">
      <div className={styles.tabButtons}>
        <Button
          appearance="subtle"
          className={activeTab === "packages" ? styles.activeTab : undefined}
          role="tab"
          aria-selected={activeTab === "packages"}
          onClick={() => onActiveTabChange("packages")}
        >
          Plugin packages ({packageCount})
        </Button>
        <Button
          appearance="subtle"
          className={activeTab === "assemblies" ? styles.activeTab : undefined}
          role="tab"
          aria-selected={activeTab === "assemblies"}
          onClick={() => onActiveTabChange("assemblies")}
        >
          Plugin assemblies ({assemblyCount})
        </Button>
      </div>
      <Input
        className={styles.nameFilter}
        aria-label="Filter component names"
        value={filter}
        placeholder="Filter by name"
        onChange={(_event, data) =>
          onFilterChange(data.value.replace(/\//g, ""))
        }
      />
    </div>
  );
};