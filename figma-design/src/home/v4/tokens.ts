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

/** Decelerating curve shared by every hover and reveal so motion feels of a piece. */
export const EASE = "ease-[cubic-bezier(0.22,1,0.36,1)]";

/**
 * Two-part shadows: a tight contact shadow keeps the card edge crisp while the
 * wide ambient pass gives it height. A single blur reads flat at these sizes.
 */
export const SHADOW_REST =
  "shadow-[0_1px_2px_rgba(20,33,61,0.05),0_6px_20px_rgba(20,33,61,0.06)]";

export const SHADOW_LIFT =
  "hover:shadow-[0_2px_4px_rgba(20,33,61,0.06),0_20px_44px_rgba(20,33,61,0.16)]";

/** Slight lift in saturation and brightness, applied to every photo slot. */
export const PHOTO_GRADE = "saturate-[1.08] contrast-[1.04] brightness-[1.03]";

export const CARD = `rounded-xl bg-white ring-1 ring-[rgba(20,33,61,0.07)] ${SHADOW_REST}`;

export const CARD_HOVER = `transition-all duration-500 ${EASE} hover:-translate-y-1.5 ${SHADOW_LIFT} hover:ring-[rgba(20,33,61,0.1)]`;

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

// Company contact details live in `src/company.ts` — they are facts about the
// business, not design tokens, and several places outside this folder need them.
