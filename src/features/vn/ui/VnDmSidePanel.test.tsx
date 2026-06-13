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

type PanelProps = Parameters<typeof VnDmSidePanel>[0];

const renderPanel = (overrides: Partial<PanelProps> = {}) => {
  const enqueueAiRequest = vi.fn(
    async (_input: EnqueueAiRequestInput): Promise<unknown> => undefined,
  );
  const props: PanelProps = {
    scenarioId: "sandbox_ghost_pilot",
    nodeId: "scene_evidence_collection",
    narrativeResources: { fate: 6, fortune: 0, fortuneMod: -1, karma: -10 },
    myFlags: { origin_witch: true },
    myVars: {
      witch_blood_curse_tier: 1,
      witch_blood_curse_pressure: 35,
      witch_blood_power: 0,
      witch_blood_debt: 0,
      witch_alcohol_aftertaste: 0,
    },
    visibleFacts: ["Karl fears the pantry corridor."],
    activeRequest: null,
    activeProposal: null,
    enqueueAiRequest,
    onError: vi.fn(),
    ...overrides,
  };
  const view = render(<VnDmSidePanel {...props} />);
  const rerender = (next: Partial<PanelProps>) =>
    view.rerender(<VnDmSidePanel {...props} {...next} />);
  return { enqueueAiRequest, rerender };
};

const expandPanel = () => {
  fireEvent.click(screen.getByTestId("vn-dm-panel-toggle"));
};

describe("VnDmSidePanel", () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  it("submits Action and private Remark as a DM turn payload", async () => {
    const { enqueueAiRequest } = renderPanel();
    expandPanel();

    fireEvent.change(screen.getByTestId("vn-dm-action"), {
      target: { value: "Я запугиваю Карла у двери кладовой." },
    });
    fireEvent.change(screen.getByTestId("vn-dm-remark"), {
      target: {
        value: "Я хочу убедиться, что он не расскажет общему знакомому.",
      },
    });
    fireEvent.click(screen.getByTestId("vn-dm-spend-fate"));
    fireEvent.click(screen.getByTestId("vn-dm-ask"));

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

  it("accepts a captured beat proposal into the session ledger instead of authored canon", async () => {
    const { enqueueAiRequest, rerender } = renderPanel();
    expandPanel();

    // Fire one beat; the panel renders only proposals it captured from its own request.
    fireEvent.click(screen.getByTestId("vn-dm-ask"));
    await waitFor(() => {
      expect(enqueueAiRequest).toHaveBeenCalledTimes(1);
    });
    const requestId = enqueueAiRequest.mock.calls[0]?.[0]?.requestId;
    expect(requestId).toBeTruthy();

    // The worker completes: feed the matching request + proposal back in.
    rerender({
      activeRequest: {
        requestId,
        status: "completed",
        kind: AI_PROPOSE_DM_TURN_KIND,
      } as any,
      activeProposal: baseProposal,
    });

    await waitFor(() => {
      expect(
        screen.getByText("Karl knows a pantry route used after midnight."),
      ).toBeInTheDocument();
    });
    fireEvent.click(screen.getByTestId("vn-dm-accept"));

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

    expect(screen.queryByTestId("vn-dm-panel")).not.toBeInTheDocument();

    expandPanel();
    expect(screen.getByTestId("vn-dm-panel")).toBeInTheDocument();

    fireEvent.click(screen.getByTestId("vn-dm-hide"));
    expect(screen.queryByTestId("vn-dm-panel")).not.toBeInTheDocument();

    expandPanel();
    expect(screen.getByTestId("vn-dm-panel")).toBeInTheDocument();
  });
});
