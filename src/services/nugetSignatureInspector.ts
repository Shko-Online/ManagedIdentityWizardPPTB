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
import { Certificate, dstszi2010 } from "jkurwa";
import type { CmsContentInfo, CmsSignedData, CmsSignerIdentifier, NugetSignatureInspection, SignerCertificate, SigningCertificateDetails } from "../types/services/nugetSignatureInspector";
import { ContentInfo, SignedData } from "pkijs";
import { Uint8ArrayReader, Uint8ArrayWriter, ZipReader } from "@zip.js/zip.js";
import { Buffer } from "buffer";
import { sha256Base64Url } from "./managedIdentitySubject";

function normalizeSerialNumber(value: CmsSignerIdentifier["value"] extends infer SignerValue
  ? SignerValue extends { serialNumber?: infer SerialNumber }
    ? SerialNumber | undefined
    : never
  : never): string | null {
  if (typeof value === "string") {
    return value.toLowerCase();
  }

  if (typeof value === "number") {
    return value.toString(16).toLowerCase();
  }

  if (value && typeof value === "object" && "toString" in value) {
    return value.toString(16).toLowerCase();
  }

  return null;
}

function findSignerCertificate(content: CmsSignedData): Certificate {
  const certificates = content.certificate ?? [];

  if (certificates.length === 0) {
    throw new Error("The NuGet signature does not contain a signing certificate.");
  }

  const signerSerial = normalizeSerialNumber(content.signerInfos?.[0]?.sid?.value?.serialNumber);
  const parsedCertificates = certificates.map((certificate) => new Certificate(certificate));

  if (!signerSerial) {
    return parsedCertificates[0];
  }

  const signerCertificate = parsedCertificates.find(
    (certificate) => certificate.serial.toString(16).toLowerCase() === signerSerial,
  );

  if (!signerCertificate) {
    throw new Error("The NuGet signer certificate was not found in the signature.");
  }

  return signerCertificate;
}

function getJkurwaSignerCertificate(signatureBytes: Uint8Array): SignerCertificate {
  const contentInfo = dstszi2010.ContentInfo.decode(
    Buffer.from(signatureBytes),
    "der",
  ) as CmsContentInfo;

  if (contentInfo.contentType !== "signedData" || !contentInfo.content) {
    throw new Error("The NuGet signature is not a CMS signed-data document.");
  }

  const embeddedCertificates = (contentInfo.content.certificate ?? []).map(
    (certificate) => new Certificate(certificate),
  );

  return {
    certificate: findSignerCertificate(contentInfo.content),
    embeddedCertificates,
  };
}

function getHex(value: ArrayBuffer | undefined): string | null {
  if (!value) {
    return null;
  }

  return Array.from(new Uint8Array(value), (byte) => byte.toString(16).padStart(2, "0")).join("");
}

function getValueHex(value: unknown): ArrayBuffer | undefined {
  if (!value || typeof value !== "object") {
    return undefined;
  }

  const valueBlock = (value as { valueBlock?: { valueHex?: ArrayBuffer } }).valueBlock;
  return valueBlock?.valueHex;
}

function getSubjectKeyIdentifier(certificate: unknown): string | null {
  const extensions = (certificate as {
    extensions?: Array<{ extnID?: string; extnValue?: unknown }>;
  }).extensions;
  const extension = extensions?.find((item) => item.extnID === "2.5.29.14");
  const encodedKeyIdentifier = getValueHex(extension?.extnValue);

  if (!encodedKeyIdentifier) {
    return null;
  }

  const decodedKeyIdentifier = asn1js.fromBER(encodedKeyIdentifier);
  return decodedKeyIdentifier.offset === -1 ? null : getHex(getValueHex(decodedKeyIdentifier.result));
}

function getPkiJsSignerCertificate(signatureBytes: Uint8Array): SignerCertificate {
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
    (certificate) => "serialNumber" in certificate && "toSchema" in certificate,
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
      return getHex(getValueHex((certificate as { serialNumber?: unknown }).serialNumber)) === signerSerial;
    }

    return signerKeyIdentifier !== null && getSubjectKeyIdentifier(certificate) === signerKeyIdentifier;
  });

  if (!signerCertificate) {
    throw new Error("The NuGet signer certificate was not found in the CMS certificate set.");
  }

  return {
    certificate: Certificate.from_asn1(Buffer.from(signerCertificate.toSchema().toBER(false))),
    embeddedCertificates: certificates.map((certificate) =>
      Certificate.from_asn1(Buffer.from(certificate.toSchema().toBER(false))),
    ),
  };
}

function getSignerCertificate(signatureBytes: Uint8Array): SignerCertificate {
  try {
    return getJkurwaSignerCertificate(signatureBytes);
  } catch (jkurwaError) {
    try {
      return getPkiJsSignerCertificate(signatureBytes);
    } catch (pkiJsError) {
      throw new Error(
        `CMS parsing failed with jkurwa (${(jkurwaError as Error).message}) ` +
          `and PKI.js (${(pkiJsError as Error).message}).`, { cause: pkiJsError },
      );
    }
  }
}

function buildCertificateChain(signerCertificate: SignerCertificate): Certificate[] {
  const remainingCertificates = signerCertificate.embeddedCertificates.filter(
    (certificate) => certificate.serial.toString(16) !== signerCertificate.certificate.serial.toString(16),
  );
  const chain = [signerCertificate.certificate];
  let currentCertificate = signerCertificate.certificate;

  while (true) {
    const parentIndex = remainingCertificates.findIndex(
      (certificate) => certificate.subjectDN() === currentCertificate.issuerDN(),
    );

    if (parentIndex === -1) {
      break;
    }

    currentCertificate = remainingCertificates.splice(parentIndex, 1)[0];
    chain.push(currentCertificate);
  }

  return chain.reverse();
}

function formatCertificateDate(value: unknown): string {
  const timestamp = typeof value === "number" ? value : Number(value);

  if (!Number.isFinite(timestamp)) {
    return String(value);
  }

  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "UTC",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date(timestamp));
}

async function getCertificateDetails(signerCertificate: SignerCertificate): Promise<SigningCertificateDetails> {
  const { certificate, embeddedCertificates } = signerCertificate;
  const der = new Uint8Array(certificate.as_asn1());
  const issuerDistinguishedName = certificate.issuerDN();
  const subjectDistinguishedName = certificate.subjectDN();
  const chainCertificates = buildCertificateChain(signerCertificate);
  const [fingerprint, chain] = await Promise.all([
    sha256Base64Url(der),
    Promise.all(chainCertificates.map(async (chainCertificate) => {
      const chainDer = new Uint8Array(chainCertificate.as_asn1());

      return {
        subjectDistinguishedName: chainCertificate.subjectDN(),
        issuerDistinguishedName: chainCertificate.issuerDN(),
        serialNumber: chainCertificate.serial.toString(16),
        validFrom: formatCertificateDate(chainCertificate.valid.from),
        validTo: formatCertificateDate(chainCertificate.valid.to),
        fingerprint: await sha256Base64Url(chainDer),
        isSigner: chainCertificate.serial.toString(16) === certificate.serial.toString(16),
      };
    })),
  ]);

  return {
    issuerDistinguishedName,
    subjectDistinguishedName,
    serialNumber: certificate.serial.toString(16),
    validFrom: formatCertificateDate(certificate.valid.from),
    validTo: formatCertificateDate(certificate.valid.to),
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