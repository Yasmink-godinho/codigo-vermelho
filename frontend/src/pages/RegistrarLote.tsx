// Tela de Registrar Lote — US13

import { useState } from "react";
import { IconAlertTriangle, IconCheck, IconChevronDown, IconDroplet } from "@/components/icons";
import { COMPONENT_VALIDITY_DAYS, LOTE_BLOOD_TYPES, LOTE_COMPONENTS, addDays, daysUntil, nextLotCode, todayISO } from "@/data/mockData";
import type { Institution, Lote, LoteComponent } from "@/types";

export default function RegistrarLoteScreen({ institutions, prefillInstId, lotes, onCancel, onSave }: {
  institutions: Institution[];
  prefillInstId: number | null;
  lotes: Lote[];
  onCancel: () => void;
  onSave: (lote: Omit<Lote, "id" | "createdAt">) => void;
}) {
  const [instId, setInstId] = useState<number>(prefillInstId ?? institutions[0]?.id ?? 0);
  const [bloodType, setBloodType] = useState("O-");
  const [component, setComponent] = useState<LoteComponent>("Concentrado de Hemácias");
  const [collectionDate, setCollectionDate] = useState(todayISO());
  const [expiryDate, setExpiryDate] = useState(addDays(todayISO(), COMPONENT_VALIDITY_DAYS["Concentrado de Hemácias"]));
  const [expiryManual, setExpiryManual] = useState(false);
  const [quantity, setQuantity] = useState("");
  const [lotCode, setLotCode] = useState(() => nextLotCode(lotes));
  const [submitted, setSubmitted] = useState(false);

  const instName = institutions.find((i) => i.id === instId)?.name ?? "";

  // Auto-recalculate expiry when component or collection date changes (unless manually edited)
  function handleComponentChange(c: LoteComponent) {
    setComponent(c);
    if (!expiryManual) setExpiryDate(addDays(collectionDate, COMPONENT_VALIDITY_DAYS[c]));
  }
  function handleCollectionChange(d: string) {
    setCollectionDate(d);
    if (!expiryManual) setExpiryDate(addDays(d, COMPONENT_VALIDITY_DAYS[component]));
  }

  const expiryDays = daysUntil(expiryDate);
  const expiryInvalid = expiryDays < 0;
  const quantityInvalid = submitted && (!quantity || Number(quantity) <= 0);

  const canSubmit = !expiryInvalid && instId && bloodType && quantity && Number(quantity) > 0 && lotCode.trim();

  function handleSubmit() {
    setSubmitted(true);
    if (!canSubmit) return;
    onSave({ instId, instName, bloodType, component, collectionDate, expiryDate, quantity: Number(quantity), lotCode: lotCode.trim() });
  }

  const inputBase = "w-full px-3.5 py-2.5 rounded-lg border text-[13.5px] focus:outline-none focus:ring-2 focus:ring-[#C8102E]/20 focus:border-[#C8102E]/60 transition-all bg-white";
  const inp = `${inputBase} border-slate-200`;
  const inpErr = `${inputBase} border-[#C8102E] bg-[#FFF0F2]/40`;

  const btBadge: Record<string, string> = {
    "O-":"bg-[#FFF0F2] text-[#C8102E]","O+":"bg-[#FFF0F2] text-[#C8102E]",
    "A-":"bg-blue-50 text-blue-700","A+":"bg-blue-50 text-blue-700",
    "B-":"bg-violet-50 text-violet-700","B+":"bg-violet-50 text-violet-700",
    "AB-":"bg-amber-50 text-amber-700","AB+":"bg-amber-50 text-amber-700",
  };

  return (
    <div className="px-8 py-7 max-w-2xl mx-auto">
      <button onClick={onCancel} className="flex items-center gap-2 text-[13px] text-slate-500 hover:text-slate-700 font-medium mb-6 transition-colors">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="15 18 9 12 15 6"/>
        </svg>
        Voltar para Instituições
      </button>

      <div className="bg-white rounded-xl border border-slate-100 shadow-sm overflow-hidden">
        {/* Header */}
        <div className="px-7 py-5 border-b border-slate-100 bg-gradient-to-r from-slate-50 to-white">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-[#FFF0F2] text-[#C8102E] flex items-center justify-center flex-shrink-0">
              <IconDroplet size={18} />
            </div>
            <div>
              <h2 className="text-[15px] font-semibold text-slate-800">Registrar Novo Lote</h2>
              <p className="text-[12px] text-slate-400 mt-0.5">Registre um lote de hemocomponente para controle de estoque.</p>
            </div>
          </div>
        </div>

        <div className="px-7 py-6 space-y-5">
          {/* Instituição */}
          <div>
            <label className="block text-[11px] font-semibold text-slate-500 uppercase tracking-widest mb-1.5">Instituição <span className="text-[#C8102E]">*</span></label>
            <div className="relative">
              <select
                value={instId}
                onChange={(e) => setInstId(Number(e.target.value))}
                className={`appearance-none ${inp} pr-9`}
              >
                {institutions.filter(i => i.status !== "inativa").map((i) => (
                  <option key={i.id} value={i.id}>{i.name}</option>
                ))}
              </select>
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none"><IconChevronDown size={13} /></span>
            </div>
          </div>

          {/* Tipo sanguíneo */}
          <div>
            <label className="block text-[11px] font-semibold text-slate-500 uppercase tracking-widest mb-2">Tipo Sanguíneo <span className="text-[#C8102E]">*</span></label>
            <div className="flex flex-wrap gap-2">
              {LOTE_BLOOD_TYPES.map((bt) => (
                <button
                  key={bt}
                  type="button"
                  onClick={() => setBloodType(bt)}
                  className={`px-3.5 py-1.5 rounded-full text-[13px] font-bold border-2 transition-all ${
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
          </div>

          {/* Componente */}
          <div>
            <label className="block text-[11px] font-semibold text-slate-500 uppercase tracking-widest mb-1.5">Componente <span className="text-[#C8102E]">*</span></label>
            <div className="grid grid-cols-2 gap-2">
              {LOTE_COMPONENTS.map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => handleComponentChange(c)}
                  className={`flex items-center gap-2 px-3.5 py-2.5 rounded-lg border-2 text-[13px] font-medium transition-all text-left ${
                    component === c
                      ? "border-[#C8102E] bg-[#FFF0F2]/50 text-[#C8102E]"
                      : "border-slate-200 bg-white text-slate-500 hover:border-slate-300"
                  }`}
                >
                  <span className={`w-2 h-2 rounded-full flex-shrink-0 ${component === c ? "bg-[#C8102E]" : "bg-slate-300"}`}></span>
                  {c}
                  <span className="ml-auto text-[10px] text-slate-400 font-normal">{COMPONENT_VALIDITY_DAYS[c]}d</span>
                </button>
              ))}
            </div>
          </div>

          {/* Datas */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-[11px] font-semibold text-slate-500 uppercase tracking-widest mb-1.5">Data de Coleta <span className="text-[#C8102E]">*</span></label>
              <input
                type="date"
                value={collectionDate}
                onChange={(e) => handleCollectionChange(e.target.value)}
                className={inp}
              />
            </div>
            <div>
              <label className="block text-[11px] font-semibold text-slate-500 uppercase tracking-widest mb-1.5">
                Data de Validade <span className="text-[#C8102E]">*</span>
                {!expiryManual && <span className="ml-1 text-[9px] bg-slate-100 text-slate-400 px-1.5 py-0.5 rounded-full font-normal">auto</span>}
              </label>
              <input
                type="date"
                value={expiryDate}
                onChange={(e) => { setExpiryDate(e.target.value); setExpiryManual(true); }}
                className={expiryInvalid ? inpErr : inp}
              />
              {expiryInvalid && (
                <div className="flex items-center gap-1.5 mt-1.5 text-[12px] text-[#C8102E]">
                  <IconAlertTriangle size={13} /> Data de validade não pode ser retroativa
                </div>
              )}
              {!expiryInvalid && expiryDate && (
                <div className={`mt-1.5 text-[11px] font-medium ${expiryDays <= 3 ? "text-amber-600" : "text-slate-400"}`}>
                  {expiryDays === 0 ? "Vence hoje" : expiryDays > 0 ? `${expiryDays} dias restantes` : "Vencido"}
                </div>
              )}
            </div>
          </div>

          {/* Quantidade + Código */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-[11px] font-semibold text-slate-500 uppercase tracking-widest mb-1.5">Quantidade (unidades) <span className="text-[#C8102E]">*</span></label>
              <input
                type="number"
                min="1"
                value={quantity}
                onChange={(e) => setQuantity(e.target.value)}
                placeholder="Ex: 12"
                className={quantityInvalid ? inpErr : inp}
                style={{ fontFamily: "'JetBrains Mono', monospace" }}
              />
              {quantityInvalid && (
                <div className="flex items-center gap-1.5 mt-1.5 text-[12px] text-[#C8102E]">
                  <IconAlertTriangle size={13} /> Quantidade obrigatória
                </div>
              )}
            </div>
            <div>
              <label className="block text-[11px] font-semibold text-slate-500 uppercase tracking-widest mb-1.5">
                Código do Lote
                <span className="ml-1 text-[9px] bg-slate-100 text-slate-400 px-1.5 py-0.5 rounded-full font-normal">gerado auto</span>
              </label>
              <input
                type="text"
                value={lotCode}
                onChange={(e) => setLotCode(e.target.value)}
                className={inp}
                style={{ fontFamily: "'JetBrains Mono', monospace" }}
              />
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-7 py-5 border-t border-slate-100 bg-slate-50/50 flex items-center justify-between">
          <div className="text-[12px] text-slate-400 flex items-center gap-1.5">
            <span className="text-[#C8102E]">*</span> Campos obrigatórios
          </div>
          <div className="flex items-center gap-3">
            <button onClick={onCancel} className="px-5 py-2.5 rounded-lg border border-slate-200 text-[13.5px] font-medium text-slate-600 hover:bg-slate-100 transition-colors">
              Cancelar
            </button>
            <button
              onClick={handleSubmit}
              className="px-6 py-2.5 rounded-lg bg-[#C8102E] text-white text-[13.5px] font-semibold hover:bg-[#a00d24] transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              disabled={submitted && !canSubmit}
            >
              <IconCheck size={15} /> Registrar Lote
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
