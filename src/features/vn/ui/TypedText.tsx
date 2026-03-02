import {
  forwardRef,
  useEffect,
  useImperativeHandle,
  useMemo,
  useRef,
  useState,
} from "react";
import { parseClueMarkup, type ParsedTypedSegment } from "./TypedTextParser";
import "./TypedText.css";

export interface TypedTextHandle {
  finish: () => void;
}

export interface TypedTextProps {
  text: string;
  speed?: number;
  onComplete?: () => void;
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

    if (segment.kind === "clue") {
      output.push({
        kind: "clue",
        text: visibleText,
        payload: segment.payload,
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
  ({ text, speed = 12, onComplete, onTypingChange }, ref) => {
    const [visibleChars, setVisibleChars] = useState(0);
    const completionNotifiedRef = useRef(false);

    const segments = useMemo(() => parseClueMarkup(text), [text]);
    const totalChars = useMemo(
      () => segments.reduce((sum, segment) => sum + segment.text.length, 0),
      [segments],
    );

    const frameDelay = Math.max(1, speed);

    useEffect(() => {
      setVisibleChars(0);
      completionNotifiedRef.current = false;
    }, [text]);

    useEffect(() => {
      const isTyping = visibleChars < totalChars;
      onTypingChange?.(isTyping);

      if (!isTyping && !completionNotifiedRef.current) {
        completionNotifiedRef.current = true;
        onComplete?.();
      }
    }, [onComplete, onTypingChange, totalChars, visibleChars]);

    useEffect(() => {
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
    }, [frameDelay, totalChars, visibleChars]);

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

    return (
      <p className="vn-typed-text" aria-live="polite">
        {visibleSegments.map((segment, index) => {
          const key = `${segment.kind}-${index}`;
          if (segment.kind === "clue") {
            return (
              <span
                key={key}
                className="vn-typed-text__token"
                data-vn-payload={segment.payload}
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
