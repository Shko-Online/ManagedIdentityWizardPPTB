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
  Add24Regular,
  ArrowSync24Regular,
  Dismiss24Regular,
  FolderOpen24Regular,
  Info24Regular,
  MoreHorizontal24Regular,
  Settings24Regular,
} from "@fluentui/react-icons";
import {
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
  Text,
} from "@fluentui/react-components";
import {
  type InspectedComponentType,
  createNameMatcher,
  getAssemblyExportFileName,
  getCredentialSourceLabel,
  getExportFileName,
  getManagedIdentityStateLabel,
  getSubjectScopeLabel,
  hasTenantMismatch,
} from "../services/pluginPackageInspector";
import {
  type ManagedIdentityCloud,
  type ManagedIdentitySubjectResult,
  buildManagedIdentitySubject,
  cloudConfigurations,
} from "../services/managedIdentitySubject";
import {
  type ManagedIdentityInput,
  type ManagedIdentityRecord,
  type PluginAssemblyRecord,
  type PluginComponentEntity,
  type PluginComponentTypes,
  type PluginPackageRecord,
  type SolutionRecord,
  UNNAMED_MANAGED_IDENTITY,
  createManagedIdentity,
  getPluginAssemblyContent,
  getPluginComponentTypes,
  getPluginPackageContent,
  getSolutionComponentObjectIds,
  listManagedIdentities,
  listPluginAssemblies,
  listPluginPackages,
  listPluginSolutions,
  setComponentManagedIdentity,
  updateManagedIdentity,
} from "../services/pluginPackageService";
import { useCallback, useContext, useEffect, useState } from "react";
import { Buffer } from "buffer";
import { CertificateDetailsPopup } from "./CertificateDetailsPopup";
import { ConnectionContext } from "../context/ConnectionContext";
import DataverseAPIContext from "../context/DataverseAPIContext";
import EllipsisText from "./EllipsisText";
import { LogsContext } from "../context/LogsContext";
import { ManagedIdentityDetailsPopup } from "./ManagedIdentityDetailsPopup";
import { ManagedIdentityEditorDialog } from "./ManagedIdentityEditorDialog";
import { ManagedIdentityPickerDialog } from "./ManagedIdentityPickerDialog";
import {
  type ManagedIdentitySortKey,
  ManagedIdentityTable,
} from "./ManagedIdentityTable";
import MenuRootContext from "../context/MenuRootContext";
import { NugetSignatureInspection } from "../types/services/nugetSignatureInspector";
import { PluginAssemblyTable } from "./PluginAssemblyTable";
import { PluginComponentDetailsPopup } from "./PluginComponentDetailsPopup";
import type { PluginComponentDetails } from "../types/components/PluginComponentDetailsPopup";
import { type PluginComponentTab, PluginComponentTabs } from "./PluginComponentTabs";
import { PluginPackageTable } from "./PluginPackageTable";
import { SolutionPickerDialog } from "./SolutionPickerDialog";
import ToolboxAPIContext from "../context/ToolboxAPIContext";
import { formatGuidInput } from "../utils/guid";
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
  | "isCustomizable"
  | "managedIdentity";
type AssemblySortKey =
  | "name"
  | "version"
  | "createdOn"
  | "modifiedOn"
  | "isManaged"
  | "isCustomizable"
  | "managedIdentity";

type PluginPackageInspectorProps = {
  onInspectionRequested?: (componentName: string | null, componentType: "package" | "assembly" | "local") => void;
};

type IdentityAssociationTarget = {
  entityLogicalName: PluginComponentEntity;
  componentType: InspectedComponentType;
  id: string;
  name: string;
  isCustomizable: boolean;
  managedIdentityId: string | null;
};

const managedIdentityFieldLabels: Record<keyof ManagedIdentityInput, string> = {
  name: "name",
  applicationId: "application ID",
  tenantId: "tenant ID",
  credentialSource: "credential source",
  subjectScope: "subject scope",
  version: "FIC subject version",
};

function toPackageDetails(packageRecord: PluginPackageRecord): PluginComponentDetails {
  return {
    componentType: "package",
    entityLogicalName: "pluginpackage",
    id: packageRecord.id,
    name: packageRecord.name,
    version: packageRecord.version,
    uniqueName: packageRecord.uniqueName,
    packageFileName: packageRecord.packageName,
    isManaged: packageRecord.isManaged,
    isCustomizable: packageRecord.isCustomizable,
    managedIdentity: packageRecord.managedIdentity,
    hasManagedIdentity: packageRecord.managedIdentityId !== null,
  };
}

