import type { NodeBlueprint, ScenarioBlueprint } from "../vn-blueprint-types";
import {
  CASE01_DEFAULT_ENTRY_SCENARIO_ID,
  CASE01_FINAL_OUTCOME_COMPROMISED,
  CASE01_FINAL_OUTCOME_LAWFUL,
  CASE01_ROUTE_VALUE_COVERT,
  CASE01_ROUTE_VALUE_OFFICIAL,
  CASE01_SCENARIO_IDS,
} from "../../src/shared/case01Canon";

const officialRouteConditions = [
  {
    type: "var_gte" as const,
    key: "convergence_route",
    value: CASE01_ROUTE_VALUE_OFFICIAL,
  },
  {
    type: "var_lte" as const,
    key: "convergence_route",
    value: CASE01_ROUTE_VALUE_OFFICIAL,
  },
];

const covertRouteConditions = [
  {
    type: "var_gte" as const,
    key: "convergence_route",
    value: CASE01_ROUTE_VALUE_COVERT,
  },
  {
    type: "var_lte" as const,
    key: "convergence_route",
    value: CASE01_ROUTE_VALUE_COVERT,
  },
];

export const CASE01_CANON_SCENARIOS: ScenarioBlueprint[] = [
  {
    id: CASE01_DEFAULT_ENTRY_SCENARIO_ID,
    title: "Case 01: Freiburg Arrival",
    startNodeId: "scene_case01_train_telegram",
    mode: "fullscreen",
    packId: "case01_mainline",
    defaultBackgroundUrl: "/images/scenes/scene_bank_intro.png",
    nodeIds: [
      "scene_case01_train_telegram",
      "scene_case01_platform_survey",
      "scene_case01_fritz_contact",
      "scene_case01_priority_choice",
      "scene_case01_priority_handoff",
    ],
  },
  {
    id: CASE01_SCENARIO_IDS.mayorBriefing,
    title: "Case 01: Mayor Briefing",
    startNodeId: "scene_case01_mayor_entry",
    mode: "overlay",
    packId: "case01_mainline",
    nodeIds: [
      "scene_case01_mayor_entry",
      "scene_case01_mayor_dossier",
      "scene_case01_mayor_exit",
    ],
  },
  {
    id: CASE01_SCENARIO_IDS.bankInvestigation,
    title: "Case 01: Bank Investigation",
    startNodeId: "scene_case01_bank_arrival",
    mode: "fullscreen",
    packId: "case01_mainline",
    defaultBackgroundUrl: "/images/scenes/scene_bank_intro.png",
    nodeIds: [
      "scene_case01_bank_arrival",
      "scene_case01_bank_manager",
      "scene_case01_bank_clerk",
      "scene_case01_bank_vault",
      "scene_case01_bank_conclusion",
    ],
  },
  {
    id: CASE01_SCENARIO_IDS.leadTailor,
    title: "Case 01: Tailor Lead",
    startNodeId: "scene_case01_tailor_entry",
    mode: "overlay",
    packId: "case01_mainline",
    nodeIds: ["scene_case01_tailor_entry", "scene_case01_tailor_exit"],
  },
  {
    id: CASE01_SCENARIO_IDS.leadApothecary,
    title: "Case 01: Apothecary Lead",
    startNodeId: "scene_case01_apothecary_entry",
    mode: "overlay",
    packId: "case01_mainline",
    nodeIds: ["scene_case01_apothecary_entry", "scene_case01_apothecary_exit"],
  },
  {
    id: CASE01_SCENARIO_IDS.leadPub,
    title: "Case 01: Pub Lead",
    startNodeId: "scene_case01_pub_entry",
    mode: "overlay",
    packId: "case01_mainline",
    nodeIds: ["scene_case01_pub_entry", "scene_case01_pub_exit"],
  },
  {
    id: CASE01_SCENARIO_IDS.estateBranch,
    title: "Case 01: Estate Trace",
    startNodeId: "scene_case01_estate_entry",
    mode: "overlay",
    packId: "case01_mainline",
    nodeIds: ["scene_case01_estate_entry", "scene_case01_estate_exit"],
  },
  {
    id: CASE01_SCENARIO_IDS.lotteInterlude,
    title: "Case 01: Lotte Interlude",
    startNodeId: "scene_case01_lotte_warning",
    mode: "overlay",
    packId: "case01_mainline",
    nodeIds: [
      "scene_case01_lotte_warning",
      "scene_case01_lotte_trust",
      "scene_case01_lotte_distance",
    ],
  },
  {
    id: CASE01_SCENARIO_IDS.convergence,
    title: "Case 01: Convergence",
    startNodeId: "scene_case01_convergence_gate",
    mode: "overlay",
    packId: "case01_mainline",
    nodeIds: [
      "scene_case01_convergence_gate",
      "scene_case01_convergence_official",
      "scene_case01_convergence_covert",
    ],
  },
  {
    id: CASE01_SCENARIO_IDS.archiveRun,
    title: "Case 01: Archive Warrant Run",
    startNodeId: "scene_case01_archive_entry",
    mode: "overlay",
    packId: "case01_mainline",
    nodeIds: [
      "scene_case01_archive_entry",
      "scene_case01_archive_checks",
      "scene_case01_archive_exit",
    ],
  },
  {
    id: CASE01_SCENARIO_IDS.railYardTail,
    title: "Case 01: Rail Yard Shadow Tail",
    startNodeId: "scene_case01_rail_entry",
    mode: "overlay",
    packId: "case01_mainline",
    nodeIds: [
      "scene_case01_rail_entry",
      "scene_case01_rail_tail",
      "scene_case01_rail_exit",
    ],
  },
  {
    id: CASE01_SCENARIO_IDS.warehouseFinale,
    title: "Case 01: Warehouse Finale",
    startNodeId: "scene_case01_warehouse_entry",
    mode: "fullscreen",
    packId: "case01_mainline",
    defaultBackgroundUrl: "/images/scenes/scene_estate_intro.png",
    nodeIds: [
      "scene_case01_warehouse_entry",
      "scene_case01_warehouse_lawful",
      "scene_case01_warehouse_compromised",
    ],
  },
];

