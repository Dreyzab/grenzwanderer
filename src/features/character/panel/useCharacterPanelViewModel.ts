import { useCallback, useMemo } from "react";
import {
  BookOpenText,
  Brain,
  FileText,
  Fingerprint,
  type LucideIcon,
} from "lucide-react";
import { useTable } from "spacetimedb/react";
import {
  INNER_VOICE_DEFINITIONS,
  INNER_VOICE_IDS,
  SKILL_VOICE_IDS,
  type SkillVoiceId,
} from "../../../../data/innerVoiceContract";
import {
  rankPatronVoicesByInfluence,
  SKILL_DEFINITIONS,
  SKILL_IDS_BY_PATRON_VOICE,
} from "../../../../data/skillDefinitions";
import { ENABLE_DEBUG_CONTENT_SEED } from "../../../config";
import { usePlayerBindings } from "../../../entities/player/hooks/usePlayerBindings";
import {
  getAgencyStandingPresentation,
  getCareerRankLabel,
  getFactionCatalogForUi,
  getFavorPresentation,
  getRevealedFactionState,
  getTrendLabel,
  getTrustBandPresentation,
  isNpcIdentityRevealed,
} from "../../../shared/game/socialPresentation";
import {
  resolveSkillRank,
  skillXpVarKeyFor,
} from "../../../shared/game/skillProgression";
import {
  getNextSkillRankPerk,
  getUnlockedSkillRankPerks,
} from "../../../shared/game/skillPerks";
import { useUiLanguage } from "../../../shared/hooks/useUiLanguage";
import { tables } from "../../../shared/spacetime/bindings";
import { getCharacterStrings } from "../../i18n/uiStrings";
import {
  buildEntityKnowledge,
  formatObservationKindLabel,
  resolveUnlockedObservationEntries,
} from "../../mysticism/model/mysticism";
import { parseSnapshot } from "../../vn/vnContent";
import type { CharacterTabId } from "../characterScreenModel";
import {
  getOriginProfileByFlags,
  getSelectedOriginTrack,
} from "../originProfiles";
import { buildPsycheProfile } from "../psycheProfile";
import type { CharacterRadarDatum } from "../ui/CharacterRadarChart";
import type {
  AgencyCareerSummary,
  CharacterContactEntry,
  CharacterObservationEntry,
  CharacterQuestJournalEntry,
  PatronVoiceCard,
} from "./characterPanel.types";
import {
  getPatronVoiceIcon,
  getSkillVoiceIcon,
  normalizeNumber,
  unwrapOptionalString,
} from "./characterPanel.utils";

