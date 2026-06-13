import {
  type InnerVoiceId,
  isInnerVoiceId,
  isSkillVoiceId,
  type PsycheAxis,
  type SkillVoiceId,
} from "./innerVoiceContract";
import type { CanonicalVoicePromptProfile } from "./voiceBridge";

/**
 * Parliament Modules — one engine, six origins.
 *
 * A ParliamentModule is a per-origin DATA PACK (emphasis + skins + modes +
 * hidden voice + doctrines) layered over the single shared parliament engine.
 * It does not fork the engine: the influence math, the two-layer parser guard
 * (`hasMixedSpeakerPool`), and psyche resonance are all shared and untouched.
 *
 * Spec + authoring invariants: docs/PARLIAMENT_MODULES.md.
 * The registry is keyed by `presetId`, which matches
 * `getParliamentPresetForOrigin(profile, track)` in originProfiles.ts.
 */

/**
 * Per-preset persona override for a skinned voice. A subset of the voiceBridge
 * prompt profile — only the fields a skin actually re-colors. `canonicalId` is
 * intentionally excluded: a skin re-labels a voice, it never re-roots it.
 */
export type VoiceSkinPersona = Partial<
  Pick<
    CanonicalVoicePromptProfile,
    | "label"
    | "motto"
    | "speechPattern"
    | "vocabulary"
    | "emotionalRange"
    | "blindSpot"
    | "coreDrive"
    | "stressPattern"
  >
>;

/** A named label over a real canonical voice id, scoped to one preset. */
export interface VoiceSkin {
  /** Display label, e.g. "[ФАСАД]". */
  label: string;
  /**
   * The real canonical id this skin renders over. MUST be a `SkillVoiceId` in
   * `methodSkins` and an `InnerVoiceId` in `motiveSkins` (two-layer purity).
   */
  targetId: SkillVoiceId | InnerVoiceId;
  /** Optional persona override for the AI/prompt + presentation layers. */
  persona?: VoiceSkinPersona;
  /** The "useful but costly" tax — an authoring note, not yet a mechanic. */
  cost: string;
  /**
   * In-character fallback line when the voice supports the considered move.
   * Shown on parliament cards when no AI line is available; overrides the
   * canonical `supportText`. Required on motive skins (ru locale).
   */
  supportText?: string;
  /** Same as `supportText`, for the opposing stance. */
  opposeText?: string;
}

/** A derived-state overlay (e.g. [НАБАТ]). NOT a speaker, NOT a stored meter. */
export interface ParliamentMode {
  label: string;
  /** Reference to an EXISTING meter/flag, e.g. "witch_blood_curse_pressure high". */
  derivedFrom: string;
  /** How it recolors the motive layer. */
  distorts: string;
  /** Writing-style shift (syntax, length, cadence). */
  prose: string;
}

/** The `concealed_threat` reveal (e.g. [ПЯТНО]); never visible at first meeting. */
export interface HiddenVoice {
  label: string;
  sourceRole: "concealed_threat";
  /**
   * The seated `inner_*` voice this reveal hides behind, when the hidden voice
   * is a skin over a parliament member (the witch's [СТЫД] over inner_hermit).
   * Absent when the reveal is purely narrative (no seated voice is concealed).
   */
  targetId?: InnerVoiceId;
  /**
   * Runtime flag that surfaces the concealed voice. While unset, `targetId`
   * stays invisible in the parliament for this preset. Absent = nothing is
   * concealed at runtime yet (reveal is authored content only).
   */
  revealFlagKey?: string;
  /** Flags/conditions that surface it (Player Dossier gating). */
  revealTriggers: string[];
  /** A representative line, for tone reference. */
  line?: string;
}

/** A belief-layer entry: drifts a psyche axis and biases resonance. */
export interface Doctrine {
  title: string;
  axisShift: { axis: PsycheAxis; delta: number };
  amplifies: InnerVoiceId;
  mutes: InnerVoiceId;
}

export interface ParliamentModule {
  presetId: string;
  /** Which `inner_*` factions start loud (seeds `inner_voice_rank_*`). 1–2, not all. */
  emphasis: Partial<Record<InnerVoiceId, number>>;
  /** Skins over `attr_*` ids ("can she, and how?"). */
  methodSkins: VoiceSkin[];
  /** Skins over `inner_*` ids ("why, and who takes the wheel?"). */
  motiveSkins: VoiceSkin[];
  modes: ParliamentMode[];
  hiddenVoice?: HiddenVoice;
  doctrines: Doctrine[];
}

