// Tela de Painéis (EST)
// Evolução dos indicadores da U1 para painéis de ESTOQUE e DEMANDA do Código Vermelho.
// Disciplina: Estatística (EST). Foco: análise dos dados operacionais do sistema.
//
// Fontes de dados:
//   • Estoque  → lotes da Fila FEFO        (GET /api/v1/lotes/fila-fefo  · fallback DEMO_LOTES)
//   • Demanda  → requisições hospitalares  (GET /api/v1/requisicoes      · fallback DEMO_REQUISICOES)
//   • Rede     → instituições + estoque mínimo (GET /api/v1/instituicoes · fallback institutionsData)
//
// Todos os cálculos são feitos no cliente a partir desses dados, sem valores "hard-coded".
// O bloco "Validação e Consistência" reconcilia as agregações (soma por tipo = soma por
// componente = soma por instituição = total) para evidenciar a corretude dos indicadores.

import { useState, useMemo, useEffect } from "react";
import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid, ResponsiveContainer, Cell,
    PieChart, Pie, Legend, Tooltip as RechartTooltip,
} from "recharts";
import {
    IconActivity, IconAlertTriangle, IconBarChart2, IconBuilding, IconCheck,
    IconClipboard, IconClock, IconDroplet, IconPackage, IconThermometer,
    IconTrendingDown, IconTrendingUp, IconX,
} from "@/components/icons";
import {
    BT_LABELS, LOTE_COMPONENTS, DEMO_LOTES, DEMO_REQUISICOES, institutionsData,
    daysUntil, fmt,
} from "@/data/mockData";
import {
    getFilaFEFO, getInstituicoes, buscarRequisicoesApi,
    desnormalizarTipoSanguineo, desnormalizarComponente,
} from "@/data/api";

// ─── Paletas ────────────────────────────────────────────────────────────────
const RED = "#C8102E";
const COMPONENT_COLOR: Record<string, string> = {
    "Concentrado de Hemácias": "#C8102E",
    "Plasma": "#F59E0B",
    "Plaquetas": "#3B82F6",
    "Crioprecipitado": "#10B981",
};
const URGENCIA_CFG: Record<string, { label: string; color: string }> = {
    emergencia: { label: "Emergência", color: "#C8102E" },
    prioritaria: { label: "Prioritária", color: "#F59E0B" },
    rotina: { label: "Rotina", color: "#10B981" },
    outros: { label: "Outros", color: "#94A3B8" },
};
const STATUS_CFG: Record<string, { label: string; color: string }> = {
    pendente: { label: "Pendente", color: "#F59E0B" },
    em_analise: { label: "Em análise", color: "#3B82F6" },
    aprovada: { label: "Aprovada", color: "#10B981" },
    negada: { label: "Negada", color: "#94A3B8" },
    outros: { label: "Outros", color: "#CBD5E1" },
};

// Faixas de validade (em dias até o vencimento)
const FAIXAS_VALIDADE = [
    { id: "vencido", label: "Vencido", color: "#94A3B8", test: (d: number) => d < 0 },
    { id: "critico", label: "Crítico (≤ 3 dias)", color: "#C8102E", test: (d: number) => d >= 0 && d <= 3 },
    { id: "atencao", label: "Atenção (4–7 dias)", color: "#F59E0B", test: (d: number) => d > 3 && d <= 7 },
    { id: "proximo", label: "Próximo (8–30 dias)", color: "#3B82F6", test: (d: number) => d > 7 && d <= 30 },
    { id: "saudavel", label: "Saudável (> 30 dias)", color: "#10B981", test: (d: number) => d > 30 },
];

// ─── Extratores robustos (aceitam formato PT do backend ou EN do mock) ────────
function qtd(x: any): number {
    const v = x?.quantidade ?? x?.quantity ?? x?.quantidadeUnidades ?? x?.volume ?? 0;
    const n = Number(v);
    return isNaN(n) ? 0 : n;
}
function tipoSangue(x: any): string {
    const raw = x?.tipoSanguineo ?? x?.bloodType ?? "";
    const n = desnormalizarTipoSanguineo(String(raw)).toUpperCase().replace(/^0/, "O");
    return BT_LABELS.includes(n as any) ? n : n;
}
function componente(x: any): string {
    const raw = x?.componente ?? x?.component ?? "";
    return desnormalizarComponente(String(raw));
}
function nomeInst(x: any): string {
    return String(
        x?.instName ?? x?.instituicaoNome ?? x?.instituicaoSolicitanteNome ??
        x?.instituicaoOrigemNome ?? "Instituição",
    );
}
function validade(x: any): string {
    return String(x?.expiryDate ?? x?.dataValidade ?? x?.validade ?? "");
}
function normUrgencia(x: any): string {
    const raw = String(x?.urgency ?? x?.urgencia ?? "").toLowerCase();
    if (raw.includes("emerg")) return "emergencia";
    if (raw.includes("priorit") || raw === "alta") return "prioritaria";
    if (raw.includes("rotina") || raw === "baixa") return "rotina";
    return "outros";
}
function normStatus(x: any): string {
    const raw = String(x?.status ?? "").toLowerCase().replace(/\s|á/g, (m) => (m === "á" ? "a" : "_"));
    if (raw.includes("pend")) return "pendente";
    if (raw.includes("analise") || raw.includes("análise")) return "em_analise";
    if (raw.includes("aprov") || raw.includes("atend") || raw.includes("entreg")) return "aprovada";
    if (raw.includes("negad") || raw.includes("recus")) return "negada";
    return "outros";
}

