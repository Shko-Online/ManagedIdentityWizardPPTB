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
  ArrowSortDown24Regular,
  ArrowSortUp24Regular,
  CheckmarkCircle24Regular,
  DocumentSearch24Regular,
  Save24Regular,
} from "@fluentui/react-icons";
import {
  Badge,
  Button,
  Table,
  TableBody,
  TableCell,
  TableHeader,
  TableHeaderCell,
  TableRow,
} from "@fluentui/react-components";
import {
  formatSolutionDate,
  formatSolutionDateTime,
  getManagedIdentityTooltip,
} from "../services/pluginPackageInspector";
import EllipsisText from "./EllipsisText";
import { type PluginPackageRecord } from "../services/pluginPackageService";
import useStyles from "../styles/PluginPackageInspector";

type PackageSortKey =
  | "name"
  | "uniqueName"
  | "version"
  | "packageName"
  | "createdOn"
  | "modifiedOn"
  | "isManaged"
  | "managedIdentity";

type PluginPackageTableProps = {
  packages: PluginPackageRecord[];
  inspectedComponentId: string | null;
  hasInspection: boolean;
  hoveredInspectId: string | null;
  isInspecting: boolean;
  isExporting: boolean;
  sortKey: PackageSortKey;
  sortDescending: boolean;
  onHoverInspect: (id: string | null) => void;
  onInspect: (packageRecord: PluginPackageRecord) => void;
  onExport: (packageRecord: PluginPackageRecord) => void;
  onSort: (sortKey: PackageSortKey) => void;
};

export const PluginPackageTable: React.FC<PluginPackageTableProps> = ({
  packages,
  inspectedComponentId,
  hasInspection,
  hoveredInspectId,
  isInspecting,
  isExporting,
  sortKey,
  sortDescending,
  onHoverInspect,
  onInspect,
  onExport,
  onSort,
}) => {
  const styles = useStyles();
  const sortIcon = (columnSortKey: PackageSortKey) =>
    sortKey === columnSortKey
      ? sortDescending
        ? <ArrowSortDown24Regular />
        : <ArrowSortUp24Regular />
      : undefined;
  const sortableHeader = (label: string, columnSortKey: PackageSortKey) => (
    <Button
      className={styles.sortButton}
      appearance="subtle"
      onClick={() => onSort(columnSortKey)}
    >
      <span className={styles.sortIconSlot} aria-hidden="true" />
      {label}
      <span className={styles.sortIconSlot}>{sortIcon(columnSortKey)}</span>
    </Button>
  );

  return (
    <div className={styles.tableContainer}>
      <Table className={styles.table} size="small" aria-label="Plugin packages">
        <TableHeader className={styles.tableHeader}>
          <TableRow>
            <TableHeaderCell className={styles.nameColumn}>{sortableHeader("Name", "name")}</TableHeaderCell>
            <TableHeaderCell className={styles.uniqueNameColumn}>{sortableHeader("Unique name", "uniqueName")}</TableHeaderCell>
            <TableHeaderCell className={styles.versionColumn}>{sortableHeader("Version", "version")}</TableHeaderCell>
            <TableHeaderCell className={styles.packageFileColumn}>{sortableHeader("Package file", "packageName")}</TableHeaderCell>
            <TableHeaderCell className={styles.createdColumn}>{sortableHeader("Created", "createdOn")}</TableHeaderCell>
            <TableHeaderCell className={styles.modifiedColumn}>{sortableHeader("Modified", "modifiedOn")}</TableHeaderCell>
            <TableHeaderCell className={styles.managedColumn}>{sortableHeader("Type", "isManaged")}</TableHeaderCell>
            <TableHeaderCell className={styles.identityColumn}>{sortableHeader("Managed identity", "managedIdentity")}</TableHeaderCell>
            <TableHeaderCell className={styles.actionColumn}>Actions</TableHeaderCell>
          </TableRow>
        </TableHeader>
        <TableBody>
          {packages.map((packageRecord) => (
            <TableRow key={packageRecord.id} className={inspectedComponentId === packageRecord.id && hasInspection ? styles.inspectedRow : undefined}>
              <TableCell className={styles.nameColumn}><EllipsisText className={styles.ellipsis} value={packageRecord.name} /></TableCell>
              <TableCell className={styles.uniqueNameColumn}><EllipsisText className={styles.ellipsis} value={packageRecord.uniqueName || "-"} /></TableCell>
              <TableCell className={styles.versionColumn}><EllipsisText className={styles.ellipsis} value={packageRecord.version || "-"} /></TableCell>
              <TableCell className={styles.packageFileColumn}><EllipsisText className={styles.ellipsis} value={packageRecord.packageName ?? "No package file"} /></TableCell>
              <TableCell className={styles.createdColumn} title={formatSolutionDateTime(packageRecord.createdOn)}>{formatSolutionDate(packageRecord.createdOn)}</TableCell>
              <TableCell className={styles.modifiedColumn} title={formatSolutionDateTime(packageRecord.modifiedOn)}>{formatSolutionDate(packageRecord.modifiedOn)}</TableCell>
              <TableCell className={styles.managedColumn}>
                <Badge appearance="tint" color={packageRecord.isManaged ? "brand" : "informative"} title={packageRecord.isManaged ? "Managed" : "Unmanaged"}>{packageRecord.isManaged ? "M" : "U"}</Badge>
              </TableCell>
              <TableCell className={styles.identityColumn}>
                {packageRecord.managedIdentity ? (
                  <EllipsisText
                    className={styles.ellipsis}
                    value={packageRecord.managedIdentity.name}
                    title={getManagedIdentityTooltip(packageRecord.managedIdentity)}
                  />
                ) : packageRecord.managedIdentityId ? (
                  <Badge appearance="tint" color="warning" title="The related managed identity record could not be read.">Restricted</Badge>
                ) : (
                  <span className={styles.muted}>-</span>
                )}
              </TableCell>
              <TableCell className={styles.actionColumn}>
                <div className={styles.actionButtons}>
                  <Button appearance="subtle" icon={inspectedComponentId === packageRecord.id && hasInspection && hoveredInspectId !== packageRecord.id ? <CheckmarkCircle24Regular className={styles.inspectedIndicator} /> : <DocumentSearch24Regular />} aria-label={inspectedComponentId === packageRecord.id && hasInspection ? `Inspect ${packageRecord.name} again` : `Inspect ${packageRecord.name}`} title={inspectedComponentId === packageRecord.id && hasInspection ? "Inspect again" : `Inspect ${packageRecord.name}`} onMouseEnter={() => onHoverInspect(packageRecord.id)} onMouseLeave={() => onHoverInspect(null)} onClick={() => onInspect(packageRecord)} disabled={isInspecting || isExporting} />
                  <Button appearance="subtle" icon={<Save24Regular />} aria-label={`Export ${packageRecord.name}`} title={`Export ${packageRecord.name}`} onClick={() => onExport(packageRecord)} disabled={isInspecting || isExporting} />
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
};
