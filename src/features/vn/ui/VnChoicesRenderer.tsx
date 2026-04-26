import type { VnStrings } from "../../i18n/uiStrings";
import type { UiLanguage } from "../../../shared/hooks/useUiLanguage";
import type {
  ChoiceDisplayItem,
  InlineStatusCard,
  InnerVoiceCardDisplay,
} from "../vnScreenTypes";
import type { VnChoice } from "../types";
import { OriginChoiceCards } from "./OriginChoiceCards";
import { VnChoiceButton } from "./VnChoiceButton";

interface VnChoicesRendererProps {
  t: VnStrings;
  uiLanguage: UiLanguage;
  reactionCard: InlineStatusCard | null;
  thoughtCard: InlineStatusCard | null;
  providenceThoughtCard: InlineStatusCard | null;
  innerVoiceCards: InnerVoiceCardDisplay[];
  canExpandThoughtWithProvidence: boolean;
  providenceCtaLabel: string | null;
  activeLensBadgeText: string | null;
  internalizedThoughtBadgeText: string | null;
  showOriginCards: boolean;
  visibleChoices: VnChoice[];
  choiceDisplayItems: ChoiceDisplayItem[];
  isInteractionLocked: boolean;
  currentNodePresent: boolean;
  displayedScenarioCompleted: boolean;
  canTriggerCompletion: boolean;
  completionRoute: {
    hasExistingSession: boolean;
  } | null;
  completionTargetLabel: string | null;
  hasAutoContinueChoice: boolean;
  sessionReady: boolean;
  onOriginPick: (choice: VnChoice) => void;
  onChoiceClick: (choice: VnChoice) => void;
  onProvidenceExpand: () => void;
  onCompletionTransition: () => void;
  onRestartScene: () => void;
}

const StatusCard = ({ card }: { card: InlineStatusCard }) => (
  <div
    className={
      card.tone === "reaction"
        ? "rounded-[1.4rem] border border-sky-200/20 bg-slate-950/55 px-4 py-4 text-left shadow-[0_18px_44px_rgba(0,0,0,0.32)] backdrop-blur-md"
        : "rounded-[1.4rem] border border-amber-200/20 bg-black/40 px-4 py-4 text-left shadow-[0_18px_44px_rgba(0,0,0,0.32)] backdrop-blur-md"
    }
  >
    <p
      className={
        card.tone === "reaction"
          ? "text-[10px] uppercase tracking-[0.18em] text-sky-100/70"
          : "text-[10px] uppercase tracking-[0.18em] text-amber-200/70"
      }
    >
      {card.title}
    </p>
    <p
      className={
        card.tone === "reaction"
          ? "mt-2 text-sm uppercase tracking-[0.14em] text-sky-50/85"
          : "mt-2 text-sm uppercase tracking-[0.14em] text-amber-100/85"
      }
    >
      {card.eyebrow}
    </p>
    <p
      className={
        card.tone === "reaction"
          ? "mt-2 text-base leading-relaxed text-slate-100/88"
          : "mt-2 text-base leading-relaxed text-stone-100/88"
      }
    >
      {card.body}
    </p>
  </div>
);

const InnerVoiceCard = ({ card }: { card: InnerVoiceCardDisplay }) => (
  <div
    className="rounded-[1.2rem] border px-4 py-4 text-left shadow-[0_18px_44px_rgba(0,0,0,0.32)] backdrop-blur-md"
    style={{
      borderColor: card.palette.glow,
      backgroundColor: card.palette.accentSoft,
      boxShadow: `0 18px 44px rgba(0,0,0,0.32), 0 0 0 1px ${card.palette.glow}`,
    }}
  >
    <div className="flex items-center justify-between gap-3">
      <p
        className="text-[10px] uppercase tracking-[0.18em]"
        style={{ color: card.palette.accent }}
      >
        {card.role}
      </p>
      <span
        className="rounded-full border px-2 py-1 text-[10px] uppercase tracking-[0.18em]"
        style={{
          borderColor: card.palette.glowStrong,
          color: card.palette.text,
          backgroundColor: "rgba(0,0,0,0.18)",
        }}
      >
        {card.label}
      </span>
    </div>
    <p
      className="mt-3 text-base leading-relaxed"
      style={{ color: card.palette.text }}
    >
      {card.text}
    </p>
  </div>
);

