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
import { AUTO_CONTINUE_PREFIX } from "../vnScreenUtils";
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
  scenarioId?: string;
  nodeId?: string;
  onPonder?: (prompt: string) => void;
  ponderThinking?: boolean;
  sessionReady: boolean;
  showOriginCards: boolean;
  t: VnStrings;
  thoughtCard: InlineStatusCard | null;
  uiLanguage: UiLanguage;
  visibleChoices: VnChoice[];
  providenceCount: number;
  onChoiceClick: (choice: VnChoice, isLocked: boolean) => void;
  onCompletionTransition: () => void;
  onCustomSubmit?: (choice: VnChoice, text: string) => void;
  onInsufficientTokens?: () => void;
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
  scenarioId,
  nodeId,
  onPonder,
  ponderThinking,
  sessionReady,
  showOriginCards,
  t,
  thoughtCard,
  uiLanguage,
  visibleChoices,
  providenceCount,
  onChoiceClick,
  onCompletionTransition,
  onCustomSubmit,
  onInsufficientTokens,
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
        scenarioId={scenarioId}
        nodeId={nodeId}
        onPonder={onPonder}
        ponderThinking={ponderThinking}
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

  const hasPlayerFacingChoices = choiceDisplayItems.some(
    (item) => !item.choice.id.startsWith(AUTO_CONTINUE_PREFIX),
  );

  if (hideImmersiveChrome && !hasPlayerFacingChoices) {
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
      providenceCount={providenceCount}
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
      onCustomSubmit={onCustomSubmit}
      onInsufficientTokens={onInsufficientTokens}
      onProvidenceExpand={onProvidenceExpand}
      onCompletionTransition={onCompletionTransition}
      onRestartScene={onRestartScene}
    />
  );
}
