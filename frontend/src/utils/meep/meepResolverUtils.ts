import type {
  MeepExploreData,
  MeepExploreDate,
  MeepExploreDimension,
  MeepExploreMeasure,
  TMeepFields,
} from "../../types";
import { buildMeepGraph, flattenMeepFields } from "./meepGraphUtils";

export interface MeepQueryWarning {
  type: "unrelated_fields";
  fqfn: string;
  message: string;
}

export interface MeepQueryResult {
  activeExploreKey: string | null;
  activeDateDimensionGroupFqfn: string | null;
  resolvedFieldFqfns: string[];
  _warnings?: MeepQueryWarning[];
}

export function matchesIdentifier(field: any, id: string): boolean {
  const clean = id.trim().toLowerCase();
  const fqfns = Array.isArray(field.fqfn) ? field.fqfn : [field.fqfn];
  const targets = [
    field.label,
    field.meta?.name,
    field.meta?.label,
    field.meta?.label_short,
    ...fqfns,
  ];
  return targets.some(
    (t?: string) =>
      t?.toLowerCase() === clean || t?.toLowerCase().endsWith(`.${clean}`),
  );
}

export function resolveMeepSelection(
  selectedIdentifiers: string[],
  meepFields: TMeepFields,
  meepDate?: MeepExploreDate | null,
): MeepQueryResult[] {
  const flatFields = flattenMeepFields(meepFields);
  const graph = buildMeepGraph(meepFields, meepDate);
  const matchedMeasures: MeepExploreMeasure[] = [];

  const queryTargetSpecs = new Map<
    string,
    { exploreKey: string; dateFqfn: string }
  >();

  selectedIdentifiers.forEach((id) => {
    const matchedField = flatFields.find((f) => matchesIdentifier(f, id));
    if (matchedField) {
      if (matchedField.meta.category === "measure") {
        matchedMeasures.push(matchedField as MeepExploreMeasure);
      } else if (matchedField.meta.category === "dimension") {
        const dimField = matchedField as MeepExploreDimension;
        if (dimField.base_field_fqfn) {
          const parts = dimField.base_field_fqfn.split(".");
          const baseExp = `${parts[0]}.${parts[1]}`;
          const dateFqfn = graph[baseExp]?.dateDimensionGroupFqfn || "";
          const queryKey = `${baseExp}::${dateFqfn}`;
          queryTargetSpecs.set(queryKey, { exploreKey: baseExp, dateFqfn });
        }
      }
    }
  });

  matchedMeasures.forEach((meas) => {
    const parts = meas.fqfn.split(".");
    if (parts.length >= 2) {
      const exploreKey = `${parts[0]}.${parts[1]}`;
      const dateFqfn =
        meas.preferred_date_fqfn ||
        graph[exploreKey]?.dateDimensionGroupFqfn ||
        "";
      const queryKey = `${exploreKey}::${dateFqfn}`;
      queryTargetSpecs.set(queryKey, { exploreKey, dateFqfn });
    }
  });

  if (queryTargetSpecs.size === 0 && selectedIdentifiers.length > 0) {
    let winningExpKey: string | null = null;
    let maxDimMatches = -1;
    let winningIsBdtTimeline = false;
    let winningIsBaseViewTimeline = false;

    Object.keys(graph).forEach((expKey) => {
      let dimMatches = 0;
      selectedIdentifiers.forEach((id) => {
        if (id.startsWith("__date.")) {
          if (graph[expKey]?.dateDimensionGroupFqfn) {
            dimMatches++;
          }
          return;
        }
        const matchedField = flatFields.find((f) => matchesIdentifier(f, id));
        if (matchedField && matchedField.meta.category === "dimension") {
          const dimField = matchedField as MeepExploreDimension;
          const isSpecificFqfn = dimField.fqfn.includes(id as any);
          if (isSpecificFqfn) {
            if (id.startsWith(`${expKey}.`)) {
              dimMatches++;
            }
          } else {
            if (dimField.fqfn.some((f) => f.startsWith(`${expKey}.`))) {
              dimMatches++;
            }
          }
        }
      });

      // Extract timeline parts to check if the timeline's view is the base view of the explore.
      // e.g. dateFqfn = "model.exploreName.viewName.field" -> parts[1] is exploreName, parts[2] is viewName.
      const dateFqfn = graph[expKey]?.dateDimensionGroupFqfn || "";
      const parts = dateFqfn.split(".");
      const isBaseViewTimeline = parts.length >= 3 && parts[1] === parts[2];
      const isBdtTimeline = meepDate?.base_date_timeline_fqfn === dateFqfn;

      // Break ties by preferring:
      // 1. Explores with a meep-bdt (explicitly designated base date timeline).
      // 2. Base/original explores where the timeline view matches the explore view (e.g. events explore for events.event).
      const isBetter =
        dimMatches > maxDimMatches ||
        (dimMatches === maxDimMatches &&
          ((isBdtTimeline && !winningIsBdtTimeline) ||
            (isBdtTimeline === winningIsBdtTimeline &&
              isBaseViewTimeline &&
              !winningIsBaseViewTimeline)));

      if (isBetter) {
        maxDimMatches = dimMatches;
        winningIsBdtTimeline = isBdtTimeline;
        winningIsBaseViewTimeline = isBaseViewTimeline;
        winningExpKey = expKey;
      }
    });

    if (winningExpKey) {
      const dateFqfn = graph[winningExpKey]?.dateDimensionGroupFqfn || "";
      queryTargetSpecs.set(`${winningExpKey}::${dateFqfn}`, {
        exploreKey: winningExpKey,
        dateFqfn,
      });
    }
  }

  const results: MeepQueryResult[] = [];

  queryTargetSpecs.forEach(({ exploreKey, dateFqfn }) => {
    const resolvedFqfns: string[] = [];
    const _warnings: MeepQueryWarning[] = [];

    selectedIdentifiers.forEach((id) => {
      if (id.startsWith("__date.")) {
        const tf = id.substring("__date.".length);
        const targetDateFqfn = dateFqfn;
        if (targetDateFqfn) {
          resolvedFqfns.push(`${targetDateFqfn}_${tf}`);
        }
        return;
      }

      const matchedField = flatFields.find((f) => matchesIdentifier(f, id));

      if (matchedField) {
        if (matchedField.meta.category === "dimension") {
          const dimField = matchedField as MeepExploreDimension;
          const targetFqfn = dimField.fqfn.find((f) =>
            f.startsWith(`${exploreKey}.`),
          );
          if (targetFqfn) {
            resolvedFqfns.push(targetFqfn);
          } else {
            const warningFqfn = dimField.fqfn[0] || "";
            const fieldLabel = dimField.label;
            _warnings.push({
              type: "unrelated_fields",
              fqfn: warningFqfn,
              message: `${fieldLabel} not available in this explore, values will be repeated`,
            });
          }
        } else if (matchedField.meta.category === "measure") {
          const measField = matchedField as MeepExploreMeasure;
          if (
            measField.fqfn.startsWith(`${exploreKey}.`) &&
            (!measField.preferred_date_fqfn ||
              measField.preferred_date_fqfn === dateFqfn)
          ) {
            resolvedFqfns.push(measField.fqfn);
          }
        }
      }
    });

    results.push({
      activeExploreKey: exploreKey,
      activeDateDimensionGroupFqfn: dateFqfn || null,
      resolvedFieldFqfns: resolvedFqfns,
      _warnings,
    });
  });

  return results;
}

/**
 * Retrieves all FQFNs matching a MEEP field label and optional group label
 */
export function getFqfnsByLabel(
  exploreData: MeepExploreData,
  label: string,
  groupLabel?: string,
): string[] {
  const fields = exploreData.fields;

  if (groupLabel) {
    const group = fields.find(
      (f) => f.is_group && f.label.toLowerCase() === groupLabel.toLowerCase(),
    );
    if (group && group.is_group) {
      const child = group.children.find(
        (c) => c.label.toLowerCase() === label.toLowerCase(),
      );
      if (child) {
        return Array.isArray(child.fqfn) ? child.fqfn : [child.fqfn];
      }
    }
  } else {
    const field = fields.find(
      (f) => !f.is_group && f.label.toLowerCase() === label.toLowerCase(),
    );
    if (field && !field.is_group) {
      return Array.isArray(field.fqfn) ? field.fqfn : [field.fqfn];
    }
  }

  throw new Error(
    `Field not found: label="${label}", groupLabel="${groupLabel}"`,
  );
}
