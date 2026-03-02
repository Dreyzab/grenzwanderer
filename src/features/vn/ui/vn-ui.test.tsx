import { useRef } from "react";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import type { VnChoice } from "../types";
import { resolveBackgroundUrl } from "./VnBackgroundResolver";
import { VnChoiceButton } from "./VnChoiceButton";
import { TypedText, type TypedTextHandle } from "./TypedText";
import { parseClueMarkup } from "./TypedTextParser";

describe("vn ui helpers", () => {
  it("parses clue markup into text and clue segments", () => {
    const segments = parseClueMarkup(
      "Inspect [clue:Ledger Gap:fact_ledger_gap] before moving",
    );

    expect(segments).toHaveLength(3);
    expect(segments[0]).toEqual({ kind: "text", text: "Inspect " });
    expect(segments[1]).toEqual({
      kind: "clue",
      text: "Ledger Gap",
      payload: "fact_ledger_gap",
    });
  });

  it("parses cyrillic clue markup", () => {
    const segments = parseClueMarkup(
      "В толпе ты замечаешь [clue:Пар:ev_station_steam].",
    );

    expect(segments).toHaveLength(3);
    expect(segments[1]).toEqual({
      kind: "clue",
      text: "Пар",
      payload: "ev_station_steam",
    });
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
      expect(token).toHaveClass("vn-typed-text__token");
    });
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
});
