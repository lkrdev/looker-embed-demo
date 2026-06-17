import type { IWriteQuery } from "@looker/sdk/lib/4.0/models";
import type {
  MeepExploreData,
  MeepExploreDimension,
  MeepExploreMeasure,
} from "../../types";
import { flattenMeepFields } from "./meepGraphUtils";

interface IQueries {
  [model: string]: { [explore: string]: { [dateFqfn: string]: IWriteQuery } };
}
export interface BuildMeepQueriesOptions {
  selections: string[];
  exploreData: MeepExploreData;
  pivots?: string[];
  filters?: Record<string, string>;
}

function dateToFqfn(fqfn: string, selected_date: string) {
  const timeframe = selected_date.split(".").pop() as string;
  return `${fqfn}_${timeframe}`;
}

function fqfnToModelExploreField(fqfn: string) {
  const parts = fqfn.split(".");
  return {
    model: parts[0],
    explore: parts[1],
    field: parts.slice(2).join("."),
  };
}

function getOrCreateQueriesForExplore(
  queries: IQueries,
  model: string,
  explore: string,
) {
  if (!queries[model]) {
    queries[model] = {};
  }
  if (!queries[model][explore]) {
    queries[model][explore] = {};
  }
  return queries[model][explore];
}

function checkQueryObject(
  queries: IQueries,
  model: string,
  explore: string,
  date_fqfn: string,
) {
  if (!queries[model]) {
    queries[model] = {};
  }
  if (!queries[model][explore]) {
    queries[model][explore] = {};
  }
  if (!queries[model][explore][date_fqfn]) {
    queries[model][explore][date_fqfn] = {
      fields: [] as string[],
      filters: {} as Record<string, string>,
      pivots: [] as string[],
      model,
      view: explore,
    };
  }
}

function pushFieldToQuery(
  queries: IQueries,
  {
    model,
    explore,
    date_fqfn,
    field,
    add_to_pivot,
  }: {
    model: string;
    explore: string;
    date_fqfn?: string;
    field: string;
    add_to_pivot?: boolean;
  },
) {
  // push field into queries[model][explore][dateFqfn] __no_date_fqfn__ if date_fqfn is undefined
  // we dont know if any of the keys are set yet
  const dfqfn = date_fqfn || "__no_date_fqfn__";
  checkQueryObject(queries, model, explore, dfqfn);
  if (!queries[model][explore][dfqfn]) {
    queries[model][explore][dfqfn] = {
      fields: [] as string[],
      model,
      view: explore,
    };
  }
  queries[model!][explore!][dfqfn!].fields!.push(field);
  if (add_to_pivot) {
    queries[model!][explore!][dfqfn!].pivots!.push(field);
  }
  return queries;
}

function mergeFiltersToQuery(
  queries: IQueries,
  {
    model,
    explore,
    date_fqfn,
    filters,
  }: {
    model: string;
    explore: string;
    date_fqfn?: string;
    filters: Record<string, string>;
  },
) {
  const dfqfn = date_fqfn || "__no_date_fqfn__";
  checkQueryObject(queries, model, explore, dfqfn);
  queries[model][explore][dfqfn].filters = {
    ...queries[model][explore][dfqfn].filters,
    ...filters,
  };
  return queries;
}

/**
 * Builds Looker IWriteQuery objects from user selected MEEP identifiers
 */
