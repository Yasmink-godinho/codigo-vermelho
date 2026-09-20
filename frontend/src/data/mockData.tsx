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

// Routes: [originId, destId]
export const activeRoutes: [number, number][] = [
  [1, 2], // HR → HUOC (transferência O-)
  [3, 7], // HEMOPE → Maternidade (transferência B+)
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

// ─── Lotes (Stock batches) ───────────────────────────────────────────────────

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
  const today = new Date(); today.setHours(0, 0, 0, 0);
  const target = new Date(dateStr + "T00:00:00");
  return Math.round((target.getTime() - today.getTime()) / 86400000);
}

export function todayISO(): string {
  return new Date().toISOString().slice(0, 10);
}

export function nextLotCode(existing: Lote[]): string {
  const year = new Date().getFullYear();
  const nums = existing.map((l) => parseInt(l.lotCode.split("-")[2] ?? "0")).filter(Boolean);
  const next = nums.length ? Math.max(...nums) + 1 : 891;
  return `LT-${year}-${String(next).padStart(4, "0")}`;
}

export const today = todayISO();
export const DEMO_LOTES: Lote[] = [
  { id: 101, instId: 2, instName: "Fundação HEMOPE", bloodType: "O-", component: "Concentrado de Hemácias", collectionDate: "2024-07-28", expiryDate: addDays("2024-07-28", 42), quantity: 18, lotCode: "LT-2024-0871", createdAt: Date.now() - 86400000 * 8 },
  { id: 102, instId: 2, instName: "Fundação HEMOPE", bloodType: "O+", component: "Concentrado de Hemácias", collectionDate: "2024-08-05", expiryDate: addDays("2024-08-05", 42), quantity: 24, lotCode: "LT-2024-0878", createdAt: Date.now() - 86400000 * 3 },
  { id: 103, instId: 2, instName: "Fundação HEMOPE", bloodType: "AB-", component: "Plaquetas", collectionDate: "2024-08-25", expiryDate: addDays("2024-08-25", 5), quantity: 6, lotCode: "LT-2024-0882", createdAt: Date.now() - 86400000 * 2 },
  { id: 104, instId: 2, instName: "Fundação HEMOPE", bloodType: "A+", component: "Plasma", collectionDate: "2024-03-10", expiryDate: addDays("2024-03-10", 365), quantity: 30, lotCode: "LT-2024-0844", createdAt: Date.now() - 86400000 * 172 },
  { id: 105, instId: 1, instName: "Hospital da Restauração", bloodType: "B-", component: "Concentrado de Hemácias", collectionDate: "2024-08-18", expiryDate: addDays("2024-08-18", 42), quantity: 8, lotCode: "LT-2024-0883", createdAt: Date.now() - 86400000 * 4 },
  { id: 106, instId: 1, instName: "Hospital da Restauração", bloodType: "O-", component: "Concentrado de Hemácias", collectionDate: "2024-08-22", expiryDate: addDays("2024-08-22", 42), quantity: 12, lotCode: "LT-2024-0887", createdAt: Date.now() - 86400000 },
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
  { id: 201, reqCode: "REQ-2024-0298", instId: 2, instName: "Fundação HEMOPE", bloodType: "O-", component: "Concentrado de Hemácias", quantity: 4, urgency: "emergencia", observations: "Paciente politraumatizado — UTI adulto.", status: "em_analise", createdAt: Date.now() - 60000 * 14 },
  { id: 202, reqCode: "REQ-2024-0297", instId: 1, instName: "Hospital da Restauração", bloodType: "A+", component: "Plasma", quantity: 6, urgency: "prioritaria", observations: "", status: "aprovada", createdAt: Date.now() - 60000 * 73 },
  { id: 203, reqCode: "REQ-2024-0296", instId: 3, instName: "HUOC — Hosp. Universitário Oswaldo Cruz", bloodType: "AB-", component: "Plaquetas", quantity: 2, urgency: "rotina", observations: "Reposição de estoque preventivo.", status: "pendente", createdAt: Date.now() - 60000 * 185 },
  { id: 204, reqCode: "REQ-2024-0295", instId: 6, instName: "Maternidade do Recife", bloodType: "B+", component: "Concentrado de Hemácias", quantity: 3, urgency: "prioritaria", observations: "Pós-parto com hemorragia.", status: "aprovada", createdAt: Date.now() - 3600000 * 5 },
  { id: 205, reqCode: "REQ-2024-0294", instId: 8, instName: "UPA Torrões", bloodType: "O+", component: "Concentrado de Hemácias", quantity: 2, urgency: "rotina", observations: "", status: "negada", createdAt: Date.now() - 3600000 * 11 },
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
    hasHistory: true,
  },
  {
    id: 9,
    name: "UPA Caçote",
    type: "UPA",
    location: "Rua Henrique Dias, 320 — Caçote",
    neighborhood: "Caçote",
    status: "em_analise",
    relations: 1,
    components: ["O+", "A+", "B+"],
    hasHistory: false,
  },
  {
    id: 10,
    name: "Clínica São Lucas",
    type: "Clínica",
    location: "Rua da Aurora, 573 — Boa Vista",
    neighborhood: "Boa Vista",
    status: "inativa",
    relations: 0,
    components: ["A+", "O+"],
    hasHistory: false,
  },
];

