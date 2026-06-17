import type {
  ILookmlModelExploreField,
} from "@looker/sdk/lib/4.0/models";
import { resolveFieldDescription } from "./meep/meepMetadataUtils";

export interface ISearchField {
  explore_id: string[];
  fqfn: string[] | null;
  field_group_label: string | null;
  label: string;
  field?: ILookmlModelExploreField;
  children?: ISearchField[];
}

export interface IExploreSection {
  explore_id: string;
  model_name: string;
  explore_name: string;
  label: string;
  dimensions: ISearchField[];
  measures: ISearchField[];
}

export function processExploreFields(
  explore: {
    title?: string | null;
    label?: string | null;
    name?: string | null;
    fields?: {
      dimensions?: ILookmlModelExploreField[] | null;
      measures?: ILookmlModelExploreField[] | null;
    } | null;
  },
  modelName: string,
  exploreName: string,
): IExploreSection {
  const explore_id = `${modelName}.${exploreName}`;
  const exploreLabel = explore.title || explore.label || explore.name || explore_id;

  const processCategory = (fields?: ILookmlModelExploreField[] | null) => {
    if (!fields) return [];

    const groupMap: Record<string, ISearchField> = {};
    const topItems: ISearchField[] = [];

    fields.forEach((field) => {
      const fqfn = `${explore_id}.${field.name}`;
      const fgl = field.field_group_label ? field.field_group_label.trim() : null;

      const { description } = resolveFieldDescription(field);
      const processedField: ILookmlModelExploreField = {
        ...field,
        description,
      };

      if (fgl) {
        if (!groupMap[fgl]) {
          const groupField: ISearchField = {
            explore_id: [explore_id],
            fqfn: null,
            field_group_label: fgl,
            label: fgl,
            children: [],
          };
          groupMap[fgl] = groupField;
          topItems.push(groupField);
        }
        const childLabel = field.field_group_variant || field.label_short || field.label || field.name || "";
        groupMap[fgl].children!.push({
          explore_id: [explore_id],
          fqfn: [fqfn],
          field_group_label: fgl,
          label: childLabel,
          field: processedField,
        });
      } else {
        topItems.push({
          explore_id: [explore_id],
          fqfn: [fqfn],
          field_group_label: null,
          label: field.label_short || field.label || field.name || "",
          field: processedField,
        });
      }
    });

    topItems.sort((a, b) => a.label.localeCompare(b.label));
    return topItems;
  };

  return {
    explore_id,
    model_name: modelName,
    explore_name: exploreName,
    label: exploreLabel,
    dimensions: processCategory(explore.fields?.dimensions),
    measures: processCategory(explore.fields?.measures),
  };
}

export function filterExploreSections(
  explores: IExploreSection[],
  searchQuery: string,
): IExploreSection[] {
  if (!searchQuery.trim()) return explores;
  const query = searchQuery.toLocaleLowerCase().trim();

  const matchStr = (str?: string | null) => str ? str.toLocaleLowerCase().includes(query) : false;

  const filterList = (items: ISearchField[]) => {
    return items.reduce((acc, item) => {
      if (item.fqfn === null && item.children) {
        const groupMatches = matchStr(item.field_group_label);
        const matchingChildren = item.children.filter(c =>
          groupMatches ||
          matchStr(c.label) ||
          matchStr(c.field?.description) ||
          matchStr(c.field?.name)
        );
        if (matchingChildren.length > 0) {
          acc.push({
            ...item,
            children: matchingChildren,
          });
        }
      } else {
        const standaloneMatches = matchStr(item.label) ||
          matchStr(item.field?.description) ||
          matchStr(item.field?.name) ||
          matchStr(item.field_group_label);
        if (standaloneMatches) {
          acc.push(item);
        }
      }
      return acc;
    }, [] as ISearchField[]);
  };

  return explores.reduce((acc, exp) => {
    const expMatches = matchStr(exp.label) || matchStr(exp.explore_name) || matchStr(exp.model_name);

    if (expMatches) {
      acc.push(exp);
    } else {
      const filteredDim = filterList(exp.dimensions);
      const filteredMeas = filterList(exp.measures);

      if (filteredDim.length > 0 || filteredMeas.length > 0) {
        acc.push({
          ...exp,
          dimensions: filteredDim,
          measures: filteredMeas,
        });
      }
    }
    return acc;
  }, [] as IExploreSection[]);
}

export function computeAutoUnfurled(
  explores: IExploreSection[],
  searchQuery: string,
): Record<string, boolean> {
  if (!searchQuery.trim()) return {};
  const query = searchQuery.toLocaleLowerCase().trim();
  const result: Record<string, boolean> = {};

  const matchStr = (str?: string | null) => str ? str.toLocaleLowerCase().includes(query) : false;

  explores.forEach((exp) => {
    const expKey = `exp:${exp.explore_id}`;
    let expHasMatch = false;

    const checkList = (items: ISearchField[], category: "dim" | "meas") => {
      items.forEach((item) => {
        if (item.fqfn === null && item.children) {
          const groupMatches = matchStr(item.field_group_label);
          const childMatches = item.children.some(c =>
            matchStr(c.label) || matchStr(c.field?.description) || matchStr(c.field?.name)
          );
          if (groupMatches || childMatches) {
            result[`grp:${exp.explore_id}:${category}:${item.field_group_label}`] = true;
            expHasMatch = true;
          }
        } else {
          const standaloneMatches = matchStr(item.label) ||
            matchStr(item.field?.description) ||
            matchStr(item.field?.name);
          if (standaloneMatches) {
            expHasMatch = true;
          }
        }
      });
    };

    checkList(exp.dimensions, "dim");
    checkList(exp.measures, "meas");

    if (expHasMatch) {
      result[expKey] = true;
    }
  });

  return result;
}

export function getInUseExploreSections(
  explores: IExploreSection[],
  selectedFields: Record<string, boolean>,
): IExploreSection[] {
  return explores.reduce((acc, exp) => {
    const getSelected = (items: ISearchField[]) => {
      return items.reduce((subAcc, item) => {
        if (item.fqfn === null && item.children) {
          const selectedChildren = item.children.filter(c => c.fqfn?.[0] && selectedFields[c.fqfn[0]]);
          if (selectedChildren.length > 0) {
            subAcc.push({
              ...item,
              children: selectedChildren,
            });
          }
        } else if (item.fqfn?.[0] && selectedFields[item.fqfn[0]]) {
          subAcc.push(item);
        }
        return subAcc;
      }, [] as ISearchField[]);
    };

    const selDim = getSelected(exp.dimensions);
    const selMeas = getSelected(exp.measures);

    if (selDim.length > 0 || selMeas.length > 0) {
      acc.push({
        ...exp,
        dimensions: selDim,
        measures: selMeas,
      });
    }
    return acc;
  }, [] as IExploreSection[]);
}

export function countExploreSelectedFields(
  exp: IExploreSection,
  selectedFields: Record<string, boolean>,
): number {
  const countList = (items: ISearchField[]): number =>
    items.reduce((sum, item) => {
      if (item.fqfn === null && item.children) {
        return sum + countList(item.children);
      }
      return sum + (item.fqfn?.[0] && selectedFields[item.fqfn[0]] ? 1 : 0);
    }, 0);

  return countList(exp.dimensions) + countList(exp.measures);
}
