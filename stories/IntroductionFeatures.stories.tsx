import {
  Button,
  Dialog,
  DialogActions,
  DialogBody,
  DialogContent,
  DialogSurface,
  DialogTitle,
  FluentProvider,
  Radio,
  RadioGroup,
  webLightTheme,
} from '@fluentui/react-components';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { useState } from 'react';
import { expect, userEvent, within } from 'storybook/test';
import { PluginComponentTabs } from '../src/components/PluginComponentTabs';
import { PluginPackageInspector } from '../src/components/PluginPackageInspector';
import { SolutionPickerDialog } from '../src/components/SolutionPickerDialog';
import type { SolutionRecord } from '../src/services/pluginPackageService';
import { MockProviders } from './App.stories';
import { SIGNED_PACKAGE_NAME } from './mocks/dataverseMock';
import { storybookConnection } from './mocks/connection';

const solutions: SolutionRecord[] = [
  {
    id: 'albx-test-solution',
    uniqueName: 'albx_TestSolution',
    version: '1.0.0.0',
    isManaged: false,
    publisher: 'Albanian Xrm',
    createdOn: '2026-08-01T12:00:00Z',
    modifiedOn: '2026-08-30T12:00:00Z',
    pluginCount: 3,
    pluginPackageCount: 2,
  },
  {
    id: 'contoso-identity',
    uniqueName: 'contoso_Identity',
    version: '2.1.0.0',
    isManaged: true,
    publisher: 'Contoso',
    createdOn: '2026-07-12T12:00:00Z',
    modifiedOn: '2026-08-28T12:00:00Z',
    pluginCount: 1,
    pluginPackageCount: 1,
  },
  {
    id: 'fabrikam-plugins',
    uniqueName: 'fabrikam_Plugins',
    version: '3.0.0.0',
    isManaged: true,
    publisher: 'Fabrikam',
    createdOn: '2026-06-22T12:00:00Z',
    modifiedOn: '2026-08-15T12:00:00Z',
    pluginCount: 4,
    pluginPackageCount: 3,
  },
];

type InspectionRequest = {
  componentName: string | null;
  componentType: 'package' | 'assembly' | 'local';
};

const inspectionStories = [
  { id: 'app--inspected-package', label: 'Package inspection' },
  { id: 'app--inspected-assembly', label: 'Assembly inspection' },
  { id: 'app--disconnected', label: 'Offline local file inspection' },
];

const storyIdForComponentType: Record<InspectionRequest['componentType'], string> = {
  package: 'app--inspected-package',
  assembly: 'app--inspected-assembly',
  local: 'app--disconnected',
};

function describeInspectionRequest(request: InspectionRequest | null): string {
  if (!request) {
    return '';
  }

  return request.componentType === 'local'
    ? 'Local file inspection is not available here.'
    : `Inspecting ${request.componentName ?? 'this component'} as a ${request.componentType} is not available here.`;
}

// Stories render in an iframe, so navigation has to target the Storybook manager.
function openStory(storyId: string): void {
  const target = window.top ?? window;
  target.location.href = `${target.location.origin}/?path=/story/${storyId}`;
}

const meta = {
  // Indexed so the Introduction docs can embed them, but hidden from the sidebar.
  tags: ['!dev'],
  decorators: [
    (Story) => (
      <FluentProvider theme={webLightTheme}>
        <Story />
      </FluentProvider>
    ),
  ],
} satisfies Meta;
export default meta;
type Story = StoryObj<typeof meta>;

export const ComponentBrowser: Story = {
  render: function ComponentBrowserStory() {
    const [activeTab, setActiveTab] = useState<'packages' | 'assemblies'>('packages');
    const [filter, setFilter] = useState('');

    return (
      <PluginComponentTabs
        activeTab={activeTab}
        packageCount={12}
        assemblyCount={8}
        filter={filter}
        onActiveTabChange={setActiveTab}
        onFilterChange={setFilter}
      />
    );
  },
};

