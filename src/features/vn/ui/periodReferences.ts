// Period reference library: famous artworks and expressions of the era, used to
// steer generation toward the gas-lit late-19th-century / gothic alt-history tone.
// `hint` strings are folded into AI prompts (no contract change). Curated, editable.

export interface PeriodPainting {
  id: string;
  title: string;
  artist: string;
  year: string;
  // Visual / tonal language to steer scene + narration toward this reference.
  hint: string;
}

export const PERIOD_PAINTINGS: readonly PeriodPainting[] = [
  {
    id: "friedrich_fog",
    title: "Странник над морем тумана",
    artist: "Каспар Давид Фридрих",
    year: "1818",
    hint: "романтическая возвышенность, фигура спиной к зрителю над морем тумана, одиночество, холодный свет, бесконечная даль",
  },
  {
    id: "friedrich_abbey",
    title: "Аббатство в дубовом лесу",
    artist: "Каспар Давид Фридрих",
    year: "1810",
    hint: "готическая руина в голых дубах, погребальная процессия, серый сумрак, тлен и святость рядом",
  },
  {
    id: "bocklin_isle",
    title: "Остров мёртвых",
    artist: "Арнольд Бёклин",
    year: "1880",
    hint: "погребальная тишина, кипарисы, белая фигура в лодке, неподвижная вода, предчувствие смерти",
  },
  {
    id: "menzel_mill",
    title: "Железопрокатный завод",
    artist: "Адольф фон Менцель",
    year: "1875",
    hint: "индустриальный реализм, копоть и жар, рабочие у раскалённого металла, дым, тяжёлый труд",
  },
  {
    id: "grimshaw_gaslight",
    title: "Отражения на мокрой мостовой",
    artist: "Джон Аткинсон Гримшоу",
    year: "1880",
    hint: "газовый свет на мокрых улицах ночного города, отражения фонарей, туман, силуэты, влажный блеск",
  },
  {
    id: "dore_city",
    title: "Гравюры ночного города",
    artist: "Гюстав Доре",
    year: "1872",
    hint: "теснящиеся тёмные улицы, гравюрная штриховка, толпа и тени, нищета и величие города",
  },
  {
    id: "stuck_sin",
    title: "Грех",
    artist: "Франц фон Штук",
    year: "1893",
    hint: "символистская угроза, тёмная чувственность, змей в полумраке, тяжёлая золочёная рама, соблазн и опасность",
  },
  {
    id: "hammershoi_interior",
    title: "Тихий интерьер",
    artist: "Вильгельм Хаммерсхёй",
    year: "1900",
    hint: "приглушённый одинокий интерьер, серая палитра, пустая комната, фигура у окна, меланхоличная тишина",
  },
];

export interface PeriodExpression {
  id: string;
  text: string;
}

export const PERIOD_EXPRESSIONS: readonly PeriodExpression[] = [
  { id: "suum", text: "Каждому своё." },
  { id: "walls", text: "У стен есть уши." },
  { id: "details", text: "Дьявол кроется в деталях." },
  { id: "debt", text: "Долг платежом красен." },
  { id: "gold", text: "Не всё то золото, что блестит." },
  { id: "music", text: "Кто платит, тот и заказывает музыку." },
  { id: "fate", text: "Чему быть, того не миновать." },
  { id: "word", text: "Слово не воробей: вылетит — не поймаешь." },
  { id: "honor", text: "Честь дороже жизни." },
  { id: "time", text: "Время не ждёт." },
];

const PAINTING_BY_ID = new Map(PERIOD_PAINTINGS.map((p) => [p.id, p]));

export const getPaintingById = (id: string | null): PeriodPainting | null =>
  id ? (PAINTING_BY_ID.get(id) ?? null) : null;

export const paintingStyleNote = (painting: PeriodPainting): string =>
  `[Референс эпохи — выдержи тон и образность в духе картины «${painting.title}» (${painting.artist}, ${painting.year}): ${painting.hint}]`;
