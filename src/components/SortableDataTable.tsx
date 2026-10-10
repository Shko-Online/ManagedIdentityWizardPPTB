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
  ArrowSortDown24Regular,
  ArrowSortUp24Regular,
} from "@fluentui/react-icons";
import {
  Button,
  Table,
  TableBody,
  TableCell,
  TableHeader,
  TableHeaderCell,
  TableRow,
} from "@fluentui/react-components";
import type { ReactNode } from "react";

export type SortableColumn<RowT, SortKey extends string> = {
  key: SortKey;
  label: string;
  className?: string;
  sortable?: boolean;
  renderCell: (row: RowT) => ReactNode;
};

type SortableDataTableProps<RowT, SortKey extends string> = {
  rows: RowT[];
  columns: SortableColumn<RowT, SortKey>[];
  ariaLabel: string;
  getRowKey: (row: RowT) => string | number;
  tableClassName?: string;
  tableContainerClassName?: string;
  tableHeaderClassName?: string;
  rowClassName?: (row: RowT) => string | undefined;
  sortKey?: SortKey | null;
  sortDescending?: boolean;
  onSort?: (sortKey: SortKey) => void;
  sortButtonClassName?: string;
  sortIconSlotClassName?: string;
  renderActions?: (row: RowT) => ReactNode;
  actionsColumnClassName?: string;
  actionsHeaderLabel?: string;
};

export function SortableDataTable<RowT, SortKey extends string>({
  rows,
  columns,
  ariaLabel,
  getRowKey,
  tableClassName,
  tableContainerClassName,
  tableHeaderClassName,
  rowClassName,
  sortKey,
  sortDescending,
  onSort,
  sortButtonClassName,
  sortIconSlotClassName,
  renderActions,
  actionsColumnClassName,
  actionsHeaderLabel = "Actions",
}: SortableDataTableProps<RowT, SortKey>) {
  const renderSortIcon = (columnKey: SortKey) => {
    if (sortKey !== columnKey) {
      return undefined;
    }

    return sortDescending ? <ArrowSortDown24Regular /> : <ArrowSortUp24Regular />;
  };

  return (
    <div className={tableContainerClassName}>
      <Table className={tableClassName} size="small" aria-label={ariaLabel}>
        <TableHeader className={tableHeaderClassName}>
          <TableRow>
            {columns.map((column) => {
              const sortable = column.sortable && onSort !== undefined;

              return (
                <TableHeaderCell key={column.key as string} className={column.className}>
                  {sortable ? (
                    <Button
                      className={sortButtonClassName}
                      appearance="subtle"
                      onClick={() => onSort(column.key)}
                    >
                      <span className={sortIconSlotClassName} aria-hidden="true" />
                      {column.label}
                      <span className={sortIconSlotClassName}>{renderSortIcon(column.key)}</span>
                    </Button>
                  ) : (
                    column.label
                  )}
                </TableHeaderCell>
              );
            })}
            {renderActions && (
              <TableHeaderCell className={actionsColumnClassName}>
                {actionsHeaderLabel}
              </TableHeaderCell>
            )}
          </TableRow>
        </TableHeader>
        <TableBody>
          {rows.map((row) => (
            <TableRow
              key={String(getRowKey(row))}
              className={rowClassName ? rowClassName(row) : undefined}
            >
              {columns.map((column) => (
                <TableCell key={String(getRowKey(row)) + "-" + String(column.key)} className={column.className}>
                  {column.renderCell(row)}
                </TableCell>
              ))}
              {renderActions && (
                <TableCell className={actionsColumnClassName}>
                  {renderActions(row)}
                </TableCell>
              )}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}

export default SortableDataTable;
