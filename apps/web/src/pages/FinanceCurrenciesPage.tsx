import { FormEvent, useCallback, useEffect, useState } from "react";
import { Coins } from "lucide-react";
import { glApi } from "@/lib/services";
import { ApiError } from "@/lib/api";
import type { CurrencyRow, ExchangeRateRow } from "@/lib/types";
import { Can } from "@/auth/Can";
import { DemoBadge } from "@/components/DemoBadge";
import { EmptyState, ErrorBanner, SuccessBanner } from "@/components/Feedback";
import { InlineSpinner } from "@/components/FullPageSpinner";
import { inputCls, labelCls } from "@/components/cases/formStyles";
import { FinanceModuleNav } from "@/components/finance/FinanceModuleNav";

export default function FinanceCurrenciesPage() {
  const [currencies, setCurrencies] = useState<CurrencyRow[]>([]);
  const [rates, setRates] = useState<ExchangeRateRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [ok, setOk] = useState("");
  const [code, setCode] = useState("");
  const [name, setName] = useState("");
  const [symbol, setSymbol] = useState("");
  const [fromCode, setFromCode] = useState("USD");
  const [toCode, setToCode] = useState("BDT");
  const [rate, setRate] = useState("");
  const [rateDate, setRateDate] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [c, r] = await Promise.all([glApi.listCurrencies(), glApi.listExchangeRates()]);
      setCurrencies(c);
      setRates(r);
    } catch (e) {
      setError(e instanceof ApiError ? e.message : "Failed to load currencies");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  async function createCurrency(e: FormEvent) {
    e.preventDefault();
    try {
      await glApi.createCurrency({ code: code.trim(), name: name.trim(), symbol: symbol.trim() || undefined });
      setOk("Currency created");
      setCode("");
      setName("");
      await load();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Create failed");
    }
  }

  async function createRate(e: FormEvent) {
    e.preventDefault();
    try {
      await glApi.createExchangeRate({
        fromCode,
        toCode,
        rate: Number(rate),
        rateDate: rateDate || new Date().toISOString(),
      });
      setOk("Exchange rate saved");
      setRate("");
      await load();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "FX create failed");
    }
  }

  return (
    <div>
      <DemoBadge moduleKey="finance" />
      <div className="p-5 max-w-[1100px] space-y-4">
        <div>
          <h1 className="text-[16px] font-bold text-slate-800 flex items-center gap-2">
            <Coins size={16} className="text-amber-600" /> Currencies & exchange rates
          </h1>
          <p className="text-[11px] text-slate-500 mt-0.5">Base currency BDT; multi-currency ready for future FX journals.</p>
        </div>
        <FinanceModuleNav />
        <ErrorBanner message={error} />
        <SuccessBanner message={ok} />
        {loading ? (
          <div className="flex justify-center py-12">
            <InlineSpinner />
          </div>
        ) : (
          <>
            <Can perm="fx:manage">
              <form onSubmit={(e) => void createCurrency(e)} className="bg-white rounded-xl border border-slate-200 p-4 grid grid-cols-1 sm:grid-cols-4 gap-2">
                <div className="sm:col-span-4 text-[10px] font-bold text-slate-500 uppercase">Add currency</div>
                <div>
                  <label className={labelCls}>Code *</label>
                  <input className={inputCls} value={code} onChange={(e) => setCode(e.target.value)} required />
                </div>
                <div>
                  <label className={labelCls}>Name *</label>
                  <input className={inputCls} value={name} onChange={(e) => setName(e.target.value)} required />
                </div>
                <div>
                  <label className={labelCls}>Symbol</label>
                  <input className={inputCls} value={symbol} onChange={(e) => setSymbol(e.target.value)} />
                </div>
                <div className="flex items-end">
                  <button type="submit" className="px-3 py-1.5 rounded-lg text-[10.5px] font-bold text-white" style={{ background: "linear-gradient(135deg,#F59E0B,#B45309)" }}>
                    Save
                  </button>
                </div>
              </form>
              <form onSubmit={(e) => void createRate(e)} className="bg-white rounded-xl border border-slate-200 p-4 grid grid-cols-1 sm:grid-cols-5 gap-2">
                <div className="sm:col-span-5 text-[10px] font-bold text-slate-500 uppercase">Add exchange rate</div>
                <div>
                  <label className={labelCls}>From</label>
                  <input className={inputCls} value={fromCode} onChange={(e) => setFromCode(e.target.value.toUpperCase())} />
                </div>
                <div>
                  <label className={labelCls}>To</label>
                  <input className={inputCls} value={toCode} onChange={(e) => setToCode(e.target.value.toUpperCase())} />
                </div>
                <div>
                  <label className={labelCls}>Rate *</label>
                  <input type="number" step="0.0001" min="0" className={inputCls} value={rate} onChange={(e) => setRate(e.target.value)} required />
                </div>
                <div>
                  <label className={labelCls}>Date</label>
                  <input type="date" className={inputCls} value={rateDate} onChange={(e) => setRateDate(e.target.value)} />
                </div>
                <div className="flex items-end">
                  <button type="submit" className="px-3 py-1.5 rounded-lg border border-slate-200 text-[10.5px] font-semibold">
                    Save rate
                  </button>
                </div>
              </form>
            </Can>
            <section className="bg-white rounded-xl border border-slate-200 overflow-hidden">
              <h2 className="text-[12px] font-bold px-4 py-3 border-b border-slate-100">Currencies</h2>
              {currencies.length === 0 ? (
                <EmptyState title="No currencies" hint="Bootstrap foundation to seed BDT." />
              ) : (
                <table className="w-full text-left">
                  <thead>
                    <tr className="text-[10px] uppercase text-slate-400 border-b border-slate-100">
                      <th className="px-4 py-2 font-bold">Code</th>
                      <th className="px-4 py-2 font-bold">Name</th>
                      <th className="px-4 py-2 font-bold">Base</th>
                    </tr>
                  </thead>
                  <tbody>
                    {currencies.map((c) => (
                      <tr key={c.id} className="border-b border-slate-50 text-[11px]">
                        <td className="px-4 py-2.5 font-semibold">{c.code}</td>
                        <td className="px-4 py-2.5">{c.name}</td>
                        <td className="px-4 py-2.5">{c.isBase ? "yes" : "no"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </section>
            <section className="bg-white rounded-xl border border-slate-200 overflow-hidden">
              <h2 className="text-[12px] font-bold px-4 py-3 border-b border-slate-100">Exchange rates</h2>
              {rates.length === 0 ? (
                <p className="text-[11px] text-slate-400 px-4 py-6">No FX rates yet.</p>
              ) : (
                <table className="w-full text-left">
                  <thead>
                    <tr className="text-[10px] uppercase text-slate-400 border-b border-slate-100">
                      <th className="px-4 py-2 font-bold">Pair</th>
                      <th className="px-4 py-2 font-bold">Rate</th>
                      <th className="px-4 py-2 font-bold">Date</th>
                    </tr>
                  </thead>
                  <tbody>
                    {rates.map((r) => (
                      <tr key={r.id} className="border-b border-slate-50 text-[11px]">
                        <td className="px-4 py-2.5 font-semibold">
                          {r.fromCode}/{r.toCode}
                        </td>
                        <td className="px-4 py-2.5">{r.rate ?? Number(r.rateScaled) / 1e8}</td>
                        <td className="px-4 py-2.5">{new Date(r.rateDate).toLocaleDateString("en-BD")}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </section>
          </>
        )}
      </div>
    </div>
  );
}
