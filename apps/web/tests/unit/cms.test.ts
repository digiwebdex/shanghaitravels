import { describe, expect, it } from "vitest";
import {
  createsCrmLead,
  slugify,
  validateContentInput,
  validatePageInput,
  validateRedirectInput,
  validateSiteForm,
  validateTravelInput,
} from "@/lib/cms";

describe("cms helpers", () => {
  it("slugifies and validates page/content/travel/redirect/form", () => {
    expect(slugify("Hajj & Umrah 2026!")).toBe("hajj-umrah-2026");
    expect(validatePageInput({ title: "About" })).toBeNull();
    expect(validatePageInput({})).toMatch(/Title or slug/);
    expect(validateContentInput({ type: "blog", title: "News" })).toBeNull();
    expect(validateContentInput({ type: "x", title: "News" })).toMatch(/type/);
    expect(validateTravelInput({ serviceType: "tour", title: "China" })).toBeNull();
    expect(validateRedirectInput({ fromPath: "/p/old", toPath: "/#/site/p/new" })).toBeNull();
    expect(validateRedirectInput({ fromPath: "old", toPath: "/x" })).toMatch(/start with/);
    expect(validateSiteForm({ formType: "enquiry", name: "Ada", phone: "017" })).toBeNull();
    expect(validateSiteForm({ formType: "enquiry", name: "Ada" })).toMatch(/Email or phone/);
    expect(createsCrmLead("visa")).toBe(true);
    expect(createsCrmLead("career")).toBe(false);
  });
});
