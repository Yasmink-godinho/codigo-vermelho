// Tela de Dashboard — US02

import { useState } from "react";
import { MapContainer, TileLayer, CircleMarker, Polyline, useMap, Tooltip as MapTooltip } from "react-leaflet";
import { IconBell, IconChevronRight, IconClock, IconDroplet, IconHospital, IconMapPin, IconTruck, IconX } from "@/components/icons";
import { activeRoutes, hospitals, statusMarkerColor } from "@/data/mockData";
import type { Hospital, HospitalStatus } from "@/types";

function RecifeBounds() {
  const map = useMap();
  map.setView([-8.0539, -34.9050], 12);
  return null;
}

export default function DashboardScreen() {
  const [selectedHospital, setSelectedHospital] = useState<Hospital | null>(null);

  const kpis = [
    {
      label: "Estoque Total",
      value: "212",
      unit: "unidades",
      sub: "+14 nas últimas 24h",
      positive: true,
      icon: <IconDroplet size={18} />,
      color: "text-[#C8102E]",
      bg: "bg-[#FFF0F2]",
    },
    {
      label: "Alertas Críticos",
      value: "3",
      unit: "ativos",
      sub: "2 aguardam ação",
      positive: false,
      icon: <IconBell size={18} />,
      color: "text-amber-600",
      bg: "bg-amber-50",
    },
    {
      label: "Instituições",
      value: "18",
      unit: "conectadas",
      sub: "Todas operacionais",
      positive: true,
      icon: <IconHospital size={18} />,
      color: "text-blue-600",
      bg: "bg-blue-50",
    },
    {
      label: "Em Transporte",
      value: "5",
      unit: "transferências",
      sub: "Próxima chegada: 14min",
      positive: true,
      icon: <IconTruck size={18} />,
      color: "text-emerald-600",
      bg: "bg-emerald-50",
    },
  ];

  const recentAlerts = [
    { level: "critico", msg: "HUOC — risco de desabastecimento de O-", time: "há 12 min" },
    { level: "atencao", msg: "8 unidades de B- vencem em menos de 48h (HBL)", time: "há 34 min" },
    { level: "atencao", msg: "Temperatura fora do padrão — Transferência #1027", time: "há 1h" },
    { level: "normal", msg: "HEMOPE reabasteceu estoque de AB+", time: "há 2h" },
  ];

  const recentTransfers = [
    { id: "#1029", from: "HR", to: "HUOC", comp: "O-", qty: 3, status: "Em transporte" },
    { id: "#1028", from: "HEMOPE", to: "Maternidade", comp: "B+", qty: 6, status: "Em transporte" },
    { id: "#1027", from: "HBL", to: "UPA Torrões", comp: "B-", qty: 4, status: "Em análise" },
    { id: "#1026", from: "IMIP", to: "HAM", comp: "AB-", qty: 2, status: "Entregue" },
  ];

  const transferStatusColor: Record<string, string> = {
    "Em transporte": "bg-blue-50 text-blue-700",
    "Entregue": "bg-emerald-50 text-emerald-700",
    "Em análise": "bg-amber-50 text-amber-700",
  };

  const alertColors: Record<string, string> = {
    critico: "bg-[#C8102E]",
    atencao: "bg-amber-400",
    normal: "bg-emerald-400",
  };

  const statusLabel: Record<HospitalStatus, string> = {
    critico: "Crítico",
    atencao: "Atenção",
    normal: "Normal",
    transporte: "Em transporte",
  };

  const statusBadge: Record<HospitalStatus, string> = {
    critico: "bg-[#FFF0F2] text-[#C8102E]",
    atencao: "bg-amber-50 text-amber-700",
    normal: "bg-emerald-50 text-emerald-700",
    transporte: "bg-blue-50 text-blue-700",
  };

  return (
    <div className="px-8 py-7 space-y-5">
      {/* KPIs */}
      <div className="grid grid-cols-4 gap-4">
        {kpis.map((k, i) => (
          <div key={i} className="bg-white rounded-xl border border-slate-100 p-5 flex flex-col gap-3">
            <div className="flex items-start justify-between">
              <div>
                <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-widest">{k.label}</div>
                <div className="mt-1.5 flex items-baseline gap-1.5">
                  <span className="text-[32px] font-700 text-slate-900 leading-none" style={{ fontWeight: 700 }}>{k.value}</span>
                  <span className="text-[13px] text-slate-400 font-medium">{k.unit}</span>
                </div>
              </div>
              <div className={`w-9 h-9 rounded-lg ${k.bg} ${k.color} flex items-center justify-center`}>{k.icon}</div>
            </div>
            <div className={`text-[12px] font-medium ${k.positive ? "text-emerald-600" : "text-amber-600"}`}>{k.sub}</div>
          </div>
        ))}
      </div>

      {/* Map + sidebar */}
      <div className="grid grid-cols-3 gap-5" style={{ height: 440 }}>
        {/* Map */}
        <div className="col-span-2 bg-white rounded-xl border border-slate-100 overflow-hidden relative">
          {/* Map header */}
          <div className="absolute top-0 left-0 right-0 z-[500] flex items-center justify-between px-4 py-2.5 bg-white/95 backdrop-blur-sm border-b border-slate-100">
            <div className="flex items-center gap-2">
              <IconMapPin size={14} />
              <span className="text-[12px] font-semibold text-slate-700">Rede Logística — Recife, PE</span>
            </div>
            <div className="flex items-center gap-3 text-[11px]">
              {([["critico","#C8102E","Crítico"],["atencao","#F59E0B","Atenção"],["normal","#10B981","Normal"],["transporte","#3B82F6","Transferência"]] as const).map(([,color,label]) => (
                <span key={label} className="flex items-center gap-1.5 text-slate-500">
                  <span className="w-2.5 h-2.5 rounded-full inline-block" style={{ background: color }}></span>{label}
                </span>
              ))}
            </div>
          </div>

          <MapContainer
            center={[-8.0539, -34.9050]}
            zoom={12}
            style={{ height: "100%", width: "100%" }}
            zoomControl={false}
            attributionControl={false}
          >
            <RecifeBounds />
            <TileLayer
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              attribution="© OpenStreetMap contributors"
            />

            {/* Route lines */}
            {activeRoutes.map(([originId, destId], i) => {
              const origin = hospitals.find((h) => h.id === originId)!;
              const dest = hospitals.find((h) => h.id === destId)!;
              return (
                <Polyline
                  key={i}
                  positions={[[origin.lat, origin.lng], [dest.lat, dest.lng]]}
                  pathOptions={{
                    color: "#3B82F6",
                    weight: 2.5,
                    opacity: 0.75,
                    dashArray: "8 5",
                  }}
                />
              );
            })}

            {/* Hospital markers */}
            {hospitals.map((h) => (
              <CircleMarker
                key={h.id}
                center={[h.lat, h.lng]}
                radius={h.status === "critico" ? 13 : 11}
                pathOptions={{
                  fillColor: statusMarkerColor[h.status],
                  fillOpacity: 0.92,
                  color: "#ffffff",
                  weight: 2.5,
                }}
                eventHandlers={{
                  click: () => setSelectedHospital(selectedHospital?.id === h.id ? null : h),
                }}
              >
                <MapTooltip permanent={false} direction="top" offset={[0, -14]}>
                  <span style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 12, fontWeight: 600 }}>{h.shortName}</span>
                </MapTooltip>
              </CircleMarker>
            ))}
          </MapContainer>

          {/* Popup card on click */}
          {selectedHospital && (
            <div className="absolute bottom-4 left-4 z-[600] bg-white rounded-xl shadow-xl border border-slate-100 p-4 w-72">
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1 min-w-0">
                  <div className={`inline-flex items-center gap-1.5 text-[11px] font-semibold px-2 py-0.5 rounded-full mb-1.5 ${statusBadge[selectedHospital.status]}`}>
                    <span className="w-1.5 h-1.5 rounded-full" style={{ background: statusMarkerColor[selectedHospital.status] }}></span>
                    {statusLabel[selectedHospital.status]}
                  </div>
                  <div className="text-[13px] font-semibold text-slate-800 leading-snug">{selectedHospital.name}</div>
                </div>
                <button
                  className="w-6 h-6 flex items-center justify-center rounded-full hover:bg-slate-100 text-slate-400 flex-shrink-0"
                  onClick={() => setSelectedHospital(null)}
                ><IconX size={13} /></button>
              </div>
              <div className="mt-3 grid grid-cols-2 gap-2.5">
                <div className="bg-slate-50 rounded-lg p-2.5">
                  <div className="text-[10px] text-slate-400 font-medium uppercase tracking-wide">Alerta</div>
                  <div className="text-[12px] text-slate-700 font-medium mt-0.5 leading-snug">{selectedHospital.alert}</div>
                </div>
                <div className="bg-slate-50 rounded-lg p-2.5">
                  <div className="text-[10px] text-slate-400 font-medium uppercase tracking-wide">Componente</div>
                  <div className="text-[15px] font-700 text-[#C8102E] mt-0.5" style={{ fontFamily: "'JetBrains Mono', monospace", fontWeight: 700 }}>{selectedHospital.component}</div>
                </div>
                <div className="bg-slate-50 rounded-lg p-2.5">
                  <div className="text-[10px] text-slate-400 font-medium uppercase tracking-wide">Estoque</div>
                  <div className="text-[14px] font-semibold text-slate-800 mt-0.5" style={{ fontFamily: "'JetBrains Mono', monospace" }}>{selectedHospital.stock} <span className="text-[11px] text-slate-400 font-normal">{selectedHospital.stockUnit}</span></div>
                </div>
                <div className="bg-slate-50 rounded-lg p-2.5">
                  <div className="text-[10px] text-slate-400 font-medium uppercase tracking-wide">Previsão</div>
                  <div className="text-[12px] font-semibold mt-0.5" style={{ color: selectedHospital.status === "critico" ? "#C8102E" : selectedHospital.status === "atencao" ? "#D97706" : "#059669" }}>{selectedHospital.risk}</div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Right column: alerts + transfers */}
        <div className="col-span-1 flex flex-col gap-4 overflow-hidden">
          {/* Recent alerts */}
          <div className="bg-white rounded-xl border border-slate-100 p-4 flex-1 overflow-y-auto">
            <div className="flex items-center justify-between mb-3">
              <div className="text-[12px] font-semibold text-slate-700">Alertas Recentes</div>
              <button className="text-[11px] text-[#C8102E] font-medium hover:underline flex items-center gap-1">Ver todos <IconChevronRight size={12} /></button>
            </div>
            <div className="space-y-2.5">
              {recentAlerts.map((a, i) => (
                <div key={i} className="flex items-start gap-2.5">
                  <div className={`w-2 h-2 rounded-full mt-1.5 flex-shrink-0 ${alertColors[a.level]}`}></div>
                  <div className="flex-1 min-w-0">
                    <div className="text-[12px] text-slate-700 leading-snug">{a.msg}</div>
                    <div className="text-[10px] text-slate-400 mt-0.5 flex items-center gap-1"><IconClock size={10} />{a.time}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Recent transfers */}
          <div className="bg-white rounded-xl border border-slate-100 p-4 flex-1 overflow-y-auto">
            <div className="flex items-center justify-between mb-3">
              <div className="text-[12px] font-semibold text-slate-700">Transferências</div>
              <button className="text-[11px] text-[#C8102E] font-medium hover:underline flex items-center gap-1">Ver todas <IconChevronRight size={12} /></button>
            </div>
            <div className="space-y-2">
              {recentTransfers.map((t, i) => (
                <div key={i} className="flex items-center gap-2 py-1.5 border-b border-slate-50 last:border-0">
                  <div className="text-[10px] font-mono font-medium text-slate-400 w-12 flex-shrink-0" style={{ fontFamily: "'JetBrains Mono', monospace" }}>{t.id}</div>
                  <div className="flex-1 min-w-0">
                    <div className="text-[12px] text-slate-700 truncate">{t.from} → {t.to}</div>
                    <div className="text-[10px] text-slate-400">{t.comp} · {t.qty} unid.</div>
                  </div>
                  <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded-full flex-shrink-0 ${transferStatusColor[t.status]}`}>{t.status}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
