import type { VnEffect } from "../vn/types";

export interface OriginTrackStepDefinition {
  voice: string;
  requiredXp: number;
}

export interface OriginTrackDefinition {
  id: string;
  title: string;
  description: string;
  progressVarKey: string;
  tier1FlagKey: string;
  tier2FlagKey: string;
  selectedFlagKey?: string;
  parliamentPresetId?: string;
  focus: string;
  steps: OriginTrackStepDefinition[];
  finalAbilityTitle: string;
  finalAbilityDescription: string;
}

export interface OriginSignatureDefinition {
  title: string;
  description: string;
  passiveLabel: string;
}

export interface OriginFlawDefinition {
  title: string;
  description: string;
  icon: string;
  checkVoice: string;
  dc: number;
  durationLabel: string;
}

export interface OriginDossierDefinition {
  characterName: string;
  age: number;
  gender: "male" | "female";
  cityOrigin: string;
  quote: string;
  avatarUrl: string;
  accentColor: string;
}

export interface OriginProfileDefinition {
  id: string;
  choiceId: string;
  originFlagKey: string;
  handoffDoneFlagKeys: string[];
  label: string;
  summary: string;
  scenarioId: string;
  flawFlagKey: string;
  signatureAbilityFlagKey: string;
  statEffects: Array<{ key: string; value: number }>;
  tracks: OriginTrackDefinition[];
  signature: OriginSignatureDefinition;
  flaw: OriginFlawDefinition;
  dossier: OriginDossierDefinition;
}

