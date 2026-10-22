import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { IconBuilding, IconDroplet, IconPlus } from "@/components/icons";
import { daysUntil } from "@/data/mockData";
import { buscarLotesPorInstituicaoApi } from "@/data/api";
import type { Institution, Lote } from "@/types";

function normalizarLoteApi(item: any, fallbackInstId: number): Lote {
  return {
    id: Number(item.id),
    instId: Number(item.instituicaoId || item.instId || fallbackInstId),
    instName: item.instName || "Unidade",
    bloodType: (item.bloodType || (item.tipoSanguineo ? item.tipoSanguineo.replace("_NEGATIVO", "-").replace("_POSITIVO", "+") : "O-")) as any,
    component: (item.component || (item.tipoComponente === "CONCENTRADO_HEMACIAS" ? "Concentrado de Hemácias" : item.tipoComponente === "PLAQUETAS" ? "Plaquetas" : "Plasma")) as any,
    collectionDate: String(item.collectionDate || item.dataColeta || new Date().toISOString().split("T")[0]),
    expiryDate: String(item.expiryDate || item.dataValidade || new Date().toISOString().split("T")[0]),
    quantity: Number(item.quantity !== undefined ? item.quantity : item.quantidade !== undefined ? item.quantidade : 1),
    lotCode: String(item.lotCode || item.codigoLote || item.codigo || `LT-${item.id}`),
    status: item.status || "normal",
  };
}

