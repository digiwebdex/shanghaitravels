import { Link } from "react-router";
import { Files, Mail, Megaphone, Search, Sparkles } from "lucide-react";
import { PageHeader, PageShell } from "@/components/enterprise/Page";
import { CmsModuleNav } from "@/components/cms/CmsModuleNav";

const ITEMS = [
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
        subtitle="Configure homepage services, banners, forms, SEO and the content library."
        breadcrumb={[{ label: "Website CMS", to: "/cms" }, { label: "Website Setup" }]}
      />
      <CmsModuleNav />
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {ITEMS.map((item) => (
          <Link
            key={item.to}
            to={item.to}
            className="rounded-2xl border border-slate-200 bg-white p-5 transition-all hover:border-orange-300 hover:shadow-sm"
          >
            <item.icon size={18} className="text-orange-600" />
            <p className="mt-3 text-[14px] font-bold text-slate-900">{item.label}</p>
            <p className="mt-1 text-[11.5px] text-slate-500">{item.hint}</p>
          </Link>
        ))}
      </div>
    </PageShell>
  );
}
