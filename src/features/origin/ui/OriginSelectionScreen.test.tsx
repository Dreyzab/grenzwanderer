import { fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { OriginSelectionScreen } from "./OriginSelectionScreen";

vi.mock("framer-motion", async () => {
  const React = await import("react");

  type MotionProps = {
    children?: React.ReactNode;
    animate?: unknown;
    exit?: unknown;
    initial?: unknown;
    transition?: unknown;
    whileHover?: unknown;
    whileTap?: unknown;
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
          whileHover: _whileHover,
          whileTap: _whileTap,
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
    AnimatePresence: ({ children }: { children: React.ReactNode }) => <>{children}</>,
    motion: new Proxy(
      {},
      {
        get: (_target, key) => createMotionComponent(key as keyof HTMLElementTagNameMap),
      },
    ),
  };
});

describe("OriginSelectionScreen", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders all four origins in array order on the list view", () => {
    render(
      <OriginSelectionScreen
        onCancel={vi.fn()}
        onConfirmOrigin={vi.fn()}
      />,
    );

    const cardButtons = screen
      .getAllByRole("button")
      .filter((button) => (button.textContent ?? "").includes("Origin"));

    expect(cardButtons).toHaveLength(4);
    expect(cardButtons[0]).toHaveTextContent("Journalist Origin");
    expect(cardButtons[1]).toHaveTextContent("Aristocrat Origin");
    expect(cardButtons[2]).toHaveTextContent("Veteran Origin");
    expect(cardButtons[3]).toHaveTextContent("Archivist Origin");
  });

  it("transitions from list to detail and back again", () => {
    render(
      <OriginSelectionScreen
        onCancel={vi.fn()}
        onConfirmOrigin={vi.fn()}
      />,
    );

    fireEvent.click(screen.getByRole("button", { name: /Charlotte von Waldstein/i }));

    expect(screen.getByText("SIGNATURE ABILITY")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /BEGIN INVESTIGATION/i })).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: /BACK/i }));

    expect(screen.getByText("Select Origin")).toBeInTheDocument();
    expect(screen.queryByText("SIGNATURE ABILITY")).not.toBeInTheDocument();
  });

  it("confirms the selected origin from the detail view", () => {
    const onConfirmOrigin = vi.fn();

    render(
      <OriginSelectionScreen
        onCancel={vi.fn()}
        onConfirmOrigin={onConfirmOrigin}
      />,
    );

    fireEvent.click(screen.getByRole("button", { name: /Arthur Vance/i }));
    fireEvent.click(screen.getByRole("button", { name: /BEGIN INVESTIGATION/i }));

    expect(onConfirmOrigin).toHaveBeenCalledWith("journalist");
  });

  it("shows status on the list view and disables the detail CTA when requested", () => {
    const onConfirmOrigin = vi.fn();
    const view = render(
      <OriginSelectionScreen
        status="Launching Freiburg origin..."
        onCancel={vi.fn()}
        onConfirmOrigin={onConfirmOrigin}
      />,
    );

    expect(screen.getByText("Launching Freiburg origin...")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: /Martha Heller/i }));

    view.rerender(
      <OriginSelectionScreen
        disabled
        status="Launching Freiburg origin..."
        onCancel={vi.fn()}
        onConfirmOrigin={onConfirmOrigin}
      />,
    );

    expect(screen.getByText("Launching Freiburg origin...")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /BEGIN INVESTIGATION/i })).toBeDisabled();
  });
});
