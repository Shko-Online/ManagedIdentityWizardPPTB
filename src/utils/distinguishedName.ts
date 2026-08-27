const attributeLabels: Record<string, string> = {
  countryName: "Country",
  stateOrProvinceName: "State/Province",
  localityName: "Locality",
  organizationName: "Organization",
  organizationalUnitName: "Organizational unit",
  commonName: "Common name",
  emailAddress: "Email",
  serialNumber: "Serial number",
};

export interface DistinguishedNameAttribute {
  name: string;
  value: string;
}

export function parseDistinguishedName(distinguishedName: string): DistinguishedNameAttribute[] {
  return distinguishedName
    .split("/")
    .filter(Boolean)
    .map((part) => {
      const separatorIndex = part.indexOf("=");

      if (separatorIndex === -1) {
        return { name: part, value: "" };
      }

      return {
        name: part.slice(0, separatorIndex),
        value: part.slice(separatorIndex + 1),
      };
    });
}

export function formatDistinguishedName(distinguishedName: string): string {
  const attributes = parseDistinguishedName(distinguishedName);

  if (attributes.length === 0) {
    return distinguishedName;
  }

  return attributes
    .map(({ name, value }) => `${attributeLabels[name] ?? name}: ${value}`)
    .join(", ");
}

export function getCommonName(distinguishedName: string): string | null {
  return parseDistinguishedName(distinguishedName)
    .find((attribute) => attribute.name === "commonName")?.value ?? null;
}
