// Tela de Transferências — US05 & Gestão Completa (Validação FEFO, Ciclo de Vida e Dijkstra)

import { useState, useEffect } from "react";
import {
    IconArrowRight, IconCheck, IconChevronRight, IconClock,
    IconDroplet, IconHospital, IconMapPin, IconShield,
    IconThermometer, IconTruck, IconAlertTriangle, IconPlus, IconX
} from "@/components/icons";
import {
    getInstituicoes, getFilaFEFO, calcularRotaApi, RotaAPI,
    getTransferenciasLocais, salvarTransferenciasLocais, TransferenciaAPI
} from "@/data/api";

export function InfoCell({ icon, label, value, mono = false, good = false }: {
    icon: React.ReactNode; label: string; value: string; mono?: boolean; good?: boolean;
}) {
    return (
        <div className="flex items-start gap-2.5">
            <div className="w-7 h-7 rounded-lg bg-slate-100 flex items-center justify-center text-slate-500 flex-shrink-0 mt-0.5">{icon}</div>
            <div>
                <div className="text-[11px] text-slate-400 font-medium">{label}</div>
                <div className={`text-[14px] font-semibold mt-0.5 ${good ? "text-emerald-600" : "text-slate-800"} ${mono ? "font-mono" : ""}`}>
                    {value}
                </div>
            </div>
        </div>
    );
}