const witchModule: ParliamentModule = {
  presetId: "witch",
  emphasis: { inner_leader: 2, inner_cynic: 1 },
  methodSkins: [
    {
      label: "[ФАСАД]",
      targetId: "attr_composure",
      persona: {
        speechPattern: "clipped stage-direction of the body",
        blindSpot: "distance from her own feeling",
        coreDrive: "give the room nothing it did not earn",
      },
      cost: "success raises witch_blood_curse_pressure; sets flag_witch_somatic_exhaustion → next Façade DC higher",
    },
    {
      label: "[ЭСТЕТИКА]",
      targetId: "attr_poetics",
      persona: {
        speechPattern: "long, precise, almost hypnotic",
        coreDrive: "restore control through form",
        blindSpot: "dependence on sterile order",
      },
      cost: "in-character voice of applyRitualRelief: slow −pressure, no debt — clean but slow",
    },
    {
      label: "[ГРАЦИЯ]",
      targetId: "attr_agility",
      cost: "motor poise; brittleness when poise is all that is left",
    },
    {
      label: "Veil-Sight",
      targetId: "attr_spirit",
      cost: "occult thirst-sense; reading the veil tightens the hunger",
    },
  ],
  motiveSkins: [
    {
      label: "[ТРАДИЦИЯ]",
      targetId: "inner_leader",
      persona: {
        motto: "Каждому положено место; привилегия — это долг",
        coreDrive: "the House must outlive the person",
        blindSpot: "mistakes the inherited order for moral law",
        speechPattern: "measured, codex-like, appeals to precedent",
      },
      cost: "merges [ДОМ] + [ИЕРАРХИЯ]: dynastic loyalty + status/rank radar; reads people as ranks and obligations",
      supportText:
        "Имя держало этот город, когда рушились мосты. Встань так, чтобы Дому не пришлось краснеть.",
      opposeText:
        "Не разменивай столетие рода на минуту собственной слабости.",
    },
    {
      label: "[НЕЖНОСТЬ]",
      targetId: "inner_guide",
      persona: {
        coreDrive: "see the living thing behind the role",
        blindSpot: "dissolves boundaries; rescues people who did not ask",
      },
      cost: "sees pain, fear and unfreedom — sharpest with women, children, the defenseless; over-merges with them",
      supportText:
        "Посмотри, как она прячет руки. Ей страшно — подойди первой.",
      opposeText:
        "Не превращай чужую боль в довод. Ей нужна ты, а не твоя правота.",
    },
    {
      label: "[СУВЕРЕННОСТЬ]",
      targetId: "inner_cynic",
      persona: {
        coreDrive: "no one owns me — not a man, not the Bureau, not the name",
        blindSpot: "reads help as a leash, compromise as surrender",
      },
      cost: "guards dignity and the right to refuse; isolates her exactly when accepting help would be strength",
      supportText:
        "Откажись. Право сказать «нет» — последнее, что у тебя не отняли.",
      opposeText:
        "Не надевай поводок только потому, что его назвали помощью.",
    },
    {
      label: "[СТРАТЕГ]",
      targetId: "inner_manipulator",
      cost: "leverage accounting (was [МАКИАВЕЛЛИСТ]); erodes the capacity to trust",
      supportText:
        "У каждого в этой комнате есть цена. Узнай её раньше, чем назовут твою.",
      opposeText:
        "Не сжигай рычаг ради красивого жеста — сантименты долгов не возвращают.",
    },
    {
      label: "[ЧАРЫ]",
      targetId: "inner_exile",
      persona: {
        coreDrive:
          "one look can command, kindle or scorch — and she knows it",
        blindSpot:
          "reads desire as permission; escalation feels like the obvious tool",
        speechPattern: "velvet imperative; sensory, magnetic, faintly dangerous",
      },
      cost: "magnetism + witch-glamour as an outward instrument; intoxicated by her own effect — every scene tempts her to become a demonstration",
      supportText:
        "Один взгляд — и комната твоя. Зачем тратить слова на спор?",
      opposeText:
        "Не туши собственный свет. Серость тебя не спрячет — только съест.",
    },
    {
      label: "[СТЫД]",
      targetId: "inner_hermit",
      persona: {
        coreDrive: "name the harm before the excuse arrives",
        blindSpot:
          "swaps responsibility for self-hatred; at the extreme: 'you are already a monster, so stop resisting'",
      },
      cost: "hidden until first reveal (see hiddenVoice); three registers — social 'unseemly', moral 'you caused harm', monstrous 'look what you wanted'",
      supportText:
        "Назови вред своим именем — пока его не назвали за тебя другие.",
      opposeText:
        "Не путай расплату с искуплением. Ей нужна была ты, а не твоя казнь.",
    },
  ],
  modes: [
    {
      label: "[НАБАТ]",
      derivedFrom: "witch_blood_curse_pressure high",
      distorts:
        "motives read the room as betrayal: [ТРАДИЦИЯ] sees an assault on the House in a critique, [СУВЕРЕННОСТЬ] a leash in an offer of help, [СТРАТЕГ] a plot in a trade, [ЧАРЫ] an invitation to overwhelm",
      prose: "syntax shortens, sharpens, assumes the worst case",
    },
    {
      label: "[ИСТОЩЕНИЕ]",
      derivedFrom: "flag_witch_somatic_exhaustion + pressure",
      distorts:
        "degrades Façade quality: less fine diplomacy, more edge; facadeDC rises",
      prose: "sentences heavy, musicless, rarer, meaner",
    },
    {
      label: "[ГОЛОС ЖАЖДЫ]",
      derivedFrom:
        "witch_blood_curse_pressure at maximum / Tier 3 (the Thirst stays a VtM-style meter — colored options + compulsions, never a seated voice; this is its only voice-shaped leak)",
      distorts:
        "the curse briefly breaks into the parliament through [ЧАРЫ]: short bodily imperatives crowd out its velvet register",
      prose: "single-clause commands; senses narrow to pulse, warmth, throat",
    },
  ],
  hiddenVoice: {
    label: "[СТЫД]",
    sourceRole: "concealed_threat",
    targetId: "inner_hermit",
    revealFlagKey: "flag_witch_shame_revealed",
    revealTriggers: [
      "first significant harm she caused and rationalized (any register: social, moral, monstrous)",
      "failed attr_composure at high pressure in a crowded scene (the loud Masquerade break)",
      "accumulated feedings / step toward Tier 3",
    ],
    line: "Ты назвала это защитой. Назови теперь, чего это стоило ей — и кто платил.",
  },
  doctrines: [
    {
      title: "Положение обязывает",
      axisShift: { axis: "x", delta: 6 },
      amplifies: "inner_leader",
      mutes: "inner_manipulator",
    },
    {
      title: "Фамилия дороже правды",
      axisShift: { axis: "x", delta: 8 },
      amplifies: "inner_leader",
      mutes: "inner_hermit",
    },
    {
      title: "Никто не имеет права владеть мной",
      axisShift: { axis: "x", delta: -7 },
      amplifies: "inner_cynic",
      mutes: "inner_leader",
    },
    {
      title: "Помощь не создаёт долга",
      axisShift: { axis: "y", delta: 6 },
      amplifies: "inner_guide",
      mutes: "inner_cynic",
    },
    {
      title: "Любовь не даёт права распоряжаться",
      axisShift: { axis: "y", delta: 7 },
      amplifies: "inner_guide",
      mutes: "inner_leader",
    },
    {
      title: "Правда — роскошь безопасных",
      axisShift: { axis: "y", delta: -6 },
      amplifies: "inner_manipulator",
      mutes: "inner_hermit",
    },
    {
      title: "Вред требует ответа, не кары",
      axisShift: { axis: "approach", delta: 6 },
      amplifies: "inner_hermit",
      mutes: "inner_exile",
    },
  ],
};

