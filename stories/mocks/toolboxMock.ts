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

import { ToolboxAPIMock } from '@shko.online/pptb-mock';

type ToolboxMockOptions = {
  localFileName?: string;
};

function selectLocalFile(): Promise<File | null> {
  return new Promise((resolve) => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.nupkg,.dll';

    const complete = (file: File | null) => {
      input.remove();
      resolve(file);
    };

    input.addEventListener('change', () => complete(input.files?.[0] ?? null), { once: true });
    input.addEventListener('cancel', () => complete(null), { once: true });
    document.body.append(input);
    input.click();
  });
}

function readFileAsArrayBuffer(file: File): Promise<ArrayBuffer> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.addEventListener('load', () => resolve(reader.result as ArrayBuffer), { once: true });
    reader.addEventListener('error', () => reject(reader.error), { once: true });
    reader.addEventListener(
      'abort',
      () => reject(new DOMException('File read was aborted.', 'AbortError')),
      { once: true },
    );
    reader.readAsArrayBuffer(file);
  });
}

export function createToolboxAPIMock(
  connection: ToolBoxAPI.Connection | null,
  mockOptions: ToolboxMockOptions = {},
): ToolboxAPIMock {
  const api = new ToolboxAPIMock();
  let selectedFile: File | null = null;
  let selectedFileBytes: ArrayBuffer | null = null;

  api.connections.getActiveConnection.resolves(connection);
  api.connections.getSecondaryConnection.resolves(null);
  api.events.on.callsFake(() => undefined);
  api.events.off.callsFake(() => undefined);
  api.utils.getCurrentTheme.resolves('light');
  api.utils.copyToClipboard.callsFake(async (text) => {
    await navigator.clipboard?.writeText(text).catch(() => undefined);
  });
  api.utils.showNotification.resolves();

  api.fileSystem.selectPath.callsFake(async (selectionOptions) => {
    if (selectionOptions?.type !== 'file') {
      return null;
    }

    if (mockOptions.localFileName) {
      const response = await fetch(`/mocks/${mockOptions.localFileName}`);
      if (!response.ok) {
        throw new Error(`Unable to load local fixture: ${mockOptions.localFileName}`);
      }

      selectedFileBytes = await response.arrayBuffer();
      return mockOptions.localFileName;
    }

    selectedFile = await selectLocalFile();
    return selectedFile?.name ?? null;
  });

  api.fileSystem.readBinary.callsFake(async (filePath) => {
    if (mockOptions.localFileName === filePath && selectedFileBytes) {
      return selectedFileBytes;
    }

    if (!selectedFile || selectedFile.name !== filePath) {
      throw new Error(`Unable to access the selected file: ${filePath}`);
    }

    return readFileAsArrayBuffer(selectedFile);
  });

  api.fileSystem.saveFile.callsFake(
    async (fileName) => `C:\\Users\\Storybook\\Downloads\\${fileName}`,
  );

  return api;
}

export default createToolboxAPIMock;