// ─── Card de KPI ──────────────────────────────────────────────────────────────
function Kpi({ label, value, unit, sub, icon, color, bg, subColor }: {
    label: string; value: string; unit?: string; sub?: string;
    icon: React.ReactNode; color: string; bg: string; subColor?: string;
}) {
    return (
        <div className="bg-white rounded-xl border border-slate-100 p-5 flex flex-col gap-3 shadow-sm">
            <div className="flex items-start justify-between">
                <div>
                    <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-widest">{label}</div>
                    <div className="mt-1.5 flex items-baseline gap-1.5">
                        <span className="text-[30px] font-bold text-slate-900 leading-none" style={{ fontFamily: "'JetBrains Mono', monospace" }}>{value}</span>
                        {unit && <span className="text-[13px] text-slate-400 font-medium">{unit}</span>}
                    </div>
                </div>
                <div className={`w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 ${bg} ${color}`}>{icon}</div>
            </div>
            {sub && <div className={`text-[12px] font-medium ${subColor || "text-slate-400"}`}>{sub}</div>}
        </div>
    );
}

function SectionTitle({ icon, title, hint }: { icon: React.ReactNode; title: string; hint?: string }) {
    return (
        <div className="flex items-center gap-2.5 pt-1">
            <span className="text-[#C8102E]">{icon}</span>
            <h2 className="text-[15px] font-bold text-slate-800">{title}</h2>
            {hint && <span className="text-[11px] text-slate-400 font-medium">· {hint}</span>}
        </div>
    );
}

const tooltipStyle = {
    fontFamily: "'DM Sans', sans-serif", fontSize: 12, borderRadius: 8,
    border: "1px solid #E2E8F0", boxShadow: "0 4px 12px rgba(0,0,0,0.08)",
};

