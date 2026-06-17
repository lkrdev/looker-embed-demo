import type { IWriteQuery } from "@looker/sdk/lib/4.0/models";
import type { MeepExploreData, MeepExploreDimension } from "../../types";
import { flattenMeepFields } from "./meepGraphUtils";

/**
 * Normalizes a query field name to its corresponding MEEP identifier.
 */
export function getNormalizedFieldKey(
  fieldName: string,
  activeExploreKey: string,
  exploreData: MeepExploreData,
  flatFields?: any[],
): string {
  // Check if it's a date timeframe field
  if (exploreData.date) {
    for (const dateFqfn of exploreData.date.dimension_groups_fqfn) {
      const parts = dateFqfn.split(".");
      if (parts.length >= 2) {
        const expKey = `${parts[0]}.${parts[1]}`;
        if (expKey === activeExploreKey) {
          const relativeDateGroup = parts.slice(2).join("."); // e.g. "order_items.created"
          if (fieldName === relativeDateGroup) {
            return "__date.date"; // Fallback to date
          }
          if (fieldName.startsWith(relativeDateGroup + "_")) {
            const timeframe = fieldName.substring(relativeDateGroup.length + 1);
            return `__date.${timeframe}`;
          }
        }
      }
    }
  }

  // Find in regular dimensions
  const fieldsList = flatFields || flattenMeepFields(exploreData.fields);
  const targetFqfn = `${activeExploreKey}.${fieldName}`;
  const matchedDim = fieldsList.find(
    (f) =>
      f.meta.category === "dimension" &&
      (f as MeepExploreDimension).fqfn.includes(targetFqfn as any),
  ) as MeepExploreDimension | undefined;

  if (matchedDim) {
    return matchedDim.fqfn[0]; // Canonical MEEP identifier
  }

  return targetFqfn; // Fallback
}

export interface MergedMeepResult {
  metadata: {
    fields: {
      dimensions: any[];
      measures: any[];
      pivots: any[];
      table_calculations: any[];
    };
    pivots: any[];
    has_totals: boolean;
    has_subtotals: boolean;
    columns_truncated: boolean;
  };
  rows: any[];
}

/**
 * Performs a full outer join across multiple looker json_bi results.
 */
