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
  Card,
  CardHeader,
  Spinner,
  Text,
  tokens,
} from "@fluentui/react-components";
import {
  CheckmarkCircle24Regular,
  Warning24Regular,
} from "@fluentui/react-icons";
import { ConnectionContext } from "../context/ConnectionContext";
import EllipsisText from "./EllipsisText";
import getEnvironmentColor from "../utils/getEnvironmentColor";
import { useContext } from "react";
import useStyles from "../styles/ConnectionStatus";

export const ConnectionStatus: React.FC = () => {
  const styles = useStyles();
  const { connection, isLoading } = useContext(ConnectionContext);

  if (isLoading) {
    return (
      <Card className={styles.card}>
        <CardHeader
          header={
            <Text weight="semibold" size={400}>
              🔗 Connection Status
            </Text>
          }
        />
        <div className={styles.content}>
          <Spinner label="Checking connection..." />
        </div>
      </Card>
    );
  }

  if (!connection) {
    return (
      <Card className={styles.card}>
        <CardHeader
          header={
            <Text weight="semibold" size={400}>
              🔗 Connection Status
            </Text>
          }
        />
        <div className={styles.content}>
          <div className={styles.warningBox}>
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
      </Card>
    );
  }

  return (
    <Card className={styles.card}>
      <CardHeader
        header={
          <Text weight="semibold" size={400}>
            🔗 Connection Status
          </Text>
        }
        action={
          <CheckmarkCircle24Regular
            color={tokens.colorPaletteGreenForeground2}
          />
        }
      />
      <div className={styles.content}>
        <div className={styles.connectionItem}>
          <Text className={styles.label}>Name:</Text>
          <EllipsisText className={styles.ellipsis} value={connection.name} />
        </div>
        <div className={styles.connectionItem}>
          <Text className={styles.label}>URL:</Text>
          <EllipsisText className={styles.ellipsis} value={connection.url} />
        </div>
        <div className={styles.connectionItem}>
          <Text className={styles.label}>Environment:</Text>
          <Badge
            appearance="filled"
            color={getEnvironmentColor(connection.environment)}
            className={styles.environmentBadge}
          >
            <EllipsisText
              className={styles.ellipsis}
              value={connection.environment}
            />
          </Badge>
        </div>
      </div>
    </Card>
  );
};