const detectiveModule: ParliamentModule = {
  presetId: "detective",
  emphasis: { inner_analyst: 2, inner_cynic: 1 },
  methodSkins: [
    {
      label: "[ЛОГИКА]",
      targetId: "attr_logic",
      persona: {
        speechPattern: "dry, detached, faintly arrogant; percentages and chains",
        coreDrive: "every claim must survive the causal chain",
        blindSpot: "overfits to one line; underweights the human angle",
      },
      cost: "overfits to one line; underweights the human angle",
    },
    {
      label: "[ЭНЦИКЛОПЕДИЯ]",
      targetId: "attr_encyclopedia",
      persona: {
        speechPattern: "academic, pedantic, footnote-happy",
        coreDrive: "retrieve the stored fact before the room moves on",
      },
      cost: "knows the regiment, the year, the caliber — not what any of it felt like",
    },
    {
      label: "[ВЗГЛЯД]",
      targetId: "attr_perception",
      cost: "sees the tell and the insult — reads malice into noise",
    },
    {
      label: "[РЕКОНСТРУКЦИЯ]",
      targetId: "attr_forensics",
      persona: {
        speechPattern: "present-tense replay of the event, second person",
        coreDrive: "make the room confess its last five minutes",
      },
      cost: "in-character voice of Crime Scene Reconstruction; replays violence so vividly the player lives it twice",
    },
    {
      label: "[ИНТУИЦИЯ]",
      targetId: "attr_intuition",
      persona: {
        speechPattern: "clipped, half-mystic, no proofs offered",
        coreDrive: "the pattern is already recognized — language comes later",
      },
      cost: "insight without evidence; the bridge [ИЗНАНКА] uses to enter — cannot show its work",
    },
    {
      label: "[ЭМПАТИЯ]",
      targetId: "attr_empathy",
      cost: "the skill his flaw fights; using it costs his guard",
    },
  ],
  motiveSkins: [
    {
      label: "[МЕТОД]",
      targetId: "inner_analyst",
      persona: {
        motto: "Нерешённое невыносимо; задача — сама себе награда",
        coreDrive: "the unsolved is unbearable; the work is the reward",
        blindSpot: "people become variables; boredom is a wound",
        speechPattern: "calm, fast, three steps ahead",
      },
      cost: "was [АНАЛИТИК]; the efficient line ignores the cost paid by people; between cases the world is grey noise",
      supportText:
        "Вот оно, противоречие. Потяни за него — остальное подождёт.",
      opposeText:
        "Не бросай цепочку недоказанной. Оборванная нить вернётся за тобой.",
    },
    {
      label: "[СКЕПСИС]",
      targetId: "inner_cynic",
      persona: {
        coreDrive: "the too-smooth answer is the loudest clue",
        blindSpot: "in trigger-state alienates the honest; truth told well reads as rehearsed",
      },
      cost: "was [ЦИНИК]; situational, not constant — fires on smooth first answers, appeals to authority/sentiment, institutions covering their own; spends rapport he needed",
      supportText:
        "Слишком гладкий ответ. Первым лжёт тот, кто отвечает без паузы.",
      opposeText:
        "Не сжигай свидетеля недоверием — правда тоже умеет говорить складно.",
    },
    {
      label: "[ПРОВОКАТОР]",
      targetId: "inner_manipulator",
      persona: {
        coreDrive: "stage the experiment; the reaction is the evidence",
        blindSpot: "people are lab rats; ethics is someone else's variable",
      },
      cost: "Mentalist-style social experiments break cases and burn trust; wins the read, loses the room",
      supportText:
        "Подтолкни его. Реакция скажет больше, чем час вежливого допроса.",
      opposeText:
        "Не ставь опыт на человеке, который уже сказал тебе правду.",
    },
    {
      label: "[ИЗНАНКА]",
      targetId: "inner_exile",
      persona: {
        coreDrive: "hear what the evidence cannot say",
        blindSpot: "erodes the provable ground; the longer he listens, the less the daylight world holds",
        speechPattern: "fragmentary, liminal, addressed half to him, half to the room's residue",
      },
      cost: "the Occult Sleuth pull made a full voice; argues with [МЕТОД] over what counts as real",
      supportText:
        "Тише. Комната ещё помнит, что здесь случилось, — слушай её, а не их.",
      opposeText:
        "Не записывай в улики шёпот пустоты — потеряешь землю под ногами.",
    },
    {
      label: "[СВИДЕТЕЛЬ]",
      targetId: "inner_hermit",
      cost: "counter-voice; conscience; slow, unprofitable, keeps him honest and alone",
      supportText:
        "Сделай честно и медленно. Никто не увидит — этого достаточно.",
      opposeText:
        "Не закрывай дело ценой человека. Закрытое так не закрывается.",
    },
  ],
  modes: [
    {
      label: "[НЕДОВЕРИЕ]",
      derivedFrom: "flaw_cynic_mistrust flag + recent failed attr_empathy",
      distorts:
        "[СКЕПСИС] locks into trigger-state: every answer reads as a first lie; [ВЗГЛЯД] hunts deceit in cooperation; [ПРОВОКАТОР] escalates tests on people who already told the truth",
      prose: "clipped, interrogative, accusatory tempo",
    },
    {
      label: "[ТУННЕЛЬ]",
      derivedFrom:
        "an unresolved case contradiction (authored beat flag) + rising moral_stress",
      distorts:
        "the contradiction outranks danger, meals and people: [МЕТОД] speaks first and refuses to yield the floor; social cues grey out; [ЭМПАТИЯ] DCs rise",
      prose: "accelerating clause-chains, deaf to interruption; the room goes quiet on the page",
    },
    {
      label: "[ШТИЛЬ]",
      derivedFrom: "no open case thread / all leads closed (between-case lull)",
      distorts:
        "boredom as threat: [ПРОВОКАТОР] starts experiments on bystanders, [ИЗНАНКА] gets louder in the silence, risk-flavored options light up",
      prose: "long, listless sentences that snap awake only at the hint of an anomaly",
    },
  ],
  hiddenVoice: {
    label: "[ОДИНОЧЕСТВО]",
    sourceRole: "concealed_threat",
    revealTriggers: [
      "a witness alienated by mistrust who was telling the truth",
      "a case closed correctly but alone, no one left to tell",
      "a person who tried to know him, filed under 'solved'",
    ],
    line: "The footprint you kept finding was always your own, walking back out.",
  },
  doctrines: [
    {
      title: "Каждая ложь оставляет след",
      axisShift: { axis: "approach", delta: 6 },
      amplifies: "inner_analyst",
      mutes: "inner_guide",
    },
    {
      title: "Доверие — улика против тебя",
      axisShift: { axis: "x", delta: -8 },
      amplifies: "inner_cynic",
      mutes: "inner_guide",
    },
    {
      title: "Правда стоит того, чтобы остаться одному",
      axisShift: { axis: "y", delta: 6 },
      amplifies: "inner_hermit",
      mutes: "inner_cynic",
    },
    {
      title: "То, чего нельзя доказать, тоже оставляет след",
      axisShift: { axis: "approach", delta: -5 },
      amplifies: "inner_exile",
      mutes: "inner_analyst",
    },
    {
      title: "Призрак — это улика, которую ещё не прочли",
      axisShift: { axis: "approach", delta: 5 },
      amplifies: "inner_analyst",
      mutes: "inner_exile",
    },
    {
      title: "Люди — переменные в эксперименте",
      axisShift: { axis: "y", delta: -7 },
      amplifies: "inner_manipulator",
      mutes: "inner_hermit",
    },
  ],
};

