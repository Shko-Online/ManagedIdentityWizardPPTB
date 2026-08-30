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
    width: "min(640px, 100%)",
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
    display: "flex",
    flexDirection: "column",
    gap: tokens.spacingVerticalM,
    padding: tokens.spacingVerticalM,
    minWidth: 0,
    overflow: "auto",
  },
  fields: {
    display: "grid",
    gridTemplateColumns: "minmax(140px, 0.4fr) minmax(0, 1fr) 40px",
    alignItems: "center",
    rowGap: tokens.spacingVerticalS,
    columnGap: tokens.spacingHorizontalM,
  },
  label: {
    color: tokens.colorNeutralForeground2,
    fontWeight: tokens.fontWeightSemibold,
  },
  control: {
    width: "100%",
    minWidth: 0,
  },
  monospaceInput: {
    fontFamily: tokens.fontFamilyMonospace,
  },
  actionCell: {
    display: "flex",
    alignItems: "center",
    justifyContent: "flex-end",
    minWidth: "40px",
  },
});

export default useManagedIdentityDetailsStyles;
