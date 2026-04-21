import { act, fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { Toaster } from "../ui/Toaster";
import { ToastProvider, useToast } from "./useToast";

const Harness = () => {
  const { showToast } = useToast();
  return (
    <div>
      <button
        type="button"
        onClick={() =>
          showToast({
            message: "Loop toast",
            type: "info",
            dedupeKey: "loop",
            source: "system",
          })
        }
      >
        trigger-toast
      </button>
      <button
        type="button"
        onClick={() =>
          showToast({
            message: "Short toast",
            type: "info",
            ttlMs: 100,
            source: "system",
          })
        }
      >
        trigger-short-toast
      </button>
      <Toaster />
    </div>
  );
};

describe("useToast", () => {
  it("dedupes same key within dedupe window", async () => {
    const user = userEvent.setup();
    render(
      <ToastProvider>
        <Harness />
      </ToastProvider>,
    );

    await user.click(screen.getByRole("button", { name: "trigger-toast" }));
    await user.click(screen.getByRole("button", { name: "trigger-toast" }));

    expect(screen.getAllByText("Loop toast")).toHaveLength(1);
  });

  it("auto-dismisses toast by ttl", async () => {
    vi.useFakeTimers();
    render(
      <ToastProvider>
        <Harness />
      </ToastProvider>,
    );

    fireEvent.click(
      screen.getByRole("button", { name: "trigger-short-toast" }),
    );
    expect(screen.getByText("Short toast")).toBeInTheDocument();

    await act(async () => {
      vi.advanceTimersByTime(120);
    });

    expect(screen.queryByText("Short toast")).not.toBeInTheDocument();
    vi.useRealTimers();
  });
});
