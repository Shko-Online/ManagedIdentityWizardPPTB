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
    padding: tokens.spacingHorizontalL,
    backgroundColor: "rgba(0, 0, 0, 0.55)",
  },
  popup: {
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
  header: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: tokens.spacingHorizontalM,
    padding: tokens.spacingVerticalM,
    borderBottom: `1px solid ${tokens.colorNeutralStroke2}`,
  },
  filterInput: {
    width: "280px",
    marginLeft: "auto",
  },
  tableContainer: {
    overflow: "auto",
    padding: tokens.spacingVerticalM,
  },
  footer: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: tokens.spacingHorizontalM,
    flexWrap: "wrap",
    padding: tokens.spacingVerticalM,
    borderTop: `1px solid ${tokens.colorNeutralStroke2}`,
  },
  pagination: {
    display: "flex",
    alignItems: "center",
    gap: tokens.spacingHorizontalS,
  },
  table: {
    minWidth: "1194px",
    tableLayout: "fixed",
    width: "100%",
  },
  tableHeader: {
    borderBottom: `3px solid ${tokens.colorNeutralStroke1}`,
    "& th": {
      textAlign: "center",
    },
  },
  headerButton: {
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
    fontWeight: tokens.fontWeightSemibold,
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
  checkboxColumn: {
    width: "44px",
  },
  uniqueNameColumn: {
    width: "240px",
    minWidth: "90px",
  },
  versionColumn: {
    width: "140px",
    minWidth: "100px",
  },
  typeColumn: {
    width: "90px",
    minWidth: "90px",
    textAlign: "center",
  },
  publisherColumn: {
    width: "200px",
    minWidth: "110px",
  },
  countColumn: {
    width: "120px",
    minWidth: "120px",
    textAlign: "center",
  },
  createdColumn: {
    width: "115px",
    minWidth: "115px",
    textAlign: "center",
  },
  modifiedColumn: {
    width: "125px",
    minWidth: "125px",
    textAlign: "center",
  },
  ellipsis: {
    display: "block",
    overflow: "hidden",
    textOverflow: "ellipsis",
    whiteSpace: "nowrap",
  },
  selectableRow: {
    cursor: "pointer",
    "&:hover": {
      backgroundColor: tokens.colorNeutralBackground1Hover,
    },
    "&:focus-visible": {
      outline: `2px solid ${tokens.colorBrandStroke1}`,
      outlineOffset: "-2px",
    },
  },
  muted: {
    color: tokens.colorNeutralForeground3,
  },
});

export default useStyles;