import { FormEvent, useCallback, useEffect, useState } from "react";
import { Package as PackageIcon } from "lucide-react";
import { Link } from "react-router";
import { packagesApi, suppliersApi } from "@/lib/services";
import { ApiError, listOf } from "@/lib/api";
import type { Supplier } from "@/lib/types";
import type { PackageCategory, PackageMaster } from "@/lib/packages";
import {
  PACKAGE_TYPES,
  PACKAGE_TYPE_LABELS,
  emptyPackageForm,
  packageFormPayload,
  packageToForm,
  parseItineraryDays,
  serializeItineraryDays,
  slugifyPackage,
  validatePackageForm,
  formatPrice,
  displayPricePoisha,
} from "@/lib/packages";
import { Can } from "@/auth/Can";
import { DemoBadge } from "@/components/DemoBadge";
import { EmptyState, ErrorBanner, SuccessBanner } from "@/components/Feedback";
import { InlineSpinner } from "@/components/FullPageSpinner";
import { inputCls, labelCls } from "@/components/cases/formStyles";
import { PackageModuleNav } from "@/components/packages/PackageModuleNav";
import { btnPrimary, btnPrimaryStyle } from "@/components/enterprise/Page";
import { brand } from "@/styles/tokens";

type DayRow = { day: number; title: string; body: string };

type Props = { pricingFocus?: boolean };