export const instTypeOptions: InstType[] = ["Hospital Público","Hospital Privado","UPA","Hemocentro","Maternidade","Clínica"];
export const allComponents = ["O-","O+","A-","A+","B-","B+","AB-","AB+"];
export const neighborhoods = ["Boa Vista","Derby","Graças","Casa Amarela","Iputinga","Torrões","Caçote","Prado","Afogados","Recife Antigo"];

// ─── Compatibilidade ABO/Rh ──────────────────────────────────────────────────

// ABO/Rh compatibility — donor → compatible recipient types
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
    "O-": "O- é doador universal: compatível com todos os tipos receptores, pois não possui antígenos ABO nem fator Rh.",
    "O+": "O- é doador universal e pode ser transfundido em receptores O+.", "A-": "O- é doador universal e pode ser transfundido em receptores A-.",
    "A+": "O- é doador universal e pode ser transfundido em receptores A+.", "B-": "O- é doador universal e pode ser transfundido em receptores B-.",
    "B+": "O- é doador universal e pode ser transfundido em receptores B+.", "AB-": "O- é doador universal e pode ser transfundido em receptores AB-.",
    "AB+": "O- é doador universal e pode ser transfundido em receptores AB+.",
  },
  "O+": {
    "O+": "O+ é compatível com O+ — mesmo grupo ABO e presença do fator Rh no receptor permite a transfusão.", "A+": "O+ pode ser transfundido em A+ — grupo O sem antígenos ABO conflitantes, e receptor aceita Rh+.",
    "B+": "O+ pode ser transfundido em B+ — grupo O sem conflito ABO, receptor aceita Rh+.", "AB+": "O+ pode ser transfundido em AB+ — receptor universal, aceita qualquer doador Rh+.",
    "O-": "O+ não pode ser transfundido em O- — o receptor Rh- pode desenvolver anticorpos anti-Rh ao receber sangue Rh+, causando reação hemolítica.", "A-": "O+ não pode ser transfundido em A- — incompatibilidade do fator Rh. Receptor Rh- rejeita sangue Rh+.",
    "B-": "O+ não pode ser transfundido em B- — incompatibilidade Rh. Receptor Rh- não tolera o antígeno D presente no sangue Rh+.", "AB-": "O+ não pode ser transfundido em AB- — apesar do grupo AB ser receptor universal ABO, a incompatibilidade Rh impede a transfusão.",
  },
  "A-": {
    "A-": "A- pode ser transfundido em A- — mesmo grupo ABO e ambos Rh-.", "A+": "A- pode ser transfundido em A+ — mesmo grupo ABO e receptor aceita doadores Rh-.",
    "AB-": "A- pode ser transfundido em AB- — receptor universal aceita antígenos A, e ambos são Rh-.", "AB+": "A- pode ser transfundido em AB+ — receptor universal AB aceita qualquer doador.",
    "O-": "A- não pode ser transfundido em O- — o receptor O- não possui antígenos A ou B, e o plasma contém anticorpos anti-A que reagiriam às hemácias A.", "O+": "A- não pode ser transfundido em O+ — anticorpos anti-A no plasma do receptor O+ causariam reação hemolítica.",
    "B-": "A- não pode ser transfundido em B- — o receptor B- possui anticorpos anti-A que reagiriam com as hemácias do tipo A.", "B+": "A- não pode ser transfundido em B+ — incompatibilidade ABO: anticorpos anti-A no receptor B causariam reação transfusional grave.",
  },
  "A+": {
    "A+": "A+ pode ser transfundido em A+ — mesmo grupo ABO e mesmo fator Rh.", "AB+": "A+ pode ser transfundido em AB+ — receptor universal AB+ aceita todos os tipos.",
    "O-": "A+ não pode ser transfundido em O- — dupla incompatibilidade: ABO (anticorpos anti-A no receptor) e Rh (receptor Rh- rejeita doador Rh+).", "O+": "A+ não pode ser transfundido em O+ — incompatibilidade ABO: o receptor O+ possui anticorpos anti-A.",
    "A-": "A+ não pode ser transfundido em A- — incompatibilidade Rh: o receptor Rh- pode desenvolver anticorpos anti-D.", "B-": "A+ não pode ser transfundido em B- — incompatibilidade ABO e Rh.",
    "B+": "A+ não pode ser transfundido em B+ — incompatibilidade ABO: o receptor B+ possui anticorpos anti-A.", "AB-": "A+ não pode ser transfundido em AB- — incompatibilidade Rh: receptor Rh- não tolera doador Rh+.",
  },
  "B-": {
    "B-": "B- pode ser transfundido em B- — mesmo grupo ABO e ambos Rh-.", "B+": "B- pode ser transfundido em B+ — mesmo grupo ABO e receptor aceita doadores Rh-.",
    "AB-": "B- pode ser transfundido em AB- — receptor universal AB aceita antígenos B, e ambos são Rh-.", "AB+": "B- pode ser transfundido em AB+ — receptor universal AB+ aceita qualquer doador.",
    "O-": "B- não pode ser transfundido em O- — anticorpos anti-B no plasma do receptor O- reagiriam às hemácias B.", "O+": "B- não pode ser transfundido em O+ — incompatibilidade ABO: anticorpos anti-B no receptor O+ causariam reação hemolítica.",
    "A-": "B- não pode ser transfundido em A- — o receptor A- possui anticorpos anti-B que reagiriam com as hemácias do tipo B.", "A+": "B- não pode ser transfundido em A+ — incompatibilidade ABO: anticorpos anti-B no receptor A+ causariam reação transfusional grave.",
  },
  "B+": {
    "B+": "B+ pode ser transfundido em B+ — mesmo grupo ABO e mesmo fator Rh.", "AB+": "B+ pode ser transfundido em AB+ — receptor universal AB+ aceita todos os tipos.",
    "O-": "B+ não pode ser transfundido em O- — dupla incompatibilidade: ABO e Rh.", "O+": "B+ não pode ser transfundido em O+ — incompatibilidade ABO: anticorpos anti-B no receptor O.",
    "A-": "B+ não pode ser transfundido em A- — incompatibilidade ABO e Rh.", "A+": "B+ não pode ser transfundido em A+ — incompatibilidade ABO: receptor A possui anticorpos anti-B.",
    "B-": "B+ não pode ser transfundido em B- — incompatibilidade Rh: receptor Rh- não tolera doador Rh+.", "AB-": "B+ não pode ser transfundido em AB- — incompatibilidade Rh: receptor AB- rejeita doador Rh+.",
  },
  "AB-": {
    "AB-": "AB- pode ser transfundido em AB- — mesmo grupo ABO e ambos Rh-.", "AB+": "AB- pode ser transfundido em AB+ — receptor AB+ aceita qualquer doador.",
    "O-": "AB- não pode ser transfundido em O- — receptor O- possui anticorpos anti-A e anti-B, incompatível com AB.", "O+": "AB- não pode ser transfundido em O+ — incompatibilidade ABO severa.",
    "A-": "AB- não pode ser transfundido em A- — receptor A possui anticorpos anti-B que reagiriam com as hemácias AB.", "A+": "AB- não pode ser transfundido em A+ — incompatibilidade ABO: anticorpos anti-B presentes no receptor A.",
    "B-": "AB- não pode ser transfundido em B- — receptor B possui anticorpos anti-A que reagiriam com hemácias AB.", "B+": "AB- não pode ser transfundido em B+ — incompatibilidade ABO: anticorpos anti-A no receptor B.",
  },
  "AB+": {
    "AB+": "AB+ pode ser transfundido em AB+ — receptor universal AB+ aceita todos os tipos, e mesmo grupo.",
    "O-": "AB+ não pode ser transfundido em O- — incompatibilidade ABO e Rh. AB+ só pode ser doado a receptores AB+.", "O+": "AB+ não pode ser transfundido em O+ — incompatibilidade ABO. AB+ só é compatível com AB+.",
    "A-": "AB+ não pode ser transfundido em A- — incompatibilidade ABO e Rh.", "A+": "AB+ não pode ser transfundido em A+ — incompatibilidade ABO: receptor A possui anticorpos anti-B.",
    "B-": "AB+ não pode ser transfundido em B- — incompatibilidade ABO e Rh.", "B+": "AB+ não pode ser transfundido em B+ — incompatibilidade ABO: receptor B possui anticorpos anti-A.",
    "AB-": "AB+ não pode ser transfundido em AB- — incompatibilidade Rh: receptor Rh- não tolera doador Rh+.",
  },
};

