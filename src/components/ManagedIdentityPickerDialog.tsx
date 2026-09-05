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
  Badge,
  Button,
  Input,
  MessageBar,
  MessageBarBody,
  Table,
  TableBody,
  TableCell,
  TableHeader,
  TableHeaderCell,
  TableRow,
  Text,
} from "@fluentui/react-components";
import { Add24Regular, Dismiss24Regular } from "@fluentui/react-icons";
import {
  getCredentialSourceLabel,
  getManagedIdentityStateLabel,
  getManagedIdentityVersionLabel,
  getSubjectScopeLabel,
  hasTenantMismatch,
} from "../services/pluginPackageInspector";
import EllipsisText from "./EllipsisText";
import type { ManagedIdentityPickerDialogProps } from "../types/components/ManagedIdentityPickerDialog";
import MenuRootContext from "../context/MenuRootContext";
import { createPortal } from "react-dom";
import { useContext, useEffect, useState } from "react";
import useStyles from "../styles/ManagedIdentityPickerDialog";

export function ManagedIdentityPickerDialog({
  identities,
  componentName,
  componentType,
  componentIsCustomizable,
  currentManagedIdentityId,
  tenantId,
  isSaving,
  saveError,
  onApply,
  onCreateNew,
  onClose,
}: ManagedIdentityPickerDialogProps) {
  const styles = useStyles();
  const { menuRoot } = useContext(MenuRootContext);
  const [filter, setFilter] = useState("");
  const [pendingId, setPendingId] = useState(currentManagedIdentityId ?? "");

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onClose();
      }
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [onClose]);

  const normalizedFilter = filter.trim().toLocaleLowerCase();
  const visibleIdentities = identities.filter(
    (identity) =>
      !normalizedFilter ||
      [identity.name, identity.applicationId ?? "", identity.tenantId ?? ""].some((value) =>
        value.toLocaleLowerCase().includes(normalizedFilter),
      ),
  );
  const pendingIdentity = identities.find((identity) => identity.id === pendingId) ?? null;
  const hasChanged = (currentManagedIdentityId ?? "") !== pendingId;

  const dialog = (
    <div className={styles.overlay} role="presentation" onMouseDown={onClose}>
      <section
        className={styles.popup}
        role="dialog"
        aria-modal="true"
        aria-labelledby="managed-identity-picker-title"
        onMouseDown={(event) => event.stopPropagation()}
      >
        <div className={styles.header}>
          <Text id="managed-identity-picker-title" weight="semibold" size={400}>
            Managed identity for {componentName}
          </Text>
          <Input
            className={styles.filterInput}
            aria-label="Filter managed identities"
            placeholder="Filter managed identities"
            value={filter}
            onChange={(_event, data) => setFilter(data.value)}
          />
          <Button
            appearance="subtle"
            icon={<Dismiss24Regular />}
            aria-label="Close managed identity picker"
            onClick={onClose}
          />
        </div>
        <div className={styles.messages}>
          {saveError && (
            <MessageBar intent="error">
              <MessageBarBody>{saveError}</MessageBarBody>
            </MessageBar>
          )}
          {!componentIsCustomizable && (
            <MessageBar intent="warning">
              <MessageBarBody>
                This plugin {componentType} does not allow customizations, so its managed identity cannot be changed here.
              </MessageBarBody>
            </MessageBar>
          )}
        </div>
        <div className={styles.tableContainer}>
          {pendingIdentity && hasTenantMismatch(pendingIdentity, tenantId) && (
            <MessageBar intent="warning">
              <MessageBarBody>
                {pendingIdentity.name} belongs to tenant {pendingIdentity.tenantId}, which differs from the tenant used to compute the subject identifier.
              </MessageBarBody>
            </MessageBar>
          )}
          <Table className={styles.table} size="small" aria-label="Managed identities">
            <TableHeader className={styles.tableHeader}>
              <TableRow>
                <TableHeaderCell className={styles.checkboxColumn} />
                <TableHeaderCell className={styles.nameColumn}>Name</TableHeaderCell>
                <TableHeaderCell className={styles.guidColumn}>Application ID</TableHeaderCell>
                <TableHeaderCell className={styles.guidColumn}>Tenant ID</TableHeaderCell>
                <TableHeaderCell className={styles.choiceColumn}>Credential source</TableHeaderCell>
                <TableHeaderCell className={styles.choiceColumn}>Subject scope</TableHeaderCell>
                <TableHeaderCell className={styles.statusColumn}>Status</TableHeaderCell>
              </TableRow>
            </TableHeader>
            <TableBody>
              {visibleIdentities.map((identity) => (
                <TableRow
                  key={identity.id}
                  className={styles.selectableRow}
                  tabIndex={0}
                  onClick={() => setPendingId(identity.id === pendingId ? "" : identity.id)}
                  onKeyDown={(event) => {
                    if (event.key === "Enter" || event.key === " ") {
                      event.preventDefault();
                      setPendingId(identity.id === pendingId ? "" : identity.id);
                    }
                  }}
                >
                  <TableCell className={styles.checkboxColumn}>
                    <input
                      type="checkbox"
                      aria-label={`Select ${identity.name}`}
                      checked={pendingId === identity.id}
                      onClick={(event) => event.stopPropagation()}
                      onChange={() => setPendingId(pendingId === identity.id ? "" : identity.id)}
                    />
                  </TableCell>
                  <TableCell className={styles.nameColumn}>
                    <EllipsisText className={styles.ellipsis} value={identity.name} />
                  </TableCell>
                  <TableCell className={styles.guidColumn}>
                    <EllipsisText className={styles.ellipsis} value={identity.applicationId ?? "-"} />
                  </TableCell>
                  <TableCell className={styles.guidColumn}>
                    <EllipsisText className={styles.ellipsis} value={identity.tenantId ?? "-"} />
                  </TableCell>
                  <TableCell className={styles.choiceColumn}>
                    <EllipsisText className={styles.ellipsis} value={getCredentialSourceLabel(identity.credentialSource)} />
                  </TableCell>
                  <TableCell className={styles.choiceColumn}>
                    <EllipsisText className={styles.ellipsis} value={getSubjectScopeLabel(identity.subjectScope)} />
                  </TableCell>
                  <TableCell className={styles.statusColumn}>
                    <Badge
                      appearance="tint"
                      color={identity.stateCode === 0 ? "success" : "danger"}
                      title={getManagedIdentityVersionLabel(identity.version)}
                    >
                      {getManagedIdentityStateLabel(identity.stateCode)}
                    </Badge>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          {visibleIdentities.length === 0 && (
            <Text className={styles.muted}>No managed identities match the filter.</Text>
          )}
        </div>
        <div className={styles.footer}>
          <Button appearance="subtle" icon={<Add24Regular />} onClick={onCreateNew} disabled={isSaving}>
            New managed identity
          </Button>
          <div className={styles.footerActions}>
            <Button appearance="secondary" onClick={onClose} disabled={isSaving}>Cancel</Button>
            <Button
              appearance="primary"
              disabled={!componentIsCustomizable || !hasChanged || isSaving}
              onClick={() => onApply(pendingId || null)}
            >
              {pendingIdentity
                ? `Associate ${pendingIdentity.name}`
                : `Remove association from ${componentType}`}
            </Button>
          </div>
        </div>
      </section>
    </div>
  );

  return menuRoot ? createPortal(dialog, menuRoot) : dialog;
}
