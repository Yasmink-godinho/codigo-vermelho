// Tela de Nova Instituição — US15

import { useState } from "react";
import { IconAlertTriangle, IconBuilding, IconCheck } from "@/components/icons";
import { bloodTypes } from "@/data/mockData";
import type { CadastroForm, Hospital, InstType, Institution } from "@/types";

export default function CadastrarInstituicaoScreen({
  onCancel,
  onSave,
}: {
  onCancel: () => void;
  onSave: (inst: Omit<Institution, "id" | "hasHistory">) => void;
}) {
  const [form, setForm] = useState<CadastroForm>({
    name: "",
    type: "Hospital Público",
    location: "",
    lat: "",
    lng: "",
    status: "ativa",
    minStock: Object.fromEntries(bloodTypes.map((bt) => [bt, ""])),
  });
  const [submitted, setSubmitted] = useState(false);

  const latNum = parseFloat(form.lat);
  const lngNum = parseFloat(form.lng);
  const latInvalid = form.lat !== "" && (isNaN(latNum) || latNum < -90 || latNum > 90);
  const lngInvalid = form.lng !== "" && (isNaN(lngNum) || lngNum < -180 || lngNum > 180);
  const coordsError = latInvalid || lngInvalid;

  const nameError = submitted && !form.name.trim();
  const canSave = form.name.trim() && !coordsError;

  const typeBadgeCfg: Record<InstType, string> = {
    "Hospital Público":  "bg-blue-50 text-blue-700",
    "Hospital Privado":  "bg-violet-50 text-violet-700",
    "UPA":               "bg-orange-50 text-orange-700",
    "Hemocentro":        "bg-[#FFF0F2] text-[#C8102E]",
    "Maternidade":       "bg-pink-50 text-pink-700",
    "Clínica":           "bg-teal-50 text-teal-700",
  };

  function handleSubmit() {
    setSubmitted(true);
    if (!form.name.trim() || coordsError) return;
    onSave({
      name: form.name.trim(),
      type: form.type,
      location: form.location.trim(),
      neighborhood: "",
      status: form.status,
      relations: 0,
      components: [],
    });
  }

  const inputBase = "w-full px-3.5 py-2.5 rounded-lg border text-[13.5px] focus:outline-none focus:ring-2 focus:ring-[#C8102E]/20 focus:border-[#C8102E]/60 transition-all bg-white";
  const inputNormal = `${inputBase} border-slate-200`;
  const inputError = `${inputBase} border-[#C8102E] bg-[#FFF0F2]/40`;

  return (
    <div className="px-8 py-7 max-w-3xl mx-auto">
      {/* Back crumb */}
      <button
        onClick={onCancel}
        className="flex items-center gap-2 text-[13px] text-slate-500 hover:text-slate-700 font-medium mb-6 transition-colors"
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="15 18 9 12 15 6"/>
        </svg>
        Voltar para Instituições
      </button>

      <div className="bg-white rounded-xl border border-slate-100 shadow-sm overflow-hidden">
        {/* Form header */}
        <div className="px-7 py-5 border-b border-slate-100 bg-gradient-to-r from-slate-50 to-white">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-[#FFF0F2] text-[#C8102E] flex items-center justify-center flex-shrink-0">
              <IconBuilding size={18} />
            </div>
            <div>
              <h2 className="text-[15px] font-semibold text-slate-800">Cadastrar Nova Instituição</h2>
              <p className="text-[12px] text-slate-400 mt-0.5">Preencha as informações para adicionar a instituição à rede logística.</p>
            </div>
          </div>
        </div>

        <div className="px-7 py-6 space-y-6">
          {/* Nome */}
          <div>
            <label className="block text-[11px] font-semibold text-slate-500 uppercase tracking-widest mb-1.5">
              Nome da Instituição <span className="text-[#C8102E]">*</span>
            </label>
            <input
              type="text"
              value={form.name}
              onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
              placeholder="Ex: Hospital das Clínicas de Pernambuco"
              className={nameError ? inputError : inputNormal}
            />
            {nameError && (
              <div className="flex items-center gap-1.5 mt-1.5 text-[12px] text-[#C8102E]">
                <IconAlertTriangle size={13} /> Campo obrigatório
              </div>
            )}
          </div>

          {/* Tipo */}
          <div>
            <label className="block text-[11px] font-semibold text-slate-500 uppercase tracking-widest mb-1.5">Tipo de Instituição</label>
            <div className="flex flex-wrap gap-2">
              {(["Hospital Público","Hospital Privado","UPA","Hemocentro","Maternidade","Clínica"] as InstType[]).map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => setForm((f) => ({ ...f, type: t }))}
                  className={`px-3 py-1.5 rounded-full text-[12.5px] font-medium border-2 transition-all ${
                    form.type === t
                      ? `${typeBadgeCfg[t]} border-current shadow-sm`
                      : "bg-white text-slate-400 border-slate-200 hover:border-slate-300"
                  }`}
                >
                  {t}
                </button>
              ))}
            </div>
          </div>

          {/* Endereço */}
          <div>
            <label className="block text-[11px] font-semibold text-slate-500 uppercase tracking-widest mb-1.5">Endereço Completo</label>
            <input
              type="text"
              value={form.location}
              onChange={(e) => setForm((f) => ({ ...f, location: e.target.value }))}
              placeholder="Ex: Av. Prof. Moraes Rego, s/n — Cidade Universitária, Recife — PE"
              className={inputNormal}
            />
          </div>

          {/* Coordenadas */}
          <div>
            <label className="block text-[11px] font-semibold text-slate-500 uppercase tracking-widest mb-1.5">Coordenadas Geográficas</label>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <div className="text-[11px] text-slate-400 mb-1">Latitude <span className="text-slate-300">(-90 a 90)</span></div>
                <input
                  type="number"
                  step="any"
                  value={form.lat}
                  onChange={(e) => setForm((f) => ({ ...f, lat: e.target.value }))}
                  placeholder="-8.0539"
                  className={latInvalid ? inputError : inputNormal}
                  style={{ fontFamily: "'JetBrains Mono', monospace" }}
                />
              </div>
              <div>
                <div className="text-[11px] text-slate-400 mb-1">Longitude <span className="text-slate-300">(-180 a 180)</span></div>
                <input
                  type="number"
                  step="any"
                  value={form.lng}
                  onChange={(e) => setForm((f) => ({ ...f, lng: e.target.value }))}
                  placeholder="-34.9050"
                  className={lngInvalid ? inputError : inputNormal}
                  style={{ fontFamily: "'JetBrains Mono', monospace" }}
                />
              </div>
            </div>
            {coordsError && (
              <div className="flex items-center gap-2 mt-2 bg-[#FFF0F2] border border-[#F9D7DC] text-[#C8102E] text-[12.5px] px-3 py-2 rounded-lg">
                <span className="flex-shrink-0"><IconAlertTriangle size={14} /></span>
                Coordenadas inválidas — verifique os intervalos permitidos
              </div>
            )}
          </div>

          {/* Estoque mínimo */}
          <div>
            <label className="block text-[11px] font-semibold text-slate-500 uppercase tracking-widest mb-3">
              Estoque Mínimo de Segurança <span className="text-slate-300 normal-case tracking-normal font-normal">(unidades por tipo sanguíneo)</span>
            </label>
            <div className="grid grid-cols-4 gap-3">
              {bloodTypes.map((bt) => (
                <div key={bt} className="bg-slate-50 rounded-lg p-3 flex flex-col gap-2">
                  <div className="text-[13px] font-bold text-[#C8102E]" style={{ fontFamily: "'JetBrains Mono', monospace" }}>{bt}</div>
                  <input
                    type="number"
                    min="0"
                    value={form.minStock[bt]}
                    onChange={(e) => setForm((f) => ({ ...f, minStock: { ...f.minStock, [bt]: e.target.value } }))}
                    placeholder="0"
                    className="w-full px-2.5 py-1.5 rounded-md border border-slate-200 text-[13px] text-center focus:outline-none focus:ring-2 focus:ring-[#C8102E]/20 focus:border-[#C8102E]/50 bg-white"
                    style={{ fontFamily: "'JetBrains Mono', monospace" }}
                  />
                  <div className="text-[10px] text-slate-400 text-center leading-tight">unid. mín.</div>
                </div>
              ))}
            </div>
          </div>

          {/* Status toggle */}
          <div>
            <label className="block text-[11px] font-semibold text-slate-500 uppercase tracking-widest mb-3">Status Inicial</label>
            <div className="flex gap-3">
              {(["ativa", "inativa"] as const).map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => setForm((f) => ({ ...f, status: s }))}
                  className={`flex items-center gap-2.5 px-4 py-2.5 rounded-lg border-2 text-[13px] font-medium transition-all ${
                    form.status === s
                      ? s === "ativa"
                        ? "border-emerald-400 bg-emerald-50 text-emerald-700"
                        : "border-slate-300 bg-slate-100 text-slate-600"
                      : "border-slate-200 bg-white text-slate-400 hover:border-slate-300"
                  }`}
                >
                  <span className={`w-2.5 h-2.5 rounded-full ${s === "ativa" ? "bg-emerald-400" : "bg-slate-300"}`}></span>
                  {s === "ativa" ? "Ativa" : "Inativa"}
                </button>
              ))}
            </div>
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
              className="px-5 py-2.5 rounded-lg border border-slate-200 text-[13.5px] font-medium text-slate-600 hover:bg-slate-100 transition-colors"
            >
              Cancelar
            </button>
            <button
              onClick={handleSubmit}
              disabled={!canSave && submitted}
              className="px-6 py-2.5 rounded-lg bg-[#C8102E] text-white text-[13.5px] font-semibold hover:bg-[#a00d24] transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              <IconCheck size={15} /> Salvar Instituição
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
