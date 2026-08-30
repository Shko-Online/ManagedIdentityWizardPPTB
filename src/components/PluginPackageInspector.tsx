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
  Copy24Regular,
  Dismiss24Regular,
  FolderOpen24Regular,
  Info24Regular,
  MoreHorizontal24Regular,
  PersonKey24Regular,
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
  MessageBar,
  MessageBarBody,
  Spinner,
  Text,
} from "@fluentui/react-components";
import {
  type InspectedComponentType,
  createNameMatcher,
  getAssemblyExportFileName,
  getCertificateIdentity,
  getExportFileName,
  getSignedLabel,
  hasTenantMismatch,
} from "../services/pluginPackageInspector";
import {
  type ManagedIdentityCloud,
  type ManagedIdentitySubjectResult,
  buildManagedIdentitySubject,
  cloudConfigurations,
} from "../services/managedIdentitySubject";
import {
  type ManagedIdentityRecord,
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
import EllipsisText from "./EllipsisText";
import { LogsContext } from "../context/LogsContext";
import { ManagedIdentityDetailsPopup } from "./ManagedIdentityDetailsPopup";
import MenuRootContext from "../context/MenuRootContext";
import { NugetSignatureInspection } from "../types/services/nugetSignatureInspector";
import { PluginAssemblyTable } from "./PluginAssemblyTable";
import { PluginComponentTabs } from "./PluginComponentTabs";
import { PluginPackageTable } from "./PluginPackageTable";
import { SolutionPickerDialog } from "./SolutionPickerDialog";
import ToolboxAPIContext from "../context/ToolboxAPIContext";
import { inspectNugetSignature } from "../services/nugetSignatureInspector";
import { inspectPluginAssemblySignature } from "../services/pluginAssemblySignatureInspector";
import useStyles from "../styles/PluginPackageInspector";

type PackageSortKey =
  | "name"
  | "uniqueName"
  | "version"
  | "packageName"
  | "createdOn"
  | "modifiedOn"
  | "isManaged"
  | "managedIdentity";
type AssemblySortKey =
  | "name"
  | "version"
  | "createdOn"
  | "modifiedOn"
  | "isManaged"
  | "managedIdentity";

function formatGuidInput(value: string): string {
  const hex = value.replace(/[^0-9a-f]/gi, "").slice(0, 32);
  const groupLengths = [8, 4, 4, 4, 12];
  let offset = 0;

  return groupLengths
    .map((length) => {
      const group = hex.slice(offset, offset + length);
      offset += length;
      return group;
    })
    .filter(Boolean)
    .join("-");
}

function getManagedIdentitySortValue(record: {
  managedIdentity: ManagedIdentityRecord | null;
  managedIdentityId: string | null;
}): string {
  return `${record.managedIdentity?.name ?? ""}\u0000${record.managedIdentityId ?? ""}`;
}

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
  const [packageSortKey, setPackageSortKey] =
    useState<PackageSortKey>("createdOn");
  const [packageSortDescending, setPackageSortDescending] = useState(true);
  const [assemblySortKey, setAssemblySortKey] =
    useState<AssemblySortKey>("createdOn");
  const [assemblySortDescending, setAssemblySortDescending] = useState(true);
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
  const [inspectedManagedIdentity, setInspectedManagedIdentity] =
    useState<ManagedIdentityRecord | null>(null);
  const [inspectedHasManagedIdentity, setInspectedHasManagedIdentity] =
    useState(false);
  const [inspection, setInspection] = useState<NugetSignatureInspection | null>(
    null,
  );
  const [isCertificateDetailsOpen, setIsCertificateDetailsOpen] =
    useState(false);
  const [isManagedIdentityDetailsOpen, setIsManagedIdentityDetailsOpen] =
    useState(false);
  const { addLog } = useContext(LogsContext);
  const { connection } = useContext(ConnectionContext);
  const dataverseAPI = useContext(DataverseAPIContext);
  const toolboxAPI = useContext(ToolboxAPIContext);
  const missingIdentitySettings = !tenantId.trim() || !environmentId.trim();
  const missingIdentitySettingLabels = [
    !tenantId.trim() && "Tenant ID",
    !environmentId.trim() && "Environment ID",
  ]
    .filter(Boolean)
    .join(" and ");

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
            componentTypes.pluginAssembly,
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
      const retrievedEnvironmentId =
        typeof detail?.EnvironmentId === "string" ? detail.EnvironmentId : "";

      setTenantId((currentTenantId) => currentTenantId || retrievedTenantId);
      setEnvironmentId(
        (currentEnvironmentId) =>
          currentEnvironmentId || retrievedEnvironmentId,
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
    setInspectedManagedIdentity(null);
    setInspectedHasManagedIdentity(false);
    setIsCertificateDetailsOpen(false);
    setIsManagedIdentityDetailsOpen(false);
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

  const logManagedIdentityWarnings = useCallback(
    (managedIdentity: ManagedIdentityRecord | null) => {
      if (!managedIdentity) {
        return;
      }

      if (hasTenantMismatch(managedIdentity, tenantId)) {
        addLog(
          `Managed identity ${managedIdentity.name} belongs to tenant ${managedIdentity.tenantId}, which differs from the tenant used to compute the subject identifier.`,
          "warning",
        );
      }

      if (managedIdentity.version !== null && managedIdentity.version !== 2) {
        addLog(
          `Managed identity ${managedIdentity.name} uses federated credential subject version ${managedIdentity.version}. The generated subject identifier uses version 2.`,
          "warning",
        );
      }
    },
    [tenantId, addLog],
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
      setInspectedManagedIdentity(packageRecord.managedIdentity);
      setInspectedHasManagedIdentity(packageRecord.managedIdentityId !== null);
      setIsCertificateDetailsOpen(false);
      setIsManagedIdentityDetailsOpen(false);

      if (packageRecord.managedIdentity?.tenantId) {
        const identityTenantId = packageRecord.managedIdentity.tenantId;
        setTenantId((currentTenantId) => currentTenantId || identityTenantId);
      }

      logManagedIdentityWarnings(packageRecord.managedIdentity);

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
    [connection, dataverseAPI, toolboxAPI, addLog, logManagedIdentityWarnings],
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
      setInspectedManagedIdentity(assemblyRecord.managedIdentity);
      setInspectedHasManagedIdentity(assemblyRecord.managedIdentityId !== null);
      setIsCertificateDetailsOpen(false);
      setIsManagedIdentityDetailsOpen(false);

      if (assemblyRecord.managedIdentity?.tenantId) {
        const identityTenantId = assemblyRecord.managedIdentity.tenantId;
        setTenantId((currentTenantId) => currentTenantId || identityTenantId);
      }

      logManagedIdentityWarnings(assemblyRecord.managedIdentity);

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
    [connection, dataverseAPI, toolboxAPI, addLog, logManagedIdentityWarnings],
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
    setInspectedManagedIdentity(null);
    setInspectedHasManagedIdentity(false);
    setIsCertificateDetailsOpen(false);
    setIsManagedIdentityDetailsOpen(false);

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
  const sortedPackages = visiblePackages.slice().sort((left, right) => {
    const leftValue =
      packageSortKey === "isManaged"
        ? left.isManaged
          ? "managed"
          : "unmanaged"
        : packageSortKey === "managedIdentity"
          ? getManagedIdentitySortValue(left)
          : left[packageSortKey] ?? "";
    const rightValue =
      packageSortKey === "isManaged"
        ? right.isManaged
          ? "managed"
          : "unmanaged"
        : packageSortKey === "managedIdentity"
          ? getManagedIdentitySortValue(right)
          : right[packageSortKey] ?? "";
    const comparison = leftValue.localeCompare(rightValue, undefined, {
      numeric: true,
      sensitivity: "base",
    });
    return packageSortDescending ? -comparison : comparison;
  });
  const sortedAssemblies = visibleAssemblies.slice().sort((left, right) => {
    const leftValue =
      assemblySortKey === "isManaged"
        ? left.isManaged
          ? "managed"
          : "unmanaged"
        : assemblySortKey === "managedIdentity"
          ? getManagedIdentitySortValue(left)
          : left[assemblySortKey];
    const rightValue =
      assemblySortKey === "isManaged"
        ? right.isManaged
          ? "managed"
          : "unmanaged"
        : assemblySortKey === "managedIdentity"
          ? getManagedIdentitySortValue(right)
          : right[assemblySortKey];
    const comparison = leftValue.localeCompare(rightValue, undefined, {
      numeric: true,
      sensitivity: "base",
    });
    return assemblySortDescending ? -comparison : comparison;
  });
  const sortPackagesBy = (sortKey: PackageSortKey) => {
    if (packageSortKey === sortKey) {
      setPackageSortDescending((descending) => !descending);
      return;
    }

    setPackageSortKey(sortKey);
    setPackageSortDescending(false);
  };
  const sortAssembliesBy = (sortKey: AssemblySortKey) => {
    if (assemblySortKey === sortKey) {
      setAssemblySortDescending((descending) => !descending);
      return;
    }

    setAssemblySortKey(sortKey);
    setAssemblySortDescending(false);
  };
  const activeRecordCount =
    activeTab === "packages"
      ? sortedPackages.length
      : sortedAssemblies.length;
  const pageCount = Math.max(1, Math.ceil(activeRecordCount / 10));
  const pageStart = (currentPage - 1) * 10;
  const pagedPackages = sortedPackages.slice(pageStart, pageStart + 10);
  const pagedAssemblies = sortedAssemblies.slice(pageStart, pageStart + 10);

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
            {connection ? (
              <Button
                appearance="primary"
                icon={<ArrowSync24Regular />}
                onClick={refreshPackages}
                disabled={isLoading}
              >
                Refresh packages
              </Button>
            ) : (
              <Button
                appearance="secondary"
                icon={<Settings24Regular />}
                onClick={() => setIsSettingsOpen(true)}
              >
                Managed identity settings
              </Button>
            )}
          </div>
          {connection && (
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
          )}
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

        {(solutionPackages.length > 0 || solutionAssemblies.length > 0) && (
          <>
            <PluginComponentTabs
              activeTab={activeTab}
              packageCount={visiblePackages.length}
              assemblyCount={visibleAssemblies.length}
              filter={nameFilter}
              onActiveTabChange={setActiveTab}
              onFilterChange={setNameFilter}
            />

            {visiblePackages.length === 0 && visibleAssemblies.length === 0 ? (
              <div className={styles.emptyState}>
                <Info24Regular />
                <Text className={styles.muted}>
                  No plug-in packages or assemblies match &quot;{nameFilter}
                  &quot;.
                </Text>
              </div>
            ) : (
              <>
                {activeTab === "packages" && (
                  <PluginPackageTable
                    packages={pagedPackages}
                    inspectedComponentId={inspectedComponentId}
                    hasInspection={inspection !== null}
                    hoveredInspectId={hoveredInspectId}
                    isInspecting={isInspectingPackageId !== null}
                    isExporting={isExportingPackageId !== null}
                    sortKey={packageSortKey}
                    sortDescending={packageSortDescending}
                    onHoverInspect={setHoveredInspectId}
                    onInspect={inspectPackage}
                    onExport={exportPackage}
                    onSort={sortPackagesBy}
                  />
                )}

                {activeTab === "assemblies" && (
                  <PluginAssemblyTable
                    assemblies={pagedAssemblies}
                    inspectedComponentId={inspectedComponentId}
                    hasInspection={inspection !== null}
                    hoveredInspectId={hoveredInspectId}
                    isInspecting={isInspectingPackageId !== null}
                    isExporting={isExportingPackageId !== null}
                    sortKey={assemblySortKey}
                    sortDescending={assemblySortDescending}
                    onHoverInspect={setHoveredInspectId}
                    onInspect={inspectAssembly}
                    onExport={exportAssembly}
                    onSort={sortAssembliesBy}
                  />
                )}

                <div className={styles.pagination}>
                  <Text className={styles.muted}>
                    Page {currentPage} of {pageCount}
                  </Text>
                  <Button
                    appearance="subtle"
                    onClick={() =>
                      setCurrentPage((page) => Math.max(1, page - 1))
                    }
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
                  {inspectedComponentId && inspectedComponentId !== "local" && (
                    <>
                      <Text className={styles.inspectionLabel}>
                        Managed identity
                      </Text>
                      {inspectedManagedIdentity ? (
                        <Text
                          className={styles.inspectionValue}
                          title={inspectedManagedIdentity.name}
                        >
                          {inspectedManagedIdentity.name}
                        </Text>
                      ) : (
                        <Text className={styles.muted}>
                          {inspectedHasManagedIdentity
                            ? "The related managed identity record could not be read."
                            : `No managed identity is associated with this ${inspectedComponentType}.`}
                        </Text>
                      )}
                    </>
                  )}
                </div>
                {inspectedManagedIdentity && (
                  <Button
                    icon={<PersonKey24Regular />}
                    onClick={() => setIsManagedIdentityDetailsOpen(true)}
                  >
                    View managed identity details
                  </Button>
                )}
                <Button
                  icon={<Certificate24Regular />}
                  onClick={() => setIsCertificateDetailsOpen(true)}
                >
                  View certificate details
                </Button>
                {missingIdentitySettings && (
                  <MessageBar intent="warning">
                    <MessageBarBody>
                      {missingIdentitySettingLabels} {missingIdentitySettingLabels.includes(" and ") ? "are" : "is"} required to generate a managed identity subject identifier.
                      <Button
                        appearance="transparent"
                        icon={<Settings24Regular />}
                        onClick={() => setIsSettingsOpen(true)}
                      >
                        Open managed identity settings
                      </Button>
                    </MessageBarBody>
                  </MessageBar>
                )}
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
                  onChange={(_event, data) => setTenantId(formatGuidInput(data.value))}
                  placeholder="00000000-0000-0000-0000-000000000000"
                  inputMode="text"
                  spellCheck={false}
                />
              </div>
              <div className={styles.inputGroup}>
                <Label htmlFor="environment-id">Environment ID</Label>
                <Input
                  id="environment-id"
                  value={environmentId}
                  onChange={(_event, data) => setEnvironmentId(formatGuidInput(data.value))}
                  placeholder="00000000-0000-0000-0000-000000000000"
                  inputMode="text"
                  spellCheck={false}
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
      {isManagedIdentityDetailsOpen && inspectedManagedIdentity && (
        <ManagedIdentityDetailsPopup
          managedIdentity={inspectedManagedIdentity}
          tenantId={tenantId}
          onCopy={copyIdentifier}
          onClose={() => setIsManagedIdentityDetailsOpen(false)}
        />
      )}
    </Card>
  );
};
