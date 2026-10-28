import { useState, useEffect } from "react";
import { Routes, Route, Navigate, Outlet, useLocation, useNavigate, useParams } from "react-router-dom";
import Header from "@/components/Header";
import Sidebar, { type NavItem } from "@/components/Sidebar";
import {
  IconArrows, IconBarChart2, IconBell, IconBuilding, IconClipboard, IconGrid,
  IconLayoutPanels, IconList, IconTruck, IconWifi,
} from "@/components/icons";
import { DEMO_LOTES, DEMO_REQUISICOES, institutionsData, neighborhoods } from "@/data/mockData";
import {
  buscarInstituicoesApi,
  cadastrarInstituicaoApi,
  buscarLotesApi,
  registrarLoteApi,
  buscarRequisicoesApi,
  emitirRequisicaoApi,
  obterDataHojeLocal,
} from "@/data/api";
import type { AppUser, Institution, Lote, Requisicao, Screen } from "@/types";

import AlertasScreen from "@/pages/CentralAlertas";
import AnaliseConsumoScreen from "@/pages/AnaliseConsumo";
import CadastrarInstituicaoScreen from "@/pages/NovaInstituicao";
import DashboardScreen from "@/pages/Dashboard";
import EstoqueInstituicaoScreen from "@/pages/EstoqueInstituicao";
import FefoScreen from "@/pages/FilaFefo";
import InstituicoesScreen from "@/pages/Instituicoes";
import LoginScreen from "@/pages/Login";
import MonitoramentoRedeScreen from "@/pages/MonitoramentoRede";
import NovaRequisicaoScreen from "@/pages/NovaRequisicao";
import PaineisEstoqueDemandaScreen from "@/pages/PaineisEstoqueDemanda";
import RedistribuicoesScreen from "@/pages/Redistribuicoes";
import RegistrarLoteScreen from "@/pages/RegistrarLote";
import RequisicoesScreen from "@/pages/Requisicoes";
import TransferenciasScreen from "@/pages/Transferencias";

function extrairBairro(location?: string, idNum?: number): string {
  if (!location) {
    if (idNum === 1) return "Derby";
    if (idNum === 2) return "Graças";
    return "Ilha do Leite";
  }
  for (const b of neighborhoods) {
    if (location.toLowerCase().includes(b.toLowerCase())) {
      return b;
    }
  }
  if (idNum === 1) return "Derby";
  if (idNum === 2) return "Graças";
  return "Ilha do Leite";
}