export const VnChoicesRenderer = ({
  t,
  uiLanguage,
  reactionCard,
  thoughtCard,
  providenceThoughtCard,
  innerVoiceCards,
  canExpandThoughtWithProvidence,
  providenceCtaLabel,
  activeLensBadgeText,
  internalizedThoughtBadgeText,
  showOriginCards,
  visibleChoices,
  choiceDisplayItems,
  isInteractionLocked,
  currentNodePresent,
  displayedScenarioCompleted,
  canTriggerCompletion,
  completionRoute,
  completionTargetLabel,
  hasAutoContinueChoice,
  sessionReady,
  onOriginPick,
  onChoiceClick,
  onProvidenceExpand,
  onCompletionTransition,
  onRestartScene,
}: VnChoicesRendererProps) => (
  <div className="flex flex-col gap-3 px-6 py-8 w-full max-w-[480px] mx-auto">
    {reactionCard ? <StatusCard card={reactionCard} /> : null}
    {thoughtCard ? <StatusCard card={thoughtCard} /> : null}
    {thoughtCard && providenceCtaLabel ? (
      <button
        type="button"
        className="rounded-[1rem] border border-amber-200/20 bg-amber-300/10 px-4 py-3 text-left text-sm text-amber-50 transition-colors hover:bg-amber-300/16 disabled:cursor-not-allowed disabled:opacity-50"
        disabled={!canExpandThoughtWithProvidence}
        onClick={onProvidenceExpand}
      >
        {providenceCtaLabel}
      </button>
    ) : null}
    {providenceThoughtCard ? <StatusCard card={providenceThoughtCard} /> : null}
    {innerVoiceCards.map((card) => (
      <InnerVoiceCard key={`${card.role}-${card.voiceId}`} card={card} />
    ))}
    {activeLensBadgeText ? (
      <div className="rounded-full border border-sky-200/20 bg-sky-400/10 px-4 py-2 text-center text-[11px] uppercase tracking-[0.16em] text-sky-100">
        {activeLensBadgeText}
      </div>
    ) : null}
    {internalizedThoughtBadgeText ? (
      <div className="rounded-full border border-amber-200/20 bg-amber-400/10 px-4 py-2 text-center text-[11px] uppercase tracking-[0.16em] text-amber-100">
        {internalizedThoughtBadgeText}
      </div>
    ) : null}
    {showOriginCards && currentNodePresent ? (
      <OriginChoiceCards
        choices={visibleChoices}
        disabled={isInteractionLocked}
        language={uiLanguage}
        labels={{ flaw: t.originFlaw, signature: t.originSignature }}
        onPick={onOriginPick}
      />
    ) : !showOriginCards &&
      choiceDisplayItems.length > 0 &&
      currentNodePresent ? (
      <>
        {choiceDisplayItems.map((item) => (
          <VnChoiceButton
            key={item.choice.id}
            choice={item.choice}
            index={item.index}
            chancePercent={item.chancePercent}
            skillCheckState={item.skillCheckState}
            isVisited={item.isVisited}
            isLocked={item.isLocked}
            isPending={item.isPending}
            hasFailedCheck={item.hasFailedCheck}
            innerVoiceHints={item.innerVoiceHints}
            disabled={isInteractionLocked}
            onClick={() => onChoiceClick(item.choice)}
          />
        ))}
      </>
    ) : displayedScenarioCompleted ? (
      <div className="flex flex-col gap-3">
        <p className="opacity-70 italic text-sm text-center">
          {t.terminalNoChoices}
        </p>
        {completionRoute && canTriggerCompletion ? (
          <button
            type="button"
            className="px-4 py-3 rounded-md border border-amber-600/60 bg-amber-800/20 text-amber-100 hover:bg-amber-700/30 transition-colors"
            onClick={onCompletionTransition}
            disabled={isInteractionLocked}
          >
            {completionRoute.hasExistingSession
              ? t.openNextScene
              : t.continueScene}
            {completionTargetLabel ? `: ${completionTargetLabel}` : ""}
          </button>
        ) : null}
        <button
          type="button"
          className="px-4 py-3 rounded-md border border-white/20 bg-black/20 text-white hover:bg-black/35 transition-colors"
          onClick={onRestartScene}
          disabled={isInteractionLocked}
        >
          {t.restartScene}
        </button>
      </div>
    ) : !showOriginCards &&
      (!sessionReady || !currentNodePresent || !hasAutoContinueChoice) ? (
      <p className="opacity-60 italic text-sm text-center">
        {!sessionReady || !currentNodePresent
          ? t.sessionHydrating
          : t.noChoices}
      </p>
    ) : null}
  </div>
);
