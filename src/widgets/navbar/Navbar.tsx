import { useState, useEffect, useLayoutEffect, useRef } from "react";
import { motion, useDragControls } from "framer-motion";
import {
  Home,
  Map as MapIcon,
  Users,
  User,
  QrCode,
  Terminal,
  Compass,
  Swords,
  ChevronDown,
} from "lucide-react";
type TabId =
  | "home"
  | "vn"
  | "character"
  | "map"
  | "mind_palace"
  | "command"
  | "battle"
  | "dev";

type TabOption<TTab extends string> = {
  id: TTab;
  label: string;
};

type NavbarProps<TTab extends string> = {
  activeTab: TTab;
  tabs: Array<TabOption<TTab>>;
  onTabChange: (tab: TTab) => void;
  badges?: Partial<Record<TTab, boolean>>;
};

const getIconForTab = (idx: string) => {
  const props = { className: "w-6 h-6", strokeWidth: 2.5 };
  switch (idx) {
    case "home":
      return <Home {...props} />;
    case "character":
      return <User {...props} />;
    case "map":
      return <MapIcon {...props} />;
    case "command":
      return <Users {...props} />;
    case "battle":
      return <Swords {...props} />;
    case "mind_palace":
      return <QrCode {...props} />;
    case "dev":
      return <Terminal {...props} />;
    default:
      return <Compass {...props} />;
  }
};

export const Navbar = <TTab extends string>({
  activeTab,
  tabs,
  onTabChange,
  badges,
}: NavbarProps<TTab>) => {
  const [isCollapsed, setIsCollapsed] = useState(() => {
    try {
      const saved = localStorage.getItem("grenzwanderer_navbar_collapsed");
      return saved === "true";
    } catch {
      return false;
    }
  });

  /** VN defaults to tucked nav; expands only until user leaves vn or collapses again. */
  const [vnUserExpanded, setVnUserExpanded] = useState(false);
  const prevTabRef = useRef<TTab | null>(null);

  const isVnTab = String(activeTab) === "vn";
  const navCollapsed = isVnTab ? !vnUserExpanded : isCollapsed;

  useEffect(() => {
    const prev = prevTabRef.current;
    prevTabRef.current = activeTab;
    if (isVnTab && prev !== null && String(prev) !== "vn") {
      setVnUserExpanded(false);
    }
  }, [activeTab, isVnTab]);

  useEffect(() => {
    if (isVnTab) {
      return;
    }
    try {
      localStorage.setItem(
        "grenzwanderer_navbar_collapsed",
        isCollapsed.toString(),
      );
    } catch {
      // ignore
    }
  }, [isCollapsed, isVnTab]);

  const navRef = useRef<HTMLElement | null>(null);
  const barRowRef = useRef<HTMLDivElement | null>(null);
  const dragControls = useDragControls();
  const [collapseY, setCollapseY] = useState(0);

  useLayoutEffect(() => {
    const el = navRef.current;
    if (!el) return;

    const update = () => {
      const h = Math.round(el.getBoundingClientRect().height);
      // Как в CSS: calc(100% - 1.5rem - env(safe-area-inset-bottom))
      const peek = 24; // 1.5rem
      const barRow = barRowRef.current;
      const safe =
        (barRow && parseFloat(getComputedStyle(barRow).paddingBottom)) || 0;
      setCollapseY(Math.max(0, h - peek - safe));
    };

    update();
    const ro = new ResizeObserver(update);
    ro.observe(el);
    if (barRowRef.current) ro.observe(barRowRef.current);
    return () => ro.disconnect();
  }, [tabs.length]);

  const yAnimated =
    navCollapsed && collapseY > 0
      ? collapseY
      : navCollapsed
        ? "calc(100% - 1.5rem - env(safe-area-inset-bottom))"
        : 0;

  return (
    <motion.nav
      ref={navRef}
      initial={false}
      animate={{ y: yAnimated }}
      drag={collapseY > 0 ? "y" : false}
      dragListener={false}
      dragControls={dragControls}
      dragConstraints={
        collapseY > 0 ? { top: 0, bottom: collapseY } : undefined
      }
      dragElastic={0.04}
      dragMomentum={false}
      onDragEnd={(_, info) => {
        if (collapseY <= 0) return;
        const { offset, velocity } = info;
        const vTh = 280;
        if (!navCollapsed) {
          if (offset.y > 48 || velocity.y > vTh) {
            if (isVnTab) setVnUserExpanded(false);
            else setIsCollapsed(true);
          } else if (isVnTab) setVnUserExpanded(true);
          else setIsCollapsed(false);
        } else if (offset.y < -48 || velocity.y < -vTh) {
          if (isVnTab) setVnUserExpanded(true);
          else setIsCollapsed(false);
        } else if (!isVnTab) {
          setIsCollapsed(true);
        } else setVnUserExpanded(false);
      }}
      transition={{ type: "spring", damping: 28, stiffness: 280 }}
      className="fixed bottom-0 left-0 right-0 z-50 flex flex-col bg-stone-950/95 backdrop-blur-md border-t border-stone-800 shadow-[0_-10px_40px_rgba(0,0,0,0.4)] touch-none"
    >
      {/* Ручка: жест тянет панель; onTap — без конфликта с drag */}
      <div className="flex justify-center w-full">
        <motion.button
          type="button"
          onPointerDown={(e) => dragControls.start(e)}
          onTap={() =>
            isVnTab ? setVnUserExpanded((e) => !e) : setIsCollapsed((c) => !c)
          }
          className="group relative -top-3 flex h-8 w-20 items-center justify-center rounded-t-2xl border-x border-t border-stone-800 bg-stone-950/95 pb-1 transition-colors hover:bg-stone-900"
          aria-label={
            navCollapsed ? "Expand Navigation" : "Collapse Navigation"
          }
        >
          <div className="absolute top-1.5 h-1 w-8 rounded-full bg-stone-700 transition-colors group-hover:bg-stone-500" />
          <motion.div
            animate={{ rotate: navCollapsed ? 180 : 0 }}
            className="mt-1 text-stone-500"
          >
            <ChevronDown size={14} />
          </motion.div>
        </motion.button>
      </div>

      <div
        ref={barRowRef}
        className="h-[calc(4rem+env(safe-area-inset-bottom))] pb-[env(safe-area-inset-bottom)] px-2 flex items-center"
      >
        <div className="flex items-center justify-between w-full h-16 max-w-lg mx-auto relative">
          {tabs.map((tab) => {
            const isActive = tab.id === activeTab;
            return (
              <button
                key={tab.id}
                onClick={() => onTabChange(tab.id)}
                className={`flex flex-col items-center justify-center w-full h-full space-y-1 transition-colors duration-200 border-none bg-transparent shadow-none hover:bg-transparent ${
                  isActive
                    ? "text-amber-500"
                    : "text-stone-500 hover:text-stone-300"
                }`}
                type="button"
              >
                <div className="relative">
                  {getIconForTab(tab.id)}
                  {badges?.[tab.id] && (
                    <span className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-amber-500 animate-pulse" />
                  )}
                </div>
                <span className="text-[10px] font-bold uppercase tracking-wider">
                  {tab.label}
                </span>
              </button>
            );
          })}
        </div>
      </div>
    </motion.nav>
  );
};
