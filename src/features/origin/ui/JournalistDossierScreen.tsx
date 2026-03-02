import { AlertCircle, ArrowRight, X } from "lucide-react";
import { getOriginProfileById } from "../../character/originProfiles";
import "./JournalistDossierScreen.css";

interface OriginDossierScreenProps {
  profileId: string;
  onConfirm: () => void;
  onCancel: () => void;
  disabled?: boolean;
  status?: string | null;
}

const formatStatLabel = (key: string): string =>
  key
    .replace(/^attr_/, "")
    .replace(/_/g, " ")
    .replace(/\b\w/g, (entry) => entry.toUpperCase());

export const OriginDossierScreen = ({
  profileId,
  onConfirm,
  onCancel,
  disabled = false,
  status,
}: OriginDossierScreenProps) => {
  const profile = getOriginProfileById(profileId);
  if (!profile) {
    return null;
  }

  const hasStatus = Boolean(status && status.trim().length > 0);

  return (
    <div className="origin-dossier-overlay" role="dialog" aria-modal="true">
      <article className="origin-dossier">
        <button
          type="button"
          className="origin-dossier__close"
          onClick={onCancel}
          aria-label="Close origin dossier"
        >
          <X size={16} />
        </button>

        <header className="origin-dossier__hero">
          <div
            className="origin-dossier__portrait"
            style={{ backgroundImage: `url('${profile.dossier.avatarUrl}')` }}
            aria-hidden="true"
          />
          <div className="origin-dossier__hero-fade" />
          <div className="origin-dossier__identity">
            <p className="origin-dossier__label">The Journalist</p>
            <h2>{profile.dossier.characterName}</h2>
            <p>{`${profile.dossier.cityOrigin} · age ${profile.dossier.age}`}</p>
          </div>
        </header>

        <section className="origin-dossier__quote">
          <p>{`"${profile.dossier.quote}"`}</p>
        </section>

        <section className="origin-dossier__block">
          <p className="origin-dossier__block-label">Signature Ability</p>
          <h3>{profile.dossier.signatureTitle}</h3>
          <p>{profile.dossier.signatureDescription}</p>
        </section>

        <section className="origin-dossier__block">
          <p className="origin-dossier__block-label">Fatal Flaw</p>
          <h3>{profile.dossier.flawTitle}</h3>
          <p>{profile.dossier.flawDescription}</p>
        </section>

        <section className="origin-dossier__stats">
          {profile.statEffects.map((stat) => (
            <span key={stat.key}>
              {`${formatStatLabel(stat.key)}: ${stat.value}`}
            </span>
          ))}
        </section>

        {hasStatus ? (
          <p className="origin-dossier__status">
            <AlertCircle size={14} />
            <span>{status}</span>
          </p>
        ) : null}

        <footer className="origin-dossier__actions">
          <button
            type="button"
            className="origin-dossier__ghost"
            onClick={onCancel}
          >
            Back
          </button>
          <button
            type="button"
            className="origin-dossier__confirm"
            onClick={onConfirm}
            disabled={disabled}
          >
            Begin Investigation
            <ArrowRight size={14} />
          </button>
        </footer>
      </article>
    </div>
  );
};
