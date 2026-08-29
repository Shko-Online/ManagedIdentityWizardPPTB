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
  ArrowSync24Regular,
  Certificate24Regular,
  CheckmarkCircle24Regular,
  Copy24Regular,
  Dismiss24Regular,
  DocumentSearch24Regular,
  FolderOpen24Regular,
  Info24Regular,
  MoreHorizontal24Regular,
  Save24Regular,
  Settings24Regular,
} from "@fluentui/react-icons";

import {
  Badge,
  Button,
  Card,
  CardHeader,
  Input,
  Label,
  Menu,
  MenuButton,
  MenuItem,
  MenuList,
  MenuPopover,
  MenuTrigger,
  Spinner,
  Table,
  TableBody,
  TableCell,
  TableHeader,
  TableHeaderCell,
  TableRow,
  Text,
} from "@fluentui/react-components";

import {
  type InspectedComponentType,
  createNameMatcher,
  formatSolutionDate,
  formatSolutionDateTime,
  getAssemblyExportFileName,
  getCertificateIdentity,
  getExportFileName,
  getSignedLabel,
} from "../services/pluginPackageInspector";

import {
  type ManagedIdentityCloud,
  type ManagedIdentitySubjectResult,
  buildManagedIdentitySubject,
  cloudConfigurations,
} from "../services/managedIdentitySubject";
import {
  type PluginAssemblyRecord,
  type PluginComponentTypes,
  type PluginPackageRecord,
  type SolutionRecord,
  getPluginAssemblyContent,
  getPluginComponentTypes,
  getPluginPackageContent,
  getSolutionComponentObjectIds,
  listPluginAssemblies,
  listPluginPackages,
  listPluginSolutions,
} from "../services/pluginPackageService";
import { useCallback, useContext, useEffect, useState } from "react";
import { Buffer } from "buffer";
import { CertificateDetailsPopup } from "./CertificateDetailsPopup";
import { ConnectionContext } from "../context/ConnectionContext";
import DataverseAPIContext from "../context/DataverseAPIContext";
import EllipsisText from "./EllispsisText";
import { LogsContext } from "../context/LogsContext";
import MenuRootContext from "../context/MenuRootContext";
import { NugetSignatureInspection } from "../types/services/nugetSignatureInspector";
import { SolutionPickerDialog } from "./SolutionPickerDialog";
import ToolboxAPIContext from "../context/ToolboxAPIContext";
import { inspectNugetSignature } from "../services/nugetSignatureInspector";
import { inspectPluginAssemblySignature } from "../services/pluginAssemblySignatureInspector";
import useStyles from "../styles/PluginPackageInspector";

