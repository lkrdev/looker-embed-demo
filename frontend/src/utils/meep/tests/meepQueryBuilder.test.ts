import type { ILookmlModelExplore } from "@looker/sdk/lib/4.0/models";
import { describe, expect, it } from "vitest";
import mockExplores from "../mockExplores";
import {
  buildMeepExploreData,
  buildMeepQueries,
  getFqfnsByLabel,
} from "../multiExploreUtils";

describe("buildMeepQueries", () => {
  it("generates looker IWriteQuery for order_items.count", () => {
    const exploreData = buildMeepExploreData(mockExplores);
    const queries = buildMeepQueries({
      selections: ["meep_test.order_items.order_items.count"],
      exploreData,
    });

    expect(queries).toHaveLength(1);
    expect(queries[0]).toMatchObject({
      model: "meep_test",
      view: "order_items",
      fields: ["order_items.count"],
    });
  });

  it("generates looker IWriteQuery for order_items.count and order_items.cancelled_count", () => {
    const exploreData = buildMeepExploreData(mockExplores);
    const queries = buildMeepQueries({
      selections: [
        "meep_test.order_items.order_items.count",
        "meep_test.order_items.order_items.cancelled_count",
      ],
      exploreData,
    });

    expect(queries).toHaveLength(1);
    expect(queries[0]).toMatchObject({
      model: "meep_test",
      view: "order_items",
      fields: ["order_items.count", "order_items.cancelled_count"],
    });
  });

  it("generates looker IWriteQuery for order_items.count and users.city dimension", () => {
    const exploreData = buildMeepExploreData(mockExplores);
    const countFqfn = getFqfnsByLabel(exploreData, "Order Items Count")[0];
    const cityFqfn = getFqfnsByLabel(exploreData, "City", "Users")[0];

    const queries = buildMeepQueries({
      selections: [countFqfn, cityFqfn],
      exploreData,
    });

    expect(queries).toHaveLength(1);
    expect(queries[0]).toMatchObject({
      model: "meep_test",
      view: "order_items",
      fields: ["order_items.count", "users.city"],
    });
  });

  it("generates looker IWriteQuery when only __date.year is selected", () => {
    const exploreData = {
      fields: [
        {
          label: "Count Cancelled",
          is_group: false,
          fqfn: "embed_demo2.order_items.order_items.count_cancelled",
          preferred_date_fqfn: "",
          meta: {
            name: "order_items.count_cancelled",
            label: "Order Items Count Cancelled",
            label_short: "Count Cancelled",
            description: "Count of order items with status Cancelled.",
            category: "measure",
            field_group_label: "Count (Filtered)",
            field_group_variant: "Count Cancelled",
            tags: [],
            type: "count",
            value_format: null,
            value_format_name: null,
            dimension_group: null,
            is_filter: false,
            parameter: false,
            measure: true,
            sortable: true,
            user_attribute_filter_types: ["number", "advanced_filter_number"],
            hidden: false,
          },
        },
        {
          label: "Events Count",
          is_group: false,
          fqfn: "embed_demo2.events.events.count",
          preferred_date_fqfn: "embed_demo2.events.events.event",
          meta: {
            name: "events.count",
            label: "Events Count",
            label_short: "Count",
            description: "",
            category: "measure",
            field_group_label: null,
            field_group_variant: "Count",
            tags: ["meep-ldt:events.event"],
            type: "count",
            value_format: null,
            value_format_name: null,
            dimension_group: null,
            is_filter: false,
            parameter: false,
            measure: true,
            sortable: true,
            user_attribute_filter_types: ["number", "advanced_filter_number"],
            hidden: false,
          },
        },
        {
          label: "Order Items Count",
          is_group: false,
          fqfn: "embed_demo2.order_items.order_items.count",
          preferred_date_fqfn: "",
          meta: {
            name: "order_items.count",
            label: "Order Items Count",
            label_short: "Count",
            description: "Total count of order items.",
            category: "measure",
            field_group_label: null,
            field_group_variant: "Count",
            tags: [],
            type: "count",
            value_format: null,
            value_format_name: null,
            dimension_group: null,
            is_filter: false,
            parameter: false,
            measure: true,
            sortable: true,
            user_attribute_filter_types: ["number", "advanced_filter_number"],
            hidden: false,
          },
        },
      ],
      date: {
        label: "__date",
        dimension_groups_fqfn: [
          "embed_demo2.order_items.order_items.created",
          "embed_demo2.events.events.event",
        ],
        timeframes: [
          "date",
          "hour_of_day",
          "month",
          "quarter",
          "time",
          "week",
          "year",
        ],
      },
    } as any;

    const reverseExploreData = {
      ...exploreData,
      fields: [...exploreData.fields].reverse(),
      date: {
        ...exploreData.date,
        dimension_groups_fqfn: [
          "embed_demo2.events.events.event",
          "embed_demo2.order_items.order_items.created",
        ],
      },
    };
    const queries = buildMeepQueries({
      selections: ["__date.year"],
      exploreData,
    });
    expect(queries[0]).toMatchObject({
      model: "embed_demo2",
      view: "order_items",
      fields: ["order_items.created_year"],
    });
    expect(queries).toHaveLength(1);
    const reverseQueries = buildMeepQueries({
      selections: ["__date.year"],
      exploreData: reverseExploreData,
    });
    expect(reverseQueries).toHaveLength(1);
    expect(reverseQueries[0]).toMatchObject({
      model: "embed_demo2",
      view: "events",
      fields: ["events.event_year"],
    });
  });

  it("uses meep-bdt (base_date_timeline_fqfn) as the preferred tie-breaker", () => {
    const exploreData = {
      fields: [
        {
          label: "Count Cancelled",
          is_group: false,
          fqfn: "embed_demo2.order_items.order_items.count_cancelled",
          preferred_date_fqfn: "",
          meta: {
            name: "order_items.count_cancelled",
            category: "measure",
            measure: true,
          },
        },
        {
          label: "Events Count",
          is_group: false,
          fqfn: "embed_demo2.events.events.count",
          preferred_date_fqfn: "embed_demo2.events.events.event",
          meta: {
            name: "events.count",
            category: "measure",
            measure: true,
          },
        },
      ],
      date: {
        label: "__date",
        dimension_groups_fqfn: [
          "embed_demo2.order_items.events.event",
          "embed_demo2.events.events.event",
        ],
        timeframes: ["year"],
        base_date_timeline_fqfn: "embed_demo2.order_items.events.event",
      },
    } as any;

    const queries = buildMeepQueries({
      selections: ["__date.year"],
      exploreData,
    });

    expect(queries).toHaveLength(1);
    expect(queries[0]).toMatchObject({
      model: "embed_demo2",
      view: "order_items",
      fields: ["events.event_year"],
    });
  });

  it("uses correct explore-specific date dimension group when a date is selected alongside measures", () => {
    const exploreData = {
      fields: [
        {
          label: "Order Items Count",
          is_group: false,
          fqfn: "embed_demo2.order_items.order_items.count",
          preferred_date_fqfn: "embed_demo2.order_items.order_items.created",
          meta: {
            name: "order_items.count",
            category: "measure",
            measure: true,
          },
        },
        {
          label: "Events Count",
          is_group: false,
          fqfn: "embed_demo2.events.events.count",
          preferred_date_fqfn: "embed_demo2.events.events.event",
          meta: {
            name: "events.count",
            category: "measure",
            measure: true,
          },
        },
      ],
      date: {
        label: "__date",
        dimension_groups_fqfn: [
          "embed_demo2.order_items.order_items.created",
          "embed_demo2.events.events.event",
        ],
        timeframes: ["year"],
        base_date_timeline_fqfn: "embed_demo2.order_items.order_items.created",
      },
    } as any;

    const queries = buildMeepQueries({
      selections: [
        "embed_demo2.order_items.order_items.count",
        "embed_demo2.events.events.count",
        "__date.year",
      ],
      exploreData,
    });

    expect(queries).toHaveLength(2);
    expect(queries).toContainEqual({
      model: "embed_demo2",
      view: "order_items",
      fields: ["order_items.created_year", "order_items.count"],
      pivots: [],
      filters: {},
    });
    expect(queries).toContainEqual({
      model: "embed_demo2",
      view: "events",
      fields: ["events.count", "events.event_year"],
      pivots: [],
      filters: {},
    });
  });

  it("does not select unjoined timelines (like events.event_year) inside order_items explore even if a joined view measure (products.count) defines it", () => {
    const customMockExplores: ILookmlModelExplore[] = [
      {
        id: "embed_demo2::order_items",
        model_name: "embed_demo2",
        name: "order_items",
        fields: {
          dimensions: [
            {
              name: "order_items.created_year",
              dimension_group: "order_items.created",
              type: "date_year",
              view: "order_items",
              tags: ["meep-ddt", "meep-bdt"],
            },
            {
              name: "products.brand",
              view: "products",
              tags: [],
            },
          ],
          measures: [
            {
              name: "order_items.count",
              view: "order_items",
              tags: [],
            },
            {
              name: "products.count",
              view: "products",
              tags: ["meep-ldt:events.event"],
            },
          ],
        },
      } as any,
    ];

    const exploreData = buildMeepExploreData(customMockExplores);
    const queries = buildMeepQueries({
      selections: ["embed_demo2.order_items.order_items.count", "__date.year"],
      exploreData,
    });

    expect(queries).toHaveLength(1);
    expect(queries[0]).toMatchObject({
      model: "embed_demo2",
      view: "order_items",
      fields: ["order_items.created_year", "order_items.count"],
    });
  });

  it("splits looker IWriteQuery when __date is selected", () => {
    const exploreData = buildMeepExploreData(mockExplores);
    const queries = buildMeepQueries({
      selections: [
        "meep_test.order_items.order_items.count",
        "meep_test.order_items.order_items.cancelled_count",
        "__date.date",
      ],
      exploreData,
    });

    expect(queries).toHaveLength(2);
    expect(queries).toMatchObject([
      {
        model: "meep_test",
        view: "order_items",
        fields: ["order_items.count", "order_items.created_date"],
      },
      {
        model: "meep_test",
        view: "order_items",
        fields: ["order_items.cancelled_count", "order_items.cancelled_date"],
      },
    ]);
  });

  it("splits looker IWriteQuery and includes users.city in both queries when __date is selected", () => {
    const exploreData = buildMeepExploreData(mockExplores);
    const cityFqfn = getFqfnsByLabel(exploreData, "City", "Users");

    const queries = buildMeepQueries({
      selections: [
        "meep_test.order_items.order_items.count",
        "meep_test.order_items.order_items.cancelled_count",
        ...cityFqfn,
        "__date.date",
      ],
      exploreData,
    });

    expect(queries).toHaveLength(2);
    expect(queries).toMatchObject([
      {
        model: "meep_test",
        view: "order_items",
        fields: ["order_items.count", "order_items.created_date", "users.city"],
      },
      {
        model: "meep_test",
        view: "order_items",
        fields: [
          "order_items.cancelled_count",
          "order_items.cancelled_date",
          "users.city",
        ],
      },
    ]);
  });

  it("splits looker IWriteQuery across different explores (order_items and events)", () => {
    const exploreData = buildMeepExploreData(mockExplores);
    const cityFqfn = getFqfnsByLabel(exploreData, "City", "Users");

    const queries = buildMeepQueries({
      selections: [
        "meep_test.order_items.order_items.count",
        "meep_test.events.events.count",
        ...cityFqfn,
        "__date.date",
      ],
      exploreData,
    });

    expect(queries).toHaveLength(2);
    expect(queries).toMatchObject([
      {
        model: "meep_test",
        view: "order_items",
        fields: ["order_items.count", "order_items.created_date", "users.city"],
      },
      {
        model: "meep_test",
        view: "events",
        fields: ["events.count", "events.event_date", "users.city"],
      },
    ]);
  });

  it("splits looker IWriteQuery across multiple explores and multiple timelines", () => {
    const exploreData = buildMeepExploreData(mockExplores);
    const cityFqfn = getFqfnsByLabel(exploreData, "City", "Users");

    const queries = buildMeepQueries({
      selections: [
        "meep_test.order_items.order_items.count",
        "meep_test.order_items.order_items.cancelled_count",
        "meep_test.events.events.count",
        ...cityFqfn,
        "__date.date",
      ],
      exploreData,
    });

    expect(queries).toHaveLength(3);
    expect(queries).toMatchObject([
      {
        model: "meep_test",
        view: "order_items",
        fields: ["order_items.count", "order_items.created_date", "users.city"],
      },
      {
        model: "meep_test",
        view: "order_items",
        fields: [
          "order_items.cancelled_count",
          "order_items.cancelled_date",
          "users.city",
        ],
      },
      {
        model: "meep_test",
        view: "events",
        fields: ["events.count", "events.event_date", "users.city"],
      },
    ]);
  });

  it("splits looker IWriteQuery across multiple explores with month_name, month_year and users.state", () => {
    const exploreData = buildMeepExploreData(mockExplores);
    const stateFqfn = getFqfnsByLabel(exploreData, "State", "Users");

    const queries = buildMeepQueries({
      selections: [
        "meep_test.order_items.order_items.count",
        "meep_test.events.events.count",
        ...stateFqfn,
        "__date.month_name",
        "__date.month_year",
      ],
      exploreData,
    });

    expect(queries).toHaveLength(2);
    expect(queries).toMatchObject([
      {
        model: "meep_test",
        view: "order_items",
        fields: [
          "order_items.count",
          "order_items.created_month_name",
          "order_items.created_month_year",
          "users.state",
        ],
      },
      {
        model: "meep_test",
        view: "events",
        fields: [
          "events.count",
          "events.event_month_name",
          "events.event_month_year",
          "users.state",
        ],
      },
    ]);
  });

  it("splits looker IWriteQuery and generates pivots on year and month_name", () => {
    const exploreData = buildMeepExploreData(mockExplores);
    const stateFqfn = getFqfnsByLabel(exploreData, "State", "Users");

    const queries = buildMeepQueries({
      selections: [
        "meep_test.order_items.order_items.count",
        "meep_test.events.events.count",
        ...stateFqfn,
        "__date.month_name",
        "__date.month_year",
        "__date.year",
      ],
      exploreData,
      pivots: ["__date.year", "__date.month_name"],
    });

    expect(queries).toHaveLength(2);
    expect(queries).toMatchObject([
      {
        model: "meep_test",
        view: "order_items",
        fields: [
          "order_items.count",
          "order_items.created_month_name",
          "order_items.created_month_year",
          "order_items.created_year",
          "users.state",
        ],
        pivots: ["order_items.created_month_name", "order_items.created_year"],
      },
      {
        model: "meep_test",
        view: "events",
        fields: [
          "events.count",
          "events.event_month_name",
          "events.event_month_year",
          "events.event_year",
          "users.state",
        ],
        pivots: ["events.event_month_name", "events.event_year"],
      },
    ]);
  });

  it("generates simple query with a simple filter", () => {
    const exploreData = buildMeepExploreData(mockExplores);
    const queries = buildMeepQueries({
      selections: ["meep_test.order_items.order_items.count"],
      exploreData,
      filters: { "meep_test.order_items.users.city": "New York" },
    });

    expect(queries).toHaveLength(1);
    expect(queries[0]).toMatchObject({
      model: "meep_test",
      view: "order_items",
      fields: ["order_items.count"],
      filters: {
        "users.city": "New York",
      },
    });
  });

  it("splits looker IWriteQuery when date is filtered", () => {
    const exploreData = buildMeepExploreData(mockExplores);
    const queries = buildMeepQueries({
      selections: [
        "meep_test.order_items.order_items.count",
        "meep_test.order_items.order_items.cancelled_count",
      ],
      exploreData,
      filters: { "__date.date": "7 days" },
    });

    expect(queries).toHaveLength(2);
    expect(queries).toMatchObject([
      {
        model: "meep_test",
        view: "order_items",
        fields: ["order_items.count"],
        filters: {
          "order_items.created_date": "7 days",
        },
      },
      {
        model: "meep_test",
        view: "order_items",
        fields: ["order_items.cancelled_count"],
        filters: {
          "order_items.cancelled_date": "7 days",
        },
      },
    ]);
  });

  it("splits looker IWriteQuery and includes dimension filters on both queries when date is filtered", () => {
    const exploreData = buildMeepExploreData(mockExplores);
    const queries = buildMeepQueries({
      selections: [
        "meep_test.order_items.order_items.count",
        "meep_test.order_items.order_items.cancelled_count",
      ],
      exploreData,
      filters: {
        "__date.date": "7 days",
        "meep_test.order_items.users.city": "New York",
      },
    });

    expect(queries).toHaveLength(2);
    expect(queries).toMatchObject([
      {
        model: "meep_test",
        view: "order_items",
        fields: ["order_items.count"],
        filters: {
          "order_items.created_date": "7 days",
          "users.city": "New York",
        },
      },
      {
        model: "meep_test",
        view: "order_items",
        fields: ["order_items.cancelled_count"],
        filters: {
          "order_items.cancelled_date": "7 days",
          "users.city": "New York",
        },
      },
    ]);
  });

  it("generates 1 query on the winning explore (first matched) when all FQFNs for a dimension are selected", () => {
    const exploreData = buildMeepExploreData(mockExplores);
    const stateFqfns = getFqfnsByLabel(exploreData, "State", "Users");

    const queries = buildMeepQueries({
      selections: stateFqfns,
      exploreData,
    });

    expect(queries).toHaveLength(1);
    expect(queries).toContainEqual({
      model: "meep_test",
      view: "order_items",
      fields: ["users.state"],
      filters: {},
      pivots: [],
    });
  });

  it("generates 1 query on the specific explore when only a single explore FQFN for a dimension is selected", () => {
    const exploreData = buildMeepExploreData(mockExplores);

    const queries = buildMeepQueries({
      selections: ["meep_test.events.users.state"],
      exploreData,
    });

    expect(queries).toHaveLength(1);
    expect(queries[0]).toMatchObject({
      model: "meep_test",
      view: "events",
      fields: ["users.state"],
    });
  });

  describe("Base Fields (meep-bf)", () => {
    it("generates a query on the base explore for a base field (zip_code) by itself", () => {
      const exploreData = buildMeepExploreData(mockExplores);
      const zipCodeFqfns = getFqfnsByLabel(exploreData, "Zip Code", "Users");

      const queries = buildMeepQueries({
        selections: zipCodeFqfns,
        exploreData,
      });

      expect(queries).toHaveLength(1);
      expect(queries[0]).toMatchObject({
        model: "meep_test",
        view: "users",
        fields: ["users.zip_code"],
      });
    });

    it("generates multiple queries when selecting a base field (zip_code) and a measure (order_items.count)", () => {
      const exploreData = buildMeepExploreData(mockExplores);
      const zipCodeFqfns = getFqfnsByLabel(exploreData, "Zip Code", "Users");

      const queries = buildMeepQueries({
        selections: [
          ...zipCodeFqfns,
          "meep_test.order_items.order_items.count",
        ],
        exploreData,
      });

      expect(queries).toHaveLength(2);
      expect(queries).toContainEqual(
        expect.objectContaining({
          model: "meep_test",
          view: "users",
          fields: ["users.zip_code"],
        }),
      );
      expect(queries).toContainEqual(
        expect.objectContaining({
          model: "meep_test",
          view: "order_items",
          fields: ["order_items.count", "users.zip_code"],
        }),
      );
    });

    it("handles view-level base fields (distribution_center fields) and generates base queries on distribution_centers explore", () => {
      const exploreData = buildMeepExploreData(mockExplores);
      const cityFqfns = getFqfnsByLabel(
        exploreData,
        "City",
        "Distibution Location",
      );

      const queries = buildMeepQueries({
        selections: [...cityFqfns, "meep_test.order_items.order_items.count"],
        exploreData,
      });

      expect(queries).toHaveLength(2);
      expect(queries).toContainEqual(
        expect.objectContaining({
          model: "meep_test",
          view: "distribution_centers",
          fields: ["distribution_center.city"],
        }),
      );
      expect(queries).toContainEqual(
        expect.objectContaining({
          model: "meep_test",
          view: "order_items",
          fields: ["order_items.count", "distribution_center.city"],
        }),
      );
    });
  });
});
