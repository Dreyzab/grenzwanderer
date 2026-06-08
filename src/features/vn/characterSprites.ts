/**
 * Production catalog for VN character sprites.
 *
 * Runtime still supports the existing portrait/CG flow. This catalog defines
 * the sprite production contract so full-body layered assets can be generated
 * and checked consistently before the UI starts depending on them.
 */

export const VN_SPRITE_EMOTIONS = [
  "neutral",
  "warm",
  "tense",
  "suspicious",
  "hurt",
  "commanding",
  "dangerous",
] as const;

export const ELEONORA_SPRITE_EMOTIONS = [
  "composed",
  "softened",
  "hungry",
  "cracking",
  "predatory",
  "controlled_panic",
] as const;

export type VnSpriteEmotion = (typeof VN_SPRITE_EMOTIONS)[number];
export type EleonoraSpriteEmotion = (typeof ELEONORA_SPRITE_EMOTIONS)[number];
export type CharacterSpriteEmotion = VnSpriteEmotion | EleonoraSpriteEmotion;

export const CHARACTER_SPRITE_SCALE_PRESETS = [
  "far",
  "normal",
  "focus",
  "close",
] as const;

export const CHARACTER_SPRITE_RENDERING_RULES = [
  "Face rendering: clean readable faces with smooth tonal transitions and soft skin-plane color shifts; keep strong visible brush texture on clothing, hair, and outer silhouette rather than across facial features.",
  "Avoid harsh or choppy facial brush marks, muddy skin texture, soot-like grime, over-sharp makeup edges, and high-contrast patches that make the face look dirty or artificially aged.",
] as const;

export type CharacterSpriteScalePreset =
  (typeof CHARACTER_SPRITE_SCALE_PRESETS)[number];

export type CharacterSpriteProductionTier = "T1_VN" | "T2_COMPOSITE";

export type CharacterSpriteLayerKind =
  | "body_base"
  | "face_base"
  | "eyes"
  | "brows"
  | "mouth"
  | "overlay";

export interface CharacterSpriteLayerTemplates {
  bodyBase: string;
  faceBase: string;
  eyesByEmotion: string;
  browsByEmotion: string;
  mouthByEmotion: string;
  overlayById: string;
}

export interface CharacterSpriteIdentitySheet {
  silhouette: string;
  face: string;
  hair: string;
  costume: string;
  palette: string[];
  anchors: string[];
  forbiddenDrift: string[];
}

export interface CharacterSpritePlan {
  characterId: string;
  displayName: string;
  productionTier: CharacterSpriteProductionTier;
  runtimeLayout: "split";
  sourceFraming: "full_body";
  backgroundPolicy: "transparent";
  styleFamily: "painterly_semi_realistic_european_gothic_vn";
  portraitUrl: string;
  sourcePortraitRefs: string[];
  rootRuntimePath: string;
  requiredEmotions: CharacterSpriteEmotion[];
  optionalPoseVariants: string[];
  specialOverlays: string[];
  scalePresets: CharacterSpriteScalePreset[];
  renderingRules: readonly string[];
  identity: CharacterSpriteIdentitySheet;
  layerTemplates: CharacterSpriteLayerTemplates;
  promptBrief: string;
}

const SPRITE_ROOT = "/images/characters/sprites";

const layerTemplatesFor = (slug: string): CharacterSpriteLayerTemplates => {
  const root = `${SPRITE_ROOT}/${slug}`;
  return {
    bodyBase: `${root}/body/body_base.png`,
    faceBase: `${root}/face/face_base.png`,
    eyesByEmotion: `${root}/face/eyes/{emotion}.png`,
    browsByEmotion: `${root}/face/brows/{emotion}.png`,
    mouthByEmotion: `${root}/face/mouth/{emotion}.png`,
    overlayById: `${root}/overlays/{overlay}.png`,
  };
};

