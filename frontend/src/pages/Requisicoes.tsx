import { useState, useEffect, useMemo } from "react";
import {
  IconActivity, IconAlertTriangle, IconBuilding, IconCheck,
  IconChevronDown, IconClipboard, IconClock, IconPlus, IconX
} from "@/components/icons";
import { STATUS_CFG, URGENCY_CFG, relativeTime } from "@/data/mockData";
import { buscarRequisicoesApi, atualizarStatusRequisicaoApi } from "@/data/api";
import type { ReqStatus, ReqUrgency, Requisicao } from "@/types";

export default function RequisicoesScreen({
                                            requisicoes: initialRequisicoes,
                                            newReqId,
                                            onNova,
                                          }: {
  requisicoes: Requisicao[];
  newReqId: number | null;
  onNova: () => void;
}) {
  const [filterStatus, setFilterStatus] = useState<ReqStatus | "todas">("todas");
  const [filterUrgency, setFilterUrgency] = useState<ReqUrgency | "todas">("todas");

  // Lista oficial exibida na tela
  const [listaRequisicoes, setListaRequisicoes] = useState<Requisicao[]>([]);
  const [loading, setLoading] = useState(true);

  // Busca na API. Se o backend estiver ativo, usa 100% o backend.
  // O mock (initialRequisicoes) só entra em ação se a requisição falhar (backend desligado).
  useEffect(() => {
    let ativo = true;
    setLoading(true);

    buscarRequisicoesApi()
        .then((dadosBackend) => {
          if (!ativo) return;
          // Backend respondeu com sucesso: usa apenas os dados do banco
          setListaRequisicoes(dadosBackend);
        })
        .catch((err) => {
          if (!ativo) return;
          console.warn("Backend Spring Boot offline ou inacessível. Ativando dados mockados como fallback:", err);
          // Fallback: somente se o backend NÃO estiver respondendo
          setListaRequisicoes(initialRequisicoes);
        })
        .finally(() => {
          if (ativo) setLoading(false);
        });

    return () => {
      ativo = false;
    };
  }, [initialRequisicoes]);

  // Filtros aplicados de forma consistente
  const listaFiltrada = useMemo(() => {
    return listaRequisicoes.filter((r) => {
      if (filterStatus !== "todas" && r.status !== filterStatus) return false;
      if (filterUrgency !== "todas" && r.urgency !== filterUrgency) return false;
      return true;
    });
  }, [listaRequisicoes, filterStatus, filterUrgency]);

  // Atualização de status persistida no banco do Spring Boot
  async function handleMudarStatus(id: number, novoStatus: "aprovada" | "negada") {
    // Atualização otimista imediata na interface
    setListaRequisicoes((prev) =>
        prev.map((r) => (r.id === id ? { ...r, status: novoStatus } : r))
    );

    try {
      const statusBackend = novoStatus === "aprovada" ? "APROVADA" : "RECUSADA";
      await atualizarStatusRequisicaoApi(id, statusBackend);
    } catch (err) {
      console.warn("Falha ao salvar status no Spring Boot:", err);
    }
  }

  const btBadge: Record<string, string> = {
    "O-": "bg-[#FFF0F2] text-[#C8102E]",
    "O+": "bg-[#FFF0F2] text-[#C8102E]",
    "A-": "bg-blue-50 text-blue-700",
    "A+": "bg-blue-50 text-blue-700",
    "B-": "bg-violet-50 text-violet-700",
    "B+": "bg-violet-50 text-violet-700",
    "AB-": "bg-amber-50 text-amber-700",
    "AB+": "bg-amber-50 text-amber-700",
  };

  // Contadores globais baseados unicamente nas requisições reais ativas
  const counts = useMemo(() => {
    return {
      total: listaRequisicoes.length,
      pendente: listaRequisicoes.filter((r) => r.status === "pendente").length,
      em_analise: listaRequisicoes.filter((r) => r.status === "em_analise").length,
      emergencia: listaRequisicoes.filter((r) => r.urgency === "emergencia").length,
    };
  }, [listaRequisicoes]);

  return (
      <div className="px-8 py-7 space-y-5">
        {/* KPI summary */}
        <div className="grid grid-cols-4 gap-4">
          {[
            { label: "Total de requisições", value: counts.total, sub: "no sistema", icon: <IconClipboard size={18} />, bg: "bg-blue-50 text-blue-600" },
            { label: "Pendentes", value: counts.pendente, sub: "aguardando análise", icon: <IconClock size={18} />, bg: "bg-amber-50 text-amber-600" },
            { label: "Em análise", value: counts.em_analise, sub: "em processamento", icon: <IconActivity size={18} />, bg: "bg-slate-100 text-slate-500" },
            { label: "Emergência", value: counts.emergencia, sub: "prioridade máxima", icon: <IconAlertTriangle size={18} />, bg: "bg-[#FFF0F2] text-[#C8102E]" },
          ].map((k, i) => (
              <div key={i} className="bg-white rounded-xl border border-slate-100 p-5 flex items-center gap-3 shadow-sm">
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
                className="appearance-none pl-3.5 pr-9 py-2 rounded-lg border border-slate-200 text-[13px] text-slate-600 bg-white focus:outline-none focus:ring-2 focus:ring-[#C8102E]/20 cursor-pointer shadow-sm"
            >
              <option value="todas">Status: Todos</option>
              <option value="pendente">Pendente</option>
              <option value="em_analise">Em análise</option>
              <option value="aprovada">Aprovada</option>
              <option value="negada">Negada</option>
            </select>
            <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none">
            <IconChevronDown size={13} />
          </span>
          </div>

          <div className="relative">
            <select
                value={filterUrgency}
                onChange={(e) => setFilterUrgency(e.target.value as ReqUrgency | "todas")}
                className="appearance-none pl-3.5 pr-9 py-2 rounded-lg border border-slate-200 text-[13px] text-slate-600 bg-white focus:outline-none focus:ring-2 focus:ring-[#C8102E]/20 cursor-pointer shadow-sm"
            >
              <option value="todas">Urgência: Todas</option>
              <option value="rotina">Rotina</option>
              <option value="prioritaria">Prioritária</option>
              <option value="emergencia">Emergência</option>
            </select>
            <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none">
            <IconChevronDown size={13} />
          </span>
          </div>

          <div className="text-[12px] text-slate-400 ml-1">
            <span className="font-semibold text-slate-700">{listaFiltrada.length}</span> requisição(ões) visíveis
          </div>

          <button
              onClick={onNova}
              className="ml-auto flex items-center gap-2 px-4 py-2 rounded-lg bg-[#C8102E] text-white text-[13px] font-semibold hover:bg-[#a00d24] transition-colors cursor-pointer shadow-sm"
          >
            <IconPlus size={14} /> Nova Requisição
          </button>
        </div>

        {/* List */}
        {loading ? (
            <div className="bg-white rounded-xl border border-slate-100 py-16 flex flex-col items-center gap-3 text-slate-400 shadow-sm">
              <div className="w-6 h-6 border-2 border-[#C8102E] border-t-transparent rounded-full animate-spin" />
              <span className="text-[13px]">Carregando requisições do servidor...</span>
            </div>
        ) : listaFiltrada.length === 0 ? (
            <div className="bg-white rounded-xl border border-slate-100 py-20 flex flex-col items-center gap-3 text-slate-400 shadow-sm">
              <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center">
                <IconClipboard size={22} />
              </div>
              <div className="text-[14px] font-medium text-slate-500">Nenhuma requisição encontrada para este filtro</div>
              <button
                  onClick={onNova}
                  className="flex items-center gap-2 px-4 py-2 rounded-lg bg-[#C8102E] text-white text-[13px] font-semibold hover:bg-[#a00d24] transition-colors mt-2 cursor-pointer shadow-sm"
              >
                <IconPlus size={14} /> Emitir nova requisição
              </button>
            </div>
        ) : (
            <div className="space-y-3">
              {listaFiltrada.map((req) => {
                const urgCfg = URGENCY_CFG[req.urgency] ?? URGENCY_CFG.rotina;
                const stCfg = STATUS_CFG[req.status] ?? STATUS_CFG.pendente;
                const isNew = String(req.id) === String(newReqId);

                return (
                    <div
                        key={req.id}
                        className={`bg-white rounded-xl border border-slate-100 border-l-4 ${urgCfg.border} p-5 transition-all shadow-sm ${
                            isNew ? "ring-2 ring-emerald-400 bg-emerald-50/20" : ""
                        }`}
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex items-start gap-4 flex-1 min-w-0">
                    <span
                        className={`text-[15px] font-bold px-3 py-1 rounded-full flex-shrink-0 mt-0.5 ${btBadge[req.bloodType] || "bg-slate-100 text-slate-700"}`}
                        style={{ fontFamily: "'JetBrains Mono', monospace" }}
                    >
                      {req.bloodType}
                    </span>

                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 flex-wrap mb-1">
                        <span className="text-[13px] font-mono font-bold text-slate-500" style={{ fontFamily: "'JetBrains Mono', monospace" }}>
                          {req.reqCode}
                        </span>
                              <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full flex items-center gap-1.5 ${urgCfg.badge}`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${urgCfg.dot}`} />
                                {urgCfg.label}
                        </span>
                              <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full ${stCfg.badge}`}>{stCfg.label}</span>
                              {isNew && <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500 text-white animate-pulse">Nova</span>}
                            </div>

                            <div className="text-[14px] font-semibold text-slate-800 mb-0.5">
                              {req.component} — <span style={{ fontFamily: "'JetBrains Mono', monospace" }}>{req.quantity} unid.</span>
                            </div>

                            <div className="flex items-center gap-2 text-[12px] text-slate-500">
                              <IconBuilding size={11} />
                              <span className="truncate">{req.instName}</span>
                              {req.observations && (
                                  <>
                                    <span className="text-slate-200">•</span>
                                    <span className="truncate italic">{req.observations}</span>
                                  </>
                              )}
                            </div>
                          </div>
                        </div>

                        <div className="flex-shrink-0 text-right flex flex-col items-end gap-2">
                          <div className="text-[11px] text-slate-400 flex items-center gap-1">
                            <IconClock size={11} />
                            {relativeTime(req.createdAt)}
                          </div>

                          {(req.status === "pendente" || req.status === "em_analise") && (
                              <div className="flex items-center gap-1.5 mt-1">
                                <button
                                    onClick={() => handleMudarStatus(req.id, "negada")}
                                    className="px-2.5 py-1 text-[11px] font-semibold rounded-md border border-slate-200 text-slate-500 hover:bg-slate-50 flex items-center gap-1 cursor-pointer transition-colors"
                                >
                                  <IconX size={11} /> Recusar
                                </button>
                                <button
                                    onClick={() => handleMudarStatus(req.id, "aprovada")}
                                    className="px-2.5 py-1 text-[11px] font-semibold rounded-md bg-emerald-600 text-white hover:bg-emerald-700 flex items-center gap-1 cursor-pointer transition-colors"
                                >
                                  <IconCheck size={11} /> Aprovar
                                </button>
                              </div>
                          )}
                          {req.status === "aprovada" && (
                              <span className="text-[11px] text-emerald-600 font-medium flex items-center gap-1">
                                <IconCheck size={12} /> Aprovada
                              </span>
                          )}
                          {req.status === "negada" && (
                              <span className="text-[11px] text-slate-400 font-medium flex items-center gap-1">
                                <IconX size={12} /> Negada
                              </span>
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