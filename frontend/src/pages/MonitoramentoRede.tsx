// Tela de Monitoramento de Rede — US08

import { XAxis, YAxis, CartesianGrid, LineChart, Line, ReferenceLine, ResponsiveContainer, Tooltip as RechartTooltip } from "recharts";
import { IconActivity, IconArrows, IconCheck, IconClock, IconShield, IconWifi } from "@/components/icons";
import { LATENCY_24H, SERVICES } from "@/data/mockData";
import type { Service } from "@/types";

export default function MonitoramentoRedeScreen() {
  const svcBadge: Record<Service["status"], { label: string; badge: string; dot: string }> = {
    operacional:  { label: "Operacional",   badge: "bg-emerald-50 text-emerald-700", dot: "bg-emerald-400" },
    degradado:    { label: "Degradado",     badge: "bg-amber-50 text-amber-700",    dot: "bg-amber-400"   },
    indisponivel: { label: "Indisponível",  badge: "bg-[#FFF0F2] text-[#C8102E]",  dot: "bg-[#C8102E]"   },
  };

  function errBadge(rate: number) {
    if (rate > 5)  return "text-[#C8102E] font-semibold";
    if (rate >= 1) return "text-amber-600 font-semibold";
    return "text-emerald-600";
  }

  function latColor(ms: number) {
    if (ms === 0) return "text-slate-300";
    if (ms > 100) return "text-amber-600";
    return "text-slate-700";
  }

  const avgLatency = Math.round(LATENCY_24H.reduce((s, d) => s + d.ms, 0) / LATENCY_24H.length);
  const reqPerSec  = 128;
  const errRate    = 0.8;
  const uptime     = 99.7;
  const cloudCost  = 340;
  const cloudBudget = 500;
  const costPct    = Math.round((cloudCost / cloudBudget) * 100);

  // Reference bands for chart background (rendered as custom svg layers)
  const CHART_MAX = 80;

  return (
    <div className="px-8 py-7 space-y-5">
      {/* KPI cards */}
      <div className="grid grid-cols-4 gap-4">
        {/* Latência média */}
        <div className="bg-white rounded-xl border border-slate-100 p-5 flex flex-col gap-3">
          <div className="flex items-start justify-between">
            <div>
              <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-widest">Latência Média</div>
              <div className="mt-1.5 flex items-baseline gap-1">
                <span className="text-[32px] font-bold text-slate-900 leading-none" style={{ fontFamily: "'JetBrains Mono', monospace" }}>{avgLatency}</span>
                <span className="text-[14px] text-slate-400">ms</span>
              </div>
            </div>
            <div className="w-9 h-9 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center flex-shrink-0"><IconActivity size={18} /></div>
          </div>
          <div className="text-[12px] text-emerald-600 font-medium">Dentro do limite normal</div>
        </div>

        {/* Vazão */}
        <div className="bg-white rounded-xl border border-slate-100 p-5 flex flex-col gap-3">
          <div className="flex items-start justify-between">
            <div>
              <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-widest">Vazão</div>
              <div className="mt-1.5 flex items-baseline gap-1">
                <span className="text-[32px] font-bold text-slate-900 leading-none" style={{ fontFamily: "'JetBrains Mono', monospace" }}>{reqPerSec}</span>
                <span className="text-[12px] text-slate-400">req/s</span>
              </div>
            </div>
            <div className="w-9 h-9 rounded-lg bg-violet-50 text-violet-600 flex items-center justify-center flex-shrink-0"><IconArrows size={18} /></div>
          </div>
          <div className="text-[12px] text-slate-400 font-medium">Pico: 214 req/s às 11h</div>
        </div>

        {/* Taxa de erro */}
        <div className="bg-white rounded-xl border border-slate-100 p-5 flex flex-col gap-3">
          <div className="flex items-start justify-between">
            <div>
              <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-widest">Taxa de Erro</div>
              <div className="mt-1.5 flex items-baseline gap-1">
                <span className="text-[32px] font-bold text-slate-900 leading-none" style={{ fontFamily: "'JetBrains Mono', monospace" }}>{errRate}</span>
                <span className="text-[14px] text-slate-400">%</span>
              </div>
            </div>
            <div className="w-9 h-9 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center flex-shrink-0"><IconShield size={18} /></div>
          </div>
          <span className="text-[12px] font-semibold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 w-fit flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span> Normal — abaixo de 1%
          </span>
        </div>

        {/* Uptime */}
        <div className="bg-white rounded-xl border border-slate-100 p-5 flex flex-col gap-3">
          <div className="flex items-start justify-between">
            <div>
              <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-widest">Uptime</div>
              <div className="mt-1.5 flex items-baseline gap-1">
                <span className="text-[32px] font-bold text-slate-900 leading-none" style={{ fontFamily: "'JetBrains Mono', monospace" }}>{uptime}</span>
                <span className="text-[14px] text-slate-400">%</span>
              </div>
            </div>
            <div className="w-9 h-9 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center flex-shrink-0"><IconCheck size={18} /></div>
          </div>
          <div className="text-[12px] text-slate-400 font-medium">SLA 99,5% — atingido</div>
        </div>
      </div>

      {/* Latency chart + Cost card side by side */}
      <div className="grid grid-cols-3 gap-5">
        {/* Latency line chart */}
        <div className="col-span-2 bg-white rounded-xl border border-slate-100 p-5">
          <div className="text-[12px] font-semibold text-slate-700 mb-1">Latência — Últimas 24 horas</div>
          <div className="text-[11px] text-slate-400 mb-3 flex items-center gap-4">
            <span className="flex items-center gap-1.5"><span className="w-3 h-2 rounded-sm bg-emerald-100 inline-block"></span>Normal (&lt;50ms)</span>
            <span className="flex items-center gap-1.5"><span className="w-3 h-2 rounded-sm bg-amber-50 inline-block"></span>Atenção (50–100ms)</span>
            <span className="flex items-center gap-1.5"><span className="w-3 h-2 rounded-sm bg-[#FFF0F2] inline-block"></span>Crítico (&gt;100ms)</span>
          </div>
          <ResponsiveContainer width="100%" height={200}>
            <LineChart data={LATENCY_24H} margin={{ top: 4, right: 8, left: -20, bottom: 0 }}>
              {/* Reference bands as gradient areas */}
              <defs>
                <linearGradient id="zoneNormal" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#D1FAE5" stopOpacity={0.6}/>
                  <stop offset="100%" stopColor="#D1FAE5" stopOpacity={0.1}/>
                </linearGradient>
              </defs>
              <CartesianGrid stroke="#F1F5F9" vertical={false} />
              <XAxis dataKey="label" tick={{ fontSize: 10, fill: "#94A3B8" }} axisLine={false} tickLine={false}
                tickFormatter={(v) => v.endsWith("h") && parseInt(v) % 4 === 0 ? v : ""} />
              <YAxis tick={{ fontSize: 10, fill: "#94A3B8" }} axisLine={false} tickLine={false} domain={[0, CHART_MAX]} />
              <RechartTooltip
                contentStyle={{ fontFamily: "'DM Sans', sans-serif", fontSize: 12, borderRadius: 8, border: "1px solid #E2E8F0" }}
                formatter={(v) => [`${v}ms`, "Latência"]}
              />
              {/* Reference lines for thresholds */}
              <ReferenceLine y={50} stroke="#FCD34D" strokeDasharray="4 3" strokeWidth={1.5}
                label={{ value: "50ms", position: "insideTopRight", fontSize: 9, fill: "#D97706" }} />
              <ReferenceLine y={100} stroke="#C8102E" strokeDasharray="4 3" strokeWidth={1.5}
                label={{ value: "100ms", position: "insideTopRight", fontSize: 9, fill: "#C8102E" }} />
              <Line type="monotone" dataKey="ms" stroke="#C8102E" strokeWidth={2}
                dot={false} activeDot={{ r: 4, fill: "#C8102E", strokeWidth: 2, stroke: "#fff" }} />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Cloud cost card */}
        <div className="bg-white rounded-xl border border-slate-100 p-5 flex flex-col">
          <div className="flex items-center gap-2.5 mb-4">
            <div className="w-8 h-8 rounded-lg bg-violet-50 text-violet-600 flex items-center justify-center flex-shrink-0">
              <IconShield size={15} />
            </div>
            <div>
              <div className="text-[12px] font-semibold text-slate-700">Custo Estimado em Nuvem</div>
              <div className="text-[11px] text-slate-400">mês corrente</div>
            </div>
          </div>

          <div className="flex-1 flex flex-col justify-center gap-4">
            <div>
              <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-widest mb-1">Gasto acumulado</div>
              <div className="flex items-baseline gap-1">
                <span className="text-[28px] font-bold text-slate-900" style={{ fontFamily: "'JetBrains Mono', monospace" }}>R$ {cloudCost}</span>
              </div>
              <div className="text-[11px] text-slate-400 mt-0.5">de R$ {cloudBudget} orçados este mês</div>
            </div>

            {/* Progress bar */}
            <div>
              <div className="flex items-center justify-between text-[11px] mb-1.5">
                <span className="text-slate-500 font-medium">{costPct}% do orçamento</span>
                <span className={`font-semibold ${costPct >= 90 ? "text-[#C8102E]" : costPct >= 70 ? "text-amber-600" : "text-emerald-600"}`}>
                  {costPct < 70 ? "Dentro do esperado" : costPct < 90 ? "Atenção" : "Próximo do limite"}
                </span>
              </div>
              <div className="h-2.5 bg-slate-100 rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all ${costPct >= 90 ? "bg-[#C8102E]" : costPct >= 70 ? "bg-amber-400" : "bg-emerald-400"}`}
                  style={{ width: `${costPct}%` }}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-100 text-[11px]">
              {[["Computação","R$ 180"],["Armazenamento","R$ 62"],["Rede","R$ 48"],["Outros","R$ 50"]].map(([label, val]) => (
                <div key={label}>
                  <div className="text-slate-400">{label}</div>
                  <div className="font-semibold text-slate-700" style={{ fontFamily: "'JetBrains Mono', monospace" }}>{val}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Services table */}
      <div className="bg-white rounded-xl border border-slate-100 overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <IconWifi size={15} />
            <div className="text-[12px] font-semibold text-slate-700">Status dos Serviços e Endpoints</div>
          </div>
          <div className="flex items-center gap-3 text-[11px]">
            {([["operacional","bg-emerald-400","Operacional"],["degradado","bg-amber-400","Degradado"],["indisponivel","bg-[#C8102E]","Indisponível"]] as const).map(([, dot, label]) => (
              <span key={label} className="flex items-center gap-1.5 text-slate-500">
                <span className={`w-2 h-2 rounded-full ${dot} inline-block`}></span>{label}
              </span>
            ))}
            <span className="ml-2 flex items-center gap-1.5 text-slate-400">
              <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></div>
              Verificação automática a cada 30s
            </span>
          </div>
        </div>

        {/* Header */}
        <div className="grid px-5 py-3 bg-slate-50 border-b border-slate-100 text-[11px] font-semibold text-slate-400 uppercase tracking-widest"
          style={{ gridTemplateColumns: "1.4fr 1.6fr 1fr 80px 90px 120px" }}>
          <div>Serviço</div><div>Endpoint</div><div>Status</div>
          <div className="text-right">Latência</div><div className="text-right">Erro</div><div className="text-right">Última verif.</div>
        </div>

        {SERVICES.map((svc) => {
          const sc = svcBadge[svc.status];
          return (
            <div key={svc.name}
              className="grid px-5 py-3.5 items-center border-b border-slate-50 last:border-0 hover:bg-slate-50/60 transition-colors"
              style={{ gridTemplateColumns: "1.4fr 1.6fr 1fr 80px 90px 120px" }}>
              <div className="text-[13px] font-semibold text-slate-800">{svc.name}</div>
              <div className="text-[11.5px] font-mono text-slate-400 truncate" style={{ fontFamily: "'JetBrains Mono', monospace" }}>{svc.endpoint}</div>
              <div>
                <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full flex items-center gap-1.5 w-fit ${sc.badge}`}>
                  <span className={`w-1.5 h-1.5 rounded-full ${sc.dot} ${svc.status === "operacional" ? "animate-pulse" : ""}`}></span>
                  {sc.label}
                </span>
              </div>
              <div className={`text-right text-[13px] font-semibold ${latColor(svc.latencyMs)}`} style={{ fontFamily: "'JetBrains Mono', monospace" }}>
                {svc.latencyMs > 0 ? `${svc.latencyMs}ms` : "—"}
              </div>
              <div className={`text-right text-[13px] ${errBadge(svc.errorRate)}`} style={{ fontFamily: "'JetBrains Mono', monospace" }}>
                {svc.errorRate.toFixed(1)}%
              </div>
              <div className="text-right text-[11.5px] text-slate-400 flex items-center gap-1 justify-end">
                <IconClock size={11} />{svc.lastCheck}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
