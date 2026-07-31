import { FormEvent, useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router";
import { siteApi, sitePackagesApi, type CmsBanner, type CmsContent, type CmsMenu, type CmsTravelOffer } from "@/lib/services";
import { ApiError, listOf } from "@/lib/api";
import { HeroServicesGrid } from "@/components/cms/HeroServicesGrid";
import { PackageCard } from "@/components/packages/PackageCard";
import { PackageQuickView } from "@/components/packages/PackageQuickView";
import type { PackageMaster } from "@/lib/packages";
import {
  DEFAULT_HERO_SERVICES,
  HERO_SERVICE_TYPE,
  parseHeroServiceFromCms,
  type HeroServiceItem,
} from "@/lib/heroServices";

const SITE_DEFAULT_SERVICES: HeroServiceItem[] = DEFAULT_HERO_SERVICES.map((s) => ({
  ...s,
  url:
    s.icon === "passport"
      ? "/site/enquire"
      : s.icon === "kaaba" || s.icon === "globe"
        ? "/site/travel/tour"
        : "/site/enquire",
}));

export default function SiteHomePage() {
  const nav = useNavigate();
  const [menu, setMenu] = useState<CmsMenu | null>(null);
  const [banners, setBanners] = useState<CmsBanner[]>([]);
  const [travel, setTravel] = useState<CmsTravelOffer[]>([]);
  const [heroServices, setHeroServices] = useState<HeroServiceItem[]>([]);
  const [packages, setPackages] = useState<PackageMaster[]>([]);
  const [quickView, setQuickView] = useState<PackageMaster | null>(null);
  const [q, setQ] = useState("");
  const [error, setError] = useState("");
  const [packagesError, setPackagesError] = useState("");

  useEffect(() => {
    void (async () => {
      try {
        const [m, b, t, hs] = await Promise.all([
          siteApi.menu("main"),
          siteApi.banners("hero"),
          siteApi.travel(),
          siteApi.content(HERO_SERVICE_TYPE).catch(() => [] as CmsContent[]),
        ]);
        setMenu(m);
        setBanners(b);
        setTravel(t.slice(0, 6));
        const parsed = (hs || []).map((row) => parseHeroServiceFromCms(row));
        setHeroServices(parsed.filter((x) => x.enabled));
      } catch (e) {
        setError(e instanceof ApiError ? e.message : "Failed to load site");
      }
    })();
    void (async () => {
      try {
        let list = listOf<PackageMaster>(await sitePackagesApi.list({ collection: "home", limit: 6 }));
        if (!list.length) {
          list = listOf<PackageMaster>(
            await sitePackagesApi.list({ homeFeatured: true, limit: 6 }),
          );
        }
        if (!list.length) {
          list = listOf<PackageMaster>(
            await sitePackagesApi.list({ popular: true, limit: 6 }),
          );
        }
        setPackages(list);
      } catch (e) {
        setPackagesError(e instanceof ApiError ? e.message : "Failed to load packages");
      }
    })();
  }, []);

  function search(e: FormEvent) {
    e.preventDefault();
    if (q.trim().length < 2) return;
    nav(`/site/search?q=${encodeURIComponent(q.trim())}`);
  }

  const hero = banners[0];
  const services = useMemo(
    () => (heroServices.length ? heroServices : SITE_DEFAULT_SERVICES),
    [heroServices],
  );

  return (
    <div className="min-h-screen bg-slate-950 text-white">
      <header className="border-b border-white/10 px-4 py-3 flex flex-wrap items-center justify-between gap-3">
        <Link to="/site" className="font-bold tracking-wide text-[15px]">
          Shanghai Travels
        </Link>
        <nav className="flex flex-wrap gap-3 text-[12px] text-white/80">
          {(menu?.items || []).map((i) => (
            <a key={i.id} href={i.href} className="hover:text-white">
              {i.label}
            </a>
          ))}
          <Link to="/site/enquire" className="text-amber-300 font-semibold">
            Enquire
          </Link>
        </nav>
      </header>

      <section className="relative px-4 py-14 md:py-20 overflow-hidden">
        <div
          className="absolute inset-0 opacity-45"
          style={{
            background:
              "radial-gradient(ellipse at 20% 20%, #b45309 0%, transparent 50%), radial-gradient(ellipse at 80% 0%, #0ea5e9 0%, transparent 45%)",
          }}
        />
        <div className="relative max-w-6xl mx-auto">
          <p className="text-amber-300 text-[12px] font-semibold tracking-[0.2em] uppercase mb-3">Shanghai Travels</p>
          <h1 className="text-3xl md:text-5xl font-bold max-w-3xl leading-tight">
            {hero?.title || "Travel with confidence across China and the world"}
          </h1>
          <p className="mt-4 text-white/70 max-w-2xl text-[14px] md:text-[15px] leading-relaxed">
            {hero?.subtitle || "Visa · Air tickets · Tours · Hajj & Umrah — handled by specialists in Dhaka."}
          </p>

          <div className="mt-8 md:mt-10">
            <HeroServicesGrid items={services} variant="dark" />
          </div>

          <div className="mt-8 flex flex-wrap items-center gap-3">
            <Link
              to="/site/enquire"
              className="inline-flex items-center justify-center px-5 py-3 rounded-xl bg-amber-500 text-slate-950 text-[13px] font-bold hover:bg-amber-400 transition-colors shadow-lg shadow-amber-500/20"
            >
              Request a Free Consultation
            </Link>
            <form onSubmit={search} className="flex gap-2 flex-1 min-w-[220px] max-w-md">
              <input
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="Search packages & services…"
                className="flex-1 rounded-xl bg-white/10 border border-white/20 px-3 py-2.5 text-[12px] outline-none focus:border-amber-400"
                aria-label="Search packages and services"
              />
              <button type="submit" className="px-3 py-2.5 rounded-xl bg-white text-slate-900 text-[12px] font-semibold">
                Search
              </button>
            </form>
          </div>
          {error && <p className="mt-3 text-red-300 text-[11px]">{error}</p>}
        </div>
      </section>

      <section className="px-4 pb-16 max-w-6xl mx-auto">
        <div className="flex items-end justify-between mb-4">
          <h2 className="text-[14px] font-bold">Featured packages</h2>
          <Link to="/site/search" className="text-[11px] text-amber-300 font-semibold">
            View all
          </Link>
        </div>
        {packagesError && <p className="text-red-300 text-[11px] mb-3">{packagesError}</p>}
        {packages.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {packages.map((p) => (
              <PackageCard
                key={p.id}
                pkg={p}
                onQuickView={setQuickView}
                bookPath={`/site/packages/${p.slug}/book`}
              />
            ))}
          </div>
        ) : !packagesError ? (
          <p className="text-[12px] text-white/50">No published packages yet — check back soon.</p>
        ) : null}

        {travel.length > 0 && (
          <>
            <h2 className="text-[14px] font-bold mb-3 mt-10">Featured travel</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {travel.map((t) => (
                <Link
                  key={t.id}
                  to={`/site/travel/${t.serviceType}/${t.slug}`}
                  className="rounded-xl border border-white/10 bg-white/5 p-4 hover:bg-white/10 transition-colors"
                >
                  <div className="text-[10px] uppercase tracking-wide text-amber-300">{t.serviceType}</div>
                  <div className="font-semibold text-[13px] mt-1">{t.title}</div>
                  <div className="text-[11px] text-white/60 mt-1">{t.destination || t.summary || ""}</div>
                </Link>
              ))}
            </div>
          </>
        )}
      </section>

      <PackageQuickView pkg={quickView} onClose={() => setQuickView(null)} />
    </div>
  );
}
