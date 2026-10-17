import type {
  AltBlood, AppUser, BtStats, Hospital, HospitalStatus, Institution, InstType,
  Lote, LoteComponent, RecData, ReqStatus, ReqUrgency, Requisicao, Service, TransferData,
} from "@/types";
import {
  IconBell, IconDroplet, IconHospital, IconMapPin, IconShield, IconTruck,
} from "@/components/icons";

// ─── Hospitals ───────────────────────────────────────────────────────────────

export const hospitals: Hospital[] = [
  {
    id: 1,
    name: "Hospital da Restauração",
    shortName: "HR",
    lat: -8.0539,
    lng: -34.8811,
    status: "transporte",
    alert: "Transferência em andamento",
    component: "O-",
    stock: 27,
    stockUnit: "unidades",
    risk: "Estável",
  },
  {
    id: 2,
    name: "Hospital Universitário Oswaldo Cruz",
    shortName: "HUOC",
    lat: -8.0480,
    lng: -34.8775,
    status: "critico",
    alert: "Risco de desabastecimento",
    component: "O-",
    stock: 4,
    stockUnit: "unidades",
    risk: "Crítico em 36h",
  },
  {
    id: 3,
    name: "HEMOPE — Fundação HEMOPE",
    shortName: "HEMOPE",
    lat: -8.0565,
    lng: -34.8740,
    status: "normal",
    alert: "Operação normal",
    component: "Múltiplos",
    stock: 312,
    stockUnit: "unidades",
    risk: "Nenhum",
  },
  {
    id: 4,
    name: "Hospital Agamenon Magalhães",
    shortName: "HAM",
    lat: -8.0315,
    lng: -34.9065,
    status: "atencao",
    alert: "Estoque de AB- abaixo do mínimo",
    component: "AB-",
    stock: 6,
    stockUnit: "unidades",
    risk: "Atenção em 5 dias",
  },
  {
    id: 5,
    name: "UPA Torrões",
    shortName: "UPA T",
    lat: -8.0900,
    lng: -34.9140,
    status: "normal",
    alert: "Operação normal",
    component: "A+",
    stock: 18,
    stockUnit: "unidades",
    risk: "Nenhum",
  },
  {
    id: 6,
    name: "Hospital Barão de Lucena",
    shortName: "HBL",
    lat: -8.1025,
    lng: -34.9245,
    status: "atencao",
    alert: "Validade crítica — B-",
    component: "B-",
    stock: 8,
    stockUnit: "unidades",
    risk: "Vence em 48h",
  },
  {
    id: 7,
    name: "Maternidade do Recife",
    shortName: "MAT",
    lat: -8.0618,
    lng: -34.8862,
    status: "transporte",
    alert: "Recebendo transferência",
    component: "B+",
    stock: 11,
    stockUnit: "unidades",
    risk: "Estável",
  },
  {
    id: 8,
    name: "IMIP — Instituto de Medicina Integral",
    shortName: "IMIP",
    lat: -8.0572,
    lng: -34.8938,
    status: "normal",
    alert: "Operação normal",
    component: "A-",
    stock: 22,
    stockUnit: "unidades",
    risk: "Nenhum",
  },
];

export const activeRoutes: [number, number][] = [
  [1, 2],
  [3, 7],
];

export const statusMarkerColor: Record<HospitalStatus, string> = {
  critico: "#C8102E",
  atencao: "#F59E0B",
  normal: "#10B981",
  transporte: "#3B82F6",
};

// ─── Users ───────────────────────────────────────────────────────────────────

export const DEMO_USERS: AppUser[] = [
  {
    email: "joao.mendes@hemope.pe.gov.br",
    name: "João Mendes",
    title: "Técnico de Hemoterapia",
    role: "operador",
    roleLabel: "Operador",
    roleBadge: "bg-slate-100 text-slate-600",
    initials: "JM",
  },
  {
    email: "maria.silva@hemope.pe.gov.br",
    name: "Maria Silva",
    title: "Coordenadora de Rede",
    role: "admin_rede",
    roleLabel: "Administradora da Rede",
    roleBadge: "bg-blue-50 text-blue-700",
    initials: "MS",
  },
  {
    email: "carlos.andrade@hemope.pe.gov.br",
    name: "Dr. Carlos Andrade",
    title: "Diretor de Operações",
    role: "admin_principal",
    roleLabel: "Administrador Principal",
    roleBadge: "bg-[#FFF0F2] text-[#C8102E]",
    initials: "CA",
  },
];

