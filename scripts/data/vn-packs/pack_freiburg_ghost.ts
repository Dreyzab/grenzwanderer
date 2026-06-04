import type { NodeBlueprint } from "../../vn-blueprint-types";
import type { ScenarioBlueprint } from "../../vn-blueprint-types";

export const PACK_FREIBURG_GHOST_SCENARIOS: ScenarioBlueprint[] = [
  {
    id: "sandbox_ghost_pilot",
    title: "Ghost Intro Pilot",
    startNodeId: "scene_estate_intro",
    mode: "fullscreen",
    packId: "freiburg_ghost",
    defaultBackgroundUrl: "/images/scenes/scene_estate_intro.png",
    musicUrl: "/assets/vn/music/ghost_ambient.ogg",
    nodeIds: [
      "scene_estate_intro",
      "scene_estate_intro_beat1",
      "scene_guild_tutorial",
      "scene_guild_tutorial_beat1",
      "scene_evidence_collection",
      "scene_evidence_collection_beat1",
      "scene_conclusion_false",
      "scene_conclusion_true",
    ],
  },
];

export const PACK_FREIBURG_GHOST_NODES: NodeBlueprint[] = [
  {
    id: "scene_estate_intro",
    scenarioId: "sandbox_ghost_pilot",
    sourcePath: "40_GameViewer/Sandbox_KA/Plot/03_Ghost/scene_estate_intro.md",
    titleOverride: "Возвращение в Гранд-Эстейт",
    bodyOverride:
      "**[Narrator]**:\nОтчёт для Бюро запечатан, но ты возвращаешься к воротам Гранд-Эстейт по собственной воле. Завеса здесь так и не легла ровно: за делом призрака пряталось что-то ещё — слишком земное, чтобы быть наваждением.\n\nХолодный сад встречает тебя тишиной и запахом сырого камня. Особняк смотрит на окраину Фрайбурга тёмными окнами, будто всё ещё ждёт хозяйку.\n\n**[inner_guide]**:\nМы здесь не для того, чтобы изгонять. Мы здесь, чтобы понять, кто прятался за холодом.",
    backgroundUrl: "/assets/vn/bg/estate_entrance.webp",
    onEnter: [
      { type: "set_quest_stage", questId: "quest_ghost", stage: 1 },
    ],
    choices: [
      {
        id: "GHOST_INVESTIGATE",
        text: "Войти и начать осмотр особняка.",
        choiceType: "action",
        nextNodeId: "scene_estate_intro_beat1",
      },
      {
        id: "GHOST_ABORT",
        text: "Ограничиться поверхностным отчётом.",
        choiceType: "flavor",
        nextNodeId: "scene_conclusion_false",
      },
    ],
  },
  {
    id: "scene_estate_intro_beat1",
    scenarioId: "sandbox_ghost_pilot",
    sourcePath:
      "40_GameViewer/Sandbox_KA/Plot/03_Ghost/scene_estate_intro_beat1.md",
    titleOverride: "Холодный порог",
    bodyOverride:
      "**[Narrator]**:\nГлавный зал тонет в полумраке. Сквозняк тянет от дальней стены — там, где по бумагам Бюро нет ни окон, ни дверей. Воздух пахнет воском, пылью и едва уловимой медью.\n\nТы делаешь первый шаг внутрь. Половицы отзываются так, будто кто-то уже шёл здесь этой ночью — и старался ступать тихо.",
    choices: [
      {
        id: "GHOST_BEAT1_CONTINUE",
        text: "Вспомнить протокол Бюро, прежде чем идти дальше.",
        nextNodeId: "scene_guild_tutorial",
      },
    ],
  },
  {
    id: "scene_guild_tutorial",
    backgroundUrl: "/images/scenes/scene_guild_tutorial.png",
    scenarioId: "sandbox_ghost_pilot",
    sourcePath:
      "40_GameViewer/Sandbox_KA/Plot/03_Ghost/scene_guild_tutorial.md",
    titleOverride: "Протокол Бюро",
    bodyOverride:
      "**[Narrator]**:\nТы вспоминаешь, чему учил Мастер: сначала отдели подлинный след завесы от рукотворного. Призрак оставляет холод и память; человек оставляет следы, замки и долги.\n\nЗдесь, похоже, есть и то, и другое — и кто-то очень хотел, чтобы их перепутали.",
    choices: [
      {
        id: "GHOST_TUTORIAL_CONTINUE",
        text: "Продолжить.",
        nextNodeId: "scene_guild_tutorial_beat1",
      },
    ],
  },
  {
    id: "scene_guild_tutorial_beat1",
    scenarioId: "sandbox_ghost_pilot",
    sourcePath:
      "40_GameViewer/Sandbox_KA/Plot/03_Ghost/scene_guild_tutorial_beat1.md",
    titleOverride: "Две природы холода",
    bodyOverride:
      "**[Narrator]**:\nДве природы холода переплелись в этом доме. Одна идёт из-за завесы, другая — из подвалов, где сквозняк слишком ровный для случайного.\n\nПора собрать следы, пока особняк не решил, что гостья задержалась.",
    choices: [
      {
        id: "GHOST_TUTORIAL_INVESTIGATE",
        text: "Начать сбор улик.",
        nextNodeId: "scene_evidence_collection",
      },
    ],
  },
  {
    id: "scene_evidence_collection",
    backgroundUrl: "/images/scenes/scene_evidence_collection.png",
    scenarioId: "sandbox_ghost_pilot",
    voicePresenceMode: "parliament",
    activeSpeakers: ["attr_intellect", "attr_perception", "attr_spirit"],
    sourcePath:
      "40_GameViewer/Sandbox_KA/Plot/03_Ghost/scene_evidence_collection.md",
    titleOverride: "Сбор следов",
    bodyOverride:
      "**[Narrator]**:\nКомнаты Гранд-Эстейт хранят свои улики порознь: книжный шкаф, который стоит чуть дальше от стены, чем должен; температурная аномалия у кладовой; матовый налёт на полу, какого не оставляет ни одна свеча.\n\nКаждый след тянет в свою сторону. Завеса или умысел — ты ещё можешь выбрать, что искать первым.",
    passiveChecks: [
      {
        id: "check_ghost_cold_draft",
        voiceId: "attr_spirit",
        difficulty: 12,
        isPassive: true,
        onSuccess: {
          effects: [
            { type: "set_flag", key: "ghost_draft_sensed", value: true },
          ],
        },
      },
    ],
    choices: [
      {
        id: "GHOST_EVIDENCE_BOOKSHELF",
        text: "Осмотреть книжный шкаф.",
        choiceType: "inquiry",
        nextNodeId: "scene_evidence_collection_beat1",
        effects: [
          {
            type: "set_flag",
            key: "ghost_bookshelf_switch_found",
            value: true,
          },
          { type: "add_var", key: "attr_shadow", value: 1 },
          { type: "grant_evidence", evidenceId: "ev_bookshelf_switch" },
        ],
      },
      {
        id: "GHOST_EVIDENCE_THERMOMETER",
        text: "Проверить температурную аномалию.",
        choiceType: "inquiry",
        nextNodeId: "scene_evidence_collection_beat1",
        skillCheck: {
          id: "check_ghost_thermometer",
          voiceId: "attr_intellect",
          difficulty: 4,
          showChancePercent: true,
          outcomeModel: "tiered",
          modifiers: [
            {
              source: "preparation",
              sourceId: "calibrated_thermometer",
              delta: 3,
            },
          ],
          onSuccess: {
            effects: [
              {
                type: "set_flag",
                key: "ghost_cold_spot_confirmed",
                value: true,
              },
              { type: "add_var", key: "attr_spirit", value: 1 },
              { type: "grant_evidence", evidenceId: "ev_cold_spot" },
            ],
          },
          onCritical: {
            effects: [
              {
                type: "set_flag",
                key: "ghost_cold_spot_confirmed",
                value: true,
              },
              {
                type: "set_flag",
                key: "ghost_thermometer_mastery",
                value: true,
              },
              { type: "add_var", key: "attr_spirit", value: 1 },
              { type: "add_var", key: "attr_intellect", value: 1 },
              { type: "grant_evidence", evidenceId: "ev_cold_spot" },
            ],
          },
          onSuccessWithCost: {
            effects: [
              {
                type: "set_flag",
                key: "ghost_cold_spot_confirmed",
                value: true,
              },
              {
                type: "set_flag",
                key: "ghost_thermometer_overreach",
                value: true,
              },
              { type: "grant_evidence", evidenceId: "ev_cold_spot" },
            ],
            costEffects: [{ type: "add_var", key: "attr_shadow", value: 1 }],
          },
          onFail: {
            effects: [
              { type: "set_flag", key: "ghost_cold_spot_unclear", value: true },
            ],
          },
        },
        effects: [
          { type: "track_event", eventName: "ghost_thermometer_check" },
        ],
      },
      {
        id: "GHOST_EVIDENCE_FLOOR",
        text: "Изучить следы на полу.",
        choiceType: "inquiry",
        nextNodeId: "scene_evidence_collection_beat1",
        effects: [
          { type: "set_flag", key: "ghost_ectoplasm_found", value: true },
          { type: "add_var", key: "checks_passed", value: 1 },
          { type: "grant_evidence", evidenceId: "ev_ectoplasm" },
        ],
      },
      {
        id: "GHOST_WITCH_VEIL_FOCUS",
        text: "[Veil Sight] Ask what in the room is not human.",
        choiceType: "inquiry",
        nextNodeId: "scene_evidence_collection_beat1",
        visibleIfAll: [
          { type: "flag_equals", key: "origin_witch", value: true },
        ],
        effects: [
          { type: "set_flag", key: "ghost_veil_resonance_seen", value: true },
          { type: "set_flag", key: "ghost_human_cover_suspected", value: true },
          { type: "add_var", key: "witch_blood_curse_pressure", value: 15 },
          {
            type: "track_event",
            eventName: "witch_veil_focus",
            tags: { location: "grand_estate", scope: "session_hook" },
          },
        ],
        inlineText:
          "**[attr_spirit]**:\nThe cold does not begin at the window. It gathers around the pantry door, where a living hand has touched the same brass latch too often. The spirit is real, but someone alive has learned its route.",
      },
      {
        id: "GHOST_WITCH_BLOOD_TEMPTATION",
        text: "[Blood Curse] Breathe through the metallic scent near the pantry.",
        choiceType: "flavor",
        nextNodeId: "scene_evidence_collection_beat1",
        visibleIfAll: [
          { type: "flag_equals", key: "origin_witch", value: true },
          { type: "var_gte", key: "witch_blood_curse_pressure", value: 50 },
        ],
        effects: [
          {
            type: "set_flag",
            key: "ghost_witch_blood_temptation_seen",
            value: true,
          },
          { type: "add_var", key: "witch_blood_curse_pressure", value: -20 },
          { type: "add_var", key: "witch_blood_power", value: 1 },
          { type: "add_var", key: "witch_blood_debt", value: 16 },
        ],
        inlineText:
          "**[Narrator]**:\nThe scent is old wine, cut copper, and fear. Relief comes quickly enough to be dangerous. The hunger quiets, but it takes a note of the room for later.",
      },
      {
        id: "GHOST_WITCH_FRIENDRICH_LEDGER_MEMORY",
        text: "[Ledger Memory] Listen for the accountant whose case you already met.",
        choiceType: "inquiry",
        nextNodeId: "scene_evidence_collection_beat1",
        visibleIfAll: [
          { type: "flag_equals", key: "origin_witch", value: true },
          {
            type: "logic_or",
            conditions: [
              { type: "flag_equals", key: "flag_witch_ghost_freed", value: true },
              { type: "flag_equals", key: "flag_witch_ghost_bound", value: true },
            ],
          },
        ],
        effects: [
          {
            type: "grant_evidence",
            evidenceId: "ev_friedrich_ledger_testimony",
          },
          {
            type: "set_flag",
            key: "ghost_session_hook_spirit_bargain",
            value: true,
          },
        ],
        inlineText:
          "**[Narrator]**:\nThe cold remembers a brass-bound ledger. Friedrich's testimony lines up here too: the same partners, the same night the vault was sealed. The pages you carry in memory now answer the room.",
      },
      {
        id: "GHOST_WITCH_SASHA_SERVICE_CORRIDOR",
        text: "[Service Corridor] Walk the pantry route Sasha trusted you with.",
        choiceType: "inquiry",
        nextNodeId: "scene_evidence_collection_beat1",
        visibleIfAll: [
          { type: "flag_equals", key: "origin_witch", value: true },
          { type: "flag_equals", key: "flag_witch_helped_sasha_hbf", value: true },
          { type: "flag_equals", key: "flag_witch_attacked_sasha", value: false },
        ],
        effects: [
          {
            type: "grant_evidence",
            evidenceId: "ev_sasha_service_corridor_testimony",
          },
          {
            type: "set_flag",
            key: "ghost_session_hook_sasha_smuggling_key",
            value: true,
          },
        ],
        inlineText:
          "**[Narrator]**:\nSasha's directions hold. The pantry door opens onto the smuggling corridor he keeps quiet about — a clean path from cellar to yard that someone living used the night Friedrich died.",
      },
      {
        id: "GHOST_WITCH_SASHA_PANIC_TRACE",
        text: "[Panic Trace] Read the corridor where Sasha was fed on.",
        choiceType: "flavor",
        nextNodeId: "scene_evidence_collection_beat1",
        visibleIfAll: [
          { type: "flag_equals", key: "origin_witch", value: true },
          { type: "flag_equals", key: "flag_witch_attacked_sasha", value: true },
        ],
        effects: [
          {
            type: "set_flag",
            key: "ghost_sasha_testimony_compromised",
            value: true,
          },
        ],
        inlineText:
          "**[Narrator]**:\nThe service corridor still holds the shape of Sasha's silence. He will not make a ghost story out of what happened, but his testimony, if it ever comes, will carry the bite mark with it.",
      },
    ],
  },
  {
    id: "scene_evidence_collection_beat1",
    scenarioId: "sandbox_ghost_pilot",
    sourcePath:
      "40_GameViewer/Sandbox_KA/Plot/03_Ghost/scene_evidence_collection_beat1.md",
    titleOverride: "Узор проступает",
    bodyOverride:
      "**[Narrator]**:\nСледы начинают складываться в узор. Холод подлинный — но кто-то живой проложил по нему свой маршрут, и этот маршрут ведёт глубже официального отчёта.\n\nХватит ли собранного, чтобы назвать имя?",
    choices: [
      {
        id: "GHOST_COLLECT_MORE",
        text: "Собрать ещё следы, прежде чем делать вывод.",
        nextNodeId: "scene_evidence_collection",
      },
      {
        id: "GHOST_CONCLUSION_TRUE",
        text: "Собрать полное обвинение.",
        nextNodeId: "scene_conclusion_true",
        conditions: [
          {
            type: "flag_equals",
            key: "ghost_bookshelf_switch_found",
            value: true,
          },
          {
            type: "flag_equals",
            key: "ghost_ectoplasm_found",
            value: true,
          },
        ],
        effects: [
          { type: "set_quest_stage", questId: "quest_ghost", stage: 2 },
          { type: "set_flag", key: "ghost_truth_proven", value: true },
        ],
      },
      {
        id: "GHOST_CONCLUSION_FALSE",
        text: "Списать всё на фольклор.",
        nextNodeId: "scene_conclusion_false",
        effects: [
          { type: "set_quest_stage", questId: "quest_ghost", stage: 2 },
        ],
      },
    ],
  },
  {
    id: "scene_conclusion_false",
    scenarioId: "sandbox_ghost_pilot",
    sourcePath:
      "40_GameViewer/Sandbox_KA/Plot/03_Ghost/scene_conclusion_false.md",
    titleOverride: "Сквозняк из тоннелей",
    bodyOverride:
      "**[Narrator]**:\nТы вскрываешь механизм за книжным шкафом. Из проёма бьёт волна холодного воздуха — снизу, из тоннелей. Внутри штабелями стоят ящики контрабандного бренди. Завесу можно списать на сквозняк и фольклор, и в отчёте это будет выглядеть... аккуратно.",
    terminal: true,
    choices: [],
    onEnter: [{ type: "set_flag", key: "ghost_truth_proven", value: false }],
  },
  {
    id: "scene_conclusion_true",
    scenarioId: "sandbox_ghost_pilot",
    sourcePath:
      "40_GameViewer/Sandbox_KA/Plot/03_Ghost/scene_conclusion_true.md",
    titleOverride: "Обе половины дела",
    bodyOverride:
      "**[Narrator]**:\nТы предъявляешь Баронессе обе половины правды. Холод и эктоплазма настоящие — дух так и не покинул особняк. Но за книжным шкафом скрыт механизм, а под домом — тоннели, по которым шёл контрабандный поток. Призрак был настоящим. И он был удобным прикрытием.",
    terminal: true,
    choices: [],
    onEnter: [
      { type: "set_quest_stage", questId: "quest_ghost", stage: 3 },
      { type: "set_flag", key: "ghost_case_closed", value: true },
      { type: "grant_xp", amount: 45 },
    ],
  },
];
