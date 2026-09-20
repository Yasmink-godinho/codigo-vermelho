// Header — barra superior

import { IconBell } from "@/components/icons";
import type { AppUser } from "@/types";

export function Header({ subtitle, title, currentUser }: {
  subtitle: string;
  title: string;
  currentUser: AppUser;
}) {
  return (
    <header className="bg-white border-b border-slate-100 px-8 py-4 flex items-center justify-between flex-shrink-0">
      <div>
        <div className="text-[11px] font-medium text-slate-400 uppercase tracking-widest">{subtitle}</div>
        <h1 className="text-[22px] font-semibold text-slate-900 leading-tight mt-0.5">{title}</h1>
      </div>
      <div className="flex items-center gap-3">
        <div className="relative">
          <button className="w-9 h-9 rounded-lg border border-slate-200 flex items-center justify-center text-slate-500 hover:bg-slate-50 transition-colors">
            <IconBell size={17} />
          </button>
          <span className="absolute -top-1 -right-1 w-4 h-4 bg-[#C8102E] rounded-full text-white text-[9px] font-bold flex items-center justify-center">3</span>
        </div>
        <div className="flex items-center gap-2.5 pl-3 border-l border-slate-200">
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#C8102E] to-[#9B0D23] flex items-center justify-center text-white text-[12px] font-bold">
            {currentUser.initials}
          </div>
          <div className="text-right hidden md:block">
            <div className="text-[12px] font-semibold text-slate-700">{currentUser.name}</div>
            <div className={`text-[10px] font-medium px-1.5 py-0.5 rounded-full inline-block ${currentUser.roleBadge}`}>{currentUser.roleLabel}</div>
          </div>
        </div>
      </div>
    </header>
  );
}

export default Header;
