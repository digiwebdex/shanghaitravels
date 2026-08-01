import { Link } from "react-router";
import { Eye, Files, LifeBuoy, Mail, Megaphone, Newspaper, Quote, Search, Sparkles } from "lucide-react";
import { PageHeader, PageShell } from "@/components/enterprise/Page";
import { CmsModuleNav } from "@/components/cms/CmsModuleNav";

const ITEMS = [
  {
    label: "Site Preview",
    to: "/site",
    icon: Eye,
    hint: "Open the public website preview workspace",
  },
  {
    label: "Hero Services",
    to: "/cms/hero-services",
    icon: Sparkles,
    hint: "Homepage service tiles and calls to action",
  },
  {
    label: "Banners",
    to: "/cms/banners",
    icon: Megaphone,
    hint: "Promotional and homepage banners",
  },
  {
    label: "Blog",
    to: "/cms/content/blog",
    icon: Newspaper,
    hint: "Articles and travel stories for the site",
  },
  {
    label: "FAQ",
    to: "/cms/content/faq",
    icon: LifeBuoy,
    hint: "Frequently asked questions shown on the site",
  },
  {
    label: "Testimonials",
    to: "/cms/content/testimonial",
    icon: Quote,
    hint: "Customer quotes and social proof",
  },
  {
    label: "Forms",
    to: "/cms/forms",
    icon: Mail,
    hint: "Enquiry and intake form configuration",
  },
  {
    label: "SEO",
    to: "/cms/seo",
    icon: Search,
    hint: "Redirects, meta defaults and search visibility",
  },
  {
    label: "Content Library",
    to: "/cms/content",
    icon: Files,
    hint: "Shared content records used across the site",
  },
];

/**
 * Nested website setup screens — kept off the main sidebar so CMS stays scannable.
 */
export default function CmsWebsiteSetupPage() {
  return (
    <PageShell>
      <PageHeader
        title="Website Setup"
        subtitle="Configure homepage services, content types, forms, SEO and preview the live site."
        breadcrumb={[{ label: "Website CMS", to: "/cms" }, { label: "Website Setup" }]}
      />
      <CmsModuleNav />
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {ITEMS.map((item) => (
          <Link
            key={item.to}
            to={item.to}
            className="rounded-2xl bg-[var(--card)] p-5 shadow-[var(--shadow-card)] ring-1 ring-[var(--ring-card)] transition-all hover:ring-[var(--orange-300)] hover:shadow-sm"
          >
            <item.icon size={18} className="text-[var(--accent)]" />
            <p className="mt-3 text-[14px] font-bold text-[var(--navy-700)]">{item.label}</p>
            <p className="mt-1 text-[11.5px] text-[var(--muted-foreground)]">{item.hint}</p>
          </Link>
        ))}
      </div>
    </PageShell>
  );
}