export const useCharacterPanelViewModel = () => {
  const playerBindings = usePlayerBindings();
  const myFlags = playerBindings.flags;
  const myVars = playerBindings.vars;
  const playerProfileRows = playerBindings.rows.profiles;
  const questRows = playerBindings.quests;
  const npcStateRows = playerBindings.npcState;
  const npcFavorRows = playerBindings.npcFavors;
  const factionSignalRows = playerBindings.factionSignals;
  const agencyCareerRows = playerBindings.rows.agencyCareer;
  const [versions] = useTable(tables.contentVersion);
  const [snapshots] = useTable(tables.contentSnapshot);
  const uiLanguage = useUiLanguage(myFlags);
  const t = useMemo(() => getCharacterStrings(uiLanguage), [uiLanguage]);
  const dossierTabs = useMemo<
    Array<{
      id: CharacterTabId;
      icon: LucideIcon;
      label: string;
    }>
  >(
    () => [
      { id: "profile", icon: FileText, label: t.tabs.profile },
      { id: "development", icon: Brain, label: t.tabs.development },
      { id: "psyche", icon: Fingerprint, label: t.tabs.psyche },
      { id: "journal", icon: BookOpenText, label: t.tabs.journal },
    ],
    [t],
  );
  const activeOrigin = useMemo(
    () => getOriginProfileByFlags(myFlags),
    [myFlags],
  );
  const selectedTrack = useMemo(
    () => (activeOrigin ? getSelectedOriginTrack(activeOrigin, myFlags) : null),
    [activeOrigin, myFlags],
  );
  const playerNickname = useMemo(
    () => unwrapOptionalString(playerProfileRows[0]?.nickname),
    [playerProfileRows],
  );

  const activeVersion = useMemo(
    () => versions.find((entry) => entry.isActive) ?? null,
    [versions],
  );

  const activeSnapshot = useMemo(() => {
    if (!activeVersion) {
      return null;
    }

    const snapshotRow = snapshots.find(
      (entry) => entry.checksum === activeVersion.checksum,
    );
    if (!snapshotRow) {
      return null;
    }

    return parseSnapshot(snapshotRow.payloadJson);
  }, [activeVersion, snapshots]);

  const socialCatalog = activeSnapshot?.socialCatalog;
  const factionCatalog = useMemo(
    () => getFactionCatalogForUi(socialCatalog),
    [socialCatalog],
  );

  const factionSignalState = useMemo(
    () =>
      factionSignalRows.map((row) => ({
        factionId: row.factionId,
        value: row.value,
        trend: row.trend,
      })),
    [factionSignalRows],
  );

  const socialRelationshipState = useMemo(() => {
    const trustByNpcId = new Map<string, number>();
    for (const row of npcStateRows) {
      trustByNpcId.set(row.npcId, row.trustScore);
    }

    const favorByNpcId = new Map<string, number>();
    for (const row of npcFavorRows) {
      favorByNpcId.set(row.npcId, normalizeNumber(row.balance));
    }

    return {
      trustByNpcId,
      favorByNpcId,
    };
  }, [npcFavorRows, npcStateRows]);

  const revealedFactionState = useMemo(
    () =>
      getRevealedFactionState({
        socialCatalog,
        flags: myFlags,
        trustByNpcId: socialRelationshipState.trustByNpcId,
        favorByNpcId: socialRelationshipState.favorByNpcId,
        factionSignals: factionSignalState,
      }),
    [factionSignalState, myFlags, socialCatalog, socialRelationshipState],
  );

  const profile = useMemo(
    () =>
      buildPsycheProfile({
        flags: myFlags,
        vars: myVars,
        factionCatalog,
        factionSignals: factionSignalState,
        revealedFactionIds: revealedFactionState.revealedFactionIds,
        revealedFactionReasons: revealedFactionState.revealReasons,
      }),
    [factionCatalog, factionSignalState, myFlags, myVars, revealedFactionState],
  );

  const agencyCareerRow = useMemo(
    () => agencyCareerRows[0] ?? null,
    [agencyCareerRows],
  );

  const agencyCareerSummary = useMemo<AgencyCareerSummary>(() => {
    const standingScore = agencyCareerRow?.standingScore ?? 0;
    const standingPresentation = getAgencyStandingPresentation(standingScore);
    const completedCriteria = [
      agencyCareerRow?.rumorCriterionComplete,
      agencyCareerRow?.sourceCriterionComplete,
      agencyCareerRow?.cleanClosureCriterionComplete,
    ].filter(Boolean).length;

    return {
      rankLabel: getCareerRankLabel(socialCatalog, agencyCareerRow?.rankId),
      standingLabel: standingPresentation.label,
      standingTone: standingPresentation.tone,
      trendLabel: getTrendLabel(agencyCareerRow?.standingTrend),
      criteriaSummary: `${completedCriteria}/3 logged`,
    };
  }, [agencyCareerRow, socialCatalog]);

  const questStageById = useMemo(() => {
    const byId = new Map<string, number>();
    for (const row of questRows) {
      byId.set(row.questId, normalizeNumber(row.stage));
    }
    return byId;
  }, [questRows]);

  const pointTitleById = useMemo(() => {
    const byId = new Map<string, string>();
    for (const point of activeSnapshot?.map?.points ?? []) {
      byId.set(point.id, point.title);
    }
    return byId;
  }, [activeSnapshot?.map?.points]);

  const contactEntries = useMemo<CharacterContactEntry[]>(() => {
    const serviceLabelById = new Map<string, string>();
    for (const service of socialCatalog?.services ?? []) {
      serviceLabelById.set(service.id, service.label);
    }

    return (socialCatalog?.npcIdentities ?? [])
      .filter((identity) =>
        isNpcIdentityRevealed(
          identity,
          myFlags,
          socialRelationshipState.trustByNpcId,
          socialRelationshipState.favorByNpcId,
        ),
      )
      .map((identity) => {
        const trustPresentation = getTrustBandPresentation(
          socialRelationshipState.trustByNpcId.get(identity.id) ?? 0,
        );
        const favorPresentation = getFavorPresentation(
          socialRelationshipState.favorByNpcId.get(identity.id) ?? 0,
        );
        return {
          id: identity.id,
          displayName: identity.displayName,
          publicRole: identity.publicRole,
          relationshipStatus: trustPresentation.label,
          relationshipTone: trustPresentation.tone,
          favorState: favorPresentation.label,
          favorTone: favorPresentation.tone,
          services: (identity.serviceIds ?? []).map(
            (serviceId) => serviceLabelById.get(serviceId) ?? serviceId,
          ),
        };
      })
      .sort((left, right) => left.displayName.localeCompare(right.displayName));
  }, [
    myFlags,
    socialRelationshipState,
    socialCatalog?.npcIdentities,
    socialCatalog?.services,
  ]);

  const getObjectivePointLabel = useCallback(
    (pointId: string): string => {
      const title = pointTitleById.get(pointId);
      if (title) {
        return title;
      }
      return ENABLE_DEBUG_CONTENT_SEED ? pointId : "Unknown objective point";
    },
    [pointTitleById],
  );

  const questJournalEntries = useMemo<CharacterQuestJournalEntry[]>(() => {
    const catalog = activeSnapshot?.questCatalog ?? [];

    return catalog.map((quest) => {
      const sortedStages = [...quest.stages].sort(
        (left, right) => left.stage - right.stage,
      );
      const currentStage = questStageById.get(quest.id) ?? 1;
      const activeStage =
        sortedStages.find((stage) => stage.stage === currentStage) ??
        sortedStages.find((stage) => stage.stage > currentStage) ??
        sortedStages[sortedStages.length - 1];
      const hasQuestRow = questStageById.has(quest.id);
      const isCompleted =
        hasQuestRow &&
        currentStage >= sortedStages[sortedStages.length - 1].stage;

      return {
        id: quest.id,
        title: quest.title,
        currentStage,
        activeStage,
        status: isCompleted
          ? "Completed"
          : hasQuestRow
            ? "In progress"
            : "Not started",
      };
    });
  }, [activeSnapshot?.questCatalog, questStageById]);

  const observationEntries = useMemo<CharacterObservationEntry[]>(
    () =>
      resolveUnlockedObservationEntries(activeSnapshot, myFlags).map(
        (entry) => ({
          id: entry.id,
          kind: formatObservationKindLabel(entry.kind),
          title: entry.title,
          text: entry.text,
          rationalInterpretation: entry.rationalInterpretation,
          entityArchetypeId: entry.entityArchetypeId,
        }),
      ),
    [activeSnapshot, myFlags],
  );

  const entityKnowledge = useMemo(
    () =>
      buildEntityKnowledge(
        activeSnapshot?.mysticism?.entityArchetypes,
        resolveUnlockedObservationEntries(activeSnapshot, myFlags),
      ),
    [activeSnapshot, myFlags],
  );

  const skillXp = useMemo<Partial<Record<SkillVoiceId, number>>>(
    () =>
      SKILL_VOICE_IDS.reduce<Partial<Record<SkillVoiceId, number>>>(
        (levels, skillId) => {
          const xpKey = skillXpVarKeyFor(skillId);
          levels[skillId] =
            myVars[xpKey] !== undefined
              ? myVars[xpKey]
              : (myVars[skillId] ?? 0) * 100;
          return levels;
        },
        {},
      ),
    [myVars],
  );

  const rankedPatronVoiceInfluence = useMemo(
    () => rankPatronVoicesByInfluence({ skillXp }),
    [skillXp],
  );

  const patronVoiceCards = useMemo<PatronVoiceCard[]>(() => {
    const influenceByVoice = new Map(
      rankedPatronVoiceInfluence.map((entry, index) => [
        entry.voiceId,
        { ...entry, dominanceRank: index + 1 },
      ]),
    );

    return INNER_VOICE_IDS.map((voiceId) => {
      const definition = INNER_VOICE_DEFINITIONS[voiceId];
      const influence = influenceByVoice.get(voiceId);

      return {
        voiceId,
        label: definition.label,
        influence: influence?.influence ?? 0,
        dominanceRank: influence?.dominanceRank ?? INNER_VOICE_IDS.length,
        worldview: definition.worldview,
        toneDescriptor: definition.toneDescriptor,
        palette: definition.palette,
        iconName: getPatronVoiceIcon(voiceId),
        methods: SKILL_IDS_BY_PATRON_VOICE[voiceId].map((skillId) => {
          const skillDefinition = SKILL_DEFINITIONS[skillId];
          const rankState = resolveSkillRank(skillXp[skillId] ?? 0);
          return {
            id: skillId,
            label: skillDefinition.label,
            labelRu: skillDefinition.labelRu,
            rankState,
            progressionRole: skillDefinition.progressionRole,
            descriptionRu: skillDefinition.descriptionRu,
            iconName: getSkillVoiceIcon(skillId),
            definition: skillDefinition,
            unlockedPerks: getUnlockedSkillRankPerks(skillId, rankState),
            nextPerk: getNextSkillRankPerk(skillId, rankState),
          };
        }),
      };
    });
  }, [rankedPatronVoiceInfluence, skillXp]);

  const radarData = useMemo<CharacterRadarDatum[]>(
    () =>
      patronVoiceCards.map((voice) => ({
        key: voice.voiceId,
        label: voice.label,
        icon: voice.iconName,
        color: voice.palette.accent,
        value: voice.influence,
      })),
    [patronVoiceCards],
  );

  return {
    activeOrigin,
    agencyCareerSummary,
    contactEntries,
    debugEnabled: ENABLE_DEBUG_CONTENT_SEED,
    dossierTabs,
    entityKnowledge,
    getObjectivePointLabel,
    myFlags,
    myVars,
    playerNickname,
    patronVoiceCards,
    profile,
    questJournalEntries,
    observationEntries,
    radarData,
    selectedTrack,
    t,
  };
};