function toAssemblyDetails(assemblyRecord: PluginAssemblyRecord): PluginComponentDetails {
  return {
    componentType: "assembly",
    entityLogicalName: "pluginassembly",
    id: assemblyRecord.id,
    name: assemblyRecord.name,
    version: assemblyRecord.version,
    uniqueName: null,
    packageFileName: null,
    isManaged: assemblyRecord.isManaged,
    isCustomizable: assemblyRecord.isCustomizable,
    managedIdentity: assemblyRecord.managedIdentity,
    hasManagedIdentity: assemblyRecord.managedIdentityId !== null,
  };
}

function getManagedIdentitySortValue(record: {
  managedIdentity: ManagedIdentityRecord | null;
  managedIdentityId: string | null;
}): string {
  return `${record.managedIdentity?.name ?? ""}\u0000${record.managedIdentityId ?? ""}`;
}

export const PluginPackageInspector: React.FC<PluginPackageInspectorProps> = ({
  onInspectionRequested,
}) => {
  const styles = useStyles();
  const { menuRoot: menuMountNode } = useContext(MenuRootContext);
  const [packages, setPackages] = useState<PluginPackageRecord[]>([]);
  const [assemblies, setAssemblies] = useState<PluginAssemblyRecord[]>([]);
  const [identities, setIdentities] = useState<ManagedIdentityRecord[]>([]);
  const [activeTab, setActiveTab] = useState<PluginComponentTab>("packages");
  const [currentPage, setCurrentPage] = useState(1);
  const [nameFilter, setNameFilter] = useState("");
  const [packageSortKey, setPackageSortKey] =
    useState<PackageSortKey>("createdOn");
  const [packageSortDescending, setPackageSortDescending] = useState(true);
  const [assemblySortKey, setAssemblySortKey] =
    useState<AssemblySortKey>("createdOn");
  const [assemblySortDescending, setAssemblySortDescending] = useState(true);
  const [identitySortKey, setIdentitySortKey] =
    useState<ManagedIdentitySortKey>("name");
  const [identitySortDescending, setIdentitySortDescending] = useState(false);
  const [editedIdentity, setEditedIdentity] =
    useState<ManagedIdentityRecord | null>(null);
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [associationTarget, setAssociationTarget] =
    useState<IdentityAssociationTarget | null>(null);
  const [isSavingIdentity, setIsSavingIdentity] = useState(false);
  const [identitySaveError, setIdentitySaveError] = useState<string | null>(null);
  const [associationError, setAssociationError] = useState<string | null>(null);
  const [detailsError, setDetailsError] = useState<string | null>(null);
  const [detailsComponent, setDetailsComponent] =
    useState<PluginComponentDetails | null>(null);
  const [detailsIdentity, setDetailsIdentity] =
    useState<ManagedIdentityRecord | null>(null);
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
  const [inspectedComponentId, setInspectedComponentId] = useState<
    string | null
  >(null);
  const [hoveredInspectId, setHoveredInspectId] = useState<string | null>(null);
  const [inspection, setInspection] = useState<NugetSignatureInspection | null>(
    null,
  );
  const [isCertificateDetailsOpen, setIsCertificateDetailsOpen] =
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

    void loadSolutions();
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

    void loadSolutionPackages();
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
    if (!connection || !dataverseAPI) {
      return;
    }

    void loadOrganizationIdentity();
  }, [connection, dataverseAPI, loadOrganizationIdentity]);

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

    void calculateIdentity();
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
    setIsCertificateDetailsOpen(false);
    setDetailsComponent(null);
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

      try {
        const identityRecords = await listManagedIdentities(dataverseAPI);
        setIdentities(identityRecords);
        addLog(`Loaded ${identityRecords.length} managed identity(s).`, "success");
      } catch (identityError) {
        setIdentities([]);
        addLog(
          `Unable to load managed identities: ${(identityError as Error).message}`,
          "warning",
        );
      }
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
      if (onInspectionRequested) {
        onInspectionRequested(packageRecord.name, "package");
        return;
      }

      if (!connection || !dataverseAPI || !toolboxAPI) {
        return;
      }

      setIsInspectingPackageId(packageRecord.id);
      setError(null);
      setDetailsError(null);
      setInspection(null);
      setInspectedComponentId(null);
      setIsCertificateDetailsOpen(false);
      setDetailsComponent(toPackageDetails(packageRecord));

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
        setDetailsError(message);
        addLog(message, "error");
      } finally {
        setIsInspectingPackageId(null);
      }
    },
    [connection, dataverseAPI, toolboxAPI, addLog, logManagedIdentityWarnings, onInspectionRequested],
  );

  const inspectAssembly = useCallback(
    async (assemblyRecord: PluginAssemblyRecord) => {
      if (onInspectionRequested) {
        onInspectionRequested(assemblyRecord.name, "assembly");
        return;
      }

      if (!connection || !dataverseAPI || !toolboxAPI) {
        return;
      }

      setIsInspectingPackageId(assemblyRecord.id);
      setError(null);
      setDetailsError(null);
      setInspection(null);
      setInspectedComponentId(null);
      setIsCertificateDetailsOpen(false);
      setDetailsComponent(toAssemblyDetails(assemblyRecord));

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
        setDetailsError(message);
        addLog(message, "error");
      } finally {
        setIsInspectingPackageId(null);
      }
    },
    [connection, dataverseAPI, toolboxAPI, addLog, logManagedIdentityWarnings, onInspectionRequested],
  );

  const inspectLocalPackage = useCallback(async () => {
    if (onInspectionRequested) {
      onInspectionRequested(null, "local");
      return;
    }

    if (!toolboxAPI) {
      return;
    }

    setIsInspectingPackageId("local");
    setError(null);
    setInspection(null);
    setInspectedComponentId(null);
    setIsCertificateDetailsOpen(false);
    setDetailsComponent(null);

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
      setDetailsComponent({
        componentType: isAssembly ? "assembly" : "package",
        entityLogicalName: null,
        id: null,
        name: packageName,
        version: "",
        uniqueName: null,
        packageFileName: null,
        isManaged: false,
        isCustomizable: true,
        managedIdentity: null,
        hasManagedIdentity: false,
      });
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
  }, [toolboxAPI, addLog, onInspectionRequested]);

  /** Resolves to a failure message so each caller can surface it where the user can see it. */
  const copyToClipboard = useCallback(
    async (label: string, value: string): Promise<string | null> => {
      if (!toolboxAPI) {
        return null;
      }

      try {
        await toolboxAPI.utils.copyToClipboard(value);
        addLog(`${label} copied to the clipboard.`, "success");
        return null;
      } catch (copyError) {
        const message = `Unable to copy ${label.toLowerCase()}: ${(copyError as Error).message}`;
        addLog(message, "error");
        return message;
      }
    },
    [toolboxAPI, addLog],
  );

  const copyFromDetails = useCallback(
    async (label: string, value: string) => {
      const message = await copyToClipboard(label, value);

      if (message) {
        setDetailsError(message);
      }
    },
    [copyToClipboard],
  );

  const reloadRecords = useCallback(async () => {
    if (!dataverseAPI) {
      return;
    }

    const [packageRecords, assemblyRecords, identityRecords] = await Promise.all([
      listPluginPackages(dataverseAPI),
      listPluginAssemblies(dataverseAPI),
      listManagedIdentities(dataverseAPI),
    ]);
    setPackages(packageRecords);
    setAssemblies(assemblyRecords);
    setIdentities(identityRecords);
  }, [dataverseAPI]);

  const createIdentity = useCallback(
    async (input: ManagedIdentityInput) => {
      if (!dataverseAPI) {
        return;
      }

      setIsSavingIdentity(true);
      setIdentitySaveError(null);
      const identityLabel = input.name.trim() || UNNAMED_MANAGED_IDENTITY;

      try {
        const createdId = await createManagedIdentity(dataverseAPI, input);
        addLog(`Created managed identity ${identityLabel}.`, "success");

        if (associationTarget) {
          await setComponentManagedIdentity(
            dataverseAPI,
            associationTarget.entityLogicalName,
            associationTarget.id,
            createdId,
          );
          addLog(
            `Associated ${identityLabel} with ${associationTarget.name}.`,
            "success",
          );
          setAssociationTarget(null);
        }

        setIsEditorOpen(false);
        setEditedIdentity(null);
        await reloadRecords();
      } catch (saveError) {
        const message = `Unable to create managed identity ${identityLabel}: ${(saveError as Error).message}`;
        setIdentitySaveError(message);
        addLog(message, "error");
      } finally {
        setIsSavingIdentity(false);
      }
    },
    [dataverseAPI, associationTarget, reloadRecords, addLog],
  );

  const updateIdentity = useCallback(
    async (changes: Partial<ManagedIdentityInput>) => {
      if (!dataverseAPI || !editedIdentity) {
        return;
      }

      setIsSavingIdentity(true);
      setIdentitySaveError(null);

      try {
        await updateManagedIdentity(dataverseAPI, editedIdentity.id, changes);
        const changedLabels = Object.keys(changes)
          .map((field) => managedIdentityFieldLabels[field as keyof ManagedIdentityInput])
          .join(", ");
        addLog(
          `Updated ${changedLabels} on managed identity ${editedIdentity.name}.`,
          "success",
        );
        setIsEditorOpen(false);
        setEditedIdentity(null);
        await reloadRecords();
      } catch (saveError) {
        const message = `Unable to save managed identity ${editedIdentity.name}: ${(saveError as Error).message}`;
        setIdentitySaveError(message);
        addLog(message, "error");
      } finally {
        setIsSavingIdentity(false);
      }
    },
    [dataverseAPI, editedIdentity, reloadRecords, addLog],
  );

  const applyAssociation = useCallback(
    async (managedIdentityId: string | null) => {
      if (!dataverseAPI || !associationTarget) {
        return;
      }

      const target = associationTarget;
      setIsSavingIdentity(true);
      setAssociationError(null);

      try {
        await setComponentManagedIdentity(
          dataverseAPI,
          target.entityLogicalName,
          target.id,
          managedIdentityId,
        );
        addLog(
          managedIdentityId
            ? `Associated ${identities.find((identity) => identity.id === managedIdentityId)?.name ?? "managed identity"} with ${target.name}.`
            : `Removed the managed identity association from ${target.name}.`,
          "success",
        );
        setAssociationTarget(null);
        await reloadRecords();
      } catch (associationError) {
        const message = `Unable to update the managed identity of ${target.name}: ${(associationError as Error).message}`;
        setAssociationError(message);
        addLog(message, "error");
      } finally {
        setIsSavingIdentity(false);
      }
    },
    [dataverseAPI, associationTarget, identities, reloadRecords, addLog],
  );

  const manageePackageIdentity = useCallback((packageRecord: PluginPackageRecord) => {
    setAssociationError(null);
    setAssociationTarget({
      entityLogicalName: "pluginpackage",
      componentType: "package",
      id: packageRecord.id,
      name: packageRecord.name,
      isCustomizable: packageRecord.isCustomizable,
      managedIdentityId: packageRecord.managedIdentityId,
    });
  }, []);

  const manageAssemblyIdentity = useCallback((assemblyRecord: PluginAssemblyRecord) => {
    setAssociationError(null);
    setAssociationTarget({
      entityLogicalName: "pluginassembly",
      componentType: "assembly",
      id: assemblyRecord.id,
      name: assemblyRecord.name,
      isCustomizable: assemblyRecord.isCustomizable,
      managedIdentityId: assemblyRecord.managedIdentityId,
    });
  }, []);

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
  const visibleIdentities = identities.filter((identity) =>
    nameMatcher(identity.name),
  );
  const identityUsageCounts = new Map<string, number>();
  for (const componentRecord of [...packages, ...assemblies]) {
    if (componentRecord.managedIdentityId) {
      identityUsageCounts.set(
        componentRecord.managedIdentityId,
        (identityUsageCounts.get(componentRecord.managedIdentityId) ?? 0) + 1,
      );
    }
  }
  const sortedPackages = visiblePackages.slice().sort((left, right) => {
    const toComparable = (packageRecord: PluginPackageRecord) => {
      switch (packageSortKey) {
        case "isManaged":
          return packageRecord.isManaged ? "managed" : "unmanaged";
        case "isCustomizable":
          return packageRecord.isCustomizable ? "yes" : "no";
        case "managedIdentity":
          return getManagedIdentitySortValue(packageRecord);
        default:
          return packageRecord[packageSortKey] ?? "";
      }
    };
    const comparison = toComparable(left).localeCompare(toComparable(right), undefined, {
      numeric: true,
      sensitivity: "base",
    });
    return packageSortDescending ? -comparison : comparison;
  });
  const sortedAssemblies = visibleAssemblies.slice().sort((left, right) => {
    const toComparable = (assemblyRecord: PluginAssemblyRecord) => {
      switch (assemblySortKey) {
        case "isManaged":
          return assemblyRecord.isManaged ? "managed" : "unmanaged";
        case "isCustomizable":
          return assemblyRecord.isCustomizable ? "yes" : "no";
        case "managedIdentity":
          return getManagedIdentitySortValue(assemblyRecord);
        default:
          return assemblyRecord[assemblySortKey];
      }
    };
    const comparison = toComparable(left).localeCompare(toComparable(right), undefined, {
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
  const sortIdentitiesBy = (sortKey: ManagedIdentitySortKey) => {
    if (identitySortKey === sortKey) {
      setIdentitySortDescending((descending) => !descending);
      return;
    }

    setIdentitySortKey(sortKey);
    setIdentitySortDescending(false);
  };
  const sortedIdentities = visibleIdentities.slice().sort((left, right) => {
    const toComparable = (identity: ManagedIdentityRecord) => {
      switch (identitySortKey) {
        case "isManaged":
          return identity.isManaged ? "managed" : "unmanaged";
        case "isCustomizable":
          return identity.isCustomizable ? "yes" : "no";
        case "credentialSource":
          return getCredentialSourceLabel(identity.credentialSource);
        case "subjectScope":
          return getSubjectScopeLabel(identity.subjectScope);
        case "stateCode":
          return getManagedIdentityStateLabel(identity.stateCode);
        case "version":
          return String(identity.version ?? "");
        case "usedBy":
          return String(identityUsageCounts.get(identity.id) ?? 0);
        default:
          return identity[identitySortKey] ?? "";
      }
    };
    const comparison = toComparable(left).localeCompare(toComparable(right), undefined, {
      numeric: true,
      sensitivity: "base",
    });
    return identitySortDescending ? -comparison : comparison;
  });
  const activeRecordCount =
    activeTab === "packages"
      ? sortedPackages.length
      : activeTab === "assemblies"
        ? sortedAssemblies.length
        : sortedIdentities.length;
  const pageCount = Math.max(1, Math.ceil(activeRecordCount / 10));
  const pageStart = (currentPage - 1) * 10;
  const pagedPackages = sortedPackages.slice(pageStart, pageStart + 10);
  const pagedAssemblies = sortedAssemblies.slice(pageStart, pageStart + 10);
  const pagedIdentities = sortedIdentities.slice(pageStart, pageStart + 10);

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
              <>
                <Button
                  appearance="secondary"
                  icon={<Add24Regular />}
                  onClick={() => {
                    setEditedIdentity(null);
                    setIdentitySaveError(null);
                    setIsEditorOpen(true);
                  }}
                  disabled={isLoading || isSavingIdentity}
                >
                  New managed identity
                </Button>
                <Button
                  appearance="primary"
                  icon={<ArrowSync24Regular />}
                  onClick={refreshPackages}
                  disabled={isLoading}
                >
                  Refresh packages
                </Button>
              </>
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

        {(solutionPackages.length > 0 ||
          solutionAssemblies.length > 0 ||
          identities.length > 0) && (
          <>
            <PluginComponentTabs
              activeTab={activeTab}
              packageCount={visiblePackages.length}
              assemblyCount={visibleAssemblies.length}
              identityCount={visibleIdentities.length}
              filter={nameFilter}
              onActiveTabChange={setActiveTab}
              onFilterChange={setNameFilter}
            />

            {visiblePackages.length === 0 &&
            visibleAssemblies.length === 0 &&
            visibleIdentities.length === 0 ? (
              <div className={styles.emptyState}>
                <Info24Regular />
                <Text className={styles.muted}>
                  No plug-in packages, assemblies or managed identities match &quot;{nameFilter}
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
                    onManageIdentity={manageePackageIdentity}
                    onViewDetails={(packageRecord) => {
                      setDetailsError(null);
                      setDetailsComponent(toPackageDetails(packageRecord));
                    }}
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
                    onManageIdentity={manageAssemblyIdentity}
                    onViewDetails={(assemblyRecord) => {
                      setDetailsError(null);
                      setDetailsComponent(toAssemblyDetails(assemblyRecord));
                    }}
                    onSort={sortAssembliesBy}
                  />
                )}

                {activeTab === "identities" && (
                  <ManagedIdentityTable
                    identities={pagedIdentities}
                    tenantId={tenantId}
                    usageCounts={identityUsageCounts}
                    isBusy={isSavingIdentity}
                    sortKey={identitySortKey}
                    sortDescending={identitySortDescending}
                    onEdit={(identity) => {
                      setEditedIdentity(identity);
                      setIdentitySaveError(null);
                      setIsEditorOpen(true);
                    }}
                    onViewDetails={(identity) => {
                      setDetailsError(null);
                      setDetailsIdentity(identity);
                    }}
                    onSort={sortIdentitiesBy}
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
      {detailsComponent && (
        <PluginComponentDetailsPopup
          component={detailsComponent}
          inspection={
            inspectedComponentId === (detailsComponent.id ?? "local") ? inspection : null
          }
          isInspecting={isInspectingPackageId === (detailsComponent.id ?? "local")}
          identityResult={
            inspectedComponentId === (detailsComponent.id ?? "local") ? identityResult : null
          }
          issuer={`${cloudConfigurations[cloud].issuerUrl}/${tenantId.trim()}/v2.0`}
          missingIdentitySettingLabels={
            missingIdentitySettings ? missingIdentitySettingLabels : ""
          }
          environmentId={environmentId}
          copyError={detailsError}
          onInspect={
            detailsComponent.entityLogicalName === "pluginpackage"
              ? () => {
                  const packageRecord = packages.find(
                    (candidate) => candidate.id === detailsComponent.id,
                  );

                  if (packageRecord) {
                    void inspectPackage(packageRecord);
                  }
                }
              : detailsComponent.entityLogicalName === "pluginassembly"
                ? () => {
                    const assemblyRecord = assemblies.find(
                      (candidate) => candidate.id === detailsComponent.id,
                    );

                    if (assemblyRecord) {
                      void inspectAssembly(assemblyRecord);
                    }
                  }
                : null
          }
          onCopy={copyFromDetails}
          onViewCertificate={() => setIsCertificateDetailsOpen(true)}
          onViewManagedIdentity={() => {
            setDetailsError(null);
            setDetailsIdentity(detailsComponent.managedIdentity);
          }}
          onOpenSettings={() => setIsSettingsOpen(true)}
          onClose={() => {
            setDetailsComponent(null);
            setDetailsError(null);
          }}
        />
      )}
      {isCertificateDetailsOpen && inspection?.signatureStatus === "signed" && (
        <CertificateDetailsPopup
          certificate={inspection.certificate}
          onClose={() => setIsCertificateDetailsOpen(false)}
        />
      )}
      {detailsIdentity && (
        <ManagedIdentityDetailsPopup
          managedIdentity={detailsIdentity}
          associatedPackages={packages.filter(
            (packageRecord) => packageRecord.managedIdentityId === detailsIdentity.id,
          )}
          associatedAssemblies={assemblies.filter(
            (assemblyRecord) => assemblyRecord.managedIdentityId === detailsIdentity.id,
          )}
          tenantId={tenantId}
          environmentId={environmentId}
          copyError={detailsError}
          onCopy={copyFromDetails}
          onClose={() => {
            setDetailsIdentity(null);
            setDetailsError(null);
          }}
        />
      )}
      {associationTarget && (
        <ManagedIdentityPickerDialog
          identities={identities}
          componentName={associationTarget.name}
          componentType={associationTarget.componentType}
          componentIsCustomizable={associationTarget.isCustomizable}
          currentManagedIdentityId={associationTarget.managedIdentityId}
          tenantId={tenantId}
          isSaving={isSavingIdentity}
          saveError={associationError}
          onApply={applyAssociation}
          onCreateNew={() => {
            setEditedIdentity(null);
            setIdentitySaveError(null);
            setIsEditorOpen(true);
          }}
          onClose={() => {
            setAssociationTarget(null);
            setAssociationError(null);
          }}
        />
      )}      {isEditorOpen && (
        <ManagedIdentityEditorDialog
          managedIdentity={editedIdentity ?? undefined}
          defaultTenantId={tenantId}
          environmentId={environmentId}
          isSaving={isSavingIdentity}
          saveError={identitySaveError}
          onCreate={createIdentity}
          onUpdate={updateIdentity}
          onClose={() => {
            setIsEditorOpen(false);
            setEditedIdentity(null);
            setIdentitySaveError(null);
          }}
        />
      )}
    </Card>
  );
};
