import React from "react";
import { fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { getVnStrings } from "../../features/i18n/uiStrings";
import { VnNarrativePanel } from "./VnNarrativePanel";

vi.mock("framer-motion", async () => {
  const React = await import("react");

  type MotionProps = {
    animate?: unknown;
    children?: React.ReactNode;
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
    useReducedMotion: () => false,
  };
});

vi.mock("../../features/vn/ui/VnNarrativeText", () => ({
  VnNarrativeText: ({ text }: { text: string }) => (
    <div data-testid="narrative-text">{text}</div>
  ),
}));

vi.mock("../../features/vn/ui/TypedText", async () => {
  const React = await import("react");

  return {
    TypedText: React.forwardRef(
      (
        { text }: { text: string },
        ref: React.ForwardedRef<{ finish: () => void }>,
      ) => {
        React.useImperativeHandle(ref, () => ({ finish: vi.fn() }), []);
        return <span>{text}</span>;
      },
    ),
  };
});

const strings = getVnStrings("en");

describe("VnNarrativePanel scene transition", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    Object.defineProperty(HTMLMediaElement.prototype, "play", {
      configurable: true,
      value: vi.fn().mockResolvedValue(undefined),
    });
    Object.defineProperty(HTMLMediaElement.prototype, "pause", {
      configurable: true,
      value: vi.fn(),
    });
  });

  it("hides text and choices until the first tap after image readiness", () => {
    const onSurfaceTap = vi.fn();

    render(
      <VnNarrativePanel
        t={strings}
        sceneId="scene-a"
        locationName="Station"
        narrativeText="First line"
        backgroundImageUrl="/scene-a.jpg"
        narrativeLayout="split"
        choicesSlot={<button type="button">Take train</button>}
        isTyping={false}
        onSurfaceTap={onSurfaceTap}
      />,
    );

    expect(screen.queryByText("First line")).not.toBeInTheDocument();
    expect(screen.queryByText("Take train")).not.toBeInTheDocument();

    fireEvent.load(screen.getByAltText("Background"));

    expect(screen.queryByText("First line")).not.toBeInTheDocument();

    fireEvent.click(
      screen.getByRole("button", { name: "Show dialogue and continue" }),
    );

    expect(screen.getByText("First line")).toBeInTheDocument();
    expect(screen.getByText("Take train")).toBeInTheDocument();

    fireEvent.click(screen.getByTestId("narrative-text"));

    expect(onSurfaceTap).toHaveBeenCalledTimes(1);
  });

  it("resets hidden chrome when the background visual key changes", () => {
    const onSurfaceTap = vi.fn();
    const { rerender } = render(
      <VnNarrativePanel
        t={strings}
        sceneId="scene-a"
        locationName="Station"
        narrativeText="First line"
        backgroundImageUrl="/scene-a.jpg"
        narrativeLayout="split"
        choicesSlot={<button type="button">Take train</button>}
        isTyping={false}
        onSurfaceTap={onSurfaceTap}
      />,
    );

    fireEvent.load(screen.getByAltText("Background"));
    fireEvent.click(
      screen.getByRole("button", { name: "Show dialogue and continue" }),
    );
    expect(screen.getByText("First line")).toBeInTheDocument();

    rerender(
      <VnNarrativePanel
        t={strings}
        sceneId="scene-b"
        locationName="Forest"
        narrativeText="Second line"
        backgroundImageUrl="/scene-b.jpg"
        narrativeLayout="split"
        choicesSlot={<button type="button">Follow tracks</button>}
        isTyping={false}
        onSurfaceTap={onSurfaceTap}
      />,
    );

    expect(screen.queryByText("Second line")).not.toBeInTheDocument();
    expect(screen.queryByText("Follow tracks")).not.toBeInTheDocument();

    const backgrounds = screen.getAllByAltText("Background");
    fireEvent.load(backgrounds[backgrounds.length - 1]);
    fireEvent.click(
      screen.getByRole("button", { name: "Show dialogue and continue" }),
    );

    expect(screen.getByText("Second line")).toBeInTheDocument();
    expect(onSurfaceTap).toHaveBeenCalledTimes(0);
  });

  it("keeps chrome revealed when only the scene id changes", () => {
    const onSurfaceTap = vi.fn();
    const { rerender } = render(
      <VnNarrativePanel
        t={strings}
        sceneId="scene-a"
        locationName="Station"
        narrativeText="First line"
        backgroundImageUrl="/shared-scene.jpg"
        narrativeLayout="split"
        choicesSlot={<button type="button">Take train</button>}
        isTyping={false}
        onSurfaceTap={onSurfaceTap}
      />,
    );

    fireEvent.load(screen.getByAltText("Background"));
    fireEvent.click(
      screen.getByRole("button", { name: "Show dialogue and continue" }),
    );
    expect(screen.getByText("First line")).toBeInTheDocument();

    rerender(
      <VnNarrativePanel
        t={strings}
        sceneId="scene-b"
        locationName="Station"
        narrativeText="Second line"
        backgroundImageUrl="/shared-scene.jpg"
        narrativeLayout="split"
        choicesSlot={<button type="button">Follow tracks</button>}
        isTyping={false}
        onSurfaceTap={onSurfaceTap}
      />,
    );

    expect(screen.getByText("Second line")).toBeInTheDocument();
    expect(screen.getByText("Follow tracks")).toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: "Show dialogue and continue" }),
    ).not.toBeInTheDocument();
  });

  it("keeps video sound prompt separate from the first reveal tap", () => {
    const onSurfaceTap = vi.fn();
    const { container } = render(
      <VnNarrativePanel
        t={strings}
        sceneId="video-scene"
        locationName="Cinema"
        narrativeText="Projected line"
        backgroundVideoUrl="/reel.mp4"
        backgroundVideoSoundPrompt
        narrativeLayout="split"
        isTyping={false}
        onSurfaceTap={onSurfaceTap}
      />,
    );

    const video = container.querySelector("video");
    expect(video).not.toBeNull();

    fireEvent.canPlay(video as HTMLVideoElement);
    fireEvent.click(screen.getByRole("button", { name: strings.withoutSound }));

    expect(screen.queryByText("Projected line")).not.toBeInTheDocument();

    fireEvent.click(
      screen.getByRole("button", { name: "Show dialogue and continue" }),
    );

    expect(screen.getByText("Projected line")).toBeInTheDocument();

    fireEvent.click(screen.getByTestId("narrative-text"));

    expect(onSurfaceTap).toHaveBeenCalledTimes(1);
  });
});
