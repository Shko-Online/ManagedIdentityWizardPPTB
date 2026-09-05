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

import {
  Button,
  MessageBar,
  MessageBarBody,
  Spinner,
  Table,
  TableBody,
  TableCell,
  TableHeader,
  TableHeaderCell,
  TableRow,
  Text,
} from "@fluentui/react-components";
import {
  type ComponentLayerRecord,
  listComponentLayers,
} from "../services/pluginPackageService";
import { useContext, useEffect, useState } from "react";
import DataverseAPIContext from "../context/DataverseAPIContext";
import EllipsisText from "./EllipsisText";
import { LogsContext } from "../context/LogsContext";
import { OpenRegular } from "@fluentui/react-icons";
import ToolboxAPIContext from "../context/ToolboxAPIContext";
import { formatSolutionDateTime } from "../services/pluginPackageInspector";
import { getSolutionLayersUrl } from "../utils/makerPortal";
import type { SolutionLayersProps } from "../types/components/SolutionLayers";
import useStyles from "../styles/SolutionLayers";

export function SolutionLayers({
  entityLogicalName,
  componentId,
  isManaged,
  isCustomizable,
  componentLabel,
  environmentId,
}: SolutionLayersProps) {
  const styles = useStyles();
  const dataverseAPI = useContext(DataverseAPIContext);
  const toolboxAPI = useContext(ToolboxAPIContext);
  const { addLog } = useContext(LogsContext);
  const [layers, setLayers] = useState<ComponentLayerRecord[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const openInMakerPortal = async () => {
    if (!toolboxAPI) {
      return;
    }

    const url = getSolutionLayersUrl(environmentId, entityLogicalName, componentId);

    try {
      await toolboxAPI.utils.openInConnectionBrowser(url);
      addLog(`Opened the solution layers of this ${componentLabel} in the maker portal.`, "info");
    } catch (openError) {
      addLog(`Unable to open the maker portal: ${(openError as Error).message}`, "error");
    }
  };

  useEffect(() => {
    if (!dataverseAPI) {
      return;
    }

    let isCurrent = true;
    setIsLoading(true);
    setError(null);

    listComponentLayers(dataverseAPI, entityLogicalName, componentId)
      .then((records) => {
        if (isCurrent) {
          setLayers(records);
        }
      })
      .catch((layerError: Error) => {
        if (isCurrent) {
          setLayers([]);
          setError(`Unable to read solution layers: ${layerError.message}`);
        }
      })
      .finally(() => {
        if (isCurrent) {
          setIsLoading(false);
        }
      });

    return () => {
      isCurrent = false;
    };
  }, [dataverseAPI, entityLogicalName, componentId]);

  return (
    <section className={styles.section}>
      <div className={styles.sectionHeader}>
        <Text className={styles.heading}>Solution layers</Text>
        {environmentId.trim() && (
          <Button
            appearance="subtle"
            size="small"
            icon={<OpenRegular />}
            onClick={openInMakerPortal}
          >
            Open in maker portal
          </Button>
        )}
      </div>
      {isManaged && isCustomizable && (
        <MessageBar intent="warning">
          <MessageBarBody>
            This {componentLabel} is managed. Changes are written to the unmanaged layer, which creates an unmanaged customization that overrides the managed layers below.
          </MessageBarBody>
        </MessageBar>
      )}
      {isLoading && <Spinner size="tiny" label="Loading solution layers..." />}
      {error && <Text className={styles.muted}>{error}</Text>}
      {!isLoading && !error && layers.length === 0 && (
        <Text className={styles.muted}>No solution layers were returned for this component.</Text>
      )}
      {layers.length > 0 && (
        <div className={styles.tableContainer}>
          <Table className={styles.table} size="extra-small" aria-label="Solution layers">
            <TableHeader className={styles.tableHeader}>
              <TableRow>
                <TableHeaderCell className={styles.orderColumn}>Order</TableHeaderCell>
                <TableHeaderCell className={styles.solutionColumn}>Solution</TableHeaderCell>
                <TableHeaderCell className={styles.publisherColumn}>Publisher</TableHeaderCell>
                <TableHeaderCell className={styles.overwriteColumn}>Overwrite time</TableHeaderCell>
              </TableRow>
            </TableHeader>
            <TableBody>
              {layers.map((layer) => (
                <TableRow key={layer.id}>
                  <TableCell className={styles.orderColumn}>{layer.order ?? "-"}</TableCell>
                  <TableCell className={styles.solutionColumn}>
                    <EllipsisText className={styles.ellipsis} value={layer.solutionName || "-"} />
                  </TableCell>
                  <TableCell className={styles.publisherColumn}>
                    <EllipsisText className={styles.ellipsis} value={layer.publisherName || "-"} />
                  </TableCell>
                  <TableCell className={styles.overwriteColumn}>
                    {layer.overwriteTime ? formatSolutionDateTime(layer.overwriteTime) : "-"}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </section>
  );
}
