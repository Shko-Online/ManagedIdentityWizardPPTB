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

const useCertificateDetailsStyles = makeStyles({
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
    width: "min(900px, 100%)",
    maxHeight: "85vh",
    display: "flex",
    flexDirection: "column",
    backgroundColor: tokens.colorNeutralBackground1,
    border: `1px solid ${tokens.colorNeutralStroke1}`,
    boxShadow: tokens.shadow64,
  },
  header: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: tokens.spacingHorizontalM,
    padding: tokens.spacingVerticalM,
    borderBottom: `1px solid ${tokens.colorNeutralStroke2}`,
  },
  body: {
    display: "grid",
    gridTemplateColumns: "minmax(220px, 0.8fr) minmax(0, 1.2fr)",
    overflow: "auto",
  },
  chainPanel: {
    padding: tokens.spacingVerticalM,
    borderRight: `1px solid ${tokens.colorNeutralStroke2}`,
    overflow: "auto",
  },
  detailPanel: {
    padding: tokens.spacingVerticalM,
    minWidth: 0,
    overflow: "auto",
  },
  chainTitle: {
    display: "block",
    marginBottom: tokens.spacingVerticalS,
  },
  chainItem: {
    width: "100%",
    minHeight: "32px",
    display: "flex",
    alignItems: "center",
    gap: tokens.spacingHorizontalS,
    paddingLeft: tokens.spacingHorizontalS,
    paddingRight: tokens.spacingHorizontalS,
    border: 0,
    borderLeft: `2px solid transparent`,
    color: tokens.colorNeutralForeground1,
    backgroundColor: "transparent",
    fontFamily: tokens.fontFamilyBase,
    fontSize: tokens.fontSizeBase300,
    textAlign: "left",
    cursor: "pointer",
  },
  selectedChainItem: {
    borderLeftColor: tokens.colorBrandForeground1,
    backgroundColor: tokens.colorNeutralBackground1Hover,
  },
  chainLabel: {
    overflow: "hidden",
    textOverflow: "ellipsis",
    whiteSpace: "nowrap",
  },
  fields: {
    width: "100%",
    borderCollapse: "collapse",
    tableLayout: "fixed",
  },
  fieldName: {
    width: "36%",
    padding: tokens.spacingVerticalXS,
    color: tokens.colorNeutralForeground2,
    fontWeight: tokens.fontWeightSemibold,
    textAlign: "left",
    verticalAlign: "top",
    borderBottom: `1px solid ${tokens.colorNeutralStroke2}`,
  },
  fieldValue: {
    padding: tokens.spacingVerticalXS,
    overflow: "hidden",
    textOverflow: "ellipsis",
    whiteSpace: "nowrap",
    verticalAlign: "top",
    borderBottom: `1px solid ${tokens.colorNeutralStroke2}`,
  },
  groupName: {
    padding: tokens.spacingVerticalXS,
    color: tokens.colorNeutralForeground2,
    fontWeight: tokens.fontWeightSemibold,
    textAlign: "left",
    verticalAlign: "top",
    borderBottom: `1px solid ${tokens.colorNeutralStroke2}`,
  },
  attributeName: {
    width: "36%",
    padding: tokens.spacingVerticalXS,
    paddingLeft: tokens.spacingHorizontalL,
    color: tokens.colorNeutralForeground2,
    textAlign: "left",
    verticalAlign: "top",
    borderBottom: `1px solid ${tokens.colorNeutralStroke2}`,
  },
  signerNote: {
    color: tokens.colorBrandForeground1,
  },
});

export default useCertificateDetailsStyles;