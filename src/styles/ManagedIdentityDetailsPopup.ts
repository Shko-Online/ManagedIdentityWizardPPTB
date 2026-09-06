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

const useManagedIdentityDetailsStyles = makeStyles({
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
    padding: tokens.spacingVerticalM,
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
    gridTemplateColumns: "minmax(170px, 220px) minmax(0, 1fr) 48px",
    alignItems: "stretch",
    rowGap: tokens.spacingVerticalS,
    columnGap: tokens.spacingHorizontalM,
  },
  label: {
    display: "flex",
    alignItems: "center",
    color: tokens.colorNeutralForeground2,
    fontWeight: tokens.fontWeightSemibold,
    minHeight: "32px",
    lineHeight: "1.4",
  },
  control: {
    width: "100%",
    minWidth: 0,
    minHeight: "32px",
  },
  monospaceInput: {
    fontFamily: tokens.fontFamilyMonospace,
  },
  actionCell: {
    display: "flex",
    alignItems: "center",
    justifyContent: "flex-end",
    minWidth: "40px",
    minHeight: "32px",
  },
  tabs: {
    borderTop: `1px solid ${tokens.colorNeutralStroke2}`,
    paddingTop: tokens.spacingVerticalS,
  },
  associatedList: {
    maxHeight: "220px",
    overflowY: "auto",
  },
  versionColumn: {
    width: "120px",
    minWidth: "120px",
  },
  typeColumn: {
    width: "70px",
    minWidth: "70px",
    textAlign: "center",
  },
  ellipsis: {
    display: "block",
    overflow: "hidden",
    textOverflow: "ellipsis",
    whiteSpace: "nowrap",
  },
  muted: {
    color: tokens.colorNeutralForeground3,
  },
});

export default useManagedIdentityDetailsStyles;
