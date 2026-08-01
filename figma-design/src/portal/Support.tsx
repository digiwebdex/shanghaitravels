import { useState } from "react";
import { Send, Plus, ChevronRight, Clock, CheckCircle2, AlertCircle, Paperclip, X } from "lucide-react";
import { MOCK_APPLICATIONS } from "./data";
import { OPENING_HOURS } from "../company";

type TicketStatus = "open" | "pending" | "resolved";
interface Ticket {
  id: string; ref: string; subject: string; category: string;
  status: TicketStatus; created: string; lastReply: string;
  appRef?: string;
  messages: { from: "user" | "agent"; name: string; text: string; time: string }[];
}

const TICKETS: Ticket[] = [
  {
    id: "t-001", ref: "SUP-10842", subject: "Salary Certificate rejected — clarification needed",
    category: "Document Issue", status: "open", created: "07 Jan 2025", lastReply: "2h ago", appRef: "TRV-38241",
    messages: [
      { from: "user",  name: "Ahmad Al-Rashidi", text: "Hello, my salary certificate was rejected. I have uploaded a valid original issued by my employer HR department. Can you clarify what was wrong with it?", time: "07 Jan, 10:15" },
      { from: "agent", name: "Sara Ahmed",        text: "Hi Ahmad, thank you for reaching out. I reviewed your uploaded document. The certificate was issued more than 30 days ago, which UKVI requires to be recent. Please obtain a fresh copy dated within the last 30 days and re-upload it. Let me know if you have any questions!", time: "07 Jan, 12:02" },
      { from: "user",  name: "Ahmad Al-Rashidi", text: "Thank you Sara, I understand now. I will request a new one from HR today.", time: "07 Jan, 12:45" },
    ],
  },
  {
    id: "t-002", ref: "SUP-10791", subject: "Inquiry about interview appointment scheduling",
    category: "Application Status", status: "pending", created: "02 Jan 2025", lastReply: "5d ago", appRef: "TRV-38241",
    messages: [
      { from: "user",  name: "Ahmad Al-Rashidi", text: "Will I need to attend an interview for my UK visa application? If so, how far in advance will I be notified?", time: "02 Jan, 09:30" },
      { from: "agent", name: "Khalid Al-Mansouri", text: "Hello Ahmad, for a standard UK visitor visa, an interview is not usually required. However, UKVI may request one at their discretion. If an interview is required, you will receive a notification at least 5 working days before the appointment date. We will also notify you via email and WhatsApp. Your application is currently under standard review.", time: "02 Jan, 14:17" },
    ],
  },
  {
    id: "t-003", ref: "SUP-10654", subject: "Bali package confirmation vouchers",
    category: "Booking", status: "resolved", created: "16 Dec 2024", lastReply: "22d ago", appRef: "TRV-37902",
    messages: [
      { from: "user",  name: "Ahmad Al-Rashidi", text: "Hi, I haven't received the hotel vouchers for my Bali trip starting Jan 5. Can you send them?", time: "16 Dec, 08:00" },
      { from: "agent", name: "Sara Ahmed",        text: "Hi Ahmad! Apologies for the delay. I have sent the hotel vouchers and activity confirmations to your registered email. Please check your spam folder if you don't see them. Let me know if you need anything else!", time: "16 Dec, 09:45" },
      { from: "user",  name: "Ahmad Al-Rashidi", text: "Received! Thank you.", time: "16 Dec, 10:02" },
    ],
  },
];

const STATUS_CFG: Record<TicketStatus, { color: string; bg: string; icon: React.ElementType; label: string }> = {
  open:     { color: "text-[#0369A1]",  bg: "bg-[#E0F2FE]",  icon: AlertCircle,   label: "Open" },
  pending:  { color: "text-orange-700", bg: "bg-orange-100", icon: Clock,         label: "Pending" },
  resolved: { color: "text-green-700",  bg: "bg-green-100",  icon: CheckCircle2,  label: "Resolved" },
};

