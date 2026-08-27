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

import { FC, ReactNode, useCallback, useContext, useEffect, useState } from "react";
import ToolboxAPIContext from "../context/ToolboxAPIContext";
import { ConnectionContext } from "../context/ConnectionContext";

const ConnectionProvider: FC<{ children: ReactNode }> = ({ children }) => {
  const [connection, setConnection] =
    useState<ToolBoxAPI.Connection | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const toolboxAPI = useContext(ToolboxAPIContext);
  const refreshConnection = useCallback(async () => {
    if (!toolboxAPI) {
      return;
    }
    try {
      const conn = await toolboxAPI!.connections.getActiveConnection();
      setConnection(conn);
    } catch (error) {
      console.error("Error refreshing connection:", error);
    } finally {
      setIsLoading(false);
    }
  }, [toolboxAPI]);

  useEffect(() => {
    refreshConnection();
  }, [refreshConnection]);

  return <ConnectionContext.Provider
    value={{ connection, isLoading, refreshConnection }}
  >{children}</ConnectionContext.Provider>;
};

export default ConnectionProvider;