import { useRef } from "react";
import { CASE01_CANON_NODES } from "../../../../scripts/data/case01_canon_runtime";
import {
  fireEvent,
  render,
  screen,
  waitFor,
  within,
} from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import type { ChoiceInnerVoiceHintDisplay } from "../vnScreenTypes";
import type { VnChoice } from "../types";
import { resolveBackgroundUrl } from "./VnBackgroundResolver";
import { VnChoiceButton } from "./VnChoiceButton";
import { TypedText, type TypedTextHandle } from "./TypedText";
import { parseClueMarkup, parseTypedTextMarkup } from "./TypedTextParser";

describe("vn ui helpers", () => {
  it("parses clue markup into text and clue segments", () => {
    const segments = parseClueMarkup(
      "Inspect [clue:Ledger Gap:fact_ledger_gap] before moving",
    );

    expect(segments).toHaveLength(3);
    expect(segments[0]).toEqual({ kind: "text", text: "Inspect " });
    expect(segments[1]).toMatchObject({
      kind: "token",
      text: "Ledger Gap",
      token: {
        type: "clue",
        text: "Ledger Gap",
        payload: "fact_ledger_gap",
      },
    });
  });

  it("parses cyrillic clue markup", () => {
    const segments = parseClueMarkup(
      "В толпе ты замечаешь [clue:Пар:ev_station_steam].",
    );

    expect(segments).toHaveLength(3);
    expect(segments[1]).toMatchObject({
      kind: "token",
      text: "Пар",
      token: {
        type: "clue",
        text: "Пар",
        payload: "ev_station_steam",
      },
    });
  });

  it("parses multiple interactive token types", () => {
    const segments = parseTypedTextMarkup(
      "A [fact:Ledger:case_banker/fact_ledger] and [lead:Tailor:case_dog/fact_tailor] plus [item:Key:item_bank_key:1] and [actor:Fritz:npc_fritz]",
    );

    expect(segments.filter((segment) => segment.kind === "token")).toEqual([
      expect.objectContaining({
        token: expect.objectContaining({
          type: "fact",
          text: "Ledger",
          payload: "case_banker/fact_ledger",
        }),
      }),
      expect.objectContaining({
        token: expect.objectContaining({
          type: "lead",
          text: "Tailor",
          payload: "case_dog/fact_tailor",
        }),
      }),
      expect.objectContaining({
        token: expect.objectContaining({
          type: "item",
          text: "Key",
          payload: "item_bank_key:1",
        }),
      }),
      expect.objectContaining({
        token: expect.objectContaining({
          type: "actor",
          text: "Fritz",
          payload: "npc_fritz",
        }),
      }),
    ]);
  });

  it("keeps case 01 letter facts discoverable in canon bodies", () => {
    const detectiveLetter = CASE01_CANON_NODES.find(
      (node) => node.id === "scene_case01_train_compartment_letter",
    );
    const witchLetter = CASE01_CANON_NODES.find(
      (node) => node.id === "scene_case01_train_compartment_letter_witch",
    );

    expect(detectiveLetter?.bodyOverride).toContain("Zum Goldenen Adler");
    expect(detectiveLetter?.bodyOverride).not.toContain("Zum Eber");

    const witchTokens = parseTypedTextMarkup(
      witchLetter?.bodyOverride ?? "",
    ).flatMap((segment) => (segment.kind === "token" ? [segment.token] : []));

    expect(witchTokens).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          type: "fact",
          payload: "case01/master",
        }),
      ]),
    );
  });

  it("resolves background with node priority over scenario", () => {
    expect(resolveBackgroundUrl("/node.webp", "/scenario.webp")).toBe(
      "/node.webp",
    );
    expect(resolveBackgroundUrl(undefined, "/scenario.webp")).toBe(
      "/scenario.webp",
    );
    expect(resolveBackgroundUrl(undefined, undefined)).toBeNull();
  });
});

