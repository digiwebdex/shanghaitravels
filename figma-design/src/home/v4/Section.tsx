import { motion } from "motion/react";
import { ArrowRight } from "lucide-react";
import type { ReactNode } from "react";
import { Link } from "react-router";
import { CONTAINER, SECTION_TOP } from "./tokens";

type SectionProps = {
  id?: string;
  className?: string;
  children: ReactNode;
  containerClassName?: string;
};

export function Section({ id, className = "", containerClassName = "", children }: SectionProps) {
  return (
    <motion.section
      id={id}
      className={`${SECTION_TOP} ${className}`}
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-60px" }}
      transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
    >
      <div className={`${CONTAINER} ${containerClassName}`}>{children}</div>
    </motion.section>
  );
}

type SectionHeadingProps = {
  title: string;
  action?: ReactNode;
  className?: string;
};

/** Left-aligned 26px heading with the 28×3px orange rule from the reference. */
export function SectionHeading({ title, action, className = "" }: SectionHeadingProps) {
  return (
    <div className={`mb-5 flex items-start justify-between gap-4 ${className}`}>
      <div>
        <h2 className="text-[20px] font-bold leading-[1.2] tracking-[-0.022em] text-primary md:text-[26px]">
          {title}
        </h2>
        <span
          className="mt-2.5 block h-[3px] w-7 rounded-full bg-[linear-gradient(90deg,#F97316_0%,#FDBA74_100%)]"
          aria-hidden
        />
      </div>
      {action}
    </div>
  );
}

type ViewAllProps = {
  children: ReactNode;
  to?: string;
  href?: string;
};

export function ViewAll({ children, to, href }: ViewAllProps) {
  const className =
    "hidden shrink-0 items-center gap-1.5 pt-1 text-[12px] font-semibold text-primary/75 transition-colors hover:text-accent sm:inline-flex [&>svg]:transition-transform hover:[&>svg]:translate-x-0.5";

  if (to) {
    return (
      <Link to={to} className={className}>
        {children}
        <ArrowRight size={13} aria-hidden />
      </Link>
    );
  }

  return (
    <a href={href} className={className}>
      {children}
      <ArrowRight size={13} aria-hidden />
    </a>
  );
}
