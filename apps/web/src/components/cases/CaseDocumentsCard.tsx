import { useState } from "react";
import { Upload } from "lucide-react";
import { applicationsApi } from "@/lib/services";
import { ApiError, validateUploadFile } from "@/lib/api";
import type { AppDocument } from "@/lib/types";
import { Can } from "@/auth/Can";
import { useAuth } from "@/auth/AuthProvider";
import { DOC_CATEGORIES } from "@/config/checklist";
import { inputCls, labelCls } from "@/components/cases/formStyles";

export function CaseDocumentsCard({
  appId,
  docs,
  onSaved,
  setError,
  setOk,
}: {
  appId: string;
  docs: AppDocument[];
  onSaved: () => Promise<void>;
  setError: (s: string) => void;
  setOk: (s: string) => void;
}) {
  const { can } = useAuth();
  const [category, setCategory] = useState<string>("other");
  const [file, setFile] = useState<File | null>(null);

  async function upload() {
    if (!file) {
      setError("Choose a file");
      return;
    }
    const bad = validateUploadFile(file);
    if (bad) {
      setError(bad);
      return;
    }
    try {
      await applicationsApi.uploadDocument(appId, file, category);
      setFile(null);
      setOk("Document uploaded");
      await onSaved();
    } catch (e) {
      setError(e instanceof ApiError ? e.message : "Upload failed");
    }
  }

  return (
    <section className="bg-white rounded-xl border border-slate-200 p-4">
      <h2 className="text-[12px] font-bold text-slate-800 mb-3">Document collection</h2>
      <Can perm="document:upload">
        <div className="flex flex-wrap gap-2 items-end mb-3">
          <div>
            <label className={labelCls} htmlFor="doc-category">
              Type
            </label>
            <select
              id="doc-category"
              className={inputCls}
              value={category}
              onChange={(e) => setCategory(e.target.value)}
            >
              {DOC_CATEGORIES.map((c) => (
                <option key={c} value={c}>
                  {c.replace(/_/g, " ")}
                </option>
              ))}
            </select>
          </div>
          <div className="flex-1 min-w-[180px]">
            <label className={labelCls} htmlFor="doc-file">
              File (JPG/PNG/WEBP/PDF, ≤15MB)
            </label>
            <input
              id="doc-file"
              type="file"
              accept="image/*,application/pdf"
              onChange={(e) => setFile(e.target.files?.[0] || null)}
              className="text-[11px]"
            />
          </div>
          <button
            type="button"
            onClick={() => void upload()}
            className="flex items-center gap-1 px-3 py-2 rounded-lg text-[10.5px] font-bold text-white"
            style={{ background: "linear-gradient(135deg,#F59E0B,#B45309)" }}
          >
            <Upload size={12} /> Upload
          </button>
        </div>
      </Can>
      {docs.length === 0 ? (
        <p className="text-[11px] text-slate-400">No documents uploaded yet.</p>
      ) : (
        <table className="w-full">
          <thead>
            <tr className="text-left text-[9.5px] uppercase text-slate-400">
              <th className="py-1 font-bold">Type</th>
              <th className="py-1 font-bold">File</th>
              <th className="py-1 font-bold">Status</th>
            </tr>
          </thead>
          <tbody>
            {docs.map((d) => (
              <tr key={d.id} className="text-[11px] border-t border-slate-50">
                <td className="py-2">{(d.category || "").replace(/_/g, " ")}</td>
                <td className="py-2">{d.fileName || "—"}</td>
                <td className="py-2">
                  <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-slate-100">
                    {d.status || "uploaded"}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
      {!can("document:upload") && !can("document:read") && (
        <p className="text-[11px] text-slate-400">No document permission.</p>
      )}
    </section>
  );
}
