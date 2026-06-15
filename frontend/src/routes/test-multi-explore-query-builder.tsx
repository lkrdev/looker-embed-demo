import type { ILookmlModelExplore } from "@looker/sdk/lib/4.0/models";
import { useQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { lookerBrowserSdk } from "../services/LookerBrowserSDK";
import {
  buildMeepDate,
  buildMeepFields,
  buildMeepGraph,
  flattenMeepFields,
  matchesIdentifier,
  resolveMeepSelection,
} from "../utils/multiExploreUtils";


declare global {
  interface Window {
    meep?: {
      debug?: Record<string, unknown>;
    };
  }
}

interface SearchParams {
  fields?: string;
  _debug?: boolean;
}

export const Route = createFileRoute("/test-multi-explore-query-builder")({
  validateSearch: (search: Record<string, unknown>): SearchParams => ({
    fields: (search.fields as string) || "",
    _debug: search._debug === true || search._debug === "true",
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

function MultiExploreQueryBuilder() {
  const { fields = "", _debug = false } = Route.useSearch();
  const navigate = Route.useNavigate();
  const [searchQuery, setSearchQuery] = useState("");

  const select_identifiers = useMemo(
    () => (fields ? fields.split(",").filter(Boolean) : []),
    [fields],
  );

  const toggleSelection = (identifier: string) => {
    const next = select_identifiers.includes(identifier)
      ? select_identifiers.filter((item) => item !== identifier)
      : [...select_identifiers, identifier];
    navigate({ search: { fields: next.join(",") }, replace: true });
  };

  const { data, isLoading, error } = useQuery({
    queryKey: ["meepQueryBuilderData_v6"],
    queryFn: async () => {
      const response = await lookerBrowserSdk.all_lookml_models({});
      if (!response.ok) throw new Error("Failed to fetch models");

      const exploresPromises: Promise<ILookmlModelExplore | null>[] = [];
      response.value.forEach((model) => {
        model.explores?.forEach((explore) => {
          if (model.name && explore.name) {
            exploresPromises.push(
              lookerBrowserSdk
                .lookml_model_explore({
                  lookml_model_name: model.name,
                  explore_name: explore.name,
                })
                .then((res) => (res.ok ? res.value : null)),
            );
          }
        });
      });

      const rawExplores = await Promise.all(exploresPromises);
      const validExplores = rawExplores.filter(
        (exp): exp is ILookmlModelExplore => !!exp && !!exp.name,
      );

      const allFields = buildMeepFields(validExplores);
      const meepDate = buildMeepDate(validExplores);

      allFields.sort((a, b) => a.label.localeCompare(b.label));

      return { sortedFields: allFields, meepDate };
    },
    refetchOnWindowFocus: "always",
    staleTime: 1000 * 60 * 5,
  });

  const fieldsList = useMemo((): UIRenderItem[] => {
    if (!data) return [];

    const mappedFields: UIRenderItem[] = data.sortedFields.map((item) => {
      if (item.is_group) {
        return {
          label: item.label,
          is_group: true,
          category: item.category,
          children: item.children.map((child) => ({
            label: child.label,
            meta: {
              category: child.meta.category,
              description: child.meta.description,
            },
          })),
        };
      }
      return {
        label: item.label,
        meta: {
          category: item.meta.category,
          description: item.meta.description,
        },
      };
    });

    const filtered = filterUIFields(mappedFields, searchQuery);

    if (data.meepDate) {
      const dateGroup: UIGroupField = {
        label: "Date",
        is_group: true,
        category: "dimension",
        children: data.meepDate.timeframes.map((tf) => ({
          label: `__date.${tf}`,
          uiLabel: formatTimeframe(tf),
          meta: { category: "dimension" },
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
  }, [data, searchQuery]);

  const renderFieldRow = (item: UIFieldRow, key: string) => {
    const isDate = item.label.startsWith("__date.");
    const dispLabel = isDate ? item.uiLabel : item.label;
    const active = select_identifiers.includes(item.label);
    const isMeasure = item.meta.category === "measure";

    const textColor = isMeasure ? "#fb923c" : "#38bdf8";

    return (
      <div key={key} style={{ padding: "0.25rem 0", paddingLeft: "1.2rem" }}>
        <label
          style={{
            display: "flex",
            alignItems: "center",
            gap: "0.6rem",
            cursor: "pointer",
            color: textColor,
          }}
        >
          <input
            type="checkbox"
            checked={active}
            onChange={() => toggleSelection(item.label)}
          />
          <span style={{ fontSize: "0.95rem", fontWeight: active ? 600 : 400 }}>
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
            margin: "0.75rem 0",
            paddingLeft: "0",
          }}
        >
          <summary
            style={{
              fontWeight: 400,
              cursor: "pointer",
              fontSize: "0.95rem",
              color: "#38bdf8",
            }}
          >
            {item.label}
          </summary>
          <div style={{ paddingLeft: "0", marginTop: "0.5rem" }}>
            {item.children.map((child, cIdx) =>
              renderFieldRow(
                child,
                `child-${item.label}-${child.label}-${cIdx}`,
              ),
            )}
          </div>
        </details>
      );
    }
    return renderFieldRow(item, `fld-${item.label}-${idx}`);
  };

  const rightHandSideData = useMemo(() => {
    if (!data) return {};
    const fullGraph = buildMeepGraph(data.sortedFields, data.meepDate);
    const resolvedQueries = resolveMeepSelection(
      select_identifiers,
      data.sortedFields,
      data.meepDate,
    );

    const selectedFqfns: string[] = [];
    const flatFields = flattenMeepFields(data.sortedFields);

    select_identifiers.forEach((id) => {
      if (id.startsWith("__date.")) {
        const tf = id.slice("__date.".length);
        if (data.meepDate) {
          data.meepDate.dimension_groups_fqfn.forEach((dg) => {
            selectedFqfns.push(`${dg}_${tf}`);
          });
        }
        return;
      }

      const field = flatFields.find((f) => matchesIdentifier(f, id));
      if (field) {
        if (field.is_group === false) {
          if (Array.isArray(field.fqfn)) {
            field.fqfn.forEach((f) => selectedFqfns.push(f));
          } else {
            selectedFqfns.push(field.fqfn);
          }
        }
      }
    });

    return {
      warnings: data.sortedFields._warnings || [],
      selected_fqfn: selectedFqfns,
      select_identifiers,
      resolvedQueries,
      fullGraph,
    };
  }, [data, select_identifiers]);

  if (_debug) {
    console.log(rightHandSideData);
    window.meep = window.meep || {};
    window.meep.debug = rightHandSideData;
  }

  return (
    <div
      style={{
        padding: "2rem",
        maxWidth: "600px",
        margin: "0 auto",
        color: "#f8fafc",
        fontFamily: "Inter, Roboto, sans-serif",
      }}
    >
      <h1 style={{ fontSize: "2rem", marginBottom: "1.5rem" }}>
        Multi-Explore Query Builder
      </h1>

      {isLoading && <p>Loading LookML models and explores...</p>}
      {error && <p style={{ color: "red" }}>{(error as Error).message}</p>}

      {!isLoading && !error && data && (
        <div
          style={{
            background: "rgba(15, 23, 42, 0.6)",
            border: "1px solid rgba(255, 255, 255, 0.08)",
            borderRadius: "16px",
            padding: "1.5rem",
          }}
        >
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search fields and groups..."
            style={{
              width: "100%",
              padding: "0.75rem 1rem",
              marginBottom: "1.5rem",
              background: "rgba(0, 0, 0, 0.4)",
              border: "1px solid rgba(255, 255, 255, 0.15)",
              borderRadius: "8px",
              color: "#f8fafc",
              outline: "none",
              boxSizing: "border-box",
            }}
          />

          <div style={{ maxHeight: "75vh", overflowY: "auto" }}>
            {fieldsList.map(renderItem)}
          </div>
        </div>
      )}
    </div>
  );
}
