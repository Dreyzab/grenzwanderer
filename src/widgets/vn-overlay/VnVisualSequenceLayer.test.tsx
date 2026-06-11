import React from "react";
import { act, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import type { VnVisualSequence } from "../../features/vn/types";
import { VnVisualSequenceLayer } from "./VnVisualSequenceLayer";

vi.mock("framer-motion", async () => {
  const React = await import("react");
  type MotionProps = {
    children?: React.ReactNode;
  } & Record<string, unknown>;
  const motion = new Proxy(
    {},
    {
      get: (_target, tag: string) =>
        React.forwardRef<HTMLElement, MotionProps>(function MotionComponent(
          {
            animate: _animate,
            exit: _exit,
            initial: _initial,
            transition: _transition,
            children,
            ...props
          },
          ref,
        ) {
          return React.createElement(
            tag,
            { ...props, ref },
            children as React.ReactNode,
          );
        }),
    },
  );

  return {
    AnimatePresence: ({ children }: { children: React.ReactNode }) => children,
    motion,
  };
});

vi.mock("../../features/vn/hooks/usePrefetchVnVisuals", () => ({
  usePrefetchVnVisuals: vi.fn(),
}));

const sequence: VnVisualSequence = {
  skippable: true,
  advanceOnEnd: true,
  frames: [
    {
      imageUrl: "/memory/one.png",
      durationMs: 1000,
      transition: "cut",
    },
    {
      imageUrl: "/memory/two.png",
      durationMs: 1200,
      caption: "Second memory",
      transition: "crossfade",
      focusPoint: { x: 65, y: 40 },
    },
  ],
};

describe("VnVisualSequenceLayer", () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it("advances frames on their timers and completes once", () => {
    vi.useFakeTimers();
    const onComplete = vi.fn();
    render(
      <VnVisualSequenceLayer
        sequence={sequence}
        skipLabel="Skip memory"
        prefersReducedMotion={false}
        onComplete={onComplete}
      />,
    );

    const layer = screen.getByTestId("vn-visual-sequence");
    expect(layer.parentElement).toBe(document.body);
    expect(layer).toHaveClass("z-[300]");
    expect(document.querySelector('img[src="/memory/one.png"]')).not.toBeNull();
    act(() => vi.advanceTimersByTime(1000));
    expect(document.querySelector('img[src="/memory/two.png"]')).not.toBeNull();
    expect(screen.getByText("Second memory")).toBeInTheDocument();

    act(() => vi.advanceTimersByTime(1200 + 450));
    expect(onComplete).toHaveBeenCalledTimes(1);
    act(() => vi.advanceTimersByTime(5000));
    expect(onComplete).toHaveBeenCalledTimes(1);
  });

  it("skips from the button or Escape without double completion", () => {
    vi.useFakeTimers();
    const onComplete = vi.fn();
    render(
      <VnVisualSequenceLayer
        sequence={sequence}
        skipLabel="Skip memory"
        prefersReducedMotion={false}
        onComplete={onComplete}
      />,
    );

    fireEvent.click(screen.getByRole("button", { name: "Skip memory" }));
    fireEvent.keyDown(window, { key: "Escape" });
    act(() => vi.advanceTimersByTime(450));
    expect(onComplete).toHaveBeenCalledTimes(1);
  });

  it("does not advance on an ordinary surface click", () => {
    vi.useFakeTimers();
    render(
      <VnVisualSequenceLayer
        sequence={sequence}
        skipLabel="Skip memory"
        prefersReducedMotion={false}
      />,
    );

    fireEvent.click(screen.getByTestId("vn-visual-sequence"));
    expect(document.querySelector('img[src="/memory/one.png"]')).not.toBeNull();
  });

  it("moves past an image that fails to load", () => {
    vi.useFakeTimers();
    render(
      <VnVisualSequenceLayer
        sequence={sequence}
        skipLabel="Skip memory"
        prefersReducedMotion={false}
      />,
    );

    fireEvent.error(document.querySelector('img[src="/memory/one.png"]')!);
    expect(document.querySelector('img[src="/memory/two.png"]')).not.toBeNull();
  });
});
