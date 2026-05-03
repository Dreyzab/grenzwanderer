import { useCallback, useMemo } from "react";
import {
  BookOpenText,
  Brain,
  FileText,
  Fingerprint,
  type LucideIcon,
} from "lucide-react";
import { useTable } from "spacetimedb/react";
import type { CanonicalVoicePromptProfile } from "../../../../data/voiceBridge";
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
import { useUiLanguage } from "../../../shared/hooks/useUiLanguage";
import { tables } from "../../../shared/spacetime/bindings";
import { getCharacterStrings } from "../../i18n/uiStrings";
import {
  buildEntityKnowledge,
  formatObservationKindLabel,
  resolveUnlockedObservationEntries,
} from "../../mysticism/model/mysticism";
import { parseSnapshot } from "../../vn/vnContent";
import {
  CORE_CHARACTERISTICS,
  SPECIALIZED_BY_CORE,
  type CharacterTabId,
} from "../characterScreenModel";
import {
  getOriginProfileByFlags,
  getSelectedOriginTrack,
} from "../originProfiles";
import { buildPsycheProfile } from "../psycheProfile";
import type { CharacterRadarDatum } from "../ui/CharacterRadarChart";
import type {
  AgencyCareerSummary,
  AttributeVoiceBridgeSummary,
  CharacterAttributeCard,
  CharacterContactEntry,
  CharacterObservationEntry,
  CharacterQuestJournalEntry,
  CharacterVoiceBridgeRegistryEntry,
} from "./characterPanel.types";
import {
  buildAttributeVoiceBridge,
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

  const attributeCards = useMemo<CharacterAttributeCard[]>(
    () =>
      CORE_CHARACTERISTICS.map((attribute) => ({
        ...attribute,
        value: myVars[attribute.key] ?? 0,
        voiceBridge: buildAttributeVoiceBridge(attribute),
        specialized: (SPECIALIZED_BY_CORE[attribute.key] ?? []).map(
          (specialized) => ({
            ...specialized,
            value: myVars[specialized.key] ?? 0,
            voiceBridge: buildAttributeVoiceBridge(specialized),
          }),
        ),
      })),
    [myVars],
  );

  const primaryVoiceBridgeEntries = useMemo<
    CharacterVoiceBridgeRegistryEntry[]
  >(
    () =>
      attributeCards
        .filter(
          (
            attribute,
          ): attribute is CharacterAttributeCard & {
            voiceBridge: AttributeVoiceBridgeSummary & {
              promptProfile: CanonicalVoicePromptProfile;
            };
          } =>
            attribute.voiceBridge !== null &&
            attribute.voiceBridge.promptProfile !== null,
        )
        .map((attribute) => ({
          sourceLabel: attribute.label,
          currentValue: attribute.value,
          accent: attribute.accent,
          bridge: attribute.voiceBridge,
        })),
    [attributeCards],
  );

  const secondaryVoiceBridgeEntries = useMemo(
    () =>
      attributeCards.flatMap((attribute) =>
        attribute.specialized
          .filter((specialized) => specialized.voiceBridge !== null)
          .map((specialized) => ({
            sourceLabel: specialized.label,
            currentValue: specialized.value,
            bridge: specialized.voiceBridge!,
            accent: specialized.accent,
          })),
      ),
    [attributeCards],
  );

  const radarData = useMemo<CharacterRadarDatum[]>(
    () =>
      attributeCards.map((attribute) => ({
        key: attribute.key,
        label: attribute.label,
        icon: attribute.icon,
        color: attribute.accent,
        value: attribute.value,
      })),
    [attributeCards],
  );

  return {
    activeOrigin,
    agencyCareerSummary,
    attributeCards,
    contactEntries,
    debugEnabled: ENABLE_DEBUG_CONTENT_SEED,
    dossierTabs,
    entityKnowledge,
    getObjectivePointLabel,
    myFlags,
    myVars,
    playerNickname,
    primaryVoiceBridgeEntries,
    profile,
    questJournalEntries,
    observationEntries,
    radarData,
    secondaryVoiceBridgeEntries,
    selectedTrack,
    t,
  };
};
