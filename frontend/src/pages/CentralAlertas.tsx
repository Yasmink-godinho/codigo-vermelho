// Tela de Central de Alertas — US07 (alertas térmicos) + alertas operacionais derivados.
// Os alertas vêm de dados reais:
//   • Térmicos  → GET /api/v1/alertas-termicos (backend, US07)
//   • Estoque   → desabastecimento por tipo, derivado dos lotes (Fila FEFO) vs. estoque mínimo da rede
//   • Validade  → lotes vencidos ou a vencer em ≤ 3 dias (apoio ao FEFO)
// Sem backend, degrada para os dados de demonstração (como as demais telas).

import { useState, useEffect, useMemo } from "react";
import { IconActivity, IconBell, IconCheck, IconClock, IconMapPin } from "@/components/icons";
import { BT_LABELS, daysUntil, relativeTime } from "@/data/mockData";
import {
  getFilaFEFO, getInstituicoes, buscarAlertasTermicosApi,
  desnormalizarTipoSanguineo,
} from "@/data/api";

type Nivel = "critico" | "atencao" | "normal";
interface Alerta {
  id: string;
  level: Nivel;
  title: string;
  institution: string;
  desc: string;
  time: string;
  action: string | null;
}

// Extratores tolerantes aos formatos PT (backend) e EN (mock/local)
function qtd(x: any): number {
  const n = Number(x?.quantidade ?? x?.quantity ?? x?.volume ?? 0);
  return isNaN(n) ? 0 : n;
}
function tipoSangue(x: any): string {
  return desnormalizarTipoSanguineo(String(x?.tipoSanguineo ?? x?.bloodType ?? "")).toUpperCase();
}
function validade(x: any): string {
  return String(x?.expiryDate ?? x?.dataValidade ?? x?.validade ?? "");
}

const PESO: Record<Nivel, number> = { critico: 0, atencao: 1, normal: 2 };

