import { Dice5 } from "lucide-react";
import {
  LogSegmentRenderer,
  type PlayerProfileForLog,
} from "./LogSegmentRenderer";
import type { TypedTextTokenState } from "../ui/TypedText";
import type { LogEntry } from "./useNarrativeLog";
import { getVoicePresentation } from "../voicePresentation";

interface LogEntryRendererProps {
  entry: LogEntry;
  dimmed?: boolean;
  showSpeaker?: boolean;
  previousSpeakerId?: string | null;
  playerProfile?: PlayerProfileForLog | null;
  parliamentPresetId?: string;
  tokenStateByPayload?: Readonly<Record<string, TypedTextTokenState>>;
}

export function LogEntryRenderer({
  entry,
  dimmed = false,
  showSpeaker = true,
  previousSpeakerId,
  playerProfile,
  parliamentPresetId,
  tokenStateByPayload,
}: LogEntryRendererProps) {
  if (entry.type === "segment" && entry.segment) {
    return (
      <LogSegmentRenderer
        segment={entry.segment}
        dimmed={dimmed}
        showSpeaker={showSpeaker}
        previousSpeakerId={previousSpeakerId}
        playerProfile={playerProfile}
        parliamentPresetId={parliamentPresetId}
        tokenStateByPayload={tokenStateByPayload}
      />
    );
  }

  if (entry.type === "player_choice" && entry.choiceText) {
    return (
      <LogSegmentRenderer
        dimmed={dimmed}
        showSpeaker={false}
        previousSpeakerId={previousSpeakerId}
        playerProfile={playerProfile}
        parliamentPresetId={parliamentPresetId}
        tokenStateByPayload={tokenStateByPayload}
        segment={{
          speaker: "player",
          speakerLabel: playerProfile?.name ?? "You",
          category: "player",
          text: entry.choiceText,
        }}
      />
    );
  }

  if (entry.type === "skill_check_result" && entry.checkResult) {
    const { voiceId, voiceLabel, passed, roll, dc } = entry.checkResult;
    const resolvedVoiceLabel = voiceId
      ? getVoicePresentation(voiceId, parliamentPresetId).label
      : voiceLabel;
    return (
      <div
        className={[
          "ml-11 flex items-center gap-2 py-2 text-xs uppercase tracking-[0.16em] transition-opacity duration-500",
          passed ? "text-emerald-200/85" : "text-rose-200/85",
          dimmed ? "opacity-50" : "opacity-100",
        ].join(" ")}
      >
        <Dice5 size={14} />
        <span>
          {resolvedVoiceLabel} {passed ? "pass" : "fail"} - {roll} vs DC {dc}
        </span>
      </div>
    );
  }

  return null;
}
