import { buildOriginChoiceEffects, originProfiles } from "../../origins.manifest";
import type { ChoiceBlueprint } from "../../vn-blueprint-types";

const journalist = originProfiles.find((profile) => profile.id === "journalist");
if (!journalist) {
  throw new Error("Journalist origin profile is missing from originProfiles");
}

const detective = originProfiles.find((profile) => profile.id === "detective");
if (!detective) {
  throw new Error("Detective origin profile is missing from originProfiles");
}

export const journalistOriginProfile = journalist;
export const detectiveOriginProfile = detective;

export const originBackstoryChoices: ChoiceBlueprint[] = originProfiles.map(
  (profile) => ({
    id: profile.choiceId,
    text: profile.label,
    nextNodeId: "scene_map_intro",
    effects: buildOriginChoiceEffects(profile),
  }),
);
