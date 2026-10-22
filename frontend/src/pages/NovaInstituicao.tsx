// Tela de Cadastro de Instituição — US01 (Geocodificação Dinâmica sem Pontos Fixos)

import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { IconAlertTriangle, IconBuilding, IconCheck } from "@/components/icons";
import { bloodTypes, neighborhoods } from "@/data/mockData";
import { cadastrarInstituicaoApi } from "@/data/api";
import type { CadastroForm, InstType } from "@/types";

export default function CadastrarInstituicaoScreen({
                                                     onCancel: propCancel,
                                                     onSave: propSave,
                                                   }: {
  onCancel?: () => void;
  onSave?: (inst: any) => Promise<void> | void;
}) {
  const navigate = useNavigate();

  const handleCancel = () => {
    if (propCancel) propCancel();
    else navigate("/instituicoes");
  };

  const [form, setForm] = useState<CadastroForm>({
    name: "",
    type: "Hospital Privado",
    location: "",
    lat: "",
    lng: "",
    status: "ativa",
    minStock: Object.fromEntries(bloodTypes.map((bt) => [bt, "10"])),
  });

  const [bairro, setBairro] = useState(neighborhoods[0] || "Derby");
  const [relations, setRelations] = useState(3);
  const [loadingGeocoding, setLoadingGeocoding] = useState(false);
  const [geoFeedback, setGeoFeedback] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);
  const [salvando, setSalvando] = useState(false);

  async function buscarCoordenadas(nomeOuEndereco?: string) {
    const end = (nomeOuEndereco || form.location || form.name || bairro).trim();
    if (!end) return;

    setLoadingGeocoding(true);
    setGeoFeedback(null);

    try {
      const query = encodeURIComponent(`${end}, Recife, Pernambuco, Brasil`);
      const response = await fetch(
          `https://nominatim.openstreetmap.org/search?format=json&q=${query}&limit=1`,
          {
            headers: {
              "Accept-Language": "pt-BR",
              "User-Agent": "CodigoVermelhoLogistica/1.0",
            },
          }
      );

      if (response.ok) {
        const data = await response.json();
        if (data && data.length > 0) {
          setForm((f) => ({
            ...f,
            lat: parseFloat(data[0].lat).toFixed(6),
            lng: parseFloat(data[0].lon).toFixed(6),
          }));
          setGeoFeedback(`Coordenadas localizadas: (${parseFloat(data[0].lat).toFixed(4)}, ${parseFloat(data[0].lon).toFixed(4)})`);
          return;
        }
      }

      setGeoFeedback("Endereço não localizado com precisão. Informe a latitude e longitude manualmente.");
    } catch {
      setGeoFeedback("Falha na consulta de geolocalização. Informe as coordenadas manualmente.");
    } finally {
      setLoadingGeocoding(false);
    }
  }

  function handleBairroChange(novoBairro: string) {
    setBairro(novoBairro);
    if (!form.location) {
      buscarCoordenadas(novoBairro);
    }
  }

  const latNum = parseFloat(form.lat);
  const lngNum = parseFloat(form.lng);
  const latInvalid = form.lat === "" || isNaN(latNum) || latNum < -90 || latNum > 90;
  const lngInvalid = form.lng === "" || isNaN(lngNum) || lngNum < -180 || lngNum > 180;
  const coordsError = submitted && (latInvalid || lngInvalid);
  const nameError = submitted && !form.name.trim();

  async function handleSubmit() {
    if (salvando) return;
    setSubmitted(true);
    if (!form.name.trim() || latInvalid || lngInvalid) return;

    setSalvando(true);
    const minStockFormatado: Record<string, number> = {};
    Object.entries(form.minStock).forEach(([tipo, qtd]) => {
      minStockFormatado[tipo] = qtd ? parseInt(String(qtd), 10) || 0 : 0;
    });

    const novaInst = {
      name: form.name.trim(),
      type: form.type,
      location: form.location.trim() || `${bairro}, Recife - PE`,
      neighborhood: bairro,
      latitude: latNum,
      longitude: lngNum,
      status: form.status,
      relations: Number(relations),
      components: ["O-", "O+", "A-", "A+", "B-", "B+", "AB-", "AB+"],
      minStock: minStockFormatado,
    };

    try {
      if (propSave) {
        await propSave(novaInst);
      } else {
        await cadastrarInstituicaoApi(novaInst);
        navigate("/instituicoes");
      }
    } catch (err) {
      console.warn("Erro ao salvar instituição:", err);
      navigate("/instituicoes");
    } finally {
      setSalvando(false);
    }
  }

  const typeBadgeCfg: Record<InstType, string> = {
    "Hospital Público":  "bg-blue-50 text-blue-700",
    "Hospital Privado":  "bg-violet-50 text-violet-700",
    "UPA":               "bg-orange-50 text-orange-700",
    "Hemocentro":        "bg-[#FFF0F2] text-[#C8102E]",
    "Maternidade":       "bg-pink-50 text-pink-700",
    "Clínica":           "bg-teal-50 text-teal-700",
  };

  const inputBase = "w-full px-3.5 py-2.5 rounded-lg border text-[13.5px] focus:outline-none focus:ring-2 focus:ring-[#C8102E]/20 focus:border-[#C8102E]/60 transition-all bg-white";
  const inputNormal = `${inputBase} border-slate-200`;
  const inputError = `${inputBase} border-[#C8102E] bg-[#FFF0F2]/40`;

  return (
      <div className="px-8 py-7 max-w-4xl mx-auto">
        <button
            onClick={handleCancel}
            className="flex items-center gap-2 text-[13px] text-slate-500 hover:text-slate-700 font-medium mb-6 transition-colors cursor-pointer"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="15 18 9 12 15 6"/>
          </svg>
          Voltar para Instituições
        </button>

        <div className="bg-white rounded-xl border border-slate-100 shadow-sm overflow-hidden">
          <div className="px-7 py-5 border-b border-slate-100 bg-gradient-to-r from-slate-50 to-white">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-[#FFF0F2] text-[#C8102E] flex items-center justify-center flex-shrink-0">
                <IconBuilding size={18} />
              </div>
              <div>
                <h2 className="text-[16px] font-semibold text-slate-800">Cadastrar Nova Instituição</h2>
                <p className="text-[12px] text-slate-400 mt-0.5">
                  O endereço digitado busca as coordenadas reais automaticamente via OpenStreetMap.
                </p>
              </div>
            </div>
          </div>

          <div className="px-7 py-6 space-y-6">
            <div>
              <label className="block text-[11px] font-semibold text-slate-500 uppercase tracking-widest mb-1.5">
                Nome da Instituição <span className="text-[#C8102E]">*</span>
              </label>
              <input
                  type="text"
                  value={form.name}
                  onBlur={() => buscarCoordenadas()}
                  onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                  placeholder="Ex: Hospital da Restauração"
                  className={nameError ? inputError : inputNormal}
              />
              {nameError && (
                  <div className="flex items-center gap-1.5 mt-1.5 text-[12px] text-[#C8102E]">
                    <IconAlertTriangle size={13} /> Campo obrigatório
                  </div>
              )}
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-slate-500 uppercase tracking-widest mb-1.5">
                Tipo de Instituição
              </label>
              <div className="flex flex-wrap gap-2">
                {(["Hospital Público", "Hospital Privado", "UPA", "Hemocentro", "Maternidade", "Clínica"] as InstType[]).map((t) => (
                    <button
                        key={t}
                        type="button"
                        onClick={() => setForm((f) => ({ ...f, type: t }))}
                        className={`px-3 py-1.5 rounded-full text-[12.5px] font-medium border-2 transition-all cursor-pointer ${
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

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-[11px] font-semibold text-slate-500 uppercase tracking-widest mb-1.5">
                  Bairro (Pernambuco / RMR) <span className="text-[#C8102E]">*</span>
                </label>
                <select
                    value={bairro}
                    onChange={(e) => handleBairroChange(e.target.value)}
                    className={inputNormal}
                >
                  {neighborhoods.map((b) => (
                      <option key={b} value={b}>{b}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-500 uppercase tracking-widest mb-1.5">
                  Relações Logísticas
                </label>
                <input
                    type="number"
                    min={0}
                    value={relations}
                    onChange={(e) => setRelations(Number(e.target.value))}
                    className={inputNormal}
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-500 uppercase tracking-widest mb-1.5">
                  Status Inicial
                </label>
                <select
                    value={form.status}
                    onChange={(e) => setForm((f) => ({ ...f, status: e.target.value as any }))}
                    className={inputNormal}
                >
                  <option value="ativa">Ativa</option>
                  <option value="inativa">Inativa</option>
                  <option value="em_analise">Em análise</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-slate-500 uppercase tracking-widest mb-1.5">
                Endereço Completo
              </label>
              <div className="flex gap-2">
                <input
                    type="text"
                    value={form.location}
                    onBlur={() => buscarCoordenadas()}
                    onChange={(e) => setForm((f) => ({ ...f, location: e.target.value }))}
                    placeholder="Ex: Av. Gov. Agamenon Magalhães, s/n — Derby, Recife - PE"
                    className={inputNormal}
                />
                <button
                    type="button"
                    onClick={() => buscarCoordenadas()}
                    disabled={loadingGeocoding}
                    className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-[12.5px] font-medium rounded-lg border border-slate-200 flex-shrink-0 transition-colors cursor-pointer"
                >
                  {loadingGeocoding ? "Localizando..." : "Buscar Coordenadas"}
                </button>
              </div>
            </div>

            {geoFeedback && (
                <div className="text-[12px] text-emerald-700 bg-emerald-50 border border-emerald-200 px-3.5 py-2.5 rounded-lg">
                  {geoFeedback}
                </div>
            )}

            <div>
              <label className="block text-[11px] font-semibold text-slate-500 uppercase tracking-widest mb-1.5">
                Coordenadas de Georreferenciamento <span className="text-[#C8102E]">*</span>
              </label>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <div className="text-[11px] text-slate-400 mb-1">Latitude</div>
                  <input
                      type="number"
                      step="any"
                      value={form.lat}
                      onChange={(e) => setForm((f) => ({ ...f, lat: e.target.value }))}
                      placeholder="-8.0539"
                      className={coordsError && latInvalid ? inputError : inputNormal}
                      style={{ fontFamily: "'JetBrains Mono', monospace" }}
                  />
                </div>
                <div>
                  <div className="text-[11px] text-slate-400 mb-1">Longitude</div>
                  <input
                      type="number"
                      step="any"
                      value={form.lng}
                      onChange={(e) => setForm((f) => ({ ...f, lng: e.target.value }))}
                      placeholder="-34.8988"
                      className={coordsError && lngInvalid ? inputError : inputNormal}
                      style={{ fontFamily: "'JetBrains Mono', monospace" }}
                  />
                </div>
              </div>
              {coordsError && (
                  <div className="flex items-center gap-1.5 mt-1.5 text-[12px] text-[#C8102E]">
                    <IconAlertTriangle size={13} /> Informe coordenadas válidas para plotagem no mapa.
                  </div>
              )}
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-slate-500 uppercase tracking-widest mb-3">
                Estoque Mínimo de Segurança (minStock) <span className="text-slate-400 normal-case font-normal">(unidades por tipo)</span>
              </label>
              <div className="grid grid-cols-4 gap-3">
                {bloodTypes.map((bt) => (
                    <div key={bt} className="bg-slate-50 rounded-lg p-3 flex flex-col gap-1.5">
                      <div className="text-[13px] font-bold text-[#C8102E]" style={{ fontFamily: "'JetBrains Mono', monospace" }}>{bt}</div>
                      <input
                          type="number"
                          min="0"
                          value={form.minStock[bt]}
                          onChange={(e) => setForm((f) => ({ ...f, minStock: { ...f.minStock, [bt]: e.target.value } }))}
                          className="w-full px-2.5 py-1.5 rounded-md border border-slate-200 text-[13px] text-center focus:outline-none focus:ring-2 focus:ring-[#C8102E]/20 bg-white"
                          style={{ fontFamily: "'JetBrains Mono', monospace" }}
                      />
                      <div className="text-[10px] text-slate-400 text-center">unid. mín.</div>
                    </div>
                ))}
              </div>
            </div>
          </div>

          <div className="px-7 py-5 border-t border-slate-100 bg-slate-50/50 flex items-center justify-between">
            <button
                onClick={handleCancel}
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
              <IconCheck size={15} /> {salvando ? "A salvar..." : "Salvar Instituição"}
            </button>
          </div>
        </div>
      </div>
  );
}