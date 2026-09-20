import type { Institution, Lote, Requisicao } from "../types";

const BASE_URL = "http://localhost:8080/api/v1";

// ────────────────────────────────────────────────────────────────
// Dicionários de compatibilidade para enums legíveis
// ────────────────────────────────────────────────────────────────

const COMPONENTE_LABEL: Record<string, string> = {
  CONCENTRADO_HEMACIAS: "Concentrado de Hemácias",
  PLASMA: "Plasma",
  PLAQUETAS: "Plaquetas",
  CRIOPRECIPITADO: "Crioprecipitado",
};

const URGENCIA_LABEL: Record<string, string> = {
  ROTINA: "rotina",
  PRIORITARIA: "prioritaria",
  EMERGENCIA: "emergencia",
};

const STATUS_LABEL: Record<string, string> = {
  PENDENTE: "pendente",
  EM_ANALISE: "em_analise",
  APROVADA: "aprovada",
  RECUSADA: "negada",
  ATENDIDA: "aprovada",
};

function traduzir(dicionario: Record<string, string>, valorCru: string | null | undefined): string {
  if (!valorCru) return "";
  return dicionario[valorCru] ?? valorCru;
}

// ────────────────────────────────────────────────────────────────
// Tipos brutos devolvidos pelo Spring Boot
// ────────────────────────────────────────────────────────────────

interface InstituicaoResponseRaw {
  id: number;
  name: string;
  type: string;
  location: string;
  latitude: number;
  longitude: number;
  minStock: Record<string, number>;
}

interface LoteResponseRaw {
  id: number;
  instId: number;
  instName: string;
  bloodType: string;
  component: string;
  collectionDate: string;
  expiryDate: string;
  quantity: number;
  lotCode: string;
}

interface RequisicaoResponseRaw {
  id: number;
  reqCode?: string;
  codigoRequisicao?: string;
  instId?: number;
  instituicaoSolicitanteId?: number;
  instName?: string;
  instituicaoSolicitanteNome?: string;
  bloodType?: string;
  tipoSanguineo?: string;
  component?: string;
  componente?: string;
  quantity?: number;
  volume?: number;
  urgency?: string;
  nivelUrgencia?: string;
  status: string;
  observations?: string;
  observacoes?: string;
  createdAt?: number;
  dataCriacao?: string;
}

// ────────────────────────────────────────────────────────────────
// Conversores para o modelo de dados das telas
// ────────────────────────────────────────────────────────────────

function converterInstituicao(raw: InstituicaoResponseRaw): Institution {
  return {
    id: raw.id,
    name: raw.name,
    type: (raw.type as Institution["type"]) || "Hospital Público",
    location: raw.location || "",
    neighborhood: "Região Metropolitana",
    status: "ativa",
    relations: 0,
    components: ["O-", "O+", "A+", "B+"],
    hasHistory: false,
  };
}

function converterLote(raw: LoteResponseRaw): Lote {
  return {
    id: raw.id,
    instId: raw.instId,
    instName: raw.instName,
    bloodType: raw.bloodType as Lote["bloodType"],
    component: (traduzir(COMPONENTE_LABEL, raw.component) || raw.component) as Lote["component"],
    collectionDate: raw.collectionDate,
    expiryDate: raw.expiryDate,
    quantity: raw.quantity,
    lotCode: raw.lotCode,
    createdAt: Date.now(),
  };
}

function converterRequisicao(raw: RequisicaoResponseRaw): Requisicao {
  const reqCode = raw.reqCode || raw.codigoRequisicao || `REQ-${raw.id}`;
  const instId = raw.instId || raw.instituicaoSolicitanteId || 1;
  const instName = raw.instName || raw.instituicaoSolicitanteNome || "Instituição";
  const bloodType = (raw.bloodType || raw.tipoSanguineo || "O-") as Requisicao["bloodType"];
  const compRaw = raw.component || raw.componente || "CONCENTRADO_HEMACIAS";
  const component = (traduzir(COMPONENTE_LABEL, compRaw) || compRaw) as Requisicao["component"];
  const quantity = raw.quantity || raw.volume || 1;
  const urgRaw = raw.urgency || raw.nivelUrgencia || "ROTINA";
  const urgency = (traduzir(URGENCIA_LABEL, urgRaw) || urgRaw.toLowerCase()) as Requisicao["urgency"];
  const status = (traduzir(STATUS_LABEL, raw.status) || raw.status.toLowerCase()) as Requisicao["status"];
  const observations = raw.observations || raw.observacoes || "";
  const createdAt = raw.createdAt || (raw.dataCriacao ? Date.parse(raw.dataCriacao) : Date.now());

  return {
    id: raw.id,
    reqCode,
    instId,
    instName,
    bloodType,
    component,
    quantity,
    urgency,
    observations,
    status,
    createdAt,
  };
}

