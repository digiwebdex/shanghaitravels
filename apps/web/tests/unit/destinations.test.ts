import { describe, expect, it } from "vitest";
import {
  DEFAULT_SHOWCASE_SETTINGS,
  applyShowcaseLimit,
  buildDestinationBrowseQuery,
  buildDestinationListQuery,
  emptyDestinationForm,
  formatPackageCount,
  mergeShowcaseSettings,
  slugifyDestination,
  validateDestinationForm,
} from "@/lib/destinations";

describe("destinations helpers", () => {
  it("formats package count labels", () => {
    expect(formatPackageCount(0)).toBe("0 Packages");
    expect(formatPackageCount(1)).toBe("1 Package");
    expect(formatPackageCount(12)).toBe("12 Packages");
    expect(formatPackageCount(null)).toBe("0 Packages");
  });

  it("merges showcase settings with defaults", () => {
    expect(mergeShowcaseSettings()).toEqual(DEFAULT_SHOWCASE_SETTINGS);
    expect(mergeShowcaseSettings({ maxCards: 4, ctaLabel: "Go →" })).toMatchObject({
      maxCards: 4,
      ctaLabel: "Go →",
      showFlag: true,
      enabled: true,
    });
  });

  it("builds list and browse query params", () => {
    const list = buildDestinationListQuery({
      collection: "home",
      homepageFeatured: true,
      limit: 8,
    });
    expect(list.get("collection")).toBe("home");
    expect(list.get("homepageFeatured")).toBe("true");
    expect(list.get("limit")).toBe("8");

    const browse = buildDestinationBrowseQuery({
      region: "Asia",
      country: "Thailand",
      category: "tour",
      budgetMaxPoisha: 5000000,
    });
    expect(browse.get("region")).toBe("Asia");
    expect(browse.get("category")).toBe("tour");
    expect(browse.get("budgetMaxPoisha")).toBe("5000000");
  });

  it("applies showcase max card limit with sort order", () => {
    const items = applyShowcaseLimit(
      [
        { id: "a", code: "A", name: "A", slug: "a", status: "published", displayOrder: 2 },
        { id: "b", code: "B", name: "B", slug: "b", status: "published", displayOrder: 1 },
        { id: "c", code: "C", name: "C", slug: "c", status: "published", displayOrder: 3 },
      ],
      { ...DEFAULT_SHOWCASE_SETTINGS, maxCards: 2 },
    );
    expect(items.map((d) => d.id)).toEqual(["b", "a"]);
  });

  it("validates destination form and slugifies names", () => {
    expect(slugifyDestination("  United Kingdom  ")).toBe("united-kingdom");
    const f = emptyDestinationForm();
    expect(validateDestinationForm(f)).toBe("Name is required");
    f.name = "United Kingdom";
    expect(validateDestinationForm(f)).toBe("Country is required");
    f.countryName = "United Kingdom";
    f.slug = "United Kingdom";
    expect(validateDestinationForm(f)).toMatch(/Slug/);
    f.slug = "united-kingdom";
    expect(validateDestinationForm(f)).toBeNull();
  });
});
