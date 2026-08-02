import { FormEvent, useCallback, useEffect, useState } from "react";
import { Mail, MessageCircle, Smartphone } from "lucide-react";
import { commsApi, crmApi, type CommMessage, type CommTemplate, type CommThread, type CrmLead } from "@/lib/services";
import { ApiError } from "@/lib/api";
import { Can } from "@/auth/Can";
import { ErrorBanner, SuccessBanner } from "@/components/Feedback";
import { InlineSpinner } from "@/components/FullPageSpinner";
import { CommsModuleNav } from "@/components/comms/CommsModuleNav";
import { PageHeader, PageShell, inputCls, labelCls } from "@/components/enterprise/Page";
import { applyMergeFields, TEMPLATE_CATEGORIES, validateSend, validateTemplate } from "@/lib/comms";

type Channel = "email" | "whatsapp" | "sms";

const META: Record<Channel, { title: string; hint: string; Icon: typeof Mail }> = {
  email: { title: "Email", hint: "Templates, merge fields, send history, and thread view.", Icon: Mail },
  whatsapp: {
    title: "WhatsApp",
    hint: "Conversation history, templates, booking updates, quotations, payment reminders (Wasender-ready adapter).",
    Icon: MessageCircle,
  },
  sms: { title: "SMS", hint: "Templates, OTP, booking notifications, reminders, and delivery history.", Icon: Smartphone },
};

