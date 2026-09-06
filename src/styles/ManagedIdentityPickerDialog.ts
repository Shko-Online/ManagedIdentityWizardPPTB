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
    width: "min(1000px, 100%)",
    maxHeight: "min(760px, 90vh)",
    overflow: "hidden",
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
  filterInput: {
    width: "280px",
    marginLeft: "auto",
  },
  messages: {
    display: "flex",
    flexDirection: "column",
    gap: tokens.spacingVerticalS,
    paddingLeft: tokens.spacingHorizontalM,
    paddingRight: tokens.spacingHorizontalM,
    flexShrink: 0,
  },
  tableContainer: {
    overflow: "auto",
    padding: tokens.spacingVerticalM,
  },
  table: {
    minWidth: "940px",
    tableLayout: "fixed",
    width: "100%",
  },
  tableHeader: {
    borderBottom: `3px solid ${tokens.colorNeutralStroke1}`,
    "& th": {
      textAlign: "center",
    },
  },
  checkboxColumn: {
    width: "44px",
  },
  nameColumn: {
    width: "230px",
    minWidth: "150px",
  },
  guidColumn: {
    width: "280px",
    minWidth: "220px",
    fontFamily: tokens.fontFamilyMonospace,
    fontSize: tokens.fontSizeBase200,
  },
  choiceColumn: {
    width: "170px",
    minWidth: "140px",
  },
  statusColumn: {
    width: "110px",
    minWidth: "100px",
    textAlign: "center",
  },
  headerButton: {
    width: "100%",
    justifyContent: "center",
    fontWeight: 400,
    padding: 0,
    minWidth: 0,
  },
  sortIconSlot: {
    display: "inline-flex",
    width: "16px",
    justifyContent: "center",
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
  ellipsis: {
    display: "block",
    overflow: "hidden",
    textOverflow: "ellipsis",
    whiteSpace: "nowrap",
  },
  footer: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: tokens.spacingHorizontalXS,
    flexWrap: "wrap",
    padding: `${tokens.spacingVerticalM} ${tokens.spacingHorizontalM}`,
    borderTop: `1px solid ${tokens.colorNeutralStroke2}`,
  },
  pagination: {
    display: "flex",
    alignItems: "center",
    gap: tokens.spacingHorizontalXS,
    flexWrap: "wrap",
  },
  footerActions: {
    display: "flex",
    alignItems: "center",
    gap: tokens.spacingHorizontalXS,
    marginLeft: "auto",
  },
  muted: {
    color: tokens.colorNeutralForeground3,
  },
});

export default useStyles;
