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

import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, userEvent, waitFor, within } from 'storybook/test';
import { type FC, type ReactNode, useCallback, useEffect, useState } from 'react';
import App from '../src/App';
import { ConnectionContext } from '../src/context/ConnectionContext';
import DataverseAPIContext from '../src/context/DataverseAPIContext';
import LogsProvider from '../src/components/LogsProvider';
import MenuRootProvider from '../src/components/MenuRootProvider';
import ToolboxAPIContext from '../src/context/ToolboxAPIContext';
import {
  SIGNED_ASSEMBLY_NAME,
  SIGNED_PACKAGE_NAME,
  UNSIGNED_PACKAGE_NAME,
  createDataverseAPIMock,
} from './mocks/dataverseMock';
import { createToolboxAPIMock } from './mocks/toolboxMock';
import { storybookConnection } from './mocks/connection';

const MockProviders: FC<{ connection: ToolBoxAPI.Connection | null; children: ReactNode }> = ({
  connection,
  children,
}) => {
  const [toolboxAPI] = useState(() => createToolboxAPIMock(connection));
  const [dataverseAPI] = useState(() => createDataverseAPIMock());
  const [activeConnection, setActiveConnection] = useState<ToolBoxAPI.Connection | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const refreshConnection = useCallback(async () => {
    setActiveConnection(await toolboxAPI.connections.getActiveConnection());
    setIsLoading(false);
  }, [toolboxAPI]);

  useEffect(() => {
    void refreshConnection();
  }, [refreshConnection]);

  return (
    <LogsProvider>
      <ToolboxAPIContext.Provider value={toolboxAPI}>
        <MenuRootProvider>
          <ConnectionContext.Provider
            value={{ connection: activeConnection, isLoading, refreshConnection }}
          >
            <DataverseAPIContext.Provider value={dataverseAPI}>
              {children}
            </DataverseAPIContext.Provider>
          </ConnectionContext.Provider>
        </MenuRootProvider>
      </ToolboxAPIContext.Provider>
    </LogsProvider>
  );
};

const meta = {
  component: App,
  parameters: { layout: 'fullscreen' },
  decorators: [
    (Story, context) => (
      <MockProviders connection={context.parameters.connection ?? null}>
        <Story />
      </MockProviders>
    ),
  ],
} satisfies Meta<typeof App>;

export default meta;
type Story = StoryObj<typeof meta>;

const connected = { connection: storybookConnection };

/** Offline mode: only the local file inspection command is available. */
export const Disconnected: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(await canvas.findByText('No active connection')).toBeInTheDocument();
  },
};

export const Connected: Story = {
  parameters: connected,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await userEvent.click(await canvas.findByRole('button', { name: 'Refresh packages' }));
    await expect(
      await canvas.findByRole('button', { name: `Inspect ${SIGNED_PACKAGE_NAME}` }),
    ).toBeInTheDocument();
    await expect(
      await canvas.findAllByText('ShkoOnline.StorageMI.Plugins Identity'),
    ).toHaveLength(2);
  },
};

export const SolutionFiltered: Story = {
  parameters: connected,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await userEvent.click(await canvas.findByRole('button', { name: 'Refresh packages' }));
    await canvas.findByRole('button', { name: `Inspect ${SIGNED_PACKAGE_NAME}` });

    await userEvent.click(await canvas.findByRole('button', { name: 'More inspector actions' }));
    await userEvent.click(await canvas.findByRole('menuitem', { name: /^Solution:/ }));

    const dialog = within(await canvas.findByRole('dialog'));
    await userEvent.click(await dialog.findByRole('checkbox', { name: 'Select albx_TestSolution' }));
    await userEvent.click(await dialog.findByRole('button', { name: 'Select albx_TestSolution' }));

    await waitFor(() => expect(canvas.queryByRole('dialog')).not.toBeInTheDocument());
    await expect(await canvas.findByText('Plugin packages (3)')).toBeInTheDocument();
    await expect(await canvas.findByText('Plugin assemblies (0)')).toBeInTheDocument();
  },
};

export const InspectedPackage: Story = {
  parameters: connected,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await userEvent.click(await canvas.findByRole('button', { name: 'Refresh packages' }));
    await userEvent.click(
      await canvas.findByRole('button', { name: `Inspect ${SIGNED_PACKAGE_NAME}` }),
    );

    await waitFor(
      async () =>
        expect(
          await canvas.findByRole('button', { name: 'View certificate details' }),
        ).toBeInTheDocument(),
      { timeout: 20000 },
    );
    await expect(await canvas.findByText('Subject identifier')).toBeInTheDocument();
  },
};

export const InspectedAssembly: Story = {
  parameters: connected,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await userEvent.click(await canvas.findByRole('button', { name: 'Refresh packages' }));
    await userEvent.click(await canvas.findByRole('tab', { name: /^Plugin assemblies/ }));
    // Pasted rather than typed: every keystroke re-renders the full assembly table.
    await userEvent.click(await canvas.findByRole('textbox', { name: 'Filter component names' }));
    await userEvent.paste(SIGNED_ASSEMBLY_NAME);
    await userEvent.click(
      await canvas.findByRole('button', { name: `Inspect ${SIGNED_ASSEMBLY_NAME}` }),
    );

    await waitFor(
      async () =>
        expect(
          await canvas.findByRole('button', { name: 'View certificate details' }),
        ).toBeInTheDocument(),
      { timeout: 20000 },
    );
  },
};

export const UnsignedPackage: Story = {
  parameters: connected,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await userEvent.click(await canvas.findByRole('button', { name: 'Refresh packages' }));
    await userEvent.click(
      await canvas.findByRole('button', { name: `Inspect ${UNSIGNED_PACKAGE_NAME}` }),
    );

    await expect(
      await canvas.findByText('This package does not contain a NuGet `.signature.p7s` entry.'),
    ).toBeInTheDocument();
  },
};
