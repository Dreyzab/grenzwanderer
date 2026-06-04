// Quick intent verbs for the DM action / NPC event inputs. Clicking a chip
// appends its phrase prefix so the player can finish the sentence with one tap.

export interface IntentVerb {
  id: string;
  label: string;
  phrase: string;
}

export const INTENT_VERBS: readonly IntentVerb[] = [
  { id: "ask", label: "Спросить", phrase: "Спрашиваю: " },
  { id: "press", label: "Надавить", phrase: "Давлю на собеседника: " },
  { id: "lie", label: "Солгать", phrase: "Лгу: " },
  { id: "search", label: "Обыскать", phrase: "Обыскиваю " },
  { id: "threaten", label: "Угрожать", phrase: "Угрожаю: " },
  { id: "comfort", label: "Утешить", phrase: "Мягко успокаиваю: " },
  { id: "leave", label: "Уйти", phrase: "Ухожу из сцены." },
];

export const appendIntent = (current: string, phrase: string): string => {
  const base = current.trimEnd();
  if (base.length === 0) {
    return phrase;
  }
  return `${base} ${phrase}`;
};