export function mergeMeepResults(
  results: { query: IWriteQuery; response: any }[],
  exploreData: MeepExploreData,
): MergedMeepResult {
  // ponytail: flatFields is precomputed once to avoid recursive O(N) flattening on every field normalization
  const flatFields = flattenMeepFields(exploreData.fields);

  const mergedDimensionsMap = new Map<string, any>();
  const mergedMeasuresMap = new Map<string, any>();
  const mergedPivotsMap = new Map<string, any>();

  const fieldKeyCache = new Map<string, string>();
  const getNormalizedKey = (fieldName: string, activeExploreKey: string) => {
    const cacheKey = `${activeExploreKey}::${fieldName}`;
    let val = fieldKeyCache.get(cacheKey);
    if (val === undefined) {
      val = getNormalizedFieldKey(
        fieldName,
        activeExploreKey,
        exploreData,
        flatFields,
      );
      fieldKeyCache.set(cacheKey, val);
    }
    return val;
  };

  // Unify metadata fields
  results.forEach(({ query, response }) => {
    const activeExploreKey = `${query.model}.${query.view}`;
    const metadata = response.metadata || {};
    const fields = metadata.fields || {};

    (fields.dimensions || []).forEach((dim: any) => {
      const normKey = getNormalizedKey(dim.name, activeExploreKey);
      if (!mergedDimensionsMap.has(normKey)) {
        mergedDimensionsMap.set(normKey, {
          ...dim,
          name: normKey,
        });
      }
    });

    (fields.measures || []).forEach((meas: any) => {
      const fqfn = `${activeExploreKey}.${meas.name}`;
      if (!mergedMeasuresMap.has(fqfn)) {
        mergedMeasuresMap.set(fqfn, {
          ...meas,
          name: fqfn,
        });
      }
    });

    (fields.pivots || []).forEach((piv: any) => {
      const normKey = getNormalizedKey(piv.name, activeExploreKey);
      if (!mergedPivotsMap.has(normKey)) {
        mergedPivotsMap.set(normKey, {
          ...piv,
          name: normKey,
        });
      }
    });
  });

  // Unify metadata pivots list
  const mergedPivotInfoMap = new Map<string, any>();
  results.forEach(({ query, response }) => {
    const activeExploreKey = `${query.model}.${query.view}`;
    const pivotsList = response.metadata?.pivots || [];

    pivotsList.forEach((pivotInfo: any) => {
      const normalizedData: Record<string, string> = {};
      Object.entries(pivotInfo.data || {}).forEach(
        ([k, val]: [string, any]) => {
          const normK = getNormalizedKey(k, activeExploreKey);
          normalizedData[normK] = val;
        },
      );

      const normKey = Object.entries(normalizedData)
        .sort((a, b) => a[0].localeCompare(b[0]))
        .map(([k, val]) => `${k}:${val}`)
        .join("|");

      if (!mergedPivotInfoMap.has(normKey)) {
        mergedPivotInfoMap.set(normKey, {
          ...pivotInfo,
          key: pivotInfo.key,
          data: normalizedData,
          sort_values: normalizedData,
        });
      }
    });
  });

  // Outer join rows
  const allDimensionKeys = Array.from(mergedDimensionsMap.keys());
  const seenRowKeys = new Set<string>();
  const allRowKeys: Record<string, any>[] = [];

  results.forEach(({ query, response }) => {
    const activeExploreKey = `${query.model}.${query.view}`;
    const rows = response.rows || [];
    const dimensions = response.metadata?.fields?.dimensions || [];

    rows.forEach((row: any) => {
      const rowKeys: Record<string, any> = {};

      allDimensionKeys.forEach((key) => {
        rowKeys[key] = null;
      });

      dimensions.forEach((dim: any) => {
        const normKey = getNormalizedKey(dim.name, activeExploreKey);
        rowKeys[normKey] = row[dim.name]?.value;
      });

      // ponytail: O(N) deduplication using set of serialized dimension key-value pairs
      const serialized = allDimensionKeys
        .map((k) => `${k}:${rowKeys[k]}`)
        .join("|");
      if (!seenRowKeys.has(serialized)) {
        seenRowKeys.add(serialized);
        allRowKeys.push(rowKeys);
      }
    });
  });

  // Group rows by their schema (sorted list of non-null keys)
  const rowsBySchema = new Map<string, Record<string, any>[]>();
  allRowKeys.forEach((row) => {
    const nonNullKeys = allDimensionKeys.filter(
      (k) => row[k] !== null && row[k] !== undefined,
    );
    const schemaKey = nonNullKeys.sort().join(",");
    if (!rowsBySchema.has(schemaKey)) {
      rowsBySchema.set(schemaKey, []);
    }
    rowsBySchema.get(schemaKey)!.push(row);
  });

  const schemas = Array.from(rowsBySchema.keys()).map((s) =>
    s ? s.split(",") : [],
  );

  // Determine subset relationships between schemas
  const subsetRelations = new Map<string, string[][]>();
  schemas.forEach((s1) => {
    const s1Key = s1.join(",");
    const supersets: string[][] = [];
    schemas.forEach((s2) => {
      if (s1.length >= s2.length) return;
      const isSubset = s1.every((val) => s2.includes(val));
      if (isSubset) {
        supersets.push(s2);
      }
    });
    subsetRelations.set(s1Key, supersets);
  });

  // For each schema, build indexes of its superset schemas
  const supersetIndexes = new Map<string, Map<string, Set<string>>>();
  rowsBySchema.forEach((_rows, schemaKey) => {
    const supersets = subsetRelations.get(schemaKey) || [];
    supersets.forEach((supersetSchema) => {
      const supersetKey = supersetSchema.join(",");
      const subsetFields = schemaKey ? schemaKey.split(",") : [];
      const serializedSet = new Set<string>();

      const supersetRows = rowsBySchema.get(supersetKey) || [];
      supersetRows.forEach((r) => {
        const valKey = subsetFields.map((f) => String(r[f])).join("|");
        serializedSet.add(valKey);
      });

      if (!supersetIndexes.has(supersetKey)) {
        supersetIndexes.set(supersetKey, new Map());
      }
      supersetIndexes.get(supersetKey)!.set(schemaKey, serializedSet);
    });
  });

  // ponytail: O(N) subset/superset filtering using index lookups
  const finestKeys: Record<string, any>[] = [];
  rowsBySchema.forEach((rows, schemaKey) => {
    const supersets = subsetRelations.get(schemaKey) || [];
    const subsetFields = schemaKey ? schemaKey.split(",") : [];

    if (supersets.length === 0) {
      finestKeys.push(...rows);
      return;
    }

    rows.forEach((row) => {
      const rowValKey = subsetFields.map((f) => String(row[f])).join("|");
      const hasSuperset = supersets.some((supersetSchema) => {
        const supersetKey = supersetSchema.join(",");
        const index = supersetIndexes.get(supersetKey)?.get(schemaKey);
        return index ? index.has(rowValKey) : false;
      });

      if (!hasSuperset) {
        finestKeys.push(row);
      }
    });
  });

  // Pre-build indexes for each query response's rows
  const queryRowIndexes = results.map(({ query, response }) => {
    const activeExploreKey = `${query.model}.${query.view}`;
    const rows = response.rows || [];
    const dimensions = response.metadata?.fields?.dimensions || [];
    const measures = response.metadata?.fields?.measures || [];

    const normKeys: string[] = dimensions.map((dim: any) =>
      getNormalizedKey(dim.name, activeExploreKey),
    );

    const indexMap = new Map<string, any>();
    rows.forEach((r: any) => {
      const key = dimensions
        .map((dim: any) => String(r[dim.name]?.value))
        .join("|");
      indexMap.set(key, r);
    });

    return {
      activeExploreKey,
      normKeys,
      measures,
      indexMap,
    };
  });

  // ponytail: O(N) merged rows construction using indexed query row lookups
  const mergedRows = finestKeys.map((keyMap) => {
    const rowObj: Record<string, any> = {};

    Object.entries(keyMap).forEach(([normKey, val]) => {
      rowObj[normKey] = { value: val };
    });

    queryRowIndexes.forEach(
      ({ activeExploreKey, normKeys, measures, indexMap }) => {
        const queryValuesKey = normKeys
          .map((k: string) => String(keyMap[k]))
          .join("|");
        const matchedQueryRow = indexMap.get(queryValuesKey);

        if (matchedQueryRow) {
          const missingDimLabels = Object.keys(keyMap)
            .filter((key) => {
              const val = keyMap[key];
              return (
                val !== null && val !== undefined && !normKeys.includes(key)
              );
            })
            .map((key) => {
              if (key.startsWith("__date.")) {
                return "Date";
              }
              const matchedDim = flatFields.find(
                (f) =>
                  !f.is_group &&
                  f.meta.category === "dimension" &&
                  (f as MeepExploreDimension).fqfn.includes(key as any),
              ) as MeepExploreDimension | undefined;
              if (matchedDim) {
                return matchedDim.label;
              }
              const dimMeta = mergedDimensionsMap.get(key);
              return dimMeta?.label_short || dimMeta?.label || key;
            });

          const isFanOut = missingDimLabels.length > 0;

          measures.forEach((meas: any) => {
            const fqfn = `${activeExploreKey}.${meas.name}`;
            const cell = matchedQueryRow[meas.name];
            if (cell) {
              rowObj[fqfn] = { ...cell };
              if (isFanOut) {
                rowObj[fqfn].warning =
                  `This measure value is repeated because the source query did not group by ${missingDimLabels.join(", ")}.`;
              }
            }
          });
        }
      },
    );

    mergedMeasuresMap.forEach((meas, fqfn) => {
      if (rowObj[fqfn] === undefined) {
        if (isNumericMeasure(meas)) {
          rowObj[fqfn] = { value: 0 };
        } else {
          rowObj[fqfn] = { value: null };
        }
      }
    });

    return rowObj;
  });

  return {
    metadata: {
      fields: {
        dimensions: Array.from(mergedDimensionsMap.values()),
        measures: Array.from(mergedMeasuresMap.values()),
        pivots: Array.from(mergedPivotsMap.values()),
        table_calculations: [],
      },
      pivots: Array.from(mergedPivotInfoMap.values()),
      has_totals: false,
      has_subtotals: false,
      columns_truncated: false,
    },
    rows: mergedRows,
  };
}

