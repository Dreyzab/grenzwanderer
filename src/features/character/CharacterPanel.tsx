import { useMemo } from "react";
import { usePlayerFlags } from "../../entities/player/hooks/usePlayerFlags";
import { usePlayerVars } from "../../entities/player/hooks/usePlayerVars";
import { useUiLanguage } from "../../shared/hooks/useUiLanguage";
import { GameIcon } from "../../shared/ui/icons/game-icons";
import { getCharacterStrings } from "../i18n/uiStrings";
import { getOriginProfileByFlags } from "./originProfiles";
import { buildPsycheProfile } from "./psycheProfile";

const toLocale = (value: number): string =>
  Number.isInteger(value) ? value.toString() : value.toFixed(2);

export const CharacterPanel = () => {
  const myFlags = usePlayerFlags();
  const myVars = usePlayerVars();

  const profile = useMemo(
    () => buildPsycheProfile({ flags: myFlags, vars: myVars }),
    [myFlags, myVars],
  );
  const uiLanguage = useUiLanguage(myFlags);
  const t = useMemo(() => getCharacterStrings(uiLanguage), [uiLanguage]);
  const activeOrigin = useMemo(
    () => getOriginProfileByFlags(myFlags),
    [myFlags],
  );

  const attributeCards: Array<{ key: string; icon: string; label: string }> = [
    { key: "attr_intellect", icon: "intellect", label: "Intellect" },
    { key: "attr_encyclopedia", icon: "intellect", label: "Encyclopedia" },
    { key: "attr_perception", icon: "spirit", label: "Perception" },
    { key: "attr_deception", icon: "shadow", label: "Deception" },
    { key: "attr_social", icon: "social", label: "Social" },
    { key: "attr_physical", icon: "physical", label: "Physical" },
    { key: "attr_psyche", icon: "psyche", label: "Psyche" },
    { key: "attr_spirit", icon: "spirit", label: "Spirit" },
    { key: "attr_shadow", icon: "shadow", label: "Shadow" },
  ];

  return (
    <section className="panel-section">
      <header className="panel-header">
        <div>
          <h2>{t.panelTitle}</h2>
          <p>
            {t.panelSubtitle} <code>player_var</code> / <code>player_flag</code>
            .
          </p>
        </div>
      </header>

      <div className="card-grid">
        {attributeCards.map((card) => (
          <article key={card.key} className="card compact">
            <div className="icon-row">
              <GameIcon name={card.icon} size={24} />
              <strong>{card.label}</strong>
            </div>
            <div className="stat-number">{toLocale(myVars[card.key] ?? 0)}</div>
          </article>
        ))}
      </div>

      <article className="card">
        <h3>{profile.alignment.label}</h3>
        <p>{profile.alignment.description}</p>
      </article>

      {activeOrigin ? (
        <article className="card">
          <h3>{t.originProfile}</h3>
          <p>{activeOrigin.label}</p>
          <p>{activeOrigin.summary}</p>
          <p>
            {`Flaw: ${activeOrigin.flawFlagKey.replace(/^flaw_/, "").replace(/_/g, " ")}`}
          </p>
          <p>
            {`Signature: ${activeOrigin.signatureAbilityFlagKey
              .replace(/^ability_/, "")
              .replace(/_/g, " ")}`}
          </p>
        </article>
      ) : null}

      <div className="card-grid two-col">
        <article className="card">
          <h3>{t.factionSignals}</h3>
          <ul className="unstyled-list">
            {profile.factionSignals.map((signal) => (
              <li key={signal.key} className="list-row">
                <span
                  className="dot"
                  style={{ backgroundColor: signal.color }}
                />
                <span>{signal.label}</span>
                <strong>{toLocale(signal.reputation)}</strong>
              </li>
            ))}
          </ul>
        </article>

        <article className="card">
          <h3>{t.checks}</h3>
          <ul className="unstyled-list">
            <li className="list-row">
              <span>Passed</span>
              <strong>{profile.checks.passed}</strong>
            </li>
            <li className="list-row">
              <span>Failed</span>
              <strong>{profile.checks.failed}</strong>
            </li>
            <li className="list-row">
              <span>Locked</span>
              <strong>{profile.checks.locked}</strong>
            </li>
            <li className="list-row">
              <span>Confidence</span>
              <strong>{profile.checks.confidencePercent}%</strong>
            </li>
          </ul>
        </article>
      </div>

      <div className="card-grid two-col">
        <article className="card">
          <h3>{t.secrets}</h3>
          <ul className="unstyled-list">
            {profile.secrets.map((secret) => (
              <li key={secret.id} className="secret-row">
                <strong>{secret.title}</strong>
                <span>{secret.unlocked ? "Unlocked" : secret.hint}</span>
              </li>
            ))}
          </ul>
        </article>

        <article className="card">
          <h3>{t.evolutionTracks}</h3>
          <ul className="unstyled-list">
            {profile.evolutionTracks.map((track) => (
              <li key={track.id} className="secret-row">
                <strong>
                  {track.title} ({track.progressPercent}%)
                </strong>
                <span>{track.note}</span>
              </li>
            ))}
          </ul>
        </article>
      </div>

      <div className="card-grid two-col">
        <article className="card">
          <h3>Raw Flags</h3>
          <pre className="code-box">{JSON.stringify(myFlags, null, 2)}</pre>
        </article>
        <article className="card">
          <h3>Raw Vars</h3>
          <pre className="code-box">{JSON.stringify(myVars, null, 2)}</pre>
        </article>
      </div>
    </section>
  );
};
