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

import React, { useContext } from "react";
import { LogEntry, LogsContext } from "../context/LogsContext";
import {
  Card,
  CardHeader,
  Button,
  Table,
  TableBody,
  TableCell,
  TableRow,
  TableHeader,
  TableHeaderCell,
  TableCellLayout,
  Text,
} from "@fluentui/react-components";
import { Dismiss24Regular } from "@fluentui/react-icons";
import useStyles from "../styles/EventLog";

export const EventLog: React.FC = () => {
  const styles = useStyles();
  const { logs, clearLogs } = useContext(LogsContext);

  const getTypeStyle = (type: LogEntry["type"]) => {
    switch (type) {
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
  };

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
                <TableRow key={index}>
                  <TableCell className={styles.timestampCell}>
                    <TableCellLayout>
                      {log.timestamp.toLocaleTimeString()}
                    </TableCellLayout>
                  </TableCell>
                  <TableCell className={styles.typeCell}>
                    <TableCellLayout>
                      <Text className={getTypeStyle(log.type)}>
                        {log.type.toUpperCase()}
                      </Text>
                    </TableCellLayout>
                  </TableCell>
                  <TableCell>
                    <TableCellLayout>{log.message}</TableCellLayout>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </Card>
  );
};
