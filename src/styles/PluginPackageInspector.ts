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
  toolbar: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    gap: tokens.spacingHorizontalM,
    flexWrap: "wrap",
  },
  commandGroup: {
    display: "flex",
    alignItems: "center",
    justifyContent: "flex-end",
    gap: tokens.spacingHorizontalS,
    marginLeft: "auto",
    flexWrap: "wrap",
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
  tabs: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: tokens.spacingHorizontalXS,
    borderBottom: `1px solid ${tokens.colorNeutralStroke2}`,
  },
  tabButtons: {
    display: "flex",
    gap: tokens.spacingHorizontalXS,
  },
  nameFilter: {
    width: "280px",
    maxWidth: "45%",
  },
  activeTab: {
    borderBottomColor: tokens.colorBrandStroke1,
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
    minWidth: "900px",
  },
  nameColumn: {
    width: "14%",
  },
  uniqueNameColumn: {
    width: "14%",
  },
  versionColumn: {
    width: "8%",
  },
  packageFileColumn: {
    width: "22%",
  },
  statusColumn: {
    width: "9%",
  },
  managedColumn: {
    width: "9%",
  },
  actionColumn: {
    width: "12%",
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
  inspectedRow: {
    backgroundColor: tokens.colorNeutralBackground2,
  },
  muted: {
    color: tokens.colorNeutralForeground3,
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
  solutionPickerPopup: {
    width: "min(1200px, 100%)",
    maxHeight: "min(760px, 90vh)",
    overflow: "hidden",
    backgroundColor: tokens.colorNeutralBackground1,
    border: `1px solid ${tokens.colorNeutralStroke1}`,
    borderRadius: tokens.borderRadiusMedium,
    boxShadow: tokens.shadow64,
    display: "flex",
    flexDirection: "column",
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
  solutionPickerControls: {
    display: "flex",
    alignItems: "center",
    gap: tokens.spacingHorizontalS,
    flexWrap: "wrap",
    padding: tokens.spacingVerticalM,
    borderBottom: `1px solid ${tokens.colorNeutralStroke2}`,
  },
  solutionFilterInput: {
    width: "280px",
    marginLeft: "auto",
  },
  solutionTableContainer: {
    overflow: "auto",
    padding: tokens.spacingVerticalM,
  },
  solutionTable: {
    minWidth: "980px",
  },
  solutionTableHeader: {
    borderBottom: `3px solid ${tokens.colorNeutralStroke1}`,
  },
  solutionHeaderButton: {
    display: "inline-flex",
    alignItems: "center",
    gap: tokens.spacingHorizontalXS,
    fontWeight: tokens.fontWeightSemibold,
  },
  solutionCheckboxColumn: {
    width: "44px",
  },
  selectableSolutionRow: {
    cursor: "pointer",
    "&:hover": {
      backgroundColor: tokens.colorNeutralBackground1Hover,
    },
    "&:focus-visible": {
      outline: `2px solid ${tokens.colorBrandStroke1}`,
      outlineOffset: "-2px",
    },
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