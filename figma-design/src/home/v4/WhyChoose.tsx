import { CheckCircle2 } from "lucide-react";
import { Link } from "react-router";
import { Section, SectionHeader } from "./Section";
import type { CmsContent } from "./api";
import { parseMetaArray } from "./format";

type WhyItem = { title?: string; description?: string; desc?: string };

const FALLBACK_ITEMS: WhyItem[] = [
  {
    title: "Government Registered Agency",
    description: "Reg. No. 0017053 — trusted travel partner based in Vatara, Dhaka.",
  },
  {
    title: "Fastest Visa Processing",
    description: "Same-day submission for most destinations with expert document review.",
  },
  {
    title: "Best Price Guarantee",
    description: "Competitive air fares and tour packages with transparent BDT pricing.",
  },
  {
    title: "Dedicated Account Manager",
    description: "Every client gets a named contact — no call centres, no bots.",
  },
];

type WhyChooseProps = {
  content?: CmsContent | null;
};

export function WhyChoose({ content }: WhyChooseProps) {
  const items = content
    ? parseMetaArray<WhyItem>(content.meta, "items")
    : FALLBACK_ITEMS;

  const displayItems = items.length ? items : FALLBACK_ITEMS;
  const title = content?.title || "Why Choose Shanghai Travels?";
  const summary =
    content?.summary ||
    "For over a decade we have served travellers across Bangladesh with reliable visa, air ticket, and pilgrimage services from our Vatara office.";

  return (
    <Section className="py-16 md:py-24 bg-primary text-white">
      <div className="grid lg:grid-cols-2 gap-12 items-center">
        <div>
          <SectionHeader
            eyebrow="Why Us"
            title={title}
            subtitle={summary}
            className="mb-8 [&_h2]:text-white [&_p]:text-white/65"
          />
          <div className="space-y-4">
            {displayItems.map((item, i) => (
              <div key={item.title || i} className="flex items-start gap-3">
                <div className="size-5 rounded-full bg-accent flex items-center justify-center flex-shrink-0 mt-0.5">
                  <CheckCircle2 size={11} className="text-white" />
                </div>
                <div>
                  <p className="text-sm font-bold text-white">{item.title}</p>
                  <p className="text-xs text-white/55 mt-0.5 leading-relaxed">
                    {item.description || item.desc}
                  </p>
                </div>
              </div>
            ))}
          </div>
          <div className="flex flex-wrap gap-3 mt-8">
            <Link
              to="/about"
              className="px-5 py-2.5 rounded-xl bg-accent text-white font-bold text-sm hover:bg-orange-500 transition-colors"
            >
              Our Story
            </Link>
            <Link
              to="/contact"
              className="px-5 py-2.5 rounded-xl border border-white/20 text-white font-semibold text-sm hover:bg-white/10 transition-colors"
            >
              Get in Touch
            </Link>
          </div>
        </div>
        <div className="relative hidden lg:block">
          <img
            src="https://images.unsplash.com/photo-1521737711867-e3b97375f902?w=600&h=500&fit=crop&auto=format"
            alt="Shanghai Travels team"
            className="rounded-2xl w-full h-[420px] object-cover shadow-2xl"
            loading="lazy"
          />
          <div className="absolute -bottom-4 -left-4 bg-white rounded-2xl border border-border p-4 shadow-xl text-primary">
            <p className="text-lg font-bold">Vatara, Dhaka</p>
            <p className="text-[11px] text-muted-foreground">Serving Bangladesh since 2010</p>
          </div>
        </div>
      </div>
    </Section>
  );
}
