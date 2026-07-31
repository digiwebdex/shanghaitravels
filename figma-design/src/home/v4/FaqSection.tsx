import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "../../app/components/ui/accordion";
import { Section, SectionHeader } from "./Section";
import type { CmsContent } from "./api";

type FaqSectionProps = {
  items: CmsContent[];
};

export function FaqSection({ items }: FaqSectionProps) {
  const faqs = items
    .filter((f) => f.status !== "draft")
    .sort((a, b) => (a.sortOrder ?? 999) - (b.sortOrder ?? 999))
    .slice(0, 8);

  if (!faqs.length) return null;

  return (
    <Section className="py-16 md:py-24 bg-muted/40">
      <SectionHeader
        eyebrow="FAQ"
        title="Frequently Asked Questions"
        subtitle="Quick answers about visas, air tickets, tours and Hajj & Umrah services."
        centered
      />

      <div className="max-w-3xl mx-auto bg-card rounded-2xl border border-border px-6 shadow-[0_8px_30px_rgba(20,33,61,0.06)]">
        <Accordion type="single" collapsible className="w-full">
          {faqs.map((faq) => (
            <AccordionItem key={faq.id} value={faq.id}>
              <AccordionTrigger className="text-left font-semibold text-foreground hover:no-underline">
                {faq.title}
              </AccordionTrigger>
              <AccordionContent className="text-muted-foreground leading-relaxed">
                {faq.body || faq.summary}
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </div>
    </Section>
  );
}
