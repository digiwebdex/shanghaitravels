import { useState } from "react";
import { ChevronLeft, ChevronRight, MapPin, Clock, FileText } from "lucide-react";
import { EVENTS, CalendarEvent } from "./data";

const TYPE_CFG: Record<string, { label: string; color: string; bg: string; dot: string }> = {
  interview:  { label: "Interview",  color: "text-purple-700", bg: "bg-purple-50 border-purple-200",  dot: "bg-purple-500"  },
  biometric:  { label: "Biometric",  color: "text-blue-700",   bg: "bg-blue-50 border-blue-200",      dot: "bg-blue-500"    },
  meeting:    { label: "Meeting",    color: "text-slate-600",  bg: "bg-slate-50 border-slate-200",    dot: "bg-slate-400"   },
  deadline:   { label: "Deadline",   color: "text-red-700",    bg: "bg-red-50 border-red-200",        dot: "bg-red-500"     },
  call:       { label: "Call",       color: "text-teal-700",   bg: "bg-teal-50 border-teal-200",      dot: "bg-teal-500"    },
};

// Build week days for current week (Jan 9–15 2025)
const WEEK_DATES = ["2025-01-09","2025-01-10","2025-01-11","2025-01-12","2025-01-13","2025-01-14","2025-01-15"];
const DAY_LABELS = ["Thu","Fri","Sat","Sun","Mon","Tue","Wed"];
const DAY_NUMS   = ["9","10","11","12","13","14","15"];