export const ALT_STOCKS: Record<string, AltBlood[]> = {
  "O-":  [{ bt: "O-",  institution: "Fundação HEMOPE",           qty: 18 }, { bt: "O-",  institution: "Hospital da Restauração", qty: 9  }, { bt: "O-",  institution: "IMIP",                   qty: 6  }],
  "O+":  [{ bt: "O+",  institution: "Fundação HEMOPE",           qty: 42 }, { bt: "O+",  institution: "HUOC",                   qty: 11 }],
  "A-":  [{ bt: "A-",  institution: "Fundação HEMOPE",           qty: 12 }, { bt: "A-",  institution: "Hospital da Restauração", qty: 5  }],
  "A+":  [{ bt: "A+",  institution: "Fundação HEMOPE",           qty: 29 }, { bt: "A+",  institution: "IMIP",                   qty: 8  }, { bt: "A-",  institution: "Fundação HEMOPE",          qty: 12 }],
  "B-":  [{ bt: "B-",  institution: "Fundação HEMOPE",           qty: 9  }, { bt: "O-",  institution: "Fundação HEMOPE",         qty: 18 }],
  "B+":  [{ bt: "B+",  institution: "Hospital Barão de Lucena",  qty: 14 }, { bt: "B+",  institution: "Fundação HEMOPE",         qty: 7  }, { bt: "B-",  institution: "Fundação HEMOPE",          qty: 9  }],
  "AB-": [{ bt: "AB-", institution: "Fundação HEMOPE",           qty: 5  }, { bt: "O-",  institution: "Fundação HEMOPE",         qty: 18 }],
  "AB+": [{ bt: "AB+", institution: "Fundação HEMOPE",           qty: 8  }, { bt: "AB-", institution: "Fundação HEMOPE",         qty: 5  }],
};

