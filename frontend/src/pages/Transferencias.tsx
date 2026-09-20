// Tela de Transferências — US05

import { useState } from "react";
import { IconArrowRight, IconCheck, IconChevronRight, IconClock, IconDroplet, IconHospital, IconMapPin, IconShield, IconThermometer, IconTruck } from "@/components/icons";
import { TRANSFERS_DATA, timelineProgress } from "@/data/mockData";

export default function TransferenciasScreen() {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const selected = selectedId ? TRANSFERS_DATA.find((t) => t.id === selectedId) ?? null : null;

  if (selected) {
    const activeStep = selected.timeline.find((s) => s.active);
    const progress = timelineProgress[selected.status] ?? "50%";
    return (
      <div className="px-8 py-7">
        {/* Back */}
        <button
          onClick={() => setSelectedId(null)}
          className="flex items-center gap-2 text-[13px] text-slate-500 hover:text-slate-700 font-medium mb-6 transition-colors"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="15 18 9 12 15 6"/>
          </svg>
          Voltar para Transferências
        </button>

        {/* Detail card */}
        <div className="bg-white rounded-xl border border-slate-100 overflow-hidden mb-5">
          {/* Red header */}
          <div className="px-6 py-5 bg-gradient-to-r from-[#C8102E] to-[#9B0D23]">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-white/60 text-[11px] font-medium uppercase tracking-widest">Detalhes da Transferência</div>
                <div className="text-white text-[22px] font-bold mt-0.5 leading-tight" style={{ fontFamily: "'JetBrains Mono', monospace" }}>TRANSFERÊNCIA {selected.id}</div>
              </div>
              <div className="flex items-center gap-1.5 bg-white/20 px-3 py-1.5 rounded-full">
                {selected.status === "Em transporte" || selected.status === "Aguardando avaliação" ? (
                  <div className="w-2 h-2 rounded-full bg-white animate-pulse"></div>
                ) : (
                  <div className="w-2 h-2 rounded-full bg-white"></div>
                )}
                <span className="text-white text-[12px] font-medium">{selected.status}</span>
              </div>
            </div>
            <div className="mt-4 flex items-center gap-4 text-white/80 text-[13px]">
              <span className="flex items-center gap-1.5"><IconHospital size={14} />{selected.from}</span>
              <span className="text-white/40"><IconArrowRight size={14} /></span>
              <span className="flex items-center gap-1.5"><IconHospital size={14} />{selected.to}</span>
              <span className="ml-4 flex items-center gap-1.5 text-white font-semibold" style={{ fontFamily: "'JetBrains Mono', monospace" }}>
                <IconDroplet size={14} />{selected.comp} · {selected.qty} unidades
              </span>
            </div>
          </div>

          {/* Timeline */}
          <div className="px-6 py-6 border-b border-slate-100">
            <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-widest mb-5">Linha do Tempo</div>
            <div className="relative">
              <div className="absolute top-4 left-4 right-4 h-px bg-slate-100"></div>
              <div className="absolute top-4 left-4 h-px bg-[#C8102E] transition-all" style={{ width: progress }}></div>
              <div className="relative flex justify-between">
                {selected.timeline.map((step, i) => (
                  <div key={i} className="flex flex-col items-center gap-2">
                    <div className={`w-8 h-8 rounded-full border-2 flex items-center justify-center z-10 transition-all ${
                      step.active ? "border-[#C8102E] bg-[#C8102E] text-white"
                      : step.done ? "border-[#C8102E] bg-[#C8102E] text-white"
                      : "border-slate-200 bg-white text-slate-400"
                    }`}>
                      {step.done || step.active ? <IconCheck size={13} /> : <span className="w-2 h-2 rounded-full bg-slate-200"></span>}
                    </div>
                    <div className="text-center">
                      <div className={`text-[12px] font-semibold ${step.active ? "text-[#C8102E]" : step.done ? "text-slate-700" : "text-slate-400"}`}>{step.label}</div>
                      <div className="text-[11px] text-slate-400" style={{ fontFamily: "'JetBrains Mono', monospace" }}>{step.time}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Info grid */}
          <div className="px-6 py-5 border-b border-slate-100">
            <div className="grid grid-cols-3 gap-5">
              <InfoCell icon={<IconClock size={15} />} label="Horário de saída" value={selected.departure} mono />
              <InfoCell icon={<IconClock size={15} />} label="Previsão de chegada" value={selected.eta} mono />
              <InfoCell icon={<IconThermometer size={15} />} label="Temperatura" value={selected.temperature} mono good={!selected.temperature.includes("alerta")} />
              <InfoCell icon={<IconTruck size={15} />} label="Transportador" value={selected.carrier} />
              <InfoCell icon={<IconMapPin size={15} />} label="Rota" value={selected.route} />
              <InfoCell icon={<IconShield size={15} />} label="Status da operação" value={selected.operationStatus} good={selected.operationStatus === "Normal" || selected.operationStatus === "Concluída"} />
            </div>
          </div>

          {/* Notes + history */}
          <div className="grid grid-cols-2 divide-x divide-slate-100">
            <div className="px-6 py-5">
              <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-widest mb-2">Observações</div>
              <div className="text-[13px] text-slate-600 leading-relaxed">{selected.notes}</div>
            </div>
            <div className="px-6 py-5">
              <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-widest mb-3">Histórico de eventos</div>
              <div className="space-y-2.5">
                {selected.history.map((h, i) => (
                  <div key={i} className="flex items-start gap-3">
                    <div className="text-[11px] font-mono text-slate-400 w-12 flex-shrink-0 mt-0.5" style={{ fontFamily: "'JetBrains Mono', monospace" }}>{h.time}</div>
                    <div className="flex items-start gap-2 flex-1">
                      <div className={`w-1.5 h-1.5 rounded-full mt-1.5 flex-shrink-0 ${i === selected.history.length - 1 ? "bg-[#C8102E]" : "bg-slate-300"}`}></div>
                      <div className="text-[12.5px] text-slate-600 leading-snug">{h.event}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="px-8 py-7">
      <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-widest mb-4">Clique em uma transferência para ver os detalhes</div>
      <div className="grid grid-cols-2 gap-4">
        {TRANSFERS_DATA.map((t) => (
          <button
            key={t.id}
            onClick={() => setSelectedId(t.id)}
            className="bg-white rounded-xl border border-slate-100 p-5 text-left hover:border-[#C8102E]/30 hover:shadow-sm hover:-translate-y-0.5 transition-all group"
          >
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-center gap-2">
                <span className="text-[12px] font-mono font-bold text-slate-400" style={{ fontFamily: "'JetBrains Mono', monospace" }}>{t.id}</span>
                <span className={`text-[11px] font-medium px-2 py-0.5 rounded-full ${t.statusColor}`}>{t.status}</span>
              </div>
              <span className="text-[20px] font-bold text-[#C8102E] group-hover:scale-110 transition-transform" style={{ fontFamily: "'JetBrains Mono', monospace" }}>{t.comp}</span>
            </div>
            <div className="flex items-center gap-2 mb-3">
              <div className="flex-1 min-w-0">
                <div className="text-[13px] font-semibold text-slate-800 truncate">{t.from}</div>
              </div>
              <div className="flex-shrink-0 text-slate-300"><IconArrowRight size={14} /></div>
              <div className="flex-1 min-w-0 text-right">
                <div className="text-[13px] font-semibold text-slate-800 truncate">{t.to}</div>
              </div>
            </div>
            <div className="flex items-center justify-between pt-3 border-t border-slate-50">
              <div className="text-[12px] text-slate-500">{t.qty} unidades</div>
              <div className="flex items-center gap-3 text-[11.5px] text-slate-400">
                {t.departure !== "—" && <span className="flex items-center gap-1"><IconClock size={11} />Saída: {t.departure}</span>}
                {t.eta !== "—" && <span className="flex items-center gap-1"><IconMapPin size={11} />Prev: {t.eta}</span>}
              </div>
              <span className="text-[12px] text-[#C8102E] font-medium group-hover:underline flex items-center gap-1">Ver detalhes <IconChevronRight size={12} /></span>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}

export function InfoCell({ icon, label, value, mono = false, good = false }: {
  icon: React.ReactNode; label: string; value: string; mono?: boolean; good?: boolean;
}) {
  return (
    <div className="flex items-start gap-2.5">
      <div className="w-7 h-7 rounded-lg bg-slate-100 flex items-center justify-center text-slate-500 flex-shrink-0 mt-0.5">{icon}</div>
      <div>
        <div className="text-[11px] text-slate-400 font-medium">{label}</div>
        <div className={`text-[14px] font-semibold mt-0.5 ${good ? "text-emerald-600" : "text-slate-800"} ${mono ? "font-mono" : ""}`} style={mono ? { fontFamily: "'JetBrains Mono', monospace" } : {}}>
          {value}
        </div>
      </div>
    </div>
  );
}
