// Tela de Fila FEFO — US03 integrada com a API
import { useState, useEffect } from "react";
import {
  IconActivity, IconAlertTriangle, IconArrowRight, IconBuilding, IconCheck,
  IconChevronDown, IconClock, IconDroplet, IconList, IconShield, IconThermometer
} from "@/components/icons";
import { LOTE_BLOOD_TYPES, daysUntil } from "@/data/mockData";
import { buscarFilaFefoApi } from "@/data/api";
import type { Institution, Lote } from "@/types";

export default function FefoScreen({
  lotes: initialLotes,
  institutions
}: {
  lotes: Lote[];
  institutions: Institution[];
}) {
  const [filterBt, setFilterBt] = useState<string>("Todos");
  const [filterInst, setFilterInst] = useState<number | "todas">("todas");
  const [prioritized, setPrioritized] = useState<Set<number>>(new Set());
  const [queue, setQueue] = useState<Lote[]>(initialLotes);
  const [loading, setLoading] = useState(false);

  // Consulta o endpoint /api/v1/lotes/fila-fefo no Spring Boot
  useEffect(() => {
    setLoading(true);
    const instIdParam = filterInst === "todas" ? undefined : Number(filterInst);
    
    buscarFilaFefoApi(filterBt, instIdParam)
      .then((dados) => {
        if (dados && dados.length > 0) {
          setQueue(dados);
        } else {
          // Fallback para os lotes locais filtrados caso o banco esteja vazio
          const localFiltered = initialLotes
            .filter((l) => {
              const d = daysUntil(l.expiryDate);
              if (d < 0) return false;
              if (filterBt !== "Todos" && l.bloodType !== filterBt) return false;
              if (filterInst !== "todas" && l.instId !== filterInst) return false;
              return true;
            })
            .sort((a, b) => a.expiryDate.localeCompare(b.expiryDate));
          setQueue(localFiltered);
        }
      })
      .catch((err) => {
        console.warn("Erro ao buscar fila FEFO na API, aplicando filtro local:", err);
      })
      .finally(() => setLoading(false));
  }, [filterBt, filterInst, initialLotes]);

  const critical = queue.filter((l) => daysUntil(l.expiryDate) <= 3).length;
  const nextExpiry = queue[0] ? daysUntil(queue[0].expiryDate) : null;

  function urgencyCfg(days: number) {
    if (days <= 3) return { label: "Vencimento crítico", badge: "bg-[#FFF0F2] text-[#C8102E]", dot: "bg-[#C8102E]", border: "border-l-[#C8102E]" };
    if (days <= 7) return { label: "Atenção",            badge: "bg-amber-50 text-amber-700",  dot: "bg-amber-400",  border: "border-l-amber-400" };
    return              { label: "Normal",             badge: "bg-emerald-50 text-emerald-700", dot: "bg-emerald-400", border: "border-l-emerald-500" };
  }

  const btBadge: Record<string, string> = {
    "O-":"bg-[#FFF0F2] text-[#C8102E]","O+":"bg-[#FFF0F2] text-[#C8102E]",
    "A-":"bg-blue-50 text-blue-700","A+":"bg-blue-50 text-blue-700",
    "B-":"bg-violet-50 text-violet-700","B+":"bg-violet-50 text-violet-700",
    "AB-":"bg-amber-50 text-amber-700","AB+":"bg-amber-50 text-amber-700",
  };

  const compIcon: Record<string, React.ReactNode> = {
    "Concentrado de Hemácias": <IconDroplet size={13} />,
    "Plasma": <IconActivity size={13} />,
    "Plaquetas": <IconThermometer size={13} />,
    "Crioprecipitado": <IconShield size={13} />,
  };

  return (
    <div className="px-8 py-7 space-y-5">
      {/* Selectors */}
      <div className="flex items-center gap-3 flex-wrap">
        <label className="text-[11px] font-semibold text-slate-400 uppercase tracking-widest">Filtrar por</label>
        
        {/* Blood type */}
        <div className="relative">
          <select
            value={filterBt}
            onChange={(e) => setFilterBt(e.target.value)}
            className="appearance-none pl-3.5 pr-9 py-2 rounded-lg border border-slate-200 text-[13px] font-medium text-slate-700 bg-white focus:outline-none focus:ring-2 focus:ring-[#C8102E]/20 focus:border-[#C8102E]/50 cursor-pointer"
            style={{ fontFamily: filterBt !== "Todos" ? "'JetBrains Mono', monospace" : undefined }}
          >
            <option value="Todos">Tipo: Todos</option>
            {LOTE_BLOOD_TYPES.map((bt) => <option key={bt} value={bt}>{bt}</option>)}
          </select>
          <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none"><IconChevronDown size={13} /></span>
        </div>

        {/* Institution */}
        <div className="relative">
          <select
            value={filterInst === "todas" ? "todas" : String(filterInst)}
            onChange={(e) => setFilterInst(e.target.value === "todas" ? "todas" : Number(e.target.value))}
            className="appearance-none pl-3.5 pr-9 py-2 rounded-lg border border-slate-200 text-[13px] text-slate-700 bg-white focus:outline-none focus:ring-2 focus:ring-[#C8102E]/20 focus:border-[#C8102E]/50 cursor-pointer"
          >
            <option value="todas">Instituição: Todas</option>
            {institutions.map((i) => <option key={i.id} value={String(i.id)}>{i.name}</option>)}
          </select>
          <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none"><IconChevronDown size={13} /></span>
        </div>

        <div className="ml-auto text-[12px] text-slate-400 flex items-center gap-1.5">
          <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></div>
          Ordenação FEFO — primeiro a vencer, primeiro a sair
        </div>
      </div>

      {/* KPI cards */}
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-white rounded-xl border border-slate-100 p-5 flex items-center gap-4">
          <div className="w-10 h-10 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center flex-shrink-0"><IconList size={18} /></div>
          <div>
            <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-widest">Total na fila</div>
            <div className="text-[28px] font-bold text-slate-900 leading-tight mt-0.5" style={{ fontFamily: "'JetBrains Mono', monospace" }}>{queue.length}</div>
            <div className="text-[11px] text-slate-400">bolsas disponíveis</div>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-slate-100 p-5 flex items-center gap-4">
          <div className="w-10 h-10 rounded-lg bg-[#FFF0F2] text-[#C8102E] flex items-center justify-center flex-shrink-0"><IconAlertTriangle size={18} /></div>
          <div>
            <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-widest">Vencimento crítico</div>
            <div className={`text-[28px] font-bold leading-tight mt-0.5 ${critical > 0 ? "text-[#C8102E]" : "text-slate-900"}`} style={{ fontFamily: "'JetBrains Mono', monospace" }}>{critical}</div>
            <div className="text-[11px] text-slate-400">bolsas com ≤ 3 dias</div>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-slate-100 p-5 flex items-center gap-4">
          <div className="w-10 h-10 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center flex-shrink-0"><IconClock size={18} /></div>
          <div>
            <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-widest">Próximo vencimento</div>
            {nextExpiry !== null ? (
              <>
                <div className={`text-[28px] font-bold leading-tight mt-0.5 ${nextExpiry <= 3 ? "text-[#C8102E]" : nextExpiry <= 7 ? "text-amber-600" : "text-slate-900"}`} style={{ fontFamily: "'JetBrains Mono', monospace" }}>{nextExpiry}d</div>
                <div className="text-[11px] text-slate-400">lote {queue[0]?.lotCode}</div>
              </>
            ) : (
              <div className="text-[13px] text-slate-400 mt-1">Sem bolsas</div>
            )}
          </div>
        </div>
      </div>

      {/* Queue List */}
      {loading ? (
        <div className="bg-white rounded-xl border border-slate-100 py-16 flex flex-col items-center gap-3 text-slate-400">
          <div className="w-6 h-6 border-2 border-[#C8102E] border-t-transparent rounded-full animate-spin"></div>
          <span className="text-[13px]">Atualizando Fila FEFO via API...</span>
        </div>
      ) : queue.length === 0 ? (
        <div className="bg-white rounded-xl border border-slate-100 py-20 flex flex-col items-center gap-3 text-slate-400">
          <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center"><IconDroplet size={22} /></div>
          <div className="text-[14px] font-medium text-slate-500">Nenhuma bolsa disponível para este filtro</div>
          <div className="text-[12.5px] text-slate-400">Ajuste os filtros de tipo sanguíneo ou instituição</div>
        </div>
      ) : (
        <div className="space-y-3">
          <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-widest">
            {queue.length} bolsa{queue.length !== 1 ? "s" : ""} — ordenadas por data de vencimento
          </div>
          {queue.map((lote, rank) => {
            const days = daysUntil(lote.expiryDate);
            const urg = urgencyCfg(days);
            const done = prioritized.has(lote.id);
            return (
              <div
                key={lote.id}
                className={`bg-white rounded-xl border border-slate-100 border-l-4 ${urg.border} flex items-center gap-0 overflow-hidden transition-all ${done ? "opacity-60" : ""}`}
              >
                {/* Rank */}
                <div className="w-12 flex-shrink-0 flex items-center justify-center text-[11px] font-bold text-slate-300 border-r border-slate-100 self-stretch bg-slate-50">
                  #{rank + 1}
                </div>

                <div className="flex-1 px-5 py-4 flex items-center gap-5 min-w-0">
                  {/* Blood Type Chip */}
                  <span className={`text-[14px] font-bold px-3 py-1 rounded-full flex-shrink-0 ${btBadge[lote.bloodType]}`} style={{ fontFamily: "'JetBrains Mono', monospace" }}>
                    {lote.bloodType}
                  </span>

                  {/* Main Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                      <span className="text-[13.5px] font-semibold text-slate-800" style={{ fontFamily: "'JetBrains Mono', monospace" }}>{lote.lotCode}</span>
                      <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full flex items-center gap-1.5 ${urg.badge}`}>
                        <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${urg.dot}`}></span>
                        {urg.label}
                      </span>
                      {done && <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 flex items-center gap-1"><IconCheck size={10} /> Priorizado</span>}
                    </div>
                    <div className="flex items-center gap-3 text-[12px] text-slate-500">
                      <span className="flex items-center gap-1"><span className="text-slate-300">{compIcon[lote.component]}</span>{lote.component}</span>
                      <span className="text-slate-200">•</span>
                      <span className="flex items-center gap-1"><IconBuilding size={11} />{lote.instName}</span>
                    </div>
                  </div>

                  {/* Expiry */}
                  <div className="flex-shrink-0 text-right">
                    <div className={`text-[22px] font-bold leading-tight ${days <= 3 ? "text-[#C8102E]" : days <= 7 ? "text-amber-600" : "text-emerald-600"}`} style={{ fontFamily: "'JetBrains Mono', monospace" }}>
                      {days}d
                    </div>
                    <div className="text-[11px] text-slate-400">{lote.expiryDate}</div>
                    <div className="text-[10px] text-slate-300 mt-0.5">{lote.quantity} un. disponíveis</div>
                  </div>

                  {/* Action */}
                  <button
                    onClick={() => setPrioritized((prev) => { const s = new Set(prev); done ? s.delete(lote.id) : s.add(lote.id); return s; })}
                    className={`flex-shrink-0 flex items-center gap-1.5 px-4 py-2 rounded-lg text-[12.5px] font-semibold border-2 transition-all ${
                      done
                        ? "border-emerald-300 bg-emerald-50 text-emerald-700 hover:bg-emerald-100"
                        : "border-[#C8102E]/40 text-[#C8102E] hover:bg-[#FFF0F2] hover:border-[#C8102E]"
                    }`}
                  >
                    {done ? <><IconCheck size={13} /> Priorizado</> : <><IconArrowRight size={13} /> Priorizar uso</>}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}