import { useState } from "react";
import type { ChoiceDisplayItem } from "../vnScreenTypes";
import type { VnChoice } from "../types";
import { VnChoiceButton } from "../ui/VnChoiceButton";

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
      <div
        className="mt-5 flex w-full max-w-2xl flex-col gap-2 sm:pl-2"
        onClick={(event) => event.stopPropagation()}
      >
        {choiceDisplayItems.map((item) => {
          const disabled =
            isInteractionLocked ||
            item.isLocked ||
            item.isPending ||
            item.hasFailedCheck;
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
              <VnChoiceButton
                choice={item.choice}
                index={item.index}
                isVisited={item.isVisited}
                isLocked={item.isLocked}
                disabled={disabled}
                isPending={item.isPending}
                hasFailedCheck={item.hasFailedCheck}
                chancePercent={item.chancePercent}
                innerVoiceHints={item.innerVoiceHints}
                sourcePresentation={item.sourcePresentation}
                skillCheckState={item.skillCheckState}
                onClick={() => {
                  if (disabled) return;
                  setSelectedChoiceId(item.choice.id);
                  onChoiceClick(item.choice);
                }}
              />
            </div>
          );
        })}
      </div>
    );
  }

  if (displayedScenarioCompleted) {
    return (
      <div className="mt-5 flex max-w-xl flex-col gap-3 sm:pl-2">
        <p className="text-sm italic text-stone-300/70">
          {labels.terminalNoChoices}
        </p>
        {canTriggerCompletion ? (
          <button
            type="button"
            className="border border-ember-500/50 bg-ember-700/16 px-4 py-3 text-left text-sm text-ember-100 transition-colors hover:bg-ember-700/25 disabled:cursor-not-allowed disabled:opacity-50"
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
      <p className="mt-5 text-sm italic text-stone-300/60 sm:pl-2">
        {!sessionReady || !currentNodePresent
          ? labels.sessionHydrating
          : labels.noChoices}
      </p>
    );
  }

  return null;
}
