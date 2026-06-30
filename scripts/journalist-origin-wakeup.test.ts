import { describe, expect, it } from "vitest";
import {
  PACK_JOURNALIST_ORIGIN_NODES,
  PACK_JOURNALIST_ORIGIN_SCENARIOS,
} from "./data/vn-packs/pack_journalist_origin";

const nodeById = (id: string) => {
  const node = PACK_JOURNALIST_ORIGIN_NODES.find(
    (candidate) => candidate.id === id,
  );
  expect(node, `Missing journalist origin node ${id}`).toBeTruthy();
  return node;
};

describe("journalist agency wakeup", () => {
  it("starts with the immersion-bath literary proof instead of Lotte ordering the journalist up", () => {
    const scenario = PACK_JOURNALIST_ORIGIN_SCENARIOS.find(
      (candidate) => candidate.id === "journalist_agency_wakeup",
    );
    const wakeup = nodeById("scene_journalist_agency_wakeup");
    const body = wakeup?.bodyOverride ?? "";

    expect(scenario?.startNodeId).toBe("scene_journalist_agency_wakeup");
    expect(wakeup?.backgroundUrl).toBe(
      "/VN/start/journalist/Gemini_Generated_Image4.png",
    );
    expect(wakeup?.characterId).toBe("npc_dr_erasmus_lebrecht");
    expect(body).toContain("Dr. Erasmus Lebrecht");
    expect(body).toContain("Where is my notebook?");
    expect(body).toContain("Fräulein Weber");
    expect(body).toContain("already not your sentence");
    expect(body).not.toContain("Lotte");
  });

  it("keeps Weber in the journalist route as the Bureau sister, not the open switchboard Lotte", () => {
    const memoryGap = nodeById("scene_journalist_memory_gap");
    const pitch = nodeById("scene_journalist_recruitment_pitch");
    const combined = `${memoryGap?.bodyOverride ?? ""}\n${pitch?.bodyOverride ?? ""}\n${memoryGap?.choices.map((choice) => choice.text).join("\n")}`;

    expect(memoryGap?.characterId).toBe("npc_hedwig_weber");
    expect(pitch?.characterId).toBe("npc_hedwig_weber");
    expect(combined).toContain("H. Weber");
    expect(combined).toContain("Bureau");
    expect(combined).not.toContain("Ask Lotte");
    expect(combined).not.toContain("face Lotte");
  });
});