export interface TableColumn {
  id: string;
  label: string;
  isPivot: boolean;
  measureName?: string;
  pivotData?: Record<string, string>;
}

export function isNumericMeasure(meas: any): boolean {
  if (!meas) return false;
  const numericTypes = [
    "number",
    "count",
    "sum",
    "average",
    "integer",
    "int",
    "double",
    "float",
    "percent_of_total",
    "percent_of_previous",
    "running_total",
  ];
  return (
    numericTypes.includes(String(meas.type).toLowerCase()) ||
    /count|sum|amount|value|price|cost|revenue|average|avg|percent/i.test(
      meas.name,
    )
  );
}

export function getPivotedValue(
  row: any,
  measureName: string,
  pivotData: Record<string, string>,
  pivotFields: any[],
  isNumeric: boolean = false,
): any {
  let current = row[measureName];
  if (!current) {
    return isNumeric ? 0 : null;
  }

  for (const pivField of pivotFields) {
    const pivotVal = pivotData[pivField.name];
    if (current && typeof current === "object" && pivotVal !== undefined) {
      current = current[pivotVal];
    } else {
      return isNumeric ? 0 : null;
    }
  }

  const val = current?.value;
  if (val === null || val === undefined) {
    return isNumeric ? 0 : null;
  }
  return val;
}

export function renderCellValue(
  row: any,
  col: TableColumn,
  pivotFields: any[],
): string {
  const cell = getCellObject(row, col, pivotFields);
  if (!cell) {
    const measName = col.isPivot ? col.measureName : col.id;
    const isNumeric = measName ? isNumericMeasure({ name: measName }) : false;
    return isNumeric ? "0" : "-";
  }
  if (cell.rendered !== undefined && cell.rendered !== null) {
    return String(cell.rendered);
  }
  if (cell.value !== undefined && cell.value !== null) {
    return String(cell.value);
  }
  return "-";
}

export function getCellObject(
  row: any,
  col: TableColumn,
  pivotFields: any[],
): any {
  if (col.isPivot && col.measureName && col.pivotData) {
    let current = row[col.measureName];
    if (!current) return null;
    for (const pivField of pivotFields) {
      const pivotVal = col.pivotData[pivField.name];
      if (current && typeof current === "object" && pivotVal !== undefined) {
        current = current[pivotVal];
      } else {
        return null;
      }
    }
    return current;
  }
  return row[col.id];
}
