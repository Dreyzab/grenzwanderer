import {
  forwardRef,
  Fragment,
  useContext,
  useEffect,
  useImperativeHandle,
  useMemo,
  useRef,
  useState,
  type KeyboardEvent,
  type MouseEvent,
  type ReactNode,
} from "react";
import { useReducedMotion } from "framer-motion";
import {
  parseTypedTextMarkup,
  type ParsedTypedSegment,
  type ParsedTypedToken,
} from "./TypedTextParser";
import { VnTextSpeedContext } from "./VnTextSpeedContext";
import "./TypedText.css";

/** Sentence-final punctuation dwells the longest; clause breaks pause a touch. */
const SENTENCE_END_CHARS = new Set([".", "!", "?", "…"]);
const CLAUSE_BREAK_CHARS = new Set([",", ";", ":", "—", "–"]);

/** Extra pause (ms) held after revealing a word that closes a sentence/clause. */
const SENTENCE_DWELL_MS = 220;
const CLAUSE_DWELL_MS = 90;
/**
 * Per-character cadence (at the default speed of 12) used to pace word reveals.
 * Deliberately snappier than legacy char-typing so words flow in and their
 * ~260ms fades overlap across several words — the Disco-Elysium "feed" cadence —
 * instead of dripping one fully-settled word at a time.
 */
const WORD_MS_PER_CHAR_AT_DEFAULT = 5;
/** Floor/ceiling on the per-word base delay so very short/long words still read well. */
const MIN_WORD_MS = 18;
const MAX_WORD_MS = 220;

export interface TypedTextHandle {
  finish: () => void;
}

export type TypedTextTokenHandler = (
  token: ParsedTypedToken,
  event: MouseEvent<HTMLSpanElement>,
) => void;

export type TypedTextTokenState = "recording" | "studied";

export interface TypedTextProps {
  text: string;
  speed?: number;
  /** Full text immediately, same layout as typed mode (no RAF, cursor, or `onComplete`). */
  instant?: boolean;
  tokenStateByPayload?: Readonly<Record<string, TypedTextTokenState>>;
  onComplete?: () => void;
  onTokenClick?: TypedTextTokenHandler;
  onTokenEnter?: TypedTextTokenHandler;
  onTokenLeave?: TypedTextTokenHandler;
  onTypingChange?: (isTyping: boolean) => void;
}

const supportsStudiedState = (token: ParsedTypedToken): boolean =>
  token.type === "fact" || token.type === "lead";

/**
 * A single reveal step. Plain words carry their surrounding whitespace as bare
 * strings (`leading`/`trailing`) so wrapping still breaks between words; tokens
 * stay whole (their highlight should never split mid-phrase).
 */
type RevealUnit =
  | {
      kind: "word";
      key: string;
      leading: string;
      core: string;
      trailing: string;
      bold?: boolean;
      italic?: boolean;
    }
  | { kind: "token"; key: string; token: ParsedTypedToken };

/** Splits a text run into `<leading ws><word><trailing ws>` pieces, preserving every char. */
const splitWords = (
  text: string,
): Array<{ leading: string; core: string; trailing: string }> => {
  const pieces = text.match(/\s*\S+\s*/g);
  if (!pieces) {
    return [];
  }
  return pieces.map((piece) => {
    const match = /^(\s*)(\S+)(\s*)$/.exec(piece);
    return {
      leading: match?.[1] ?? "",
      core: match?.[2] ?? piece,
      trailing: match?.[3] ?? "",
    };
  });
};

const buildRevealUnits = (segments: ParsedTypedSegment[]): RevealUnit[] => {
  const units: RevealUnit[] = [];
  let index = 0;

  const appendTrailingToPrevious = (whitespace: string): boolean => {
    const last = units[units.length - 1];
    if (last?.kind === "word") {
      last.trailing += whitespace;
      return true;
    }
    return false;
  };

  for (const segment of segments) {
    if (segment.kind === "token") {
      units.push({ kind: "token", key: `u${index++}`, token: segment.token });
      continue;
    }

    const words = splitWords(segment.text);
    if (words.length === 0) {
      // Whitespace-only run: fold it into the previous word so it isn't its own beat.
      if (segment.text && !appendTrailingToPrevious(segment.text)) {
        units.push({
          kind: "word",
          key: `u${index++}`,
          leading: "",
          core: "",
          trailing: segment.text,
        });
      }
      continue;
    }

    for (const word of words) {
      units.push({
        kind: "word",
        key: `u${index++}`,
        leading: word.leading,
        core: word.core,
        trailing: word.trailing,
        bold: segment.bold,
        italic: segment.italic,
      });
    }
  }

  return units;
};

