// Tela de Dashboard — US02 & US05 (Rastreamento em Tempo Real e Gestão Logística)

import { useState, useEffect } from "react";
import { MapContainer, TileLayer, CircleMarker, Polyline, useMap, Tooltip as MapTooltip } from "react-leaflet";
import {
    IconBell, IconClock, IconDroplet,
    IconHospital, IconMapPin, IconTruck, IconX, IconCheck, IconAlertTriangle
} from "@/components/icons";
import {
    getInstituicoes, getFilaFEFO, calcularRotaApi,
    getTransferenciasLocais, RotaAPI, TransferenciaAPI
} from "@/data/api";

function CentralizarMapa({ lat, lng }: { lat: number; lng: number }) {
    const map = useMap();
    useEffect(() => {
        map.setView([lat, lng], 13);
    }, [lat, lng, map]);
    return null;
}

export default function DashboardScreen() {
    const [selectedHospital, setSelectedHospital] = useState<any | null>(null);

    const [instituicoesReais, setInstituicoesReais] = useState<any[]>([]);
    const [totalEstoqueReal, setTotalEstoqueReal] = useState<number>(0);
    const [transferencias, setTransferencias] = useState<TransferenciaAPI[]>([]);
    const [selectedTransferIndex, setSelectedTransferIndex] = useState<number>(0);

    const [rotaDijkstra, setRotaDijkstra] = useState<RotaAPI | null>(null);
    const [rotaGeometricaRuas, setRotaGeometricaRuas] = useState<[number, number][]>([]);
    const [carregandoRota, setCarregandoRota] = useState<boolean>(false);

    // 1. Carrega dados atualizados da rede e transferências locais
    useEffect(() => {
        getInstituicoes().then((insts) => {
            if (Array.isArray(insts) && insts.length > 0) {
                setInstituicoesReais(insts);
            }
        });

        getFilaFEFO().then((lotes) => {
            if (Array.isArray(lotes)) {
                const soma = lotes.reduce((acc, l) => acc + Number(l.quantity || l.quantidade || 0), 0);
                setTotalEstoqueReal(soma);
            }
        });

        const lista = getTransferenciasLocais();
        setTransferencias(lista);
        if (lista.length > 0) {
            setSelectedTransferIndex(0);
        }
    }, []);

    const selectedTransfer = transferencias[selectedTransferIndex] || null;

    // 2. Traça rota dinâmica apenas para o transporte selecionado
    useEffect(() => {
        if (!selectedTransfer) {
            setRotaDijkstra(null);
            setRotaGeometricaRuas([]);
            return;
        }

        if (selectedTransfer.status !== "Em transporte") {
            setRotaDijkstra(null);
            setRotaGeometricaRuas([]);
            return;
        }

        let ativo = true;
        setCarregandoRota(true);

        const origInst = instituicoesReais.find(
            (i) => i.id === selectedTransfer.origemId || (i.name && i.name.toLowerCase().includes(selectedTransfer.from.toLowerCase()))
        );
        const destInst = instituicoesReais.find(
            (i) => i.id === selectedTransfer.destinoId || (i.name && i.name.toLowerCase().includes(selectedTransfer.to.toLowerCase()))
        );

        calcularRotaApi(selectedTransfer.origemId, selectedTransfer.destinoId)
            .then(async (dadosDijkstra) => {
                if (!ativo) return;

                if (dadosDijkstra && dadosDijkstra.rotaEncontrada && origInst && destInst) {
                    setRotaDijkstra(dadosDijkstra);

                    const latOrig = Number(origInst.latitude);
                    const lngOrig = Number(origInst.longitude);
                    const latDest = Number(destInst.latitude);
                    const lngDest = Number(destInst.longitude);

                    if (!isNaN(latOrig) && !isNaN(lngOrig) && !isNaN(latDest) && !isNaN(lngDest)) {
                        try {
                            const urlOSRM = `https://router.project-osrm.org/route/v1/driving/${lngOrig},${latOrig};${lngDest},${latDest}?overview=full&geometries=geojson`;
                            const resOSRM = await fetch(urlOSRM);
                            if (resOSRM.ok) {
                                const json = await resOSRM.json();
                                if (json.routes && json.routes[0]?.geometry?.coordinates) {
                                    const pontos: [number, number][] = json.routes[0].geometry.coordinates.map(
                                        (pt: [number, number]) => [pt[1], pt[0]]
                                    );
                                    if (ativo) {
                                        setRotaGeometricaRuas(pontos);
                                        return;
                                    }
                                }
                            }
                        } catch (e) {}

                        if (ativo) {
                            setRotaGeometricaRuas([
                                [latOrig, lngOrig],
                                [latDest, lngDest],
                            ]);
                        }
                    }
                } else {
                    setRotaDijkstra(null);
                    setRotaGeometricaRuas([]);
                }
            })
            .finally(() => {
                if (ativo) setCarregandoRota(false);
            });

        return () => {
            ativo = false;
        };
    }, [selectedTransferIndex, transferencias, instituicoesReais]);

    const emTransporteTotal = transferencias.filter((t) => t.status === "Em transporte").length;

    const kpis = [
        {
            label: "Estoque Total",
            value: String(totalEstoqueReal || 45),
            unit: "unidades",
            sub: "Bolsas ativas na Fila FEFO",
            positive: true,
            icon: <IconDroplet size={18} />,
            color: "text-[#C8102E]",
            bg: "bg-[#FFF0F2]",
        },
        {
            label: "Alertas Críticos",
            value: "1",
            unit: "ativo",
            sub: "HUOC em risco de O-",
            positive: false,
            icon: <IconBell size={18} />,
            color: "text-amber-600",
            bg: "bg-amber-50",
        },
        {
            label: "Instituições",
            value: String(instituicoesReais.length || 4),
            unit: "conectadas",
            sub: "Todas operacionais",
            positive: true,
            icon: <IconHospital size={18} />,
            color: "text-blue-600",
            bg: "bg-blue-50",
        },
        {
            label: "Em Transporte",
            value: String(emTransporteTotal),
            unit: emTransporteTotal === 1 ? "transferência" : "transferências",
            sub: "Deslocamentos ativos",
            positive: true,
            icon: <IconTruck size={18} />,
            color: "text-emerald-600",
            bg: "bg-emerald-50",
        },
    ];

    return (
        <div className="px-8 py-7 space-y-5">
            {/* Indicadores Principais */}
            <div className="grid grid-cols-4 gap-4">
                {kpis.map((k, i) => (
                    <div key={i} className="bg-white rounded-xl border border-slate-100 p-5 flex flex-col gap-3 shadow-xs">
                        <div className="flex items-start justify-between">
                            <div>
                                <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-widest">{k.label}</div>
                                <div className="mt-1.5 flex items-baseline gap-1.5">
                                    <span className="text-[32px] font-bold text-slate-900 leading-none">{k.value}</span>
                                    <span className="text-[13px] text-slate-400 font-medium">{k.unit}</span>
                                </div>
                            </div>
                            <div className={`w-9 h-9 rounded-lg ${k.bg} ${k.color} flex items-center justify-center`}>{k.icon}</div>
                        </div>
                        <div className={`text-[12px] font-medium ${k.positive ? "text-emerald-600" : "text-amber-600"}`}>{k.sub}</div>
                    </div>
                ))}
            </div>

            {/* Mapa Logístico e Painel Lateral */}
            <div className="grid grid-cols-3 gap-5" style={{ height: 480 }}>
                {/* Mapa Leaflet */}
                <div className="col-span-2 bg-white rounded-xl border border-slate-100 overflow-hidden relative shadow-xs">
                    <div className="absolute top-0 left-0 right-0 z-[500] flex items-center justify-between px-4 py-2.5 bg-white/95 backdrop-blur-sm border-b border-slate-100">
                        <div className="flex items-center gap-2">
                            <IconMapPin size={14} className="text-[#C8102E]" />
                            <span className="text-[12px] font-semibold text-slate-700">Rede Logística — Recife, PE</span>
                        </div>
                        <div className="flex items-center gap-3 text-[11px]">
              <span className="flex items-center gap-1.5 text-slate-500">
                <span className="w-2.5 h-2.5 rounded-full bg-[#C8102E]"></span>Crítico
              </span>
                            <span className="flex items-center gap-1.5 text-slate-500">
                <span className="w-2.5 h-2.5 rounded-full bg-[#10B981]"></span>Normal
              </span>
                            <span className="flex items-center gap-1.5 text-slate-500">
                <span className="w-2.5 h-2.5 rounded-full bg-[#3B82F6]"></span>Transferência Ativa
              </span>
                        </div>
                    </div>

                    <MapContainer
                        center={[-8.0535, -34.8950]}
                        zoom={13}
                        style={{ height: "100%", width: "100%" }}
                        zoomControl={false}
                        attributionControl={false}
                    >
                        <CentralizarMapa lat={-8.0535} lng={-34.8950} />
                        <TileLayer
                            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                            attribution="© OpenStreetMap contributors"
                        />

                        {/* Rota traçada */}
                        {selectedTransfer && selectedTransfer.status === "Em transporte" && rotaGeometricaRuas.length > 0 && (
                            <>
                                <Polyline
                                    positions={rotaGeometricaRuas}
                                    pathOptions={{
                                        color: "#1E3A8A",
                                        weight: 7,
                                        opacity: 0.35,
                                        lineCap: "round",
                                        lineJoin: "round",
                                    }}
                                />
                                <Polyline
                                    positions={rotaGeometricaRuas}
                                    pathOptions={{
                                        color: "#2563EB",
                                        weight: 4.5,
                                        opacity: 0.95,
                                        lineCap: "round",
                                        lineJoin: "round",
                                    }}
                                />
                            </>
                        )}

                        {/* Marcadores das Instituições Conectadas */}
                        {instituicoesReais.map((inst) => {
                            const lat = Number(inst.latitude);
                            const lng = Number(inst.longitude);
                            if (isNaN(lat) || isNaN(lng)) return null;

                            const nome = String(inst.name || inst.nome || "");
                            const isCritico = nome.includes("Oswaldo");
                            const isOrigemAtiva = selectedTransfer && selectedTransfer.origemId === inst.id;

                            return (
                                <CircleMarker
                                    key={inst.id}
                                    center={[lat, lng]}
                                    radius={isCritico ? 13 : isOrigemAtiva ? 12 : 10}
                                    pathOptions={{
                                        fillColor: isCritico ? "#C8102E" : isOrigemAtiva ? "#3B82F6" : "#10B981",
                                        fillOpacity: 0.95,
                                        color: "#ffffff",
                                        weight: 2.5,
                                    }}
                                    eventHandlers={{
                                        click: () => setSelectedHospital(inst),
                                    }}
                                >
                                    <MapTooltip permanent={false} direction="top" offset={[0, -14]}>
                                        <span style={{ fontSize: 12, fontWeight: 600 }}>{nome}</span>
                                    </MapTooltip>
                                </CircleMarker>
                            );
                        })}
                    </MapContainer>

                    {/* Painel Inferior de Detalhes da Rota */}
                    <div className="absolute bottom-4 left-4 right-4 z-[500] pointer-events-none">
                        {carregandoRota ? (
                            <div className="bg-white/95 backdrop-blur-sm border border-slate-200 p-3 rounded-xl shadow-lg inline-flex items-center gap-2 text-xs text-slate-600 pointer-events-auto">
                                <span className="w-2.5 h-2.5 rounded-full bg-[#C8102E] animate-ping"></span>
                                Calculando trajeto via Dijkstra...
                            </div>
                        ) : selectedTransfer && selectedTransfer.status === "Em transporte" && rotaDijkstra ? (
                            <div className="bg-white/95 backdrop-blur-sm border border-emerald-200/90 p-3.5 rounded-xl shadow-lg max-w-lg pointer-events-auto">
                                <div className="flex items-center justify-between gap-3 mb-1.5">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-800 flex items-center gap-1">
                    <IconCheck size={13} /> Trajeto Mais Rápido ({selectedTransfer.id})
                  </span>
                                    <span className="text-[10px] font-mono bg-slate-100 text-slate-600 px-2 py-0.5 rounded">
                    Dijkstra Graph Router
                  </span>
                                </div>
                                <div className="text-[13px] font-bold text-slate-800 leading-snug">
                                    {selectedTransfer.from} ➔ {selectedTransfer.to}
                                </div>
                                <div className="flex items-center gap-4 mt-2 text-[11.5px] text-slate-600 font-mono">
                                    <span>Distância: <strong className="text-slate-900">{rotaDijkstra.distanciaTotalKm.toFixed(1)} km</strong></span>
                                    <span>•</span>
                                    <span>Previsão: <strong className="text-slate-900">{rotaDijkstra.tempoEstimadoMinutos} min</strong></span>
                                    <span>•</span>
                                    <span>Carga: <strong className="text-[#C8102E]">{selectedTransfer.comp} ({selectedTransfer.qty} unid.)</strong></span>
                                </div>
                            </div>
                        ) : selectedTransfer && selectedTransfer.status === "Em análise" ? (
                            <div className="bg-white/95 backdrop-blur-sm border border-amber-200 p-3.5 rounded-xl shadow-lg max-w-lg pointer-events-auto">
                                <div className="flex items-center gap-2 text-amber-800 font-bold text-xs uppercase tracking-wider mb-1">
                                    <IconAlertTriangle size={14} className="text-amber-600" />
                                    Transferência {selectedTransfer.id} — Em Análise
                                </div>
                                <div className="text-xs text-slate-600">
                                    Aguardando autorização da central. O traçado no mapa é exibido com o status &quot;Em transporte&quot;.
                                </div>
                            </div>
                        ) : selectedTransfer && selectedTransfer.status === "Recusada" ? (
                            <div className="bg-white/95 backdrop-blur-sm border border-red-200 p-3.5 rounded-xl shadow-lg max-w-lg pointer-events-auto">
                                <div className="flex items-center gap-2 text-red-800 font-bold text-xs uppercase tracking-wider mb-1">
                                    <IconX size={14} className="text-red-600" />
                                    Transferência {selectedTransfer.id} — Recusada
                                </div>
                                <div className="text-xs text-slate-600">
                                    {selectedTransfer.notes}
                                </div>
                            </div>
                        ) : null}
                    </div>

                    {/* Modal Pop-up do Hospital Clicado */}
                    {selectedHospital && (
                        <div className="absolute top-14 left-4 z-[600] bg-white rounded-xl shadow-xl border border-slate-100 p-4 w-72">
                            <div className="flex items-start justify-between gap-2">
                                <div className="flex-1 min-w-0">
                                    <div className="text-[13px] font-semibold text-slate-800 leading-snug">
                                        {selectedHospital.name || selectedHospital.nome}
                                    </div>
                                    <div className="text-[11px] text-slate-400 mt-0.5">
                                        {selectedHospital.location || selectedHospital.endereco || "Unidade Conectada"}
                                    </div>
                                </div>
                                <button
                                    className="w-6 h-6 flex items-center justify-center rounded-full hover:bg-slate-100 text-slate-400 flex-shrink-0 cursor-pointer"
                                    onClick={() => setSelectedHospital(null)}
                                >
                                    <IconX size={13} />
                                </button>
                            </div>
                        </div>
                    )}
                </div>

                {/* Coluna Direita: Alertas e Relação de Transferências */}
                <div className="col-span-1 flex flex-col gap-4 overflow-hidden">
                    <div className="bg-white rounded-xl border border-slate-100 p-4 flex-1 overflow-y-auto shadow-xs">
                        <div className="flex items-center justify-between mb-3">
                            <div className="text-[12px] font-semibold text-slate-700">Alertas Recentes</div>
                            <span className="text-[11px] text-[#C8102E] font-medium">1 crítico</span>
                        </div>
                        <div className="space-y-2.5">
                            <div className="flex items-start gap-2.5">
                                <div className="w-2 h-2 rounded-full mt-1.5 flex-shrink-0 bg-[#C8102E]"></div>
                                <div className="flex-1 min-w-0">
                                    <div className="text-[12px] text-slate-700 leading-snug">HUOC — risco de desabastecimento de O-</div>
                                    <div className="text-[10px] text-slate-400 mt-0.5 flex items-center gap-1">
                                        <IconClock size={10} /> há 12 min
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="bg-white rounded-xl border border-slate-100 p-4 flex-1 overflow-y-auto shadow-xs">
                        <div className="flex items-center justify-between mb-2">
                            <div className="text-[12px] font-semibold text-slate-700">Transferências Ativas</div>
                            <span className="text-[10px] text-slate-400">Clique para inspecionar</span>
                        </div>
                        <div className="space-y-2">
                            {transferencias.map((t, idx) => {
                                const isSelected = selectedTransferIndex === idx;
                                return (
                                    <button
                                        key={`${t.id}-${idx}`}
                                        onClick={() => setSelectedTransferIndex(idx)}
                                        className={`w-full text-left p-2.5 rounded-lg border transition-all flex items-center gap-2 cursor-pointer ${
                                            isSelected
                                                ? "border-[#C8102E] bg-red-50/40 shadow-xs"
                                                : "border-slate-100 hover:border-slate-200 bg-white"
                                        }`}
                                    >
                                        <div className="text-[11px] font-mono font-bold text-slate-400 w-16 flex-shrink-0 truncate">
                                            {t.id}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <div className={`text-[12px] truncate ${isSelected ? "font-bold text-[#C8102E]" : "text-slate-700"}`}>
                                                {t.from} → {t.to}
                                            </div>
                                            <div className="text-[11px] text-slate-400">
                                                {t.comp} · {t.qty} unid.
                                            </div>
                                        </div>
                                        <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full flex-shrink-0 ${
                                            t.status === "Em transporte"
                                                ? "bg-blue-50 text-blue-700"
                                                : t.status === "Em análise"
                                                    ? "bg-amber-50 text-amber-700"
                                                    : "bg-red-50 text-red-700"
                                        }`}>
                      {t.status}
                    </span>
                                    </button>
                                );
                            })}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}