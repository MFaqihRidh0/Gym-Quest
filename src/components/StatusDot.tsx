interface StatusDotProps {
  state: 'active' | 'pending' | 'neutral';
  label: string;
}

const STYLES = {
  active: 'bg-cyan shadow-[var(--glow-cyan)]',
  pending: 'bg-amber shadow-[var(--glow-amber)] animate-dot-pulse',
  neutral: 'bg-muted',
} as const;

const STATE_TEXT = {
  active: 'terdeteksi',
  pending: 'belum terlihat',
  neutral: 'menunggu',
} as const;

export function StatusDot({ state, label }: StatusDotProps) {
  return (
    <div className="flex items-center justify-between gap-3 py-1">
      <span className="font-body text-sm text-primary">{label}</span>
      <span className="flex items-center gap-2">
        <span className="font-mono text-[11px] text-muted">{STATE_TEXT[state]}</span>
        <span className={`h-2.5 w-2.5 rounded-full ${STYLES[state]}`} />
      </span>
    </div>
  );
}
