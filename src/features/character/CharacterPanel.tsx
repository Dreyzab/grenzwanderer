import { useState } from "react";
import { AnimatePresence } from "framer-motion";
import type { CharacterTabId } from "./characterScreenModel";
import { CharacterDevelopmentTab } from "./panel/CharacterDevelopmentTab";
import { CharacterJournalTab } from "./panel/CharacterJournalTab";
import { CharacterProfileTab } from "./panel/CharacterProfileTab";
import { CharacterPsycheTab } from "./panel/CharacterPsycheTab";
import { C, CLIP_PANEL } from "./panel/characterPanel.theme";
import { DossierTabButton } from "./panel/characterPanelPrimitives";
import { useCharacterPanelViewModel } from "./panel/useCharacterPanelViewModel";

export const CharacterPanel = () => {
  const [activeTab, setActiveTab] = useState<CharacterTabId>("profile");
  const vm = useCharacterPanelViewModel();

  return (
    <section className="panel-section pb-24">
      <div
        className="relative overflow-hidden rounded-[1.75rem] border border-white/8 text-stone-100 shadow-[0_25px_80px_rgba(0,0,0,0.36)]"
        style={{
          clipPath: CLIP_PANEL,
          background: `
            radial-gradient(circle at 20% 18%, rgba(166, 28, 47, 0.18), transparent 34%),
            radial-gradient(circle at 82% 0%, rgba(181, 133, 43, 0.12), transparent 28%),
            linear-gradient(150deg, ${C.coal} 0%, ${C.ink} 55%, #111217 100%)
          `,
        }}
      >
        <div
          aria-hidden="true"
          className="absolute inset-0 opacity-[0.045]"
          style={{
            backgroundImage:
              "url(\"data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.88' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)' opacity='0.45'/%3E%3C/svg%3E\")",
          }}
        />
        <div
          aria-hidden="true"
          className="absolute inset-x-0 top-0 h-px"
          style={{
            background:
              "linear-gradient(90deg, transparent, rgba(242, 233, 216, 0.4), transparent)",
          }}
        />

        <div className="relative z-10 flex flex-col gap-6 p-4 sm:p-6 lg:p-8">
          <header className="flex flex-col gap-4 border-b border-white/8 pb-4 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <p
                className="text-[10px] uppercase tracking-[0.38em]"
                style={{ color: C.slate, fontFamily: "var(--font-mono)" }}
              >
                Freiburg Character Dossier
              </p>
              <h2
                className="mt-2 text-3xl font-black uppercase leading-tight tracking-tight sm:text-4xl"
                style={{ color: C.bone, fontFamily: "var(--font-display)" }}
              >
                {vm.t.panelTitle}
              </h2>
              <p className="mt-2 max-w-3xl text-sm leading-relaxed text-stone-400">
                {vm.t.panelSubtitle}
              </p>
            </div>

            <div className="flex flex-wrap gap-2">
              <span
                className="inline-flex rounded-full border px-3 py-1 text-[10px] uppercase tracking-[0.32em]"
                style={{
                  color: vm.activeOrigin?.dossier.accentColor ?? C.amber,
                  borderColor: `${vm.activeOrigin?.dossier.accentColor ?? C.amber}55`,
                  backgroundColor: "rgba(0, 0, 0, 0.18)",
                  fontFamily: "var(--font-mono)",
                }}
              >
                {vm.activeOrigin?.label ?? "No origin"}
              </span>
              <span
                className="inline-flex rounded-full border px-3 py-1 text-[10px] uppercase tracking-[0.32em]"
                style={{
                  color: C.bone,
                  borderColor: "rgba(242, 233, 216, 0.16)",
                  backgroundColor: "rgba(255, 255, 255, 0.04)",
                  fontFamily: "var(--font-mono)",
                }}
              >
                {vm.agencyCareerSummary.rankLabel}
              </span>
              <span
                className="inline-flex rounded-full border px-3 py-1 text-[10px] uppercase tracking-[0.32em]"
                style={{
                  color: C.amber,
                  borderColor: "rgba(212, 167, 79, 0.24)",
                  backgroundColor: "rgba(181, 133, 43, 0.08)",
                  fontFamily: "var(--font-mono)",
                }}
              >
                {vm.agencyCareerSummary.standingLabel}
              </span>
            </div>
          </header>

          <div className="grid gap-4 xl:grid-cols-[220px_minmax(0,1fr)]">
            <nav
              aria-label="Character dossier sections"
              className="flex gap-2 overflow-x-auto pb-1 xl:flex-col xl:overflow-visible"
              role="tablist"
            >
              {vm.dossierTabs.map((tab) => (
                <DossierTabButton
                  key={tab.id}
                  active={activeTab === tab.id}
                  icon={tab.icon}
                  id={tab.id}
                  label={tab.label}
                  onClick={setActiveTab}
                  t={vm.t}
                />
              ))}
            </nav>

            <div
              className="min-w-0 rounded-[1.4rem] border border-white/8 bg-[rgba(10,9,7,0.46)] p-4 sm:p-6"
              style={{ clipPath: CLIP_PANEL }}
            >
              <AnimatePresence mode="wait">
                {activeTab === "profile" ? (
                  <div
                    aria-labelledby="character-tab-profile"
                    id="character-tabpanel-profile"
                    role="tabpanel"
                  >
                    <CharacterProfileTab
                      activeOrigin={vm.activeOrigin}
                      alignment={vm.profile.alignment}
                      agencyCareer={vm.agencyCareerSummary}
                      contacts={vm.contactEntries}
                      debugEnabled={vm.debugEnabled}
                      flags={vm.myFlags}
                      playerNickname={vm.playerNickname}
                      panelSubtitle={vm.t.panelSubtitle}
                      selectedTrack={vm.selectedTrack}
                      vars={vm.myVars}
                      t={vm.t}
                    />
                  </div>
                ) : null}

                {activeTab === "development" ? (
                  <div
                    aria-labelledby="character-tab-development"
                    id="character-tabpanel-development"
                    role="tabpanel"
                  >
                    <CharacterDevelopmentTab
                      attributes={vm.attributeCards}
                      primaryVoiceBridgeEntries={vm.primaryVoiceBridgeEntries}
                      radarData={vm.radarData}
                      secondaryVoiceBridgeEntries={
                        vm.secondaryVoiceBridgeEntries
                      }
                      t={vm.t}
                    />
                  </div>
                ) : null}

                {activeTab === "psyche" ? (
                  <div
                    aria-labelledby="character-tab-psyche"
                    id="character-tabpanel-psyche"
                    role="tabpanel"
                  >
                    <CharacterPsycheTab profile={vm.profile} t={vm.t} />
                  </div>
                ) : null}

                {activeTab === "journal" ? (
                  <div
                    aria-labelledby="character-tab-journal"
                    id="character-tabpanel-journal"
                    role="tabpanel"
                  >
                    <CharacterJournalTab
                      entityKnowledge={vm.entityKnowledge}
                      getObjectivePointLabel={vm.getObjectivePointLabel}
                      observationEntries={vm.observationEntries}
                      questJournalEntries={vm.questJournalEntries}
                      t={vm.t}
                    />
                  </div>
                ) : null}
              </AnimatePresence>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
