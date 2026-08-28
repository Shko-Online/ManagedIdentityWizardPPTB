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

interface CmsSignerIdentifier {
  type?: string;
  value?: {
    serialNumber?: { toString(radix?: number): string } | string | number;
  };
}

interface CmsSignerInfo {
  sid?: CmsSignerIdentifier;
}

interface CmsSignedData {
  certificate?: unknown[];
  signerInfos?: CmsSignerInfo[];
}

interface CmsContentInfo {
  contentType?: string;
  content?: CmsSignedData;
}

export interface SigningCertificateDetails {
  issuerDistinguishedName: string;
  subjectDistinguishedName: string;
  serialNumber: string;
  validFrom: string;
  validTo: string;
  fingerprint: string;
  isSelfSigned: boolean;
  der: Uint8Array;
  chain: CertificateChainEntry[];
}

export interface CertificateChainEntry {
  subjectDistinguishedName: string;
  issuerDistinguishedName: string;
  serialNumber: string;
  validFrom: string;
  validTo: string;
  fingerprint: string;
  isSigner: boolean;
}

export type NugetSignatureInspection =
  | { signatureStatus: "unsigned" }
  | { signatureStatus: "signed"; certificate: SigningCertificateDetails };

interface SignerCertificate {
  certificate: Certificate;
  embeddedCertificates: Certificate[];
}