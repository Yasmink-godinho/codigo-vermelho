// Tela de Central de Alertas — US03

import { IconActivity, IconBell, IconCheck, IconClock, IconMapPin } from "@/components/icons";
import type { Hospital } from "@/types";

export default function AlertasScreen({ filter, setFilter }: { filter: string; setFilter: (v: any) => void }) {
  const alerts = [
    {
      id: "ALT-0043",
      level: "critico",
      title: "Risco de desabastecimento — O-",
      institution: "Hospital B · UTI Adulto",
      desc: "O estoque de O- está em 4 unidades — abaixo do limite mínimo de segurança (15 unid.). Previsão de esgotamento em 36 horas com a taxa de consumo atual.",
      time: "há 12 min",
      action: "Redistribuir",
    },
    {
      id: "ALT-0042",
      level: "critico",
      title: "Validade crítica — B-",
      institution: "HEMOSC Central · Banco de Sangue",
      desc: "8 unidades de B- vencem nas próximas 48 horas. Recomenda-se redistribuição imediata para unidades com consumo ativo.",
      time: "há 34 min",
      action: "Redistribuir",
    },
    {
      id: "ALT-0041",
      level: "atencao",
      title: "Desvio de temperatura em transporte",
      institution: "Transferência #1027 · Rota C-Sul",
      desc: "Temperatura do contêiner registrou 7,4°C durante 18 minutos. Transferência pausada automaticamente. Aguardando avaliação do responsável técnico.",
      time: "há 1h",
      action: "Avaliar",
    },
    {
      id: "ALT-0040",
      level: "atencao",
      title: "Estoque de AB- próximo do mínimo",
      institution: "UPA Norte · Emergência",
      desc: "Estoque atual: 6 unidades. Nível de segurança: 10 unidades. Tendência de consumo indica possível criticidade em 5 dias.",
      time: "há 2h",
      action: "Monitorar",
    },
    {
      id: "ALT-0039",
      level: "normal",
      title: "Reabastecimento concluído — AB+",
      institution: "Hospital C · Centro Cirúrgico",
      desc: "Estoque de AB+ normalizado após redistribuição. Nível atual: 22 unidades, acima do limite de segurança.",
      time: "há 3h",
      action: null,
    },
    {
      id: "ALT-0038",
      level: "normal",
      title: "Transferência #1026 entregue com sucesso",
      institution: "Hospital A → UPA Leste",
      desc: "2 unidades de AB- entregues dentro do prazo e em condições ideais de temperatura. Operação encerrada.",
      time: "há 4h",
      action: null,
    },
  ];

  const filtered = filter === "todos" ? alerts : alerts.filter((a) => a.level === filter);

  const levelConfig: Record<string, { label: string; dot: string; badge: string; border: string }> = {
    critico: { label: "Crítico", dot: "bg-[#C8102E]", badge: "bg-[#FFF0F2] text-[#C8102E]", border: "border-l-[#C8102E]" },
    atencao: { label: "Atenção", dot: "bg-amber-400", badge: "bg-amber-50 text-amber-700", border: "border-l-amber-400" },
    normal: { label: "Normal", dot: "bg-emerald-400", badge: "bg-emerald-50 text-emerald-700", border: "border-l-emerald-500" },
  };

  const counts = {
    todos: alerts.length,
    critico: alerts.filter((a) => a.level === "critico").length,
    atencao: alerts.filter((a) => a.level === "atencao").length,
    normal: alerts.filter((a) => a.level === "normal").length,
  };

  const filters: { key: string; label: string; count: number }[] = [
    { key: "todos", label: "Todos", count: counts.todos },
    { key: "critico", label: "Crítico", count: counts.critico },
    { key: "atencao", label: "Atenção", count: counts.atencao },
    { key: "normal", label: "Normal", count: counts.normal },
  ];

  return (
    <div className="px-8 py-7">
      {/* Summary bar */}
      <div className="grid grid-cols-3 gap-4 mb-7">
        <div className="bg-white rounded-xl border border-slate-100 p-4 flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-[#FFF0F2] text-[#C8102E] flex items-center justify-center"><IconBell size={17} /></div>
          <div>
            <div className="text-[24px] font-700 text-slate-900 leading-none" style={{ fontWeight: 700 }}>2</div>
            <div className="text-[12px] text-slate-400 mt-0.5">Alertas críticos ativos</div>
          </div>
        </div>
        <div className="bg-white rounded-xl border border-slate-100 p-4 flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center"><IconActivity size={17} /></div>
          <div>
            <div className="text-[24px] font-700 text-slate-900 leading-none" style={{ fontWeight: 700 }}>2</div>
            <div className="text-[12px] text-slate-400 mt-0.5">Situações em atenção</div>
          </div>
        </div>
        <div className="bg-white rounded-xl border border-slate-100 p-4 flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center"><IconCheck size={17} /></div>
          <div>
            <div className="text-[24px] font-700 text-slate-900 leading-none" style={{ fontWeight: 700 }}>2</div>
            <div className="text-[12px] text-slate-400 mt-0.5">Resolvidos hoje</div>
          </div>
        </div>
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
                  <div className="text-[11px] text-slate-400 flex items-center gap-1"><IconClock size={11} />{alert.time}</div>
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
    </div>
  );
}
