// Tela de Redistribuições — US04 / US09 (Sincronização com FEFO, Estoque Real e XAI)

import { useState, useEffect } from "react";
import {
    IconArrowRight, IconCheck, IconDroplet, IconEye,
    IconHospital, IconLink, IconMapPin, IconShieldCheck,
    IconThermometer, IconTruck, IconX
} from "@/components/icons";
import { InfoCell } from "@/pages/Transferencias";
import CompatibilidadeScreen from "@/pages/VerificacaoCompatibilidade";
import {
    getTransferenciasLocais,
    salvarTransferenciasLocais,
    getFilaFEFO,
    TransferenciaAPI
} from "@/data/api";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:8080/api/v1";

interface RecomendacaoItem {
    id: number;
    origemId: number;
    origemNome: string;
    destinoId: number;
    destinoNome: string;
    tipoSanguineo: string;
    componente: string;
    quantidade: number;
    nivelUrgencia: string;
    status: "PENDENTE" | "APROVADA" | "RECUSADA";
    justificativaRecusa?: string;
    motivosExplicaveis: string[];
}

export default function RedistribuicoesScreen() {
    const [recomendacoes, setRecomendacoes] = useState<RecomendacaoItem[]>([]);
    const [lotesFEFO, setLotesFEFO] = useState<any[]>([]);
    const [carregando, setCarregando] = useState(false);
    const [gerandoIA, setGerandoIA] = useState(false);
    const [detailItem, setDetailItem] = useState<RecomendacaoItem | null>(null);
    const [compatItem, setCompatItem] = useState<{ item: RecomendacaoItem; receptorSanguineo: string } | null>(null);

    const carregarDados = async () => {
        setCarregando(true);
        try {
            const [resRecs, lotes] = await Promise.all([
                fetch(`${API_BASE_URL}/redistribuicoes/sugeridas`),
                getFilaFEFO(),
            ]);

            if (resRecs.ok) {
                const dados = await resRecs.json();
                setRecomendacoes(dados);
            }
            if (Array.isArray(lotes)) {
                setLotesFEFO(lotes);
            }
        } catch (e) {
            console.warn("Backend offline ao carregar recomendações:", e);
        } finally {
            setCarregando(false);
        }
    };

    useEffect(() => {
        carregarDados();
    }, []);

    const calcularEstoque = (instId: number, tipoSang: string): number => {
        return lotesFEFO
            .filter((l) => {
                const idMatch = Number(l.instId || l.instituicaoId) === Number(instId);
                const sangue = String(l.bloodType || l.tipoSanguineo || "");
                return idMatch && (sangue === tipoSang || sangue.includes(tipoSang));
            })
            .reduce((acc, l) => acc + Number(l.quantity || l.quantidade || 0), 0);
    };

    const handleGerarNova = async () => {
        setGerandoIA(true);
        try {
            const res = await fetch(`${API_BASE_URL}/redistribuicoes/gerar`, { method: "POST" });
            if (res.ok) {
                await carregarDados();
            }
        } catch (e) {
            console.error("Falha ao gerar nova análise:", e);
        } finally {
            setGerandoIA(false);
        }
    };

    const handleAprovar = async (id: number) => {
        try {
            const res = await fetch(`${API_BASE_URL}/redistribuicoes/${id}/aprovar`, { method: "POST" });
            if (res.ok) {
                const data = await res.json();

                if (data.transferenciaCriada) {
                    const tInfo = data.transferenciaCriada;
                    const transferenciasAtuais = getTransferenciasLocais();

                    const novaTransferencia: TransferenciaAPI = {
                        id: tInfo.id,
                        from: tInfo.from,
                        to: tInfo.to,
                        origemId: Number(tInfo.origemId || 1),
                        destinoId: Number(tInfo.destinoId || 2),
                        comp: tInfo.comp,
                        qty: Number(tInfo.qty || 2),
                        status: "Em transporte",
                        departure: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
                        eta: "Em 35 min",
                        temperature: "4,0°C",
                        route: "Via Av. Gov. Agamenon Magalhães — 2,1 km",
                        carrier: "LogMed Express — Veículo L-412",
                        operationStatus: "Normal",
                        notes: "Transferência autorizada pela Gestora (US09). Bolsas retiradas da fila FEFO com sucesso.",
                        timeline: [
                            { label: "Solicitação", done: true, active: false, time: "Agora" },
                            { label: "Análise IA", done: true, active: false, time: "Agora" },
                            { label: "Aprovada", done: true, active: false, time: "Agora" },
                            { label: "Em transporte", done: true, active: true, time: "Agora" },
                            { label: "Entregue", done: false, active: false, time: "—" },
                        ],
                        history: [
                            { time: "Agora", event: "Recomendação autorizada. Estoque da origem debitado." },
                        ],
                    };

                    const listaAtualizada = [
                        novaTransferencia,
                        ...transferenciasAtuais.filter((t) => t.id !== novaTransferencia.id),
                    ];
                    salvarTransferenciasLocais(listaAtualizada);
                }

                await carregarDados();
                if (detailItem?.id === id) setDetailItem(null);
            }
        } catch (e) {
            console.error("Falha ao aprovar recomendação:", e);
        }
    };

    const handleRecusar = async (id: number) => {
        try {
            const res = await fetch(`${API_BASE_URL}/redistribuicoes/${id}/recusar`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ justificativa: "Recusada pela gestora com base no monitoramento local." }),
            });
            if (res.ok) {
                await carregarDados();
                if (detailItem?.id === id) setDetailItem(null);
            }
        } catch (e) {
            console.error("Falha ao recusar recomendação:", e);
        }
    };

    if (compatItem) {
        const { item, receptorSanguineo } = compatItem;
        const recCompatAdapter = {
            id: `REC-${item.id}`,
            from: item.origemNome,
            to: item.destinoNome,
            comp: item.tipoSanguineo,
            requestedComp: receptorSanguineo,
            qty: item.quantidade,
            urgency: item.nivelUrgencia,
            stockFrom: calcularEstoque(item.origemId, item.tipoSanguineo),
            stockTo: calcularEstoque(item.destinoId, receptorSanguineo),
        };

        return (
            <CompatibilidadeScreen
                rec={recCompatAdapter as any}
                onBack={() => setCompatItem(null)}
                onConfirm={async () => {
                    await handleAprovar(item.id);
                    setCompatItem(null);
                }}
            />
        );
    }

    if (detailItem) {
        const estoqueOrigemReal = calcularEstoque(detailItem.origemId, detailItem.tipoSanguineo);
        const estoqueDestinoReal = calcularEstoque(detailItem.destinoId, detailItem.tipoSanguineo);

        return (
            <div className="px-8 py-7">
                <button
                    onClick={() => setDetailItem(null)}
                    className="flex items-center gap-2 text-[13px] text-slate-500 hover:text-slate-700 font-medium mb-6 transition-colors cursor-pointer"
                >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="15 18 9 12 15 6" />
                    </svg>
                    Voltar para Redistribuições
                </button>

                <div className="bg-white rounded-xl border border-slate-100 overflow-hidden mb-5">
                    <div className="px-6 py-5 border-b border-slate-100 bg-gradient-to-r from-slate-50 to-white">
                        <div className="flex items-start justify-between">
                            <div>
                                <div className="flex items-center gap-2.5 mb-3">
                                    <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-widest">Recomendação de Redistribuição</span>
                                    <span className="text-[11px] font-mono text-slate-400">#REC-{detailItem.id}</span>
                                    <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full flex items-center gap-1.5 bg-red-50 text-red-700">
                    <span className="w-1.5 h-1.5 rounded-full bg-red-500"></span>
                                        {detailItem.nivelUrgencia}
                  </span>
                                </div>
                                <div className="flex items-center gap-4">
                                    <div className="flex items-center gap-2">
                                        <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center text-slate-500"><IconHospital size={15} /></div>
                                        <div>
                                            <div className="text-[10px] text-slate-400 font-medium">Origem</div>
                                            <div className="text-[15px] font-semibold text-slate-800">{detailItem.origemNome}</div>
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
                                            <div className="text-[15px] font-semibold text-slate-800">{detailItem.destinoNome}</div>
                                        </div>
                                    </div>
                                    <div className="ml-6 pl-6 border-l border-slate-100 flex items-center gap-5">
                                        <div>
                                            <div className="text-[10px] text-slate-400 font-medium">Hemocomponente</div>
                                            <div className="text-[20px] font-bold text-[#C8102E]">{detailItem.tipoSanguineo}</div>
                                        </div>
                                        <div>
                                            <div className="text-[10px] text-slate-400 font-medium">Quantidade Solicitada</div>
                                            <div className="text-[20px] font-bold text-slate-900">{detailItem.quantidade} unid.</div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="flex items-center gap-2 flex-shrink-0 mt-1">
                                {detailItem.status === "PENDENTE" ? (
                                    <>
                                        <button
                                            onClick={() => setCompatItem({ item: detailItem, receptorSanguineo: detailItem.tipoSanguineo })}
                                            className="flex items-center gap-1.5 px-4 py-2 rounded-lg border border-slate-200 text-slate-600 text-[13px] font-medium hover:bg-slate-50 transition-colors cursor-pointer"
                                        >
                                            <IconShieldCheck size={14} /> Verificar Compatibilidade
                                        </button>
                                        <button
                                            onClick={() => handleRecusar(detailItem.id)}
                                            className="flex items-center gap-1.5 px-4 py-2 rounded-lg border border-slate-200 text-slate-600 text-[13px] font-medium hover:bg-slate-50 transition-colors cursor-pointer"
                                        >
                                            <IconX size={14} /> Recusar redistribuição
                                        </button>
                                        <button
                                            onClick={() => handleAprovar(detailItem.id)}
                                            className="flex items-center gap-1.5 px-5 py-2 rounded-lg bg-[#C8102E] text-white text-[13px] font-semibold hover:bg-[#a00d24] transition-colors cursor-pointer"
                                        >
                                            <IconCheck size={14} /> Aprovar redistribuição
                                        </button>
                                    </>
                                ) : detailItem.status === "APROVADA" ? (
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

                    <div className="grid grid-cols-3 gap-0 divide-x divide-slate-100">
                        <div className="p-5">
                            <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-widest mb-3">Estoques Atuais na Rede</div>
                            <div className="space-y-3">
                                <div className="flex items-center justify-between">
                                    <span className="text-[12px] text-slate-500">Origem ({detailItem.origemNome.split(" ")[0]})</span>
                                    <span className="text-[14px] font-bold text-emerald-600">{estoqueOrigemReal} unid.</span>
                                </div>
                                <div className="flex items-center justify-between">
                                    <span className="text-[12px] text-slate-500">Destino ({detailItem.destinoNome.split(" ")[0]})</span>
                                    <span className="text-[14px] font-bold text-[#C8102E]">{estoqueDestinoReal} unid.</span>
                                </div>
                                <div className="flex items-center justify-between pt-2 border-t border-slate-100">
                                    <span className="text-[12px] text-slate-500">Previsão de risco</span>
                                    <span className="text-[12px] font-semibold text-amber-600">
                    {estoqueDestinoReal <= 2 ? "Risco Crítico (< 24h)" : "Estoque de Segurança Regular"}
                  </span>
                                </div>
                            </div>
                        </div>

                        <div className="p-5">
                            <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-widest mb-3">Critérios FEFO e Validade</div>
                            <div className="space-y-3">
                                <InfoCell icon={<IconDroplet size={14} />} label="Validade das unidades" value="Fila FEFO priorizada" />
                                <InfoCell icon={<IconLink size={14} />} label="Relação de fornecimento" value="Rede Ativa no Recife" />
                            </div>
                        </div>

                        <div className="p-5">
                            <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-widest mb-3">Logística Otimizada</div>
                            <div className="space-y-3">
                                <InfoCell icon={<IconMapPin size={14} />} label="Rota" value="Via Gov. Agamenon Magalhães — 2,1 km" />
                                <InfoCell icon={<IconTruck size={14} />} label="Transportador" value="LogMed Express (Refrigerado)" />
                                <InfoCell icon={<IconThermometer size={14} />} label="Condições de transporte" value="2°C a 6°C contínuo" good />
                            </div>
                        </div>
                    </div>
                </div>

                <div className="bg-white rounded-xl border border-slate-100 p-5">
                    <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-widest mb-4">Por que recomendamos? (XAI)</div>
                    <div className="grid grid-cols-2 gap-3">
                        {detailItem.motivosExplicaveis?.map((motivo, j) => (
                            <div key={j} className="flex items-start gap-2.5 bg-slate-50 rounded-lg px-3 py-2.5 text-[13px] text-slate-600">
                                <span className="mt-0.5 text-[#C8102E] flex-shrink-0">●</span>
                                {motivo}
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
                    <span className="font-semibold text-slate-800">{recomendacoes.length} recomendações</span> geradas pela IA — sincronizado com backend
                </div>
                <div className="flex items-center gap-3">
                    <button
                        onClick={handleGerarNova}
                        disabled={gerandoIA}
                        className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-900 text-white rounded-lg text-xs font-semibold hover:bg-slate-800 transition-colors disabled:opacity-50 cursor-pointer"
                    >
                        {gerandoIA ? "Gerando com IA..." : "✨ Simular Nova Análise com IA"}
                    </button>
                    <div className="flex items-center gap-2 text-[12px] text-slate-500">
                        <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></div>
                        Motor de análise ativo
                    </div>
                </div>
            </div>

            {carregando && recomendacoes.length === 0 ? (
                <div className="p-8 text-center text-sm text-slate-400">Carregando recomendações da hemorrede...</div>
            ) : null}

            <div className="space-y-5">
                {recomendacoes.map((rec) => {
                    const isApproved = rec.status === "APROVADA";
                    const isRefused = rec.status === "RECUSADA";

                    return (
                        <div
                            key={rec.id}
                            className={`bg-white rounded-xl border border-slate-100 overflow-hidden transition-all ${
                                isApproved ? "ring-2 ring-emerald-400/40" : isRefused ? "opacity-60" : ""
                            }`}
                        >
                            <div className="px-6 pt-5 pb-4 border-b border-slate-50">
                                <div className="flex items-start justify-between">
                                    <div>
                                        <div className="flex items-center gap-2.5">
                                            <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-widest">Recomendação de Redistribuição</div>
                                            <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full flex items-center gap-1.5 bg-red-50 text-red-700">
                        <span className="w-1.5 h-1.5 rounded-full bg-red-500"></span>
                                                {rec.nivelUrgencia}
                      </span>
                                        </div>
                                        <div className="mt-3 flex items-center gap-3">
                                            <div className="flex items-center gap-1.5">
                                                <div className="w-7 h-7 rounded-lg bg-slate-100 flex items-center justify-center text-slate-500"><IconHospital size={14} /></div>
                                                <div>
                                                    <div className="text-[10px] text-slate-400 font-medium">Origem</div>
                                                    <div className="text-[14px] font-semibold text-slate-800">{rec.origemNome}</div>
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
                                                    <div className="text-[14px] font-semibold text-slate-800">{rec.destinoNome}</div>
                                                </div>
                                            </div>
                                            <div className="ml-6 pl-6 border-l border-slate-100 flex items-center gap-4">
                                                <div>
                                                    <div className="text-[10px] text-slate-400 font-medium">Hemocomponente</div>
                                                    <div className="text-[16px] font-bold text-[#C8102E]">{rec.tipoSanguineo}</div>
                                                </div>
                                                <div>
                                                    <div className="text-[10px] text-slate-400 font-medium">Quantidade</div>
                                                    <div className="text-[16px] font-bold text-slate-900">{rec.quantidade} unid.</div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-2 flex-shrink-0">
                                        {rec.status === "PENDENTE" ? (
                                            <>
                                                <button
                                                    onClick={() => setDetailItem(rec)}
                                                    className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg border border-slate-200 text-slate-600 text-[12px] font-medium hover:bg-slate-50 transition-colors cursor-pointer"
                                                >
                                                    <IconEye size={14} /> Ver detalhes
                                                </button>
                                                <button
                                                    onClick={() => setCompatItem({ item: rec, receptorSanguineo: rec.tipoSanguineo })}
                                                    className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg border border-slate-200 text-slate-600 text-[12px] font-medium hover:bg-slate-50 transition-colors cursor-pointer"
                                                >
                                                    <IconShieldCheck size={14} /> Verificar Compatibilidade
                                                </button>
                                                <button
                                                    onClick={() => handleRecusar(rec.id)}
                                                    className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg border border-slate-200 text-slate-600 text-[12px] font-medium hover:bg-slate-50 transition-colors cursor-pointer"
                                                >
                                                    <IconX size={14} /> Recusar
                                                </button>
                                                <button
                                                    onClick={() => handleAprovar(rec.id)}
                                                    className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-[#C8102E] text-white text-[12px] font-semibold hover:bg-[#a00d24] transition-colors cursor-pointer"
                                                >
                                                    <IconCheck size={14} /> Aprovar
                                                </button>
                                            </>
                                        ) : isApproved ? (
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

                            <div className="px-6 py-4">
                                <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-widest mb-3">Por que recomendamos? (XAI)</div>
                                <div className="grid grid-cols-2 gap-2">
                                    {rec.motivosExplicaveis?.map((motivo, j) => (
                                        <div key={j} className="flex items-start gap-2 text-[12.5px] text-slate-600">
                                            <span className="mt-0.5 text-[#C8102E] flex-shrink-0">●</span>
                                            {motivo}
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