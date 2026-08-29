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

import "./showBanner";
import "./index.css";
import App from "./App";
import ConnectionProvider from "./components/ConnectionProvider";
import DataverseAPIProvider from "./components/DataverseAPIProvider";
import LogsProvider from "./components/LogsProvider";
import MenuRootProvider from "./components/MenuRootProvider";
import { StrictMode } from "react";
import ToolboxAPIProvider from "./components/ToolboxAPIProvider";
import { createRoot } from "react-dom/client";

// Ensure DOM is ready and root element exists
const rootElement = document.getElementById("root");
if (rootElement && !rootElement.hasAttribute("data-reactroot-initialized")) {
  // Mark as initialized to prevent double rendering
  rootElement.setAttribute("data-reactroot-initialized", "true");

  createRoot(rootElement).render(
    <StrictMode>
      <LogsProvider>
        <ToolboxAPIProvider>
          <MenuRootProvider>
            <ConnectionProvider>
              <DataverseAPIProvider>
                <App />
              </DataverseAPIProvider>
            </ConnectionProvider>
          </MenuRootProvider>
        </ToolboxAPIProvider>
      </LogsProvider>
    </StrictMode>,
  );
} else if (!rootElement) {
  console.error(
    'Root element not found. Make sure the HTML contains <div id="root"></div>',
  );
}
