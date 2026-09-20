// ── Shared UI helpers ──────────────────────────────────────────────────────────

export function ActionBtn({ title, onClick, color, disabled = false, children }: {
  title: string; onClick?: () => void; color: string; disabled?: boolean; children: React.ReactNode;
}) {
  return (
    <button
      title={title}
      onClick={disabled ? undefined : onClick}
      disabled={disabled}
      className={`w-7 h-7 rounded-lg flex items-center justify-center transition-all ${color} ${disabled ? "opacity-30" : ""}`}
    >
      {children}
    </button>
  );
}

export default ActionBtn;
