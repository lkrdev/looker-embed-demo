import type {
  ILookmlModelExplore,
  ILookmlModelExploreField,
} from "@looker/sdk/lib/4.0/models";
import type {
  MeepExploreData,
  MeepExploreDate,
  MeepExploreDimension,
  MeepExploreMeasure,
  MeepFieldWarning,
  TMeepFields,
} from "../../types";

export interface MeepDescriptionResult {
  description?: string | null;
  isWinningMarked: boolean;
}

export function resolveFieldDescription(
  field: ILookmlModelExploreField,
): MeepDescriptionResult {
  let description = field.description;
  let isWinningMarked = false;

  if (field.tags) {
    const meepDTag = field.tags.find(
      (t) => t === "meep-d" || t.startsWith("meep-d:"),
    );
    if (meepDTag) {
      isWinningMarked = true;
      if (meepDTag.startsWith("meep-d:")) {
        description = meepDTag.slice("meep-d:".length);
      }
    }
  }

  return { description, isWinningMarked };
}

export function resolveFieldLabel(
  field: ILookmlModelExploreField,
  exploreTags?: string[] | null,
): string {
  if (exploreTags?.length) {
    const prefix = `meep-l:${field.name}=`;
    const expLTag = exploreTags.find((t) => t.startsWith(prefix));
    if (expLTag) {
      return expLTag.slice(prefix.length).trim();
    }
  }

  if (field.tags?.length) {
    const meepLTag = field.tags.find(
      (t) => t === "meep-l" || t.startsWith("meep-l:"),
    );
    if (meepLTag) {
      if (meepLTag.startsWith("meep-l:")) {
        return meepLTag.slice("meep-l:".length).trim();
      }
      return field.label_short || field.label || field.name || "";
    }
  }

  const labelShort = field.label_short || "";
  const name = field.name || "";
  const isStandardCount =
    name === "count" || name.endsWith(".count") || labelShort === "Count";

  if (isStandardCount) {
    return field.label || field.label_short || name || "";
  }

  return field.label_short || field.label || name || "";
}

export function pickNeededMeta(
  field: ILookmlModelExploreField,
  category: "dimension" | "measure",
  omit: boolean,
  extra?: Record<string, any>,
): any {
  if (!omit) {
    return {
      ...field,
      category,
      ...extra,
    };
  }

  return {
    name: field.name,
    label: field.label,
    label_short: field.label_short,
    description: field.description,
    category,
    field_group_label: field.field_group_label,
    field_group_variant: field.field_group_variant,
    tags: field.tags,
    type: field.type,
    value_format: field.value_format,
    value_format_name: field.value_format_name,
    dimension_group: field.dimension_group,
    is_filter: field.is_filter,
    parameter: field.parameter,
    measure: field.measure,
    sortable: field.sortable,
    user_attribute_filter_types: field.user_attribute_filter_types,
    hidden: field.hidden,
    ...extra,
  };
}

