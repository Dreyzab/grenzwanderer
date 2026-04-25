import { getOriginProfileByChoiceId } from "../../character/originProfiles";
import {
  resolveOriginProfileText,
  resolveStatLabel,
} from "../../i18n/vnContentTranslations";
import { useI18n } from "../../i18n/I18nContext";
import type { UiLanguage } from "../../../shared/hooks/useUiLanguage";
import type { VnChoice } from "../types";
import "./OriginChoiceCards.css";

interface OriginChoiceCardsProps {
  choices: VnChoice[];
  disabled?: boolean;
  language: UiLanguage;
  labels: {
    flaw: string;
    signature: string;
  };
  onPick: (choice: VnChoice) => void;
}

export const OriginChoiceCards = ({
  choices,
  disabled = false,
  language,
  labels,
  onPick,
}: OriginChoiceCardsProps) => {
  const { dictionary } = useI18n();

  const formatStatLabelLocal = (key: string): string => {
    const fallback = key
      .replace(/^attr_/, "")
      .replace(/_/g, " ")
      .replace(/\b\w/g, (entry) => entry.toUpperCase());

    return resolveStatLabel(language, key, fallback, dictionary);
  };
  const originChoices = choices
    .map((choice) => ({
      choice,
      profile: getOriginProfileByChoiceId(choice.id),
    }))
    .filter(
      (
        entry,
      ): entry is {
        choice: VnChoice;
        profile: NonNullable<typeof entry.profile>;
      } => entry.profile !== null,
    );

  if (originChoices.length === 0) {
    return null;
  }

  return (
    <section className="origin-cards">
      {originChoices.map(({ choice, profile }) => {
        const flawFallback = profile.flawFlagKey
          .replace(/^flaw_/, "")
          .replace(/_/g, " ");
        const signatureFallback = profile.signatureAbilityFlagKey
          .replace(/^ability_/, "")
          .replace(/_/g, " ");

        return (
          <button
            type="button"
            key={choice.id}
            className="origin-card"
            onClick={() => onPick(choice)}
            disabled={disabled}
          >
            <h4>
              {resolveOriginProfileText(
                language,
                profile.id,
                "label",
                choice.text || profile.label,
                dictionary,
              )}
            </h4>
            <p>
              {resolveOriginProfileText(
                language,
                profile.id,
                "summary",
                profile.summary,
                dictionary,
              )}
            </p>
            <p className="origin-card__meta">
              {`${labels.flaw}: ${resolveOriginProfileText(
                language,
                profile.id,
                "flaw",
                flawFallback,
                dictionary,
              )}`}
            </p>
            <p className="origin-card__meta">
              {`${labels.signature}: ${resolveOriginProfileText(
                language,
                profile.id,
                "signature",
                signatureFallback,
                dictionary,
              )}`}
            </p>
            <div className="origin-card__stats">
              {profile.statEffects.map((stat) => (
                <span key={stat.key}>
                  {`${formatStatLabelLocal(stat.key)} +${stat.value}`}
                </span>
              ))}
            </div>
          </button>
        );
      })}
    </section>
  );
};