export default function EstoqueInstituicaoScreen({
                                                   institutions,
                                                   lotes: initialLotes,
                                                   newLoteId,
                                                   onBack,
                                                   onRegistrarLote
                                                 }: {
  institutions: Institution[];
  instId?: number;
  lotes: Lote[];
  newLoteId: number | null;
  onBack?: () => void;
  onRegistrarLote?: (instId: number) => void;
}) {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const currentInstId = Number(id) || 1;

  const inst = institutions.find((i) => Number(i.id) === currentInstId);
  const [instLotes, setInstLotes] = useState<Lote[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let montado = true;
    setLoading(true);

    buscarLotesPorInstituicaoApi(currentInstId)
        .then((dados) => {
          if (!montado) return;
          if (dados && Array.isArray(dados) && dados.length > 0) {
            const normalizados = dados.map((d) => normalizarLoteApi(d, currentInstId));
            setInstLotes(normalizados);
          } else {
            setInstLotes(initialLotes.filter((l) => Number(l.instId) === currentInstId));
          }
        })
        .catch((err) => {
          if (!montado) return;
          console.warn("Aviso ao buscar estoque:", err);
          setInstLotes(initialLotes.filter((l) => Number(l.instId) === currentInstId));
        })
        .finally(() => {
          if (montado) setLoading(false);
        });

    return () => {
      montado = false;
    };
  }, [currentInstId, initialLotes]);

  const typeBadge: Record<string, string> = {
    "O-":"bg-[#FFF0F2] text-[#C8102E] border border-[#C8102E]/20","O+":"bg-[#FFF0F2] text-[#C8102E] border border-[#C8102E]/20",
    "A-":"bg-blue-50 text-blue-700 border border-blue-200","A+":"bg-blue-50 text-blue-700 border border-blue-200",
    "B-":"bg-violet-50 text-violet-700 border border-violet-200","B+":"bg-violet-50 text-violet-700 border border-violet-200",
    "AB-":"bg-amber-50 text-amber-700 border border-amber-200","AB+":"bg-amber-50 text-amber-700 border border-amber-200",
  };

  const compBadge: Record<string, string> = {
    "Concentrado de Hemácias": "bg-rose-50 text-rose-700",
    "Plasma": "bg-blue-50 text-blue-700",
    "Plaquetas": "bg-violet-50 text-violet-700",
    "Crioprecipitado": "bg-teal-50 text-teal-700",
  };

  function expiryBadge(dateStr: string): { cls: string; label: string } {
    const d = daysUntil(dateStr);
    if (d < 0) return { cls: "bg-slate-100 text-slate-400", label: "Vencido" };
    if (d <= 3) return { cls: "bg-amber-50 text-amber-700 border border-amber-200", label: `${d}d restantes` };
    if (d <= 7) return { cls: "bg-amber-50 text-amber-600", label: `${d}d restantes` };
    return { cls: "bg-emerald-50 text-emerald-700", label: `${d}d restantes` };
  }

  const totalUnits = instLotes.reduce((s, l) => s + (l.quantity || 1), 0);
  const expiringCount = instLotes.filter((l) => { const d = daysUntil(l.expiryDate); return d >= 0 && d <= 7; }).length;

  const handleBack = () => {
    if (onBack) onBack();
    else navigate("/instituicoes");
  };

  const handleRegistrar = () => {
    if (onRegistrarLote) onRegistrarLote(currentInstId);
    else navigate("/registrar-lote");
  };

  return (
      <div className="px-8 py-7">
        <button onClick={handleBack} className="flex items-center gap-2 text-[13px] text-slate-500 hover:text-slate-700 font-medium mb-6 transition-colors cursor-pointer">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="15 18 9 12 15 6"/>
          </svg>
          Voltar para Instituições
        </button>

        <div className="bg-white rounded-xl border border-slate-100 px-6 py-5 mb-5 flex items-center justify-between shadow-sm">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-[#FFF0F2] text-[#C8102E] flex items-center justify-center flex-shrink-0">
              <IconBuilding size={20} />
            </div>
            <div>
              <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-widest">Estoque de Hemocomponentes</div>
              <div className="text-[17px] font-semibold text-slate-900 mt-0.5">{inst?.name ?? `Instituição #${currentInstId}`}</div>
            </div>
          </div>

          <div className="flex items-center gap-4 text-center">
            <div>
              <div className="text-[22px] font-bold text-slate-900" style={{ fontFamily: "'JetBrains Mono', monospace" }}>{totalUnits}</div>
              <div className="text-[11px] text-slate-400">unidades totais</div>
            </div>
            <div className="w-px h-10 bg-slate-100"></div>
            <div>
              <div className={`text-[22px] font-bold ${expiringCount > 0 ? "text-amber-600" : "text-emerald-600"}`} style={{ fontFamily: "'JetBrains Mono', monospace" }}>{expiringCount}</div>
              <div className="text-[11px] text-slate-400">venc. em 7 dias</div>
            </div>
            <div className="w-px h-10 bg-slate-100"></div>
            <div>
              <div className="text-[22px] font-bold text-slate-900" style={{ fontFamily: "'JetBrains Mono', monospace" }}>{instLotes.length}</div>
              <div className="text-[11px] text-slate-400">lotes registrados</div>
            </div>
            <button
                onClick={handleRegistrar}
                className="ml-4 flex items-center gap-2 px-4 py-2 rounded-lg bg-[#C8102E] text-white text-[13px] font-semibold hover:bg-[#a00d24] transition-colors cursor-pointer"
            >
              <IconPlus size={14} /> Novo Lote
            </button>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-slate-100 overflow-hidden shadow-sm">
          {/* Larguras ajustadas para isolar o ID/crachá Novo do crachá de tipo sanguíneo */}
          <div
              className="px-5 py-3 bg-slate-50 border-b border-slate-100 grid text-[11px] font-semibold text-slate-400 uppercase tracking-widest items-center"
              style={{ gridTemplateColumns: "170px 220px 1.5fr 120px 90px 130px" }}
          >
            <div>Código</div>
            <div>Tipo / Componente</div>
            <div>Coleta — Validade</div>
            <div className="text-center">Vencimento</div>
            <div className="text-center">Qtd.</div>
            <div>Lote</div>
          </div>

          {loading ? (
              <div className="py-16 flex flex-col items-center gap-3 text-slate-400">
                <div className="w-6 h-6 border-2 border-[#C8102E] border-t-transparent rounded-full animate-spin"></div>
                <span className="text-[13px]">Consultando estoque na base de dados...</span>
              </div>
          ) : instLotes.length === 0 ? (
              <div className="py-16 text-center">
                <div className="flex justify-center text-slate-300"><IconDroplet size={32} /></div>
                <div className="mt-3 text-[13px] text-slate-400">Nenhum lote registrado para esta instituição</div>
                <button onClick={handleRegistrar} className="mt-4 flex items-center gap-2 px-4 py-2 rounded-lg bg-[#C8102E] text-white text-[13px] font-semibold hover:bg-[#a00d24] transition-colors mx-auto cursor-pointer">
                  <IconPlus size={14} /> Registrar primeiro lote
                </button>
              </div>
          ) : (
              instLotes.map((lote) => {
                const eb = expiryBadge(lote.expiryDate);
                const isNew = String(lote.id) === String(newLoteId) || lote.id > 1000;

                return (
                    <div
                        key={lote.id}
                        className={`grid items-center px-5 py-4 border-b border-slate-50 last:border-0 transition-colors ${isNew ? "bg-emerald-50/40" : "hover:bg-slate-50/60"}`}
                        style={{ gridTemplateColumns: "170px 220px 1.5fr 120px 90px 130px" }}
                    >
                      {/* Coluna 1: ID e Crachá Novo isolados */}
                      <div className="flex items-center gap-2 min-w-0 pr-2">
                  <span className="text-[12px] font-mono font-bold text-slate-600 truncate" style={{ fontFamily: "'JetBrains Mono', monospace" }}>
                    #{lote.id}
                  </span>
                        {isNew && (
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500 text-white flex-shrink-0 animate-pulse">
                      Novo
                    </span>
                        )}
                      </div>

                      {/* Coluna 2: Crachá do tipo sanguíneo e componente sem colisão */}
                      <div className="flex items-center gap-2 min-w-0">
                  <span
                      className={`text-[12.5px] font-bold px-2.5 py-0.5 rounded-full flex-shrink-0 ${typeBadge[lote.bloodType] || "bg-slate-100 text-slate-700"}`}
                      style={{ fontFamily: "'JetBrains Mono', monospace" }}
                  >
                    {lote.bloodType}
                  </span>
                        <span className={`text-[11px] font-medium px-2 py-0.5 rounded-full truncate ${compBadge[lote.component] || "bg-slate-100 text-slate-700"}`}>
                    {lote.component}
                  </span>
                      </div>

                      {/* Coluna 3: Datas */}
                      <div className="text-[12px] text-slate-500 min-w-0 truncate">
                        <span style={{ fontFamily: "'JetBrains Mono', monospace" }}>{lote.collectionDate}</span>
                        <span className="mx-1.5 text-slate-300">—</span>
                        <span className={daysUntil(lote.expiryDate) <= 7 ? "text-amber-600 font-semibold" : ""} style={{ fontFamily: "'JetBrains Mono', monospace" }}>
                    {lote.expiryDate}
                  </span>
                      </div>

                      {/* Coluna 4: Status do vencimento */}
                      <div className="text-center">
                        <span className={`text-[11px] font-semibold px-2.5 py-1 rounded-full ${eb.cls}`}>{eb.label}</span>
                      </div>

                      {/* Coluna 5: Quantidade */}
                      <div className="text-center">
                        <span className="text-[14px] font-bold text-slate-800" style={{ fontFamily: "'JetBrains Mono', monospace" }}>{lote.quantity}</span>
                        <span className="text-[10px] text-slate-400 ml-1">un.</span>
                      </div>

                      {/* Coluna 6: Código do lote */}
                      <div className="text-[12px] font-mono text-slate-500 truncate" style={{ fontFamily: "'JetBrains Mono', monospace" }}>
                        {lote.lotCode}
                      </div>
                    </div>
                );
              })
          )}
        </div>
      </div>
  );
}