const journalistModule: ParliamentModule = {
  presetId: "journalist",
  emphasis: { inner_manipulator: 2, inner_analyst: 1 },
  methodSkins: [
    {
      label: "[НЮХ]",
      targetId: "attr_encyclopedia",
      cost: "sees the story before the harm; files it anyway",
    },
    {
      label: "[ПЕРО]",
      targetId: "attr_deception",
      cost: "the angle that lands is rarely the fair one",
    },
    {
      label: "[ВЗГЛЯД]",
      targetId: "attr_perception",
      cost: "spots the mark; treats people as leads",
    },
  ],
  motiveSkins: [
    {
      label: "[ОХОТНИК]",
      targetId: "inner_manipulator",
      cost: "turns sources into tools before they speak",
      supportText:
        "Он не собеседник, он источник. Наведи прицел и дожми вопросом.",
      opposeText:
        "Не жги источник ради красного словца — охота длиннее одного номера.",
    },
    {
      label: "[ПРИСПОСОБЛЕНЕЦ]",
      targetId: "inner_adapter",
      cost: "rides the winning current; last on a collapsing story",
      supportText:
        "Чувствуешь, куда дует? Встань по ветру — герои тонут первыми.",
      opposeText:
        "Не держись за тонущую историю. Последним с неё сходит некролог.",
    },
  ],
  modes: [
    {
      label: "[АЗАРТ]",
      derivedFrom: "flaw_gambling_addiction surge (the dopamine wanting)",
      distorts:
        "high-variance options light up; the safe read greys in his own head before the room is read",
      prose: "fast, percussive, betting cadence (one more, the big one)",
    },
  ],
  hiddenVoice: {
    label: "[СЧЁТ]",
    sourceRole: "concealed_threat",
    revealTriggers: [
      "a source burned by a published lead",
      "a bet (literal or narrative) that cost someone who trusted him",
    ],
    line: "You always counted the scoop. Tonight, count what it stood on.",
  },
  doctrines: [
    {
      title: "Город красиво лжёт",
      axisShift: { axis: "approach", delta: 6 },
      amplifies: "inner_manipulator",
      mutes: "inner_guide",
    },
    {
      title: "Сенсация переживает источник",
      axisShift: { axis: "y", delta: -7 },
      amplifies: "inner_manipulator",
      mutes: "inner_hermit",
    },
    {
      title: "Следующая ставка отыграет всё",
      axisShift: { axis: "approach", delta: 8 },
      amplifies: "inner_adapter",
      mutes: "inner_analyst",
    },
  ],
};