export const LocalInspection: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await userEvent.click(await canvas.findByRole('button', { name: 'Inspect local package' }));
    await expect(await canvas.findByRole('button', { name: 'View certificate details' })).toBeInTheDocument();
    await userEvent.click(await canvas.findByRole('button', { name: 'View certificate details' }));
    await expect(await canvas.findByRole('dialog', { name: 'Certificate details' })).toBeInTheDocument();
  },
  render: function LocalInspectionStory() {
    return (
      // The certificate popup is clipped by the docs canvas, so reserve room for it.
      <div style={{ minHeight: '780px', position: 'relative' }}>
        <MockProviders
          connection={null}
          localFileName={`${SIGNED_PACKAGE_NAME}.nupkg`}
        >
          <PluginPackageInspector />
        </MockProviders>
      </div>
    );
  },
};

export const ComponentLists: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await userEvent.click(await canvas.findByRole('button', { name: 'Refresh packages' }));
    await userEvent.click(await canvas.findByRole('button', { name: 'Inspect albx_AlbanianXrm.PluginPackage' }));
    await expect(
      await within(canvasElement.ownerDocument.body).findByRole('dialog', {
        name: 'Inspection in full story',
      }),
    ).toBeInTheDocument();
  },
  render: function ComponentListsStory() {
    const [inspectionRequest, setInspectionRequest] = useState<InspectionRequest | null>(null);
    const [selectedStoryId, setSelectedStoryId] = useState<string>(inspectionStories[0].id);

    return (
      <MockProviders connection={storybookConnection}>
        <PluginPackageInspector
          onInspectionRequested={(componentName, componentType) => {
            setInspectionRequest({ componentName, componentType });
            setSelectedStoryId(storyIdForComponentType[componentType]);
          }}
        />
        <Dialog open={inspectionRequest !== null} onOpenChange={(_event, data) => {
          if (!data.open) {
            setInspectionRequest(null);
          }
        }}>
          <DialogSurface>
            <DialogBody>
              <DialogTitle>Inspection in full story</DialogTitle>
              <DialogContent>
                <p>
                  {describeInspectionRequest(inspectionRequest)} This documentation preview only
                  demonstrates the component lists, so open one of the complete workflow stories to
                  see signing, certificate, and managed identity details.
                </p>
                <RadioGroup
                  aria-label="Story to open"
                  value={selectedStoryId}
                  onChange={(_event, data) => setSelectedStoryId(data.value)}
                >
                  {inspectionStories.map((story) => (
                    <Radio key={story.id} value={story.id} label={story.label} />
                  ))}
                </RadioGroup>
              </DialogContent>
              <DialogActions>
                <Button appearance="primary" onClick={() => openStory(selectedStoryId)}>
                  Open story
                </Button>
                <Button onClick={() => setInspectionRequest(null)}>
                  Close
                </Button>
              </DialogActions>
            </DialogBody>
          </DialogSurface>
        </Dialog>
      </MockProviders>
    );
  },
};

export const SolutionFilter: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await userEvent.click(await canvas.findByRole('checkbox', { name: 'Select contoso_Identity' }));
    await userEvent.click(await canvas.findByRole('button', { name: 'Select contoso_Identity' }));
    await expect(canvas.getByRole('button', { name: 'Solution: contoso_Identity' })).toBeInTheDocument();
  },
  render: function SolutionFilterStory() {
    const [isOpen, setIsOpen] = useState(true);
    const [selectedSolutionId, setSelectedSolutionId] = useState(solutions[0].id);
    const selectedSolution = solutions.find((solution) => solution.id === selectedSolutionId);

    return (
      <div style={{ minHeight: '680px', position: 'relative' }}>
        {!isOpen && (
          <Button appearance="primary" onClick={() => setIsOpen(true)}>
            Solution: {selectedSolution?.uniqueName ?? 'All Solutions'}
          </Button>
        )}
        {isOpen && (
          <SolutionPickerDialog
            solutions={solutions}
            selectedSolutionId={selectedSolutionId}
            onClose={() => setIsOpen(false)}
            onSelect={setSelectedSolutionId}
          />
        )}
      </div>
    );
  },
};