function MainLayout({
                      currentUser,
                      onLogout,
                    }: {
  currentUser: AppUser;
  onLogout: () => void;
}) {
  const location = useLocation();

  const getScreenFromPath = (path: string): Screen => {
    if (path.includes("/alertas")) return "alertas";
    if (path.includes("/fefo")) return "fefo";
    if (path.includes("/nova-requisicao")) return "nova_requisicao";
    if (path.includes("/requisicoes")) return "requisicoes";
    if (path.includes("/redistribuicoes")) return "redistribuicoes";
    if (path.includes("/analise")) return "analise";
    if (path.includes("/transferencias")) return "transferencias";
    if (path.includes("/rede")) return "rede";
    if (path.includes("/nova-instituicao") || path.includes("/instituicoes/nova")) return "cadastrar_instituicao";
    if (path.includes("/instituicoes")) return "instituicoes";
    if (path.includes("/registrar-lote")) return "registrar_lote";
    if (path.includes("/estoque")) return "estoque_instituicao";
    return "dashboard";
  };

  const currentScreen = getScreenFromPath(location.pathname);

  const screenSubtitle: Record<Screen, string> = {
    dashboard: "Visão Geral",
    paineis: "Inteligência de Dados",
    alertas: "Monitoramento",
    fefo: "Controle de Estoque",
    requisicoes: "Operações",
    nova_requisicao: "Operações",
    redistribuicoes: "Recomendações",
    analise: "Inteligência de Dados",
    transferencias: "Logística",
    rede: "Infraestrutura",
    instituicoes: "Gestão da Rede",
    cadastrar_instituicao: "Gestão da Rede",
    registrar_lote: "Gestão da Rede",
    estoque_instituicao: "Gestão da Rede",
  };

  const screenTitle: Record<Screen, string> = {
    dashboard: "Dashboard",
    paineis: "Painéis de Estoque e Demanda",
    alertas: "Central de Alertas",
    fefo: "Fila de Prioridade — FEFO",
    requisicoes: "Requisições",
    nova_requisicao: "Nova Requisição",
    redistribuicoes: "Redistribuições",
    analise: "Análise de Consumo",
    transferencias: "Transferências",
    rede: "Monitoramento de Rede",
    instituicoes: "Instituições",
    cadastrar_instituicao: "Nova Instituição",
    registrar_lote: "Registrar Lote",
    estoque_instituicao: "Estoque da Instituição",
  };

  const ALL_NAV_ITEMS: NavItem[] = [
    { id: "dashboard", label: "Dashboard", icon: <IconGrid /> },
    { id: "paineis", label: "Painéis", icon: <IconLayoutPanels /> },
    { id: "alertas", label: "Alertas", icon: <IconBell /> },
    { id: "fefo", label: "Fila FEFO", icon: <IconList /> },
    { id: "requisicoes", label: "Requisições", icon: <IconClipboard /> },
    { id: "redistribuicoes", label: "Redistribuições", icon: <IconArrows /> },
    { id: "analise", label: "Análise", icon: <IconBarChart2 />, adminRedeDot: true },
    { id: "transferencias", label: "Transferências", icon: <IconTruck /> },
    { id: "rede", label: "Rede", icon: <IconWifi />, adminOnly: true },
    { id: "instituicoes", label: "Instituições", icon: <IconBuilding /> },
  ];

  const navItems = ALL_NAV_ITEMS.filter((item) => !item.adminOnly || currentUser.role !== "operador");
  const REQ_SUB = ["nova_requisicao"] as Screen[];
  const INST_SUB = ["cadastrar_instituicao", "registrar_lote", "estoque_instituicao"] as Screen[];

  return (
      <div className="flex h-full bg-[#F8F9FC] text-slate-800" style={{ fontFamily: "'DM Sans', sans-serif" }}>
        <Sidebar
            navItems={navItems}
            screen={currentScreen}
            setScreen={() => {}}
            currentUser={currentUser}
            onLogout={onLogout}
            reqSub={REQ_SUB}
            instSub={INST_SUB}
        />

        <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
          <Header
              subtitle={screenSubtitle[currentScreen]}
              title={screenTitle[currentScreen]}
              currentUser={currentUser}
          />
          <main className="flex-1 overflow-y-auto">
            <Outlet />
          </main>
        </div>
      </div>
  );
}

function EstoqueRouteWrapper({
                               institutions,
                               lotes,
                               newLoteId,
                             }: {
  institutions: Institution[];
  lotes: Lote[];
  newLoteId: number | null;
}) {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const instIdNum = Number(id) || 1;

  return (
      <EstoqueInstituicaoScreen
          institutions={institutions}
          instId={instIdNum}
          lotes={lotes}
          newLoteId={newLoteId}
          onBack={() => navigate("/instituicoes")}
          onRegistrarLote={() => navigate("/registrar-lote")}
      />
  );
}

