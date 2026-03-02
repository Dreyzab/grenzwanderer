import React from "react";

interface NoirTypographyProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
}

export const NoirTypography: React.FC<NoirTypographyProps> = ({
  children,
  className = "",
  ...rest
}) => {
  return (
    <div
      className={`text-white/90 text-lg font-serif italic leading-relaxed first-letter:text-4xl first-letter:font-serif first-letter:mr-1 first-letter:float-left first-letter:text-primary ${className}`}
      {...rest}
    >
      {children}
    </div>
  );
};
