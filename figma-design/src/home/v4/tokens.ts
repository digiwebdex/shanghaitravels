/**
 * V4 design tokens measured from the approved homepage reference (1440px frame).
 *
 * Content box is 1320px wide inside a 1440px frame; sections are separated by a
 * 36px rhythm and every band sits on white — navy only appears on the top bar,
 * the stats card, the CTA card and the footer.
 */

export const CONTAINER = "mx-auto w-full max-w-[1368px] px-5 sm:px-6";

/** 36px top rhythm; the last section adds its own bottom padding. */
export const SECTION_TOP = "pt-8 md:pt-9";

export const CARD =
  "rounded-xl bg-white ring-1 ring-[rgba(20,33,61,0.08)] shadow-[0_2px_12px_rgba(20,33,61,0.06)]";

export const CARD_HOVER =
  "transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_14px_32px_rgba(20,33,61,0.14)]";

export const FOCUS =
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2";

/** Solid icon-circle palette used by the services row, in reference order. */
export const ICON_TINTS = [
  "bg-[#2F80ED]",
  "bg-[#F97316]",
  "bg-[#22A45D]",
  "bg-[#8B5CF6]",
  "bg-[#14B8A6]",
  "bg-[#EF4444]",
] as const;

export const HOTLINE = "+880 1333-356393";
export const HOTLINE_ALT = "+880 1742-255003";
export const WHATSAPP = "8801333356393";
export const EMAIL = "info@shanghaitravels.com.bd";
export const REG_NO = "0017053";
