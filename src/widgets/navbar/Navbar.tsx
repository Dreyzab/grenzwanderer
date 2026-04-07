import {
  Home,
  Map as MapIcon,
  Users,
  User,
  QrCode,
  Terminal,
  Compass,
  Swords,
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
}: NavbarProps<TTab>) => (
  <nav className="fixed bottom-0 left-0 right-0 z-50 h-[calc(env(safe-area-inset-bottom)+4rem)] pb-[env(safe-area-inset-bottom)] bg-stone-950/95 backdrop-blur-md border-t border-stone-800 flex items-center px-2">
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
  </nav>
);
