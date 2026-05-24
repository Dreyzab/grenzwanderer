import { describe, expect, it } from "vitest";

import { buildCaseBuildArtifact } from "./case-build-artifact";
import { buildCaseIrFromSnapshot } from "./case-ir";
import type {
  CaseBuildLedgerEntry,
  CaseBuildVisualManifestEntry,
  CaseBuildVisualMissingAssetEntry,
  CaseBuildVisualVariantEntry,
} from "./case-build-artifact";
import type {
  MapSnapshot,
  QuestArchetype,
  TriggerRule,
  VnSnapshot,
} from "./types";

const caseId = "case01_mainline";

const snapshot: VnSnapshot = {
  schemaVersion: 9,
  scenarios: [
    {
      id: "case01_entry",
      title: "Case01 Entry",
      startNodeId: "node_start",
      nodeIds: ["node_start", "node_terminal"],
      packId: caseId,
      completionRoute: { nextScenarioId: "case01_next" },
    },
    {
      id: "sandbox_other",
      title: "Other",
      startNodeId: "node_other",
      nodeIds: ["node_other"],
      packId: "other_case",
    },
  ],
  nodes: [
    {
      id: "node_start",
      scenarioId: "case01_entry",
      title: "Start",
      body: "Start body.",
      onEnter: [
        {
          type: "discover_fact",
          caseId: "case_bankhaus_krebs_false_trail",
          factId: "fact_post_route_was_bent",
        },
        { type: "grant_evidence", evidenceId: "ev_wrong_post_lantern" },
        { type: "set_flag", key: "found_bank_clue", value: true },
      ],
      choices: [
        {
          id: "choice_continue",
          text: "Continue",
          nextNodeId: "node_terminal",
        },
      ],
    },
    {
      id: "node_terminal",
      scenarioId: "case01_entry",
      title: "Terminal",
      body: "Terminal body.",
      terminal: true,
      choices: [],
    },
    {
      id: "node_other",
      scenarioId: "sandbox_other",
      title: "Other",
      body: "Other body.",
      terminal: true,
      choices: [],
    },
  ],
  mindPalace: {
    cases: [
      {
        id: "case_bankhaus_krebs_false_trail",
        title: "Bankhaus Krebs False Trail",
      },
    ],
    facts: [],
    hypotheses: [
      {
        id: "hyp_route_bent",
        caseId: "case_bankhaus_krebs_false_trail",
        key: "hyp_route_bent",
        text: "The post route was bent.",
        requiredFactIds: ["fact_post_route_was_bent"],
        requiredVars: [],
        rewardEffects: [],
      },
    ],
    thoughts: [],
  },
  socialCatalog: {
    npcIdentities: [],
    services: [],
    rumors: [
      {
        id: "rumor_newsboy",
        title: "Newsboy rumor",
        caseId,
        leadPointId: "point_hbf",
        verifiesOn: ["fact"],
      },
    ],
    careerRanks: [],
  },
};

const mapSnapshot: MapSnapshot = {
  defaultRegionId: "FREIBURG_1905",
  regions: [
    {
      id: "FREIBURG_1905",
      name: "Freiburg",
      geoCenterLat: 47.9959,
      geoCenterLng: 7.8522,
      zoom: 14,
    },
  ],
  points: [
    {
      id: "point_hbf",
      title: "Hauptbahnhof",
      regionId: "FREIBURG_1905",
      lat: 47.997,
      lng: 7.841,
      category: "PUBLIC",
      locationId: "loc_hbf",
      unlockGroup: "case01.hbf",
      bindings: [
        {
          id: "binding_entry",
          trigger: "card_primary",
          label: "Enter",
          priority: 1,
          intent: "objective",
          conditions: [
            {
              type: "geofence_within",
              lat: 47.997,
              lng: 7.841,
              radiusMeters: 40,
            },
          ],
          actions: [
            { type: "start_scenario", scenarioId: "case01_entry" },
            {
              type: "discover_fact",
              caseId: "case_bankhaus_krebs_false_trail",
              factId: "fact_station_pressure",
            },
          ],
        },
      ],
    },
  ],
  qrCodeRegistry: [
    {
      codeId: "qr_hbf",
      codeHash: "hash",
      redeemPolicy: "once_per_player",
      effects: [
        { type: "unlock_group", groupId: "case01.hbf" },
        { type: "grant_evidence", evidenceId: "ev_qr_hbf_ticket" },
      ],
    },
  ],
};

const ledgerRows: CaseBuildLedgerEntry[] = [
  {
    scenarioId: "case01_entry",
    scenarioTitle: "Case01 Entry",
    nodeId: "node_start",
    nodeTitle: "Start",
    status: "COVERED",
    ownerLayer: "StoryDetective authoritative",
    identityFindings: [],
    sourcePaths: ["obsidian/StoryDetective/40_GameViewer/Case01/node_start.md"],
    note: "",
  },
  {
    scenarioId: "case01_entry",
    scenarioTitle: "Case01 Entry",
    nodeId: "node_terminal",
    nodeTitle: "Terminal",
    status: "BRIDGED",
    ownerLayer: "temporary_runtime_bridge",
    identityFindings: [],
    sourcePaths: [],
    note: "Temporary bridge.",
  },
];

