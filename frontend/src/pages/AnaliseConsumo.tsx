// Tela de Análise de Consumo — US12

import { useState, useMemo } from "react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, LineChart, Line, ReferenceLine, ResponsiveContainer, Cell, Tooltip as RechartTooltip } from "recharts";
import { IconActivity, IconBarChart2, IconChevronDown, IconDroplet, IconThermometer, IconTrendingDown, IconTrendingUp } from "@/components/icons";
import { BT_DATA, BT_LABELS, WEEK_LABELS, cvClass, fmt } from "@/data/mockData";
import type { BloodType, BtStats } from "@/types";

export default function AnaliseConsumoScreen() {
  const [selected, setSelected] = useState<BloodType | "Todos">("Todos");

  const stats = useMemo<BtStats>(() => {
    if (selected !== "Todos") return BT_DATA.find((d) => d.bt === selected)!;
    const means = BT_DATA.map((d) => d.mean);
    const mean = means.reduce((a, b) => a + b, 0) / means.length;
    const variance = means.reduce((a, b) => a + (b - mean) ** 2, 0) / means.length;
    const stddev = Math.sqrt(variance);
    const cv = (stddev / mean) * 100;
    const weekly = WEEK_LABELS.map((_, wi) => BT_DATA.reduce((s, d) => s + d.weekly[wi], 0));
    const last = weekly[weekly.length - 1];
    const prev = weekly[weekly.length - 2];
    const trendPct = prev ? Math.round(((last - prev) / prev) * 100) : 0;
    return { bt: "O-", mean, stddev, cv, trendPct, weekly };
  }, [selected]);

  const barData = BT_DATA.map((d) => ({ bt: d.bt, value: d.mean }));

  const lineData = WEEK_LABELS.map((label, i) => ({
    label,
    value: Number(stats.weekly[i].toFixed(1)),
  }));

  const cvCfg = cvClass(stats.cv);

  return (
    <div className="px-8 py-7 space-y-5">

      {/* Selector */}
      <div className="flex items-center gap-3">
        <label className="text-[11px] font-semibold text-slate-400 uppercase tracking-widest">Tipo sanguíneo</label>
        <div className="relative">
          <select
            value={selected}
            onChange={(e) => setSelected(e.target.value as BloodType | "Todos")}
            className="appearance-none pl-3.5 pr-9 py-2 rounded-lg border border-slate-200 text-[13.5px] font-semibold text-slate-700 bg-white focus:outline-none focus:ring-2 focus:ring-[#C8102E]/20 focus:border-[#C8102E]/50 cursor-pointer"
            style={{ fontFamily: selected !== "Todos" ? "'JetBrains Mono', monospace" : undefined }}
          >
            <option value="Todos">Todos os tipos</option>
            {BT_LABELS.map((bt) => <option key={bt} value={bt}>{bt}</option>)}
          </select>
          <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none"><IconChevronDown size={13} /></span>
        </div>
        {selected !== "Todos" && (
          <span className="text-[13px] font-bold text-[#C8102E] px-3 py-1 rounded-full bg-[#FFF0F2]" style={{ fontFamily: "'JetBrains Mono', monospace" }}>{selected}</span>
        )}
      </div>

      {/* KPI cards */}
      <div className="grid grid-cols-4 gap-4">
        {/* Consumo médio */}
        <div className="bg-white rounded-xl border border-slate-100 p-5 flex flex-col gap-3">
          <div className="flex items-start justify-between">
            <div>
              <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-widest">Consumo Médio</div>
              <div className="mt-1.5 flex items-baseline gap-1.5">
                <span className="text-[32px] font-bold text-slate-900 leading-none" style={{ fontFamily: "'JetBrains Mono', monospace" }}>{fmt(stats.mean)}</span>
              </div>
            </div>
            <div className="w-9 h-9 rounded-lg bg-[#FFF0F2] text-[#C8102E] flex items-center justify-center flex-shrink-0"><IconDroplet size={18} /></div>
          </div>
          <div className="text-[12px] text-slate-400 font-medium">unid./semana</div>
        </div>

        {/* Desvio Padrão */}
        <div className="bg-white rounded-xl border border-slate-100 p-5 flex flex-col gap-3">
          <div className="flex items-start justify-between">
            <div>
              <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-widest">Desvio Padrão</div>
              <div className="mt-1.5 flex items-baseline gap-1.5">
                <span className="text-[32px] font-bold text-slate-900 leading-none" style={{ fontFamily: "'JetBrains Mono', monospace" }}>{fmt(stats.stddev)}</span>
              </div>
            </div>
            <div className="w-9 h-9 rounded-lg bg-slate-100 text-slate-500 flex items-center justify-center flex-shrink-0"><IconActivity size={18} /></div>
          </div>
          <div className="text-[12px] text-slate-400 font-medium">unidades</div>
        </div>

        {/* Coef. de Variação */}
        <div className="bg-white rounded-xl border border-slate-100 p-5 flex flex-col gap-3">
          <div className="flex items-start justify-between">
            <div>
              <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-widest">Coef. de Variação</div>
              <div className="mt-1.5 flex items-baseline gap-2">
                <span className="text-[32px] font-bold text-slate-900 leading-none" style={{ fontFamily: "'JetBrains Mono', monospace" }}>{fmt(stats.cv, 0)}%</span>
              </div>
            </div>
            <div className={`w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 ${cvCfg.badge}`}>
              <IconThermometer size={18} />
            </div>
          </div>
          <div className="flex items-center gap-1.5">
            <span className={`w-2 h-2 rounded-full ${cvCfg.dot}`}></span>
            <span className={`text-[12px] font-semibold px-2 py-0.5 rounded-full ${cvCfg.badge}`}>{cvCfg.label}</span>
          </div>
        </div>

        {/* Tendência */}
        <div className="bg-white rounded-xl border border-slate-100 p-5 flex flex-col gap-3">
          <div className="flex items-start justify-between">
            <div>
              <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-widest">Tendência</div>
              <div className="mt-1.5 flex items-baseline gap-1.5">
                <span className={`text-[32px] font-bold leading-none ${stats.trendPct >= 0 ? "text-[#C8102E]" : "text-emerald-600"}`} style={{ fontFamily: "'JetBrains Mono', monospace" }}>
                  {stats.trendPct >= 0 ? "+" : ""}{stats.trendPct}%
                </span>
              </div>
            </div>
            <div className={`w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 ${stats.trendPct >= 0 ? "bg-[#FFF0F2] text-[#C8102E]" : "bg-emerald-50 text-emerald-600"}`}>
              {stats.trendPct >= 0 ? <IconTrendingUp size={18} /> : <IconTrendingDown size={18} />}
            </div>
          </div>
          <div className="text-[12px] text-slate-400 font-medium">vs. semana anterior</div>
        </div>
      </div>

      {/* Charts row */}
      <div className="grid grid-cols-2 gap-5">
        {/* Bar chart */}
        <div className="bg-white rounded-xl border border-slate-100 p-5">
          <div className="text-[12px] font-semibold text-slate-700 mb-1">Consumo Médio por Tipo Sanguíneo</div>
          <div className="text-[11px] text-slate-400 mb-4">unidades/semana · todas as instituições</div>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={barData} barSize={28} margin={{ top: 4, right: 4, left: -16, bottom: 0 }}>
              <CartesianGrid vertical={false} stroke="#F1F5F9" />
              <XAxis dataKey="bt" tick={{ fontSize: 11, fontFamily: "'JetBrains Mono', monospace", fill: "#94A3B8" }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 11, fill: "#94A3B8" }} axisLine={false} tickLine={false} />
              <RechartTooltip
                contentStyle={{ fontFamily: "'DM Sans', sans-serif", fontSize: 12, borderRadius: 8, border: "1px solid #E2E8F0", boxShadow: "0 4px 12px rgba(0,0,0,0.08)" }}
                formatter={(v) => [`${fmt(Number(v))} unid./sem.`, "Consumo médio"]}
              />
              <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                {barData.map((entry) => (
                  <Cell
                    key={entry.bt}
                    fill={entry.bt === selected || selected === "Todos" ? "#C8102E" : "#E2E8F0"}
                    fillOpacity={entry.bt === selected || selected === "Todos" ? 1 : 0.8}
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Line chart */}
        <div className="bg-white rounded-xl border border-slate-100 p-5">
          <div className="text-[12px] font-semibold text-slate-700 mb-1">
            Série Histórica — {selected === "Todos" ? "Todos os tipos (soma)" : selected}
          </div>
          <div className="text-[11px] text-slate-400 mb-4">últimas 8 semanas · média indicada pela linha pontilhada</div>
          <ResponsiveContainer width="100%" height={200}>
            <LineChart data={lineData} margin={{ top: 4, right: 4, left: -16, bottom: 0 }}>
              <CartesianGrid stroke="#F1F5F9" />
              <XAxis dataKey="label" tick={{ fontSize: 11, fill: "#94A3B8" }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 11, fill: "#94A3B8" }} axisLine={false} tickLine={false} />
              <RechartTooltip
                contentStyle={{ fontFamily: "'DM Sans', sans-serif", fontSize: 12, borderRadius: 8, border: "1px solid #E2E8F0", boxShadow: "0 4px 12px rgba(0,0,0,0.08)" }}
                formatter={(v) => [`${v} unid.`, "Consumo"]}
              />
              <ReferenceLine
                y={Number(stats.mean.toFixed(1))}
                stroke="#94A3B8"
                strokeDasharray="6 3"
                strokeWidth={1.5}
                label={{ value: `Média: ${fmt(stats.mean)}`, position: "insideTopRight", fontSize: 10, fill: "#94A3B8" }}
              />
              <Line
                type="monotone"
                dataKey="value"
                stroke="#C8102E"
                strokeWidth={2}
                dot={{ r: 3.5, fill: "#C8102E", strokeWidth: 0 }}
                activeDot={{ r: 5, fill: "#C8102E", strokeWidth: 2, stroke: "#fff" }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-slate-100 overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-100 bg-slate-50 flex items-center gap-3">
          <IconBarChart2 size={16} />
          <div className="text-[12px] font-semibold text-slate-700">Resumo Estatístico por Tipo Sanguíneo</div>
        </div>
        {/* Header */}
        <div className="grid px-5 py-3 bg-slate-50 border-b border-slate-100 text-[11px] font-semibold text-slate-400 uppercase tracking-widest"
          style={{ gridTemplateColumns: "90px 1fr 1fr 1fr 1fr" }}>
          <div>Tipo</div>
          <div className="text-right">Consumo Médio</div>
          <div className="text-right">Desvio Padrão</div>
          <div className="text-right">Coef. Variação</div>
          <div className="text-right">Classificação</div>
        </div>
        {BT_DATA.map((d) => {
          const cfg = cvClass(d.cv);
          const isHighlighted = d.bt === selected;
          return (
            <div
              key={d.bt}
              className={`grid px-5 py-3.5 items-center border-b border-slate-50 last:border-0 transition-colors ${isHighlighted ? "bg-[#FFF0F2]/40" : "hover:bg-slate-50/60"}`}
              style={{ gridTemplateColumns: "90px 1fr 1fr 1fr 1fr" }}
            >
              <div>
                <span className={`text-[14px] font-bold ${isHighlighted ? "text-[#C8102E]" : "text-slate-700"}`} style={{ fontFamily: "'JetBrains Mono', monospace" }}>{d.bt}</span>
              </div>
              <div className="text-right text-[13px] font-semibold text-slate-800" style={{ fontFamily: "'JetBrains Mono', monospace" }}>
                {fmt(d.mean)} <span className="text-[11px] text-slate-400 font-normal">unid./sem.</span>
              </div>
              <div className="text-right text-[13px] text-slate-700" style={{ fontFamily: "'JetBrains Mono', monospace" }}>
                ± {fmt(d.stddev)}
              </div>
              <div className="text-right text-[13px] font-semibold" style={{ fontFamily: "'JetBrains Mono', monospace", color: d.cv >= 30 ? "#C8102E" : d.cv >= 15 ? "#D97706" : "#059669" }}>
                {fmt(d.cv, 0)}%
              </div>
              <div className="flex justify-end">
                <span className={`text-[11px] font-semibold px-2.5 py-0.5 rounded-full flex items-center gap-1.5 ${cfg.badge}`}>
                  <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot}`}></span>
                  {cfg.label}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
