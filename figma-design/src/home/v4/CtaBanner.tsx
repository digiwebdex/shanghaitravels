import { Link } from "react-router";
import { ArrowRight, MessageCircle, Phone } from "lucide-react";
import { Section } from "./Section";
import type { CmsBanner } from "./api";
import { FOCUS, HOTLINE, WHATSAPP } from "./tokens";

const DEFAULT_IMAGE =
  "https://images.unsplash.com/photo-1488646953014-85cb44e25828?w=800&q=80&auto=format&fit=crop";

type CtaBannerProps = {
  banner?: CmsBanner | null;
};

export function CtaBanner({ banner }: CtaBannerProps) {
  const image = banner?.imageUrl || DEFAULT_IMAGE;
  const title = banner?.title?.trim() || "Ready for your next journey?";
  const subtitle = banner?.subtitle?.trim() || "Let our experts plan your perfect trip";
  const ctaLabel = banner?.ctaLabel?.trim() || "Request Consultation";
  const ctaUrl = banner?.ctaUrl?.trim() || "/inquiry";

  return (
    <Section id="cta">
      <div className="overflow-hidden rounded-2xl bg-primary shadow-[0_12px_34px_rgba(20,33,61,0.2)]">
        <div className="flex flex-col lg:h-[150px] lg:flex-row lg:items-center">
          <div className="relative h-[150px] w-full shrink-0 overflow-hidden lg:w-[210px]">
            <img src={image} alt="" loading="lazy" className="size-full object-cover object-center" />
            <div
              className="absolute inset-0 bg-[linear-gradient(90deg,rgba(20,33,61,0.25)_0%,rgba(20,33,61,0.35)_55%,rgba(20,33,61,1)_100%)] lg:bg-[linear-gradient(90deg,rgba(20,33,61,0)_0%,rgba(20,33,61,0.4)_62%,rgba(20,33,61,1)_100%)]"
              aria-hidden
            />
          </div>

          <div className="flex flex-1 flex-col gap-5 px-6 py-6 lg:flex-row lg:items-center lg:justify-between lg:py-0 lg:pl-2 lg:pr-6">
            <div className="min-w-0">
              <h2 className="text-[21px] font-bold leading-tight text-white md:text-[26px]">{title}</h2>
              <p className="mt-1.5 text-[13px] text-white/60">{subtitle}</p>
            </div>

            <div className="flex flex-wrap items-center gap-6 xl:gap-8">
              <ContactBlock
                href={`tel:${HOTLINE.replace(/[^\d+]/g, "")}`}
                icon={<Phone size={16} aria-hidden />}
                label="Call Us"
                value={HOTLINE}
              />
              <ContactBlock
                href={`https://wa.me/${WHATSAPP}`}
                icon={<MessageCircle size={16} aria-hidden />}
                label="WhatsApp"
                value="Chat with us"
                external
              />

              <Link
                to={ctaUrl}
                className={`inline-flex shrink-0 items-center gap-3 rounded-full bg-accent py-1.5 pl-6 pr-1.5 text-[13px] font-bold text-white transition-all duration-300 hover:bg-orange-600 hover:shadow-[0_10px_26px_rgba(249,115,22,0.4)] ${FOCUS}`}
              >
                {ctaLabel}
                <span className="grid size-8 place-items-center rounded-full bg-white" aria-hidden>
                  <ArrowRight size={15} className="text-accent" />
                </span>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </Section>
  );
}

function ContactBlock({
  href,
  icon,
  label,
  value,
  external,
}: {
  href: string;
  icon: React.ReactNode;
  label: string;
  value: string;
  external?: boolean;
}) {
  return (
    <a
      href={href}
      {...(external ? { target: "_blank", rel: "noopener noreferrer" } : {})}
      className={`group flex items-center gap-3 ${FOCUS} rounded-lg`}
    >
      <span
        className="grid size-10 shrink-0 place-items-center rounded-full text-white ring-1 ring-white/20 transition-colors group-hover:bg-white/10"
        aria-hidden
      >
        {icon}
      </span>
      <span className="min-w-0">
        <span className="block text-[12px] font-semibold text-white">{label}</span>
        <span className="block truncate text-[11px] text-white/60">{value}</span>
      </span>
    </a>
  );
}
