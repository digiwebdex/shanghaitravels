import { Link } from "react-router";
import { ArrowRight, Phone } from "lucide-react";
import { Section } from "./Section";

const HOTLINE = "+880 1333-356393";

export function CtaBanner() {
  return (
    <Section className="py-16 md:py-24 bg-background">
      <div className="bg-primary rounded-3xl p-10 md:p-14 text-center relative overflow-hidden shadow-[0_20px_60px_rgba(20,33,61,0.2)]">
        <div className="absolute top-0 right-0 size-72 rounded-full bg-accent/10 -translate-y-1/3 translate-x-1/4 pointer-events-none" />
        <div className="absolute bottom-0 left-0 size-56 rounded-full bg-white/5 translate-y-1/2 -translate-x-1/4 pointer-events-none" />
        <div className="relative z-10">
          <p className="text-xs font-semibold tracking-widest text-accent uppercase mb-3">Start Today</p>
          <h2 className="text-white text-2xl md:text-4xl font-bold mb-4 max-w-xl mx-auto leading-tight">
            Begin Your Journey With a Free Consultation
          </h2>
          <p className="text-white/60 mb-8 max-w-md mx-auto text-sm md:text-base">
            Speak to a travel expert in Vatara, Dhaka. No commitment, no fees — just honest advice.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-3">
            <Link
              to="/inquiry"
              className="inline-flex items-center gap-2 px-8 py-3.5 rounded-xl bg-accent text-white font-bold text-sm hover:bg-orange-500 transition-colors shadow-lg"
            >
              Request Free Consultation
              <ArrowRight size={16} />
            </Link>
            <a
              href={`tel:${HOTLINE.replace(/\s/g, "")}`}
              className="inline-flex items-center gap-2 px-8 py-3.5 rounded-xl border border-white/20 text-white font-semibold text-sm hover:bg-white/10 transition-colors"
            >
              <Phone size={15} />
              {HOTLINE}
            </a>
          </div>
        </div>
      </div>
    </Section>
  );
}