describe("TypedText", () => {
  it("reveals text over time", async () => {
    render(<TypedText text="Hello world" speed={2} />);

    expect(screen.queryByText("Hello world")).not.toBeInTheDocument();

    await waitFor(() => {
      expect(screen.getByText("Hello world")).toBeInTheDocument();
    });
  });

  it("finishes instantly when finish handle is called", () => {
    const Harness = () => {
      const ref = useRef<TypedTextHandle>(null);
      return (
        <div>
          <TypedText ref={ref} text="Finish me" speed={35} />
          <button type="button" onClick={() => ref.current?.finish()}>
            finish
          </button>
        </div>
      );
    };

    render(<Harness />);

    fireEvent.click(screen.getByRole("button", { name: "finish" }));
    expect(screen.getByText("Finish me")).toBeInTheDocument();
  });

  it("renders clue token payload on screen", async () => {
    render(
      <TypedText text="След ведет к [clue:Пар:ev_station_steam]" speed={1} />,
    );

    await waitFor(() => {
      const token = screen.getByText("Пар");
      expect(token).toHaveAttribute("data-vn-payload", "ev_station_steam");
      expect(token).toHaveAttribute("data-vn-token-type", "clue");
      expect(token).toHaveClass("vn-typed-text__token");
    });
  });

  it("fires token click and keyboard activation after typing completes", async () => {
    const onTokenClick = vi.fn();
    render(
      <TypedText
        text="След ведет к [clue:Пар:ev_station_steam]"
        speed={1}
        onTokenClick={onTokenClick}
      />,
    );

    const token = await screen.findByRole("button", { name: "Пар" });
    fireEvent.click(token);
    fireEvent.keyDown(token, { key: "Enter" });
    fireEvent.keyDown(token, { key: " " });

    expect(onTokenClick).toHaveBeenCalledTimes(3);
    expect(onTokenClick).toHaveBeenCalledWith(
      expect.objectContaining({
        type: "clue",
        text: "Пар",
        payload: "ev_station_steam",
      }),
      expect.anything(),
    );
  });

  it("keeps visible tokens inert while text is still typing", async () => {
    const onTokenClick = vi.fn();
    render(
      <TypedText
        text="[clue:Long visible token:ev_long] remains unfinished"
        speed={25}
        onTokenClick={onTokenClick}
      />,
    );

    await waitFor(() => {
      expect(document.querySelector(".vn-typed-text__token")).toBeTruthy();
    });

    const token = document.querySelector(
      ".vn-typed-text__token",
    ) as HTMLElement;
    expect(token).toHaveClass("is-typing");
    fireEvent.click(token);

    expect(onTokenClick).not.toHaveBeenCalled();
  });

  it("renders studied fact tokens as static text", () => {
    const onTokenClick = vi.fn();
    render(
      <TypedText
        instant
        text="Read [fact:Ledger:case_banker/fact_ledger]."
        tokenStateByPayload={{ "case_banker/fact_ledger": "studied" }}
        onTokenClick={onTokenClick}
      />,
    );

    const token = screen.getByText("Ledger");
    expect(token).toHaveAttribute("data-vn-token-state", "studied");
    expect(token).toHaveClass("is-studied");
    expect(
      screen.queryByRole("button", { name: "Ledger" }),
    ).not.toBeInTheDocument();

    fireEvent.click(token);
    expect(onTokenClick).not.toHaveBeenCalled();
  });

  it("renders recording fact tokens as disabled pending text", () => {
    const onTokenClick = vi.fn();
    render(
      <TypedText
        instant
        text="Read [fact:Ledger:case_banker/fact_ledger]."
        tokenStateByPayload={{ "case_banker/fact_ledger": "recording" }}
        onTokenClick={onTokenClick}
      />,
    );

    const token = screen.getByText("Ledger");
    expect(token).toHaveAttribute("data-vn-token-state", "recording");
    expect(token).toHaveClass("is-recording");
    expect(
      screen.queryByRole("button", { name: "Ledger" }),
    ).not.toBeInTheDocument();

    fireEvent.click(token);
    expect(onTokenClick).not.toHaveBeenCalled();
  });
});

