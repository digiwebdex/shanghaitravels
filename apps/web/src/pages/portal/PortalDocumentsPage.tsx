import { FormEvent, useEffect, useState } from "react";
import { customerPortalApi } from "@/lib/portalApi";
import { ApiError } from "@/lib/api";

export default function PortalDocumentsPage() {
  const [rows, setRows] = useState<Record<string, any>[]>([]);
  const [versions, setVersions] = useState<Record<string, any>[]>([]);
  const [error, setError] = useState("");
  const [ok, setOk] = useState("");
  const [category, setCategory] = useState("passport");
  const [file, setFile] = useState<File | null>(null);

  async function load() {
    setRows(await customerPortalApi.documents());
  }

  useEffect(() => {
    void load().catch((e) => setError(e instanceof ApiError ? e.message : "Failed"));
  }, []);

  async function upload(e: FormEvent) {
    e.preventDefault();
    if (!file) {
      setError("Choose a file");
      return;
    }
    const form = new FormData();
    form.append("file", file);
    form.append("category", category);
    try {
      await customerPortalApi.uploadDocument(form);
      setOk("Uploaded");
      setFile(null);
      await load();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Upload failed");
    }
  }

  return (
    <div className="p-5 max-w-5xl space-y-4">
      <h1 className="text-[16px] font-bold">Documents</h1>
      {error && <p className="text-red-600 text-[11px]">{error}</p>}
      {ok && <p className="text-emerald-700 text-[11px]">{ok}</p>}
      <form onSubmit={upload} className="bg-white border rounded-xl p-4 flex flex-wrap gap-3 items-end">
        <div>
          <label className="text-[10px] font-semibold text-slate-500">Category</label>
          <input className="block border rounded-lg px-3 py-2 text-[12px]" value={category} onChange={(e) => setCategory(e.target.value)} />
        </div>
        <div>
          <label className="text-[10px] font-semibold text-slate-500">File</label>
          <input type="file" className="block text-[12px]" onChange={(e) => setFile(e.target.files?.[0] || null)} />
        </div>
        <button type="submit" className="px-3 py-2 rounded-lg bg-amber-600 text-white text-[11px] font-bold">
          Upload
        </button>
      </form>
      <table className="w-full text-[11px] bg-white border rounded-xl overflow-hidden">
        <thead className="bg-slate-50 text-slate-500">
          <tr>
            <th className="text-left p-2">File</th>
            <th className="text-left p-2">Category</th>
            <th className="text-left p-2">Status</th>
            <th className="text-right p-2">Actions</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <tr key={String(r.id)} className="border-t">
              <td className="p-2">{String(r.fileName)}</td>
              <td className="p-2">{String(r.category)}</td>
              <td className="p-2">{String(r.status)}</td>
              <td className="p-2 text-right space-x-2">
                <a className="text-amber-700 underline" href={customerPortalApi.downloadUrl(String(r.id))} target="_blank" rel="noreferrer">
                  Download
                </a>
                <button
                  type="button"
                  className="text-slate-600 underline"
                  onClick={() =>
                    void customerPortalApi.documentVersions(String(r.id)).then(setVersions).catch(() => setVersions([]))
                  }
                >
                  Versions
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      {!!versions.length && (
        <ul className="text-[11px] bg-white border rounded-xl p-3 space-y-1">
          {versions.map((v) => (
            <li key={String(v.id)}>
              v{String(v.version)} · {String(v.fileName)} · {new Date(String(v.createdAt)).toLocaleString()}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
