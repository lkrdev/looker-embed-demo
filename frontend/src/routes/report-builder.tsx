import type { ILookmlModelExplore } from "@looker/sdk/lib/4.0/models";
import { useQueries, useQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import {
  flexRender,
  getCoreRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
  type Cell,
  type ColumnDef,
  type Header,
  type HeaderGroup,
  type PaginationState,
  type Row,
  type SortingState,
  type Table,
} from "@tanstack/react-table";
import { useVirtualizer } from "@tanstack/react-virtual";
import {
  AlertTriangle,
  ArrowUpDown,
  Calendar,
  Check,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  ChevronUp,
  ChevronsLeft,
  ChevronsRight,
  Columns,
  Hash,
  Loader2,
  RotateCcw,
  Search,
  Tag,
  X,
} from "lucide-react";
import React, { useEffect, useMemo, useRef, useState } from "react";
import { PageHeader } from "../components";
import { EXPLORE_PATH } from "../config/constants";
import { lookerBrowserSdk } from "../services/LookerBrowserSDK";
import { buildMeepQueries } from "../utils/meep/meepQueryBuilder2";
import {
  buildMeepExploreData,
  buildMeepGraph,
  getCellObject,
  getFqfnsByLabel,
  getPivotedValue,
  isNumericMeasure,
  mergeMeepResults,
  renderCellValue,
  resolveMeepSelection,
  type TableColumn,
} from "../utils/meep/multiExploreUtils";

declare global {
  interface Window {
    meep?: {
      debug?: Record<string, unknown>;
    };
  }
}

interface SearchParams {
  _debug?: boolean;
}

export const Route = createFileRoute("/report-builder")({
  validateSearch: (search: Record<string, unknown>): SearchParams => ({
    _debug: (search._debug === true || search._debug === "true") ? true : undefined,
  }),
  component: MultiExploreQueryBuilder,
});

function formatTimeframe(tf: string): string {
  const cleaned = tf.replace(/^date_/, "");
  return cleaned
    .split("_")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

interface SelectableItem {
  id: string;
  label: string;
  groupName?: string;
  category: "date" | "dimension" | "measure";
  description?: string | null;
  targets: string[];
  isSelected: boolean;
}

interface FieldSearchBarProps {
  allSelectableItems: SelectableItem[];
  onToggleSelection: (rowFqfns: string[], label?: string) => void;
  onReset: () => void;
}

function FieldSearchBar({
  allSelectableItems,
  onToggleSelection,
  onReset,
}: FieldSearchBarProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const [highlightIndex, setHighlightIndex] = useState(0);

  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const selectedChips = useMemo(
    () => allSelectableItems.filter((i) => i.isSelected),
    [allSelectableItems],
  );

  const filteredItems = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return allSelectableItems;
    return allSelectableItems.filter(
      (item) =>
        item.label.toLowerCase().includes(q) ||
        item.groupName?.toLowerCase().includes(q) ||
        item.description?.toLowerCase().includes(q),
    );
  }, [allSelectableItems, searchQuery]);

  const dateItems = useMemo(
    () => filteredItems.filter((i) => i.category === "date"),
    [filteredItems],
  );
  const dimItems = useMemo(
    () => filteredItems.filter((i) => i.category === "dimension"),
    [filteredItems],
  );
  const measItems = useMemo(
    () => filteredItems.filter((i) => i.category === "measure"),
    [filteredItems],
  );

  const flatNavItems = useMemo(
    () => [...dateItems, ...dimItems, ...measItems],
    [dateItems, dimItems, measItems],
  );

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(e.target as Node)
      ) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setIsOpen(true);
      setHighlightIndex((prev) => Math.min(prev + 1, Math.max(0, flatNavItems.length - 1)));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setIsOpen(true);
      setHighlightIndex((prev) => Math.max(prev - 1, 0));
    } else if (e.key === "Enter") {
      e.preventDefault();
      if (isOpen && flatNavItems[highlightIndex]) {
        const target = flatNavItems[highlightIndex];
        onToggleSelection(
          target.targets,
          target.category === "date" ? target.id : undefined,
        );
      } else {
        setIsOpen(true);
      }
    } else if (e.key === "Escape") {
      setIsOpen(false);
    } else if (e.key === "Backspace" && searchQuery === "" && selectedChips.length > 0) {
      const lastChip = selectedChips[selectedChips.length - 1];
      onToggleSelection(
        lastChip.targets,
        lastChip.category === "date" ? lastChip.id : undefined,
      );
    }
  };

  const renderDropdownRow = (item: SelectableItem) => {
    const idx = flatNavItems.findIndex((i) => i.id === item.id);
    const isHighlighted = idx === highlightIndex;

    let roleColor = "var(--primary)";
    if (item.category === "date") roleColor = "var(--success)";
    if (item.category === "measure") roleColor = "var(--accent)";

    return (
      <div
        key={item.id}
        onClick={() => {
          onToggleSelection(
            item.targets,
            item.category === "date" ? item.id : undefined,
          );
          inputRef.current?.focus();
        }}
        onMouseEnter={() => setHighlightIndex(idx)}
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "0.6rem 0.85rem",
          borderRadius: "10px",
          cursor: "pointer",
          transition: "background-color 0.15s ease",
          backgroundColor: isHighlighted ? "var(--surface-hover)" : "transparent",
          userSelect: "none",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
          <div
            style={{
              width: "18px",
              height: "18px",
              borderRadius: "5px",
              border: `1.5px solid ${item.isSelected ? roleColor : "var(--border-hover)"}`,
              backgroundColor: item.isSelected ? roleColor : "transparent",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "#ffffff",
              transition: "all 0.15s ease",
            }}
          >
            {item.isSelected && <Check size={12} strokeWidth={3} />}
          </div>
          <div>
            <div
              style={{
                fontSize: "0.875rem",
                fontWeight: item.isSelected ? 600 : 500,
                color: "var(--text)",
                display: "flex",
                alignItems: "center",
                gap: "0.5rem",
              }}
            >
              <span>{item.label}</span>
            </div>
            {(item.groupName || item.description) && (
              <div
                style={{
                  fontSize: "0.75rem",
                  color: "var(--text-muted)",
                  marginTop: "0.15rem",
                }}
              >
                {item.groupName ? `${item.groupName}` : ""}
                {item.groupName && item.description ? " · " : ""}
                {item.description ? item.description : ""}
              </div>
            )}
          </div>
        </div>

        <span
          style={{
            fontSize: "0.65rem",
            fontWeight: 700,
            textTransform: "uppercase",
            letterSpacing: "0.05em",
            padding: "0.2rem 0.5rem",
            borderRadius: "6px",
            backgroundColor: "var(--surface)",
            border: "1px solid var(--border)",
            color: roleColor,
          }}
        >
          {item.category}
        </span>
      </div>
    );
  };

  return (
    <div ref={containerRef} style={{ position: "relative", width: "100%" }}>
      <div
        onClick={() => {
          setIsOpen(true);
          inputRef.current?.focus();
        }}
        style={{
          display: "flex",
          flexWrap: "wrap",
          alignItems: "center",
          gap: "0.5rem",
          padding: "0.65rem 1rem",
          backgroundColor: "var(--surface)",
          border: `1.5px solid ${isOpen ? "var(--primary)" : "var(--border)"}`,
          borderRadius: "16px",
          boxShadow: isOpen ? "0 0 0 4px var(--primary-light)" : "var(--shadow-sm)",
          transition: "all 0.2s ease",
          cursor: "text",
        }}
      >
        <Search
          size={18}
          style={{ color: "var(--text-muted)", flexShrink: 0, marginLeft: "2px" }}
        />

        <div
          style={{
            display: "flex",
            flexWrap: "wrap",
            alignItems: "center",
            gap: "0.4rem",
            maxHeight: "130px",
            overflowY: "auto",
          }}
        >
          {selectedChips.map((chip) => {
            let bg = "var(--primary-light)";
            let color = "var(--primary)";
            let IconComp = Tag;

            if (chip.category === "date") {
              bg = "var(--success-light)";
              color = "var(--success)";
              IconComp = Calendar;
            } else if (chip.category === "measure") {
              bg = "var(--accent-light)";
              color = "var(--accent)";
              IconComp = Hash;
            }

            return (
              <span
                key={`chip-${chip.id}`}
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "0.35rem",
                  padding: "0.25rem 0.65rem",
                  borderRadius: "9999px",
                  fontSize: "0.75rem",
                  fontWeight: 600,
                  backgroundColor: bg,
                  color: color,
                  border: `1px solid ${color}`,
                  boxShadow: "0 1px 2px rgba(0,0,0,0.05)",
                  userSelect: "none",
                  transition: "transform 0.1s ease",
                }}
              >
                <IconComp size={12} style={{ opacity: 0.8 }} />
                <span>
                  {chip.groupName && chip.groupName !== "Date"
                    ? `${chip.groupName}: ${chip.label}`
                    : chip.label}
                </span>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    onToggleSelection(
                      chip.targets,
                      chip.category === "date" ? chip.id : undefined,
                    );
                  }}
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    justifyContent: "center",
                    background: "transparent",
                    border: "none",
                    color: "inherit",
                    cursor: "pointer",
                    padding: "1px",
                    borderRadius: "50%",
                    opacity: 0.7,
                  }}
                >
                  <X size={13} />
                </button>
              </span>
            );
          })}
        </div>

        <input
          ref={inputRef}
          type="text"
          placeholder={
            selectedChips.length === 0
              ? "Search fields & groups to build report..."
              : "Add field..."
          }
          value={searchQuery}
          onChange={(e) => {
            setSearchQuery(e.target.value);
            setIsOpen(true);
            setHighlightIndex(0);
          }}
          onFocus={() => setIsOpen(true)}
          onKeyDown={handleKeyDown}
          style={{
            flexGrow: 1,
            minWidth: "200px",
            border: "none",
            outline: "none",
            backgroundColor: "transparent",
            color: "var(--text)",
            fontSize: "0.875rem",
            padding: "0.25rem 0",
          }}
        />

        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "0.35rem",
            marginLeft: "auto",
            paddingLeft: "0.75rem",
            borderLeft: "1px solid var(--border)",
          }}
        >
          {searchQuery && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setSearchQuery("");
              }}
              title="Clear search text"
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                padding: "0.4rem",
                background: "transparent",
                border: "none",
                color: "var(--text-muted)",
                cursor: "pointer",
                borderRadius: "8px",
              }}
            >
              <X size={16} />
            </button>
          )}
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onReset();
            }}
            title="Reset columns to default"
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              padding: "0.4rem",
              background: "var(--surface-hover)",
              border: "1px solid var(--border)",
              borderRadius: "8px",
              color: "var(--text-muted)",
              cursor: "pointer",
              transition: "all 0.2s ease",
            }}
          >
            <RotateCcw size={15} />
          </button>
        </div>
      </div>

      {isOpen && (
        <div
          style={{
            position: "absolute",
            top: "100%",
            left: 0,
            right: 0,
            marginTop: "0.5rem",
            zIndex: 100,
            backgroundColor: "var(--surface)",
            border: "1px solid var(--border)",
            borderRadius: "18px",
            boxShadow: "var(--shadow-xl)",
            maxHeight: "440px",
            overflowY: "auto",
            padding: "0.85rem",
            backdropFilter: "blur(16px)",
          }}
        >
          {flatNavItems.length === 0 ? (
            <div
              style={{
                padding: "2.5rem 1rem",
                textAlign: "center",
                color: "var(--text-muted)",
                fontSize: "0.875rem",
              }}
            >
              No matching fields found for "{searchQuery}".
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
              {dateItems.length > 0 && (
                <div>
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "0.5rem",
                      padding: "0.25rem 0.5rem",
                      fontSize: "0.725rem",
                      fontWeight: 700,
                      color: "var(--success)",
                      textTransform: "uppercase",
                      letterSpacing: "0.06em",
                    }}
                  >
                    <Calendar size={13} />
                    <span>Dates & Timeframes ({dateItems.length})</span>
                  </div>
                  <div style={{ display: "flex", flexDirection: "column", gap: "0.15rem", marginTop: "0.25rem" }}>
                    {dateItems.map(renderDropdownRow)}
                  </div>
                </div>
              )}

              {dimItems.length > 0 && (
                <div>
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "0.5rem",
                      padding: "0.25rem 0.5rem",
                      fontSize: "0.725rem",
                      fontWeight: 700,
                      color: "var(--primary)",
                      textTransform: "uppercase",
                      letterSpacing: "0.06em",
                    }}
                  >
                    <Tag size={13} />
                    <span>Dimensions ({dimItems.length})</span>
                  </div>
                  <div style={{ display: "flex", flexDirection: "column", gap: "0.15rem", marginTop: "0.25rem" }}>
                    {dimItems.map(renderDropdownRow)}
                  </div>
                </div>
              )}

              {measItems.length > 0 && (
                <div>
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "0.5rem",
                      padding: "0.25rem 0.5rem",
                      fontSize: "0.725rem",
                      fontWeight: 700,
                      color: "var(--accent)",
                      textTransform: "uppercase",
                      letterSpacing: "0.06em",
                    }}
                  >
                    <Hash size={13} />
                    <span>Measures & Metrics ({measItems.length})</span>
                  </div>
                  <div style={{ display: "flex", flexDirection: "column", gap: "0.15rem", marginTop: "0.25rem" }}>
                    {measItems.map(renderDropdownRow)}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function TableSkeletonLoader({ columnCount = 5, rowCount = 7 }: { columnCount?: number; rowCount?: number }) {
  return (
    <div style={{ width: "100%", borderTop: "1px solid var(--border)", overflow: "hidden" }}>
      <div
        style={{
          display: "grid",
          gridTemplateColumns: `repeat(${columnCount}, minmax(160px, 1fr))`,
          width: "100%",
        }}
      >
        {Array.from({ length: columnCount }).map((_, i) => (
          <div
            key={`th-skel-${i}`}
            style={{
              padding: "1rem",
              backgroundColor: "var(--surface-hover)",
              borderBottom: "2px solid var(--border)",
              display: "flex",
              alignItems: "center",
            }}
          >
            <div
              className="animate-pulse"
              style={{
                height: "14px",
                backgroundColor: "var(--border)",
                borderRadius: "4px",
                width: i % 2 === 0 ? "80px" : "110px",
                animation: "pulse 1.5s cubic-bezier(0.4, 0, 0.6, 1) infinite",
              }}
            />
          </div>
        ))}

        {Array.from({ length: rowCount * columnCount }).map((_, i) => (
          <div
            key={`td-skel-${i}`}
            style={{
              padding: "1.15rem 1rem",
              borderBottom: "1px solid var(--border)",
              display: "flex",
              alignItems: "center",
            }}
          >
            <div
              className="animate-pulse"
              style={{
                height: "12px",
                backgroundColor: "var(--border)",
                borderRadius: "4px",
                width: i % 3 === 0 ? "120px" : i % 2 === 0 ? "90px" : "70px",
                opacity: 0.6,
                animation: "pulse 1.5s cubic-bezier(0.4, 0, 0.6, 1) infinite",
              }}
            />
          </div>
        ))}
      </div>
      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: .4; }
        }
      `}</style>
    </div>
  );
}

interface ResultTableProps {
  mergedData: any;
  columns: ColumnDef<any>[];
  sortingState: SortingState;
  onSortingChange: React.Dispatch<React.SetStateAction<SortingState>>;
}

function ResultTable({
  mergedData,
  columns,
  sortingState,
  onSortingChange,
}: ResultTableProps) {
  const [pagination, setPagination] = useState<PaginationState>({
    pageIndex: 0,
    pageSize: 25,
  });

  useEffect(() => {
    setPagination((prev) => ({ ...prev, pageIndex: 0 }));
  }, [mergedData]);

  const table = useReactTable({
    data: mergedData?.rows || [],
    columns,
    state: {
      sorting: sortingState,
      pagination,
    },
    onSortingChange,
    onPaginationChange: setPagination,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
  });

  if (mergedData?.rows.length === 0) {
    return (
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          height: "100%",
          minHeight: "240px",
          color: "var(--text-muted)",
          fontSize: "0.9rem",
        }}
      >
        <span>No rows returned for the selected query combination.</span>
      </div>
    );
  }

  return (
    <TableContainer
      table={table}
      totalRowCount={mergedData?.rows.length || 0}
    />
  );
}

function TableContainer({
  table,
  totalRowCount,
}: {
  table: Table<any>;
  totalRowCount: number;
}) {
  const visibleColumns = table.getVisibleLeafColumns();
  const tableContainerRef = useRef<HTMLDivElement>(null);

  const columnVirtualizer = useVirtualizer<HTMLDivElement, HTMLTableCellElement>({
    count: visibleColumns.length,
    estimateSize: (index) => visibleColumns[index].getSize(),
    getScrollElement: () => tableContainerRef.current,
    horizontal: true,
    overscan: 3,
  });

  const virtualColumns = columnVirtualizer.getVirtualItems();

  let virtualPaddingLeft: number | undefined;
  let virtualPaddingRight: number | undefined;

  if (columnVirtualizer && virtualColumns?.length) {
    virtualPaddingLeft = virtualColumns[0]?.start ?? 0;
    virtualPaddingRight =
      columnVirtualizer.getTotalSize() -
      (virtualColumns[virtualColumns.length - 1]?.end ?? 0);
  }

  const { pageIndex, pageSize } = table.getState().pagination;
  const pageCount = table.getPageCount();
  const startRow = totalRowCount === 0 ? 0 : pageIndex * pageSize + 1;
  const endRow = Math.min((pageIndex + 1) * pageSize, totalRowCount);

  useEffect(() => {
    tableContainerRef.current?.scrollTo(0, 0);
  }, [pageIndex, pageSize]);

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%" }}>
      <div
        ref={tableContainerRef}
        style={{
          overflow: "auto",
          position: "relative",
          flexGrow: 1,
          minHeight: "480px",
          maxHeight: "600px",
          width: "100%",
          borderTop: "1px solid var(--border)",
        }}
      >
        <table style={{ display: "grid", width: "100%" }}>
          <TableHead
            columnVirtualizer={columnVirtualizer}
            table={table}
            virtualPaddingLeft={virtualPaddingLeft}
            virtualPaddingRight={virtualPaddingRight}
          />
          <TableBody
            columnVirtualizer={columnVirtualizer}
            table={table}
            tableContainerRef={tableContainerRef}
            virtualPaddingLeft={virtualPaddingLeft}
            virtualPaddingRight={virtualPaddingRight}
          />
        </table>
      </div>

      {/* Pagination Controls Footer Bar */}
      <div
        style={{
          display: "flex",
          flexWrap: "wrap",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "0.85rem 1.25rem",
          backgroundColor: "var(--surface)",
          borderTop: "1px solid var(--border)",
          gap: "1rem",
          fontSize: "0.825rem",
          color: "var(--text-muted)",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "1.5rem", flexWrap: "wrap" }}>
          <span>
            Showing <strong style={{ color: "var(--text)" }}>{startRow}</strong> to{" "}
            <strong style={{ color: "var(--text)" }}>{endRow}</strong> of{" "}
            <strong style={{ color: "var(--text)" }}>{totalRowCount.toLocaleString()}</strong> rows
          </span>
          <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
            <span>Rows per page:</span>
            <select
              value={pageSize}
              onChange={(e) => table.setPageSize(Number(e.target.value))}
              style={{
                padding: "0.25rem 0.6rem",
                borderRadius: "8px",
                backgroundColor: "var(--surface-hover)",
                border: "1px solid var(--border)",
                color: "var(--text)",
                fontSize: "0.825rem",
                fontWeight: 600,
                outline: "none",
                cursor: "pointer",
              }}
            >
              {[10, 25, 50, 100, 250].map((size) => (
                <option key={size} value={size}>
                  {size}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: "0.4rem" }}>
          <span style={{ marginRight: "0.75rem" }}>
            Page <strong style={{ color: "var(--text)" }}>{pageCount === 0 ? 0 : pageIndex + 1}</strong> of{" "}
            <strong style={{ color: "var(--text)" }}>{pageCount}</strong>
          </span>
          <button
            type="button"
            onClick={() => table.setPageIndex(0)}
            disabled={!table.getCanPreviousPage()}
            title="First Page"
            style={{
              padding: "0.35rem",
              borderRadius: "8px",
              backgroundColor: "var(--surface-hover)",
              border: "1px solid var(--border)",
              color: table.getCanPreviousPage() ? "var(--text)" : "var(--border-hover)",
              cursor: table.getCanPreviousPage() ? "pointer" : "not-allowed",
              display: "flex",
              alignItems: "center",
              transition: "all 0.15s ease",
            }}
          >
            <ChevronsLeft size={16} />
          </button>
          <button
            type="button"
            onClick={() => table.previousPage()}
            disabled={!table.getCanPreviousPage()}
            title="Previous Page"
            style={{
              padding: "0.35rem",
              borderRadius: "8px",
              backgroundColor: "var(--surface-hover)",
              border: "1px solid var(--border)",
              color: table.getCanPreviousPage() ? "var(--text)" : "var(--border-hover)",
              cursor: table.getCanPreviousPage() ? "pointer" : "not-allowed",
              display: "flex",
              alignItems: "center",
              transition: "all 0.15s ease",
            }}
          >
            <ChevronLeft size={16} />
          </button>
          <button
            type="button"
            onClick={() => table.nextPage()}
            disabled={!table.getCanNextPage()}
            title="Next Page"
            style={{
              padding: "0.35rem",
              borderRadius: "8px",
              backgroundColor: "var(--surface-hover)",
              border: "1px solid var(--border)",
              color: table.getCanNextPage() ? "var(--text)" : "var(--border-hover)",
              cursor: table.getCanNextPage() ? "pointer" : "not-allowed",
              display: "flex",
              alignItems: "center",
              transition: "all 0.15s ease",
            }}
          >
            <ChevronRight size={16} />
          </button>
          <button
            type="button"
            onClick={() => table.setPageIndex(pageCount - 1)}
            disabled={!table.getCanNextPage()}
            title="Last Page"
            style={{
              padding: "0.35rem",
              borderRadius: "8px",
              backgroundColor: "var(--surface-hover)",
              border: "1px solid var(--border)",
              color: table.getCanNextPage() ? "var(--text)" : "var(--border-hover)",
              cursor: table.getCanNextPage() ? "pointer" : "not-allowed",
              display: "flex",
              alignItems: "center",
              transition: "all 0.15s ease",
            }}
          >
            <ChevronsRight size={16} />
          </button>
        </div>
      </div>
    </div>
  );
}

function TableHead({
  columnVirtualizer,
  table,
  virtualPaddingLeft,
  virtualPaddingRight,
}: {
  columnVirtualizer: any;
  table: Table<any>;
  virtualPaddingLeft: number | undefined;
  virtualPaddingRight: number | undefined;
}) {
  return (
    <thead
      style={{
        display: "grid",
        position: "sticky",
        top: 0,
        zIndex: 10,
      }}
    >
      {table.getHeaderGroups().map((headerGroup) => (
        <TableHeadRow
          columnVirtualizer={columnVirtualizer}
          headerGroup={headerGroup}
          key={headerGroup.id}
          virtualPaddingLeft={virtualPaddingLeft}
          virtualPaddingRight={virtualPaddingRight}
        />
      ))}
    </thead>
  );
}

function TableHeadRow({
  columnVirtualizer,
  headerGroup,
  virtualPaddingLeft,
  virtualPaddingRight,
}: {
  columnVirtualizer: any;
  headerGroup: HeaderGroup<any>;
  virtualPaddingLeft: number | undefined;
  virtualPaddingRight: number | undefined;
}) {
  const virtualColumns = columnVirtualizer.getVirtualItems();
  return (
    <tr key={headerGroup.id} style={{ display: "flex", width: "100%" }}>
      {virtualPaddingLeft ? (
        <th style={{ display: "flex", width: virtualPaddingLeft }} />
      ) : null}
      {virtualColumns.map((virtualColumn: any) => {
        const header = headerGroup.headers[virtualColumn.index];
        return <TableHeadCell key={header.id} header={header} />;
      })}
      {virtualPaddingRight ? (
        <th style={{ display: "flex", width: virtualPaddingRight }} />
      ) : null}
    </tr>
  );
}

function TableHeadCell({ header }: { header: Header<any, unknown> }) {
  const isSortable = header.column.getCanSort();
  return (
    <th
      key={header.id}
      onClick={header.column.getToggleSortingHandler()}
      style={{
        display: "flex",
        width: header.getSize(),
        textAlign: "left",
        padding: "0.85rem 1.15rem",
        color: "var(--text-muted)",
        fontSize: "0.825rem",
        fontWeight: 700,
        cursor: isSortable ? "pointer" : "default",
        userSelect: "none",
        backgroundColor: "var(--surface)",
        borderBottom: "2px solid var(--border)",
        boxSizing: "border-box",
        alignItems: "center",
        transition: "color 0.15s ease",
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: "0.5rem",
          width: "100%",
        }}
      >
        <span>{flexRender(header.column.columnDef.header, header.getContext())}</span>
        {isSortable && (
          <span
            style={{
              color: header.column.getIsSorted() ? "var(--primary)" : "inherit",
              display: "inline-flex",
              alignItems: "center",
              marginLeft: "auto",
            }}
          >
            {header.column.getIsSorted() === "desc" ? (
              <ChevronDown size={14} />
            ) : header.column.getIsSorted() === "asc" ? (
              <ChevronUp size={14} />
            ) : (
              <ArrowUpDown size={14} style={{ opacity: 0.25 }} />
            )}
          </span>
        )}
      </div>
    </th>
  );
}

function TableBody({
  columnVirtualizer,
  table,
  tableContainerRef,
  virtualPaddingLeft,
  virtualPaddingRight,
}: {
  columnVirtualizer: any;
  table: Table<any>;
  tableContainerRef: React.RefObject<HTMLDivElement | null>;
  virtualPaddingLeft: number | undefined;
  virtualPaddingRight: number | undefined;
}) {
  const { rows } = table.getRowModel();

  const rowVirtualizer = useVirtualizer<HTMLDivElement, HTMLTableRowElement>({
    count: rows.length,
    estimateSize: () => 48,
    getScrollElement: () => tableContainerRef.current,
    measureElement:
      typeof window !== "undefined" &&
      navigator.userAgent.indexOf("Firefox") === -1
        ? (element) => element?.getBoundingClientRect().height
        : undefined,
    overscan: 10,
  });

  const virtualRows = rowVirtualizer.getVirtualItems();

  return (
    <tbody
      style={{
        display: "grid",
        height: `${rowVirtualizer.getTotalSize()}px`,
        position: "relative",
      }}
    >
      {virtualRows.map((virtualRow) => {
        const row = rows[virtualRow.index];
        return (
          <TableBodyRow
            columnVirtualizer={columnVirtualizer}
            key={row.id}
            row={row}
            rowVirtualizer={rowVirtualizer}
            virtualPaddingLeft={virtualPaddingLeft}
            virtualPaddingRight={virtualPaddingRight}
            virtualRow={virtualRow}
          />
        );
      })}
    </tbody>
  );
}

function TableBodyRow({
  columnVirtualizer,
  row,
  rowVirtualizer,
  virtualPaddingLeft,
  virtualPaddingRight,
  virtualRow,
}: {
  columnVirtualizer: any;
  row: Row<any>;
  rowVirtualizer: any;
  virtualPaddingLeft: number | undefined;
  virtualPaddingRight: number | undefined;
  virtualRow: any;
}) {
  const visibleCells = row.getVisibleCells();
  const virtualColumns = columnVirtualizer.getVirtualItems();
  const [isHovered, setIsHovered] = useState(false);

  return (
    <tr
      data-index={virtualRow.index}
      ref={(node) => rowVirtualizer.measureElement(node)}
      key={row.id}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      style={{
        display: "flex",
        position: "absolute",
        transform: `translateY(${virtualRow.start}px)`,
        width: "100%",
        borderBottom: "1px solid var(--border)",
        backgroundColor: isHovered ? "var(--surface-hover)" : "transparent",
        transition: "background-color 0.15s ease",
        boxSizing: "border-box",
      }}
    >
      {virtualPaddingLeft ? (
        <td style={{ display: "flex", width: virtualPaddingLeft }} />
      ) : null}
      {virtualColumns.map((vc: any) => {
        const cell = visibleCells[vc.index];
        return <TableBodyCell key={cell.id} cell={cell} />;
      })}
      {virtualPaddingRight ? (
        <td style={{ display: "flex", width: virtualPaddingRight }} />
      ) : null}
    </tr>
  );
}

function TableBodyCell({ cell }: { cell: Cell<any, unknown> }) {
  return (
    <td
      key={cell.id}
      style={{
        display: "flex",
        width: cell.column.getSize(),
        padding: "0.85rem 1.15rem",
        color: "var(--text)",
        fontSize: "0.875rem",
        alignItems: "center",
        boxSizing: "border-box",
      }}
    >
      {flexRender(cell.column.columnDef.cell, cell.getContext())}
    </td>
  );
}

function MultiExploreQueryBuilder() {
  const { _debug = false } = Route.useSearch();
  const [selectedFqfns, setSelectedFqfns] = useState<string[] | null>(null);
  const [sortingState, setSortingState] = useState<SortingState>([]);

  const { data, isLoading, error } = useQuery({
    queryKey: ["meepQueryBuilderData-xxx"],
    queryFn: async () => {
      const modelName = EXPLORE_PATH.split("/")[0] || "embed_demo";
      const response = await lookerBrowserSdk.lookml_model(modelName);
      if (!response.ok) throw new Error(`Failed to fetch model ${modelName}`);

      const exploresPromises: Promise<ILookmlModelExplore | null>[] = [];
      response.value.explores?.forEach((explore) => {
        if (explore.name) {
          exploresPromises.push(
            lookerBrowserSdk
              .lookml_model_explore({
                lookml_model_name: modelName,
                explore_name: explore.name,
              })
              .then((res) => (res.ok ? res.value : null)),
          );
        }
      });

      const rawExplores = await Promise.all(exploresPromises);
      const validExplores = rawExplores.filter(
        (exp): exp is ILookmlModelExplore => !!exp && !!exp.name,
      );

      const exploreData = buildMeepExploreData(validExplores);
      return {
        sortedFields: exploreData.fields,
        meepDate: exploreData.date,
        exploreData,
      };
    },
    refetchOnWindowFocus: "always",
    staleTime: 0,
    gcTime: 0,
  });

  const defaultFields = useMemo(() => {
    if (!data?.exploreData) return [];
    const lookupSpecs = [
      { label: "State", group: "Demographics" },
      { label: "Event Count" },
      { label: "Events Count" },
      { label: "Order Count" },
      { label: "Order Items Count" },
      { label: "Total Sale Price" },
    ];
    const resolved: string[] = [];

    lookupSpecs.forEach((spec) => {
      try {
        const fqfns = getFqfnsByLabel(data.exploreData, spec.label, spec.group);
        resolved.push(...fqfns);
      } catch (e) {
        // Silently skip if not found in current schema/model
      }
    });

    return resolved;
  }, [data]);

  const activeFqfns = selectedFqfns ?? defaultFields;

  const allSelectableItems = useMemo<SelectableItem[]>(() => {
    if (!data) return [];
    const list: SelectableItem[] = [];

    if (data.meepDate) {
      data.meepDate.timeframes.forEach((tf: string) => {
        const id = `__date.${tf}`;
        const isSelected = activeFqfns.includes(id);
        list.push({
          id,
          label: formatTimeframe(tf),
          groupName: "Date",
          category: "date",
          description: "Temporal timeframe filter",
          targets: [id],
          isSelected,
        });
      });
    }

    data.sortedFields.forEach((item: any) => {
      if (item.is_group) {
        item.children.forEach((child: any) => {
          const targets = Array.isArray(child.fqfn) ? child.fqfn : [child.fqfn];
          const isSelected = targets.every((t: string) => activeFqfns.includes(t));
          list.push({
            id: targets[0],
            label: child.label,
            groupName: item.label,
            category: child.meta.category,
            description: child.meta.description,
            targets,
            isSelected,
          });
        });
      } else {
        const targets = Array.isArray(item.fqfn) ? item.fqfn : [item.fqfn];
        const isSelected = targets.every((t: string) => activeFqfns.includes(t));
        list.push({
          id: targets[0],
          label: item.label,
          category: item.meta.category,
          description: item.meta.description,
          targets,
          isSelected,
        });
      }
    });

    return list;
  }, [data, activeFqfns]);

  const selectedChipsCount = useMemo(
    () => allSelectableItems.filter((i) => i.isSelected).length,
    [allSelectableItems],
  );

  const toggleSelection = (rowFqfns: string[], label?: string) => {
    const isDate = label?.startsWith("__date.");
    const targets = isDate && label ? [label] : rowFqfns;

    const current = selectedFqfns ?? defaultFields;
    const allSelected = targets.every((f) => current.includes(f));
    let next: string[];
    if (allSelected) {
      next = current.filter((f) => !targets.includes(f));
    } else {
      next = [...current, ...targets.filter((f) => !current.includes(f))];
    }
    setSelectedFqfns(next);
  };

  const queries = useMemo(() => {
    if (!data?.exploreData || activeFqfns.length === 0) return [];
    try {
      return buildMeepQueries({
        selections: activeFqfns,
        exploreData: data.exploreData,
      });
    } catch (e) {
      console.error(e);
      return [];
    }
  }, [data, activeFqfns]);

  const uniqueExplores = useMemo(() => {
    const set = new Set<string>();
    queries.forEach((q: any) => {
      if (q.view) set.add(q.view);
    });
    return Array.from(set);
  }, [queries]);

  const queryResults = useQueries({
    queries: queries.map((query) => ({
      queryKey: ["meepQueryResult", query],
      queryFn: async () => {
        const response = await lookerBrowserSdk.run_inline_query({
          result_format: "json_bi",
          body: query,
          apply_formatting: true,
        });
        if (!response.ok) {
          throw new Error(response.error?.message || "Failed to run query");
        }
        let val = response.value;
        if (typeof val === "string") {
          val = JSON.parse(val);
        }
        return val as unknown as any[];
      },
      enabled: !!query && activeFqfns.length > 0,
      staleTime: 0,
      gcTime: 0,
      refetchOnWindowFocus: "always",
    })),
  });

  const mergedData = useMemo(() => {
    const allSuccess = queryResults.every((res) => res.status === "success");
    if (!allSuccess) return null;

    const successfulResults = queries
      .map((query, qIdx) => {
        const res = queryResults[qIdx];
        return {
          query,
          response: res.data,
        };
      })
      .filter((item) => !!item.response);

    if (successfulResults.length === 0) return null;
    if (!data?.exploreData) return null;

    try {
      return mergeMeepResults(successfulResults, data.exploreData);
    } catch (e) {
      console.error("Error merging results", e);
      return null;
    }
  }, [queryResults, queries, data]);

  const columns = useMemo((): ColumnDef<any>[] => {
    if (!mergedData || !data) return [];

    const fieldLabelMap = new Map<string, string>();
    if (data.meepDate) {
      data.meepDate.timeframes.forEach((tf) => {
        const key = `__date.${tf}`;
        fieldLabelMap.set(key, formatTimeframe(tf));
      });
    }
    data.sortedFields.forEach((item) => {
      if (item.is_group) {
        item.children.forEach((child) => {
          const childFqfns = Array.isArray(child.fqfn)
            ? child.fqfn
            : [child.fqfn];
          childFqfns.forEach((fqfn) => {
            fieldLabelMap.set(fqfn as string, child.label);
          });
        });
      } else {
        const fqfns = Array.isArray(item.fqfn) ? item.fqfn : [item.fqfn];
        fqfns.forEach((fqfn) => {
          fieldLabelMap.set(fqfn, item.label);
        });
      }
    });

    const tableCols: TableColumn[] = [];
    mergedData.metadata.fields.dimensions.forEach((dim) => {
      tableCols.push({
        id: dim.name,
        label: dim.label || dim.name,
        isPivot: false,
      });
    });

    if (mergedData.metadata.pivots.length === 0) {
      mergedData.metadata.fields.measures.forEach((meas) => {
        tableCols.push({
          id: meas.name,
          label: meas.label || meas.name,
          isPivot: false,
        });
      });
    } else {
      mergedData.metadata.pivots.forEach((pivotInfo) => {
        mergedData.metadata.fields.measures.forEach((meas) => {
          const headerLabel = `${pivotInfo.key} - ${meas.label || meas.name}`;
          tableCols.push({
            id: `${meas.name}::${pivotInfo.key}`,
            label: headerLabel,
            isPivot: true,
            measureName: meas.name,
            pivotData: pivotInfo.data,
          });
        });
      });
    }

    return tableCols.map((col) => {
      const cleanLabel = fieldLabelMap.get(col.id) || col.label;
      return {
        id: col.id,
        accessorFn: (row) => {
          if (col.isPivot && col.measureName && col.pivotData) {
            const isNumeric = isNumericMeasure({ name: col.measureName });
            return getPivotedValue(
              row,
              col.measureName,
              col.pivotData,
              mergedData.metadata.fields.pivots,
              isNumeric,
            );
          }
          return row[col.id]?.value;
        },
        header: cleanLabel,
        cell: (info) => {
          const val = renderCellValue(
            info.row.original,
            col,
            mergedData.metadata.fields.pivots,
          );
          const cellObj = getCellObject(
            info.row.original,
            col,
            mergedData.metadata.fields.pivots,
          );
          if (cellObj && cellObj.warning) {
            return (
              <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                <span>{val}</span>
                <span
                  title={cellObj.warning}
                  style={{
                    color: "var(--warning)",
                    cursor: "help",
                    display: "inline-flex",
                    alignItems: "center",
                  }}
                >
                  <AlertTriangle size={14} />
                </span>
              </div>
            );
          }
          return val;
        },
        size: 180,
      };
    });
  }, [mergedData, data]);

  if (_debug && data) {
    const fullGraph = buildMeepGraph(data.sortedFields, data.meepDate);
    const resolvedQueries = resolveMeepSelection(
      activeFqfns,
      data.sortedFields,
      data.meepDate,
    );
    const debugData = {
      warnings: data.sortedFields._warnings || [],
      selected_fqfn: activeFqfns,
      select_identifiers: activeFqfns,
      resolvedQueries,
      fullGraph,
    };
    console.log(debugData);
    window.meep = window.meep || {};
    window.meep.debug = debugData;
  }

  const isQueryLoading = queryResults.some((res) => res.isLoading);
  const queryError = queryResults.find((res) => res.error);

  return (
    <div className="page-container">
      <PageHeader
        title="Report Builder"
        subtitle="Build custom integrated reports by searching and combining fields across multiple explores."
      />

      <div style={{ display: "flex", flexDirection: "column", gap: "0.85rem" }}>
        {data ? (
          <>
            <FieldSearchBar
              allSelectableItems={allSelectableItems}
              onToggleSelection={toggleSelection}
              onReset={() => {
                setSelectedFqfns(null);
                setSortingState([]);
              }}
            />
            {queries.length > 0 && (
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "0.75rem",
                  flexWrap: "wrap",
                  paddingLeft: "0.35rem",
                }}
              >
                <span
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "0.4rem",
                    fontSize: "0.8rem",
                    color: "var(--text-muted)",
                    padding: "0.35rem 0.85rem",
                    borderRadius: "9999px",
                    backgroundColor: "var(--surface)",
                    border: "1px solid var(--border)",
                    boxShadow: "var(--shadow-sm)",
                    fontWeight: 500,
                  }}
                >
                  <Columns size={13} style={{ color: "var(--primary)" }} />
                  <span>
                    Querying across{" "}
                    <strong style={{ color: "var(--text)", fontWeight: 700 }}>
                      {uniqueExplores.length}
                    </strong>{" "}
                    explore{uniqueExplores.length === 1 ? "" : "s"}
                  </span>
                  {uniqueExplores.length > 0 && (
                    <span style={{ color: "var(--primary)", fontWeight: 600 }}>
                      ({uniqueExplores.join(", ")})
                    </span>
                  )}
                </span>

                <span
                  style={{
                    fontSize: "0.8rem",
                    color: "var(--text-muted)",
                    padding: "0.35rem 0.85rem",
                    borderRadius: "9999px",
                    backgroundColor: "var(--surface)",
                    border: "1px solid var(--border)",
                    boxShadow: "var(--shadow-sm)",
                  }}
                >
                  Selected fields:{" "}
                  <strong style={{ color: "var(--text)", fontWeight: 700 }}>
                    {selectedChipsCount}
                  </strong>
                </span>
              </div>
            )}
          </>
        ) : (
          <div
            style={{
              padding: "1.25rem",
              backgroundColor: "var(--surface)",
              border: "1px solid var(--border)",
              borderRadius: "16px",
              display: "flex",
              alignItems: "center",
              gap: "0.75rem",
              color: "var(--text-muted)",
              fontSize: "0.875rem",
            }}
          >
            <Loader2
              size={18}
              className="animate-spin"
              style={{ color: "var(--primary)" }}
            />
            <span>Loading field dictionary and model metadata...</span>
          </div>
        )}
      </div>

      {sortingState.length > 0 && (
        <div style={{ display: "flex", gap: "0.5rem", alignItems: "center" }}>
          <button
            onClick={() => setSortingState([])}
            style={{
              display: "flex",
              alignItems: "center",
              gap: "0.4rem",
              padding: "0.5rem 0.85rem",
              backgroundColor: "var(--error-light)",
              border: "1px solid var(--error)",
              borderRadius: "10px",
              color: "var(--error)",
              fontSize: "0.8rem",
              fontWeight: 600,
              cursor: "pointer",
              transition: "all 0.2s ease",
            }}
          >
            <X size={14} />
            <span>Clear Active Sorts ({sortingState.length})</span>
          </button>
        </div>
      )}

      {(isLoading || isQueryLoading) && (
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "0.6rem",
            color: "var(--primary)",
            fontSize: "0.85rem",
            fontWeight: 600,
          }}
        >
          <Loader2
            size={16}
            className="animate-spin"
            style={{ animation: "spin 1s linear infinite" }}
          />
          <span>Executing Looker queries across explores...</span>
        </div>
      )}

      {error ? (
        <div
          style={{
            padding: "2.5rem",
            backgroundColor: "var(--error-light)",
            border: "1px solid var(--error)",
            borderRadius: "20px",
            color: "var(--error)",
            textAlign: "center",
          }}
        >
          <p style={{ fontWeight: 700, fontSize: "1.1rem", margin: 0 }}>
            Error fetching model metadata
          </p>
          <p style={{ fontSize: "0.9rem", marginTop: "0.5rem", opacity: 0.8 }}>
            {(error as Error).message}
          </p>
        </div>
      ) : activeFqfns.length === 0 ? (
        <div
          style={{
            flexGrow: 1,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            border: "2px dashed var(--border)",
            borderRadius: "20px",
            color: "var(--text-muted)",
            minHeight: "340px",
            gap: "1rem",
            padding: "3rem",
            backgroundColor: "var(--surface)",
          }}
        >
          <Columns size={48} style={{ opacity: 0.2 }} />
          <div style={{ textAlign: "center" }}>
            <p
              style={{
                margin: 0,
                fontWeight: 600,
                fontSize: "1rem",
                color: "var(--text)",
              }}
            >
              No report columns selected
            </p>
            <p style={{ margin: "0.25rem 0 0 0", fontSize: "0.85rem" }}>
              Use the search bar above to select fields across explores and
              generate your integrated report.
            </p>
          </div>
        </div>
      ) : queryError ? (
        <div
          style={{
            padding: "2.5rem",
            backgroundColor: "var(--error-light)",
            border: "1px solid var(--error)",
            borderRadius: "20px",
            color: "var(--error)",
            textAlign: "center",
          }}
        >
          <p style={{ fontWeight: 700, fontSize: "1.1rem", margin: 0 }}>
            Error executing Looker BI queries
          </p>
          <p style={{ fontSize: "0.9rem", marginTop: "0.5rem", opacity: 0.8 }}>
            {(queryError.error as Error).message}
          </p>
        </div>
      ) : (
        <div
          style={{
            flexGrow: 1,
            backgroundColor: "var(--surface)",
            border: "1px solid var(--border)",
            borderRadius: "20px",
            overflow: "hidden",
            display: "flex",
            flexDirection: "column",
            boxShadow: "var(--shadow-md)",
            transition: "all 0.2s ease",
          }}
        >
          <div style={{ flexGrow: 1, overflow: "auto" }}>
            {(!mergedData || isQueryLoading) &&
            (!mergedData || mergedData.rows.length === 0) ? (
              <TableSkeletonLoader
                columnCount={activeFqfns.length || 4}
                rowCount={8}
              />
            ) : (
              <ResultTable
                mergedData={mergedData}
                columns={columns}
                sortingState={sortingState}
                onSortingChange={setSortingState}
              />
            )}
          </div>
        </div>
      )}

      <style>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}
