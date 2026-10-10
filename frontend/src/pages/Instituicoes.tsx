// Tela de Instituições — US01 / US06 (Relações editáveis e exclusivas por instituição)

import { useState, useMemo, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  IconAlertTriangle,
  IconBuilding,
  IconCheck,
  IconChevronDown,
  IconDroplet,
  IconEdit,
  IconEye,
  IconLink,
  IconMapPin,
  IconPlus,
  IconPowerOff,
  IconSearch,
  IconShield,
  IconTrash,
} from "@/components/icons";
import {
  allComponents,
  instTypeOptions,
  neighborhoods,
  institutionsData,
} from "@/data/mockData";
import {
  getInstituicoes,
  atualizarInstituicaoApi,
  cadastrarInstituicaoApi,
  excluirInstituicaoApi,
  InstituicaoAPI,
} from "@/data/api";
import type {
  InstStatus,
  InstType,
  Institution,
  ModalMode,
  UserRole,
} from "@/types";
import { ActionBtn } from "@/components/Button";
import { Modal } from "@/components/Modal";

function InfoCell({
                    icon,
                    label,
                    value,
                  }: {
  icon: React.ReactNode;
  label: string;
  value: React.ReactNode;
}) {
  return (
      <div className="bg-slate-50 rounded-lg p-3">
        <div className="text-[10px] text-slate-400 font-semibold uppercase tracking-wide mb-1 flex items-center gap-1.5">
          <span className="text-slate-400">{icon}</span>
          {label}
        </div>
        <div className="text-[13px] font-medium text-slate-800">{value}</div>
      </div>
  );
}

export interface InstituicoesScreenProps {
  role?: UserRole;
  institutions?: Institution[];
  setInstitutions?: React.Dispatch<React.SetStateAction<Institution[]>>;
  newInstId?: number | null;
}

