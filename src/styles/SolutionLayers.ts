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
  section: {
    display: "flex",
    flexDirection: "column",
    gap: tokens.spacingVerticalS,
    borderTop: `1px solid ${tokens.colorNeutralStroke2}`,
    paddingTop: tokens.spacingVerticalM,
  },
  sectionHeader: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: tokens.spacingHorizontalM,
  },
  heading: {
    color: tokens.colorNeutralForeground2,
    fontWeight: tokens.fontWeightSemibold,
  },
  tableContainer: {
    overflowX: "auto",
    maxHeight: "220px",
    overflowY: "auto",
  },
  table: {
    tableLayout: "fixed",
    width: "100%",
    minWidth: "460px",
  },
  tableHeader: {
    "& th": {
      textAlign: "left",
    },
  },
  orderColumn: {
    width: "70px",
    minWidth: "70px",
    textAlign: "center",
  },
  solutionColumn: {
    width: "200px",
    minWidth: "140px",
  },
  publisherColumn: {
    width: "160px",
    minWidth: "120px",
  },
  overwriteColumn: {
    width: "150px",
    minWidth: "130px",
    whiteSpace: "nowrap",
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

export default useStyles;