async function tratarResposta<T>(res: Response): Promise<T> {
  if (!res.ok) {
    const corpo = await res.json().catch(() => null);
    throw new Error(corpo?.mensagem ?? `Erro na requisição (status ${res.status})`);
  }
  return res.json();
}

// ────────────────────────────────────────────────────────────────
// Endpoints de Integração
// ────────────────────────────────────────────────────────────────

export async function buscarInstituicoesApi(): Promise<Institution[]> {
  const res = await fetch(`${BASE_URL}/instituicoes`);
  const dados = await tratarResposta<InstituicaoResponseRaw[]>(res);
  return dados.map(converterInstituicao);
}

export async function cadastrarInstituicaoApi(dados: {
  nome: string;
  tipo: string;
  endereco: string;
  latitude: number;
  longitude: number;
  estoqueMinimoPorTipo?: Record<string, number>;
}): Promise<Institution> {
  const res = await fetch(`${BASE_URL}/instituicoes`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(dados),
  });
  const resposta = await tratarResposta<InstituicaoResponseRaw>(res);
  return converterInstituicao(resposta);
}

export async function buscarLotesApi(): Promise<Lote[]> {
  const res = await fetch(`${BASE_URL}/lotes`);
  const dados = await tratarResposta<LoteResponseRaw[]>(res);
  return dados.map(converterLote);
}

export async function buscarLotesPorInstituicaoApi(instituicaoId: number): Promise<Lote[]> {
  const res = await fetch(`${BASE_URL}/instituicoes/${instituicaoId}/lotes`);
  const dados = await tratarResposta<LoteResponseRaw[]>(res);
  return dados.map(converterLote);
}

export async function buscarFilaFefoApi(tipoSanguineo?: string, instituicaoId?: number): Promise<Lote[]> {
  const params = new URLSearchParams();
  if (tipoSanguineo && tipoSanguineo !== "Todos") params.set("tipoSanguineo", tipoSanguineo);
  if (instituicaoId) params.set("instituicaoId", String(instituicaoId));
  const res = await fetch(`${BASE_URL}/lotes/fila-fefo?${params.toString()}`);
  const dados = await tratarResposta<LoteResponseRaw[]>(res);
  return dados.map(converterLote);
}

export async function registrarLoteApi(
  instId: number,
  dados: {
    tipoSanguineo: string;
    componente: string;
    dataColeta: string;
    validade?: string;
    quantidade: number;
  }
): Promise<Lote> {
  const res = await fetch(`${BASE_URL}/instituicoes/${instId}/lotes`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(dados),
  });
  const resposta = await tratarResposta<LoteResponseRaw>(res);
  return converterLote(resposta);
}

export async function buscarRequisicoesApi(status?: string, urgencia?: string): Promise<Requisicao[]> {
  const params = new URLSearchParams();
  if (status && status !== "todas") params.set("status", status.toUpperCase());
  if (urgencia && urgencia !== "todas") params.set("urgencia", urgencia.toUpperCase());
  const res = await fetch(`${BASE_URL}/requisicoes?${params.toString()}`);
  const dados = await tratarResposta<RequisicaoResponseRaw[]>(res);
  return dados.map(converterRequisicao);
}

export async function emitirRequisicaoApi(dados: {
  instituicaoId: number;
  tipoSanguineo: string;
  componente: string;
  volume: number;
  nivelUrgencia: string;
  observacoes?: string;
}): Promise<Requisicao> {
  const res = await fetch(`${BASE_URL}/requisicoes`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(dados),
  });
  const resposta = await tratarResposta<RequisicaoResponseRaw>(res);
  return converterRequisicao(resposta);
}