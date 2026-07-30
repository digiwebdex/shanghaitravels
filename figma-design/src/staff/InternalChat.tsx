import { useState, useRef, useEffect } from "react";
import { Send, Users, Hash } from "lucide-react";
import { THREADS, MESSAGES, STAFF, ME, ChatMessage } from "./data";

export default function InternalChat() {
  const [activeThread, setActiveThread] = useState(THREADS[0].id);
  const [messages, setMessages] = useState(MESSAGES);
  const [draft, setDraft]       = useState("");
  const bottomRef = useRef<HTMLDivElement>(null);

  const thread     = THREADS.find(t => t.id === activeThread)!;
  const threadMsgs = messages[activeThread] || [];

  function getStaff(id: string) {
    return STAFF.find(s => s.id === id);
  }

  function send() {
    if (!draft.trim()) return;
    const msg: ChatMessage = {
      id: `msg-${Date.now()}`, threadId: activeThread, from: ME.id,
      text: draft.trim(), at: "09 Jan 15:00", me: true,
    };
    setMessages(m => ({ ...m, [activeThread]: [...(m[activeThread] || []), msg] }));
    setDraft("");
  }

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [threadMsgs.length]);

  return (
    <div className="flex h-full overflow-hidden">
      {/* Thread list */}
      <div className="w-56 flex-shrink-0 border-r border-slate-200 bg-white flex flex-col overflow-hidden">
        <div className="px-3 py-3 border-b border-slate-100">
          <p className="text-[11px] font-bold text-slate-800">Internal Chat</p>
        </div>
        <div className="flex-1 overflow-y-auto divide-y divide-slate-50">
          {THREADS.map(t => {
            const isGroup = t.type === "group";
            return (
              <button
                key={t.id}
                onClick={() => setActiveThread(t.id)}
                className={`w-full text-left px-3 py-2.5 hover:bg-slate-50 transition-colors
                  ${activeThread === t.id ? "bg-sky-50 border-l-2 border-sky-400" : "border-l-2 border-transparent"}`}
              >
                <div className="flex items-start gap-2">
                  <div className={`size-7 rounded-full flex items-center justify-center flex-shrink-0 text-[9px] font-black
                    ${isGroup ? "bg-violet-100 text-violet-600" : "bg-sky-100 text-sky-700"}`}>
                    {isGroup ? <Users size={11} /> : t.title.split(" ").map(n => n[0]).join("").slice(0,2)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <p className="text-[11px] font-semibold text-slate-800 truncate">{t.title}</p>
                      {t.unread > 0 && (
                        <span className="size-4 rounded-full bg-sky-500 text-white text-[8px] font-bold flex items-center justify-center flex-shrink-0">
                          {t.unread}
                        </span>
                      )}
                    </div>
                    <p className="text-[9.5px] text-slate-400 truncate mt-0.5">{t.lastMessage}</p>
                    <p className="text-[8.5px] text-slate-300 mt-0.5">{t.lastAt}</p>
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Chat area */}
      <div className="flex-1 flex flex-col bg-slate-50 overflow-hidden">
        {/* Thread header */}
        <div className="flex items-center gap-3 px-4 py-2.5 bg-white border-b border-slate-200 flex-shrink-0">
          <div className={`size-7 rounded-full flex items-center justify-center text-[9px] font-black
            ${thread.type === "group" ? "bg-violet-100 text-violet-600" : "bg-sky-100 text-sky-700"}`}>
            {thread.type === "group" ? <Users size={11} /> : thread.title.split(" ").map(n => n[0]).join("").slice(0,2)}
          </div>
          <div>
            <p className="text-[11.5px] font-bold text-slate-800">{thread.title}</p>
            <p className="text-[9.5px] text-slate-400">
              {thread.type === "group"
                ? `${thread.participants.length} members`
                : getStaff(thread.participants.find(p => p !== ME.id) || "")?.role || ""}
            </p>
          </div>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3">
          {threadMsgs.map(msg => {
            const sender = getStaff(msg.from);
            return (
              <div key={msg.id} className={`flex gap-2 ${msg.me ? "flex-row-reverse" : ""}`}>
                {!msg.me && (
                  <div className="size-6 rounded-full bg-slate-200 text-slate-600 text-[8px] font-black flex items-center justify-center flex-shrink-0 mt-0.5">
                    {sender?.avatar || "??"}
                  </div>
                )}
                <div className={`max-w-[75%] ${msg.me ? "items-end" : "items-start"} flex flex-col gap-0.5`}>
                  {!msg.me && (
                    <p className="text-[9px] font-bold text-slate-500 ml-1">{sender?.name}</p>
                  )}
                  <div className={`px-3 py-2 rounded-xl text-[11.5px] leading-relaxed
                    ${msg.me
                      ? "bg-sky-500 text-white rounded-tr-sm"
                      : "bg-white text-slate-800 border border-slate-200 rounded-tl-sm"}`}
                  >
                    {msg.text}
                  </div>
                  <p className="text-[8.5px] text-slate-400 mx-1">{msg.at}</p>
                </div>
              </div>
            );
          })}
          <div ref={bottomRef} />
        </div>

        {/* Composer */}
        <div className="flex items-end gap-2 px-4 py-3 bg-white border-t border-slate-200 flex-shrink-0">
          <div className="flex-1 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 min-h-[40px] flex items-center">
            <textarea
              rows={1}
              placeholder="Write a message…"
              value={draft}
              onChange={e => setDraft(e.target.value)}
              onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send(); } }}
              className="w-full bg-transparent text-[11.5px] text-slate-800 placeholder:text-slate-400 resize-none focus:outline-none"
            />
          </div>
          <button
            onClick={send}
            disabled={!draft.trim()}
            className="size-9 rounded-xl bg-sky-500 text-white flex items-center justify-center hover:bg-sky-600 transition-colors disabled:opacity-40 flex-shrink-0"
          >
            <Send size={13} />
          </button>
        </div>
      </div>
    </div>
  );
}
