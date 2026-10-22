// Tela de Login — US01

import { useState } from "react";
import { IconAlertTriangle, IconDroplet, IconEye } from "@/components/icons";
import { DEMO_USERS } from "@/data/mockData";
import type { AppUser } from "@/types";

type Perfil = "gestor" | "unidade";

const PERFIL_CFG = {
  gestor: {
    label: "Gestor da Rede",
    sub: "Hemocentro / Coordenação",
    fieldLabel: "E-mail / Matrícula",
    credential: "gestor@hemope.pe.gov.br",
    password: "Gestor@2026",
  },
  unidade: {
    label: "Unidade Solicitante",
    sub: "Hospital / UPA / Clínica",
    fieldLabel: "CNES / E-mail da Unidade",
    credential: "hospital@restauracao.pe.gov.br",
    password: "Hospital@2026",
  },
} as const;

export default function LoginScreen({ onLogin }: { onLogin: (u: AppUser) => void }) {
  const [perfil, setPerfil] = useState<Perfil>("gestor");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);

  const cfg = PERFIL_CFG[perfil];

  function switchPerfil(p: Perfil) {
    setPerfil(p);
    setEmail("");
    setPassword("");
    setError("");
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (!email || !password) {
      setError("Preencha todos os campos para continuar.");
      return;
    }
    setLoading(true);

    setTimeout(() => {
      const expectedEmail = cfg.credential.toLowerCase();
      const expectedPass = cfg.password;

      if (email.toLowerCase().trim() === expectedEmail && password === expectedPass) {
        // Busca o utilizador ou usa o perfil padrão caso não esteja explicitamente no DEMO_USERS
        const user: AppUser = DEMO_USERS.find((u) => u.email.toLowerCase() === expectedEmail) || {
          email: cfg.credential,
          name: perfil === "gestor" ? "Dr. Carlos Andrade" : "Coordenação Hospitalar",
          title: perfil === "gestor" ? "Gestor da Rede" : "Responsável Técnico",
          role: perfil === "gestor" ? "admin_principal" : "operador",
          roleLabel: perfil === "gestor" ? "Administrador Principal" : "Operador",
          roleBadge: "bg-[#FFF0F2] text-[#C8102E]",
          initials: perfil === "gestor" ? "CA" : "CH",
        };

        try {
          localStorage.setItem("cv_user_role", user.role);
          localStorage.setItem("cv_user_data", JSON.stringify(user));
        } catch {
          // localStorage indisponível no ambiente de teste
        }

        onLogin(user);
        return;
      }

      setError("E-mail/CNES ou senha inválidos. Verifique suas credenciais e tente novamente.");
      setLoading(false);
    }, 300);
  }

  return (
    <div className="h-full flex bg-[#F8F9FC]" style={{ fontFamily: "'DM Sans', sans-serif" }}>
      {/* ── Left panel ── */}
      <div className="w-[440px] flex-shrink-0 bg-white border-r border-slate-100 flex flex-col justify-between px-10 py-12">
        <div>
          {/* Logo */}
          <div className="flex items-center gap-3 mb-10">
            <div className="w-10 h-10 rounded-xl bg-[#C8102E] flex items-center justify-center shadow-md">
              <IconDroplet size={20} />
            </div>
            <div>
              <div className="text-[15px] leading-tight font-bold text-[#C8102E]" style={{ letterSpacing: "0.05em" }}>CÓDIGO</div>
              <div className="text-[15px] leading-tight font-bold text-slate-900" style={{ letterSpacing: "0.05em" }}>VERMELHO</div>
            </div>
          </div>

          <h1 className="text-[24px] font-semibold text-slate-900 leading-tight mb-1">Bem-vindo de volta</h1>
          <p className="text-[13.5px] text-slate-400 mb-7">Selecione seu perfil e acesse o sistema.</p>

          {/* Profile selector */}
          <div className="grid grid-cols-2 gap-2 mb-6">
            {(["gestor", "unidade"] as Perfil[]).map((p) => {
              const active = perfil === p;
              const c = PERFIL_CFG[p];
              return (
                <button
                  key={p}
                  type="button"
                  onClick={() => switchPerfil(p)}
                  className={[
                    "rounded-lg border text-left px-3.5 py-3 transition-all",
                    active
                      ? "border-[#C8102E]/40 bg-[#FFF0F2]"
                      : "border-slate-200 bg-slate-50 hover:border-slate-300 hover:bg-slate-100",
                  ].join(" ")}
                >
                  <div className={`text-[12px] font-bold leading-tight ${active ? "text-[#C8102E]" : "text-slate-600"}`}>
                    {c.label}
                  </div>
                  <div className="text-[10.5px] text-slate-400 mt-0.5">{c.sub}</div>
                </button>
              );
            })}
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-[11px] font-semibold text-slate-500 uppercase tracking-widest mb-1.5">
                {cfg.fieldLabel}
              </label>
              <input
                type="text"
                autoComplete="email"
                value={email}
                onChange={(e) => { setEmail(e.target.value); setError(""); }}
                placeholder={cfg.credential}
                className="w-full px-3.5 py-2.5 rounded-lg border border-slate-200 text-[13.5px] placeholder-slate-300 focus:outline-none focus:ring-2 focus:ring-[#C8102E]/20 focus:border-[#C8102E]/60 transition-all"
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-[11px] font-semibold text-slate-500 uppercase tracking-widest">Senha</label>
                <button type="button" className="text-[11.5px] text-[#C8102E] hover:underline font-medium">
                  Esqueci minha senha
                </button>
              </div>
              <div className="relative">
                <input
                  type={showPass ? "text" : "password"}
                  autoComplete="current-password"
                  value={password}
                  onChange={(e) => { setPassword(e.target.value); setError(""); }}
                  placeholder={cfg.password}
                  className="w-full px-3.5 py-2.5 pr-10 rounded-lg border border-slate-200 text-[13.5px] placeholder-slate-300 focus:outline-none focus:ring-2 focus:ring-[#C8102E]/20 focus:border-[#C8102E]/60 transition-all"
                />
                <button
                  type="button"
                  onClick={() => setShowPass((v) => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
                >
                  <IconEye size={15} />
                </button>
              </div>
            </div>

            {error && (
              <div className="flex items-start gap-2 bg-[#FFF0F2] text-[#C8102E] text-[12.5px] px-3.5 py-2.5 rounded-lg border border-[#F9D7DC]">
                <span className="mt-0.5 flex-shrink-0"><IconAlertTriangle size={14} /></span>
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 rounded-lg bg-[#C8102E] text-white text-[13.5px] font-semibold hover:bg-[#a00d24] transition-colors disabled:opacity-60 flex items-center justify-center gap-2 mt-1"
            >
              {loading
                ? <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin inline-block" />
                : "Entrar no Sistema"}
            </button>
          </form>
        </div>

        {/* Footer links */}
        <div className="mt-8 pt-5 border-t border-slate-100 flex items-center justify-center gap-4 text-[11.5px] text-slate-300">
          <button type="button" className="hover:text-slate-500 transition-colors">Suporte</button>
          <span>·</span>
          <button type="button" className="hover:text-slate-500 transition-colors">Termos de uso</button>
        </div>
      </div>

      {/* ── Right decorative panel ── */}
      <div className="flex-1 flex flex-col items-center justify-center p-12 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-[#C8102E]/5 via-transparent to-transparent pointer-events-none" />
        <div className="absolute top-0 right-0 w-96 h-96 rounded-full bg-[#C8102E]/5 -translate-y-1/2 translate-x-1/3 pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-64 h-64 rounded-full bg-[#C8102E]/4 translate-y-1/3 -translate-x-1/4 pointer-events-none" />

        <div className="relative max-w-md text-center space-y-5">
          <div className="w-16 h-16 rounded-2xl bg-white border border-slate-100 shadow-lg flex items-center justify-center mx-auto">
            <IconDroplet size={28} />
          </div>
          <div>
            <h2 className="text-[22px] font-semibold text-slate-800 mb-2">Inteligência Logística</h2>
            <p className="text-[14px] text-slate-500 leading-relaxed">
              Gerencie estoques, redistribuições e transferências de hemocomponentes em tempo real entre as instituições da rede.
            </p>
          </div>
          <div className="grid grid-cols-3 gap-3 pt-2">
            {[["18","Instituições conectadas"],["212","Unidades disponíveis"],["5","Em transporte agora"]].map(([v, l]) => (
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