export const originProfiles: OriginProfileDefinition[] = [
  {
    id: "journalist",
    choiceId: "BACKSTORY_JOURNALIST",
    originFlagKey: "origin_journalist",
    handoffDoneFlagKeys: ["origin_journalist_handoff_done"],
    label: "Journalist Origin",
    summary: "Leaks, rumor networks, and pressure through publication.",
    scenarioId: "journalist_agency_wakeup",
    flawFlagKey: "flaw_gambling_addiction",
    signatureAbilityFlagKey: "ability_nose_for_story",
    statEffects: [
      { key: "attr_encyclopedia", value: 4 },
      { key: "attr_perception", value: 3 },
      { key: "attr_deception", value: 2 },
    ],
    signature: {
      title: "Nose for a Story",
      description:
        "Bonus Encyclopedia check (DC -2) on entering a new location. On success, it exposes a buried lore thread before anyone else notices it.",
      passiveLabel: "Passive",
    },
    flaw: {
      title: "Gambling Addiction",
      description:
        "Cannot resist high-risk opportunities. A bad impulse can push the journalist into reckless bets before the room is fully read.",
      icon: "star",
      checkVoice: "volition",
      dc: 10,
      durationLabel: "Instant",
    },
    tracks: [
      {
        id: "journalist_whistleblower",
        title: "Whistleblower",
        description: "Build trusted informants and document leaks.",
        progressVarKey: "track_whistleblower_xp",
        tier1FlagKey: "track_whistleblower_tier1",
        tier2FlagKey: "track_whistleblower_tier2",
        selectedFlagKey: "track_whistleblower_selected",
        parliamentPresetId: "journalist_cityroom",
        focus: "Logic + Intrusion",
        steps: [
          { voice: "logic", requiredXp: 100 },
          { voice: "intrusion", requiredXp: 200 },
          { voice: "stealth", requiredXp: 300 },
        ],
        finalAbilityTitle: "Hot Press",
        finalAbilityDescription:
          "Turn a published lead into direct pressure against compromised officials and merchants.",
      },
      {
        id: "journalist_mythologist",
        title: "Mythologist",
        description: "Use folklore and rumor webs as investigative leverage.",
        progressVarKey: "track_mythologist_xp",
        tier1FlagKey: "track_mythologist_tier1",
        tier2FlagKey: "track_mythologist_tier2",
        focus: "Tradition + Occultism",
        steps: [
          { voice: "tradition", requiredXp: 100 },
          { voice: "occultism", requiredXp: 200 },
          { voice: "intuition", requiredXp: 300 },
        ],
        finalAbilityTitle: "Connecting Thread",
        finalAbilityDescription:
          "Spot hidden continuities between old legends, present crimes, and documents that should not agree.",
      },
    ],
    dossier: {
      characterName: "Arthur Vance",
      age: 32,
      gender: "male",
      cityOrigin: "Stuttgart -> Freiburg",
      quote: "The city lies beautifully. My job is to make it stumble.",
      avatarUrl: "/images/characters/journalist_portrait/journalist_portrait.png",
      accentColor: "#A61C2F",
    },
  },
  {
    id: "aristocrat",
    choiceId: "BACKSTORY_ARISTOCRAT",
    originFlagKey: "origin_aristocrat",
    handoffDoneFlagKeys: ["origin_aristocrat_handoff_done"],
    label: "Aristocrat Origin",
    summary: "Etiquette, political leverage, and controlled influence.",
    scenarioId: "intro_aristocrat",
    flawFlagKey: "flaw_prideful_etiquette",
    signatureAbilityFlagKey: "ability_blue_blood_network",
    statEffects: [
      { key: "attr_social", value: 4 },
      { key: "attr_deception", value: 2 },
      { key: "attr_encyclopedia", value: 2 },
    ],
    signature: {
      title: "Sharp Gaze",
      description:
        "Upper-class interrogations and drawing-room duels of status cost less effort. Authority in noble circles starts from advantage, not parity.",
      passiveLabel: "Passive",
    },
    flaw: {
      title: "Claustrophobia",
      description:
        "Tight spaces destabilize focus and composure. Confined archives, tunnels, and cellars can turn memory into panic.",
      icon: "triangle-alert",
      checkVoice: "volition",
      dc: 8,
      durationLabel: "Instant",
    },
    tracks: [
      {
        id: "aristocrat_criminalist",
        title: "Criminalist",
        description:
          "Reconstruct evidence and motive through cultivated perception.",
        progressVarKey: "track_criminalist_xp",
        tier1FlagKey: "track_criminalist_tier1",
        tier2FlagKey: "track_criminalist_tier2",
        focus: "Imagination + Senses",
        steps: [
          { voice: "imagination", requiredXp: 100 },
          { voice: "senses", requiredXp: 200 },
          { voice: "empathy", requiredXp: 300 },
        ],
        finalAbilityTitle: "Reconstruction",
        finalAbilityDescription:
          "At a crime scene, intuition and imagination lock together into a near-forensic reenactment of the missing minute.",
      },
      {
        id: "aristocrat_duelist",
        title: "Duelist",
        description: "Turn grace, threat, and timing into leverage.",
        progressVarKey: "track_duelist_xp",
        tier1FlagKey: "track_duelist_tier1",
        tier2FlagKey: "track_duelist_tier2",
        focus: "Endurance + Intrusion",
        steps: [
          { voice: "endurance", requiredXp: 100 },
          { voice: "stealth", requiredXp: 200 },
          { voice: "intrusion", requiredXp: 300 },
        ],
        finalAbilityTitle: "First Blood",
        finalAbilityDescription:
          "Win physical confrontations before they become brawls by turning ceremony, tempo, and posture into force.",
      },
    ],
    dossier: {
      characterName: "Charlotte von Waldstein",
      age: 25,
      gender: "female",
      cityOrigin: "Karlsruhe (Hochadel)",
      quote:
        "I was taught to hold a rapier and hold a conversation. Now I learn to hold the truth.",
      avatarUrl: "/images/characters/aristocrat_portrait/aristocrat_portrait.png",
      accentColor: "#4E5D6C",
    },
  },
  {
    id: "veteran",
    choiceId: "BACKSTORY_VETERAN",
    originFlagKey: "origin_veteran",
    handoffDoneFlagKeys: ["origin_veteran_handoff_done"],
    label: "Veteran Origin",
    summary: "Discipline, intimidation, and survival instincts.",
    scenarioId: "intro_veteran",
    flawFlagKey: "flaw_battle_scar_trigger",
    signatureAbilityFlagKey: "ability_battlefield_memory",
    statEffects: [
      { key: "attr_physical", value: 4 },
      { key: "attr_perception", value: 2 },
      { key: "attr_spirit", value: 2 },
    ],
    signature: {
      title: "Combat Instinct",
      description:
        "Danger clarifies the veteran instead of overwhelming him. Physical risk sharpens senses, timing, and coercive presence.",
      passiveLabel: "Passive",
    },
    flaw: {
      title: "Alcoholism",
      description:
        "Stress and silence alike can drag him toward the bottle. Relief is quick; the cost is slower, meaner, and cumulative.",
      icon: "beer",
      checkVoice: "volition",
      dc: 9,
      durationLabel: "Next Scene",
    },
    tracks: [
      {
        id: "veteran_shield",
        title: "Shield",
        description:
          "Hold the line, anchor the squad, survive the worst minute.",
        progressVarKey: "track_shield_xp",
        tier1FlagKey: "track_shield_tier1",
        tier2FlagKey: "track_shield_tier2",
        focus: "Volition + Charisma",
        steps: [
          { voice: "volition", requiredXp: 100 },
          { voice: "charisma", requiredXp: 200 },
          { voice: "empathy", requiredXp: 300 },
        ],
        finalAbilityTitle: "Last Stand",
        finalAbilityDescription:
          "Refuse collapse once per critical scene and keep everyone else standing long enough to finish the job.",
      },
      {
        id: "veteran_hunter",
        title: "Hunter",
        description:
          "Move first, vanish early, strike where the route is weakest.",
        progressVarKey: "track_hunter_xp",
        tier1FlagKey: "track_hunter_tier1",
        tier2FlagKey: "track_hunter_tier2",
        focus: "Stealth + Agility",
        steps: [
          { voice: "stealth", requiredXp: 100 },
          { voice: "agility", requiredXp: 200 },
          { voice: "intrusion", requiredXp: 300 },
        ],
        finalAbilityTitle: "Shadow of War",
        finalAbilityDescription:
          "At night, underground, or under pressure, the veteran moves like a trained absence rather than a man.",
      },
    ],
    dossier: {
      characterName: "Gustav Eisenhart",
      age: 40,
      gender: "male",
      cityOrigin: "Baden-Wurttemberg",
      quote: "War took everything except the instinct to survive.",
      avatarUrl: "/images/characters/veteran_portrait/veteran_portrait.png",
      accentColor: "#B5852B",
    },
  },
  {
    id: "archivist",
    choiceId: "BACKSTORY_ARCHIVIST",
    originFlagKey: "origin_archivist",
    handoffDoneFlagKeys: ["origin_archivist_handoff_done"],
    label: "Archivist Origin",
    summary: "Records, cross-indexing, and procedural certainty.",
    scenarioId: "intro_archivist",
    flawFlagKey: "flaw_obsessive_archivist",
    signatureAbilityFlagKey: "ability_index_of_everything",
    statEffects: [
      { key: "attr_intellect", value: 4 },
      { key: "attr_encyclopedia", value: 3 },
      { key: "attr_social", value: 1 },
    ],
    signature: {
      title: "Index of Everything",
      description:
        "The archivist can align records, discrepancies, and bureaucratic residue before other investigators even realize a pattern exists.",
      passiveLabel: "Passive",
    },
    flaw: {
      title: "Obsessive Archivist",
      description:
        "Missing documents become a private emergency. The need to complete the record can override urgency, danger, and social reality.",
      icon: "book-open-text",
      checkVoice: "volition",
      dc: 8,
      durationLabel: "Until Resolved",
    },
    tracks: [
      {
        id: "archivist_ledgerkeeper",
        title: "Ledgerkeeper",
        description:
          "Turn civic paperwork into leverage, timing, and legal pressure.",
        progressVarKey: "track_ledgerkeeper_xp",
        tier1FlagKey: "track_ledgerkeeper_tier1",
        tier2FlagKey: "track_ledgerkeeper_tier2",
        focus: "Logic + Encyclopedia",
        steps: [
          { voice: "logic", requiredXp: 100 },
          { voice: "encyclopedia", requiredXp: 200 },
          { voice: "authority", requiredXp: 300 },
        ],
        finalAbilityTitle: "Paper Trail Lock",
        finalAbilityDescription:
          "Seal a suspect behind their own filings by surfacing the one document they assumed no one could still find.",
      },
      {
        id: "archivist_dust_cartographer",
        title: "Dust Cartographer",
        description:
          "Map omissions, hidden shelves, and institutional blind spots.",
        progressVarKey: "track_dust_cartographer_xp",
        tier1FlagKey: "track_dust_cartographer_tier1",
        tier2FlagKey: "track_dust_cartographer_tier2",
        focus: "Intuition + Imagination",
        steps: [
          { voice: "intuition", requiredXp: 100 },
          { voice: "imagination", requiredXp: 200 },
          { voice: "perception", requiredXp: 300 },
        ],
        finalAbilityTitle: "Ghost Catalog",
        finalAbilityDescription:
          "Reveal the negative space of an archive: the missing shelf, the altered numbering, the erased acquisition, the lie in the inventory.",
      },
    ],
    dossier: {
      characterName: "Martha Heller",
      age: 40,
      gender: "female",
      cityOrigin: "Freiburg (Altstadt)",
      quote: "Every archive hides a truth someone paid to bury.",
      avatarUrl: "/images/characters/doctor_portrait/doctor_portrait.png",
      accentColor: "#2E6B57",
    },
  },
  {
    id: "detective",
    choiceId: "BACKSTORY_DETECTIVE",
    originFlagKey: "origin_detective",
    handoffDoneFlagKeys: ["origin_detective_handoff_done"],
    label: "Detective Origin",
    summary: "Logic, observation, and deductive street smarts.",
    scenarioId: "detective_case01_prologue",
    flawFlagKey: "flaw_cynic_mistrust",
    signatureAbilityFlagKey: "ability_crime_scene_reconstruction",
    statEffects: [
      { key: "attr_intellect", value: 3 },
      { key: "attr_perception", value: 4 },
      { key: "attr_empathy", value: 1 },
    ],
    signature: {
      title: "Crime Scene Reconstruction",
      description:
        "Can reconstruct the immediate sequence of events at a crime scene based on physical evidence without needing a specialized check.",
      passiveLabel: "Passive",
    },
    flaw: {
      title: "Cynical Mistrust",
      description:
        "Struggles to believe anyone's first answer. Paranoia costs time and alienates otherwise cooperative witnesses.",
      icon: "eye-off",
      checkVoice: "empathy",
      dc: 9,
      durationLabel: "Until Reassured",
    },
    tracks: [
      {
        id: "detective_investigator",
        title: "Private Investigator",
        description:
          "Hard-boiled investigation methods and interrogation tactics.",
        progressVarKey: "track_investigator_xp",
        tier1FlagKey: "track_investigator_tier1",
        tier2FlagKey: "track_investigator_tier2",
        focus: "Perception + Logic",
        steps: [
          { voice: "logic", requiredXp: 100 },
          { voice: "perception", requiredXp: 200 },
          { voice: "authority", requiredXp: 300 },
        ],
        finalAbilityTitle: "The Final Piece",
        finalAbilityDescription:
          "Automatically spots the one conflicting piece of evidence that disproves a suspect's alibi.",
      },
      {
        id: "detective_occult",
        title: "Occult Sleuth",
        description:
          "Pursues the weird and unnatural anomalies hidden in mundane cases.",
        progressVarKey: "track_occult_sleuth_xp",
        tier1FlagKey: "track_occult_sleuth_tier1",
        tier2FlagKey: "track_occult_sleuth_tier2",
        focus: "Intuition + Occultism",
        steps: [
          { voice: "intuition", requiredXp: 100 },
          { voice: "occultism", requiredXp: 200 },
          { voice: "imagination", requiredXp: 300 },
        ],
        finalAbilityTitle: "Beyond The Veil",
        finalAbilityDescription:
          "Can commune with lingering spectral residue to hear the last sounds recorded in an area before death.",
      },
    ],
    dossier: {
      characterName: "Elias Thorne",
      age: 35,
      gender: "male",
      cityOrigin: "Freiburg",
      quote:
        "Every lie leaves a footprint. You just have to know where to look.",
      avatarUrl: "/images/characters/detective_portrait/detective_portrait.png",
      accentColor: "#1A365D",
    },
  },
];