export default function PackagesListPage({ pricingFocus = false }: Props) {
  const [rows, setRows] = useState<PackageMaster[]>([]);
  const [categories, setCategories] = useState<PackageCategory[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [q, setQ] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [ok, setOk] = useState("");
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState(emptyPackageForm());
  const [days, setDays] = useState<DayRow[]>([{ day: 1, title: "", body: "" }]);
  const [scheduleAt, setScheduleAt] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const [pkgs, cats, sups] = await Promise.all([
        packagesApi.list({ q: q || undefined, limit: 200 }),
        packagesApi.listCategories({ active: "true" }),
        suppliersApi.list({ limit: 200 }).catch(() => ({ data: [] as Supplier[], total: 0, page: 1, limit: 200 })),
      ]);
      setRows(listOf<PackageMaster>(pkgs));
      setCategories(listOf<PackageCategory>(cats));
      setSuppliers(listOf<Supplier>(sups));
    } catch (e) {
      setError(e instanceof ApiError ? e.message : "Failed to load packages");
    } finally {
      setLoading(false);
    }
  }, [q]);

  useEffect(() => {
    void load();
  }, [load]);

  function resetForm() {
    setEditId(null);
    setForm(emptyPackageForm());
    setDays([{ day: 1, title: "", body: "" }]);
    setScheduleAt("");
  }

  function loadEdit(p: PackageMaster) {
    setEditId(p.id);
    setForm(packageToForm(p));
    setDays(parseItineraryDays(p.itinerary || ""));
    setOk(`Editing ${p.code}`);
  }

  function patchForm<K extends keyof typeof form>(key: K, val: (typeof form)[K]) {
    setForm((f) => ({ ...f, [key]: val }));
  }

  async function save(e: FormEvent) {
    e.preventDefault();
    const bad = validatePackageForm(form);
    if (bad) {
      setError(bad);
      return;
    }
    setError("");
    setOk("");
    const body = {
      ...packageFormPayload(form),
      itinerary: serializeItineraryDays(days) || undefined,
    };
    try {
      if (editId) {
        await packagesApi.update(editId, body);
        setOk("Package updated");
      } else {
        await packagesApi.create(body);
        setOk("Package created");
      }
      resetForm();
      await load();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Save failed");
    }
  }

  async function act(id: string, action: "publish" | "unpublish" | "archive" | "clone" | "schedule") {
    setError("");
    try {
      if (action === "publish") await packagesApi.publish(id);
      else if (action === "unpublish") await packagesApi.unpublish(id);
      else if (action === "archive") await packagesApi.archive(id);
      else if (action === "clone") await packagesApi.clone(id);
      else if (action === "schedule") {
        if (!scheduleAt) {
          setError("Set schedule date/time first");
          return;
        }
        await packagesApi.schedule(id, new Date(scheduleAt).toISOString());
      }
      setOk(`Package ${action}${action.endsWith("e") ? "d" : "ed"}`);
      await load();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Action failed");
    }
  }

  return (
    <div>
      <DemoBadge moduleKey="products" />
      <div className="p-5 max-w-[1200px] space-y-4">
        <div>
          <h1 className="text-[16px] font-bold text-slate-800 flex items-center gap-2">
            <PackageIcon size={16} style={{ color: brand.accent }} />
            {pricingFocus ? "Package pricing" : "Products & packages"}
          </h1>
          <p className="text-[11px] text-slate-500 mt-0.5">
            Package master links optional supplier cost to Supplier Center — website, portals, CRM, and bookings share the same PackageID.
          </p>
        </div>
        <PackageModuleNav />
        <ErrorBanner message={error} />
        <SuccessBanner message={ok} />

        <div className="flex flex-wrap gap-2 items-end">
          <div className="flex-1 min-w-[200px]">
            <label className={labelCls} htmlFor="pkg-q">
              Search
            </label>
            <input id="pkg-q" className={inputCls} value={q} onChange={(e) => setQ(e.target.value)} placeholder="Code, name, destination…" />
          </div>
        </div>

        <Can perm="application:write">
          <form onSubmit={(e) => void save(e)} className="bg-white rounded-xl border border-slate-200 p-4 space-y-3">
            <p className="text-[10px] font-bold text-slate-500 uppercase">
              {editId ? "Edit package" : "Create package"}
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              <div>
                <label className={labelCls}>Code *</label>
                <input className={inputCls} value={form.code} onChange={(e) => patchForm("code", e.target.value)} required />
              </div>
              <div className="sm:col-span-2">
                <label className={labelCls}>Name *</label>
                <input
                  className={inputCls}
                  value={form.name}
                  onChange={(e) => {
                    patchForm("name", e.target.value);
                    if (!form.slug) patchForm("slug", slugifyPackage(e.target.value));
                  }}
                  required
                />
              </div>
              <div>
                <label className={labelCls}>Slug</label>
                <input className={inputCls} value={form.slug} onChange={(e) => patchForm("slug", e.target.value)} />
              </div>
              <div>
                <label className={labelCls}>Category</label>
                <select className={inputCls} value={form.categoryId} onChange={(e) => patchForm("categoryId", e.target.value)}>
                  <option value="">—</option>
                  {categories.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className={labelCls}>Type</label>
                <select className={inputCls} value={form.packageType} onChange={(e) => patchForm("packageType", e.target.value)}>
                  {PACKAGE_TYPES.map((t) => (
                    <option key={t} value={t}>
                      {PACKAGE_TYPE_LABELS[t]}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className={labelCls}>Country</label>
                <input className={inputCls} value={form.country} onChange={(e) => patchForm("country", e.target.value)} />
              </div>
              <div>
                <label className={labelCls}>Destination</label>
                <input className={inputCls} value={form.destination} onChange={(e) => patchForm("destination", e.target.value)} />
              </div>
              <div>
                <label className={labelCls}>Cities (comma-separated)</label>
                <input className={inputCls} value={form.cities} onChange={(e) => patchForm("cities", e.target.value)} />
              </div>
              <div>
                <label className={labelCls}>Days</label>
                <input type="number" min="1" className={inputCls} value={form.durationDays} onChange={(e) => patchForm("durationDays", e.target.value)} />
              </div>
              <div>
                <label className={labelCls}>Nights</label>
                <input type="number" min="0" className={inputCls} value={form.durationNights} onChange={(e) => patchForm("durationNights", e.target.value)} />
              </div>
              <div>
                <label className={labelCls}>Total seats</label>
                <input type="number" min="0" className={inputCls} value={form.totalSeats} onChange={(e) => patchForm("totalSeats", e.target.value)} />
              </div>
            </div>

            <div className={`grid grid-cols-1 sm:grid-cols-3 gap-2 ${pricingFocus ? "ring-2 ring-orange-200 rounded-lg p-2" : ""}`}>
              <div>
                <label className={labelCls}>Supplier</label>
                <select className={inputCls} value={form.supplierId} onChange={(e) => patchForm("supplierId", e.target.value)}>
                  <option value="">— None —</option>
                  {suppliers.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name} ({s.code}){s.type ? ` · ${s.type}` : ""}
                    </option>
                  ))}
                </select>
                <p className="mt-0.5 text-[10px] text-slate-400">
                  From{" "}
                  <Link to="/partners/suppliers" className="font-semibold text-orange-700 hover:underline">
                    Supplier Center
                  </Link>
                </p>
              </div>
              <div>
                <label className={labelCls}>Supplier cost (BDT)</label>
                <input className={inputCls} value={form.supplierCostBdt} onChange={(e) => patchForm("supplierCostBdt", e.target.value)} />
              </div>
              <div>
                <label className={labelCls}>Selling price (BDT)</label>
                <input className={inputCls} value={form.sellingPriceBdt} onChange={(e) => patchForm("sellingPriceBdt", e.target.value)} />
              </div>
              <div>
                <label className={labelCls}>Offer price (BDT)</label>
                <input className={inputCls} value={form.offerPriceBdt} onChange={(e) => patchForm("offerPriceBdt", e.target.value)} />
              </div>
              <div>
                <label className={labelCls}>Agent commission (BDT)</label>
                <input className={inputCls} value={form.agentCommissionBdt} onChange={(e) => patchForm("agentCommissionBdt", e.target.value)} />
              </div>
            </div>

            <div className="flex flex-wrap gap-4 text-[11px]">
              {(
                [
                  ["homeFeatured", "Home featured"],
                  ["popular", "Popular"],
                  ["recommended", "Recommended"],
                  ["agentEnabled", "Agent portal"],
                  ["corporateEnabled", "Corporate portal"],
                ] as const
              ).map(([k, lbl]) => (
                <label key={k} className="inline-flex items-center gap-1.5">
                  <input type="checkbox" checked={form[k]} onChange={(e) => patchForm(k, e.target.checked)} />
                  {lbl}
                </label>
              ))}
            </div>

            {!pricingFocus && (
              <>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  <div>
                    <label className={labelCls}>Cover image URL</label>
                    <input className={inputCls} value={form.coverImageUrl} onChange={(e) => patchForm("coverImageUrl", e.target.value)} />
                  </div>
                  <div>
                    <label className={labelCls}>Hero image URL</label>
                    <input className={inputCls} value={form.heroImageUrl} onChange={(e) => patchForm("heroImageUrl", e.target.value)} />
                  </div>
                  <div>
                    <label className={labelCls}>Tags</label>
                    <input className={inputCls} value={form.tags} onChange={(e) => patchForm("tags", e.target.value)} placeholder="family, honeymoon" />
                  </div>
                </div>
                <div>
                  <label className={labelCls}>Summary</label>
                  <textarea className={inputCls} rows={2} value={form.summary} onChange={(e) => patchForm("summary", e.target.value)} />
                </div>
                <div>
                  <label className={labelCls}>Description</label>
                  <textarea className={inputCls} rows={3} value={form.description} onChange={(e) => patchForm("description", e.target.value)} />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <div>
                    <label className={labelCls}>Inclusions</label>
                    <textarea className={inputCls} rows={2} value={form.inclusions} onChange={(e) => patchForm("inclusions", e.target.value)} />
                  </div>
                  <div>
                    <label className={labelCls}>Exclusions</label>
                    <textarea className={inputCls} rows={2} value={form.exclusions} onChange={(e) => patchForm("exclusions", e.target.value)} />
                  </div>
                </div>
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <p className="text-[10px] font-bold text-slate-500 uppercase">Itinerary</p>
                    <button
                      type="button"
                      className="text-[10px] font-semibold text-orange-700"
                      onClick={() => setDays((d) => [...d, { day: d.length + 1, title: "", body: "" }])}
                    >
                      + Add day
                    </button>
                  </div>
                  <div className="space-y-2">
                    {days.map((d, i) => (
                      <div key={i} className="grid grid-cols-1 sm:grid-cols-4 gap-2 border border-slate-100 rounded-lg p-2">
                        <input
                          className={inputCls}
                          type="number"
                          min="1"
                          value={d.day}
                          onChange={(e) =>
                            setDays((prev) => prev.map((x, j) => (j === i ? { ...x, day: Number(e.target.value) || 1 } : x)))
                          }
                        />
                        <input
                          className={`${inputCls} sm:col-span-3`}
                          placeholder="Title"
                          value={d.title}
                          onChange={(e) =>
                            setDays((prev) => prev.map((x, j) => (j === i ? { ...x, title: e.target.value } : x)))
                          }
                        />
                        <textarea
                          className={`${inputCls} sm:col-span-4`}
                          rows={2}
                          placeholder="Activities"
                          value={d.body}
                          onChange={(e) =>
                            setDays((prev) => prev.map((x, j) => (j === i ? { ...x, body: e.target.value } : x)))
                          }
                        />
                      </div>
                    ))}
                  </div>
                </div>
              </>
            )}

            <div className="flex flex-wrap gap-2">
              <button type="submit" className={btnPrimary} style={btnPrimaryStyle}>
                {editId ? "Update package" : "Create package"}
              </button>
              {editId && (
                <button type="button" onClick={resetForm} className="px-3 py-1.5 rounded-lg border border-slate-200 text-[10.5px] font-semibold">
                  Cancel edit
                </button>
              )}
            </div>
          </form>
        </Can>

        {loading ? (
          <div className="flex justify-center py-16">
            <InlineSpinner />
          </div>
        ) : !rows.length ? (
          <EmptyState title="No packages yet" hint="Create your first package product above." />
        ) : (
          <div className="bg-white border border-slate-200 rounded-xl overflow-x-auto">
            <table className="w-full text-[11px]">
              <thead className="bg-slate-50 text-slate-500">
                <tr>
                  <th className="text-left p-2">Code</th>
                  <th className="text-left p-2">Name</th>
                  <th className="text-left p-2">Supplier</th>
                  <th className="text-left p-2">Status</th>
                  <th className="text-left p-2">Price</th>
                  <th className="text-left p-2">Seats</th>
                  <th className="text-left p-2">Flags</th>
                  <th className="text-left p-2">Actions</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((p) => (
                  <tr key={p.id} className="border-t border-slate-100 hover:bg-slate-50/50">
                    <td className="p-2 font-mono">{p.code}</td>
                    <td className="p-2">{p.name}</td>
                    <td className="p-2">
                      {p.supplier ? (
                        <Link to="/partners/suppliers" className="font-semibold text-orange-700 hover:underline">
                          {p.supplier.name}
                        </Link>
                      ) : (
                        <span className="text-slate-300">—</span>
                      )}
                    </td>
                    <td className="p-2">
                      <span className="px-1.5 py-0.5 rounded bg-slate-100">{p.status}</span>
                    </td>
                    <td className="p-2">{formatPrice(displayPricePoisha(p))}</td>
                    <td className="p-2">{p.seatsAvailable ?? p.totalSeats ?? "—"}</td>
                    <td className="p-2 text-[10px]">
                      {[p.homeFeatured && "home", p.popular && "pop", p.recommended && "rec"].filter(Boolean).join(", ") || "—"}
                    </td>
                    <td className="p-2">
                      <div className="flex flex-wrap gap-1">
                        <button type="button" className="text-orange-700 font-semibold" onClick={() => loadEdit(p)}>
                          Edit
                        </button>
                        <button type="button" className="text-emerald-700" onClick={() => void act(p.id, "publish")}>
                          Publish
                        </button>
                        <button type="button" className="text-slate-600" onClick={() => void act(p.id, "unpublish")}>
                          Unpublish
                        </button>
                        <button type="button" className="text-slate-600" onClick={() => void act(p.id, "archive")}>
                          Archive
                        </button>
                        <button type="button" className="text-blue-700" onClick={() => void act(p.id, "clone")}>
                          Clone
                        </button>
                      </div>
                      <div className="mt-1 flex gap-1 items-center">
                        <input
                          type="datetime-local"
                          className="text-[10px] border rounded px-1 py-0.5"
                          value={scheduleAt}
                          onChange={(e) => setScheduleAt(e.target.value)}
                          aria-label="Schedule publish at"
                        />
                        <button type="button" className="text-violet-700 text-[10px]" onClick={() => void act(p.id, "schedule")}>
                          Schedule
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
