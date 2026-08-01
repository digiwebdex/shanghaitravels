import { Link } from "react-router";
import { ArrowRight, MessageCircle, Phone } from "lucide-react";
import { Section } from "./Section";
import type { CmsBanner } from "./api";
import { CTA_PHOTO } from "./photos";
import { EASE, FOCUS, PHOTO_GRADE } from "./tokens";
import { HOTLINE, telHref, waHref } from "../../company";

type CtaBannerProps = {
  banner?: CmsBanner | null;
};

export function CtaBanner({ banner }: CtaBannerProps) {
  const image = banner?.imageUrl || CTA_PHOTO;
  const title = banner?.title?.trim() || "Ready for your next journey?";
  const subtitle = banner?.subtitle?.trim() || "Let our experts plan your perfect trip";
  const ctaLabel = banner?.ctaLabel?.trim() || "Request Consultation";
  const ctaUrl = banner?.ctaUrl?.trim() || "/inquiry";

  return (
    <Section id="cta">
      <div className="relative overflow-hidden rounded-2xl bg-[linear-gradient(115deg,#1B2C50_0%,#14213D_48%,#0D1629_100%)] shadow-[0_2px_6px_rgba(20,33,61,0.14),0_20px_46px_rgba(20,33,61,0.24)]">
        {/* Warm rake from the photo edge plus a cool lift on the far corner. */}
        <div
          className="pointer-events-none absolute inset-0 bg-[radial-gradient(60%_150%_at_18%_50%,rgba(249,115,22,0.2)_0%,rgba(249,115,22,0)_100%),radial-gradient(50%_140%_at_100%_0%,rgba(47,128,237,0.16)_0%,rgba(47,128,237,0)_100%)]"
          aria-hidden
        />

        <div className="relative flex flex-col lg:h-[150px] lg:flex-row lg:items-center">
          <div className="relative h-[150px] w-full shrink-0 overflow-hidden lg:w-[210px]">
            <img
              src={image}
              alt=""
              loading="lazy"
              className={`size-full object-cover object-center ${PHOTO_GRADE}`}
            />
            <div
              className="absolute inset-0 bg-[linear-gradient(90deg,rgba(20,33,61,0.25)_0%,rgba(20,33,61,0.35)_55%,rgba(20,33,61,1)_100%)] lg:bg-[linear-gradient(90deg,rgba(20,33,61,0)_0%,rgba(20,33,61,0.4)_62%,rgba(20,33,61,1)_100%)]"
              aria-hidden
            />
          </div>

          <div className="flex flex-1 flex-col gap-5 px-6 py-6 lg:flex-row lg:items-center lg:justify-between lg:py-0 lg:pl-2 lg:pr-6">
            <div className="min-w-0">
              <h2 className="text-[21px] font-bold leading-[1.2] tracking-[-0.022em] text-white md:text-[26px]">
                {title}
              </h2>
              <p className="mt-2 text-[13px] leading-[1.5] text-white/65">{subtitle}</p>
            </div>

            <div className="flex flex-wrap items-center gap-6 xl:gap-8">
              <ContactBlock
                href={telHref(HOTLINE)}
                icon={<Phone size={16} aria-hidden />}
                label="Call Us"
                value={HOTLINE}
              />
              <ContactBlock
                href={waHref(HOTLINE)}
                icon={<MessageCircle size={16} aria-hidden />}
                label="WhatsApp"
                value="Chat with us"
                external
              />

              <Link
                to={ctaUrl}
                className={`group inline-flex shrink-0 items-center gap-3 rounded-full bg-accent py-1.5 pl-6 pr-1.5 text-[13px] font-bold tracking-[0.01em] text-white shadow-[0_6px_18px_rgba(249,115,22,0.32)] transition-all duration-500 ${EASE} hover:-translate-y-0.5 hover:bg-orange-600 hover:shadow-[0_14px_32px_rgba(249,115,22,0.45)] ${FOCUS}`}
              >
                {ctaLabel}
                <span
                  className={`grid size-8 place-items-center rounded-full bg-white transition-transform duration-500 ${EASE} group-hover:translate-x-0.5`}
                  aria-hidden
                >
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
        className="grid size-10 shrink-0 place-items-center rounded-full bg-white/[0.06] text-white ring-1 ring-white/20 transition-all duration-300 group-hover:scale-105 group-hover:bg-white/15 group-hover:ring-white/35"
        aria-hidden
      >
        {icon}
      </span>
      <span className="min-w-0">
        <span className="block text-[12px] font-semibold tracking-[0.005em] text-white">{label}</span>
        <span className="mt-0.5 block truncate text-[11px] text-white/60">{value}</span>
      </span>
    </a>
  );
}
