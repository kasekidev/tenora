// Tenora — wordmark brutalist (Teko + dot acid)
export function TenoraLogo({ className = "", showDot = true }: { className?: string; showDot?: boolean }) {
  return (
    <span
      className={`font-display font-bold uppercase tracking-[0.08em] leading-none select-none ${className}`}
    >
      <span className="group-hover:text-primary transition-colors duration-200">Tenora</span>
      {showDot && <span className="text-primary group-hover:text-foreground transition-colors duration-200">.</span>}
    </span>
  );
}
