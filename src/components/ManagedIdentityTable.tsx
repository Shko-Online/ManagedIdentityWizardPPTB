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
  Edit24Regular,
  Info24Regular,
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
  getCredentialSourceLabel,
  getManagedIdentityStateLabel,
  getManagedIdentityVersionLabel,
  getSubjectScopeLabel,
  hasTenantMismatch,
} from "../services/pluginPackageInspector";
import EllipsisText from "./EllipsisText";
import { type ManagedIdentityRecord } from "../services/pluginPackageService";
import useStyles from "../styles/PluginPackageInspector";

export type ManagedIdentitySortKey =
  | "name"
  | "applicationId"
  | "tenantId"
  | "credentialSource"
  | "subjectScope"
  | "version"
  | "usedBy"
  | "stateCode"
  | "isManaged"
  | "isCustomizable";

type ManagedIdentityTableProps = {
  identities: ManagedIdentityRecord[];
  tenantId: string;
  usageCounts: Map<string, number>;
  isBusy: boolean;
  sortKey: ManagedIdentitySortKey;
  sortDescending: boolean;
  onEdit: (identity: ManagedIdentityRecord) => void;
  onViewDetails: (identity: ManagedIdentityRecord) => void;
  onSort: (sortKey: ManagedIdentitySortKey) => void;
};

export const ManagedIdentityTable: React.FC<ManagedIdentityTableProps> = ({
  identities,
  tenantId,
  usageCounts,
  isBusy,
  sortKey,
  sortDescending,
  onEdit,
  onViewDetails,
  onSort,
}) => {
  const styles = useStyles();
  const sortIcon = (columnSortKey: ManagedIdentitySortKey) =>
    sortKey === columnSortKey
      ? sortDescending
        ? <ArrowSortDown24Regular />
        : <ArrowSortUp24Regular />
      : undefined;
  const sortableHeader = (label: string, columnSortKey: ManagedIdentitySortKey) => (
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
      <Table className={styles.identityTable} size="small" aria-label="Managed identities">
        <TableHeader className={styles.tableHeader}>
          <TableRow>
            <TableHeaderCell className={styles.identityNameColumn}>{sortableHeader("Name", "name")}</TableHeaderCell>
            <TableHeaderCell className={styles.identityGuidColumn}>{sortableHeader("Application ID", "applicationId")}</TableHeaderCell>
            <TableHeaderCell className={styles.identityGuidColumn}>{sortableHeader("Tenant ID", "tenantId")}</TableHeaderCell>
            <TableHeaderCell className={styles.identityChoiceColumn}>{sortableHeader("Credential source", "credentialSource")}</TableHeaderCell>
            <TableHeaderCell className={styles.identityChoiceColumn}>{sortableHeader("Subject scope", "subjectScope")}</TableHeaderCell>
            <TableHeaderCell className={styles.identityVersionColumn}>{sortableHeader("FIC subject", "version")}</TableHeaderCell>
            <TableHeaderCell className={styles.identityVersionColumn}>{sortableHeader("Used by", "usedBy")}</TableHeaderCell>
            <TableHeaderCell className={styles.identityStatusColumn}>{sortableHeader("Status", "stateCode")}</TableHeaderCell>
            <TableHeaderCell className={styles.identityManagedColumn}>{sortableHeader("Type", "isManaged")}</TableHeaderCell>
            <TableHeaderCell className={styles.customizableColumn}>{sortableHeader("Customizable", "isCustomizable")}</TableHeaderCell>
            <TableHeaderCell className={styles.identityActionColumn}>Actions</TableHeaderCell>
          </TableRow>
        </TableHeader>
        <TableBody>
          {identities.map((identity) => (
            <TableRow key={identity.id}>
              <TableCell className={styles.identityNameColumn}><EllipsisText className={styles.ellipsis} value={identity.name} /></TableCell>
              <TableCell className={styles.identityGuidColumn}><EllipsisText className={styles.ellipsis} value={identity.applicationId ?? "-"} /></TableCell>
              <TableCell className={styles.identityGuidColumn}>
                {hasTenantMismatch(identity, tenantId) ? (
                  <EllipsisText
                    className={styles.ellipsis}
                    value={identity.tenantId ?? "-"}
                    title={`This identity belongs to tenant ${identity.tenantId}, which differs from the tenant used to compute subject identifiers.`}
                  />
                ) : (
                  <EllipsisText className={styles.ellipsis} value={identity.tenantId ?? "-"} />
                )}
              </TableCell>
              <TableCell className={styles.identityChoiceColumn}><EllipsisText className={styles.ellipsis} value={getCredentialSourceLabel(identity.credentialSource)} /></TableCell>
              <TableCell className={styles.identityChoiceColumn}><EllipsisText className={styles.ellipsis} value={getSubjectScopeLabel(identity.subjectScope)} /></TableCell>
              <TableCell className={styles.identityVersionColumn}>
                <Badge
                  appearance="tint"
                  color={identity.version === 2 ? "success" : "warning"}
                  title={getManagedIdentityVersionLabel(identity.version)}
                >
                  {identity.version === null ? "-" : `v${identity.version}`}
                </Badge>
              </TableCell>
              <TableCell className={styles.identityVersionColumn}>{usageCounts.get(identity.id) ?? 0}</TableCell>
              <TableCell className={styles.identityStatusColumn}>
                <Badge appearance="tint" color={identity.stateCode === 0 ? "success" : "danger"}>
                  {getManagedIdentityStateLabel(identity.stateCode)}
                </Badge>
              </TableCell>
              <TableCell className={styles.identityManagedColumn}>
                <Badge appearance="tint" color={identity.isManaged ? "brand" : "informative"} title={identity.isManaged ? "Managed" : "Unmanaged"}>{identity.isManaged ? "M" : "U"}</Badge>
              </TableCell>
              <TableCell className={styles.customizableColumn}>
                <Badge appearance="tint" color={identity.isCustomizable ? "success" : "danger"} title={identity.isCustomizable ? "Customizations are allowed" : "This managed identity does not allow customizations"}>{identity.isCustomizable ? "Yes" : "No"}</Badge>
              </TableCell>
              <TableCell className={styles.identityActionColumn}>
                <div className={styles.actionButtons}>
                  <Button
                    appearance="subtle"
                    icon={<Info24Regular />}
                    aria-label={`View details for ${identity.name}`}
                    title={`View details for ${identity.name}`}
                    onClick={() => onViewDetails(identity)}
                  />
                  <Button
                    appearance="subtle"
                    icon={<Edit24Regular />}
                    aria-label={`Edit ${identity.name}`}
                    title={
                      identity.isCustomizable === false
                        ? "This managed identity does not allow customizations."
                        : identity.isManaged
                          ? "Managed records can still be edited, but changes are overwritten on the next solution import."
                          : `Edit ${identity.name}`
                    }
                    onClick={() => {
                      if (identity.isCustomizable === false) {
                        return;
                      }
                      onEdit(identity);
                    }}
                    disabled={isBusy || identity.isCustomizable === false}
                  />
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
};
