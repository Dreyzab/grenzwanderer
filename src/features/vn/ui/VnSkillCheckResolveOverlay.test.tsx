import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { resolveSkillRank } from "../../../shared/game/skillProgression";
import {
  VnSkillCheckResolveOverlay,
  type VnSkillCheckResolveState,
} from "./VnSkillCheckResolveOverlay";

vi.mock("framer-motion", async () => {
  const React = await import("react");

  type MotionProps = {
    children?: React.ReactNode;
    animate?: unknown;
    exit?: unknown;
    initial?: unknown;
    transition?: unknown;
  } & Record<string, unknown>;

  const createMotionComponent = (tag: keyof HTMLElementTagNameMap) =>
    React.forwardRef<HTMLElementTagNameMap[typeof tag], MotionProps>(
      function MotionComponent(
        {
          animate: _animate,
          children,
          exit: _exit,
          initial: _initial,
          transition: _transition,
          ...props
        },
        ref,
      ) {
        return React.createElement(
          tag as keyof HTMLElementTagNameMap,
          { ref, ...props },
          children as React.ReactNode,
        );
      },
    );

  return {
    AnimatePresence: ({ children }: { children: React.ReactNode }) => (
      <>{children}</>
    ),
    motion: new Proxy(
      {},
      {
        get: (_target, key) =>
          createMotionComponent(key as keyof HTMLElementTagNameMap),
      },
    ),
  };
});

const baseState: VnSkillCheckResolveState = {
  scenarioId: "sandbox_case01_pilot",
  nodeId: "node_start",
  checkId: "check_probe",
  choiceId: "choice_probe",
  choiceText: "Probe witness",
  voiceId: "attr_social",
  voiceLabel: "[ФАСАД]",
  diceMode: "d20",
  phase: "rolling",
  passed: true,
  chancePercent: 85,
  roll: 7,
  voiceLevel: 4,
  difficulty: 8,
  nextNodeId: null,
  frozen: {
    locationName: "Case01",
    narrativeText: "Body",
    visibleChoices: [],
    autoContinueChoice: null,
    showOriginCards: false,
    isScenarioCompleted: false,
  },
};

describe("VnSkillCheckResolveOverlay", () => {
  it("renders the 2D fallback dice visual", () => {
    render(
      <VnSkillCheckResolveOverlay
        state={baseState}
        onInteract={() => undefined}
      />,
    );

    expect(screen.getByTestId("vn-skill-dice-fallback")).toHaveTextContent(
      "[ФАСАД]",
    );
    expect(screen.queryByTestId("vn-skill-dice-scene")).toBeNull();
  });

  it("renders skill progression feedback in the result panel", () => {
    render(
      <VnSkillCheckResolveOverlay
        state={{
          ...baseState,
          phase: "result",
          skillProgress: {
            skillId: "attr_deception",
            skillLabel: "Deception",
            xpAwarded: 25,
            xpGained: 25,
            totalXp: 515,
            rankBefore: resolveSkillRank(490),
            rankAfter: resolveSkillRank(515),
            rankUp: true,
          },
        }}
        onInteract={() => undefined}
      />,
    );

    expect(screen.getByText("Deception rank up: B -> A")).toBeInTheDocument();
    expect(screen.getByText("A 15 / 100 | 515 XP")).toBeInTheDocument();
  });
});