export const getOriginProfileById = (
  profileId: string,
): OriginProfileDefinition | null =>
  originProfiles.find((profile) => profile.id === profileId) ?? null;

export const getOriginProfileByChoiceId = (
  choiceId: string,
): OriginProfileDefinition | null =>
  originProfiles.find((profile) => profile.choiceId === choiceId) ?? null;

export const getOriginProfileByFlags = (
  flags: Record<string, boolean>,
): OriginProfileDefinition | null =>
  originProfiles.find((profile) => Boolean(flags[profile.originFlagKey])) ??
  null;

export const buildOriginChoiceEffects = (
  profile: OriginProfileDefinition,
): VnEffect[] => [
  ...profile.statEffects.map(
    (stat): VnEffect => ({
      type: "set_var",
      key: stat.key,
      value: stat.value,
    }),
  ),
  { type: "set_flag", key: profile.originFlagKey, value: true },
  { type: "set_flag", key: profile.flawFlagKey, value: true },
  { type: "set_flag", key: profile.signatureAbilityFlagKey, value: true },
  { type: "set_flag", key: "char_creation_complete", value: true },
  ...profile.tracks.map(
    (track): VnEffect => ({
      type: "set_var",
      key: track.progressVarKey,
      value: 0,
    }),
  ),
  {
    type: "track_event",
    eventName: "origin_selected",
    tags: { origin: profile.id },
  },
];

export const getSelectedOriginTrack = (
  profile: OriginProfileDefinition,
  flags: Record<string, boolean>,
): OriginTrackDefinition | null =>
  profile.tracks.find(
    (track) =>
      flags[track.tier1FlagKey] ||
      flags[track.tier2FlagKey] ||
      (track.selectedFlagKey !== undefined &&
        Boolean(flags[track.selectedFlagKey])),
  ) ?? null;

export type OriginParliamentPresetId = string;

export const getParliamentPresetForOrigin = (
  profile: OriginProfileDefinition,
  selectedTrack?: OriginTrackDefinition | null,
): OriginParliamentPresetId => selectedTrack?.parliamentPresetId ?? profile.id;