const commonPlan = (
  slug: string,
): Pick<
  CharacterSpritePlan,
  | "productionTier"
  | "runtimeLayout"
  | "sourceFraming"
  | "backgroundPolicy"
  | "styleFamily"
  | "rootRuntimePath"
  | "requiredEmotions"
  | "optionalPoseVariants"
  | "specialOverlays"
  | "scalePresets"
  | "renderingRules"
  | "layerTemplates"
> => ({
  productionTier: "T1_VN",
  runtimeLayout: "split",
  sourceFraming: "full_body",
  backgroundPolicy: "transparent",
  styleFamily: "painterly_semi_realistic_european_gothic_vn",
  rootRuntimePath: `${SPRITE_ROOT}/${slug}`,
  requiredEmotions: [...VN_SPRITE_EMOTIONS],
  optionalPoseVariants: ["hands_folded", "lean_forward", "turned_aside"],
  specialOverlays: [],
  scalePresets: [...CHARACTER_SPRITE_SCALE_PRESETS],
  renderingRules: [...CHARACTER_SPRITE_RENDERING_RULES],
  layerTemplates: layerTemplatesFor(slug),
});

export const CASE01_PRIMARY_SPRITE_CHARACTER_IDS = [
  "npc_mother_hartmann",
  "npc_weber_dispatcher",
  "npc_sasha_hartmann_servant",
  "npc_felix_hartmann",
  "detective",
  "npc_bureau_master",
] as const;

export const CASE01_CASEFILE_SPRITE_CHARACTER_IDS = [
  "npc_heinrich_galdermann",
  "npc_albrecht_stoll",
  "npc_emil_roth",
  "npc_krebs_mugger",
  "npc_anton_weber",
  "npc_rudi_kempf",
  "npc_konrad_vossler",
] as const;

export const CASE01_VISIBLE_SPRITE_CHARACTER_IDS = [
  ...CASE01_PRIMARY_SPRITE_CHARACTER_IDS,
  ...CASE01_CASEFILE_SPRITE_CHARACTER_IDS,
] as const;