describe("VnChoiceButton", () => {
  const baseChoice: VnChoice = {
    id: "choice_a",
    text: "Ask about the ledger",
    nextNodeId: "node_b",
    choiceType: "inquiry",
  };

  it("applies visited and failed-check classes", () => {
    render(
      <VnChoiceButton
        choice={baseChoice}
        index={0}
        isVisited
        hasFailedCheck
        onClick={() => undefined}
      />,
    );

    const button = screen.getByRole("button", {
      name: /Ask about the ledger/i,
    });
    expect(button).toHaveClass("opacity-30");
    expect(button).toHaveClass("cursor-not-allowed");
    expect(button).toHaveClass("pointer-events-none");
  });

  it("renders both sides of choice inner-voice debate", () => {
    const innerVoiceHints: ChoiceInnerVoiceHintDisplay[] = [
      {
        voiceId: "inner_leader",
        label: "Leader",
        text: "Protect the courier.",
        stance: "supports",
        palette: {
          accent: "#34d399",
          accentSoft: "rgba(52, 211, 153, 0.16)",
          glow: "rgba(52, 211, 153, 0.24)",
          glowStrong: "rgba(110, 231, 183, 0.5)",
          text: "#d1fae5",
        },
      },
      {
        voiceId: "inner_cynic",
        label: "Cynic",
        text: "Do not give leverage away.",
        stance: "opposes",
        palette: {
          accent: "#f87171",
          accentSoft: "rgba(248, 113, 113, 0.16)",
          glow: "rgba(248, 113, 113, 0.24)",
          glowStrong: "rgba(252, 165, 165, 0.5)",
          text: "#fee2e2",
        },
      },
    ];

    render(
      <VnChoiceButton
        choice={baseChoice}
        index={0}
        innerVoiceHints={innerVoiceHints}
        onClick={() => undefined}
      />,
    );

    expect(screen.getAllByLabelText("Leader").length).toBeGreaterThan(0);
    // Compact portrait remains, while the authored motive debate is visible below the choice.
    expect(screen.queryByText("LEA")).toBeNull();
    expect(screen.queryByText("CYN")).toBeNull();
    expect(screen.getByText("supports")).toBeInTheDocument();
    expect(screen.getByText("opposes")).toBeInTheDocument();
    expect(screen.getByText("Protect the courier.")).toBeInTheDocument();
    expect(screen.getByText("Do not give leverage away.")).toBeInTheDocument();
    expect(
      document.querySelectorAll('[data-testid="choice-inner-voice-stance"]'),
    ).toHaveLength(2);
    expect(
      document.querySelector(
        '[data-testid="choice-inner-voice-stance"][data-stance="supports"][data-voice-id="inner_leader"]',
      ),
    ).toBeInTheDocument();
    expect(
      document.querySelector(
        '[data-testid="choice-inner-voice-stance"][data-stance="opposes"][data-voice-id="inner_cynic"]',
      ),
    ).toBeInTheDocument();
    const primary = document.querySelector(
      '[data-testid="choice-primary-voice"]',
    );
    expect(primary).toHaveAttribute("data-stance", "supports");
    expect(primary).toHaveAttribute("data-voice-id", "inner_leader");
    expect(
      document.querySelector('img[src="/images/voices/leader.png"]'),
    ).toBeInTheDocument();
  });

  it("reveals the primary inner-voice hint thought when the avatar is clicked", () => {
    const innerVoiceHints: ChoiceInnerVoiceHintDisplay[] = [
      {
        voiceId: "inner_cynic",
        label: "Cynic",
        text: "Do not give leverage away.",
        stance: "opposes",
        palette: {
          accent: "#f87171",
          accentSoft: "rgba(248, 113, 113, 0.16)",
          glow: "rgba(248, 113, 113, 0.18)",
          glowStrong: "rgba(248, 113, 113, 0.36)",
          text: "#fee2e2",
        },
      },
    ];

    render(
      <VnChoiceButton
        choice={baseChoice}
        index={0}
        innerVoiceHints={innerVoiceHints}
        onClick={() => undefined}
      />,
    );

    expect(screen.getByText("Do not give leverage away.")).toBeInTheDocument();
    const trigger = screen.getByRole("button", { name: "Cynic" });
    fireEvent.click(trigger);
    expect(
      within(screen.getByRole("dialog")).getByText(
        "Do not give leverage away.",
      ),
    ).toBeInTheDocument();
  });

  it("renders skill-check voice badges with shared voice group assets", () => {
    render(
      <VnChoiceButton
        choice={{
          ...baseChoice,
          skillCheck: {
            id: "logic_check",
            voiceId: "attr_logic",
            difficulty: 8,
          },
        }}
        chancePercent={72}
        index={0}
        onClick={() => undefined}
      />,
    );

    // Skill check has no hint — the compact avatar is decorative (aria-hidden via wrapper),
    // but the portrait image still renders.
    expect(screen.getByTestId("choice-primary-avatar")).toBeInTheDocument();
    expect(
      document.querySelector('img[src="/images/ui/voices/groups/logic.png"]'),
    ).toBeInTheDocument();
    expect(screen.getByText("72%")).toBeInTheDocument();
  });

  it("renders motive debate hints on skill-check choices", () => {
    const innerVoiceHints: ChoiceInnerVoiceHintDisplay[] = [
      {
        voiceId: "inner_leader",
        label: "Leader",
        text: "Keep the pressure formal.",
        stance: "supports",
        palette: {
          accent: "#34d399",
          accentSoft: "rgba(52, 211, 153, 0.16)",
          glow: "rgba(52, 211, 153, 0.24)",
          glowStrong: "rgba(110, 231, 183, 0.5)",
          text: "#d1fae5",
        },
      },
      {
        voiceId: "inner_cynic",
        label: "Cynic",
        text: "He will hear weakness as invitation.",
        stance: "opposes",
        palette: {
          accent: "#f87171",
          accentSoft: "rgba(248, 113, 113, 0.16)",
          glow: "rgba(248, 113, 113, 0.24)",
          glowStrong: "rgba(252, 165, 165, 0.5)",
          text: "#fee2e2",
        },
      },
    ];

    render(
      <VnChoiceButton
        choice={{
          ...baseChoice,
          skillCheck: {
            id: "logic_check",
            voiceId: "attr_logic",
            difficulty: 8,
          },
        }}
        chancePercent={72}
        index={0}
        innerVoiceHints={innerVoiceHints}
        onClick={() => undefined}
      />,
    );

    expect(
      document.querySelector('img[src="/images/ui/voices/groups/logic.png"]'),
    ).toBeInTheDocument();
    expect(
      document.querySelectorAll('[data-testid="choice-inner-voice-stance"]'),
    ).toHaveLength(2);
    expect(
      document.querySelector(
        '[data-testid="choice-inner-voice-stance"][data-stance="supports"][data-voice-id="inner_leader"]',
      ),
    ).toBeInTheDocument();
    expect(
      document.querySelector(
        '[data-testid="choice-inner-voice-stance"][data-stance="opposes"][data-voice-id="inner_cynic"]',
      ),
    ).toBeInTheDocument();
    expect(screen.getByText("Keep the pressure formal.")).toBeInTheDocument();
    expect(
      screen.getByText("He will hear weakness as invitation."),
    ).toBeInTheDocument();
  });

  it("renders source badges for common, origin, and synergy choices", () => {
    const { rerender } = render(
      <VnChoiceButton
        choice={baseChoice}
        index={0}
        onClick={() => undefined}
      />,
    );

    expect(screen.getByTestId("choice-source-badge")).toHaveAttribute(
      "data-choice-source",
      "common",
    );

    rerender(
      <VnChoiceButton
        choice={{ ...baseChoice, choiceSource: "origin" }}
        index={0}
        onClick={() => undefined}
      />,
    );
    expect(screen.getByTestId("choice-source-badge")).toHaveAttribute(
      "data-choice-source",
      "origin",
    );

    rerender(
      <VnChoiceButton
        choice={{
          ...baseChoice,
          choiceSource: "synergy",
          skillCheck: {
            id: "logic_empathy_check",
            voiceId: "attr_logic",
            difficulty: 8,
            synergyId: "mind_empathy_soft_contradiction",
          },
        }}
        index={0}
        onClick={() => undefined}
      />,
    );
    expect(screen.getByTestId("choice-source-badge")).toHaveAttribute(
      "data-choice-source",
      "synergy",
    );
  });
});
