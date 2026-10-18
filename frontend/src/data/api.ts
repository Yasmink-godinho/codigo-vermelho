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

// Formato compatível com TransferenciaResponse do backend
export interface TransferenciaAPI {
  id: number | string;
  codigo?: string;
  instituicaoOrigem?: string;
  instituicaoDestino?: string;
  tipoSanguineo?: string;
  componente?: string;
  quantidade?: number;
  rota?: string;
  distanciaKm?: number;
  previsaoChegada?: string;
  statusTransferencia?: string;
  from?: string;
  to?: string;
  comp?: string;
  qty?: number;
  status?: string;
  temperature?: string;
}

export interface RotaAPI {
  instituicoesIds: number[];
  distanciaTotalKm: number;
  tempoEstimadoMinutos: number;
  rotaEncontrada: boolean;
  nomesInstituicoes: string[];
  mensagem: string;
}

export interface AlertaTermicoAPI {
  id: number;
  transferenciaId: number;
  codigoTransferencia: string;
  leituraId: number;
  temperatura: number;
  nivel: string;
  mensagem: string;
  dataHora: string;
}

export interface LeituraTelemetriaAPI {
  id: number;
  transferenciaId: number;
  temperatura: number;
  dataHora: string;
  foraDaFaixa: boolean;
  alerta: AlertaTermicoAPI | null;
}

export interface AnaliseConsumoApiData {
  modo: string;
  threads: number;
  registros: number;
  somaConsumo: number;
  media: number;
  variancia: number;
  desvioPadrao: number;
  coeficienteVariacao: number;
  mediana: number;
  percentil95: number;
  tempoProcessamentoNanos: number;
}

// ─── Conversores de Enums e Datas ───────────────────────────────

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

export function normalizarNivelUrgencia(urg: string = ""): string {
  const u = String(urg).toLowerCase();
  if (u.includes("emerg")) return "EMERGENCIA";
  if (u.includes("prior")) return "PRIORITARIA";
  return "ROTINA";
}

export function desnormalizarTipoSanguineo(tipo: string = ""): string {
  if (!tipo) return "O-";
  return tipo.replace("_NEGATIVO", "-").replace("_POSITIVO", "+");
}

export function desnormalizarComponente(comp: string = ""): string {
  const map: Record<string, string> = {
    CONCENTRADO_HEMACIAS: "Concentrado de Hemácias",
    PLASMA: "Plasma",
    PLAQUETAS: "Plaquetas",
    CRIOPRECIPITADO: "Crioprecipitado",
  };
  return map[comp] || comp || "Concentrado de Hemácias";
}

export function desnormalizarNivelUrgencia(urg: string = ""): "rotina" | "prioritaria" | "emergencia" {
  const u = String(urg).toUpperCase();
  if (u === "EMERGENCIA") return "emergencia";
  if (u === "PRIORITARIA") return "prioritaria";
  return "rotina";
}

export function desnormalizarStatusRequisicao(st: string = ""): "pendente" | "em_analise" | "aprovada" | "negada" {
  const s = String(st).toUpperCase();
  if (s === "APROVADA") return "aprovada";
  if (s === "RECUSADA" || s === "NEGADA") return "negada";
  if (s === "EM_ANALISE") return "em_analise";
  return "pendente";
}