export default function StaffCalendar() {
  const [view, setView] = useState<"week" | "list">("week");
  const [selectedDate, setSelectedDate] = useState("2025-01-09");

  const eventsForDate = (date: string) => EVENTS.filter(e => e.date === date).sort((a,b) => a.time.localeCompare(b.time));
  const selectedEvents = eventsForDate(selectedDate);
  const allEventsOrdered = [...EVENTS].sort((a,b) => `${a.date}${a.time}`.localeCompare(`${b.date}${b.time}`));

  const HOURS = ["08:00","09:00","10:00","11:00","12:00","13:00","14:00","15:00","16:00","17:00","18:00"];

  function eventAtHour(date: string, hour: string) {
    return EVENTS.filter(e => e.date === date && e.time.startsWith(hour.slice(0,2)));
  }

  return (
    <div className="p-5 space-y-4 max-w-[1400px]">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-slate-800 text-[18px] font-bold">Calendar</h1>
          <p className="text-[11px] text-slate-400 mt-0.5">Week of 9–15 January 2025 · {EVENTS.length} events</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex rounded-lg border border-slate-200 overflow-hidden">
            {(["week","list"] as const).map(v => (
              <button key={v} onClick={() => setView(v)}
                className={`px-3 py-1.5 text-[10.5px] font-semibold capitalize transition-colors
                  ${view === v ? "bg-[#1A2332] text-white" : "bg-white text-slate-500 hover:bg-slate-50"}`}
              >
                {v}
              </button>
            ))}
          </div>
          <button className="p-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 text-slate-400">
            <ChevronLeft size={13} />
          </button>
          <button className="p-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 text-slate-400">
            <ChevronRight size={13} />
          </button>
        </div>
      </div>

      {view === "week" ? (
        <div className="grid grid-cols-3 gap-4">
          {/* Week grid */}
          <div className="col-span-2 bg-white rounded-xl border border-slate-200 overflow-hidden">
            {/* Day headers */}
            <div className="grid grid-cols-7 border-b border-slate-100">
              {WEEK_DATES.map((d, i) => (
                <button
                  key={d}
                  onClick={() => setSelectedDate(d)}
                  className={`py-3 flex flex-col items-center transition-colors
                    ${d === selectedDate ? "bg-sky-50" : "hover:bg-slate-50"}
                    ${i < WEEK_DATES.length - 1 ? "border-r border-slate-100" : ""}`}
                >
                  <p className="text-[9px] font-bold text-slate-400 uppercase">{DAY_LABELS[i]}</p>
                  <p className={`text-[14px] font-bold mt-0.5 ${d === selectedDate ? "text-sky-600" : "text-slate-800"}`}>
                    {DAY_NUMS[i]}
                  </p>
                  {/* event dots */}
                  <div className="flex gap-0.5 mt-1">
                    {eventsForDate(d).slice(0,3).map(e => (
                      <span key={e.id} className={`size-1 rounded-full ${TYPE_CFG[e.type]?.dot || "bg-slate-400"}`} />
                    ))}
                  </div>
                </button>
              ))}
            </div>

            {/* Hour rows */}
            <div className="overflow-y-auto" style={{ maxHeight: 460 }}>
              {HOURS.map(h => (
                <div key={h} className="grid grid-cols-7 border-b border-slate-50 min-h-[48px]">
                  {WEEK_DATES.map((d, i) => {
                    const evts = eventAtHour(d, h);
                    return (
                      <div
                        key={d}
                        className={`relative p-1 ${i < WEEK_DATES.length - 1 ? "border-r border-slate-50" : ""}
                          ${d === selectedDate ? "bg-sky-50/30" : ""}`}
                      >
                        {i === 0 && (
                          <span className="absolute -left-10 top-1 text-[8.5px] text-slate-300 font-mono w-9 text-right">{h}</span>
                        )}
                        {evts.map(e => {
                          const cfg = TYPE_CFG[e.type];
                          return (
                            <div key={e.id}
                              className={`text-[8.5px] font-semibold px-1 py-0.5 rounded border truncate mb-0.5 ${cfg.bg} ${cfg.color}`}
                            >
                              {e.title}
                            </div>
                          );
                        })}
                      </div>
                    );
                  })}
                </div>
              ))}
            </div>
          </div>

          {/* Selected day detail */}
          <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
            <div className="px-4 py-3 border-b border-slate-100">
              <p className="text-[12px] font-bold text-slate-800">
                {DAY_LABELS[WEEK_DATES.indexOf(selectedDate)]}, {DAY_NUMS[WEEK_DATES.indexOf(selectedDate)]} Jan
              </p>
              <p className="text-[10px] text-slate-400">{selectedEvents.length} event{selectedEvents.length !== 1 ? "s" : ""}</p>
            </div>
            <div className="divide-y divide-slate-50">
              {selectedEvents.length === 0 ? (
                <div className="flex items-center justify-center h-24">
                  <p className="text-[11px] text-slate-400">No events</p>
                </div>
              ) : selectedEvents.map(e => {
                const cfg = TYPE_CFG[e.type];
                return (
                  <div key={e.id} className="px-4 py-3.5">
                    <div className="flex items-start gap-2 mb-2">
                      <span className={`size-1.5 rounded-full mt-1.5 flex-shrink-0 ${cfg.dot}`} />
                      <p className="text-[11.5px] font-bold text-slate-800 leading-snug">{e.title}</p>
                    </div>
                    <div className="space-y-1 pl-3.5">
                      <div className="flex items-center gap-1.5 text-[10px] text-slate-500">
                        <Clock size={9} className="flex-shrink-0" />
                        {e.time} · {e.duration}
                      </div>
                      <div className="flex items-center gap-1.5 text-[10px] text-slate-500">
                        <MapPin size={9} className="flex-shrink-0" />
                        {e.location}
                      </div>
                      {e.appRef && (
                        <div className="flex items-center gap-1.5 text-[10px]">
                          <FileText size={9} className="text-slate-400 flex-shrink-0" />
                          <span className="font-mono font-bold text-sky-600">{e.appRef}</span>
                          {e.applicant && <span className="text-slate-400">· {e.applicant}</span>}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      ) : (
        /* List view */
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
          <div className="divide-y divide-slate-50">
            {allEventsOrdered.map(e => {
              const cfg = TYPE_CFG[e.type];
              return (
                <div key={e.id} className="flex items-start gap-4 px-5 py-4 hover:bg-slate-50 transition-colors">
                  <div className="w-24 flex-shrink-0 text-right">
                    <p className="text-[10px] font-bold text-slate-700">{e.date.slice(8)} Jan</p>
                    <p className="text-[11px] font-mono text-slate-500">{e.time}</p>
                  </div>
                  <div className={`flex-1 px-3 py-2 rounded-lg border ${cfg.bg}`}>
                    <div className="flex items-start justify-between gap-2">
                      <p className={`text-[12px] font-bold ${cfg.color}`}>{e.title}</p>
                      <span className={`text-[8.5px] font-bold px-1.5 py-0.5 rounded-full ${cfg.bg} ${cfg.color}`}>{cfg.label}</span>
                    </div>
                    <div className="flex items-center gap-3 mt-1 text-[10px] text-slate-500">
                      <span className="flex items-center gap-1"><Clock size={8} />{e.duration}</span>
                      <span className="flex items-center gap-1"><MapPin size={8} />{e.location}</span>
                      {e.appRef && <span className="font-mono font-bold text-sky-600">{e.appRef}</span>}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
