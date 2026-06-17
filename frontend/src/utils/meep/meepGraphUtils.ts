import type {
  MeepExploreDate,
  MeepExploreDimension,
  MeepExploreGraph,
  MeepExploreMeasure,
  TMeepFields,
} from "../../types";

export function flattenMeepFields(
  meepFields: TMeepFields,
): (MeepExploreDimension | MeepExploreMeasure)[] {
  const flat: (MeepExploreDimension | MeepExploreMeasure)[] = [];
  meepFields.forEach((item) => {
    if (item.is_group) {
      if (item.category === "dimension") {
        item.children.forEach((c) => flat.push(c));
      } else if (item.category === "measure") {
        item.children.forEach((c) => flat.push(c));
      }
    } else {
      flat.push(item);
    }
  });
  return flat;
}

export function buildMeepGraph(
  meepFields: TMeepFields,
  meepDate?: MeepExploreDate | null,
): MeepExploreGraph {
  const graph: MeepExploreGraph = {};

  const ensureNode = (
    exploreKey: string,
    modelName: string,
    exploreName: string,
  ) => {
    if (!graph[exploreKey]) {
      graph[exploreKey] = {
        exploreKey,
        modelName,
        exploreName,
        dateDimensionGroupFqfn: "",
        dimensions: [],
        measures: [],
      };
    }
    return graph[exploreKey];
  };

  if (meepDate?.dimension_groups_fqfn) {
    meepDate.dimension_groups_fqfn.forEach((dateFqfn) => {
      const parts = dateFqfn.split(".");
      if (parts.length >= 2) {
        const modelName = parts[0];
        const exploreName = parts[1];
        const exploreKey = `${modelName}.${exploreName}`;
        const node = ensureNode(exploreKey, modelName, exploreName);
        node.dateDimensionGroupFqfn = dateFqfn;
      }
    });
  }

  const flatFields = flattenMeepFields(meepFields);

  flatFields.forEach((field) => {
    if (field.meta.category === "dimension") {
      const dimField = field as MeepExploreDimension;
      dimField.fqfn.forEach((fqfn) => {
        const parts = fqfn.split(".");
        if (parts.length >= 2) {
          const modelName = parts[0];
          const exploreName = parts[1];
          const exploreKey = `${modelName}.${exploreName}`;
          const node = ensureNode(exploreKey, modelName, exploreName);
          if (!node.dimensions.includes(fqfn)) {
            node.dimensions.push(fqfn);
          }
        }
      });
    } else if (field.meta.category === "measure") {
      const measField = field as MeepExploreMeasure;
      const fqfn = measField.fqfn;
      const parts = fqfn.split(".");
      if (parts.length >= 2) {
        const modelName = parts[0];
        const exploreName = parts[1];
        const exploreKey = `${modelName}.${exploreName}`;
        const node = ensureNode(exploreKey, modelName, exploreName);
        if (measField.preferred_date_fqfn && !node.dateDimensionGroupFqfn) {
          node.dateDimensionGroupFqfn = measField.preferred_date_fqfn;
        }
        if (!node.measures.includes(fqfn)) {
          node.measures.push(fqfn);
        }
      }
    }
  });

  return graph;
}
