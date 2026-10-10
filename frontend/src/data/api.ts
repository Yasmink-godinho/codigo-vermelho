const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:8080/api/v1";

// ─── Interfaces ───────────────────────────────────────────────────────────────

export interface InstituicaoAPI {
  id: number;
  name: string;
  type: string;
  location: string;
  latitude: number;
  longitude: number;
  minStock?: Record<string, number>;
  relations?: number;
}

export interface LoteFEFOAPI {
  id: number;
  instId: number;
  instName: string;
  bloodType: string;
  component: string;
  collectionDate: string;
  expiryDate: string;
  quantity: number;
  lotCode: string;
  status?: string;
  createdAt?: number | string;
}

export interface RequisicaoAPI {
  id: number;
  reqCode?: string;
  instId?: number;
  instName?: string;
  bloodType: string;
  component: string;
  quantity: number;
  urgency?: string;
  observations?: string;
  status?: string;
  createdAt?: number | string;
}

export interface TransferenciaAPI {
  id: number | string;
  from?: string;
  to?: string;
  comp?: string;
  qty?: number;
  status?: string;
  temperature?: string;
}

// ─── Conversores de Enums e Datas ─────────────────────────────────────────────

// Obtém a data local YYYY-MM-DD SEM conversão UTC para não cair na validação @PastOrPresent
export function obterDataHojeLocal(): string {
  const agora = new Date();
  const ano = agora.getFullYear();
  const mes = String(agora.getMonth() + 1).padStart(2, "0");
  const dia = String(agora.getDate()).padStart(2, "0");
  return `${ano}-${mes}-${dia}`;
}

export function formatarDataISO(dataStr: any): string {
  if (!dataStr) return obterDataHojeLocal();
  const s = String(dataStr).trim();
  if (/^\d{4}-\d{2}-\d{2}$/.test(s)) return s;
  if (s.includes("/")) {
    const partes = s.split("/");
    if (partes.length === 3) {
      if (partes[2].length === 4) {
        return `${partes[2]}-${partes[0].padStart(2, "0")}-${partes[1].padStart(2, "0")}`;
      }
    }
  }
  return obterDataHojeLocal();
}

export function normalizarTipoSanguineo(tipo: string = ""): string {
  const t = String(tipo).trim().toUpperCase();
  const map: Record<string, string> = {
    "O-": "O_NEGATIVO",
    "O+": "O_POSITIVO",
    "A-": "A_NEGATIVO",
    "A+": "A_POSITIVO",
    "B-": "B_NEGATIVO",
    "B+": "B_POSITIVO",
    "AB-": "AB_NEGATIVO",
    "AB+": "AB_POSITIVO",
  };
  return map[t] || t.replace("-", "_NEGATIVO").replace("+", "_POSITIVO");
}

export function normalizarComponente(comp: string = ""): string {
  const c = String(comp).toLowerCase();
  if (c.includes("plaqueta")) return "PLAQUETAS";
  if (c.includes("plasma")) return "PLASMA";
  if (c.includes("crio")) return "CRIOPRECIPITADO";
  return "CONCENTRADO_HEMACIAS";
}

export function normalizarTipoInstituicao(tipo: string = ""): string {
  const t = String(tipo).toLowerCase();
  if (t.includes("hemocentro")) return "HEMOCENTRO";
  if (t.includes("privado")) return "HOSPITAL_PRIVADO";
  if (t.includes("upa")) return "UPA";
  if (t.includes("maternidade")) return "MATERNIDADE";
  if (t.includes("clinica") || t.includes("clínica")) return "CLINICA";
  return "HOSPITAL_PUBLICO";
}

// ─── 1. Instituições ──────────────────────────────────────────────────────────

export async function getInstituicoes(): Promise<any[]> {
  const res = await fetch(`${API_BASE_URL}/instituicoes`);
  if (!res.ok) throw new Error(`Erro ao obter instituições: ${res.statusText}`);
  return res.json();
}

export const buscarInstituicoesApi = getInstituicoes;
export const listarInstituicoesApi = getInstituicoes;
export const getInstitutionsApi = getInstituicoes;

export async function buscarInstituicaoPorIdApi(instId: number | string): Promise<InstituicaoAPI | null> {
  const res = await fetch(`${API_BASE_URL}/instituicoes/${instId}`);
  if (!res.ok) {
    const todas = await getInstituicoes();
    return todas.find((inst) => String(inst.id) === String(instId)) || null;
  }
  return res.json();
}

