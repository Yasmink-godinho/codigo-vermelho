import { useState } from "react";
import { IconAlertTriangle, IconChevronDown, IconClipboard } from "@/components/icons";
import { LOTE_BLOOD_TYPES, LOTE_COMPONENTS, URGENCY_CFG } from "@/data/mockData";
import type { Institution, LoteComponent, ReqUrgency, Requisicao } from "@/types";

export default function NovaRequisicaoScreen({
                                               institutions,
                                               prefillInstId,
                                               onCancel,
                                               onSave,
                                             }: {
  institutions: Institution[];
  requisicoes?: Requisicao[];
  prefillInstId: number | null;
  onCancel: () => void;
  onSave: (req: Omit<Requisicao, "id" | "reqCode" | "status" | "createdAt">) => Promise<void> | void;
}) {
  const [instId, setInstId] = useState<number>(prefillInstId ?? institutions[0]?.id ?? 0);
  const [bloodType, setBt] = useState<string>("O-");
  const [component, setComp] = useState<LoteComponent>("Concentrado de Hemácias");
  const [quantity, setQty] = useState("");
  const [urgency, setUrgency] = useState<ReqUrgency>("rotina");
  const [observations, setObs] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [salvando, setSalvando] = useState(false);

  const instName = institutions.find((i) => Number(i.id) === Number(instId))?.name ?? "";

  const qtyInvalid = submitted && (!quantity.trim() || Number(quantity) <= 0);
  const instInvalid = submitted && !instId;
  const bloodTypeInvalid = submitted && !bloodType;
  const canSave = instId && bloodType && component && quantity && Number(quantity) > 0;

  async function handleSubmit() {
    if (salvando) return;
    setSubmitted(true);
    if (!canSave) return;

    setSalvando(true);
    try {
      await onSave({
        instId: Number(instId),
        instName,
        bloodType,
        component,
        quantity: Number(quantity),
        urgency,
        observations: observations.trim(),
      });
    } finally {
      setSalvando(false);
    }
  }

  const inp = "w-full px-3.5 py-2.5 rounded-lg border border-slate-200 text-[13.5px] focus:outline-none focus:ring-2 focus:ring-[#C8102E]/20 focus:border-[#C8102E]/60 transition-all bg-white";
  const inpErr = "w-full px-3.5 py-2.5 rounded-lg border border-[#C8102E] bg-[#FFF0F2]/40 text-[13.5px] focus:outline-none focus:ring-2 focus:ring-[#C8102E]/20 transition-all";

  const btBadge: Record<string, string> = {
    "O-": "bg-[#FFF0F2] text-[#C8102E]",
    "O+": "bg-[#FFF0F2] text-[#C8102E]",
    "A-": "bg-blue-50 text-blue-700",
    "A+": "bg-blue-50 text-blue-700",
    "B-": "bg-violet-50 text-violet-700",
    "B+": "bg-violet-50 text-violet-700",
    "AB-": "bg-amber-50 text-amber-700",
    "AB+": "bg-amber-50 text-amber-700",
  };

  return (
      <div className="px-8 py-7 max-w-2xl mx-auto">
        <button
            onClick={onCancel}
            className="flex items-center gap-2 text-[13px] text-slate-500 hover:text-slate-700 font-medium mb-6 transition-colors cursor-pointer"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="15 18 9 12 15 6" />
          </svg>
          Voltar para Requisições
        </button>

        <div className="bg-white rounded-xl border border-slate-100 shadow-sm overflow-hidden">
          {/* Header */}
          <div className="px-7 py-5 border-b border-slate-100 bg-gradient-to-r from-slate-50 to-white flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-[#FFF0F2] text-[#C8102E] flex items-center justify-center flex-shrink-0">
              <IconClipboard size={18} />
            </div>
            <div>
              <h2 className="text-[15px] font-semibold text-slate-800">Nova Requisição de Hemocomponente</h2>
              <p className="text-[12px] text-slate-400 mt-0.5">Preencha os dados clínicos para solicitar componentes na rede hemoterápica.</p>
            </div>
          </div>

          <div className="px-7 py-6 space-y-5">
            {/* Alerta de validação se submeter sem campos obrigatórios (Cenário Negativo BDD) */}
            {submitted && !canSave && (
                <div className="bg-[#FFF0F2] border border-[#C8102E]/30 rounded-lg p-3.5 flex items-center gap-2.5 text-[#C8102E] text-[12.5px] font-medium">
                  <IconAlertTriangle size={16} className="flex-shrink-0" />
                  <span>Por favor, informe a instituição, o tipo sanguíneo e o volume desejado antes de emitir.</span>
                </div>
            )}

            {/* Instituição solicitante */}
            <div>
              <label className="block text-[11px] font-semibold text-slate-500 uppercase tracking-widest mb-1.5">
                Instituição Solicitante <span className="text-[#C8102E]">*</span>
              </label>
              <div className="relative">
                <select
                    value={instId}
                    onChange={(e) => setInstId(Number(e.target.value))}
                    className={`appearance-none pr-9 cursor-pointer ${instInvalid ? inpErr : inp}`}
                >
                  {institutions
                      .filter((i) => i.status !== "inativa")
                      .map((i) => (
                          <option key={i.id} value={i.id}>
                            {i.name}
                          </option>
                      ))}
                </select>
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none">
                <IconChevronDown size={13} />
              </span>
              </div>
              {instInvalid && (
                  <div className="flex items-center gap-1.5 mt-1.5 text-[12px] text-[#C8102E]">
                    <IconAlertTriangle size={13} /> Selecione uma instituição solicitante
                  </div>
              )}
            </div>

            {/* Tipo sanguíneo */}
            <div>
              <label className="block text-[11px] font-semibold text-slate-500 uppercase tracking-widest mb-2">
                Tipo Sanguíneo <span className="text-[#C8102E]">*</span>
              </label>
              <div className="flex flex-wrap gap-2">
                {LOTE_BLOOD_TYPES.map((bt) => (
                    <button
                        key={bt}
                        type="button"
                        onClick={() => setBt(bt)}
                        className={`px-3.5 py-1.5 rounded-full text-[13px] font-bold border-2 transition-all cursor-pointer ${
                            bloodType === bt
                                ? `${btBadge[bt]} border-current shadow-sm`
                                : "bg-white text-slate-400 border-slate-200 hover:border-slate-300"
                        }`}
                        style={{ fontFamily: "'JetBrains Mono', monospace" }}
                    >
                      {bt}
                    </button>
                ))}
              </div>
              {bloodTypeInvalid && (
                  <div className="flex items-center gap-1.5 mt-1.5 text-[12px] text-[#C8102E]">
                    <IconAlertTriangle size={13} /> O tipo sanguíneo é obrigatório
                  </div>
              )}
            </div>

            {/* Componente */}
            <div>
              <label className="block text-[11px] font-semibold text-slate-500 uppercase tracking-widest mb-1.5">
                Componente <span className="text-[#C8102E]">*</span>
              </label>
              <div className="grid grid-cols-2 gap-2">
                {LOTE_COMPONENTS.map((c) => (
                    <button
                        key={c}
                        type="button"
                        onClick={() => setComp(c)}
                        className={`flex items-center gap-2 px-3.5 py-2.5 rounded-lg border-2 text-[13px] font-medium transition-all text-left cursor-pointer ${
                            component === c
                                ? "border-[#C8102E] bg-[#FFF0F2]/50 text-[#C8102E]"
                                : "border-slate-200 bg-white text-slate-500 hover:border-slate-300"
                        }`}
                    >
                      <span className={`w-2 h-2 rounded-full flex-shrink-0 ${component === c ? "bg-[#C8102E]" : "bg-slate-300"}`} />
                      {c}
                    </button>
                ))}
              </div>
            </div>

            {/* Volume + Urgência */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-[11px] font-semibold text-slate-500 uppercase tracking-widest mb-1.5">
                  Volume / Quantidade <span className="text-[#C8102E]">*</span>
                </label>
                <input
                    type="number"
                    min="1"
                    value={quantity}
                    onChange={(e) => setQty(e.target.value)}
                    placeholder="Ex: 4"
                    className={qtyInvalid ? inpErr : inp}
                    style={{ fontFamily: "'JetBrains Mono', monospace" }}
                />
                {qtyInvalid && (
                    <div className="flex items-center gap-1.5 mt-1.5 text-[12px] text-[#C8102E]">
                      <IconAlertTriangle size={13} /> O volume deve ser maior que zero
                    </div>
                )}
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-500 uppercase tracking-widest mb-2">
                  Nível de Urgência
                </label>
                <div className="flex gap-2">
                  {(["rotina", "prioritaria", "emergencia"] as ReqUrgency[]).map((u) => {
                    const cfg = URGENCY_CFG[u];
                    return (
                        <button
                            key={u}
                            type="button"
                            onClick={() => setUrgency(u)}
                            className={`flex-1 flex flex-col items-center gap-1 py-2 px-1 rounded-lg border-2 text-[11px] font-semibold transition-all cursor-pointer ${
                                urgency === u
                                    ? `${cfg.btn} border-current`
                                    : "border-slate-200 text-slate-400 bg-white hover:border-slate-300"
                            }`}
                        >
                          <span className={`w-2.5 h-2.5 rounded-full ${urgency === u ? cfg.dot : "bg-slate-200"}`} />
                          {cfg.label}
                        </button>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Observações */}
            <div>
              <label className="block text-[11px] font-semibold text-slate-500 uppercase tracking-widest mb-1.5">
                Observações Clínicas <span className="text-slate-300 normal-case tracking-normal font-normal text-[11px]">(opcional)</span>
              </label>
              <textarea
                  value={observations}
                  onChange={(e) => setObs(e.target.value)}
                  rows={3}
                  placeholder="Informações adicionais para atendimento clínico..."
                  className={`${inp} resize-none`}
              />
            </div>
          </div>

          {/* Footer */}
          <div className="px-7 py-5 border-t border-slate-100 bg-slate-50/50 flex items-center justify-between">
            <div className="text-[12px] text-slate-400 flex items-center gap-1.5">
              <span className="text-[#C8102E]">*</span> Campos obrigatórios
            </div>
            <div className="flex items-center gap-3">
              <button
                  onClick={onCancel}
                  disabled={salvando}
                  className="px-5 py-2.5 rounded-lg border border-slate-200 text-[13.5px] font-medium text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
              >
                Cancelar
              </button>
              <button
                  onClick={handleSubmit}
                  disabled={salvando}
                  className={`px-6 py-2.5 rounded-lg bg-[#C8102E] text-white text-[13.5px] font-semibold hover:bg-[#a00d24] transition-colors flex items-center gap-2 shadow-sm ${
                      salvando ? "opacity-60 cursor-not-allowed" : "cursor-pointer"
                  }`}
              >
                <IconClipboard size={15} /> {salvando ? "Emitindo..." : "Emitir Requisição"}
              </button>
            </div>
          </div>
        </div>
      </div>
  );
}