// ─── Lotes ───────────────────────────────────────────────────────────────────

export const COMPONENT_VALIDITY_DAYS: Record<LoteComponent, number> = {
  "Concentrado de Hemácias": 42,
  "Plasma": 365,
  "Plaquetas": 5,
  "Crioprecipitado": 365,
};

export function addDays(dateStr: string, days: number): string {
  const d = new Date(dateStr + "T00:00:00");
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
}

export function daysUntil(dateStr: string): number {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const target = new Date(dateStr + "T00:00:00");
  return Math.round((target.getTime() - today.getTime()) / 86400000);
}

export function todayISO(): string {
  return new Date().toISOString().slice(0, 10);
}

export function nextLotCode(existing: Lote[]): string {
  const year = new Date().getFullYear();
  const nums = existing.map((l) => parseInt((l.lotCode || "").split("-")[2] ?? "0")).filter(Boolean);
  const next = nums.length ? Math.max(...nums) + 1 : 891;
  return `LT-${year}-${String(next).padStart(4, "0")}`;
}

export const today = todayISO();

export const DEMO_LOTES: Lote[] = [
  { id: 101, instId: 2, instName: "Fundação HEMOPE", bloodType: "O-", component: "Concentrado de Hemácias", collectionDate: "2026-09-01", expiryDate: addDays("2026-09-01", 42), quantity: 18, lotCode: "LT-2026-0871", createdAt: Date.now() - 86400000 },
  { id: 102, instId: 2, instName: "Fundação HEMOPE", bloodType: "O+", component: "Concentrado de Hemácias", collectionDate: "2026-09-10", expiryDate: addDays("2026-09-10", 42), quantity: 24, lotCode: "LT-2026-0878", createdAt: Date.now() - 86400000 },
  { id: 103, instId: 2, instName: "Fundação HEMOPE", bloodType: "AB-", component: "Plaquetas", collectionDate: "2026-10-06", expiryDate: addDays("2026-10-06", 5), quantity: 6, lotCode: "LT-2026-0882", createdAt: Date.now() - 86400000 },
  { id: 104, instId: 2, instName: "Fundação HEMOPE", bloodType: "A+", component: "Plasma", collectionDate: "2026-05-10", expiryDate: addDays("2026-05-10", 365), quantity: 30, lotCode: "LT-2026-0844", createdAt: Date.now() - 86400000 },
  { id: 105, instId: 1, instName: "Hospital da Restauração", bloodType: "B-", component: "Concentrado de Hemácias", collectionDate: "2026-09-15", expiryDate: addDays("2026-09-15", 42), quantity: 8, lotCode: "LT-2026-0883", createdAt: Date.now() - 86400000 },
  { id: 106, instId: 1, instName: "Hospital da Restauração", bloodType: "O-", component: "Concentrado de Hemácias", collectionDate: "2026-09-20", expiryDate: addDays("2026-09-20", 42), quantity: 12, lotCode: "LT-2026-0887", createdAt: Date.now() - 86400000 },
];

// ─── Requisições ─────────────────────────────────────────────────────────────

export function relativeTime(ts: number): string {
  const diff = Math.floor((Date.now() - ts) / 60000);
  if (diff < 1) return "agora mesmo";
  if (diff < 60) return `há ${diff} min`;
  const h = Math.floor(diff / 60);
  if (h < 24) return `há ${h}h`;
  return `há ${Math.floor(h / 24)}d`;
}

export function nextReqCode(existing: Requisicao[]): string {
  const year = new Date().getFullYear();
  const nums = existing.map((r) => parseInt(r.reqCode.split("-")[2] ?? "0")).filter(Boolean);
  const next = nums.length ? Math.max(...nums) + 1 : 301;
  return `REQ-${year}-${String(next).padStart(4, "0")}`;
}

