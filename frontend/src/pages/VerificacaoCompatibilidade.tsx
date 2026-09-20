// Tela de Verificação de Compatibilidade — US07

import { useState } from "react";
import { IconAlertTriangle, IconArrowRight, IconCheck, IconDroplet, IconHospital, IconShieldCheck, IconX } from "@/components/icons";
import { ALT_STOCKS, BLOOD_TYPES, COMPAT, COMPAT_EXPLANATIONS } from "@/data/mockData";
import type { AltBlood, Hospital, RecData } from "@/types";

export default function CompatibilidadeScreen({ rec, onBack, onConfirm }: {
  rec: RecData;
  onBack: () => void;
  onConfirm: () => void;
}) {
  const donor = rec.comp;
  const recipient = rec.requestedComp;
  const isCompatible = COMPAT[donor]?.includes(recipient) ?? false;
  const explanation = COMPAT_EXPLANATIONS[donor]?.[recipient] ?? "";
  const [selectedAlt, setSelectedAlt] = useState<AltBlood | null>(null);

  const activeDonor = selectedAlt ? selectedAlt.bt : donor;
  const activeCompatible = selectedAlt ? COMPAT[selectedAlt.bt]?.includes(recipient) ?? false : isCompatible;

  const alts = isCompatible ? [] : (ALT_STOCKS[recipient] ?? []);

  const typeBadge: Record<string, string> = {
    "Hospital Público": "bg-blue-50 text-blue-700", "Hospital Privado": "bg-violet-50 text-violet-700",
    "UPA": "bg-orange-50 text-orange-700", "Hemocentro": "bg-[#FFF0F2] text-[#C8102E]",
    "Maternidade": "bg-pink-50 text-pink-700", "Clínica": "bg-teal-50 text-teal-700",
  };

  return (
    <div className="px-8 py-7">
      {/* Back */}
      <button onClick={onBack} className="flex items-center gap-2 text-[13px] text-slate-500 hover:text-slate-700 font-medium mb-6 transition-colors">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="15 18 9 12 15 6"/>
        </svg>
        Voltar para Redistribuições
      </button>

      <div className="space-y-5">
        {/* Header card */}
        <div className="bg-white rounded-xl border border-slate-100 overflow-hidden">
          <div className="px-6 py-5 border-b border-slate-100 bg-gradient-to-r from-slate-50 to-white">
            <div className="flex items-center gap-2.5 mb-4">
              <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-widest">Verificação de Compatibilidade</span>
              <span className="text-[11px] font-mono text-slate-400" style={{ fontFamily: "'JetBrains Mono', monospace" }}>{rec.id}</span>
            </div>

            {/* Donor → Recipient header */}
            <div className="flex items-center gap-6">
              <div className="flex-1 bg-slate-50 rounded-xl p-4">
                <div className="text-[10px] font-semibold text-slate-400 uppercase tracking-widest mb-1.5">Bolsa disponível (doadora)</div>
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-lg bg-[#FFF0F2] flex items-center justify-center text-[#C8102E]"><IconDroplet size={16} /></div>
                  <div>
                    <div className="text-[11px] text-slate-500">{rec.from}</div>
                    <div className="text-[22px] font-bold text-[#C8102E] leading-tight" style={{ fontFamily: "'JetBrains Mono', monospace" }}>
                      {selectedAlt ? selectedAlt.bt : donor}
                      {selectedAlt && <span className="text-[12px] ml-2 text-amber-600 font-normal">alternativa</span>}
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex flex-col items-center gap-1.5 flex-shrink-0">
                <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-400">
                  <IconArrowRight size={14} />
                </div>
                <div className="text-[9px] font-semibold text-slate-300 uppercase tracking-widest">transfusão</div>
              </div>

              <div className="flex-1 bg-slate-50 rounded-xl p-4">
                <div className="text-[10px] font-semibold text-slate-400 uppercase tracking-widest mb-1.5">Requisição do receptor</div>
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-lg bg-blue-50 flex items-center justify-center text-blue-600"><IconHospital size={16} /></div>
                  <div>
                    <div className="text-[11px] text-slate-500">{rec.to}</div>
                    <div className="text-[22px] font-bold text-slate-800 leading-tight" style={{ fontFamily: "'JetBrains Mono', monospace" }}>{recipient}</div>
                  </div>
                </div>
              </div>

              {/* Result seal */}
              <div className="flex-shrink-0">
                {activeCompatible ? (
                  <div className="flex flex-col items-center gap-2 bg-emerald-50 border-2 border-emerald-200 rounded-2xl px-8 py-4 min-w-[140px]">
                    <div className="w-10 h-10 rounded-full bg-emerald-500 flex items-center justify-center text-white shadow-md">
                      <IconCheck size={20} />
                    </div>
                    <div className="text-[14px] font-bold text-emerald-700 tracking-wide">COMPATÍVEL</div>
                    <div className="text-[10px] text-emerald-600 text-center leading-tight">Transfusão<br/>autorizada</div>
                  </div>
                ) : (
                  <div className="flex flex-col items-center gap-2 bg-[#FFF0F2] border-2 border-[#F9D7DC] rounded-2xl px-8 py-4 min-w-[140px]">
                    <div className="w-10 h-10 rounded-full bg-[#C8102E] flex items-center justify-center text-white shadow-md">
                      <IconX size={20} />
                    </div>
                    <div className="text-[14px] font-bold text-[#C8102E] tracking-wide">INCOMPATÍVEL</div>
                    <div className="text-[10px] text-[#C8102E]/70 text-center leading-tight">Selecione uma<br/>alternativa</div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Explanation */}
          <div className="px-6 py-4 bg-slate-50/50 border-b border-slate-100">
            <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-widest mb-2">Fundamentação clínica</div>
            <p className="text-[13px] text-slate-600 leading-relaxed">
              {COMPAT_EXPLANATIONS[activeDonor]?.[recipient] ?? explanation}
            </p>
          </div>
        </div>

        {/* ABO/Rh Matrix */}
        <div className="bg-white rounded-xl border border-slate-100 overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-100 flex items-center gap-3">
            <IconShieldCheck size={16} />
            <div className="text-[12px] font-semibold text-slate-700">Matriz de Compatibilidade ABO/Rh</div>
            <div className="ml-auto flex items-center gap-3 text-[11px] text-slate-400">
              <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-sm bg-emerald-100 border border-emerald-300 inline-block"></span>Compatível</span>
              <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-sm bg-slate-100 border border-slate-200 inline-block"></span>Incompatível</span>
              <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-sm bg-white border-2 border-[#C8102E] inline-block"></span>Combinação atual</span>
            </div>
          </div>
          <div className="p-5 overflow-x-auto">
            <table className="w-full text-center border-separate" style={{ borderSpacing: 3 }}>
              <thead>
                <tr>
                  <th className="px-2 py-1 text-[10px] font-semibold text-slate-400 text-right w-20">
                    <div className="text-[9px] uppercase tracking-widest text-slate-300">Doador ↓ / Receptor →</div>
                  </th>
                  {BLOOD_TYPES.map((col) => (
                    <th key={col} className={`px-1 py-1.5 text-[12px] font-bold rounded-md ${col === recipient ? "bg-blue-50 text-blue-700" : "text-slate-500"}`}
                      style={{ fontFamily: "'JetBrains Mono', monospace", minWidth: 44 }}>
                      {col}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {BLOOD_TYPES.map((row) => (
                  <tr key={row}>
                    <td className={`text-right pr-2 text-[12px] font-bold rounded-md ${row === activeDonor ? "bg-[#FFF0F2] text-[#C8102E]" : "text-slate-500"}`}
                      style={{ fontFamily: "'JetBrains Mono', monospace" }}>
                      {row}
                    </td>
                    {BLOOD_TYPES.map((col) => {
                      const ok = COMPAT[row]?.includes(col);
                      const isHighlight = row === activeDonor && col === recipient;
                      return (
                        <td key={col}
                          className={`rounded-md text-[11px] font-semibold transition-all ${
                            isHighlight
                              ? ok
                                ? "bg-emerald-50 text-emerald-600 ring-2 ring-[#C8102E] ring-offset-1"
                                : "bg-[#FFF0F2] text-[#C8102E] ring-2 ring-[#C8102E] ring-offset-1"
                              : ok
                              ? "bg-emerald-50 text-emerald-600"
                              : "bg-slate-100 text-slate-300"
                          }`}
                          style={{ padding: "6px 4px" }}
                        >
                          {ok ? "✓" : "–"}
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Alternatives (only when incompatible) */}
        {!isCompatible && alts.length > 0 && (
          <div className="bg-white rounded-xl border border-slate-100 overflow-hidden">
            <div className="px-5 py-4 border-b border-slate-100 flex items-center gap-3">
              <div className="w-7 h-7 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center flex-shrink-0">
                <IconAlertTriangle size={14} />
              </div>
              <div>
                <div className="text-[12px] font-semibold text-slate-700">Bolsas alternativas compatíveis disponíveis no estoque</div>
                <div className="text-[11px] text-slate-400 mt-0.5">Selecione uma alternativa para substituir a bolsa candidata original</div>
              </div>
            </div>
            <div className="p-5 grid grid-cols-3 gap-3">
              {alts.map((alt, i) => {
                const altOk = COMPAT[alt.bt]?.includes(recipient);
                const isSelected = selectedAlt?.bt === alt.bt && selectedAlt?.institution === alt.institution;
                return (
                  <button
                    key={i}
                    onClick={() => setSelectedAlt(isSelected ? null : alt)}
                    className={`text-left rounded-xl border-2 p-4 transition-all hover:shadow-sm ${
                      isSelected
                        ? "border-[#C8102E] bg-[#FFF0F2]/50"
                        : "border-slate-100 bg-white hover:border-slate-200"
                    }`}
                  >
                    <div className="flex items-start justify-between mb-2">
                      <span className="text-[18px] font-bold text-[#C8102E]" style={{ fontFamily: "'JetBrains Mono', monospace" }}>{alt.bt}</span>
                      {altOk && (
                        <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 flex items-center gap-1">
                          <IconCheck size={10} /> compatível
                        </span>
                      )}
                    </div>
                    <div className="text-[12px] font-medium text-slate-700 leading-snug">{alt.institution}</div>
                    <div className="text-[11px] text-slate-400 mt-1.5 flex items-center gap-1"><IconDroplet size={10} />{alt.qty} unidades disponíveis</div>
                    {isSelected && (
                      <div className="mt-2.5 text-[11px] font-semibold text-[#C8102E] flex items-center gap-1"><IconCheck size={11} /> Selecionada</div>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="bg-white rounded-xl border border-slate-100 px-6 py-4 flex items-center justify-between">
          <div className="text-[12.5px] text-slate-500">
            {activeCompatible
              ? <span className="flex items-center gap-2 text-emerald-600 font-medium"><IconCheck size={14} /> Combinação verificada e aprovada para alocação</span>
              : selectedAlt
              ? <span className="flex items-center gap-2 text-amber-600 font-medium"><IconAlertTriangle size={14} /> Alternativa selecionada — confirme para registrar a substituição</span>
              : <span className="flex items-center gap-2 text-[#C8102E] font-medium"><IconX size={14} /> Selecione uma bolsa alternativa compatível para prosseguir</span>
            }
          </div>
          <button
            onClick={onConfirm}
            disabled={!activeCompatible}
            className="flex items-center gap-2 px-6 py-2.5 rounded-lg text-[13.5px] font-semibold transition-colors disabled:cursor-not-allowed
              bg-[#C8102E] text-white hover:bg-[#a00d24] disabled:bg-slate-200 disabled:text-slate-400"
          >
            <IconCheck size={15} /> Confirmar Alocação
          </button>
        </div>
      </div>
    </div>
  );
}
