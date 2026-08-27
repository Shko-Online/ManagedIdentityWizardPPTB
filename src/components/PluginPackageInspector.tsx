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

import React, { useCallback, useContext, useEffect, useState } from "react";
import {
  Badge,
  Button,
  Card,
  CardHeader,
  Input,
  Label,
  Spinner,
  Table,
  TableBody,
  TableCell,
  TableHeader,
  TableHeaderCell,
  TableRow,
  Text,
} from "@fluentui/react-components";
import useStyles from "../styles/PluginPackageInspector";
import { ArrowSync24Regular, Certificate24Regular, Copy24Regular, DocumentSearch24Regular, FolderOpen24Regular, Save24Regular } from "@fluentui/react-icons";
import { Buffer } from "buffer";
import { CertificateDetailsPopup } from "./CertificateDetailsPopup";
import { getCommonName } from "../utils/distinguishedName";
import {
  buildManagedIdentitySubject,
  cloudConfigurations,
  type ManagedIdentitySubjectResult,
  type ManagedIdentityCloud,
} from "../services/managedIdentitySubject";
import {
  getPluginPackageContent,
  listPluginPackages,
  type PluginPackageRecord,
} from "../services/pluginPackageService";
import {
  inspectNugetSignature,
  type NugetSignatureInspection,
} from "../services/nugetSignatureInspector";
import { LogsContext } from "../context/LogsContext";
import { ConnectionContext } from "../context/ConnectionContext";


function getStatus(packageRecord: PluginPackageRecord): string {
  if (packageRecord.stateCode === 0) {
    return "Active";
  }

  if (packageRecord.stateCode === 1) {
    return "Inactive";
  }

  return "Unknown";
}

function getExportFileName(packageRecord: PluginPackageRecord): string {
  const filename = packageRecord.packageName?.split(/[\\/]/).pop();

  if (filename && filename.toLowerCase().endsWith(".nupkg")) {
    return filename;
  }

  return `${packageRecord.uniqueName || packageRecord.id}.nupkg`;
}

function EllipsisText({ value, className }: { value: string; className: string }) {
  return <span className={className} title={value}>{value}</span>;
}

function getCertificateIdentity(distinguishedName: string): string {
  return getCommonName(distinguishedName) ?? distinguishedName;
}