// ─── Redistribuições ─────────────────────────────────────────────────────────

export const RECS_DATA: RecData[] = [
  {
    id: "REC-2024-0043",
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
    validity: "12 dias restantes (venc. 09/09/2024)",
    supplierRelation: "Ativa desde Jan/2022",
    route: "Via Av. Gov. Agamenon — 8,4 km",
    transport: "LogMed Express — Veículo L-412",
    transportCondition: "Contêiner refrigerado (2–6°C)",
    reasons: [
      { icon: <IconBell size={14} />, text: "HUOC apresenta risco de atingir nível crítico em 36h" },
      { icon: <IconShield size={14} />, text: "Hospital da Restauração possui estoque acima do nível de segurança (27 unid.)" },
      { icon: <IconDroplet size={14} />, text: "Unidades selecionadas possuem validade adequada (±12 dias)" },
      { icon: <IconHospital size={14} />, text: "Relação de fornecimento ativa entre as instituições" },
      { icon: <IconMapPin size={14} />, text: "Rota elegível — distância: 8,4 km" },
      { icon: <IconTruck size={14} />, text: "Transportador disponível e compatível com hemocomponentes" },
    ],
  },
  {
    id: "REC-2024-0042",
    urgency: "Média",
    urgencyColor: "bg-amber-50 text-amber-700",
    urgencyDot: "bg-amber-400",
    from: "HEMOPE — Fundação HEMOPE",
    to: "UPA Torrões",
    comp: "AB-",
    requestedComp: "O-",
    qty: 2,
    stockFrom: 41,
    stockTo: 6,
    riskForecast: "Atenção em 5 dias",
    validity: "19 dias restantes (venc. 16/09/2024)",
    supplierRelation: "Ativa desde Mar/2023",
    route: "Via Rota Estadual PE-22 — 3,2 km",
    transport: "HEMOTRANS — Veículo HT-08",
    transportCondition: "Bolsa isotérmica validada",
    reasons: [
      { icon: <IconBell size={14} />, text: "UPA Torrões está com estoque de AB- abaixo do mínimo recomendado" },
      { icon: <IconShield size={14} />, text: "HEMOPE possui excedente de AB- coletado nas últimas 24h" },
      { icon: <IconDroplet size={14} />, text: "Unidades dentro do prazo com margem confortável" },
      { icon: <IconMapPin size={14} />, text: "Rota elegível — distância: 3,2 km" },
      { icon: <IconTruck size={14} />, text: "Janela de transporte disponível nas próximas 2 horas" },
    ],
  },
  {
    id: "REC-2024-0041",
    urgency: "Baixa",
    urgencyColor: "bg-emerald-50 text-emerald-700",
    urgencyDot: "bg-emerald-400",
    from: "Hospital Barão de Lucena",
    to: "Hospital Agamenon Magalhães",
    comp: "B-",
    requestedComp: "B+",
    qty: 5,
    stockFrom: 14,
    stockTo: 3,
    riskForecast: "Baixo risco — preventivo",
    validity: "6 dias restantes (venc. 03/09/2024)",
    supplierRelation: "Ativa desde Jun/2021",
    route: "Via Av. Caxangá — 14 km",
    transport: "LogMed Express — Veículo L-305",
    transportCondition: "Contêiner refrigerado (2–6°C)",
    reasons: [
      { icon: <IconDroplet size={14} />, text: "5 unidades de B- com vencimento em 6 dias sem previsão de uso no HBL" },
      { icon: <IconShield size={14} />, text: "HAM apresenta baixo estoque de B- (3 unidades)" },
      { icon: <IconMapPin size={14} />, text: "Rota elegível — distância: 14 km" },
      { icon: <IconTruck size={14} />, text: "Transporte agendável para amanhã pela manhã" },
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
    notes: "Transferência solicitada em resposta ao alerta ALT-0043. Aprovada por Maria Silva às 08:31. Contêiner lacrado e temperatura estável desde a saída. Entregador: João Carlos Silva — habilitado para transporte de hemocomponentes.",
    timeline: [
      { label: "Solicitação", done: true, active: false, time: "08:12" },
      { label: "Análise", done: true, active: false, time: "08:19" },
      { label: "Aprovada", done: true, active: false, time: "08:31" },
      { label: "Em transporte", done: false, active: true, time: "09:04" },
      { label: "Entregue", done: false, active: false, time: "—" },
    ],
    history: [
      { time: "08:12", event: "Solicitação criada pelo sistema — alerta ALT-0043" },
      { time: "08:19", event: "Análise técnica iniciada por João Mendes" },
      { time: "08:26", event: "Análise concluída — recomendação confirmada" },
      { time: "08:31", event: "Transferência aprovada por Maria Silva (Admin. da Rede)" },
      { time: "09:04", event: "Veículo L-412 saiu do Hospital da Restauração" },
    ],
  },
  {
    id: "#1028",
    from: "HEMOPE — Fundação HEMOPE",
    to: "Maternidade do Recife",
    comp: "B+",
    qty: 6,
    status: "Entregue",
    statusColor: "bg-emerald-50 text-emerald-700",
    departure: "07:15",
    eta: "07:38",
    temperature: "4,1°C",
    route: "Via Av. Gov. Agamenon — 4,7 km",
    carrier: "HEMOTRANS — Veículo HT-08",
    operationStatus: "Concluída",
    notes: "Transferência de rotina. Entregue com 3 minutos de antecedência. Temperatura mantida dentro dos limites durante todo o percurso.",
    timeline: [
      { label: "Solicitação", done: true, active: false, time: "06:50" },
      { label: "Análise", done: true, active: false, time: "06:55" },
      { label: "Aprovada", done: true, active: false, time: "07:02" },
      { label: "Em transporte", done: true, active: false, time: "07:15" },
      { label: "Entregue", done: false, active: true, time: "07:38" },
    ],
    history: [
      { time: "06:50", event: "Solicitação criada pela Maternidade do Recife" },
      { time: "06:55", event: "Análise técnica iniciada" },
      { time: "07:02", event: "Aprovada por Dr. Carlos Andrade" },
      { time: "07:15", event: "Veículo HT-08 saiu da Fundação HEMOPE" },
      { time: "07:38", event: "Entrega confirmada — 6 unidades de B+ recebidas" },
    ],
  },
  {
    id: "#1027",
    from: "Hospital Barão de Lucena",
    to: "Maternidade do Recife",
    comp: "B+",
    qty: 4,
    status: "Aguardando avaliação",
    statusColor: "bg-amber-50 text-amber-700",
    departure: "—",
    eta: "—",
    temperature: "7,4°C (alerta)",
    route: "Via Av. Caxangá — 12 km",
    carrier: "LogMed Express — Veículo L-309",
    operationStatus: "Pausada — avaliação técnica",
    notes: "Transferência pausada automaticamente após desvio de temperatura detectado às 10:22. O contêiner registrou 7,4°C durante 18 minutos. Aguardando avaliação do responsável técnico para decidir sobre o prosseguimento ou descarte.",
    timeline: [
      { label: "Solicitação", done: true, active: false, time: "09:40" },
      { label: "Análise", done: true, active: false, time: "09:48" },
      { label: "Aprovada", done: true, active: false, time: "10:01" },
      { label: "Em transporte", done: false, active: true, time: "10:18" },
      { label: "Entregue", done: false, active: false, time: "—" },
    ],
    history: [
      { time: "09:40", event: "Solicitação criada pelo Hospital Barão de Lucena" },
      { time: "09:48", event: "Análise técnica concluída" },
      { time: "10:01", event: "Aprovada por Maria Silva" },
      { time: "10:18", event: "Veículo L-309 saiu do Hospital Barão de Lucena" },
      { time: "10:22", event: "Alerta: temperatura atingiu 7,4°C — transferência pausada" },
    ],
  },
  {
    id: "#1026",
    from: "IMIP — Instituto de Medicina Integral",
    to: "Hospital Agamenon Magalhães",
    comp: "AB-",
    qty: 2,
    status: "Entregue",
    statusColor: "bg-emerald-50 text-emerald-700",
    departure: "06:30",
    eta: "06:55",
    temperature: "3,9°C",
    route: "Via Rua dos Coelhos — 6,1 km",
    carrier: "HEMOTRANS — Veículo HT-03",
    operationStatus: "Concluída",
    notes: "Transferência de urgência para suprir déficit de AB-. Operação encerrada com sucesso.",
    timeline: [
      { label: "Solicitação", done: true, active: false, time: "05:55" },
      { label: "Análise", done: true, active: false, time: "06:02" },
      { label: "Aprovada", done: true, active: false, time: "06:10" },
      { label: "Em transporte", done: true, active: false, time: "06:30" },
      { label: "Entregue", done: false, active: true, time: "06:55" },
    ],
    history: [
      { time: "05:55", event: "Solicitação urgente criada pelo HAM" },
      { time: "06:02", event: "Análise técnica acelerada — urgência confirmada" },
      { time: "06:10", event: "Aprovada por Dr. Carlos Andrade" },
      { time: "06:30", event: "Veículo HT-03 saiu do IMIP" },
      { time: "06:55", event: "Entrega confirmada — 2 unidades de AB- recebidas" },
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
  { name: "API de Estoque",        endpoint: "/api/v2/stock",          status: "operacional",  latencyMs: 38,  errorRate: 0.2, lastCheck: "há 12s" },
  { name: "API de Requisições",    endpoint: "/api/v2/requests",       status: "operacional",  latencyMs: 44,  errorRate: 0.5, lastCheck: "há 12s" },
  { name: "Canal de Telemetria",   endpoint: "/telemetry/ingest",      status: "degradado",    latencyMs: 142, errorRate: 3.1, lastCheck: "há 15s" },
  { name: "API de Redistribuição", endpoint: "/api/v2/redistribution", status: "operacional",  latencyMs: 51,  errorRate: 0.8, lastCheck: "há 12s" },
  { name: "Autenticação",          endpoint: "/auth/token",            status: "operacional",  latencyMs: 22,  errorRate: 0.0, lastCheck: "há 12s" },
  { name: "Notificações Push",     endpoint: "/push/send",             status: "indisponivel", latencyMs: 0,   errorRate: 100, lastCheck: "há 4min" },
  { name: "Relatórios PDF",        endpoint: "/reports/generate",      status: "operacional",  latencyMs: 290, errorRate: 1.2, lastCheck: "há 12s" },
];

// ─── Requisições (config) ────────────────────────────────────────────────────

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

// ─── Análise de Consumo ──────────────────────────────────────────────────────

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
  if (cv < 15) return { label: "Estável",                badge: "bg-emerald-50 text-emerald-700",  dot: "bg-emerald-400" };
  if (cv < 30) return { label: "Moderadamente Instável", badge: "bg-amber-50 text-amber-700",     dot: "bg-amber-400"  };
  return          { label: "Alta Instabilidade",         badge: "bg-[#FFF0F2] text-[#C8102E]",    dot: "bg-[#C8102E]"  };
}

export function fmt(n: number, dec = 1) {
  return n.toLocaleString("pt-BR", { minimumFractionDigits: dec, maximumFractionDigits: dec });
}

// ─── Registrar Lote ──────────────────────────────────────────────────────────

export const LOTE_COMPONENTS: LoteComponent[] = ["Concentrado de Hemácias", "Plasma", "Plaquetas", "Crioprecipitado"];
export const LOTE_BLOOD_TYPES = ["O-","O+","A-","A+","B-","B+","AB-","AB+"];

export const bloodTypes = ["O-", "O+", "A-", "A+", "B-", "B+", "AB-", "AB+"] as const;
