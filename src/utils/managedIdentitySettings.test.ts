import { describe, expect, it } from "vitest";
import { getManualIdentitySettingsWarning } from "./managedIdentitySettings";

describe("getManualIdentitySettingsWarning", () => {
  it("recommends manual tenant entry when no active connection is available", () => {
    expect(
      getManualIdentitySettingsWarning({
        connection: null,
        tenantId: "",
        environmentId: "",
      }),
    ).toContain("tenant ID");

    expect(
      getManualIdentitySettingsWarning({
        connection: null,
        tenantId: "",
        environmentId: "",
      }),
    ).toContain("manually");
  });

  it("returns an empty warning when a connection exists and values are auto-populated", () => {
    expect(
      getManualIdentitySettingsWarning({
        connection: { name: "Demo" } as ToolBoxAPI.Connection,
        tenantId: "11111111-1111-1111-1111-111111111111",
        environmentId: "22222222-2222-2222-2222-222222222222",
      }),
    ).toBe("");
  });
});
