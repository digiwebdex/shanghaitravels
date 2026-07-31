import { useEffect, useRef, useState } from "react";
import { motion, useInView } from "motion/react";
import { Section } from "./Section";
import type { CmsContent } from "./api";
import { parseMetaArray } from "./format";

type StatItem = { value: string; label: string; icon?: string };

const FALLBACK_STATS: StatItem[] = [
  { value: "15+", label: "Years in Business" },
  { value: "50,000+", label: "Happy Travellers" },
  { value: "100+", label: "Visa Destinations" },
  { value: "98%", label: "Client Satisfaction" },
  { value: "24/7", label: "Expert Support" },
];

function parseNumeric(value: string): { num: number; prefix: string; suffix: string } | null {
  const match = value.match(/^([^0-9]*)([\d,.]+)(.*)$/);
  if (!match) return null;
  const num = parseFloat(match[2].replace(/,/g, ""));
  if (Number.isNaN(num)) return null;
  return { prefix: match[1], suffix: match[3], num };
}

function CountUp({ value, active }: { value: string; active: boolean }) {
  const parsed = parseNumeric(value);
  const [display, setDisplay] = useState(value);

  useEffect(() => {
    if (!active || !parsed) {
      setDisplay(value);
      return;
    }
    let frame = 0;
    const totalFrames = 48;
    const { num, prefix, suffix } = parsed;
    const tick = () => {
      frame += 1;
      const progress = Math.min(1, frame / totalFrames);
      const eased = 1 - Math.pow(1 - progress, 3);
      const current = Math.round(num * eased);
      const formatted = num >= 1000 ? current.toLocaleString("en-BD") : String(current);
      setDisplay(`${prefix}${formatted}${suffix}`);
      if (frame < totalFrames) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  }, [active, parsed, value]);

  return <span>{display}</span>;
}

type StatsBarProps = {
  content?: CmsContent | null;
};

export function StatsBar({ content }: StatsBarProps) {
  const stats = content ? parseMetaArray<StatItem>(content.meta, "stats") : FALLBACK_STATS;
  const displayStats = stats.length ? stats : FALLBACK_STATS;
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: "-40px" });

  return (
    <Section className="py-12 md:py-14 bg-primary border-y border-white/5">
      <div ref={ref} className="grid grid-cols-2 md:grid-cols-5 gap-6 md:divide-x md:divide-white/10">
        {displayStats.map((stat, i) => (
          <motion.div
            key={stat.label}
            className="text-center px-4"
            initial={{ opacity: 0, y: 16 }}
            animate={inView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.5, delay: i * 0.08 }}
          >
            <p className="text-3xl md:text-4xl font-bold text-white mb-1">
              <CountUp value={stat.value} active={inView} />
            </p>
            <p className="text-xs text-white/50">{stat.label}</p>
          </motion.div>
        ))}
      </div>
    </Section>
  );
}