export function buildMeepFields(
  explores: ILookmlModelExplore[],
  omitUnneededMeta = true,
): TMeepFields {
  const standaloneDimMap: Record<string, MeepExploreDimension> = {};
  const groupDimMaps: Record<string, Record<string, MeepExploreDimension>> = {};
  const measures: MeepExploreMeasure[] = [];
  const lockedDimDescriptions: Record<string, boolean> = {};

  explores.forEach((exp) => {
    if (
      !exp.id ||
      !exp.fields ||
      exp.tags?.includes("meep-x") ||
      (exp.hidden && !exp.tags?.includes("meep-i"))
    )
      return;

    const excludedScopes =
      exp.tags
        ?.filter((t) => t.startsWith("meep-x:"))
        .map((t) => t.slice("meep-x:".length).trim()) || [];

    const [lookmlModelName = "", exploreName = ""] = exp.id.split("::");
    const expPrefix = `${lookmlModelName}.${exploreName}`;

    const defaultDateByView: Record<string, string> = {};
    exp.fields.dimensions?.forEach((d) => {
      if (d.dimension_group && d.tags?.includes("meep-ddt") && d.view) {
        const isTimeType =
          d.type?.startsWith("date_") || d.type?.startsWith("time_");
        if (isTimeType) {
          defaultDateByView[d.view] = d.dimension_group;
        }
      }
    });

    exp.fields.dimensions?.forEach((field) => {
      const fieldScope = field.scope || field.name?.split(".")[0] || "";
      if (
        field.hidden ||
        field.dimension_group ||
        field.is_timeframe ||
        field.tags?.includes("meep-x") ||
        excludedScopes.includes(fieldScope)
      )
        return;

      const fqfn = `${expPrefix}.${field.name}` as any;
      const label = resolveFieldLabel(field, exp.tags);
      const { description, isWinningMarked } = resolveFieldDescription(field);

      const glTag = field.tags?.find((t) => t.startsWith("meep-gl:"));
      const viewGroupTag = field.tags?.find(
        (t) => t === "meep-viewgroup" || t.startsWith("meep-viewgroup"),
      );

      const groupLabel = glTag
        ? glTag.replace("meep-gl:", "").trim()
        : viewGroupTag
          ? field.view_label || field.view || ""
          : field.field_group_label || "";

      const isBaseField = !!(
        (field.tags?.includes("meep-bf") &&
          (field.view === exp.view_name || field.view === exploreName)) ||
        exp.tags?.includes(`meep-bf:${field.view}`) ||
        exp.tags?.includes(`meep-bf:${field.name}`)
      );

      const baseFieldFqfn = isBaseField ? fqfn : null;

      const targetMap = groupLabel
        ? (groupDimMaps[groupLabel] = groupDimMaps[groupLabel] || {})
        : standaloneDimMap;

      const lookupKey = groupLabel ? `${groupLabel}::${label}` : label;
      const existing = targetMap[label];

      if (!existing) {
        if (isWinningMarked) lockedDimDescriptions[lookupKey] = true;
        targetMap[label] = {
          label,
          is_group: false,
          fqfn: [fqfn],
          ...(baseFieldFqfn ? { base_field_fqfn: baseFieldFqfn } : {}),
          meta: pickNeededMeta(field, "dimension", omitUnneededMeta, {
            lookml_model_name: lookmlModelName,
            explore_name: exploreName,
            description,
          }),
        };
      } else {
        if (!existing.fqfn.includes(fqfn)) existing.fqfn.push(fqfn);
        if (baseFieldFqfn && !existing.base_field_fqfn) {
          existing.base_field_fqfn = baseFieldFqfn;
        }
        if (isWinningMarked || !lockedDimDescriptions[lookupKey]) {
          existing.meta.description = description;
          if (isWinningMarked) lockedDimDescriptions[lookupKey] = true;
        }
      }
    });

    exp.fields.measures?.forEach((field) => {
      const fieldScope = field.scope || field.name?.split(".")[0] || "";
      if (
        field.hidden ||
        field.tags?.includes("meep-x") ||
        excludedScopes.includes(fieldScope)
      )
        return;

      const fqfn = `${expPrefix}.${field.name}` as any;
      const label = resolveFieldLabel(field, exp.tags);
      const { description } = resolveFieldDescription(field);
      const ldtTag = field.tags?.find((t) => t.startsWith("meep-ldt:"));
      let targetDimGroup = ldtTag ? ldtTag.replace("meep-ldt:", "").trim() : "";

      if (!targetDimGroup && field.view && defaultDateByView[field.view]) {
        targetDimGroup = defaultDateByView[field.view];
      }

      measures.push({
        label,
        is_group: false,
        fqfn,
        preferred_date_fqfn: targetDimGroup
          ? (`${expPrefix}.${targetDimGroup}` as any)
          : ("" as any),
        meta: pickNeededMeta(field, "measure", omitUnneededMeta, {
          description,
        }),
      });
    });
  });

  const _warnings: MeepFieldWarning[] = [];

  const checkRollup = (dim: MeepExploreDimension) => {
    if (dim.fqfn.length <= 1) return;
    const expMap: Record<string, string[]> = {};
    dim.fqfn.forEach((f) => {
      const parts = f.split(".");
      if (parts.length >= 2) {
        const key = `${parts[0]}.${parts[1]}`;
        (expMap[key] = expMap[key] || []).push(f);
      }
    });
    Object.entries(expMap).forEach(([expKey, fqfns]) => {
      if (fqfns.length > 1) {
        const warning: MeepFieldWarning = {
          type: "ambiguous_labels_in_explore",
          exploreKey: expKey,
          label: dim.label,
          fqfns,
          message: `Ambiguous label '${dim.label}' across multiple fields in explore '${expKey}'. This should be avoided and can be changed by adding a group_label or using meep-viewgroup.`,
        };
        (dim._warnings = dim._warnings || []).push(warning);
        _warnings.push(warning);
      }
    });
  };

  const dimensions = Object.values(standaloneDimMap).sort((a, b) =>
    a.label.localeCompare(b.label),
  );
  dimensions.forEach(checkRollup);

  const groupFields = Object.entries(groupDimMaps)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([label, map]) => {
      const children = Object.values(map).sort((a, b) =>
        a.label.localeCompare(b.label),
      );
      children.forEach(checkRollup);
      return {
        label,
        is_group: true as const,
        category: "dimension" as const,
        children,
      };
    });

  measures.sort((a, b) => a.label.localeCompare(b.label));

  const measureMap: Record<string, MeepExploreMeasure[]> = {};
  measures.forEach((m) => {
    const parts = m.fqfn.split(".");
    if (parts.length >= 2) {
      const exploreKey = `${parts[0]}.${parts[1]}`;
      const key = `${exploreKey}::${m.label}`;
      (measureMap[key] = measureMap[key] || []).push(m);
    }
  });

  Object.entries(measureMap).forEach(([key, matches]) => {
    if (matches.length > 1) {
      const parts = key.split("::");
      const exploreKey = parts[0];
      const label = parts[1];
      const fqfns = matches.map((m) => m.fqfn);

      const warning: MeepFieldWarning = {
        type: "ambiguous_labels_in_explore",
        exploreKey,
        label,
        fqfns,
        message: `Ambiguous label '${label}' across multiple fields in explore '${exploreKey}'. This should be avoided and can be changed by adding a group_label or using meep-viewgroup.`,
      };
      _warnings.push(warning);
      matches.forEach((m) => {
        (m._warnings = m._warnings || []).push(warning);
      });
    }
  });

  // ponytail: O(n) check to find measures sharing identical labels across different explores
  const globalMeasureMap: Record<string, MeepExploreMeasure[]> = {};
  measures.forEach((m) => {
    (globalMeasureMap[m.label] = globalMeasureMap[m.label] || []).push(m);
  });

  Object.entries(globalMeasureMap).forEach(([label, matches]) => {
    if (matches.length > 1) {
      const exploreKeys = new Set<string>();
      matches.forEach((m) => {
        const parts = m.fqfn.split(".");
        if (parts.length >= 2) {
          exploreKeys.add(`${parts[0]}.${parts[1]}`);
        }
      });

      if (exploreKeys.size > 1) {
        const fqfns = matches.map((m) => m.fqfn);
        const warning: MeepFieldWarning = {
          type: "ambiguous_measures_across_explores",
          label,
          fqfns,
          message: `Ambiguous measure label '${label}' across multiple explores. This should be avoided by using meep-l tags at the explore level to distinguish them.`,
        };
        _warnings.push(warning);
        matches.forEach((m) => {
          (m._warnings = m._warnings || []).push(warning);
        });
      }
    }
  });

  const result = [...dimensions, ...groupFields, ...measures] as TMeepFields;
  if (_warnings.length > 0) result._warnings = _warnings;
  return result;
}

