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

export type ManagedIdentityCloud =
  | "public"
  | "gcc-high-dod"
  | "mooncake"
  | "us-national"
  | "us-secure";

export interface CloudConfiguration {
  label: string;
  subjectPrefix: string;
  issuerUrl: string;
  audience: string;
}

export const cloudConfigurations: Record<ManagedIdentityCloud, CloudConfiguration> = {
  public: {
    label: "Public cloud / GCC",
    subjectPrefix: "/eid1/c/pub",
    issuerUrl: "https://login.microsoftonline.com",
    audience: "api://AzureADTokenExchange",
  },
  "gcc-high-dod": {
    label: "GCC High / DoD",
    subjectPrefix: "/eid1/c/usg",
    issuerUrl: "https://login.microsoftonline.us",
    audience: "api://AzureADTokenExchangeUSGov",
  },
  mooncake: {
    label: "Mooncake",
    subjectPrefix: "/eid1/c/chn",
    issuerUrl: "https://login.partner.microsoftonline.cn",
    audience: "api://AzureADTokenExchangeChina",
  },
  "us-national": {
    label: "US National",
    subjectPrefix: "/eid1/c/uss",
    issuerUrl: "https://login.microsoftonline.eaglex.ic.gov",
    audience: "api://AzureADTokenExchangeUSNat",
  },
  "us-secure": {
    label: "US Secure",
    subjectPrefix: "/eid1/c/usn",
    issuerUrl: "https://login.microsoftonline.scloud",
    audience: "api://AzureADTokenExchangeUSSec",
  },
};

export interface TrustedCertificateIdentityInput {
  certificateType: "trusted";
  issuerDistinguishedName: string;
  subjectDistinguishedName: string;
}

export interface SelfSignedCertificateIdentityInput {
  certificateType: "self-signed";
  certificateDer: Uint8Array;
}

export type CertificateIdentityInput =
  | TrustedCertificateIdentityInput
  | SelfSignedCertificateIdentityInput;

export interface ManagedIdentitySubjectInput {
  tenantId: string;
  environmentId: string;
  cloud: ManagedIdentityCloud;
  certificate: CertificateIdentityInput;
}

export interface ManagedIdentitySubjectResult {
  encodedTenantId: string;
  issuerHash?: string;
  subjectHash?: string;
  certificateHash?: string;
  subjectIdentifier: string;
}

const guidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function bytesToBase64Url(bytes: Uint8Array): string {
  let binary = "";
  const chunkSize = 0x8000;

  for (let index = 0; index < bytes.length; index += chunkSize) {
    binary += String.fromCharCode(...bytes.subarray(index, index + chunkSize));
  }

  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

export function encodeTenantId(tenantId: string): string {
  if (!guidPattern.test(tenantId)) {
    throw new Error("Tenant ID must be a GUID.");
  }

  const hex = tenantId.replace(/-/g, "");
  const bytes = new Uint8Array(16);

  for (let index = 0; index < bytes.length; index += 1) {
    bytes[index] = Number.parseInt(hex.slice(index * 2, index * 2 + 2), 16);
  }

  const dotNetGuidBytes = new Uint8Array([
    bytes[3], bytes[2], bytes[1], bytes[0], bytes[5], bytes[4], bytes[7], bytes[6],
    ...bytes.slice(8),
  ]);

  return bytesToBase64Url(dotNetGuidBytes);
}

export async function sha256Base64Url(input: string | Uint8Array): Promise<string> {
  const bytes = typeof input === "string" ? new TextEncoder().encode(input) : input;
  const digestInput = new Uint8Array(bytes);
  const digest = await crypto.subtle.digest("SHA-256", digestInput);
  return bytesToBase64Url(new Uint8Array(digest));
}

export async function buildManagedIdentitySubject(
  input: ManagedIdentitySubjectInput,
): Promise<ManagedIdentitySubjectResult> {
  if (!input.environmentId.trim()) {
    throw new Error("Environment ID is required.");
  }

  const encodedTenantId = encodeTenantId(input.tenantId);
  const configuration = cloudConfigurations[input.cloud];
  const prefix = `${configuration.subjectPrefix}/t/${encodedTenantId}/a/qzXoWDkuqUa3l6zM5mM0Rw/n/plugin/e/${input.environmentId.trim()}`;

  if (input.certificate.certificateType === "self-signed") {
    const certificateHash = await sha256Base64Url(input.certificate.certificateDer);
    return {
      encodedTenantId,
      certificateHash,
      subjectIdentifier: `${prefix}/h/${certificateHash}`,
    };
  }

  if (!input.certificate.issuerDistinguishedName || !input.certificate.subjectDistinguishedName) {
    throw new Error("Issuer and subject distinguished names are required.");
  }

  const [issuerHash, subjectHash] = await Promise.all([
    sha256Base64Url(input.certificate.issuerDistinguishedName),
    sha256Base64Url(input.certificate.subjectDistinguishedName),
  ]);

  return {
    encodedTenantId,
    issuerHash,
    subjectHash,
    subjectIdentifier: `${prefix}/i/${issuerHash}/s/${subjectHash}`,
  };
}