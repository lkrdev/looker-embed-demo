import type { ILookmlModelExplore } from "@looker/sdk/lib/4.0/models";
import { useQueries, useQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import {
  flexRender,
  getCoreRowModel,
  getSortedRowModel,
  useReactTable,
  type Cell,
  type ColumnDef,
  type Header,
  type HeaderGroup,
  type Row,
  type SortingState,
  type Table,
} from "@tanstack/react-table";
import { useVirtualizer } from "@tanstack/react-virtual";
import {
  AlertTriangle,
  ArrowUpDown,
  ChevronDown,
  ChevronUp,
  Columns,
  Loader2,
  RotateCcw,
  Search,
  X,
} from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
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

interface UIFieldRow {
  label: string;
  uiLabel?: string;
  meta: {
    category: "dimension" | "measure";
    description?: string | null;
  };
  is_group?: false;
  fqfns: string[];
}

interface UIGroupField {
  label: string;
  is_group: true;
  category: "dimension" | "measure";
  children: UIFieldRow[];
}

type UIRenderItem = UIFieldRow | UIGroupField;

function formatTimeframe(tf: string): string {
  const cleaned = tf.replace(/^date_/, "");
  return cleaned
    .split("_")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

function filterUIFields(fields: UIRenderItem[], query: string): UIRenderItem[] {
  if (!query || !query.trim()) return fields;
  const lower = query.trim().toLowerCase();

  const match = (item: UIFieldRow) =>
    item.label.toLowerCase().includes(lower) ||
    item.meta.description?.toLowerCase().includes(lower);

  const result: UIRenderItem[] = [];
  fields.forEach((item) => {
    if (item.is_group) {
      if (item.label.toLowerCase().includes(lower)) {
        result.push(item);
      } else {
        const matchingChildren = item.children.filter(match);
        if (matchingChildren.length > 0) {
          result.push({ ...item, children: matchingChildren });
        }
      }
    } else if (match(item)) {
      result.push(item);
    }
  });
  return result;
}

interface FieldSelectorProps {
  sortedFields: any[];
  meepDate: any;
  selectedFqfns: string[];
  onToggleSelection: (fqfns: string[], label?: string) => void;
  onReset: () => void;
}

function FieldSelector({
  sortedFields,
  meepDate,
  selectedFqfns,
  onToggleSelection,
  onReset,
}: FieldSelectorProps) {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  const dropdownRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node) &&
        buttonRef.current &&
        !buttonRef.current.contains(event.target as Node)
      ) {
        setIsDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const selectedColumnsCount = (() => {
    let count = 0;
    if (meepDate) {
      meepDate.timeframes.forEach((tf: string) => {
        if (selectedFqfns.includes(`__date.${tf}`)) {
          count++;
        }
      });
    }
    sortedFields.forEach((item) => {
      if (item.is_group) {
        item.children.forEach((child: any) => {
          const childFqfns = Array.isArray(child.fqfn)
            ? child.fqfn
            : [child.fqfn];
          const hasSelected = childFqfns.some((f: any) =>
            selectedFqfns.includes(f as string),
          );
          if (hasSelected) count++;
        });
      } else {
        const fqfns = Array.isArray(item.fqfn) ? item.fqfn : [item.fqfn];
        const hasSelected = fqfns.some((f: any) =>
          selectedFqfns.includes(f as string),
        );
        if (hasSelected) count++;
      }
    });
    return count;
  })();

  const fieldsList: UIRenderItem[] = (() => {
    const mappedFields: UIRenderItem[] = sortedFields.map((item) => {
      if (item.is_group) {
        return {
          label: item.label,
          is_group: true,
          category: item.category,
          children: item.children.map((child: any) => ({
            label: child.label,
            meta: {
              category: child.meta.category,
              description: child.meta.description,
            },
            fqfns: Array.isArray(child.fqfn) ? child.fqfn : [child.fqfn],
          })),
        };
      }
      return {
        label: item.label,
        meta: {
          category: item.meta.category,
          description: item.meta.description,
        },
        fqfns: Array.isArray(item.fqfn) ? item.fqfn : [item.fqfn],
      };
    });

    const filtered = filterUIFields(mappedFields, searchQuery);

    if (meepDate) {
      const dateGroup: UIGroupField = {
        label: "Date",
        is_group: true,
        category: "dimension",
        children: meepDate.timeframes.map((tf: string) => ({
          label: `__date.${tf}`,
          uiLabel: formatTimeframe(tf),
          meta: { category: "dimension" },
          fqfns: meepDate.dimension_groups_fqfn.map(
            (dg: string) => `${dg}_${tf}`,
          ),
        })),
      };

      const q = searchQuery.trim().toLowerCase();
      const matchDate =
        !q ||
        dateGroup.label.toLowerCase().includes(q) ||
        dateGroup.children.some((c) => c.uiLabel?.toLowerCase().includes(q));

      if (matchDate) {
        if (q && !dateGroup.label.toLowerCase().includes(q)) {
          const matchingChildren = dateGroup.children.filter((c) =>
            c.uiLabel?.toLowerCase().includes(q),
          );
          return [
            {
              ...dateGroup,
              children: matchingChildren,
            },
            ...filtered,
          ];
        }
        return [dateGroup, ...filtered];
      }
    }

    return filtered;
  })();

  const renderFieldRow = (
    item: UIFieldRow,
    key: string,
    isChild: boolean = false,
  ) => {
    const isDate = item.label.startsWith("__date.");
    const dispLabel = isDate ? item.uiLabel : item.label;

    const selectedCount = item.fqfns.filter((f) =>
      selectedFqfns.includes(f),
    ).length;
    const isAll = isDate
      ? selectedFqfns.includes(item.label)
      : selectedCount === item.fqfns.length;
    const isSome = isDate
      ? false
      : selectedCount > 0 && selectedCount < item.fqfns.length;
    const active = isAll || isSome;

    const isMeasure = item.meta.category === "measure";
    const textColor = isMeasure ? "#fb923c" : "#38bdf8";

    return (
      <div
        key={key}
        style={{
          padding: "0.35rem 0.5rem",
          paddingLeft: isChild ? "1.25rem" : "0.5rem",
          display: "flex",
          alignItems: "center",
          borderRadius: "6px",
          backgroundColor: active ? "rgba(255, 255, 255, 0.03)" : "transparent",
        }}
      >
        <label
          style={{
            display: "flex",
            alignItems: "center",
            gap: "0.6rem",
            cursor: "pointer",
            color: textColor,
            width: "100%",
          }}
        >
          <input
            type="checkbox"
            ref={(el) => {
              if (el) {
                el.indeterminate = isSome;
              }
            }}
            checked={isAll}
            onChange={() => onToggleSelection(item.fqfns, item.label)}
            style={{
              cursor: "pointer",
              accentColor: "#38bdf8",
            }}
          />
          <span style={{ fontSize: "0.85rem", fontWeight: active ? 600 : 400 }}>
            {dispLabel}
          </span>
        </label>
      </div>
    );
  };

  const renderItem = (item: UIRenderItem, idx: number) => {
    if (item.is_group) {
      const isDateGrp = item.label === "Date";
      return (
        <details
          key={`grp-${item.label}-${idx}`}
          open={isDateGrp}
          style={{
            margin: "0.5rem 0",
            borderLeft: "1px solid rgba(255,255,255,0.08)",
            paddingLeft: "0.5rem",
          }}
        >
          <summary
            style={{
              fontWeight: 500,
              cursor: "pointer",
              fontSize: "0.85rem",
              color: "#94a3b8",
              padding: "0.2rem 0",
              userSelect: "none",
            }}
          >
            {item.label}
          </summary>
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: "0.1rem",
              marginTop: "0.25rem",
            }}
          >
            {item.children.map((child, cIdx) =>
              renderFieldRow(
                child,
                `child-${item.label}-${child.label}-${cIdx}`,
                true,
              ),
            )}
          </div>
        </details>
      );
    }
    return renderFieldRow(item, `fld-${item.label}-${idx}`);
  };

  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: "0.75rem",
        position: "relative",
      }}
    >
      <button
        ref={buttonRef}
        onClick={() => setIsDropdownOpen(!isDropdownOpen)}
        style={{
          display: "flex",
          alignItems: "center",
          gap: "0.5rem",
          padding: "0.5rem 1rem",
          background: isDropdownOpen
            ? "rgba(56, 189, 248, 0.15)"
            : "rgba(15, 23, 42, 0.6)",
          border: `1px solid ${isDropdownOpen ? "#38bdf8" : "rgba(255, 255, 255, 0.15)"}`,
          borderRadius: "8px",
          color: isDropdownOpen ? "#38bdf8" : "#f8fafc",
          fontSize: "0.85rem",
          fontWeight: 500,
          cursor: "pointer",
          transition: "all 0.2s ease",
        }}
      >
        <Columns size={16} />
        Columns ({selectedColumnsCount})
        <ChevronDown
          size={14}
          style={{
            transform: isDropdownOpen ? "rotate(180deg)" : "none",
            transition: "transform 0.2s",
          }}
        />
      </button>

      <button
        onClick={onReset}
        title="Reset to default columns"
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: "0.5rem",
          background: "rgba(15, 23, 42, 0.6)",
          border: "1px solid rgba(255, 255, 255, 0.15)",
          borderRadius: "8px",
          color: "#94a3b8",
          cursor: "pointer",
          transition: "all 0.2s ease",
        }}
      >
        <RotateCcw size={16} />
      </button>

      {isDropdownOpen && (
        <div
          ref={dropdownRef}
          style={{
            position: "absolute",
            top: "100%",
            right: 0,
            marginTop: "0.5rem",
            zIndex: 50,
            width: "320px",
            maxHeight: "450px",
            overflowY: "auto",
            background: "rgba(15, 23, 42, 0.95)",
            backdropFilter: "blur(12px)",
            border: "1px solid rgba(255, 255, 255, 0.15)",
            borderRadius: "12px",
            padding: "1rem",
            boxShadow: "0 10px 25px rgba(0, 0, 0, 0.5)",
            display: "flex",
            flexDirection: "column",
            gap: "0.75rem",
          }}
        >
          <div style={{ position: "relative" }}>
            <Search
              size={14}
              style={{
                position: "absolute",
                left: "8px",
                top: "50%",
                transform: "translateY(-50%)",
                color: "#94a3b8",
              }}
            />
            <input
              type="text"
              placeholder="Search fields & groups..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{
                width: "100%",
                padding: "0.4rem 0.5rem 0.4rem 1.75rem",
                fontSize: "0.85rem",
                background: "rgba(0, 0, 0, 0.4)",
                border: "1px solid rgba(255, 255, 255, 0.15)",
                borderRadius: "6px",
                color: "#f8fafc",
                outline: "none",
                boxSizing: "border-box",
              }}
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                style={{
                  position: "absolute",
                  right: "8px",
                  top: "50%",
                  transform: "translateY(-50%)",
                  background: "none",
                  border: "none",
                  color: "#94a3b8",
                  cursor: "pointer",
                  padding: 0,
                }}
              >
                <X size={14} />
              </button>
            )}
          </div>

          <div
            style={{
              flexGrow: 1,
              overflowY: "auto",
              display: "flex",
              flexDirection: "column",
              gap: "0.25rem",
            }}
          >
            {fieldsList.length === 0 ? (
              <p
                style={{
                  fontSize: "0.8rem",
                  color: "#94a3b8",
                  textAlign: "center",
                  margin: "1rem 0",
                }}
              >
                No fields found
              </p>
            ) : (
              fieldsList.map(renderItem)
            )}
          </div>
        </div>
      )}
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
  const table = useReactTable({
    data: mergedData?.rows || [],
    columns,
    state: {
      sorting: sortingState,
    },
    onSortingChange,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
  });

  if (mergedData?.rows.length === 0) {
    return (
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          height: "100%",
          minHeight: "200px",
          color: "#94a3b8",
        }}
      >
        <span>No rows returned.</span>
      </div>
    );
  }

  return <TableContainer table={table} />;
}