const aristocratModule: ParliamentModule = {
  presetId: "aristocrat",
  emphasis: { inner_guide: 2, inner_manipulator: 1 },
  methodSkins: [
    {
      label: "[ФАСАД]",
      targetId: "attr_composure",
      cost: "holds the drawing room; distance from her own feeling",
    },
    {
      label: "[ЭСТЕТИКА]",
      targetId: "attr_poetics",
      cost: "restores control through form; dependence on sterile order",
    },
  ],
  motiveSkins: [
    {
      label: "[ИЕРАРХИЯ]",
      targetId: "inner_cynic",
      cost: "status radar; humiliates non-threats",
      supportText:
        "Сочти комнату: кто выше, кто ниже, кто притворяется. И стой на своей ступени.",
      opposeText:
        "Не кланяйся ниже положенного — в этих залах такого не прощают.",
    },
    {
      label: "[СТРАТЕГ]",
      targetId: "inner_manipulator",
      cost: "leverage accounting; erodes trust",
      supportText:
        "Услуга сейчас — вексель потом. Подпиши эту комнату на долги.",
      opposeText:
        "Не плати доверием там, где хватило бы расписки.",
    },
  ],
  modes: [
    {
      label: "[КЛЕТКА]",
      derivedFrom: "flaw_prideful_etiquette in a confined-space tag",
      distorts:
        "[ФАСАД] DC spikes; composure collapses; the radar turns inward and reads the walls as judges",
      prose: "breath-short, sentences that won't finish, the room closing",
    },
  ],
  hiddenVoice: {
    label: "[ИМЯ]",
    sourceRole: "concealed_threat",
    revealTriggers: [
      "a choice made for the family name against her own want",
      "a tight room where the Façade broke in front of equals",
    ],
    line: "You were never the heir. You were the room the name lives in.",
  },
  doctrines: [
    {
      title: "Манеры — это броня",
      axisShift: { axis: "approach", delta: -5 },
      amplifies: "inner_leader",
      mutes: "inner_cynic",
    },
    {
      title: "Имя обязывает, и потому правит",
      axisShift: { axis: "x", delta: 7 },
      amplifies: "inner_leader",
      mutes: "inner_exile",
    },
    {
      title: "Близость — это допуск, который можно отозвать",
      axisShift: { axis: "y", delta: -6 },
      amplifies: "inner_manipulator",
      mutes: "inner_guide",
    },
  ],
};

