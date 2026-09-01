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

import * as asn1js from "asn1js";
import { Certificate, ContentInfo, SignedData } from "pkijs";
import type { NugetSignatureInspection, SignerCertificate, SigningCertificateDetails } from "../types/services/nugetSignatureInspector";
import { Uint8ArrayReader, Uint8ArrayWriter, ZipReader } from "@zip.js/zip.js";
import type { RelativeDistinguishedNames } from "pkijs";
import { sha256Base64Url } from "./managedIdentitySubject";

const distinguishedNameAttributeTypes: Record<string, string> = {
  "0.9.2342.19200300.100.1.25": "domainComponent",
  "1.2.840.113549.1.9.1": "emailAddress",
  "2.5.4.3": "commonName",
  "2.5.4.4": "surname",
  "2.5.4.5": "serialNumber",
  "2.5.4.6": "countryName",
  "2.5.4.7": "localityName",
  "2.5.4.8": "stateOrProvinceName",
  "2.5.4.9": "streetAddress",
  "2.5.4.10": "organizationName",
  "2.5.4.11": "organizationalUnitName",
  "2.5.4.12": "title",
  "2.5.4.42": "givenName",
  "2.5.4.43": "initials",
  "2.5.4.44": "generationQualifier",
  "2.5.4.46": "dnQualifier",
  "2.5.4.65": "pseudonym",
};

function getHex(value: ArrayBuffer | ArrayBufferView | undefined): string | null {
  if (!value) {
    return null;
  }

  const bytes = ArrayBuffer.isView(value)
    ? new Uint8Array(value.buffer, value.byteOffset, value.byteLength)
    : new Uint8Array(value);

  return Array.from(bytes, (byte) => byte.toString(16).padStart(2, "0")).join("");
}

function getValueHex(value: unknown): ArrayBuffer | undefined {
  if (!value || typeof value !== "object") {
    return undefined;
  }

  const valueBlock = (value as { valueBlock?: { valueHex?: ArrayBuffer } }).valueBlock;
  return valueBlock?.valueHex;
}

function getSubjectKeyIdentifier(certificate: Certificate): string | null {
  const extension = certificate.extensions?.find((item) => item.extnID === "2.5.29.14");
  const encodedKeyIdentifier = getValueHex(extension?.extnValue);

  if (!encodedKeyIdentifier) {
    return null;
  }

  const decodedKeyIdentifier = asn1js.fromBER(encodedKeyIdentifier);
  return decodedKeyIdentifier.offset === -1 ? null : getHex(getValueHex(decodedKeyIdentifier.result));
}

// The distinguished name layout is part of the managed identity subject hash, so it must stay stable.
function formatDistinguishedName(name: RelativeDistinguishedNames): string {
  return name.typesAndValues
    .map((typeAndValue) => {
      const attributeType = distinguishedNameAttributeTypes[typeAndValue.type] ?? typeAndValue.type;
      const attributeValue = (typeAndValue.value as { valueBlock?: { value?: unknown } }).valueBlock?.value;

      return `${attributeType}=${attributeValue === undefined ? "" : String(attributeValue)}`;
    })
    .join("/");
}

function getSerialNumber(certificate: Certificate): string {
  const hex = getHex(certificate.serialNumber.valueBlock.valueHexView) ?? "0";
  return hex.replace(/^0+(?=.)/, "");
}

function getCertificateDer(certificate: Certificate): Uint8Array {
  return new Uint8Array(certificate.toSchema().toBER(false));
}

function getSignerCertificate(signatureBytes: Uint8Array): SignerCertificate {
  const cmsBytes = Uint8Array.from(signatureBytes);
  const asn1 = asn1js.fromBER(cmsBytes.buffer as ArrayBuffer);

  if (asn1.offset === -1) {
    throw new Error(`PKI.js could not decode the CMS envelope: ${asn1.result.error}`);
  }

  const contentInfo = new ContentInfo({ schema: asn1.result });

  if (contentInfo.contentType !== ContentInfo.SIGNED_DATA) {
    throw new Error("The NuGet signature is not a CMS signed-data document.");
  }

  const signedData = new SignedData({ schema: contentInfo.content });
  const certificates = signedData.certificates?.filter(
    (certificate): certificate is Certificate => certificate instanceof Certificate,
  ) ?? [];
  const signerIdentifier = signedData.signerInfos[0]?.sid;

  if (certificates.length === 0 || !signerIdentifier) {
    throw new Error("The NuGet signature does not contain a signing certificate.");
  }

  const signerSerial = getHex(getValueHex(
    (signerIdentifier as { serialNumber?: unknown }).serialNumber,
  ));
  const signerKeyIdentifier = signerSerial ? null : getHex(getValueHex(signerIdentifier));
  const signerCertificate = certificates.find((certificate) => {
    if (signerSerial) {
      return getHex(certificate.serialNumber.valueBlock.valueHexView) === signerSerial;
    }

    return signerKeyIdentifier !== null && getSubjectKeyIdentifier(certificate) === signerKeyIdentifier;
  });

  if (!signerCertificate) {
    throw new Error("The NuGet signer certificate was not found in the CMS certificate set.");
  }

  return { certificate: signerCertificate, embeddedCertificates: certificates };
}

