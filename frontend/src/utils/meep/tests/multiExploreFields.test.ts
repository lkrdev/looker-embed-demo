import type { ILookmlModelExplore } from "@looker/sdk/lib/4.0/models";
import fs from "node:fs";
import { describe, expect, it } from "vitest";
import type {
  MeepDimensionGroupField,
  MeepExploreDimension,
  MeepExploreMeasure,
} from "../../../types";
import mockExplores from "../mockExplores";
import {
  buildMeepDate,
  buildMeepExploreData,
  buildMeepFields,
  getFlatMeepLabels,
} from "../multiExploreUtils";

describe("buildMeepFields", () => {
  it("unifies dimension layering across multiple explores by label_short", () => {
    const meepFields = buildMeepFields(mockExplores);

    fs.writeFileSync(
      new URL("./buildMeepFields_mockExplores.json", import.meta.url),
      JSON.stringify(meepFields, null, 2),
    );

    const emailField = meepFields.find(
      (field) =>
        field.label === "Email" &&
        !field.is_group &&
        field.meta.category === "dimension",
    ) as MeepExploreDimension;

    expect(emailField).toBeDefined();
    expect(emailField.fqfn).toEqual([
      "meep_test.order_items.users.email",
      "meep_test.events.users.email",
      "meep_test.tickets.users.email",
      "meep_test.users.users.email",
    ]);
  });
  it("resolves the base_field_fqfn property for tagged dimensions", () => {
    const meepFields = buildMeepFields(mockExplores);

    const usersGroup = meepFields.find(
      (f) => f.is_group && f.label === "Users",
    ) as MeepDimensionGroupField;
    expect(usersGroup).toBeDefined();

    const zipCodeField = usersGroup.children.find(
      (c) => c.label === "Zip Code",
    );
    expect(zipCodeField).toBeDefined();
    expect(zipCodeField?.base_field_fqfn).toBe(
      "meep_test.users.users.zip_code",
    );

    const distCenterGroup = meepFields.find(
      (f) => f.is_group && f.label === "Distibution Location",
    ) as MeepDimensionGroupField;
    expect(distCenterGroup).toBeDefined();

    const cityField = distCenterGroup.children.find((c) => c.label === "City");
    expect(cityField).toBeDefined();
    expect(cityField?.base_field_fqfn).toBe(
      "meep_test.distribution_centers.distribution_center.city",
    );
  });
  it("chooses winning description based on meep-d tag or last one wins", () => {
    const customMockExplores: ILookmlModelExplore[] = [
      {
        id: "model_a::explore_1",
        model_name: "model_a",
        name: "explore_1",
        fields: {
          dimensions: [
            {
              name: "brand",
              label: "Brand",
              description: "First description",
              type: "string",
              tags: [],
            },
          ],
        },
      },
      {
        id: "model_a::explore_2",
        model_name: "model_a",
        name: "explore_2",
        fields: {
          dimensions: [
            {
              name: "brand",
              label: "Brand",
              description: "Winning description",
              type: "string",
              tags: ["meep-d:This is a winning description"],
            },
          ],
        },
      },
      {
        id: "model_a::explore_3",
        model_name: "model_a",
        name: "explore_3",
        fields: {
          dimensions: [
            {
              name: "brand",
              label: "Brand",
              description: "Last description",
              type: "string",
              tags: [],
            },
          ],
        },
      },
    ];

    const meepFields = buildMeepFields(customMockExplores);
    const brandField = meepFields.find(
      (field) =>
        field.label === "Brand" &&
        !field.is_group &&
        field.meta.category === "dimension",
    ) as MeepExploreDimension;

    expect(brandField).toBeDefined();
    expect(brandField.meta.description).toBe("This is a winning description");
  });

  it("defaults to last description when no field has a meep-d tag", () => {
    const customMockExplores: ILookmlModelExplore[] = [
      {
        id: "model_a::explore_1",
        model_name: "model_a",
        name: "explore_1",
        fields: {
          dimensions: [
            {
              name: "category",
              label: "Category",
              description: "First description",
              type: "string",
              tags: [],
            },
          ],
        },
      },
      {
        id: "model_a::explore_2",
        model_name: "model_a",
        name: "explore_2",
        fields: {
          dimensions: [
            {
              name: "category",
              label: "Category",
              description: "Second description",
              type: "string",
              tags: [],
            },
          ],
        },
      },
    ];

    const meepFields = buildMeepFields(customMockExplores);
    const categoryField = meepFields.find(
      (field) =>
        field.label === "Category" &&
        !field.is_group &&
        field.meta.category === "dimension",
    ) as MeepExploreDimension;

    expect(categoryField).toBeDefined();
    expect(categoryField.meta.description).toBe("Second description");
  });

  it("keeps measures with the exact same label as separate standalone items and does not roll them up", () => {
    const customMockExplores: ILookmlModelExplore[] = [
      {
        id: "model_a::explore_1",
        model_name: "model_a",
        name: "explore_1",
        fields: {
          measures: [
            {
              name: "user_count",
              label: "User Count",
              type: "count",
              tags: [],
            },
          ],
        },
      },
      {
        id: "model_a::explore_2",
        model_name: "model_a",
        name: "explore_2",
        fields: {
          measures: [
            {
              name: "user_count",
              label: "User Count",
              type: "count",
              tags: [],
            },
          ],
        },
      },
    ];

    const meepFields = buildMeepFields(customMockExplores);
    const measureMatches = meepFields.filter(
      (field) =>
        field.label === "User Count" &&
        !field.is_group &&
        field.meta.category === "measure",
    ) as MeepExploreMeasure[];

    expect(measureMatches).toHaveLength(2);
    expect(measureMatches[0].fqfn).toBe("model_a.explore_1.user_count");
    expect(measureMatches[1].fqfn).toBe("model_a.explore_2.user_count");
  });

  it("detects and warns when measures within the exact same Explore have identical labels", () => {
    const customMockExplores: ILookmlModelExplore[] = [
      {
        id: "model_a::explore_1",
        model_name: "model_a",
        name: "explore_1",
        fields: {
          measures: [
            {
              name: "view_a.count",
              label_short: "Count",
              type: "count",
              tags: [],
            },
            {
              name: "view_b.count",
              label_short: "Count",
              type: "count",
              tags: [],
            },
          ],
        },
      } as any,
    ];

    const meepFields = buildMeepFields(customMockExplores);

    expect(meepFields._warnings).toBeDefined();
    expect(meepFields._warnings).toHaveLength(1);
    expect(meepFields._warnings?.[0]).toEqual({
      type: "ambiguous_labels_in_explore",
      exploreKey: "model_a.explore_1",
      label: "Count",
      fqfns: [
        "model_a.explore_1.view_a.count",
        "model_a.explore_1.view_b.count",
      ],
      message:
        "Ambiguous label 'Count' across multiple fields in explore 'model_a.explore_1'. This should be avoided and can be changed by adding a group_label or using meep-viewgroup.",
    });
  });

  it("detects and warns when fields within the exact same Explore get rolled up under identical labels", () => {
    const customMockExplores: ILookmlModelExplore[] = [
      {
        id: "model_a::explore_1",
        model_name: "model_a",
        name: "explore_1",
        fields: {
          dimensions: [
            {
              name: "view_a.city",
              label_short: "City",
              type: "string",
              tags: [],
            },
            {
              name: "view_b.city",
              label_short: "City",
              type: "string",
              tags: [],
            },
          ],
        },
      } as any,
    ];

    const meepFields = buildMeepFields(customMockExplores);

    expect(meepFields._warnings).toBeDefined();
    expect(meepFields._warnings).toHaveLength(1);
    expect(meepFields._warnings?.[0]).toEqual({
      type: "ambiguous_labels_in_explore",
      exploreKey: "model_a.explore_1",
      label: "City",
      fqfns: ["model_a.explore_1.view_a.city", "model_a.explore_1.view_b.city"],
      message:
        "Ambiguous label 'City' across multiple fields in explore 'model_a.explore_1'. This should be avoided and can be changed by adding a group_label or using meep-viewgroup.",
    });

    const cityField = meepFields.find(
      (f) => !f.is_group && f.label === "City",
    ) as MeepExploreDimension;

    expect(cityField).toBeDefined();
    expect(cityField._warnings).toEqual(meepFields._warnings);

    fs.writeFileSync(
      new URL("./buildMeepFields_warnings_snapshot.json", import.meta.url),
      JSON.stringify(meepFields._warnings, null, 2),
    );
  });

  it("excludes fields tagged with meep-x and includes cancelled_count", () => {
    const meepFields = buildMeepFields(mockExplores);

    const isCancelledField = meepFields.find(
      (f) => !f.is_group && f.meta?.name === "order_items.is_cancelled",
    );
    expect(isCancelledField).toBeUndefined();

    const cancelledCountField = meepFields.find(
      (f) =>
        !f.is_group &&
        f.meta?.category === "measure" &&
        f.meta?.name === "order_items.cancelled_count",
    );
    expect(cancelledCountField).toBeDefined();
  });

  it("uses view-level meep-ddt default date for measures in mockExplores", () => {
    const meepFields = buildMeepFields(mockExplores);

    const countMeasure = meepFields.find(
      (f) =>
        !f.is_group &&
        f.meta?.category === "measure" &&
        f.meta?.name === "order_items.count",
    ) as MeepExploreMeasure;

    expect(countMeasure).toBeDefined();
    expect(countMeasure.preferred_date_fqfn).toBe(
      "meep_test.order_items.order_items.created",
    );
  });

  it("excludes explore tagged with meep-x entirely", () => {
    const meepFields = buildMeepFields(mockExplores);
    const hasHideMe = meepFields.some((f) => {
      if (f.is_group) return false;
      const fqfns = Array.isArray(f.fqfn) ? f.fqfn : [f.fqfn];
      return fqfns.some((fqfn) =>
        fqfn.startsWith("meep_test.order_items_hide_me."),
      );
    });
    expect(hasHideMe).toBe(false);
  });

  it("excludes join/view tagged with meep-x:<view_name> from the specific explore", () => {
    const meepFields = buildMeepFields(mockExplores);
    const hasHideViewInOrderItems = meepFields.some((f) => {
      if (f.is_group) return false;
      const fqfns = Array.isArray(f.fqfn) ? f.fqfn : [f.fqfn];
      return fqfns.some((fqfn) =>
        fqfn.startsWith("meep_test.order_items.hide_view."),
      );
    });
    expect(hasHideViewInOrderItems).toBe(false);
  });

  it("excludes explore marked with hidden: yes in LookML", () => {
    const meepFields = buildMeepFields(mockExplores);
    const hasAlreadyHidden = meepFields.some((f) => {
      if (f.is_group) return false;
      const fqfns = Array.isArray(f.fqfn) ? f.fqfn : [f.fqfn];
      return fqfns.some((fqfn) =>
        fqfn.startsWith("meep_test.order_items_already_hidden."),
      );
    });
    expect(hasAlreadyHidden).toBe(false);
  });

  it("relabels field differently for two explores based on Explore-level meep-l tag", () => {
    const meepFields = buildMeepFields(mockExplores);

    const purchasingUsers = meepFields.find(
      (f) => !f.is_group && f.fqfn === "meep_test.order_items.users.count",
    );
    expect(purchasingUsers).toBeDefined();
    expect(purchasingUsers?.label).toBe("Purchasing Users");

    const eventActiveUsers = meepFields.find(
      (f) => !f.is_group && f.fqfn === "meep_test.events.users.count",
    );
    expect(eventActiveUsers).toBeDefined();
    expect(eventActiveUsers?.label).toBe("Event Active Users");
  });

  it("detects and warns when measures across different explores have identical labels", () => {
    const customMockExplores: ILookmlModelExplore[] = [
      {
        id: "model_a::explore_1",
        model_name: "model_a",
        name: "explore_1",
        fields: {
          measures: [
            {
              name: "user_count",
              label: "User Count",
              type: "count",
              tags: [],
            },
          ],
        },
      },
      {
        id: "model_a::explore_2",
        model_name: "model_a",
        name: "explore_2",
        fields: {
          measures: [
            {
              name: "user_count",
              label: "User Count",
              type: "count",
              tags: [],
            },
          ],
        },
      },
    ];

    const meepFields = buildMeepFields(customMockExplores);

    expect(meepFields._warnings).toBeDefined();
    expect(meepFields._warnings).toHaveLength(1);
    expect(meepFields._warnings?.[0]).toEqual({
      type: "ambiguous_measures_across_explores",
      label: "User Count",
      fqfns: ["model_a.explore_1.user_count", "model_a.explore_2.user_count"],
      message:
        "Ambiguous measure label 'User Count' across multiple explores. This should be avoided by using meep-l tags at the explore level to distinguish them.",
    });

    const measureMatches = meepFields.filter(
      (field) =>
        field.label === "User Count" &&
        !field.is_group &&
        field.meta.category === "measure",
    ) as MeepExploreMeasure[];

    expect(measureMatches[0]._warnings).toBeDefined();
    expect(measureMatches[0]._warnings?.[0].type).toBe(
      "ambiguous_measures_across_explores",
    );
    expect(measureMatches[1]._warnings).toBeDefined();
    expect(measureMatches[1]._warnings?.[0].type).toBe(
      "ambiguous_measures_across_explores",
    );
  });

  it("defaults measure preferred_date_fqfn to meep-ddt dimension group of its view if meep-ldt is missing", () => {
    const customMockExplores: ILookmlModelExplore[] = [
      {
        id: "model_a::explore_1",
        model_name: "model_a",
        name: "explore_1",
        fields: {
          dimensions: [
            {
              name: "order_items.created_date",
              dimension_group: "order_items.created",
              type: "date_date",
              view: "order_items",
              tags: ["meep-ddt"],
            },
            {
              name: "order_items.delivered_date",
              dimension_group: "order_items.delivered",
              type: "date_date",
              view: "order_items",
              tags: [],
            },
          ],
          measures: [
            {
              name: "order_items.count",
              view: "order_items",
              type: "count",
              tags: [],
            },
            {
              name: "order_items.delivered_count",
              view: "order_items",
              type: "count",
              tags: ["meep-ldt:order_items.delivered"],
            },
          ],
        },
      } as any,
    ];

    const meepFields = buildMeepFields(customMockExplores);
    const countMeasure = meepFields.find(
      (f) => !f.is_group && f.meta.name === "order_items.count",
    ) as MeepExploreMeasure;
    const deliveredMeasure = meepFields.find(
      (f) => !f.is_group && f.meta.name === "order_items.delivered_count",
    ) as MeepExploreMeasure;

    expect(countMeasure).toBeDefined();
    expect(countMeasure.preferred_date_fqfn).toBe(
      "model_a.explore_1.order_items.created",
    );

    expect(deliveredMeasure).toBeDefined();
    expect(deliveredMeasure.preferred_date_fqfn).toBe(
      "model_a.explore_1.order_items.delivered",
    );
  });

  it("resolves the dimension label and group label hierarchies exhaustively using tickets explore", () => {
    const meepFields = buildMeepFields(mockExplores);

    const findStandaloneDim = (name: string) =>
      meepFields.find(
        (f) =>
          !f.is_group &&
          f.meta?.category === "dimension" &&
          f.meta?.name === name,
      ) as MeepExploreDimension | undefined;

    const findGroup = (label: string) =>
      meepFields.find(
        (f) => f.is_group && f.category === "dimension" && f.label === label,
      ) as MeepDimensionGroupField | undefined;

    const findDimInGroup = (groupLabel: string, name: string) => {
      const group = findGroup(groupLabel);
      return group?.children.find(
        (c: MeepExploreDimension) => c.meta?.name === name,
      );
    };

    // --- Regular Label Hierarchy Assertions ---

    // A1: No tags, only name -> resolves to name/label
    const idDim = findStandaloneDim("tickets.id");
    expect(idDim).toBeDefined();
    expect(idDim?.label).toBe("ID");

    // A2: No tags, with label -> resolves to label
    const statusDim = findStandaloneDim("tickets.status");
    expect(statusDim).toBeDefined();
    expect(statusDim?.label).toBe("Ticket Status");

    // A3: No tags, with label (priority) -> resolves to label
    const priorityDim = findStandaloneDim("tickets.priority");
    expect(priorityDim).toBeDefined();
    expect(priorityDim?.label).toBe("Priority");

    // B: Tagged with meep-l (no value) -> falls back to label/label_short/name
    const tagMeepLDim = findStandaloneDim("tickets.tag_meep_l");
    expect(tagMeepLDim).toBeDefined();
    expect(tagMeepLDim?.label).toBe("Custom Tag L");

    // C: Tagged with meep-l:Value -> resolves to Value
    const tagMeepLValDim = findStandaloneDim("tickets.tag_meep_l_val");
    expect(tagMeepLValDim).toBeDefined();
    expect(tagMeepLValDim?.label).toBe("Overridden Label");

    // D: Explore-level override meep-l:tickets.tag_explore_override=Explore Override Value
    const tagExpOverrideDim = findStandaloneDim("tickets.tag_explore_override");
    expect(tagExpOverrideDim).toBeDefined();
    expect(tagExpOverrideDim?.label).toBe("Explore Override Value");

    // --- Group Label Hierarchy Assertions ---

    // E1: No group tags, no native group -> should be standalone
    const noGroupDim = findStandaloneDim("tickets.no_group");
    expect(noGroupDim).toBeDefined();

    // E2: No group tags, native group_label -> resolves to "Native Group"
    const groupNativeDim = findDimInGroup(
      "Native Group",
      "tickets.group_native",
    );
    expect(groupNativeDim).toBeDefined();
    expect(groupNativeDim?.label).toBe("Group Native");

    // F: Tagged with meep-gl:Value -> resolves to "MEEP Group" (overrides native "Native Group")
    const groupMeepGlDim = findDimInGroup(
      "MEEP Group",
      "tickets.group_meep_gl",
    );
    expect(groupMeepGlDim).toBeDefined();
    expect(groupMeepGlDim?.label).toBe("Group Meep Gl");
    // Also verify it's not in the Native Group
    expect(
      findDimInGroup("Native Group", "tickets.group_meep_gl"),
    ).toBeUndefined();

    // G1: Tagged with meep-viewgroup and has view_label -> resolves to "Ticket View Label"
    const groupMeepVgDim = findDimInGroup(
      "Ticket View Label",
      "tickets.group_meep_vg",
    );
    expect(groupMeepVgDim).toBeDefined();
    expect(groupMeepVgDim?.label).toBe("Group Meep Vg");

    // G2: Tagged with meep-viewgroup, no view_label -> falls back to view name ("Tickets")
    const groupMeepVgFallbackDim = findDimInGroup(
      "Tickets",
      "tickets.group_meep_vg_fallback",
    );
    expect(groupMeepVgFallbackDim).toBeDefined();
    expect(groupMeepVgFallbackDim?.label).toBe("Group Meep Vg Fallback");
  });

  it("generates flat labels and writes to label.txt", () => {
    const meepFields = buildMeepFields(mockExplores);
    const meepDate = buildMeepDate(mockExplores);
    const flatLabels = getFlatMeepLabels(meepFields, meepDate);
    fs.writeFileSync(
      new URL("./label.txt", import.meta.url),
      flatLabels.join("\n") + "\n",
    );
    expect(flatLabels.length).toBeGreaterThan(0);
  });
});

describe("buildMeepExploreData", () => {
  it("builds sorted fields and meep date in a single pass", () => {
    const { fields, date } = buildMeepExploreData(mockExplores);

    expect(fields).toBeDefined();
    expect(date).toBeDefined();

    // Check that fields are sorted by label
    for (let i = 0; i < fields.length - 1; i++) {
      const comparison = fields[i].label.localeCompare(fields[i + 1].label);
      expect(comparison).toBeLessThanOrEqual(0);
    }
  });
});
