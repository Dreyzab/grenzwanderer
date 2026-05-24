import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  AI_PROPOSE_DM_TURN_KIND,
  type DmTurnProposal,
} from "../../ai/contracts";
import { VnDmSidePanel } from "./VnDmSidePanel";

type EnqueueAiRequestInput = {
  requestId: string;
  kind: string;
  payloadJson: string;
};

const baseProposal: DmTurnProposal = {
  narration: "Карл показывает на кладовую, но просит не называть его имени.",
  checks: [],
  sessionFacts: [
    {
      id: "session.karl.pantry_route",
      text: "Karl knows a pantry route used after midnight.",
      scope: "session",
      source: "dm",
      status: "proposed",
    },
  ],
  suggestedStateDeltas: [],
  risks: ["Karl may warn the Baroness."],
  toneMode: "gothic_mystery",
  canonRemarks: ["Review then accept."],
  resourceCosts: { fate: 1 },
};

const renderPanel = (
  overrides: Partial<Parameters<typeof VnDmSidePanel>[0]> = {},
) => {
  const enqueueAiRequest = vi.fn(
    async (_input: EnqueueAiRequestInput): Promise<unknown> => undefined,
  );
  render(
    <VnDmSidePanel
      scenarioId="sandbox_ghost_pilot"
      nodeId="scene_evidence_collection"
      narrativeResources={{
        fate: 6,
        fortune: 0,
        fortuneMod: -1,
        karma: -10,
      }}
      myFlags={{ origin_witch: true }}
      myVars={{
        witch_blood_curse_tier: 1,
        witch_blood_curse_pressure: 35,
        witch_blood_power: 0,
        witch_blood_debt: 0,
        witch_alcohol_aftertaste: 0,
      }}
      visibleFacts={["Karl fears the pantry corridor."]}
      activeRequest={null}
      activeProposal={null}
      enqueueAiRequest={enqueueAiRequest}
      onError={vi.fn()}
      {...overrides}
    />,
  );
  return { enqueueAiRequest };
};

describe("VnDmSidePanel", () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  it("submits Action and private Remark as a DM turn payload", async () => {
    const { enqueueAiRequest } = renderPanel();

    fireEvent.change(screen.getByTestId("vn-dm-action"), {
      target: { value: "Я запугиваю Карла у двери кладовой." },
    });
    fireEvent.change(screen.getByTestId("vn-dm-remark"), {
      target: {
        value: "Я хочу убедиться, что он не расскажет общему знакомому.",
      },
    });
    fireEvent.click(screen.getByLabelText("Spend Fate"));
    fireEvent.click(screen.getByRole("button", { name: "Ask DM" }));

    await waitFor(() => {
      expect(enqueueAiRequest).toHaveBeenCalledTimes(1);
    });
    const request = enqueueAiRequest.mock.calls[0]?.[0];
    expect(request).toBeDefined();
    if (!request) {
      throw new Error("Expected DM enqueue request.");
    }
    expect(request.kind).toBe(AI_PROPOSE_DM_TURN_KIND);
    expect(JSON.parse(request.payloadJson)).toMatchObject({
      source: "dm_side_panel",
      actionText: "Я запугиваю Карла у двери кладовой.",
      remark: {
        text: "Я хочу убедиться, что он не расскажет общему знакомому.",
        visibility: "private_dm",
      },
      spendFateToken: true,
      resources: {
        fate: 6,
        fortune: 0,
        fortuneMod: -1,
        karma: -10,
      },
      bloodCurse: {
        tier: 1,
        pressure: 35,
      },
    });
  });

  it("accepts a proposal into the session ledger instead of authored canon", () => {
    renderPanel({
      activeRequest: {
        requestId: "dm-1",
        status: "completed",
        kind: AI_PROPOSE_DM_TURN_KIND,
      } as any,
      activeProposal: baseProposal,
    });

    expect(
      screen.getByText("Karl knows a pantry route used after midnight."),
    ).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Accept proposal" }));

    const saved = JSON.parse(
      window.localStorage.getItem(
        "grenzwanderer_dm_session_ledger_sandbox_ghost_pilot",
      ) ?? "{}",
    );
    expect(saved.acceptedFacts[0]).toMatchObject({
      id: "session.karl.pantry_route",
      status: "accepted",
    });
  });

  it("can hide and show the side panel", () => {
    renderPanel();

    fireEvent.click(screen.getByRole("button", { name: "Hide" }));
    expect(screen.queryByTestId("vn-dm-panel")).not.toBeInTheDocument();

    fireEvent.click(screen.getByTestId("vn-dm-panel-toggle"));
    expect(screen.getByTestId("vn-dm-panel")).toBeInTheDocument();
  });
});
