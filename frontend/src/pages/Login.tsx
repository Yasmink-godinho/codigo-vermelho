// Tela de Login — US01

import { useState } from "react";
import { IconAlertTriangle, IconDroplet, IconEye } from "@/components/icons";
import { DEMO_USERS } from "@/data/mockData";
import type { AppUser } from "@/types";

export default function LoginScreen({ onLogin }: { onLogin: (u: AppUser) => void }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (!email || !password) { setError("Preencha e-mail e senha."); return; }
    setLoading(true);
    setTimeout(() => {
      const user = DEMO_USERS.find((u) => u.email.toLowerCase() === email.toLowerCase().trim());
      if (user) {
        onLogin(user);
      } else {
        setError("E-mail não reconhecido. Use uma das contas de demonstração abaixo.");
        setLoading(false);
      }
    }, 800);
  }

  return (
    <div className="h-full flex bg-[#F8F9FC]" style={{ fontFamily: "'DM Sans', sans-serif" }}>
      {/* Left panel */}
      <div className="w-[420px] flex-shrink-0 bg-white border-r border-slate-100 flex flex-col justify-between px-10 py-12">
        {/* Logo */}
        <div>
          <div className="flex items-center gap-3 mb-10">
            <div className="w-10 h-10 rounded-xl bg-[#C8102E] flex items-center justify-center shadow-md">
              <IconDroplet size={20} />
            </div>
            <div>
              <div className="text-[15px] leading-tight font-bold text-[#C8102E]" style={{ fontWeight: 700, letterSpacing: "0.05em" }}>CÓDIGO</div>
              <div className="text-[15px] leading-tight font-bold text-slate-900" style={{ fontWeight: 700, letterSpacing: "0.05em" }}>VERMELHO</div>
            </div>
          </div>

          <h1 className="text-[26px] font-semibold text-slate-900 leading-tight mb-1.5">Bem-vindo de volta</h1>
          <p className="text-[14px] text-slate-400 mb-8">Acesse sua conta para continuar monitorando a rede logística.</p>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-[12px] font-semibold text-slate-500 uppercase tracking-widest mb-1.5">E-mail</label>
              <input
                type="email"
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="seu.nome@hemope.pe.gov.br"
                className="w-full px-3.5 py-2.5 rounded-lg border border-slate-200 text-[13.5px] focus:outline-none focus:ring-2 focus:ring-[#C8102E]/20 focus:border-[#C8102E]/60 transition-all"
              />
            </div>
            <div>
              <label className="block text-[12px] font-semibold text-slate-500 uppercase tracking-widest mb-1.5">Senha</label>
              <div className="relative">
                <input
                  type={showPass ? "text" : "password"}
                  autoComplete="current-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full px-3.5 py-2.5 pr-10 rounded-lg border border-slate-200 text-[13.5px] focus:outline-none focus:ring-2 focus:ring-[#C8102E]/20 focus:border-[#C8102E]/60 transition-all"
                />
                <button
                  type="button"
                  onClick={() => setShowPass((v) => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                >
                  <IconEye size={15} />
                </button>
              </div>
            </div>

            {error && (
              <div className="flex items-start gap-2 bg-[#FFF0F2] text-[#C8102E] text-[12.5px] px-3 py-2.5 rounded-lg border border-[#F9D7DC]">
                <span className="mt-0.5 flex-shrink-0"><IconAlertTriangle size={14} /></span>{error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 rounded-lg bg-[#C8102E] text-white text-[14px] font-semibold hover:bg-[#a00d24] transition-colors disabled:opacity-60 flex items-center justify-center gap-2 mt-2"
            >
              {loading ? (
                <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin inline-block"></span>
              ) : "Entrar"}
            </button>

            <button type="button" className="w-full text-center text-[13px] text-[#C8102E] hover:underline mt-1">
              Esqueci minha senha
            </button>
          </form>
        </div>

        {/* Demo accounts */}
        <div className="mt-8 pt-6 border-t border-slate-100">
          <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-widest mb-3">Contas de demonstração</div>
          <div className="space-y-2">
            {DEMO_USERS.map((u) => (
              <button
                key={u.email}
                type="button"
                onClick={() => { setEmail(u.email); setPassword("demo1234"); setError(""); }}
                className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg border border-slate-100 hover:bg-slate-50 hover:border-slate-200 transition-all text-left"
              >
                <div className="w-6 h-6 rounded-full bg-gradient-to-br from-[#C8102E] to-[#9B0D23] flex items-center justify-center text-white text-[9px] font-bold flex-shrink-0">{u.initials}</div>
                <div className="min-w-0 flex-1">
                  <div className="text-[12px] font-semibold text-slate-700 truncate">{u.name}</div>
                  <div className="text-[10px] text-slate-400 truncate">{u.email}</div>
                </div>
                <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded-full flex-shrink-0 ${u.roleBadge}`}>{u.roleLabel}</span>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Right panel — decorative */}
      <div className="flex-1 flex flex-col items-center justify-center p-12 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-[#C8102E]/5 via-transparent to-transparent pointer-events-none"></div>
        <div className="absolute top-0 right-0 w-96 h-96 rounded-full bg-[#C8102E]/5 -translate-y-1/2 translate-x-1/3 pointer-events-none"></div>
        <div className="absolute bottom-0 left-0 w-64 h-64 rounded-full bg-[#C8102E]/4 translate-y-1/3 -translate-x-1/4 pointer-events-none"></div>

        <div className="relative max-w-md text-center space-y-5">
          <div className="w-16 h-16 rounded-2xl bg-white border border-slate-100 shadow-lg flex items-center justify-center mx-auto">
            <IconDroplet size={28} />
          </div>
          <div>
            <h2 className="text-[22px] font-semibold text-slate-800 mb-2">Inteligência Logística</h2>
            <p className="text-[14px] text-slate-500 leading-relaxed">Gerencie estoques, redistribuições e transferências de hemocomponentes em tempo real entre as instituições da rede.</p>
          </div>
          <div className="grid grid-cols-3 gap-3 pt-2">
            {[["18", "Instituições conectadas"],["212","Unidades disponíveis"],["5","Em transporte agora"]].map(([v, l]) => (
              <div key={l} className="bg-white rounded-xl border border-slate-100 p-3 text-center shadow-sm">
                <div className="text-[22px] font-bold text-[#C8102E]" style={{ fontFamily: "'JetBrains Mono', monospace" }}>{v}</div>
                <div className="text-[11px] text-slate-400 mt-0.5 leading-tight">{l}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
