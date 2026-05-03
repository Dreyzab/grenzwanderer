import type React from "react";
import type {
  VnChoice,
  VnNarrativeLayout,
  VnNarrativePresentation,
  VnSnapshot,
} from "../../features/vn/types";
import type { VnStrings } from "../../features/i18n/uiStrings";
import type { NarrativeLogState } from "../../features/vn/log/useNarrativeLog";
import type {
  TypedTextHandle,
  TypedTextTokenHandler,
} from "../../features/vn/ui/TypedText";

export interface VnNarrativePanelProps {
  t: VnStrings;
  sceneId?: string;
  /** Resolved log coordinator id (same as `logState.sceneGroupId`) - drives bottom-sheet scene transitions only. */
  sceneGroupId?: string | null;
  locationName: string;
  characterName?: string;
  narrativeText: string;
  choices?: VnChoice[];
  choicesSlot?: React.ReactNode;
  backgroundImageUrl?: string;
  backgroundVideoUrl?: string;
  backgroundVideoPosterUrl?: string;
  backgroundVideoSoundPrompt?: boolean;
  nextVisualUrls?: string[];
  narrativeLayout?: VnNarrativeLayout;
  narrativePresentation?: VnNarrativePresentation;
  logState?: NarrativeLogState;
  logSnapshot?: VnSnapshot | null;
  letterOverlayRevealDelayMs?: number;
  onChoiceSelect?: (choiceId: string) => void;
  isTyping?: boolean;
  onTypingChange?: (typing: boolean) => void;
  onNarrativeComplete?: () => void;
  onTokenClick?: TypedTextTokenHandler;
  onTokenEnter?: TypedTextTokenHandler;
  onTokenLeave?: TypedTextTokenHandler;
  typedTextRef?: React.RefObject<TypedTextHandle>;
  onSurfaceTap?: () => void;
  onVideoEnded?: () => void;
  /** Parent marks natural/skip end - pauses the background video element to avoid double audio. */
  videoPlaybackComplete?: boolean;
  characterId?: string;
  children?: React.ReactNode;
}

export type SoundPromptPhase = "prompt" | "playing";
export type VideoStatus = "idle" | "loading" | "ready" | "playing" | "ended";
