import { IconX } from "../icons";

// ─── InfoCell — shared info row used across multiple screens ──────────────────

export function InfoCell({ icon, label, value, mono = false, good = false }: {
  icon: React.ReactNode; label: string; value: string; mono?: boolean; good?: boolean;
}) {
  return (
    <div className="flex items-start gap-2.5">
      <div className="w-7 h-7 rounded-lg bg-slate-100 flex items-center justify-center text-slate-500 flex-shrink-0 mt-0.5">{icon}</div>
      <div>
        <div className="text-[11px] text-slate-400 font-medium">{label}</div>
        <div className={`text-[14px] font-semibold mt-0.5 ${good ? "text-emerald-600" : "text-slate-800"} ${mono ? "font-mono" : ""}`} style={mono ? { fontFamily: "'JetBrains Mono', monospace" } : {}}>
          {value}
        </div>
      </div>
    </div>
  );
}

// ─── Modal — overlay dialog used in Instituicoes ──────────────────────────────

export function Modal({ title, onClose, children, width = "max-w-lg" }: {
  title: string; onClose: () => void; children: React.ReactNode; width?: string;
}) {
  return (
    <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4" style={{ background: "rgba(15,23,42,0.45)" }}>
      <div className={`bg-white rounded-2xl shadow-2xl w-full ${width} max-h-[90vh] overflow-y-auto`} onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between px-6 py-5 border-b border-slate-100">
          <h2 className="text-[15px] font-semibold text-slate-800">{title}</h2>
          <button onClick={onClose} className="w-7 h-7 rounded-lg hover:bg-slate-100 flex items-center justify-center text-slate-400 transition-colors"><IconX size={15} /></button>
        </div>
        <div className="px-6 py-5">{children}</div>
      </div>
    </div>
  );
}

export default InfoCell;
