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
  Dismiss24Regular,
} from "@fluentui/react-icons";
import {
  Badge,
  Button,
  Input,
  Table,
  TableBody,
  TableCell,
  TableHeader,
  TableHeaderCell,
  TableRow,
  Text,
} from "@fluentui/react-components";
import {
  type SolutionSortKey,
  formatSolutionDate,
} from "../services/pluginPackageInspector";
import EllipsisText from "./EllipsisText";
import { type SolutionRecord } from "../services/pluginPackageService";
import { useState } from "react";
import useStyles from "../styles/SolutionPickerDialog";

type SolutionPickerDialogProps = {
  solutions: SolutionRecord[];
  selectedSolutionId: string;
  onClose: () => void;
  onSelect: (solutionId: string) => void;
};

export const SolutionPickerDialog: React.FC<SolutionPickerDialogProps> = ({
  solutions,
  selectedSolutionId,
  onClose,
  onSelect,
}) => {
  const styles = useStyles();
  const [filter, setFilter] = useState("");
  const [pendingSolutionId, setPendingSolutionId] =
    useState(selectedSolutionId);
  const [sortKey, setSortKey] = useState<SolutionSortKey>("uniqueName");
  const [sortDescending, setSortDescending] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 10;
  const normalizedFilter = filter.trim().toLocaleLowerCase();
  const visibleSolutions = solutions
    .filter(
      (solution) =>
        !normalizedFilter ||
        [
          solution.uniqueName,
          solution.version,
          solution.isManaged ? "managed" : "unmanaged",
          solution.publisher,
          String(solution.pluginCount),
          String(solution.pluginPackageCount),
          formatSolutionDate(solution.createdOn),
          formatSolutionDate(solution.modifiedOn),
        ].some((value) => value.toLocaleLowerCase().includes(normalizedFilter)),
    )
    .slice()
    .sort((left, right) => {
      const leftValue =
        sortKey === "isManaged"
          ? left.isManaged
            ? "managed"
            : "unmanaged"
          : String(left[sortKey]);
      const rightValue =
        sortKey === "isManaged"
          ? right.isManaged
            ? "managed"
            : "unmanaged"
          : String(right[sortKey]);
      const comparison = leftValue.localeCompare(rightValue, undefined, {
        numeric: true,
        sensitivity: "base",
      });
      return sortDescending ? -comparison : comparison;
    });
  const pageCount = Math.max(1, Math.ceil(visibleSolutions.length / pageSize));
  const pagedSolutions = visibleSolutions.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize,
  );
  const sortSolutionsBy = (nextSortKey: SolutionSortKey) => {
    if (sortKey === nextSortKey) {
      setSortDescending((descending) => !descending);
      setCurrentPage(1);
      return;
    }

    setSortKey(nextSortKey);
    setSortDescending(false);
    setCurrentPage(1);
  };
  const sortIcon = (columnSortKey: SolutionSortKey) =>
    sortKey === columnSortKey
      ? sortDescending
        ? <ArrowSortDown24Regular />
        : <ArrowSortUp24Regular />
      : undefined;

  return (
    <div className={styles.overlay} role="presentation" onMouseDown={onClose}>
      <section
        className={styles.popup}
        role="dialog"
        aria-modal="true"
        aria-labelledby="solution-picker-title"
        onMouseDown={(event) => event.stopPropagation()}
      >
        <div className={styles.header}>
          <Text id="solution-picker-title" weight="semibold" size={400}>
            Select solution
          </Text>
          <Input
            className={styles.filterInput}
            aria-label="Filter solutions"
            placeholder="Filter solutions"
            value={filter}
            onChange={(_event, data) => {
              setFilter(data.value);
              setCurrentPage(1);
            }}
          />
          <Button
            appearance="subtle"
            icon={<Dismiss24Regular />}
            aria-label="Close solution picker"
            onClick={onClose}
          />
        </div>
        <div className={styles.tableContainer}>
          <Table className={styles.table} size="small" aria-label="Solutions">
            <TableHeader className={styles.tableHeader}>
              <TableRow>
                <TableHeaderCell className={styles.checkboxColumn} />
                {(
                  [
                    "uniqueName",
                    "version",
                    "publisher",
                    "isManaged",
                    "pluginCount",
                    "pluginPackageCount",
                    "createdOn",
                    "modifiedOn",
                  ] as SolutionSortKey[]
                ).map((columnSortKey) => {
                  const labels: Record<SolutionSortKey, string> = {
                    uniqueName: "Name",
                    version: "Version",
                    isManaged: "Type",
                    publisher: "Publisher",
                    createdOn: "Created",
                    modifiedOn: "Modified",
                    pluginCount: "Plugins",
                    pluginPackageCount: "Packages",
                  };
                  return (
                    <TableHeaderCell
                      key={columnSortKey}
                      className={
                        columnSortKey === "isManaged"
                          ? styles.typeColumn
                          : columnSortKey === "createdOn"
                            ? styles.createdColumn
                            : columnSortKey === "modifiedOn"
                              ? styles.modifiedColumn
                              : columnSortKey === "pluginCount" ||
                                  columnSortKey === "pluginPackageCount"
                                ? styles.countColumn
                                : columnSortKey === "version"
                                  ? styles.versionColumn
                                  : columnSortKey === "publisher"
                                    ? styles.publisherColumn
                                    : styles.uniqueNameColumn
                      }
                    >
                      <Button
                        className={styles.headerButton}
                        appearance="subtle"
                        onClick={() => sortSolutionsBy(columnSortKey)}
                      >
                        <span className={styles.sortIconSlot} aria-hidden="true" />
                        {labels[columnSortKey]}
                        <span className={styles.sortIconSlot}>
                          {sortIcon(columnSortKey)}
                        </span>
                      </Button>
                    </TableHeaderCell>
                  );
                })}
              </TableRow>
            </TableHeader>
            <TableBody>
              {pagedSolutions.map((solution) => (
                <TableRow
                  key={solution.id}
                  className={styles.selectableRow}
                  tabIndex={0}
                  onClick={() => setPendingSolutionId(solution.id)}
                  onKeyDown={(event) => {
                    if (event.key === "Enter" || event.key === " ") {
                      event.preventDefault();
                      setPendingSolutionId(solution.id);
                    }
                  }}
                >
                  <TableCell className={styles.checkboxColumn}>
                    <input
                      type="checkbox"
                      aria-label={`Select ${solution.uniqueName}`}
                      checked={pendingSolutionId === solution.id}
                      onClick={(event) => event.stopPropagation()}
                      onChange={() =>
                        setPendingSolutionId(
                          pendingSolutionId === solution.id ? "" : solution.id,
                        )
                      }
                    />
                  </TableCell>
                  <TableCell className={styles.uniqueNameColumn}>
                    <EllipsisText
                      className={styles.ellipsis}
                      value={solution.uniqueName}
                    />
                  </TableCell>
                  <TableCell className={styles.versionColumn}>
                    <EllipsisText
                      className={styles.ellipsis}
                      value={solution.version}
                    />
                  </TableCell>

                  <TableCell className={styles.publisherColumn}>
                    <EllipsisText
                      className={styles.ellipsis}
                      value={solution.publisher}
                    />
                  </TableCell>
                  <TableCell className={styles.typeColumn}>
                    <Badge
                      appearance="tint"
                      color={solution.isManaged ? "brand" : "informative"}
                      title={solution.isManaged ? "Managed" : "Unmanaged"}
                    >
                      {solution.isManaged ? "M" : "U"}
                    </Badge>
                  </TableCell>
                  <TableCell className={styles.countColumn}>
                    {solution.pluginCount}
                  </TableCell>
                  <TableCell className={styles.countColumn}>
                    {solution.pluginPackageCount}
                  </TableCell>
                  <TableCell className={styles.createdColumn}>
                    {formatSolutionDate(solution.createdOn)}
                  </TableCell>
                  <TableCell className={styles.modifiedColumn}>
                    {formatSolutionDate(solution.modifiedOn)}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          {visibleSolutions.length === 0 && (
            <Text className={styles.muted}>No solutions match the filter.</Text>
          )}
        </div>
        <div className={styles.footer}>
          <div className={styles.pagination}>
            <Text className={styles.muted}>
              Page {currentPage} of {pageCount}
            </Text>
            <Button
              appearance="subtle"
              onClick={() => setCurrentPage((page) => Math.max(1, page - 1))}
              disabled={currentPage === 1}
            >
              Previous
            </Button>
            <Button
              appearance="subtle"
              onClick={() =>
                setCurrentPage((page) => Math.min(pageCount, page + 1))
              }
              disabled={currentPage === pageCount}
            >
              Next
            </Button>
          </div>
          <Button
            appearance={pendingSolutionId ? "secondary" : "primary"}
            onClick={() => {
              onSelect(pendingSolutionId);
              onClose();
            }}
          >
            {pendingSolutionId
              ? `Select ${solutions.find((solution) => solution.id === pendingSolutionId)?.uniqueName ?? "solution"}`
              : "Select All Solutions"}
          </Button>
        </div>
      </section>
    </div>
  );
};
