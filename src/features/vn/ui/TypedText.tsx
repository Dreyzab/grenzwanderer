import {
  forwardRef,
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
import "./TypedText.css";

/** Sentence-final punctuation gets the longest dwell; clause breaks a shorter one. */
const SENTENCE_END_CHARS = new Set([".", "!", "?", "…"]);
const CLAUSE_BREAK_CHARS = new Set([",", ";", ":", "—", "–"]);

const pauseMultiplierFor = (char: string): number => {
  if (SENTENCE_END_CHARS.has(char)) {
    return 16;
  }
  if (CLAUSE_BREAK_CHARS.has(char)) {
    return 7;
  }
  return 1;
};

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

const getVisibleSegments = (
  segments: ParsedTypedSegment[],
  visibleChars: number,
): ParsedTypedSegment[] => {
  if (visibleChars <= 0) {
    return [];
  }

  let remaining = visibleChars;
  const output: ParsedTypedSegment[] = [];

  for (const segment of segments) {
    if (remaining <= 0) {
      break;
    }

    const visibleText = segment.text.slice(0, remaining);
    if (visibleText.length === 0) {
      continue;
    }

    if (segment.kind === "token") {
      const token = {
        ...segment.token,
        text: visibleText,
      };

      output.push({
        kind: "token",
        text: visibleText,
        token,
      });
    } else {
      output.push({
        kind: "text",
        text: visibleText,
        bold: segment.bold,
        italic: segment.italic,
      });
    }

    remaining -= visibleText.length;
  }

  return output;
};

export const TypedText = forwardRef<TypedTextHandle, TypedTextProps>(
  (
    {
      text,
      speed = 12,
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
    const [visibleChars, setVisibleChars] = useState(0);
    const completionNotifiedRef = useRef(false);
    const prefersReducedMotion = useReducedMotion();

    const segments = useMemo(() => parseTypedTextMarkup(text), [text]);
    const fullText = useMemo(
      () => segments.map((segment) => segment.text).join(""),
      [segments],
    );
    const totalChars = fullText.length;

    const frameDelay = Math.max(1, speed);
    /** Reduced-motion users see the full line at once (no typewriter). */
    const skipAnimation = instant || Boolean(prefersReducedMotion);

    useEffect(() => {
      completionNotifiedRef.current = false;
      setVisibleChars(skipAnimation ? totalChars : 0);
    }, [skipAnimation, text, totalChars]);

    useEffect(() => {
      const isTyping = visibleChars < totalChars;
      onTypingChange?.(isTyping);

      if (instant) {
        return;
      }
      if (!isTyping && !completionNotifiedRef.current) {
        completionNotifiedRef.current = true;
        onComplete?.();
      }
    }, [instant, onComplete, onTypingChange, totalChars, visibleChars]);

    useEffect(() => {
      if (skipAnimation) {
        return;
      }
      if (visibleChars >= totalChars) {
        return;
      }

      let rafId = 0;
      let lastTimestamp = 0;

      // Dwell longer after the previously revealed char if it ended a clause/sentence.
      const previousChar = fullText[visibleChars - 1] ?? "";
      const isDwelling = pauseMultiplierFor(previousChar) > 1;
      const requiredDelay = frameDelay * pauseMultiplierFor(previousChar);

      const tick = (timestamp: number) => {
        if (lastTimestamp === 0) {
          lastTimestamp = timestamp;
        }

        const elapsed = timestamp - lastTimestamp;
        if (elapsed >= requiredDelay) {
          // After a dwell, reveal a single char so the next pause is honoured;
          // otherwise batch to recover from dropped frames.
          const advanceBy = isDwelling
            ? 1
            : Math.max(1, Math.floor(elapsed / frameDelay));
          setVisibleChars((previous) =>
            Math.min(totalChars, previous + advanceBy),
          );
          lastTimestamp = timestamp;
        }

        rafId = requestAnimationFrame(tick);
      };

      rafId = requestAnimationFrame(tick);
      return () => {
        cancelAnimationFrame(rafId);
      };
    }, [skipAnimation, frameDelay, fullText, totalChars, visibleChars]);

    useImperativeHandle(
      ref,
      () => ({
        finish: () => {
          setVisibleChars(totalChars);
        },
      }),
      [totalChars],
    );

    const visibleSegments = useMemo(
      () => getVisibleSegments(segments, visibleChars),
      [segments, visibleChars],
    );

    const isTyping = visibleChars < totalChars;
    const tokensInteractive = !isTyping;

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

    return (
      <p className="vn-typed-text" aria-live="polite">
        {visibleSegments.map((segment, index) => {
          const key = `${segment.kind}-${index}`;
          if (segment.kind === "token") {
            const tokenState = supportsStudiedState(segment.token)
              ? tokenStateByPayload?.[segment.token.payload.trim()]
              : undefined;
            const tokenInteractive = tokensInteractive && !tokenState;

            return (
              <span
                key={`${key}-${segment.token.key}`}
                className={[
                  "vn-typed-text__token",
                  tokenInteractive ? "is-interactive" : "is-static",
                  !tokensInteractive ? "is-typing" : "",
                  tokenState === "recording" ? "is-recording" : "",
                  tokenState === "studied" ? "is-studied" : "",
                ].join(" ")}
                data-vn-payload={segment.token.payload}
                data-vn-token-state={tokenState}
                data-vn-token-type={segment.token.type}
                role={tokenInteractive ? "button" : undefined}
                tabIndex={tokenInteractive ? 0 : undefined}
                onClick={(event) => {
                  if (!tokenInteractive) {
                    return;
                  }
                  event.stopPropagation();
                  onTokenClick?.(segment.token, event);
                }}
                onKeyDown={(event) => handleTokenKeyDown(segment.token, event)}
                onMouseEnter={(event) => {
                  if (!tokenInteractive) {
                    return;
                  }
                  onTokenEnter?.(segment.token, event);
                }}
                onMouseLeave={(event) => {
                  if (!tokenInteractive) {
                    return;
                  }
                  onTokenLeave?.(segment.token, event);
                }}
              >
                {segment.text}
              </span>
            );
          }

          let content: ReactNode = segment.text;
          if (segment.italic) {
            content = <em className="vn-typed-text__em">{content}</em>;
          }
          if (segment.bold) {
            content = (
              <strong className="vn-typed-text__strong">{content}</strong>
            );
          }
          return <span key={key}>{content}</span>;
        })}
        {isTyping ? (
          <span className="vn-typed-text__cursor" aria-hidden />
        ) : null}
      </p>
    );
  },
);

TypedText.displayName = "TypedText";
