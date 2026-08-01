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

const COUNT_DURATION_MS = 1400;

function CountUp({ value, active }: { value: string; active: boolean }) {
  const reduceMotion = useReducedMotion();
  const [display, setDisplay] = useState(() => {
    const parsed = parseNumeric(value);
    return parsed ? `${parsed.prefix}0${parsed.suffix}` : value;
  });

  useEffect(() => {
    // parseNumeric must stay inside the effect: as a render-scoped value it is a
    // new object every render, and listing it as a dependency restarts the
    // animation on the very render its own setDisplay triggers.
    const parsed = parseNumeric(value);
    if (!parsed || reduceMotion) {
      setDisplay(value);
      return;
    }
    // Hold the zero state until the band scrolls in, otherwise the final figure
    // paints first and then snaps back to zero to start counting.
    if (!active) return;

    const { num, prefix, suffix } = parsed;
    let raf = 0;
    const started = performance.now();

    const tick = (now: number) => {
      const progress = Math.min(1, (now - started) / COUNT_DURATION_MS);
      if (progress >= 1) {
        // Land on the authored string so formatting matches the CMS exactly.
        setDisplay(value);
        return;
      }
      const current = Math.round(num * (1 - Math.pow(1 - progress, 3)));
      setDisplay(`${prefix}${current.toLocaleString("en-BD")}${suffix}`);
      raf = requestAnimationFrame(tick);
    };

    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [active, reduceMotion, value]);

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
        className="relative grid grid-cols-2 items-center gap-6 overflow-hidden rounded-2xl bg-[linear-gradient(115deg,#1B2C50_0%,#14213D_46%,#0D1629_100%)] px-6 py-7 shadow-[0_2px_6px_rgba(20,33,61,0.12),0_16px_40px_rgba(20,33,61,0.22)] md:grid-cols-4 md:px-10 lg:h-[104px] lg:py-0"
      >
        {/* Warm glow behind the counters keeps the navy band from reading flat. */}
        <div
          className="pointer-events-none absolute inset-0 bg-[radial-gradient(70%_180%_at_88%_50%,rgba(249,115,22,0.18)_0%,rgba(249,115,22,0)_100%)]"
          aria-hidden
        />
        {stats.map((stat, i) => {
          const Icon = (stat.icon && ICONS[stat.icon as keyof typeof ICONS]) || ICON_ORDER[i] || Award;
          return (
            <motion.div
              key={stat.label}
              className="relative flex items-center justify-center gap-3.5"
              initial={{ opacity: 0, y: 14 }}
              animate={inView ? { opacity: 1, y: 0 } : undefined}
              transition={{ duration: 0.45, delay: i * 0.08 }}
            >
              <span
                className="grid size-11 shrink-0 place-items-center rounded-full bg-white/[0.06] text-accent ring-1 ring-white/15"
                aria-hidden
              >
                <Icon size={20} strokeWidth={1.6} />
              </span>
              <span className="min-w-0">
                <span className="block text-[24px] font-extrabold leading-none tracking-[-0.02em] text-white md:text-[26px]">
                  <CountUp value={stat.value} active={inView} />
                </span>
                <span className="mt-2 block truncate text-[11px] tracking-[0.01em] text-white/60">
                  {stat.label}
                </span>
              </span>
            </motion.div>
          );
        })}
      </div>
    </Section>
  );
}
