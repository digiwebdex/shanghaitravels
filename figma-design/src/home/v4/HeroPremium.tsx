import { Link } from "react-router";
import { motion } from "motion/react";
import { ArrowRight, BadgeCheck } from "lucide-react";
import type { CmsBanner } from "./api";

const DEFAULT_HERO =
  "https://images.unsplash.com/photo-1488085061387-422e29b40080?w=1600&h=900&fit=crop&auto=format";

const HERO_PILLS = [
  { icon: "🛂", title: "Visa Services", tagline: "Tourist, business & student visas", url: "/visa" },
  { icon: "✈️", title: "Air Tickets", tagline: "Best fares on 500+ airlines", url: "/flights" },
  { icon: "🕋", title: "Hajj & Umrah", tagline: "VIP & economy pilgrimage packages", url: "/services" },
  { icon: "🌍", title: "Tour Packages", tagline: "Curated itineraries worldwide", url: "/tours" },
] as const;

type HeroPremiumProps = {
  banner?: CmsBanner | null;
};

export function HeroPremium({ banner }: HeroPremiumProps) {
  const imageUrl = banner?.imageUrl || DEFAULT_HERO;
  const title = banner?.title || "Your World, Expertly Planned.";
  const subtitle =
    banner?.subtitle ||
    "Visa, air tickets, hotels, tours, Hajj & Umrah and more — handled by specialists in Vatara, Dhaka, Bangladesh.";

  return (
    <section className="relative min-h-[92vh] flex items-center justify-center overflow-hidden -mt-16">
      <img src={imageUrl} alt="" className="absolute inset-0 w-full h-full object-cover" />
      <div className="absolute inset-0 bg-gradient-to-b from-primary/85 via-primary/65 to-primary/50" />

      <div className="relative z-10 w-full max-w-[1440px] mx-auto px-6 md:px-8 pt-28 pb-20 text-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <p className="text-xs font-semibold tracking-[0.2em] uppercase text-accent mb-4">
            Shanghai Travels · Dhaka, Bangladesh
          </p>

          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/10 border border-white/20 text-white text-xs font-medium mb-6 backdrop-blur-sm">
            <BadgeCheck size={13} className="text-accent" />
            Govt. Registered · Reg. No. 0017053
          </div>

          <h1 className="text-white text-4xl sm:text-5xl md:text-6xl font-bold mb-5 leading-[1.08] max-w-4xl mx-auto tracking-tight">
            {title.includes(",") ? (
              title
            ) : (
              <>
                Your World,
                <br />
                <span className="text-accent">Expertly Planned.</span>
              </>
            )}
          </h1>

          <p className="text-white/75 text-base md:text-lg max-w-2xl mx-auto mb-8 leading-relaxed">{subtitle}</p>

          <Link
            to="/inquiry"
            className="inline-flex items-center justify-center gap-2 px-8 py-3.5 rounded-xl bg-accent text-white font-bold text-sm hover:bg-orange-600 transition-all duration-300 shadow-lg shadow-orange-500/30 hover:shadow-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
          >
            Request Free Consultation
            <ArrowRight size={16} aria-hidden />
          </Link>
        </motion.div>

        <motion.nav
          className="max-w-4xl mx-auto mt-10"
          aria-label="Quick access travel services"
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.15 }}
        >
          <ul className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {HERO_PILLS.map((item) => (
              <li key={item.url}>
                <Link
                  to={item.url}
                  className="group flex flex-col items-center justify-center gap-1 min-h-[72px] rounded-2xl border border-white/35 bg-white/12 px-4 py-3 text-white backdrop-blur-md shadow-[0_8px_24px_rgba(0,0,0,0.12),inset_0_1px_0_rgba(255,255,255,0.18)] transition-all duration-300 hover:border-accent hover:bg-white/16 hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
                >
                  <span className="text-xl leading-none" aria-hidden>
                    {item.icon}
                  </span>
                  <span className="text-[13px] font-bold">{item.title}</span>
                  <span className="text-[11px] text-white/65 leading-tight">{item.tagline}</span>
                </Link>
              </li>
            ))}
          </ul>
        </motion.nav>
      </div>
    </section>
  );
}
