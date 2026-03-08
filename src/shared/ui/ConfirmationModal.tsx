interface ConfirmationModalProps {
  title: string;
  description: string;
  confirmLabel: string;
  cancelLabel?: string;
  disabled?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export const ConfirmationModal = ({
  title,
  description,
  confirmLabel,
  cancelLabel = "Cancel",
  disabled = false,
  onConfirm,
  onCancel,
}: ConfirmationModalProps) => (
  <div
    className="fixed inset-0 z-[70] flex items-center justify-center bg-black/80 px-4 py-6 backdrop-blur-sm"
    role="dialog"
    aria-modal="true"
    aria-labelledby="confirmation-modal-title"
  >
    <div className="relative w-full max-w-md overflow-hidden border border-stone-700/80 bg-[linear-gradient(180deg,rgba(28,25,23,0.98),rgba(12,10,9,0.98))] text-stone-100 shadow-[0_30px_80px_rgba(0,0,0,0.7)]">
      <div className="pointer-events-none absolute inset-0 bg-[url('/images/paper-texture.png')] opacity-[0.06] mix-blend-screen" />
      <div className="pointer-events-none absolute inset-x-0 top-0 h-24 bg-[radial-gradient(circle_at_top,rgba(180,83,9,0.24),transparent_70%)]" />

      <div className="relative p-6">
        <p className="mb-3 text-[11px] uppercase tracking-[0.32em] text-amber-300/80">
          Confirm Destructive Action
        </p>
        <h2
          id="confirmation-modal-title"
          className="text-2xl font-semibold uppercase tracking-[0.04em] text-stone-100"
        >
          {title}
        </h2>
        <p className="mt-3 text-sm leading-6 text-stone-300">{description}</p>

        <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:justify-end">
          <button
            type="button"
            onClick={onCancel}
            className="h-11 border border-stone-600 bg-stone-900/70 px-4 text-xs font-semibold uppercase tracking-[0.16em] text-stone-100 transition-colors hover:bg-stone-800"
          >
            {cancelLabel}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={disabled}
            className="h-11 border border-amber-700 bg-amber-700/90 px-4 text-xs font-semibold uppercase tracking-[0.16em] text-stone-950 transition-colors hover:bg-amber-600 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  </div>
);
