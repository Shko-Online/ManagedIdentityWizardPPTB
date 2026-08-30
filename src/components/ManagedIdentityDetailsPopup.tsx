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
  Button,
  Dropdown,
  Input,
  Label,
  MessageBar,
  MessageBarBody,
  Option,
  Text,
} from "@fluentui/react-components";
import { Copy24Regular, Dismiss24Regular } from "@fluentui/react-icons";
import { Fragment, useEffect } from "react";
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
import useManagedIdentityDetailsStyles from "../styles/ManagedIdentityDetailsPopup";

type ChoiceField = {
  id: string;
  label: string;
  value: number | null;
  displayValue: string;
  options: Array<{ value: number; label: string }>;
};

export function ManagedIdentityDetailsPopup({
  managedIdentity,
  tenantId,
  onCopy,
  onClose,
}: ManagedIdentityDetailsPopupProps) {
  const styles = useManagedIdentityDetailsStyles();

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
        </div>
      </section>
    </div>
  );
}
