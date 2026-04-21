import { QrCode, ScanLine } from "lucide-react";
import type { EntryGateState } from "../types";

interface KarlsruheQrGateProps {
  state: EntryGateState;
  errorMessage?: string | null;
  hasGrant: boolean;
}

const resolveStatusLabel = (
  state: EntryGateState,
  errorMessage?: string | null,
): string | null => {
  if (state === "validating") {
    return "Validating event access...";
  }
  if (state === "denied") {
    return errorMessage ?? "This Karlsruhe QR token is not valid.";
  }
  return null;
};

export const KarlsruheQrGate = ({
  state,
  errorMessage,
  hasGrant,
}: KarlsruheQrGateProps) => {
  const statusLabel = resolveStatusLabel(state, errorMessage);

  return (
    <div className="min-h-[100dvh] bg-stone-950 text-stone-100 flex items-center justify-center p-6 relative overflow-hidden">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(212,167,79,0.14),transparent_40%),linear-gradient(180deg,rgba(28,25,23,0.96),rgba(12,10,9,1))]" />
      <div className="absolute inset-0 bg-[url('/images/paper-texture.png')] opacity-[0.06] mix-blend-screen" />
      <section className="relative z-10 w-full max-w-xl rounded-[32px] border border-amber-800/30 bg-stone-950/80 shadow-[0_30px_120px_rgba(0,0,0,0.45)] backdrop-blur-xl p-8 md:p-10">
        <div className="flex items-center gap-4 mb-6">
          <div className="h-14 w-14 rounded-2xl border border-amber-700/40 bg-amber-500/10 flex items-center justify-center">
            <QrCode className="h-7 w-7 text-amber-300" strokeWidth={2.2} />
          </div>
          <div>
            <p className="m-0 text-[11px] uppercase tracking-[0.35em] text-amber-300/80">
              Karlsruhe Event
            </p>
            <h1 className="m-0 text-3xl font-semibold tracking-tight text-stone-50">
              Scan QR to Enter
            </h1>
          </div>
        </div>

        <p className="m-0 text-sm leading-6 text-stone-300">
          Access to the Karlsruhe release is gated behind an event deep link.
          Open the QR code on this device to continue into the event build.
        </p>

        <div className="mt-8 rounded-[28px] border border-stone-800 bg-stone-900/80 p-8 flex flex-col items-center justify-center gap-5">
          <div className="relative h-48 w-48 rounded-[28px] border border-amber-700/40 bg-stone-950 flex items-center justify-center">
            <div className="absolute inset-5 rounded-[20px] border border-dashed border-amber-600/35" />
            <ScanLine className="h-24 w-24 text-amber-200/90" strokeWidth={1.6} />
          </div>
          <div className="text-center">
            <p className="m-0 text-sm text-stone-200">
              Expected route: <span className="font-mono">/karlsruhe?entry=&lt;token&gt;</span>
            </p>
            {hasGrant ? (
              <p className="m-0 mt-2 text-xs text-emerald-300/80">
                Event grant found on this device. Open{" "}
                <span className="font-mono">/karlsruhe</span> to resume.
              </p>
            ) : null}
          </div>
        </div>

        {statusLabel ? (
          <div
            className={`mt-6 rounded-2xl border px-4 py-3 text-sm ${
              state === "denied"
                ? "border-rose-800/50 bg-rose-950/50 text-rose-200"
                : "border-amber-800/40 bg-amber-950/30 text-amber-100"
            }`}
          >
            {statusLabel}
          </div>
        ) : null}
      </section>
    </div>
  );
};
