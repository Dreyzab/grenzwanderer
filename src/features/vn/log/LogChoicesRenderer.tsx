import { ArrowRight, Check, Eye, Lock, MessageCircle } from "lucide-react";
import { useState } from "react";
import type { ChoiceDisplayItem } from "../vnScreenTypes";
import type { VnChoice } from "../types";
import { formatSkillCheckVoiceLabel } from "../skillCheckPalette";

interface LogChoicesRendererProps {
  choiceDisplayItems: ChoiceDisplayItem[];
  isInteractionLocked: boolean;
  currentNodePresent: boolean;
  displayedScenarioCompleted: boolean;
  canTriggerCompletion: boolean;
  completionRoute: { hasExistingSession: boolean } | null;
  completionTargetLabel: string | null;
  hasAutoContinueChoice: boolean;
  sessionReady: boolean;
  labels: {
    terminalNoChoices: string;
    openNextScene: string;
    continueScene: string;
    restartScene: string;
    sessionHydrating: string;
    noChoices: string;
  };
  onChoiceClick: (choice: VnChoice) => void;
  onCompletionTransition: () => void;
  onRestartScene: () => void;
}

const choiceIcon = (choice: VnChoice, isVisited: boolean) => {
  const type = choice.choiceType || "action";
  if (type === "inquiry") {
    return isVisited ? <Check size={16} /> : <MessageCircle size={16} />;
  }
  if (type === "flavor") {
    return <Eye size={16} />;
  }
  return <ArrowRight size={16} />;
};

export function LogChoicesRenderer({
  choiceDisplayItems,
  isInteractionLocked,
  currentNodePresent,
  displayedScenarioCompleted,
  canTriggerCompletion,
  completionRoute,
  completionTargetLabel,
  hasAutoContinueChoice,
  sessionReady,
  labels,
  onChoiceClick,
  onCompletionTransition,
  onRestartScene,
}: LogChoicesRendererProps) {
  const [selectedChoiceId, setSelectedChoiceId] = useState<string | null>(null);

  if (choiceDisplayItems.length > 0 && currentNodePresent) {
    return (
      <div className="ml-11 mt-5 flex max-w-2xl flex-col gap-2">
        {choiceDisplayItems.map((item) => {
          const disabled =
            isInteractionLocked ||
            item.isLocked ||
            item.isPending ||
            item.hasFailedCheck;
          const selected = selectedChoiceId === item.choice.id;
          const faded =
            selectedChoiceId !== null && selectedChoiceId !== item.choice.id;

          return (
            <div
              key={item.choice.id}
              className={[
                "overflow-hidden transition-all duration-300",
                faded ? "max-h-0 opacity-0" : "max-h-56 opacity-100",
              ].join(" ")}
              style={{ transitionDelay: `${item.index * 100}ms` }}
            >
              {item.innerVoiceHints.length > 0 ? (
                <div className="mb-2 flex flex-col gap-1">
                  {item.innerVoiceHints.map((hint) => (
                    <div
                      key={`${item.choice.id}-${hint.voiceId}-${hint.stance}`}
                      className="border-l px-3 py-1.5 text-xs italic"
                      style={{
                        borderColor: hint.palette.glowStrong,
                        color: hint.palette.text,
                        backgroundColor: hint.palette.accentSoft,
                      }}
                    >
                      <span className="font-semibold uppercase tracking-[0.14em]">
                        {hint.label}
                      </span>
                      <span className="opacity-80">: {hint.text}</span>
                    </div>
                  ))}
                </div>
              ) : null}

              <button
                type="button"
                disabled={disabled}
                className={[
                  "group flex w-full items-start gap-3 border-l-2 px-3 py-2 text-left transition-all duration-200",
                  item.isLocked
                    ? "border-red-900/60 bg-red-950/10 text-stone-500"
                    : selected
                      ? "border-amber-300 bg-amber-500/16 text-amber-50"
                      : "border-amber-500/45 bg-black/20 text-stone-100 hover:bg-amber-500/10",
                  disabled ? "cursor-not-allowed opacity-55" : "cursor-pointer",
                ].join(" ")}
                onClick={(event) => {
                  event.stopPropagation();
                  if (disabled) {
                    return;
                  }
                  setSelectedChoiceId(item.choice.id);
                  onChoiceClick(item.choice);
                }}
              >
                <span className="mt-1 text-amber-300/85">
                  {item.isLocked ? (
                    <Lock size={16} />
                  ) : (
                    choiceIcon(item.choice, item.isVisited)
                  )}
                </span>
                <span className="min-w-0 flex-1">
                  {item.choice.skillCheck ? (
                    <span className="mb-1 flex flex-wrap items-center gap-2 text-[0.66rem] font-semibold uppercase tracking-[0.16em] text-amber-200/80">
                      <span>
                        {formatSkillCheckVoiceLabel(
                          item.choice.skillCheck.voiceId,
                        )}{" "}
                        {item.choice.skillCheck.difficulty}
                      </span>
                      {item.chancePercent !== undefined ? (
                        <span>{item.chancePercent}%</span>
                      ) : null}
                    </span>
                  ) : null}
                  <span className="block text-[0.96rem] leading-6">
                    {item.choice.text}
                  </span>
                </span>
              </button>
            </div>
          );
        })}
      </div>
    );
  }

  if (displayedScenarioCompleted) {
    return (
      <div className="ml-11 mt-5 flex max-w-xl flex-col gap-3">
        <p className="text-sm italic text-stone-300/70">
          {labels.terminalNoChoices}
        </p>
        {canTriggerCompletion ? (
          <button
            type="button"
            className="border border-amber-500/50 bg-amber-700/16 px-4 py-3 text-left text-sm text-amber-100 transition-colors hover:bg-amber-700/25 disabled:cursor-not-allowed disabled:opacity-50"
            onClick={(event) => {
              event.stopPropagation();
              onCompletionTransition();
            }}
            disabled={isInteractionLocked}
          >
            {completionRoute ? (
              <>
                {completionRoute.hasExistingSession
                  ? labels.openNextScene
                  : labels.continueScene}
                {completionTargetLabel ? `: ${completionTargetLabel}` : ""}
              </>
            ) : (
              "Return to Map"
            )}
          </button>
        ) : null}
        <button
          type="button"
          className="border border-white/15 bg-black/20 px-4 py-3 text-left text-sm text-stone-100 transition-colors hover:bg-white/8 disabled:cursor-not-allowed disabled:opacity-50"
          onClick={(event) => {
            event.stopPropagation();
            onRestartScene();
          }}
          disabled={isInteractionLocked}
        >
          {labels.restartScene}
        </button>
      </div>
    );
  }

  if (!sessionReady || !currentNodePresent || !hasAutoContinueChoice) {
    return (
      <p className="ml-11 mt-5 text-sm italic text-stone-300/60">
        {!sessionReady || !currentNodePresent
          ? labels.sessionHydrating
          : labels.noChoices}
      </p>
    );
  }

  return null;
}
