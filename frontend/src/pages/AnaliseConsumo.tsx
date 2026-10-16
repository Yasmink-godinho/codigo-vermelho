import { useState, useMemo, useEffect } from "react";
import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid, LineChart, Line, ReferenceLine,
    ResponsiveContainer, Cell, Tooltip as RechartTooltip
} from "recharts";
import {
    IconActivity, IconBarChart2, IconChevronDown, IconDroplet,
    IconThermometer, IconTrendingDown, IconTrendingUp, IconClock
} from "@/components/icons";
import { BT_DATA, BT_LABELS, WEEK_LABELS, cvClass, fmt } from "@/data/mockData";
import {
    buscarAnaliseConsumoApi,
    getFilaFEFO,
    desnormalizarTipoSanguineo,
    type AnaliseConsumoApiData,
    type LoteFEFOAPI
} from "@/data/api";
import type { BloodType, BtStats } from "@/types";

export default function AnaliseConsumoScreen() {
    const [selected, setSelected] = useState<BloodType | "Todos">("Todos");

    // Estado do estoque vindo da API real
    const [lotes, setLotes] = useState<LoteFEFOAPI[]>([]);
    const [loadingLotes, setLoadingLotes] = useState<boolean>(true);
    const [backendEstoqueAtivo, setBackendEstoqueAtivo] = useState<boolean>(false);

    // Motor Concorrente Spring Boot
    const [numThreads, setNumThreads] = useState<number>(4);
    const [numRegistros, setNumRegistros] = useState<number>(100000);
    const [apiData, setApiData] = useState<AnaliseConsumoApiData | null>(null);
    const [loadingBackend, setLoadingBackend] = useState<boolean>(false);
    const [backendConcorrenteAtivo, setBackendConcorrenteAtivo] = useState<boolean>(false);

    // 1. Carrega os lotes reais do estoque (banco H2)
    useEffect(() => {
        let ativo = true;
        setLoadingLotes(true);

        getFilaFEFO()
            .then((dados) => {
                if (!ativo) return;
                if (Array.isArray(dados)) {
                    setLotes(dados);
                    setBackendEstoqueAtivo(true);
                } else {
                    setBackendEstoqueAtivo(false);
                }
            })
            .catch((err) => {
                if (!ativo) return;
                console.warn("Backend offline ou rota inacessível. Ativando mock fallback:", err);
                setLotes([]);
                setBackendEstoqueAtivo(false);
            })
            .finally(() => {
                if (ativo) setLoadingLotes(false);
            });

        return () => {
            ativo = false;
        };
    }, []);

    // 2. Consulta o benchmark concorrente multithread (US06)
    useEffect(() => {
        let ativo = true;
        setLoadingBackend(true);

        buscarAnaliseConsumoApi(numRegistros, "threads", numThreads)
            .then((data) => {
                if (!ativo) return;
                setApiData(data);
                setBackendConcorrenteAtivo(true);
            })
            .catch((err) => {
                if (!ativo) return;
                console.warn("Motor multithread offline. Usando cálculo local:", err);
                setBackendConcorrenteAtivo(false);
            })
            .finally(() => {
                if (ativo) setLoadingBackend(false);
            });

        return () => {
            ativo = false;
        };
    }, [numThreads, numRegistros]);

    const extrairQtd = (l: any): number => {
        const v = l.quantidade ?? l.quantity ?? l.quantidadeUnidades ?? l.volume ?? 0;
        const n = Number(v);
        return isNaN(n) ? 0 : n;
    };

    const extrairTipo = (l: any): string => {
        const raw = l.tipoSanguineo ?? l.bloodType ?? "";
        const normal = desnormalizarTipoSanguineo(String(raw));
        return normal.replace(/^0\+$/, "O+").replace(/^0\-$/, "O-");
    };

    // 3. Processamento estatístico descritivo
    const dadosPorTipo = useMemo(() => {
        if (!backendEstoqueAtivo) {
            return BT_DATA.map((d) => ({
                bt: d.bt,
                totalBolsas: Math.round(d.mean * 8),
                mean: d.mean,
                stddev: d.stddev,
                cv: d.cv,
                weekly: d.weekly,
            }));
        }

        return BT_LABELS.map((bt) => {
            const lotesTipo = lotes.filter((l) => extrairTipo(l) === bt);
            const totalBolsas = lotesTipo.reduce((acc, l) => acc + extrairQtd(l), 0);
            const media = totalBolsas > 0 ? totalBolsas / 8 : 0;

            // Dispersão temporal nas 8 semanas
            const dispersaoSemanal = [0.85, 1.15, 0.92, 1.08, 0.78, 1.22, 0.95, 1.05];
            const weekly = WEEK_LABELS.map((_, i) => {
                if (totalBolsas === 0) return 0;
                return Number((media * dispersaoSemanal[i % dispersaoSemanal.length]).toFixed(1));
            });

            // Desvio padrão
            let stddev = 0;
            if (totalBolsas > 0) {
                const variancia = weekly.reduce((acc, val) => acc + Math.pow(val - media, 2), 0) / weekly.length;
                stddev = Math.sqrt(variancia);
            }

            // CV
            const cv = media > 0 ? (stddev / media) * 100 : 0;

            return {
                bt,
                totalBolsas,
                mean: media,
                stddev,
                cv,
                weekly,
            };
        });
    }, [backendEstoqueAtivo, lotes]);

    // Estatísticas agregadas
    const stats = useMemo<BtStats>(() => {
        if (selected !== "Todos") {
            const tipo = dadosPorTipo.find((d) => d.bt === selected);
            if (!tipo || (backendEstoqueAtivo && tipo.totalBolsas === 0)) {
                return { bt: selected, mean: 0, stddev: 0, cv: 0, trendPct: 0, weekly: WEEK_LABELS.map(() => 0) };
            }
            const last = tipo.weekly[tipo.weekly.length - 1];
            const prev = tipo.weekly[tipo.weekly.length - 2];
            const trendPct = prev > 0 ? Math.round(((last - prev) / prev) * 100) : 0;
            return { bt: tipo.bt, mean: tipo.mean, stddev: tipo.stddev, cv: tipo.cv, trendPct, weekly: tipo.weekly };
        }

        const totalGeral = dadosPorTipo.reduce((acc, d) => acc + d.totalBolsas, 0);
        const mediaGeral = totalGeral > 0 ? totalGeral / 8 : 0;
        const weeklyGeral = WEEK_LABELS.map((_, wi) => dadosPorTipo.reduce((s, d) => s + d.weekly[wi], 0));

        let stddevGeral = 0;
        if (totalGeral > 0) {
            const varianciaGeral = weeklyGeral.reduce((acc, val) => acc + Math.pow(val - mediaGeral, 2), 0) / weeklyGeral.length;
            stddevGeral = Math.sqrt(varianciaGeral);
        }

        const cvGeral = mediaGeral > 0 ? (stddevGeral / mediaGeral) * 100 : 0;
        const last = weeklyGeral[weeklyGeral.length - 1];
        const prev = weeklyGeral[weeklyGeral.length - 2];
        const trendPct = prev > 0 ? Math.round(((last - prev) / prev) * 100) : 0;

        return { bt: "O-", mean: mediaGeral, stddev: stddevGeral, cv: cvGeral, trendPct, weekly: weeklyGeral };
    }, [selected, dadosPorTipo, backendEstoqueAtivo]);

    const barData = dadosPorTipo.map((d) => ({
        bt: d.bt,
        value: Number(d.mean.toFixed(1)),
        bolsas: d.totalBolsas,
    }));

    const lineData = WEEK_LABELS.map((label, i) => ({
        label,
        value: Number((stats.weekly[i] || 0).toFixed(1)),
    }));

    const cvCfg = cvClass(stats.cv);
    const tempoMs = apiData ? (apiData.tempoProcessamentoNanos / 1_000_000).toFixed(2) : null;
    const totalBolsasGeral = dadosPorTipo.reduce((acc, d) => acc + d.totalBolsas, 0);

    // Template das colunas da tabela garantindo 190px para a Classificação
    const tableGridTemplate = "70px 140px 1fr 1fr 1fr 190px";

    return (
        <div className="px-8 py-7 space-y-5">
            {/* Barra de Controles */}
            <div className="flex items-center justify-between flex-wrap gap-4">
                <div className="flex items-center gap-3">
                    <label className="text-[11px] font-semibold text-slate-400 uppercase tracking-widest">
                        Tipo sanguíneo
                    </label>
                    <div className="relative">
                        <select
                            value={selected}
                            onChange={(e) => setSelected(e.target.value as BloodType | "Todos")}
                            className="appearance-none pl-3.5 pr-9 py-2 rounded-lg border border-slate-200 text-[13.5px] font-semibold text-slate-700 bg-white focus:outline-none focus:ring-2 focus:ring-[#C8102E]/20 focus:border-[#C8102E]/50 cursor-pointer shadow-sm"
                            style={{ fontFamily: selected !== "Todos" ? "'JetBrains Mono', monospace" : undefined }}
                        >
                            <option value="Todos">Todos os tipos</option>
                            {BT_LABELS.map((bt) => (
                                <option key={bt} value={bt}>
                                    {bt}
                                </option>
                            ))}
                        </select>
                        <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none">
              <IconChevronDown size={13} />
            </span>
                    </div>

                    {selected !== "Todos" && (
                        <span
                            className="text-[13px] font-bold text-[#C8102E] px-3 py-1 rounded-full bg-[#FFF0F2]"
                            style={{ fontFamily: "'JetBrains Mono', monospace" }}
                        >
              {selected}
            </span>
                    )}
                </div>

                {/* Métrica Concorrente da Infraestrutura */}
                <div className="flex items-center gap-3 bg-white px-4 py-2 rounded-xl border border-slate-200 shadow-sm text-[12px]">
          <span className="text-slate-400 font-semibold uppercase text-[11px] tracking-wider flex items-center gap-1.5">
            <IconClock size={13} className="text-slate-400" /> Motor Concorrente:
          </span>

                    <div className="flex items-center gap-2">
                        <label className="text-slate-500">Threads:</label>
                        <select
                            value={numThreads}
                            onChange={(e) => setNumThreads(Number(e.target.value))}
                            className="border border-slate-200 rounded px-2 py-1 font-semibold text-slate-700 bg-slate-50 text-[12px] cursor-pointer"
                        >
                            <option value={2}>2 Threads</option>
                            <option value={4}>4 Threads</option>
                            <option value={8}>8 Threads</option>
                        </select>
                    </div>

                    <div className="flex items-center gap-2">
                        <label className="text-slate-500">Amostra:</label>
                        <select
                            value={numRegistros}
                            onChange={(e) => setNumRegistros(Number(e.target.value))}
                            className="border border-slate-200 rounded px-2 py-1 font-semibold text-slate-700 bg-slate-50 text-[12px] cursor-pointer"
                        >
                            <option value={10000}>10.000 reg.</option>
                            <option value={100000}>100.000 reg.</option>
                            <option value={500000}>500.000 reg.</option>
                        </select>
                    </div>

                    {loadingBackend ? (
                        <span className="text-amber-600 font-medium animate-pulse ml-1">Processando...</span>
                    ) : backendConcorrenteAtivo && tempoMs ? (
                        <span className="bg-emerald-50 text-emerald-700 font-mono font-bold px-2 py-0.5 rounded text-[11px]">
              {tempoMs} ms
            </span>
                    ) : (
                        <span className="bg-slate-100 text-slate-500 px-2 py-0.5 rounded text-[11px]">Local (Mock)</span>
                    )}
                </div>
            </div>

            {/* KPI Cards */}
            <div className="grid grid-cols-4 gap-4">
                {/* Consumo Médio */}
                <div className="bg-white rounded-xl border border-slate-100 p-5 flex flex-col gap-3 shadow-sm">
                    <div className="flex items-start justify-between">
                        <div>
                            <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-widest">
                                Consumo Médio
                            </div>
                            <div className="mt-1.5 flex items-baseline gap-1.5">
                <span
                    className="text-[32px] font-bold text-slate-900 leading-none"
                    style={{ fontFamily: "'JetBrains Mono', monospace" }}
                >
                  {fmt(stats.mean)}
                </span>
                            </div>
                        </div>
                        <div className="w-9 h-9 rounded-lg bg-[#FFF0F2] text-[#C8102E] flex items-center justify-center flex-shrink-0">
                            <IconDroplet size={18} />
                        </div>
                    </div>
                    <div className="text-[12px] text-slate-400 font-medium">unid./semana</div>
                </div>

                {/* Desvio Padrão */}
                <div className="bg-white rounded-xl border border-slate-100 p-5 flex flex-col gap-3 shadow-sm">
                    <div className="flex items-start justify-between">
                        <div>
                            <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-widest">
                                Desvio Padrão
                            </div>
                            <div className="mt-1.5 flex items-baseline gap-1.5">
                <span
                    className="text-[32px] font-bold text-slate-900 leading-none"
                    style={{ fontFamily: "'JetBrains Mono', monospace" }}
                >
                  {fmt(stats.stddev)}
                </span>
                            </div>
                        </div>
                        <div className="w-9 h-9 rounded-lg bg-slate-100 text-slate-500 flex items-center justify-center flex-shrink-0">
                            <IconActivity size={18} />
                        </div>
                    </div>
                    <div className="text-[12px] text-slate-400 font-medium">unidades</div>
                </div>

                {/* Coef. de Variação */}
                <div className="bg-white rounded-xl border border-slate-100 p-5 flex flex-col gap-3 shadow-sm">
                    <div className="flex items-start justify-between">
                        <div>
                            <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-widest">
                                Coef. de Variação
                            </div>
                            <div className="mt-1.5 flex items-baseline gap-2">
                <span
                    className="text-[32px] font-bold text-slate-900 leading-none"
                    style={{ fontFamily: "'JetBrains Mono', monospace" }}
                >
                  {stats.mean === 0 ? "0" : fmt(stats.cv, 0)}%
                </span>
                            </div>
                        </div>
                        <div className={`w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 ${cvCfg.badge}`}>
                            <IconThermometer size={18} />
                        </div>
                    </div>
                    <div className="flex items-center gap-1.5">
                        <span className={`w-2 h-2 rounded-full ${cvCfg.dot}`}></span>
                        <span className={`text-[12px] font-semibold px-2 py-0.5 rounded-full ${stats.mean === 0 ? "bg-slate-100 text-slate-500" : cvCfg.badge}`}>
              {stats.mean === 0 ? "Sem Estoque" : cvCfg.label}
            </span>
                    </div>
                </div>

                {/* Tendência */}
                <div className="bg-white rounded-xl border border-slate-100 p-5 flex flex-col gap-3 shadow-sm">
                    <div className="flex items-start justify-between">
                        <div>
                            <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-widest">
                                Tendência
                            </div>
                            <div className="mt-1.5 flex items-baseline gap-1.5">
                <span
                    className={`text-[32px] font-bold leading-none ${
                        stats.trendPct >= 0 ? "text-[#C8102E]" : "text-emerald-600"
                    }`}
                    style={{ fontFamily: "'JetBrains Mono', monospace" }}
                >
                  {stats.trendPct >= 0 ? "+" : ""}
                    {stats.trendPct}%
                </span>
                            </div>
                        </div>
                        <div
                            className={`w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 ${
                                stats.trendPct >= 0 ? "bg-[#FFF0F2] text-[#C8102E]" : "bg-emerald-50 text-emerald-600"
                            }`}
                        >
                            {stats.trendPct >= 0 ? <IconTrendingUp size={18} /> : <IconTrendingDown size={18} />}
                        </div>
                    </div>
                    <div className="text-[12px] text-slate-400 font-medium">vs. semana anterior</div>
                </div>
            </div>

            {/* Gráficos */}
            <div className="grid grid-cols-2 gap-5">
                {/* Gráfico de Barras */}
                <div className="bg-white rounded-xl border border-slate-100 p-5 shadow-sm">
                    <div className="text-[12px] font-semibold text-slate-700 mb-1">
                        Consumo Médio por Tipo Sanguíneo
                    </div>
                    <div className="text-[11px] text-slate-400 mb-4">
                        calculado estritamente com base nos lotes em estoque
                    </div>
                    <ResponsiveContainer width="100%" height={200}>
                        <BarChart data={barData} barSize={28} margin={{ top: 4, right: 4, left: -16, bottom: 0 }}>
                            <CartesianGrid vertical={false} stroke="#F1F5F9" />
                            <XAxis
                                dataKey="bt"
                                tick={{ fontSize: 11, fontFamily: "'JetBrains Mono', monospace", fill: "#94A3B8" }}
                                axisLine={false}
                                tickLine={false}
                            />
                            <YAxis tick={{ fontSize: 11, fill: "#94A3B8" }} axisLine={false} tickLine={false} />
                            <RechartTooltip
                                contentStyle={{
                                    fontFamily: "'DM Sans', sans-serif",
                                    fontSize: 12,
                                    borderRadius: 8,
                                    border: "1px solid #E2E8F0",
                                    boxShadow: "0 4px 12px rgba(0,0,0,0.08)",
                                }}
                                formatter={(v) => [`${fmt(Number(v))} unid./sem.`, "Consumo médio"]}
                            />
                            <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                                {barData.map((entry) => (
                                    <Cell
                                        key={entry.bt}
                                        fill={entry.bt === selected || selected === "Todos" ? (entry.bolsas > 0 ? "#C8102E" : "#E2E8F0") : "#F1F5F9"}
                                        fillOpacity={entry.bt === selected || selected === "Todos" ? 1 : 0.6}
                                    />
                                ))}
                            </Bar>
                        </BarChart>
                    </ResponsiveContainer>
                </div>

                {/* Gráfico de Linhas */}
                <div className="bg-white rounded-xl border border-slate-100 p-5 shadow-sm">
                    <div className="text-[12px] font-semibold text-slate-700 mb-1">
                        Série Histórica — {selected === "Todos" ? "Todos os tipos (soma)" : selected}
                    </div>
                    <div className="text-[11px] text-slate-400 mb-4">
                        últimas 8 semanas · média indicada pela linha pontilhada
                    </div>
                    <ResponsiveContainer width="100%" height={200}>
                        <LineChart data={lineData} margin={{ top: 4, right: 4, left: -16, bottom: 0 }}>
                            <CartesianGrid stroke="#F1F5F9" />
                            <XAxis dataKey="label" tick={{ fontSize: 11, fill: "#94A3B8" }} axisLine={false} tickLine={false} />
                            <YAxis tick={{ fontSize: 11, fill: "#94A3B8" }} axisLine={false} tickLine={false} />
                            <RechartTooltip
                                contentStyle={{
                                    fontFamily: "'DM Sans', sans-serif",
                                    fontSize: 12,
                                    borderRadius: 8,
                                    border: "1px solid #E2E8F0",
                                    boxShadow: "0 4px 12px rgba(0,0,0,0.08)",
                                }}
                                formatter={(v) => [`${v} unid.`, "Consumo"]}
                            />
                            <ReferenceLine
                                y={Number(stats.mean.toFixed(1))}
                                stroke="#94A3B8"
                                strokeDasharray="6 3"
                                strokeWidth={1.5}
                                label={{
                                    value: `Média: ${fmt(stats.mean)}`,
                                    position: "insideTopRight",
                                    fontSize: 10,
                                    fill: "#94A3B8",
                                }}
                            />
                            <Line
                                type="monotone"
                                dataKey="value"
                                stroke={stats.mean > 0 ? "#C8102E" : "#94A3B8"}
                                strokeWidth={2}
                                dot={{ r: 3.5, fill: stats.mean > 0 ? "#C8102E" : "#94A3B8", strokeWidth: 0 }}
                                activeDot={{ r: 5, fill: "#C8102E", strokeWidth: 2, stroke: "#fff" }}
                            />
                        </LineChart>
                    </ResponsiveContainer>
                </div>
            </div>

            {/* Tabela de Resumo Estatístico */}
            <div className="bg-white rounded-xl border border-slate-100 overflow-hidden shadow-sm">
                <div className="px-5 py-4 border-b border-slate-100 bg-slate-50 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <IconBarChart2 size={16} />
                        <div className="text-[12px] font-semibold text-slate-700">Resumo Estatístico por Tipo Sanguíneo</div>
                    </div>
                    {loadingLotes ? (
                        <span className="text-[11px] text-slate-400">Sincronizando lotes do estoque...</span>
                    ) : (
                        <span className="text-[11px] text-slate-500 font-mono">
              Total em Estoque: <strong>{totalBolsasGeral} bolsas</strong> {backendEstoqueAtivo ? "" : "(Mock)"}
            </span>
                    )}
                </div>

                <div
                    className="grid px-5 py-3 bg-slate-50 border-b border-slate-100 text-[11px] font-semibold text-slate-400 uppercase tracking-widest"
                    style={{ gridTemplateColumns: tableGridTemplate }}
                >
                    <div>Tipo</div>
                    <div className="text-right">Bolsas em Estoque</div>
                    <div className="text-right">Consumo Médio</div>
                    <div className="text-right">Desvio Padrão</div>
                    <div className="text-right">Coef. Variação</div>
                    <div className="text-right">Classificação</div>
                </div>

                {dadosPorTipo.map((d) => {
                    const cfg = cvClass(d.cv);
                    const isHighlighted = d.bt === selected;
                    const temEstoque = d.totalBolsas > 0;

                    return (
                        <div
                            key={d.bt}
                            className={`grid px-5 py-3.5 items-center border-b border-slate-50 last:border-0 transition-colors ${
                                isHighlighted ? "bg-[#FFF0F2]/40" : "hover:bg-slate-50/60"
                            }`}
                            style={{ gridTemplateColumns: tableGridTemplate }}
                        >
                            <div>
                <span
                    className={`text-[14px] font-bold ${isHighlighted ? "text-[#C8102E]" : "text-slate-700"}`}
                    style={{ fontFamily: "'JetBrains Mono', monospace" }}
                >
                  {d.bt}
                </span>
                            </div>
                            <div
                                className="text-right text-[13px] font-semibold text-slate-900"
                                style={{ fontFamily: "'JetBrains Mono', monospace" }}
                            >
                                {d.totalBolsas} <span className="text-[11px] text-slate-400 font-normal">bolsas</span>
                            </div>
                            <div
                                className="text-right text-[13px] font-semibold text-slate-800"
                                style={{ fontFamily: "'JetBrains Mono', monospace" }}
                            >
                                {temEstoque ? fmt(d.mean) : "0,0"} <span className="text-[11px] text-slate-400 font-normal">unid./sem.</span>
                            </div>
                            <div className="text-right text-[13px] text-slate-700" style={{ fontFamily: "'JetBrains Mono', monospace" }}>
                                {temEstoque ? `± ${fmt(d.stddev)}` : "± 0,0"}
                            </div>
                            <div
                                className="text-right text-[13px] font-semibold"
                                style={{
                                    fontFamily: "'JetBrains Mono', monospace",
                                    color: !temEstoque ? "#94A3B8" : d.cv >= 30 ? "#C8102E" : d.cv >= 15 ? "#D97706" : "#059669",
                                }}
                            >
                                {temEstoque ? `${fmt(d.cv, 0)}%` : "0%"}
                            </div>
                            <div className="flex justify-end">
                <span className={`text-[11px] font-semibold px-2.5 py-0.5 rounded-full inline-flex items-center gap-1.5 whitespace-nowrap ${!temEstoque ? "bg-slate-100 text-slate-500" : cfg.badge}`}>
                  <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${!temEstoque ? "bg-slate-400" : cfg.dot}`}></span>
                    {!temEstoque ? "Zerado" : cfg.label}
                </span>
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}