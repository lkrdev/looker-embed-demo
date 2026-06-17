import type { ILookmlModelExplore } from "@looker/sdk/lib/4.0/models";
import fs from "node:fs";
import { describe, expect, it } from "vitest";
import mockExplores from "../mockExplores";
import { buildMeepDate } from "../multiExploreUtils";

describe("buildMeepDate", () => {
  it("weeds out unreferenced meep-ldt dimension groups and builds the timeframe intersection", () => {
    const meepDate = buildMeepDate(mockExplores);

    expect(meepDate).toBeDefined();
    expect(meepDate).not.toBeNull();
    if (!meepDate) return;

    expect(meepDate.dimension_groups_fqfn).toEqual([
      "meep_test.order_items.order_items.cancelled",
      "meep_test.order_items.order_items.created",
      "meep_test.events.events.event",
    ]);

    expect(meepDate.timeframes).toContain("date");
    expect(meepDate.timeframes).toContain("month");
    expect(meepDate.timeframes).toContain("year");

    fs.writeFileSync(
      new URL("./buildMeepDate_snapshot.json", import.meta.url),
      JSON.stringify(meepDate, null, 2),
    );
  });

  it("correctly computes the timeframe intersection across different dimension groups, returning only common timeframes", () => {
    const customMockExplores: ILookmlModelExplore[] = [
      {
        id: "model_a::explore_1",
        fields: {
          measures: [
            {
              name: "count",
              tags: ["meep-ldt:explore_1.created"],
            },
          ],
          dimensions: [
            {
              name: "created_raw",
              dimension_group: "explore_1.created",
              type: "date_raw",
            },
            {
              name: "created_date",
              dimension_group: "explore_1.created",
              type: "date_date",
            },
            {
              name: "created_month",
              dimension_group: "explore_1.created",
              type: "date_month",
            },
          ],
        },
      },
      {
        id: "model_a::explore_2",
        fields: {
          measures: [
            {
              name: "count",
              tags: ["meep-ldt:explore_2.event"],
            },
          ],
          dimensions: [
            {
              name: "event_raw",
              dimension_group: "explore_2.event",
              type: "date_raw",
            },
            {
              name: "event_week",
              dimension_group: "explore_2.event",
              type: "date_week",
            },
            {
              name: "event_year",
              dimension_group: "explore_2.event",
              type: "date_year",
            },
          ],
        },
      },
    ];

    const meepDate = buildMeepDate(customMockExplores);

    expect(meepDate).toBeDefined();
    expect(meepDate).not.toBeNull();
    if (!meepDate) return;

    expect(meepDate.dimension_groups_fqfn).toEqual([
      "model_a.explore_1.explore_1.created",
      "model_a.explore_2.explore_2.event",
    ]);

    expect(meepDate.timeframes).toEqual(["raw"]);
  });

  it("includes meep-ddt dimension groups when referenced by measures via defaulting", () => {
    const customMockExplores: ILookmlModelExplore[] = [
      {
        id: "model_a::explore_1",
        model_name: "model_a",
        name: "explore_1",
        fields: {
          dimensions: [
            {
              name: "order_items.created_raw",
              dimension_group: "order_items.created",
              type: "date_raw",
              view: "order_items",
              tags: ["meep-ddt"],
            },
            {
              name: "order_items.created_date",
              dimension_group: "order_items.created",
              type: "date_date",
              view: "order_items",
              tags: ["meep-ddt"],
            },
          ],
          measures: [
            {
              name: "order_items.count",
              view: "order_items",
              tags: [],
            },
          ],
        },
      } as any,
    ];

    const meepDate = buildMeepDate(customMockExplores);
    expect(meepDate).toBeDefined();
    expect(meepDate).not.toBeNull();
    if (!meepDate) return;

    expect(meepDate.dimension_groups_fqfn).toEqual([
      "model_a.explore_1.order_items.created",
    ]);
  });

  it("excludes meep-ldt timeline links if the target dimension group does not exist in the explore dimensions", () => {
    const customMockExplores: ILookmlModelExplore[] = [
      {
        id: "model_a::explore_1",
        model_name: "model_a",
        name: "explore_1",
        fields: {
          dimensions: [
            {
              name: "explore_1.created_raw",
              dimension_group: "explore_1.created",
              type: "date_raw",
              view: "explore_1",
            },
            {
              name: "explore_1.created_date",
              dimension_group: "explore_1.created",
              type: "date_date",
              view: "explore_1",
            },
          ],
          measures: [
            {
              name: "explore_1.count",
              view: "explore_1",
              tags: ["meep-ldt:unjoined_view.unjoined_field"],
            },
          ],
        },
      } as any,
    ];

    const meepDate = buildMeepDate(customMockExplores);
    expect(meepDate).toBeNull();
  });
});