export const CHARACTER_SPRITE_PLANS: readonly CharacterSpritePlan[] = [
  {
    ...commonPlan("eleonora_hartmann"),
    characterId: "npc_mother_hartmann",
    displayName: "Eleonora Hartmann",
    portraitUrl: "/Characters/Eleonora/eleonora_mother_fixed_1776592259184.png",
    sourcePortraitRefs: [
      "/Characters/Eleonora/eleonora_mother_fixed_1776592259184.png",
      "/images/characters/witch_portrait/witch_portrait.png",
    ],
    requiredEmotions: [...VN_SPRITE_EMOTIONS, ...ELEONORA_SPRITE_EMOTIONS],
    optionalPoseVariants: [
      "hands_folded",
      "glove_adjust",
      "half_turn_command",
      "veil_touch",
    ],
    specialOverlays: ["occult_filter", "hunger_flush", "wet_travel_cloak"],
    identity: {
      silhouette:
        "upright mature noblewoman, controlled posture, black mourning lace over an ivory high-neck dress",
      face: "refined older face, composed mouth, sharp attentive eyes",
      hair: "light curled updo under black lace or travel hat",
      costume:
        "Hartmann widow travel dress, gloves, restrained jewelry, no military or servant markers",
      palette: ["black lace", "ivory", "old gold", "cold crimson accent"],
      anchors: [
        "aristocratic restraint",
        "danger hidden behind etiquette",
        "hands and gloves are always narratively important",
      ],
      forbiddenDrift: [
        "young ingenue",
        "anime proportions",
        "open monster design",
        "overly seductive vampire costume",
      ],
    },
    promptBrief:
      "Full-body layered VN sprite of Eleonora Hartmann, mature noble widow and hidden witch, painterly semi-realistic European gothic style, transparent background, readable silhouette.",
  },
  {
    ...commonPlan("lotte_weber"),
    characterId: "npc_weber_dispatcher",
    displayName: "Lotte Weber",
    portraitUrl: "/Characters/lotte_weber_portrait.png",
    sourcePortraitRefs: [
      "/Characters/lotte_weber_portrait.png",
      "/Characters/lotte_weber.png",
      "/Characters/lotte_portrait.png",
    ],
    optionalPoseVariants: [
      "notebook_held",
      "lean_forward",
      "hand_to_receiver",
      "bright_half_turn",
    ],
    specialOverlays: ["switchboard_glow", "rain_specks"],
    identity: {
      silhouette:
        "young energetic woman with compact professional posture and a quick forward lean",
      face: "pretty lively face, alert smile, eyes that notice too much",
      hair: "vivid red hair, tidy enough for work but visually bright",
      costume:
        "green 1900 business suit, telephone office respectability, no aristocratic luxury",
      palette: ["telephone green", "copper red", "cream blouse", "warm brass"],
      anchors: [
        "joy as intelligence, not naivety",
        "reporter energy hidden inside office manners",
        "notebook or schedule logic may appear in pose variants",
      ],
      forbiddenDrift: [
        "pure comic relief",
        "modern journalist outfit",
        "anime schoolgirl",
        "generic operator uniform",
      ],
    },
    promptBrief:
      "Full-body layered VN sprite of Lotte Weber, red-haired chief telephone operator and hidden journalist in a green business suit, lively but observant, transparent background.",
  },
  {
    ...commonPlan("sasha_hartmann_servant"),
    characterId: "npc_sasha_hartmann_servant",
    displayName: 'Alexander "Sasha"',
    portraitUrl:
      "/images/characters/sasha_hartmann_servant/sasha_hartmann_servant.webp",
    sourcePortraitRefs: [
      "/images/characters/sasha_hartmann_servant/sasha_hartmann_servant.webp",
    ],
    optionalPoseVariants: [
      "hands_behind_back",
      "luggage_ready",
      "bandaged_hand",
      "protective_step",
    ],
    specialOverlays: ["wrapped_hand", "rain_on_livery"],
    identity: {
      silhouette:
        "tall physically strong servant with military bearing and heavy shoulders",
      face: "restrained older face, old scar, pain endured without display",
      hair: "short dark hair, practical and unadorned",
      costume:
        "plain dark travel livery, serviceable coat, no medals, no visible uniform",
      palette: ["charcoal", "worn leather", "linen white", "dull brass"],
      anchors: [
        "ethical stubbornness under discipline",
        "servant by refuge and duty, not servility",
        "large hands and stillness carry his history",
      ],
      forbiddenDrift: [
        "decorated war hero",
        "aristocrat",
        "frightened extra",
        "Russian military uniform",
      ],
    },
    promptBrief:
      "Full-body layered VN sprite of Sasha, a strong 44-year-old Russian veteran serving the Hartmann family, plain travel livery, scar, disciplined stillness, transparent background.",
  },
  {
    ...commonPlan("felix_hartmann"),
    characterId: "npc_felix_hartmann",
    displayName: "Felix Hartmann",
    portraitUrl: "/Characters/Felix/felix_portrait_fixed_jaw_1776590978986.png",
    sourcePortraitRefs: [
      "/Characters/Felix/felix_portrait_fixed_jaw_1776590978986.png",
      "/Characters/Felix/felix_portrait_younger_1776590887801.png",
    ],
    optionalPoseVariants: [
      "hat_held",
      "collar_adjusted",
      "looking_away",
      "defensive_stance",
    ],
    specialOverlays: ["train_soot", "rain_specks"],
    identity: {
      silhouette:
        "young Hartmann gentleman, narrow formal posture, tension in shoulders",
      face: "tired intelligent youth, jaw set too carefully",
      hair: "curled brown hair, slightly unruly despite good grooming",
      costume:
        "dark young gentleman suit with period waistcoat, no detective coat",
      palette: ["black wool", "smoke blue", "cream shirt", "muted gold chain"],
      anchors: [
        "son trying to behave older than he feels",
        "apathy as exhaustion rather than stupidity",
        "hands often hold hat or collar when pressured",
      ],
      forbiddenDrift: [
        "childlike boy",
        "cocky romantic lead",
        "modern school uniform",
        "comic sidekick",
      ],
    },
    promptBrief:
      "Full-body layered VN sprite of Felix Hartmann, young exhausted noble son in a dark 1900 suit, restrained and watchful, transparent background.",
  },
  {
    ...commonPlan("detective"),
    characterId: "detective",
    displayName: "Detective",
    portraitUrl: "/images/characters/detective_portrait/detective_portrait.png",
    sourcePortraitRefs: [
      "/images/characters/detective_portrait/detective_portrait.png",
    ],
    optionalPoseVariants: [
      "notebook_ready",
      "coat_closed",
      "hat_low",
      "evidence_presented",
    ],
    specialOverlays: ["travel_dust", "rain_specks"],
    identity: {
      silhouette:
        "working detective in sober travel clothes, readable coat and hat silhouette",
      face: "observant, tired, controlled, not heroic",
      hair: "kept practical under hat",
      costume:
        "period detective coat, waistcoat, gloves or notebook, agency practicality",
      palette: ["brown wool", "ink black", "weathered tan", "brass"],
      anchors: [
        "player-facing investigator rather than action hero",
        "hands often tied to notebook, evidence, or restraint",
        "keeps expression useful rather than expressive",
      ],
      forbiddenDrift: [
        "modern noir trenchcoat",
        "police uniform",
        "Sherlock caricature",
        "overly clean fashion model",
      ],
    },
    promptBrief:
      "Full-body layered VN sprite of the detective protagonist in sober 1900 investigative travel clothes, European gothic VN style, transparent background.",
  },
  {
    ...commonPlan("bureau_master"),
    characterId: "npc_bureau_master",
    displayName: "Bureau Master",
    productionTier: "T2_COMPOSITE",
    portraitUrl: "/images/characters/bureau_master/bureau_master.webp",
    sourcePortraitRefs: ["/images/characters/bureau_master/bureau_master.webp"],
    optionalPoseVariants: [
      "vial_offered",
      "folder_held",
      "hand_on_desk",
      "occult_gaze",
    ],
    specialOverlays: ["crimson_relic_reflection", "bureau_gaslight"],
    identity: {
      silhouette:
        "older severe supervisor, formal dark clothing, still authority",
      face: "lined controlled face, cold eyes, no theatrical villainy",
      hair: "grey or silver hair, severe grooming",
      costume:
        "dark formal Bureau clothing, waistcoat, no robes, no flamboyant occult costume",
      palette: ["black", "old oak brown", "gaslight amber", "muted crimson"],
      anchors: [
        "institutional discipline",
        "occult knowledge expressed through restraint",
        "vials, dossiers, and desk geometry are his props",
      ],
      forbiddenDrift: [
        "wizard robes",
        "mad scientist",
        "kindly grandfather",
        "modern bureaucrat",
      ],
    },
    promptBrief:
      "Full-body layered VN sprite of the severe older Bureau Master, occult supervisor in sober formal clothing, controlled authority, transparent background.",
  },
  {
    ...commonPlan("heinrich_galdermann"),
    characterId: "npc_heinrich_galdermann",
    displayName: "Heinrich Galdermann",
    portraitUrl:
      "/images/characters/heinrich_galdermann/heinrich_galdermann.webp",
    sourcePortraitRefs: [
      "/images/characters/heinrich_galdermann/heinrich_galdermann.webp",
    ],
    optionalPoseVariants: [
      "handkerchief_to_hairline",
      "report_over_ledger",
      "signature_pen",
      "smelling_salts_nearby",
    ],
    specialOverlays: ["sweat_hairline", "ledger_shadow"],
    identity: {
      silhouette:
        "broad respectable bank officer, heavy frame like an iron safe, expensive waistcoat",
      face: "polished smile that feels notarized, controlled panic around the eyes",
      hair: "perfect side part with damp sweat at the roots, repeatedly dabbed with a handkerchief",
      costume:
        "costly 1900 banker suit, waistcoat richer than a clerk's yearly pay, no criminal street markers",
      palette: ["banker black", "cream linen", "old gold", "ink brown"],
      anchors: [
        "crime through signatures, not tools",
        "respectability as concealment",
        "handkerchief and report are part of his gesture language",
      ],
      forbiddenDrift: [
        "street thief",
        "cartoon villain",
        "thin nervous clerk",
        "modern finance executive",
      ],
    },
    promptBrief:
      "Full-body layered VN sprite of Heinrich Galdermann, broad respectable Prokurist of Bankhaus Krebs, expensive waistcoat, polished smile, sweat at perfect hair part, transparent background.",
  },
  {
    ...commonPlan("albrecht_stoll"),
    characterId: "npc_albrecht_stoll",
    displayName: "Oberleutnant Albrecht Stoll",
    portraitUrl: "/images/characters/albrecht_stoll/albrecht_stoll.webp",
    sourcePortraitRefs: [
      "/images/characters/albrecht_stoll/albrecht_stoll.webp",
    ],
    optionalPoseVariants: [
      "gloved_hands_counting",
      "postal_coat_closed",
      "uniform_seam_visible",
      "scar_knuckle_rub",
    ],
    specialOverlays: ["thermite_soot", "postal_coat", "chemical_gloves"],
    identity: {
      silhouette:
        "bridge-shouldered serving pioneer officer, posture too military for disguise",
      face: "disciplined severe face, sleeps because the calculation balanced",
      hair: "short military grooming, practical and strict",
      costume:
        "postal coat sitting wrongly over hidden military tunic, chemical gloves, burn-darkened cuffs",
      palette: ["field grey", "postal dark blue", "thermite black", "brass"],
      anchors: [
        "discipline as danger",
        "uniform leaking through disguise",
        "thermite is admitted, theft is denied",
      ],
      forbiddenDrift: [
        "generic soldier in parade uniform",
        "wild pyromaniac",
        "street robber",
        "fantasy sapper",
      ],
    },
    promptBrief:
      "Full-body layered VN sprite of Oberleutnant Albrecht Stoll, serving pioneer officer and Sapper, postal coat over military tunic, chemical gloves, disciplined posture, transparent background.",
  },
  {
    ...commonPlan("emil_roth"),
    characterId: "npc_emil_roth",
    displayName: "Emil Roth",
    portraitUrl: "/images/characters/emil_roth/emil_roth.webp",
    sourcePortraitRefs: ["/images/characters/emil_roth/emil_roth.webp"],
    optionalPoseVariants: [
      "binding_calipers",
      "waxed_fingers",
      "ledger_note",
      "defensive_hands",
    ],
    specialOverlays: ["ink_stains", "wax_on_fingers"],
    identity: {
      silhouette:
        "thin scholarly craftsman, narrow shoulders, careful hands held forward",
      face: "awed nervous restorer, reverence curdled into fear after he understands the use",
      hair: "tidy thinning hair, workshop practical",
      costume:
        "restorer's dark work coat over modest shirt, ink and wax at cuffs, no occult robes",
      palette: ["ink black", "old paper", "warm wax", "dust brown"],
      anchors: [
        "technical measurements as guilt",
        "false center, not knife hand",
        "hands are more incriminating than expression",
      ],
      forbiddenDrift: [
        "mad occultist",
        "wealthy collector",
        "knife-wielding villain",
        "comic old scholar",
      ],
    },
    promptBrief:
      "Full-body layered VN sprite of Emil Roth, thin book restorer who supplied Razlom measurements, ink and wax stained fingers, anxious reverence, transparent background.",
  },
  {
    ...commonPlan("krebs_mugger"),
    characterId: "npc_krebs_mugger",
    displayName: "Krebs Mugger",
    portraitUrl: "/images/characters/krebs_mugger/krebs_mugger.webp",
    sourcePortraitRefs: ["/images/characters/krebs_mugger/krebs_mugger.webp"],
    optionalPoseVariants: [
      "knuckles_forward",
      "wallet_scan",
      "alley_step",
      "blood_bond_mark",
    ],
    specialOverlays: ["bruised_knuckles", "alley_blood"],
    identity: {
      silhouette:
        "street-level contracted muscle, compact threat, shoulders angled toward impact",
      face: "calculating low-level enforcer, looks at the purse before the face",
      hair: "rough practical street grooming",
      costume:
        "worn street coat and rough work clothes, no military or banker polish",
      palette: ["dirty wool", "brick shadow", "dried blood", "cheap brass"],
      anchors: [
        "contracted fist beneath respectable signatures",
        "Free Yards affiliation at street level",
        "grotesque ordinary worker-for-hire logic",
      ],
      forbiddenDrift: [
        "mastermind",
        "romantic rogue",
        "uniformed guard",
        "clean gentleman criminal",
      ],
    },
    promptBrief:
      "Full-body layered VN sprite of Krebs Mugger, Free Yards street enforcer on Krebs contract, bruised knuckles, alley threat, transparent background.",
  },
  {
    ...commonPlan("anton_weber"),
    characterId: "npc_anton_weber",
    displayName: "Anton Weber",
    portraitUrl: "/images/characters/anton_weber/anton_weber.webp",
    sourcePortraitRefs: ["/images/characters/anton_weber/anton_weber.webp"],
    optionalPoseVariants: [
      "twine_held",
      "route_clipboard",
      "cap_in_hand",
      "order_folded",
    ],
    specialOverlays: ["postal_twine", "rain_on_uniform"],
    identity: {
      silhouette:
        "nervous Reichspost clerk, uniform slightly too large, hands always cleaning or arranging",
      face: "meticulous frightened man, pride bruised by official misuse",
      hair: "neat practical postal grooming under cap",
      costume:
        "period Reichspost uniform with black-yellow route twine and delivery satchel",
      palette: ["postal blue", "black-yellow twine", "paper cream", "wet grey"],
      anchors: [
        "professional signature turned into evidence",
        "obedience bent by forged authority",
        "not thief, but movement",
      ],
      forbiddenDrift: [
        "criminal mastermind",
        "carefree courier",
        "modern postman",
        "military officer",
      ],
    },
    promptBrief:
      "Full-body layered VN sprite of Anton Weber, nervous Reichspost route clerk with black-yellow twine and forged order, transparent background.",
  },
  {
    ...commonPlan("rudi_kempf"),
    characterId: "npc_rudi_kempf",
    displayName: "Rudi Kempf",
    portraitUrl: "/images/characters/rudi_kempf/rudi_kempf.webp",
    sourcePortraitRefs: ["/images/characters/rudi_kempf/rudi_kempf.webp"],
    optionalPoseVariants: [
      "union_card",
      "cigarette_reach",
      "angry_point",
      "arms_crossed",
    ],
    specialOverlays: ["coal_stains", "registry_slash"],
    identity: {
      silhouette:
        "heavy rail-yard worker, broad chest, protest stance, fists built for labor",
      face: "angry sincere worker, loud enough to be used as cover, not cunning enough to be the vault mind",
      hair: "rough worker hair under cap or sweat",
      costume:
        "work shirt, heavy trousers, worn vest, union card, coal-stained hands",
      palette: ["coal black", "rust red", "workshop grey", "union paper"],
      anchors: [
        "noise as false trail",
        "anger used as someone else's weather",
        "innocent of the breach, guilty of leverage",
      ],
      forbiddenDrift: [
        "elegant banker",
        "secret engineer",
        "comic drunk",
        "clean aristocrat",
      ],
    },
    promptBrief:
      "Full-body layered VN sprite of Rudi Kempf, heavy rail-yard worker and protest noise false trail, coal-stained hands, angry sincerity, transparent background.",
  },
  {
    ...commonPlan("konrad_vossler"),
    characterId: "npc_konrad_vossler",
    displayName: "Konrad Vossler",
    portraitUrl: "/images/characters/konrad_vossler/konrad_vossler.webp",
    sourcePortraitRefs: [
      "/images/characters/konrad_vossler/konrad_vossler.webp",
    ],
    optionalPoseVariants: [
      "chalk_hand",
      "sulfur_cuff",
      "voice_cut_short",
      "lesson_pointer",
    ],
    specialOverlays: ["sulfur_on_cuffs", "chalk_dust"],
    identity: {
      silhouette:
        "former pioneer turned chemistry teacher, disciplined posture softened by classroom habit",
      face: "controlled man who has refused something once and still remembers the cost",
      hair: "sober schoolmaster grooming with military residue",
      costume:
        "chemistry teacher suit and protective apron or lab coat, sulfur on cuffs, no active uniform",
      palette: [
        "chalk white",
        "sulfur yellow",
        "old black",
        "laboratory brown",
      ],
      anchors: [
        "mirror to Stoll, not accomplice",
        "same demolition school, different refusal",
        "Dead Registry / Case02 hook",
      ],
      forbiddenDrift: [
        "active criminal sapper",
        "mad professor",
        "wizard",
        "military officer in uniform",
      ],
    },
    promptBrief:
      "Full-body layered VN sprite of Konrad Vossler, former pioneer chemistry teacher and Case02 mirror to Stoll, sulfur cuffs, restrained refusal, transparent background.",
  },
] as const;

