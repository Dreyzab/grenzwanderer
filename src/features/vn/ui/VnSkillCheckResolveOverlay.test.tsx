import { render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
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

vi.mock("@react-three/fiber", () => ({
  Canvas: () => <div data-testid="mock-r3f-canvas" />,
  useFrame: () => undefined,
}));

vi.mock("./VnSkillCheckDiceScene", () => ({
  VnSkillCheckDiceScene: () => (
    <div data-testid="vn-skill-dice-scene">
      <div data-testid="mock-r3f-canvas" />
    </div>
  ),
}));

const baseState: VnSkillCheckResolveState = {
  scenarioId: "sandbox_case01_pilot",
  nodeId: "node_start",
  checkId: "check_probe",
  choiceId: "choice_probe",
  choiceText: "Probe witness",
  voiceId: "attr_social",
  voiceLabel: "Social",
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
  const originalGetContext = HTMLCanvasElement.prototype.getContext;
  const originalWebGl = (window as Window & { WebGLRenderingContext?: unknown })
    .WebGLRenderingContext;

  beforeEach(() => {
    vi.clearAllMocks();
    delete (window as Window & { WebGLRenderingContext?: unknown })
      .WebGLRenderingContext;
    HTMLCanvasElement.prototype.getContext = vi.fn(
      () => null,
    ) as unknown as typeof HTMLCanvasElement.prototype.getContext;
  });

  afterEach(() => {
    if (originalWebGl === undefined) {
      delete (window as Window & { WebGLRenderingContext?: unknown })
        .WebGLRenderingContext;
    } else {
      (
        window as Window & { WebGLRenderingContext?: unknown }
      ).WebGLRenderingContext = originalWebGl;
    }
    HTMLCanvasElement.prototype.getContext = originalGetContext;
  });

  it("renders the 2D fallback when WebGL is unavailable", () => {
    render(
      <VnSkillCheckResolveOverlay
        state={baseState}
        onInteract={() => undefined}
      />,
    );

    expect(screen.getByTestId("vn-skill-dice-fallback")).toBeInTheDocument();
    expect(screen.queryByTestId("vn-skill-dice-scene")).toBeNull();
  });

  it("loads the WebGL dice scene when WebGL is available", async () => {
    (
      window as Window & { WebGLRenderingContext?: unknown }
    ).WebGLRenderingContext = function WebGLRenderingContextMock() {};
    HTMLCanvasElement.prototype.getContext = vi.fn(
      () => ({}) as WebGLRenderingContext,
    ) as unknown as typeof HTMLCanvasElement.prototype.getContext;

    render(
      <VnSkillCheckResolveOverlay
        state={baseState}
        onInteract={() => undefined}
      />,
    );

    await waitFor(() => {
      expect(screen.getByTestId("vn-skill-dice-scene")).toBeInTheDocument();
    });
    expect(screen.getByTestId("mock-r3f-canvas")).toBeInTheDocument();
  });
});
