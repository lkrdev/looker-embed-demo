import fs from "node:fs";
import { describe, expect, it } from "vitest";
import mockExplores from "../mockExplores";
import {
  buildMeepDate,
  buildMeepFields,
  resolveMeepSelection,
} from "../multiExploreUtils";

describe("resolveMeepSelection", () => {
  it("resolves the correct active explore key and target date FQFN when given Email and Order Items Count selection", () => {
    const meepFields = buildMeepFields(mockExplores);
    const meepDate = buildMeepDate(mockExplores);

    const results = resolveMeepSelection(
      ["email", "order_items.count"],
      meepFields,
      meepDate,
    );

    expect(results).toHaveLength(1);
    expect(results[0].activeExploreKey).toBe("meep_test.order_items");
    expect(results[0].activeDateDimensionGroupFqfn).toBe(
      "meep_test.order_items.order_items.created",
    );
    expect(results[0].resolvedFieldFqfns).toEqual([
      "meep_test.order_items.users.email",
      "meep_test.order_items.order_items.count",
    ]);
  });

  it("produces multiple query target graphs when given multi-measure Explore selections", () => {
    const meepFields = buildMeepFields(mockExplores);
    const meepDate = buildMeepDate(mockExplores);

    const results = resolveMeepSelection(
      ["email", "order_items.count", "events.count"],
      meepFields,
      meepDate,
    );

    expect(results).toHaveLength(2);

    const orderItemsTarget = results.find(
      (r) => r.activeExploreKey === "meep_test.order_items",
    );
    expect(orderItemsTarget).toBeDefined();
    expect(orderItemsTarget?.activeDateDimensionGroupFqfn).toBe(
      "meep_test.order_items.order_items.created",
    );
    expect(orderItemsTarget?.resolvedFieldFqfns).toEqual([
      "meep_test.order_items.users.email",
      "meep_test.order_items.order_items.count",
    ]);

    const eventsTarget = results.find(
      (r) => r.activeExploreKey === "meep_test.events",
    );
    expect(eventsTarget).toBeDefined();
    expect(eventsTarget?.activeDateDimensionGroupFqfn).toBe(
      "meep_test.events.events.event",
    );
    expect(eventsTarget?.resolvedFieldFqfns).toEqual([
      "meep_test.events.users.email",
      "meep_test.events.events.count",
    ]);

    fs.writeFileSync(
      new URL("./resolveMeepSelection_snapshot.json", import.meta.url),
      JSON.stringify(results, null, 2),
    );
  });

  it("generates a warning when a selected dimension is unavailable in a target Explore", () => {
    const meepFields = buildMeepFields(mockExplores);
    const meepDate = buildMeepDate(mockExplores);

    const results = resolveMeepSelection(
      ["distribution_center.city", "order_items.count", "events.count"],
      meepFields,
      meepDate,
    );

    expect(results).toHaveLength(3);

    const orderItemsTarget = results.find(
      (r) => r.activeExploreKey === "meep_test.order_items",
    );
    expect(orderItemsTarget).toBeDefined();
    expect(orderItemsTarget?._warnings).toEqual([]);

    const eventsTarget = results.find(
      (r) => r.activeExploreKey === "meep_test.events",
    );
    expect(eventsTarget).toBeDefined();
    expect(eventsTarget?._warnings).toHaveLength(1);
    expect(eventsTarget?._warnings?.[0]).toEqual({
      type: "unrelated_fields",
      fqfn: "meep_test.order_items.distribution_center.city",
      message: "City not available in this explore, values will be repeated",
    });

    const distCentersTarget = results.find(
      (r) => r.activeExploreKey === "meep_test.distribution_centers",
    );
    expect(distCentersTarget).toBeDefined();
    expect(distCentersTarget?._warnings).toEqual([]);

    fs.writeFileSync(
      new URL("./resolveMeepSelection_warnings_snapshot.json", import.meta.url),
      JSON.stringify(results, null, 2),
    );
  });

  it("splits same-Explore queries when measures target different timelines in a single pass", () => {
    const meepFields = buildMeepFields(mockExplores);
    const meepDate = buildMeepDate(mockExplores);

    const results = resolveMeepSelection(
      ["email", "order_items.count", "order_items.cancelled_count"],
      meepFields,
      meepDate,
    );

    expect(results).toHaveLength(2);

    const createdTarget = results.find(
      (r) =>
        r.activeDateDimensionGroupFqfn ===
        "meep_test.order_items.order_items.created",
    );
    expect(createdTarget).toBeDefined();
    expect(createdTarget?.activeExploreKey).toBe("meep_test.order_items");
    expect(createdTarget?.resolvedFieldFqfns).toEqual([
      "meep_test.order_items.users.email",
      "meep_test.order_items.order_items.count",
    ]);

    const cancelledTarget = results.find(
      (r) =>
        r.activeDateDimensionGroupFqfn ===
        "meep_test.order_items.order_items.cancelled",
    );
    expect(cancelledTarget).toBeDefined();
    expect(cancelledTarget?.activeExploreKey).toBe("meep_test.order_items");
    expect(cancelledTarget?.resolvedFieldFqfns).toEqual([
      "meep_test.order_items.users.email",
      "meep_test.order_items.order_items.cancelled_count",
    ]);

    fs.writeFileSync(
      new URL(
        "./resolveMeepSelection_timeline_split_snapshot.json",
        import.meta.url,
      ),
      JSON.stringify(results, null, 2),
    );
  });

  it("resolves the special __date timeframe identifier to the active explore's date dimension group field", () => {
    const meepFields = buildMeepFields(mockExplores);
    const meepDate = buildMeepDate(mockExplores);

    const results = resolveMeepSelection(
      ["email", "order_items.count", "__date.date"],
      meepFields,
      meepDate,
    );

    expect(results).toHaveLength(1);
    expect(results[0].activeExploreKey).toBe("meep_test.order_items");
    expect(results[0].activeDateDimensionGroupFqfn).toBe(
      "meep_test.order_items.order_items.created",
    );
    expect(results[0].resolvedFieldFqfns).toEqual([
      "meep_test.order_items.users.email",
      "meep_test.order_items.order_items.count",
      "meep_test.order_items.order_items.created_date",
    ]);
  });
});
