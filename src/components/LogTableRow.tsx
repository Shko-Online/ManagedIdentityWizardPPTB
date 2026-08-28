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

import {
  TableCell,
  TableCellLayout,
  TableRow,
  Text,
} from "@fluentui/react-components";
import { LogEntry } from "../context/LogsContext";
import useLogTableRowStyles from "../styles/LogTableRow";
import { useMemo } from "react";

const LogTableRow: React.FC<{ log: LogEntry }> = ({ log }: { log: LogEntry }) => {
  const styles = useLogTableRowStyles();

  const logTypeStyle = useMemo(() => {
    switch (log.type) {
      case "success":
        return styles.successText;
      case "info":
        return styles.infoText;
      case "warning":
        return styles.warningText;
      case "error":
        return styles.errorText;
      default:
        return "";
    }
  }, [styles, log.type]);

  return (
    <TableRow>
      <TableCell className={styles.timestampCell}>
        <TableCellLayout>{log.timestamp.toLocaleTimeString()}</TableCellLayout>
      </TableCell>
      <TableCell className={styles.typeCell}>
        <TableCellLayout>
          <Text className={logTypeStyle}>{log.type.toUpperCase()}</Text>
        </TableCellLayout>
      </TableCell>
      <TableCell>
        <TableCellLayout>{log.message}</TableCellLayout>
      </TableCell>
    </TableRow>
  );
};

export default LogTableRow;