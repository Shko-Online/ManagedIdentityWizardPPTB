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
import { type PluginAssemblyRecord } from "../services/pluginPackageService";
import useStyles from "../styles/PluginPackageInspector";

type AssemblySortKey =
  | "name"
  | "version"
  | "createdOn"
  | "modifiedOn"
  | "isManaged"
  | "isCustomizable"
  | "managedIdentity";

type PluginAssemblyTableProps = {
  assemblies: PluginAssemblyRecord[];
  inspectedComponentId: string | null;
  hasInspection: boolean;
  hoveredInspectId: string | null;
  isInspecting: boolean;
  isExporting: boolean;
  sortKey: AssemblySortKey;
  sortDescending: boolean;
  onHoverInspect: (id: string | null) => void;
  onInspect: (assemblyRecord: PluginAssemblyRecord) => void;
  onExport: (assemblyRecord: PluginAssemblyRecord) => void;
  onViewDetails: (assemblyRecord: PluginAssemblyRecord) => void;
  onSort: (sortKey: AssemblySortKey) => void;
};

export const PluginAssemblyTable: React.FC<PluginAssemblyTableProps> = ({
  assemblies,
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

  const columns: SortableColumn<PluginAssemblyRecord, AssemblySortKey>[] = [
    {
      key: "name",
      label: "Name",
      className: styles.assemblyNameColumn,
      sortable: true,
      renderCell: (assemblyRecord) => (
        <EllipsisText className={styles.ellipsis} value={assemblyRecord.name} />
      ),
    },
    {
      key: "version",
      label: "Version",
      className: styles.assemblyVersionColumn,
      sortable: true,
      renderCell: (assemblyRecord) => (
        <EllipsisText className={styles.ellipsis} value={assemblyRecord.version || "-"} />
      ),
    },
    {
      key: "isManaged",
      label: "Type",
      className: styles.assemblyManagedColumn,
      sortable: true,
      renderCell: (assemblyRecord) => (
        <Badge appearance="tint" color={assemblyRecord.isManaged ? "brand" : "informative"} title={assemblyRecord.isManaged ? "Managed" : "Unmanaged"}>{assemblyRecord.isManaged ? "M" : "U"}</Badge>
      ),
    },
    {
      key: "isCustomizable",
      label: "Customizable",
      className: styles.customizableColumn,
      sortable: true,
      renderCell: (assemblyRecord) => (
        <Badge appearance="tint" color={assemblyRecord.isCustomizable ? "success" : "danger"} title={assemblyRecord.isCustomizable ? "Customizations are allowed" : "This assembly does not allow customizations"}>{assemblyRecord.isCustomizable ? "Yes" : "No"}</Badge>
      ),
    },
    {
      key: "createdOn",
      label: "Created",
      className: styles.assemblyCreatedColumn,
      sortable: true,
      renderCell: (assemblyRecord) => (
        <span title={formatSolutionDateTime(assemblyRecord.createdOn)}>{formatSolutionDate(assemblyRecord.createdOn)}</span>
      ),
    },
    {
      key: "modifiedOn",
      label: "Modified",
      className: styles.assemblyModifiedColumn,
      sortable: true,
      renderCell: (assemblyRecord) => (
        <span title={formatSolutionDateTime(assemblyRecord.modifiedOn)}>{formatSolutionDate(assemblyRecord.modifiedOn)}</span>
      ),
    },
    {
      key: "managedIdentity",
      label: "Managed identity",
      className: styles.assemblyIdentityColumn,
      sortable: true,
      renderCell: (assemblyRecord) => {
        if (assemblyRecord.managedIdentity) {
          return (
            <EllipsisText
              className={styles.ellipsis}
              value={assemblyRecord.managedIdentity.name}
              title={getManagedIdentityTooltip(assemblyRecord.managedIdentity)}
            />
          );
        }

        if (assemblyRecord.managedIdentityId) {
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
      rows={assemblies}
      columns={columns}
      ariaLabel="Plugin assemblies"
      getRowKey={(assemblyRecord) => assemblyRecord.id}
      tableClassName={styles.table}
      tableContainerClassName={styles.tableContainer}
      tableHeaderClassName={styles.tableHeader}
      rowClassName={(assemblyRecord) =>
        inspectedComponentId === assemblyRecord.id && hasInspection ? styles.inspectedRow : undefined}
      sortKey={sortKey}
      sortDescending={sortDescending}
      onSort={onSort}
      sortButtonClassName={styles.sortButton}
      sortIconSlotClassName={styles.sortIconSlot}
      actionsColumnClassName={styles.assemblyActionColumn}
      renderActions={(assemblyRecord) => (
        <div className={styles.actionButtons}>
          <Button
            appearance="subtle"
            icon={<Info24Regular />}
            aria-label={`View details for ${assemblyRecord.name}`}
            title={`View details for ${assemblyRecord.name}`}
            onClick={() => onViewDetails(assemblyRecord)}
          />
          <Button
            appearance="subtle"
            icon={
              inspectedComponentId === assemblyRecord.id && hasInspection && hoveredInspectId !== assemblyRecord.id
                ? <CheckmarkCircle24Regular className={styles.inspectedIndicator} />
                : <DocumentSearch24Regular />
            }
            aria-label={
              inspectedComponentId === assemblyRecord.id && hasInspection
                ? `Inspect ${assemblyRecord.name} again`
                : `Inspect ${assemblyRecord.name}`
            }
            title={inspectedComponentId === assemblyRecord.id && hasInspection ? "Inspect again" : `Inspect ${assemblyRecord.name}`}
            onMouseEnter={() => onHoverInspect(assemblyRecord.id)}
            onMouseLeave={() => onHoverInspect(null)}
            onClick={() => onInspect(assemblyRecord)}
            disabled={isInspecting || isExporting}
          />
          <Button
            appearance="subtle"
            icon={<Save24Regular />}
            aria-label={`Export ${assemblyRecord.name}`}
            title={`Export ${assemblyRecord.name}`}
            onClick={() => onExport(assemblyRecord)}
            disabled={isInspecting || isExporting}
          />
        </div>
      )}
    />
  );
};
