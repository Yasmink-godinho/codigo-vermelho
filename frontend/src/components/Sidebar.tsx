// Sidebar — navegação principal

import { IconDroplet, IconPowerOff } from "@/components/icons";
import type { AppUser, Screen } from "@/types";

export interface NavItem {
  id: Screen;
  label: string;
  icon: React.ReactNode;
  adminRedeDot?: boolean;
  adminOnly?: boolean;
}

export function Sidebar({ navItems, screen, setScreen, currentUser, onLogout, reqSub, instSub }: {
  navItems: NavItem[];
  screen: Screen;
  setScreen: (s: Screen) => void;
  currentUser: AppUser;
  onLogout: () => void;
  reqSub: Screen[];
  instSub: Screen[];
}) {
  return (
    <aside className="w-64 flex-shrink-0 bg-white border-r border-slate-100 flex flex-col">
      {/* Logo */}
      <div className="px-6 py-5 border-b border-slate-100">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-[#C8102E] flex items-center justify-center">
            <IconDroplet size={16} />
          </div>
          <div>
            <div className="text-[13px] font-700 text-[#C8102E] tracking-wide leading-tight" style={{ fontWeight: 700, letterSpacing: "0.04em" }}>CÓDIGO</div>
            <div className="text-[13px] font-700 text-slate-900 tracking-wide leading-tight" style={{ fontWeight: 700, letterSpacing: "0.04em" }}>VERMELHO</div>
          </div>
        </div>
        <div className="mt-2.5 text-[11px] text-slate-400 font-medium tracking-wide uppercase">Inteligência Logística</div>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 space-y-0.5">
        {navItems.map((item) => {
          const REQ_SUB = reqSub;
          const INST_SUB = instSub;
          const active = screen === item.id
            || (INST_SUB.includes(screen) && item.id === "instituicoes")
            || (REQ_SUB.includes(screen) && item.id === "requisicoes");
          const adminRedeAccent = !active && item.adminRedeDot && currentUser.role === "admin_rede";
          return (
            <button
              key={item.id}
              onClick={() => setScreen(item.id)}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-[13.5px] font-medium transition-all text-left ${
                active
                  ? "bg-[#FFF0F2] text-[#C8102E]"
                  : adminRedeAccent
                  ? "bg-[#FFF0F2]/60 text-[#C8102E]/80 hover:bg-[#FFF0F2] hover:text-[#C8102E]"
                  : "text-slate-500 hover:bg-slate-50 hover:text-slate-700"
              }`}
            >
              <span className={active || adminRedeAccent ? "text-[#C8102E]" : "text-slate-400"}>{item.icon}</span>
              {item.label}
              {item.id === "alertas" && (
                <span className="ml-auto bg-[#C8102E] text-white text-[10px] font-semibold rounded-full w-5 h-5 flex items-center justify-center">3</span>
              )}
              {adminRedeAccent && (
                <span className="ml-auto w-1.5 h-1.5 rounded-full bg-[#C8102E]/60 flex-shrink-0"></span>
              )}
            </button>
          );
        })}
      </nav>

      {/* Footer — user info */}
      <div className="px-4 py-4 border-t border-slate-100">
        <div className="flex items-center gap-2.5 px-2">
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#C8102E] to-[#9B0D23] flex items-center justify-center text-white text-[11px] font-bold flex-shrink-0">
            {currentUser.initials}
          </div>
          <div className="min-w-0">
            <div className="text-[12px] font-semibold text-slate-700 truncate">{currentUser.name}</div>
            <div className={`text-[10px] font-medium px-1.5 py-0.5 rounded-full inline-block mt-0.5 ${currentUser.roleBadge}`}>{currentUser.roleLabel}</div>
          </div>
        </div>
        <button
          onClick={onLogout}
          className="mt-3 w-full flex items-center gap-2 px-3 py-1.5 rounded-lg text-[12px] text-slate-400 hover:bg-slate-50 hover:text-slate-600 transition-colors"
        >
          <IconPowerOff size={13} /> Sair da conta
        </button>
      </div>
    </aside>
  );
}

export default Sidebar;
