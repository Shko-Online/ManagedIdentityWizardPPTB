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
  Dropdown,
  Input,
  Label,
  MessageBar,
  MessageBarBody,
  Option,
  Tab,
  TabList,
  Table,
  TableBody,
  TableCell,
  TableHeader,
  TableHeaderCell,
  TableRow,
  Text,
} from "@fluentui/react-components";
import { Copy24Regular, Dismiss24Regular } from "@fluentui/react-icons";
import { Fragment, useEffect, useState } from "react";
import {
  credentialSourceOptions,
  getCredentialSourceLabel,
  getManagedIdentityStateLabel,
  getManagedIdentityVersionLabel,
  getSubjectScopeLabel,
  hasTenantMismatch,
  managedIdentityStateOptions,
  managedIdentityVersionOptions,
  subjectScopeOptions,
} from "../services/pluginPackageInspector";
import type { ManagedIdentityInput } from "../services/pluginPackageService";
import type { ManagedIdentityDetailsPopupProps } from "../types/components/ManagedIdentityDetailsPopup";
import EllipsisText from "./EllipsisText";
import { SolutionLayers } from "./SolutionLayers";
import useManagedIdentityDetailsStyles from "../styles/ManagedIdentityDetailsPopup";

type ChoiceField = {
  id: string;
  label: string;
  value: number | null;
  displayValue: string;
  options: Array<{ value: number; label: string }>;
};

type DetailsTab = "layers" | "assemblies" | "packages";

