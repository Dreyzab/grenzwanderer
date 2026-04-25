import type { I18nDictionary } from "./I18nContext";
import type { UiLanguage } from "../../shared/hooks/useUiLanguage";
import type { VnChoice, VnScenario } from "../vn/types";

export type VnContentField = "title" | "body";
export type OriginContentField = "label" | "summary" | "flaw" | "signature";

export const buildVnNodeTranslationKey = (
  scenarioId: string,
  nodeId: string,
  field: VnContentField,
): string => `vn.${scenarioId}.${nodeId}.${field}`;

export const buildVnChoiceTranslationKey = (
  scenarioId: string,
  nodeId: string,
  choiceId: string,
): string => `vn.${scenarioId}.${nodeId}.choice.${choiceId}`;

export const buildVnChoiceHintTranslationKey = (
  scenarioId: string,
  nodeId: string,
  choiceId: string,
  voiceId: string,
  stance: string,
): string =>
  `vn.${scenarioId}.${nodeId}.choice.${choiceId}.hint.${voiceId}.${stance}`;

export const buildVnScenarioTitleTranslationKey = (
  scenarioId: string,
): string => `vn.${scenarioId}.title`;

export const buildOriginTranslationKey = (
  originId: string,
  field: OriginContentField,
): string => `origin.${originId}.${field}`;

export const resolveTranslatedText = (
  language: UiLanguage,
  key: string,
  fallback: string,
  dictionary?: I18nDictionary | null,
): string => {
  if (language === "en" || !dictionary) {
    return fallback;
  }

  // Check specific sections first, then fallback to general lookup if needed
  // Note: Most keys are already prefixed (e.g. "vn.", "origin.")
  return dictionary.vn[key] || dictionary.origin[key] || fallback;
};

export const resolveSpeakerLabel = (
  language: UiLanguage,
  speakerId: string,
  fallback: string,
  dictionary?: I18nDictionary | null,
): string => {
  if (language === "en" || !dictionary) {
    return fallback;
  }
  return dictionary.speakers[speakerId] || fallback;
};

export const resolveStatLabel = (
  language: UiLanguage,
  statKey: string,
  fallback: string,
  dictionary?: I18nDictionary | null,
): string => {
  if (language === "en" || !dictionary) {
    return fallback;
  }
  return dictionary.stats[statKey] || fallback;
};

export const resolveVnScenarioTitle = (
  language: UiLanguage,
  scenario: Pick<VnScenario, "id" | "title"> | null | undefined,
  fallback: string,
  dictionary?: I18nDictionary | null,
): string => {
  if (!scenario) {
    return fallback;
  }

  return resolveTranslatedText(
    language,
    buildVnScenarioTitleTranslationKey(scenario.id),
    fallback,
    dictionary,
  );
};

export const resolveVnNodeText = (
  language: UiLanguage,
  scenarioId: string,
  nodeId: string | null | undefined,
  field: VnContentField,
  fallback: string,
  dictionary?: I18nDictionary | null,
): string => {
  if (!nodeId) {
    return fallback;
  }

  return resolveTranslatedText(
    language,
    buildVnNodeTranslationKey(scenarioId, nodeId, field),
    fallback,
    dictionary,
  );
};

export const resolveOriginProfileText = (
  language: UiLanguage,
  originId: string,
  field: OriginContentField,
  fallback: string,
  dictionary?: I18nDictionary | null,
): string =>
  resolveTranslatedText(
    language,
    buildOriginTranslationKey(originId, field),
    fallback,
    dictionary,
  );

export const localizeVnChoice = (
  language: UiLanguage,
  scenarioId: string,
  nodeId: string | null | undefined,
  choice: VnChoice,
  dictionary?: I18nDictionary | null,
): VnChoice => {
  if (!nodeId) {
    return choice;
  }

  const text = resolveTranslatedText(
    language,
    buildVnChoiceTranslationKey(scenarioId, nodeId, choice.id),
    choice.text,
    dictionary,
  );

  const innerVoiceHints = choice.innerVoiceHints?.map((hint) => {
    const localizedHintText = resolveTranslatedText(
      language,
      buildVnChoiceHintTranslationKey(
        scenarioId,
        nodeId,
        choice.id,
        hint.voiceId,
        hint.stance,
      ),
      hint.text,
      dictionary,
    );

    return localizedHintText === hint.text
      ? hint
      : { ...hint, text: localizedHintText };
  });

  const hintsChanged =
    innerVoiceHints !== undefined &&
    innerVoiceHints.some(
      (hint, index) => hint !== choice.innerVoiceHints?.[index],
    );

  if (text === choice.text && !hintsChanged) {
    return choice;
  }

  return {
    ...choice,
    text,
    innerVoiceHints: innerVoiceHints ?? choice.innerVoiceHints,
  };
};

export const localizeVnChoices = (
  language: UiLanguage,
  scenarioId: string,
  nodeId: string | null | undefined,
  choices: readonly VnChoice[],
  dictionary?: I18nDictionary | null,
): VnChoice[] => {
  let changed = false;
  const localized = choices.map((choice) => {
    const nextChoice = localizeVnChoice(
      language,
      scenarioId,
      nodeId,
      choice,
      dictionary,
    );
    changed = changed || nextChoice !== choice;
    return nextChoice;
  });

  return changed ? localized : [...choices];
};
