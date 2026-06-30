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
  it("renders inner voices as thought cards with named speaker header", () => {
    render(
      <LogSegmentRenderer segment={innerVoiceSegment} showSpeaker={false} />,
    );

    const thoughtCard = screen.getByTestId("vn-inner-voice-segment");
    const avatar = screen.getByLabelText("Cynic");
    expect(thoughtCard).toBeInTheDocument();
    expect(avatar).toBeInTheDocument();
    expect(screen.getByText("CYNIC")).toHaveStyle({ color: "#f87171" });
    expect(
      screen.getByText("Trust costs more than leverage."),
    ).toBeInTheDocument();
    expect(screen.getByTestId("vn-speaker-avatar-image")).toHaveAttribute(
      "src",
      "/images/ui/voices/groups/perception.png",
    );
  });

  it("keeps historical Shame segments visible through the witch skin", () => {
    render(
      <LogSegmentRenderer
        parliamentPresetId="witch"
        segment={{
          speaker: "inner_hermit",
          speakerLabel: "Hermit",
          category: "inner_voice",
          text: "Name the harm before the excuse arrives.",
        }}
      />,
    );

    expect(screen.getByText("[СТЫД]")).toBeInTheDocument();
    expect(
      screen.getByText("Name the harm before the excuse arrives."),
    ).toBeInTheDocument();
  });

  it("renders witch method speakers with their method skin", () => {
    render(
      <LogSegmentRenderer
        parliamentPresetId="witch"
        segment={{
          speaker: "attr_composure",
          speakerLabel: "Composure",
          category: "method_voice",
          text: "Give the room nothing.",
        }}
      />,
    );

    expect(screen.getByText("[ФАСАД]")).toBeInTheDocument();
  });

  it("keeps npc dialogue out of thought card styling", () => {
    render(
      <LogSegmentRenderer
        segment={{
          speaker: "Assistant",
          speakerLabel: "Felix",
          category: "npc",
          text: "No headlines today.",
          portraitUrl:
            "/Characters/Felix/felix_portrait_fixed_jaw_1776590978986.png",
        }}
      />,
    );

    expect(screen.queryByTestId("vn-inner-voice-segment")).toBeNull();
    expect(screen.getByLabelText("Felix")).toBeInTheDocument();
    expect(screen.getByText("FELIX")).toBeInTheDocument();
    expect(screen.getByTestId("vn-speaker-avatar-image")).toHaveAttribute(
      "src",
      "/Characters/Felix/felix_portrait_fixed_jaw_1776590978986.png",
    );
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
    expect(screen.queryByTestId("vn-speaker-avatar")).toBeNull();
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
    expect(screen.queryByTestId("vn-speaker-avatar-image")).toBeNull();
  });

  it("collapses avatar and name when previous segment shares the speaker", () => {
    render(
      <LogSegmentRenderer
        previousSpeakerId="Assistant"
        segment={{
          speaker: "Assistant",
          speakerLabel: "Felix",
          category: "npc",
          text: "Are you sure this is no prank?",
          portraitUrl:
            "/Characters/Felix/felix_portrait_fixed_jaw_1776590978986.png",
        }}
      />,
    );

    expect(screen.queryByTestId("vn-speaker-avatar")).toBeNull();
    expect(screen.queryByText("FELIX")).toBeNull();
    expect(
      screen.getByText("Are you sure this is no prank?"),
    ).toBeInTheDocument();
  });

  it("renders player lines using the supplied originProfile name and avatar", () => {
    render(
      <LogSegmentRenderer
        playerProfile={{
          name: "Matthias Adler",
          avatarUrl:
            "/images/characters/detective_portrait/detective_portrait.png",
        }}
        segment={{
          speaker: "player",
          speakerLabel: "You",
          category: "player",
          text: "Someone wants our attention.",
        }}
      />,
    );

    expect(screen.getByLabelText("Matthias Adler")).toBeInTheDocument();
    expect(screen.getByText("MATTHIAS ADLER")).toBeInTheDocument();
    expect(screen.getByTestId("vn-speaker-avatar-image")).toHaveAttribute(
      "src",
      "/images/characters/detective_portrait/detective_portrait.png",
    );
  });
});
