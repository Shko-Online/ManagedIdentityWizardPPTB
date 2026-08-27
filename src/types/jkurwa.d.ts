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

declare module "jkurwa" {
  export class Certificate {
    constructor(certificate: unknown);
    static from_asn1(data: Uint8Array): Certificate;
    serial: { toString(radix?: number): string };
    valid: { from: unknown; to: unknown };
    as_asn1(): Uint8Array;
    issuerDN(): string;
    subjectDN(): string;
    isRoot(): boolean;
  }

  export const dstszi2010: {
    ContentInfo: {
      decode(data: Uint8Array, encoding: "der"): unknown;
    };
  };
}