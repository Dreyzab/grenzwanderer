import { useState } from "react";

interface PonderPanelProps {
  /** Ask the parliament; the parent injects the answer into the log + persists. */
  onAsk: (prompt: string) => void;
  /** AI request in flight — block input and show a thinking hint. */
  thinking: boolean;
  disabled?: boolean;
  label?: string;
}

// "Обдумать": player types a question; on submit the parent generates the answer
// (real AI or local fallback), injects it into the VN log as inner-voice segments
// above the choices, and persists the prompt+result.
export function PonderPanel({
  onAsk,
  thinking,
  disabled = false,
  label = "Обдумать",
}: PonderPanelProps) {
  const [open, setOpen] = useState(false);
  const [prompt, setPrompt] = useState("");

  const handleAsk = () => {
    const trimmedPrompt = prompt.trim();
    if (!trimmedPrompt || thinking) {
      return;
    }
    onAsk(trimmedPrompt);
    setPrompt("");
  };

  if (!open) {
    return (
      <button
        type="button"
        className="mt-1 self-start border border-violet-400/35 bg-violet-500/8 px-3 py-2 text-left text-xs uppercase tracking-[0.16em] text-violet-100/85 transition-colors hover:bg-violet-500/16 disabled:cursor-not-allowed disabled:opacity-50"
        onClick={() => setOpen(true)}
        disabled={disabled}
      >
        {label}
      </button>
    );
  }

  return (
    <div className="mt-1 flex flex-col gap-2 border border-violet-400/25 bg-black/30 p-3">
      <textarea
        className="w-full resize-none bg-black/40 px-3 py-2 text-sm text-stone-100 outline-none placeholder:text-stone-400/60 disabled:opacity-60"
        rows={2}
        placeholder="Почему он застыл? Я плохая мать?"
        value={prompt}
        disabled={thinking}
        onChange={(event) => setPrompt(event.target.value)}
        onKeyDown={(event) => {
          if (event.key === "Enter" && (event.metaKey || event.ctrlKey)) {
            event.preventDefault();
            handleAsk();
          }
        }}
      />

      <div className="flex items-center gap-2">
        <button
          type="button"
          className="border border-violet-400/40 bg-violet-500/14 px-3 py-2 text-xs uppercase tracking-[0.16em] text-violet-100 transition-colors hover:bg-violet-500/24 disabled:cursor-not-allowed disabled:opacity-50"
          onClick={handleAsk}
          disabled={disabled || thinking || prompt.trim().length === 0}
        >
          Спросить
        </button>
        <button
          type="button"
          className="px-3 py-2 text-xs uppercase tracking-[0.16em] text-stone-400/70 transition-colors hover:text-stone-200"
          onClick={() => setOpen(false)}
        >
          Закрыть
        </button>
        {thinking ? (
          <span className="text-xs italic text-violet-200/70">
            Голоса думают…
          </span>
        ) : null}
      </div>
    </div>
  );
}
