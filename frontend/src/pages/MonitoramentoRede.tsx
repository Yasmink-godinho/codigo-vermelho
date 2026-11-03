import { useEffect, useState } from "react";
import { IconActivity, IconArrows, IconCheck, IconClock, IconShield, IconWifi } from "@/components/icons";
import { getRedeStatusApi, type RedeStatusAPI } from "@/data/api";

const fmt = (date?: string | null) => date ? new Date(date).toLocaleString("pt-BR") : "Sem amostras";
const statusLabel: Record<string, string> = {
  OPERACIONAL: "Operacional", DEGRADADO: "Degradado", INDISPONIVEL: "Indisponível", SEM_DADOS: "Sem dados"
};
const statusClass: Record<string, string> = {
  OPERACIONAL: "bg-emerald-50 text-emerald-700", DEGRADADO: "bg-amber-50 text-amber-700",
  INDISPONIVEL: "bg-[#FFF0F2] text-[#C8102E]", SEM_DADOS: "bg-slate-100 text-slate-500"
};

export default function MonitoramentoRedeScreen() {
  const [data, setData] = useState<RedeStatusAPI | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  useEffect(() => {
    let ativo = true;
    let timer: ReturnType<typeof setTimeout> | undefined;
    const carregar = async () => {
      try {
        const atual = await getRedeStatusApi();
        if (ativo) { setData(atual); setError(""); }
      } catch (e) {
        if (ativo) setError(e instanceof Error ? e.message : "Não foi possível carregar o monitoramento.");
      } finally {
        if (ativo) {
          setLoading(false);
          timer = setTimeout(() => { void carregar(); }, 30000);
        }
      }
    };
    void carregar();
    return () => { ativo = false; if (timer) clearTimeout(timer); };
  }, []);

  const kpis = data ? [
    { label: "Latência Média", value: data.latenciaMediaMs.toFixed(2), unit: "ms", icon: <IconActivity size={18}/> },
    { label: "Vazão", value: data.throughputReqPorSegundo.toFixed(2), unit: "req/s", icon: <IconArrows size={18}/> },
    { label: "Taxa de Erro", value: data.taxaErroPercentual.toFixed(2), unit: "%", icon: <IconShield size={18}/> },
    { label: "Uptime do processo", value: (data.uptimeSegundos / 3600).toFixed(1), unit: "h", icon: <IconCheck size={18}/> }
  ] : [];

  return <div className="px-8 py-7 space-y-5">
    <div className="flex items-center justify-between">
      <div><h1 className="text-xl font-bold text-slate-800">Monitoramento da Rede</h1>
        <p className="text-xs text-slate-400 mt-1">Métricas coletadas pela API · atualização a cada 30 segundos</p></div>
      {data && <span className={`text-xs font-semibold px-3 py-1 rounded-full ${statusClass[data.statusGeral] || statusClass.SEM_DADOS}`}>
        {statusLabel[data.statusGeral] || data.statusGeral}</span>}
    </div>
    {loading && <div className="bg-white rounded-xl border p-5 text-sm text-slate-500">Carregando métricas reais...</div>}
    {error && <div role="alert" className="bg-rose-50 border border-rose-100 rounded-xl p-4 text-sm text-rose-700">{error}
      <button className="ml-3 underline font-semibold" onClick={() => { setLoading(true); setError(""); void getRedeStatusApi().then(atual => { setData(atual); setError(""); }).catch(e => setError(e instanceof Error ? e.message : "Falha ao consultar monitoramento.")).finally(() => setLoading(false)); }}>Tentar novamente</button></div>}
    {!loading && !error && data && <>
      <div className="grid grid-cols-4 gap-4">{kpis.map(k => <div key={k.label} className="bg-white rounded-xl border border-slate-100 p-5">
        <div className="flex justify-between text-slate-400"><span className="text-[11px] font-semibold uppercase tracking-widest">{k.label}</span>{k.icon}</div>
        <div className="mt-3 flex items-baseline gap-1"><span className="text-3xl font-bold text-slate-900">{k.value}</span><span className="text-xs text-slate-400">{k.unit}</span></div>
      </div>)}</div>
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-white rounded-xl border p-5"><div className="text-xs text-slate-400 uppercase">Requisições na janela</div><div className="text-2xl font-bold mt-2">{data.requisicoes}</div></div>
        <div className="bg-white rounded-xl border p-5"><div className="text-xs text-slate-400 uppercase">Erros HTTP 5xx</div><div className="text-2xl font-bold mt-2">{data.erros}</div></div>
        <div className="bg-white rounded-xl border p-5"><div className="text-xs text-slate-400 uppercase">Janela de coleta</div><div className="text-2xl font-bold mt-2">{data.janelaSegundos}s</div></div>
      </div>
      <div className="bg-white rounded-xl border border-slate-100 overflow-hidden">
        <div className="px-5 py-4 border-b flex items-center gap-2"><IconWifi size={16}/><span className="text-sm font-semibold">Status dos Serviços e Endpoints</span></div>
        <div className="grid grid-cols-[1.5fr_2fr_1fr_90px_90px_1.4fr] gap-3 px-5 py-3 bg-slate-50 text-[10px] font-semibold text-slate-400 uppercase">
          <span>Método</span><span>Endpoint</span><span>Status</span><span className="text-right">Latência</span><span className="text-right">Erro</span><span className="text-right">Última amostra</span>
        </div>
        {data.endpoints.length === 0 && <p className="p-6 text-sm text-slate-400">Nenhum endpoint possui dados nesta janela.</p>}
        {data.endpoints.map((ep, i) => <div key={`${ep.metodo}-${ep.caminho}-${i}`} className="grid grid-cols-[1.5fr_2fr_1fr_90px_90px_1.4fr] gap-3 items-center px-5 py-3 border-t border-slate-50 text-xs">
          <span className="font-semibold">{ep.metodo}{ep.critico ? " · crítico" : ""}</span><span className="font-mono text-slate-500 truncate">{ep.caminho}</span>
          <span className={`w-fit px-2 py-1 rounded-full font-semibold ${statusClass[ep.status] || statusClass.SEM_DADOS}`}>{statusLabel[ep.status] || ep.status}</span>
          <span className="text-right">{ep.requisicoes ? `${ep.latenciaMediaMs.toFixed(1)} ms` : "—"}</span>
          <span className="text-right">{ep.taxaErroPercentual.toFixed(1)}%</span><span className="text-right text-slate-400">{fmt(ep.ultimaAmostra)}</span>
        </div>)}
      </div>
      <div className="bg-white rounded-xl border p-5"><div className="font-semibold text-sm mb-3">Saúde dos componentes</div>
        {data.componentes.map(c => <div key={c.nome} className="flex justify-between py-2 border-t text-xs"><span>{c.nome} — {c.detalhe}</span><span className={statusClass[c.status]?.replace("bg-", "text-") || "text-slate-500"}>{c.status} · {c.latenciaMs.toFixed(1)} ms</span></div>)}
        <p className="text-[11px] text-slate-400 mt-3">Atualizado em {fmt(data.geradoEm)}. Uptime refere-se ao processo atual, não à disponibilidade histórica.</p>
      </div>
    </>}
  </div>;
}
