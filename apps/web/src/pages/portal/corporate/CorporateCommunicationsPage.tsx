import { FormEvent, useEffect, useState } from "react";
import { corporatePortalApi } from "@/lib/corporatePortalApi";
import { ApiError } from "@/lib/api";
import { validateSupport } from "@/lib/corporatePortal";

export default function CorporateCommunicationsPage() {
  const [messages, setMessages] = useState<Record<string, any>[]>([]);
  const [support, setSupport] = useState<Record<string, any>[]>([]);
  const [announcements, setAnnouncements] = useState<Record<string, any>[]>([]);
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");
  const [error, setError] = useState("");
  const [ok, setOk] = useState("");

  async function load() {
    const r = await corporatePortalApi.communications();
    setMessages(r.messages || []);
    setSupport(r.support || []);
    setAnnouncements(r.announcements || []);
  }

  useEffect(() => {
    void load().catch((e) => setError(e instanceof ApiError ? e.message : "Failed"));
  }, []);

  async function submit(e: FormEvent) {
    e.preventDefault();
    const bad = validateSupport({ subject, body });
    if (bad) {
      setError(bad);
      return;
    }
    try {
      await corporatePortalApi.support({ subject, body });
      setOk("Support ticket submitted");
      setSubject("");
      setBody("");
      await load();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Failed");
    }
  }

  return (
    <div className="p-5 max-w-5xl space-y-4">
      <h1 className="text-[16px] font-bold">Communications</h1>
      {error && <p className="text-red-600 text-[11px]">{error}</p>}
      {ok && <p className="text-emerald-700 text-[11px]">{ok}</p>}
      <form onSubmit={submit} className="bg-white border rounded-xl p-4 space-y-2">
        <input className="w-full border rounded-lg px-3 py-2 text-[12px]" placeholder="Subject" value={subject} onChange={(e) => setSubject(e.target.value)} />
        <textarea className="w-full border rounded-lg px-3 py-2 text-[12px]" rows={3} placeholder="Message" value={body} onChange={(e) => setBody(e.target.value)} />
        <button type="submit" className="px-3 py-2 rounded-lg bg-teal-600 text-white text-[11px] font-bold">
          Open support ticket
        </button>
      </form>
      <div className="grid md:grid-cols-3 gap-3">
        <section className="bg-white border rounded-xl p-4">
          <h2 className="text-[12px] font-bold mb-2">Messages</h2>
          <ul className="text-[11px] space-y-2">
            {messages.map((m) => (
              <li key={String(m.id)}>
                <div className="font-semibold">{String(m.subject || m.summary)}</div>
                <div className="text-slate-500">{new Date(String(m.createdAt)).toLocaleString()}</div>
              </li>
            ))}
            {!messages.length && <li className="text-slate-400">No messages</li>}
          </ul>
        </section>
        <section className="bg-white border rounded-xl p-4">
          <h2 className="text-[12px] font-bold mb-2">Support tickets</h2>
          <ul className="text-[11px] space-y-1">
            {support.map((s) => (
              <li key={String(s.id)}>
                {String(s.subject)} · {String(s.status)}
              </li>
            ))}
            {!support.length && <li className="text-slate-400">No tickets</li>}
          </ul>
        </section>
        <section className="bg-white border rounded-xl p-4">
          <h2 className="text-[12px] font-bold mb-2">Announcements</h2>
          <ul className="text-[11px] space-y-2">
            {announcements.map((a) => (
              <li key={String(a.id)}>
                <div className="font-semibold">{String(a.title || a.subject)}</div>
                <div className="text-slate-500">{String(a.body || a.summary || "").slice(0, 80)}</div>
              </li>
            ))}
            {!announcements.length && <li className="text-slate-400">No announcements</li>}
          </ul>
        </section>
      </div>
    </div>
  );
}
