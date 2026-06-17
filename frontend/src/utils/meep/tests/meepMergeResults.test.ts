import { describe, expect, it } from "vitest";
import mockExplores from "../mockExplores";
import { buildMeepExploreData, mergeMeepResults, renderCellValue } from "../multiExploreUtils";

describe("mergeMeepResults", () => {
  it("full outer joins query results on __date.date timeline and users.city dimension", () => {
    const exploreData = buildMeepExploreData(mockExplores);

    const query1 = {
      model: "meep_test",
      view: "order_items",
      fields: ["order_items.created_date", "users.city", "order_items.count"],
    };
    const response1 = {
      metadata: {
        fields: {
          dimensions: [
            { name: "order_items.created_date", category: "dimension" },
            { name: "users.city", category: "dimension" },
          ],
          measures: [{ name: "order_items.count", category: "measure" }],
        },
      },
      rows: [
        {
          "order_items.created_date": { value: "2026-06-16" },
          "users.city": { value: "New York" },
          "order_items.count": { value: 10 },
        },
        {
          "order_items.created_date": { value: "2026-06-15" },
          "users.city": { value: "London" },
          "order_items.count": { value: 5 },
        },
      ],
    };

    const query2 = {
      model: "meep_test",
      view: "events",
      fields: ["events.event_date", "users.city", "events.count"],
    };
    const response2 = {
      metadata: {
        fields: {
          dimensions: [
            { name: "events.event_date", category: "dimension" },
            { name: "users.city", category: "dimension" },
          ],
          measures: [{ name: "events.count", category: "measure" }],
        },
      },
      rows: [
        {
          "events.event_date": { value: "2026-06-16" },
          "users.city": { value: "New York" },
          "events.count": { value: 20 },
        },
        {
          "events.event_date": { value: "2026-06-15" },
          "users.city": { value: "Paris" },
          "events.count": { value: 12 },
        },
      ],
    };

    const merged = mergeMeepResults(
      [
        { query: query1, response: response1 },
        { query: query2, response: response2 },
      ],
      exploreData,
    );

    // Check metadata fields dimensions:
    // order_items.created_date and events.event_date should unify to __date.date
    // users.city should unify to meep_test.order_items.users.city
    expect(merged.metadata.fields.dimensions).toHaveLength(2);
    expect(merged.metadata.fields.dimensions.map((d) => d.name)).toContain(
      "__date.date",
    );
    expect(merged.metadata.fields.dimensions.map((d) => d.name)).toContain(
      "meep_test.order_items.users.city",
    );

    // Check measures
    expect(merged.metadata.fields.measures).toHaveLength(2);
    expect(merged.metadata.fields.measures.map((m) => m.name)).toContain(
      "meep_test.order_items.order_items.count",
    );
    expect(merged.metadata.fields.measures.map((m) => m.name)).toContain(
      "meep_test.events.events.count",
    );

    // Check rows:
    // 1. (2026-06-16, New York) should merge count from both
    // 2. (2026-06-15, London) should have order_items.count but events.count=null
    // 3. (2026-06-15, Paris) should have events.count but order_items.count=null
    expect(merged.rows).toHaveLength(3);

    const row1 = merged.rows.find(
      (r) =>
        r["__date.date"]?.value === "2026-06-16" &&
        r["meep_test.order_items.users.city"]?.value === "New York",
    );
    expect(row1).toBeDefined();
    expect(row1!["meep_test.order_items.order_items.count"]).toEqual({
      value: 10,
    });
    expect(row1!["meep_test.events.events.count"]).toEqual({ value: 20 });

    const row2 = merged.rows.find(
      (r) =>
        r["__date.date"]?.value === "2026-06-15" &&
        r["meep_test.order_items.users.city"]?.value === "London",
    );
    expect(row2).toBeDefined();
    expect(row2!["meep_test.order_items.order_items.count"]).toEqual({
      value: 5,
    });
    expect(row2!["meep_test.events.events.count"]).toEqual({ value: 0 });

    const row3 = merged.rows.find(
      (r) =>
        r["__date.date"]?.value === "2026-06-15" &&
        r["meep_test.order_items.users.city"]?.value === "Paris",
    );
    expect(row3).toBeDefined();
    expect(row3!["meep_test.order_items.order_items.count"]).toEqual({
      value: 0,
    });
    expect(row3!["meep_test.events.events.count"]).toEqual({ value: 12 });
  });

  it("full outer joins query results when one query lacks users.city dimension", () => {
    const exploreData = buildMeepExploreData(mockExplores);

    const query1 = {
      model: "meep_test",
      view: "order_items",
      fields: ["order_items.created_date", "users.city", "order_items.count"],
    };
    const response1 = {
      metadata: {
        fields: {
          dimensions: [
            { name: "order_items.created_date", category: "dimension" },
            { name: "users.city", category: "dimension" },
          ],
          measures: [{ name: "order_items.count", category: "measure" }],
        },
      },
      rows: [
        {
          "order_items.created_date": { value: "2026-06-16" },
          "users.city": { value: "New York" },
          "order_items.count": { value: 10 },
        },
        {
          "order_items.created_date": { value: "2026-06-16" },
          "users.city": { value: "London" },
          "order_items.count": { value: 5 },
        },
      ],
    };

    const query2 = {
      model: "meep_test",
      view: "events",
      fields: ["events.event_date", "events.count"],
    };
    const response2 = {
      metadata: {
        fields: {
          dimensions: [{ name: "events.event_date", category: "dimension" }],
          measures: [{ name: "events.count", category: "measure" }],
        },
      },
      rows: [
        {
          "events.event_date": { value: "2026-06-16" },
          "events.count": { value: 100 },
        },
      ],
    };

    const merged = mergeMeepResults(
      [
        { query: query1, response: response1 },
        { query: query2, response: response2 },
      ],
      exploreData,
    );

    // Since query2 does not have City specified, events.count (100) should appear next to New York and London.
    // There should also be a warning on events.count.
    expect(merged.rows).toHaveLength(2);

    const row1 = merged.rows.find(
      (r) =>
        r["__date.date"]?.value === "2026-06-16" &&
        r["meep_test.order_items.users.city"]?.value === "New York",
    );
    expect(row1).toBeDefined();
    expect(row1!["meep_test.order_items.order_items.count"]).toEqual({
      value: 10,
    });
    expect(row1!["meep_test.events.events.count"]).toEqual({
      value: 100,
      warning:
        "This measure value is repeated because the source query did not group by City.",
    });

    const row2 = merged.rows.find(
      (r) =>
        r["__date.date"]?.value === "2026-06-16" &&
        r["meep_test.order_items.users.city"]?.value === "London",
    );
    expect(row2).toBeDefined();
    expect(row2!["meep_test.order_items.order_items.count"]).toEqual({
      value: 5,
    });
    expect(row2!["meep_test.events.events.count"]).toEqual({
      value: 100,
      warning:
        "This measure value is repeated because the source query did not group by City.",
    });
  });

  describe("renderCellValue", () => {
    it("prioritizes rendered value over raw value", () => {
      const row = {
        "users.city": { value: "New York", rendered: "New York City" },
        "order_items.count": { value: 10, rendered: "10 orders" },
      };
      const colDim = { id: "users.city", label: "City", isPivot: false };
      const colMeas = { id: "order_items.count", label: "Count", isPivot: false };
      expect(renderCellValue(row, colDim, [])).toBe("New York City");
      expect(renderCellValue(row, colMeas, [])).toBe("10 orders");
    });

    it("falls back to raw value if rendered is not present", () => {
      const row = {
        "users.city": { value: "New York" },
        "order_items.count": { value: 10 },
      };
      const colDim = { id: "users.city", label: "City", isPivot: false };
      const colMeas = { id: "order_items.count", label: "Count", isPivot: false };
      expect(renderCellValue(row, colDim, [])).toBe("New York");
      expect(renderCellValue(row, colMeas, [])).toBe("10");
    });

    it("returns - for missing values, or 0 for numeric measures", () => {
      const row = {
        "users.city": { value: null },
      };
      const colDim = { id: "users.city", label: "City", isPivot: false };
      const colMeas = { id: "order_items.count", label: "Count", isPivot: false };
      expect(renderCellValue(row, colDim, [])).toBe("-");
      expect(renderCellValue(row, colMeas, [])).toBe("0");
    });
  });
});
