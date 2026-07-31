import { motion } from "motion/react";
import type { ReactNode } from "react";

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
      className={className}
      initial={{ opacity: 0, y: 28 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-80px" }}
      transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
    >
      <div className={`max-w-[1440px] mx-auto px-6 md:px-8 ${containerClassName}`}>{children}</div>
    </motion.section>
  );
}

type SectionHeaderProps = {
  eyebrow?: string;
  title: string;
  subtitle?: string;
  action?: ReactNode;
  centered?: boolean;
  className?: string;
};

export function SectionHeader({ eyebrow, title, subtitle, action, centered, className = "" }: SectionHeaderProps) {
  return (
    <div
      className={`mb-10 md:mb-12 flex flex-col gap-4 ${centered ? "text-center items-center" : "md:flex-row md:items-end md:justify-between"} ${className}`}
    >
      <div className={centered ? "max-w-2xl" : ""}>
        {eyebrow && (
          <p className="text-xs font-semibold tracking-widest text-accent uppercase mb-2">{eyebrow}</p>
        )}
        <h2 className="text-foreground text-3xl md:text-4xl font-bold tracking-tight">{title}</h2>
        {subtitle && <p className="text-muted-foreground text-sm md:text-base mt-2 leading-relaxed">{subtitle}</p>}
      </div>
      {action}
    </div>
  );
}