export default function AlertasScreen({ filter, setFilter }: { filter: string; setFilter: (v: any) => void }) {
  const [alerts, setAlerts] = useState<Alerta[]>([]);
  const [backendAtivo, setBackendAtivo] = useState(false);
  const [carregando, setCarregando] = useState(true);

  useEffect(() => {
    let ativo = true;

    Promise.allSettled([
      buscarAlertasTermicosApi(),
      getFilaFEFO(),
      getInstituicoes(),
    ]).then(([resTermicos, resLotes, resInst]) => {
      if (!ativo) return;

      const lista: Alerta[] = [];

      // 1. Alertas térmicos (backend US07)
      let termicosOk = false;
      if (resTermicos.status === "fulfilled" && Array.isArray(resTermicos.value)) {
        termicosOk = true;
        for (const a of resTermicos.value) {
          const nivel = String(a.nivel || "").toUpperCase();
          const level: Nivel = nivel === "CRITICO" ? "critico" : nivel === "ATENCAO" ? "atencao" : "normal";
          const ts = Date.parse(a.dataHora);
          lista.push({
            id: `TERM-${a.id}`,
            level,
            title: "Desvio de temperatura em transporte",
            institution: `Transferência ${a.codigoTransferencia ?? a.transferenciaId}`,
            desc: `${a.mensagem ?? "Leitura fora da faixa segura."} Temperatura registrada: ${a.temperatura}°C.`,
            time: isNaN(ts) ? "" : relativeTime(ts),
            action: "Avaliar",
          });
        }
      }
      setBackendAtivo(termicosOk);

      const lotes: any[] = resLotes.status === "fulfilled" && Array.isArray(resLotes.value) ? resLotes.value : [];
      const instituicoes: any[] = resInst.status === "fulfilled" && Array.isArray(resInst.value) ? resInst.value : [];

      // Mínimo agregado da rede por tipo
      const minPorTipo: Record<string, number> = {};
      BT_LABELS.forEach((bt) => (minPorTipo[bt] = 0));
      instituicoes.forEach((i) => {
        const ms = i?.minStock || i?.estoqueMinimo || {};
        Object.entries(ms).forEach(([t, v]) => {
          const bt = desnormalizarTipoSanguineo(String(t)).toUpperCase();
          if (minPorTipo[bt] !== undefined) minPorTipo[bt] += Number(v) || 0;
        });
      });

      // 2. Desabastecimento por tipo (estoque atual vs. mínimo da rede)
      BT_LABELS.forEach((bt) => {
        const estoque = lotes.filter((l) => tipoSangue(l) === bt).reduce((s, l) => s + qtd(l), 0);
        const minimo = minPorTipo[bt] || 0;
        if (minimo > 0 && estoque < minimo) {
          const critico = estoque === 0 || estoque < minimo * 0.5;
          lista.push({
            id: `EST-${bt}`,
            level: critico ? "critico" : "atencao",
            title: `Risco de desabastecimento — ${bt}`,
            institution: "Rede — estoque consolidado",
            desc: `Estoque de ${bt} em ${estoque} unidade(s), abaixo do mínimo de segurança da rede (${minimo} unid.).`,
            time: "",
            action: "Redistribuir",
          });
        }
      });

      // 3. Validade crítica (vencidos ou a vencer em ≤ 3 dias)
      BT_LABELS.forEach((bt) => {
        const criticos = lotes.filter((l) => {
          if (tipoSangue(l) !== bt) return false;
          const v = validade(l);
          return v !== "" && daysUntil(v) <= 3;
        });
        if (criticos.length > 0) {
          const unidades = criticos.reduce((s, l) => s + qtd(l), 0);
          const vencidos = criticos.filter((l) => daysUntil(validade(l)) < 0).length;
          lista.push({
            id: `VAL-${bt}`,
            level: "critico",
            title: `Validade crítica — ${bt}`,
            institution: "Rede — lotes em Fila FEFO",
            desc: vencidos > 0
              ? `${unidades} unidade(s) de ${bt} em ${criticos.length} lote(s), com ${vencidos} já vencido(s). Priorizar via FEFO ou redistribuir.`
              : `${unidades} unidade(s) de ${bt} em ${criticos.length} lote(s) vencem em até 3 dias. Priorizar uso/redistribuição.`,
            time: "",
            action: "Redistribuir",
          });
        }
      });

      lista.sort((a, b) => PESO[a.level] - PESO[b.level]);
      setAlerts(lista);
      setCarregando(false);
    });

    return () => { ativo = false; };
  }, []);

  const filtered = filter === "todos" ? alerts : alerts.filter((a) => a.level === filter);

  const levelConfig: Record<Nivel, { label: string; dot: string; badge: string; border: string }> = {
    critico: { label: "Crítico", dot: "bg-[#C8102E]", badge: "bg-[#FFF0F2] text-[#C8102E]", border: "border-l-[#C8102E]" },
    atencao: { label: "Atenção", dot: "bg-amber-400", badge: "bg-amber-50 text-amber-700", border: "border-l-amber-400" },
    normal: { label: "Normal", dot: "bg-emerald-400", badge: "bg-emerald-50 text-emerald-700", border: "border-l-emerald-500" },
  };

  const counts = useMemo(() => ({
    todos: alerts.length,
    critico: alerts.filter((a) => a.level === "critico").length,
    atencao: alerts.filter((a) => a.level === "atencao").length,
    normal: alerts.filter((a) => a.level === "normal").length,
  }), [alerts]);

  const filters = [
    { key: "todos", label: "Todos", count: counts.todos },
    { key: "critico", label: "Crítico", count: counts.critico },
    { key: "atencao", label: "Atenção", count: counts.atencao },
    { key: "normal", label: "Normal", count: counts.normal },
  ];

  return (
    <div className="px-8 py-7">
      {/* Summary bar */}
      <div className="flex items-center justify-between mb-5">
        <div className="grid grid-cols-3 gap-4 flex-1">
          <div className="bg-white rounded-xl border border-slate-100 p-4 flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-[#FFF0F2] text-[#C8102E] flex items-center justify-center"><IconBell size={17} /></div>
            <div>
              <div className="text-[24px] text-slate-900 leading-none" style={{ fontWeight: 700 }}>{counts.critico}</div>
              <div className="text-[12px] text-slate-400 mt-0.5">Alertas críticos ativos</div>
            </div>
          </div>
          <div className="bg-white rounded-xl border border-slate-100 p-4 flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center"><IconActivity size={17} /></div>
            <div>
              <div className="text-[24px] text-slate-900 leading-none" style={{ fontWeight: 700 }}>{counts.atencao}</div>
              <div className="text-[12px] text-slate-400 mt-0.5">Situações em atenção</div>
            </div>
          </div>
          <div className="bg-white rounded-xl border border-slate-100 p-4 flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center"><IconCheck size={17} /></div>
            <div>
              <div className="text-[24px] text-slate-900 leading-none" style={{ fontWeight: 700 }}>{counts.normal}</div>
              <div className="text-[12px] text-slate-400 mt-0.5">Em situação normal</div>
            </div>
          </div>
        </div>
        <span className={`ml-4 text-[11px] font-semibold px-3 py-1.5 rounded-full inline-flex items-center gap-1.5 ${
          backendAtivo ? "bg-emerald-50 text-emerald-700" : "bg-slate-100 text-slate-500"
        }`}>
          <span className={`w-1.5 h-1.5 rounded-full ${backendAtivo ? "bg-emerald-500" : "bg-slate-400"}`} />
          {backendAtivo ? "Dados do backend" : "Dados de demonstração"}
        </span>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-2 mb-5">
        {filters.map((f) => (
          <button
            key={f.key}
            onClick={() => setFilter(f.key)}
            className={`px-3.5 py-1.5 rounded-full text-[12.5px] font-medium flex items-center gap-1.5 transition-all ${
              filter === f.key ? "bg-slate-900 text-white" : "bg-white border border-slate-200 text-slate-600 hover:border-slate-300"
            }`}
          >
            {f.label}
            <span className={`text-[11px] font-semibold ${filter === f.key ? "text-white/70" : "text-slate-400"}`}>{f.count}</span>
          </button>
        ))}
      </div>

      {/* Alert list */}
      {carregando ? (
        <div className="text-[13px] text-slate-400 py-12 text-center">Carregando alertas…</div>
      ) : filtered.length === 0 ? (
        <div className="bg-white rounded-xl border border-slate-100 p-10 text-center">
          <div className="w-10 h-10 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto mb-3"><IconCheck size={20} /></div>
          <div className="text-[14px] font-semibold text-slate-700">Nenhum alerta neste filtro</div>
          <div className="text-[12px] text-slate-400 mt-1">Estoque, validade e transporte dentro dos parâmetros.</div>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((alert) => {
            const cfg = levelConfig[alert.level];
            return (
              <div key={alert.id} className={`bg-white rounded-xl border border-slate-100 border-l-4 ${cfg.border} p-5`}>
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-start gap-3 flex-1 min-w-0">
                    <div className={`w-2 h-2 rounded-full mt-1.5 flex-shrink-0 ${cfg.dot}`}></div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2.5 flex-wrap">
                        <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full ${cfg.badge}`}>{cfg.label}</span>
                        <span className="text-[11px] font-mono text-slate-400" style={{ fontFamily: "'JetBrains Mono', monospace" }}>{alert.id}</span>
                      </div>
                      <div className="text-[14px] font-semibold text-slate-800 mt-1.5">{alert.title}</div>
                      <div className="text-[12px] text-slate-500 mt-0.5 flex items-center gap-1.5"><IconMapPin size={12} />{alert.institution}</div>
                      <div className="text-[13px] text-slate-500 mt-2 leading-relaxed">{alert.desc}</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    {alert.time && <div className="text-[11px] text-slate-400 flex items-center gap-1"><IconClock size={11} />{alert.time}</div>}
                    {alert.action && (
                      <button className="ml-2 px-3.5 py-1.5 bg-[#C8102E] text-white text-[12px] font-semibold rounded-lg hover:bg-[#a00d24] transition-colors">
                        {alert.action}
                      </button>
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