export default function PaineisEstoqueDemandaScreen() {
    const [lotes, setLotes] = useState<any[]>(DEMO_LOTES);
    const [requisicoes, setRequisicoes] = useState<any[]>(DEMO_REQUISICOES);
    const [instituicoes, setInstituicoes] = useState<any[]>(institutionsData);
    const [backendEstoque, setBackendEstoque] = useState(false);
    const [backendDemanda, setBackendDemanda] = useState(false);
    const [filtroComp, setFiltroComp] = useState<string>("Todos");

    // 1. Estoque (Fila FEFO)
    useEffect(() => {
        let ativo = true;
        getFilaFEFO()
            .then((d) => { if (ativo && Array.isArray(d) && d.length) { setLotes(d); setBackendEstoque(true); } })
            .catch(() => { if (ativo) { setLotes(DEMO_LOTES); setBackendEstoque(false); } });
        return () => { ativo = false; };
    }, []);

    // 2. Demanda (Requisições)
    useEffect(() => {
        let ativo = true;
        buscarRequisicoesApi()
            .then((d) => { if (ativo && Array.isArray(d) && d.length) { setRequisicoes(d); setBackendDemanda(true); } })
            .catch(() => { if (ativo) { setRequisicoes(DEMO_REQUISICOES); setBackendDemanda(false); } });
        return () => { ativo = false; };
    }, []);

    // 3. Instituições (estoque mínimo)
    useEffect(() => {
        let ativo = true;
        getInstituicoes()
            .then((d) => { if (ativo && Array.isArray(d) && d.length) setInstituicoes(d); })
            .catch(() => { if (ativo) setInstituicoes(institutionsData); });
        return () => { ativo = false; };
    }, []);

    const backendAtivo = backendEstoque || backendDemanda;

    // ─── INDICADORES DE ESTOQUE ──────────────────────────────────────────────
    const estoque = useMemo(() => {
        const totalUnidades = lotes.reduce((s, l) => s + qtd(l), 0);

        const porTipo = BT_LABELS.map((bt) => ({
            bt,
            unidades: lotes.filter((l) => tipoSangue(l) === bt).reduce((s, l) => s + qtd(l), 0),
        }));

        const compMap = new Map<string, number>();
        LOTE_COMPONENTS.forEach((c) => compMap.set(c, 0));
        lotes.forEach((l) => {
            const c = componente(l) || "Outros";
            compMap.set(c, (compMap.get(c) || 0) + qtd(l));
        });
        const porComponente = [...compMap.entries()]
            .map(([name, value]) => ({ name, value })).filter((x) => x.value > 0);

        const instMap = new Map<string, number>();
        lotes.forEach((l) => {
            const n = nomeInst(l);
            instMap.set(n, (instMap.get(n) || 0) + qtd(l));
        });
        const porInstituicao = [...instMap.entries()]
            .map(([name, unidades]) => ({ name, unidades }))
            .sort((a, b) => b.unidades - a.unidades);

        // Distribuição por faixa de validade
        const faixas = FAIXAS_VALIDADE.map((f) => ({ ...f, unidades: 0, lotes: 0 }));
        lotes.forEach((l) => {
            const v = validade(l);
            if (!v) return;
            const d = daysUntil(v);
            const faixa = faixas.find((f) => f.test(d));
            if (faixa) { faixa.unidades += qtd(l); faixa.lotes += 1; }
        });

        // Estoque mínimo agregado da rede por tipo (soma do minStock de cada instituição)
        const minPorTipo: Record<string, number> = {};
        BT_LABELS.forEach((bt) => (minPorTipo[bt] = 0));
        instituicoes.forEach((i) => {
            const ms = i?.minStock || i?.estoqueMinimo || {};
            Object.entries(ms).forEach(([tipoRaw, val]) => {
                const t = desnormalizarTipoSanguineo(String(tipoRaw));
                if (minPorTipo[t] !== undefined) minPorTipo[t] += Number(val) || 0;
            });
        });
        const cobertura = BT_LABELS.map((bt) => {
            const atual = porTipo.find((p) => p.bt === bt)?.unidades || 0;
            const minimo = minPorTipo[bt] || 0;
            const deficit = Math.max(0, minimo - atual);
            return { bt, atual, minimo, deficit, abaixo: minimo > 0 && atual < minimo };
        });
        const tiposAbaixoMin = cobertura.filter((c) => c.abaixo);
        const criticosValidade = faixas.filter((f) => f.id === "vencido" || f.id === "critico")
            .reduce((s, f) => s + f.unidades, 0);

        return {
            totalUnidades, totalLotes: lotes.length,
            tiposComEstoque: porTipo.filter((p) => p.unidades > 0).length,
            porTipo, porComponente, porInstituicao, faixas,
            cobertura, minPorTipo, tiposAbaixoMin, criticosValidade,
        };
    }, [lotes, instituicoes]);

    // ─── INDICADORES DE DEMANDA ──────────────────────────────────────────────
    const demanda = useMemo(() => {
        const totalUnidades = requisicoes.reduce((s, r) => s + qtd(r), 0);
        const totalReq = requisicoes.length;

        const porTipo = BT_LABELS.map((bt) => ({
            bt,
            unidades: requisicoes.filter((r) => tipoSangue(r) === bt).reduce((s, r) => s + qtd(r), 0),
            reqs: requisicoes.filter((r) => tipoSangue(r) === bt).length,
        }));

        const urgMap = new Map<string, number>();
        requisicoes.forEach((r) => {
            const u = normUrgencia(r);
            urgMap.set(u, (urgMap.get(u) || 0) + 1);
        });
        const porUrgencia = ["emergencia", "prioritaria", "rotina", "outros"]
            .map((k) => ({ key: k, name: URGENCIA_CFG[k].label, value: urgMap.get(k) || 0, color: URGENCIA_CFG[k].color }))
            .filter((x) => x.value > 0);

        const stMap = new Map<string, number>();
        requisicoes.forEach((r) => {
            const s = normStatus(r);
            stMap.set(s, (stMap.get(s) || 0) + 1);
        });
        const porStatus = ["pendente", "em_analise", "aprovada", "negada", "outros"]
            .map((k) => ({ key: k, name: STATUS_CFG[k].label, value: stMap.get(k) || 0, color: STATUS_CFG[k].color }))
            .filter((x) => x.value > 0);

        const aprovadas = stMap.get("aprovada") || 0;
        const taxaAtendimento = totalReq > 0 ? (aprovadas / totalReq) * 100 : 0;
        const emergencias = urgMap.get("emergencia") || 0;

        return { totalUnidades, totalReq, porTipo, porUrgencia, porStatus, taxaAtendimento, aprovadas, emergencias };
    }, [requisicoes]);

    // ─── ESTOQUE × DEMANDA ───────────────────────────────────────────────────
    const cruzamento = useMemo(() => {
        const linhas = BT_LABELS.map((bt) => {
            const est = estoque.porTipo.find((p) => p.bt === bt)?.unidades || 0;
            const dem = demanda.porTipo.find((p) => p.bt === bt)?.unidades || 0;
            const cobertura = dem > 0 ? (est / dem) : (est > 0 ? Infinity : 0);
            let sit: "deficit" | "ajustado" | "folga" | "neutro";
            if (dem === 0) sit = est > 0 ? "folga" : "neutro";
            else if (est < dem) sit = "deficit";
            else if (cobertura <= 1.5) sit = "ajustado";
            else sit = "folga";
            return { bt, est, dem, cobertura, sit };
        });
        const coberturaGlobal = demanda.totalUnidades > 0
            ? estoque.totalUnidades / demanda.totalUnidades : 0;
        const deficits = linhas.filter((l) => l.sit === "deficit");
        return { linhas, coberturaGlobal, deficits };
    }, [estoque, demanda]);

    // ─── VALIDAÇÃO / CONSISTÊNCIA ────────────────────────────────────────────
    const checks = useMemo(() => {
        const somaTipo = estoque.porTipo.reduce((s, p) => s + p.unidades, 0);
        const somaComp = estoque.porComponente.reduce((s, p) => s + p.value, 0);
        const somaInst = estoque.porInstituicao.reduce((s, p) => s + p.unidades, 0);
        const somaFaixa = estoque.faixas.reduce((s, f) => s + f.unidades, 0);
        const somaDemTipo = demanda.porTipo.reduce((s, p) => s + p.unidades, 0);
        const somaStatus = demanda.porStatus.reduce((s, p) => s + p.value, 0);
        return [
            { label: "Σ estoque por tipo sanguíneo = estoque total", a: somaTipo, b: estoque.totalUnidades, ok: somaTipo === estoque.totalUnidades },
            { label: "Σ estoque por componente = estoque total", a: somaComp, b: estoque.totalUnidades, ok: somaComp === estoque.totalUnidades },
            { label: "Σ estoque por instituição = estoque total", a: somaInst, b: estoque.totalUnidades, ok: somaInst === estoque.totalUnidades },
            { label: "Σ unidades por faixa de validade = estoque total", a: somaFaixa, b: estoque.totalUnidades, ok: somaFaixa === estoque.totalUnidades },
            { label: "Σ demanda por tipo sanguíneo = demanda total", a: somaDemTipo, b: demanda.totalUnidades, ok: somaDemTipo === demanda.totalUnidades },
            { label: "Σ requisições por status = nº de requisições", a: somaStatus, b: demanda.totalReq, ok: somaStatus === demanda.totalReq },
        ];
    }, [estoque, demanda]);

    // Dados do gráfico "estoque por tipo" respeitando o filtro de componente
    const barEstoqueTipo = useMemo(() => {
        if (filtroComp === "Todos") return estoque.porTipo;
        return BT_LABELS.map((bt) => ({
            bt,
            unidades: lotes
                .filter((l) => tipoSangue(l) === bt && componente(l) === filtroComp)
                .reduce((s, l) => s + qtd(l), 0),
        }));
    }, [estoque.porTipo, filtroComp, lotes]);

    const maxTipo = Math.max(1, ...estoque.porTipo.map((p) => p.unidades), ...demanda.porTipo.map((p) => p.unidades));

    return (
        <div className="px-8 py-7 space-y-6">
            {/* Barra de contexto / fonte de dados */}
            <div className="flex items-center justify-between flex-wrap gap-3">
                <p className="text-[13px] text-slate-500 max-w-2xl leading-snug">
                    Evolução dos indicadores da U1 em painéis operacionais de{" "}
                    <strong className="text-slate-700">estoque</strong> e{" "}
                    <strong className="text-slate-700">demanda</strong>. Todos os valores são
                    calculados a partir dos lotes em estoque e das requisições hospitalares.
                </p>
                <span className={`text-[11px] font-semibold px-3 py-1.5 rounded-full inline-flex items-center gap-1.5 ${
                    backendAtivo ? "bg-emerald-50 text-emerald-700" : "bg-slate-100 text-slate-500"
                }`}>
                    <span className={`w-1.5 h-1.5 rounded-full ${backendAtivo ? "bg-emerald-500" : "bg-slate-400"}`} />
                    {backendAtivo ? "Dados do backend" : "Dados de demonstração"}
                </span>
            </div>

            {/* KPIs gerais */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <Kpi label="Estoque Total" value={String(estoque.totalUnidades)} unit="unidades"
                     sub={`${estoque.totalLotes} lotes · ${estoque.tiposComEstoque}/8 tipos com estoque`}
                     icon={<IconDroplet size={18} />} color="text-[#C8102E]" bg="bg-[#FFF0F2]" />
                <Kpi label="Demanda Total" value={String(demanda.totalUnidades)} unit="unidades"
                     sub={`${demanda.totalReq} requisições registradas`}
                     icon={<IconClipboard size={18} />} color="text-blue-600" bg="bg-blue-50" />
                <Kpi label="Cobertura Global" value={demanda.totalUnidades > 0 ? `${fmt(cruzamento.coberturaGlobal)}×` : "—"}
                     sub={cruzamento.deficits.length > 0
                         ? `${cruzamento.deficits.length} tipo(s) com déficit`
                         : "Estoque cobre a demanda atual"}
                     subColor={cruzamento.deficits.length > 0 ? "text-[#C8102E]" : "text-emerald-600"}
                     icon={cruzamento.coberturaGlobal >= 1 ? <IconTrendingUp size={18} /> : <IconTrendingDown size={18} />}
                     color={cruzamento.coberturaGlobal >= 1 ? "text-emerald-600" : "text-[#C8102E]"}
                     bg={cruzamento.coberturaGlobal >= 1 ? "bg-emerald-50" : "bg-[#FFF0F2]"} />
                <Kpi label="Risco de Perda" value={String(estoque.criticosValidade)} unit="unid."
                     sub="Vencidas ou a vencer em ≤ 3 dias"
                     subColor={estoque.criticosValidade > 0 ? "text-amber-600" : "text-emerald-600"}
                     icon={<IconClock size={18} />}
                     color={estoque.criticosValidade > 0 ? "text-amber-600" : "text-emerald-600"}
                     bg={estoque.criticosValidade > 0 ? "bg-amber-50" : "bg-emerald-50"} />
            </div>

            {/* ══════════════ PAINEL DE ESTOQUE ══════════════ */}
            <SectionTitle icon={<IconPackage size={18} />} title="Painel de Estoque" hint="disponibilidade, composição e validade" />

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
                {/* Estoque por tipo sanguíneo (com filtro de componente) */}
                <div className="bg-white rounded-xl border border-slate-100 p-5 shadow-sm">
                    <div className="flex items-center justify-between mb-1">
                        <div className="text-[12px] font-semibold text-slate-700">Estoque por Tipo Sanguíneo</div>
                        <select
                            value={filtroComp}
                            onChange={(e) => setFiltroComp(e.target.value)}
                            className="text-[11px] border border-slate-200 rounded-lg px-2 py-1 font-medium text-slate-600 bg-slate-50 cursor-pointer focus:outline-none"
                        >
                            <option value="Todos">Todos os componentes</option>
                            {LOTE_COMPONENTS.map((c) => <option key={c} value={c}>{c}</option>)}
                        </select>
                    </div>
                    <div className="text-[11px] text-slate-400 mb-3">unidades disponíveis em estoque</div>
                    <ResponsiveContainer width="100%" height={210}>
                        <BarChart data={barEstoqueTipo} barSize={26} margin={{ top: 4, right: 4, left: -18, bottom: 0 }}>
                            <CartesianGrid vertical={false} stroke="#F1F5F9" />
                            <XAxis dataKey="bt" tick={{ fontSize: 11, fontFamily: "'JetBrains Mono', monospace", fill: "#94A3B8" }} axisLine={false} tickLine={false} />
                            <YAxis tick={{ fontSize: 11, fill: "#94A3B8" }} axisLine={false} tickLine={false} />
                            <RechartTooltip contentStyle={tooltipStyle} formatter={(v) => [`${v} unid.`, "Estoque"]} />
                            <Bar dataKey="unidades" radius={[4, 4, 0, 0]}>
                                {barEstoqueTipo.map((e) => <Cell key={e.bt} fill={e.unidades > 0 ? RED : "#E2E8F0"} />)}
                            </Bar>
                        </BarChart>
                    </ResponsiveContainer>
                </div>

                {/* Estoque por componente (donut) */}
                <div className="bg-white rounded-xl border border-slate-100 p-5 shadow-sm">
                    <div className="text-[12px] font-semibold text-slate-700 mb-1">Composição por Componente</div>
                    <div className="text-[11px] text-slate-400 mb-3">participação de cada hemocomponente no estoque</div>
                    {estoque.porComponente.length === 0 ? (
                        <div className="h-[210px] flex items-center justify-center text-[12px] text-slate-400">Sem lotes em estoque.</div>
                    ) : (
                        <ResponsiveContainer width="100%" height={210}>
                            <PieChart>
                                <Pie data={estoque.porComponente} dataKey="value" nameKey="name" cx="42%" cy="50%" innerRadius={48} outerRadius={78} paddingAngle={2}>
                                    {estoque.porComponente.map((e) => <Cell key={e.name} fill={COMPONENT_COLOR[e.name] || "#94A3B8"} />)}
                                </Pie>
                                <RechartTooltip contentStyle={tooltipStyle} formatter={(v: any, n: any) => [`${v} unid.`, n]} />
                                <Legend layout="vertical" align="right" verticalAlign="middle" iconType="circle" wrapperStyle={{ fontSize: 11 }} />
                            </PieChart>
                        </ResponsiveContainer>
                    )}
                </div>

                {/* Estoque por instituição */}
                <div className="bg-white rounded-xl border border-slate-100 p-5 shadow-sm">
                    <div className="text-[12px] font-semibold text-slate-700 mb-1">Estoque por Instituição</div>
                    <div className="text-[11px] text-slate-400 mb-3">distribuição das unidades pela rede</div>
                    <ResponsiveContainer width="100%" height={210}>
                        <BarChart layout="vertical" data={estoque.porInstituicao} margin={{ top: 0, right: 16, left: 8, bottom: 0 }}>
                            <CartesianGrid horizontal={false} stroke="#F1F5F9" />
                            <XAxis type="number" tick={{ fontSize: 11, fill: "#94A3B8" }} axisLine={false} tickLine={false} />
                            <YAxis type="category" dataKey="name" width={140} tick={{ fontSize: 10.5, fill: "#64748B" }} axisLine={false} tickLine={false}
                                   tickFormatter={(v: string) => (v.length > 22 ? v.slice(0, 21) + "…" : v)} />
                            <RechartTooltip contentStyle={tooltipStyle} formatter={(v) => [`${v} unid.`, "Estoque"]} />
                            <Bar dataKey="unidades" radius={[0, 4, 4, 0]} fill="#3B82F6" barSize={18} />
                        </BarChart>
                    </ResponsiveContainer>
                </div>

                {/* Validade */}
                <div className="bg-white rounded-xl border border-slate-100 p-5 shadow-sm">
                    <div className="text-[12px] font-semibold text-slate-700 mb-1">Unidades por Faixa de Validade</div>
                    <div className="text-[11px] text-slate-400 mb-3">priorização para reduzir perdas (apoio ao FEFO)</div>
                    <ResponsiveContainer width="100%" height={210}>
                        <BarChart data={estoque.faixas} barSize={30} margin={{ top: 4, right: 4, left: -18, bottom: 0 }}>
                            <CartesianGrid vertical={false} stroke="#F1F5F9" />
                            <XAxis dataKey="label" tick={{ fontSize: 9.5, fill: "#94A3B8" }} axisLine={false} tickLine={false} interval={0}
                                   tickFormatter={(v: string) => v.split(" (")[0]} />
                            <YAxis tick={{ fontSize: 11, fill: "#94A3B8" }} axisLine={false} tickLine={false} />
                            <RechartTooltip contentStyle={tooltipStyle} formatter={(v: any, _n: any, p: any) => [`${v} unid. · ${p?.payload?.lotes} lote(s)`, p?.payload?.label]} />
                            <Bar dataKey="unidades" radius={[4, 4, 0, 0]}>
                                {estoque.faixas.map((f) => <Cell key={f.id} fill={f.color} />)}
                            </Bar>
                        </BarChart>
                    </ResponsiveContainer>
                </div>
            </div>

            {/* Cobertura do estoque mínimo */}
            <div className="bg-white rounded-xl border border-slate-100 overflow-hidden shadow-sm">
                <div className="px-5 py-4 border-b border-slate-100 bg-slate-50 flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                        <span className="text-[#C8102E]"><IconThermometer size={16} /></span>
                        <div className="text-[12px] font-semibold text-slate-700">Cobertura do Estoque Mínimo da Rede</div>
                    </div>
                    <span className={`text-[11px] font-semibold px-2.5 py-0.5 rounded-full ${
                        estoque.tiposAbaixoMin.length > 0 ? "bg-[#FFF0F2] text-[#C8102E]" : "bg-emerald-50 text-emerald-700"
                    }`}>
                        {estoque.tiposAbaixoMin.length > 0 ? `${estoque.tiposAbaixoMin.length} tipo(s) abaixo do mínimo` : "Todos os tipos cobertos"}
                    </span>
                </div>
                <div className="grid px-5 py-3 bg-slate-50 border-b border-slate-100 text-[11px] font-semibold text-slate-400 uppercase tracking-widest"
                     style={{ gridTemplateColumns: "80px 1fr 1fr 1fr 150px" }}>
                    <div>Tipo</div>
                    <div className="text-right">Estoque Atual</div>
                    <div className="text-right">Mínimo da Rede</div>
                    <div className="text-right">Déficit</div>
                    <div className="text-right">Situação</div>
                </div>
                {estoque.cobertura.filter((c) => c.minimo > 0 || c.atual > 0).map((c) => (
                    <div key={c.bt} className="grid px-5 py-3 items-center border-b border-slate-50 last:border-0"
                         style={{ gridTemplateColumns: "80px 1fr 1fr 1fr 150px" }}>
                        <div className="text-[14px] font-bold text-slate-700" style={{ fontFamily: "'JetBrains Mono', monospace" }}>{c.bt}</div>
                        <div className="text-right text-[13px] font-semibold text-slate-900" style={{ fontFamily: "'JetBrains Mono', monospace" }}>{c.atual}</div>
                        <div className="text-right text-[13px] text-slate-500" style={{ fontFamily: "'JetBrains Mono', monospace" }}>{c.minimo || "—"}</div>
                        <div className="text-right text-[13px] font-semibold" style={{ fontFamily: "'JetBrains Mono', monospace", color: c.deficit > 0 ? "#C8102E" : "#94A3B8" }}>
                            {c.deficit > 0 ? `-${c.deficit}` : "0"}
                        </div>
                        <div className="flex justify-end">
                            <span className={`text-[11px] font-semibold px-2.5 py-0.5 rounded-full inline-flex items-center gap-1.5 ${
                                c.minimo === 0 ? "bg-slate-100 text-slate-500" : c.abaixo ? "bg-[#FFF0F2] text-[#C8102E]" : "bg-emerald-50 text-emerald-700"
                            }`}>
                                <span className={`w-1.5 h-1.5 rounded-full ${c.minimo === 0 ? "bg-slate-400" : c.abaixo ? "bg-[#C8102E]" : "bg-emerald-400"}`} />
                                {c.minimo === 0 ? "Sem parâmetro" : c.abaixo ? "Abaixo do mínimo" : "Adequado"}
                            </span>
                        </div>
                    </div>
                ))}
            </div>

            {/* ══════════════ PAINEL DE DEMANDA ══════════════ */}
            <SectionTitle icon={<IconClipboard size={18} />} title="Painel de Demanda" hint="requisições hospitalares" />

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
                {/* Demanda por tipo */}
                <div className="bg-white rounded-xl border border-slate-100 p-5 shadow-sm">
                    <div className="text-[12px] font-semibold text-slate-700 mb-1">Demanda por Tipo Sanguíneo</div>
                    <div className="text-[11px] text-slate-400 mb-3">unidades solicitadas nas requisições</div>
                    <ResponsiveContainer width="100%" height={210}>
                        <BarChart data={demanda.porTipo} barSize={26} margin={{ top: 4, right: 4, left: -18, bottom: 0 }}>
                            <CartesianGrid vertical={false} stroke="#F1F5F9" />
                            <XAxis dataKey="bt" tick={{ fontSize: 11, fontFamily: "'JetBrains Mono', monospace", fill: "#94A3B8" }} axisLine={false} tickLine={false} />
                            <YAxis tick={{ fontSize: 11, fill: "#94A3B8" }} axisLine={false} tickLine={false} />
                            <RechartTooltip contentStyle={tooltipStyle} formatter={(v: any, _n: any, p: any) => [`${v} unid. · ${p?.payload?.reqs} req.`, "Demanda"]} />
                            <Bar dataKey="unidades" radius={[4, 4, 0, 0]}>
                                {demanda.porTipo.map((e) => <Cell key={e.bt} fill={e.unidades > 0 ? "#3B82F6" : "#E2E8F0"} />)}
                            </Bar>
                        </BarChart>
                    </ResponsiveContainer>
                </div>

                {/* Demanda por urgência + status (dois donuts) */}
                <div className="bg-white rounded-xl border border-slate-100 p-5 shadow-sm">
                    <div className="text-[12px] font-semibold text-slate-700 mb-1">Requisições por Urgência e Status</div>
                    <div className="text-[11px] text-slate-400 mb-3">contagem de requisições</div>
                    <div className="grid grid-cols-2 gap-2">
                        <ResponsiveContainer width="100%" height={200}>
                            <PieChart>
                                <Pie data={demanda.porUrgencia} dataKey="value" nameKey="name" cx="50%" cy="46%" outerRadius={62} label={(e: any) => e.value}>
                                    {demanda.porUrgencia.map((e) => <Cell key={e.key} fill={e.color} />)}
                                </Pie>
                                <RechartTooltip contentStyle={tooltipStyle} formatter={(v: any, n: any) => [`${v} req.`, n]} />
                                <Legend iconType="circle" wrapperStyle={{ fontSize: 10 }} />
                            </PieChart>
                        </ResponsiveContainer>
                        <ResponsiveContainer width="100%" height={200}>
                            <PieChart>
                                <Pie data={demanda.porStatus} dataKey="value" nameKey="name" cx="50%" cy="46%" outerRadius={62} label={(e: any) => e.value}>
                                    {demanda.porStatus.map((e) => <Cell key={e.key} fill={e.color} />)}
                                </Pie>
                                <RechartTooltip contentStyle={tooltipStyle} formatter={(v: any, n: any) => [`${v} req.`, n]} />
                                <Legend iconType="circle" wrapperStyle={{ fontSize: 10 }} />
                            </PieChart>
                        </ResponsiveContainer>
                    </div>
                    <div className="flex items-center justify-around mt-1 text-center">
                        <div>
                            <div className="text-[18px] font-bold text-slate-900" style={{ fontFamily: "'JetBrains Mono', monospace" }}>{fmt(demanda.taxaAtendimento, 0)}%</div>
                            <div className="text-[10px] text-slate-400 uppercase tracking-wide">Taxa de atendimento</div>
                        </div>
                        <div>
                            <div className="text-[18px] font-bold text-[#C8102E]" style={{ fontFamily: "'JetBrains Mono', monospace" }}>{demanda.emergencias}</div>
                            <div className="text-[10px] text-slate-400 uppercase tracking-wide">Emergências</div>
                        </div>
                    </div>
                </div>
            </div>

            {/* ══════════════ ESTOQUE × DEMANDA ══════════════ */}
            <SectionTitle icon={<IconBarChart2 size={18} />} title="Estoque × Demanda" hint="índice de cobertura por tipo sanguíneo" />

            <div className="grid grid-cols-1 lg:grid-cols-5 gap-5">
                <div className="lg:col-span-3 bg-white rounded-xl border border-slate-100 p-5 shadow-sm">
                    <div className="text-[12px] font-semibold text-slate-700 mb-1">Comparativo por Tipo Sanguíneo</div>
                    <div className="text-[11px] text-slate-400 mb-3">barras vermelhas: estoque · barras azuis: demanda</div>
                    <ResponsiveContainer width="100%" height={240}>
                        <BarChart data={cruzamento.linhas} barGap={2} barSize={13} margin={{ top: 4, right: 4, left: -18, bottom: 0 }}>
                            <CartesianGrid vertical={false} stroke="#F1F5F9" />
                            <XAxis dataKey="bt" tick={{ fontSize: 11, fontFamily: "'JetBrains Mono', monospace", fill: "#94A3B8" }} axisLine={false} tickLine={false} />
                            <YAxis domain={[0, Math.ceil(maxTipo * 1.1)]} tick={{ fontSize: 11, fill: "#94A3B8" }} axisLine={false} tickLine={false} />
                            <RechartTooltip contentStyle={tooltipStyle} formatter={(v: any, n: any) => [`${v} unid.`, n === "est" ? "Estoque" : "Demanda"]} />
                            <Legend iconType="circle" wrapperStyle={{ fontSize: 11 }} formatter={(v) => (v === "est" ? "Estoque" : "Demanda")} />
                            <Bar dataKey="est" fill={RED} radius={[3, 3, 0, 0]} />
                            <Bar dataKey="dem" fill="#3B82F6" radius={[3, 3, 0, 0]} />
                        </BarChart>
                    </ResponsiveContainer>
                </div>

                <div className="lg:col-span-2 bg-white rounded-xl border border-slate-100 overflow-hidden shadow-sm flex flex-col">
                    <div className="px-5 py-3 border-b border-slate-100 bg-slate-50 text-[12px] font-semibold text-slate-700">
                        Índice de Cobertura (estoque ÷ demanda)
                    </div>
                    <div className="grid px-5 py-2.5 bg-slate-50/60 border-b border-slate-100 text-[10px] font-semibold text-slate-400 uppercase tracking-widest"
                         style={{ gridTemplateColumns: "60px 1fr 1fr 1fr" }}>
                        <div>Tipo</div><div className="text-right">Est.</div><div className="text-right">Dem.</div><div className="text-right">Cob.</div>
                    </div>
                    <div className="flex-1 overflow-y-auto">
                        {cruzamento.linhas.filter((l) => l.est > 0 || l.dem > 0).map((l) => {
                            const cfg = l.sit === "deficit"
                                ? { c: "#C8102E", t: "bg-[#FFF0F2] text-[#C8102E]" }
                                : l.sit === "ajustado"
                                    ? { c: "#D97706", t: "bg-amber-50 text-amber-700" }
                                    : l.sit === "folga"
                                        ? { c: "#059669", t: "bg-emerald-50 text-emerald-700" }
                                        : { c: "#94A3B8", t: "bg-slate-100 text-slate-500" };
                            return (
                                <div key={l.bt} className="grid px-5 py-2.5 items-center border-b border-slate-50 last:border-0 text-[12.5px]"
                                     style={{ gridTemplateColumns: "60px 1fr 1fr 1fr", fontFamily: "'JetBrains Mono', monospace" }}>
                                    <div className="font-bold text-slate-700">{l.bt}</div>
                                    <div className="text-right text-slate-800">{l.est}</div>
                                    <div className="text-right text-slate-800">{l.dem}</div>
                                    <div className="text-right font-semibold" style={{ color: cfg.c }}>
                                        {l.dem === 0 ? (l.est > 0 ? "∞" : "—") : `${fmt(l.cobertura)}×`}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                    {cruzamento.deficits.length > 0 && (
                        <div className="px-5 py-3 border-t border-slate-100 bg-[#FFF0F2]/50 text-[11.5px] text-[#C8102E] flex items-start gap-2">
                            <span className="mt-0.5"><IconAlertTriangle size={13} /></span>
                            <span>Déficit em <strong>{cruzamento.deficits.map((d) => d.bt).join(", ")}</strong>: estoque abaixo da demanda registrada.</span>
                        </div>
                    )}
                </div>
            </div>

            {/* ══════════════ VALIDAÇÃO / CONSISTÊNCIA ══════════════ */}
            <SectionTitle icon={<IconActivity size={18} />} title="Validação e Consistência dos Indicadores" hint="reconciliação das agregações" />

            <div className="bg-white rounded-xl border border-slate-100 overflow-hidden shadow-sm">
                {checks.map((c, i) => (
                    <div key={i} className="flex items-center justify-between px-5 py-3 border-b border-slate-50 last:border-0">
                        <div className="flex items-center gap-2.5">
                            <span className={`w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 ${c.ok ? "bg-emerald-50 text-emerald-600" : "bg-[#FFF0F2] text-[#C8102E]"}`}>
                                {c.ok ? <IconCheck size={12} /> : <IconX size={12} />}
                            </span>
                            <span className="text-[12.5px] text-slate-600">{c.label}</span>
                        </div>
                        <span className="text-[12px] text-slate-500" style={{ fontFamily: "'JetBrains Mono', monospace" }}>
                            {c.a} = {c.b} {c.ok ? "✓" : "✗"}
                        </span>
                    </div>
                ))}
                <div className="px-5 py-3 bg-slate-50 text-[11px] text-slate-400 flex items-center gap-2">
                    <span className="text-[#C8102E]"><IconBuilding size={13} /></span>
                    Indicadores recalculados automaticamente a cada atualização de lotes, requisições ou instituições.
                </div>
            </div>
        </div>
    );
}
