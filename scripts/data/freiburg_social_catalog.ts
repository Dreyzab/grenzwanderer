import { CANONICAL_FACTION_REGISTRY } from "../../data/factionContract";
import type { SocialCatalogSnapshot } from "../../src/features/vn/types";

export const FREIBURG_SOCIAL_CATALOG: SocialCatalogSnapshot = {
  factions: CANONICAL_FACTION_REGISTRY,
  npcIdentities: [
    {
      id: "npc_weber_dispatcher",
      displayName: "Lotte Weber",
      factionId: "city_chancellery",
      publicRole: "Chief telephone operator",
      rosterTier: "major",
      introFlag: "met_redhead_intro",
      homePointId: "loc_agency",
      workPointId: "loc_telephone",
      serviceIds: ["svc_lotte_switchboard_trace"],
      bio: {
        summary:
          "Chief telephone operator who hears the whole city before it speaks. Sells quiet city-notes on the side and reads silence on a line the way a hunter reads tracks.",
        stages: [
          {
            revealFlag: "lotte_warning_heeded",
            heading: "Earned Trust",
            text: "Once you heed her warning she opens the switchboard: who called whom, which offices went quiet, which lines were redirected. She shields the women who report to her — handle her access carelessly and the channel closes for good.",
          },
        ],
      },
    },
    {
      id: "npc_anna_mahler",
      displayName: "Anna Mahler",
      factionId: "city_network",
      publicRole: "Railway fixer",
      rosterTier: "major",
      introFlag: "met_anna_intro",
      homePointId: "loc_workers_pub",
      workPointId: "loc_agency",
      serviceIds: ["svc_anna_whispers", "svc_anna_student_intro"],
      bio: {
        summary:
          "Railway fixer who moves rumors through station messengers and tavern staff faster than any telegraph. Trades in access, not affection.",
        stages: [
          {
            revealFlag: "service_anna_student_intro_unlocked",
            heading: "Network Committed",
            text: "She has put part of her network on your banker file, turning a closed fraternity house into a supported route. That commitment is logged as agency work — and a source can only be spent so many times before it burns.",
          },
        ],
      },
    },
    {
      id: "npc_archivist_otto",
      displayName: "Archivist Otto",
      factionId: "city_chancellery",
      publicRole: "Records specialist",
      rosterTier: "functional",
      introFlag: "met_archivist_intro",
      homePointId: "loc_rathaus",
      workPointId: "loc_rathaus",
      serviceIds: ["svc_otto_archive_packet"],
      bio: {
        summary:
          "Records specialist at the Rathaus. Knows where every file moved and why — provided the civic route is already warm before you ask.",
      },
    },
    {
      id: "npc_mother_hartmann",
      displayName: "Eleonora Hartmann",
      factionId: "house_of_pledges",
      publicRole: "Aristocratic patron",
      rosterTier: "major",
      introFlag: "met_mother_intro",
      homePointId: "loc_agency",
      workPointId: "loc_agency",
      serviceIds: [
        "svc_eleonora_social_introduction",
        "svc_eleonora_political_cover",
      ],
      bio: {
        summary:
          "Aristocratic patron of the House of Pledges. Never commands — she arranges inevitability, and remembers every door she opens.",
        stages: [
          {
            revealFlag: "hartmann_interests_threatened",
            heading: "The Price of Cover",
            text: "When evidence threatens the family she offers political cover: suppression, redirection, reframing. Accepting it compromises your independence; refusing it closes House of Pledges doors and costs Felix's trust if he learns of the bargain.",
          },
        ],
      },
    },
    {
      id: "npc_felix_hartmann",
      displayName: "Felix Hartmann",
      factionId: "house_of_pledges",
      publicRole: "Junior field partner",
      rosterTier: "major",
      introFlag: "met_felix_intro",
      homePointId: "loc_agency",
      workPointId: "loc_agency",
      serviceIds: ["svc_felix_legal_analysis"],
      bio: {
        summary:
          "Legitimate Hartmann son and junior field partner. A legal aspirant torn between procedure and field reality — and prone to apathy under sustained pressure.",
      },
    },
    {
      id: "npc_bureau_master",
      displayName: "The Master",
      factionId: "the_returned",
      publicRole: "Bureau occult supervisor",
      rosterTier: "functional",
      portraitUrl: "/images/characters/bureau_master/bureau_master.webp",
      introFlag: "met_bureau_master_intro",
      workPointId: "loc_hbf",
      serviceIds: ["svc_bureau_occult_protocol"],
      bio: {
        summary:
          "Occult supervisor of the Bureau. Grants sanctioned cover for field incidents — and rations the curse suppressant that keeps Witch agents standing.",
      },
    },
    {
      id: "npc_sasha_hartmann_servant",
      displayName: 'Alexander "Sasha"',
      factionId: "house_of_pledges",
      publicRole: "Hartmann family servant",
      rosterTier: "functional",
      portraitUrl:
        "/images/characters/sasha_hartmann_servant/sasha_hartmann_servant.webp",
      introFlag: "met_sasha_servant_intro",
      workPointId: "loc_freiburg_estate",
      serviceIds: ["svc_sasha_service_corridors"],
      bio: {
        summary:
          "Hartmann household servant who knows every service corridor and how to settle a domestic crisis without a sound. Reads Eleonora's symptoms but not the occult truth behind them.",
      },
    },
    {
      id: "npc_friedrich_wagner",
      displayName: "Friedrich Wagner",
      factionId: "the_returned",
      publicRole: "Dead estate accountant",
      rosterTier: "major",
      portraitUrl: "/images/characters/friedrich_wagner/friedrich_wagner.webp",
      introFlag: "met_friedrich_wagner_intro",
      workPointId: "loc_freiburg_estate",
      serviceIds: ["svc_friedrich_ledger_memory"],
      bio: {
        summary:
          "The estate's dead accountant. His ledger memory cross-references the smuggling accounts against the Krebs partners — testimony that only answers if he was met with justice or bound to the witch's shadow.",
      },
    },
    {
      id: "npc_krebs_mugger",
      displayName: "Krebs Mugger",
      factionId: "free_yards",
      publicRole: "Street enforcer",
      rosterTier: "functional",
      portraitUrl: "/images/characters/krebs_mugger/krebs_mugger.webp",
      introFlag: "met_krebs_mugger_intro",
      workPointId: "loc_hbf",
      bio: {
        summary:
          "Street enforcer working the Hauptbahnhof. A survivor of the alley whose whisper can place someone exactly where they swore they never were.",
      },
    },
    {
      id: "npc_hotel_maid",
      displayName: "Hotel Maid",
      factionId: "city_network",
      publicRole: "Zum Goldenen Adler maid",
      rosterTier: "functional",
      portraitUrl: "/images/characters/hotel_maid/hotel_maid.webp",
      introFlag: "met_hotel_maid_intro",
      workPointId: "loc_pub_deutsche",
      serviceIds: ["svc_hotel_discretion"],
      bio: {
        summary:
          "Zum Goldenen Adler maid whose discretion can be bought — laundry vanishes, room logs stay clean.",
        stages: [
          {
            revealFlag: "flag_witch_maid_bribed",
            heading: "Bought Discretion",
            text: "Bribed at the Adler, she keeps the staff quietly aligned: ruined clothing disappears and Felix hears no rumor at breakfast — for exactly as long as nothing forces her to choose between your coin and the police.",
          },
        ],
      },
    },

    {
      id: "npc_apothecary",
      displayName: "Adalbert Weiss",
      factionId: "masters_union",
      publicRole: "Apothecary",
      rosterTier: "functional",
      portraitUrl: "/images/characters/apothecary/apothecary.webp",
      introFlag: "met_apothecary_intro",
      serviceIds: ["svc_apothecary_supplies"],
      bio: {
        summary:
          "Altstadt pharmacist who sells legal remedies over the counter and restricted chemical supplies under it. Meticulous, anxious, and careful about which clients he names.",
      },
    },
    {
      id: "npc_heinrich_galdermann",
      displayName: "Heinrich Galdermann",
      factionId: "house_of_pledges",
      publicRole: "Prokurist, Bankhaus Krebs",
      rosterTier: "major",
      portraitUrl:
        "/images/characters/heinrich_galdermann/heinrich_galdermann.webp",
      introFlag: "met_galdermann",
      workPointId: "loc_freiburg_bank",
      serviceIds: ["svc_galdermann_signature_chain"],
      bio: {
        summary:
          "Respectable culprit of Bankhaus Krebs: a broad, polished Prokurist whose smile feels notarized and whose panic hides under a damp handkerchief.",
        stages: [
          {
            revealFlag: "clue_galdermann_preseed_confirmed",
            heading: "The Pen, Not the Crowbar",
            text: "Galdermann did not kill, burn, or steal by hand. He signed. The horror of his crime is procedural: liquidity moved through ink, the robbery became cover, and the official report keeps sliding over the grossbuch like a napkin over broken porcelain.",
          },
          {
            revealFlag: "freiburg_finale_open",
            heading: "Half-Truth Bargain",
            text: "When cornered he can break into confession or bargain with half the truth. He can name the signature chain, the warehouse, and the paid hands, but the superior will behind the operation remains outside the room.",
          },
        ],
      },
    },
    {
      id: "npc_albrecht_stoll",
      displayName: "Oberleutnant Albrecht Stoll",
      factionId: "city_chancellery",
      publicRole: "Serving pioneer officer",
      rosterTier: "major",
      portraitUrl: "/images/characters/albrecht_stoll/albrecht_stoll.webp",
      introFlag: "case01_sapper_profiled",
      workPointId: "loc_freiburg_warehouse",
      serviceIds: ["svc_stoll_breach_math"],
      bio: {
        summary:
          "The Sapper: a serving engineer officer whose discipline turns theft into an equation and whose postal coat cannot quite hide the uniform beneath.",
        stages: [
          {
            revealFlag: "false_trail_post_route_refuted",
            heading: "Uniform Leaking Through",
            text: "His forged dispatch works because it borrows real authority. The postal disguise fits badly at the shoulders; the officer's body refuses to pretend it is only a postman's coat.",
          },
          {
            revealFlag: "case02_hook_university_network",
            heading: "The Command He Will Not Name",
            text: "Stoll denies being a thief, not the thermite. He sleeps because the cut was clean, and he obeys an unnamed former commander with reflexive respect even under pressure.",
          },
        ],
      },
    },
    {
      id: "npc_emil_roth",
      displayName: "Emil Roth",
      factionId: "masters_union",
      publicRole: "Book restorer",
      rosterTier: "functional",
      portraitUrl: "/images/characters/emil_roth/emil_roth.webp",
      introFlag: "false_trail_grimoire_refuted",
      workPointId: "loc_munster",
      serviceIds: ["svc_roth_binding_measurements"],
      bio: {
        summary:
          "Restorer-scout with ink and wax on thin fingers. He did not hold the knife, but he measured the sheath so precisely that the blade found its way.",
        stages: [
          {
            revealFlag: "false_trail_grimoire_refuted",
            heading: "Technical Reverence",
            text: "Roth gave the Architect the weight, thickness, and binding measurements of Razlom. He thought he was speaking to greatness; he was giving a surgeon the cut line.",
          },
        ],
      },
    },
    {
      id: "npc_anton_weber",
      displayName: "Anton Weber",
      factionId: "city_chancellery",
      publicRole: "Reichspost route clerk",
      rosterTier: "functional",
      portraitUrl: "/images/characters/anton_weber/anton_weber.webp",
      introFlag: "false_trail_post_route_refuted",
      workPointId: "loc_hbf",
      serviceIds: ["svc_weber_post_route"],
      bio: {
        summary:
          "Postman whose real route was bent by a forged military order. His black-yellow twine became the professional signature that framed the wrong people.",
        stages: [
          {
            revealFlag: "false_trail_post_route_refuted",
            heading: "Bent Route",
            text: "Weber's guilt is obedience under official pressure. He did not design the theft; he supplied movement, timing, and a postal craft mark that became evidence against everyone else.",
          },
        ],
      },
    },
    {
      id: "npc_rudi_kempf",
      displayName: "Rudi Kempf",
      factionId: "city_network",
      publicRole: "Rail yard worker",
      rosterTier: "functional",
      portraitUrl: "/images/characters/rudi_kempf/rudi_kempf.webp",
      introFlag: "false_trail_workers_refuted",
      workPointId: "loc_workers_pub",
      serviceIds: ["svc_rudi_protest_noise"],
      bio: {
        summary:
          "Worker whose protest made the square loud enough to hide a surgical breach. He thinks he was only fighting the bank; the bank used his anger as weather.",
        stages: [
          {
            revealFlag: "false_trail_workers_refuted",
            heading: "Noise, Not Poison",
            text: "Rudi is a cover victim with a temper, not the vault mind. His shouted timing and crowd rhythm made witnesses useless while the thermite did its quiet work.",
          },
        ],
      },
    },
    {
      id: "npc_konrad_vossler",
      displayName: "Konrad Vossler",
      factionId: "college_of_reason",
      publicRole: "Chemistry teacher",
      rosterTier: "functional",
      portraitUrl: "/images/characters/konrad_vossler/konrad_vossler.webp",
      introFlag: "case02_hook_university_network",
      workPointId: "loc_uni_chem",
      serviceIds: ["svc_vossler_demolition_mirror"],
      bio: {
        summary:
          "Former pioneer from the same demolition school as Stoll, now a chemistry teacher. He is not an accomplice; he is the path Stoll might have taken after one refusal.",
        stages: [
          {
            revealFlag: "case02_hook_university_network",
            heading: "Dead Registry Mirror",
            text: "Sulfur on his cuffs and a voice that cuts off too quickly make him look guilty at first glance. The point is sharper: Vossler is evidence that training does not force obedience forever.",
          },
        ],
      },
    },
  ],
  services: [
    {
      id: "svc_apothecary_supplies",
      npcId: "npc_apothecary",
      role: "goods",
      label: "Chemical Supplies",
      baseAccess:
        "Open counter for legal remedies and tonics; restricted solvents and reagents require trust or the right introduction.",
      qualityNote:
        "Reliable, discreet source of laboratory-grade magnesium, iron oxide, and reagents for a buyer he trusts.",
      consequenceNote:
        "Pressing him on restricted stock raises his guard and can close the channel.",
    },
    {
      id: "svc_anna_whispers",
      npcId: "npc_anna_mahler",
      role: "information",
      label: "Rail Yard Whispers",
      baseAccess:
        "Available once the Workers' Pub lead is active and Anna's channels trust you.",
      qualityNote:
        "Fast rumor triage through station messengers and tavern staff.",
      consequenceNote:
        "Loose handling can burn a source and push the network underground.",
    },
    {
      id: "svc_anna_student_intro",
      npcId: "npc_anna_mahler",
      role: "social_introduction",
      label: "Student House Introduction",
      baseAccess:
        "Requires a verified rumor chain plus either one favor in reserve or agency standing.",
      unlockFlag: "service_anna_student_intro_unlocked",
      costNote:
        "Usually costs one favor unless your standing is already carrying the weight.",
      qualityNote:
        "Turns a closed fraternity house into a supported Freiburg route instead of a blind trespass.",
      consequenceNote:
        "Commits part of Anna's network to your banker file and is tracked as agency service work.",
    },
    {
      id: "svc_otto_archive_packet",
      npcId: "npc_archivist_otto",
      role: "archives",
      label: "Archive Packet",
      baseAccess:
        "Used from Freiburg civic contacts once the Rathaus route is already warm.",
      qualityNote:
        "Provides cross-indexed filing movement notes for follow-up checks.",
    },
    {
      id: "svc_eleonora_social_introduction",
      npcId: "npc_mother_hartmann",
      role: "social_introduction",
      label: "Hartmann Salon Introduction",
      baseAccess:
        "Available when Eleonora considers the detective a working contact. Requires at least one completed favor or demonstrated discretion.",
      costNote:
        "No explicit price. Eleonora remembers every door she opens and expects the detective to remember too.",
      qualityNote:
        "Opens house_of_pledges-adjacent events: patronage circles, archival permissions held by aristocratic families, and salon introductions.",
      consequenceNote:
        "Creates implicit obligation. Eleonora tracks debts as social architecture, not accounting.",
    },
    {
      id: "svc_eleonora_political_cover",
      npcId: "npc_mother_hartmann",
      role: "political_cover",
      label: "Political Cover",
      baseAccess:
        "Available only when active evidence threatens Hartmann family interests or house_of_pledges standing. Case02 and beyond.",
      unlockFlag: "hartmann_interests_threatened",
      costNote:
        "Suppression, redirection, or reframing of damaging material. Price: case integrity, moral stress, and Felix trust if he discovers the arrangement.",
      qualityNote:
        "Neutralizes institutional fallout from evidence that would damage Hartmann-adjacent networks.",
      consequenceNote:
        "Accepting cover compromises investigative independence. Refusing it damages Eleonora relations and may close house_of_pledges access.",
    },
    {
      id: "svc_lotte_switchboard_trace",
      npcId: "npc_weber_dispatcher",
      role: "information",
      label: "Switchboard Trace",
      baseAccess:
        "Available once Lotte trusts the detective enough to share operational patterns. Requires lotte_warning_heeded or equivalent trust threshold.",
      unlockFlag: "lotte_warning_heeded",
      qualityNote:
        "Pattern analysis of telephone traffic reveals communication anomalies around suspects — who called whom, which lines went quiet, which offices redirected. Her paid city-note work gives her a journalist's habit of turning pauses into leads.",
      consequenceNote:
        "Using switchboard intelligence risks exposing Lotte's access and the women who report to her. Careless handling may burn her position or make her start checking the player's timetable.",
    },
    {
      id: "svc_felix_legal_analysis",
      npcId: "npc_felix_hartmann",
      role: "information",
      label: "Legal Analysis",
      baseAccess:
        "Available while Felix is an active partner with stable or higher trust. Degrades or becomes unavailable during apathy episodes.",
      qualityNote:
        "Cross-references legal precedent, procedural requirements, and institutional jurisdiction. Turns bureaucratic obstacles into investigative leverage.",
      consequenceNote:
        "Quality depends on Felix mental state. Instrumentalization without reciprocal investment degrades output over time.",
    },
    {
      id: "svc_bureau_occult_protocol",
      npcId: "npc_bureau_master",
      role: "political_cover",
      label: "Bureau Occult Protocol",
      baseAccess:
        "Available to Witch agents who kept the Maskerade in the Bureau induction (suppressant taken or composure held).",
      unlockFlag: "met_bureau_master_intro",
      qualityNote:
        "Provides sanctioned occult cover for field incidents and Bureau-side rationing of curse suppressant.",
      consequenceNote:
        "Cover is revoked if the Bureau reads the agent as undisciplined; a flagged Master suspends the protocol.",
    },
    {
      id: "svc_sasha_service_corridors",
      npcId: "npc_sasha_hartmann_servant",
      role: "transport",
      label: "Estate Service Corridors",
      baseAccess:
        "Available only when Sasha trusts the detective or Eleonora enough to keep the Hartmann household routes quiet.",
      unlockFlag: "met_sasha_servant_intro",
      qualityNote:
        "Knows service routes, can settle a domestic crisis without attracting public attention, and keeps composure under pressure.",
      consequenceNote:
        "If Eleonora uses his blood or warmth, Sasha does not become a frightened extra; he becomes a silent witness whose trust is broken.",
    },
    {
      id: "svc_friedrich_ledger_memory",
      npcId: "npc_friedrich_wagner",
      role: "archives",
      label: "Ledger Memory",
      baseAccess:
        "Available only when Friedrich was met with justice or bound to the witch's shadow; not from a banished outcome.",
      unlockFlag: "met_friedrich_wagner_intro",
      qualityNote:
        "Cross-references the smuggling ledger against the Krebs partners and dates back to the night of his murder.",
      consequenceNote:
        "Bound testimony degrades faster than freely given testimony and may invite Bureau scrutiny.",
    },
    {
      id: "svc_hotel_discretion",
      npcId: "npc_hotel_maid",
      role: "social_introduction",
      label: "Hotel Discretion",
      baseAccess:
        "Available once the maid is bribed at the Adler — clothing destroyed, staff quietly aligned.",
      unlockFlag: "flag_witch_maid_bribed",
      qualityNote:
        "Quiet back-channel through hotel staff: laundry vanishes, room logs stay clean, and Felix hears no rumor at breakfast.",
      consequenceNote:
        "Discretion lasts as long as nothing forces the maid to choose between her bribe and the police.",
    },
    {
      id: "svc_galdermann_signature_chain",
      npcId: "npc_heinrich_galdermann",
      role: "archives",
      label: "Signature Chain",
      baseAccess:
        "Available after Galdermann has been met and the bank ledger route is active.",
      unlockFlag: "met_galdermann",
      qualityNote:
        "Connects missing liquidity, sealed statements, and authority to move money without a crowbar.",
      consequenceNote:
        "Pressure makes Galdermann choose between confession and half-truth; either way the higher name remains protected.",
    },
    {
      id: "svc_stoll_breach_math",
      npcId: "npc_albrecht_stoll",
      role: "information",
      label: "Breach Mathematics",
      baseAccess:
        "Available only after the thermite, forged dispatch, and post-route anomalies converge into the Sapper profile.",
      unlockFlag: "case01_sapper_profiled",
      qualityNote:
        "Explains how one private box was burned open while the building remained standing.",
      consequenceNote:
        "Stoll may trade the shape of the Architect for a quiet exit, but reflexive command loyalty blocks the name.",
    },
    {
      id: "svc_roth_binding_measurements",
      npcId: "npc_emil_roth",
      role: "information",
      label: "Binding Measurements",
      baseAccess:
        "Available once Roth's grimoire lead is refuted as motive rather than theft.",
      unlockFlag: "false_trail_grimoire_refuted",
      qualityNote:
        "Supplies Razlom's weight, thickness, and binding geometry: the missing target data behind the surgical burn.",
      consequenceNote:
        "Over-accusing Roth turns a frightened craftsman into noise and can obscure the Architect's technical interest.",
    },
    {
      id: "svc_weber_post_route",
      npcId: "npc_anton_weber",
      role: "transport",
      label: "Bent Postal Route",
      baseAccess:
        "Available after Weber's route statement is taken apart without making him the thief.",
      unlockFlag: "false_trail_post_route_refuted",
      qualityNote:
        "Shows how a real Reichspost route and black-yellow twine became the physical screen for the theft.",
      consequenceNote:
        "Publicly breaking Weber damages civic cooperation while leaving the forged military order's author untouched.",
    },
    {
      id: "svc_rudi_protest_noise",
      npcId: "npc_rudi_kempf",
      role: "information",
      label: "Protest Noise",
      baseAccess:
        "Available after the workers' false trail is separated from the vault breach.",
      unlockFlag: "false_trail_workers_refuted",
      qualityNote:
        "Separates crowd noise and labor anger from the thermite operation's technical precision.",
      consequenceNote:
        "Treating Rudi as the core culprit turns a cover victim into a scapegoat and lets the bank story stay neat.",
    },
    {
      id: "svc_vossler_demolition_mirror",
      npcId: "npc_konrad_vossler",
      role: "information",
      label: "Demolition School Mirror",
      baseAccess:
        "Case02 hook only: available once the university network thread survives Case01.",
      unlockFlag: "case02_hook_university_network",
      qualityNote:
        "Contrasts Stoll's obedience with a former pioneer who left demolition for chemistry teaching.",
      consequenceNote:
        "Misreading Vossler as an accomplice muddies the Architect line and repeats the false-trail pattern.",
    },
  ],
  rumors: [
    {
      id: "rumor_bank_rail_yard",
      title: "Rail Yard Ledger Whisper",
      caseId: "quest_banker",
      leadPointId: "loc_hbf",
      sourceNpcId: "npc_anna_mahler",
      verifiesOn: ["service_unlock"],
      careerCriterionOnVerify: "verified_rumor_chain",
    },
    {
      id: "rumor_university_network",
      title: "Faculty Registry Anomaly",
      caseId: "quest_banker",
      leadPointId: "loc_student_house",
      sourceNpcId: "npc_felix_hartmann",
      verifiesOn: ["flag_set"],
      careerCriterionOnVerify: "university_contact_established",
    },
    {
      id: "rumor_witch_mugger_survivor",
      title: "Alley Survivor Whisper",
      caseId: "quest_banker",
      leadPointId: "loc_hbf",
      sourceNpcId: "npc_krebs_mugger",
      verifiesOn: ["flag_set"],
    },
    {
      id: "rumor_galdermann_signature_pressure",
      title: "The Signature That Moved Before the Theft",
      caseId: "quest_banker",
      leadPointId: "loc_freiburg_bank",
      sourceNpcId: "npc_heinrich_galdermann",
      verifiesOn: ["evidence", "flag_set"],
      careerCriterionOnVerify: "clean_closure",
    },
    {
      id: "rumor_sapper_clean_cut",
      title: "Not a Thief, an Engineer",
      caseId: "quest_banker",
      leadPointId: "loc_freiburg_warehouse",
      sourceNpcId: "npc_albrecht_stoll",
      verifiesOn: ["evidence", "fact"],
      careerCriterionOnVerify: "university_contact_established",
    },
    {
      id: "rumor_architect_absent_shape",
      title: "The Architect's Missing Face",
      caseId: "quest_banker",
      leadPointId: "loc_uni_chem",
      sourceType: "environment",
      subject: "The Architect",
      locationHint:
        "A former command relation, a grimoire target, and false trails too clean for a mere thief.",
      verifiesOn: ["flag_set"],
      careerCriterionOnVerify: "university_contact_established",
    },
  ],
  careerRanks: [
    {
      id: "trainee",
      label: "Trainee",
      order: 0,
      standingRequired: -100,
      serviceCriteriaNeeded: 0,
      privileges: [],
    },
    {
      id: "junior_detective",
      label: "Junior Detective",
      order: 1,
      standingRequired: 15,
      qualifyingCaseId: "quest_banker",
      serviceCriteriaNeeded: 2,
      privileges: ["Field warrant"],
    },
    {
      id: "agency_detective",
      label: "Agency Detective",
      order: 2,
      standingRequired: 35,
      serviceCriteriaNeeded: 2,
      privileges: ["Priority filing access"],
    },
    {
      id: "senior_detective",
      label: "Senior Detective",
      order: 3,
      standingRequired: 55,
      serviceCriteriaNeeded: 2,
      privileges: ["Discretionary field command"],
    },
    {
      id: "lead_investigator",
      label: "Lead Investigator",
      order: 4,
      standingRequired: 75,
      serviceCriteriaNeeded: 2,
      privileges: ["Agency-wide mandate"],
    },
  ],
};

export const FREIBURG_SOCIAL_NPC_IDS = new Set(
  FREIBURG_SOCIAL_CATALOG.npcIdentities.map((entry) => entry.id),
);

export const FREIBURG_SOCIAL_RUMOR_IDS = new Set(
  FREIBURG_SOCIAL_CATALOG.rumors.map((entry) => entry.id),
);

export const FREIBURG_SOCIAL_CAREER_RANK_IDS = new Set(
  FREIBURG_SOCIAL_CATALOG.careerRanks.map((entry) => entry.id),
);

export const FREIBURG_SOCIAL_FACTION_IDS = new Set(
  (FREIBURG_SOCIAL_CATALOG.factions ?? []).map((entry) => entry.id),
);

export const AGENCY_SERVICE_CRITERION_IDS = new Set([
  "verified_rumor_chain",
  "preserved_source_network",
  "clean_closure",
]);