export const DEMO_REQUISICOES: Requisicao[] = [
  { id: 201, reqCode: "REQ-2026-0298", instId: 2, instName: "Fundação HEMOPE", bloodType: "O-", component: "Concentrado de Hemácias", quantity: 4, urgency: "emergencia", observations: "Paciente politraumatizado — UTI adulto.", status: "em_analise", createdAt: Date.now() - 60000 },
  { id: 202, reqCode: "REQ-2026-0297", instId: 1, instName: "Hospital da Restauração", bloodType: "A+", component: "Plasma", quantity: 6, urgency: "prioritaria", observations: "", status: "aprovada", createdAt: Date.now() - 60000 },
  { id: 203, reqCode: "REQ-2026-0296", instId: 3, instName: "HUOC — Hosp. Universitário Oswaldo Cruz", bloodType: "AB-", component: "Plaquetas", quantity: 2, urgency: "rotina", observations: "Reposição de estoque preventivo.", status: "pendente", createdAt: Date.now() - 60000 },
  { id: 204, reqCode: "REQ-2026-0295", instId: 6, instName: "Maternidade do Recife", bloodType: "B+", component: "Concentrado de Hemácias", quantity: 3, urgency: "prioritaria", observations: "Pós-parto com hemorragia.", status: "aprovada", createdAt: Date.now() - 3600000 },
  { id: 205, reqCode: "REQ-2026-0294", instId: 8, instName: "UPA Torrões", bloodType: "O+", component: "Concentrado de Hemácias", quantity: 2, urgency: "rotina", observations: "", status: "negada", createdAt: Date.now() - 3600000 },
];

// ─── Institutions Data ───────────────────────────────────────────────────────

export const institutionsData: Institution[] = [
  {
    id: 1,
    name: "Hospital da Restauração",
    type: "Hospital Público",
    location: "Av. Gov. Agamenon Magalhães, s/n — Derby",
    neighborhood: "Derby",
    status: "ativa",
    relations: 7,
    components: ["O-", "O+", "A-", "A+", "B+", "AB+"],
    latitude: -8.0539,
    longitude: -34.8811,
    minStock: { "O-": 20, "O+": 30, "A+": 15 },
    hasHistory: true,
  },
  {
    id: 2,
    name: "Fundação HEMOPE",
    type: "Hemocentro",
    location: "Rua Joaquim Nabuco, 171 — Graças",
    neighborhood: "Graças",
    status: "ativa",
    relations: 14,
    components: ["O-", "O+", "A-", "A+", "B-", "B+", "AB-", "AB+"],
    latitude: -8.0565,
    longitude: -34.8740,
    minStock: { "O-": 50, "O+": 80, "A+": 40, "B+": 30 },
    hasHistory: true,
  },
  {
    id: 3,
    name: "HUOC — Hosp. Universitário Oswaldo Cruz",
    type: "Hospital Público",
    location: "Av. Gov. Agamenon Magalhães, 1756 — Boa Vista",
    neighborhood: "Boa Vista",
    status: "ativa",
    relations: 5,
    components: ["O-", "O+", "A+", "B+"],
    latitude: -8.0480,
    longitude: -34.8775,
    minStock: { "O-": 10, "O+": 15 },
    hasHistory: true,
  },
  {
    id: 4,
    name: "Hospital Agamenon Magalhães",
    type: "Hospital Público",
    location: "Rua Leitão da Silva, s/n — Casa Amarela",
    neighborhood: "Casa Amarela",
    status: "ativa",
    relations: 4,
    components: ["O+", "A+", "AB-", "AB+"],
    latitude: -8.0315,
    longitude: -34.9065,
    minStock: { "O-": 10, "O+": 20 },
    hasHistory: true,
  },
  {
    id: 5,
    name: "IMIP — Instituto de Medicina Integral",
    type: "Hospital Privado",
    location: "Rua dos Coelhos, 300 — Boa Vista",
    neighborhood: "Boa Vista",
    status: "ativa",
    relations: 6,
    components: ["O-", "O+", "A-", "A+", "B+"],
    latitude: -8.0572,
    longitude: -34.8938,
    minStock: { "O-": 15, "O+": 25 },
    hasHistory: true,
  },
  {
    id: 6,
    name: "Maternidade do Recife",
    type: "Maternidade",
    location: "Av. Abdias de Carvalho, 1060 — Prado",
    neighborhood: "Prado",
    status: "ativa",
    relations: 3,
    components: ["O+", "A+", "B+", "AB+"],
    latitude: -8.0618,
    longitude: -34.8862,
    minStock: { "O-": 10, "O+": 15 },
    hasHistory: true,
  },
  {
    id: 7,
    name: "Hospital Barão de Lucena",
    type: "Hospital Público",
    location: "Av. Gov. Agamenon Magalhães, s/n — Iputinga",
    neighborhood: "Iputinga",
    status: "ativa",
    relations: 4,
    components: ["O-", "B-", "A+", "O+"],
    latitude: -8.1025,
    longitude: -34.9245,
    minStock: { "O-": 12, "O+": 18 },
    hasHistory: true,
  },
  {
    id: 8,
    name: "UPA Torrões",
    type: "UPA",
    location: "Rua Padre Inglês, 150 — Torrões",
    neighborhood: "Torrões",
    status: "ativa",
    relations: 2,
    components: ["O+", "A+"],
    latitude: -8.0900,
    longitude: -34.9140,
    minStock: { "O-": 5, "O+": 10 },
    hasHistory: true,
  },
];

