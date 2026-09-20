// ─── Badge — colored status chip/pill ─────────────────────────────────────────

export function Badge({ className, children }: { className: string; children: React.ReactNode }) {
  return (
    <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full inline-flex items-center gap-1.5 ${className}`}>
      {children}
    </span>
  );
}

export default Badge;
