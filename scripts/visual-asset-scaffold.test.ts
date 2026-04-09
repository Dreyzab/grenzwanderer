import { describe, expect, it } from "vitest";
import { CASE_01_POINTS } from "./data/case_01_points";
import {
  UNIVERSITY_NEOGOTHIC_PILOT_LOCATION_IDS,
  buildCase01VisualManifest,
  buildCase01VisualScaffoldOutput,
  buildCase01VisualVariants,
  resolveCase01RuntimeDistrict,
  resolveCase01VisualArchetype,
} from "./data/freiburg_visual_assets";

describe("freiburg visual asset scaffold", () => {
  it("resolves every Case 01 point to one runtime district and one visual archetype", () => {
    const manifest = buildCase01VisualManifest();

    expect(manifest).toHaveLength(CASE_01_POINTS.length);

    for (const point of CASE_01_POINTS) {
      const entry = manifest.find(
        (candidate) => candidate.locationId === point.locationId,
      );

      expect(entry).toBeDefined();
      expect(entry?.districtId).toBe(
        resolveCase01RuntimeDistrict(point.locationId),
      );
      expect(entry?.visualArchetype).toBe(
        resolveCase01VisualArchetype(point.locationId),
      );
    }
  });

  it("pins loc_hbf to rail_hub runtime and industrial_rail visuals", () => {
    expect(resolveCase01RuntimeDistrict("loc_hbf")).toBe("rail_hub");
    expect(resolveCase01VisualArchetype("loc_hbf")).toBe("industrial_rail");
  });

  it("marks loc_freiburg_estate as estate_noble and assigns a dedicated target basename", () => {
    const variants = buildCase01VisualVariants(buildCase01VisualManifest());
    const estateDefault = variants.find(
      (variant) =>
        variant.locationId === "loc_freiburg_estate" &&
        variant.variantId === "default",
    );

    expect(estateDefault?.visualArchetype).toBe("estate_noble");
    expect(estateDefault?.expectedBasename).toBe("loc_freiburg_estate");
    expect(estateDefault?.runtimeImagePath).toBe(
      "/images/locations/loc_student_house.webp",
    );
    expect(estateDefault?.expectedImagePath).toContain(
      "images/locations/loc_freiburg_estate.webp",
    );
  });

  it("stays deterministic across repeated builds", () => {
    const first = buildCase01VisualScaffoldOutput();
    const second = buildCase01VisualScaffoldOutput();

    expect(second).toEqual(first);
  });

  it("keeps variant identity unique across locationId, variantId, and assetKind", () => {
    const variants = buildCase01VisualVariants(buildCase01VisualManifest());
    const identitySet = new Set(
      variants.map(
        (variant) =>
          `${variant.locationId}::${variant.variantId}::${variant.assetKind}`,
      ),
    );

    expect(identitySet.size).toBe(variants.length);
  });

  it("preserves runtime compatibility by leaving current map points image-backed", () => {
    expect(
      CASE_01_POINTS.every((point) => typeof point.image === "string"),
    ).toBe(true);
    expect(buildCase01VisualScaffoldOutput().parity.errors).toEqual([]);
  });

  it("keeps the university pilot on one shared visual family and master ref", () => {
    const manifest = buildCase01VisualManifest();
    const pilotEntries = UNIVERSITY_NEOGOTHIC_PILOT_LOCATION_IDS.map(
      (locationId) => manifest.find((entry) => entry.locationId === locationId),
    );

    expect(
      pilotEntries.every(
        (entry) => entry?.visualArchetype === "university_neogothic",
      ),
    ).toBe(true);
    expect(new Set(pilotEntries.map((entry) => entry?.masterRefId)).size).toBe(
      1,
    );
  });
});