export const instTypeOptions: InstType[] = ["Hospital Público", "Hospital Privado", "UPA", "Hemocentro", "Maternidade", "Clínica"];
export const allComponents = ["O-", "O+", "A-", "A+", "B-", "B+", "AB-", "AB+"];

// Bairros completos de Recife e cidades da RMR / Pernambuco
export const neighborhoods = [
  "Ilha do Leite",
  "Derby",
  "Graças",
  "Boa Vista",
  "Santo Amaro",
  "Casa Amarela",
  "Espinheiro",
  "Madalena",
  "Torre",
  "Parnamirim",
  "Jaqueira",
  "Afogados",
  "Imbiribeira",
  "Boa Viagem",
  "Pina",
  "Caxangá",
  "Várzea",
  "Iputinga",
  "Torrões",
  "Cordeiro",
  "Prado",
  "San Martin",
  "Areias",
  "Barro",
  "Tejipió",
  "Recife Antigo",
  "Santo Antônio",
  "São José",
  "Coelhos",
  "Paissandu",
  "Soledade",
  "Encruzilhada",
  "Rosarinho",
  "Tamarineira",
  "Casa Forte",
  "Poço da Panela",
  "Santana",
  "Monteiro",
  "Apipucos",
  "Dois Irmãos",
  "Arruda",
  "Campo Grande",
  "Água Fria",
  "Beberibe",
  "Dois Unidos",
  "Linha do Tiro",
  "Passarinho",
  "Guabiraba",
  "Nova Descoberta",
  "Vasco da Gama",
  "Macaxeira",
  "Ibura",
  "Jordão",
  "Cohab",
  "Olinda",
  "Jaboatão dos Guararapes",
  "Camaragibe",
  "São Lourenço da Mata",
  "Paulista",
  "Abreu e Lima",
  "Igarassu",
  "Cabo de Santo Agostinho",
  "Caruaru",
  "Petrolina",
  "Garanhuns"
];

// ─── Compatibilidade ABO/Rh ──────────────────────────────────────────────────

export const COMPAT: Record<string, string[]> = {
  "O-":  ["O-","O+","A-","A+","B-","B+","AB-","AB+"],
  "O+":  ["O+","A+","B+","AB+"],
  "A-":  ["A-","A+","AB-","AB+"],
  "A+":  ["A+","AB+"],
  "B-":  ["B-","B+","AB-","AB+"],
  "B+":  ["B+","AB+"],
  "AB-": ["AB-","AB+"],
  "AB+": ["AB+"],
};

export const BLOOD_TYPES = ["O-","O+","A-","A+","B-","B+","AB-","AB+"];

