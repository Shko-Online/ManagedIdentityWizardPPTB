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
  Button,
  Card,
  CardHeader,
  Table,
  TableBody,
  TableHeader,
  TableHeaderCell,
  TableRow,
  Text,
} from "@fluentui/react-components";
import { Dismiss24Regular } from "@fluentui/react-icons";
import LogTableRow from "./LogTableRow";
import { LogsContext } from "../context/LogsContext";
import { useContext } from "react";
import useEventLogStyles from "../styles/EventLog";

export const EventLog: React.FC = () => {
  const styles = useEventLogStyles();
  const { logs, clearLogs } = useContext(LogsContext);

  return (
    <Card className={styles.card}>
      <CardHeader
        header={
          <Text weight="semibold" size={400}>
            📋 Event Log
          </Text>
        }
        action={
          <Button
            appearance="subtle"
            icon={<Dismiss24Regular />}
            onClick={clearLogs}
          >
            Clear Log
          </Button>
        }
      />

      {logs.length === 0 ? (
        <div className={styles.emptyState}>No logs yet...</div>
      ) : (
        <div className={styles.tableContainer}>
          <Table className={styles.table} size="small">
            <TableHeader>
              <TableRow>
                <TableHeaderCell className={styles.timestampCell}>
                  Timestamp
                </TableHeaderCell>
                <TableHeaderCell className={styles.typeCell}>
                  Type
                </TableHeaderCell>
                <TableHeaderCell>Message</TableHeaderCell>
              </TableRow>
            </TableHeader>
            <TableBody>
              {logs.map((log, index) => (
                // eslint-disable-next-line @eslint-react/no-array-index-key
                <LogTableRow key={index} log={log} />
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </Card>
  );
};
