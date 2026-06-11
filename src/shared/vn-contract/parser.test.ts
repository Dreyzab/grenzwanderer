import { describe, it, expect } from "vitest";
import { parseVnSnapshotPayload } from "./parser";
import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const pilotPath = path.resolve(
  __dirname,
  "../../../content/vn/pilot.snapshot.json",
);

describe("VN Snapshot Parser Fix", () => {
  it("should accept a snapshot even if vocabulary is slightly different", () => {
    const raw = readFileSync(pilotPath, "utf8");
    const parsed = JSON.parse(raw);

    // Artificially "pollute" the vocabulary with a new condition
    parsed.contractMetadata.vocabulary.conditions.push("some_new_condition");

    const payload = JSON.stringify(parsed);
    const result = parseVnSnapshotPayload(payload);

    expect(result.ok).toBe(true);
    if (result.ok) {
      // Ensure it was overwritten by the latest code metadata anyway
      expect(
        result.snapshot.contractMetadata?.vocabulary.conditions,
      ).not.toContain("some_new_condition");
    }
  });

  it("should provide detailed error if a node is invalid", () => {
    const raw = readFileSync(pilotPath, "utf8");
    const parsed = JSON.parse(raw);

    // Break a node
    parsed.nodes[0].id = 123; // Should be a string

    const payload = JSON.stringify(parsed);
    const result = parseVnSnapshotPayload(payload);

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.issues[0].path).toContain("nodes[");
      expect(result.issues[0].message).toBe("Invalid node structure");
    }
  });

  it("accepts discovery rules on map points", () => {
    const raw = readFileSync(pilotPath, "utf8");
    const parsed = JSON.parse(raw);

    parsed.map.points[0].discoveryRules = [
      {
        channel: "qr_scan",
        conditions: [
          { type: "flag_is", key: "agency_briefing_complete", value: true },
        ],
        skillGates: [{ skillId: "attr_forensics", rank: "B" }],
        signal: {
          enabled: true,
          priority: 20,
          requiresServerConfirmation: true,
          radii: {
            coldEnterMeters: 40,
            coldExitMeters: 45,
            warmEnterMeters: 30,
            warmExitMeters: 32,
            hotEnterMeters: 15,
            hotExitMeters: 20,
          },
        },
      },
      {
        channel: "observation_lens",
        conditions: [
          {
            type: "thought_state_is",
            thoughtId: "thought_rationalist",
            state: "internalized",
          },
        ],
      },
    ];

    const result = parseVnSnapshotPayload(JSON.stringify(parsed));

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.snapshot.map?.points[0]?.discoveryRules).toHaveLength(2);
    }
  });

  it("rejects malformed discovery rules", () => {
    const raw = readFileSync(pilotPath, "utf8");
    const parsed = JSON.parse(raw);

    parsed.map.points[0].discoveryRules = [
      {
        channel: "qr_scan",
        signal: { radii: { hotEnterMeters: "close" } },
      },
    ];

    const result = parseVnSnapshotPayload(JSON.stringify(parsed));

    expect(result.ok).toBe(false);
  });
});

describe("VN Snapshot Parser - visual sequences", () => {
  const buildFixture = () => {
    const raw = readFileSync(pilotPath, "utf8");
    const parsed = JSON.parse(raw);
    parsed.nodes[0].visualSequence = {
      skippable: true,
      advanceOnEnd: true,
      frames: [
        {
          imageUrl: "/VN/start/image/memory.png",
          durationMs: 2400,
          caption: "A remembered phrase",
          transition: "crossfade",
          focusPoint: { x: 45, y: 60 },
        },
      ],
    };
    return parsed;
  };

  it("accepts a well-formed visual sequence", () => {
    expect(parseVnSnapshotPayload(JSON.stringify(buildFixture())).ok).toBe(
      true,
    );
  });

  it("rejects malformed duration, transition, and focus metadata", () => {
    const invalidPatches = [
      { durationMs: 10 },
      { transition: "dissolve" },
      { focusPoint: { x: 101, y: 50 } },
    ];

    for (const patch of invalidPatches) {
      const fixture = buildFixture();
      Object.assign(fixture.nodes[0].visualSequence.frames[0], patch);
      expect(parseVnSnapshotPayload(JSON.stringify(fixture)).ok).toBe(false);
    }
  });
});

