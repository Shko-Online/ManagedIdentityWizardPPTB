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
  MessageBar,
  MessageBarBody,
  Spinner,
  Tab,
  TabList,
  Text,
} from "@fluentui/react-components";
import {
  Certificate24Regular,
  Copy24Regular,
  Dismiss24Regular,
  DocumentSearch24Regular,
  PersonKey24Regular,
  Settings24Regular,
} from "@fluentui/react-icons";
import {
  getCertificateIdentity,
  getSignedLabel,
} from "../services/pluginPackageInspector";
import EllipsisText from "./EllipsisText";
import MenuRootContext from "../context/MenuRootContext";
import type { PluginComponentDetailsPopupProps } from "../types/components/PluginComponentDetailsPopup";
import { SolutionLayers } from "./SolutionLayers";
import { createPortal } from "react-dom";
import { useContext, useEffect, useState } from "react";
import useStyles from "../styles/PluginComponentDetailsPopup";

type DetailsTab = "inspection" | "layers";

export function PluginComponentDetailsPopup({
  component,
  inspection,
  isInspecting,
  identityResult,
  issuer,
  missingIdentitySettingLabels,
  environmentId,
  copyError,
  onInspect,
  onCopy,
  onViewCertificate,
  onViewManagedIdentity,
  onOpenSettings,
  onClose,
}: PluginComponentDetailsPopupProps) {
  const styles = useStyles();
  const { menuRoot } = useContext(MenuRootContext);
  const [activeTab, setActiveTab] = useState<DetailsTab>("inspection");
  const isLocal = component.entityLogicalName === null || component.id === null;
  const componentTypeLabel = component.componentType === "assembly" ? "assembly" : "package";

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onClose();
      }
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [onClose]);

  const dialog = (
    <div className={styles.overlay} role="presentation" onMouseDown={onClose}>
      <section
        className={styles.popup}
        role="dialog"
        aria-modal="true"
        aria-labelledby="plugin-component-details-title"
        onMouseDown={(event) => event.stopPropagation()}
      >
        <div className={styles.header}>
          <Text id="plugin-component-details-title" weight="semibold" size={400}>
            Plugin {componentTypeLabel} details
          </Text>
          <Button
            appearance="subtle"
            icon={<Dismiss24Regular />}
            aria-label="Close plugin component details"
            onClick={onClose}
          />
        </div>
        <div className={styles.body}>
          {copyError && (
            <MessageBar intent="error">
              <MessageBarBody>{copyError}</MessageBarBody>
            </MessageBar>
          )}
          <div className={styles.fields}>
            <Text className={styles.label}>Name</Text>
            <EllipsisText className={styles.value} value={component.name} />

            {component.uniqueName !== null && (
              <>
                <Text className={styles.label}>Unique name</Text>
                <EllipsisText className={styles.value} value={component.uniqueName || "-"} />
              </>
            )}

            <Text className={styles.label}>Version</Text>
            <Text className={styles.value}>{component.version || "-"}</Text>

            {component.packageFileName !== null && (
              <>
                <Text className={styles.label}>Package file</Text>
                <EllipsisText className={styles.value} value={component.packageFileName || "-"} />
              </>
            )}

            {!isLocal && (
              <>
                <Text className={styles.label}>Type</Text>
                <Text className={styles.value}>
                  {component.isManaged ? "Managed" : "Unmanaged"}
                  {component.isCustomizable ? "" : " (customizations are not allowed)"}
                </Text>

                <Text className={styles.label}>Managed identity</Text>
                {component.managedIdentity ? (
                  <EllipsisText className={styles.value} value={component.managedIdentity.name} />
                ) : (
                  <Text className={styles.muted}>
                    {component.hasManagedIdentity
                      ? "The related managed identity record could not be read."
                      : `No managed identity is associated with this ${componentTypeLabel}.`}
                  </Text>
                )}
              </>
            )}
          </div>

          {!isLocal && (
            <TabList
              className={styles.tabs}
              selectedValue={activeTab}
              onTabSelect={(_event, data) => setActiveTab(data.value as DetailsTab)}
            >
              <Tab value="inspection">Signature</Tab>
              <Tab value="layers">Solution layers</Tab>
            </TabList>
          )}

          {(isLocal || activeTab === "inspection") && (
            <div className={styles.inspection}>
              {isInspecting && <Spinner size="tiny" label="Reading and inspecting content..." />}

              {!isInspecting && !inspection && (
                <Text className={styles.muted}>
                  This {componentTypeLabel} has not been inspected yet.
                </Text>
              )}

              {!isInspecting && inspection?.signatureStatus === "unsigned" && (
                <Text>
                  {component.componentType === "assembly"
                    ? "This assembly is not signed."
                    : "This package does not contain a NuGet `.signature.p7s` entry."}
                </Text>
              )}

              {!isInspecting && inspection?.signatureStatus === "signed" && (
                <>
                  <div className={styles.fields}>
                    <Text className={styles.label}>Signature</Text>
                    <Badge appearance="filled" color="success">
                      {getSignedLabel(component.componentType, inspection.certificate.isSelfSigned)}
                    </Badge>
                    <Text className={styles.label}>Signer</Text>
                    <Text
                      className={styles.value}
                      title={inspection.certificate.subjectDistinguishedName}
                    >
                      {getCertificateIdentity(inspection.certificate.subjectDistinguishedName)}
                    </Text>
                  </div>
                  {missingIdentitySettingLabels && (
                    <MessageBar intent="warning">
                      <MessageBarBody>
                        {missingIdentitySettingLabels} {missingIdentitySettingLabels.includes(" and ") ? "are" : "is"} required to generate a managed identity subject identifier.
                        <Button
                          appearance="transparent"
                          icon={<Settings24Regular />}
                          onClick={onOpenSettings}
                        >
                          Open managed identity settings
                        </Button>
                      </MessageBarBody>
                    </MessageBar>
                  )}
                  {identityResult && (
                    <div className={styles.identifierGrid}>
                      <Text className={styles.label}>Issuer</Text>
                      <Text className={styles.identifierValue} title={issuer}>{issuer}</Text>
                      <Button
                        appearance="subtle"
                        icon={<Copy24Regular />}
                        aria-label="Copy issuer"
                        onClick={() => onCopy("Issuer", issuer)}
                      />
                      <Text className={styles.label}>Subject identifier</Text>
                      <Text
                        className={styles.identifierValue}
                        title={identityResult.subjectIdentifier}
                      >
                        {identityResult.subjectIdentifier}
                      </Text>
                      <Button
                        appearance="subtle"
                        icon={<Copy24Regular />}
                        aria-label="Copy subject identifier"
                        onClick={() => onCopy("Subject identifier", identityResult.subjectIdentifier)}
                      />
                    </div>
                  )}
                </>
              )}

              <div className={styles.actions}>
                {onInspect && (
                  <Button
                    icon={<DocumentSearch24Regular />}
                    onClick={onInspect}
                    disabled={isInspecting}
                  >
                    {inspection ? "Inspect again" : `Inspect ${componentTypeLabel}`}
                  </Button>
                )}
                {inspection?.signatureStatus === "signed" && (
                  <Button icon={<Certificate24Regular />} onClick={onViewCertificate}>
                    View certificate details
                  </Button>
                )}
                {component.managedIdentity && (
                  <Button icon={<PersonKey24Regular />} onClick={onViewManagedIdentity}>
                    View managed identity details
                  </Button>
                )}
              </div>
            </div>
          )}

          {!isLocal && activeTab === "layers" && component.entityLogicalName && component.id && (
            <SolutionLayers
              entityLogicalName={component.entityLogicalName}
              componentId={component.id}
              isManaged={component.isManaged}
              isCustomizable={component.isCustomizable}
              componentLabel={`plugin ${componentTypeLabel}`}
              environmentId={environmentId}
            />
          )}
        </div>
      </section>
    </div>
  );

  return menuRoot ? createPortal(dialog, menuRoot) : dialog;
}
