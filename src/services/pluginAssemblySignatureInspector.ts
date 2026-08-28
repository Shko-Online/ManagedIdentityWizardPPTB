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

import type { NugetSignatureInspection } from "../types/services/nugetSignatureInspector";
import { inspectCmsSignature } from "./nugetSignatureInspector";

function requireRange(bytes: Uint8Array, offset: number, length: number, label: string): void {
  if (offset < 0 || length < 0 || offset + length > bytes.byteLength) {
    throw new Error(`The plugin assembly has an invalid ${label}.`);
  }
}

function getAuthenticodeSignature(bytes: Uint8Array): Uint8Array | null {
  requireRange(bytes, 0, 64, "DOS header");
  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);

  if (view.getUint16(0, true) !== 0x5a4d) {
    throw new Error("The plugin assembly is not a Portable Executable file.");
  }

  const peOffset = view.getUint32(0x3c, true);
  requireRange(bytes, peOffset, 24, "PE header");

  if (view.getUint32(peOffset, true) !== 0x00004550) {
    throw new Error("The plugin assembly has an invalid PE signature.");
  }

  const optionalHeaderOffset = peOffset + 24;
  const optionalHeaderMagic = view.getUint16(optionalHeaderOffset, true);
  const dataDirectoryOffset = optionalHeaderOffset + (optionalHeaderMagic === 0x20b ? 112 : 96);
  const securityDirectoryOffset = dataDirectoryOffset + 8 * 4;
  requireRange(bytes, securityDirectoryOffset, 8, "security directory");

  const certificateOffset = view.getUint32(securityDirectoryOffset, true);
  const certificateLength = view.getUint32(securityDirectoryOffset + 4, true);

  if (certificateOffset === 0 || certificateLength === 0) {
    return null;
  }

  requireRange(bytes, certificateOffset, certificateLength, "Authenticode certificate table");
  requireRange(bytes, certificateOffset, 8, "Authenticode certificate header");
  const encodedCertificateLength = view.getUint32(certificateOffset, true);

  if (encodedCertificateLength < 8 || encodedCertificateLength > certificateLength) {
    throw new Error("The plugin assembly has an invalid Authenticode certificate length.");
  }

  return bytes.slice(certificateOffset + 8, certificateOffset + encodedCertificateLength);
}

export async function inspectPluginAssemblySignature(
  assemblyBytes: Uint8Array,
): Promise<NugetSignatureInspection> {
  const signature = getAuthenticodeSignature(assemblyBytes);

  if (!signature) {
    return { signatureStatus: "unsigned" };
  }

  try {
    return {
      signatureStatus: "signed",
      certificate: await inspectCmsSignature(signature),
    };
  } catch (error) {
    throw new Error(`Unable to inspect the plugin assembly signature: ${(error as Error).message}`, { cause: error });
  }
}