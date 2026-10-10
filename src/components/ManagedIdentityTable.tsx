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

import { Edit24Regular, Info24Regular } from "@fluentui/react-icons";
import { Badge, Button } from "@fluentui/react-components";
import {
  getCredentialSourceLabel,
  getManagedIdentityStateLabel,
  getManagedIdentityVersionLabel,
  getSubjectScopeLabel,
  hasTenantMismatch,
} from "../services/pluginPackageInspector";
import EllipsisText from "./EllipsisText";
import SortableDataTable, { type SortableColumn } from "./SortableDataTable";
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

  const columns: SortableColumn<ManagedIdentityRecord, ManagedIdentitySortKey>[] = [
    {
      key: "name",
      label: "Name",
      className: styles.identityNameColumn,
      sortable: true,
      renderCell: (identity) => <EllipsisText className={styles.ellipsis} value={identity.name} />,
    },
    {
      key: "applicationId",
      label: "Application ID",
      className: styles.identityGuidColumn,
      sortable: true,
      renderCell: (identity) => <EllipsisText className={styles.ellipsis} value={identity.applicationId ?? "-"} />,
    },
    {
      key: "tenantId",
      label: "Tenant ID",
      className: styles.identityGuidColumn,
      sortable: true,
      renderCell: (identity) => {
        if (hasTenantMismatch(identity, tenantId)) {
          return (
            <EllipsisText
              className={styles.ellipsis}
              value={identity.tenantId ?? "-"}
              title={`This identity belongs to tenant ${identity.tenantId}, which differs from the tenant used to compute subject identifiers.`}
            />
          );
        }

        return <EllipsisText className={styles.ellipsis} value={identity.tenantId ?? "-"} />;
      },
    },
    {
      key: "credentialSource",
      label: "Credential source",
      className: styles.identityChoiceColumn,
      sortable: true,
      renderCell: (identity) => <EllipsisText className={styles.ellipsis} value={getCredentialSourceLabel(identity.credentialSource)} />,
    },
    {
      key: "subjectScope",
      label: "Subject scope",
      className: styles.identityChoiceColumn,
      sortable: true,
      renderCell: (identity) => <EllipsisText className={styles.ellipsis} value={getSubjectScopeLabel(identity.subjectScope)} />,
    },
    {
      key: "version",
      label: "FIC subject",
      className: styles.identityVersionColumn,
      sortable: true,
      renderCell: (identity) => (
        <Badge
          appearance="tint"
          color={identity.version === 2 ? "success" : "warning"}
          title={getManagedIdentityVersionLabel(identity.version)}
        >
          {identity.version === null ? "-" : `v${identity.version}`}
        </Badge>
      ),
    },
    {
      key: "usedBy",
      label: "Used by",
      className: styles.identityVersionColumn,
      sortable: true,
      renderCell: (identity) => usageCounts.get(identity.id) ?? 0,
    },
    {
      key: "stateCode",
      label: "Status",
      className: styles.identityStatusColumn,
      sortable: true,
      renderCell: (identity) => (
        <Badge appearance="tint" color={identity.stateCode === 0 ? "success" : "danger"}>
          {getManagedIdentityStateLabel(identity.stateCode)}
        </Badge>
      ),
    },
    {
      key: "isManaged",
      label: "Type",
      className: styles.identityManagedColumn,
      sortable: true,
      renderCell: (identity) => (
        <Badge appearance="tint" color={identity.isManaged ? "brand" : "informative"} title={identity.isManaged ? "Managed" : "Unmanaged"}>{identity.isManaged ? "M" : "U"}</Badge>
      ),
    },
    {
      key: "isCustomizable",
      label: "Customizable",
      className: styles.customizableColumn,
      sortable: true,
      renderCell: (identity) => (
        <Badge appearance="tint" color={identity.isCustomizable ? "success" : "danger"} title={identity.isCustomizable ? "Customizations are allowed" : "This managed identity does not allow customizations"}>{identity.isCustomizable ? "Yes" : "No"}</Badge>
      ),
    },
  ];

  return (
    <SortableDataTable
      rows={identities}
      columns={columns}
      ariaLabel="Managed identities"
      getRowKey={(identity) => identity.id}
      tableClassName={styles.identityTable}
      tableContainerClassName={styles.tableContainer}
      tableHeaderClassName={styles.tableHeader}
      sortKey={sortKey}
      sortDescending={sortDescending}
      onSort={onSort}
      sortButtonClassName={styles.sortButton}
      sortIconSlotClassName={styles.sortIconSlot}
      actionsColumnClassName={styles.identityActionColumn}
      renderActions={(identity) => (
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
      )}
    />
  );
};
