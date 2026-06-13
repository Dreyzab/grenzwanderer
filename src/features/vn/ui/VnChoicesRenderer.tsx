import { useState } from "react";
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
  providenceCount: number;
  onOriginPick: (choice: VnChoice) => void;
  onChoiceClick: (choice: VnChoice) => void;
  onCustomSubmit?: (choice: VnChoice, text: string) => void;
  onInsufficientTokens?: () => void;
  onProvidenceExpand: () => void;
  onCompletionTransition: () => void;
  onRestartScene: () => void;
}

const StatusCard = ({ card }: { card: InlineStatusCard }) => (
  <div
    className={
      card.tone === "reaction"
        ? "rounded-[1.4rem] border border-sky-200/20 bg-slate-950/55 px-4 py-4 text-left shadow-[0_18px_44px_rgba(0,0,0,0.32)] backdrop-blur-md"
        : "rounded-[1.4rem] border border-ember-200/20 bg-black/40 px-4 py-4 text-left shadow-[0_18px_44px_rgba(0,0,0,0.32)] backdrop-blur-md"
    }
  >
    <p
      className={
        card.tone === "reaction"
          ? "text-[10px] uppercase tracking-[0.18em] text-sky-100/70"
          : "text-[10px] uppercase tracking-[0.18em] text-ember-200/70"
      }
    >
      {card.title}
    </p>
    <p
      className={
        card.tone === "reaction"
          ? "mt-2 text-sm uppercase tracking-[0.14em] text-sky-50/85"
          : "mt-2 text-sm uppercase tracking-[0.14em] text-ember-100/85"
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

const CustomInputChoice = ({
  choice,
  disabled,
  providenceCount,
  onCustomSubmit,
  onInsufficientTokens,
}: {
  choice: VnChoice;
  disabled: boolean;
  providenceCount: number;
  onCustomSubmit?: (choice: VnChoice, text: string) => void;
  onInsufficientTokens?: () => void;
}) => {
  const [text, setText] = useState("");
  const [localWarning, setLocalWarning] = useState<string | null>(null);

  const handleSubmit = () => {
    if (disabled) return;
    if (!text.trim()) return;

    if (providenceCount < 1) {
      setLocalWarning(
        "ÐÐµÐ´Ð¾ÑÑ‚Ð°Ñ‚Ð¾Ñ‡Ð½Ð¾ Ð–ÐµÑ‚Ð¾Ð½Ð¾Ð² ÐŸÑ€Ð¾Ð²Ð¸Ð´ÐµÐ½Ð¸Ñ",
      );
      if (onInsufficientTokens) {
        onInsufficientTokens();
      }
      setTimeout(() => setLocalWarning(null), 3000);
      return;
    }

    if (onCustomSubmit) {
      onCustomSubmit(choice, text.trim());
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    } else if (e.key === "Escape") {
      e.currentTarget.blur();
    }
  };

  const isSubmitDisabled = disabled || !text.trim();

  return (
    <div className="bg-slate-950/45 backdrop-blur-md border border-ember-500/20 shadow-lg rounded-[0.8rem] p-4 flex flex-col gap-3 transition-all duration-300 focus-within:border-ember-500/50 focus-within:shadow-[0_0_15px_rgba(245,158,11,0.15)] w-full text-left">
      <div className="flex items-center justify-between gap-2 text-[10px] uppercase tracking-[0.18em]">
        <span className="text-stone-400 font-semibold">
          Ð¡Ð²Ð¾Ð¹ Ð²Ð°Ñ€Ð¸Ð°Ð½Ñ‚
        </span>
        <span className="text-ember-500/90 font-bold">
          1 Ð–ÐµÑ‚Ð¾Ð½ ÐŸÑ€Ð¾Ð²Ð¸Ð´ÐµÐ½Ð¸Ñ
        </span>
      </div>

      <textarea
        value={text}
        onChange={(e) => {
          setText(e.target.value);
          if (localWarning) setLocalWarning(null);
        }}
        onKeyDown={handleKeyDown}
        placeholder="ÐžÐ¿Ð¸ÑˆÐ¸Ñ‚Ðµ Ð²Ð°ÑˆÐ¸ Ð´ÐµÐ¹ÑÑ‚Ð²Ð¸Ñ..."
        disabled={disabled}
        className="w-full bg-slate-950/50 text-slate-100 placeholder-stone-500 border border-stone-800 rounded-[0.6rem] px-3 py-2 text-sm focus:outline-none focus:border-ember-500/40 resize-none h-[72px] transition-all duration-300"
      />

      <div className="flex items-center justify-between gap-3 min-h-[32px]">
        <div className="text-xs text-ember-500/80 font-medium">
          {localWarning ? (
            <span className="text-ember-500 font-bold animate-pulse">
              ⚠️ {localWarning}
            </span>
          ) : null}
        </div>
        <button
          type="button"
          onClick={handleSubmit}
          disabled={isSubmitDisabled}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-[0.4rem] text-xs font-semibold uppercase tracking-wider bg-ember-500/10 border border-ember-500/30 text-ember-100 transition-all duration-300 hover:bg-ember-500/20 hover:border-ember-500/65 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
        >
          <span>ÐžÑ‚Ð¿Ñ€Ð°Ð²Ð¸Ñ‚ÑŒ</span>
          <svg
            className="w-3.5 h-3.5 stroke-current"
            fill="none"
            viewBox="0 0 24 24"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2.5"
              d="M9 5l7 7-7 7"
            />
          </svg>
        </button>
      </div>
    </div>
  );
};

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
  providenceCount,
  onOriginPick,
  onChoiceClick,
  onCustomSubmit,
  onInsufficientTokens,
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
        className="rounded-[1rem] border border-ember-200/20 bg-ember-300/10 px-4 py-3 text-left text-sm text-ember-50 transition-colors hover:bg-ember-300/16 disabled:cursor-not-allowed disabled:opacity-50"
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
      <div className="rounded-full border border-ember-200/20 bg-ember-400/10 px-4 py-2 text-center text-[11px] uppercase tracking-[0.16em] text-ember-100">
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
        {choiceDisplayItems.map((item) =>
          item.choice.allowCustomInput ? (
            <CustomInputChoice
              key={item.choice.id}
              choice={item.choice}
              disabled={isInteractionLocked}
              providenceCount={providenceCount}
              onCustomSubmit={onCustomSubmit}
              onInsufficientTokens={onInsufficientTokens}
            />
          ) : (
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
              sourcePresentation={item.sourcePresentation}
              disabled={isInteractionLocked}
              onClick={() => onChoiceClick(item.choice)}
            />
          ),
        )}
      </>
    ) : displayedScenarioCompleted ? (
      <div className="flex flex-col gap-3">
        <p className="opacity-70 italic text-sm text-center">
          {t.terminalNoChoices}
        </p>
        {canTriggerCompletion ? (
          <button
            type="button"
            className="px-4 py-3 rounded-md border border-ember-600/60 bg-ember-800/20 text-ember-100 hover:bg-ember-700/30 transition-colors"
            onClick={onCompletionTransition}
            disabled={isInteractionLocked}
          >
            {completionRoute ? (
              <>
                {completionRoute.hasExistingSession
                  ? t.openNextScene
                  : t.continueScene}
                {completionTargetLabel ? `: ${completionTargetLabel}` : ""}
              </>
            ) : (
              "Return to Map"
            )}
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