function CommsChannelPage({ channel }: { channel: Channel }) {
  const meta = META[channel];
  const Icon = meta.Icon;
  const [templates, setTemplates] = useState<CommTemplate[]>([]);
  const [threads, setThreads] = useState<CommThread[]>([]);
  const [delivery, setDelivery] = useState<CommMessage[]>([]);
  const [leads, setLeads] = useState<CrmLead[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [ok, setOk] = useState("");
  const [leadId, setLeadId] = useState("");
  const [to, setTo] = useState("");
  const [templateCode, setTemplateCode] = useState("");
  const [preview, setPreview] = useState("");
  const [otp, setOtp] = useState("");
  const [tplCode, setTplCode] = useState("");
  const [tplName, setTplName] = useState("");
  const [tplBody, setTplBody] = useState("");
  const [tplSubject, setTplSubject] = useState("");
  const [tplCategory, setTplCategory] = useState("general");
  const [activeThread, setActiveThread] = useState<CommThread | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [t, th, d, ld] = await Promise.all([
        commsApi.listTemplates({ channel }),
        commsApi.listThreads({ channel }),
        commsApi.listDelivery({ channel }),
        crmApi.listLeads({ limit: 40 }),
      ]);
      setTemplates(t);
      setThreads(th);
      setDelivery(d);
      setLeads(ld.data || []);
      if (!leadId && ld.data?.[0]) setLeadId(ld.data[0].id);
    } catch (e) {
      setError(e instanceof ApiError ? e.message : "Failed to load channel data");
    } finally {
      setLoading(false);
    }
  }, [channel, leadId]);

  useEffect(() => {
    void load();
  }, [load]);

  function pickTemplate(code: string) {
    setTemplateCode(code);
    const t = templates.find((x) => x.code === code);
    if (!t) return;
    const vars: Record<string, string> = {
      customerName: leads.find((l) => l.id === leadId)?.name || "Guest",
      referenceNo: "APP-DEMO",
      serviceType: "visa",
      status: "in_progress",
      quoteNo: "QT-00001",
      totalAmount: "৳5,000.00",
      amount: "৳2,000.00",
      validUntil: "7 days",
      otp: otp || "123456",
      minutes: "5",
      message: "Follow up scheduled",
    };
    setPreview(applyMergeFields(t.body, vars));
    if (channel === "email" && t.subject) setTplSubject(applyMergeFields(t.subject, vars));
  }

  async function send(e: FormEvent) {
    e.preventDefault();
    const bad = validateSend({ channel, to, body: preview, templateCode });
    if (bad) {
      setError(bad);
      return;
    }
    try {
      const r = await commsApi.send({
        channel,
        to: to.trim(),
        relatedType: "lead",
        relatedId: leadId,
        partyKind: "prospect",
        partyLabel: to.trim(),
        templateCode: templateCode || undefined,
        body: preview || undefined,
        subject: channel === "email" ? tplSubject || undefined : undefined,
        vars: {
          customerName: leads.find((l) => l.id === leadId)?.name || "Guest",
          referenceNo: "APP-DEMO",
          otp: otp || "123456",
          minutes: "5",
          message: "Follow up scheduled",
          quoteNo: "QT-00001",
          totalAmount: "৳5,000.00",
          amount: "৳2,000.00",
          validUntil: "7 days",
          serviceType: "visa",
          status: "in_progress",
        },
      });
      setOk(`Sent via ${String(r.delivery.provider || channel)} — status ${r.message.status}`);
      await load();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Send failed");
    }
  }

  async function createTpl(e: FormEvent) {
    e.preventDefault();
    const bad = validateTemplate({ code: tplCode, name: tplName, body: tplBody, channel });
    if (bad) {
      setError(bad);
      return;
    }
    try {
      await commsApi.createTemplate({
        code: tplCode.trim(),
        name: tplName.trim(),
        channel,
        category: tplCategory,
        subject: channel === "email" ? tplSubject : undefined,
        body: tplBody,
        mergeFields: ["customerName", "referenceNo"],
      });
      setOk("Template saved");
      setTplCode("");
      setTplName("");
      setTplBody("");
      await load();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Template create failed");
    }
  }

  return (
    <PageShell wide>
      <PageHeader
        icon={Icon}
        title={meta.title}
        subtitle={meta.hint}
        breadcrumb={[{ label: "Communications", to: "/comms" }, { label: meta.title }]}
      />
      <CommsModuleNav />
        <ErrorBanner message={error} />
        <SuccessBanner message={ok} />
        {loading ? (
          <div className="flex justify-center py-16">
            <InlineSpinner />
          </div>
        ) : (
          <>
            <Can perm="comms:send">
              <form onSubmit={(e) => void send(e)} className="bg-white rounded-xl border border-[var(--border)] p-4 grid grid-cols-1 sm:grid-cols-4 gap-2">
                <div>
                  <label className={labelCls}>Lead</label>
                  <select className={inputCls} value={leadId} onChange={(e) => setLeadId(e.target.value)}>
                    {leads.map((l) => (
                      <option key={l.id} value={l.id}>
                        {l.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className={labelCls}>To *</label>
                  <input
                    className={inputCls}
                    value={to}
                    onChange={(e) => setTo(e.target.value)}
                    placeholder={channel === "email" ? "guest@example.com" : "8801XXXXXXXXX"}
                    required
                  />
                </div>
                <div>
                  <label className={labelCls}>Template</label>
                  <select
                    className={inputCls}
                    value={templateCode}
                    onChange={(e) => pickTemplate(e.target.value)}
                  >
                    <option value="">Select…</option>
                    {templates.map((t) => (
                      <option key={t.id} value={t.code}>
                        {t.code}
                      </option>
                    ))}
                  </select>
                </div>
                {channel === "sms" && (
                  <div>
                    <label className={labelCls}>OTP value</label>
                    <input className={inputCls} value={otp} onChange={(e) => setOtp(e.target.value)} placeholder="123456" />
                  </div>
                )}
                {channel === "email" && (
                  <div className="sm:col-span-4">
                    <label className={labelCls}>Subject</label>
                    <input className={inputCls} value={tplSubject} onChange={(e) => setTplSubject(e.target.value)} />
                  </div>
                )}
                <div className="sm:col-span-4">
                  <label className={labelCls}>Body / preview</label>
                  <textarea className={inputCls} rows={3} value={preview} onChange={(e) => setPreview(e.target.value)} />
                </div>
                <div className="sm:col-span-4">
                  <button type="submit" className="px-3 py-1.5 rounded-lg text-[10.5px] font-bold text-white" style={{ background: "linear-gradient(135deg,#F97316,#C2410C)" }}>
                    Send {channel}
                  </button>
                </div>
              </form>
            </Can>
            <Can perm="comms:manage">
              <form onSubmit={(e) => void createTpl(e)} className="bg-white rounded-xl border border-[var(--border)] p-4 grid grid-cols-1 sm:grid-cols-4 gap-2">
                <div>
                  <label className={labelCls}>New code</label>
                  <input className={inputCls} value={tplCode} onChange={(e) => setTplCode(e.target.value)} />
                </div>
                <div>
                  <label className={labelCls}>Name</label>
                  <input className={inputCls} value={tplName} onChange={(e) => setTplName(e.target.value)} />
                </div>
                <div>
                  <label className={labelCls}>Category</label>
                  <select className={inputCls} value={tplCategory} onChange={(e) => setTplCategory(e.target.value)}>
                    {TEMPLATE_CATEGORIES.map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="sm:col-span-4">
                  <label className={labelCls}>Body (use {"{{mergeFields}}"})</label>
                  <textarea className={inputCls} rows={2} value={tplBody} onChange={(e) => setTplBody(e.target.value)} />
                </div>
                <div className="sm:col-span-4">
                  <button type="submit" className="px-3 py-1.5 rounded-lg text-[10.5px] font-semibold border border-[var(--border)]">
                    Save template
                  </button>
                </div>
              </form>
            </Can>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <section className="bg-white rounded-xl border border-[var(--border)] p-4">
                <h2 className="text-[12px] font-bold mb-2">Threads</h2>
                <ul className="space-y-2 text-[11px]">
                  {threads.map((t) => (
                    <li key={t.id}>
                      <button type="button" className="text-left w-full border-b border-[var(--border)] pb-2" onClick={() => void commsApi.getThread(t.id).then(setActiveThread)}>
                        <span className="font-bold">{t.subject || t.partyLabel || t.id.slice(0, 8)}</span>
                        <span className="text-[var(--muted-foreground)] ml-2">{t.status}</span>
                      </button>
                    </li>
                  ))}
                  {threads.length === 0 && <li className="text-[var(--muted-foreground)]">No threads.</li>}
                </ul>
                {activeThread && (
                  <div className="mt-3 bg-[var(--muted)] rounded-lg p-2 max-h-56 overflow-auto space-y-2">
                    {(activeThread.messages || []).map((m) => (
                      <div key={m.id} className="text-[10.5px]">
                        <span className="font-semibold">{m.direction}</span> · {m.status}
                        <div>{m.body}</div>
                      </div>
                    ))}
                  </div>
                )}
              </section>
              <section className="bg-white rounded-xl border border-[var(--border)] p-4">
                <h2 className="text-[12px] font-bold mb-2">Delivery history</h2>
                <ul className="space-y-2 text-[11px]">
                  {delivery.map((m) => (
                    <li key={m.id} className="border-b border-[var(--border)] pb-2 flex justify-between gap-2">
                      <span>
                        {m.status} · {m.provider || "—"}
                      </span>
                      <span className="text-[var(--muted-foreground)]">{new Date(m.createdAt).toLocaleString("en-BD")}</span>
                    </li>
                  ))}
                  {delivery.length === 0 && <li className="text-[var(--muted-foreground)]">No deliveries.</li>}
                </ul>
              </section>
            </div>
          </>
        )}
    </PageShell>
  );
}

export default CommsChannelPage;
