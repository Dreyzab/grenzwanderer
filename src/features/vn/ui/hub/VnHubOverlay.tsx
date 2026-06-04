import { AnimatePresence, motion, type PanInfo } from "framer-motion";
import { X } from "lucide-react";
import { useEffect, useState, type ReactNode } from "react";

interface VnHubOverlayProps {
  open: boolean;
  onClose: () => void;
  title?: string;
  ariaLabel?: string;
  children: ReactNode;
}

const BACKDROP_VARIANTS = {
  hidden: { opacity: 0 },
  visible: { opacity: 1 },
};

const SHEET_VARIANTS = {
  hidden: { opacity: 0, y: 32 },
  visible: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: 24 },
};

const REDUCED_MOTION_VARIANTS = {
  hidden: { opacity: 0 },
  visible: { opacity: 1 },
  exit: { opacity: 0 },
};

const useMediaQuery = (query: string): boolean => {
  const [matches, setMatches] = useState(() => {
    if (typeof window === "undefined" || !window.matchMedia) {
      return false;
    }
    return window.matchMedia(query).matches;
  });

  useEffect(() => {
    if (typeof window === "undefined" || !window.matchMedia) {
      return;
    }
    const mediaQuery = window.matchMedia(query);
    setMatches(mediaQuery.matches);

    const handleChange = (event: MediaQueryListEvent) => {
      setMatches(event.matches);
    };

    mediaQuery.addEventListener("change", handleChange);
    return () => mediaQuery.removeEventListener("change", handleChange);
  }, [query]);

  return matches;
};

export function VnHubOverlay({
  open,
  onClose,
  title,
  ariaLabel,
  children,
}: VnHubOverlayProps) {
  const reduceMotion = useMediaQuery("(prefers-reduced-motion: reduce)");
  const isMobile = useMediaQuery("(max-width: 767px)");

  useEffect(() => {
    if (!open) {
      return;
    }
    const handleKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        onClose();
      }
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [onClose, open]);

  const sheetVariants = reduceMotion ? REDUCED_MOTION_VARIANTS : SHEET_VARIANTS;

  const handleDragEnd = (
    _event: MouseEvent | TouchEvent | PointerEvent,
    info: PanInfo,
  ) => {
    if (!isMobile) {
      return;
    }
    if (info.offset.y > 88 || info.velocity.y > 650) {
      onClose();
    }
  };

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          key="vn-hub-overlay"
          data-testid="vn-hub-overlay"
          data-layout={isMobile ? "sheet" : "modal"}
          role="dialog"
          aria-modal="true"
          aria-label={ariaLabel ?? title ?? "Train hub overlay"}
          initial="hidden"
          animate="visible"
          exit="hidden"
          variants={BACKDROP_VARIANTS}
          transition={{ duration: reduceMotion ? 0 : 0.18 }}
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 80,
            display: "flex",
            alignItems: isMobile ? "flex-end" : "center",
            justifyContent: "center",
            background: "rgba(10, 12, 18, 0.66)",
            backdropFilter: "blur(4px)",
            padding: isMobile ? 0 : 24,
          }}
        >
          <button
            type="button"
            data-testid="vn-hub-overlay-backdrop"
            aria-label="Close train map"
            onClick={onClose}
            style={{
              position: "absolute",
              inset: 0,
              width: "100%",
              height: "100%",
              padding: 0,
              margin: 0,
              border: "none",
              background: "transparent",
              cursor: "pointer",
            }}
          />
          <motion.div
            data-testid="vn-hub-overlay-sheet"
            initial="hidden"
            animate="visible"
            exit="exit"
            variants={sheetVariants}
            transition={{ duration: reduceMotion ? 0 : 0.24, ease: "easeOut" }}
            drag={isMobile ? "y" : false}
            dragConstraints={{ top: 0, bottom: 0 }}
            dragElastic={{ top: 0, bottom: 0.28 }}
            onDragEnd={handleDragEnd}
            style={{
              position: "relative",
              zIndex: 1,
              width: isMobile ? "100%" : "min(92vw, 1080px)",
              maxHeight: isMobile ? "75vh" : "min(85vh, 720px)",
              background: "rgba(18, 22, 30, 0.96)",
              borderTopLeftRadius: 8,
              borderTopRightRadius: 8,
              borderBottomLeftRadius: isMobile ? 0 : 8,
              borderBottomRightRadius: isMobile ? 0 : 8,
              boxShadow: isMobile
                ? "0 -16px 48px rgba(0, 0, 0, 0.5)"
                : "0 18px 64px rgba(0, 0, 0, 0.55)",
              padding: "20px 18px 24px",
              display: "flex",
              flexDirection: "column",
              gap: 12,
              overflow: "auto",
              color: "#f4ecd8",
              touchAction: isMobile ? "pan-y" : "auto",
            }}
          >
            <header
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                gap: 12,
              }}
            >
              <h2
                style={{
                  margin: 0,
                  fontFamily: "'Cormorant Garamond', serif",
                  fontSize: "1.4rem",
                  fontWeight: 600,
                  letterSpacing: 0,
                }}
              >
                {title ?? "Train map"}
              </h2>
              <button
                type="button"
                data-testid="vn-hub-overlay-close"
                aria-label="Close train map"
                onClick={onClose}
                style={{
                  appearance: "none",
                  background: "transparent",
                  color: "#f4ecd8",
                  border: "1px solid rgba(244, 236, 216, 0.45)",
                  borderRadius: 999,
                  width: 36,
                  height: 36,
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <X size={18} strokeWidth={1.8} aria-hidden="true" />
              </button>
            </header>
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              {children}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
