import { FormEvent, useCallback, useEffect, useState } from "react";
import { Tags } from "lucide-react";
import {
  PageHeader,
  PageShell,
  inputCls,
  labelCls,
} from "@/components/enterprise/Page";
import { salesApi, type PriceBook, type PriceTemplate } from "@/lib/services";
import { ApiError } from "@/lib/api";
import { Can } from "@/auth/Can";
import { ErrorBanner, SuccessBanner } from "@/components/Feedback";
import { InlineSpinner } from "@/components/FullPageSpinner";
import { SalesModuleNav } from "@/components/sales/SalesModuleNav";
import { formatBdt, QUOTE_SERVICES, toPoisha } from "@/lib/crm";
import { PRICE_BOOK_KINDS, validatePriceBook } from "@/lib/sales";

export default function SalesPricingPage() {
  const [templates, setTemplates] = useState<PriceTemplate[]>([]);
  const [books, setBooks] = useState<PriceBook[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [ok, setOk] = useState("");
  const [tplName, setTplName] = useState("");
  const [tplService, setTplService] = useState("visa");
  const [tplDesc, setTplDesc] = useState("");
  const [tplPrice, setTplPrice] = useState("");
  const [bookName, setBookName] = useState("");
  const [bookKind, setBookKind] = useState("promo");
  const [bookService, setBookService] = useState("visa");
  const [bookPrice, setBookPrice] = useState("");
  const [bookDiscBps, setBookDiscBps] = useState("0");
  const [resolved, setResolved] = useState<Record<string, unknown> | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [t, b] = await Promise.all([salesApi.listPriceTemplates(), salesApi.listPriceBooks()]);
      setTemplates(t);
      setBooks(b);
    } catch (e) {
      setError(e instanceof ApiError ? e.message : "Failed to load pricing");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  async function createTemplate(e: FormEvent) {
    e.preventDefault();
    try {
      await salesApi.createPriceTemplate({
        name: tplName.trim(),
        serviceType: tplService,
        lines: [{ description: tplDesc.trim() || tplName.trim(), unitPricePoisha: toPoisha(tplPrice || "0") }],
      });
      setOk("Price template created");
      setTplName("");
      setTplDesc("");
      setTplPrice("");
      await load();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Template create failed");
    }
  }

  async function createBook(e: FormEvent) {
    e.preventDefault();
    const bad = validatePriceBook({ name: bookName, kind: bookKind });
    if (bad) {
      setError(bad);
      return;
    }
    try {
      await salesApi.createPriceBook({
        name: bookName.trim(),
        kind: bookKind,
        serviceType: bookService,
        unitPricePoisha: bookPrice ? toPoisha(bookPrice) : undefined,
        discountBps: Number(bookDiscBps) || 0,
      });
      setOk("Price book created");
      setBookName("");
      await load();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Price book create failed");
    }
  }

  async function resolve() {
    try {
      setResolved((await salesApi.resolvePricing({ serviceType: bookService })) as Record<string, unknown>);
    } catch (e) {
      setError(e instanceof ApiError ? e.message : "Resolve failed");
    }
  }

  return (
    <PageShell wide>
      <PageHeader
        icon={Tags}
        title="Sales pricing"
        subtitle="Product templates plus customer, corporate, agent, and promotional price books."
        breadcrumb={[{ label: "Sales", to: "/sales" }, { label: "Sales pricing" }]}
      />
      <SalesModuleNav />
        <ErrorBanner message={error} />
        <SuccessBanner message={ok} />
        <Can perm="sales:pricing">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <form onSubmit={(e) => void createTemplate(e)} className="bg-white rounded-xl border border-slate-200 p-4 space-y-2">
              <h2 className="text-[12px] font-bold">New template</h2>
              <div>
                <label className={labelCls}>Name</label>
                <input className={inputCls} value={tplName} onChange={(e) => setTplName(e.target.value)} required />
              </div>
              <div>
                <label className={labelCls}>Service</label>
                <select className={inputCls} value={tplService} onChange={(e) => setTplService(e.target.value)}>
                  {QUOTE_SERVICES.map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className={labelCls}>Line description</label>
                <input className={inputCls} value={tplDesc} onChange={(e) => setTplDesc(e.target.value)} />
              </div>
              <div>
                <label className={labelCls}>Unit price (BDT)</label>
                <input className={inputCls} value={tplPrice} onChange={(e) => setTplPrice(e.target.value)} required />
              </div>
              <button type="submit" className="px-3 py-1.5 rounded-lg text-[10.5px] font-bold text-white" style={{ background: "linear-gradient(135deg,#F97316,#C2410C)" }}>
                Save template
              </button>
            </form>
            <form onSubmit={(e) => void createBook(e)} className="bg-white rounded-xl border border-slate-200 p-4 space-y-2">
              <h2 className="text-[12px] font-bold">New price book</h2>
              <div>
                <label className={labelCls}>Name</label>
                <input className={inputCls} value={bookName} onChange={(e) => setBookName(e.target.value)} required />
              </div>
              <div>
                <label className={labelCls}>Kind</label>
                <select className={inputCls} value={bookKind} onChange={(e) => setBookKind(e.target.value)}>
                  {PRICE_BOOK_KINDS.map((k) => (
                    <option key={k} value={k}>
                      {k}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className={labelCls}>Service</label>
                <select className={inputCls} value={bookService} onChange={(e) => setBookService(e.target.value)}>
                  {QUOTE_SERVICES.map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className={labelCls}>Unit price (BDT)</label>
                  <input className={inputCls} value={bookPrice} onChange={(e) => setBookPrice(e.target.value)} />
                </div>
                <div>
                  <label className={labelCls}>Discount (bps)</label>
                  <input className={inputCls} value={bookDiscBps} onChange={(e) => setBookDiscBps(e.target.value)} />
                </div>
              </div>
              <div className="flex gap-2">
                <button type="submit" className="px-3 py-1.5 rounded-lg text-[10.5px] font-bold text-white" style={{ background: "linear-gradient(135deg,#F97316,#C2410C)" }}>
                  Save price book
                </button>
                <button type="button" className="px-3 py-1.5 rounded-lg text-[10.5px] font-semibold border border-slate-200" onClick={() => void resolve()}>
                  Resolve price
                </button>
              </div>
              {resolved && <pre className="text-[10px] bg-slate-50 p-2 rounded-lg overflow-auto">{JSON.stringify(resolved, null, 2)}</pre>}
            </form>
          </div>
        </Can>
        {loading ? (
          <div className="flex justify-center py-16">
            <InlineSpinner />
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <section className="bg-white rounded-xl border border-slate-200 p-4">
              <h2 className="text-[12px] font-bold mb-2">Templates</h2>
              <ul className="space-y-2 text-[11px]">
                {templates.map((t) => (
                  <li key={t.id} className="border-b border-slate-50 pb-2">
                    <span className="font-bold">{t.code}</span> {t.name} · {t.serviceType}
                    <div className="text-slate-500">
                      {(t.lines || []).map((l) => (
                        <div key={l.lineNo}>
                          {l.description} — {formatBdt(l.unitPricePoisha)}
                        </div>
                      ))}
                    </div>
                  </li>
                ))}
                {templates.length === 0 && <li className="text-slate-400">No templates.</li>}
              </ul>
            </section>
            <section className="bg-white rounded-xl border border-slate-200 p-4">
              <h2 className="text-[12px] font-bold mb-2">Price books</h2>
              <ul className="space-y-2 text-[11px]">
                {books.map((b) => (
                  <li key={b.id} className="border-b border-slate-50 pb-2 flex justify-between gap-2">
                    <span>
                      <span className="font-bold">{b.code}</span> {b.name} · {b.kind}
                    </span>
                    <span>
                      {formatBdt(b.unitPricePoisha)} · {b.discountBps} bps
                    </span>
                  </li>
                ))}
                {books.length === 0 && <li className="text-slate-400">No price books.</li>}
              </ul>
            </section>
          </div>
        )}
    </PageShell>
  );
}
