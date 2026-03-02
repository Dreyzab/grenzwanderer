import React from "react";

interface NoirButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "default" | "highlighted";
  label?: string;
  actionText: string;
  icon?: string;
}

export const NoirButton: React.FC<NoirButtonProps> = ({
  variant = "default",
  label,
  actionText,
  icon,
  className = "",
  ...rest
}) => {
  if (variant === "highlighted") {
    return (
      <button
        className={`group relative flex items-center justify-center gap-3 bg-primary/20 hover:bg-primary/30 transition-all duration-300 border border-primary/50 hover:border-primary rounded-lg p-3 text-center shadow-[0_0_15px_rgba(245,159,10,0.15)] w-full ${className}`}
        {...rest}
      >
        {icon && (
          <span className="material-symbols-outlined text-primary text-xl">
            {icon}
          </span>
        )}
        <div className="flex flex-col items-center">
          {label && (
            <span className="text-primary text-xs font-bold uppercase tracking-widest block mb-0.5">
              {label}
            </span>
          )}
          <span className="text-white text-sm font-bold leading-normal">
            {actionText}
          </span>
        </div>
      </button>
    );
  }

  return (
    <button
      className={`group flex items-center justify-center gap-2 bg-[#2a2620]/80 hover:bg-[#393328] transition-all duration-300 border border-transparent hover:border-white/20 rounded-lg p-3 w-full ${className}`}
      {...rest}
    >
      {icon && (
        <span className="material-symbols-outlined text-white/70 text-lg">
          {icon}
        </span>
      )}
      <span className="text-white/90 text-sm font-medium leading-normal italic">
        {actionText}
      </span>
    </button>
  );
};