export function ManagedIdentityDetailsPopup({
  managedIdentity,
  associatedPackages,
  associatedAssemblies,
  tenantId,
  environmentId,
  copyError,
  onCopy,
  onUpdate,
  onManageAssociation,
  onClose,
}: ManagedIdentityDetailsPopupProps) {
  const styles = useManagedIdentityDetailsStyles();
  const [activeTab, setActiveTab] = useState<DetailsTab>("layers");
  const [isEditing, setIsEditing] = useState(false);
  const [draft, setDraft] = useState<ManagedIdentityInput>({
    name: managedIdentity.name,
    applicationId: managedIdentity.applicationId ?? "",
    tenantId: managedIdentity.tenantId ?? "",
    credentialSource: managedIdentity.credentialSource ?? 2,
    subjectScope: managedIdentity.subjectScope ?? 1,
    version: managedIdentity.version ?? 2,
  });

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onClose();
      }
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [onClose]);

  useEffect(() => {
    setDraft({
      name: managedIdentity.name,
      applicationId: managedIdentity.applicationId ?? "",
      tenantId: managedIdentity.tenantId ?? "",
      credentialSource: managedIdentity.credentialSource ?? 2,
      subjectScope: managedIdentity.subjectScope ?? 1,
      version: managedIdentity.version ?? 2,
    });
    setIsEditing(false);
  }, [managedIdentity]);

  const canEdit = managedIdentity.isCustomizable !== false;
  const changes: Partial<ManagedIdentityInput> = {};
  const original = {
    name: managedIdentity.name,
    applicationId: managedIdentity.applicationId ?? "",
    tenantId: managedIdentity.tenantId ?? "",
    credentialSource: managedIdentity.credentialSource ?? 2,
    subjectScope: managedIdentity.subjectScope ?? 1,
    version: managedIdentity.version ?? 2,
  };

  (Object.keys(original) as Array<keyof ManagedIdentityInput>).forEach((field) => {
    const currentValue = draft[field] as string | number;
    const originalValue = original[field] as string | number;
    if (field === "name") {
      if ((currentValue as string).trim() !== (originalValue as string).trim()) {
        changes[field] = currentValue as never;
      }
    } else if (currentValue !== originalValue) {
      changes[field] = currentValue as never;
    }
  });

  const copyableFields: Array<{ id: string; label: string; value: string | null }> = [
    { id: "managed-identity-application-id", label: "Application ID", value: draft.applicationId || managedIdentity.applicationId },
    { id: "managed-identity-tenant-id", label: "Tenant ID", value: draft.tenantId || managedIdentity.tenantId },
  ];
  const choiceFields: ChoiceField[] = [
    {
      id: "managed-identity-credential-source",
      label: "Credential source",
      value: isEditing ? draft.credentialSource : managedIdentity.credentialSource,
      displayValue: getCredentialSourceLabel(isEditing ? draft.credentialSource : managedIdentity.credentialSource),
      options: credentialSourceOptions,
    },
    {
      id: "managed-identity-subject-scope",
      label: "Subject scope",
      value: isEditing ? draft.subjectScope : managedIdentity.subjectScope,
      displayValue: getSubjectScopeLabel(isEditing ? draft.subjectScope : managedIdentity.subjectScope),
      options: subjectScopeOptions,
    },
    {
      id: "managed-identity-fic-version",
      label: "FIC subject version",
      value: isEditing ? draft.version : managedIdentity.version,
      displayValue: getManagedIdentityVersionLabel(isEditing ? draft.version : managedIdentity.version),
      options: managedIdentityVersionOptions,
    },
    {
      id: "managed-identity-status",
      label: "Status",
      value: managedIdentity.stateCode,
      displayValue: getManagedIdentityStateLabel(managedIdentity.stateCode),
      options: managedIdentityStateOptions,
    },
  ];
  const associatedComponents =
    activeTab === "assemblies" ? associatedAssemblies : associatedPackages;

  const saveChanges = () => {
    if (onUpdate) {
      onUpdate(changes);
    }
  };

  return (
    <div className={styles.overlay} role="presentation" onMouseDown={onClose}>
      <section
        className={styles.popup}
        role="dialog"
        aria-modal="true"
        aria-labelledby="managed-identity-details-title"
        onMouseDown={(event) => event.stopPropagation()}
      >
        <div className={styles.header}>
          <Text id="managed-identity-details-title" weight="semibold" size={400}>Managed identity details</Text>
          <div style={{ display: "flex", gap: "8px" }}>
            {canEdit && !isEditing && (
              <Button appearance="secondary" onClick={() => setIsEditing(true)}>
                Edit
              </Button>
            )}
            <Button appearance="subtle" icon={<Dismiss24Regular />} aria-label="Close managed identity details" onClick={onClose} />
          </div>
        </div>
        <div className={styles.body}>
          {copyError && (
            <MessageBar intent="error">
              <MessageBarBody>{copyError}</MessageBarBody>
            </MessageBar>
          )}
          {hasTenantMismatch(managedIdentity, tenantId) && (
            <MessageBar intent="warning">
              <MessageBarBody>
                This managed identity belongs to tenant {managedIdentity.tenantId}, which differs from the tenant used to compute the subject identifier.
              </MessageBarBody>
            </MessageBar>
          )}
          {managedIdentity.version === 0 && (
            <MessageBar intent="warning">
              <MessageBarBody>
                This managed identity uses deprecated federated credential subject version 0. Version 2 is recommended for new configurations.
              </MessageBarBody>
            </MessageBar>
          )}
          {managedIdentity.isCustomizable === false && (
            <MessageBar intent="warning">
              <MessageBarBody>
                This managed identity does not allow customizations.
              </MessageBarBody>
            </MessageBar>
          )}
          <div className={styles.fields}>
            <Label className={styles.label} htmlFor="managed-identity-name">Name</Label>
            <Input
              id="managed-identity-name"
              className={styles.control}
              readOnly={!isEditing}
              value={draft.name}
              onChange={(_event, data) => setDraft((current) => ({ ...current, name: data.value }))}
            />
            <span className={styles.actionCell} />

            {copyableFields.map((field) => (
              <Fragment key={field.id}>
                <Label className={styles.label} htmlFor={field.id}>{field.label}</Label>
                <Input
                  id={field.id}
                  className={styles.control}
                  input={{ className: styles.monospaceInput }}
                  readOnly={!isEditing}
                  value={field.value ?? ""}
                  placeholder="-"
                  onChange={(_event, data) => {
                    const nextValue = data.value;
                    if (field.label === "Application ID") {
                      setDraft((current) => ({ ...current, applicationId: nextValue }));
                    } else {
                      setDraft((current) => ({ ...current, tenantId: nextValue }));
                    }
                  }}
                />
                <span className={styles.actionCell}>
                  {field.value && (
                    <Button
                      appearance="subtle"
                      icon={<Copy24Regular />}
                      aria-label={`Copy ${field.label.toLowerCase()}`}
                      title={`Copy ${field.label.toLowerCase()}`}
                      onClick={() => onCopy(field.label, field.value ?? "")}
                    />
                  )}
                </span>
              </Fragment>
            ))}

            {choiceFields.map((field) => (
              <Fragment key={field.id}>
                <Label className={styles.label} htmlFor={field.id}>{field.label}</Label>
                <Dropdown
                  id={field.id}
                  className={styles.control}
                  disabled={!isEditing || field.label === "Status"}
                  value={field.displayValue}
                  selectedOptions={field.value === null ? [] : [String(field.value)]}
                  onOptionSelect={(_event, data) => {
                    const value = Number(data.optionValue ?? field.value ?? 0);
                    if (field.id === "managed-identity-credential-source") {
                      setDraft((current) => ({ ...current, credentialSource: value }));
                    }
                    if (field.id === "managed-identity-subject-scope") {
                      setDraft((current) => ({ ...current, subjectScope: value }));
                    }
                    if (field.id === "managed-identity-fic-version") {
                      setDraft((current) => ({ ...current, version: value }));
                    }
                  }}
                >
                  {field.options.map((option) => (
                    <Option key={option.value} value={String(option.value)}>{option.label}</Option>
                  ))}
                </Dropdown>
                <span className={styles.actionCell} />
              </Fragment>
            ))}

            <Label className={styles.label} htmlFor="managed-identity-type">Type</Label>
            <Input
              id="managed-identity-type"
              className={styles.control}
              readOnly
              value={managedIdentity.isManaged ? "Managed" : "Unmanaged"}
            />
            <span className={styles.actionCell} />
          </div>
          <TabList
            className={styles.tabs}
            selectedValue={activeTab}
            onTabSelect={(_event, data) => setActiveTab(data.value as DetailsTab)}
          >
            <Tab value="layers">Solution layers</Tab>
            <Tab value="assemblies">Plugin assemblies ({associatedAssemblies.length})</Tab>
            <Tab value="packages">Plugin packages ({associatedPackages.length})</Tab>
          </TabList>
          {activeTab === "layers" && (
            <SolutionLayers
              entityLogicalName="managedidentity"
              componentId={managedIdentity.id}
              isManaged={managedIdentity.isManaged}
              isCustomizable={managedIdentity.isCustomizable}
              componentLabel="managed identity"
              environmentId={environmentId}
            />
          )}
          {activeTab !== "layers" && (
            <div className={styles.associatedList}>
              {associatedComponents.length === 0 ? (
                <Text className={styles.muted}>
                  No plugin {activeTab === "assemblies" ? "assemblies are" : "packages are"} associated with this managed identity.
                </Text>
              ) : (
                <Table size="extra-small" aria-label={activeTab === "assemblies" ? "Associated plugin assemblies" : "Associated plugin packages"}>
                  <TableHeader>
                    <TableRow>
                      <TableHeaderCell>Name</TableHeaderCell>
                      <TableHeaderCell className={styles.versionColumn}>Version</TableHeaderCell>
                      <TableHeaderCell className={styles.typeColumn}>Type</TableHeaderCell>
                      {isEditing && onManageAssociation && <TableHeaderCell className={styles.typeColumn}>Action</TableHeaderCell>}
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {associatedComponents.map((component) => (
                      <TableRow key={component.id}>
                        <TableCell>
                          <EllipsisText className={styles.ellipsis} value={component.name} />
                        </TableCell>
                        <TableCell className={styles.versionColumn}>{component.version || "-"}</TableCell>
                        <TableCell className={styles.typeColumn}>
                          <Badge appearance="tint" color={component.isManaged ? "brand" : "informative"} title={component.isManaged ? "Managed" : "Unmanaged"}>
                            {component.isManaged ? "M" : "U"}
                          </Badge>
                        </TableCell>
                        {isEditing && onManageAssociation && (
                          <TableCell className={styles.typeColumn}>
                            <Button
                              appearance="subtle"
                              size="small"
                              onClick={() => onManageAssociation(component)}
                              disabled={!component.isCustomizable}
                            >
                              {component.isCustomizable ? "Manage" : "Read-only"}
                            </Button>
                          </TableCell>
                        )}
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </div>
          )}
        </div>
        {isEditing && (
          <div style={{ display: "flex", justifyContent: "flex-end", gap: "8px", paddingTop: "12px" }}>
            <Button appearance="secondary" onClick={() => setIsEditing(false)}>
              Cancel
            </Button>
            <Button appearance="primary" disabled={Object.keys(changes).length === 0 || !canEdit} onClick={saveChanges}>
              Save changes
            </Button>
          </div>
        )}
      </section>
    </div>
  );
}
