import React from "react";

interface GlassBoxProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
}

export const GlassBox: React.FC<GlassBoxProps> = ({
  children,
  className = "",
  ...rest
}) => {
  return (
    <div
      className={`bg-background-dark/90 backdrop-blur-md border-t border-white/5 shadow-[0_-20px_40px_rgba(0,0,0,0.5)] ${className}`}
      {...rest}
    >
      {children}
    </div>
  );
};
