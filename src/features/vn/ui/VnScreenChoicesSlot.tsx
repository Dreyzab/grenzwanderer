import type { VnStrings } from "../../i18n/uiStrings";
import type { UiLanguage } from "../../../shared/hooks/useUiLanguage";
import {
  isChoiceAvailable,
  type VnChoiceEvaluationContext,
} from "../vnContent";
import type { CompletionRouteResolution } from "../completionRoute";
import type { VnChoice } from "../types";
import type {
  ChoiceDisplayItem,
  InlineStatusCard,
  InnerVoiceCardDisplay,
} from "../vnScreenTypes";
import type { VnSession } from "../../../shared/spacetime/bindings";
import { LogChoicesRenderer } from "../log/LogChoicesRenderer";
import { VnChoicesRenderer } from "./VnChoicesRenderer";

interface VnScreenChoicesSlotProps {
  activeLensBadgeText: string | null;
  canExpandThoughtWithProvidence: boolean;
  canTriggerCompletion: boolean;
  choiceDisplayItems: ChoiceDisplayItem[];
  choiceEvaluationContext: VnChoiceEvaluationContext;
  completionRoute: CompletionRouteResolution | null;
  completionTargetLabel: string | null;
  currentNodePresent: boolean;
  displayedScenarioCompleted: boolean;
  effectiveNarrativeLayout: string;
  hasAutoContinueChoice: boolean;
  hideImmersiveChrome: boolean;
  innerVoiceCards: InnerVoiceCardDisplay[];
  internalizedThoughtBadgeText: string | null;
  isInteractionLocked: boolean;
  myFlags: Record<string, boolean>;
  mySession: VnSession | null;
  myVars: Record<string, number>;
  providenceCtaLabel: string | null;
  providenceThoughtCard: InlineStatusCard | null;
  reactionCard: InlineStatusCard | null;
  sessionReady: boolean;
  showOriginCards: boolean;
  t: VnStrings;
  thoughtCard: InlineStatusCard | null;
  uiLanguage: UiLanguage;
  visibleChoices: VnChoice[];
  onChoiceClick: (choice: VnChoice, isLocked: boolean) => void;
  onCompletionTransition: () => void;
  onProvidenceExpand: () => void;
  onRestartScene: () => void;
}

export function VnScreenChoicesSlot({
  activeLensBadgeText,
  canExpandThoughtWithProvidence,
  canTriggerCompletion,
  choiceDisplayItems,
  choiceEvaluationContext,
  completionRoute,
  completionTargetLabel,
  currentNodePresent,
  displayedScenarioCompleted,
  effectiveNarrativeLayout,
  hasAutoContinueChoice,
  hideImmersiveChrome,
  innerVoiceCards,
  internalizedThoughtBadgeText,
  isInteractionLocked,
  myFlags,
  mySession,
  myVars,
  providenceCtaLabel,
  providenceThoughtCard,
  reactionCard,
  sessionReady,
  showOriginCards,
  t,
  thoughtCard,
  uiLanguage,
  visibleChoices,
  onChoiceClick,
  onCompletionTransition,
  onProvidenceExpand,
  onRestartScene,
}: VnScreenChoicesSlotProps) {
  if (effectiveNarrativeLayout === "log") {
    return (
      <LogChoicesRenderer
        choiceDisplayItems={choiceDisplayItems}
        isInteractionLocked={isInteractionLocked}
        currentNodePresent={currentNodePresent}
        displayedScenarioCompleted={displayedScenarioCompleted}
        canTriggerCompletion={canTriggerCompletion}
        completionRoute={completionRoute}
        completionTargetLabel={completionTargetLabel}
        hasAutoContinueChoice={hasAutoContinueChoice}
        sessionReady={sessionReady}
        labels={{
          terminalNoChoices: t.terminalNoChoices,
          openNextScene: t.openNextScene,
          continueScene: t.continueScene,
          restartScene: t.restartScene,
          sessionHydrating: t.sessionHydrating,
          noChoices: t.noChoices,
        }}
        onChoiceClick={(choice) => onChoiceClick(choice, false)}
        onCompletionTransition={onCompletionTransition}
        onRestartScene={onRestartScene}
      />
    );
  }

  if (hideImmersiveChrome) {
    return null;
  }

  return (
    <VnChoicesRenderer
      t={t}
      uiLanguage={uiLanguage}
      reactionCard={reactionCard}
      thoughtCard={thoughtCard}
      providenceThoughtCard={providenceThoughtCard}
      innerVoiceCards={innerVoiceCards}
      canExpandThoughtWithProvidence={canExpandThoughtWithProvidence}
      providenceCtaLabel={providenceCtaLabel}
      activeLensBadgeText={activeLensBadgeText}
      internalizedThoughtBadgeText={internalizedThoughtBadgeText}
      showOriginCards={showOriginCards}
      visibleChoices={visibleChoices}
      choiceDisplayItems={choiceDisplayItems}
      isInteractionLocked={isInteractionLocked}
      currentNodePresent={currentNodePresent}
      displayedScenarioCompleted={displayedScenarioCompleted}
      canTriggerCompletion={canTriggerCompletion}
      completionRoute={completionRoute}
      completionTargetLabel={completionTargetLabel}
      hasAutoContinueChoice={hasAutoContinueChoice}
      sessionReady={sessionReady}
      onOriginPick={(choice) => {
        const isAvailable = isChoiceAvailable(
          choice,
          myFlags,
          myVars,
          choiceEvaluationContext,
        );
        onChoiceClick(choice, !isAvailable || !mySession);
      }}
      onChoiceClick={(choice) => onChoiceClick(choice, false)}
      onProvidenceExpand={onProvidenceExpand}
      onCompletionTransition={onCompletionTransition}
      onRestartScene={onRestartScene}
    />
  );
}
