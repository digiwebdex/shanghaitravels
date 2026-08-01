import { useEffect, useRef, useState } from "react";
import { motion, useInView, useReducedMotion } from "motion/react";
import { Award, Globe2, ShieldCheck, Users } from "lucide-react";
import { Section } from "./Section";
import type { CmsContent } from "./api";
import { parseMetaArray } from "./format";

type StatItem = { value: string; label: string; icon?: string };

const FALLBACK_STATS: StatItem[] = [
  { value: "20+", label: "Years of Experience", icon: "award" },
  { value: "15,000+", label: "Happy Travellers", icon: "users" },
  { value: "120+", label: "Destinations Worldwide", icon: "globe" },
  { value: "98%", label: "Visa Success Rate", icon: "shield" },
];

const ICONS = { award: Award, users: Users, globe: Globe2, shield: ShieldCheck };
const ICON_ORDER = [Award, Users, Globe2, ShieldCheck];

function parseNumeric(value: string) {
  const match = value.match(/^([^0-9]*)([\d,.]+)(.*)$/);
  if (!match) return null;
  const num = Number.parseFloat(match[2].replace(/,/g, ""));
  if (Number.isNaN(num)) return null;
  return { prefix: match[1], suffix: match[3], num };
}

function CountUp({ value, active }: { value: string; active: boolean }) {
  const reduceMotion = useReducedMotion();
  const parsed = parseNumeric(value);
  const [display, setDisplay] = useState(parsed && !reduceMotion ? `${parsed.prefix}0${parsed.suffix}` : value);

  useEffect(() => {
    if (!active || !parsed || reduceMotion) {
      setDisplay(value);
      return;
    }
    let frame = 0;
    let raf = 0;
    const totalFrames = 48;
    const { num, prefix, suffix } = parsed;
    const tick = () => {
      frame += 1;
      const progress = Math.min(1, frame / totalFrames);
      const current = Math.round(num * (1 - Math.pow(1 - progress, 3)));
      setDisplay(`${prefix}${num >= 1000 ? current.toLocaleString("en-BD") : current}${suffix}`);
      if (frame < totalFrames) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [active, parsed, reduceMotion, value]);

  return <span>{display}</span>;
}

type StatsBarProps = {
  content?: CmsContent | null;
};

export function StatsBar({ content }: StatsBarProps) {
  const fromCms = content ? parseMetaArray<StatItem>(content.meta, "stats") : [];
  const stats = (fromCms.length ? fromCms : FALLBACK_STATS).slice(0, 4);
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: "-40px" });

  return (
    <Section id="stats">
      <div
        ref={ref}
        className="grid grid-cols-2 items-center gap-6 rounded-2xl bg-primary px-6 py-7 shadow-[0_10px_30px_rgba(20,33,61,0.18)] md:grid-cols-4 md:px-10 lg:h-[104px] lg:py-0"
      >
        {stats.map((stat, i) => {
          const Icon = (stat.icon && ICONS[stat.icon as keyof typeof ICONS]) || ICON_ORDER[i] || Award;
          return (
            <motion.div
              key={stat.label}
              className="flex items-center justify-center gap-3.5"
              initial={{ opacity: 0, y: 14 }}
              animate={inView ? { opacity: 1, y: 0 } : undefined}
              transition={{ duration: 0.45, delay: i * 0.08 }}
            >
              <span
                className="grid size-11 shrink-0 place-items-center rounded-full text-accent ring-1 ring-white/15"
                aria-hidden
              >
                <Icon size={20} strokeWidth={1.6} />
              </span>
              <span className="min-w-0">
                <span className="block text-[24px] font-extrabold leading-none text-white md:text-[26px]">
                  <CountUp value={stat.value} active={inView} />
                </span>
                <span className="mt-1.5 block truncate text-[11px] text-white/55">{stat.label}</span>
              </span>
            </motion.div>
          );
        })}
      </div>
    </Section>
  );
}