export const COMPAT_EXPLANATIONS: Record<string, Record<string, string>> = {
  "O-": {
    "O-": "O- é doador universal.",
    "O+": "O- é compatível com todos os tipos.",
    "A-": "O- é compatível com todos os tipos.",
    "A+": "O- é compatível com todos os tipos.",
    "B-": "O- é compatível com todos os tipos.",
    "B+": "O- é compatível com todos os tipos.",
    "AB-": "O- é compatível com todos os tipos.",
    "AB+": "O- é compatível com todos os tipos.",
  },
  "O+": {
    "O+": "Compatível ABO e Rh+.",
    "A+": "Receptor aceita Rh+ e hemácias O.",
    "B+": "Receptor aceita Rh+ e hemácias O.",
    "AB+": "Receptor universal aceita qualquer doador.",
    "O-": "Incompatibilidade: O- rejeita Rh+.",
    "A-": "Incompatibilidade Rh: receptor é Rh-.",
    "B-": "Incompatibilidade Rh: receptor é Rh-.",
    "AB-": "Incompatibilidade Rh: receptor é Rh-.",
  },
  "A-": {
    "A-": "Mesmo grupo ABO e ambos Rh-.",
    "A+": "Compatível: receptor aceita Rh-.",
    "AB-": "Receptor universal para Rh-.",
    "AB+": "Receptor universal aceita qualquer tipo.",
    "O-": "Incompatibilidade ABO: receptor possui anticorpos anti-A.",
    "O+": "Incompatibilidade ABO: receptor possui anticorpos anti-A.",
    "B-": "Incompatibilidade ABO: receptor possui anticorpos anti-A.",
    "B+": "Incompatibilidade ABO: receptor possui anticorpos anti-A.",
  },
  "A+": {
    "A+": "Mesmo grupo ABO e mesmo fator Rh.",
    "AB+": "Receptor universal aceita todos os tipos.",
    "O-": "Incompatibilidade ABO e Rh.",
    "O+": "Incompatibilidade ABO.",
    "A-": "Incompatibilidade Rh.",
    "B-": "Incompatibilidade ABO e Rh.",
    "B+": "Incompatibilidade ABO.",
    "AB-": "Incompatibilidade Rh.",
  },
  "B-": {
    "B-": "Mesmo grupo ABO e ambos Rh-.",
    "B+": "Compatível: receptor aceita Rh-.",
    "AB-": "Receptor universal para Rh-.",
    "AB+": "Receptor universal aceita qualquer doador.",
    "O-": "Incompatibilidade ABO: receptor possui anticorpos anti-B.",
    "O+": "Incompatibilidade ABO: receptor possui anticorpos anti-B.",
    "A-": "Incompatibilidade ABO: receptor possui anticorpos anti-B.",
    "A+": "Incompatibilidade ABO: receptor possui anticorpos anti-B.",
  },
  "B+": {
    "B+": "Mesmo grupo ABO e mesmo fator Rh.",
    "AB+": "Receptor universal aceita todos os tipos.",
    "O-": "Incompatibilidade ABO e Rh.",
    "O+": "Incompatibilidade ABO.",
    "A-": "Incompatibilidade ABO e Rh.",
    "A+": "Incompatibilidade ABO.",
    "B-": "Incompatibilidade Rh.",
    "AB-": "Incompatibilidade Rh.",
  },
  "AB-": {
    "AB-": "Mesmo grupo ABO e ambos Rh-.",
    "AB+": "Receptor universal aceita qualquer doador.",
    "O-": "Incompatibilidade ABO severa.",
    "O+": "Incompatibilidade ABO severa.",
    "A-": "Incompatibilidade ABO.",
    "A+": "Incompatibilidade ABO.",
    "B-": "Incompatibilidade ABO.",
    "B+": "Incompatibilidade ABO.",
  },
  "AB+": {
    "AB+": "Compatível apenas com AB+.",
    "O-": "Incompatível: receptor O- rejeita antígenos A e B.",
    "O+": "Incompatível: receptor O+ rejeita antígenos A e B.",
    "A-": "Incompatível: receptor rejeita hemácias B e fator Rh+.",
    "A+": "Incompatível: receptor rejeita hemácias B.",
    "B-": "Incompatível: receptor rejeita hemácias A e fator Rh+.",
    "B+": "Incompatível: receptor rejeita hemácias A.",
    "AB-": "Incompatível: receptor rejeita fator Rh+.",
  },
};

export const ALT_STOCKS: Record<string, AltBlood[]> = {
  "O-":  [{ bt: "O-",  institution: "Fundação HEMOPE",           qty: 18 }, { bt: "O-",  institution: "Hospital da Restauração", qty: 9 }],
  "O+":  [{ bt: "O+",  institution: "Fundação HEMOPE",           qty: 42 }, { bt: "O+",  institution: "HUOC",                   qty: 11 }],
  "A-":  [{ bt: "A-",  institution: "Fundação HEMOPE",           qty: 12 }, { bt: "A-",  institution: "Hospital da Restauração", qty: 5 }],
  "A+":  [{ bt: "A+",  institution: "Fundação HEMOPE",           qty: 29 }, { bt: "A+",  institution: "IMIP",                   qty: 8 }],
  "B-":  [{ bt: "B-",  institution: "Fundação HEMOPE",           qty: 9 },  { bt: "O-",  institution: "Fundação HEMOPE",         qty: 18 }],
  "B+":  [{ bt: "B+",  institution: "Hospital Barão de Lucena",  qty: 14 }, { bt: "B+",  institution: "Fundação HEMOPE",         qty: 7 }],
  "AB-": [{ bt: "AB-", institution: "Fundação HEMOPE",           qty: 5 },  { bt: "O-",  institution: "Fundação HEMOPE",         qty: 18 }],
  "AB+": [{ bt: "AB+", institution: "Fundação HEMOPE",           qty: 8 },  { bt: "AB-", institution: "Fundação HEMOPE",         qty: 5 }],
};

