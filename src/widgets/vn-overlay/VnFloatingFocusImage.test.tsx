import { render } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { VnFloatingFocusImage } from "./VnFloatingFocusImage";

const motionValues: Array<{ value: number; set: ReturnType<typeof vi.fn> }> =
  [];
const animateSpy = vi.fn(() => ({ stop: vi.fn() }));

vi.mock("framer-motion", async () => {
  const React = await import("react");
  return {
    motion: new Proxy(
      {},
      {
        get:
          (_target, tag) =>
          ({ style: _style, ...props }: Record<string, unknown>) =>
            React.createElement(tag as string, props),
      },
    ),
    useMotionValue: (initial: number) => {
      const entry = { value: initial, set: vi.fn() };
      motionValues.push(entry);
      return { get: () => entry.value, set: entry.set, on: () => () => {} };
    },
    useMotionTemplate: () => "",
    animate: (value: any, keyframes: any, options?: any) =>
      (animateSpy as any)(value, keyframes, options),
  };
});

const setOrientation = (portrait: boolean) => {
  window.matchMedia = ((query: string) => ({
    matches: query.includes("portrait") ? portrait : !portrait,
    media: query,
    onchange: null,
    addEventListener: () => {},
    removeEventListener: () => {},
    addListener: () => {},
    removeListener: () => {},
    dispatchEvent: () => false,
  })) as unknown as typeof window.matchMedia;
};

const baseProps = {
  src: "/scenes/market.jpg",
  className: "object-cover",
  onLoad: () => {},
  onError: () => {},
};

beforeEach(() => {
  motionValues.length = 0;
  animateSpy.mockClear();
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe("VnFloatingFocusImage", () => {
  it("drifts in portrait when no focus path is authored (ambient mode)", () => {
    setOrientation(true);
    render(
      <VnFloatingFocusImage {...baseProps} prefersReducedMotion={false} />,
    );

    // ox, oy, scale each get an animation.
    expect(animateSpy).toHaveBeenCalledTimes(3);
    const oxKeyframes = (animateSpy.mock.calls as any)[0][1] as number[];
    expect(Array.isArray(oxKeyframes)).toBe(true);
    expect(oxKeyframes.length).toBeGreaterThan(2);
    // Ambient drift centres on 50 with symmetric excursions.
    expect(oxKeyframes[0]).toBe(50);
  });

  it("eases through authored focus points in portrait", () => {
    setOrientation(true);
    render(
      <VnFloatingFocusImage
        {...baseProps}
        prefersReducedMotion={false}
        focusPath={[
          { x: 20, y: 30 },
          { x: 80, y: 60 },
        ]}
      />,
    );

    expect(animateSpy).toHaveBeenCalledTimes(3);
    const oxKeyframes = (animateSpy.mock.calls as any)[0][1] as number[];
    const oyKeyframes = (animateSpy.mock.calls as any)[1][1] as number[];
    // Authored x/y values appear in the camera path.
    expect(oxKeyframes).toContain(20);
    expect(oxKeyframes).toContain(80);
    expect(oyKeyframes).toContain(30);
    expect(oyKeyframes).toContain(60);
  });

  it("stays static in landscape (no animation, rests on centre)", () => {
    setOrientation(false);
    render(
      <VnFloatingFocusImage {...baseProps} prefersReducedMotion={false} />,
    );

    expect(animateSpy).not.toHaveBeenCalled();
    // ox/oy settle to the rest position (50% centre).
    expect(motionValues[0]?.set).toHaveBeenCalledWith(50);
    expect(motionValues[1]?.set).toHaveBeenCalledWith(50);
  });

  it("stays static under reduced motion even in portrait", () => {
    setOrientation(true);
    render(<VnFloatingFocusImage {...baseProps} prefersReducedMotion={true} />);

    expect(animateSpy).not.toHaveBeenCalled();
  });

  it("rests on the first authored focus point when static", () => {
    setOrientation(false);
    render(
      <VnFloatingFocusImage
        {...baseProps}
        prefersReducedMotion={false}
        focusPath={[{ x: 35, y: 70 }]}
      />,
    );

    expect(animateSpy).not.toHaveBeenCalled();
    expect(motionValues[0]?.set).toHaveBeenCalledWith(35);
    expect(motionValues[1]?.set).toHaveBeenCalledWith(70);
  });
});
