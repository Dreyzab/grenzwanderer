import { originProfiles } from "../../character/originProfiles";
import type { VnSnapshot } from "../types";

const FALLBACK_PORTRAITS: Record<string, string> = {
  assistant: "/VN/start/image/train_assistant.png",
  paperboy: "/VN/start/image/boy_newspaper_styled.png",
  newspaper_boy: "/VN/start/image/boy_newspaper_styled.png",
  newsboy: "/VN/start/image/boy_newspaper_styled.png",
  police: "/VN/start/image/bahnhof_police_post_1776719605015.png",
  railway_police: "/VN/start/image/bahnhof_police_post_1776719605015.png",
};

const normalizeSpeakerId = (value: string): string =>
  value
    .trim()
    .toLowerCase()
    .replace(/[\s-]+/g, "_");

const candidateIdsForSpeaker = (speakerId: string): string[] => {
  const normalized = normalizeSpeakerId(speakerId);
  return Array.from(
    new Set(
      [
        normalized,
        normalized.replace(/^npc_/, ""),
        `npc_${normalized}`,
        normalized === "assistant" ? "char_assistant" : "",
        normalized === "paperboy" || normalized === "newsboy"
          ? "char_paperboy"
          : "",
      ].filter(Boolean),
    ),
  );
};

export function resolveSpeakerPortrait(
  speakerId: string,
  snapshot: VnSnapshot | null,
): string | undefined {
  const candidateIds = candidateIdsForSpeaker(speakerId);

  for (const identity of snapshot?.socialCatalog?.npcIdentities ?? []) {
    const identityKeys = candidateIdsForSpeaker(identity.id);
    const displayKeys = candidateIdsForSpeaker(identity.displayName);
    if (
      candidateIds.some(
        (candidate) =>
          identityKeys.includes(candidate) || displayKeys.includes(candidate),
      )
    ) {
      return identity.portraitUrl;
    }
  }

  for (const profile of originProfiles) {
    const profileKeys = [
      ...candidateIdsForSpeaker(profile.id),
      ...candidateIdsForSpeaker(profile.choiceId),
      ...candidateIdsForSpeaker(profile.label),
      ...candidateIdsForSpeaker(profile.dossier.characterName),
    ];
    if (candidateIds.some((candidate) => profileKeys.includes(candidate))) {
      return profile.dossier.avatarUrl;
    }
  }

  for (const candidate of candidateIds) {
    const fallback = FALLBACK_PORTRAITS[candidate];
    if (fallback) {
      return fallback;
    }
  }

  return undefined;
}