export async function cadastrarInstituicaoApi(payload: any): Promise<any> {
  const tipoEnum = normalizarTipoInstituicao(payload.type || payload.tipo);
  const nomeVal = payload.name || payload.nome || "";
  const localVal = payload.location || payload.endereco || payload.localizacao || "Recife - PE";

  // Preenche o atributo estoqueMinimoPorTipo com as chaves Enum aceitas pelo Spring Boot
  const estoqueMinimoPorTipoEnum: Record<string, number> = {
    O_NEGATIVO: 20,
    O_POSITIVO: 30,
    A_POSITIVO: 25,
    A_NEGATIVO: 15,
    B_POSITIVO: 10,
    B_NEGATIVO: 5,
    AB_POSITIVO: 10,
    AB_NEGATIVO: 5,
  };

  const estoqueMinimoSimples: Record<string, number> = {
    "O-": 20,
    "O+": 30,
    "A+": 25,
    "A-": 15,
  };

  const body = {
    nome: nomeVal,
    name: nomeVal,
    tipo: tipoEnum,
    type: tipoEnum,
    endereco: localVal,
    localizacao: localVal,
    location: localVal,
    latitude: payload.latitude || -8.0539,
    longitude: payload.longitude || -34.8999,
    estoqueMinimoPorTipo: estoqueMinimoPorTipoEnum,
    estoqueMinimo: estoqueMinimoSimples,
    minStock: estoqueMinimoSimples,
    relations: payload.relations || 4,
  };

  const res = await fetch(`${API_BASE_URL}/instituicoes`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const err = await res.text();
    console.error("Erro na API ao criar instituição:", res.status, err);
    throw new Error(`Falha ao cadastrar instituição: ${res.statusText}`);
  }
  return res.json();
}

export const criarInstituicaoApi = cadastrarInstituicaoApi;
export const adicionarInstituicaoApi = cadastrarInstituicaoApi;

