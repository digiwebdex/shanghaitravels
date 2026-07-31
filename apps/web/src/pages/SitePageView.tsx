import { useEffect, useState } from "react";
import { Link, useParams } from "react-router";
import { siteApi } from "@/lib/services";
import { ApiError } from "@/lib/api";

export default function SitePageView() {
  const { slug = "" } = useParams();
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [seoDesc, setSeoDesc] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    void (async () => {
      try {
        const res = await siteApi.page(slug);
        if (res.redirect?.to) {
          window.location.hash = res.redirect.to.replace(/^\/#/, "#").replace(/^#?/, "#");
          return;
        }
        const page = res.page || {};
        setTitle(String(page.title || slug));
        setBody(String(page.body || ""));
        const seo = (page.seo || {}) as { description?: string; title?: string; structuredData?: unknown };
        setSeoDesc(seo.description || "");
        if (seo.title) document.title = seo.title;
        if (seo.structuredData) {
          let el = document.getElementById("cms-jsonld");
          if (!el) {
            el = document.createElement("script");
            el.id = "cms-jsonld";
            el.setAttribute("type", "application/ld+json");
            document.head.appendChild(el);
          }
          el.textContent = JSON.stringify(seo.structuredData);
        }
      } catch (e) {
        setError(e instanceof ApiError ? e.message : "Page not found");
      }
    })();
  }, [slug]);

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="bg-slate-950 text-white px-4 py-3 flex justify-between items-center">
        <Link to="/site" className="font-bold text-[14px]">
          Shanghai Travels
        </Link>
        <Link to="/site/enquire" className="text-[12px] text-amber-300 font-semibold">
          Enquire
        </Link>
      </header>
      <main className="max-w-3xl mx-auto px-4 py-10">
        {error ? (
          <p className="text-red-600 text-[13px]">{error}</p>
        ) : (
          <>
            <h1 className="text-2xl font-bold text-slate-900">{title}</h1>
            {seoDesc && <p className="mt-2 text-[13px] text-slate-500">{seoDesc}</p>}
            <div className="mt-6 text-[14px] text-slate-700 whitespace-pre-wrap leading-relaxed">{body}</div>
          </>
        )}
      </main>
    </div>
  );
}
