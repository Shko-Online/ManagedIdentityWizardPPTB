import { DataverseAPIMock, ToolboxAPIMock } from '@shko.online/pptb-mock';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { type FC, type ReactNode, useCallback, useContext, useEffect, useState } from 'react';
import App from '../src/App';
import LogsProvider from '../src/components/LogsProvider';
import MenuRootProvider from '../src/components/MenuRootProvider';
import { ConnectionContext } from '../src/context/ConnectionContext';
import DataverseAPIContext from '../src/context/DataverseAPIContext';
import ToolboxAPIContext from '../src/context/ToolboxAPIContext';

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
    reader.addEventListener('abort', () => reject(new DOMException('File read was aborted.', 'AbortError')), { once: true });
    reader.readAsArrayBuffer(file);
  });
}

const MockToolboxAPIProvider: FC<{ children: ReactNode }> = ({ children }) => {
  const [toolboxAPI] = useState(() => {
    const api = new ToolboxAPIMock();
    let selectedFile: File | null = null;
    api.fileSystem.selectPath.callsFake(async (options) => {
      if (options?.type !== 'file') {
        return null;
      }

      selectedFile = await selectLocalFile();
      return selectedFile?.name ?? null;
    });
    api.fileSystem.readBinary.callsFake(async (filePath) => {
      if (!selectedFile || selectedFile.name !== filePath) {
        throw new Error(`Unable to access the selected file: ${filePath}`);
      }

      return readFileAsArrayBuffer(selectedFile);
    });
    api.connections.getActiveConnection.resolves(null);
    return api;
  });

  return (
    <ToolboxAPIContext.Provider value={toolboxAPI}>
      {children}
    </ToolboxAPIContext.Provider>
  );
};

const MockConnectionProvider: FC<{ children: ReactNode }> = ({ children }) => {
  const toolboxAPI = useContext(ToolboxAPIContext);
  const [connection, setConnection] = useState<ToolBoxAPI.Connection | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const refreshConnection = useCallback(async () => {
    const activeConnection = await toolboxAPI?.connections.getActiveConnection();
    setConnection(activeConnection ?? null);
    setIsLoading(false);
  }, [toolboxAPI]);

  useEffect(() => {
    void refreshConnection();
  }, [refreshConnection]);

  return (
    <ConnectionContext.Provider value={{ connection, isLoading, refreshConnection }}>
      {children}
    </ConnectionContext.Provider>
  );
};

const MockDataverseAPIProvider: FC<{ children: ReactNode }> = ({ children }) => {
  const [dataverseAPI] = useState(() => new DataverseAPIMock());

  return (
    <DataverseAPIContext.Provider value={dataverseAPI}>
      {children}
    </DataverseAPIContext.Provider>
  );
};

const meta = {
  component: App,
  tags: ['ai-generated', 'needs-work'],
  decorators: [
    (Story) => (
      <LogsProvider>
        <MockToolboxAPIProvider>
          <MenuRootProvider>
            <MockConnectionProvider>
              <MockDataverseAPIProvider>
                <Story />
              </MockDataverseAPIProvider>
            </MockConnectionProvider>
          </MenuRootProvider>
        </MockToolboxAPIProvider>
      </LogsProvider>
    ),
  ],
} satisfies Meta<typeof App>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Disconnected: Story = {};