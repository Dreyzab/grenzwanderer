const CYRILLIC_RE = /[\u0400-\u04FF]/u;

export const hasCyrillicText = (text: string): boolean =>
  CYRILLIC_RE.test(text);

/**
 * Recover text when UTF-8 bytes were misread as ISO-8859-1 Latin-1 octets (mojibake like Ð£…).
 */
export function decodeUtf8MisinterpretedAsByteLatin1(text: string): string {
  const bytes = new Uint8Array(text.length);
  for (let i = 0; i < text.length; i += 1) {
    bytes[i] = text.charCodeAt(i) & 0xff;
  }

  try {
    return new TextDecoder("utf-8", { fatal: true }).decode(bytes);
  } catch {
    return text;
  }
}

export function fixRuMojibakeIfNeeded(language: string, text: string): string {
  if (language !== "ru" || text.length === 0 || hasCyrillicText(text)) {
    return text;
  }

  const decoded = decodeUtf8MisinterpretedAsByteLatin1(text);
  if (decoded !== text && hasCyrillicText(decoded)) {
    return decoded;
  }

  return text;
}

export function fixDeMojibakeIfNeeded(language: string, text: string): string {
  if (language !== "de" || text.length === 0 || !/\u00c3/.test(text)) {
    return text;
  }

  const decoded = decodeUtf8MisinterpretedAsByteLatin1(text);
  if (decoded !== text && !decoded.includes("\uFFFD")) {
    return decoded;
  }

  return text;
}

/** Russian-looking mojibake inside any locale pack (e.g. `Русский` in `de.json`). */
const tryDecodeRuMojibakePrefix = (text: string): string => {
  if (text.length === 0 || hasCyrillicText(text)) {
    return text;
  }
  if (!/\u00d0|\u00d1/.test(text)) {
    return text;
  }
  const decoded = decodeUtf8MisinterpretedAsByteLatin1(text);
  if (
    decoded !== text &&
    hasCyrillicText(decoded) &&
    !decoded.includes("\uFFFD")
  ) {
    return decoded;
  }
  return text;
};

/**
 * Conservative repair on dictionary merge paths. Does not fix mixed UTF‑8 + punctuation
 * mojibake in `de.json` (restore those strings from authoring or re‑export UTF‑8).
 */
export function repairI18nSectionString(
  language: string,
  text: string,
): string {
  let t = tryDecodeRuMojibakePrefix(text);

  if (language === "ru") {
    t = fixRuMojibakeIfNeeded("ru", t);
  } else if (language === "de") {
    t = fixDeMojibakeIfNeeded("de", t);
  }

  return t;
}

export function repairMojibakeForUiLanguage(
  language: string,
  text: string,
): string {
  if (language !== "ru" && language !== "de") {
    return text;
  }
  return repairI18nSectionString(language, text);
}
