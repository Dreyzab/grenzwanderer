import { describe, expect, it } from "vitest";

import { getParliamentModule } from "../../../data/parliamentModules";
import { innerVoiceRankVarKeyFor } from "../../../data/innerVoiceContract";
import { buildOriginChoiceEffects, originProfiles } from "./originProfiles";

describe("buildOriginChoiceEffects", () => {
  it("seeds every origin's parliament emphasis, not only the witch's", () => {
    for (const profile of originProfiles) {
      const emphasis = getParliamentModule(profile.id)?.emphasis ?? {};
      expect(
        Object.keys(emphasis).length,
        `module emphasis missing for ${profile.id}`,
      ).toBeGreaterThan(0);

      const effects = buildOriginChoiceEffects(profile);
      for (const [voiceId, value] of Object.entries(emphasis)) {
        expect(effects, `${profile.id} should seed ${voiceId}`).toEqual(
          expect.arrayContaining([
            {
              type: "set_var",
              key: innerVoiceRankVarKeyFor(
                voiceId as Parameters<typeof innerVoiceRankVarKeyFor>[0],
              ),
              value,
            },
          ]),
        );
      }
    }
  });
});