export default function TransferenciasScreen() {
    const [instituicoes, setInstituicoes] = useState<any[]>([]);
    const [lotesEstoque, setLotesEstoque] = useState<any[]>([]);
    const [transferencias, setTransferencias] = useState<TransferenciaAPI[]>([]);
    const [selectedId, setSelectedId] = useState<string | null>(null);

    // Simulador Dijkstra
    const [origemId, setOrigemId] = useState<number>(2);
    const [destinoId, setDestinoId] = useState<number>(3);
    const [rotaCalculada, setRotaCalculada] = useState<RotaAPI | null>(null);
    const [carregandoRota, setCarregandoRota] = useState<boolean>(false);
    const [erroRota, setErroRota] = useState<string | null>(null);

    // Modal de Criação
    const [modalAberto, setModalAberto] = useState(false);
    const [novaOrigemId, setNovaOrigemId] = useState<number>(1);
    const [novaDestinoId, setNovaDestinoId] = useState<number>(3);
    const [novoTipo, setNovoTipo] = useState<string>("O-");
    const [novaQtd, setNovaQtd] = useState<number>(2);

    useEffect(() => {
        getInstituicoes().then((insts) => {
            if (Array.isArray(insts) && insts.length > 0) {
                setInstituicoes(insts);
                setOrigemId(insts[1]?.id || insts[0]?.id || 2);
                setDestinoId(insts[2]?.id || insts[1]?.id || 3);
                setNovaOrigemId(insts[0]?.id || 1);
                setNovaDestinoId(insts[1]?.id || 2);
            }
        });

        getFilaFEFO().then((lotes) => {
            if (Array.isArray(lotes)) setLotesEstoque(lotes);
        });

        setTransferencias(getTransferenciasLocais());
    }, []);

    useEffect(() => {
        if (!origemId || !destinoId) return;

        let ativo = true;
        setCarregandoRota(true);
        setErroRota(null);

        calcularRotaApi(origemId, destinoId)
            .then((res) => {
                if (!ativo) return;
                if (!res.rotaEncontrada) {
                    setErroRota(res.mensagem || "Não há rota viária disponível entre as unidades.");
                    setRotaCalculada(null);
                } else {
                    setRotaCalculada(res);
                }
            })
            .catch((err) => {
                if (!ativo) return;
                setErroRota(err.message || "Falha ao calcular rota.");
                setRotaCalculada(null);
            })
            .finally(() => {
                if (ativo) setCarregandoRota(false);
            });

        return () => {
            ativo = false;
        };
    }, [origemId, destinoId]);

    // Criação com Validação de Estoque
    async function handleCriarTransferencia(e: React.FormEvent) {
        e.preventDefault();
        if (novaOrigemId === novaDestinoId) {
            alert("A instituição de origem e destino devem ser diferentes.");
            return;
        }

        const origObj = instituicoes.find((i) => i.id === novaOrigemId);
        const destObj = instituicoes.find((i) => i.id === novaDestinoId);

        // Validação real de bolsas disponíveis na unidade de origem
        const estoqueDisponivelOrigem = lotesEstoque
            .filter((l) => (l.instId === novaOrigemId || l.instituicaoId === novaOrigemId) && (l.bloodType === novoTipo || l.tipoSanguineo === novoTipo))
            .reduce((acc, cur) => acc + Number(cur.quantity || cur.quantidade || 0), 0);

        const possuiEstoque = estoqueDisponivelOrigem >= novaQtd;
        const rota = await calcularRotaApi(novaOrigemId, novaDestinoId);
        const agora = new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });

        const novoStatus: "Em análise" | "Recusada" = possuiEstoque ? "Em análise" : "Recusada";

        const novaTransferencia: TransferenciaAPI = {
            id: `#${1030 + transferencias.length}`,
            from: origObj?.name || origObj?.nome || "Origem",
            to: destObj?.name || destObj?.nome || "Destino",
            origemId: novaOrigemId,
            destinoId: novaDestinoId,
            comp: novoTipo,
            qty: novaQtd,
            status: novoStatus,
            departure: possuiEstoque ? "Aguardando despacho" : "Cancelada",
            eta: possuiEstoque ? `${rota.tempoEstimadoMinutos || 10} min` : "—",
            temperature: "Estável (4,0°C)",
            route: rota.nomesInstituicoes?.join(" ➔ ") || "Via malha viária",
            carrier: "LogMed Express — Veículo Refrigerado",
            operationStatus: possuiEstoque ? "Aguardando autorização" : "Reprovada na regulação",
            notes: possuiEstoque
                ? `Validação de estoque aprovada (${estoqueDisponivelOrigem} bolsas disponíveis na origem). Aguardando autorização de saída.`
                : `RECUSADA: A unidade doadora possui apenas ${estoqueDisponivelOrigem} bolsas de ${novoTipo} (demanda: ${novaQtd} bolsas).`,
            timeline: [
                { label: "Solicitação", done: true, active: false, time: agora },
                { label: "Análise", done: true, active: possuiEstoque, time: agora },
                { label: "Aprovada", done: false, active: false, time: "—" },
                { label: "Em transporte", done: false, active: false, time: "—" },
                { label: "Entregue", done: false, active: false, time: "—" },
            ],
            history: [
                { time: agora, event: `Solicitação criada de ${novaQtd} bolsas de ${novoTipo}` },
                {
                    time: agora,
                    event: possuiEstoque
                        ? `Estoque auditado com sucesso na origem (${estoqueDisponivelOrigem} disp.)`
                        : `Solicitação recusada por falta de estoque (${estoqueDisponivelOrigem} disp.)`
                },
            ],
        };

        const listaAtualizada = [novaTransferencia, ...transferencias];
        setTransferencias(listaAtualizada);
        salvarTransferenciasLocais(listaAtualizada);
        setModalAberto(false);
    }

    // Ação de Aprovar e Despachar
    function aprovarParaTransporte(id: string) {
        const agora = new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
        const atualizada: TransferenciaAPI[] = transferencias.map((t) => {
            if (t.id !== id) return t;
            return {
                ...t,
                status: "Em transporte",
                departure: agora,
                operationStatus: "Normal — Em trânsito",
                timeline: t.timeline.map((step) => {
                    if (step.label === "Aprovada" || step.label === "Em transporte") {
                        return { ...step, done: true, active: step.label === "Em transporte", time: agora };
                    }
                    return step;
                }),
                history: [...t.history, { time: agora, event: "Aprovada pela central e despachada para transporte" }],
            };
        });

        setTransferencias(atualizada);
        salvarTransferenciasLocais(atualizada);
    }

    const selected = selectedId ? transferencias.find((t) => t.id === selectedId) ?? null : null;

    if (selected) {
        return (
            <div className="px-8 py-7">
                <div className="flex items-center justify-between mb-6">
                    <button
                        onClick={() => setSelectedId(null)}
                        className="flex items-center gap-2 text-[13px] text-slate-500 hover:text-slate-700 font-medium transition-colors cursor-pointer"
                    >
                        ← Voltar para Transferências
                    </button>

                    {selected.status === "Em análise" && (
                        <button
                            onClick={() => aprovarParaTransporte(selected.id)}
                            className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold rounded-lg shadow-sm transition-colors cursor-pointer"
                        >
                            <IconCheck size={14} /> Aprovar e Iniciar Transporte
                        </button>
                    )}
                </div>

                <div className="bg-white rounded-xl border border-slate-100 overflow-hidden mb-5 shadow-sm">
                    <div className="px-6 py-5 bg-gradient-to-r from-[#C8102E] to-[#9B0D23]">
                        <div className="flex items-center justify-between">
                            <div>
                                <div className="text-white/60 text-[11px] font-medium uppercase tracking-widest">Detalhes da Operação Logística</div>
                                <div className="text-white text-[22px] font-bold mt-0.5 leading-tight font-mono">
                                    TRANSFERÊNCIA {selected.id}
                                </div>
                            </div>
                            <div className="flex items-center gap-1.5 bg-white/20 px-3 py-1.5 rounded-full">
                                <span className="w-2 h-2 rounded-full bg-white"></span>
                                <span className="text-white text-[12px] font-medium">{selected.status}</span>
                            </div>
                        </div>
                        <div className="mt-4 flex items-center gap-4 text-white/80 text-[13px]">
                            <span className="flex items-center gap-1.5"><IconHospital size={14} />{selected.from}</span>
                            <span className="text-white/40"><IconArrowRight size={14} /></span>
                            <span className="flex items-center gap-1.5"><IconHospital size={14} />{selected.to}</span>
                            <span className="ml-4 flex items-center gap-1.5 text-white font-semibold font-mono">
                <IconDroplet size={14} />{selected.comp} · {selected.qty} unidades
              </span>
                        </div>
                    </div>

                    <div className="px-6 py-6 border-b border-slate-100">
                        <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-widest mb-5">Linha do Tempo de Transporte</div>
                        <div className="relative flex justify-between">
                            {selected.timeline.map((step, i) => (
                                <div key={i} className="flex flex-col items-center gap-2">
                                    <div className={`w-8 h-8 rounded-full border-2 flex items-center justify-center z-10 transition-all ${
                                        step.active || step.done ? "border-[#C8102E] bg-[#C8102E] text-white" : "border-slate-200 bg-white text-slate-400"
                                    }`}>
                                        {step.done || step.active ? <IconCheck size={13} /> : <span className="w-2 h-2 rounded-full bg-slate-200"></span>}
                                    </div>
                                    <div className="text-center">
                                        <div className={`text-[12px] font-semibold ${step.active ? "text-[#C8102E]" : step.done ? "text-slate-700" : "text-slate-400"}`}>{step.label}</div>
                                        <div className="text-[11px] text-slate-400 font-mono">{step.time}</div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="px-6 py-5 border-b border-slate-100">
                        <div className="grid grid-cols-3 gap-5">
                            <InfoCell icon={<IconClock size={15} />} label="Horário de saída" value={selected.departure} mono />
                            <InfoCell icon={<IconClock size={15} />} label="Previsão de chegada" value={selected.eta} mono />
                            <InfoCell icon={<IconThermometer size={15} />} label="Temperatura" value={selected.temperature} mono good />
                            <InfoCell icon={<IconTruck size={15} />} label="Transportador" value={selected.carrier} />
                            <InfoCell icon={<IconMapPin size={15} />} label="Rota" value={selected.route} />
                            <InfoCell icon={<IconShield size={15} />} label="Status da operação" value={selected.operationStatus} good={selected.status !== "Recusada"} />
                        </div>
                    </div>

                    <div className="px-6 py-5">
                        <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-widest mb-2">Auditoria e Observações</div>
                        <div className={`text-[13px] leading-relaxed p-3.5 rounded-lg ${
                            selected.status === "Recusada" ? "bg-red-50 text-red-700 border border-red-200" : "bg-slate-50 text-slate-700 border border-slate-200"
                        }`}>
                            {selected.notes}
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="px-8 py-7 space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Transferências</h1>
                    <p className="text-[13px] text-slate-500 mt-0.5">Gestão de transferências ativas na malha logística.</p>
                </div>

                <button
                    onClick={() => setModalAberto(true)}
                    className="inline-flex items-center gap-2 px-4 py-2 bg-[#C8102E] hover:bg-[#A00D24] text-white text-[13px] font-semibold rounded-lg shadow-sm transition-colors cursor-pointer"
                >
                    <IconPlus size={16} /> Nova Transferência
                </button>
            </div>

            {/* Painel Dijkstra */}
            <div className="bg-white rounded-xl border border-slate-200/80 p-5 shadow-xs">
                <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-100">
                    <div>
                        <h2 className="text-[15px] font-bold text-slate-800 flex items-center gap-2">
                            <IconMapPin size={18} className="text-[#C8102E]" />
                            Roteirização Logística Otimizada (US05 — Algoritmo de Dijkstra)
                        </h2>
                        <p className="text-[12px] text-slate-400 mt-0.5">
                            Calcula o caminho mínimo sobre o grafo da malha viária conectando as unidades hemoterápicas.
                        </p>
                    </div>
                    <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-slate-100 text-slate-600">
            Dijkstra Graph Router
          </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                    <div>
                        <label className="block text-[11px] font-semibold text-slate-500 uppercase tracking-widest mb-1">
                            Unidade de Origem
                        </label>
                        <select
                            value={origemId}
                            onChange={(e) => setOrigemId(Number(e.target.value))}
                            className="w-full px-3 py-2 rounded-lg border border-slate-200 text-[13px] bg-white focus:outline-none focus:ring-1 focus:ring-[#C8102E]"
                        >
                            {instituicoes.map((inst) => (
                                <option key={`orig-${inst.id}`} value={inst.id}>{inst.name || inst.nome}</option>
                            ))}
                        </select>
                    </div>

                    <div>
                        <label className="block text-[11px] font-semibold text-slate-500 uppercase tracking-widest mb-1">
                            Unidade de Destino
                        </label>
                        <select
                            value={destinoId}
                            onChange={(e) => setDestinoId(Number(e.target.value))}
                            className="w-full px-3 py-2 rounded-lg border border-slate-200 text-[13px] bg-white focus:outline-none focus:ring-1 focus:ring-[#C8102E]"
                        >
                            {instituicoes.map((inst) => (
                                <option key={`dest-${inst.id}`} value={inst.id}>{inst.name || inst.nome}</option>
                            ))}
                            <option value={99}>[Teste] Unidade Remota Isolada (Sem Conexão)</option>
                        </select>
                    </div>
                </div>

                {carregandoRota && (
                    <div className="p-3 bg-slate-50 rounded-lg text-slate-500 text-[12px] border border-slate-100">
                        Calculando menor trajeto viário...
                    </div>
                )}

                {erroRota && !carregandoRota && (
                    <div className="p-3.5 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2.5 text-red-800 text-[13px]">
                        <IconAlertTriangle size={16} className="text-[#C8102E] flex-shrink-0" />
                        <span>{erroRota}</span>
                    </div>
                )}

                {rotaCalculada && !carregandoRota && !erroRota && (
                    <div className="p-4 bg-emerald-50/70 border border-emerald-200 rounded-lg space-y-1.5">
                        <div className="flex items-center justify-between">
              <span className="text-[11.5px] font-bold text-emerald-800 uppercase tracking-wider flex items-center gap-1.5">
                <IconCheck size={14} /> Caminho Mínimo Encontrado
              </span>
                            <span className="text-[12px] text-slate-600">
                Transportador designado: <strong>LogMed Express (Veículo Refrigerado)</strong>
              </span>
                        </div>
                        <div className="text-[13px] font-semibold text-slate-800">
                            Trajeto: <span className="text-[#C8102E]">{rotaCalculada.nomesInstituicoes.join(" ➔ ")}</span>
                        </div>
                        <div className="flex items-center gap-5 text-[12px] text-slate-600 pt-0.5 font-mono">
                            <span>Distância Total: <strong className="text-slate-900">{rotaCalculada.distanciaTotalKm.toFixed(1)} km</strong></span>
                            <span>Tempo Estimado de Chegada: <strong className="text-slate-900">{rotaCalculada.tempoEstimadoMinutos} min</strong></span>
                        </div>
                    </div>
                )}
            </div>

            {/* Lista de Transferências */}
            <div>
                <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-widest mb-3">
                    Transferências Cadastradas na Rede
                </div>
                <div className="grid grid-cols-2 gap-4">
                    {transferencias.map((t) => (
                        <button
                            key={t.id}
                            onClick={() => setSelectedId(t.id)}
                            className="bg-white rounded-xl border border-slate-100 p-5 text-left hover:border-[#C8102E]/30 hover:shadow-sm transition-all group cursor-pointer"
                        >
                            <div className="flex items-start justify-between mb-3">
                                <div className="flex items-center gap-2">
                                    <span className="text-[12px] font-mono font-bold text-slate-400">{t.id}</span>
                                    <span className={`text-[11px] font-medium px-2 py-0.5 rounded-full ${
                                        t.status === "Em transporte" ? "bg-blue-50 text-blue-700" : t.status === "Em análise" ? "bg-amber-50 text-amber-700" : "bg-red-50 text-red-700"
                                    }`}>
                    {t.status}
                  </span>
                                </div>
                                <span className="text-[20px] font-bold text-[#C8102E] font-mono">{t.comp}</span>
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
                                <span className="text-[12px] text-[#C8102E] font-medium group-hover:underline flex items-center gap-1">
                  Ver detalhes <IconChevronRight size={12} />
                </span>
                            </div>
                        </button>
                    ))}
                </div>
            </div>

            {/* Modal Nova Transferência */}
            {modalAberto && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4">
                    <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-100">
                        <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
                            <h3 className="text-base font-bold text-slate-900">Nova Solicitação de Transferência</h3>
                            <button onClick={() => setModalAberto(false)} className="text-slate-400 hover:text-slate-600 cursor-pointer">
                                <IconX size={18} />
                            </button>
                        </div>

                        <form onSubmit={handleCriarTransferencia} className="space-y-4">
                            <div>
                                <label className="block text-xs font-semibold text-slate-600 mb-1">Unidade Doadora (Origem)</label>
                                <select
                                    value={novaOrigemId}
                                    onChange={(e) => setNovaOrigemId(Number(e.target.value))}
                                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs bg-white"
                                >
                                    {instituicoes.map((inst) => (
                                        <option key={`modal-orig-${inst.id}`} value={inst.id}>{inst.name || inst.nome}</option>
                                    ))}
                                </select>
                            </div>

                            <div>
                                <label className="block text-xs font-semibold text-slate-600 mb-1">Unidade Solicitante (Destino)</label>
                                <select
                                    value={novaDestinoId}
                                    onChange={(e) => setNovaDestinoId(Number(e.target.value))}
                                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs bg-white"
                                >
                                    {instituicoes.map((inst) => (
                                        <option key={`modal-dest-${inst.id}`} value={inst.id}>{inst.name || inst.nome}</option>
                                    ))}
                                </select>
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="block text-xs font-semibold text-slate-600 mb-1">Tipo Sanguíneo</label>
                                    <select
                                        value={novoTipo}
                                        onChange={(e) => setNovoTipo(e.target.value)}
                                        className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs bg-white"
                                    >
                                        {["O-", "O+", "A-", "A+", "B-", "B+", "AB-", "AB+"].map((tp) => (
                                            <option key={tp} value={tp}>{tp}</option>
                                        ))}
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-xs font-semibold text-slate-600 mb-1">Quantidade</label>
                                    <input
                                        type="number"
                                        min={1}
                                        value={novaQtd}
                                        onChange={(e) => setNovaQtd(Number(e.target.value))}
                                        className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs"
                                    />
                                </div>
                            </div>

                            <div className="pt-2 flex justify-end gap-2">
                                <button
                                    type="button"
                                    onClick={() => setModalAberto(false)}
                                    className="px-3.5 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg cursor-pointer"
                                >
                                    Cancelar
                                </button>
                                <button
                                    type="submit"
                                    className="px-4 py-2 text-xs font-semibold bg-[#C8102E] hover:bg-[#A00D24] text-white rounded-lg shadow-sm cursor-pointer"
                                >
                                    Validar Estoque e Solicitar
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}