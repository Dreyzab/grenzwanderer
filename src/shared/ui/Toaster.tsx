import { useToast, type ToastType } from "../hooks/useToast";

const typeStyles: Record<ToastType, string> = {
  fact: "border-amber-500/60 bg-amber-950/90 text-amber-100",
  reward: "border-emerald-500/60 bg-emerald-950/90 text-emerald-100",
  info: "border-stone-500/60 bg-stone-900/90 text-stone-200",
};

const typeIcons: Record<ToastType, string> = {
  fact: "!",
  reward: "+",
  info: "i",
};

export const Toaster = () => {
  const { toasts, dismissToast } = useToast();

  if (toasts.length === 0) {
    return null;
  }

  return (
    <div
      className="fixed top-4 right-4 z-[100] flex flex-col gap-2 pointer-events-none"
      aria-live="polite"
      aria-atomic="false"
    >
      {toasts.map((toast) => (
        <div
          key={toast.id}
          className={`pointer-events-auto flex items-start gap-3 px-4 py-3 rounded-lg border backdrop-blur-md shadow-xl max-w-sm animate-[slideIn_0.3s_ease-out] ${typeStyles[toast.type]}`}
          data-toast-source={toast.source}
        >
          <span className="text-lg shrink-0" aria-hidden="true">
            {typeIcons[toast.type]}
          </span>
          <p className="text-sm font-medium leading-snug flex-1">
            {toast.message}
          </p>
          <button
            type="button"
            onClick={() => dismissToast(toast.id)}
            className="shrink-0 text-current opacity-50 hover:opacity-100 transition-opacity bg-transparent border-none shadow-none p-0 text-sm leading-none"
            aria-label="Dismiss notification"
          >
            x
          </button>
        </div>
      ))}
    </div>
  );
};
