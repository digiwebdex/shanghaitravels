import { ReactNode } from "react";

export interface PipelineStage {
  key: string;
  label: string;
  color: string;   // tailwind bg class for dot/header accent
  textColor: string;
}

export interface PipelineCard {
  id: string;
  stage: string;
  title: string;
  subtitle?: string;
  meta?: string;
  badge?: string;
  badgeColor?: string;
}

interface Props<T extends PipelineCard> {
  stages: PipelineStage[];
  cards: T[];
  onCardClick?: (card: T) => void;
  renderExtra?: (card: T) => ReactNode;
  columnWidth?: number;
}

export function PipelineKanban<T extends PipelineCard>({
  stages, cards, onCardClick, renderExtra, columnWidth = 200,
}: Props<T>) {
  return (
    <div className="flex gap-3 overflow-x-auto pb-3 h-full">
      {stages.map(stage => {
        const stageCards = cards.filter(c => c.stage === stage.key);
        return (
          <div key={stage.key} className="flex flex-col flex-shrink-0" style={{ width: columnWidth }}>
            {/* Column header */}
            <div className="flex items-center gap-2 px-2.5 py-2 mb-2">
              <div className={`size-2 rounded-full ${stage.color}`}/>
              <span className="text-[10px] font-bold text-slate-600 uppercase tracking-wide truncate">{stage.label}</span>
              <span className={`ml-auto text-[9px] font-bold px-1.5 py-0.5 rounded-full ${stage.color} bg-opacity-20 ${stage.textColor}`}>
                {stageCards.length}
              </span>
            </div>
            {/* Cards */}
            <div className="flex flex-col gap-2 flex-1">
              {stageCards.map(card => (
                <button
                  key={card.id}
                  onClick={() => onCardClick?.(card)}
                  className="text-left bg-white rounded-xl border border-slate-200 p-3 hover:border-amber-300 hover:shadow-sm transition-all group w-full"
                >
                  <p className="text-[10.5px] font-bold text-slate-800 leading-tight mb-0.5 group-hover:text-amber-700 transition-colors">{card.title}</p>
                  {card.subtitle && <p className="text-[9px] text-slate-500 leading-tight">{card.subtitle}</p>}
                  {card.meta && <p className="text-[9px] text-slate-400 mt-1">{card.meta}</p>}
                  {card.badge && (
                    <span className={`inline-block mt-1.5 text-[8px] font-bold px-1.5 py-0.5 rounded ${card.badgeColor ?? "bg-slate-100 text-slate-500"}`}>
                      {card.badge}
                    </span>
                  )}
                  {renderExtra?.(card as T)}
                </button>
              ))}
              {stageCards.length === 0 && (
                <div className="flex-1 border-2 border-dashed border-slate-100 rounded-xl flex items-center justify-center min-h-[60px]">
                  <p className="text-[9px] text-slate-300">Empty</p>
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
