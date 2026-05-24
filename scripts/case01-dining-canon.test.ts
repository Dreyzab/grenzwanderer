import { describe, expect, it } from "vitest";

import {
  CASE01_DINING_NODE_IDS,
  CASE01_DEFAULT_ENTRY_SCENARIO_ID,
} from "../src/shared/case01Canon";
import { CASE01_CANON_NODES } from "./data/case01_canon_runtime";

const bodyOf = (nodeId: string): string => {
  const node = CASE01_CANON_NODES.find((candidate) => candidate.id === nodeId);
  expect(node, `Missing Case01 dining node ${nodeId}`).toBeTruthy();
  return node?.bodyOverride ?? "";
};

describe("Case01 dining-car deterministic canon", () => {
  it("anchors Eleonora and Lotte as an arranged train contact", () => {
    const intro = CASE01_CANON_NODES.find(
      (node) => node.id === CASE01_DINING_NODE_IDS.intro,
    );
    const mother = bodyOf(CASE01_DINING_NODE_IDS.mother);
    const introduction = bodyOf(CASE01_DINING_NODE_IDS.marriageJoke);
    const felixInterruption = bodyOf(CASE01_DINING_NODE_IDS.felixInterrupts);
    const scheduleObservation = bodyOf(
      "scene_case01_train_dining_car_eleonora_farewell_intro_observe",
    );

    expect(intro?.scenarioId).toBe(CASE01_DEFAULT_ENTRY_SCENARIO_ID);
    expect(intro?.sceneGroupId).toBe("train_dining_car");
    expect(mother).toContain("случайности тоже резервируют заранее");
    expect(mother).toContain("08:12, 08:27, 08:41");
    expect(introduction).toContain("Лотте Вебер");
    expect(introduction).not.toContain("Лотте Ребер");
    expect(felixInterruption).toContain(
      "раннее знание почти всегда означает долг",
    );
    expect(felixInterruption).toContain("зачем мать привезла его во Фрайбург");
    expect(scheduleObservation).toContain("Bankhaus/Rathaus");
    expect(scheduleObservation).toContain("отмененный маршрут");
  });
});