export const PluginPackageInspector: React.FC = () => {
  const styles = useStyles();
  const { menuRoot: menuMountNode } = useContext(MenuRootContext);
  const [packages, setPackages] = useState<PluginPackageRecord[]>([]);
  const [assemblies, setAssemblies] = useState<PluginAssemblyRecord[]>([]);
  const [activeTab, setActiveTab] = useState<"packages" | "assemblies">(
    "packages",
  );
  const [currentPage, setCurrentPage] = useState(1);
  const [nameFilter, setNameFilter] = useState("");
  const [solutions, setSolutions] = useState<SolutionRecord[]>([]);
  const [isSolutionPickerOpen, setIsSolutionPickerOpen] = useState(false);
  const [componentTypes, setComponentTypes] =
    useState<PluginComponentTypes | null>(null);
  const [selectedSolutionId, setSelectedSolutionId] = useState("");
  const [solutionComponentIds, setSolutionComponentIds] = useState<{
    assemblies: Set<string>;
    packages: Set<string>;
  } | null>(null);
  const [isLoadingSolutions, setIsLoadingSolutions] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [cloud, setCloud] = useState<ManagedIdentityCloud>("public");
  const [tenantId, setTenantId] = useState("");
  const [environmentId, setEnvironmentId] = useState("");
  const [identityResult, setIdentityResult] =
    useState<ManagedIdentitySubjectResult | null>(null);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isInspectingPackageId, setIsInspectingPackageId] = useState<
    string | null
  >(null);
  const [isExportingPackageId, setIsExportingPackageId] = useState<
    string | null
  >(null);
  const [inspectedPackageName, setInspectedPackageName] = useState<
    string | null
  >(null);
  const [inspectedComponentId, setInspectedComponentId] = useState<
    string | null
  >(null);
  const [hoveredInspectId, setHoveredInspectId] = useState<string | null>(null);
  const [inspectedComponentType, setInspectedComponentType] =
    useState<InspectedComponentType>("package");
  const [inspection, setInspection] = useState<NugetSignatureInspection | null>(
    null,
  );
  const [isCertificateDetailsOpen, setIsCertificateDetailsOpen] =
    useState(false);
  const { addLog } = useContext(LogsContext);
  const { connection } = useContext(ConnectionContext);
  const dataverseAPI = useContext(DataverseAPIContext);
  const toolboxAPI = useContext(ToolboxAPIContext);

  console.log(
    "PluginPackageInspector render",
    connection,
    dataverseAPI,
    toolboxAPI,
  );

  const loadSolutions = useCallback(async () => {
    if (!connection || !dataverseAPI) {
      return;
    }
    setIsLoadingSolutions(true);

    try {
      const types = await getPluginComponentTypes(dataverseAPI);
      const solutionRecords = await listPluginSolutions(dataverseAPI, types);
      setComponentTypes(types);
      setSolutions(solutionRecords);
    } catch (solutionError) {
      addLog(
        `Unable to retrieve plugin solutions: ${(solutionError as Error).message}`,
        "warning",
      );
    } finally {
      setIsLoadingSolutions(false);
    }
  }, [connection, dataverseAPI, addLog]);

  useEffect(() => {
    if (!connection) {
      setSolutions([]);
      setComponentTypes(null);
      setSelectedSolutionId("");
      addLog("No connection available. Solutions cannot be loaded.", "warning");
      return;
    }

    loadSolutions();
  }, [connection, loadSolutions, addLog]);

  useEffect(() => {
    if (!selectedSolutionId || !componentTypes) {
      setSolutionComponentIds(null);
      return;
    }

    let isCurrent = true;

    const loadSolutionPackages = async () => {
      if (!connection || !dataverseAPI) {
        isCurrent = false;
        return;
      }

      try {
        const [assemblyIds, packageIds] = await Promise.all([
          getSolutionComponentObjectIds(
            dataverseAPI,
            selectedSolutionId,
            componentTypes.plugin,
          ),
          getSolutionComponentObjectIds(
            dataverseAPI,
            selectedSolutionId,
            componentTypes.pluginpackage,
          ),
        ]);

        if (isCurrent) {
          setSolutionComponentIds({
            assemblies: assemblyIds,
            packages: packageIds,
          });
        }
      } catch (solutionError) {
        if (isCurrent) {
          const message = `Unable to filter packages by solution: ${(solutionError as Error).message}`;
          setError(message);
          addLog(message, "error");
          setSolutionComponentIds(null);
        }
      }
    };

    loadSolutionPackages();
    return () => {
      isCurrent = false;
    };
  }, [connection, dataverseAPI, componentTypes, selectedSolutionId, addLog]);

  const loadOrganizationIdentity = useCallback(async () => {
    if (!connection || !dataverseAPI) {
      return;
    }
    try {
      const response = await dataverseAPI.execute({
        operationName: "RetrieveCurrentOrganization",
        operationType: "function",
        parameters: {
          AccessType: "Microsoft.Dynamics.CRM.EndpointAccessType'Default'",
        },
      });
      const detail = response.Detail as Record<string, unknown> | undefined;
      const retrievedTenantId =
        typeof detail?.TenantId === "string" ? detail.TenantId : "";
      const retrievedOrganizationId =
        typeof detail?.OrganizationId === "string" ? detail.OrganizationId : "";

      setTenantId((currentTenantId) => currentTenantId || retrievedTenantId);
      setEnvironmentId(
        (currentEnvironmentId) =>
          currentEnvironmentId || retrievedOrganizationId,
      );
    } catch (organizationError) {
      addLog(
        `Unable to retrieve organization identifiers: ${(organizationError as Error).message}`,
        "warning",
      );
    }
  }, [connection, dataverseAPI, addLog]);

  useEffect(() => {
    if (!connection) {
      return;
    }

    loadOrganizationIdentity();
  }, [connection, dataverseAPI, addLog, loadOrganizationIdentity]);

  useEffect(() => {
    let isCurrent = true;

    const calculateIdentity = async () => {
      if (
        inspection?.signatureStatus !== "signed" ||
        !tenantId.trim() ||
        !environmentId.trim()
      ) {
        setIdentityResult(null);
        return;
      }

      try {
        const certificate = inspection.certificate.isSelfSigned
          ? {
              certificateType: "self-signed" as const,
              certificateDer: inspection.certificate.der,
            }
          : {
              certificateType: "trusted" as const,
              issuerDistinguishedName:
                inspection.certificate.issuerDistinguishedName,
              subjectDistinguishedName:
                inspection.certificate.subjectDistinguishedName,
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
    if (!connection || !dataverseAPI) {
      const message =
        "Connect to a Dataverse environment before loading plugin packages.";
      setError(message);
      addLog(message, "warning");
      return;
    }

    setIsLoading(true);
    setError(null);
    setInspection(null);
    setInspectedComponentId(null);
    setInspectedPackageName(null);
    setIsCertificateDetailsOpen(false);
    setIdentityResult(null);

    try {
      const [packageRecords, assemblyRecords] = await Promise.all([
        listPluginPackages(dataverseAPI),
        listPluginAssemblies(dataverseAPI),
      ]);
      setPackages(packageRecords);
      setAssemblies(assemblyRecords);
      addLog(
        `Loaded ${packageRecords.length} plugin package(s) and ${assemblyRecords.length} plugin assembly(s).`,
        "success",
      );
    } catch (loadError) {
      const message = `Unable to load plugin packages: ${(loadError as Error).message}`;
      setError(message);
      addLog(message, "error");
    } finally {
      setIsLoading(false);
    }
  }, [connection, dataverseAPI, addLog]);

  const exportPackage = useCallback(
    async (packageRecord: PluginPackageRecord) => {
      if (!connection || !dataverseAPI || !toolboxAPI) {
        return;
      }

      setIsExportingPackageId(packageRecord.id);
      setError(null);

      try {
        const fileName = getExportFileName(packageRecord);
        const packageBytes = await getPluginPackageContent(
          dataverseAPI,
          packageRecord.id,
        );
        const savedPath = await toolboxAPI.fileSystem.saveFile(
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
    },
    [connection, dataverseAPI, toolboxAPI, addLog],
  );

  const exportAssembly = useCallback(
    async (assemblyRecord: PluginAssemblyRecord) => {
      if (!connection || !dataverseAPI || !toolboxAPI) {
        return;
      }

      setIsExportingPackageId(assemblyRecord.id);
      setError(null);

      try {
        const assemblyBytes = await getPluginAssemblyContent(
          dataverseAPI,
          assemblyRecord.id,
        );
        const savedPath = await toolboxAPI.fileSystem.saveFile(
          getAssemblyExportFileName(assemblyRecord),
          Buffer.from(assemblyBytes),
          [{ name: "Plugin assembly", extensions: ["dll"] }],
        );

        addLog(
          savedPath
            ? `Exported ${assemblyRecord.name} to ${savedPath}.`
            : `Export cancelled for ${assemblyRecord.name}.`,
          savedPath ? "success" : "info",
        );
      } catch (exportError) {
        const message = `Unable to export ${assemblyRecord.name}: ${(exportError as Error).message}`;
        setError(message);
        addLog(message, "error");
      } finally {
        setIsExportingPackageId(null);
      }
    },
    [connection, dataverseAPI, toolboxAPI, addLog],
  );

  const inspectPackage = useCallback(
    async (packageRecord: PluginPackageRecord) => {
      if (!connection || !dataverseAPI || !toolboxAPI) {
        return;
      }

      setIsInspectingPackageId(packageRecord.id);
      setError(null);
      setInspection(null);
      setInspectedComponentId(null);
      setInspectedPackageName(packageRecord.name);
      setInspectedComponentType("package");
      setIsCertificateDetailsOpen(false);

      try {
        const packageBytes = await getPluginPackageContent(
          dataverseAPI,
          packageRecord.id,
        );
        const result = await inspectNugetSignature(packageBytes);
        setInspection(result);
        setInspectedComponentId(packageRecord.id);
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
    },
    [connection, dataverseAPI, toolboxAPI, addLog],
  );

  const inspectAssembly = useCallback(
    async (assemblyRecord: PluginAssemblyRecord) => {
      if (!connection || !dataverseAPI || !toolboxAPI) {
        return;
      }

      setIsInspectingPackageId(assemblyRecord.id);
      setError(null);
      setInspection(null);
      setInspectedComponentId(null);
      setInspectedPackageName(assemblyRecord.name);
      setInspectedComponentType("assembly");
      setIsCertificateDetailsOpen(false);

      try {
        const assemblyBytes = await getPluginAssemblyContent(
          dataverseAPI,
          assemblyRecord.id,
        );
        const result = await inspectPluginAssemblySignature(assemblyBytes);
        setInspection(result);
        setInspectedComponentId(assemblyRecord.id);
        addLog(
          `${assemblyRecord.name} is ${result.signatureStatus === "signed" ? "signed" : "unsigned"}.`,
          result.signatureStatus === "signed" ? "success" : "warning",
        );
      } catch (inspectionError) {
        const message = `Unable to inspect ${assemblyRecord.name}: ${(inspectionError as Error).message}`;
        setError(message);
        addLog(message, "error");
      } finally {
        setIsInspectingPackageId(null);
      }
    },
    [connection, dataverseAPI, toolboxAPI, addLog],
  );

  const inspectLocalPackage = useCallback(async () => {
    if (!toolboxAPI) {
      return;
    }

    setIsInspectingPackageId("local");
    setError(null);
    setInspection(null);
    setInspectedComponentId(null);
    setInspectedPackageName(null);
    setInspectedComponentType("package");
    setIsCertificateDetailsOpen(false);

    try {
      const filePath = await toolboxAPI.fileSystem.selectPath({
        type: "file",
        title: "Select a plugin package or assembly",
        buttonLabel: "Inspect file",
        filters: [
          { name: "Plugin package or assembly", extensions: ["nupkg", "dll"] },
        ],
      });

      if (!filePath) {
        addLog("Local package inspection cancelled.", "info");
        return;
      }

      const packageBytes = await toolboxAPI.fileSystem.readBinary(filePath);
      const packageName = filePath.split(/[\\/]/).pop() ?? filePath;
      const isAssembly = packageName.toLowerCase().endsWith(".dll");
      const result = isAssembly
        ? await inspectPluginAssemblySignature(new Uint8Array(packageBytes))
        : await inspectNugetSignature(new Uint8Array(packageBytes));

      setInspection(result);
      setInspectedComponentId("local");
      setInspectedPackageName(packageName);
      setInspectedComponentType(isAssembly ? "assembly" : "package");
      addLog(
        `${packageName} is ${result.signatureStatus === "signed" ? "signed" : "unsigned"}.`,
        result.signatureStatus === "signed" ? "success" : "warning",
      );
    } catch (inspectionError) {
      const message = `Unable to inspect local file: ${(inspectionError as Error).message}`;
      setError(message);
      addLog(message, "error");
    } finally {
      setIsInspectingPackageId(null);
    }
  }, [toolboxAPI, addLog]);

  const copyIdentifier = useCallback(
    async (label: string, value: string) => {
      if (!toolboxAPI) {
        return;
      }

      try {
        await toolboxAPI.utils.copyToClipboard(value);
        addLog(`${label} copied to the clipboard.`, "success");
      } catch (copyError) {
        const message = `Unable to copy ${label.toLowerCase()}: ${(copyError as Error).message}`;
        setError(message);
        addLog(message, "error");
      }
    },
    [toolboxAPI, addLog],
  );

  const solutionPackages =
    selectedSolutionId && solutionComponentIds
      ? packages.filter((packageRecord) =>
          solutionComponentIds.packages.has(packageRecord.id),
        )
      : packages;
  const solutionAssemblies =
    selectedSolutionId && solutionComponentIds
      ? assemblies.filter((assemblyRecord) =>
          solutionComponentIds.assemblies.has(assemblyRecord.id),
        )
      : assemblies;
  const openSolutionPicker = useCallback(() => {
    setIsSolutionPickerOpen(true);
  }, []);
  const nameMatcher = createNameMatcher(nameFilter);
  const visiblePackages = solutionPackages.filter((packageRecord) =>
    nameMatcher(packageRecord.name),
  );
  const visibleAssemblies = solutionAssemblies.filter((assemblyRecord) =>
    nameMatcher(assemblyRecord.name),
  );
  const activeRecordCount =
    activeTab === "packages"
      ? visiblePackages.length
      : visibleAssemblies.length;
  const pageCount = Math.max(1, Math.ceil(activeRecordCount / 10));
  const pageStart = (currentPage - 1) * 10;
  const pagedPackages = visiblePackages.slice(pageStart, pageStart + 10);
  const pagedAssemblies = visibleAssemblies.slice(pageStart, pageStart + 10);

  useEffect(() => {
    setCurrentPage(1);
  }, [activeTab, nameFilter, selectedSolutionId]);

  useEffect(() => {
    if (currentPage > pageCount) {
      setCurrentPage(pageCount);
    }
  }, [currentPage, pageCount]);

  return (
    <Card className={styles.card}>
      <CardHeader
        header={
          <div className={styles.headerTitle}>
            <Text className={styles.title}>
              Plugin Inspector
            </Text>
            <EllipsisText
              className={styles.toolbarDescription}
              value="Read plugin signing certificates for managed identity configuration."
            />
          </div>
        }
      />
      <div className={styles.content}>
        <div className={styles.toolbar}>
          <div className={styles.commandGroup}>
            <Button
              icon={<FolderOpen24Regular />}
              appearance={
                inspectedComponentId === "local" && inspection
                  ? "primary"
                  : "secondary"
              }
              onClick={inspectLocalPackage}
              disabled={
                isInspectingPackageId !== null || isExportingPackageId !== null
              }
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
          <Menu mountNode={menuMountNode}>
            <MenuTrigger disableButtonEnhancement>
              <MenuButton
                appearance="secondary"
                className={styles.overflowMenu}
                icon={<MoreHorizontal24Regular />}
                aria-label="More inspector actions"
              />
            </MenuTrigger>
            <MenuPopover>
              <MenuList>
                {solutions.length > 0 && (
                  <MenuItem onClick={openSolutionPicker}>
                    Solution: <EllipsisText value={selectedSolutionId
                      ? (solutions.find(
                          (solution) => solution.id === selectedSolutionId,
                        )?.uniqueName ?? "Select solution")
                      : "All Solutions"} className={styles.selectedSolution} />
                  </MenuItem>
                )}
                <MenuItem
                  icon={<Settings24Regular />}
                  onClick={() => setIsSettingsOpen(true)}
                >
                  Managed identity settings
                </MenuItem>
              </MenuList>
            </MenuPopover>
          </Menu>
        </div>

        {isLoading && <Spinner label="Loading plugin packages..." />}
        {isLoadingSolutions && (
          <Spinner label="Loading solutions with plug-in components..." />
        )}
        {error && <Text className={styles.error}>{error}</Text>}

        {!isLoading &&
          !error &&
          packages.length === 0 &&
          assemblies.length === 0 && (
            <div className={styles.emptyState}>
              <Info24Regular />
              <Text className={styles.muted}>
                Refresh to load plug-in packages and assemblies from the connected
                environment.
              </Text>
            </div>
          )}

        {(visiblePackages.length > 0 || visibleAssemblies.length > 0) && (
          <>
            <div
              className={styles.tabs}
              role="tablist"
              aria-label="Component type"
            >
              <div className={styles.tabButtons}>
                <Button
                  appearance="subtle"
                  className={
                    activeTab === "packages" ? styles.activeTab : undefined
                  }
                  role="tab"
                  aria-selected={activeTab === "packages"}
                  onClick={() => setActiveTab("packages")}
                >
                  Plugin packages ({visiblePackages.length})
                </Button>
                <Button
                  appearance="subtle"
                  className={
                    activeTab === "assemblies" ? styles.activeTab : undefined
                  }
                  role="tab"
                  aria-selected={activeTab === "assemblies"}
                  onClick={() => setActiveTab("assemblies")}
                >
                  Plugin assemblies ({visibleAssemblies.length})
                </Button>
              </div>
              <Input
                className={styles.nameFilter}
                aria-label="Filter component names"
                value={nameFilter}
                placeholder="Filter by name"
                onChange={(_event, data) =>
                  setNameFilter(data.value.replace(/\//g, ""))
                }
              />
            </div>

            {activeTab === "packages" && (
              <div className={styles.tableContainer}>
                <Table
                  className={styles.table}
                  size="small"
                  aria-label="Plugin packages"
                >
                  <TableHeader className={styles.tableHeader}>
                    <TableRow>
                      <TableHeaderCell className={styles.nameColumn}>
                        Name
                      </TableHeaderCell>
                      <TableHeaderCell className={styles.uniqueNameColumn}>
                        Unique name
                      </TableHeaderCell>
                      <TableHeaderCell className={styles.versionColumn}>
                        Version
                      </TableHeaderCell>
                      <TableHeaderCell className={styles.packageFileColumn}>
                        Package file
                      </TableHeaderCell>
                      <TableHeaderCell className={styles.createdColumn}>
                        Created
                      </TableHeaderCell>
                      <TableHeaderCell className={styles.modifiedColumn}>
                        Modified
                      </TableHeaderCell>
                      <TableHeaderCell className={styles.managedColumn}>
                        Type
                      </TableHeaderCell>
                      <TableHeaderCell className={styles.actionColumn}>
                        Actions
                      </TableHeaderCell>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {pagedPackages.map((packageRecord) => (
                      <TableRow
                        key={packageRecord.id}
                        className={
                          inspectedComponentId === packageRecord.id &&
                          inspection
                            ? styles.inspectedRow
                            : undefined
                        }
                      >
                        <TableCell className={styles.nameColumn}>
                          <EllipsisText
                            className={styles.ellipsis}
                            value={packageRecord.name}
                          />
                        </TableCell>
                        <TableCell className={styles.uniqueNameColumn}>
                          <EllipsisText
                            className={styles.ellipsis}
                            value={packageRecord.uniqueName || "-"}
                          />
                        </TableCell>
                        <TableCell className={styles.versionColumn}>
                          <EllipsisText
                            className={styles.ellipsis}
                            value={packageRecord.version || "-"}
                          />
                        </TableCell>
                        <TableCell className={styles.packageFileColumn}>
                          <EllipsisText
                            className={styles.ellipsis}
                            value={
                              packageRecord.packageName ?? "No package file"
                            }
                          />
                        </TableCell>
                        <TableCell
                          className={styles.createdColumn}
                          title={formatSolutionDateTime(packageRecord.createdOn)}
                        >
                          {formatSolutionDate(packageRecord.createdOn)}
                        </TableCell>
                        <TableCell
                          className={styles.modifiedColumn}
                          title={formatSolutionDateTime(packageRecord.modifiedOn)}
                        >
                          {formatSolutionDate(packageRecord.modifiedOn)}
                        </TableCell>
                        <TableCell className={styles.managedColumn}>
                          <Badge
                            appearance="tint"
                            color={
                              packageRecord.isManaged ? "brand" : "informative"
                            }
                            title={
                              packageRecord.isManaged ? "Managed" : "Unmanaged"
                            }
                          >
                            {packageRecord.isManaged ? "M" : "U"}
                          </Badge>
                        </TableCell>
                        <TableCell className={styles.actionColumn}>
                          <div className={styles.actionButtons}>
                            <Button
                              appearance="subtle"
                              icon={
                                inspectedComponentId === packageRecord.id &&
                                inspection &&
                                hoveredInspectId !== packageRecord.id ? (
                                  <CheckmarkCircle24Regular
                                    className={styles.inspectedIndicator}
                                  />
                                ) : (
                                  <DocumentSearch24Regular />
                                )
                              }
                              aria-label={
                                inspectedComponentId === packageRecord.id &&
                                inspection
                                  ? `Inspect ${packageRecord.name} again`
                                  : `Inspect ${packageRecord.name}`
                              }
                              title={
                                inspectedComponentId === packageRecord.id &&
                                inspection
                                  ? "Inspect again"
                                  : `Inspect ${packageRecord.name}`
                              }
                              onMouseEnter={() =>
                                setHoveredInspectId(packageRecord.id)
                              }
                              onMouseLeave={() => setHoveredInspectId(null)}
                              onClick={() => inspectPackage(packageRecord)}
                              disabled={
                                isInspectingPackageId !== null ||
                                isExportingPackageId !== null
                              }
                            />
                            <Button
                              appearance="subtle"
                              icon={<Save24Regular />}
                              aria-label={`Export ${packageRecord.name}`}
                              title={`Export ${packageRecord.name}`}
                              onClick={() => exportPackage(packageRecord)}
                              disabled={
                                isInspectingPackageId !== null ||
                                isExportingPackageId !== null
                              }
                            />
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}

            {activeTab === "assemblies" && (
              <div className={styles.tableContainer}>
                <Table
                  className={styles.table}
                  size="small"
                  aria-label="Plugin assemblies"
                >
                  <TableHeader className={styles.tableHeader}>
                    <TableRow>
                      <TableHeaderCell className={styles.assemblyNameColumn}>
                        Name
                      </TableHeaderCell>
                      <TableHeaderCell
                        className={styles.assemblyVersionColumn}
                      >
                        Version
                      </TableHeaderCell>
                      <TableHeaderCell
                        className={styles.assemblyManagedColumn}
                      >
                        Type
                      </TableHeaderCell>
                      <TableHeaderCell
                        className={styles.assemblyCreatedColumn}
                      >
                        Created
                      </TableHeaderCell>
                      <TableHeaderCell
                        className={styles.assemblyModifiedColumn}
                      >
                        Modified
                      </TableHeaderCell>
                      <TableHeaderCell
                        className={styles.assemblyActionColumn}
                      >
                        Actions
                      </TableHeaderCell>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {pagedAssemblies.map((assemblyRecord) => (
                      <TableRow
                        key={assemblyRecord.id}
                        className={
                          inspectedComponentId === assemblyRecord.id &&
                          inspection
                            ? styles.inspectedRow
                            : undefined
                        }
                      >
                        <TableCell className={styles.assemblyNameColumn}>
                          <EllipsisText
                            className={styles.ellipsis}
                            value={assemblyRecord.name}
                          />
                        </TableCell>
                        <TableCell className={styles.assemblyVersionColumn}>
                          <EllipsisText
                            className={styles.ellipsis}
                            value={assemblyRecord.version || "-"}
                          />
                        </TableCell>
                        <TableCell className={styles.assemblyManagedColumn}>
                          <Badge
                            appearance="tint"
                            color={
                              assemblyRecord.isManaged ? "brand" : "informative"
                            }
                            title={
                              assemblyRecord.isManaged ? "Managed" : "Unmanaged"
                            }
                          >
                            {assemblyRecord.isManaged ? "M" : "U"}
                          </Badge>
                        </TableCell>
                        <TableCell
                          className={styles.assemblyCreatedColumn}
                          title={formatSolutionDateTime(assemblyRecord.createdOn)}
                        >
                          {formatSolutionDate(assemblyRecord.createdOn)}
                        </TableCell>
                        <TableCell
                          className={styles.assemblyModifiedColumn}
                          title={formatSolutionDateTime(assemblyRecord.modifiedOn)}
                        >
                          {formatSolutionDate(assemblyRecord.modifiedOn)}
                        </TableCell>
                        <TableCell className={styles.assemblyActionColumn}>
                          <div className={styles.actionButtons}>
                            <Button
                              appearance="subtle"
                              icon={
                                inspectedComponentId === assemblyRecord.id &&
                                inspection &&
                                hoveredInspectId !== assemblyRecord.id ? (
                                  <CheckmarkCircle24Regular
                                    className={styles.inspectedIndicator}
                                  />
                                ) : (
                                  <DocumentSearch24Regular />
                                )
                              }
                              aria-label={
                                inspectedComponentId === assemblyRecord.id &&
                                inspection
                                  ? `Inspect ${assemblyRecord.name} again`
                                  : `Inspect ${assemblyRecord.name}`
                              }
                              title={
                                inspectedComponentId === assemblyRecord.id &&
                                inspection
                                  ? "Inspect again"
                                  : `Inspect ${assemblyRecord.name}`
                              }
                              onMouseEnter={() =>
                                setHoveredInspectId(assemblyRecord.id)
                              }
                              onMouseLeave={() => setHoveredInspectId(null)}
                              onClick={() => inspectAssembly(assemblyRecord)}
                              disabled={
                                isInspectingPackageId !== null ||
                                isExportingPackageId !== null
                              }
                            />
                            <Button
                              appearance="subtle"
                              icon={<Save24Regular />}
                              aria-label={`Export ${assemblyRecord.name}`}
                              title={`Export ${assemblyRecord.name}`}
                              onClick={() => exportAssembly(assemblyRecord)}
                              disabled={
                                isInspectingPackageId !== null ||
                                isExportingPackageId !== null
                              }
                            />
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}

            <div className={styles.pagination}>
              <Text className={styles.muted}>
                Page {currentPage} of {pageCount}
              </Text>
              <Button
                appearance="subtle"
                onClick={() => setCurrentPage((page) => Math.max(1, page - 1))}
                disabled={currentPage === 1}
              >
                Previous
              </Button>
              <Button
                appearance="subtle"
                onClick={() =>
                  setCurrentPage((page) => Math.min(pageCount, page + 1))
                }
                disabled={currentPage === pageCount}
              >
                Next
              </Button>
            </div>
          </>
        )}

        {isInspectingPackageId && (
          <Spinner label="Reading and inspecting package content..." />
        )}
        {isExportingPackageId && (
          <Spinner label="Downloading plugin package for export..." />
        )}

        {inspectedPackageName && inspection && (
          <div className={styles.inspectionSummary}>
            <Text weight="semibold">{inspectedPackageName}</Text>
            {inspection.signatureStatus === "unsigned" ? (
              <Text>
                {inspectedComponentType === "assembly"
                  ? "This assembly is not signed."
                  : "This package does not contain a NuGet `.signature.p7s` entry."}
              </Text>
            ) : (
              <>
                <div className={styles.inspectionGrid}>
                  <Text className={styles.inspectionLabel}>Signature</Text>
                  <Badge appearance="filled" color="success">
                    {getSignedLabel(
                      inspectedComponentType,
                      inspection.certificate.isSelfSigned,
                    )}
                  </Badge>
                  <Text className={styles.inspectionLabel}>Signer</Text>
                  <Text
                    className={styles.inspectionValue}
                    title={inspection.certificate.subjectDistinguishedName}
                  >
                    {getCertificateIdentity(
                      inspection.certificate.subjectDistinguishedName,
                    )}
                  </Text>
                </div>
                <Button
                  icon={<Certificate24Regular />}
                  onClick={() => setIsCertificateDetailsOpen(true)}
                >
                  View certificate details
                </Button>
                {identityResult && (
                  <div className={styles.identifierGrid}>
                    <Text className={styles.inspectionLabel}>Issuer</Text>
                    <Text
                      className={styles.identifierValue}
                      title={`${cloudConfigurations[cloud].issuerUrl}/${tenantId.trim()}/v2.0`}
                    >
                      {cloudConfigurations[cloud].issuerUrl}/{tenantId.trim()}
                      /v2.0
                    </Text>
                    <Button
                      appearance="subtle"
                      icon={<Copy24Regular />}
                      aria-label="Copy issuer"
                      onClick={() =>
                        copyIdentifier(
                          "Issuer",
                          `${cloudConfigurations[cloud].issuerUrl}/${tenantId.trim()}/v2.0`,
                        )
                      }
                    />
                    <Text className={styles.inspectionLabel}>
                      Subject identifier
                    </Text>
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
                      onClick={() =>
                        copyIdentifier(
                          "Subject identifier",
                          identityResult.subjectIdentifier,
                        )
                      }
                    />
                  </div>
                )}
              </>
            )}
          </div>
        )}
      </div>
      {isSolutionPickerOpen && (
        <SolutionPickerDialog
          solutions={solutions}
          selectedSolutionId={selectedSolutionId}
          onSelect={setSelectedSolutionId}
          onClose={() => setIsSolutionPickerOpen(false)}
        />
      )}
      {isSettingsOpen && (
        <div
          className={styles.settingsOverlay}
          role="presentation"
          onMouseDown={() => setIsSettingsOpen(false)}
        >
          <section
            className={styles.settingsPopup}
            role="dialog"
            aria-modal="true"
            aria-labelledby="managed-identity-settings-title"
            onMouseDown={(event) => event.stopPropagation()}
          >
            <div className={styles.settingsHeader}>
              <Text
                id="managed-identity-settings-title"
                weight="semibold"
                size={400}
              >
                Managed identity subject settings
              </Text>
              <Button
                appearance="subtle"
                icon={<Dismiss24Regular />}
                aria-label="Close managed identity settings"
                onClick={() => setIsSettingsOpen(false)}
              />
            </div>
            <div className={styles.settingsBody}>
              <div className={styles.inputGroup}>
                <Label htmlFor="tenant-id">Tenant ID</Label>
                <Input
                  id="tenant-id"
                  value={tenantId}
                  onChange={(_event, data) => setTenantId(data.value)}
                  placeholder="00000000-0000-0000-0000-000000000000"
                />
              </div>
              <div className={styles.inputGroup}>
                <Label htmlFor="environment-id">Organization ID</Label>
                <Input
                  id="environment-id"
                  value={environmentId}
                  onChange={(_event, data) => setEnvironmentId(data.value)}
                  placeholder="Environment GUID"
                />
              </div>
              <div className={styles.inputGroup}>
                <Label htmlFor="cloud-environment">Cloud</Label>
                <select
                  id="cloud-environment"
                  className={styles.cloudSelect}
                  value={cloud}
                  onChange={(event) =>
                    setCloud(event.target.value as ManagedIdentityCloud)
                  }
                >
                  {Object.entries(cloudConfigurations).map(
                    ([value, configuration]) => (
                      <option key={value} value={value}>
                        {configuration.label}
                      </option>
                    ),
                  )}
                </select>
              </div>
            </div>
          </section>
        </div>
      )}
      {isCertificateDetailsOpen && inspection?.signatureStatus === "signed" && (
        <CertificateDetailsPopup
          certificate={inspection.certificate}
          onClose={() => setIsCertificateDetailsOpen(false)}
        />
      )}
    </Card>
  );
};
