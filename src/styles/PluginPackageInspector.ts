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
  card: {
    width: "100%",
  },
  content: {
    padding: tokens.spacingVerticalM,
    display: "flex",
    flexDirection: "column",
    gap: tokens.spacingVerticalM,
  },
  headerTitle: {
    display: "flex",
    alignItems: "baseline",
    gap: tokens.spacingHorizontalM,
    minWidth: "0",
  },
  title: {
    flexShrink: 0,
    fontWeight: tokens.fontWeightSemibold,
    fontSize: tokens.fontSizeBase400,
    whiteSpace: "nowrap",
  },
  toolbar: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    gap: tokens.spacingHorizontalM,
  },
  toolbarDescription: {
    color: tokens.colorNeutralForeground3,
    display: "block",
    flex: "1 1 0",
    minWidth: "0",
    overflow: "hidden",
    textAlign: "right",
    textOverflow: "ellipsis",
    whiteSpace: "nowrap",
  },
  commandGroup: {
    display: "flex",
    alignItems: "center",
    justifyContent: "flex-end",
    gap: tokens.spacingHorizontalS,
    width: "100%",
  },
  overflowMenu: {
    display: "inline-flex",
    marginLeft: "auto",
  },
  toolbarSelect: {
    width: "240px",
    minHeight: "32px",
    paddingLeft: tokens.spacingHorizontalS,
    paddingRight: tokens.spacingHorizontalS,
    color: tokens.colorNeutralForeground1,
    backgroundColor: tokens.colorNeutralBackground1,
    border: `1px solid ${tokens.colorNeutralStroke1}`,
    borderRadius: tokens.borderRadiusSmall,
    fontFamily: tokens.fontFamilyBase,
    fontSize: tokens.fontSizeBase300,
  },
  pagination: {
    display: "flex",
    alignItems: "center",
    justifyContent: "flex-end",
    gap: tokens.spacingHorizontalS,
  },
  tableContainer: {
    overflowX: "auto",
  },
  sectionTitle: {
    display: "block",
    marginTop: tokens.spacingVerticalS,
  },
  table: {
    tableLayout: "fixed",
    width: "100%",
    minWidth: "1360px",
  },
  tableHeader: {
    "& th": {
      textAlign: "center",
    },
  },
  sortButton: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: tokens.spacingHorizontalXXS,
    width: "100%",
    maxWidth: "100%",
    minWidth: "auto",
    flexGrow: 1,
    paddingLeft: tokens.spacingHorizontalXS,
    paddingRight: tokens.spacingHorizontalXS,
    whiteSpace: "nowrap",
  },
  sortIconSlot: {
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
    width: "24px",
    height: "24px",
  },
  nameColumn: {
    width: "200px",
    minWidth: "110px",
  },
  uniqueNameColumn: {
    width: "180px",
    minWidth: "150px",
    whiteSpace: "nowrap",
  },
  versionColumn: {
    width: "110px",
    minWidth: "110px",
  },
  packageFileColumn: {
    width: "200px",
    minWidth: "150px",
  },
  createdColumn: {
    width: "115px",
    minWidth: "115px",
    textAlign: "center",
    whiteSpace: "nowrap",
  },
  modifiedColumn: {
    width: "125px",
    minWidth: "125px",
    textAlign: "center",
    whiteSpace: "nowrap",
  },
  managedColumn: {
    width: "90px",
    minWidth: "90px",
    textAlign: "center",
  },
  identityColumn: {
    width: "220px",
    minWidth: "200px",
    whiteSpace: "nowrap",
  },
  actionColumn: {
    position: "sticky",
    right: 0,
    zIndex: 1,
    width: "120px",
    minWidth: "110px",
    backgroundColor: tokens.colorNeutralBackground1,
  },
  assemblyNameColumn: {
    width: "300px",
    minWidth: "110px",
  },
  assemblyVersionColumn: {
    width: "130px",
    minWidth: "110px",
  },
  assemblyManagedColumn: {
    width: "90px",
    minWidth: "90px",
    textAlign: "center",
  },
  assemblyCreatedColumn: {
    width: "115px",
    minWidth: "115px",
    textAlign: "center",
    whiteSpace: "nowrap",
  },
  assemblyModifiedColumn: {
    width: "125px",
    minWidth: "125px",
    textAlign: "center",
    whiteSpace: "nowrap",
  },
  assemblyIdentityColumn: {
    width: "240px",
    minWidth: "200px",
    whiteSpace: "nowrap",
  },
  assemblyActionColumn: {
    position: "sticky",
    right: 0,
    zIndex: 1,
    width: "140px",
    minWidth: "110px",
    backgroundColor: tokens.colorNeutralBackground1,
  },
  actionButtons: {
    display: "flex",
    justifyContent: "center",
    gap: tokens.spacingHorizontalXS,
  },
  ellipsis: {
    display: "block",
    width: "100%",
    minWidth: "0",
    overflow: "hidden",
    textOverflow: "ellipsis",
    whiteSpace: "nowrap",
  },
  inspectedIndicator: {
    flexShrink: 0,
    color: tokens.colorPaletteGreenForeground1,
  },
  selectedSolution: {
    fontWeight: tokens.fontWeightSemibold,
  },
  inspectedRow: {
    backgroundColor: tokens.colorNeutralBackground2,
  },
  muted: {
    color: tokens.colorNeutralForeground3,
  },
  emptyState: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: tokens.spacingHorizontalS,
    textAlign: "center",
  },
  error: {
    color: tokens.colorPaletteRedForeground1,
  },
  configuration: {
    borderTop: `1px solid ${tokens.colorNeutralStroke2}`,
    paddingTop: tokens.spacingVerticalM,
    display: "flex",
    flexDirection: "column",
    gap: tokens.spacingVerticalS,
  },
  settingsOverlay: {
    position: "fixed",
    inset: 0,
    zIndex: 1000,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    padding: tokens.spacingHorizontalL,
    backgroundColor: "rgba(0, 0, 0, 0.55)",
  },
  settingsPopup: {
    width: "min(560px, 100%)",
    maxHeight: "min(720px, 90vh)",
    overflowY: "auto",
    backgroundColor: tokens.colorNeutralBackground1,
    border: `1px solid ${tokens.colorNeutralStroke1}`,
    borderRadius: tokens.borderRadiusMedium,
    boxShadow: tokens.shadow64,
  },
  settingsHeader: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: tokens.spacingHorizontalM,
    padding: tokens.spacingVerticalM,
    borderBottom: `1px solid ${tokens.colorNeutralStroke2}`,
  },
  settingsBody: {
    display: "flex",
    flexDirection: "column",
    gap: tokens.spacingVerticalM,
    padding: tokens.spacingVerticalM,
  },
  inspectionSummary: {
    borderTop: `1px solid ${tokens.colorNeutralStroke2}`,
    paddingTop: tokens.spacingVerticalM,
    display: "flex",
    flexDirection: "column",
    gap: tokens.spacingVerticalS,
  },
  inspectionGrid: {
    display: "grid",
    gridTemplateColumns: "minmax(120px, 0.35fr) minmax(0, 1fr)",
    rowGap: tokens.spacingVerticalXS,
    columnGap: tokens.spacingHorizontalM,
    maxWidth: "760px",
  },
  inspectionLabel: {
    color: tokens.colorNeutralForeground3,
    fontWeight: tokens.fontWeightSemibold,
  },
  inspectionValue: {
    overflow: "hidden",
    textOverflow: "ellipsis",
    whiteSpace: "nowrap",
  },
  cloudSelect: {
    width: "100%",
    minHeight: "32px",
    paddingLeft: tokens.spacingHorizontalS,
    paddingRight: tokens.spacingHorizontalS,
    color: tokens.colorNeutralForeground1,
    backgroundColor: tokens.colorNeutralBackground1,
    border: `1px solid ${tokens.colorNeutralStroke1}`,
    borderRadius: tokens.borderRadiusSmall,
    fontFamily: tokens.fontFamilyBase,
    fontSize: tokens.fontSizeBase300,
  },
  solutionFilter: {
    display: "flex",
    flexDirection: "column",
    gap: tokens.spacingVerticalXS,
    maxWidth: "460px",
  },
  inputGroup: {
    display: "flex",
    flexDirection: "column",
    gap: tokens.spacingVerticalXS,
    width: "100%",
  },
  identifierGrid: {
    display: "grid",
    gridTemplateColumns: "minmax(120px, 0.28fr) minmax(0, 1fr) auto",
    alignItems: "center",
    rowGap: tokens.spacingVerticalXS,
    columnGap: tokens.spacingHorizontalS,
    maxWidth: "1000px",
  },
  identifierValue: {
    overflow: "hidden",
    textOverflow: "ellipsis",
    whiteSpace: "nowrap",
    fontFamily: tokens.fontFamilyMonospace,
    fontSize: tokens.fontSizeBase200,
  },
});

export default useStyles;