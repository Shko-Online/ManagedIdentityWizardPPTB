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

import React, { useCallback, useEffect, useContext } from 'react';
import { ConnectionContext } from './context/ConnectionContext';
import { LogsContext } from './context/LogsContext';
import { FluentProvider, webLightTheme, webDarkTheme, Title3, Text } from '@fluentui/react-components';
import useStyles from './styles/App';
import { ConnectionStatus } from './components/ConnectionStatus';
import { EventLog } from './components/EventLog';
import { PluginPackageInspector } from './components/PluginPackageInspector';
import { useToolboxEvents } from './hooks/useToolboxAPI';
import ToolboxAPIContext from './context/ToolboxAPIContext';
import { ShkoOnlineAd } from './components/ShkoOnlineAd';


function App() {
    const { refreshConnection } = useContext(ConnectionContext);
    const toolboxAPI = useContext(ToolboxAPIContext);
    const { addLog } = useContext(LogsContext);
    const [theme, setTheme] = React.useState<'light' | 'dark'>('light');
    const styles = useStyles();

    // Handle platform events
    const handleEvent = useCallback(
        (event: string, _data: any) => {
            switch (event) {
                case 'connection:updated':
                case 'connection:created':
                    refreshConnection();
                    break;

                case 'connection:deleted':
                    refreshConnection();
                    break;

                case 'terminal:output':
                case 'terminal:command:completed':
                case 'terminal:error':
                    // Terminal events handled by dedicated components
                    break;
            }
        },
        [refreshConnection]
    );

    useToolboxEvents(handleEvent);

    // Add initial log (run only once on mount)
    useEffect(() => {
        addLog('Managed Identity Wizard initialized', 'success');
    }, [addLog]);

    // Get theme from Toolbox API
    useEffect(() => {
        const getTheme = async () => {
            try {
                const currentTheme = await toolboxAPI?.utils.getCurrentTheme();
                setTheme(currentTheme === 'dark' ? 'dark' : 'light');
            } catch (error) {
                console.error('Error getting theme:', error);
            }
        };
        getTheme();
    }, []);

    return (
        <FluentProvider theme={theme === 'dark' ? webDarkTheme : webLightTheme} className={styles.root}>
            <div className={styles.header}>
                <div className={styles.headerTitle}>
                    <Title3>Managed Identity Wizard</Title3>
                    <Text className={styles.subtitle}>Inspect Dataverse plug-in packages and prepare managed identity credentials.</Text>
                </div>
            </div>

            <div className={styles.content}>
              <div className={styles.topRowContainer}>
                    <div className={styles.connectionStatus}>
                        <ConnectionStatus />
                    </div>

                    <div className={styles.shkoOnlineAd}>
                        <ShkoOnlineAd />
                    </div>
                </div>

                <div>
                    <PluginPackageInspector  />
                </div>

                <div>
                    <EventLog />
                </div>
            </div>
        </FluentProvider>
    );
}

export default App;
