import React from "react";

interface VnLocationHeaderProps {
  title: string;
  locationLabel?: string;
}

export const VnLocationHeader: React.FC<VnLocationHeaderProps> = ({
  title,
  locationLabel = "Location",
}) => {
  return (
    <div className="relative z-10 flex flex-col pt-6 pb-4">
      <div className="flex items-center justify-between px-6">
        <button className="text-white/70 hover:text-primary transition-colors">
          <span className="material-symbols-outlined">menu</span>
        </button>
        <div className="flex flex-col items-center">
          <h2 className="text-white text-xs font-bold uppercase tracking-[0.2em] opacity-60">
            {locationLabel}
          </h2>
          <h1 className="text-white text-lg font-serif italic leading-tight tracking-wide border-b border-primary/40 pb-1">
            {title}
          </h1>
        </div>
        <button className="text-white/70 hover:text-primary transition-colors">
          <span className="material-symbols-outlined">settings</span>
        </button>
      </div>
    </div>
  );
};
