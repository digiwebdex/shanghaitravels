/** Phase E1 — Website & CMS helpers */

export const PAGE_STATUSES = ["draft", "in_review", "published", "archived"] as const;
export const CONTENT_TYPES = [
  "blog",
  "announcement",
  "faq",
  "testimonial",
  "gallery",
  "download",
  "hero_service",
] as const;
export const TRAVEL_TYPES = ["visa", "air_ticket", "tour", "hajj", "umrah", "hotel", "transport"] as const;
export const FORM_TYPES = ["contact", "enquiry", "quote", "visa", "tour", "hajj", "career"] as const;
export const LEAD_FORM_TYPES = ["contact", "enquiry", "quote", "visa", "tour", "hajj"] as const;

export function slugify(s: string): string {
  return String(s || "")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 80);
}

export function validatePageInput(input: { title?: string; slug?: string }): string | null {
  if (!input.title?.trim() && !input.slug?.trim()) return "Title or slug is required";
  const slug = slugify(input.slug || input.title || "");
  if (!slug) return "Invalid slug";
  return null;
}

export function validateContentInput(input: { type?: string; title?: string }): string | null {
  if (!input.type || !(CONTENT_TYPES as readonly string[]).includes(input.type)) return "Invalid content type";
  if (!input.title?.trim()) return "Title is required";
  return null;
}

export function validateTravelInput(input: { serviceType?: string; title?: string }): string | null {
  if (!input.serviceType || !(TRAVEL_TYPES as readonly string[]).includes(input.serviceType)) {
    return "Invalid service type";
  }
  if (!input.title?.trim()) return "Title is required";
  return null;
}

export function validateRedirectInput(input: { fromPath?: string; toPath?: string }): string | null {
  if (!input.fromPath?.trim()) return "From path is required";
  if (!input.toPath?.trim()) return "To path is required";
  if (!input.fromPath.startsWith("/")) return "From path must start with /";
  return null;
}

export function validateSiteForm(input: {
  formType?: string;
  name?: string;
  email?: string;
  phone?: string;
}): string | null {
  if (!input.formType || !(FORM_TYPES as readonly string[]).includes(input.formType)) return "Invalid form type";
  if (!input.name?.trim()) return "Name is required";
  if (!input.email?.trim() && !input.phone?.trim()) return "Email or phone is required";
  return null;
}

export function createsCrmLead(formType: string): boolean {
  return (LEAD_FORM_TYPES as readonly string[]).includes(formType);
}
