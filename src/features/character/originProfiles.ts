import type { VnEffect } from "../vn/types";

export interface OriginTrackDefinition {
  id: string;
  title: string;
  description: string;
  progressVarKey: string;
  tier1FlagKey: string;
  tier2FlagKey: string;
}

export interface OriginDossierDefinition {
  characterName: string;
  age: number;
  cityOrigin: string;
  quote: string;
  avatarUrl: string;
  accentColor: string;
  signatureTitle: string;
  signatureDescription: string;
  flawTitle: string;
  flawDescription: string;
}

export interface OriginProfileDefinition {
  id: string;
  choiceId: string;
  originFlagKey: string;
  label: string;
  summary: string;
  scenarioId: string;
  flawFlagKey: string;
  signatureAbilityFlagKey: string;
  statEffects: Array<{ key: string; value: number }>;
  tracks: OriginTrackDefinition[];
  dossier: OriginDossierDefinition;
}

const sharedTracks: OriginTrackDefinition[] = [
  {
    id: "whistleblower",
    title: "Whistleblower",
    description: "Build trusted informants and document leaks.",
    progressVarKey: "track_whistleblower_xp",
    tier1FlagKey: "track_whistleblower_tier1",
    tier2FlagKey: "track_whistleblower_tier2",
  },
  {
    id: "mythologist",
    title: "Mythologist",
    description: "Use folklore and rumor webs as investigative leverage.",
    progressVarKey: "track_mythologist_xp",
    tier1FlagKey: "track_mythologist_tier1",
    tier2FlagKey: "track_mythologist_tier2",
  },
];

export const originProfiles: OriginProfileDefinition[] = [
  {
    id: "journalist",
    choiceId: "BACKSTORY_JOURNALIST",
    originFlagKey: "origin_journalist",
    label: "Journalist Origin",
    summary: "Leaks, rumor networks, and pressure through publication.",
    scenarioId: "intro_journalist",
    flawFlagKey: "flaw_gambling_addiction",
    signatureAbilityFlagKey: "ability_nose_for_story",
    statEffects: [
      { key: "attr_encyclopedia", value: 4 },
      { key: "attr_perception", value: 3 },
      { key: "attr_deception", value: 2 },
    ],
    tracks: sharedTracks,
    dossier: {
      characterName: "Arthur Vance",
      age: 32,
      cityOrigin: "Stuttgart -> Freiburg",
      quote: "The city lies beautifully. My job is to make it stumble.",
      avatarUrl: "/images/characters/journalist_portrait.png",
      accentColor: "#a61c2f",
      signatureTitle: "Nose for a Story",
      signatureDescription:
        "Passive: bonus Encyclopedia check (DC -2) on entering a new location.",
      flawTitle: "Gambling Addiction",
      flawDescription: "Cannot resist high-risk opportunities.",
    },
  },
  {
    id: "aristocrat",
    choiceId: "BACKSTORY_ARISTOCRAT",
    originFlagKey: "origin_aristocrat",
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
    tracks: sharedTracks,
    dossier: {
      characterName: "Charlotte von Waldstein",
      age: 25,
      cityOrigin: "Karlsruhe (Hochadel)",
      quote: "I was taught to hold a rapier and hold a conversation.",
      avatarUrl: "/images/characters/aristocrat_portrait.png",
      accentColor: "#4e5d6c",
      signatureTitle: "Sharp Gaze",
      signatureDescription:
        "Passive: social authority checks gain reduced difficulty in noble circles.",
      flawTitle: "Claustrophobia",
      flawDescription: "Tight spaces destabilize focus and composure.",
    },
  },
  {
    id: "veteran",
    choiceId: "BACKSTORY_VETERAN",
    originFlagKey: "origin_veteran",
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
    tracks: sharedTracks,
    dossier: {
      characterName: "Gustav Eisenhart",
      age: 40,
      cityOrigin: "Baden-Wurttemberg",
      quote: "War took everything except the instinct to survive.",
      avatarUrl: "/images/characters/veteran_portrait.png",
      accentColor: "#b5852b",
      signatureTitle: "Combat Instinct",
      signatureDescription:
        "Passive: gains an edge in physical danger and confrontation scenes.",
      flawTitle: "Alcoholism",
      flawDescription: "Stress can push the veteran toward destructive relief.",
    },
  },
  {
    id: "archivist",
    choiceId: "BACKSTORY_ARCHIVIST",
    originFlagKey: "origin_archivist",
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
    tracks: sharedTracks,
    dossier: {
      characterName: "Martha Heller",
      age: 40,
      cityOrigin: "Freiburg (Altstadt)",
      quote: "Every archive hides a truth someone paid to bury.",
      avatarUrl: "/images/characters/doctor_portrait.png",
      accentColor: "#2e6b57",
      signatureTitle: "Index of Everything",
      signatureDescription:
        "Passive: automatically links records and inconsistencies across cases.",
      flawTitle: "Obsessive Archivist",
      flawDescription:
        "Fixation on missing records can override immediate priorities.",
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
