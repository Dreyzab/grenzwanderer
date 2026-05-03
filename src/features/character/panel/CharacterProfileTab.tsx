import { motion } from "framer-motion";
import type { getCharacterStrings } from "../../i18n/uiStrings";
import type {
  OriginProfileDefinition,
  OriginTrackDefinition,
} from "../originProfiles";
import type { PsycheProfileData } from "../psycheProfile";
import { C, TAB_TRANSITION } from "./characterPanel.theme";
import type {
  AgencyCareerSummary,
  CharacterContactEntry,
} from "./characterPanel.types";
import { getGenderLabel, getSocialTone } from "./characterPanel.utils";
import { InfoBlock, SectionCard } from "./characterPanelPrimitives";

export const CharacterProfileTab = ({
  activeOrigin,
  alignment,
  agencyCareer,
  contacts,
  debugEnabled,
  flags,
  playerNickname,
  panelSubtitle,
  selectedTrack,
  vars,
  t,
}: {
  activeOrigin: OriginProfileDefinition | null;
  alignment: PsycheProfileData["alignment"];
  agencyCareer: AgencyCareerSummary;
  contacts: CharacterContactEntry[];
  debugEnabled: boolean;
  flags: Record<string, boolean>;
  playerNickname: string | null;
  panelSubtitle: string;
  selectedTrack: OriginTrackDefinition | null;
  vars: Record<string, number>;
  t: ReturnType<typeof getCharacterStrings>;
}) => {
  const dossierAccent = activeOrigin?.dossier.accentColor ?? C.brass;

  return (
    <motion.div
      animate={{ opacity: 1, y: 0 }}
      className="space-y-4"
      exit={{ opacity: 0, y: -10 }}
      initial={{ opacity: 0, y: 10 }}
      key="profile"
      transition={TAB_TRANSITION}
    >
      <div className="grid gap-4 xl:grid-cols-[minmax(0,1.3fr)_minmax(280px,0.9fr)]">
        <SectionCard
          accent={dossierAccent}
          eyebrow={t.originProfile}
          title={activeOrigin?.label ?? "Field Identity Pending"}
        >
          {activeOrigin ? (
            <div className="space-y-4 text-sm text-stone-300">
              <p className="leading-relaxed text-stone-300">
                {activeOrigin.summary}
              </p>
              <div className="grid gap-3 sm:grid-cols-2">
                <InfoBlock
                  label={t.identity}
                  value={activeOrigin.dossier.characterName}
                />
                <InfoBlock
                  label={t.nickname}
                  value={playerNickname?.trim() || "Unassigned"}
                />
                <InfoBlock
                  label={t.biometrics}
                  value={`${getGenderLabel(activeOrigin.dossier.gender)} / ${activeOrigin.dossier.age}`}
                />
                <InfoBlock
                  label={t.originCity}
                  value={activeOrigin.dossier.cityOrigin}
                />
                <InfoBlock
                  label={t.specialization}
                  value={selectedTrack?.title ?? "Undeclared"}
                />
                <InfoBlock label={t.scenario} value={activeOrigin.scenarioId} />
              </div>
              <blockquote
                className="rounded-[1rem] border border-white/8 bg-black/20 px-4 py-3 italic text-stone-300"
                style={{
                  borderLeftColor: dossierAccent,
                  borderLeftWidth: "3px",
                }}
              >
                "{activeOrigin.dossier.quote}"
              </blockquote>
            </div>
          ) : (
            <p className="leading-relaxed text-stone-400">
              No origin dossier is active yet. The screen still reflects live
              player flags, variables, and active content state.
            </p>
          )}
        </SectionCard>

        <SectionCard
          accent={C.crimson}
          eyebrow="Agency Standing"
          title={agencyCareer.rankLabel}
        >
          <div className="space-y-4 text-sm text-stone-300">
            <p className="leading-relaxed text-stone-300">
              {panelSubtitle} Agency recognition now tracks rank, standing, and
              qualifying milestones rather than a second XP bar.
            </p>
            <p className="leading-relaxed text-stone-400">
              {agencyCareer.standingLabel}. {agencyCareer.trendLabel}. Alignment
              remains {alignment.label.toLowerCase()}.
            </p>
            <div className="grid gap-3 sm:grid-cols-2">
              <InfoBlock label={t.rank} value={agencyCareer.rankLabel} />
              <InfoBlock
                label={t.standing}
                value={agencyCareer.standingLabel}
              />
              <InfoBlock label={t.trend} value={agencyCareer.trendLabel} />
              <InfoBlock
                label={t.serviceCriteria}
                value={agencyCareer.criteriaSummary}
              />
            </div>
          </div>
        </SectionCard>
      </div>

      <SectionCard
        accent={C.amber}
        eyebrow={t.contactNetwork}
        title={`${contacts.length} ${t.activeFiles}`}
      >
        {contacts.length === 0 ? (
          <p className="text-sm leading-relaxed text-stone-400">
            No pilot contacts have moved into your network yet.
          </p>
        ) : (
          <div className="grid gap-3 xl:grid-cols-2">
            {contacts.map((contact) => (
              <article
                key={contact.id}
                className="rounded-[1rem] border border-white/8 bg-black/20 p-4"
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h4 className="text-base font-semibold text-stone-100">
                      {contact.displayName}
                    </h4>
                    <p className="mt-1 text-sm text-stone-400">
                      {contact.publicRole}
                    </p>
                  </div>
                  <span
                    className="rounded-full border px-3 py-1 text-[10px] uppercase tracking-[0.28em]"
                    style={getSocialTone(contact.relationshipTone)}
                  >
                    {contact.relationshipStatus}
                  </span>
                </div>
                <p
                  className="mt-3 inline-flex rounded-full border px-3 py-1 text-[10px] uppercase tracking-[0.24em]"
                  style={getSocialTone(contact.favorTone)}
                >
                  {contact.favorState}
                </p>
                <p className="mt-3 text-xs leading-relaxed text-stone-500">
                  {contact.services.length > 0
                    ? `Services: ${contact.services.join(", ")}`
                    : "No published services yet."}
                </p>
              </article>
            ))}
          </div>
        )}
      </SectionCard>

      {activeOrigin ? (
        <div className="grid gap-4 xl:grid-cols-2">
          <SectionCard
            accent={activeOrigin.dossier.accentColor}
            eyebrow={t.signature}
            title={activeOrigin.signature.title}
          >
            <div className="space-y-3 text-sm text-stone-300">
              <p className="leading-relaxed">
                {activeOrigin.signature.description}
              </p>
              <span
                className="inline-flex rounded-full border px-3 py-1 text-[10px] uppercase tracking-[0.3em]"
                style={{
                  borderColor: "rgba(181, 133, 43, 0.35)",
                  color: "#f4d18a",
                  backgroundColor: "rgba(181, 133, 43, 0.12)",
                  fontFamily: "var(--font-mono)",
                }}
              >
                {activeOrigin.signature.passiveLabel}
              </span>
            </div>
          </SectionCard>

          <SectionCard
            accent={C.crimson}
            eyebrow={t.flaw}
            title={activeOrigin.flaw.title}
          >
            <div className="space-y-3 text-sm text-stone-300">
              <p className="leading-relaxed">{activeOrigin.flaw.description}</p>
              <div className="grid gap-3 sm:grid-cols-3">
                <InfoBlock
                  label={t.checkVoice}
                  value={activeOrigin.flaw.checkVoice}
                />
                <InfoBlock
                  label={t.dc}
                  value={activeOrigin.flaw.dc.toString()}
                />
                <InfoBlock
                  label={t.duration}
                  value={activeOrigin.flaw.durationLabel}
                />
              </div>
            </div>
          </SectionCard>
        </div>
      ) : null}

      {debugEnabled ? (
        <div className="grid gap-4 xl:grid-cols-2">
          <SectionCard accent={C.slate} eyebrow="Debug" title="Raw Flags">
            <pre className="max-h-[280px] overflow-auto rounded-[1rem] border border-white/8 bg-black/30 p-3 text-xs text-stone-200">
              {JSON.stringify(flags, null, 2)}
            </pre>
          </SectionCard>
          <SectionCard accent={C.slate} eyebrow="Debug" title="Raw Vars">
            <pre className="max-h-[280px] overflow-auto rounded-[1rem] border border-white/8 bg-black/30 p-3 text-xs text-stone-200">
              {JSON.stringify(vars, null, 2)}
            </pre>
          </SectionCard>
        </div>
      ) : null}
    </motion.div>
  );
};