const veteranModule: ParliamentModule = {
  presetId: "veteran",
  emphasis: { inner_cynic: 2, inner_leader: 1 },
  methodSkins: [
    {
      label: "[ИНСТИНКТ]",
      targetId: "attr_perception",
      persona: {
        speechPattern: "terse sector-calls; rooms read as fields of fire",
        coreDrive: "danger clarifies — in-character voice of Combat Instinct",
      },
      cost: "reads the room as a field of fire; never off duty",
    },
    {
      label: "[ТЕЛО]",
      targetId: "attr_physical",
      cost: "endures anything; asks the body to pay for the silence",
    },
    {
      label: "[ФАНТОМНАЯ БОЛЬ]",
      targetId: "attr_endurance",
      persona: {
        speechPattern:
          "hoarse interoception; the war speaks as heat, sand, weight",
        blindSpot: "mistakes endurance for healing",
      },
      cost: "was [ВЫДЕРЖКА]; the body's war-memory speaks in pain — outlasts the bad minute, then bills him in phantom fire",
    },
    {
      label: "[ПРИЗРАК]",
      targetId: "attr_stealth",
      persona: {
        speechPattern: "whispered route-calls; light counted in steps",
        coreDrive: "move like a trained absence, not a man",
      },
      cost: "Hunter-track craft; the talent for vanishing works on relationships too",
    },
  ],
  motiveSkins: [
    {
      label: "[УСТАВ]",
      targetId: "inner_leader",
      persona: {
        motto: "Не позорь мундир — он на тебе один остался",
        coreDrive: "the oath outlives the war; duty is the last load-bearing wall",
        blindSpot: "cannot tell sacrifice from suicide; shame is its whip",
        speechPattern: "командный тон мёртвого командира; приказ, не довод",
      },
      cost: "the Superego in uniform: orders relieve guilt by replacing judgment; demands the mission even from a man with nothing left",
      supportText:
        "Приказ ясен: держать строй. Исполняй — вина подождёт отбоя.",
      opposeText:
        "С поста уходят по смене или в землю. Не позорь мундир.",
    },
    {
      label: "[ОПЕРАТИВНИК]",
      targetId: "inner_analyst",
      persona: {
        coreDrive:
          "broker the ceasefire between the oath and the animal — and keep the body alive meanwhile",
        blindSpot: "plans the feelings away; a person becomes a sector",
        speechPattern: "dry tactical assessment, numbered, no adjectives",
      },
      cost: "the Ego as field officer: turns grief, love and fear into logistics; the only voice all the others will still listen to",
      supportText:
        "Разбей на задачи: выход, укрытие, люди. Работаем по порядку.",
      opposeText:
        "Не пори горячку. Необдуманный рывок кладёт всё отделение.",
    },
    {
      label: "[ЧАСОВОЙ]",
      targetId: "inner_cynic",
      persona: {
        motto: "С поста меня никто не снимал",
        coreDrive: "see the ambush before the logic arrives",
        blindSpot: "cannot stand down; a trigger and a threat feel identical",
      },
      cost: "was [ВЫЖИВШИЙ]; hypervigilance as a person — sometimes spots the ambush first, sometimes builds one out of a door-creak",
      supportText:
        "Дверь скрипнула дважды. Это не сквозняк — проверь фланг.",
      opposeText:
        "Не верь тишине. Засаду готовят именно так.",
    },
    {
      label: "[ВЫЖИВАЛЬЩИК]",
      targetId: "inner_exile",
      persona: {
        coreDrive: "stay alive; everything else is decoration",
        blindSpot: "no morality, no time — the war is always now",
        speechPattern: "животный, хриплый, короткий; глотка, колено, темнота",
      },
      cost: "was [ОДИНОЧКА]; the Id off its leash keeps him alive and costs him everyone watching",
      supportText:
        "Глотка, колено, темнота. Бей первым — разбираться будем живыми.",
      opposeText:
        "Не геройствуй. Герои остаются там — выжившие выходят.",
    },
    {
      label: "[ТЕНЬ]",
      targetId: "inner_manipulator",
      persona: {
        coreDrive: "make him admit what he enjoyed",
        blindSpot:
          "calls every restraint a lie; cannot tell appetite from identity",
        speechPattern: "издевательский, соблазняющий, на 'ты'",
      },
      cost: "the Jungian Shadow: the repressed taste for power, fear and breakage that [УСТАВ] filed under 'orders'; open from scene one — his daily war",
      supportText:
        "Признайся: тебе понравится. У страха в их глазах знакомый вкус.",
      opposeText:
        "Только не строй из себя святого — мы оба помним, что ты делал по приказу. И без.",
    },
  ],
  modes: [
    {
      label: "[БУТЫЛКА]",
      derivedFrom: "flaw_battle_scar_trigger (alcohol relief loop)",
      distorts:
        "fast relief now (−stress), meaner cumulative cost next scene; patience drops, [ИНСТИНКТ] goes from sharp to jumpy, [ТЕНЬ] gets the floor more often",
      prose: "heavy, slurred-by-degrees, fewer words, longer silences",
    },
    {
      label: "[ПЕРЕДОВАЯ]",
      derivedFrom:
        "battle trigger (sharp sound/smell, AR-scan artifact) + flaw_battle_scar_trigger — the amygdala hijack",
      distorts:
        "the front bleeds into the present (AR layer distorts): [ВЫЖИВАЛЬЩИК] takes the wheel, [УСТАВ] shouts orders to dead men, [ОПЕРАТИВНИК] maps the room into sectors; civilians read as combatants",
      prose: "present-tense intrusions of the war; sand on the teeth; 'я' collapses into 'мы'",
    },
    {
      label: "[ТИШИНА]",
      derivedFrom: "no active threat + low-stimulation scene tags (the lull)",
      distorts:
        "silence reads as ambush-prep: [ЧАСОВОЙ] louder, the pull of [БУТЫЛКА] rises, [ТЕНЬ] whispers in the quiet; rooms described by their exits",
      prose: "short sentences, long pauses; the calm itemized like a threat",
    },
  ],
  hiddenVoice: {
    label: "[НЕ ВЫНЕС]",
    sourceRole: "concealed_threat",
    revealTriggers: [
      "a scene where someone under his protection is lost",
      "sobriety held through a beat where the bottle was offered",
      "being publicly thanked or celebrated as a hero in front of witnesses",
    ],
    line: "Danger never clarified you. It just drowned out the names you couldn't carry.",
  },
  doctrines: [
    {
      title: "Опасность — это ясность",
      axisShift: { axis: "approach", delta: 7 },
      amplifies: "inner_cynic",
      mutes: "inner_guide",
    },
    {
      title: "Тишина опаснее боя",
      axisShift: { axis: "x", delta: -6 },
      amplifies: "inner_exile",
      mutes: "inner_leader",
    },
    {
      title: "Кто выжил — тот и виноват",
      axisShift: { axis: "y", delta: 5 },
      amplifies: "inner_hermit",
      mutes: "inner_cynic",
    },
    {
      title: "Приказ снимает вину",
      axisShift: { axis: "x", delta: 7 },
      amplifies: "inner_leader",
      mutes: "inner_hermit",
    },
    {
      title: "Сломанное во мне — тоже оружие",
      axisShift: { axis: "y", delta: -6 },
      amplifies: "inner_manipulator",
      mutes: "inner_hermit",
    },
    {
      title: "Строй держат люди, а не устав",
      axisShift: { axis: "y", delta: 6 },
      amplifies: "inner_guide",
      mutes: "inner_exile",
    },
  ],
};

