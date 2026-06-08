import type { NodeBlueprint } from "../../vn-blueprint-types";
import {
CASE01_BG_BANK_EXTERIOR,
CASE01_BG_BANK_HALL,
CASE01_BG_BANK_OFFICE,
CASE01_BG_BANK_VAULT,
CASE01_BG_RATHAUS,
CASE01_BG_zum_goldenen_adler_BLOTTER,
CASE01_DINING_FLAGS,
CASE01_SCENARIO_IDS
} from "./shared";

export const investigationNodes: NodeBlueprint[] = [
{
    id: "scene_case01_mayor_entry",
    scenarioId: CASE01_SCENARIO_IDS.mayorBriefing,
    sourcePath: "40_GameViewer/Case01/Plot/02_Briefing/scene_mayor_briefing.md",
    titleOverride: "Mayor's Office",
    bodyOverride:
      "The mayor does not offer you a chair until he has decided what sort of investigator you are. He wants the panic contained, the council reassured, and the bank matter finished before the newspapers decide it was an inside job with friends in City Hall.\n\n'I asked the police to attach a scientific observer,' he says. 'They refused my daughter on grounds of decorum.'\n\nThe door opens before the Polizeidirektor can enjoy the word. Victoria Sterling enters with a sealed sample tube, a strip of black-yellow postal twine, and the look of a woman who has already heard every objection twice.\n\n'The route was bent before the gas reached the bank,' she says. 'If you want a robbery, gentlemen, you will have to explain why it travelled like a delivery.'",
    choices: [
      {
        id: "CASE01_MAYOR_INDEPENDENT_FOOTING",
        text: "Let the Rathaus note that you arrived without Hartmann sponsorship.",
        nextNodeId: "scene_case01_mayor_independent_footing",
        visibleIfAll: [
          {
            type: "flag_equals",
            key: CASE01_DINING_FLAGS.declinedEleonoraHospitality,
            value: true,
          },
        ],
      },
      {
        id: "CASE01_MAYOR_PRESS",
        text: "Ask why the Polizeidirektor refused Victoria's findings.",
        nextNodeId: "scene_case01_rathaus_briefing_full",
        effects: [
          { type: "set_flag", key: "police_refused_victoria", value: true },
          { type: "set_flag", key: "victoria_introduced", value: true },
          { type: "grant_evidence", evidenceId: "ev_bureau_control_code" },
          {
            type: "discover_fact",
            caseId: "case_bankhaus_krebs_false_trail",
            factId: "fact_mayor_control_code",
          },
          { type: "grant_xp", amount: 5 },
        ],
      },
      {
        id: "CASE01_MAYOR_VICTORIA_ROUTE",
        text: "Let Victoria finish the postal-chain argument before anyone interrupts.",
        nextNodeId: "scene_case01_rathaus_briefing_full",
        effects: [
          { type: "set_flag", key: "police_refused_victoria", value: true },
          { type: "set_flag", key: "victoria_introduced", value: true },
          { type: "set_var", key: "official_writ_strength", value: 1 },
        ],
      },
    ],
  },
  {
    id: "scene_case01_mayor_independent_footing",
    scenarioId: CASE01_SCENARIO_IDS.mayorBriefing,
    sourcePath: "40_GameViewer/Case01/Plot/02_Briefing/scene_mayor_briefing.md",
    titleOverride: "Independent Footing",
    bodyOverride:
      "The mayor's secretary notices the absence before the mayor admits it. No Hartmann carriage waits outside, no borrowed calling card lies on the tray, no soft introduction has crossed the desk ahead of you.\n\n'Good,' the mayor says at last. 'Then for the next few minutes this can remain a municipal conversation.'\n\nIt is not warmth. It is a cleaner ledger.",
    choices: [
      {
        id: "CASE01_MAYOR_INDEPENDENT_TO_DOSSIER",
        text: "Take the cleaner footing and ask what the Rathaus is most afraid of.",
        nextNodeId: "scene_case01_rathaus_briefing_full",
      },
    ],
  },
  {
    id: "scene_case01_rathaus_briefing_full",
    scenarioId: CASE01_SCENARIO_IDS.mayorBriefing,
    sourcePath: "40_GameViewer/Case01/_runtime/case01_mayor_briefing/scene_case01_rathaus_briefing_full.md",
    titleOverride: "The Rathaus Summit",
    bodyOverride:
      "The Oberbuergermeister taps his signet ring against the oak. Victoria stands by the window, a silent analyst in a field uniform. Felix waits with the dossier.\n\n'The Bankhaus Krebs is a pillar of Freiburg,' the Mayor says. 'If a wagon vanishes there, it is a scandal we cannot afford.'",
    backgroundUrl: CASE01_BG_RATHAUS,
    choices: [
      {
        id: "RATHAUS_ACCEPT_PARTNERSHIP",
        text: "I accept. Victoria's expertise is the edge this case needs.",
        nextNodeId: "scene_case01_mayor_exit",
        effects: [
          { type: "set_flag", key: "victoria_introduced", value: true },
          { type: "set_flag", key: "victoria_respected", value: true },
          { type: "set_var", key: "official_writ_strength", value: 2 },
          { type: "change_relationship", characterId: "victoria_sterling", delta: 1 },
        ],
      },
      {
        id: "RATHAUS_PROFESSIONAL_ONLY",
        text: "I will take the writ and the consultant. Let's keep this strictly professional.",
        nextNodeId: "scene_case01_mayor_exit",
        effects: [
          { type: "set_flag", key: "victoria_introduced", value: true },
          { type: "set_var", key: "official_writ_strength", value: 1 },
        ],
      },
      {
        id: "RATHAUS_SKEPTICAL",
        text: "Is this a request for an investigator or a babysitter, Herr Oberbuergermeister?",
        nextNodeId: "scene_case01_mayor_exit",
        effects: [
          { type: "set_flag", key: "victoria_introduced", value: true },
          { type: "change_relationship", characterId: "victoria_sterling", delta: -1 },
          { type: "add_tension", amount: 1 },
        ],
      },
    ],
  },
  {
    id: "scene_case01_mayor_dossier",
    scenarioId: CASE01_SCENARIO_IDS.mayorBriefing,
    sourcePath: "40_GameViewer/Case01/Plot/02_Briefing/scene_mayor_briefing.md",
    titleOverride: "Political Pressure",
    bodyOverride:
      "The Polizeidirektor calls Victoria 'Frau Sterling' as if widowhood is a more acceptable credential than chemistry. Her jaw tightens only once. The mayor does not look at her when he answers; that is how you learn the request is personal before it is political.\n\nHe gives you three things and pretends they are one: a permit to press deeper into the records later, a warning that Galdermann has friends who pay for silence, and an unofficial attachment of Victoria as private scientific consultant under your responsibility.",
    characterId: "victoria_sterling",
    choices: [
      {
        id: "CASE01_MAYOR_FELIX_ASIDE",
        text: "Let Felix read the official cover before you accept it.",
        nextNodeId: "scene_case01_mayor_felix_aside",
        visibleIfAll: [
          {
            type: "flag_equals",
            key: CASE01_DINING_FLAGS.defendedFelix,
            value: true,
          },
        ],
      },
      {
        id: "CASE01_MAYOR_RESPECT_VICTORIA",
        text: "Recognize Victoria's chain of custody as the strongest evidence in the room.",
        nextNodeId: "scene_case01_mayor_exit",
        effects: [
          { type: "set_flag", key: "met_mayor_first", value: true },
          { type: "set_flag", key: "police_refused_victoria", value: true },
          { type: "set_flag", key: "victoria_introduced", value: true },
          { type: "set_flag", key: "victoria_respected", value: true },
          { type: "set_var", key: "official_writ_strength", value: 2 },
          { type: "change_relationship", characterId: "victoria_sterling", delta: 1 },
        ],
      },
      {
        id: "CASE01_MAYOR_PATRONIZE_VICTORIA",
        text: "Accept the Oberbuergermeister's daughter as a liability you will manage.",
        nextNodeId: "scene_case01_mayor_exit",
        effects: [
          { type: "set_flag", key: "met_mayor_first", value: true },
          { type: "set_flag", key: "police_refused_victoria", value: true },
          { type: "set_flag", key: "victoria_introduced", value: true },
          { type: "set_var", key: "official_writ_strength", value: 1 },
          { type: "change_relationship", characterId: "victoria_sterling", delta: -1 },
        ],
      },
      {
        id: "CASE01_MAYOR_PRESS_WITH_VICTORIA",
        text: "Use Victoria's postal route to force the Rathaus into a stronger writ.",
        nextNodeId: "scene_case01_mayor_exit",
        effects: [
          { type: "set_flag", key: "met_mayor_first", value: true },
          { type: "set_flag", key: "police_refused_victoria", value: true },
          { type: "set_flag", key: "victoria_introduced", value: true },
          { type: "set_var", key: "official_writ_strength", value: 2 },
          { type: "add_tension", amount: 1 },
        ],
      },
      {
        id: "CASE01_MAYOR_TO_BANK",
        text: "Accept Victoria as a neutral expert and move to the bank.",
        nextNodeId: "scene_case01_mayor_exit",
        effects: [
          { type: "set_flag", key: "met_mayor_first", value: true },
          { type: "set_flag", key: "police_refused_victoria", value: true },
          { type: "set_flag", key: "victoria_introduced", value: true },
          { type: "set_var", key: "official_writ_strength", value: 1 },
        ],
      },
    ],
  },
  {
    id: "scene_case01_mayor_felix_aside",
    scenarioId: CASE01_SCENARIO_IDS.mayorBriefing,
    sourcePath: "40_GameViewer/Case01/Plot/02_Briefing/scene_mayor_briefing.md",
    titleOverride: "Felix Reads the Cover",
    bodyOverride:
      "Felix takes the permit as if it might bruise. He reads the mayor's phrasing twice, once for law and once for cowardice, then glances at Victoria's sample tube.\n\n'This gives you doors,' he says quietly. 'Not protection. If the Rathaus needs distance later, every sentence here already knows how to step away from you.'\n\nHe hands it back before anyone can ask whether he was helping you, warning himself, or telling Victoria that the city will use her work before it respects it.",
    characterId: "npc_felix_hartmann",
    choices: [
      {
        id: "CASE01_MAYOR_FELIX_TO_BANK",
        text: "Take Felix's reading and move to the bank with official cover.",
        nextNodeId: "scene_case01_mayor_exit",
        effects: [
          { type: "set_flag", key: "met_mayor_first", value: true },
          { type: "set_flag", key: "police_refused_victoria", value: true },
          { type: "set_flag", key: "victoria_introduced", value: true },
          { type: "set_flag", key: "victoria_respected", value: true },
          { type: "set_var", key: "official_writ_strength", value: 2 },
          { type: "change_relationship", characterId: "victoria_sterling", delta: 1 },
        ],
      },
    ],
  },
  {
    id: "scene_case01_mayor_exit",
    scenarioId: CASE01_SCENARIO_IDS.mayorBriefing,
    sourcePath: "40_GameViewer/Case01/Plot/02_Briefing/scene_mayor_briefing.md",
    titleOverride: "Official Writ",
    bodyOverride:
      "By the time you leave, you have enough paper to open doors, enough political pressure to know those same doors may close behind you, and enough ambiguity for the Rathaus to deny it ever appointed Victoria Sterling at all.\n\nThat is the bargain: she enters the bank as your private scientific consultant, not as an officer.",
    terminal: true,
    onEnter: [
      { type: "set_flag", key: "mayor_briefing_complete", value: true },
      { type: "unlock_group", groupId: "loc_freiburg_bank" },
      {
        type: "track_event",
        eventName: "case01_mayor_briefing_complete",
      },
    ],
    choices: [],
  },
  {
    id: "scene_case01_bank_arrival",
    scenarioId: CASE01_SCENARIO_IDS.bankInvestigation,
    sourcePath: "40_GameViewer/Case01/Plot/03_Bank/scene_bank_arrival.md",
    titleOverride: "Bankhaus J.A. Krebs",
    bodyOverride:
      "Cold air clings to the marble steps of Bankhaus J.A. Krebs. Victoria Sterling is already beside the crooked postal car, not touching the handle, counting the knots in the black-yellow postal twine as if each one has sworn a separate oath.\n\nInside, clerks lower their eyes on schedule. Someone has already decided which version of the robbery the room should survive. With Victoria beside you, the room has to recalculate who is allowed to notice the chemistry.",
    backgroundUrl: CASE01_BG_BANK_EXTERIOR,
    characterId: "victoria_sterling",
    choices: [
      {
        id: "CASE01_BANK_WITH_VICTORIA",
        text: "Bring Victoria inside and watch who recalculates around the gas story.",
        nextNodeId: "scene_case01_bank_manager",
        effects: [
          { type: "set_flag", key: "victoria_introduced", value: true },
          { type: "set_flag", key: "victoria_seen_in_bank", value: true },
          { type: "change_relationship", characterId: "victoria_sterling", delta: 1 },
        ],
      },
      {
        id: "CASE01_BANK_SOLO",
        text: "Enter first and make Victoria hold the postal car outside.",
        nextNodeId: "scene_case01_bank_manager",
      },
    ],
  },
  {
    id: "scene_case01_bank_manager",
    scenarioId: CASE01_SCENARIO_IDS.bankInvestigation,
    sourcePath: "40_GameViewer/Case01/Plot/03_Bank/scene_manager_dialogue.md",
    characterId: "npc_heinrich_galdermann",
    titleOverride: "Prokurist Galdermann",
    bodyOverride:
      "Heinrich Galdermann receives you with a smile polished for committees and a handkerchief already damp at the fold. He calls the open vault an internal matter, nudges suspicion toward frightened clerks, and slides the official robbery report over the grossbuch before asking whether Fritz Muller's sealed statements reached you intact. The question arrives too early.",
    backgroundUrl: CASE01_BG_BANK_OFFICE,
    choices: [
      {
        id: "CASE01_BANK_MANAGER_PRESS",
        text: "Press Galdermann on Hartmann and Fritz Muller's sealed statements.",
        nextNodeId: "scene_case01_bank_clerk",
        effects: [{ type: "set_flag", key: "met_galdermann", value: true }],
      },
      {
        id: "CASE01_BANK_MANAGER_BYPASS",
        text: "Let Galdermann talk until his procedure starts contradicting itself.",
        nextNodeId: "scene_case01_bank_clerk",
        effects: [{ type: "set_flag", key: "met_galdermann", value: true }],
      },
    ],
  },
  {
    id: "scene_case01_bank_clerk",
    scenarioId: CASE01_SCENARIO_IDS.bankInvestigation,
    sourcePath: "40_GameViewer/Case01/Plot/03_Bank/scene_clerk_dialogue.md",
    titleOverride: "Ernst Vogel",
    bodyOverride:
      "Ernst Vogel has the pale obedience of a man who was told which truth would keep his job. He swears the vault was locked, then admits Hartmann's access was never questioned. Only when you stop rescuing him from silence does Gustav's black silhouette surface.",
    backgroundUrl: CASE01_BG_BANK_HALL,
    choices: [
      {
        id: "CASE01_BANK_CLERK_READ",
        text: "Read Vogel's fear before you read his statement.",
        nextNodeId: "scene_case01_bank_vault",
        skillCheck: {
          id: "check_case01_clerk_empathy",
          voiceId: "attr_empathy",
          difficulty: 10,
          showChancePercent: true,
          onSuccess: {
            nextNodeId: "scene_case01_bank_vault",
            effects: [{ type: "grant_xp", amount: 10 }],
          },
          onFail: {
            nextNodeId: "scene_case01_bank_vault",
          },
        },
        effects: [{ type: "set_flag", key: "clerk_interviewed", value: true }],
      },
      {
        id: "CASE01_BANK_CLERK_MOVE",
        text: "Take the silhouette and move to the vault.",
        nextNodeId: "scene_case01_bank_vault",
        effects: [{ type: "set_flag", key: "clerk_interviewed", value: true }],
      },
    ],
  },
  {
    id: "scene_case01_bank_vault",
    scenarioId: CASE01_SCENARIO_IDS.bankInvestigation,
    sourcePath: "40_GameViewer/Case01/Plot/03_Bank/scene_vault_inspection.md",
    titleOverride: "Vault Inspection",
    bodyOverride:
      "The vault door hangs open without force. Velvet dust clings where no customer should stand, and a sweet chemical grit sits in the lock throat. Metal has no loyalty; it simply refuses Galdermann's tidy story.\n\nVictoria Sterling stops speaking when a pale residue clings to her sample knife. She has seen that notation once before in the sealed remains of her husband's case. The match is not an answer. It is only the old wound learning a new address.",
    backgroundUrl: CASE01_BG_BANK_VAULT,
    choices: [
      {
        id: "CASE01_BANK_VAULT_LOCK",
        text: "Work the lock and catalogue the insider trace.",
        nextNodeId: "scene_case01_bank_conclusion",
        skillCheck: {
          id: "check_case01_vault_logic",
          voiceId: "attr_logic",
          difficulty: 10,
          showChancePercent: true,
          onSuccess: {
            nextNodeId: "scene_case01_bank_conclusion",
            effects: [{ type: "set_flag", key: "found_velvet", value: true }],
          },
          onFail: {
            nextNodeId: "scene_case01_bank_conclusion",
          },
        },
        effects: [{ type: "set_flag", key: "vault_inspected", value: true }],
      },
      {
        id: "CASE01_BANK_VAULT_AIR",
        text: "Trust the chemical wrongness in the vault air.",
        nextNodeId: "scene_case01_bank_conclusion",
        skillCheck: {
          id: "check_case01_vault_intuition",
          voiceId: "attr_intuition",
          difficulty: 12,
          showChancePercent: true,
          onSuccess: {
            nextNodeId: "scene_case01_bank_conclusion",
            effects: [{ type: "set_flag", key: "found_residue", value: true }],
          },
          onFail: {
            nextNodeId: "scene_case01_bank_conclusion",
          },
        },
        effects: [{ type: "set_flag", key: "vault_inspected", value: true }],
      },
    ],
  },
  {
    id: "scene_case01_bank_conclusion",
    scenarioId: CASE01_SCENARIO_IDS.bankInvestigation,
    sourcePath: "40_GameViewer/Case01/Plot/03_Bank/scene_bank_conclusion.md",
    titleOverride: "Three Open Leads",
    bodyOverride:
      "On the table, three things refuse to become one story: torn velvet, sweet chemical grit, and Gustav's name moving through the night. Victoria looks first to the cloth because grief wants a face. Then she reins herself back to procedure: disguise, supply route, tavern traffic.",
    terminal: true,
    onEnter: [
      {
        type: "set_flag",
        key: "bank_investigation_complete",
        value: true,
      },
      { type: "unlock_group", groupId: "loc_tailor" },
      { type: "unlock_group", groupId: "loc_apothecary" },
      { type: "unlock_group", groupId: "loc_pub" },
      { type: "unlock_group", groupId: "loc_rathaus" },
      { type: "unlock_group", groupId: "loc_freiburg_estate" },
      { type: "unlock_group", groupId: "loc_telephone" },
      { type: "grant_xp", amount: 20 },
    ],
    choices: [],
  },
  {
    id: "scene_case01_tailor_entry",
    scenarioId: CASE01_SCENARIO_IDS.leadTailor,
    sourcePath: "40_GameViewer/Case01/Plot/04_Leads/scene_lead_tailor.md",
    titleOverride: "Tailor Workshop",
    bodyOverride:
      "Herr Klein recognizes the cut of the torn velvet immediately, but not before trying to pretend it is ordinary stage cloth. Hartmann paid for a disguise runner, Box 217 stored it, and somebody with bank access wanted to walk through the city wearing someone else's class.",
    choices: [
      {
        id: "CASE01_TAILOR_COMPLETE",
        text: "Take the costume ledger copy and fold the identity trail into the case.",
        nextNodeId: "scene_case01_tailor_exit",
      },
    ],
  },
  {
    id: "scene_case01_tailor_exit",
    scenarioId: CASE01_SCENARIO_IDS.leadTailor,
    sourcePath: "40_GameViewer/Case01/Plot/04_Leads/scene_lead_tailor.md",
    titleOverride: "Identity Bundle Locked",
    bodyOverride:
      "The tailor does not want his name in the file. You do not need it there yet. What matters is the route: disguise, cash runner, Hartmann.",
    terminal: true,
    onEnter: [
      { type: "set_flag", key: "tailor_lead_complete", value: true },
      { type: "grant_xp", amount: 10 },
    ],
    choices: [],
  },
  {
    id: "scene_case01_apothecary_entry",
    scenarioId: CASE01_SCENARIO_IDS.leadApothecary,
    sourcePath: "40_GameViewer/Case01/Plot/04_Leads/scene_lead_apothecary.md",
    titleOverride: "Lowen Apotheke",
    bodyOverride:
      "The apothecary does not deny the compound once you name its smell. The residue is real, the purchase route runs through university stock, and the order was signed under cover of a sender name no honest clerk would trust twice.",
    choices: [
      {
        id: "CASE01_APOTHECARY_COMPLETE",
        text: "Record the formula trail and move the chemical bundle forward.",
        nextNodeId: "scene_case01_apothecary_exit",
      },
    ],
  },
  {
    id: "scene_case01_apothecary_exit",
    scenarioId: CASE01_SCENARIO_IDS.leadApothecary,
    sourcePath: "40_GameViewer/Case01/Plot/04_Leads/scene_lead_apothecary.md",
    titleOverride: "Chemical Bundle Locked",
    bodyOverride:
      "By the time you leave, the residue is no longer mysterious. It is logistical, expensive, and routed through people who expected the chemistry to look more important than the theft.",
    terminal: true,
    onEnter: [
      { type: "set_flag", key: "apothecary_lead_complete", value: true },
      { type: "grant_xp", amount: 10 },
    ],
    choices: [],
  },
  {
    id: "scene_case01_pub_entry",
    scenarioId: CASE01_SCENARIO_IDS.leadPub,
    sourcePath: "40_GameViewer/Case01/Plot/04_Leads/scene_lead_pub.md",
    titleOverride: "Zum Schlappen",
    bodyOverride:
      "The tavern keeper watches the room before answering. Once Gustav Brandt realizes you can offer protection instead of theater, he confirms Hartmann's name, a warehouse window, and a disguised runner moving under worker cover after curfew.",
    choices: [
      {
        id: "CASE01_PUB_COMPLETE",
        text: "Take Gustav's timing window and close the logistics bundle.",
        nextNodeId: "scene_case01_pub_exit",
      },
    ],
  },
  {
    id: "scene_case01_pub_exit",
    scenarioId: CASE01_SCENARIO_IDS.leadPub,
    sourcePath: "40_GameViewer/Case01/Plot/04_Leads/scene_lead_pub.md",
    titleOverride: "Logistics Bundle Locked",
    bodyOverride:
      "You leave the pub with the first route to the warehouse that sounds like a schedule instead of a rumor. Somebody is moving people, ledgers, and disguises on the same night rhythm.",
    terminal: true,
    onEnter: [
      { type: "set_flag", key: "pub_lead_complete", value: true },
      { type: "grant_xp", amount: 10 },
    ],
    choices: [],
  },
  {
    id: "scene_case01_estate_entry",
    scenarioId: CASE01_SCENARIO_IDS.estateBranch,
    sourcePath: "40_GameViewer/Sandbox_KA/Plot/03_Ghost/scene_estate_intro.md",
    titleOverride: "Estate Ledger",
    bodyOverride:
      "The estate is not haunted. It is staged. Someone used a private villa outside the main routes to store telegraph copies, costume receipts, and a payment log written in the careful half-code of people who expect the clerk to die before the archive survives.",
    choices: [
      {
        id: "CASE01_ESTATE_TRACE",
        text: "Take rubbings of the bureau ledger and keep the route off the official sheet.",
        nextNodeId: "scene_case01_estate_exit",
        effects: [{ type: "set_flag", key: "bureau_trace_found", value: true }],
      },
    ],
  },
  {
    id: "scene_case01_estate_exit",
    scenarioId: CASE01_SCENARIO_IDS.estateBranch,
    sourcePath:
      "40_GameViewer/Sandbox_KA/Plot/03_Ghost/scene_estate_intro_beat1.md",
    titleOverride: "Bureau Thread Confirmed",
    bodyOverride:
      "The ledger does not name the organization outright, but it names enough participants to prove the bank theft was cover for a bureau-grade transfer network. The case is suddenly larger than the man who will wear it in public.",
    terminal: true,
    onEnter: [
      { type: "set_flag", key: "estate_branch_complete", value: true },
      { type: "grant_xp", amount: 15 },
    ],
    choices: [],
  },
  {
    id: "scene_case01_lotte_warning",
    scenarioId: CASE01_SCENARIO_IDS.lotteInterlude,
    sourcePath: "40_GameViewer/Case01/Plot/04_Leads/scene_lotte_interlude.md",
    titleOverride: "Lotte on the Wire",
    bodyOverride:
      "The telephone line hisses before Lotte Weber speaks. She has seen switchboard traffic redirect itself around your questions, which means somebody knows the investigation is narrowing. Her warning is plain: if you keep pulling the thread in daylight, the city will pull back in uniform.",
    characterId: "npc_weber_dispatcher",
    choices: [
      {
        id: "LOTTE_LEDGER_ECHO",
        text: "Lotte's Note.",
        nextNodeId: "scene_case01_lotte_warning",
        visibleIfAll: [
          {
            type: "flag_equals",
            key: CASE01_DINING_FLAGS.noticedLotteSchedule,
            value: true,
          }
        ],
        inlineText: "**[Лотте]**:\n— Я видела, как вы смотрели на моё расписание в поезде, детектив. Надеюсь, вы нашли там то, что искали. Или хотя бы то, что поможет вам не опаздывать."
      },
      {
        id: "CASE01_LOTTE_CONFRONT_SCHEDULE",
        text: "Ask why her train notes kept time instead of names.",
        nextNodeId: "scene_case01_lotte_schedule_opening",
        visibleIfAll: [
          {
            type: "flag_equals",
            key: CASE01_DINING_FLAGS.noticedLotteSchedule,
            value: true,
          },
        ],
      },
      {
        id: "CASE01_LOTTE_LISTENER_OPENING",
        text: "Let the silence do some of the work before you answer.",
        nextNodeId: "scene_case01_lotte_listener_opening",
        visibleIfAll: [
          {
            type: "flag_equals",
            key: CASE01_DINING_FLAGS.silentObservation,
            value: true,
          },
          {
            type: "logic_not",
            condition: {
              type: "flag_equals",
              key: CASE01_DINING_FLAGS.noticedLotteSchedule,
              value: true,
            },
          },
        ],
      },
      {
        id: "CASE01_LOTTE_TRUST",
        text: "Thank her and ask for one more quiet relay.",
        nextNodeId: "scene_case01_lotte_trust",
      },
      {
        id: "CASE01_LOTTE_DISTANCE",
        text: "Keep it professional and tell her to stay off the record.",
        nextNodeId: "scene_case01_lotte_distance",
      },
    ],
  },
  {
    id: "scene_case01_lotte_listener_opening",
    scenarioId: CASE01_SCENARIO_IDS.lotteInterlude,
    sourcePath: "40_GameViewer/Case01/Plot/04_Leads/scene_lotte_interlude.md",
    titleOverride: "Listener on the Wire",
    bodyOverride:
      "You do not fill the hiss with a question. For three seconds the line carries only the room around her: switchboard clicks, paper shifting, one careful breath.\n\n'Still listening,' Lotte says. 'Good. Most men only pause long enough to reload their own certainty.'\n\nThe warning has not changed, but its first edge is yours now.",
    characterId: "npc_weber_dispatcher",
    choices: [
      {
        id: "CASE01_LOTTE_LISTENER_TRUST",
        text: "Keep the line open and ask for one more quiet relay.",
        nextNodeId: "scene_case01_lotte_trust",
      },
      {
        id: "CASE01_LOTTE_LISTENER_DISTANCE",
        text: "Keep the silence professional and tell her to stay off the record.",
        nextNodeId: "scene_case01_lotte_distance",
      },
    ],
  },
  {
    id: "scene_case01_lotte_schedule_opening",
    scenarioId: CASE01_SCENARIO_IDS.lotteInterlude,
    sourcePath: "40_GameViewer/Case01/Plot/04_Leads/scene_lotte_interlude.md",
    titleOverride: "Time on the Wire",
    bodyOverride:
      "**[Detective]**:\n-- In the train, you were not taking notes. You were keeping time.\n\n**[Lotte]**:\n-- Time keeps itself. I only mark when people pretend they arrived by chance.\n\nThe line hisses around her answer. She does not deny the schedule; she only waits to see whether you understand what a schedule can accuse.",
    characterId: "npc_weber_dispatcher",
    choices: [
      {
        id: "CASE01_LOTTE_SCHEDULE_TRUST",
        text: "Use the timing and ask for one more quiet relay.",
        nextNodeId: "scene_case01_lotte_trust",
      },
      {
        id: "CASE01_LOTTE_SCHEDULE_DISTANCE",
        text: "Keep the timing off the record and set a boundary.",
        nextNodeId: "scene_case01_lotte_distance",
      },
    ],
  },
  {
    id: "scene_case01_lotte_trust",
    scenarioId: CASE01_SCENARIO_IDS.lotteInterlude,
    sourcePath: "40_GameViewer/Case01/Plot/04_Leads/scene_lotte_interlude.md",
    titleOverride: "Channel Preserved",
    bodyOverride:
      "Lotte does not soften, but she does stay on the line. The warning becomes a working channel instead of a courtesy.",
    terminal: true,
    characterId: "npc_weber_dispatcher",
    onEnter: [
      { type: "set_flag", key: "lotte_interlude_complete", value: true },
      { type: "set_flag", key: "lotte_warning_heeded", value: true },
      {
        type: "change_relationship",
        characterId: "npc_weber_dispatcher",
        delta: 1,
      },
    ],
    choices: [],
  },
  {
    id: "scene_case01_lotte_distance",
    scenarioId: CASE01_SCENARIO_IDS.lotteInterlude,
    sourcePath: "40_GameViewer/Case01/Plot/04_Leads/scene_lotte_interlude.md",
    titleOverride: "Channel Narrowed",
    bodyOverride:
      "She accepts the distance faster than you wanted her to. The warning stands, but the next call will cost more trust than this one did.",
    terminal: true,
    characterId: "npc_weber_dispatcher",
    onEnter: [
      { type: "set_flag", key: "lotte_interlude_complete", value: true },
      { type: "set_flag", key: "lotte_warning_heeded", value: false },
      {
        type: "change_relationship",
        characterId: "npc_weber_dispatcher",
        delta: -1,
      },
    ],
    choices: [],
  },
  {
    id: "scene_case01_zum_goldenen_adler_entry",
    scenarioId: CASE01_SCENARIO_IDS.lodgingZumGoldenenAdler,
    sourcePath: "40_GameViewer/Case01/_runtime/case01_lodging_zum_goldenen_adler/scene_case01_zum_goldenen_adler_entry.md",
    titleOverride: "Zum Eber",
    bodyOverride:
      "The inn keeps its warmth behind polished wood and practiced discretion. Your room is reserved, your name is legible in the register, and the clerk has already decided which parts of your arrival are ordinary enough to say aloud.",
    choices: [
      {
        id: "CASE01_zum_goldenen_adler_LOTTE_ROUTE",
        text: "Ask why the route was ready before you arrived.",
        nextNodeId: "scene_case01_zum_goldenen_adler_lotte_route",
        visibleIfAll: [
          {
            type: "flag_equals",
            key: CASE01_DINING_FLAGS.askedLodgingRoute,
            value: true,
          },
        ],
      },
      {
        id: "CASE01_zum_goldenen_adler_SETTLE",
        text: "Take the room and keep the inn out of the file for now.",
        nextNodeId: "scene_case01_zum_goldenen_adler_settle",
      },
    ],
  },
  {
    id: "scene_case01_zum_goldenen_adler_lotte_route",
    scenarioId: CASE01_SCENARIO_IDS.lodgingZumGoldenenAdler,
    sourcePath: "40_GameViewer/Case01/_runtime/case01_lodging_zum_goldenen_adler/scene_case01_zum_goldenen_adler_lotte_route.md",
    titleOverride: "Route Already Marked",
    backgroundUrl: CASE01_BG_zum_goldenen_adler_BLOTTER,
    bodyOverride:
      "The clerk lowers his eyes to the register. 'Fraulein Weber asked whether the room would be aired before the noon rush. She did not ask twice.'\n\nOn the blotter lies a timetable corner, folded once. 08:41 is underlined; not in ink, but by pressure.\n\nFreiburg has not followed you. Not yet. It has simply prepared a chair where your question said you might sit.",
    choices: [
      {
        id: "CASE01_zum_goldenen_adler_ROUTE_SETTLE",
        text: "Leave the timetable where it is and take the key.",
        nextNodeId: "scene_case01_zum_goldenen_adler_settle",
      },
    ],
  },
  {
    id: "scene_case01_zum_goldenen_adler_settle",
    scenarioId: CASE01_SCENARIO_IDS.lodgingZumGoldenenAdler,
    sourcePath: "40_GameViewer/Case01/_runtime/case01_lodging_zum_goldenen_adler/scene_case01_zum_goldenen_adler_settle.md",
    titleOverride: "Key Taken",
    bodyOverride:
      "The key is plain brass, heavier than it looks. Whatever else Zum Eber knows, it can wait behind a locked door while the city begins to spend its morning.",
    terminal: true,
    choices: [],
  }
];