// ─── 1. Instituições ────────────────────────────────

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

  const minStockDigitado = payload.minStock || payload.estoqueMinimo || {};
  const estoqueMinimoPorTipoEnum: Record<string, number> = {};
  for (const [chave, valor] of Object.entries(minStockDigitado)) {
    estoqueMinimoPorTipoEnum[normalizarTipoSanguineo(chave)] = Number(valor);
  }

  const latVal = Number(payload.latitude);
  const lngVal = Number(payload.longitude);
  const relVal = Number(payload.relations);

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
    relations: !isNaN(relVal) ? relVal : 4,
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

  const minStockDigitado = payload.minStock || {};
  const estoqueMinimoPorTipoEnum: Record<string, number> = {};
  for (const [chave, valor] of Object.entries(minStockDigitado)) {
    estoqueMinimoPorTipoEnum[normalizarTipoSanguineo(chave)] = Number(valor);
  }

  const latVal = payload.latitude !== undefined ? Number(payload.latitude) : undefined;
  const lngVal = payload.longitude !== undefined ? Number(payload.longitude) : undefined;

  const body = {
    nome: nomeVal,
    name: nomeVal,
    tipo: tipoEnum,
    type: tipoEnum,
    endereco: localVal,
    location: localVal,
    bairro: payload.neighborhood || payload.bairro,
    neighborhood: payload.neighborhood || payload.bairro,
    latitude: latVal,
    longitude: lngVal,
    estoqueMinimoPorTipo: estoqueMinimoPorTipoEnum,
    minStock: minStockDigitado,
    relations: Number(payload.relations !== undefined ? payload.relations : 4),
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

// ─── 2. Lotes e Fila FEFO ───────────────────────────

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
  const qtd = Number(dados.quantity || dados.quantidade || dados.quantidadeUnidades || dados.volume || 1);

  let dataColetaFinal = dados.collectionDate ? formatarDataISO(dados.collectionDate) : obterDataHojeLocal();
  const hoje = obterDataHojeLocal();
  if (dataColetaFinal > hoje) {
    dataColetaFinal = hoje;
  }

  let validadeFinal = dados.expiryDate ? formatarDataISO(dados.expiryDate) : "";
  if (!validadeFinal || validadeFinal <= hoje) {
    const dVal = new Date();
    dVal.setDate(dVal.getDate() + 35);
    const ano = dVal.getFullYear();
    const mes = String(dVal.getMonth() + 1).padStart(2, "0");
    const dia = String(dVal.getDate()).padStart(2, "0");
    validadeFinal = `${ano}-${mes}-${dia}`;
  }

  const codLote = dados.lotCode || dados.codigoLote || `LT-2026-${Math.floor(1000 + Math.random() * 9000)}`;

  const body = {
    codigoLote: codLote,
    lotCode: codLote,
    tipoSanguineo: sangueEnum,
    bloodType: dados.bloodType || "O-",
    componente: compEnum,
    tipoComponente: compEnum,
    quantidade: qtd,
    quantity: qtd,
    dataColeta: dataColetaFinal,
    collectionDate: dataColetaFinal,
    validade: validadeFinal,
    dataValidade: validadeFinal,
    expiryDate: validadeFinal,
  };

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
  if (!res.ok) throw new Error(`Falha ao excluir lote: ${res.statusText}`);
}

// ─── 3. Requisições ──────────────────────

export async function buscarRequisicoesApi(
    status?: string,
    urgency?: string
): Promise<any[]> {
  let url = `${API_BASE_URL}/requisicoes`;
  const params = new URLSearchParams();
  if (status && status !== "todas") {
    params.append("status", status === "negada" ? "RECUSADA" : status.toUpperCase());
  }
  if (urgency && urgency !== "todas") {
    params.append("urgencia", normalizarNivelUrgencia(urgency));
  }
  if (params.toString()) {
    url += `?${params.toString()}`;
  }

  const res = await fetch(url);
  if (!res.ok) throw new Error(`Erro ao buscar requisições: ${res.statusText}`);
  const dados = await res.json();

  return dados.map((item: any) => ({
    id: item.id,
    reqCode: item.codigoRequisicao || item.reqCode || `REQ-${item.id}`,
    instId: item.instituicaoId || item.instId || 1,
    instName: item.instituicaoNome || item.instName || "Unidade Solicitante",
    bloodType: desnormalizarTipoSanguineo(item.tipoSanguineo || item.bloodType),
    component: desnormalizarComponente(item.componente || item.component),
    quantity: Number(item.volume !== undefined ? item.volume : item.quantity !== undefined ? item.quantity : 1),
    urgency: desnormalizarNivelUrgencia(item.nivelUrgencia || item.urgency),
    status: desnormalizarStatusRequisicao(item.status || item.statusRequisicao),
    observations: item.observacoes || item.observations || "",
    createdAt: item.dataCriacao ? new Date(item.dataCriacao).getTime() : Date.now(),
  }));
}

export const listarRequisicoesApi = buscarRequisicoesApi;
export const getRequisicoesApi = buscarRequisicoesApi;

export async function cadastrarRequisicaoApi(payload: any): Promise<any> {
  const sangueEnum = normalizarTipoSanguineo(payload.bloodType || payload.tipoSanguineo);
  const compEnum = normalizarComponente(payload.component || payload.componente);
  const instId = Number(payload.instId || payload.instituicaoId || 1);
  const volume = Number(payload.quantity || payload.volume || payload.quantidade || 1);
  const urgEnum = normalizarNivelUrgencia(payload.urgency || payload.nivelUrgencia);

  const body = {
    instituicaoId: instId,
    tipoSanguineo: sangueEnum,
    componente: compEnum,
    volume: volume,
    quantidade: volume,
    nivelUrgencia: urgEnum,
    observacoes: payload.observations || payload.observacoes || "",
  };

  const res = await fetch(`${API_BASE_URL}/requisicoes`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const err = await res.text();
    console.error("Erro da API ao emitir requisição:", res.status, err);
    throw new Error(`Falha ao emitir requisição: ${res.statusText}`);
  }

  const saved = await res.json();
  return {
    id: saved.id,
    reqCode: saved.codigoRequisicao || saved.reqCode || `REQ-${saved.id}`,
    instId: saved.instituicaoId || saved.instId || instId,
    instName: saved.instituicaoNome || saved.instName || payload.instName || "Unidade Solicitante",
    bloodType: desnormalizarTipoSanguineo(saved.tipoSanguineo || saved.bloodType || payload.bloodType),
    component: desnormalizarComponente(saved.componente || saved.component || payload.component),
    quantity: Number(saved.volume !== undefined ? saved.volume : saved.quantity !== undefined ? saved.quantity : volume),
    urgency: desnormalizarNivelUrgencia(saved.nivelUrgencia || saved.urgency || payload.urgency),
    status: desnormalizarStatusRequisicao(saved.status || "PENDENTE"),
    observations: saved.observacoes || saved.observations || payload.observations || "",
    createdAt: saved.dataCriacao ? new Date(saved.dataCriacao).getTime() : Date.now(),
  };
}