const archivistModule: ParliamentModule = {
  presetId: "archivist",
  emphasis: { inner_analyst: 3, inner_hermit: 1 },
  methodSkins: [
    {
      label: "[ИНДЕКС]",
      targetId: "attr_encyclopedia",
      cost: "aligns every record; mistakes completeness for understanding",
    },
    {
      label: "[ЛОГИКА]",
      targetId: "attr_logic",
      cost: "the pattern is real; the urgency it ignores is also real",
    },
  ],
  motiveSkins: [
    {
      label: "[АНАЛИТИК]",
      targetId: "inner_analyst",
      cost: "the efficient line; people are entries",
      supportText:
        "Сначала опись, потом чувства. Разложи факты — пробел подсветится сам.",
      opposeText:
        "Не верь выводу без описи. Одна непроверенная ссылка рушит весь свод.",
    },
    {
      label: "[ОТШЕЛЬНИК]",
      targetId: "inner_hermit",
      cost: "counter-voice; least harm, ask little — but also: hide in the stacks",
      supportText:
        "Тише. Помочь можно, не входя в комнату, — оставь нужную страницу открытой.",
      opposeText:
        "Не прячься в хранилище. Эта полка не заменит человека за дверью.",
    },
  ],
  modes: [
    {
      label: "[КОМПУЛЬСИЯ]",
      derivedFrom: "flaw_obsessive_archivist (a missing document)",
      distorts:
        "a gap in the record becomes a private emergency that overrides danger, urgency, and the social room; [ИНДЕКС] will not let the scene move",
      prose: "precise, accelerating, list-like, deaf to interruption",
    },
  ],
  hiddenVoice: {
    label: "[ПУСТАЯ ПОЛКА]",
    sourceRole: "concealed_threat",
    revealTriggers: [
      "an archive completed while a living thing went unattended",
      "a gap she finally let stay open",
    ],
    line: "You were never indexing the truth. You were filing the place a person used to be.",
  },
  doctrines: [
    {
      title: "Пробел в записи — это преступление",
      axisShift: { axis: "approach", delta: 7 },
      amplifies: "inner_analyst",
      mutes: "inner_guide",
    },
    {
      title: "Полнота важнее последствий",
      axisShift: { axis: "y", delta: -6 },
      amplifies: "inner_analyst",
      mutes: "inner_hermit",
    },
    {
      title: "В архиве безопаснее, чем в комнате",
      axisShift: { axis: "x", delta: -7 },
      amplifies: "inner_hermit",
      mutes: "inner_leader",
    },
  ],
};

