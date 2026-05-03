import type { ScenarioBlueprint } from "../../vn-blueprint-types";
import { PACK_DETECTIVE_ORIGIN_SCENARIOS } from "./pack_detective_origin";
import { PACK_FREIBURG_AGENCY_SCENARIOS } from "./pack_freiburg_agency";
import { PACK_FREIBURG_BANKER_SCENARIOS } from "./pack_freiburg_banker";
import { PACK_FREIBURG_DOG_SCENARIOS } from "./pack_freiburg_dog";
import { PACK_FREIBURG_GHOST_SCENARIOS } from "./pack_freiburg_ghost";
import { PACK_FREIBURG_INTRO_SCENARIOS } from "./pack_freiburg_intro";
import { PACK_FREIBURG_LIVING_CITY_SCENARIOS } from "./pack_freiburg_living_city";
import { PACK_FREIBURG_RUMORS_SCENARIOS } from "./pack_freiburg_rumors";
import { PACK_FREIBURG_SOCIAL_SCENARIOS } from "./pack_freiburg_social";
import { PACK_INTRO_JOURNALIST_SCENARIOS } from "./pack_intro_journalist";
import { PACK_JOURNALIST_ORIGIN_SCENARIOS } from "./pack_journalist_origin";
import { PACK_KARLSRUHE_EVENT_SCENARIOS } from "./pack_karlsruhe_event";
import { PACK_OTHER_ORIGIN_INTROS_SCENARIOS } from "./pack_other_origin_intros";
import { PACK_SYSTEM_DEMONSTRATIONS_SCENARIOS } from "./pack_system_demonstrations";

export const LEGACY_TS_SCENARIOS: ScenarioBlueprint[] = [
  ...PACK_SYSTEM_DEMONSTRATIONS_SCENARIOS,
  ...PACK_FREIBURG_INTRO_SCENARIOS,
  ...PACK_FREIBURG_AGENCY_SCENARIOS,
  ...PACK_FREIBURG_BANKER_SCENARIOS,
  ...PACK_FREIBURG_DOG_SCENARIOS,
  ...PACK_KARLSRUHE_EVENT_SCENARIOS,
  ...PACK_FREIBURG_GHOST_SCENARIOS,
  ...PACK_JOURNALIST_ORIGIN_SCENARIOS,
  ...PACK_DETECTIVE_ORIGIN_SCENARIOS,
  ...PACK_INTRO_JOURNALIST_SCENARIOS,
  ...PACK_OTHER_ORIGIN_INTROS_SCENARIOS,
  ...PACK_FREIBURG_LIVING_CITY_SCENARIOS,
  ...PACK_FREIBURG_RUMORS_SCENARIOS,
  ...PACK_FREIBURG_SOCIAL_SCENARIOS,
];