describe("VN Snapshot Parser - character progression contract", () => {
  const buildFixtureWithChoice = (choicePatch: Record<string, unknown>) => {
    const raw = readFileSync(pilotPath, "utf8");
    const parsed = JSON.parse(raw);
    const node = parsed.nodes.find(
      (entry: any) => Array.isArray(entry.choices) && entry.choices.length > 0,
    );
    node.choices[0] = {
      ...node.choices[0],
      ...choicePatch,
    };
    return parsed;
  };

  it("accepts choiceSource, synergyId, core_gte, indicator_rank_gte, and new modifier sources", () => {
    const result = parseVnSnapshotPayload(
      JSON.stringify(
        buildFixtureWithChoice({
          choiceSource: "synergy",
          requireAll: [
            { type: "core_gte", coreId: "mind", value: 6 },
            { type: "indicator_rank_gte", indicatorId: "talker", value: 2 },
          ],
          skillCheck: {
            id: "progression_contract_check",
            voiceId: "attr_logic",
            difficulty: 10,
            synergyId: "mind_empathy_soft_contradiction",
            modifiers: [
              { source: "core", sourceId: "mind", delta: 1 },
              { source: "origin", sourceId: "detective", delta: 1 },
              { source: "indicator", sourceId: "talker", delta: 1 },
              { source: "stress", sourceId: "stress_index", delta: -1 },
              { source: "curse", sourceId: "curse_pressure", delta: -1 },
              {
                source: "voice_synergy",
                sourceId: "mind_empathy_soft_contradiction",
                delta: 1,
              },
            ],
          },
        }),
      ),
    );

    expect(result.ok).toBe(true);
  });

  it("rejects unknown core ids, indicator ids, synergy ids, and modifier sources", () => {
    const invalidFixtures = [
      buildFixtureWithChoice({
        requireAll: [{ type: "core_gte", coreId: "memory", value: 6 }],
      }),
      buildFixtureWithChoice({
        requireAll: [
          { type: "indicator_rank_gte", indicatorId: "gossip", value: 1 },
        ],
      }),
      buildFixtureWithChoice({
        skillCheck: {
          id: "bad_synergy_check",
          voiceId: "attr_logic",
          difficulty: 10,
          synergyId: "mind_music_impossible",
        },
      }),
      buildFixtureWithChoice({
        skillCheck: {
          id: "bad_modifier_check",
          voiceId: "attr_logic",
          difficulty: 10,
          modifiers: [{ source: "mood", sourceId: "rain", delta: -1 }],
        },
      }),
    ];

    for (const fixture of invalidFixtures) {
      expect(parseVnSnapshotPayload(JSON.stringify(fixture)).ok).toBe(false);
    }
  });
});