export const CASE01_CANON_NODES: NodeBlueprint[] = [
  {
    id: "scene_case01_train_telegram",
    scenarioId: CASE01_DEFAULT_ENTRY_SCENARIO_ID,
    sourcePath:
      "40_GameViewer/Case01/Plot/01_Onboarding/scene_intro_journey.md",
    titleOverride: "Telegram to Freiburg",
    bodyOverride:
      "The telegram crackles once more in your hand before the train slows into Freiburg. Bankhaus J.A. Krebs has been opened without force. Fritz Muller is waiting on the platform, and every line of the message insists the city is already late.",
    onEnter: [
      {
        type: "set_flag",
        key: "freiburg_case01_mainline_active",
        value: true,
      },
    ],
    choices: [
      {
        id: "CASE01_TRAIN_READ",
        text: "Read the telegram again and note the missing details.",
        nextNodeId: "scene_case01_platform_survey",
        effects: [{ type: "grant_xp", amount: 5 }],
      },
      {
        id: "CASE01_TRAIN_LOOK_OUT",
        text: "Watch the station approach and commit the platform to memory.",
        nextNodeId: "scene_case01_platform_survey",
        effects: [
          {
            type: "track_event",
            eventName: "case01_hbf_arrival_started",
            tags: { path: "train" },
          },
        ],
      },
    ],
  },
  {
    id: "scene_case01_platform_survey",
    scenarioId: CASE01_DEFAULT_ENTRY_SCENARIO_ID,
    sourcePath:
      "40_GameViewer/Case01/Plot/01_Onboarding/scene_hbf_arrival.md",
    titleOverride: "Platform Steam",
    bodyOverride:
      "Steam hangs low under the station roof. A paperboy is being chased between trunks, a porter pretends not to see it, and Fritz Muller stands under a gas lamp with the kind of stillness policemen learn when the first report is already worse than the public version.",
    choices: [
      {
        id: "CASE01_PLATFORM_SCAN",
        text: "Look over the platform before speaking to Fritz.",
        nextNodeId: "scene_case01_fritz_contact",
        effects: [
          {
            type: "set_flag",
            key: "fritz_platform_scan_complete",
            value: true,
          },
          { type: "set_flag", key: "flag_paperboy_theft_seen", value: true },
          { type: "set_flag", key: "flag_bought_newspaper", value: true },
        ],
      },
      {
        id: "CASE01_PLATFORM_DIRECT",
        text: "Go straight to Fritz before the station noise eats the facts.",
        nextNodeId: "scene_case01_fritz_contact",
      },
    ],
  },
  {
    id: "scene_case01_fritz_contact",
    scenarioId: CASE01_DEFAULT_ENTRY_SCENARIO_ID,
    sourcePath:
      "40_GameViewer/Case01/Plot/01_Onboarding/scene_fritz_mission.md",
    titleOverride: "Fritz Muller's Brief",
    bodyOverride:
      "Fritz keeps his voice low. The bank wants speed, the Rathaus wants control, and both claim the other is already contaminating the case. He gives you the same warning twice: if you choose badly now, someone else writes the first version of the truth.",
    choices: [
      {
        id: "CASE01_FRITZ_ACCEPT",
        text: "Take the case from Fritz and force the first real decision.",
        nextNodeId: "scene_case01_priority_choice",
        effects: [
          {
            type: "set_flag",
            key: "fritz_contact_established",
            value: true,
          },
        ],
      },
    ],
  },
  {
    id: "scene_case01_priority_choice",
    scenarioId: CASE01_DEFAULT_ENTRY_SCENARIO_ID,
    sourcePath:
      "40_GameViewer/Case01/Plot/01_Onboarding/choice_set_priority.md",
    titleOverride: "Priority Lock",
    bodyOverride:
      "Fritz waits. Bank first means the crime scene before the politicians sand it smooth. Mayor first means documents, leverage, and a witness network that might already be lying in chorus.",
    choices: [
      {
        id: "CASE01_PRIORITY_BANK",
        text: "Go to the bank first.",
        nextNodeId: "scene_case01_priority_handoff",
        effects: [
          { type: "set_flag", key: "priority_bank_first", value: true },
          { type: "set_flag", key: "priority_mayor_first", value: false },
          { type: "set_flag", key: "case01_priority_locked", value: true },
          { type: "set_flag", key: "case01_onboarding_complete", value: true },
          { type: "set_flag", key: "intro_freiburg_done", value: true },
          { type: "unlock_group", groupId: "loc_freiburg_bank" },
        ],
      },
      {
        id: "CASE01_PRIORITY_MAYOR",
        text: "Go to the mayor first.",
        nextNodeId: "scene_case01_priority_handoff",
        effects: [
          { type: "set_flag", key: "priority_bank_first", value: false },
          { type: "set_flag", key: "priority_mayor_first", value: true },
          { type: "set_flag", key: "case01_priority_locked", value: true },
          { type: "set_flag", key: "case01_onboarding_complete", value: true },
          { type: "set_flag", key: "intro_freiburg_done", value: true },
          { type: "unlock_group", groupId: "loc_rathaus" },
        ],
      },
    ],
  },
  {
    id: "scene_case01_priority_handoff",
    scenarioId: CASE01_DEFAULT_ENTRY_SCENARIO_ID,
    sourcePath:
      "40_GameViewer/Case01/Plot/01_Onboarding/map_transit.md",
    titleOverride: "City Open",
    bodyOverride:
      "Fritz steps aside. Freiburg is open now, but only along the path you just made expensive. The first district is waiting on your answer.",
    terminal: true,
    choices: [],
  },
  {
    id: "scene_case01_mayor_entry",
    scenarioId: CASE01_SCENARIO_IDS.mayorBriefing,
    sourcePath:
      "40_GameViewer/Case01/Plot/02_Briefing/scene_mayor_briefing.md",
    titleOverride: "Mayor's Office",
    bodyOverride:
      "The mayor does not offer you a chair until he has decided what sort of investigator you are. He wants the panic contained, the council reassured, and the bank matter finished before the newspapers decide it was an inside job with friends in City Hall.",
    choices: [
      {
        id: "CASE01_MAYOR_PRESS",
        text: "Ask what the Rathaus is most afraid of.",
        nextNodeId: "scene_case01_mayor_dossier",
        effects: [{ type: "grant_xp", amount: 5 }],
      },
      {
        id: "CASE01_MAYOR_CLARA",
        text: "Ask why Clara von Altenburg is already moving around the bank.",
        nextNodeId: "scene_case01_mayor_dossier",
      },
    ],
  },
  {
    id: "scene_case01_mayor_dossier",
    scenarioId: CASE01_SCENARIO_IDS.mayorBriefing,
    sourcePath:
      "40_GameViewer/Case01/Plot/02_Briefing/scene_mayor_briefing.md",
    titleOverride: "Political Pressure",
    bodyOverride:
      "He gives you three things and pretends they are one: a permit to push into the records later, a warning that Galdermann has friends who pay for silence, and a refusal to say Hartmann's name without first seeing what you can prove.",
    choices: [
      {
        id: "CASE01_MAYOR_TO_BANK",
        text: "Take the briefing and move to the bank with official cover.",
        nextNodeId: "scene_case01_mayor_exit",
        effects: [
          { type: "set_flag", key: "met_mayor_first", value: true },
          { type: "change_relationship", characterId: "assistant", delta: 1 },
        ],
      },
    ],
  },
  {
    id: "scene_case01_mayor_exit",
    scenarioId: CASE01_SCENARIO_IDS.mayorBriefing,
    sourcePath:
      "40_GameViewer/Case01/Plot/02_Briefing/scene_mayor_briefing.md",
    titleOverride: "Official Writ",
    bodyOverride:
      "By the time you leave, you have enough paper to open doors and enough political pressure to know those same doors may close behind you.",
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
      "Cold air clings to the bank's marble steps. Clara von Altenburg intercepts you before the porter can lie about how calm the building is. Inside, the hall is too orderly for a clean robbery and too frightened for an ordinary one.",
    characterId: "assistant",
    choices: [
      {
        id: "CASE01_BANK_WITH_CLARA",
        text: "Bring Clara with you and let the room react to it.",
        nextNodeId: "scene_case01_bank_manager",
        effects: [
          { type: "change_relationship", characterId: "assistant", delta: 1 },
        ],
      },
      {
        id: "CASE01_BANK_SOLO",
        text: "Go in alone and keep Clara watching the floor.",
        nextNodeId: "scene_case01_bank_manager",
      },
    ],
  },
  {
    id: "scene_case01_bank_manager",
    scenarioId: CASE01_SCENARIO_IDS.bankInvestigation,
    sourcePath: "40_GameViewer/Case01/Plot/03_Bank/scene_manager_dialogue.md",
    titleOverride: "Director Galdermann",
    bodyOverride:
      "Heinrich Galdermann smiles like a man used to restructuring other people's panic. He calls the vault opening an unfortunate internal matter, pushes suspicion toward his clerks, and goes briefly rigid when you mention Hartmann by name.",
    choices: [
      {
        id: "CASE01_BANK_MANAGER_PRESS",
        text: "Press him on Hartmann and the sealed statements.",
        nextNodeId: "scene_case01_bank_clerk",
        effects: [{ type: "set_flag", key: "met_galdermann", value: true }],
      },
      {
        id: "CASE01_BANK_MANAGER_BYPASS",
        text: "Let the director talk and move to the clerk before he resets the story.",
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
      "Ernst Vogel looks terrified in the precise way innocence and coercion sometimes overlap. He swears the vault was locked, admits Hartmann had the kind of access no junior clerk should question, and finally blurts out Gustav the canal cleaner saw a black silhouette by the bank before dawn.",
    choices: [
      {
        id: "CASE01_BANK_CLERK_READ",
        text: "Read the fear, not the script.",
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
        text: "Take what he gave you and go straight to the vault.",
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
      "The vault door hangs open without any sign of brute force. Dust, velvet, and chemical grit tell three different stories, which is exactly what convinces you they belong to the same job.",
    choices: [
      {
        id: "CASE01_BANK_VAULT_LOCK",
        text: "Work the lock and catalogue the insider traces.",
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
        text: "Trust the air and the chemical wrongness in the room.",
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
      "Clara lays the structure out cleanly. Velvet points toward a tailor and disguises. Powder points toward a pharmacy and a supply line. Gustav's silhouette points toward a tavern and the night traffic that fed the bank. Freiburg stops being one crime scene and becomes a city of linked lies.",
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
    sourcePath:
      "40_GameViewer/Case01/Plot/04_Leads/scene_lead_apothecary.md",
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
    sourcePath:
      "40_GameViewer/Case01/Plot/04_Leads/scene_lead_apothecary.md",
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
    sourcePath:
      "40_GameViewer/Sandbox_KA/Plot/03_Ghost/scene_estate_intro.md",
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
    sourcePath:
      "40_GameViewer/Case01/Plot/04_Leads/scene_lotte_interlude.md",
    titleOverride: "Lotte on the Wire",
    bodyOverride:
      "The telephone line hisses before Lotte Weber speaks. She has seen switchboard traffic redirect itself around your questions, which means somebody knows the investigation is narrowing. Her warning is plain: if you keep pulling the thread in daylight, the city will pull back in uniform.",
    characterId: "npc_weber_dispatcher",
    choices: [
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
    id: "scene_case01_lotte_trust",
    scenarioId: CASE01_SCENARIO_IDS.lotteInterlude,
    sourcePath:
      "40_GameViewer/Case01/Plot/04_Leads/scene_lotte_interlude.md",
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
    sourcePath:
      "40_GameViewer/Case01/Plot/04_Leads/scene_lotte_interlude.md",
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
    id: "scene_case01_convergence_gate",
    scenarioId: CASE01_SCENARIO_IDS.convergence,
    sourcePath:
      "40_GameViewer/Case01/Plot/05_Convergence/scene_rathaus_hearing.md",
    titleOverride: "Convergence Gate",
    bodyOverride:
      "With at least two bundles locked, the case stops being a hunt for fragments and becomes a choice of pressure. You can force the records open through the Rathaus, or move through the workers and shadow traffic before the official story catches up.",
    choices: [
      {
        id: "CASE01_CONVERGENCE_OFFICIAL",
        text: "Commit to the official route through the Rathaus.",
        nextNodeId: "scene_case01_convergence_official",
      },
      {
        id: "CASE01_CONVERGENCE_COVERT",
        text: "Commit to the covert route through the workers' channel.",
        nextNodeId: "scene_case01_convergence_covert",
      },
    ],
  },
  {
    id: "scene_case01_convergence_official",
    scenarioId: CASE01_SCENARIO_IDS.convergence,
    sourcePath:
      "40_GameViewer/Case01/Plot/05_Convergence/scene_rathaus_hearing.md",
    titleOverride: "Official Route Set",
    bodyOverride:
      "You choose paper, seals, and public leverage. The next move will be legal on its face and expensive in every other sense.",
    terminal: true,
    onEnter: [
      { type: "set_flag", key: "convergence_gate_seen", value: true },
      {
        type: "set_var",
        key: "convergence_route",
        value: CASE01_ROUTE_VALUE_OFFICIAL,
      },
    ],
    choices: [],
  },
  {
    id: "scene_case01_convergence_covert",
    scenarioId: CASE01_SCENARIO_IDS.convergence,
    sourcePath:
      "40_GameViewer/Case01/Plot/05_Convergence/scene_workers_backchannel.md",
    titleOverride: "Covert Route Set",
    bodyOverride:
      "You choose informants, timing, and deniable access. The next move will be faster, dirtier, and much harder to explain afterward.",
    terminal: true,
    onEnter: [
      { type: "set_flag", key: "convergence_gate_seen", value: true },
      {
        type: "set_var",
        key: "convergence_route",
        value: CASE01_ROUTE_VALUE_COVERT,
      },
    ],
    choices: [],
  },
  {
    id: "scene_case01_archive_entry",
    scenarioId: CASE01_SCENARIO_IDS.archiveRun,
    sourcePath:
      "40_GameViewer/Case01/Plot/06_Resolution/scene_archive_warrant_run.md",
    titleOverride: "Archive Warrant Run",
    bodyOverride:
      "The archive keeper does not resist the warrant. He resists the pace. Every registry you ask for creates another way to lose the night, unless you can chain the documents together faster than the bank can move its own answer into the file.",
    characterId: "npc_archivist_otto",
    choices: [
      {
        id: "CASE01_ARCHIVE_SORT",
        text: "Chain the warrants and force the archive to answer as one system.",
        nextNodeId: "scene_case01_archive_checks",
        skillCheck: {
          id: "check_case01_archive_logic",
          voiceId: "attr_logic",
          difficulty: 11,
          showChancePercent: true,
          onSuccess: {
            nextNodeId: "scene_case01_archive_checks",
            effects: [{ type: "grant_xp", amount: 10 }],
          },
          onFail: {
            nextNodeId: "scene_case01_archive_checks",
            effects: [{ type: "add_tension", amount: 1 }],
          },
        },
      },
    ],
  },
  {
    id: "scene_case01_archive_checks",
    scenarioId: CASE01_SCENARIO_IDS.archiveRun,
    sourcePath:
      "40_GameViewer/Case01/Plot/06_Resolution/scene_archive_warrant_run.md",
    titleOverride: "Fail-Forward Records",
    bodyOverride:
      "Three ledgers later, the archive gives way. The warehouse is no longer rumor. It is an address, a delivery window, and a signature chain pointing back to Galdermann's side of the case.",
    choices: [
      {
        id: "CASE01_ARCHIVE_LOCK",
        text: "Lock the warrant package and move on the warehouse.",
        nextNodeId: "scene_case01_archive_exit",
      },
    ],
  },
  {
    id: "scene_case01_archive_exit",
    scenarioId: CASE01_SCENARIO_IDS.archiveRun,
    sourcePath:
      "40_GameViewer/Case01/Plot/06_Resolution/scene_archive_warrant_run.md",
    titleOverride: "Official Entry Ready",
    bodyOverride:
      "The paperwork is finally sharp enough to cut with. You can hit the warehouse in daylight and call it lawful when the shouting starts.",
    terminal: true,
    onEnter: [
      { type: "set_flag", key: "warrant_ready", value: true },
      { type: "set_flag", key: "warehouse_plan_locked", value: true },
      { type: "unlock_group", groupId: "loc_freiburg_warehouse" },
    ],
    choices: [],
  },
  {
    id: "scene_case01_rail_entry",
    scenarioId: CASE01_SCENARIO_IDS.railYardTail,
    sourcePath:
      "40_GameViewer/Case01/Plot/06_Resolution/scene_rail_yard_shadow_tail.md",
    titleOverride: "Rail Yard Tail",
    bodyOverride:
      "The yard is moving even before midnight. Workers who never saw you before decide not to remember you, and that is the best kind of permission you are going to get on this route.",
    choices: [
      {
        id: "CASE01_RAIL_BLEND",
        text: "Blend with the shift change and follow the shadow traffic.",
        nextNodeId: "scene_case01_rail_tail",
        skillCheck: {
          id: "check_case01_rail_stealth",
          voiceId: "attr_stealth",
          difficulty: 11,
          showChancePercent: true,
          onSuccess: {
            nextNodeId: "scene_case01_rail_tail",
            effects: [{ type: "grant_xp", amount: 10 }],
          },
          onFail: {
            nextNodeId: "scene_case01_rail_tail",
            effects: [{ type: "add_heat", amount: 1 }],
          },
        },
      },
    ],
  },
  {
    id: "scene_case01_rail_tail",
    scenarioId: CASE01_SCENARIO_IDS.railYardTail,
    sourcePath:
      "40_GameViewer/Case01/Plot/06_Resolution/scene_rail_yard_shadow_tail.md",
    titleOverride: "Covert Entry Window",
    bodyOverride:
      "The tail confirms what the pub only suggested: the warehouse is live, the guards are being rotated, and one quiet breach is still possible before the ledgers leave the district.",
    choices: [
      {
        id: "CASE01_RAIL_LOCK",
        text: "Keep the route quiet and move before dawn.",
        nextNodeId: "scene_case01_rail_exit",
      },
    ],
  },
  {
    id: "scene_case01_rail_exit",
    scenarioId: CASE01_SCENARIO_IDS.railYardTail,
    sourcePath:
      "40_GameViewer/Case01/Plot/06_Resolution/scene_rail_yard_shadow_tail.md",
    titleOverride: "Covert Entry Ready",
    bodyOverride:
      "You now have a real breach window. It will never look clean, but it will get you inside before the official story can catch the evidence.",
    terminal: true,
    onEnter: [
      { type: "set_flag", key: "covert_entry_ready", value: true },
      { type: "set_flag", key: "warehouse_plan_locked", value: true },
      { type: "unlock_group", groupId: "loc_freiburg_warehouse" },
    ],
    choices: [],
  },
  {
    id: "scene_case01_warehouse_entry",
    scenarioId: CASE01_SCENARIO_IDS.warehouseFinale,
    sourcePath:
      "40_GameViewer/Case01/Plot/06_Resolution/scene_warehouse_finale.md",
    titleOverride: "Warehouse Door",
    bodyOverride:
      "The warehouse smells of wet timber, ledger ink, and a job that expected to end before witnesses arrived. Galdermann is not alone, but he is the one who understands what the room means if you leave with the right papers.",
    choices: [
      {
        id: "CASE01_WAREHOUSE_LAWFUL",
        text: "Seal the floor, call the warrant, and force a lawful close.",
        nextNodeId: "scene_case01_warehouse_lawful",
        visibleIfAll: [...officialRouteConditions],
      },
      {
        id: "CASE01_WAREHOUSE_COMPROMISE",
        text: "Use the bureau ledger and force a compromised truth instead of a public one.",
        nextNodeId: "scene_case01_warehouse_compromised",
        visibleIfAll: [...covertRouteConditions],
      },
    ],
  },
  {
    id: "scene_case01_warehouse_lawful",
    scenarioId: CASE01_SCENARIO_IDS.warehouseFinale,
    sourcePath:
      "40_GameViewer/Case01/Plot/06_Resolution/scene_warehouse_finale.md",
    titleOverride: "Lawful Close",
    bodyOverride:
      "Galdermann folds when the warrant lands and the archive chain holds. The case closes in public, the network survives offstage, and the University thread is all that remains obvious enough to chase next.",
    terminal: true,
    onEnter: [
      { type: "set_flag", key: "case_resolved", value: true },
      { type: "set_flag", key: "case01_resolved_lawful", value: true },
      {
        type: "set_flag",
        key: "case02_hook_university_network",
        value: true,
      },
      {
        type: "set_var",
        key: "case01_final_outcome",
        value: CASE01_FINAL_OUTCOME_LAWFUL,
      },
      { type: "grant_xp", amount: 25 },
    ],
    choices: [],
  },
  {
    id: "scene_case01_warehouse_compromised",
    scenarioId: CASE01_SCENARIO_IDS.warehouseFinale,
    sourcePath:
      "40_GameViewer/Case01/Plot/06_Resolution/scene_warehouse_finale.md",
    titleOverride: "Compromised Truth",
    bodyOverride:
      "You close the visible case, but only by leaving the bureau thread alive enough to watch. Galdermann becomes the public culprit, the network goes to ground, and the University connection is now the only doorway that still opens forward.",
    terminal: true,
    onEnter: [
      { type: "set_flag", key: "case_resolved", value: true },
      { type: "set_flag", key: "case01_resolved_compromise", value: true },
      {
        type: "set_flag",
        key: "case02_hook_university_network",
        value: true,
      },
      {
        type: "set_var",
        key: "case01_final_outcome",
        value: CASE01_FINAL_OUTCOME_COMPROMISED,
      },
      { type: "grant_xp", amount: 25 },
    ],
    choices: [],
  },
];
