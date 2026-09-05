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
  onClose,
}: ManagedIdentityDetailsPopupProps) {
  const styles = useManagedIdentityDetailsStyles();
  const [activeTab, setActiveTab] = useState<DetailsTab>("layers");

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onClose();
      }
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [onClose]);

  const copyableFields: Array<{ id: string; label: string; value: string | null }> = [
    { id: "managed-identity-application-id", label: "Application ID", value: managedIdentity.applicationId },
    { id: "managed-identity-tenant-id", label: "Tenant ID", value: managedIdentity.tenantId },
  ];
  const choiceFields: ChoiceField[] = [
    {
      id: "managed-identity-credential-source",
      label: "Credential source",
      value: managedIdentity.credentialSource,
      displayValue: getCredentialSourceLabel(managedIdentity.credentialSource),
      options: credentialSourceOptions,
    },
    {
      id: "managed-identity-subject-scope",
      label: "Subject scope",
      value: managedIdentity.subjectScope,
      displayValue: getSubjectScopeLabel(managedIdentity.subjectScope),
      options: subjectScopeOptions,
    },
    {
      id: "managed-identity-fic-version",
      label: "FIC subject version",
      value: managedIdentity.version,
      displayValue: getManagedIdentityVersionLabel(managedIdentity.version),
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
          <Button appearance="subtle" icon={<Dismiss24Regular />} aria-label="Close managed identity details" onClick={onClose} />
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
          {managedIdentity.version !== null && managedIdentity.version !== 2 && (
            <MessageBar intent="warning">
              <MessageBarBody>
                This managed identity uses federated credential subject version {managedIdentity.version}. The generated subject identifier uses version 2.
              </MessageBarBody>
            </MessageBar>
          )}
          <div className={styles.fields}>
            <Label className={styles.label} htmlFor="managed-identity-name">Name</Label>
            <Input id="managed-identity-name" className={styles.control} readOnly value={managedIdentity.name} />
            <span className={styles.actionCell} />

            {copyableFields.map((field) => (
              <Fragment key={field.id}>
                <Label className={styles.label} htmlFor={field.id}>{field.label}</Label>
                <Input
                  id={field.id}
                  className={styles.control}
                  input={{ className: styles.monospaceInput }}
                  readOnly
                  value={field.value ?? ""}
                  placeholder="-"
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
                  disabled
                  value={field.displayValue}
                  selectedOptions={field.value === null ? [] : [String(field.value)]}
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
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
