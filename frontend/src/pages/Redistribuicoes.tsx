// Tela de Redistribuições — US04

import { useState } from "react";
import { IconArrowRight, IconCheck, IconDroplet, IconEye, IconHospital, IconLink, IconMapPin, IconShieldCheck, IconThermometer, IconTruck, IconX } from "@/components/icons";
import { RECS_DATA } from "@/data/mockData";
import { InfoCell } from "@/pages/Transferencias";
import CompatibilidadeScreen from "@/pages/VerificacaoCompatibilidade";

export default function RedistribuicoesScreen() {
  const [approved, setApproved] = useState<Record<string, "approved" | "refused" | null>>({
    "REC-2024-0043": null, "REC-2024-0042": null, "REC-2024-0041": null,
  });
  const [detailId, setDetailId] = useState<string | null>(null);
  const [compatId, setCompatId] = useState<string | null>(null);

  const detail = detailId ? RECS_DATA.find((r) => r.id === detailId) ?? null : null;
  const compatRec = compatId ? RECS_DATA.find((r) => r.id === compatId) ?? null : null;

  if (compatRec) {
    return (
      <CompatibilidadeScreen
        rec={compatRec}
        onBack={() => setCompatId(null)}
        onConfirm={() => { setApproved((p) => ({ ...p, [compatRec.id]: "approved" })); setCompatId(null); }}
      />
    );
  }

  if (detail) {
    const state = approved[detail.id];
    return (
      <div className="px-8 py-7">
        {/* Back */}
        <button
          onClick={() => setDetailId(null)}
          className="flex items-center gap-2 text-[13px] text-slate-500 hover:text-slate-700 font-medium mb-6 transition-colors"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="15 18 9 12 15 6"/>
          </svg>
          Voltar para Redistribuições
        </button>

        {/* Header card */}
        <div className="bg-white rounded-xl border border-slate-100 overflow-hidden mb-5">
          <div className="px-6 py-5 border-b border-slate-100 bg-gradient-to-r from-slate-50 to-white">
            <div className="flex items-start justify-between">
              <div>
                <div className="flex items-center gap-2.5 mb-3">
                  <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-widest">Recomendação de Redistribuição</span>
                  <span className="text-[11px] font-mono text-slate-400" style={{ fontFamily: "'JetBrains Mono', monospace" }}>{detail.id}</span>
                  <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full flex items-center gap-1.5 ${detail.urgencyColor}`}>
                    <span className={`w-1.5 h-1.5 rounded-full ${detail.urgencyDot}`}></span>
                    Urgência {detail.urgency}
                  </span>
                </div>
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center text-slate-500"><IconHospital size={15} /></div>
                    <div>
                      <div className="text-[10px] text-slate-400 font-medium">Origem</div>
                      <div className="text-[15px] font-semibold text-slate-800">{detail.from}</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 text-slate-300">
                    <div className="w-16 h-px bg-slate-200"></div>
                    <div className="w-6 h-6 rounded-full bg-slate-100 flex items-center justify-center text-slate-400"><IconArrowRight size={12} /></div>
                    <div className="w-16 h-px bg-slate-200"></div>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg bg-[#FFF0F2] flex items-center justify-center text-[#C8102E]"><IconHospital size={15} /></div>
                    <div>
                      <div className="text-[10px] text-slate-400 font-medium">Destino</div>
                      <div className="text-[15px] font-semibold text-slate-800">{detail.to}</div>
                    </div>
                  </div>
                  <div className="ml-6 pl-6 border-l border-slate-100 flex items-center gap-5">
                    <div>
                      <div className="text-[10px] text-slate-400 font-medium">Hemocomponente</div>
                      <div className="text-[20px] font-bold text-[#C8102E]" style={{ fontFamily: "'JetBrains Mono', monospace" }}>{detail.comp}</div>
                    </div>
                    <div>
                      <div className="text-[10px] text-slate-400 font-medium">Quantidade</div>
                      <div className="text-[20px] font-bold text-slate-900" style={{ fontFamily: "'JetBrains Mono', monospace" }}>{detail.qty} unid.</div>
                    </div>
                  </div>
                </div>
              </div>
              {/* Action buttons */}
              <div className="flex items-center gap-2 flex-shrink-0 mt-1">
                {state === null ? (
                  <>
                    <button
                      onClick={() => { setDetailId(null); setCompatId(detail.id); }}
                      className="flex items-center gap-1.5 px-4 py-2 rounded-lg border border-slate-200 text-slate-600 text-[13px] font-medium hover:bg-slate-50 transition-colors"
                    >
                      <IconShieldCheck size={14} /> Verificar Compatibilidade
                    </button>
                    <button
                      onClick={() => { setApproved((p) => ({ ...p, [detail.id]: "refused" })); setDetailId(null); }}
                      className="flex items-center gap-1.5 px-4 py-2 rounded-lg border border-slate-200 text-slate-600 text-[13px] font-medium hover:bg-slate-50 transition-colors"
                    >
                      <IconX size={14} /> Recusar redistribuição
                    </button>
                    <button
                      onClick={() => { setApproved((p) => ({ ...p, [detail.id]: "approved" })); setDetailId(null); }}
                      className="flex items-center gap-1.5 px-5 py-2 rounded-lg bg-[#C8102E] text-white text-[13px] font-semibold hover:bg-[#a00d24] transition-colors"
                    >
                      <IconCheck size={14} /> Aprovar redistribuição
                    </button>
                  </>
                ) : state === "approved" ? (
                  <div className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-emerald-50 text-emerald-700 text-[13px] font-semibold border border-emerald-100">
                    <IconCheck size={15} /> Aprovada
                  </div>
                ) : (
                  <div className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-slate-100 text-slate-500 text-[13px] font-semibold">
                    <IconX size={15} /> Recusada
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Detail grid */}
          <div className="grid grid-cols-3 gap-0 divide-x divide-slate-100">
            {/* Estoque */}
            <div className="p-5">
              <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-widest mb-3">Estoques</div>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-[12px] text-slate-500">Origem ({detail.from.split(" ")[0]})</span>
                  <span className="text-[14px] font-bold text-emerald-600" style={{ fontFamily: "'JetBrains Mono', monospace" }}>{detail.stockFrom} unid.</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-[12px] text-slate-500">Destino ({detail.to.split(" ")[0]})</span>
                  <span className="text-[14px] font-bold text-[#C8102E]" style={{ fontFamily: "'JetBrains Mono', monospace" }}>{detail.stockTo} unid.</span>
                </div>
                <div className="flex items-center justify-between pt-2 border-t border-slate-100">
                  <span className="text-[12px] text-slate-500">Previsão de risco</span>
                  <span className="text-[12px] font-semibold text-amber-600">{detail.riskForecast}</span>
                </div>
              </div>
            </div>

            {/* Validade + relação */}
            <div className="p-5">
              <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-widest mb-3">Unidades e Relação</div>
              <div className="space-y-3">
                <InfoCell icon={<IconDroplet size={14} />} label="Validade das unidades" value={detail.validity} />
                <InfoCell icon={<IconLink size={14} />} label="Relação de fornecimento" value={detail.supplierRelation} />
              </div>
            </div>

            {/* Transporte */}
            <div className="p-5">
              <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-widest mb-3">Logística</div>
              <div className="space-y-3">
                <InfoCell icon={<IconMapPin size={14} />} label="Rota" value={detail.route} />
                <InfoCell icon={<IconTruck size={14} />} label="Transportador" value={detail.transport} />
                <InfoCell icon={<IconThermometer size={14} />} label="Condições de transporte" value={detail.transportCondition} good />
              </div>
            </div>
          </div>
        </div>

        {/* Reasons */}
        <div className="bg-white rounded-xl border border-slate-100 p-5">
          <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-widest mb-4">Por que recomendamos?</div>
          <div className="grid grid-cols-2 gap-3">
            {detail.reasons.map((r, j) => (
              <div key={j} className="flex items-start gap-2.5 bg-slate-50 rounded-lg px-3 py-2.5 text-[13px] text-slate-600">
                <span className="mt-0.5 text-slate-400 flex-shrink-0">{r.icon}</span>
                {r.text}
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="px-8 py-7">
      <div className="flex items-center justify-between mb-6">
        <div className="text-[13px] text-slate-500">
          <span className="font-semibold text-slate-800">3 recomendações</span> geradas pela IA — atualizado há 4 minutos
        </div>
        <div className="flex items-center gap-2 text-[12px] text-slate-500">
          <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></div>
          Motor de análise ativo
        </div>
      </div>

      <div className="space-y-5">
        {RECS_DATA.map((rec) => {
          const state = approved[rec.id];
          return (
            <div key={rec.id} className={`bg-white rounded-xl border border-slate-100 overflow-hidden transition-all ${state === "approved" ? "ring-2 ring-emerald-400/40" : state === "refused" ? "opacity-60" : ""}`}>
              {/* Header */}
              <div className="px-6 pt-5 pb-4 border-b border-slate-50">
                <div className="flex items-start justify-between">
                  <div>
                    <div className="flex items-center gap-2.5">
                      <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-widest">Recomendação de Redistribuição</div>
                      <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full flex items-center gap-1.5 ${rec.urgencyColor}`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${rec.urgencyDot}`}></span>
                        Urgência {rec.urgency}
                      </span>
                    </div>
                    <div className="mt-3 flex items-center gap-3">
                      <div className="flex items-center gap-1.5">
                        <div className="w-7 h-7 rounded-lg bg-slate-100 flex items-center justify-center text-slate-500"><IconHospital size={14} /></div>
                        <div>
                          <div className="text-[10px] text-slate-400 font-medium">Origem</div>
                          <div className="text-[14px] font-semibold text-slate-800">{rec.from}</div>
                        </div>
                      </div>
                      <div className="flex items-center gap-1.5 text-slate-300">
                        <div className="w-12 h-px bg-slate-200"></div>
                        <div className="w-5 h-5 rounded-full bg-slate-100 flex items-center justify-center text-slate-400"><IconArrowRight size={11} /></div>
                        <div className="w-12 h-px bg-slate-200"></div>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <div className="w-7 h-7 rounded-lg bg-[#FFF0F2] flex items-center justify-center text-[#C8102E]"><IconHospital size={14} /></div>
                        <div>
                          <div className="text-[10px] text-slate-400 font-medium">Destino</div>
                          <div className="text-[14px] font-semibold text-slate-800">{rec.to}</div>
                        </div>
                      </div>
                      <div className="ml-6 pl-6 border-l border-slate-100 flex items-center gap-4">
                        <div>
                          <div className="text-[10px] text-slate-400 font-medium">Hemocomponente</div>
                          <div className="text-[16px] font-700 text-[#C8102E]" style={{ fontFamily: "'JetBrains Mono', monospace", fontWeight: 700 }}>{rec.comp}</div>
                        </div>
                        <div>
                          <div className="text-[10px] text-slate-400 font-medium">Quantidade</div>
                          <div className="text-[16px] font-700 text-slate-900" style={{ fontFamily: "'JetBrains Mono', monospace", fontWeight: 700 }}>{rec.qty} unid.</div>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 flex-shrink-0">
                    {state === null ? (
                      <>
                        <button
                          onClick={() => setDetailId(rec.id)}
                          className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg border border-slate-200 text-slate-600 text-[12px] font-medium hover:bg-slate-50 transition-colors"
                        >
                          <IconEye size={14} /> Ver detalhes
                        </button>
                        <button
                          onClick={() => setCompatId(rec.id)}
                          className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg border border-slate-200 text-slate-600 text-[12px] font-medium hover:bg-slate-50 transition-colors"
                        >
                          <IconShieldCheck size={14} /> Verificar Compatibilidade
                        </button>
                        <button
                          onClick={() => setApproved((p) => ({ ...p, [rec.id]: "refused" }))}
                          className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg border border-slate-200 text-slate-600 text-[12px] font-medium hover:bg-slate-50 transition-colors"
                        >
                          <IconX size={14} /> Recusar
                        </button>
                        <button
                          onClick={() => setApproved((p) => ({ ...p, [rec.id]: "approved" }))}
                          className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-[#C8102E] text-white text-[12px] font-semibold hover:bg-[#a00d24] transition-colors"
                        >
                          <IconCheck size={14} /> Aprovar
                        </button>
                      </>
                    ) : state === "approved" ? (
                      <div className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-emerald-50 text-emerald-700 text-[13px] font-semibold">
                        <IconCheck size={15} /> Aprovada
                      </div>
                    ) : (
                      <div className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-slate-100 text-slate-500 text-[13px] font-semibold">
                        <IconX size={15} /> Recusada
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Reasons */}
              <div className="px-6 py-4">
                <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-widest mb-3">Por que recomendamos?</div>
                <div className="grid grid-cols-2 gap-2">
                  {rec.reasons.map((r, j) => (
                    <div key={j} className="flex items-start gap-2 text-[12.5px] text-slate-600">
                      <span className="mt-0.5 text-slate-400 flex-shrink-0">{r.icon}</span>
                      {r.text}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