function buildCertificateChain(signerCertificate: SignerCertificate): Certificate[] {
  const remainingCertificates = signerCertificate.embeddedCertificates.filter(
    (certificate) => certificate !== signerCertificate.certificate,
  );
  const chain = [signerCertificate.certificate];
  let currentCertificate = signerCertificate.certificate;

  while (true) {
    const issuerName = formatDistinguishedName(currentCertificate.issuer);
    const parentIndex = remainingCertificates.findIndex(
      (certificate) => formatDistinguishedName(certificate.subject) === issuerName,
    );

    if (parentIndex === -1) {
      break;
    }

    currentCertificate = remainingCertificates.splice(parentIndex, 1)[0];
    chain.push(currentCertificate);
  }

  return chain.reverse();
}

function formatCertificateDate(value: Date): string {
  if (Number.isNaN(value.getTime())) {
    return String(value);
  }

  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "UTC",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(value);
}

async function getCertificateDetails(signerCertificate: SignerCertificate): Promise<SigningCertificateDetails> {
  const { certificate, embeddedCertificates } = signerCertificate;
  const der = getCertificateDer(certificate);
  const issuerDistinguishedName = formatDistinguishedName(certificate.issuer);
  const subjectDistinguishedName = formatDistinguishedName(certificate.subject);
  const chainCertificates = buildCertificateChain(signerCertificate);
  const [fingerprint, chain] = await Promise.all([
    sha256Base64Url(der),
    Promise.all(chainCertificates.map(async (chainCertificate) => ({
      subjectDistinguishedName: formatDistinguishedName(chainCertificate.subject),
      issuerDistinguishedName: formatDistinguishedName(chainCertificate.issuer),
      serialNumber: getSerialNumber(chainCertificate),
      validFrom: formatCertificateDate(chainCertificate.notBefore.value),
      validTo: formatCertificateDate(chainCertificate.notAfter.value),
      fingerprint: await sha256Base64Url(getCertificateDer(chainCertificate)),
      isSigner: chainCertificate === certificate,
    }))),
  ]);

  return {
    issuerDistinguishedName,
    subjectDistinguishedName,
    serialNumber: getSerialNumber(certificate),
    validFrom: formatCertificateDate(certificate.notBefore.value),
    validTo: formatCertificateDate(certificate.notAfter.value),
    fingerprint,
    isSelfSigned: embeddedCertificates.length === 1,
    der,
    chain,
  };
}

export async function inspectCmsSignature(signatureBytes: Uint8Array): Promise<SigningCertificateDetails> {
  return getCertificateDetails(getSignerCertificate(signatureBytes));
}

export async function inspectNugetSignature(
  packageBytes: Uint8Array,
): Promise<NugetSignatureInspection> {
  const zipReader = new ZipReader(new Uint8ArrayReader(packageBytes));

  try {
    const entries = await zipReader.getEntries();
    const signatureEntry = entries.find((entry) => entry.filename === ".signature.p7s");

    if (!signatureEntry) {
      return { signatureStatus: "unsigned" };
    }

    if (!("getData" in signatureEntry)) {
      throw new Error("The NuGet signature entry is not a file.");
    }

    const signatureBytes = await signatureEntry.getData(new Uint8ArrayWriter());

    return {
      signatureStatus: "signed",
      certificate: await inspectCmsSignature(signatureBytes),
    };
  } catch (error) {
    throw new Error(`Unable to inspect the NuGet package signature: ${(error as Error).message}`, { cause: error });
  } finally {
    await zipReader.close();
  }
}