// ─── Redistribuições ─────────────────────────────────────────────────────────

export const RECS_DATA: RecData[] = [
  {
    id: "REC-2026-0043",
    urgency: "Alta",
    urgencyColor: "bg-[#FFF0F2] text-[#C8102E]",
    urgencyDot: "bg-[#C8102E]",
    from: "Hospital da Restauração",
    to: "Hospital Univ. Oswaldo Cruz",
    comp: "O-",
    requestedComp: "O-",
    qty: 3,
    stockFrom: 27,
    stockTo: 4,
    riskForecast: "Crítico em 36 horas",
    validity: "12 dias restantes",
    supplierRelation: "Ativa desde Jan/2024",
    route: "Via Av. Gov. Agamenon — 8,4 km",
    transport: "LogMed Express — Veículo L-412",
    transportCondition: "Contêiner refrigerado (2–6°C)",
    reasons: [
      { icon: <IconBell size={14} />, text: "HUOC apresenta risco de atingir nível crítico em 36h" },
      { icon: <IconShield size={14} />, text: "Hospital da Restauração possui estoque de segurança" },
      { icon: <IconDroplet size={14} />, text: "Unidades selecionadas possuem validade adequada" },
      { icon: <IconHospital size={14} />, text: "Relação de fornecimento ativa entre as instituições" },
      { icon: <IconMapPin size={14} />, text: "Distância viável para envio imediato: 8,4 km" },
      { icon: <IconTruck size={14} />, text: "Veículo refrigerado disponível" },
    ],
  },
];

// ─── Transferências ──────────────────────────────────────────────────────────

export const TRANSFERS_DATA: TransferData[] = [
  {
    id: "#1029",
    from: "Hospital da Restauração",
    to: "Hospital Univ. Oswaldo Cruz",
    comp: "O-",
    qty: 3,
    status: "Em transporte",
    statusColor: "bg-blue-50 text-blue-700",
    departure: "09:04",
    eta: "09:52",
    temperature: "4,2°C",
    route: "Via Av. Agamenon Magalhães — 8,4 km",
    carrier: "LogMed Express — Veículo L-412",
    operationStatus: "Normal",
    notes: "Transferência autorizada. Contêiner lacrado em temperatura estável.",
    timeline: [
      { label: "Solicitação", done: true, active: false, time: "08:12" },
      { label: "Análise", done: true, active: false, time: "08:19" },
      { label: "Aprovada", done: true, active: false, time: "08:31" },
      { label: "Em transporte", done: false, active: true, time: "09:04" },
      { label: "Entregue", done: false, active: false, time: "—" },
    ],
    history: [
      { time: "08:12", event: "Solicitação gerada" },
      { time: "09:04", event: "Veículo em trânsito" },
    ],
  },
];

export const timelineProgress: Record<string, string> = {
  "Entregue": "100%",
  "Em transporte": "66%",
  "Aguardando avaliação": "66%",
};

// ─── Monitoramento de Rede ───────────────────────────────────────────────────

export const LATENCY_24H = (() => {
  const base = [28,31,27,29,35,42,38,33,29,31,44,58,62,51,39,35,32,30,29,31,34,38,36,33];
  return base.map((v, i) => {
    const h = i === 0 ? "00h" : i % 2 === 0 ? `${String(i).padStart(2,"0")}h` : "";
    return { hour: h || String(i), ms: v + Math.round(Math.random() * 4), label: `${i}h` };
  });
})();

export const SERVICES: Service[] = [
  { name: "API de Estoque", endpoint: "/api/v1/instituicoes/lotes", status: "operacional", latencyMs: 38, errorRate: 0.2, lastCheck: "há 12s" },
  { name: "API de Requisições", endpoint: "/api/v1/requisicoes", status: "operacional", latencyMs: 44, errorRate: 0.5, lastCheck: "há 12s" },
  { name: "API de Instituições", endpoint: "/api/v1/instituicoes", status: "operacional", latencyMs: 25, errorRate: 0.0, lastCheck: "há 10s" },
];

