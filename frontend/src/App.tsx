import { useState, useEffect } from "react";
import { Routes, Route, Navigate, Outlet, useLocation, useNavigate } from "react-router-dom";
import Header from "@/components/Header";
import Sidebar, { type NavItem } from "@/components/Sidebar";
import {
  IconArrows, IconBarChart2, IconBell, IconBuilding, IconClipboard, IconGrid,
  IconList, IconTruck, IconWifi,
} from "@/components/icons";
import { DEMO_LOTES, DEMO_REQUISICOES, institutionsData } from "@/data/mockData";
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
import RedistribuicoesScreen from "@/pages/Redistribuicoes";
import RegistrarLoteScreen from "@/pages/RegistrarLote";
import RequisicoesScreen from "@/pages/Requisicoes";
import TransferenciasScreen from "@/pages/Transferencias";

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
    if (path.includes("/instituicoes/nova")) return "cadastrar_instituicao";
    if (path.includes("/instituicoes")) return "instituicoes";
    if (path.includes("/registrar-lote")) return "registrar_lote";
    if (path.includes("/estoque")) return "estoque_instituicao";
    return "dashboard";
  };

  const currentScreen = getScreenFromPath(location.pathname);

  const screenSubtitle: Record<Screen, string> = {
    dashboard: "Visão Geral",
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
    return ((id * 3) % 11) + 2;
  };

  const carregarDadosDoBackend = () => {
    buscarInstituicoesApi()
        .then((dados: any) => {
          if (dados && dados.length > 0) {
            setInstitutions((prevExistentes) => {
              return dados.map((d: any) => {
                const idNum = Number(d.id);
                const anterior = prevExistentes.find((p) => Number(p.id) === idNum);
                return {
                  id: idNum,
                  name: d.name || d.nome,
                  type: d.type || d.tipo || "Hospital Público",
                  location: d.location || d.endereco || d.localizacao || "Recife, PE",
                  neighborhood: d.neighborhood || (idNum === 1 ? "Derby" : idNum === 2 ? "Graças" : "Casa Amarela"),
                  status: d.status || "ativa",
                  components: d.components || ["Concentrado de Hemácias", "Plasma", "Plaquetas"],
                  relations: anterior?.relations !== undefined ? anterior.relations : (d.relations || obterRelacoesIniciais(idNum)),
                  latitude: d.latitude || -8.0539,
                  longitude: d.longitude || -34.8999,
                  minStock: d.minStock && Object.keys(d.minStock).length > 0 ? d.minStock : { "O-": 20, "O+": 30 },
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
            const formatados = dados.map((l: any) => {
              const instIdNum = Number(l.instId || l.instituicaoId);
              const instEncontrada = institutions.find((i) => Number(i.id) === instIdNum);
              const nomeInst = l.instName || instEncontrada?.name || "Unidade de Saúde";
              return {
                id: l.id,
                instId: instIdNum,
                instName: nomeInst,
                bloodType: l.bloodType || (l.tipoSanguineo ? l.tipoSanguineo.replace("_NEGATIVO", "-").replace("_POSITIVO", "+") : "O-"),
                component: l.component || (l.tipoComponente === "CONCENTRADO_HEMACIAS" ? "Concentrado de Hemácias" : l.tipoComponente === "PLAQUETAS" ? "Plaquetas" : "Plasma"),
                collectionDate: l.collectionDate || l.dataColeta,
                expiryDate: l.expiryDate || l.dataValidade,
                quantity: l.quantity || l.quantidade || l.quantidadeUnidades,
                lotCode: l.lotCode || `LT-${String(l.id).padStart(4, "0")}`,
                status: l.status || "normal",
              };
            });
            setLotes(formatados);
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
              <Route path="/alertas" element={<AlertasScreen filter={alertFilter} setFilter={setAlertFilter} />} />
              <Route path="/fefo" element={<FefoScreen lotes={lotes} institutions={institutions} />} />

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
                  path="/instituicoes/nova"
                  element={
                    <CadastrarInstituicaoScreen
                        onCancel={() => navigate("/instituicoes")}
                        onSave={async (inst) => {
                          try {
                            const saved = await cadastrarInstituicaoApi({
                              nome: inst.name,
                              tipo: inst.type,
                              endereco: inst.location,
                              latitude: -8.0539,
                              longitude: -34.8811,
                            });
                            carregarDadosDoBackend();
                            setNewInstId(saved.id || Date.now());
                          } catch (e) {
                            const id = Date.now();
                            setInstitutions((prev) => [{ ...inst, id, hasHistory: false }, ...prev]);
                            setNewInstId(id);
                          }
                          navigate("/instituicoes");
                        }}
                    />
                  }
              />

              {/* Registro de Lote persistindo via API com sucesso */}
              <Route
                  path="/registrar-lote"
                  element={
                    <RegistrarLoteScreen
                        institutions={institutions}
                        prefillInstId={null}
                        lotes={lotes}
                        onCancel={() => navigate("/instituicoes")}
                        onSave={async (lote) => {
                          try {
                            const resSalvo = await registrarLoteApi(lote.instId, {
                              bloodType: lote.bloodType,
                              component: lote.component,
                              quantity: Number(lote.quantity),
                            });

                            // Instancia e adiciona o lote imediatamente na Fila FEFO
                            const instObj = institutions.find((i) => Number(i.id) === Number(lote.instId));
                            const novoLote: Lote = {
                              id: resSalvo?.id || Date.now(),
                              instId: Number(lote.instId),
                              instName: instObj?.name || "Unidade de Saúde",
                              bloodType: lote.bloodType,
                              component: lote.component,
                              collectionDate: obterDataHojeLocal(),
                              expiryDate: resSalvo?.expiryDate || resSalvo?.dataValidade || "2026-11-20",
                              quantity: Number(lote.quantity),
                              lotCode: resSalvo?.lotCode || `LT-${String(resSalvo?.id || Date.now()).slice(-4)}`,
                              status: "normal",
                            };

                            setLotes((prev) => [novoLote, ...prev]);
                            setNewLoteId(novoLote.id);
                            carregarDadosDoBackend();
                          } catch (e) {
                            console.warn("Fallback acionado:", e);
                            const id = Date.now();
                            const savedLocal: Lote = { ...lote, id, createdAt: Date.now() };
                            setLotes((prev) => [savedLocal, ...prev]);
                            setNewLoteId(id);
                          }
                          navigate("/fefo");
                        }}
                    />
                  }
              />

              <Route
                  path="/estoque/:id"
                  element={
                    <EstoqueInstituicaoScreen
                        institutions={institutions}
                        instId={1}
                        lotes={lotes}
                        newLoteId={newLoteId}
                        onBack={() => navigate("/instituicoes")}
                        onRegistrarLote={() => navigate("/registrar-lote")}
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