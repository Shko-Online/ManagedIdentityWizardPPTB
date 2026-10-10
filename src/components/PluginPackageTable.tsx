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
  CheckmarkCircle24Regular,
  DocumentSearch24Regular,
  Info24Regular,
  Save24Regular,
} from "@fluentui/react-icons";
import { Badge, Button } from "@fluentui/react-components";
import {
  formatSolutionDate,
  formatSolutionDateTime,
  getManagedIdentityTooltip,
} from "../services/pluginPackageInspector";
import EllipsisText from "./EllipsisText";
import SortableDataTable, { type SortableColumn } from "./SortableDataTable";
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
  | "isCustomizable"
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
  onViewDetails: (packageRecord: PluginPackageRecord) => void;
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
  onViewDetails,
  onSort,
}) => {
  const styles = useStyles();

  const columns: SortableColumn<PluginPackageRecord, PackageSortKey>[] = [
    {
      key: "name",
      label: "Name",
      className: styles.nameColumn,
      sortable: true,
      renderCell: (packageRecord) => (
        <EllipsisText className={styles.ellipsis} value={packageRecord.name} />
      ),
    },
    {
      key: "uniqueName",
      label: "Unique name",
      className: styles.uniqueNameColumn,
      sortable: true,
      renderCell: (packageRecord) => (
        <EllipsisText className={styles.ellipsis} value={packageRecord.uniqueName || "-"} />
      ),
    },
    {
      key: "version",
      label: "Version",
      className: styles.versionColumn,
      sortable: true,
      renderCell: (packageRecord) => (
        <EllipsisText className={styles.ellipsis} value={packageRecord.version || "-"} />
      ),
    },
    {
      key: "packageName",
      label: "Package file",
      className: styles.packageFileColumn,
      sortable: true,
      renderCell: (packageRecord) => (
        <EllipsisText className={styles.ellipsis} value={packageRecord.packageName ?? "No package file"} />
      ),
    },
    {
      key: "createdOn",
      label: "Created",
      className: styles.createdColumn,
      sortable: true,
      renderCell: (packageRecord) => (
        <span title={formatSolutionDateTime(packageRecord.createdOn)}>{formatSolutionDate(packageRecord.createdOn)}</span>
      ),
    },
    {
      key: "modifiedOn",
      label: "Modified",
      className: styles.modifiedColumn,
      sortable: true,
      renderCell: (packageRecord) => (
        <span title={formatSolutionDateTime(packageRecord.modifiedOn)}>{formatSolutionDate(packageRecord.modifiedOn)}</span>
      ),
    },
    {
      key: "isManaged",
      label: "Type",
      className: styles.managedColumn,
      sortable: true,
      renderCell: (packageRecord) => (
        <Badge appearance="tint" color={packageRecord.isManaged ? "brand" : "informative"} title={packageRecord.isManaged ? "Managed" : "Unmanaged"}>{packageRecord.isManaged ? "M" : "U"}</Badge>
      ),
    },
    {
      key: "isCustomizable",
      label: "Customizable",
      className: styles.customizableColumn,
      sortable: true,
      renderCell: (packageRecord) => (
        <Badge appearance="tint" color={packageRecord.isCustomizable ? "success" : "danger"} title={packageRecord.isCustomizable ? "Customizations are allowed" : "This package does not allow customizations"}>{packageRecord.isCustomizable ? "Yes" : "No"}</Badge>
      ),
    },
    {
      key: "managedIdentity",
      label: "Managed identity",
      className: styles.identityColumn,
      sortable: true,
      renderCell: (packageRecord) => {
        if (packageRecord.managedIdentity) {
          return (
            <EllipsisText
              className={styles.ellipsis}
              value={packageRecord.managedIdentity.name}
              title={getManagedIdentityTooltip(packageRecord.managedIdentity)}
            />
          );
        }

        if (packageRecord.managedIdentityId) {
          return (
            <Badge appearance="tint" color="warning" title="The related managed identity record could not be read.">Restricted</Badge>
          );
        }

        return <span className={styles.muted}>-</span>;
      },
    },
  ];

  return (
    <SortableDataTable
      rows={packages}
      columns={columns}
      ariaLabel="Plugin packages"
      getRowKey={(packageRecord) => packageRecord.id}
      tableClassName={styles.table}
      tableContainerClassName={styles.tableContainer}
      tableHeaderClassName={styles.tableHeader}
      rowClassName={(packageRecord) =>
        inspectedComponentId === packageRecord.id && hasInspection ? styles.inspectedRow : undefined}
      sortKey={sortKey}
      sortDescending={sortDescending}
      onSort={onSort}
      sortButtonClassName={styles.sortButton}
      sortIconSlotClassName={styles.sortIconSlot}
      actionsColumnClassName={styles.actionColumn}
      renderActions={(packageRecord) => (
        <div className={styles.actionButtons}>
          <Button
            appearance="subtle"
            icon={<Info24Regular />}
            aria-label={`View details for ${packageRecord.name}`}
            title={`View details for ${packageRecord.name}`}
            onClick={() => onViewDetails(packageRecord)}
          />
          <Button
            appearance="subtle"
            icon={
              inspectedComponentId === packageRecord.id && hasInspection && hoveredInspectId !== packageRecord.id
                ? <CheckmarkCircle24Regular className={styles.inspectedIndicator} />
                : <DocumentSearch24Regular />
            }
            aria-label={
              inspectedComponentId === packageRecord.id && hasInspection
                ? `Inspect ${packageRecord.name} again`
                : `Inspect ${packageRecord.name}`
            }
            title={inspectedComponentId === packageRecord.id && hasInspection ? "Inspect again" : `Inspect ${packageRecord.name}`}
            onMouseEnter={() => onHoverInspect(packageRecord.id)}
            onMouseLeave={() => onHoverInspect(null)}
            onClick={() => onInspect(packageRecord)}
            disabled={isInspecting || isExporting}
          />
          <Button
            appearance="subtle"
            icon={<Save24Regular />}
            aria-label={`Export ${packageRecord.name}`}
            title={`Export ${packageRecord.name}`}
            onClick={() => onExport(packageRecord)}
            disabled={isInspecting || isExporting}
          />
        </div>
      )}
    />
  );
};
