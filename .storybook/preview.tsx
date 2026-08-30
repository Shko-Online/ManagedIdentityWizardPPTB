import type { Preview } from '@storybook/react-vite';
import MockDate from 'mockdate';
import '../src/index.css';
import ConnectionProvider from '../src/components/ConnectionProvider';
import DataverseAPIProvider from '../src/components/DataverseAPIProvider';
import LogsProvider from '../src/components/LogsProvider';
import MenuRootProvider from '../src/components/MenuRootProvider';
import ToolboxAPIProvider from '../src/components/ToolboxAPIProvider';

const preview: Preview = {
  decorators: [
    (Story) => (
      <LogsProvider>
        <ToolboxAPIProvider>
          <MenuRootProvider>
            <ConnectionProvider>
              <DataverseAPIProvider>
                <Story />
              </DataverseAPIProvider>
            </ConnectionProvider>
          </MenuRootProvider>
        </ToolboxAPIProvider>
      </LogsProvider>
    ),
  ],
  async beforeEach() {
    MockDate.set('2024-04-01T12:00:00Z');
  },
  parameters: {
    controls: {
      matchers: {
       color: /(background|color)$/i,
       date: /Date$/i,
      },
    },

    a11y: {
      // 'todo' - show a11y violations in the test UI only
      // 'error' - fail CI on a11y violations
      // 'off' - skip a11y checks entirely
      test: 'todo'
    }
  },
};

export default preview;