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
import { Dismiss24Regular } from "@fluentui/react-icons";
import { formatGuidInput, isGuid } from "../utils/guid";
import {
  credentialSourceOptions,
  getCredentialSourceLabel,
  getSubjectScopeLabel,
  getManagedIdentityVersionLabel,
  managedIdentityVersionOptions,
  subjectScopeOptions,
} from "../services/pluginPackageInspector";
import MenuRootContext from "../context/MenuRootContext";
import { SolutionLayers } from "./SolutionLayers";
import { type ManagedIdentityInput, UNNAMED_MANAGED_IDENTITY } from "../services/pluginPackageService";
import type { ManagedIdentityEditorDialogProps } from "../types/components/ManagedIdentityEditorDialog";
import { createPortal } from "react-dom";
import { Fragment, useContext, useEffect, useState } from "react";
import useStyles from "../styles/ManagedIdentityEditorDialog";

export function ManagedIdentityEditorDialog({
  managedIdentity,
  defaultTenantId,
  environmentId,
  isSaving,
  saveError,
  onCreate,
  onUpdate,
  onClose,
}: ManagedIdentityEditorDialogProps) {
  const styles = useStyles();
  const { menuRoot } = useContext(MenuRootContext);
  const [name, setName] = useState(
    managedIdentity?.name === UNNAMED_MANAGED_IDENTITY ? "" : (managedIdentity?.name ?? ""),
  );
  const [applicationId, setApplicationId] = useState(managedIdentity?.applicationId ?? "");
  const [tenantId, setTenantId] = useState(managedIdentity?.tenantId ?? defaultTenantId);
  const [credentialSource, setCredentialSource] = useState(managedIdentity?.credentialSource ?? 2);
  const [subjectScope, setSubjectScope] = useState(managedIdentity?.subjectScope ?? 1);
  const [version, setVersion] = useState(managedIdentity?.version ?? 2);
  const [isPristine, setIsPristine] = useState(true);
  const isReadOnly = managedIdentity?.isCustomizable === false;

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onClose();
      }
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [onClose]);

  const validationMessage = !isGuid(applicationId)
    ? "The application ID must be a GUID."
    : tenantId.trim() && !isGuid(tenantId)
      ? "The tenant ID must be a GUID."
      : null;

  const currentInput: ManagedIdentityInput = {
    name,
    applicationId,
    tenantId,
    credentialSource,
    subjectScope,
    version,
  };
  const originalInput: ManagedIdentityInput | null = managedIdentity
    ? {
        name: managedIdentity.name === UNNAMED_MANAGED_IDENTITY ? "" : managedIdentity.name,
        applicationId: managedIdentity.applicationId ?? "",
        tenantId: managedIdentity.tenantId ?? "",
        credentialSource: managedIdentity.credentialSource ?? 2,
        subjectScope: managedIdentity.subjectScope ?? 1,
        version: managedIdentity.version ?? 2,
      }
    : null;
  const changedFields: Partial<ManagedIdentityInput> = {};

  if (originalInput) {
    if (name.trim() !== originalInput.name.trim()) {
      changedFields.name = name;
    }

    if (applicationId.trim() !== originalInput.applicationId.trim()) {
      changedFields.applicationId = applicationId;
    }

    if (tenantId.trim() !== originalInput.tenantId.trim()) {
      changedFields.tenantId = tenantId;
    }

    if (credentialSource !== originalInput.credentialSource) {
      changedFields.credentialSource = credentialSource;
    }

    if (subjectScope !== originalInput.subjectScope) {
      changedFields.subjectScope = subjectScope;
    }

    if (version !== originalInput.version) {
      changedFields.version = version;
    }
  }

  const hasChanges = Object.keys(changedFields).length > 0;

  const choiceFields = [
    {
      id: "managed-identity-editor-credential-source",
      label: "Credential source",
      value: credentialSource,
      displayValue: getCredentialSourceLabel(credentialSource),
      options: credentialSourceOptions,
      onChange: setCredentialSource,
    },
    {
      id: "managed-identity-editor-subject-scope",
      label: "Subject scope",
      value: subjectScope,
      displayValue: getSubjectScopeLabel(subjectScope),
      options: subjectScopeOptions,
      onChange: setSubjectScope,
    },
    {
      id: "managed-identity-editor-version",
      label: "FIC subject version",
      value: version,
      displayValue: getManagedIdentityVersionLabel(version),
      options: managedIdentityVersionOptions,
      onChange: setVersion,
    },
  ];

  const dialog = (
    <div className={styles.overlay} role="presentation" onMouseDown={onClose}>
      <section
        className={styles.popup}
        role="dialog"
        aria-modal="true"
        aria-labelledby="managed-identity-editor-title"
        onMouseDown={(event) => event.stopPropagation()}
      >
        <div className={styles.header}>
          <Text id="managed-identity-editor-title" weight="semibold" size={400}>
            {managedIdentity ? "Edit managed identity" : "New managed identity"}
          </Text>
          <Button
            appearance="subtle"
            icon={<Dismiss24Regular />}
            aria-label="Close managed identity editor"
            onClick={onClose}
          />
        </div>
        <div className={styles.body}>
          {saveError && (
            <MessageBar intent="error">
              <MessageBarBody>{saveError}</MessageBarBody>
            </MessageBar>
          )}
          {isReadOnly && (
            <MessageBar intent="warning">
              <MessageBarBody>
                This managed identity does not allow customizations, so it cannot be edited here.
              </MessageBarBody>
            </MessageBar>
          )}
          {!isPristine && validationMessage && (
            <MessageBar intent="error">
              <MessageBarBody>{validationMessage}</MessageBarBody>
            </MessageBar>
          )}
          <div className={styles.fields}>
            <Label className={styles.label} htmlFor="managed-identity-editor-name">Name</Label>
            <Input
              id="managed-identity-editor-name"
              className={styles.control}
              readOnly={isReadOnly}
              value={name}
              onChange={(_event, data) => {
                setIsPristine(false);
                setName(data.value);
              }}
              placeholder="Contoso.Plugins Identity"
            />

            <Label className={styles.label} htmlFor="managed-identity-editor-application-id">Application ID</Label>
            <Input
              id="managed-identity-editor-application-id"
              className={styles.control}
              input={{ className: styles.monospaceInput }}
              readOnly={isReadOnly}
              value={applicationId}
              onChange={(_event, data) => {
                setIsPristine(false);
                setApplicationId(formatGuidInput(data.value));
              }}
              placeholder="00000000-0000-0000-0000-000000000000"
              spellCheck={false}
            />

            <Label className={styles.label} htmlFor="managed-identity-editor-tenant-id">Tenant ID</Label>
            <Input
              id="managed-identity-editor-tenant-id"
              className={styles.control}
              input={{ className: styles.monospaceInput }}
              readOnly={isReadOnly}
              value={tenantId}
              onChange={(_event, data) => {
                setIsPristine(false);
                setTenantId(formatGuidInput(data.value));
              }}
              placeholder="00000000-0000-0000-0000-000000000000"
              spellCheck={false}
            />

            {choiceFields.map((field) => (
              <Fragment key={field.id}>
                <Label className={styles.label} htmlFor={field.id}>{field.label}</Label>
                <Dropdown
                  id={field.id}
                  className={styles.control}
                  disabled={isReadOnly}
                  value={field.displayValue}
                  selectedOptions={[String(field.value)]}
                  onOptionSelect={(_event, data) => {
                    if (data.optionValue !== undefined) {
                      field.onChange(Number(data.optionValue));
                    }
                  }}
                >
                  {field.options.map((option) => (
                    <Option key={option.value} value={String(option.value)}>{option.label}</Option>
                  ))}
                </Dropdown>
              </Fragment>
            ))}
          </div>
          {managedIdentity && (
            <SolutionLayers
              entityLogicalName="managedidentity"
              componentId={managedIdentity.id}
              isManaged={managedIdentity.isManaged}
              isCustomizable={managedIdentity.isCustomizable}
              componentLabel="managed identity"
              environmentId={environmentId}
            />
          )}
        </div>
        <div className={styles.footer}>
          <Button appearance="secondary" onClick={onClose} disabled={isSaving}>Cancel</Button>
          <Button
            appearance="primary"
            disabled={
              isReadOnly ||
              validationMessage !== null ||
              isSaving ||
              (managedIdentity !== undefined && !hasChanges)
            }
            onClick={() =>
              managedIdentity ? onUpdate(changedFields) : onCreate(currentInput)
            }
          >
            {managedIdentity ? "Save changes" : "Create managed identity"}
          </Button>
        </div>
      </section>
    </div>
  );

  return menuRoot ? createPortal(dialog, menuRoot) : dialog;
}
