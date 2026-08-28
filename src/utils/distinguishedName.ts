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
