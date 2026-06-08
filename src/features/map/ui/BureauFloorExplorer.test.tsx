import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";
import { BureauFloorExplorer } from "./BureauFloorExplorer";

describe("BureauFloorExplorer", () => {
  it("switches floors and opens room details from a hotspot", async () => {
    const user = userEvent.setup();
    render(<BureauFloorExplorer />);

    expect(
      screen.getByRole("heading", { name: "Оперативный штаб" }),
    ).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "1 этаж" })).toBeVisible();
    expect(
      screen.getByRole("heading", { name: "Вход с вывеской BÜRO" }),
    ).toBeVisible();

    await user.click(screen.getByRole("tab", { name: /-2 этаж/ }));
    expect(screen.getByRole("heading", { name: "-2 этаж" })).toBeVisible();

    await user.click(
      screen.getByRole("button", {
        name: "3. Лаборатория парапсихологии",
      }),
    );

    expect(
      screen.getByRole("heading", { name: "Лаборатория парапсихологии" }),
    ).toBeVisible();
    expect(screen.getByText(/духовного вмешательства/i)).toBeInTheDocument();
  });
});
