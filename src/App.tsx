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

import { FluentProvider, Title3, webDarkTheme, webLightTheme } from '@fluentui/react-components';
import { useContext, useEffect, useState } from 'react';
import { ConnectionStatus } from './components/ConnectionStatus';
import EllipsisText from './components/EllispsisText';
import { EventLog } from './components/EventLog';
import { LogsContext } from './context/LogsContext';
import MenuRootContext from './context/MenuRootContext';
import { PluginPackageInspector } from './components/PluginPackageInspector';
import { ShkoOnlineAd } from './components/ShkoOnlineAd';
import ToolboxAPIContext from './context/ToolboxAPIContext';
import useStyles from './styles/App';

function App() {
    const toolboxAPI = useContext(ToolboxAPIContext);
    const { addLog } = useContext(LogsContext);
    const [theme, setTheme] = useState<'light' | 'dark'>('light');
    const styles = useStyles();
    const { setMenuRoot } = useContext(MenuRootContext);

    // Add initial log (run only once on mount)
    useEffect(() => {
        addLog('Managed Identity Wizard initialized', 'success');
    }, [addLog]);

    // Get theme from Toolbox API
    useEffect(() => {
        if(!toolboxAPI) {
            return;
        }

        const handleThemeChange = (_: unknown, payload: ToolBoxAPI.ToolBoxEventPayload) => {
            const theme = (payload.data as { theme?: string }).theme;
            if(theme) {
                setTheme(theme === 'dark' ? 'dark' : 'light');  
            }
        };

        toolboxAPI.events.on(handleThemeChange);

        const syncTheme = async () => {
            try {
                const currentTheme = await toolboxAPI?.utils.getCurrentTheme();
                setTheme(currentTheme === 'dark' ? 'dark' : 'light');
            } catch (error) {
                console.error('Error getting theme:', error);
            }
        };
        syncTheme();

        return () => {
            toolboxAPI.events.off(handleThemeChange);
        };
    }, [toolboxAPI]);

    return (
        <FluentProvider theme={theme === 'dark' ? webDarkTheme : webLightTheme} className={styles.root}>
            <div className={styles.header}>
                <div className={styles.headerTitle}>
                    <div className={styles.titleGroup}>
                        <img
                            className={styles.headerIcon}
                            src="/ManagedIdentity.svg"
                            alt=""
                        />
                        <Title3 className={styles.title}>{'Managed\u00a0Identity\u00a0Wizard'}</Title3>
                    </div>
                    <EllipsisText
                        className={styles.subtitle}
                        value="Inspect Dataverse plug-in packages and prepare managed identity credentials."
                    />
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
            <div className={styles.menuRoot} ref={setMenuRoot} />
        </FluentProvider>
    );
}

export default App;
