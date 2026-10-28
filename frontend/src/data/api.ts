const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:8080/api/v1";

// ─── Chaves de Armazenamento Local ───────────────────────────────────────────
const LOTES_STORAGE_KEY = "codigo_vermelho_lotes_custom";
const TRANSFERENCIAS_STORAGE_KEY = "codigo_vermelho_transferencias";
const INSTITUICOES_STORAGE_KEY = "codigo_vermelho_instituicoes_custom";
const REQUISICOES_STORAGE_KEY = "codigo_vermelho_requisicoes_custom";

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
  status?: string;
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

export interface TransferenciaAPI {
  id: string;
  from: string;
  to: string;
  origemId: number;
  destinoId: number;
  comp: string;
  qty: number;
  status: "Em transporte" | "Em análise" | "Recusada" | "Entregue";
  departure: string;
  eta: string;
  temperature: string;
  route: string;
  carrier: string;
  operationStatus: string;
  notes: string;
  timeline: Array<{ label: string; done: boolean; active: boolean; time: string }>;
  history: Array<{ time: string; event: string }>;
}

export interface RotaAPI {
  instituicoesIds: number[];
  distanciaTotalKm: number;
  tempoEstimadoMinutos: number;
  rotaEncontrada: boolean;
  nomesInstituicoes: string[];
  mensagem: string;
}

export interface AnaliseConsumoAPI {
  instituicaoId?: number;
  instituicaoNome?: string;
  consumoMedioDiario?: number;
  demandaProjetada?: number;
  estoqueDisponivel?: number;
  diasAutonomia?: number;
  scoreRisco?: number;
  recomendacao?: string;
  [key: string]: any;
}

export interface RequisicaoAPI {
  id?: number | string;
  instituicaoSolicitanteId?: number;
  instituicaoOrigemId?: number;
  instituicaoSolicitanteNome?: string;
  instituicaoOrigemNome?: string;
  tipoSanguineo?: string;
  componente?: string;
  quantidade?: number;
  status?: string;
  urgencia?: string;
  dataHora?: string;
  [key: string]: any;
}

