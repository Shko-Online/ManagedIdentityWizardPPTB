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
import EllipsisText from "./EllispsisText";
import { type PluginAssemblyRecord } from "../services/pluginPackageService";
import useStyles from "../styles/PluginPackageInspector";

type AssemblySortKey =
  | "name"
  | "version"
  | "createdOn"
  | "modifiedOn"
  | "isManaged"
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
  onSort,
}) => {
  const styles = useStyles();
  const sortIcon = (columnSortKey: AssemblySortKey) =>
    sortKey === columnSortKey
      ? sortDescending
        ? <ArrowSortDown24Regular />
        : <ArrowSortUp24Regular />
      : undefined;
  const sortableHeader = (label: string, columnSortKey: AssemblySortKey) => (
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
      <Table className={styles.table} size="small" aria-label="Plugin assemblies">
        <TableHeader className={styles.tableHeader}>
          <TableRow>
            <TableHeaderCell className={styles.assemblyNameColumn}>{sortableHeader("Name", "name")}</TableHeaderCell>
            <TableHeaderCell className={styles.assemblyVersionColumn}>{sortableHeader("Version", "version")}</TableHeaderCell>
            <TableHeaderCell className={styles.assemblyManagedColumn}>{sortableHeader("Type", "isManaged")}</TableHeaderCell>
            <TableHeaderCell className={styles.assemblyCreatedColumn}>{sortableHeader("Created", "createdOn")}</TableHeaderCell>
            <TableHeaderCell className={styles.assemblyModifiedColumn}>{sortableHeader("Modified", "modifiedOn")}</TableHeaderCell>
            <TableHeaderCell className={styles.assemblyIdentityColumn}>{sortableHeader("Managed identity", "managedIdentity")}</TableHeaderCell>
            <TableHeaderCell className={styles.assemblyActionColumn}>Actions</TableHeaderCell>
          </TableRow>
        </TableHeader>
        <TableBody>
          {assemblies.map((assemblyRecord) => (
            <TableRow key={assemblyRecord.id} className={inspectedComponentId === assemblyRecord.id && hasInspection ? styles.inspectedRow : undefined}>
              <TableCell className={styles.assemblyNameColumn}><EllipsisText className={styles.ellipsis} value={assemblyRecord.name} /></TableCell>
              <TableCell className={styles.assemblyVersionColumn}><EllipsisText className={styles.ellipsis} value={assemblyRecord.version || "-"} /></TableCell>
              <TableCell className={styles.assemblyManagedColumn}>
                <Badge appearance="tint" color={assemblyRecord.isManaged ? "brand" : "informative"} title={assemblyRecord.isManaged ? "Managed" : "Unmanaged"}>{assemblyRecord.isManaged ? "M" : "U"}</Badge>
              </TableCell>
              <TableCell className={styles.assemblyCreatedColumn} title={formatSolutionDateTime(assemblyRecord.createdOn)}>{formatSolutionDate(assemblyRecord.createdOn)}</TableCell>
              <TableCell className={styles.assemblyModifiedColumn} title={formatSolutionDateTime(assemblyRecord.modifiedOn)}>{formatSolutionDate(assemblyRecord.modifiedOn)}</TableCell>
              <TableCell className={styles.assemblyIdentityColumn}>
                {assemblyRecord.managedIdentity ? (
                  <EllipsisText
                    className={styles.ellipsis}
                    value={assemblyRecord.managedIdentity.name}
                    title={getManagedIdentityTooltip(assemblyRecord.managedIdentity)}
                  />
                ) : assemblyRecord.managedIdentityId ? (
                  <Badge appearance="tint" color="warning" title="The related managed identity record could not be read.">Restricted</Badge>
                ) : (
                  <span className={styles.muted}>-</span>
                )}
              </TableCell>
              <TableCell className={styles.assemblyActionColumn}>
                <div className={styles.actionButtons}>
                  <Button appearance="subtle" icon={inspectedComponentId === assemblyRecord.id && hasInspection && hoveredInspectId !== assemblyRecord.id ? <CheckmarkCircle24Regular className={styles.inspectedIndicator} /> : <DocumentSearch24Regular />} aria-label={inspectedComponentId === assemblyRecord.id && hasInspection ? `Inspect ${assemblyRecord.name} again` : `Inspect ${assemblyRecord.name}`} title={inspectedComponentId === assemblyRecord.id && hasInspection ? "Inspect again" : `Inspect ${assemblyRecord.name}`} onMouseEnter={() => onHoverInspect(assemblyRecord.id)} onMouseLeave={() => onHoverInspect(null)} onClick={() => onInspect(assemblyRecord)} disabled={isInspecting || isExporting} />
                  <Button appearance="subtle" icon={<Save24Regular />} aria-label={`Export ${assemblyRecord.name}`} title={`Export ${assemblyRecord.name}`} onClick={() => onExport(assemblyRecord)} disabled={isInspecting || isExporting} />
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
};
