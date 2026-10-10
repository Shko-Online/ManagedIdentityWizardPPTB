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
  Badge,
  Button,
  Card,
  CardHeader,
  Dialog,
  DialogActions,
  DialogContent,
  DialogSurface,
  DialogTitle,
  DialogTrigger,
  Spinner,
  Table,
  TableBody,
  TableHeader,
  TableHeaderCell,
  TableRow,
  Text,
  tokens,
} from "@fluentui/react-components";
import {
  CheckmarkCircle24Regular,
  Dismiss24Regular,
  Warning24Regular,
} from "@fluentui/react-icons";
import LogTableRow from "./LogTableRow";
import { LogsContext } from "../context/LogsContext";
import { ConnectionContext } from "../context/ConnectionContext";
import { useContext, useState } from "react";
import useEventLogStyles from "../styles/EventLog";
import useConnectionStatusStyles from "../styles/ConnectionStatus";
import EllipsisText from "./EllipsisText";
import getEnvironmentColor from "../utils/getEnvironmentColor";

export const EventLog: React.FC = () => {
  const styles = useEventLogStyles();
  const connectionStyles = useConnectionStatusStyles();
  const { logs, clearLogs } = useContext(LogsContext);
  const { connection, isLoading } = useContext(ConnectionContext);
  const [isConnectionDialogOpen, setConnectionDialogOpen] = useState(false);
  const [isFullLogOpen, setFullLogOpen] = useState(false);
  const connectionButtonLabel = connection?.name ?? "Connection details";
  const visibleLogs = logs.slice(0, 2);

  const renderConnectionDetails = () => {
    if (isLoading) {
      return (
        <div className={connectionStyles.content}>
          <Spinner label="Checking connection..." />
        </div>
      );
    }

    if (!connection) {
      return (
        <div className={connectionStyles.content}>
          <div className={connectionStyles.warningBox}>
            <Warning24Regular />
            <div>
              <Text weight="semibold">No active connection</Text>
              <br />
              <Text>
                Please connect to a Dataverse environment to use this tool to read plug-in packages.
                Otherwise only offline features will be available.
              </Text>
            </div>
          </div>
        </div>
      );
    }

    return (
      <div className={connectionStyles.content}>
        <div className={connectionStyles.connectionItem}>
          <Text className={connectionStyles.label}>Name:</Text>
          <EllipsisText className={connectionStyles.ellipsis} value={connection.name} />
        </div>
        <div className={connectionStyles.connectionItem}>
          <Text className={connectionStyles.label}>URL:</Text>
          <EllipsisText className={connectionStyles.ellipsis} value={connection.url} />
        </div>
        <div className={connectionStyles.connectionItem}>
          <Text className={connectionStyles.label}>Environment:</Text>
          <Badge
            appearance="filled"
            color={getEnvironmentColor(connection.environment)}
            className={connectionStyles.environmentBadge}
          >
            <EllipsisText
              className={connectionStyles.ellipsis}
              value={connection.environment}
            />
          </Badge>
        </div>
      </div>
    );
  };

  return (
    <>
      <Card className={styles.card}>
        <CardHeader
          header={
            <Text weight="semibold" size={400}>
              📋 Event Log
            </Text>
          }
          action={
            <div
              style={{
                display: "flex",
                gap: tokens.spacingHorizontalS,
                alignItems: "center",
                justifyContent: "flex-end",
                minWidth: 0,
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: tokens.spacingHorizontalS, minWidth: "180px", justifyContent: "flex-start" }}>
                {logs.length > 2 && (
                  <Button appearance="subtle" onClick={() => setFullLogOpen(true)}>
                    View all events
                  </Button>
                )}
                <Button
                  appearance="subtle"
                  icon={<Dismiss24Regular />}
                  onClick={clearLogs}
                >
                  Clear Log
                </Button>
              </div>
              <Button
                appearance="subtle"
                onClick={() => setConnectionDialogOpen(true)}
                title={connectionButtonLabel}
                style={{ maxWidth: "220px", flexShrink: 0 }}
              >
                <span
                  style={{
                    display: "inline-block",
                    maxWidth: "180px",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    whiteSpace: "nowrap",
                    verticalAlign: "bottom",
                  }}
                  title={connectionButtonLabel}
                >
                  {connectionButtonLabel}
                </span>
              </Button>
            </div>
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
                {visibleLogs.map((log, index) => (
                  // eslint-disable-next-line @eslint-react/no-array-index-key
                  <LogTableRow key={index} log={log} />
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </Card>

      <Dialog
        open={isFullLogOpen}
        onOpenChange={(_, data) => setFullLogOpen(data.open)}
      >
        <DialogSurface style={{ maxWidth: "900px", width: "min(900px, calc(100vw - 32px))" }}>
          <DialogTitle>Full Event Log</DialogTitle>
          <DialogContent>
            <div style={{ maxHeight: "70vh", overflow: "auto" }}>
              <Table size="small">
                <TableHeader>
                  <TableRow>
                    <TableHeaderCell className={styles.timestampCell}>Timestamp</TableHeaderCell>
                    <TableHeaderCell className={styles.typeCell}>Type</TableHeaderCell>
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
          </DialogContent>
          <DialogActions>
            <DialogTrigger action="close">
              <Button appearance="secondary">Close</Button>
            </DialogTrigger>
          </DialogActions>
        </DialogSurface>
      </Dialog>

      <Dialog
        open={isConnectionDialogOpen}
        onOpenChange={(_, data) => setConnectionDialogOpen(data.open)}
      >
        <DialogSurface>
          <DialogTitle>
            <div style={{ display: "flex", alignItems: "center", gap: tokens.spacingHorizontalS }}>
              <CheckmarkCircle24Regular color={tokens.colorPaletteGreenForeground2} />
              <span>Connection Status</span>
            </div>
          </DialogTitle>
          <DialogContent>{renderConnectionDetails()}</DialogContent>
          <DialogActions>
            <DialogTrigger action="close">
              <Button appearance="secondary">Close</Button>
            </DialogTrigger>
          </DialogActions>
        </DialogSurface>
      </Dialog>
    </>
  );
};