export function buildMeepDate(
  explores: ILookmlModelExplore[],
): MeepExploreDate | null {
  const usedDimGroups: string[] = [];
  const dimGroupTypes: Record<string, Set<string>> = {};
  let baseDateTimelineFqfn: string | undefined;

  explores.forEach((exp) => {
    if (
      !exp.id ||
      !exp.fields ||
      exp.tags?.includes("meep-x") ||
      (exp.hidden && !exp.tags?.includes("meep-i"))
    )
      return;

    const excludedScopes =
      exp.tags
        ?.filter((t) => t.startsWith("meep-x:"))
        .map((t) => t.slice("meep-x:".length).trim()) || [];

    const expPrefix = exp.id.split("::").join(".");

    const defaultDateByView: Record<string, string> = {};
    exp.fields.dimensions?.forEach((d) => {
      if (d.dimension_group && d.tags?.includes("meep-ddt") && d.view) {
        const isTimeType =
          d.type?.startsWith("date_") || d.type?.startsWith("time_");
        if (isTimeType) {
          defaultDateByView[d.view] = d.dimension_group;
        }
      }
    });

    exp.fields.measures?.forEach((m) => {
      const fieldScope = m.scope || m.name?.split(".")[0] || "";
      if (m.hidden || excludedScopes.includes(fieldScope)) return;

      const ldtTag = m.tags?.find((t) => t.startsWith("meep-ldt:"));
      let targetDimGroup = "";
      if (ldtTag) {
        targetDimGroup = ldtTag.replace("meep-ldt:", "").trim();
      } else if (m.view && defaultDateByView[m.view]) {
        targetDimGroup = defaultDateByView[m.view];
      }

      if (targetDimGroup) {
        const hasDimensionGroup = exp.fields?.dimensions?.some(
          (d) => d.dimension_group === targetDimGroup,
        );
        if (hasDimensionGroup) {
          const fqfn = `${expPrefix}.${targetDimGroup}`;
          if (!usedDimGroups.includes(fqfn)) {
            usedDimGroups.push(fqfn);
          }
        }
      }
    });

    exp.fields.dimensions?.forEach((d) => {
      const fieldScope = d.scope || d.name?.split(".")[0] || "";
      if (
        d.hidden ||
        !d.dimension_group ||
        !d.type ||
        excludedScopes.includes(fieldScope)
      )
        return;

      const dgFqfn = `${expPrefix}.${d.dimension_group}`;
      if (!dimGroupTypes[dgFqfn]) {
        dimGroupTypes[dgFqfn] = new Set();
      }
      const name = d.name || "";
      const dg = d.dimension_group || "";
      const cleanName = name.includes(".")
        ? name.split(".").slice(1).join(".")
        : name;
      const cleanDg = dg.includes(".") ? dg.split(".").slice(1).join(".") : dg;

      let timeframe = "";
      if (cleanName.startsWith(cleanDg + "_")) {
        timeframe = cleanName.slice(cleanDg.length + 1);
      } else {
        timeframe = d.type.replace(/^date_/, "").replace(/^time_/, "");
      }
      dimGroupTypes[dgFqfn].add(timeframe);

      if (d.tags?.includes("meep-bdt")) {
        if (!baseDateTimelineFqfn) {
          baseDateTimelineFqfn = dgFqfn;
        }
      }
    });
  });

  if (usedDimGroups.length === 0) return null;

  let intersection: string[] = [];
  const activeKeys = Object.keys(dimGroupTypes).filter((k) =>
    usedDimGroups.includes(k),
  );

  if (activeKeys.length > 0) {
    intersection = Array.from(dimGroupTypes[activeKeys[0]]);
    for (let i = 1; i < activeKeys.length; i++) {
      const currSet = dimGroupTypes[activeKeys[i]];
      intersection = intersection.filter((t) => currSet.has(t));
    }
  }

  intersection.sort();

  return {
    label: "__date",
    dimension_groups_fqfn: usedDimGroups as any,
    timeframes: intersection,
    ...(baseDateTimelineFqfn
      ? { base_date_timeline_fqfn: baseDateTimelineFqfn }
      : {}),
  };
}

export function getFlatMeepLabels(
  fields: TMeepFields,
  date?: MeepExploreDate | null,
): string[] {
  const labels: string[] = [];
  for (const field of fields) {
    if (field.is_group) {
      for (const child of field.children) {
        labels.push(`${field.label} > ${child.label}`);
      }
    } else {
      labels.push(field.label);
    }
  }

  if (date) {
    for (const tf of date.timeframes) {
      const cleaned = tf.replace(/^date_/, "");
      const formatted = cleaned
        .split("_")
        .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
        .join(" ");
      labels.push(`Date > ${formatted}`);
    }
  }

  return labels.sort((a, b) => a.localeCompare(b));
}

export function buildMeepExploreData(
  explores: ILookmlModelExplore[],
  omitUnneededMeta = true,
): MeepExploreData {
  const fields = buildMeepFields(explores, omitUnneededMeta);
  const date = buildMeepDate(explores);
  fields.sort((a, b) => a.label.localeCompare(b.label));
  return { fields, date };
}
