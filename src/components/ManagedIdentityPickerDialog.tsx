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
import {
  Add24Regular,
  ArrowSortDown24Regular,
  ArrowSortUp24Regular,
  Dismiss24Regular,
} from "@fluentui/react-icons";
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

type ManagedIdentityPickerSortKey =
  | "name"
  | "applicationId"
  | "tenantId"
  | "credentialSource"
  | "subjectScope"
  | "stateCode";

export function ManagedIdentityPickerDialog({
  identities,
  componentName,
  componentType,
  componentIsCustomizable,
  isSigned,
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
  const [sortKey, setSortKey] = useState<ManagedIdentityPickerSortKey>("name");
  const [sortDescending, setSortDescending] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 10;

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
  const visibleIdentities = identities
    .filter(
      (identity) =>
        !normalizedFilter ||
        [identity.name, identity.applicationId ?? "", identity.tenantId ?? ""].some((value) =>
          value.toLocaleLowerCase().includes(normalizedFilter),
        ),
    )
    .slice()
    .sort((left, right) => {
      const leftValue =
        sortKey === "credentialSource"
          ? getCredentialSourceLabel(left.credentialSource)
          : sortKey === "subjectScope"
            ? getSubjectScopeLabel(left.subjectScope)
            : sortKey === "stateCode"
              ? String(left.stateCode)
              : String(left[sortKey] ?? "");
      const rightValue =
        sortKey === "credentialSource"
          ? getCredentialSourceLabel(right.credentialSource)
          : sortKey === "subjectScope"
            ? getSubjectScopeLabel(right.subjectScope)
            : sortKey === "stateCode"
              ? String(right.stateCode)
              : String(right[sortKey] ?? "");

      const comparison = leftValue.localeCompare(rightValue, undefined, {
        numeric: true,
        sensitivity: "base",
      });

      return sortDescending ? -comparison : comparison;
    });
  const pageCount = Math.max(1, Math.ceil(visibleIdentities.length / pageSize));
  const pagedIdentities = visibleIdentities.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize,
  );
  const pendingIdentity = identities.find((identity) => identity.id === pendingId) ?? null;
  const hasChanged = (currentManagedIdentityId ?? "") !== pendingId;

  const sortIdentitiesBy = (nextSortKey: ManagedIdentityPickerSortKey) => {
    if (sortKey === nextSortKey) {
      setSortDescending((descending) => !descending);
      return;
    }

    setSortKey(nextSortKey);
    setSortDescending(false);
  };

  const sortIcon = (columnSortKey: ManagedIdentityPickerSortKey) =>
    sortKey === columnSortKey
      ? sortDescending
        ? <ArrowSortDown24Regular />
        : <ArrowSortUp24Regular />
      : undefined;

  useEffect(() => {
    setCurrentPage(1);
  }, [filter, identities.length, sortKey, sortDescending]);

  useEffect(() => {
    if (currentPage > pageCount) {
      setCurrentPage(pageCount);
    }
  }, [currentPage, pageCount]);

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
          {!isSigned && (
            <MessageBar intent="warning">
              <MessageBarBody>
                Only signed {componentType === "assembly" ? "assemblies" : "packages"} can be assigned a managed identity.
              </MessageBarBody>
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
                <TableHeaderCell className={styles.nameColumn}>
                  <Button
                    className={styles.headerButton}
                    appearance="subtle"
                    onClick={() => sortIdentitiesBy("name")}
                  >
                    <span className={styles.sortIconSlot} aria-hidden="true" />
                    Name
                    <span className={styles.sortIconSlot}>{sortIcon("name")}</span>
                  </Button>
                </TableHeaderCell>
                <TableHeaderCell className={styles.guidColumn}>
                  <Button
                    className={styles.headerButton}
                    appearance="subtle"
                    onClick={() => sortIdentitiesBy("applicationId")}
                  >
                    <span className={styles.sortIconSlot} aria-hidden="true" />
                    Application ID
                    <span className={styles.sortIconSlot}>{sortIcon("applicationId")}</span>
                  </Button>
                </TableHeaderCell>
                <TableHeaderCell className={styles.guidColumn}>
                  <Button
                    className={styles.headerButton}
                    appearance="subtle"
                    onClick={() => sortIdentitiesBy("tenantId")}
                  >
                    <span className={styles.sortIconSlot} aria-hidden="true" />
                    Tenant ID
                    <span className={styles.sortIconSlot}>{sortIcon("tenantId")}</span>
                  </Button>
                </TableHeaderCell>
                <TableHeaderCell className={styles.choiceColumn}>
                  <Button
                    className={styles.headerButton}
                    appearance="subtle"
                    onClick={() => sortIdentitiesBy("credentialSource")}
                  >
                    <span className={styles.sortIconSlot} aria-hidden="true" />
                    Credential source
                    <span className={styles.sortIconSlot}>{sortIcon("credentialSource")}</span>
                  </Button>
                </TableHeaderCell>
                <TableHeaderCell className={styles.choiceColumn}>
                  <Button
                    className={styles.headerButton}
                    appearance="subtle"
                    onClick={() => sortIdentitiesBy("subjectScope")}
                  >
                    <span className={styles.sortIconSlot} aria-hidden="true" />
                    Subject scope
                    <span className={styles.sortIconSlot}>{sortIcon("subjectScope")}</span>
                  </Button>
                </TableHeaderCell>
                <TableHeaderCell className={styles.statusColumn}>
                  <Button
                    className={styles.headerButton}
                    appearance="subtle"
                    onClick={() => sortIdentitiesBy("stateCode")}
                  >
                    <span className={styles.sortIconSlot} aria-hidden="true" />
                    Status
                    <span className={styles.sortIconSlot}>{sortIcon("stateCode")}</span>
                  </Button>
                </TableHeaderCell>
              </TableRow>
            </TableHeader>
            <TableBody>
              {pagedIdentities.map((identity) => (
                <TableRow
                  key={identity.id}
                  className={styles.selectableRow}
                  tabIndex={componentIsCustomizable && isSigned ? 0 : -1}
                  onClick={() => {
                    if (!componentIsCustomizable || !isSigned) {
                      return;
                    }
                    setPendingId(identity.id === pendingId ? "" : identity.id);
                  }}
                  onKeyDown={(event) => {
                    if (!componentIsCustomizable || !isSigned) {
                      return;
                    }
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
                      disabled={!componentIsCustomizable || !isSigned}
                      onClick={(event) => event.stopPropagation()}
                      onChange={() => {
                        if (!componentIsCustomizable || !isSigned) {
                          return;
                        }
                        setPendingId(pendingId === identity.id ? "" : identity.id);
                      }}
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
          <div className={styles.pagination}>
            <Text className={styles.muted}>Page {currentPage} of {pageCount}</Text>
            <Button
              appearance="subtle"
              onClick={() => setCurrentPage((page) => Math.max(1, page - 1))}
              disabled={currentPage === 1}
            >
              Previous
            </Button>
            <Button
              appearance="subtle"
              onClick={() => setCurrentPage((page) => Math.min(pageCount, page + 1))}
              disabled={currentPage === pageCount}
            >
              Next
            </Button>
          </div>
          <div className={styles.footerActions}>
            <Button appearance="secondary" onClick={onClose} disabled={isSaving}>Cancel</Button>
            <Button
              appearance="primary"
              disabled={!componentIsCustomizable || !isSigned || !hasChanged || isSaving}
              onClick={() => onApply(pendingId || null)}
            >
              {pendingIdentity
                ? `Associate ${pendingIdentity.name}`
                : `Remove association from ${componentType}`}
            </Button>
          </div>
          <Button
            appearance="subtle"
            icon={<Add24Regular />}
            onClick={onCreateNew}
            disabled={!componentIsCustomizable || !isSigned || isSaving}
          >
            New managed identity
          </Button>
        </div>
      </section>
    </div>
  );

  return menuRoot ? createPortal(dialog, menuRoot) : dialog;
}