export function buildMeepQueries(
  options: BuildMeepQueriesOptions,
): IWriteQuery[] {
  const {
    selections: selectedIdentifiers,
    exploreData,
    pivots: pivotedIdentifiers = [],
    filters = {},
  } = options;

  const meepDate = exploreData.date;

  const fqfnMappedExploreData = flattenMeepFields(exploreData.fields).reduce(
    (acc, field) => {
      if (Array.isArray(field.fqfn)) {
        field.fqfn.forEach((fqfn: string) => {
          acc[fqfn] = field;
        });
      } else if (typeof field.fqfn === "string") {
        acc[field.fqfn] = field;
      }
      return acc;
    },
    {} as Record<string, MeepExploreDimension | MeepExploreMeasure>,
  );

  const field_breakout = selectedIdentifiers.reduce(
    (acc, selected: string) => {
      const field_def = fqfnMappedExploreData[selected];
      if (selected.startsWith("__date.")) {
        acc.dates.push({ selected });
      } else if (field_def.meta.category === "measure") {
        acc.measures.push({ selected, field: field_def as MeepExploreMeasure });
      } else {
        acc.dimensions.push({
          selected,
          field: field_def as MeepExploreDimension,
        });
      }
      return acc;
    },
    {
      measures: [] as { selected: string; field: MeepExploreMeasure }[],
      dates: [] as { selected: string }[],
      dimensions: [] as { selected: string; field: MeepExploreDimension }[],
    },
  );

  const { dateFilters, measureFilters, dimensionFilters } = Object.entries(
    filters,
  ).reduce(
    (acc, [key, value]) => {
      if (key.startsWith("__date.")) {
        acc.dateFilters[key] = value;
      } else if (fqfnMappedExploreData[key]?.meta?.category === "measure") {
        acc.measureFilters[key] = value;
      } else if (fqfnMappedExploreData[key]?.meta?.category === "dimension") {
        acc.dimensionFilters[key] = value;
      }
      return acc;
    },
    {
      dateFilters: {},
      measureFilters: {},
      dimensionFilters: {},
    } as {
      dateFilters: Record<string, string>;
      measureFilters: Record<string, string>;
      dimensionFilters: Record<string, string>;
    },
  );

  // special case ... no measures! we should short circuit and build "base" queries.
  if (!field_breakout.measures.length) {
    return buildNoMeasureQueries(options, fqfnMappedExploreData);
  }

  const hasSelectedDate = field_breakout.dates.length > 0;
  const hasDate =
    hasSelectedDate ||
    Object.keys(filters).some((k) => k.startsWith("__date."));

  let queries: IQueries = {};

  if (hasSelectedDate && meepDate?.base_date_timeline_fqfn?.length) {
    const {
      model: baseModel,
      explore: baseExplore,
      field: timelineField,
    } = fqfnToModelExploreField(meepDate.base_date_timeline_fqfn);
    // make a new query for base_date_timeline_fqfn if
    field_breakout.dates.forEach((dt) => {
      pushFieldToQuery(queries, {
        model: baseModel,
        explore: baseExplore,
        date_fqfn: meepDate.base_date_timeline_fqfn,
        field: dateToFqfn(timelineField, dt.selected),
        add_to_pivot: pivotedIdentifiers.includes(dt.selected),
      });
    });

    Object.entries(dateFilters).forEach(([dateFqfn, value]) => {
      pushFieldToQuery(queries, {
        model: baseModel,
        explore: baseExplore,
        date_fqfn: dateFqfn,
        field: value,
      });
      if (dateFilters.length) {
        mergeFiltersToQuery(queries, {
          model: baseModel,
          explore: baseExplore,
          date_fqfn: dateFqfn,
          filters,
        });
      }
    });
  }

  // process measures first as they dictate the fqfn date key used in in model.explore.fqfn
  for (const measure of field_breakout.measures) {
    const { model, explore, field } = fqfnToModelExploreField(measure.selected);
    const query_measure = hasDate
      ? measure.field.preferred_date_fqfn
      : undefined;
    pushFieldToQuery(queries, {
      model,
      explore,
      date_fqfn: query_measure,
      field,
    });
    if (hasSelectedDate) {
      for (const selected_date of field_breakout.dates) {
        const is_pivoted = pivotedIdentifiers.includes(selected_date.selected);
        const { field: timeframe_field } = fqfnToModelExploreField(
          measure.field.preferred_date_fqfn,
        );
        pushFieldToQuery(queries, {
          model,
          explore,
          date_fqfn: measure.field.preferred_date_fqfn,
          field: dateToFqfn(timeframe_field, selected_date.selected),
          add_to_pivot: is_pivoted,
        });
      }
    }

    if (Object.keys(dateFilters).length && hasDate && query_measure) {
      const { field: date_field } = fqfnToModelExploreField(query_measure);
      mergeFiltersToQuery(queries, {
        model,
        explore,
        date_fqfn: query_measure,
        filters: Object.fromEntries(
          Object.entries(dateFilters).map(([key, value]) => {
            return [dateToFqfn(date_field, key), value];
          }),
        ),
      });
    }
    if (Object.keys(measureFilters).length) {
      mergeFiltersToQuery(queries, {
        model,
        explore,
        date_fqfn: query_measure,
        filters: measureFilters,
      });
    }
  }

  for (const dimension of field_breakout.dimensions) {
    const { model, explore, field } = fqfnToModelExploreField(
      dimension.selected,
    );
    const is_pivoted = pivotedIdentifiers.includes(dimension.selected);
    if (dimension.field.base_field_fqfn) {
      const {
        model: baseModel,
        explore: baseExplore,
        field: baseField,
      } = fqfnToModelExploreField(dimension.field.base_field_fqfn);
      queries = pushFieldToQuery(queries, {
        model: baseModel,
        explore: baseExplore,
        field: baseField,
        add_to_pivot: is_pivoted,
      });
    }
    const explore_queries = getOrCreateQueriesForExplore(
      queries,
      model,
      explore,
    );
    if (explore_queries && Object.keys(explore_queries).length) {
      for (const date_fqfn of Object.keys(explore_queries)) {
        queries = pushFieldToQuery(queries, {
          model,
          explore,
          date_fqfn,
          field,
          add_to_pivot: is_pivoted,
        });
      }
    } else if (!field_breakout.measures.length) {
      queries = pushFieldToQuery(queries, {
        model,
        explore,
        field,
        add_to_pivot: is_pivoted,
      });
    }
  }

  // process non-date filters
  Object.entries(dimensionFilters).forEach(([key, value]) => {
    const { model, explore, field } = fqfnToModelExploreField(key);
    const explore_queries = getOrCreateQueriesForExplore(
      queries,
      model,
      explore,
    );
    if (explore_queries && Object.keys(explore_queries).length) {
      for (const date_fqfn of Object.keys(explore_queries)) {
        queries = mergeFiltersToQuery(queries, {
          model,
          explore,
          date_fqfn,
          filters: { [field]: value },
        });
      }
    } else {
      queries = mergeFiltersToQuery(queries, {
        model,
        explore,
        filters: { [field]: value },
      });
    }
  });

  let queryList = Object.values(queries)
    .flatMap((model) => Object.values(model))
    .flatMap((explore) => Object.values(explore));

  if (hasSelectedDate && !queryList.length) {
    const first_found_date_fqfn = exploreData.date?.dimension_groups_fqfn?.[0];
    if (!first_found_date_fqfn) return [];
    else {
      const first_found_date = fqfnToModelExploreField(first_found_date_fqfn);
      const dt_fields = field_breakout.dates.map((dt) =>
        dateToFqfn(first_found_date.field, dt.selected),
      );
      const pivoted_timeframes = pivotedIdentifiers
        .filter((f) => f.startsWith("__date."))
        .map((f) => dateToFqfn(first_found_date_fqfn, f));

      const timeOnlyQuery: IWriteQuery = {
        model: first_found_date.model,
        view: first_found_date.explore,
        fields: dt_fields,
        pivots: pivoted_timeframes,
      };
      return [timeOnlyQuery];
    }
  }

  return queryList.map((q) => ({
    ...q,
    fields: Array.from(new Set(q.fields)),
    pivots: Array.from(new Set(q.pivots)),
  }));
}