const CHARACTER_SPRITE_PLAN_BY_ID = new Map(
  CHARACTER_SPRITE_PLANS.map((plan) => [plan.characterId, plan]),
);

export const getCharacterSpritePlan = (
  characterId: string | undefined,
): CharacterSpritePlan | null =>
  characterId ? (CHARACTER_SPRITE_PLAN_BY_ID.get(characterId) ?? null) : null;

export const hasCharacterSpritePlan = (
  characterId: string | undefined,
): boolean => getCharacterSpritePlan(characterId) !== null;

const fillTemplate = (
  template: string,
  replacements: Record<string, string>,
): string =>
  Object.entries(replacements).reduce(
    (current, [key, value]) => current.replaceAll(`{${key}}`, value),
    template,
  );

export const resolveCharacterSpriteLayerPath = (
  plan: CharacterSpritePlan,
  layerKind: CharacterSpriteLayerKind,
  id?: CharacterSpriteEmotion | string,
): string => {
  switch (layerKind) {
    case "body_base":
      return plan.layerTemplates.bodyBase;
    case "face_base":
      return plan.layerTemplates.faceBase;
    case "eyes":
      return fillTemplate(plan.layerTemplates.eyesByEmotion, {
        emotion: id ?? "neutral",
      });
    case "brows":
      return fillTemplate(plan.layerTemplates.browsByEmotion, {
        emotion: id ?? "neutral",
      });
    case "mouth":
      return fillTemplate(plan.layerTemplates.mouthByEmotion, {
        emotion: id ?? "neutral",
      });
    case "overlay":
      return fillTemplate(plan.layerTemplates.overlayById, {
        overlay: id ?? "default",
      });
  }
};

export interface CharacterSpriteRequiredAsset {
  characterId: string;
  layerKind: CharacterSpriteLayerKind;
  emotion?: CharacterSpriteEmotion;
  overlay?: string;
  runtimePath: string;
}

export const getRequiredCharacterSpriteAssets = (
  plan: CharacterSpritePlan,
): CharacterSpriteRequiredAsset[] => [
  {
    characterId: plan.characterId,
    layerKind: "body_base",
    runtimePath: resolveCharacterSpriteLayerPath(plan, "body_base"),
  },
  {
    characterId: plan.characterId,
    layerKind: "face_base",
    runtimePath: resolveCharacterSpriteLayerPath(plan, "face_base"),
  },
  ...plan.requiredEmotions.flatMap((emotion) =>
    (["eyes", "brows", "mouth"] as const).map((layerKind) => ({
      characterId: plan.characterId,
      layerKind,
      emotion,
      runtimePath: resolveCharacterSpriteLayerPath(plan, layerKind, emotion),
    })),
  ),
  ...plan.specialOverlays.map((overlay) => ({
    characterId: plan.characterId,
    layerKind: "overlay" as const,
    overlay,
    runtimePath: resolveCharacterSpriteLayerPath(plan, "overlay", overlay),
  })),
];