export const URGENCY_CFG: Record<ReqUrgency, { label: string; badge: string; dot: string; border: string; btn: string }> = {
  rotina:      { label: "Rotina",       badge: "bg-emerald-50 text-emerald-700",  dot: "bg-emerald-400", border: "border-l-emerald-500", btn: "border-emerald-300 text-emerald-700 bg-emerald-50" },
  prioritaria: { label: "Prioritária",  badge: "bg-amber-50 text-amber-700",     dot: "bg-amber-400",   border: "border-l-amber-400",   btn: "border-amber-300 text-amber-700 bg-amber-50"    },
  emergencia:  { label: "Emergência",   badge: "bg-[#FFF0F2] text-[#C8102E]",    dot: "bg-[#C8102E]",   border: "border-l-[#C8102E]",   btn: "border-[#C8102E]/40 text-[#C8102E] bg-[#FFF0F2]" },
};

export const STATUS_CFG: Record<ReqStatus, { label: string; badge: string }> = {
  pendente:   { label: "Pendente",   badge: "bg-amber-50 text-amber-700"       },
  em_analise: { label: "Em análise", badge: "bg-blue-50 text-blue-700"         },
  aprovada:   { label: "Aprovada",   badge: "bg-emerald-50 text-emerald-700"   },
  negada:     { label: "Negada",     badge: "bg-slate-100 text-slate-500"      },
};

export const BT_LABELS = ["O-", "O+", "A-", "A+", "B-", "B+", "AB-", "AB+"] as const;

export const BT_DATA: BtStats[] = [
  { bt: "O-",  mean: 12.4, stddev: 3.1, cv: 25.0, trendPct:  8, weekly: [10, 14, 11, 13, 12, 16, 11, 13] },
  { bt: "O+",  mean: 28.7, stddev: 4.2, cv: 14.6, trendPct: -3, weekly: [27, 30, 26, 31, 28, 29, 27, 32] },
  { bt: "A-",  mean:  9.1, stddev: 3.8, cv: 41.8, trendPct: 12, weekly: [ 6,  9, 12,  7, 10,  8, 13,  9] },
  { bt: "A+",  mean: 22.3, stddev: 2.9, cv: 13.0, trendPct: -1, weekly: [21, 24, 22, 20, 23, 22, 25, 21] },
  { bt: "B-",  mean:  6.8, stddev: 2.6, cv: 38.2, trendPct: -9, weekly: [ 9,  5,  8,  4,  7,  6, 10,  5] },
  { bt: "B+",  mean: 15.2, stddev: 3.4, cv: 22.4, trendPct:  5, weekly: [13, 17, 14, 16, 15, 14, 18, 15] },
  { bt: "AB-", mean:  4.3, stddev: 1.9, cv: 44.2, trendPct: 15, weekly: [ 3,  5,  4,  6,  3,  4,  6,  4] },
  { bt: "AB+", mean: 11.6, stddev: 2.2, cv: 19.0, trendPct:  2, weekly: [10, 12, 11, 13, 11, 12, 13, 11] },
];

export const WEEK_LABELS = ["Sem 1", "Sem 2", "Sem 3", "Sem 4", "Sem 5", "Sem 6", "Sem 7", "Sem 8"];

export function cvClass(cv: number): { label: string; badge: string; dot: string } {
  if (cv < 15) return { label: "Estável", badge: "bg-emerald-50 text-emerald-700", dot: "bg-emerald-400" };
  if (cv < 30) return { label: "Moderadamente Instável", badge: "bg-amber-50 text-amber-700", dot: "bg-amber-400" };
  return { label: "Alta Instabilidade", badge: "bg-[#FFF0F2] text-[#C8102E]", dot: "bg-[#C8102E]" };
}

export function fmt(n: number, dec = 1) {
  return n.toLocaleString("pt-BR", { minimumFractionDigits: dec, maximumFractionDigits: dec });
}

export const LOTE_COMPONENTS: LoteComponent[] = ["Concentrado de Hemácias", "Plasma", "Plaquetas", "Crioprecipitado"];
export const LOTE_BLOOD_TYPES = ["O-","O+","A-","A+","B-","B+","AB-","AB+"];
export const bloodTypes = ["O-", "O+", "A-", "A+", "B-", "B+", "AB-", "AB+"] as const;