export const TypedText = forwardRef<TypedTextHandle, TypedTextProps>(
  (
    {
      text,
      speed,
      instant = false,
      tokenStateByPayload,
      onComplete,
      onTokenClick,
      onTokenEnter,
      onTokenLeave,
      onTypingChange,
    },
    ref,
  ) => {
    const [visibleUnits, setVisibleUnits] = useState(0);
    const completionNotifiedRef = useRef(false);
    const prefersReducedMotion = useReducedMotion();
    // Explicit props win; otherwise fall back to the reader's pacing preference.
    const speedPreference = useContext(VnTextSpeedContext);
    const resolvedSpeed = speed ?? speedPreference.speed;
    const resolvedInstant = instant || speedPreference.instant;

    const segments = useMemo(() => parseTypedTextMarkup(text), [text]);
    const units = useMemo(() => buildRevealUnits(segments), [segments]);
    const totalUnits = units.length;

    const frameDelay = Math.max(1, resolvedSpeed);
    /** Reduced-motion users see the full line at once (no word-by-word reveal). */
    const skipAnimation = resolvedInstant || Boolean(prefersReducedMotion);

    useEffect(() => {
      completionNotifiedRef.current = false;
      setVisibleUnits(skipAnimation ? totalUnits : 0);
    }, [skipAnimation, text, totalUnits]);

    useEffect(() => {
      const isTyping = visibleUnits < totalUnits;
      onTypingChange?.(isTyping);

      if (instant) {
        return;
      }
      if (!isTyping && !completionNotifiedRef.current) {
        completionNotifiedRef.current = true;
        onComplete?.();
      }
    }, [instant, onComplete, onTypingChange, totalUnits, visibleUnits]);

    useEffect(() => {
      if (skipAnimation) {
        return;
      }
      if (visibleUnits >= totalUnits) {
        return;
      }

      // Dwell before the NEXT word, paced by the word just revealed: longer words
      // take longer to "read", and clause/sentence punctuation adds a held pause.
      const previous = units[visibleUnits - 1];
      let requiredDelay = 0;
      if (previous) {
        const core =
          previous.kind === "token" ? previous.token.text : previous.core;
        const msPerChar = (frameDelay / 12) * WORD_MS_PER_CHAR_AT_DEFAULT;
        const base = Math.min(
          MAX_WORD_MS,
          Math.max(MIN_WORD_MS, msPerChar * Math.max(1, core.length)),
        );
        const lastChar = core.slice(-1);
        const dwell = SENTENCE_END_CHARS.has(lastChar)
          ? SENTENCE_DWELL_MS
          : CLAUSE_BREAK_CHARS.has(lastChar)
            ? CLAUSE_DWELL_MS
            : 0;
        requiredDelay = base + dwell;
      }

      let rafId = 0;
      let lastTimestamp = 0;

      const tick = (timestamp: number) => {
        if (lastTimestamp === 0) {
          lastTimestamp = timestamp;
        }
        if (timestamp - lastTimestamp >= requiredDelay) {
          setVisibleUnits((current) => Math.min(totalUnits, current + 1));
          return;
        }
        rafId = requestAnimationFrame(tick);
      };

      rafId = requestAnimationFrame(tick);
      return () => {
        cancelAnimationFrame(rafId);
      };
    }, [skipAnimation, frameDelay, units, totalUnits, visibleUnits]);

    useImperativeHandle(
      ref,
      () => ({
        finish: () => {
          setVisibleUnits(totalUnits);
        },
      }),
      [totalUnits],
    );

    const isTyping = visibleUnits < totalUnits;
    const tokensInteractive = !isTyping;
    /**
     * While typing we render per-word spans so each word can fade in. Once the
     * line has settled we collapse to one span per segment — leaner DOM, and it
     * keeps historical/instant entries (and `getByText`) free of word splitting.
     */
    const renderCollapsed = skipAnimation || !isTyping;

    const handleTokenKeyDown = (
      token: ParsedTypedToken,
      event: KeyboardEvent<HTMLSpanElement>,
    ) => {
      const tokenState = supportsStudiedState(token)
        ? tokenStateByPayload?.[token.payload.trim()]
        : undefined;
      if (!tokensInteractive || tokenState) {
        return;
      }

      if (event.key !== "Enter" && event.key !== " ") {
        return;
      }

      event.preventDefault();
      event.stopPropagation();
      onTokenClick?.(token, event as unknown as MouseEvent<HTMLSpanElement>);
    };

    const renderToken = (token: ParsedTypedToken, key: string): ReactNode => {
      const tokenState = supportsStudiedState(token)
        ? tokenStateByPayload?.[token.payload.trim()]
        : undefined;
      const tokenInteractive = tokensInteractive && !tokenState;

      return (
        <span
          key={key}
          className={[
            "vn-typed-text__token",
            tokenInteractive ? "is-interactive" : "is-static",
            !tokensInteractive ? "is-typing" : "",
            tokenState === "recording" ? "is-recording" : "",
            tokenState === "studied" ? "is-studied" : "",
          ].join(" ")}
          data-vn-payload={token.payload}
          data-vn-token-state={tokenState}
          data-vn-token-type={token.type}
          role={tokenInteractive ? "button" : undefined}
          tabIndex={tokenInteractive ? 0 : undefined}
          onClick={(event) => {
            if (!tokenInteractive) {
              return;
            }
            event.stopPropagation();
            onTokenClick?.(token, event);
          }}
          onKeyDown={(event) => handleTokenKeyDown(token, event)}
          onMouseEnter={(event) => {
            if (!tokenInteractive) {
              return;
            }
            onTokenEnter?.(token, event);
          }}
          onMouseLeave={(event) => {
            if (!tokenInteractive) {
              return;
            }
            onTokenLeave?.(token, event);
          }}
        >
          {token.text}
        </span>
      );
    };

    const withEmphasis = (
      content: ReactNode,
      bold?: boolean,
      italic?: boolean,
    ): ReactNode => {
      let node = content;
      if (italic) {
        node = <em className="vn-typed-text__em">{node}</em>;
      }
      if (bold) {
        node = <strong className="vn-typed-text__strong">{node}</strong>;
      }
      return node;
    };

    const body = renderCollapsed
      ? segments.map((segment, index) => {
          const key = `seg-${index}`;
          if (segment.kind === "token") {
            return renderToken(segment.token, `${key}-${segment.token.key}`);
          }
          return (
            <span key={key}>
              {withEmphasis(segment.text, segment.bold, segment.italic)}
            </span>
          );
        })
      : units.slice(0, visibleUnits).map((unit) => {
          if (unit.kind === "token") {
            return (
              <Fragment key={unit.key}>
                <span className="vn-typed-text__word">
                  {renderToken(unit.token, `${unit.key}-tok`)}
                </span>
              </Fragment>
            );
          }
          return (
            <Fragment key={unit.key}>
              {unit.leading}
              {unit.core ? (
                <span className="vn-typed-text__word">
                  {withEmphasis(unit.core, unit.bold, unit.italic)}
                </span>
              ) : null}
              {unit.trailing}
            </Fragment>
          );
        });

    return (
      // aria-busy holds AT announcements while words stream in, then reads the
      // settled line once — no per-word chatter, and no duplicate text node.
      <p
        className="vn-typed-text"
        aria-live="polite"
        aria-busy={isTyping ? "true" : undefined}
      >
        {body}
        {isTyping ? (
          <span className="vn-typed-text__cursor" aria-hidden />
        ) : null}
      </p>
    );
  },
);

TypedText.displayName = "TypedText";
