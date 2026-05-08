import { render, screen, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { LogSegmentRenderer } from "./LogSegmentRenderer";
import type { SpeakerSegment } from "./speakerParser";

const innerVoiceSegment: SpeakerSegment = {
  speaker: "inner_cynic",
  speakerLabel: "Cynic",
  category: "inner_voice",
  text: "Trust costs more than leverage.",
  accentColor: "#f87171",
  accentSoftColor: "rgba(248, 113, 113, 0.16)",
  glowColor: "rgba(248, 113, 113, 0.24)",
  textColor: "#fee2e2",
};

describe("LogSegmentRenderer", () => {
  it("renders inner voices as thought cards with persistent label chrome", () => {
    render(
      <LogSegmentRenderer segment={innerVoiceSegment} showSpeaker={false} />,
    );

    const thoughtCard = screen.getByTestId("vn-inner-voice-segment");
    const badge = screen.getByLabelText("Cynic");
    expect(thoughtCard).toBeInTheDocument();
    expect(badge).toBeInTheDocument();
    expect(badge).toHaveStyle({ color: "#f87171" });
    expect(screen.getByText("CYN")).toBeInTheDocument();
    expect(
      screen.getByText("Trust costs more than leverage."),
    ).toBeInTheDocument();
    expect(screen.getByTestId("vn-inline-speaker-badge-image")).toHaveAttribute(
      "src",
      "/images/ui/voices/groups/perception.png",
    );
  });

  it("keeps npc dialogue out of thought card styling", () => {
    render(
      <LogSegmentRenderer
        segment={{
          speaker: "Assistant",
          speakerLabel: "Assistant",
          category: "npc",
          text: "No headlines today.",
          portraitUrl: "/VN/start/image/train_assistant.png",
        }}
      />,
    );

    expect(screen.queryByTestId("vn-inner-voice-segment")).toBeNull();
    expect(screen.getByLabelText("Assistant")).toBeInTheDocument();
    expect(screen.getByText("ASST")).toBeInTheDocument();
    expect(screen.getByTestId("vn-inline-speaker-badge-image")).toHaveAttribute(
      "src",
      "/VN/start/image/train_assistant.png",
    );
    // Classes are on the container div in the new UI structure
    expect(
      screen.getByText("No headlines today.").closest(".text-stone-100"),
    ).toBeInTheDocument();
  });

  it("keeps narrator text as quiet narrative prose", () => {
    render(
      <LogSegmentRenderer
        segment={{
          speaker: "Narrator",
          speakerLabel: "Narrator",
          category: "narrator",
          text: "Steam gathers under the station roof.",
        }}
      />,
    );

    expect(screen.queryByTestId("vn-inner-voice-segment")).toBeNull();
    expect(screen.queryByText("Narrator")).toBeNull();
    expect(screen.queryByTestId("vn-inline-speaker-badge")).toBeNull();
    // Classes are on the container div in the new UI structure
    expect(
      screen
        .getByText("Steam gathers under the station roof.")
        .closest(".italic"),
    ).toBeInTheDocument();
  });

  it("keeps typed text behavior for inner voice segments", async () => {
    const onComplete = vi.fn();

    render(
      <LogSegmentRenderer
        segment={{
          ...innerVoiceSegment,
          text: "Finish me.",
        }}
        isTyping
        onComplete={onComplete}
      />,
    );

    await waitFor(() => {
      expect(screen.getByText("Finish me.")).toBeInTheDocument();
    });
    await waitFor(() => {
      expect(onComplete).toHaveBeenCalled();
    });
  });

  it("falls back to a colored badge when an inner voice has no image asset", () => {
    render(
      <LogSegmentRenderer
        segment={{
          ...innerVoiceSegment,
          speaker: "inner_unknown",
          speakerLabel: "Unknown",
        }}
      />,
    );

    expect(screen.getByLabelText("Unknown")).toBeInTheDocument();
    expect(screen.queryByTestId("vn-inline-speaker-badge-image")).toBeNull();
  });
});
