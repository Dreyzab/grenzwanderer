interface WidgetErrorFallbackProps {
  error: Error
  onRetry?: () => void
}

export function WidgetErrorFallback({ error, onRetry }: WidgetErrorFallbackProps) {
  return (
    <div className="glass-panel relative overflow-hidden rounded-2xl border border-[color:var(--color-danger)]/40 px-8 py-10 text-center">
      <div className="badge-glow mx-auto mb-5 bg-[linear-gradient(135deg,rgba(249,115,22,0.85),rgba(239,68,68,0.85))] text-[color:var(--color-bg)]">
        Сбой синхронизации
      </div>
      <p className="mb-6 font-mono text-xs uppercase tracking-[0.28em] text-[color:var(--color-text-secondary)]">
        {error.message}
      </p>
      {onRetry && (
        <button
          onClick={onRetry}
          className="inline-flex items-center justify-center rounded-full border border-[color:var(--color-border-strong)]/60 bg-[color:var(--color-surface-elevated)] px-6 py-2 text-xs uppercase tracking-[0.32em] text-[color:var(--color-text-primary)] transition hover:border-[color:var(--color-cyan)]/70 hover:text-[color:var(--color-cyan)]"
        >
          Повторить
        </button>
      )}
    </div>
  )
}