describe("VN Snapshot Parser — hub nodes", () => {
  const buildHubNode = (overrides: Record<string, unknown> = {}) => ({
    id: "scene_case01_train_hub_fixture",
    scenarioId: "case01_hbf_arrival",
    title: "Train hub",
    body: "Hub body",
    interactionMode: "hub",
    hubSchema: {
      id: "train_hub_fixture",
      imageUrl: "/images/train_interior_eleanor_map.svg",
      viewBox: "0 0 2400 1000",
      aspectRatio: 2.4,
      defaultCurrentZoneId: "compartment",
      zones: [
        {
          id: "compartment",
          label: "Купе",
          svgPath: "M80 240 H820 V780 H80 Z",
        },
        {
          id: "dining_car",
          label: "Вагон-ресторан",
          svgPath: "M1320 220 H2000 V780 H1320 Z",
        },
      ],
    },
    choices: [
      {
        id: "HUB_ZONE_COMPARTMENT",
        text: "Купе",
        nextNodeId: "scene_case01_train_compartment_letter",
        hotspot: { zoneId: "compartment" },
      },
      {
        id: "HUB_ZONE_DINING",
        text: "Вагон-ресторан",
        nextNodeId: "scene_case01_train_dining_car_intro",
        hotspot: { zoneId: "dining_car", priority: 1 },
      },
    ],
    ...overrides,
  });

  const buildFixture = (hubOverrides: Record<string, unknown> = {}) => {
    const raw = readFileSync(pilotPath, "utf8");
    const parsed = JSON.parse(raw);
    parsed.nodes.push(buildHubNode(hubOverrides));
    return parsed;
  };

  it("accepts a well-formed hub node", () => {
    const result = parseVnSnapshotPayload(JSON.stringify(buildFixture()));
    expect(result.ok).toBe(true);
  });

  it("accepts hub nodes with an explicit hubPresentation", () => {
    for (const presentation of ["overlay", "inline_panel"]) {
      const result = parseVnSnapshotPayload(
        JSON.stringify(buildFixture({ hubPresentation: presentation })),
      );
      expect(result.ok, `hubPresentation=${presentation}`).toBe(true);
    }
  });

  it("rejects an unknown hubPresentation value", () => {
    const result = parseVnSnapshotPayload(
      JSON.stringify(buildFixture({ hubPresentation: "sidebar" })),
    );
    expect(result.ok).toBe(false);
  });

  it("rejects hubPresentation on a non-hub node", () => {
    const result = parseVnSnapshotPayload(
      JSON.stringify(
        buildFixture({
          interactionMode: "standard",
          hubSchema: undefined,
          choices: [],
          hubPresentation: "inline_panel",
        }),
      ),
    );
    expect(result.ok).toBe(false);
  });

  it("rejects hub nodes with a malformed viewBox", () => {
    const result = parseVnSnapshotPayload(
      JSON.stringify(
        buildFixture({
          hubSchema: {
            id: "train_hub",
            imageUrl: "/images/train_interior_eleanor_map.svg",
            viewBox: "0 0 2400", // missing dimension
            aspectRatio: 2.4,
            zones: [
              {
                id: "compartment",
                label: "Купе",
                svgPath: "M80 240 H820 V780 H80 Z",
              },
            ],
          },
          choices: [],
        }),
      ),
    );
    expect(result.ok).toBe(false);
  });

  it("rejects hotspot choices whose zoneId is not declared", () => {
    const result = parseVnSnapshotPayload(
      JSON.stringify(
        buildFixture({
          choices: [
            {
              id: "HUB_ZONE_GHOST",
              text: "Ghost zone",
              nextNodeId: "scene_case01_train_compartment_letter",
              hotspot: { zoneId: "nonexistent_zone" },
            },
          ],
        }),
      ),
    );
    expect(result.ok).toBe(false);
  });

  it("rejects hotspot choices outside hub-mode nodes", () => {
    const result = parseVnSnapshotPayload(
      JSON.stringify(
        buildFixture({
          interactionMode: "standard",
          hubSchema: undefined,
          choices: [
            {
              id: "HUB_ZONE_COMPARTMENT",
              text: "Купе",
              nextNodeId: "scene_case01_train_compartment_letter",
              hotspot: { zoneId: "compartment" },
            },
          ],
        }),
      ),
    );
    expect(result.ok).toBe(false);
  });

  it("rejects hubSchema with defaultCurrentZoneId that isn't a zone", () => {
    const result = parseVnSnapshotPayload(
      JSON.stringify(
        buildFixture({
          hubSchema: {
            id: "train_hub",
            imageUrl: "/images/train_interior_eleanor_map.svg",
            viewBox: "0 0 2400 1000",
            aspectRatio: 2.4,
            defaultCurrentZoneId: "phantom_car",
            zones: [
              {
                id: "compartment",
                label: "Купе",
                svgPath: "M80 240 H820 V780 H80 Z",
              },
            ],
          },
          choices: [
            {
              id: "HUB_ZONE_COMPARTMENT",
              text: "Купе",
              nextNodeId: "scene_case01_train_compartment_letter",
              hotspot: { zoneId: "compartment" },
            },
          ],
        }),
      ),
    );
    expect(result.ok).toBe(false);
  });

  it("rejects set_hub_zone effects with empty zoneId", () => {
    const raw = readFileSync(pilotPath, "utf8");
    const parsed = JSON.parse(raw);
    const node = buildHubNode() as any;
    node.choices[0] = {
      ...node.choices[0],
      effects: [{ type: "set_hub_zone", hubSchemaId: "train_hub", zoneId: "" }],
    };
    parsed.nodes.push(node);
    const result = parseVnSnapshotPayload(JSON.stringify(parsed));
    expect(result.ok).toBe(false);
  });
});
