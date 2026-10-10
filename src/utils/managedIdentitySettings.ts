export function getManualIdentitySettingsWarning({
  connection,
  tenantId,
  environmentId,
}: {
  connection: ToolBoxAPI.Connection | null;
  tenantId: string;
  environmentId: string;
}): string {
  if (connection) {
    return "";
  }

  const missing = [
    !tenantId.trim() && "tenant ID",
    !environmentId.trim() && "environment ID",
  ].filter((value): value is string => Boolean(value));

  if (missing.length === 0) {
    return "";
  }

  return `No active Dataverse connection is available. Enter the ${missing.join(" and ")} manually below to generate the managed identity subject identifier.`;
}