export const PluginPackageInspector: React.FC = () => {
  const styles = useStyles();
  const [packages, setPackages] = useState<PluginPackageRecord[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [cloud, setCloud] = useState<ManagedIdentityCloud>("public");
  const [tenantId, setTenantId] = useState("");
  const [environmentId, setEnvironmentId] = useState("");
  const [identityResult, setIdentityResult] = useState<ManagedIdentitySubjectResult | null>(null);
  const [isInspectingPackageId, setIsInspectingPackageId] = useState<string | null>(null);
  const [isExportingPackageId, setIsExportingPackageId] = useState<string | null>(null);
  const [inspectedPackageName, setInspectedPackageName] = useState<string | null>(null);
  const [inspection, setInspection] = useState<NugetSignatureInspection | null>(null);
  const [isCertificateDetailsOpen, setIsCertificateDetailsOpen] = useState(false);
  const {addLog} = useContext(LogsContext);
  const {connection} = useContext(ConnectionContext);

  useEffect(() => {
    if (!connection) {
      return;
    }

    const loadOrganizationIdentity = async () => {
      try {
        const response = await window.dataverseAPI.execute({
          operationName: "RetrieveCurrentOrganization",
          operationType: "function",
          parameters: {
            AccessType: "Microsoft.Dynamics.CRM.EndpointAccessType'Default'",
          },
        });
        const detail = response.Detail as Record<string, unknown> | undefined;
        const retrievedTenantId = typeof detail?.TenantId === "string" ? detail.TenantId : "";
        const retrievedOrganizationId = typeof detail?.OrganizationId === "string" ? detail.OrganizationId : "";

        setTenantId((currentTenantId) => currentTenantId || retrievedTenantId);
        setEnvironmentId((currentEnvironmentId) => currentEnvironmentId || retrievedOrganizationId);
      } catch (organizationError) {
        addLog(`Unable to retrieve organization identifiers: ${(organizationError as Error).message}`, "warning");
      }
    };

    loadOrganizationIdentity();
  }, [connection, addLog]);

  useEffect(() => {
    let isCurrent = true;

    const calculateIdentity = async () => {
      if (inspection?.signatureStatus !== "signed" || !tenantId.trim() || !environmentId.trim()) {
        setIdentityResult(null);
        return;
      }

      try {
        const certificate = inspection.certificate.isSelfSigned
          ? { certificateType: "self-signed" as const, certificateDer: inspection.certificate.der }
          : {
              certificateType: "trusted" as const,
              issuerDistinguishedName: inspection.certificate.issuerDistinguishedName,
              subjectDistinguishedName: inspection.certificate.subjectDistinguishedName,
            };
        const result = await buildManagedIdentitySubject({
          tenantId: tenantId.trim(),
          environmentId: environmentId.trim(),
          cloud,
          certificate,
        });

        if (isCurrent) {
          setIdentityResult(result);
        }
      } catch {
        if (isCurrent) {
          setIdentityResult(null);
        }
      }
    };

    calculateIdentity();
    return () => {
      isCurrent = false;
    };
  }, [cloud, environmentId, inspection, tenantId]);

  const refreshPackages = useCallback(async () => {
    if (!connection) {
      const message = "Connect to a Dataverse environment before loading plugin packages.";
      setError(message);
      addLog(message, "warning");
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const records = await listPluginPackages(window.dataverseAPI);
      setPackages(records);
      addLog(`Loaded ${records.length} plugin package(s).`, "success");
    } catch (loadError) {
      const message = `Unable to load plugin packages: ${(loadError as Error).message}`;
      setError(message);
      addLog(message, "error");
    } finally {
      setIsLoading(false);
    }
  }, [connection, addLog]);

  const exportPackage = useCallback(async (packageRecord: PluginPackageRecord) => {
    if (!connection) {
      return;
    }

    setIsExportingPackageId(packageRecord.id);
    setError(null);

    try {
      const fileName = getExportFileName(packageRecord);
      const packageBytes = await getPluginPackageContent(window.dataverseAPI, packageRecord.id);
      const savedPath = await window.toolboxAPI.fileSystem.saveFile(
        fileName,
        Buffer.from(packageBytes),
        [{ name: "NuGet package", extensions: ["nupkg"] }],
      );

      if (savedPath) {
        addLog(`Exported ${packageRecord.name} to ${savedPath}.`, "success");
      } else {
        addLog(`Export cancelled for ${packageRecord.name}.`, "info");
      }
    } catch (exportError) {
      const message = `Unable to export ${packageRecord.name}: ${(exportError as Error).message}`;
      setError(message);
      addLog(message, "error");
    } finally {
      setIsExportingPackageId(null);
    }
  }, [connection, addLog]);

  const inspectPackage = useCallback(async (packageRecord: PluginPackageRecord) => {
    if (!connection) {
      return;
    }

    setIsInspectingPackageId(packageRecord.id);
    setError(null);
    setInspection(null);
    setInspectedPackageName(packageRecord.name);
    setIsCertificateDetailsOpen(false);

    try {
      const packageBytes = await getPluginPackageContent(window.dataverseAPI, packageRecord.id);
      const result = await inspectNugetSignature(packageBytes);
      setInspection(result);
      addLog(
        `${packageRecord.name} is ${result.signatureStatus === "signed" ? "signed" : "unsigned"}.`,
        result.signatureStatus === "signed" ? "success" : "warning",
      );
    } catch (inspectionError) {
      const message = `Unable to inspect ${packageRecord.name}: ${(inspectionError as Error).message}`;
      setError(message);
      addLog(message, "error");
    } finally {
      setIsInspectingPackageId(null);
    }
  }, [connection, addLog]);

  const inspectLocalPackage = useCallback(async () => {
    setIsInspectingPackageId("local");
    setError(null);
    setInspection(null);
    setInspectedPackageName(null);
    setIsCertificateDetailsOpen(false);

    try {
      const filePath = await window.toolboxAPI.fileSystem.selectPath({
        type: "file",
        title: "Select a NuGet plugin package",
        buttonLabel: "Inspect package",
        filters: [{ name: "NuGet package", extensions: ["nupkg"] }],
      });

      if (!filePath) {
        addLog("Local package inspection cancelled.", "info");
        return;
      }

      const packageBytes = await window.toolboxAPI.fileSystem.readBinary(filePath);
      const result = await inspectNugetSignature(new Uint8Array(packageBytes));
      const packageName = filePath.split(/[\\/]/).pop() ?? filePath;

      setInspection(result);
      setInspectedPackageName(packageName);
      addLog(
        `${packageName} is ${result.signatureStatus === "signed" ? "signed" : "unsigned"}.`,
        result.signatureStatus === "signed" ? "success" : "warning",
      );
    } catch (inspectionError) {
      const message = `Unable to inspect local package: ${(inspectionError as Error).message}`;
      setError(message);
      addLog(message, "error");
    } finally {
      setIsInspectingPackageId(null);
    }
  }, [addLog]);

  const copyIdentifier = useCallback(async (label: string, value: string) => {
    try {
      await window.toolboxAPI.utils.copyToClipboard(value);
      addLog(`${label} copied to the clipboard.`, "success");
    } catch (copyError) {
      const message = `Unable to copy ${label.toLowerCase()}: ${(copyError as Error).message}`;
      setError(message);
      addLog(message, "error");
    }
  }, [addLog]);

  return (
    <Card className={styles.card}>
      <CardHeader
        header={
          <Text weight="semibold" size={400}>
            Plugin Package Inspector
          </Text>
        }
      />
      <div className={styles.content}>
        <div className={styles.toolbar}>
          <Text className={styles.muted}>
            Read package signing certificates for managed identity configuration.
          </Text>
          <div className={styles.commandGroup}>
            <Button
              icon={<FolderOpen24Regular />}
              onClick={inspectLocalPackage}
              disabled={isInspectingPackageId !== null || isExportingPackageId !== null}
            >
              Inspect local package
            </Button>
            <Button
              appearance="primary"
              icon={<ArrowSync24Regular />}
              onClick={refreshPackages}
              disabled={isLoading || !connection}
            >
              Refresh packages
            </Button>
          </div>
        </div>

        {isLoading && <Spinner label="Loading plugin packages..." />}
        {error && <Text className={styles.error}>{error}</Text>}

        {!isLoading && !error && packages.length === 0 && (
          <Text className={styles.muted}>Refresh to load plugin packages from the connected environment.</Text>
        )}

        {packages.length > 0 && (
          <div className={styles.tableContainer}>
            <Table className={styles.table} size="small" aria-label="Plugin packages">
              <TableHeader>
                <TableRow>
                  <TableHeaderCell className={styles.nameColumn}>Name</TableHeaderCell>
                  <TableHeaderCell className={styles.uniqueNameColumn}>Unique name</TableHeaderCell>
                  <TableHeaderCell className={styles.versionColumn}>Version</TableHeaderCell>
                  <TableHeaderCell className={styles.packageFileColumn}>Package file</TableHeaderCell>
                  <TableHeaderCell className={styles.statusColumn}>Status</TableHeaderCell>
                  <TableHeaderCell className={styles.actionColumn}>Inspect</TableHeaderCell>
                  <TableHeaderCell className={styles.actionColumn}>Export</TableHeaderCell>
                </TableRow>
              </TableHeader>
              <TableBody>
                {packages.map((packageRecord) => (
                  <TableRow key={packageRecord.id}>
                    <TableCell className={styles.nameColumn}><EllipsisText className={styles.ellipsis} value={packageRecord.name} /></TableCell>
                    <TableCell className={styles.uniqueNameColumn}><EllipsisText className={styles.ellipsis} value={packageRecord.uniqueName || "-"} /></TableCell>
                    <TableCell className={styles.versionColumn}><EllipsisText className={styles.ellipsis} value={packageRecord.version || "-"} /></TableCell>
                    <TableCell className={styles.packageFileColumn}><EllipsisText className={styles.ellipsis} value={packageRecord.packageName ?? "No package file"} /></TableCell>
                    <TableCell className={styles.statusColumn}><EllipsisText className={styles.ellipsis} value={getStatus(packageRecord)} /></TableCell>
                    <TableCell className={styles.actionColumn}>
                      <Button
                        appearance="subtle"
                        icon={<DocumentSearch24Regular />}
                        aria-label={`Inspect ${packageRecord.name}`}
                        onClick={() => inspectPackage(packageRecord)}
                        disabled={isInspectingPackageId !== null || isExportingPackageId !== null}
                      />
                    </TableCell>
                    <TableCell className={styles.actionColumn}>
                      <Button
                        appearance="subtle"
                        icon={<Save24Regular />}
                        aria-label={`Export ${packageRecord.name}`}
                        onClick={() => exportPackage(packageRecord)}
                        disabled={isInspectingPackageId !== null || isExportingPackageId !== null}
                      />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}

        {isInspectingPackageId && <Spinner label="Reading and inspecting package content..." />}
        {isExportingPackageId && <Spinner label="Downloading plugin package for export..." />}

        {inspectedPackageName && inspection && (
          <div className={styles.inspectionSummary}>
            <Text weight="semibold">{inspectedPackageName}</Text>
            {inspection.signatureStatus === "unsigned" ? (
              <Text>This package does not contain a NuGet `.signature.p7s` entry.</Text>
            ) : (
              <>
                <div className={styles.inspectionGrid}>
                  <Text className={styles.inspectionLabel}>Signature</Text>
                  <Badge appearance="filled" color="success">Signed NuGet package</Badge>
                  <Text className={styles.inspectionLabel}>Certificate</Text>
                  <Text>{inspection.certificate.isSelfSigned ? "Self-signed" : "Issuer-signed"}</Text>
                  <Text className={styles.inspectionLabel}>Signer</Text>
                  <Text className={styles.inspectionValue} title={inspection.certificate.subjectDistinguishedName}>
                    {getCertificateIdentity(inspection.certificate.subjectDistinguishedName)}
                  </Text>
                  <Text className={styles.inspectionLabel}>Issuer</Text>
                  <Text className={styles.inspectionValue} title={inspection.certificate.issuerDistinguishedName}>
                    {getCertificateIdentity(inspection.certificate.issuerDistinguishedName)}
                  </Text>
                </div>
                <Button icon={<Certificate24Regular />} onClick={() => setIsCertificateDetailsOpen(true)}>
                  View certificate details
                </Button>
              </>
            )}
          </div>
        )}

        <div className={styles.configuration}>
          <Text weight="semibold">Managed identity subject settings</Text>
          <div className={styles.inputGroup}>
            <Label htmlFor="tenant-id">Tenant ID</Label>
            <Input id="tenant-id" value={tenantId} onChange={(_event, data) => setTenantId(data.value)} placeholder="00000000-0000-0000-0000-000000000000" />
          </div>
          <div className={styles.inputGroup}>
            <Label htmlFor="environment-id">Organization ID</Label>
            <Input id="environment-id" value={environmentId} onChange={(_event, data) => setEnvironmentId(data.value)} placeholder="Environment GUID" />
          </div>
          <Label htmlFor="cloud-environment">Cloud</Label>
          <select
            id="cloud-environment"
            className={styles.cloudSelect}
            value={cloud}
            onChange={(event) => setCloud(event.target.value as ManagedIdentityCloud)}
          >
            {Object.entries(cloudConfigurations).map(([value, configuration]) => (
              <option key={value} value={value}>{configuration.label}</option>
            ))}
          </select>
          {inspection?.signatureStatus === "signed" && identityResult && (
            <div className={styles.identifierGrid}>
              <Text className={styles.inspectionLabel}>Issuer</Text>
              <Text className={styles.identifierValue} title={`${cloudConfigurations[cloud].issuerUrl}/${tenantId.trim()}/v2.0`}>
                {cloudConfigurations[cloud].issuerUrl}/{tenantId.trim()}/v2.0
              </Text>
              <Button appearance="subtle" icon={<Copy24Regular />} aria-label="Copy issuer" onClick={() => copyIdentifier("Issuer", `${cloudConfigurations[cloud].issuerUrl}/${tenantId.trim()}/v2.0`)} />
              <Text className={styles.inspectionLabel}>Subject identifier</Text>
              <Text className={styles.identifierValue} title={identityResult.subjectIdentifier}>{identityResult.subjectIdentifier}</Text>
              <Button appearance="subtle" icon={<Copy24Regular />} aria-label="Copy subject identifier" onClick={() => copyIdentifier("Subject identifier", identityResult.subjectIdentifier)} />
            </div>
          )}
        </div>
      </div>
      {isCertificateDetailsOpen && inspection?.signatureStatus === "signed" && (
        <CertificateDetailsPopup
          certificate={inspection.certificate}
          onClose={() => setIsCertificateDetailsOpen(false)}
        />
      )}
    </Card>
  );
};