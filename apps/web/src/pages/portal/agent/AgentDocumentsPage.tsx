import { FormEvent, useEffect, useState } from "react";
import { agentPortalApi } from "@/lib/agentPortalApi";
import { ApiError, validateUploadFile } from "@/lib/api";

export default function AgentDocumentsPage() {
  const [rows, setRows] = useState<Record<string, any>[]>([]);
  const [cases, setCases] = useState<Record<string, any>[]>([]);
  const [applicationId, setApplicationId] = useState("");
  const [category, setCategory] = useState("passport");
  const [file, setFile] = useState<File | null>(null);
  const [error, setError] = useState("");
  const [ok, setOk] = useState("");

  async function load() {
    const [docs, bookings] = await Promise.all([agentPortalApi.documents(), agentPortalApi.cases()]);
    setRows(docs);
    setCases(bookings);
    if (!applicationId && bookings[0]) setApplicationId(String(bookings[0].id));
  }

  useEffect(() => {
    void Promise.all([agentPortalApi.documents(), agentPortalApi.cases()])
      .then(([docs, bookings]) => {
        setRows(docs);
        setCases(bookings);
        setApplicationId((prev) => prev || (bookings[0] ? String(bookings[0].id) : ""));
      })
      .catch((e) => setError(e instanceof ApiError ? e.message : "Failed"));
  }, []);

  async function upload(e: FormEvent) {
    e.preventDefault();
    if (!file || !applicationId) {
      setError("Choose booking and file");
      return;
    }
    const invalid = validateUploadFile(file);
    if (invalid) {
      setError(invalid);
      return;
    }
    const form = new FormData();
    form.append("file", file);
    form.append("applicationId", applicationId);
    form.append("category", category);
    try {
      await agentPortalApi.uploadDocument(form);
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
        <select className="border rounded-lg px-3 py-2 text-[12px]" value={applicationId} onChange={(e) => setApplicationId(e.target.value)}>
          {cases.map((c) => (
            <option key={String(c.id)} value={String(c.id)}>
              {String(c.referenceNo)}
            </option>
          ))}
        </select>
        <input className="border rounded-lg px-3 py-2 text-[12px]" value={category} onChange={(e) => setCategory(e.target.value)} />
        <input
          type="file"
          accept=".jpg,.jpeg,.png,.webp,.pdf,image/jpeg,image/png,image/webp,application/pdf"
          className="text-[12px]"
          onChange={(e) => setFile(e.target.files?.[0] || null)}
        />
        <button type="submit" className="px-3 py-2 rounded-lg bg-amber-600 text-white text-[11px] font-bold">
          Upload
        </button>
      </form>
      <ul className="bg-white border rounded-xl divide-y text-[11px]">
        {rows.map((r) => (
          <li key={String(r.id)} className="p-3 flex justify-between">
            <span>
              {String(r.fileName)} · {String(r.category)} · {String(r.status)}
            </span>
            <a className="text-amber-700 underline" href={agentPortalApi.downloadUrl(String(r.id))} target="_blank" rel="noreferrer">
              Download
            </a>
          </li>
        ))}
      </ul>
    </div>
  );
}
