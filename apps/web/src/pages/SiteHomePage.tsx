import { FormEvent, useEffect, useState } from "react";
import { Link, useNavigate } from "react-router";
import { siteApi, type CmsBanner, type CmsMenu, type CmsTravelOffer } from "@/lib/services";
import { ApiError } from "@/lib/api";

export default function SiteHomePage() {
  const nav = useNavigate();
  const [menu, setMenu] = useState<CmsMenu | null>(null);
  const [banners, setBanners] = useState<CmsBanner[]>([]);
  const [travel, setTravel] = useState<CmsTravelOffer[]>([]);
  const [q, setQ] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    void (async () => {
      try {
        const [m, b, t] = await Promise.all([
          siteApi.menu("main"),
          siteApi.banners("hero"),
          siteApi.travel(),
        ]);
        setMenu(m);
        setBanners(b);
        setTravel(t.slice(0, 6));
      } catch (e) {
        setError(e instanceof ApiError ? e.message : "Failed to load site");
      }
    })();
  }, []);

  function search(e: FormEvent) {
    e.preventDefault();
    if (q.trim().length < 2) return;
    nav(`/site/search?q=${encodeURIComponent(q.trim())}`);
  }

  const hero = banners[0];

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
      <section className="relative px-4 py-16 md:py-24 max-w-5xl mx-auto">
        <div
          className="absolute inset-0 opacity-40"
          style={{
            background:
              "radial-gradient(ellipse at 20% 20%, #b45309 0%, transparent 50%), radial-gradient(ellipse at 80% 0%, #0ea5e9 0%, transparent 45%)",
          }}
        />
        <div className="relative">
          <p className="text-amber-300 text-[12px] font-semibold tracking-[0.2em] uppercase mb-3">Shanghai Travels</p>
          <h1 className="text-3xl md:text-5xl font-bold max-w-2xl leading-tight">
            {hero?.title || "Travel with confidence across China and the world"}
          </h1>
          <p className="mt-4 text-white/70 max-w-xl text-[14px]">
            {hero?.subtitle || "Visa · Air tickets · Tours · Hajj & Umrah · Hotels · Transport"}
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <Link
              to="/site/enquire"
              className="px-4 py-2 rounded-lg bg-amber-500 text-slate-950 text-[12px] font-bold"
            >
              Request a quote
            </Link>
            <Link to="/site/p/visa" className="px-4 py-2 rounded-lg border border-white/20 text-[12px] font-semibold">
              Visa services
            </Link>
          </div>
          <form onSubmit={search} className="mt-8 flex gap-2 max-w-lg">
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Search packages & services…"
              className="flex-1 rounded-lg bg-white/10 border border-white/20 px-3 py-2 text-[12px] outline-none focus:border-amber-400"
            />
            <button type="submit" className="px-3 py-2 rounded-lg bg-white text-slate-900 text-[12px] font-semibold">
              Search
            </button>
          </form>
          {error && <p className="mt-3 text-red-300 text-[11px]">{error}</p>}
        </div>
      </section>
      <section className="px-4 pb-16 max-w-5xl mx-auto">
        <h2 className="text-[14px] font-bold mb-3">Featured travel</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {travel.map((t) => (
            <Link
              key={t.id}
              to={`/site/travel/${t.serviceType}/${t.slug}`}
              className="rounded-xl border border-white/10 bg-white/5 p-4 hover:bg-white/10"
            >
              <div className="text-[10px] uppercase tracking-wide text-amber-300">{t.serviceType}</div>
              <div className="font-semibold text-[13px] mt-1">{t.title}</div>
              <div className="text-[11px] text-white/60 mt-1">{t.destination || t.summary || ""}</div>
            </Link>
          ))}
          {!travel.length && <p className="text-[12px] text-white/50">No published offers yet.</p>}
        </div>
      </section>
    </div>
  );
}
