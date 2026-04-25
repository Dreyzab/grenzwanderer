import { Dice5 } from "lucide-react";
import { LogSegmentRenderer } from "./LogSegmentRenderer";
import type { LogEntry } from "./useNarrativeLog";

interface LogEntryRendererProps {
  entry: LogEntry;
  dimmed?: boolean;
  showSpeaker?: boolean;
}

export function LogEntryRenderer({
  entry,
  dimmed = false,
  showSpeaker = true,
}: LogEntryRendererProps) {
  if (entry.type === "segment" && entry.segment) {
    return (
      <LogSegmentRenderer
        segment={entry.segment}
        dimmed={dimmed}
        showSpeaker={showSpeaker}
      />
    );
  }

  if (entry.type === "player_choice" && entry.choiceText) {
    return (
      <LogSegmentRenderer
        dimmed={dimmed}
        showSpeaker={false}
        segment={{
          speaker: "player",
          speakerLabel: "You",
          category: "player",
          text: entry.choiceText,
        }}
      />
    );
  }

  if (entry.type === "skill_check_result" && entry.checkResult) {
    const { voiceLabel, passed, roll, dc } = entry.checkResult;
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
          {voiceLabel} {passed ? "pass" : "fail"} - {roll} vs DC {dc}
        </span>
      </div>
    );
  }

  return null;
}
