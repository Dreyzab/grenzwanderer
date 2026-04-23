import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
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
  ChevronUp,
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

  useEffect(() => {
    try {
      localStorage.setItem(
        "grenzwanderer_navbar_collapsed",
        isCollapsed.toString(),
      );
    } catch {
      // ignore
    }
  }, [isCollapsed]);

  return (
    <motion.nav
      initial={false}
      animate={{
        y: isCollapsed
          ? "calc(100% - 1.5rem - env(safe-area-inset-bottom))"
          : 0,
      }}
      drag="y"
      dragConstraints={{ top: 0, bottom: 0 }}
      dragElastic={0.2}
      onDragEnd={(_, info) => {
        if (info.offset.y > 50) setIsCollapsed(true);
        else if (info.offset.y < -50) setIsCollapsed(false);
      }}
      transition={{ type: "spring", damping: 25, stiffness: 200 }}
      className="fixed bottom-0 left-0 right-0 z-50 flex flex-col bg-stone-950/95 backdrop-blur-md border-t border-stone-800 shadow-[0_-10px_40px_rgba(0,0,0,0.4)] touch-none"
    >
      {/* Pull Handle / Toggle Button */}
      <div className="flex justify-center w-full">
        <button
          type="button"
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="group relative -top-3 flex h-8 w-20 items-center justify-center rounded-t-2xl border-x border-t border-stone-800 bg-stone-950/95 pb-1 transition-colors hover:bg-stone-900"
          aria-label={isCollapsed ? "Expand Navigation" : "Collapse Navigation"}
        >
          <div className="absolute top-1.5 h-1 w-8 rounded-full bg-stone-700 transition-colors group-hover:bg-stone-500" />
          <motion.div
            animate={{ rotate: isCollapsed ? 180 : 0 }}
            className="mt-1 text-stone-500"
          >
            <ChevronDown size={14} />
          </motion.div>
        </button>
      </div>

      <div className="h-[calc(4rem+env(safe-area-inset-bottom))] pb-[env(safe-area-inset-bottom)] px-2 flex items-center">
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

        {/* Language Switcher absolute on large screens */}
        <div className="absolute right-4 top-1/2 -translate-y-1/2 hidden lg:flex items-center gap-3 text-xs font-bold text-stone-500 bg-stone-900/80 border border-stone-700/80 rounded-full px-4 py-2 shadow-lg backdrop-blur-sm">
          <button
            type="button"
            className="text-primary hover:text-primary transition-colors border-none bg-transparent shadow-none"
          >
            EN
          </button>
          <button
            type="button"
            className="text-stone-500 hover:text-stone-300 transition-colors border-none bg-transparent shadow-none"
          >
            DE
          </button>
          <button
            type="button"
            className="text-stone-500 hover:text-stone-300 transition-colors border-none bg-transparent shadow-none"
          >
            RU
          </button>
        </div>
      </div>
    </motion.nav>
  );
};