export default function App() {
  const navigate = useNavigate();

  const [currentUser, setCurrentUser] = useState<AppUser | null>(() => {
    const saved = localStorage.getItem("@codigo_vermelho:user");
    return saved ? JSON.parse(saved) : null;
  });

  const [alertFilter, setAlertFilter] = useState<"todos" | "critico" | "atencao" | "normal">("todos");
  const [institutions, setInstitutions] = useState<Institution[]>(institutionsData);
  const [newInstId, setNewInstId] = useState<number | null>(null);
  const [lotes, setLotes] = useState<Lote[]>(DEMO_LOTES);
  const [newLoteId, setNewLoteId] = useState<number | null>(null);
  const [requisicoes, setRequisicoes] = useState<Requisicao[]>(DEMO_REQUISICOES);
  const [newReqId, setNewReqId] = useState<number | null>(null);

  const obterRelacoesIniciais = (id: number): number => {
    if (id === 1) return 7;
    if (id === 2) return 14;
    if (id === 3) return 5;
    if (id === 4) return 4;
    return 5;
  };

  const carregarDadosDoBackend = () => {
    buscarInstituicoesApi()
        .then((dados: any) => {
          if (dados && dados.length > 0) {
            setInstitutions((prevExistentes) => {
              return dados.map((d: any) => {
                const idNum = Number(d.id);
                const anterior = prevExistentes.find((p) => Number(p.id) === idNum);
                const bairroReal =
                    d.neighborhood ||
                    d.bairro ||
                    anterior?.neighborhood ||
                    extrairBairro(d.location || d.endereco, idNum);

                const latVal =
                    d.latitude !== undefined && d.latitude !== null && d.latitude !== 0
                        ? Number(d.latitude)
                        : anterior?.latitude !== undefined
                            ? anterior.latitude
                            : -8.0539;

                const lngVal =
                    d.longitude !== undefined && d.longitude !== null && d.longitude !== 0
                        ? Number(d.longitude)
                        : anterior?.longitude !== undefined
                            ? anterior.longitude
                            : -34.8999;

                const relVal =
                    d.relations !== undefined && d.relations !== null
                        ? Number(d.relations)
                        : anterior?.relations !== undefined
                            ? anterior.relations
                            : obterRelacoesIniciais(idNum);

                const minStockFinal =
                    d.minStock && Object.keys(d.minStock).length > 0
                        ? d.minStock
                        : anterior?.minStock && Object.keys(anterior.minStock).length > 0
                            ? anterior.minStock
                            : { "O-": 20, "O+": 30 };

                // Tipos sanguíneos de fallback mantidos
                const componentesTipos =
                    anterior?.components && anterior.components[0]?.includes("-")
                        ? anterior.components
                        : ["O-", "O+", "A-", "A+", "B-", "B+", "AB-", "AB+"];

                return {
                  id: idNum,
                  name: d.name || d.nome,
                  type: d.type || d.tipo || "Hospital Público",
                  location: d.location || d.endereco || d.localizacao || `${bairroReal}, Recife, PE`,
                  neighborhood: bairroReal,
                  status: d.status || anterior?.status || "ativa",
                  components: componentesTipos,
                  relations: relVal,
                  latitude: latVal,
                  longitude: lngVal,
                  minStock: minStockFinal,
                  hasHistory: true,
                };
              });
            });
          }
        })
        .catch((err) => console.warn("Backend offline para instituições:", err));

    buscarLotesApi()
        .then((dados: any) => {
          if (dados && dados.length > 0) {
            setLotes((prevExistentes) => {
              const daApi = dados.map((l: any) => {
                const instIdNum = Number(l.instId || l.instituicaoId);
                const instEncontrada = institutions.find((i) => Number(i.id) === instIdNum);
                const nomeInst = l.instName || instEncontrada?.name || "Unidade de Saúde";
                const loteAnterior = prevExistentes.find((p) => Number(p.id) === Number(l.id));

                const dataValidadeFinal =
                    l.expiryDate ||
                    l.dataValidade ||
                    loteAnterior?.expiryDate ||
                    "2026-11-20";

                return {
                  id: l.id,
                  instId: instIdNum,
                  instName: nomeInst,
                  bloodType:
                      l.bloodType ||
                      (l.tipoSanguineo ? l.tipoSanguineo.replace("_NEGATIVO", "-").replace("_POSITIVO", "+") : "O-"),
                  component:
                      l.component ||
                      (l.tipoComponente === "CONCENTRADO_HEMACIAS"
                          ? "Concentrado de Hemácias"
                          : l.tipoComponente === "PLAQUETAS"
                              ? "Plaquetas"
                              : "Plasma"),
                  collectionDate: l.collectionDate || l.dataColeta || obterDataHojeLocal(),
                  expiryDate: dataValidadeFinal,
                  quantity: Number(l.quantity || l.quantidade || l.quantidadeUnidades || 1),
                  lotCode: l.lotCode || `LT-${String(l.id).padStart(4, "0")}`,
                  status: l.status || "normal",
                };
              });

              // Preserva lotes criados localmente que ainda não constem no backend
              const locais = prevExistentes.filter((p) => !daApi.some((a: any) => Number(a.id) === Number(p.id)));
              return [...locais, ...daApi];
            });
          }
        })
        .catch((err) => console.warn("Backend offline para lotes:", err));

    buscarRequisicoesApi()
        .then((dados: any) => {
          if (dados && dados.length > 0) setRequisicoes(dados);
        })
        .catch((err) => console.warn("Backend offline para requisições:", err));
  };

  useEffect(() => {
    carregarDadosDoBackend();
  }, []);

  const handleLogin = (u: AppUser) => {
    setCurrentUser(u);
    localStorage.setItem("@codigo_vermelho:user", JSON.stringify(u));
  };

  const handleLogout = () => {
    setCurrentUser(null);
    localStorage.removeItem("@codigo_vermelho:user");
  };

  const handleSalvarInstituicao = async (inst: any) => {
    try {
      const latDigitada = Number(inst.lat !== undefined ? inst.lat : inst.latitude);
      const lngDigitada = Number(inst.lng !== undefined ? inst.lng : inst.longitude);
      const relDigitada = Number(inst.relations !== undefined ? inst.relations : 5);

      const saved = await cadastrarInstituicaoApi({
        nome: inst.name,
        name: inst.name,
        tipo: inst.type,
        type: inst.type,
        endereco: inst.location,
        location: inst.location,
        neighborhood: inst.neighborhood,
        bairro: inst.neighborhood,
        latitude: latDigitada,
        longitude: lngDigitada,
        relations: relDigitada,
        minStock: inst.minStock,
        estoqueMinimoPorTipo: inst.minStock,
      });

      const novaInstCompleta: Institution = {
        id: saved?.id || Date.now(),
        name: inst.name,
        type: inst.type,
        location: inst.location,
        neighborhood: inst.neighborhood,
        latitude: latDigitada,
        longitude: lngDigitada,
        relations: relDigitada,
        status: inst.status || "ativa",
        // Tipos sanguíneos atribuídos para a legenda da listagem
        components: ["O-", "O+", "A-", "A+", "B-", "B+", "AB-", "AB+"],
        minStock: inst.minStock,
        hasHistory: false,
      };

      setInstitutions((prev) => [novaInstCompleta, ...prev.filter((i) => i.id !== novaInstCompleta.id)]);
      setNewInstId(novaInstCompleta.id);
      carregarDadosDoBackend();
    } catch (e) {
      const id = Date.now();
      setInstitutions((prev) => [
        {
          ...inst,
          id,
          components: ["O-", "O+", "A-", "A+", "B-", "B+", "AB-", "AB+"],
          hasHistory: false
        },
        ...prev
      ]);
      setNewInstId(id);
    }
    navigate("/instituicoes");
  };

  return (
      <Routes>
        <Route
            path="/login"
            element={
              currentUser ? (
                  <Navigate to="/dashboard" replace />
              ) : (
                  <LoginScreen onLogin={handleLogin} />
              )
            }
        />

        {currentUser ? (
            <Route element={<MainLayout currentUser={currentUser} onLogout={handleLogout} />}>
              <Route path="/" element={<Navigate to="/dashboard" replace />} />
              <Route path="/dashboard" element={<DashboardScreen />} />
              <Route path="/paineis" element={<PaineisEstoqueDemandaScreen />} />
              <Route path="/alertas" element={<AlertasScreen filter={alertFilter} setFilter={setAlertFilter} />} />
              <Route path="/fefo" element={<FefoScreen />} />

              <Route
                  path="/requisicoes"
                  element={
                    <RequisicoesScreen
                        requisicoes={requisicoes}
                        newReqId={newReqId}
                        onNova={() => navigate("/nova-requisicao")}
                    />
                  }
              />

              <Route
                  path="/nova-requisicao"
                  element={
                    <NovaRequisicaoScreen
                        institutions={institutions}
                        requisicoes={requisicoes}
                        prefillInstId={currentUser.role === "operador" ? (institutions[0]?.id ?? 1) : null}
                        onCancel={() => navigate("/requisicoes")}
                        onSave={async (req) => {
                          try {
                            const saved = await emitirRequisicaoApi({
                              instituicaoId: req.instId,
                              tipoSanguineo: req.bloodType,
                              componente: req.component,
                              volume: req.quantity,
                              nivelUrgencia: req.urgency,
                              observacoes: req.observations,
                            });
                            setRequisicoes((prev) => [saved, ...prev]);
                            setNewReqId(saved.id);
                          } catch (e) {
                            const id = Date.now();
                            const savedLocal: Requisicao = {
                              ...req,
                              id,
                              reqCode: `REQ-${new Date().getFullYear()}-${String(Date.now()).slice(-4)}`,
                              status: "pendente",
                              createdAt: Date.now(),
                            };
                            setRequisicoes((prev) => [savedLocal, ...prev]);
                            setNewReqId(id);
                          }
                          navigate("/requisicoes");
                        }}
                    />
                  }
              />

              <Route path="/redistribuicoes" element={<RedistribuicoesScreen />} />
              <Route path="/analise" element={<AnaliseConsumoScreen />} />
              <Route path="/transferencias" element={<TransferenciasScreen />} />
              <Route path="/rede" element={<MonitoramentoRedeScreen />} />

              <Route
                  path="/instituicoes"
                  element={
                    <InstituicoesScreen
                        role={currentUser.role}
                        institutions={institutions}
                        setInstitutions={setInstitutions}
                        newInstId={newInstId}
                    />
                  }
              />

              <Route
                  path="/nova-instituicao"
                  element={
                    <CadastrarInstituicaoScreen
                        onCancel={() => navigate("/instituicoes")}
                        onSave={handleSalvarInstituicao}
                    />
                  }
              />
              <Route
                  path="/instituicoes/nova"
                  element={
                    <CadastrarInstituicaoScreen
                        onCancel={() => navigate("/instituicoes")}
                        onSave={handleSalvarInstituicao}
                    />
                  }
              />

              <Route
                  path="/registrar-lote"
                  element={
                    <RegistrarLoteScreen
                        institutions={institutions}
                        prefillInstId={null}
                        lotes={lotes}
                        onCancel={() => navigate("/instituicoes")}
                        onSave={async (lote) => {
                          let loteIdFinal = Date.now();
                          let loteCodeFinal = lote.lotCode;
                          let dataValidadeFinal = lote.expiryDate || "2026-11-20";

                          try {
                            const resSalvo = await registrarLoteApi(lote.instId, {
                              bloodType: lote.bloodType,
                              component: lote.component,
                              quantity: Number(lote.quantity),
                              collectionDate: lote.collectionDate,
                              expiryDate: lote.expiryDate,
                            });

                            if (resSalvo?.id) loteIdFinal = resSalvo.id;
                            if (resSalvo?.lotCode) loteCodeFinal = resSalvo.lotCode;
                            if (resSalvo?.expiryDate || resSalvo?.dataValidade) {
                              dataValidadeFinal = resSalvo.expiryDate || resSalvo.dataValidade;
                            }
                          } catch (e) {
                            console.warn("Lote registrado localmente:", e);
                          }

                          const instObj = institutions.find((i) => Number(i.id) === Number(lote.instId));
                          const novoLote: Lote = {
                            id: loteIdFinal,
                            instId: Number(lote.instId),
                            instName: instObj?.name || lote.instName || "Unidade de Saúde",
                            bloodType: lote.bloodType,
                            component: lote.component,
                            collectionDate: lote.collectionDate || obterDataHojeLocal(),
                            expiryDate: dataValidadeFinal,
                            quantity: Number(lote.quantity),
                            lotCode: loteCodeFinal,
                            status: "normal",
                          };

                          // Insere no início do estado compartilhado para exibição imediata no FEFO e Estoque
                          setLotes((prev) => [novoLote, ...prev.filter((p) => Number(p.id) !== Number(novoLote.id))]);
                          setNewLoteId(novoLote.id);
                          navigate(`/estoque/${lote.instId}`);
                        }}
                    />
                  }
              />

              <Route
                  path="/estoque/:id"
                  element={
                    <EstoqueRouteWrapper
                        institutions={institutions}
                        lotes={lotes}
                        newLoteId={newLoteId}
                    />
                  }
              />

              <Route path="*" element={<Navigate to="/dashboard" replace />} />
            </Route>
        ) : (
            <Route path="*" element={<Navigate to="/login" replace />} />
        )}
      </Routes>
  );
}