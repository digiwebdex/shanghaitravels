import { describe, expect, it } from "vitest";
import {
  buildPackageListQuery,
  buildPackageSearchQuery,
  emptyPackageForm,
  formatDuration,
  formatPrice,
  packageFormPayload,
  slugifyPackage,
  validatePackageForm,
} from "@/lib/packages";
import { toPoisha } from "@/lib/tour";

describe("packages helpers", () => {
  it("formats price and duration", () => {
    expect(formatPrice(1250000)).toBe("৳12,500");
    expect(formatPrice(null)).toBe("—");
    expect(formatDuration(5, 4)).toBe("5D / 4N");
  });

  it("slugifies package names", () => {
    expect(slugifyPackage("  Bali 5D/4N — Special!  ")).toBe("bali-5d-4n-special");
  });

  it("builds list and search query params", () => {
    const list = buildPackageListQuery({
      q: "bali",
      status: "published",
      collection: "home",
      homeFeatured: true,
      limit: 12,
    });
    expect(list.get("q")).toBe("bali");
    expect(list.get("collection")).toBe("home");
    expect(list.get("homeFeatured")).toBe("true");

    const search = buildPackageSearchQuery({
      destination: "Maldives",
      durationMin: 3,
      budgetMaxPoisha: 5000000,
      travelMonth: "2026-09",
      packageType: "honeymoon",
    });
    expect(search.get("destination")).toBe("Maldives");
    expect(search.get("durationMin")).toBe("3");
    expect(search.get("budgetMaxPoisha")).toBe("5000000");
  });

  it("validates form and builds payload with poisha", () => {
    const f = emptyPackageForm();
    f.code = "PKG-01";
    f.name = "Test Package";
    f.sellingPriceBdt = "85000";
    f.supplierCostBdt = "70000";
    f.slug = "bad slug";
    expect(validatePackageForm(f)).toMatch(/Slug/);
    f.slug = "test-package";
    expect(validatePackageForm(f)).toBeNull();
    const p = packageFormPayload(f);
    expect(p.code).toBe("PKG-01");
    expect(p.sellingPricePoisha).toBe(toPoisha("85000"));
    expect(p.supplierCostPoisha).toBe(toPoisha("70000"));
  });
});