export default function Support() {
  const [selected, setSelected] = useState<string | null>(TICKETS[0].id);
  const [newMode, setNewMode] = useState(false);
  const [reply, setReply] = useState("");
  const [messages, setMessages] = useState<Record<string, typeof TICKETS[0]["messages"]>>({});
  const [newForm, setNewForm] = useState({ subject: "", category: "", appRef: "", message: "" });

  const ticket = selected ? TICKETS.find(t => t.id === selected) : null;
  const threadMessages = ticket ? [...ticket.messages, ...(messages[ticket.id] ?? [])] : [];

  const sendReply = () => {
    if (!reply.trim() || !selected) return;
    setMessages(m => ({
      ...m,
      [selected]: [...(m[selected] ?? []), { from: "user", name: "Ahmad Al-Rashidi", text: reply, time: "Just now" }],
    }));
    setReply("");
  };

  return (
    <div className="flex h-full overflow-hidden">
      {/* Ticket list */}
      <div className="w-80 flex-shrink-0 border-r border-border bg-card flex flex-col">
        <div className="flex items-center justify-between px-5 py-4 border-b border-border">
          <h2 className="text-foreground font-bold text-sm">Support Tickets</h2>
          <button onClick={() => { setNewMode(true); setSelected(null); }} className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-accent text-white text-xs font-bold hover:bg-orange-600 transition-colors">
            <Plus size={12} /> New
          </button>
        </div>
        <div className="flex-1 overflow-y-auto divide-y divide-border">
          {TICKETS.map(t => {
            const cfg = STATUS_CFG[t.status];
            const Icon = cfg.icon;
            return (
              <button key={t.id} onClick={() => { setSelected(t.id); setNewMode(false); }} className={`w-full text-left px-5 py-4 hover:bg-muted transition-colors ${selected === t.id ? "bg-primary/5 border-l-2 border-l-primary" : ""}`}>
                <div className="flex items-start justify-between gap-2 mb-1">
                  <p className="text-xs font-bold text-foreground leading-snug line-clamp-2">{t.subject}</p>
                  <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full flex-shrink-0 ${cfg.bg} ${cfg.color}`}>{cfg.label}</span>
                </div>
                <p className="text-[10px] text-muted-foreground">{t.ref} {t.appRef ? `· ${t.appRef}` : ""}</p>
                <div className="flex items-center justify-between mt-1.5">
                  <span className="text-[10px] text-muted-foreground">{t.category}</span>
                  <span className="text-[10px] text-muted-foreground">{t.lastReply}</span>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Thread / New ticket */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {newMode ? (
          <div className="flex-1 overflow-y-auto p-8">
            <h2 className="text-foreground font-bold text-lg mb-6">New Support Ticket</h2>
            <div className="max-w-2xl space-y-4">
              <div>
                <label className="block text-xs font-semibold text-foreground mb-1.5 uppercase tracking-wider">Category</label>
                <select className="w-full px-3 py-2.5 text-sm border border-border rounded-lg bg-background appearance-none focus:outline-none" value={newForm.category} onChange={e => setNewForm(f => ({ ...f, category: e.target.value }))}>
                  <option value="">Select category</option>
                  {["Document Issue", "Application Status", "Payment", "Booking", "Visa Enquiry", "Other"].map(c => <option key={c}>{c}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-foreground mb-1.5 uppercase tracking-wider">Related Application (optional)</label>
                <select className="w-full px-3 py-2.5 text-sm border border-border rounded-lg bg-background appearance-none focus:outline-none" value={newForm.appRef} onChange={e => setNewForm(f => ({ ...f, appRef: e.target.value }))}>
                  <option value="">Not application-specific</option>
                  {MOCK_APPLICATIONS.map(a => <option key={a.id} value={a.ref}>{a.ref} — {a.service}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-foreground mb-1.5 uppercase tracking-wider">Subject *</label>
                <input className="w-full px-3 py-2.5 text-sm border border-border rounded-lg bg-background focus:outline-none focus:border-primary transition-colors" placeholder="Brief description of your issue" value={newForm.subject} onChange={e => setNewForm(f => ({ ...f, subject: e.target.value }))} />
              </div>
              <div>
                <label className="block text-xs font-semibold text-foreground mb-1.5 uppercase tracking-wider">Message *</label>
                <textarea className="w-full px-3 py-2.5 text-sm border border-border rounded-lg bg-background focus:outline-none focus:border-primary transition-colors resize-none" rows={6} placeholder="Describe your issue in detail…" value={newForm.message} onChange={e => setNewForm(f => ({ ...f, message: e.target.value }))} />
              </div>
              <div className="flex gap-3">
                <button onClick={() => setNewMode(false)} className="px-5 py-2.5 rounded-lg border border-border text-sm font-semibold text-foreground hover:bg-muted transition-colors">Cancel</button>
                <button disabled={!newForm.subject || !newForm.message} className="flex items-center gap-2 px-6 py-2.5 rounded-lg bg-accent text-white text-sm font-bold hover:bg-orange-600 transition-colors disabled:opacity-40">
                  <Send size={13} /> Submit Ticket
                </button>
              </div>
            </div>
          </div>
        ) : ticket ? (
          <>
            {/* Thread header */}
            <div className="flex items-center justify-between px-7 py-4 border-b border-border bg-card flex-shrink-0">
              <div>
                <p className="text-foreground font-bold text-sm">{ticket.subject}</p>
                <div className="flex items-center gap-2 mt-0.5">
                  <p className="text-[10px] text-muted-foreground">{ticket.ref}</p>
                  {ticket.appRef && <><span className="text-muted-foreground/40">·</span><p className="text-[10px] text-muted-foreground">{ticket.appRef}</p></>}
                  <span className="text-muted-foreground/40">·</span>
                  <p className="text-[10px] text-muted-foreground">{ticket.category}</p>
                </div>
              </div>
              <div className={`flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full ${STATUS_CFG[ticket.status].bg} ${STATUS_CFG[ticket.status].color}`}>
                {(() => { const Icon = STATUS_CFG[ticket.status].icon; return <Icon size={11} />; })()}
                {STATUS_CFG[ticket.status].label}
              </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-7 space-y-5">
              {threadMessages.map((msg, i) => (
                <div key={i} className={`flex gap-3 ${msg.from === "user" ? "flex-row-reverse" : ""}`}>
                  <div className={`size-8 rounded-full flex items-center justify-center flex-shrink-0 text-xs font-bold ${msg.from === "agent" ? "bg-primary text-white" : "bg-accent text-white"}`}>
                    {msg.name[0]}
                  </div>
                  <div className={`max-w-lg ${msg.from === "user" ? "items-end" : "items-start"} flex flex-col`}>
                    <div className="flex items-center gap-2 mb-1">
                      <p className="text-xs font-semibold text-foreground">{msg.name}</p>
                      {msg.from === "agent" && <span className="text-[9px] px-1.5 py-0.5 bg-primary/10 text-primary rounded font-bold">TravelOS</span>}
                      <p className="text-[10px] text-muted-foreground">{msg.time}</p>
                    </div>
                    <div className={`px-4 py-3 rounded-xl text-sm leading-relaxed ${msg.from === "agent" ? "bg-card border border-border text-foreground" : "bg-primary text-white"}`}>
                      {msg.text}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Reply box */}
            {ticket.status !== "resolved" && (
              <div className="border-t border-border px-7 py-4 bg-card flex-shrink-0">
                <div className="flex gap-3">
                  <div className="flex-1 relative">
                    <textarea value={reply} onChange={e => setReply(e.target.value)} onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendReply(); } }} className="w-full px-4 py-3 text-sm border border-border rounded-xl bg-background focus:outline-none focus:border-primary transition-colors resize-none placeholder:text-muted-foreground" rows={2} placeholder="Write a reply… (Enter to send)" />
                    <button className="absolute right-3 bottom-3 p-1.5 rounded-lg text-muted-foreground hover:bg-muted transition-colors"><Paperclip size={13} /></button>
                  </div>
                  <button onClick={sendReply} disabled={!reply.trim()} className="px-4 rounded-xl bg-accent text-white hover:bg-orange-600 transition-colors disabled:opacity-40 flex items-center">
                    <Send size={15} />
                  </button>
                </div>
                <p className="text-[10px] text-muted-foreground mt-2">Typical response time: 2 hours during business hours · {OPENING_HOURS}</p>
              </div>
            )}
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center text-center px-8">
            <div>
              <div className="size-16 rounded-2xl bg-muted flex items-center justify-center mx-auto mb-4"><AlertCircle size={28} className="text-muted-foreground" /></div>
              <p className="text-foreground font-semibold mb-1">Select a ticket</p>
              <p className="text-xs text-muted-foreground mb-5">Choose a ticket from the list, or create a new one.</p>
              <button onClick={() => setNewMode(true)} className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-accent text-white text-sm font-bold hover:bg-orange-600 transition-colors mx-auto"><Plus size={14} /> New Ticket</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