export const emitirRequisicaoApi = cadastrarRequisicaoApi;
export const criarRequisicaoApi = cadastrarRequisicaoApi;

export async function atualizarStatusRequisicaoApi(id: number | string, status: "APROVADA" | "RECUSADA"): Promise<void> {
  const res = await fetch(`${API_BASE_URL}/requisicoes/${id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ status }),
  });
  if (!res.ok) {
    throw new Error(`Falha ao atualizar status da requisição: ${res.statusText}`);
  }
}

// ─── 4. Transferências ───────────────────────────────────────────

export async function buscarTransferenciasApi(): Promise<TransferenciaAPI[]> {
  const res = await fetch(`${API_BASE_URL}/transferencias`);
  if (!res.ok) return [];
  return res.json();
}

export const listarTransferenciasApi = buscarTransferenciasApi;
export const buscarRedistribuicoesApi = buscarTransferenciasApi;

// ─── 5. Rotas ──────────────────────────────────────────────────────────

export async function calcularRotaApi(
    origemId: number | string,
    destinoId: number | string
): Promise<RotaAPI> {
  const res = await fetch(
      `${API_BASE_URL}/rotas?origem=${origemId}&destino=${destinoId}`
  );

  if (!res.ok) {
    const err = await res.json().catch(() => null);
    throw new Error(err?.mensagem || `Erro ao calcular rota: ${res.statusText}`);
  }

  return res.json();
}

// ─── 6. Telemetria e alertas térmicos ──────────────────────────────────

export async function registrarLeituraApi(
    transferenciaId: number | string,
    temperatura: number
): Promise<LeituraTelemetriaAPI> {
  const res = await fetch(
      `${API_BASE_URL}/transferencias/${transferenciaId}/telemetria`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ temperatura }),
      }
  );

  if (!res.ok) {
    const err = await res.json().catch(() => null);
    throw new Error(err?.mensagem || `Erro ao registrar leitura: ${res.statusText}`);
  }

  return res.json();
}

export async function buscarHistoricoTelemetriaApi(
    transferenciaId: number | string
): Promise<LeituraTelemetriaAPI[]> {
  const res = await fetch(
      `${API_BASE_URL}/transferencias/${transferenciaId}/telemetria`
  );

  if (!res.ok) {
    throw new Error(
        `Erro ao buscar histórico de temperatura: ${res.statusText}`
    );
  }

  return res.json();
}

export async function buscarAlertasTransferenciaApi(
    transferenciaId: number | string
): Promise<AlertaTermicoAPI[]> {
  const res = await fetch(
      `${API_BASE_URL}/transferencias/${transferenciaId}/alertas`
  );

  if (!res.ok) {
    throw new Error(`Erro ao buscar alertas da transferência: ${res.statusText}`);
  }

  return res.json();
}

export async function buscarAlertasTermicosApi(): Promise<AlertaTermicoAPI[]> {
  const res = await fetch(`${API_BASE_URL}/alertas-termicos`);

  if (!res.ok) {
    throw new Error(`Erro ao buscar alertas térmicos: ${res.statusText}`);
  }

  return res.json();
}

export async function simularTelemetriaApi(
    transferenciaId: number | string,
    quantidade = 5,
    comDesvio = false
): Promise<LeituraTelemetriaAPI[]> {
  const res = await fetch(
      `${API_BASE_URL}/transferencias/${transferenciaId}/telemetria/simulacao?quantidade=${quantidade}&comDesvio=${comDesvio}`,
      { method: "POST" }
  );

  if (!res.ok) {
    const err = await res.json().catch(() => null);
    throw new Error(err?.mensagem || `Erro ao simular telemetria: ${res.statusText}`);
  }

  return res.json();
}

// ─── 7. Análise Descritiva de Consumo ────────────────────

export async function buscarAnaliseConsumoApi(
    registros: number = 100000,
    modo: "sequencial" | "threads" = "threads",
    threads: number = 4
): Promise<AnaliseConsumoApiData> {
  const url = `${API_BASE_URL}/analises/consumo?registros=${registros}&modo=${modo}&threads=${threads}`;
  const res = await fetch(url);
  if (!res.ok) {
    throw new Error(`Erro ao buscar análise de consumo: ${res.status}`);
  }
  return res.json();
}