export const PARLIAMENT_MODULES: Record<string, ParliamentModule> = {
  witch: witchModule,
  detective: detectiveModule,
  journalist: journalistModule,
  aristocrat: aristocratModule,
  veteran: veteranModule,
  archivist: archivistModule,
};

/**
 * Track-level preset ids that resolve to an origin module. `parliamentPresetId`
 * on a track (e.g. `journalist_cityroom`) maps here so the skin layer still
 * resolves when a track preset is active.
 */
export const PARLIAMENT_PRESET_ALIASES: Record<string, string> = {
  journalist_cityroom: "journalist",
};

const resolvePresetId = (presetId: string): string =>
  PARLIAMENT_PRESET_ALIASES[presetId] ?? presetId;

export const getParliamentModule = (
  presetId: string | undefined,
): ParliamentModule | null => {
  if (!presetId) {
    return null;
  }
  return PARLIAMENT_MODULES[resolvePresetId(presetId)] ?? null;
};

/**
 * The skin for a given voice within a preset, if any. Honors two-layer purity:
 * an `attr_*` id only matches `methodSkins`, an `inner_*` id only `motiveSkins`.
 */
export const getVoiceSkin = (
  presetId: string | undefined,
  voiceId: string,
): VoiceSkin | null => {
  const mod = getParliamentModule(presetId);
  if (!mod) {
    return null;
  }
  const pool = isSkillVoiceId(voiceId)
    ? mod.methodSkins
    : isInnerVoiceId(voiceId)
      ? mod.motiveSkins
      : null;
  if (!pool) {
    return null;
  }
  return pool.find((skin) => skin.targetId === voiceId) ?? null;
};
