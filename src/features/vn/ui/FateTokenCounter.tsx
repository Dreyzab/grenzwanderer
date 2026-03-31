import { Coins } from "lucide-react";

interface FateTokenCounterProps {
  balance: number;
}

export const FateTokenCounter = ({ balance }: FateTokenCounterProps) => {
  if (balance <= 0) {
    return null;
  }

  return (
    <div className="flex items-center gap-1.5 px-3 py-1.5 bg-yellow-900/30 border border-yellow-700/50 rounded-full text-yellow-500 font-medium text-sm shadow-sm">
      <Coins className="w-4 h-4 text-yellow-400 drop-shadow-[0_0_4px_rgba(250,204,21,0.5)]" />
      <span>{balance}</span>
      <span className="text-yellow-600 ml-1 text-xs uppercase tracking-wider">
        Судьба
      </span>
    </div>
  );
};
