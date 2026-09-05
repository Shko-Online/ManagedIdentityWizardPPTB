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

const guidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export function formatGuidInput(value: string): string {
  const hex = value.replace(/[^0-9a-f]/gi, "").slice(0, 32);
  const groupLengths = [8, 4, 4, 4, 12];
  let offset = 0;

  return groupLengths
    .map((length) => {
      const group = hex.slice(offset, offset + length);
      offset += length;
      return group;
    })
    .filter(Boolean)
    .join("-");
}

export function isGuid(value: string): boolean {
  return guidPattern.test(value.trim());
}
