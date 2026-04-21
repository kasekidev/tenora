// Tenora — wordmark brutalist (Teko + dot acid)
export function TenoraLogo({ className = "", showDot = true }: { className?: string; showDot?: boolean }) {
  return (
    <span
      className={`font-display font-bold uppercase tracking-[0.08em] leading-none select-none ${className}`}
    >
      Tenora{showDot && <span className="text-primary">.</span>}
    </span>
  );
}
