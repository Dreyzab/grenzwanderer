import { getOriginProfileByChoiceId } from "../../character/originProfiles";
import type { VnChoice } from "../types";
import "./OriginChoiceCards.css";

interface OriginChoiceCardsProps {
  choices: VnChoice[];
  disabled?: boolean;
  onPick: (choice: VnChoice) => void;
}

const formatStatLabel = (key: string): string =>
  key
    .replace(/^attr_/, "")
    .replace(/_/g, " ")
    .replace(/\b\w/g, (entry) => entry.toUpperCase());

export const OriginChoiceCards = ({
  choices,
  disabled = false,
  onPick,
}: OriginChoiceCardsProps) => {
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
      {originChoices.map(({ choice, profile }) => (
        <button
          type="button"
          key={choice.id}
          className="origin-card"
          onClick={() => onPick(choice)}
          disabled={disabled}
        >
          <h4>{profile.label}</h4>
          <p>{profile.summary}</p>
          <p className="origin-card__meta">
            {`Flaw: ${profile.flawFlagKey.replace(/^flaw_/, "").replace(/_/g, " ")}`}
          </p>
          <p className="origin-card__meta">
            {`Signature: ${profile.signatureAbilityFlagKey
              .replace(/^ability_/, "")
              .replace(/_/g, " ")}`}
          </p>
          <div className="origin-card__stats">
            {profile.statEffects.map((stat) => (
              <span key={stat.key}>
                {`${formatStatLabel(stat.key)} +${stat.value}`}
              </span>
            ))}
          </div>
        </button>
      ))}
    </section>
  );
};
