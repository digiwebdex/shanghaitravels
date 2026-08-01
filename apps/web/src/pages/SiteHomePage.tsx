import { FormEvent, useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router";
import { ArrowLeft } from "lucide-react";
import { siteApi, sitePackagesApi, siteDestinationsApi, type CmsBanner, type CmsContent, type CmsMenu, type CmsTravelOffer } from "@/lib/services";
import { ApiError, listOf } from "@/lib/api";
import { HeroServicesGrid } from "@/components/cms/HeroServicesGrid";
import { DestinationShowcaseGrid } from "@/components/destinations/DestinationShowcaseGrid";
import { PackageCard } from "@/components/packages/PackageCard";
import { PackageQuickView } from "@/components/packages/PackageQuickView";
import type { PackageMaster } from "@/lib/packages";
import type { DestinationMaster, DestinationShowcaseSettings } from "@/lib/destinations";
import { DEFAULT_SHOWCASE_SETTINGS, mergeShowcaseSettings } from "@/lib/destinations";
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
  const [destinations, setDestinations] = useState<DestinationMaster[]>([]);
  const [destSettings, setDestSettings] = useState<DestinationShowcaseSettings>(DEFAULT_SHOWCASE_SETTINGS);
  const [destinationsLoading, setDestinationsLoading] = useState(true);
  const [quickView, setQuickView] = useState<PackageMaster | null>(null);
  const [q, setQ] = useState("");
  const [error, setError] = useState("");
  const [packagesError, setPackagesError] = useState("");
  const [destinationsError, setDestinationsError] = useState("");

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
    void (async () => {
      setDestinationsLoading(true);
      try {
        const [list, settings] = await Promise.all([
          siteDestinationsApi.list({ collection: "home" }),
          siteDestinationsApi.settings().catch(() => DEFAULT_SHOWCASE_SETTINGS),
        ]);
        let items = listOf<DestinationMaster>(list);
        if (!items.length) {
          items = listOf<DestinationMaster>(await siteDestinationsApi.list({ homepageFeatured: true }));
        }
        if (!items.length) {
          items = listOf<DestinationMaster>(await siteDestinationsApi.list({ popular: true }));
        }
        setDestinations(items);
        setDestSettings(mergeShowcaseSettings(settings));
      } catch (e) {
        setDestinationsError(e instanceof ApiError ? e.message : "Failed to load destinations");
      } finally {
        setDestinationsLoading(false);
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
    <div
      className="min-h-screen bg-[var(--background)] text-[var(--foreground)]"
      style={{ fontFamily: "var(--font-sans)" }}
    >
      {/* CMS preview workspace chrome */}
      <div className="sticky top-0 z-50 border-b border-[var(--border)] bg-[var(--navy-700)] text-white">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-2 px-4 py-2.5">
          <div className="flex items-center gap-3">
            <span className="text-[11px] font-bold uppercase tracking-[0.14em] text-[var(--orange-300)]">
              Website Preview
            </span>
            <span className="hidden text-[11px] text-white/55 sm:inline">
              Public site as visitors see it
            </span>
          </div>
          <Link
            to="/cms"
            className="inline-flex items-center gap-1.5 rounded-lg bg-white/10 px-3 py-1.5 text-[11px] font-semibold text-white transition-colors hover:bg-white/15"
          >
            <ArrowLeft size={13} aria-hidden />
            Back to CMS
          </Link>
        </div>
      </div>

      <header className="border-b border-[var(--border)] bg-[var(--card)] px-4 py-3 shadow-[var(--shadow-card)]">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3">
          <Link to="/site" className="text-[15px] font-bold tracking-wide text-[var(--navy-700)]">
            Shanghai Travels
          </Link>
          <nav className="flex flex-wrap gap-3 text-[12px] text-[var(--muted-foreground)]">
            {(menu?.items || []).map((i) => (
              <a key={i.id} href={i.href} className="hover:text-[var(--navy-700)]">
                {i.label}
              </a>
            ))}
            <Link to="/site/enquire" className="font-semibold text-[var(--accent)]">
              Enquire
            </Link>
          </nav>
        </div>
      </header>

      <section className="relative overflow-hidden px-4 py-14 md:py-20">
        <div
          className="absolute inset-0"
          style={{
            background:
              "radial-gradient(ellipse at 15% 0%, rgba(249,115,22,0.12) 0%, transparent 45%), radial-gradient(ellipse at 85% 10%, rgba(20,33,61,0.08) 0%, transparent 40%), linear-gradient(180deg, #EEF1F7 0%, var(--background) 70%)",
          }}
        />
        <div className="relative mx-auto max-w-6xl">
          <p className="mb-3 text-[12px] font-semibold uppercase tracking-[0.2em] text-[var(--accent)]">
            Shanghai Travels
          </p>
          <h1 className="max-w-3xl text-3xl font-bold leading-tight text-[var(--navy-700)] md:text-5xl">
            {hero?.title || "Travel with confidence across China and the world"}
          </h1>
          <p className="mt-4 max-w-2xl text-[14px] leading-relaxed text-[var(--muted-foreground)] md:text-[15px]">
            {hero?.subtitle || "Visa · Air tickets · Tours · Hajj & Umrah — handled by specialists in Dhaka."}
          </p>

          <div className="mt-8 md:mt-10">
            <HeroServicesGrid items={services} variant="light" />
          </div>

          <div className="mt-8 flex flex-wrap items-center gap-3">
            <Link
              to="/site/enquire"
              className="inline-flex items-center justify-center rounded-xl px-5 py-3 text-[13px] font-bold text-white shadow-lg shadow-orange-500/20 transition-colors hover:brightness-105"
              style={{ background: "linear-gradient(135deg,#F97316,#C2410C)" }}
            >
              Request a Free Consultation
            </Link>
            <form onSubmit={search} className="flex min-w-[220px] max-w-md flex-1 gap-2">
              <input
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="Search packages & services…"
                className="flex-1 rounded-xl border border-[var(--border)] bg-[var(--card)] px-3 py-2.5 text-[12px] text-[var(--foreground)] outline-none ring-1 ring-[var(--ring-card)] focus:border-[var(--accent)]"
                aria-label="Search packages and services"
              />
              <button
                type="submit"
                className="rounded-xl bg-[var(--navy-700)] px-3 py-2.5 text-[12px] font-semibold text-white"
              >
                Search
              </button>
            </form>
          </div>
          {error && <p className="mt-3 text-[11px] text-[var(--error)]">{error}</p>}
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 pb-10">
        {destinationsError && <p className="mb-3 text-[11px] text-[var(--error)]">{destinationsError}</p>}
        <DestinationShowcaseGrid
          destinations={destinations}
          settings={destSettings}
          loading={destinationsLoading}
          variant="light"
          title="Popular Destinations"
          subtitle="Where we can take you — live from Destination Master"
          browseHref="/site/destinations"
        />
      </section>

      <section className="mx-auto max-w-6xl px-4 pb-16">
        <div className="mb-4 flex items-end justify-between">
          <h2 className="text-[14px] font-bold text-[var(--navy-700)]">Featured packages</h2>
          <Link to="/site/search" className="text-[11px] font-semibold text-[var(--accent)]">
            View all
          </Link>
        </div>
        {packagesError && <p className="mb-3 text-[11px] text-[var(--error)]">{packagesError}</p>}
        {packages.length > 0 ? (
          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            {packages.map((p) => (
              <PackageCard
                key={p.id}
                pkg={p}
                variant="admin"
                onQuickView={setQuickView}
                bookPath={`/site/packages/${p.slug}/book`}
              />
            ))}
          </div>
        ) : !packagesError ? (
          <p className="text-[12px] text-[var(--muted-foreground)]">No published packages yet — check back soon.</p>
        ) : null}

        {travel.length > 0 && (
          <>
            <h2 className="mb-3 mt-10 text-[14px] font-bold text-[var(--navy-700)]">Featured travel</h2>
            <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
              {travel.map((t) => (
                <Link
                  key={t.id}
                  to={`/site/travel/${t.serviceType}/${t.slug}`}
                  className="rounded-xl bg-[var(--card)] p-4 shadow-[var(--shadow-card)] ring-1 ring-[var(--ring-card)] transition-colors hover:ring-[var(--orange-300)]"
                >
                  <div className="text-[10px] uppercase tracking-wide text-[var(--accent)]">{t.serviceType}</div>
                  <div className="mt-1 text-[13px] font-semibold text-[var(--navy-700)]">{t.title}</div>
                  <div className="mt-1 text-[11px] text-[var(--muted-foreground)]">{t.destination || t.summary || ""}</div>
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
