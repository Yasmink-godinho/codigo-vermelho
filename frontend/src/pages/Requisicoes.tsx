// Tela de Requisições — US04 integrada com a API
import { useState, useEffect } from "react";
import {
  IconActivity, IconAlertTriangle, IconBuilding, IconCheck,
  IconChevronDown, IconClipboard, IconClock, IconPlus, IconX
} from "@/components/icons";
import { STATUS_CFG, URGENCY_CFG, relativeTime } from "@/data/mockData";
import { buscarRequisicoesApi } from "@/data/api";
import type { ReqStatus, ReqUrgency, Requisicao } from "@/types";

export default function RequisicoesScreen({
  requisicoes: initialRequisicoes,
  newReqId,
  onNova
}: {
  requisicoes: Requisicao[];
  newReqId: number | null;
  onNova: () => void;
}) {
  const [filterStatus, setFilterStatus] = useState<ReqStatus | "todas">("todas");
  const [filterUrgency, setFilterUrgency] = useState<ReqUrgency | "todas">("todas");
  const [lista, setLista] = useState<Requisicao[]>(initialRequisicoes);
  const [loading, setLoading] = useState(false);

  // Sincroniza a listagem com filtros da API Spring Boot
  useEffect(() => {
    setLoading(true);
    buscarRequisicoesApi(filterStatus, filterUrgency)
      .then((dados) => {
        if (dados && dados.length > 0) {
          setLista(dados);
        } else {
          // Fallback para os dados locais filtrados
          const local = initialRequisicoes.filter((r) => {
            if (filterStatus !== "todas" && r.status !== filterStatus) return false;
            if (filterUrgency !== "todas" && r.urgency !== filterUrgency) return false;
            return true;
          });
          setLista(local);
        }
      })
      .catch((err) => {
        console.warn("Erro ao buscar requisições na API, aplicando filtro local:", err);
      })
      .finally(() => setLoading(false));
  }, [filterStatus, filterUrgency, initialRequisicoes]);

  // Atualização parcial de status (Aprovar / Recusar) via PATCH na API
  async function handleMudarStatus(id: number, novoStatus: "aprovada" | "negada") {
    try {
      const statusBackend = novoStatus === "aprovada" ? "APROVADA" : "RECUSADA";
      await fetch(`http://localhost:8080/api/v1/requisicoes/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: statusBackend }),
      });
    } catch (err) {
      console.warn("Aviso ao atualizar status no backend:", err);
    }
    setLista((prev) => prev.map((r) => r.id === id ? { ...r, status: novoStatus } : r));
  }

  const btBadge: Record<string, string> = {
    "O-":"bg-[#FFF0F2] text-[#C8102E]","O+":"bg-[#FFF0F2] text-[#C8102E]",
    "A-":"bg-blue-50 text-blue-700","A+":"bg-blue-50 text-blue-700",
    "B-":"bg-violet-50 text-violet-700","B+":"bg-violet-50 text-violet-700",
    "AB-":"bg-amber-50 text-amber-700","AB+":"bg-amber-50 text-amber-700",
  };

  const counts = {
    pendente: lista.filter(r => r.status === "pendente").length,
    em_analise: lista.filter(r => r.status === "em_analise").length,
    aprovada: lista.filter(r => r.status === "aprovada").length,
    emergencia: lista.filter(r => r.urgency === "emergencia").length,
  };

  return (
    <div className="px-8 py-7 space-y-5">
      {/* KPI summary */}
      <div className="grid grid-cols-4 gap-4">
        {[
          { label: "Total de requisições", value: lista.length, sub: "no sistema", icon: <IconClipboard size={18} />, bg: "bg-blue-50 text-blue-600" },
          { label: "Pendentes", value: counts.pendente, sub: "aguardando análise", icon: <IconClock size={18} />, bg: "bg-amber-50 text-amber-600" },
          { label: "Em análise", value: counts.em_analise, sub: "em processamento", icon: <IconActivity size={18} />, bg: "bg-slate-100 text-slate-500" },
          { label: "Emergência", value: counts.emergencia, sub: "prioridade máxima", icon: <IconAlertTriangle size={18} />, bg: "bg-[#FFF0F2] text-[#C8102E]" },
        ].map((k, i) => (
          <div key={i} className="bg-white rounded-xl border border-slate-100 p-5 flex items-center gap-3">
            <div className={`w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 ${k.bg}`}>{k.icon}</div>
            <div>
              <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-widest leading-tight">{k.label}</div>
              <div className="text-[26px] font-bold text-slate-900 leading-tight mt-0.5" style={{ fontFamily: "'JetBrains Mono', monospace" }}>{k.value}</div>
              <div className="text-[11px] text-slate-400">{k.sub}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Toolbar */}
      <div className="flex items-center gap-3 flex-wrap">
        <div className="relative">
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value as ReqStatus | "todas")}
            className="appearance-none pl-3.5 pr-9 py-2 rounded-lg border border-slate-200 text-[13px] text-slate-600 bg-white focus:outline-none focus:ring-2 focus:ring-[#C8102E]/20 cursor-pointer"
          >
            <option value="todas">Status: Todos</option>
            <option value="pendente">Pendente</option>
            <option value="em_analise">Em análise</option>
            <option value="aprovada">Aprovada</option>
            <option value="negada">Negada</option>
          </select>
          <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none"><IconChevronDown size={13} /></span>
        </div>

        <div className="relative">
          <select
            value={filterUrgency}
            onChange={(e) => setFilterUrgency(e.target.value as ReqUrgency | "todas")}
            className="appearance-none pl-3.5 pr-9 py-2 rounded-lg border border-slate-200 text-[13px] text-slate-600 bg-white focus:outline-none focus:ring-2 focus:ring-[#C8102E]/20 cursor-pointer"
          >
            <option value="todas">Urgência: Todas</option>
            <option value="rotina">Rotina</option>
            <option value="prioritaria">Prioritária</option>
            <option value="emergencia">Emergência</option>
          </select>
          <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none"><IconChevronDown size={13} /></span>
        </div>

        <div className="text-[12px] text-slate-400 ml-1">
          <span className="font-semibold text-slate-700">{lista.length}</span> requisição(ões)
        </div>

        <button
          onClick={onNova}
          className="ml-auto flex items-center gap-2 px-4 py-2 rounded-lg bg-[#C8102E] text-white text-[13px] font-semibold hover:bg-[#a00d24] transition-colors"
        >
          <IconPlus size={14} /> Nova Requisição
        </button>
      </div>

      {/* List */}
      {loading ? (
        <div className="bg-white rounded-xl border border-slate-100 py-16 flex flex-col items-center gap-3 text-slate-400">
          <div className="w-6 h-6 border-2 border-[#C8102E] border-t-transparent rounded-full animate-spin"></div>
          <span className="text-[13px]">Atualizando requisições com o servidor...</span>
        </div>
      ) : lista.length === 0 ? (
        <div className="bg-white rounded-xl border border-slate-100 py-20 flex flex-col items-center gap-3 text-slate-400">
          <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center"><IconClipboard size={22} /></div>
          <div className="text-[14px] font-medium text-slate-500">Nenhuma requisição encontrada para este filtro</div>
          <button onClick={onNova} className="flex items-center gap-2 px-4 py-2 rounded-lg bg-[#C8102E] text-white text-[13px] font-semibold hover:bg-[#a00d24] transition-colors mt-2">
            <IconPlus size={14} /> Emitir primeira requisição
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {lista.map((req) => {
            const urgCfg = URGENCY_CFG[req.urgency] ?? URGENCY_CFG.rotina;
            const stCfg  = STATUS_CFG[req.status] ?? STATUS_CFG.pendente;
            const isNew  = req.id === newReqId;
            return (
              <div
                key={req.id}
                className={`bg-white rounded-xl border border-slate-100 border-l-4 ${urgCfg.border} p-5 transition-all ${isNew ? "ring-2 ring-emerald-300/60" : ""}`}
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-start gap-4 flex-1 min-w-0">
                    {/* Blood Type Chip */}
                    <span className={`text-[15px] font-bold px-3 py-1 rounded-full flex-shrink-0 mt-0.5 ${btBadge[req.bloodType]}`}
                      style={{ fontFamily: "'JetBrains Mono', monospace" }}>{req.bloodType}</span>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap mb-1">
                        <span className="text-[13px] font-mono font-bold text-slate-400" style={{ fontFamily: "'JetBrains Mono', monospace" }}>{req.reqCode}</span>
                        <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full flex items-center gap-1.5 ${urgCfg.badge}`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${urgCfg.dot}`}></span>{urgCfg.label}
                        </span>
                        <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full ${stCfg.badge}`}>{stCfg.label}</span>
                        {isNew && <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-emerald-500 text-white animate-pulse">Nova</span>}
                      </div>
                      <div className="text-[14px] font-semibold text-slate-800 mb-0.5">
                        {req.component} — <span style={{ fontFamily: "'JetBrains Mono', monospace" }}>{req.quantity} unid.</span>
                      </div>
                      <div className="flex items-center gap-2 text-[12px] text-slate-500">
                        <IconBuilding size={11} /><span className="truncate">{req.instName}</span>
                        {req.observations && <><span className="text-slate-200">•</span><span className="truncate italic">{req.observations}</span></>}
                      </div>
                    </div>
                  </div>

                  <div className="flex-shrink-0 text-right flex flex-col items-end gap-2">
                    <div className="text-[11px] text-slate-400 flex items-center gap-1"><IconClock size={11} />{relativeTime(req.createdAt)}</div>
                    
                    {/* Ações rápidas para requisições pendentes */}
                    {req.status === "pendente" && (
                      <div className="flex items-center gap-1.5 mt-1">
                        <button
                          onClick={() => handleMudarStatus(req.id, "negada")}
                          className="px-2.5 py-1 text-[11px] font-semibold rounded-md border border-slate-200 text-slate-500 hover:bg-slate-50 flex items-center gap-1"
                        >
                          <IconX size={11} /> Recusar
                        </button>
                        <button
                          onClick={() => handleMudarStatus(req.id, "aprovada")}
                          className="px-2.5 py-1 text-[11px] font-semibold rounded-md bg-emerald-600 text-white hover:bg-emerald-700 flex items-center gap-1"
                        >
                          <IconCheck size={11} /> Aprovar
                        </button>
                      </div>
                    )}
                    {req.status === "aprovada" && (
                      <span className="text-[11px] text-emerald-600 font-medium flex items-center gap-1"><IconCheck size={12} /> Aprovada</span>
                    )}
                    {req.status === "negada" && (
                      <span className="text-[11px] text-slate-400 font-medium flex items-center gap-1"><IconX size={12} /> Negada</span>
                    )}
                    {req.status === "em_analise" && (
                      <span className="text-[11px] text-blue-600 font-medium">Em processamento</span>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}