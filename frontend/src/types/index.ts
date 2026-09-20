import type { ReactNode } from "react";

// ─── Hospitals / Map ─────────────────────────────────────────────────────────

export type HospitalStatus = "critico" | "atencao" | "normal" | "transporte";

export interface Hospital {
  id: number;
  name: string;
  shortName: string;
  lat: number;
  lng: number;
  status: HospitalStatus;
  alert: string;
  component: string;
  stock: number;
  stockUnit: string;
  risk: string;
}

// ─── App shell ───────────────────────────────────────────────────────────────

export type Screen = "dashboard" | "alertas" | "fefo" | "requisicoes" | "nova_requisicao" | "redistribuicoes" | "analise" | "transferencias" | "rede" | "instituicoes" | "cadastrar_instituicao" | "registrar_lote" | "estoque_instituicao";
export type UserRole = "operador" | "admin_rede" | "admin_principal";

export interface AppUser {
  email: string;
  name: string;
  title: string;
  role: UserRole;
  roleLabel: string;
  roleBadge: string;
  initials: string;
}

// ─── Lotes (Stock batches) ───────────────────────────────────────────────────

export type LoteComponent = "Concentrado de Hemácias" | "Plasma" | "Plaquetas" | "Crioprecipitado";

export interface Lote {
  id: number;
  instId: number;
  instName: string;
  bloodType: string;
  component: LoteComponent;
  collectionDate: string; // YYYY-MM-DD
  expiryDate: string;     // YYYY-MM-DD
  quantity: number;
  lotCode: string;
  createdAt: number;
}

// ─── Requisições ─────────────────────────────────────────────────────────────

export type ReqUrgency = "rotina" | "prioritaria" | "emergencia";
export type ReqStatus  = "pendente" | "em_analise" | "aprovada" | "negada";

export interface Requisicao {
  id: number;
  reqCode: string;
  instId: number;
  instName: string;
  bloodType: string;
  component: LoteComponent;
  quantity: number;
  urgency: ReqUrgency;
  observations: string;
  status: ReqStatus;
  createdAt: number;
}

// ─── Institutions ────────────────────────────────────────────────────────────

export type InstStatus = "ativa" | "inativa" | "em_analise";
export type InstType = "Hospital Público" | "Hospital Privado" | "UPA" | "Hemocentro" | "Maternidade" | "Clínica";

export interface Institution {
  id: number;
  name: string;
  type: InstType;
  location: string;
  neighborhood: string;
  status: InstStatus;
  relations: number;
  components: string[];
  hasHistory: boolean; // has transfers/alerts/operations — blocks hard delete
}

export type ModalMode = "view" | "edit" | "deactivate" | "delete" | null;

export interface CadastroForm {
  name: string;
  type: InstType;
  location: string;
  lat: string;
  lng: string;
  status: "ativa" | "inativa";
  minStock: Record<string, string>;
}

// ─── Redistribuições / Compatibilidade ───────────────────────────────────────

export interface AltBlood {
  bt: string;
  institution: string;
  qty: number;
}

export interface RecData {
  id: string;
  urgency: string;
  urgencyColor: string;
  urgencyDot: string;
  from: string;
  to: string;
  comp: string;
  requestedComp: string;
  qty: number;
  stockFrom: number;
  stockTo: number;
  riskForecast: string;
  validity: string;
  supplierRelation: string;
  route: string;
  transport: string;
  transportCondition: string;
  reasons: { icon: ReactNode; text: string }[];
}

// ─── Transferências ──────────────────────────────────────────────────────────

export interface TransferData {
  id: string;
  from: string;
  to: string;
  comp: string;
  qty: number;
  status: string;
  statusColor: string;
  departure: string;
  eta: string;
  temperature: string;
  route: string;
  carrier: string;
  operationStatus: string;
  notes: string;
  timeline: { label: string; done: boolean; active: boolean; time: string }[];
  history: { time: string; event: string }[];
}

// ─── Monitoramento de Rede ───────────────────────────────────────────────────

export interface Service {
  name: string;
  endpoint: string;
  status: "operacional" | "degradado" | "indisponivel";
  latencyMs: number;
  errorRate: number;
  lastCheck: string;
}

// ─── Análise de Consumo ──────────────────────────────────────────────────────

export type BloodType = "O-" | "O+" | "A-" | "A+" | "B-" | "B+" | "AB-" | "AB+";

export interface BtStats {
  bt: BloodType;
  mean: number;
  stddev: number;
  cv: number;
  trendPct: number;
  weekly: number[];
}
