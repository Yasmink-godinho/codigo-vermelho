// Tela de Estoque da Instituição — US02 integrada com a API
import { useState, useEffect } from "react";
import { IconBuilding, IconDroplet, IconPlus } from "@/components/icons";
import { daysUntil } from "@/data/mockData";
import { buscarLotesPorInstituicaoApi } from "@/data/api";
import type { Institution, Lote } from "@/types";

export default function EstoqueInstituicaoScreen({
  institutions,
  instId,
  lotes: initialLotes,
  newLoteId,
  onBack,
  onRegistrarLote
}: {
  institutions: Institution[];
  instId: number;
  lotes: Lote[];
  newLoteId: number | null;
  onBack: () => void;
  onRegistrarLote: (instId: number) => void;
}) {
  const inst = institutions.find((i) => i.id === instId);
  const [instLotes, setInstLotes] = useState<Lote[]>([]);
  const [loading, setLoading] = useState(false);

  // Busca os lotes reais da instituição no endpoint /api/v1/instituicoes/{instId}/lotes
  useEffect(() => {
    setLoading(true);
    buscarLotesPorInstituicaoApi(instId)
      .then((dados) => {
        if (dados && dados.length > 0) {
          setInstLotes(dados);
        } else {
          // Fallback para os lotes locais caso o banco ainda esteja sem registros dessa unidade
          setInstLotes(initialLotes.filter((l) => l.instId === instId));
        }
      })
      .catch((err) => {
        console.warn("Aviso ao buscar estoque da instituição na API:", err);
        setInstLotes(initialLotes.filter((l) => l.instId === instId));
      })
      .finally(() => setLoading(false));
  }, [instId, initialLotes]);

  const typeBadge: Record<string, string> = {
    "O-":"bg-[#FFF0F2] text-[#C8102E]","O+":"bg-[#FFF0F2] text-[#C8102E]",
    "A-":"bg-blue-50 text-blue-700","A+":"bg-blue-50 text-blue-700",
    "B-":"bg-violet-50 text-violet-700","B+":"bg-violet-50 text-violet-700",
    "AB-":"bg-amber-50 text-amber-700","AB+":"bg-amber-50 text-amber-700",
  };

  const compBadge: Record<string, string> = {
    "Concentrado de Hemácias": "bg-[#FFF0F2] text-[#C8102E]",
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

  const totalUnits = instLotes.reduce((s, l) => s + l.quantity, 0);
  const expiringCount = instLotes.filter((l) => { const d = daysUntil(l.expiryDate); return d >= 0 && d <= 7; }).length;

  return (
    <div className="px-8 py-7">
      <button onClick={onBack} className="flex items-center gap-2 text-[13px] text-slate-500 hover:text-slate-700 font-medium mb-6 transition-colors">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="15 18 9 12 15 6"/>
        </svg>
        Voltar para Instituições
      </button>

      {/* Inst header */}
      <div className="bg-white rounded-xl border border-slate-100 px-6 py-5 mb-5 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-[#FFF0F2] text-[#C8102E] flex items-center justify-center flex-shrink-0">
            <IconBuilding size={20} />
          </div>
          <div>
            <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-widest">Estoque de Hemocomponentes</div>
            <div className="text-[17px] font-semibold text-slate-900 mt-0.5">{inst?.name ?? "Instituição"}</div>
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
            onClick={() => onRegistrarLote(instId)}
            className="ml-4 flex items-center gap-2 px-4 py-2 rounded-lg bg-[#C8102E] text-white text-[13px] font-semibold hover:bg-[#a00d24] transition-colors"
          >
            <IconPlus size={14} /> Novo Lote
          </button>
        </div>
      </div>

      {/* Lotes table */}
      <div className="bg-white rounded-xl border border-slate-100 overflow-hidden">
        <div className="px-5 py-3 bg-slate-50 border-b border-slate-100 grid text-[11px] font-semibold text-slate-400 uppercase tracking-widest"
          style={{ gridTemplateColumns: "130px 1fr 1fr 120px 90px 130px 80px" }}>
          <div>Código</div>
          <div>Tipo / Componente</div>
          <div>Coleta — Validade</div>
          <div className="text-center">Vencimento</div>
          <div className="text-center">Qtd.</div>
          <div>Lote</div>
          <div></div>
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
            <button onClick={() => onRegistrarLote(instId)} className="mt-4 flex items-center gap-2 px-4 py-2 rounded-lg bg-[#C8102E] text-white text-[13px] font-semibold hover:bg-[#a00d24] transition-colors mx-auto">
              <IconPlus size={14} /> Registrar primeiro lote
            </button>
          </div>
        ) : (
          instLotes.map((lote) => {
            const eb = expiryBadge(lote.expiryDate);
            const isNew = lote.id === newLoteId;
            return (
              <div
                key={lote.id}
                className={`grid items-center px-5 py-4 border-b border-slate-50 last:border-0 transition-colors ${isNew ? "bg-emerald-50/50" : "hover:bg-slate-50/60"}`}
                style={{ gridTemplateColumns: "130px 1fr 1fr 120px 90px 130px 80px" }}
              >
                <div className="flex items-center gap-2">
                  <span className="text-[12px] font-mono font-bold text-slate-600" style={{ fontFamily: "'JetBrains Mono', monospace" }}>#{lote.id}</span>
                  {isNew && <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-emerald-500 text-white animate-pulse flex-shrink-0">Novo</span>}
                </div>

                <div className="flex items-center gap-2 min-w-0">
                  <span className={`text-[13px] font-bold px-2.5 py-0.5 rounded-full flex-shrink-0 ${typeBadge[lote.bloodType]}`} style={{ fontFamily: "'JetBrains Mono', monospace" }}>{lote.bloodType}</span>
                  <span className={`text-[10.5px] font-medium px-2 py-0.5 rounded-full truncate ${compBadge[lote.component]}`}>{lote.component}</span>
                </div>

                <div className="text-[12px] text-slate-500 min-w-0">
                  <span style={{ fontFamily: "'JetBrains Mono', monospace" }}>{lote.collectionDate}</span>
                  <span className="mx-1.5 text-slate-300">—</span>
                  <span className={daysUntil(lote.expiryDate) <= 7 ? "text-amber-600 font-semibold" : ""} style={{ fontFamily: "'JetBrains Mono', monospace" }}>{lote.expiryDate}</span>
                </div>

                <div className="text-center">
                  <span className={`text-[11px] font-semibold px-2.5 py-1 rounded-full ${eb.cls}`}>{eb.label}</span>
                </div>

                <div className="text-center">
                  <span className="text-[15px] font-bold text-slate-800" style={{ fontFamily: "'JetBrains Mono', monospace" }}>{lote.quantity}</span>
                  <span className="text-[10px] text-slate-400 ml-1">un.</span>
                </div>

                <div className="text-[12px] font-mono text-slate-500 truncate" style={{ fontFamily: "'JetBrains Mono', monospace" }}>{lote.lotCode}</div>
                <div></div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}