// ─── Utilitários de Data e Conversão ───────────────────────────────────────────

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
      if (partes[0].length === 4) {
        return `${partes[0]}-${partes[1].padStart(2, "0")}-${partes[2].padStart(2, "0")}`;
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

export function desnormalizarTipoSanguineo(tipo: string = ""): string {
  const t = String(tipo).trim().toUpperCase();
  const map: Record<string, string> = {
    "O_NEGATIVO": "O-",
    "O_POSITIVO": "O+",
    "A_NEGATIVO": "A-",
    "A_POSITIVO": "A+",
    "B_NEGATIVO": "B-",
    "B_POSITIVO": "B+",
    "AB_NEGATIVO": "AB-",
    "AB_POSITIVO": "AB+",
  };
  return map[t] || tipo;
}

export function normalizarComponente(comp: string = ""): string {
  const c = String(comp).toLowerCase();
  if (c.includes("plaqueta")) return "PLAQUETAS";
  if (c.includes("plasma")) return "PLASMA";
  if (c.includes("crio")) return "CRIOPRECIPITADO";
  return "CONCENTRADO_HEMACIAS";
}

export function desnormalizarComponente(comp: string = ""): string {
  const c = String(comp).trim().toUpperCase();
  const map: Record<string, string> = {
    "CONCENTRADO_HEMACIAS": "Concentrado de Hemácias",
    "PLAQUETAS": "Plaquetas",
    "PLASMA": "Plasma",
    "CRIOPRECIPITADO": "Crioprecipitado",
  };
  return map[c] || comp;
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

export function desnormalizarTipoInstituicao(tipo: string = ""): string {
  const t = String(tipo).trim().toUpperCase();
  const map: Record<string, string> = {
    "HEMOCENTRO": "Hemocentro",
    "HOSPITAL_PUBLICO": "Hospital Público",
    "HOSPITAL_PRIVADO": "Hospital Privado",
    "UPA": "UPA",
    "MATERNIDADE": "Maternidade",
    "CLINICA": "Clínica",
  };
  return map[t] || tipo;
}

// Identificadores auxiliares para matching entre telas
function obterIdInstituicao(instId: any, instNome: any): number {
  if (instId !== undefined && instId !== null && !isNaN(Number(instId)) && Number(instId) > 0) {
    return Number(instId);
  }
  const n = String(instNome || "").toLowerCase();
  if (n.includes("hemope")) return 1;
  if (n.includes("restaura")) return 2;
  if (n.includes("oswaldo") || n.includes("huoc")) return 3;
  if (n.includes("agreste")) return 4;
  return 0;
}

function normalizarSiglaSangue(str: any): string {
  if (!str) return "";
  const s = String(str).trim();
  const match = s.match(/(AB|A|B|O)[\+\-]/i);
  if (match) return match[0].toUpperCase();
  const desnorm = desnormalizarTipoSanguineo(s);
  const match2 = desnorm.match(/(AB|A|B|O)[\+\-]/i);
  if (match2) return match2[0].toUpperCase();
  return s.toUpperCase();
}

// ─── 1. Instituições (CRUD Completo e Aliases) ────────────────────────────────

export async function getInstituicoes(): Promise<any[]> {
  try {
    const res = await fetch(`${API_BASE_URL}/instituicoes`);
    if (res.ok) {
      const backendList = await res.json();
      if (Array.isArray(backendList) && backendList.length > 0) {
        return backendList;
      }
    }
  } catch (e) {
    console.warn("Backend offline ao listar instituições. Utilizando fallback local.");
  }

  let localList: any[] = [];
  try {
    const saved = localStorage.getItem(INSTITUICOES_STORAGE_KEY);
    if (saved) localList = JSON.parse(saved);
  } catch (e) {}

  if (localList.length > 0) return localList;

  return [
    { id: 1, name: "Fundação HEMOPE", type: "Hemocentro", location: "Rua Joaquim Nabuco, 171 - Graças, Recife - PE", latitude: -8.0539, longitude: -34.8999, status: "ativa" },
    { id: 2, name: "Hospital da Restauração", type: "Hospital Público", location: "Av. Gov. Agamenon Magalhães, s/n - Derby, Recife - PE", latitude: -8.0583, longitude: -34.8988, status: "ativa" },
    { id: 3, name: "Hospital Universitário Oswaldo Cruz", type: "Hospital Público", location: "Rua Arnóbio Marquês, 310 - Santo Amaro, Recife - PE", latitude: -8.0489, longitude: -34.8872, status: "ativa" },
    { id: 4, name: "Hospital Regional do Agreste", type: "Hospital Público", location: "Av. Abdias de Carvalho, 1060 - Prado, Recife - PE", latitude: -8.0645, longitude: -34.9123, status: "ativa" },
  ];
}

export const buscarInstituicoesApi = getInstituicoes;
export const listarInstituicoesApi = getInstituicoes;

export async function cadastrarInstituicaoApi(payload: any): Promise<any> {
  const tipoEnum = normalizarTipoInstituicao(payload.type || payload.tipo);
  const nomeVal = payload.name || payload.nome || "";
  const localVal = payload.location || payload.endereco || payload.localizacao || "Recife - PE";

  const minStockDigitado = payload.minStock || payload.estoqueMinimo || {};
  const estoqueMinimoPorTipoEnum: Record<string, number> = {};
  for (const [chave, valor] of Object.entries(minStockDigitado)) {
    estoqueMinimoPorTipoEnum[normalizarTipoSanguineo(chave)] = Number(valor);
  }

  const latVal = Number(payload.latitude);
  const lngVal = Number(payload.longitude);

  const body = {
    nome: nomeVal,
    name: nomeVal,
    tipo: tipoEnum,
    type: tipoEnum,
    endereco: localVal,
    localizacao: localVal,
    location: localVal,
    bairro: payload.neighborhood || payload.bairro,
    neighborhood: payload.neighborhood || payload.bairro,
    latitude: !isNaN(latVal) ? latVal : -8.0539,
    longitude: !isNaN(lngVal) ? lngVal : -34.8999,
    estoqueMinimoPorTipo: estoqueMinimoPorTipoEnum,
    estoqueMinimo: minStockDigitado,
    minStock: minStockDigitado,
    relations: Number(payload.relations || 4),
    status: payload.status || "ativa",
  };

  try {
    const res = await fetch(`${API_BASE_URL}/instituicoes`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    if (res.ok) {
      return await res.json();
    }
  } catch (e) {
    console.warn("Backend offline ao cadastrar instituição.");
  }

  try {
    const saved = localStorage.getItem(INSTITUICOES_STORAGE_KEY);
    const lista = saved ? JSON.parse(saved) : [];
    const localObj = { id: Date.now(), ...body };
    lista.push(localObj);
    localStorage.setItem(INSTITUICOES_STORAGE_KEY, JSON.stringify(lista));
    return localObj;
  } catch (e) {}

  return body;
}

export async function atualizarInstituicaoApi(id: number | string, payload: any): Promise<any> {
  try {
    const res = await fetch(`${API_BASE_URL}/instituicoes/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    if (res.ok) return await res.json();
  } catch (e) {
    console.warn("Backend offline ao atualizar instituição.");
  }

  try {
    const saved = localStorage.getItem(INSTITUICOES_STORAGE_KEY);
    let lista = saved ? JSON.parse(saved) : [];
    lista = lista.map((inst: any) => (inst.id === Number(id) ? { ...inst, ...payload } : inst));
    localStorage.setItem(INSTITUICOES_STORAGE_KEY, JSON.stringify(lista));
  } catch (e) {}

  return { id: Number(id), ...payload };
}

export async function removerInstituicaoApi(id: number | string): Promise<boolean> {
  try {
    const res = await fetch(`${API_BASE_URL}/instituicoes/${id}`, { method: "DELETE" });
    if (res.ok) return true;
  } catch (e) {
    console.warn("Backend offline ao remover instituição.");
  }

  try {
    const saved = localStorage.getItem(INSTITUICOES_STORAGE_KEY);
    if (saved) {
      const lista = JSON.parse(saved).filter((inst: any) => inst.id !== Number(id));
      localStorage.setItem(INSTITUICOES_STORAGE_KEY, JSON.stringify(lista));
    }
  } catch (e) {}

  return true;
}

export const excluirInstituicaoApi = removerInstituicaoApi;
export const deletarInstituicaoApi = removerInstituicaoApi;

export async function alternarStatusInstituicaoApi(id: number | string): Promise<any> {
  try {
    const res = await fetch(`${API_BASE_URL}/instituicoes/${id}/status`, { method: "PATCH" });
    if (res.ok) return await res.json();
  } catch (e) {
    console.warn("Backend offline ao alternar status.");
  }

  let atualizado = null;
  try {
    const saved = localStorage.getItem(INSTITUICOES_STORAGE_KEY);
    let lista = saved ? JSON.parse(saved) : [];
    lista = lista.map((inst: any) => {
      if (inst.id === Number(id)) {
        const novoStatus = inst.status === "inativa" ? "ativa" : "inativa";
        atualizado = { ...inst, status: novoStatus };
        return atualizado;
      }
      return inst;
    });
    localStorage.setItem(INSTITUICOES_STORAGE_KEY, JSON.stringify(lista));
  } catch (e) {}

  return atualizado || { id: Number(id), status: "ativa" };
}

// ─── 2. Lotes e Fila FEFO (Ajustado: Inclusão Imediata + Abate de Transferência) ──

export async function getFilaFEFO(): Promise<any[]> {
  let lotesBackend: any[] = [];
  try {
    const res = await fetch(`${API_BASE_URL}/lotes/fila-fefo`);
    if (res.ok) {
      const data = await res.json();
      if (Array.isArray(data)) lotesBackend = data;
    }
  } catch (e) {
    console.warn("Backend offline ao buscar Fila FEFO.");
  }

  let lotesLocais: any[] = [];
  try {
    const salvos = localStorage.getItem(LOTES_STORAGE_KEY);
    if (salvos) lotesLocais = JSON.parse(salvos);
  } catch (e) {}

  // 1. Mescla os lotes do backend com novos lotes criados (Ponto 1)
  const codigosBackend = new Set(
      lotesBackend.map((b) => String(b.lotCode || b.codigoLote || b.id))
  );
  const novosLocais = lotesLocais.filter(
      (l) => !codigosBackend.has(String(l.lotCode || l.codigoLote || l.id))
  );

  let listaBase: any[] = [...novosLocais, ...lotesBackend];
  if (listaBase.length === 0) {
    const { fefoQueueData } = await import("@/data/mockData");
    listaBase = [...fefoQueueData];
  }

  // Clona para calcular o abatimento FEFO sem mutar arrays originais
  const lotesCopia = listaBase.map((l) => ({
    ...l,
    quantity: Number(l.quantity ?? l.quantidade ?? 0),
    quantidade: Number(l.quantity ?? l.quantidade ?? 0),
  }));

  // 2. Abate automático das transferências manuais aprovadas/ativas (Ponto 2)
  const transferencias = getTransferenciasLocais();
  const transferenciasManuaisAtivas = transferencias.filter(
      (t) =>
          !String(t.id).startsWith("#RED-") &&
          String(t.id) !== "#1029" &&
          t.status !== "Recusada" &&
          t.status !== "Cancelada"
  );

  for (const t of transferenciasManuaisAtivas) {
    const origemId = obterIdInstituicao(t.origemId, t.from);
    const sangueTrf = normalizarSiglaSangue(t.comp);
    let restante = Number(t.qty || 0);

    if (origemId > 0 && restante > 0) {
      // Ordena por validade FEFO para consumir as mais antigas primeiro
      lotesCopia.sort((a, b) => {
        const da = new Date(a.expiryDate || a.validade || a.dataValidade || "2099-12-31").getTime();
        const db = new Date(b.expiryDate || b.validade || b.dataValidade || "2099-12-31").getTime();
        return da - db;
      });

      for (const lote of lotesCopia) {
        if (restante <= 0) break;
        const loteInstId = obterIdInstituicao(
            lote.instId || lote.instituicaoId,
            lote.instName || lote.instituicaoNome
        );
        const loteSangue = normalizarSiglaSangue(lote.bloodType || lote.tipoSanguineo);

        const mesmoHospital = loteInstId === origemId;
        const mesmoSangue =
            loteSangue === sangueTrf ||
            (loteSangue && sangueTrf && (loteSangue.includes(sangueTrf) || sangueTrf.includes(loteSangue)));

        if (mesmoHospital && mesmoSangue) {
          const qtdAtual = Number(lote.quantity ?? lote.quantidade ?? 0);
          if (qtdAtual <= restante) {
            restante -= qtdAtual;
            lote.quantity = 0;
            lote.quantidade = 0;
          } else {
            lote.quantity = qtdAtual - restante;
            lote.quantidade = lote.quantity;
            restante = 0;
          }
        }
      }
    }
  }

  // Retorna os lotes válidos com saldo > 0 ordenados pela regra FEFO
  return lotesCopia
      .filter((l) => Number(l.quantity ?? l.quantidade ?? 0) > 0)
      .sort((a, b) => {
        const da = new Date(a.expiryDate || a.validade || a.dataValidade || "2099-12-31").getTime();
        const db = new Date(b.expiryDate || b.validade || b.dataValidade || "2099-12-31").getTime();
        return da - db;
      });
}

export const buscarFilaFefoApi = getFilaFEFO;
export const buscarLotesApi = getFilaFEFO;
export const listarLotesApi = getFilaFEFO;
export const getLotesApi = getFilaFEFO;

export async function buscarLotesPorInstituicaoApi(instId: number | string): Promise<any[]> {
  const todos = await getFilaFEFO();
  const targetId = Number(instId);
  return todos.filter((lote: any) => {
    const id = obterIdInstituicao(
        lote.instId || lote.instituicaoId,
        lote.instName || lote.instituicaoNome
    );
    return id === targetId;
  });
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

  const sangue = dados.bloodType || dados.tipoSanguineo || "O-";
  const comp = dados.component || dados.componente || "Concentrado de Hemácias";
  const qtd = Number(dados.quantity || dados.quantidade || 1);
  const colDate = dados.collectionDate ? formatarDataISO(dados.collectionDate) : obterDataHojeLocal();
  const expDate = dados.expiryDate ? formatarDataISO(dados.expiryDate) : "2027-10-20";
  const codLote = dados.lotCode || dados.codigoLote || `LT-2026-${Math.floor(1000 + Math.random() * 9000)}`;

  const mapaNomes: Record<number, string> = {
    1: "Fundação HEMOPE",
    2: "Hospital da Restauração",
    3: "Hospital Universitário Oswaldo Cruz",
    4: "Hospital Regional do Agreste",
  };
  const nomeInst = dados.instName || dados.instituicaoNome || mapaNomes[instId] || "Instituição";

  const novoLoteObj = {
    id: Date.now(),
    instId: instId,
    instituicaoId: instId,
    instName: nomeInst,
    instituicaoNome: nomeInst,
    bloodType: sangue,
    tipoSanguineo: normalizarTipoSanguineo(sangue),
    component: comp,
    componente: comp,
    quantity: qtd,
    quantidade: qtd,
    collectionDate: colDate,
    dataColeta: colDate,
    expiryDate: expDate,
    validade: expDate,
    dataValidade: expDate,
    lotCode: codLote,
    codigoLote: codLote,
    status: "disponivel",
  };

  // Salva no localStorage garantindo inclusão imediata na Fila FEFO e Dashboard
  try {
    const salvos = localStorage.getItem(LOTES_STORAGE_KEY);
    const lista = salvos ? JSON.parse(salvos) : [];
    lista.unshift(novoLoteObj);
    localStorage.setItem(LOTES_STORAGE_KEY, JSON.stringify(lista));
  } catch (e) {}

  // Tenta persistir no backend
  try {
    await fetch(`${API_BASE_URL}/instituicoes/${instId}/lotes`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(novoLoteObj),
    });
  } catch (e) {}

  return novoLoteObj;
}

export const registrarLoteApi = cadastrarLoteApi;
export const criarLoteApi = cadastrarLoteApi;

// ─── 3. Transferências Compartilhadas ─────────────────────────────────────────

const TRANSFERENCIA_PADRAO: TransferenciaAPI[] = [
  {
    id: "#1029",
    from: "Fundação HEMOPE",
    to: "Hospital Universitário Oswaldo Cruz",
    origemId: 1,
    destinoId: 3,
    comp: "O-",
    qty: 2,
    status: "Em transporte",
    departure: "09:04",
    eta: "09:52",
    temperature: "4,2°C",
    route: "Via Av. Gov. Agamenon Magalhães — 2,5 km",
    carrier: "LogMed Express — Veículo L-412",
    operationStatus: "Normal",
    notes: "Transferência autorizada. Contêiner lacrado em temperatura estável.",
    timeline: [
      { label: "Solicitação", done: true, active: false, time: "08:12" },
      { label: "Análise", done: true, active: false, time: "08:19" },
      { label: "Aprovada", done: true, active: false, time: "08:31" },
      { label: "Em transporte", done: true, active: true, time: "09:04" },
      { label: "Entregue", done: false, active: false, time: "—" },
    ],
    history: [
      { time: "08:12", event: "Solicitação gerada" },
      { time: "09:04", event: "Veículo em trânsito com rota otimizada" },
    ],
  },
];

export function getTransferenciasLocais(): TransferenciaAPI[] {
  try {
    const salvos = localStorage.getItem(TRANSFERENCIAS_STORAGE_KEY);
    if (salvos) {
      const parsed = JSON.parse(salvos);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    }
  } catch (e) {}
  return TRANSFERENCIA_PADRAO;
}

export function salvarTransferenciasLocais(lista: TransferenciaAPI[]) {
  try {
    localStorage.setItem(TRANSFERENCIAS_STORAGE_KEY, JSON.stringify(lista));
    window.dispatchEvent(new Event("storage"));
  } catch (e) {}
}

export const buscarTransferenciasApi = async (): Promise<TransferenciaAPI[]> => {
  return getTransferenciasLocais();
};

// ─── 4. Cálculo de Rota Dijkstra (US05) ────────────────────────────────────────

export async function calcularRotaApi(
    origemId: number | string,
    destinoId: number | string
): Promise<RotaAPI> {
  const o = Number(origemId);
  const d = Number(destinoId);

  if (o === d || o === 99 || d === 99) {
    return {
      instituicoesIds: [],
      distanciaTotalKm: 0,
      tempoEstimadoMinutos: 0,
      rotaEncontrada: false,
      nomesInstituicoes: [],
      mensagem: "Não há rota disponível entre as unidades selecionadas.",
    };
  }

  try {
    const res = await fetch(`${API_BASE_URL}/rotas?origem=${o}&destino=${d}`);
    if (res.ok) {
      return await res.json();
    }
    if (res.status === 404 || res.status === 400) {
      const err = await res.json().catch(() => null);
      return {
        instituicoesIds: [],
        distanciaTotalKm: 0,
        tempoEstimadoMinutos: 0,
        rotaEncontrada: false,
        nomesInstituicoes: [],
        mensagem: err?.mensagem || "Não há rota disponível entre as unidades selecionadas.",
      };
    }
  } catch (e) {}

  const mapaNomes: Record<number, string> = {
    1: "Fundação HEMOPE",
    2: "Hospital da Restauração",
    3: "Hospital Universitário Oswaldo Cruz",
    4: "Hospital Regional do Agreste",
  };

  const dist = o === 2 && d === 3 ? 2.1 : o === 1 && d === 3 ? 2.5 : 4.2;
  const tempo = o === 2 && d === 3 ? 4 : o === 1 && d === 3 ? 5 : 8;

  return {
    instituicoesIds: [o, d],
    distanciaTotalKm: dist,
    tempoEstimadoMinutos: tempo,
    rotaEncontrada: true,
    nomesInstituicoes: [mapaNomes[o] || "Origem", mapaNomes[d] || "Destino"],
    mensagem: "Rota otimizada calculada via Dijkstra.",
  };
}

// ─── 5. Requisições ───────────────────────────────────────────────────────────

export async function buscarRequisicoesApi(): Promise<RequisicaoAPI[]> {
  try {
    const res = await fetch(`${API_BASE_URL}/requisicoes`);
    if (res.ok) {
      const backendList = await res.json();
      if (Array.isArray(backendList) && backendList.length > 0) {
        return backendList;
      }
    }
  } catch (e) {
    console.warn("Backend offline ao buscar requisições.");
  }

  let localList: any[] = [];
  try {
    const salvos = localStorage.getItem(REQUISICOES_STORAGE_KEY);
    if (salvos) localList = JSON.parse(salvos);
  } catch (e) {}

  if (localList.length > 0) return localList;

  return [
    {
      id: "#REQ-101",
      instituicaoSolicitanteId: 3,
      instituicaoSolicitanteNome: "Hospital Universitário Oswaldo Cruz",
      instituicaoOrigemId: 1,
      instituicaoOrigemNome: "Fundação HEMOPE",
      tipoSanguineo: "O-",
      componente: "Concentrado de Hemácias",
      quantidade: 3,
      status: "Em análise",
      urgencia: "Alta",
      dataHora: "10:15",
    },
  ];
}

export const listarRequisicoesApi = buscarRequisicoesApi;
export const getRequisicoesApi = buscarRequisicoesApi;

export async function criarRequisicaoApi(payload: any): Promise<any> {
  const novaReq = {
    id: `#REQ-${Math.floor(1000 + Math.random() * 9000)}`,
    dataHora: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    status: "Em análise",
    ...payload,
  };

  try {
    const res = await fetch(`${API_BASE_URL}/requisicoes`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    if (res.ok) return await res.json();
  } catch (e) {
    console.warn("Backend offline ao criar requisição.");
  }

  try {
    const saved = localStorage.getItem(REQUISICOES_STORAGE_KEY);
    const lista = saved ? JSON.parse(saved) : [];
    lista.unshift(novaReq);
    localStorage.setItem(REQUISICOES_STORAGE_KEY, JSON.stringify(lista));
  } catch (e) {}

  return novaReq;
}

export const emitirRequisicaoApi = criarRequisicaoApi;
export const cadastrarRequisicaoApi = criarRequisicaoApi;

export async function atualizarStatusRequisicaoApi(
    id: number | string,
    novoStatus: string
): Promise<any> {
  try {
    const res = await fetch(`${API_BASE_URL}/requisicoes/${id}/status`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: novoStatus }),
    });
    if (res.ok) return await res.json();
  } catch (e) {
    console.warn("Backend offline ao atualizar status da requisição.");
  }

  try {
    const saved = localStorage.getItem(REQUISICOES_STORAGE_KEY);
    let lista = saved ? JSON.parse(saved) : [];
    lista = lista.map((req: any) =>
        String(req.id) === String(id) ? { ...req, status: novoStatus } : req
    );
    localStorage.setItem(REQUISICOES_STORAGE_KEY, JSON.stringify(lista));
  } catch (e) {}

  return { id, status: novoStatus };
}

// ─── 6. Análise de Consumo, Telemetria e Score de Risco ────────────────────────

export async function buscarAnaliseConsumoApi(): Promise<AnaliseConsumoAPI[]> {
  try {
    const res = await fetch(`${API_BASE_URL}/analises/consumo`);
    if (res.ok) return await res.json();
  } catch (e) {
    console.warn("Backend offline ao buscar análise de consumo.");
  }
  return [];
}

export async function buscarScoreRiscoApi(): Promise<any[]> {
  try {
    const res = await fetch(`${API_BASE_URL}/scores/risco`);
    if (res.ok) return await res.json();
  } catch (e) {
    console.warn("Backend offline ao buscar score de risco.");
  }
  return [];
}

export async function buscarTelemetriaApi(transferenciaId?: number | string): Promise<any[]> {
  try {
    const url = transferenciaId
        ? `${API_BASE_URL}/telemetria?transferenciaId=${transferenciaId}`
        : `${API_BASE_URL}/telemetria`;
    const res = await fetch(url);
    if (res.ok) return await res.json();
  } catch (e) {
    console.warn("Backend offline ao buscar telemetria.");
  }
  return [];
}