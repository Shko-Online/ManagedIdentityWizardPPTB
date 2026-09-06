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

import { makeStyles, tokens } from "@fluentui/react-components";

const useStyles = makeStyles({
  overlay: {
    position: "fixed",
    inset: 0,
    zIndex: 1000,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    padding: tokens.spacingVerticalL,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
  },
  popup: {
    width: "min(760px, 100%)",
    maxHeight: "85vh",
    display: "flex",
    flexDirection: "column",
    backgroundColor: tokens.colorNeutralBackground1,
    border: `1px solid ${tokens.colorNeutralStroke1}`,
    borderRadius: tokens.borderRadiusMedium,
    boxShadow: tokens.shadow64,
  },
  header: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: tokens.spacingHorizontalM,
    padding: `${tokens.spacingVerticalM} ${tokens.spacingHorizontalM}`,
    borderBottom: `1px solid ${tokens.colorNeutralStroke2}`,
  },
  body: {
    display: "flex",
    flexDirection: "column",
    gap: tokens.spacingVerticalM,
    padding: tokens.spacingVerticalM,
    minWidth: 0,
    overflow: "auto",
  },
  fields: {
    display: "grid",
    gridTemplateColumns: "minmax(140px, 0.35fr) minmax(0, 1fr)",
    alignItems: "center",
    rowGap: tokens.spacingVerticalXS,
    columnGap: tokens.spacingHorizontalM,
  },
  label: {
    color: tokens.colorNeutralForeground3,
    fontWeight: tokens.fontWeightSemibold,
  },
  value: {
    overflow: "hidden",
    textOverflow: "ellipsis",
    whiteSpace: "nowrap",
  },
  tabs: {
    borderTop: `1px solid ${tokens.colorNeutralStroke2}`,
    paddingTop: tokens.spacingVerticalS,
  },
  inspection: {
    display: "flex",
    flexDirection: "column",
    gap: tokens.spacingVerticalS,
  },
  actions: {
    display: "flex",
    flexWrap: "nowrap",
    justifyContent: "flex-start",
    alignItems: "center",
    gap: tokens.spacingHorizontalXS,
    overflowX: "auto",
    overflowY: "hidden",
  },
  compactActionButton: {
    whiteSpace: "nowrap",
    flexShrink: 0,
    minWidth: 0,
  },
  identifierGrid: {
    display: "grid",
    gridTemplateColumns: "minmax(120px, 0.28fr) minmax(0, 1fr) auto",
    alignItems: "center",
    rowGap: tokens.spacingVerticalXS,
    columnGap: tokens.spacingHorizontalS,
  },
  identifierValue: {
    overflow: "hidden",
    textOverflow: "ellipsis",
    whiteSpace: "nowrap",
    fontFamily: tokens.fontFamilyMonospace,
    fontSize: tokens.fontSizeBase200,
  },
  muted: {
    color: tokens.colorNeutralForeground3,
  },
});

export default useStyles;
