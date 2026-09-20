// Tela de Instituições — US01 integrada com a API
import { useState } from "react";
import {
  IconAlertTriangle, IconBuilding, IconCheck, IconChevronDown, IconDroplet,
  IconEdit, IconEye, IconLink, IconMapPin, IconPlus, IconPowerOff,
  IconSearch, IconShield, IconTrash
} from "@/components/icons";
import { allComponents, instTypeOptions, neighborhoods } from "@/data/mockData";
import type { InstStatus, InstType, Institution, ModalMode, UserRole } from "@/types";
import { ActionBtn } from "@/components/Button";
import { Modal } from "@/components/Modal";
import { InfoCell } from "@/pages/Transferencias";

export default function InstituicoesScreen({
  role,
  institutions,
  setInstitutions,
  newInstId,
  onNavigateToAdd,
  onNavigateToRegistrarLote,
  onNavigateToEstoque
}: {
  role: UserRole;
  institutions: Institution[];
  setInstitutions: React.Dispatch<React.SetStateAction<Institution[]>>;
  newInstId: number | null;
  onNavigateToAdd: () => void;
  onNavigateToRegistrarLote: (instId?: number) => void;
  onNavigateToEstoque: (instId: number) => void;
}) {
  const [search, setSearch] = useState("");
  const [filterType, setFilterType] = useState<InstType | "">("");
  const [filterStatus, setFilterStatus] = useState<InstStatus | "">("");
  const [filterNeighborhood, setFilterNeighborhood] = useState("");
  const [modal, setModal] = useState<ModalMode>(null);
  const [selected, setSelected] = useState<Institution | null>(null);

  const [form, setForm] = useState({
    name: "",
    type: "Hospital Público" as InstType,
    location: "",
    neighborhood: "Boa Vista",
    status: "ativa" as InstStatus,
    components: [] as string[],
    relations: 0,
  });

  const canAdd = role === "admin_rede" || role === "admin_principal";
  const canEdit = role === "admin_rede" || role === "admin_principal";
  const canDeactivate = role === "admin_rede" || role === "admin_principal";
  const canDelete = role === "admin_principal";

  const filtered = institutions.filter((inst) => {
    const matchSearch = inst.name.toLowerCase().includes(search.toLowerCase());
    const matchType = filterType === "" || inst.type === filterType;
    const matchStatus = filterStatus === "" || inst.status === filterStatus;
    const matchNeighborhood = filterNeighborhood === "" || inst.neighborhood === filterNeighborhood;
    return matchSearch && matchType && matchStatus && matchNeighborhood;
  });

  function openView(inst: Institution) { setSelected(inst); setModal("view"); }

  function openEdit(inst: Institution) {
    setForm({
      name: inst.name,
      type: inst.type,
      location: inst.location,
      neighborhood: inst.neighborhood,
      status: inst.status,
      components: inst.components,
      relations: inst.relations
    });
    setSelected(inst);
    setModal("edit");
  }

  function openDeactivate(inst: Institution) { setSelected(inst); setModal("deactivate"); }
  function openDelete(inst: Institution) { setSelected(inst); setModal("delete"); }
  function closeModal() { setModal(null); setSelected(null); }

  async function handleSave() {
    if (modal === "edit" && selected) {
      try {
        // Tenta atualizar no backend via PUT
        await fetch(`http://localhost:8080/api/v1/instituicoes/${selected.id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            nome: form.name,
            tipo: form.type,
            endereco: form.location,
            latitude: -8.0539,
            longitude: -34.8811
          }),
        });
      } catch (err) {
        console.warn("Aviso ao atualizar no backend:", err);
      }
      setInstitutions((prev) => prev.map((i) => i.id === selected.id ? { ...i, ...form } : i));
    }
    closeModal();
  }

  async function handleDeactivate() {
    if (!selected) return;
    setInstitutions((prev) => prev.map((i) => i.id === selected.id ? { ...i, status: "inativa" } : i));
    closeModal();
  }

  async function handleDelete() {
    if (!selected) return;
    try {
      // Tenta remover no backend via DELETE
      await fetch(`http://localhost:8080/api/v1/instituicoes/${selected.id}`, {
        method: "DELETE"
      });
    } catch (err) {
      console.warn("Aviso ao excluir no backend:", err);
    }
    setInstitutions((prev) => prev.filter((i) => i.id !== selected.id));
    closeModal();
  }

  const instStatusCfg: Record<InstStatus, { label: string; badge: string; dot: string }> = {
    ativa:      { label: "Ativa",       badge: "bg-emerald-50 text-emerald-700",  dot: "bg-emerald-400" },
    inativa:    { label: "Inativa",     badge: "bg-slate-100 text-slate-500",     dot: "bg-slate-300"  },
    em_analise: { label: "Em análise",  badge: "bg-amber-50 text-amber-700",     dot: "bg-amber-400"  },
  };

  const typeBadge: Record<InstType, string> = {
    "Hospital Público":  "bg-blue-50 text-blue-700",
    "Hospital Privado":  "bg-violet-50 text-violet-700",
    "UPA":               "bg-orange-50 text-orange-700",
    "Hemocentro":        "bg-[#FFF0F2] text-[#C8102E]",
    "Maternidade":       "bg-pink-50 text-pink-700",
    "Clínica":           "bg-teal-50 text-teal-700",
  };

  return (
    <div className="px-8 py-7">
      {/* Toolbar */}
      <div className="flex items-center gap-3 mb-5 flex-wrap">
        <div className="relative flex-1 min-w-52">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"><IconSearch size={15} /></span>
          <input
            type="text"
            placeholder="Buscar instituição..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 rounded-lg border border-slate-200 text-[13px] focus:outline-none focus:ring-2 focus:ring-[#C8102E]/20 focus:border-[#C8102E]/50 bg-white placeholder-slate-400"
          />
        </div>

        <div className="relative">
          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value as InstType | "")}
            className="appearance-none pl-3 pr-8 py-2 rounded-lg border border-slate-200 text-[13px] text-slate-600 bg-white focus:outline-none focus:ring-2 focus:ring-[#C8102E]/20 cursor-pointer"
          >
            <option value="">Tipo: Todos</option>
            {instTypeOptions.map((t) => <option key={t} value={t}>{t}</option>)}
          </select>
          <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none"><IconChevronDown size={13} /></span>
        </div>

        <div className="relative">
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value as InstStatus | "")}
            className="appearance-none pl-3 pr-8 py-2 rounded-lg border border-slate-200 text-[13px] text-slate-600 bg-white focus:outline-none focus:ring-2 focus:ring-[#C8102E]/20 cursor-pointer"
          >
            <option value="">Status: Todos</option>
            <option value="ativa">Ativa</option>
            <option value="inativa">Inativa</option>
            <option value="em_analise">Em análise</option>
          </select>
          <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none"><IconChevronDown size={13} /></span>
        </div>

        <div className="relative">
          <select
            value={filterNeighborhood}
            onChange={(e) => setFilterNeighborhood(e.target.value)}
            className="appearance-none pl-3 pr-8 py-2 rounded-lg border border-slate-200 text-[13px] text-slate-600 bg-white focus:outline-none focus:ring-2 focus:ring-[#C8102E]/20 cursor-pointer"
          >
            <option value="">Localização: Todas</option>
            {neighborhoods.map((n) => <option key={n} value={n}>{n}</option>)}
          </select>
          <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none"><IconChevronDown size={13} /></span>
        </div>

        <button
          onClick={() => onNavigateToRegistrarLote()}
          className={`${canAdd ? "" : "ml-auto"} flex items-center gap-2 px-4 py-2 rounded-lg border border-slate-200 text-slate-600 text-[13px] font-medium hover:bg-slate-50 transition-colors`}
        >
          <IconPlus size={15} /> Registrar Lote
        </button>

        {canAdd && (
          <button
            onClick={onNavigateToAdd}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-[#C8102E] text-white text-[13px] font-semibold hover:bg-[#a00d24] transition-colors"
          >
            <IconPlus size={15} /> Nova Instituição
          </button>
        )}
      </div>

      {/* Summary chips */}
      <div className="flex items-center gap-2 mb-4 text-[12px] text-slate-500">
        <span className="font-semibold text-slate-700">{filtered.length}</span> instituição(ões) encontrada(s)
        <span className="mx-1 text-slate-200">|</span>
        <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-emerald-400 inline-block"></span>{institutions.filter(i=>i.status==="ativa").length} ativas</span>
        <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-slate-300 inline-block"></span>{institutions.filter(i=>i.status==="inativa").length} inativas</span>
        <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-amber-400 inline-block"></span>{institutions.filter(i=>i.status==="em_analise").length} em análise</span>
        {role !== "operador" && <span className="ml-2 text-[11px] px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 font-medium flex items-center gap-1"><IconShield size={11} />Modo edição ativo</span>}
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-slate-100 overflow-hidden">
        <div className="grid gap-4 px-5 py-3 bg-slate-50 border-b border-slate-100 text-[11px] font-semibold text-slate-400 uppercase tracking-widest"
          style={{ gridTemplateColumns: "2fr 1fr 1.5fr 1fr 80px 130px" }}>
          <div>Instituição</div>
          <div>Tipo</div>
          <div>Localização</div>
          <div>Status</div>
          <div className="text-center">Relações</div>
          <div className="text-right">Ações</div>
        </div>

        {filtered.length === 0 ? (
          <div className="py-16 text-center text-slate-400">
            <IconBuilding size={32} />
            <div className="mt-3 text-[13px]">Nenhuma instituição encontrada</div>
          </div>
        ) : (
          filtered.map((inst) => {
            const sc = instStatusCfg[inst.status];
            const canHardDelete = canDelete && !inst.hasHistory && inst.relations === 0 && inst.status === "inativa";
            return (
              <div
                key={inst.id}
                className={`grid gap-4 px-5 py-4 items-center border-b border-slate-50 last:border-0 hover:bg-slate-50/60 transition-colors ${inst.status === "inativa" ? "opacity-70" : ""}`}
                style={{ gridTemplateColumns: "2fr 1fr 1.5fr 1fr 80px 130px" }}
              >
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <div className="text-[13.5px] font-semibold text-slate-800 truncate">{inst.name}</div>
                    {newInstId === inst.id && (
                      <span className="flex-shrink-0 text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-emerald-500 text-white animate-pulse">Nova</span>
                    )}
                  </div>
                  <div className="text-[11px] text-slate-400 mt-0.5 flex items-center gap-1 truncate">
                    <IconDroplet size={10} />
                    {inst.components.slice(0, 4).join(" • ")}{inst.components.length > 4 ? ` +${inst.components.length - 4}` : ""}
                  </div>
                </div>

                <div>
                  <span className={`text-[11px] font-medium px-2 py-0.5 rounded-full ${typeBadge[inst.type]}`}>{inst.type}</span>
                </div>

                <div className="min-w-0">
                  <div className="text-[12px] text-slate-600 truncate flex items-center gap-1">
                    <span className="flex-shrink-0"><IconMapPin size={11} /></span>{inst.neighborhood}
                  </div>
                  <div className="text-[11px] text-slate-400 truncate mt-0.5">{inst.location}</div>
                </div>

                <div>
                  <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full flex items-center gap-1.5 w-fit ${sc.badge}`}>
                    <span className={`w-1.5 h-1.5 rounded-full ${sc.dot}`}></span>{sc.label}
                  </span>
                </div>

                <div className="text-center">
                  <span className={`text-[13px] font-semibold flex items-center justify-center gap-1 ${inst.relations > 0 ? "text-slate-700" : "text-slate-300"}`}>
                    <IconLink size={12} />{inst.relations}
                  </span>
                </div>

                <div className="flex items-center justify-end gap-1">
                  <ActionBtn title="Visualizar" onClick={() => openView(inst)} color="text-slate-500 hover:text-blue-600 hover:bg-blue-50">
                    <IconEye size={14} />
                  </ActionBtn>

                  {canEdit && inst.status !== "inativa" && (
                    <ActionBtn title="Editar" onClick={() => openEdit(inst)} color="text-slate-500 hover:text-slate-800 hover:bg-slate-100">
                      <IconEdit size={14} />
                    </ActionBtn>
                  )}

                  {canDeactivate && inst.status !== "inativa" && (
                    <ActionBtn title="Desativar" onClick={() => openDeactivate(inst)} color="text-slate-500 hover:text-amber-600 hover:bg-amber-50">
                      <IconPowerOff size={14} />
                    </ActionBtn>
                  )}

                  {canDelete && (
                    <ActionBtn
                      title={canHardDelete ? "Excluir definitivamente" : "Exclusão bloqueada — possui vínculos"}
                      onClick={canHardDelete ? () => openDelete(inst) : undefined}
                      color={canHardDelete ? "text-slate-500 hover:text-[#C8102E] hover:bg-[#FFF0F2]" : "text-slate-200 cursor-not-allowed"}
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

      {/* View Modal */}
      {modal === "view" && selected && (
        <Modal onClose={closeModal} title="Detalhes da Instituição" width="max-w-lg">
          <div className="space-y-4">
            <div className="flex items-start justify-between">
              <div>
                <h3 className="text-[16px] font-semibold text-slate-800">{selected.name}</h3>
                <span className={`text-[11px] font-medium px-2 py-0.5 rounded-full mt-1 inline-block ${typeBadge[selected.type]}`}>{selected.type}</span>
              </div>
              <span className={`text-[11px] font-semibold px-2.5 py-1 rounded-full flex items-center gap-1.5 ${instStatusCfg[selected.status].badge}`}>
                <span className={`w-1.5 h-1.5 rounded-full ${instStatusCfg[selected.status].dot}`}></span>
                {instStatusCfg[selected.status].label}
              </span>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <InfoCell icon={<IconMapPin size={14}/>} label="Bairro" value={selected.neighborhood} />
              <InfoCell icon={<IconLink size={14}/>} label="Relações de fornecimento" value={`${selected.relations} relações`} />
            </div>
            <div className="bg-slate-50 rounded-lg p-3">
              <div className="text-[10px] text-slate-400 font-semibold uppercase tracking-wide mb-1.5">Endereço</div>
              <div className="text-[13px] text-slate-700">{selected.location}</div>
            </div>
          </div>
          <div className="flex items-center justify-between mt-6">
            <div className="flex items-center gap-2">
              <button
                onClick={() => { closeModal(); onNavigateToEstoque(selected.id); }}
                className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg border border-slate-200 text-[12.5px] font-medium text-slate-600 hover:bg-slate-50 transition-colors"
              >
                <IconDroplet size={13} /> Ver Estoque
              </button>
              <button
                onClick={() => { closeModal(); onNavigateToRegistrarLote(selected.id); }}
                className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg border border-[#C8102E]/30 text-[12.5px] font-medium text-[#C8102E] hover:bg-[#FFF0F2] transition-colors"
              >
                <IconPlus size={13} /> Novo Lote
              </button>
            </div>
            <button onClick={closeModal} className="px-4 py-2 rounded-lg border border-slate-200 text-[13px] text-slate-600 hover:bg-slate-50 font-medium">Fechar</button>
          </div>
        </Modal>
      )}

      {/* Edit Modal */}
      {modal === "edit" && (
        <Modal onClose={closeModal} title="Editar Instituição" width="max-w-xl">
          <div className="space-y-4">
            <div>
              <label className="block text-[11px] font-semibold text-slate-500 uppercase tracking-widest mb-1.5">Nome da instituição *</label>
              <input
                type="text"
                value={form.name}
                onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                className="w-full px-3 py-2 rounded-lg border border-slate-200 text-[13px] focus:outline-none focus:ring-2 focus:ring-[#C8102E]/20"
              />
            </div>
            <div>
              <label className="block text-[11px] font-semibold text-slate-500 uppercase tracking-widest mb-1.5">Endereço</label>
              <input
                type="text"
                value={form.location}
                onChange={(e) => setForm((f) => ({ ...f, location: e.target.value }))}
                className="w-full px-3 py-2 rounded-lg border border-slate-200 text-[13px] focus:outline-none focus:ring-2 focus:ring-[#C8102E]/20"
              />
            </div>
          </div>
          <div className="flex justify-end gap-2 mt-6 pt-5 border-t border-slate-100">
            <button onClick={closeModal} className="px-4 py-2 rounded-lg border border-slate-200 text-[13px] text-slate-600 hover:bg-slate-50 font-medium">Cancelar</button>
            <button onClick={handleSave} className="px-5 py-2 rounded-lg bg-[#C8102E] text-white text-[13px] font-semibold hover:bg-[#a00d24]">Salvar</button>
          </div>
        </Modal>
      )}

      {/* Deactivate Modal */}
      {modal === "deactivate" && selected && (
        <Modal onClose={closeModal} title="Desativar Instituição" width="max-w-md">
          <div className="p-4 bg-amber-50 rounded-xl text-[13px] text-amber-800 mb-4">
            Deseja desativar <strong>{selected.name}</strong>? A instituição deixará de participar de novas transferências.
          </div>
          <div className="flex justify-end gap-2">
            <button onClick={closeModal} className="px-4 py-2 rounded-lg border border-slate-200 text-[13px] text-slate-600">Cancelar</button>
            <button onClick={handleDeactivate} className="px-5 py-2 rounded-lg bg-amber-500 text-white text-[13px] font-semibold">Confirmar</button>
          </div>
        </Modal>
      )}

      {/* Delete Modal */}
      {modal === "delete" && selected && (
        <Modal onClose={closeModal} title="Excluir Instituição Definitivamente" width="max-w-md">
          <div className="p-4 bg-[#FFF0F2] rounded-xl text-[13px] text-[#C8102E] mb-4">
            Tem certeza de que deseja excluir <strong>{selected.name}</strong>? Esta ação não pode ser desfeita.
          </div>
          <div className="flex justify-end gap-2">
            <button onClick={closeModal} className="px-4 py-2 rounded-lg border border-slate-200 text-[13px] text-slate-600">Cancelar</button>
            <button onClick={handleDelete} className="px-5 py-2 rounded-lg bg-[#C8102E] text-white text-[13px] font-semibold">Excluir</button>
          </div>
        </Modal>
      )}
    </div>
  );
}