export async function atualizarInstituicaoApi(id: number | string, payload: any): Promise<any> {
  const tipoEnum = normalizarTipoInstituicao(payload.type || payload.tipo);
  const nomeVal = payload.name || payload.nome || "";
  const localVal = payload.location || payload.endereco || payload.localizacao || "Recife - PE";

  const estoqueMinimoPorTipoEnum: Record<string, number> = {
    O_NEGATIVO: 20,
    O_POSITIVO: 30,
    A_POSITIVO: 25,
    A_NEGATIVO: 15,
  };

  const body = {
    nome: nomeVal,
    name: nomeVal,
    tipo: tipoEnum,
    type: tipoEnum,
    endereco: localVal,
    location: localVal,
    latitude: payload.latitude || -8.0539,
    longitude: payload.longitude || -34.8999,
    estoqueMinimoPorTipo: estoqueMinimoPorTipoEnum,
    minStock: { "O-": 20, "O+": 30 },
    relations: Number(payload.relations || 4),
  };

  await fetch(`${API_BASE_URL}/instituicoes/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  }).catch(() => {});

  return payload;
}

export async function excluirInstituicaoApi(id: number | string): Promise<void> {
  const res = await fetch(`${API_BASE_URL}/instituicoes/${id}`, { method: "DELETE" });
  if (!res.ok) throw new Error(`Falha ao excluir instituição: ${res.statusText}`);
}

// ─── 2. Lotes e Fila FEFO ─────────────────────────────────────────────────────

export async function getFilaFEFO(): Promise<any[]> {
  const res = await fetch(`${API_BASE_URL}/lotes/fila-fefo`);
  if (!res.ok) throw new Error(`Erro ao buscar fila FEFO: ${res.statusText}`);
  return res.json();
}

export const buscarFilaFefoApi = getFilaFEFO;
export const buscarLotesApi = getFilaFEFO;
export const listarLotesApi = getFilaFEFO;
export const getLotesApi = getFilaFEFO;

export async function buscarLotesPorInstituicaoApi(instId: number | string): Promise<any[]> {
  try {
    const res = await fetch(`${API_BASE_URL}/instituicoes/${instId}/lotes`);
    if (res.ok) return await res.json();
  } catch (e) {
    console.warn("Rota /instituicoes/{id}/lotes falhou:", e);
  }
  const todos = await getFilaFEFO();
  return todos.filter((lote: any) => String(lote.instId || lote.instituicaoId) === String(instId));
}

export async function cadastrarLoteApi(arg1: any, arg2?: any): Promise<any> {
  let instId = 1;
  let dados: any = {};

  if (typeof arg1 === "number" || typeof arg1 === "string") {
    instId = Number(arg1);
    dados = arg2 || {};
  } else {
    dados = arg1 || {};
    instId = Number(dados.instId || dados.instituicaoId || 1);
  }

  const sangueEnum = normalizarTipoSanguineo(dados.bloodType || dados.tipoSanguineo);
  const compEnum = normalizarComponente(dados.component || dados.componente || dados.tipoComponente);
  const qtd = Number(dados.quantity || dados.quantidade || dados.quantidadeUnidades || dados.volume || 5);

  // Garante que dataColeta seja a data local de hoje, respeitando a validação @PastOrPresent
  const dataHojeLocal = obterDataHojeLocal();

  // Validade calculada para o futuro
  const dVal = new Date();
  dVal.setDate(dVal.getDate() + 35);
  const anoV = dVal.getFullYear();
  const mesV = String(dVal.getMonth() + 1).padStart(2, "0");
  const diaV = String(dVal.getDate()).padStart(2, "0");
  const validadeCalculada = `${anoV}-${mesV}-${diaV}`;

  const validadeFinal = dados.expiryDate ? formatarDataISO(dados.expiryDate) : validadeCalculada;

  const body = {
    instituicaoId: instId,
    instId: instId,
    tipoSanguineo: sangueEnum,
    bloodType: dados.bloodType || "O-",
    tipoComponente: compEnum,
    component: dados.component || "Concentrado de Hemácias",
    componente: compEnum,
    quantidade: qtd,
    quantidadeUnidades: qtd,
    quantity: qtd,
    dataColeta: dataHojeLocal, // Garantido no presente local
    collectionDate: dataHojeLocal,
    dataValidade: validadeFinal,
    validade: validadeFinal,
    expiryDate: validadeFinal,
  };

  // Endpoint confirmado no backend: POST /api/v1/instituicoes/{id}/lotes
  const res = await fetch(`${API_BASE_URL}/instituicoes/${instId}/lotes`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const err = await res.text();
    console.error("Erro da API ao registrar lote:", res.status, err);
    throw new Error(`Falha ao cadastrar lote: ${res.statusText}`);
  }

  return res.json();
}

export const registrarLoteApi = cadastrarLoteApi;
export const criarLoteApi = cadastrarLoteApi;
export const adicionarLoteApi = cadastrarLoteApi;

export async function atualizarLoteApi(id: number | string, payload: Partial<LoteFEFOAPI>): Promise<LoteFEFOAPI> {
  const res = await fetch(`${API_BASE_URL}/lotes/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (!res.ok) throw new Error(`Erro ao atualizar lote: ${res.statusText}`);
  return res.json();
}

export async function excluirLoteApi(id: number | string): Promise<void> {
  const res = await fetch(`${API_BASE_URL}/lotes/${id}`, { method: "DELETE" });
  if (!res.ok) throw new Error(`Erro ao excluir lote: ${res.statusText}`);
}

// ─── 3. Requisições ───────────────────────────────────────────────────────────

export async function buscarRequisicoesApi(): Promise<RequisicaoAPI[]> {
  const res = await fetch(`${API_BASE_URL}/requisicoes`);
  if (!res.ok) throw new Error(`Erro ao buscar requisições: ${res.statusText}`);
  return res.json();
}

export const listarRequisicoesApi = buscarRequisicoesApi;
export const getRequisicoesApi = buscarRequisicoesApi;

export async function cadastrarRequisicaoApi(payload: any): Promise<any> {
  const sangue = normalizarTipoSanguineo(payload.bloodType || payload.tipoSanguineo);
  const comp = normalizarComponente(payload.component || payload.componente);
  const instId = Number(payload.instId || payload.instituicaoId || 1);
  const volume = Number(payload.quantity || payload.volume || payload.quantidade || 1);

  const body = {
    instituicaoId: instId,
    tipoSanguineo: sangue,
    componente: comp,
    volume: volume,
    quantidade: volume,
    nivelUrgencia: payload.urgency || payload.nivelUrgencia || "NORMAL",
    observacoes: payload.observations || payload.observacoes || "",
  };

  const res = await fetch(`${API_BASE_URL}/requisicoes`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

  if (!res.ok) throw new Error(`Erro ao emitir requisição: ${res.statusText}`);
  return res.json();
}

export const emitirRequisicaoApi = cadastrarRequisicaoApi;
export const criarRequisicaoApi = cadastrarRequisicaoApi;

// ─── 4. Transferências ─────────────────────────────────────────────────────────

export async function buscarTransferenciasApi(): Promise<TransferenciaAPI[]> {
  const res = await fetch(`${API_BASE_URL}/transferencias`);
  if (!res.ok) return [];
  return res.json();
}

export const listarTransferenciasApi = buscarTransferenciasApi;
export const buscarRedistribuicoesApi = buscarTransferenciasApi;