import type { NodeBlueprint } from "../../vn-blueprint-types";
import { PACK_DETECTIVE_ORIGIN_NODES } from "./pack_detective_origin";
import { PACK_FREIBURG_AGENCY_NODES } from "./pack_freiburg_agency";
import { PACK_FREIBURG_BANKER_NODES } from "./pack_freiburg_banker";
import { PACK_FREIBURG_DOG_NODES } from "./pack_freiburg_dog";
import { PACK_FREIBURG_GHOST_NODES } from "./pack_freiburg_ghost";
import { PACK_FREIBURG_INTRO_NODES } from "./pack_freiburg_intro";
import { PACK_FREIBURG_LIVING_CITY_NODES } from "./pack_freiburg_living_city";
import { PACK_FREIBURG_RUMORS_NODES } from "./pack_freiburg_rumors";
import { PACK_FREIBURG_SOCIAL_NODES } from "./pack_freiburg_social";
import { PACK_INTRO_JOURNALIST_NODES } from "./pack_intro_journalist";
import { PACK_JOURNALIST_ORIGIN_NODES } from "./pack_journalist_origin";
import { PACK_KARLSRUHE_EVENT_NODES } from "./pack_karlsruhe_event";
import { PACK_OTHER_ORIGIN_INTROS_NODES } from "./pack_other_origin_intros";
import { PACK_SYSTEM_DEMONSTRATIONS_NODES } from "./pack_system_demonstrations";

export const LEGACY_TS_NODES: NodeBlueprint[] = [
  ...PACK_SYSTEM_DEMONSTRATIONS_NODES,
  ...PACK_FREIBURG_INTRO_NODES,
  ...PACK_FREIBURG_AGENCY_NODES,
  ...PACK_FREIBURG_BANKER_NODES,
  ...PACK_FREIBURG_DOG_NODES,
  ...PACK_KARLSRUHE_EVENT_NODES,
  ...PACK_FREIBURG_GHOST_NODES,
  ...PACK_JOURNALIST_ORIGIN_NODES,
  ...PACK_DETECTIVE_ORIGIN_NODES,
  ...PACK_INTRO_JOURNALIST_NODES,
  ...PACK_OTHER_ORIGIN_INTROS_NODES,
  ...PACK_FREIBURG_LIVING_CITY_NODES,
  ...PACK_FREIBURG_RUMORS_NODES,
  ...PACK_FREIBURG_SOCIAL_NODES,
];
