import {
  forwardRef,
  useEffect,
  useImperativeHandle,
  useMemo,
  useRef,
  useState,
  type KeyboardEvent,
  type MouseEvent,
} from "react";
import {
  parseTypedTextMarkup,
  type ParsedTypedSegment,
  type ParsedTypedToken,
} from "./TypedTextParser";
import "./TypedText.css";

export interface TypedTextHandle {
  finish: () => void;
}

export type TypedTextTokenHandler = (
  token: ParsedTypedToken,
  event: MouseEvent<HTMLSpanElement>,
) => void;

export interface TypedTextProps {
  text: string;
  speed?: number;
  /** Full text immediately, same layout as typed mode (no RAF, cursor, or `onComplete`). */
  instant?: boolean;
  onComplete?: () => void;
  onTokenClick?: TypedTextTokenHandler;
  onTokenEnter?: TypedTextTokenHandler;
  onTokenLeave?: TypedTextTokenHandler;
  onTypingChange?: (isTyping: boolean) => void;
}

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

    const segments = useMemo(() => parseTypedTextMarkup(text), [text]);
    const totalChars = useMemo(
      () => segments.reduce((sum, segment) => sum + segment.text.length, 0),
      [segments],
    );

    const frameDelay = Math.max(1, speed);

    useEffect(() => {
      completionNotifiedRef.current = false;
      setVisibleChars(instant ? totalChars : 0);
    }, [instant, text, totalChars]);

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
      if (instant) {
        return;
      }
      if (visibleChars >= totalChars) {
        return;
      }

      let rafId = 0;
      let lastTimestamp = 0;

      const tick = (timestamp: number) => {
        if (lastTimestamp === 0) {
          lastTimestamp = timestamp;
        }

        const elapsed = timestamp - lastTimestamp;
        if (elapsed >= frameDelay) {
          const advanceBy = Math.max(1, Math.floor(elapsed / frameDelay));
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
    }, [instant, frameDelay, totalChars, visibleChars]);

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
      if (!tokensInteractive) {
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
            return (
              <span
                key={`${key}-${segment.token.key}`}
                className={[
                  "vn-typed-text__token",
                  tokensInteractive ? "is-interactive" : "is-typing",
                ].join(" ")}
                data-vn-payload={segment.token.payload}
                data-vn-token-type={segment.token.type}
                role={tokensInteractive ? "button" : undefined}
                tabIndex={tokensInteractive ? 0 : undefined}
                onClick={(event) => {
                  if (!tokensInteractive) {
                    return;
                  }
                  event.stopPropagation();
                  onTokenClick?.(segment.token, event);
                }}
                onKeyDown={(event) => handleTokenKeyDown(segment.token, event)}
                onMouseEnter={(event) => {
                  if (!tokensInteractive) {
                    return;
                  }
                  onTokenEnter?.(segment.token, event);
                }}
                onMouseLeave={(event) => {
                  if (!tokensInteractive) {
                    return;
                  }
                  onTokenLeave?.(segment.token, event);
                }}
              >
                {segment.text}
              </span>
            );
          }

          return <span key={key}>{segment.text}</span>;
        })}
        {isTyping ? (
          <span className="vn-typed-text__cursor" aria-hidden />
        ) : null}
      </p>
    );
  },
);

TypedText.displayName = "TypedText";