function TableContainer({ table }: { table: Table<any> }) {
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

  return (
    <div
      ref={tableContainerRef}
      style={{
        overflow: "auto",
        position: "relative",
        height: "600px",
        width: "100%",
        borderTop: "1px solid rgba(255, 255, 255, 0.08)",
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
        zIndex: 1,
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
  return (
    <th
      key={header.id}
      onClick={header.column.getToggleSortingHandler()}
      style={{
        display: "flex",
        width: header.getSize(),
        textAlign: "left",
        padding: "0.75rem 1rem",
        color: "#94a3b8",
        fontWeight: 600,
        cursor: header.column.getCanSort() ? "pointer" : "default",
        userSelect: "none",
        background: "rgba(30, 41, 59, 0.9)",
        transition: "background-color 0.2s ease",
        borderBottom: "1px solid rgba(255, 255, 255, 0.15)",
        boxSizing: "border-box",
        alignItems: "center",
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
        {flexRender(header.column.columnDef.header, header.getContext())}
        {header.column.getCanSort() && (
          <span
            style={{
              color: header.column.getIsSorted() ? "#38bdf8" : "inherit",
              display: "inline-flex",
              alignItems: "center",
            }}
          >
            {header.column.getIsSorted() === "desc" ? (
              <ChevronDown size={14} />
            ) : header.column.getIsSorted() === "asc" ? (
              <ChevronUp size={14} />
            ) : (
              <ArrowUpDown size={14} style={{ opacity: 0.3 }} />
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
    estimateSize: () => 40,
    getScrollElement: () => tableContainerRef.current,
    measureElement:
      typeof window !== "undefined" &&
      navigator.userAgent.indexOf("Firefox") === -1
        ? (element) => element?.getBoundingClientRect().height
        : undefined,
    overscan: 5,
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
        borderBottom: "1px solid rgba(255, 255, 255, 0.05)",
        backgroundColor: isHovered ? "rgba(255, 255, 255, 0.02)" : "transparent",
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
        padding: "0.75rem 1rem",
        color: "#e2e8f0",
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

  const queryResults = useQueries({
    queries: queries.map((query) => ({
      queryKey: ["meepQueryResult", query],
      queryFn: async () => {
        const response = await lookerBrowserSdk.run_inline_query({
          result_format: "json_bi",
          body: query,
          apply_formatting: true
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

  // Define columns for TanStack Table
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
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "0.5rem",
                }}
              >
                <span>{val}</span>
                <span
                  title={cellObj.warning}
                  style={{
                    color: "#f59e0b",
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
    <div
      style={{
        padding: "2rem",
        display: "flex",
        flexDirection: "column",
        height: "100%",
        color: "#f8fafc",
        fontFamily: "Inter, Roboto, sans-serif",
        textAlign: "left",
        boxSizing: "border-box",
        gap: "1.5rem",
      }}
    >
      {/* Top Header / Toolbar */}
      <div
        style={{
          display: "flex",
          justifyContent: "flex-end",
          alignItems: "center",
          flexWrap: "wrap",
          gap: "1rem",
        }}
      >

        {data && (
          <FieldSelector
            sortedFields={data.sortedFields}
            meepDate={data.meepDate}
            selectedFqfns={activeFqfns}
            onToggleSelection={toggleSelection}
            onReset={() => {
              setSelectedFqfns(null);
              setSortingState([]);
            }}
          />
        )}
      </div>

      {/* Clear Sort status/button bar */}
      {sortingState.length > 0 && (
        <div style={{ display: "flex", gap: "0.5rem", alignItems: "center" }}>
          <button
            onClick={() => setSortingState([])}
            style={{
              display: "flex",
              alignItems: "center",
              gap: "0.25rem",
              padding: "0.5rem 0.75rem",
              background: "rgba(239, 68, 68, 0.1)",
              border: "1px solid rgba(239, 68, 68, 0.2)",
              borderRadius: "8px",
              color: "#f87171",
              fontSize: "0.8rem",
              cursor: "pointer",
              transition: "all 0.2s ease",
            }}
          >
            Clear Sorts ({sortingState.length})
          </button>
        </div>
      )}

      {/* Loading status */}
      {(isLoading || isQueryLoading) && (
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "0.5rem",
            color: "#38bdf8",
            fontSize: "0.85rem",
          }}
        >
          <Loader2
            size={16}
            className="animate-spin"
            style={{ animation: "spin 1s linear infinite" }}
          />
          <span>Updating...</span>
        </div>
      )}

      {/* Main Table Area */}
      {error ? (
        <div
          style={{
            padding: "2rem",
            background: "rgba(239, 68, 68, 0.1)",
            border: "1px solid rgba(239, 68, 68, 0.2)",
            borderRadius: "16px",
            color: "#f87171",
            textAlign: "center",
          }}
        >
          <p style={{ fontWeight: 600, margin: 0 }}>Error fetching metadata</p>
          <p style={{ fontSize: "0.85rem", marginTop: "0.5rem" }}>
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
            border: "2px dashed rgba(255, 255, 255, 0.1)",
            borderRadius: "16px",
            color: "#94a3b8",
            minHeight: "300px",
            gap: "1rem",
            padding: "2rem",
          }}
        >
          <Columns size={48} style={{ opacity: 0.3 }} />
          <p style={{ margin: 0, fontWeight: 500 }}>No columns selected</p>
        </div>
      ) : queryError ? (
        <div
          style={{
            padding: "2rem",
            background: "rgba(239, 68, 68, 0.1)",
            border: "1px solid rgba(239, 68, 68, 0.2)",
            borderRadius: "16px",
            color: "#f87171",
            textAlign: "center",
          }}
        >
          <p style={{ fontWeight: 600, margin: 0 }}>
            Error executing Looker queries
          </p>
          <p style={{ fontSize: "0.85rem", marginTop: "0.5rem" }}>
            {(queryError.error as Error).message}
          </p>
        </div>
      ) : (
        <div
          style={{
            flexGrow: 1,
            background: "rgba(15, 23, 42, 0.6)",
            border: "1px solid rgba(255, 255, 255, 0.08)",
            borderRadius: "16px",
            overflow: "hidden",
            display: "flex",
            flexDirection: "column",
            boxShadow: "0 4px 30px rgba(0, 0, 0, 0.2)",
            backdropFilter: "blur(5px)",
          }}
        >
          {/* Table Container */}
          <div style={{ flexGrow: 1, overflow: "auto" }}>
            {(!mergedData || isQueryLoading) &&
            (!mergedData || mergedData.rows.length === 0) ? (
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  height: "100%",
                  minHeight: "200px",
                  color: "#94a3b8",
                  flexDirection: "column",
                  gap: "0.75rem",
                }}
              >
                <Loader2
                  size={32}
                  className="animate-spin"
                  style={{
                    animation: "spin 1s linear infinite",
                    color: "#38bdf8",
                  }}
                />
                <span>Running Looker queries...</span>
              </div>
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

      {/* Custom Spin Keyframes for loaders */}
      <style>{`
        @keyframes spin {
          from {
            transform: rotate(0deg);
          }
          to {
            transform: rotate(360deg);
          }
        }
      `}</style>
    </div>
  );
}