export function InstituicoesScreen({
                                     role = "admin_principal",
                                     institutions: propInstitutions,
                                     setInstitutions: propSetInstitutions,
                                     newInstId = null,
                                   }: InstituicoesScreenProps) {
  const navigate = useNavigate();

  const [localInstitutions, setLocalInstitutions] = useState<Institution[]>(institutionsData);
  const institutions = propInstitutions || localInstitutions;
  const setInstitutions = propSetInstitutions || setLocalInstitutions;

  const [search, setSearch] = useState("");
  const [filterType, setFilterType] = useState<InstType | "">("");
  const [filterStatus, setFilterStatus] = useState<InstStatus | "">("");
  const [filterNeighborhood, setFilterNeighborhood] = useState("");
  const [modal, setModal] = useState<ModalMode | "activate" | "add">(null);
  const [selected, setSelected] = useState<Institution | null>(null);

  const [form, setForm] = useState({
    name: "",
    type: "Hospital Público" as InstType,
    location: "",
    neighborhood: "Derby",
    status: "ativa" as InstStatus,
    components: ["Concentrado de Hemácias", "Plasma", "Plaquetas"] as string[],
    relations: 4,
  });

  const obterRelacoesIniciais = (id: number): number => {
    if (id === 1) return 7;
    if (id === 2) return 14;
    if (id === 3) return 5;
    if (id === 4) return 4;
    return ((id * 3) % 11) + 2;
  };

  const carregarDados = () => {
    getInstituicoes()
        .then((data: InstituicaoAPI[]) => {
          if (data && data.length > 0) {
            setInstitutions((prevExistentes) => {
              return data.map((item) => {
                const idNum = Number(item.id);
                const anterior = prevExistentes.find((p) => Number(p.id) === idNum);
                return {
                  id: idNum,
                  name: item.name,
                  type: (item.type as InstType) || "Hospital Público",
                  location: item.location || "Recife, PE",
                  neighborhood: (idNum === 1 ? "Derby" : idNum === 2 ? "Graças" : "Casa Amarela"),
                  status: ("ativa" as InstStatus),
                  components: [
                    "Concentrado de Hemácias",
                    "Plasma",
                    "Plaquetas",
                  ],
                  // Preserva rigorosamente o valor editado pelo utilizador
                  relations: anterior?.relations !== undefined ? anterior.relations : (item.relations || obterRelacoesIniciais(idNum)),
                  latitude: item.latitude || -8.0539,
                  longitude: item.longitude || -34.8999,
                  minStock: item.minStock && Object.keys(item.minStock).length > 0 ? item.minStock : { "O-": 20, "O+": 30 },
                  hasHistory: true,
                };
              });
            });
          }
        })
        .catch((err) => console.warn("Backend offline, dados locais mantidos:", err));
  };

  useEffect(() => {
    if (!propInstitutions || propInstitutions.length === 0) {
      carregarDados();
    }
  }, []);

  const canAdd = role === "admin_rede" || role === "admin_principal";
  const canEdit = role === "admin_rede" || role === "admin_principal";
  const canDeactivate = role === "admin_rede" || role === "admin_principal";
  const canDelete = role === "admin_principal";

  const filtered = useMemo(() => {
    return institutions.filter((inst) => {
      const matchSearch = (inst.name || "").toLowerCase().includes(search.toLowerCase());
      const matchType = filterType === "" || inst.type === filterType;
      const matchStatus = filterStatus === "" || inst.status === filterStatus;
      const matchNeighborhood =
          filterNeighborhood === "" || inst.neighborhood === filterNeighborhood;
      return matchSearch && matchType && matchStatus && matchNeighborhood;
    });
  }, [institutions, search, filterType, filterStatus, filterNeighborhood]);

  function openView(inst: Institution) {
    setSelected(inst);
    setModal("view");
  }

  function openEdit(inst: Institution) {
    setForm({
      name: inst.name,
      type: inst.type,
      location: inst.location,
      neighborhood: inst.neighborhood || "Derby",
      status: inst.status || "ativa",
      components: inst.components || [],
      relations: inst.relations !== undefined ? inst.relations : obterRelacoesIniciais(inst.id),
    });
    setSelected(inst);
    setModal("edit");
  }

  function openAdd() {
    setForm({
      name: "",
      type: "Hospital Público",
      location: "",
      neighborhood: "Derby",
      status: "ativa",
      components: ["Concentrado de Hemácias", "Plasma", "Plaquetas"],
      relations: 5,
    });
    setModal("add");
  }

  function openDeactivate(inst: Institution) {
    setSelected(inst);
    setModal("deactivate");
  }

  function openActivate(inst: Institution) {
    setSelected(inst);
    setModal("activate");
  }

  function openDelete(inst: Institution) {
    setSelected(inst);
    setModal("delete");
  }

  function closeModal() {
    setModal(null);
    setSelected(null);
  }

  async function handleCreate() {
    if (!form.name.trim()) return;
    try {
      await cadastrarInstituicaoApi({
        name: form.name,
        type: form.type,
        location: form.location || "Recife, PE",
        latitude: -8.0539,
        longitude: -34.8999,
        relations: Number(form.relations || 4),
      });
      carregarDados();
    } catch (e) {
      console.warn("Falha ao salvar via API:", e);
    }
    closeModal();
  }

  // Grava as relações unicamente para a instituição selecionada
  async function handleSave() {
    if (modal === "edit" && selected) {
      const novasRelacoes = Number(form.relations);
      try {
        await atualizarInstituicaoApi(selected.id, {
          name: form.name,
          type: form.type,
          location: form.location,
          relations: novasRelacoes,
        });
      } catch (e) {
        console.warn("Atualização persistida localmente:", e);
      }

      setInstitutions((prev) =>
          prev.map((i) => (Number(i.id) === Number(selected.id) ? { ...i, ...form, relations: novasRelacoes } : i))
      );
    }
    closeModal();
  }

  async function handleToggleStatus(novoStatus: InstStatus) {
    if (!selected) return;
    try {
      await atualizarInstituicaoApi(selected.id, {
        name: selected.name,
        location: selected.location,
        type: selected.type,
      });
    } catch (e) {
      console.warn("Falha ao sincronizar status via API:", e);
    }
    setInstitutions((prev) =>
        prev.map((i) => (Number(i.id) === Number(selected.id) ? { ...i, status: novoStatus } : i))
    );
    closeModal();
  }

  async function handleDelete() {
    if (!selected) return;
    try {
      await excluirInstituicaoApi(selected.id);
    } catch (e) {
      console.warn("Falha ao excluir na API:", e);
    }
    setInstitutions((prev) => prev.filter((i) => Number(i.id) !== Number(selected.id)));
    closeModal();
  }

  const instStatusCfg: Record<InstStatus, { label: string; badge: string; dot: string }> = {
    ativa: {
      label: "Ativa",
      badge: "bg-emerald-50 text-emerald-700",
      dot: "bg-emerald-400",
    },
    inativa: {
      label: "Inativa",
      badge: "bg-slate-100 text-slate-500",
      dot: "bg-slate-300",
    },
    em_analise: {
      label: "Em análise",
      badge: "bg-amber-50 text-amber-700",
      dot: "bg-amber-400",
    },
  };

  const typeBadge: Record<string, string> = {
    "Hospital Público": "bg-blue-50 text-blue-700",
    "Hospital Privado": "bg-violet-50 text-violet-700",
    UPA: "bg-orange-50 text-orange-700",
    Hemocentro: "bg-[#FFF0F2] text-[#C8102E]",
    Maternidade: "bg-pink-50 text-pink-700",
    Clínica: "bg-teal-50 text-teal-700",
  };

  return (
      <div className="px-8 py-7">
        {/* ── Toolbar ── */}
        <div className="flex items-center gap-3 mb-5 flex-wrap">
          <div className="relative flex-1 min-w-52">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
            <IconSearch size={15} />
          </span>
            <input
                type="text"
                placeholder="Buscar instituição..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-9 pr-4 py-2 rounded-lg border border-slate-200 text-[13px] focus:outline-none focus:ring-2 focus:ring-[#C8102E]/20 focus:border-[#C8102E]/50 bg-white placeholder-slate-400 shadow-sm"
            />
          </div>

          <div className="relative">
            <select
                value={filterType}
                onChange={(e) => setFilterType(e.target.value as InstType | "")}
                className="appearance-none pl-3 pr-8 py-2 rounded-lg border border-slate-200 text-[13px] text-slate-600 bg-white focus:outline-none focus:ring-2 focus:ring-[#C8102E]/20 cursor-pointer shadow-sm"
            >
              <option value="">Tipo: Todos</option>
              {instTypeOptions.map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
              ))}
            </select>
            <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none">
            <IconChevronDown size={13} />
          </span>
          </div>

          <div className="relative">
            <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value as InstStatus | "")}
                className="appearance-none pl-3 pr-8 py-2 rounded-lg border border-slate-200 text-[13px] text-slate-600 bg-white focus:outline-none focus:ring-2 focus:ring-[#C8102E]/20 cursor-pointer shadow-sm"
            >
              <option value="">Status: Todos</option>
              <option value="ativa">Ativa</option>
              <option value="inativa">Inativa</option>
              <option value="em_analise">Em análise</option>
            </select>
            <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none">
            <IconChevronDown size={13} />
          </span>
          </div>

          <div className="relative">
            <select
                value={filterNeighborhood}
                onChange={(e) => setFilterNeighborhood(e.target.value)}
                className="appearance-none pl-3 pr-8 py-2 rounded-lg border border-slate-200 text-[13px] text-slate-600 bg-white focus:outline-none focus:ring-2 focus:ring-[#C8102E]/20 cursor-pointer shadow-sm"
            >
              <option value="">Localização: Todas</option>
              {neighborhoods.map((n) => (
                  <option key={n} value={n}>
                    {n}
                  </option>
              ))}
            </select>
            <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none">
            <IconChevronDown size={13} />
          </span>
          </div>

          <button
              onClick={() => navigate("/registrar-lote")}
              className={`${
                  canAdd ? "" : "ml-auto"
              } flex items-center gap-2 px-4 py-2 rounded-lg border border-slate-200 text-slate-600 text-[13px] font-medium hover:bg-slate-50 transition-colors shadow-sm cursor-pointer`}
          >
            <IconPlus size={15} /> Registrar Lote
          </button>

          {canAdd && (
              <button
                  onClick={openAdd}
                  className="flex items-center gap-2 px-4 py-2 rounded-lg bg-[#C8102E] text-white text-[13px] font-semibold hover:bg-[#a00d24] transition-colors shadow-sm cursor-pointer"
              >
                <IconPlus size={15} /> Nova Instituição
              </button>
          )}
        </div>

        {/* ── Chips ── */}
        <div className="flex items-center gap-2 mb-4 text-[12px] text-slate-500 flex-wrap">
          <span className="font-semibold text-slate-700">{filtered.length}</span> instituição
          {filtered.length !== 1 ? "s" : ""} encontrada{filtered.length !== 1 ? "s" : ""}
          <span className="mx-1 text-slate-200">|</span>
          <span className="flex items-center gap-1">
          <span className="w-2 h-2 rounded-full bg-emerald-400 inline-block" />
            {institutions.filter((i) => i.status === "ativa").length} ativas
        </span>
          <span className="flex items-center gap-1">
          <span className="w-2 h-2 rounded-full bg-slate-300 inline-block" />
            {institutions.filter((i) => i.status === "inativa").length} inativas
        </span>
          <span className="flex items-center gap-1">
          <span className="w-2 h-2 rounded-full bg-amber-400 inline-block" />
            {institutions.filter((i) => i.status === "em_analise").length} em análise
        </span>
          {role !== "operador" && (
              <span className="ml-2 text-[11px] px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 font-medium flex items-center gap-1">
            <IconShield size={11} /> Modo edição ativo
          </span>
          )}
        </div>

        {/* ── Tabela ── */}
        <div className="bg-white rounded-xl border border-slate-100 overflow-hidden shadow-sm">
          <div
              className="grid gap-4 px-5 py-3 bg-slate-50 border-b border-slate-100 text-[11px] font-semibold text-slate-400 uppercase tracking-widest"
              style={{ gridTemplateColumns: "2fr 1fr 1.5fr 1fr 80px 130px" }}
          >
            <div>Instituição</div>
            <div>Tipo</div>
            <div>Localização</div>
            <div>Status</div>
            <div className="text-center">Relações</div>
            <div className="text-right">Ações</div>
          </div>

          {filtered.length === 0 ? (
              <div className="py-16 text-center text-slate-400 flex flex-col items-center justify-center">
                <IconBuilding size={32} />
                <div className="mt-3 text-[13px]">Nenhuma instituição encontrada</div>
              </div>
          ) : (
              filtered.map((inst) => {
                const sc = instStatusCfg[inst.status] || instStatusCfg["ativa"];
                const isInativa = inst.status === "inativa";
                const canHardDelete =
                    canDelete && !inst.hasHistory && (inst.relations || 0) === 0 && isInativa;

                return (
                    <div
                        key={inst.id}
                        className={`grid gap-4 px-5 py-4 items-center border-b border-slate-50 last:border-0 hover:bg-slate-50/60 transition-colors ${
                            isInativa ? "opacity-70" : ""
                        }`}
                        style={{ gridTemplateColumns: "2fr 1fr 1.5fr 1fr 80px 130px" }}
                    >
                      {/* Nome */}
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <div className="text-[13.5px] font-semibold text-slate-800 truncate">
                            {inst.name}
                          </div>
                          {newInstId === inst.id && (
                              <span className="flex-shrink-0 text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-emerald-500 text-white animate-pulse">
                        Nova
                      </span>
                          )}
                        </div>
                        <div className="text-[11px] text-slate-400 mt-0.5 flex items-center gap-1 truncate">
                          <IconDroplet size={10} />
                          {(inst.components || []).slice(0, 4).join(" · ")}
                          {(inst.components || []).length > 4 ? ` +${inst.components.length - 4}` : ""}
                        </div>
                      </div>

                      {/* Tipo */}
                      <div>
                  <span
                      className={`text-[11px] font-medium px-2 py-0.5 rounded-full ${
                          typeBadge[inst.type] || "bg-slate-100 text-slate-600"
                      }`}
                  >
                    {inst.type}
                  </span>
                      </div>

                      {/* Localização */}
                      <div className="min-w-0">
                        <div className="text-[12px] text-slate-600 truncate flex items-center gap-1">
                    <span className="flex-shrink-0">
                      <IconMapPin size={11} />
                    </span>
                          {inst.neighborhood || "Derby"}
                        </div>
                        <div className="text-[11px] text-slate-400 truncate mt-0.5">{inst.location}</div>
                      </div>

                      {/* Status */}
                      <div>
                  <span
                      className={`text-[11px] font-semibold px-2 py-0.5 rounded-full flex items-center gap-1.5 w-fit ${sc.badge}`}
                  >
                    <span className={`w-1.5 h-1.5 rounded-full ${sc.dot}`} />
                    {sc.label}
                  </span>
                      </div>

                      {/* Relações exclusivas */}
                      <div className="text-center">
                  <span
                      className={`text-[13px] font-semibold flex items-center justify-center gap-1 ${
                          (inst.relations || 0) > 0 ? "text-slate-700" : "text-slate-300"
                      }`}
                  >
                    <IconLink size={12} />
                    {inst.relations !== undefined ? inst.relations : obterRelacoesIniciais(inst.id)}
                  </span>
                      </div>

                      {/* Ações */}
                      <div className="flex items-center justify-end gap-1">
                        <ActionBtn
                            title="Visualizar"
                            onClick={() => openView(inst)}
                            color="text-slate-500 hover:text-blue-600 hover:bg-blue-50"
                        >
                          <IconEye size={14} />
                        </ActionBtn>

                        {canEdit && !isInativa && (
                            <ActionBtn
                                title="Editar"
                                onClick={() => openEdit(inst)}
                                color="text-slate-500 hover:text-slate-800 hover:bg-slate-100"
                            >
                              <IconEdit size={14} />
                            </ActionBtn>
                        )}

                        {canDeactivate &&
                            (!isInativa ? (
                                <ActionBtn
                                    title="Desativar"
                                    onClick={() => openDeactivate(inst)}
                                    color="text-slate-500 hover:text-amber-600 hover:bg-amber-50"
                                >
                                  <IconPowerOff size={14} />
                                </ActionBtn>
                            ) : (
                                <ActionBtn
                                    title="Reativar"
                                    onClick={() => openActivate(inst)}
                                    color="text-slate-400 hover:text-emerald-600 hover:bg-emerald-50"
                                >
                                  <IconPowerOff size={14} />
                                </ActionBtn>
                            ))}

                        {canDelete && (
                            <ActionBtn
                                title={
                                  canHardDelete
                                      ? "Excluir definitivamente"
                                      : "Exclusão bloqueada — possui vínculos"
                                }
                                onClick={canHardDelete ? () => openDelete(inst) : undefined}
                                color={
                                  canHardDelete
                                      ? "text-slate-500 hover:text-[#C8102E] hover:bg-[#FFF0F2]"
                                      : "text-slate-200 cursor-not-allowed"
                                }
                                disabled={!canHardDelete}
                            >
                              <IconTrash size={14} />
                            </ActionBtn>
                        )}
                      </div>
                    </div>
                );
              })
          )}
        </div>

        {/* ── MODAIS ── */}

        {/* Modal: Visualizar */}
        {modal === "view" && selected && (
            <Modal onClose={closeModal} title="Detalhes da Instituição" width="max-w-lg">
              <div className="space-y-4">
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="text-[16px] font-semibold text-slate-800">{selected.name}</h3>
                    <span
                        className={`text-[11px] font-medium px-2 py-0.5 rounded-full mt-1 inline-block ${
                            typeBadge[selected.type] || "bg-slate-100 text-slate-700"
                        }`}
                    >
                  {selected.type}
                </span>
                  </div>
                  <span
                      className={`text-[11px] font-semibold px-2.5 py-1 rounded-full flex items-center gap-1.5 ${
                          (instStatusCfg[selected.status] || instStatusCfg["ativa"]).badge
                      }`}
                  >
                <span
                    className={`w-1.5 h-1.5 rounded-full ${
                        (instStatusCfg[selected.status] || instStatusCfg["ativa"]).dot
                    }`}
                />
                    {(instStatusCfg[selected.status] || instStatusCfg["ativa"]).label}
              </span>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <InfoCell
                      icon={<IconMapPin size={14} />}
                      label="Bairro"
                      value={selected.neighborhood || "Derby"}
                  />
                  <InfoCell
                      icon={<IconLink size={14} />}
                      label="Relações de fornecimento"
                      value={`${selected.relations !== undefined ? selected.relations : obterRelacoesIniciais(selected.id)} relações`}
                  />
                </div>

                <div className="bg-slate-50 rounded-lg p-3">
                  <div className="text-[10px] text-slate-400 font-semibold uppercase tracking-wide mb-1.5">
                    Endereço
                  </div>
                  <div className="text-[13px] text-slate-700">{selected.location}</div>
                </div>

                <div className="bg-slate-50 rounded-lg p-3">
                  <div className="text-[10px] text-slate-400 font-semibold uppercase tracking-wide mb-2">
                    Hemocomponentes atendidos
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {(selected.components || []).map((c) => (
                        <span
                            key={c}
                            className="text-[12px] font-semibold px-2.5 py-0.5 rounded-full bg-[#FFF0F2] text-[#C8102E]"
                            style={{ fontFamily: "'JetBrains Mono', monospace" }}
                        >
                    {c}
                  </span>
                    ))}
                  </div>
                </div>

                {selected.hasHistory && (
                    <div className="flex items-start gap-2 bg-amber-50 rounded-lg p-3 text-amber-700">
                <span className="mt-0.5 flex-shrink-0">
                  <IconAlertTriangle size={14} />
                </span>
                      <span className="text-[12px]">
                  Esta instituição possui histórico de operações no sistema.
                </span>
                    </div>
                )}
              </div>

              <div className="flex items-center justify-between mt-6">
                <div className="flex items-center gap-2">
                  <button
                      onClick={() => {
                        closeModal();
                        navigate(`/fefo?inst=${selected.id}`);
                      }}
                      className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg border border-slate-200 text-[12.5px] font-medium text-slate-600 hover:bg-slate-50 transition-colors cursor-pointer"
                  >
                    <IconDroplet size={13} /> Ver Estoque
                  </button>

                  <button
                      onClick={() => {
                        closeModal();
                        navigate("/registrar-lote");
                      }}
                      className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg border border-[#C8102E]/30 text-[12.5px] font-medium text-[#C8102E] hover:bg-[#FFF0F2] transition-colors cursor-pointer"
                  >
                    <IconPlus size={13} /> Novo Lote
                  </button>
                </div>
                <button
                    onClick={closeModal}
                    className="px-4 py-2 rounded-lg border border-slate-200 text-[13px] text-slate-600 hover:bg-slate-50 font-medium cursor-pointer"
                >
                  Fechar
                </button>
              </div>
            </Modal>
        )}

        {/* Modal: Adicionar Nova Instituição */}
        {modal === "add" && (
            <Modal onClose={closeModal} title="Nova Instituição" width="max-w-xl">
              <div className="space-y-4">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-500 uppercase tracking-widest mb-1.5">
                    Nome da instituição *
                  </label>
                  <input
                      type="text"
                      value={form.name}
                      onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                      placeholder="Ex: Hospital das Clínicas de Pernambuco"
                      className="w-full px-3 py-2 rounded-lg border border-slate-200 text-[13px] focus:outline-none focus:ring-2 focus:ring-[#C8102E]/20 focus:border-[#C8102E]/50"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-500 uppercase tracking-widest mb-1.5">
                      Tipo *
                    </label>
                    <div className="relative">
                      <select
                          value={form.type}
                          onChange={(e) => setForm((f) => ({ ...f, type: e.target.value as InstType }))}
                          className="appearance-none w-full px-3 pr-8 py-2 rounded-lg border border-slate-200 text-[13px] focus:outline-none focus:ring-2 focus:ring-[#C8102E]/20 bg-white cursor-pointer"
                      >
                        {instTypeOptions.map((t) => (
                            <option key={t} value={t}>
                              {t}
                            </option>
                        ))}
                      </select>
                      <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none">
                    <IconChevronDown size={13} />
                  </span>
                    </div>
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-500 uppercase tracking-widest mb-1.5">
                      Bairro
                    </label>
                    <div className="relative">
                      <select
                          value={form.neighborhood}
                          onChange={(e) => setForm((f) => ({ ...f, neighborhood: e.target.value }))}
                          className="appearance-none w-full px-3 pr-8 py-2 rounded-lg border border-slate-200 text-[13px] focus:outline-none focus:ring-2 focus:ring-[#C8102E]/20 bg-white cursor-pointer"
                      >
                        {neighborhoods.map((n) => (
                            <option key={n} value={n}>
                              {n}
                            </option>
                        ))}
                      </select>
                      <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none">
                    <IconChevronDown size={13} />
                  </span>
                    </div>
                  </div>
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-slate-500 uppercase tracking-widest mb-1.5">
                    Endereço / Localização
                  </label>
                  <input
                      type="text"
                      value={form.location}
                      onChange={(e) => setForm((f) => ({ ...f, location: e.target.value }))}
                      placeholder="Ex: Av. Prof. Moraes Rego, s/n — Cidade Universitária"
                      className="w-full px-3 py-2 rounded-lg border border-slate-200 text-[13px] focus:outline-none focus:ring-2 focus:ring-[#C8102E]/20"
                  />
                </div>
              </div>
              <div className="flex justify-end gap-2 mt-6 pt-5 border-t border-slate-100">
                <button
                    onClick={closeModal}
                    className="px-4 py-2 rounded-lg border border-slate-200 text-[13px] text-slate-600 hover:bg-slate-50 font-medium cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                    onClick={handleCreate}
                    disabled={!form.name.trim()}
                    className="px-5 py-2 rounded-lg bg-[#C8102E] text-white text-[13px] font-semibold hover:bg-[#a00d24] transition-colors disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
                >
                  Criar instituição
                </button>
              </div>
            </Modal>
        )}

        {/* Modal: Editar */}
        {modal === "edit" && (
            <Modal onClose={closeModal} title="Editar Instituição" width="max-w-xl">
              <div className="space-y-4">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-500 uppercase tracking-widest mb-1.5">
                    Nome da instituição *
                  </label>
                  <input
                      type="text"
                      value={form.name}
                      onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                      className="w-full px-3 py-2 rounded-lg border border-slate-200 text-[13px] focus:outline-none focus:ring-2 focus:ring-[#C8102E]/20 focus:border-[#C8102E]/50"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-500 uppercase tracking-widest mb-1.5">
                      Tipo *
                    </label>
                    <div className="relative">
                      <select
                          value={form.type}
                          onChange={(e) => setForm((f) => ({ ...f, type: e.target.value as InstType }))}
                          className="appearance-none w-full px-3 pr-8 py-2 rounded-lg border border-slate-200 text-[13px] focus:outline-none focus:ring-2 focus:ring-[#C8102E]/20 bg-white cursor-pointer"
                      >
                        {instTypeOptions.map((t) => (
                            <option key={t} value={t}>
                              {t}
                            </option>
                        ))}
                      </select>
                      <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none">
                    <IconChevronDown size={13} />
                  </span>
                    </div>
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-500 uppercase tracking-widest mb-1.5">
                      Status *
                    </label>
                    <div className="relative">
                      <select
                          value={form.status}
                          onChange={(e) => setForm((f) => ({ ...f, status: e.target.value as InstStatus }))}
                          className="appearance-none w-full px-3 pr-8 py-2 rounded-lg border border-slate-200 text-[13px] focus:outline-none focus:ring-2 focus:ring-[#C8102E]/20 bg-white cursor-pointer"
                      >
                        <option value="ativa">Ativa</option>
                        <option value="inativa">Inativa</option>
                        <option value="em_analise">Em análise</option>
                      </select>
                      <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none">
                    <IconChevronDown size={13} />
                  </span>
                    </div>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-500 uppercase tracking-widest mb-1.5">
                      Bairro
                    </label>
                    <div className="relative">
                      <select
                          value={form.neighborhood}
                          onChange={(e) => setForm((f) => ({ ...f, neighborhood: e.target.value }))}
                          className="appearance-none w-full px-3 pr-8 py-2 rounded-lg border border-slate-200 text-[13px] focus:outline-none focus:ring-2 focus:ring-[#C8102E]/20 bg-white cursor-pointer"
                      >
                        {neighborhoods.map((n) => (
                            <option key={n} value={n}>
                              {n}
                            </option>
                        ))}
                      </select>
                      <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none">
                    <IconChevronDown size={13} />
                  </span>
                    </div>
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-500 uppercase tracking-widest mb-1.5">
                      Relações de fornecimento
                    </label>
                    <input
                        type="number"
                        min={0}
                        value={form.relations}
                        onChange={(e) => setForm((f) => ({ ...f, relations: Number(e.target.value) }))}
                        className="w-full px-3 py-2 rounded-lg border border-slate-200 text-[13px] focus:outline-none focus:ring-2 focus:ring-[#C8102E]/20"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-slate-500 uppercase tracking-widest mb-1.5">
                    Endereço / Localização
                  </label>
                  <input
                      type="text"
                      value={form.location}
                      onChange={(e) => setForm((f) => ({ ...f, location: e.target.value }))}
                      className="w-full px-3 py-2 rounded-lg border border-slate-200 text-[13px] focus:outline-none focus:ring-2 focus:ring-[#C8102E]/20"
                  />
                </div>
              </div>
              <div className="flex justify-end gap-2 mt-6 pt-5 border-t border-slate-100">
                <button
                    onClick={closeModal}
                    className="px-4 py-2 rounded-lg border border-slate-200 text-[13px] text-slate-600 hover:bg-slate-50 font-medium cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                    onClick={handleSave}
                    disabled={!form.name.trim()}
                    className="px-5 py-2 rounded-lg bg-[#C8102E] text-white text-[13px] font-semibold hover:bg-[#a00d24] transition-colors disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
                >
                  Salvar instituição
                </button>
              </div>
            </Modal>
        )}

        {/* Modal: Desativar */}
        {modal === "deactivate" && selected && (
            <Modal onClose={closeModal} title="Desativar Instituição" width="max-w-md">
              <div className="flex items-start gap-3 bg-amber-50 rounded-xl p-4 mb-4">
                <div className="w-8 h-8 rounded-full bg-amber-100 flex items-center justify-center text-amber-600 flex-shrink-0 mt-0.5">
                  <IconPowerOff size={16} />
                </div>
                <div>
                  <div className="text-[13.5px] font-semibold text-amber-800 mb-1">
                    Desativar <span className="text-amber-900">{selected.name}</span>?
                  </div>
                  <div className="text-[12.5px] text-amber-700 leading-relaxed">
                    A instituição deixará de participar de novas operações e redistribuições. Todo o histórico será preservado.
                  </div>
                </div>
              </div>
              <div className="flex justify-end gap-2 mt-5">
                <button
                    onClick={closeModal}
                    className="px-4 py-2 rounded-lg border border-slate-200 text-[13px] text-slate-600 hover:bg-slate-50 font-medium cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                    onClick={() => handleToggleStatus("inativa")}
                    className="px-5 py-2 rounded-lg bg-amber-500 text-white text-[13px] font-semibold hover:bg-amber-600 transition-colors cursor-pointer"
                >
                  Desativar instituição
                </button>
              </div>
            </Modal>
        )}

        {/* Modal: Reativar */}
        {modal === "activate" && selected && (
            <Modal onClose={closeModal} title="Reativar Instituição" width="max-w-md">
              <div className="flex items-start gap-3 bg-emerald-50 rounded-xl p-4 mb-4">
                <div className="w-8 h-8 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-600 flex-shrink-0 mt-0.5">
                  <IconCheck size={16} />
                </div>
                <div>
                  <div className="text-[13.5px] font-semibold text-emerald-800 mb-1">
                    Reativar <span className="text-emerald-900">{selected.name}</span>?
                  </div>
                  <div className="text-[12.5px] text-emerald-700 leading-relaxed">
                    A unidade voltará a estar ativa na malha logística de hemoterapia.
                  </div>
                </div>
              </div>
              <div className="flex justify-end gap-2 mt-5">
                <button
                    onClick={closeModal}
                    className="px-4 py-2 rounded-lg border border-slate-200 text-[13px] text-slate-600 hover:bg-slate-50 font-medium cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                    onClick={() => handleToggleStatus("ativa")}
                    className="px-5 py-2 rounded-lg bg-emerald-600 text-white text-[13px] font-semibold hover:bg-emerald-700 transition-colors cursor-pointer"
                >
                  Reativar instituição
                </button>
              </div>
            </Modal>
        )}

        {/* Modal: Excluir */}
        {modal === "delete" && selected && (
            <Modal onClose={closeModal} title="Excluir Instituição Definitivamente" width="max-w-md">
              <div className="flex items-start gap-3 bg-[#FFF0F2] rounded-xl p-4 mb-4">
                <div className="w-8 h-8 rounded-full bg-[#F9D7DC] flex items-center justify-center text-[#C8102E] flex-shrink-0 mt-0.5">
                  <IconTrash size={16} />
                </div>
                <div>
                  <div className="text-[13.5px] font-semibold text-[#9B0D23] mb-1">
                    Excluir instituição definitivamente?
                  </div>
                  <div className="text-[12.5px] text-[#C8102E]/80 leading-relaxed">
                    Esta ação é permanente e remove <span className="font-semibold">{selected.name}</span> do sistema.
                  </div>
                </div>
              </div>
              <div className="flex justify-end gap-2 pt-4 border-t border-slate-100">
                <button
                    onClick={closeModal}
                    className="px-4 py-2 rounded-lg border border-slate-200 text-[13px] text-slate-600 hover:bg-slate-50 font-medium cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                    onClick={handleDelete}
                    className="px-5 py-2 rounded-lg bg-[#C8102E] text-white text-[13px] font-semibold hover:bg-[#9B0D23] transition-colors cursor-pointer"
                >
                  Excluir definitivamente
                </button>
              </div>
            </Modal>
        )}
      </div>
  );
}

export default InstituicoesScreen;