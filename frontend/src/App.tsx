import { useState, useEffect } from "react";
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

export default function App() {
  const [currentUser, setCurrentUser] = useState<AppUser | null>(null);
  const [screen, setScreen] = useState<
    "dashboard" | "alertas" | "fefo" | "requisicoes" | "nova_requisicao" |
    "redistribuicoes" | "analise" | "transferencias" | "rede" |
    "instituicoes" | "cadastrar_instituicao" | "registrar_lote" | "estoque_instituicao"
  >("dashboard");

  const [alertFilter, setAlertFilter] = useState<"todos" | "critico" | "atencao" | "normal">("todos");
  const [institutions, setInstitutions] = useState<Institution[]>(institutionsData);
  const [newInstId, setNewInstId] = useState<number | null>(null);
  const [lotes, setLotes] = useState<Lote[]>(DEMO_LOTES);
  const [newLoteId, setNewLoteId] = useState<number | null>(null);
  const [requisicoes, setRequisicoes] = useState<Requisicao[]>(DEMO_REQUISICOES);
  const [newReqId, setNewReqId] = useState<number | null>(null);
  const [estoqueInstId, setEstoqueInstId] = useState<number | null>(null);
  const [lotePrefillInstId, setLotePrefillInstId] = useState<number | null>(null);

  // ────────────────────────────────────────────────────────────────
  // Carga inicial dos dados reais a partir do Backend Spring Boot
  // ────────────────────────────────────────────────────────────────
  useEffect(() => {
    buscarInstituicoesApi()
      .then((dados) => {
        if (dados && dados.length > 0) setInstitutions(dados);
      })
      .catch((err) => console.warn("Aviso: backend não respondeu instituições, usando mock:", err));

    buscarLotesApi()
      .then((dados) => {
        if (dados && dados.length > 0) setLotes(dados);
      })
      .catch((err) => console.warn("Aviso: backend não respondeu lotes, usando mock:", err));

    buscarRequisicoesApi()
      .then((dados) => {
        if (dados && dados.length > 0) setRequisicoes(dados);
      })
      .catch((err) => console.warn("Aviso: backend não respondeu requisições, usando mock:", err));
  }, []);

  if (!currentUser) {
    return <LoginScreen onLogin={(u) => { setCurrentUser(u); setScreen("dashboard"); }} />;
  }

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

  return (
    <div className="flex h-full bg-[#F8F9FC] text-slate-800" style={{ fontFamily: "'DM Sans', sans-serif" }}>
      {/* Sidebar */}
      <Sidebar
        navItems={navItems}
        screen={screen}
        setScreen={setScreen}
        currentUser={currentUser}
        onLogout={() => setCurrentUser(null)}
        reqSub={REQ_SUB}
        instSub={INST_SUB}
      />

      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Top bar */}
        <Header subtitle={screenSubtitle[screen]} title={screenTitle[screen]} currentUser={currentUser} />

        <main className="flex-1 overflow-y-auto">
          {screen === "dashboard" && <DashboardScreen />}
          {screen === "alertas" && <AlertasScreen filter={alertFilter} setFilter={setAlertFilter} />}
          {screen === "fefo" && <FefoScreen lotes={lotes} institutions={institutions} />}

          {screen === "requisicoes" && (
            <RequisicoesScreen
              requisicoes={requisicoes}
              newReqId={newReqId}
              onNova={() => setScreen("nova_requisicao")}
            />
          )}

          {/* US04: Emissão de Requisições integrada com a API */}
          {screen === "nova_requisicao" && (
            <NovaRequisicaoScreen
              institutions={institutions}
              requisicoes={requisicoes}
              prefillInstId={currentUser.role === "operador" ? (institutions[0]?.id ?? 1) : null}
              onCancel={() => setScreen("requisicoes")}
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
                  console.error("Falha ao salvar no backend, gravando localmente:", e);
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
                setScreen("requisicoes");
                setTimeout(() => setNewReqId(null), 5000);
              }}
            />
          )}

          {screen === "redistribuicoes" && <RedistribuicoesScreen />}
          {screen === "analise" && <AnaliseConsumoScreen />}
          {screen === "transferencias" && <TransferenciasScreen />}
          {screen === "rede" && <MonitoramentoRedeScreen />}

          {screen === "instituicoes" && (
            <InstituicoesScreen
              role={currentUser.role}
              institutions={institutions}
              setInstitutions={setInstitutions}
              newInstId={newInstId}
              onNavigateToAdd={() => setScreen("cadastrar_instituicao")}
              onNavigateToRegistrarLote={(instId) => { setLotePrefillInstId(instId ?? null); setScreen("registrar_lote"); }}
              onNavigateToEstoque={(instId) => { setEstoqueInstId(instId); setScreen("estoque_instituicao"); }}
            />
          )}

          {/* US01: Cadastro de Unidades da Malha integrado com a API */}
          {screen === "cadastrar_instituicao" && (
            <CadastrarInstituicaoScreen
              onCancel={() => setScreen("instituicoes")}
              onSave={async (inst) => {
                try {
                  const saved = await cadastrarInstituicaoApi({
                    nome: inst.name,
                    tipo: inst.type,
                    endereco: inst.location,
                    latitude: -8.0539,
                    longitude: -34.8811,
                  });
                  setInstitutions((prev) => [saved, ...prev]);
                  setNewInstId(saved.id);
                } catch (e) {
                  console.error("Falha ao salvar no backend, gravando localmente:", e);
                  const id = Date.now();
                  setInstitutions((prev) => [{ ...inst, id, hasHistory: false }, ...prev]);
                  setNewInstId(id);
                }
                setScreen("instituicoes");
                setTimeout(() => setNewInstId(null), 4000);
              }}
            />
          )}

          {/* US02: Registro de Lote integrado com a API */}
          {screen === "registrar_lote" && (
            <RegistrarLoteScreen
              institutions={institutions}
              prefillInstId={lotePrefillInstId}
              lotes={lotes}
              onCancel={() => setScreen("instituicoes")}
              onSave={async (lote) => {
                try {
                  const saved = await registrarLoteApi(lote.instId, {
                    tipoSanguineo: lote.bloodType,
                    componente: lote.component,
                    dataColeta: lote.collectionDate,
                    validade: lote.expiryDate,
                    quantidade: lote.quantity,
                  });
                  setLotes((prev) => [saved, ...prev]);
                  setNewLoteId(saved.id);
                } catch (e) {
                  console.error("Falha ao salvar no backend, gravando localmente:", e);
                  const id = Date.now();
                  const savedLocal: Lote = { ...lote, id, createdAt: Date.now() };
                  setLotes((prev) => [savedLocal, ...prev]);
                  setNewLoteId(id);
                }
                setEstoqueInstId(lote.instId);
                setScreen("estoque_instituicao");
                setTimeout(() => setNewLoteId(null), 5000);
              }}
            />
          )}

          {screen === "estoque_instituicao" && estoqueInstId !== null && (
            <EstoqueInstituicaoScreen
              institutions={institutions}
              instId={estoqueInstId}
              lotes={lotes}
              newLoteId={newLoteId}
              onBack={() => setScreen("instituicoes")}
              onRegistrarLote={(instId) => { setLotePrefillInstId(instId); setScreen("registrar_lote"); }}
            />
          )}
        </main>
      </div>
    </div>
  );
}