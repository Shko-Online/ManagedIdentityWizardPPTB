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

import { FC, ReactNode, useCallback, useState } from "react";
import { LogEntry, LogsContext } from "../context/LogsContext";

const LogsProvider: FC<{ children: ReactNode }> = ({ children }) => {
   const [logs, setLogs] = useState<LogEntry[]>([]);

   // Use useCallback without dependencies since we're using the functional update form of setState
  // This ensures the functions are stable across renders and won't cause infinite loops
  const addLog = useCallback(
    (message: string, type: LogEntry["type"] = "info") => {
      setLogs((prev) => [
        {
          timestamp: new Date(),
          message,
          type,
        },
        ...prev.slice(0, 49), // Keep last 50 entries
      ]);
      console.log(`[${type.toUpperCase()}] ${message}`);
    },
    []
  ); // Empty deps is safe because we use functional setState

  const clearLogs = useCallback(() => {
    setLogs([]);
  }, []); // Empty deps is safe because we use functional setState

  return <LogsContext.Provider
    value={{ logs, addLog, clearLogs }}
  >{children}</LogsContext.Provider>;
};

export default LogsProvider;