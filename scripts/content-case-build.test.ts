import { describe, expect, it } from "vitest";

import {
  isCaseBuildArtifactStale,
  renderCaseBuildArtifactJson,
} from "./content-case-build";
import type { CaseBuildArtifact } from "../src/shared/vn-contract";

const artifact: CaseBuildArtifact = {
  schemaVersion: 1,
  artifactKind: "case_build",
  caseId: "case01_mainline",
  source: {
    snapshotPath: "content/vn/pilot.snapshot.json",
    snapshotChecksum: "abc",
    snapshotSchemaVersion: 9,
    caseIrSource: "vn_snapshot",
  },
  caseLedger: {
    summary: {
      totalNodes: 0,
      coveredNodes: 0,
      bridgedNodes: 0,
      missingNodes: 0,
      identityDriftNodes: 0,
    },
    nodes: [],
  },
  sceneGraph: { scenarios: [], nodes: [], edges: [] },
  poiGraph: {
    locations: [],
    points: [],
    qrGates: [],
    geofenceConditions: [],
  },
  clueLifecycleGraph: {
    facts: [],
    evidence: [],
    clueFlags: [],
    hypotheses: [],
    rumors: [],
  },
  questArchetypePack: {
    triggerRules: [],
    questArchetypes: [],
  },
  visualManifest: {
    locations: [],
    variants: [],
    missingAssets: [],
    visualStateHints: [],
  },
  aiCapabilityManifest: {
    supportedKinds: [],
    director: {
      kind: "propose_director_step",
      source: "vn_node_entry",
      presentationOnly: true,
      stateMutationAllowed: false,
      stepTypes: ["framing", "next_beat_hint", "soft_detour"],
      outputFields: [
        "stepType",
        "framingText",
        "suggestedReturnBeatId",
        "bridgeText",
        "hintFactId",
      ],
      allowedBeatIds: [],
    },
    tabletopDm: {
      kind: "propose_dm_turn",
      source: "dm_side_panel",
      presentationOnly: false,
      stateMutationAllowed: false,
      requiresReviewAccept: true,
      sessionCanonOnly: true,
      outputFields: [
        "narration",
        "checks",
        "sessionFacts",
        "suggestedStateDeltas",
        "risks",
        "toneMode",
        "canonRemarks",
        "resourceCosts",
      ],
      allowedStateDeltaPrefixes: [
        "session.",
        "dm_session.",
        "overlay.session.",
        "session_",
        "witch_",
        "ghost_session_",
      ],
    },
  },
  qaFindings: [],
};

describe("content:case-build stale detection", () => {
  it("renders deterministic JSON and detects stale artifacts by exact content", () => {
    const rendered = renderCaseBuildArtifactJson(artifact);

    expect(rendered.endsWith("\n")).toBe(true);
    expect(isCaseBuildArtifactStale(rendered, rendered)).toBe(false);
    expect(isCaseBuildArtifactStale(null, rendered)).toBe(true);
    expect(isCaseBuildArtifactStale(`${rendered}\n`, rendered)).toBe(true);
  });
});