function buildNoMeasureQueries(
  options: BuildMeepQueriesOptions,
  fqfnMappedExploreData: Record<
    string,
    MeepExploreDimension | MeepExploreMeasure
  >,
): IWriteQuery[] {
  const {
    selections: selectedIdentifiers,
    exploreData,
    pivots: pivotedIdentifiers = [],
    filters = {},
  } = options;

  const meepDate = exploreData.date;

  const field_breakout = selectedIdentifiers.reduce(
    (acc, selected: string) => {
      const field_def = fqfnMappedExploreData[selected];
      if (selected.startsWith("__date.")) {
        acc.dates.push({ selected });
      } else if (field_def?.meta?.category === "measure") {
        acc.measures.push({ selected, field: field_def as MeepExploreMeasure });
      } else if (field_def?.meta?.category === "dimension") {
        acc.dimensions.push({
          selected,
          field: field_def as MeepExploreDimension,
        });
      }
      return acc;
    },
    {
      measures: [] as { selected: string; field: MeepExploreMeasure }[],
      dates: [] as { selected: string }[],
      dimensions: [] as { selected: string; field: MeepExploreDimension }[],
    },
  );

  const { dateFilters, dimensionFilters } = Object.entries(filters).reduce(
    (acc, [key, value]) => {
      if (key.startsWith("__date.")) {
        acc.dateFilters[key] = value;
      } else if (fqfnMappedExploreData[key]?.meta?.category === "dimension") {
        acc.dimensionFilters[key] = value;
      }
      return acc;
    },
    {
      dateFilters: {} as Record<string, string>,
      dimensionFilters: {} as Record<string, string>,
    },
  );

  const queries: IQueries = {};

  // Process dates first
  const hasSelectedDate = field_breakout.dates.length > 0;
  const hasDate = hasSelectedDate || Object.keys(dateFilters).length > 0;

  let chosen_date_fqfn: string | undefined;
  if (hasDate) {
    chosen_date_fqfn =
      meepDate?.base_date_timeline_fqfn || meepDate?.dimension_groups_fqfn?.[0];
  }

  if (chosen_date_fqfn) {
    const {
      model: dateModel,
      explore: dateExplore,
      field: dateField,
    } = fqfnToModelExploreField(chosen_date_fqfn);

    field_breakout.dates.forEach((dt) => {
      pushFieldToQuery(queries, {
        model: dateModel,
        explore: dateExplore,
        date_fqfn: chosen_date_fqfn,
        field: dateToFqfn(dateField, dt.selected),
        add_to_pivot: pivotedIdentifiers.includes(dt.selected),
      });
    });

    if (Object.keys(dateFilters).length) {
      mergeFiltersToQuery(queries, {
        model: dateModel,
        explore: dateExplore,
        date_fqfn: chosen_date_fqfn,
        filters: Object.fromEntries(
          Object.entries(dateFilters).map(([key, value]) => {
            return [dateToFqfn(dateField, key), value];
          }),
        ),
      });
    }
  }

  // Process dimensions
  const remainingSelections = [...selectedIdentifiers];
  const removeSelections = (fqfns: string[]) => {
    fqfns.forEach((fqfn) => {
      const idx = remainingSelections.indexOf(fqfn);
      if (idx !== -1) {
        remainingSelections.splice(idx, 1);
      }
    });
  };

  while (remainingSelections.length > 0) {
    const currentFqfn = remainingSelections[0];
    const field_def = fqfnMappedExploreData[currentFqfn];

    if (!field_def || field_def.meta.category !== "dimension") {
      remainingSelections.shift();
      continue;
    }

    const dimensionField = field_def as MeepExploreDimension;
    removeSelections([currentFqfn, ...dimensionField.fqfn]);

    let targetFqfn: string;
    if (dimensionField.base_field_fqfn) {
      targetFqfn = dimensionField.base_field_fqfn;
    } else {
      const matchingFqfn = dimensionField.fqfn.find((fqfn) => {
        const { model, explore } = fqfnToModelExploreField(fqfn);
        return queries[model]?.[explore] !== undefined;
      });
      targetFqfn = matchingFqfn || currentFqfn;
    }

    const { model, explore, field } = fqfnToModelExploreField(targetFqfn);
    const is_pivoted =
      pivotedIdentifiers.includes(currentFqfn) ||
      pivotedIdentifiers.includes(targetFqfn);

    const explore_queries = queries[model]?.[explore];
    if (explore_queries && Object.keys(explore_queries).length) {
      for (const date_fqfn of Object.keys(explore_queries)) {
        pushFieldToQuery(queries, {
          model,
          explore,
          date_fqfn,
          field,
          add_to_pivot: is_pivoted,
        });
      }
    } else {
      pushFieldToQuery(queries, {
        model,
        explore,
        field,
        add_to_pivot: is_pivoted,
      });
    }
  }

  // Process dimension filters
  Object.entries(dimensionFilters).forEach(([key, value]) => {
    const { model, explore, field } = fqfnToModelExploreField(key);
    const explore_queries = queries[model]?.[explore];
    if (explore_queries && Object.keys(explore_queries).length) {
      for (const date_fqfn of Object.keys(explore_queries)) {
        mergeFiltersToQuery(queries, {
          model,
          explore,
          date_fqfn,
          filters: { [field]: value },
        });
      }
    } else {
      mergeFiltersToQuery(queries, {
        model,
        explore,
        filters: { [field]: value },
      });
    }
  });

  return Object.values(queries)
    .flatMap((model) => Object.values(model))
    .flatMap((explore) => Object.values(explore))
    .map((q) => ({
      ...q,
      fields: Array.from(new Set(q.fields)),
      pivots: Array.from(new Set(q.pivots)),
    }));
}