const visualManifest: CaseBuildVisualManifestEntry[] = [
  {
    locationId: "loc_hbf",
    districtId: "rail_hub",
    visualArchetype: "industrial_rail",
    assetKind: "exterior",
    masterRefId: "master_industrial_rail_exterior",
    defaultVariantId: "default",
    stateVariantIds: ["investigation"],
  },
];

const visualVariants: CaseBuildVisualVariantEntry[] = [
  {
    locationId: "loc_hbf",
    variantId: "default",
    expectedImagePath: "public/images/locations/loc_hbf.webp",
  },
];

const visualMissing: CaseBuildVisualMissingAssetEntry[] = [
  {
    locationId: "loc_hbf",
    variantId: "investigation",
    expectedImagePath: "public/images/locations/loc_hbf--investigation.webp",
    expectedMetaPath:
      "public/images/locations/loc_hbf--investigation.meta.json",
    issues: ["missing_expected_image"],
  },
];

const triggerRule: TriggerRule = {
  id: "trig.case01.newsboy",
  schemaVersion: 1,
  kindVersion: 1,
  status: "active",
  eventName: "case.entered",
  caseId,
  generatedNamespace: "overlay.proc.case01.newsboy",
  allowedArchetypeIds: ["arch.case01.newsboy"],
};

const questArchetype: QuestArchetype = {
  id: "arch.case01.newsboy",
  version: 1,
  kind: "rumor_followup",
  title: "Newsboy rumor",
  triggerRuleIds: [triggerRule.id],
  stepNodeIds: ["node_terminal"],
};

describe("CaseBuildArtifact", () => {
  it("builds a snapshot-bound Case01 CAS artifact with graph, POI, clue, visual, and AI sections", () => {
    const caseIr = buildCaseIrFromSnapshot(snapshot, {
      bundleChecksum: "snapshot-checksum",
    });
    const artifact = buildCaseBuildArtifact({
      caseId,
      snapshot,
      snapshotChecksum: "snapshot-checksum",
      snapshotPath: "content/vn/pilot.snapshot.json",
      caseIr,
      caseLedger: ledgerRows,
      mapSnapshot,
      visualManifest,
      visualVariants,
      visualMissingAssets: visualMissing,
      triggerRules: [triggerRule],
      questArchetypes: [questArchetype],
      supportedAiKinds: [
        "generate_character_reaction",
        "generate_dialogue",
        "propose_director_step",
        "propose_dm_turn",
      ],
      directorAllowedBeatIds: ["case01_entry"],
    });

    expect(artifact.source.snapshotChecksum).toBe("snapshot-checksum");
    expect(artifact.caseLedger.summary).toMatchObject({
      totalNodes: 2,
      coveredNodes: 1,
      bridgedNodes: 1,
    });
    expect(artifact.sceneGraph.scenarios.map((entry) => entry.id)).toEqual([
      "case01_entry",
    ]);
    expect(artifact.sceneGraph.nodes.map((entry) => entry.id)).not.toContain(
      "node_other",
    );
    expect(artifact.sceneGraph.edges).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          fromNodeId: "node_start",
          toId: "node_terminal",
          toKind: "node",
          via: "choice",
        }),
        expect.objectContaining({
          fromNodeId: "node_start",
          toId: "case01_next",
          toKind: "scenario",
          via: "completion_route",
        }),
      ]),
    );
    expect(artifact.poiGraph.locations).toEqual([
      expect.objectContaining({
        locationId: "loc_hbf",
        pointIds: ["point_hbf"],
        scenarioIds: ["case01_entry"],
        visualStateIds: ["default", "investigation"],
      }),
    ]);
    expect(artifact.poiGraph.qrGates).toEqual([
      expect.objectContaining({
        codeId: "qr_hbf",
        unlockGroupIds: ["case01.hbf"],
        pointIds: ["point_hbf"],
      }),
    ]);
    expect(artifact.poiGraph.geofenceConditions).toHaveLength(1);
    expect(
      artifact.clueLifecycleGraph.facts.map((entry) => entry.factId),
    ).toEqual(
      expect.arrayContaining([
        "fact_post_route_was_bent",
        "fact_station_pressure",
      ]),
    );
    expect(
      artifact.clueLifecycleGraph.evidence.map((entry) => entry.evidenceId),
    ).toEqual(
      expect.arrayContaining(["ev_wrong_post_lantern", "ev_qr_hbf_ticket"]),
    );
    expect(artifact.visualManifest.visualStateHints).toEqual([
      {
        locationId: "loc_hbf",
        defaultStateId: "default",
        stateIds: ["default", "investigation"],
        missingVariantIds: ["investigation"],
      },
    ]);
    expect(artifact.aiCapabilityManifest.director).toMatchObject({
      kind: "propose_director_step",
      presentationOnly: true,
      stateMutationAllowed: false,
      stepTypes: ["framing", "next_beat_hint", "soft_detour"],
      allowedBeatIds: ["case01_entry"],
    });
    expect(artifact.aiCapabilityManifest.tabletopDm).toMatchObject({
      kind: "propose_dm_turn",
      source: "dm_side_panel",
      stateMutationAllowed: false,
      requiresReviewAccept: true,
      sessionCanonOnly: true,
    });
    expect(artifact.qaFindings.map((entry) => entry.code)).toEqual(
      expect.arrayContaining([
        "case01_temporary_runtime_bridge",
        "visual_manifest_missing_asset",
      ]),
    );
  });
});
