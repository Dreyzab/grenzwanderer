import React from "react";

interface NoirNameplateProps extends React.HTMLAttributes<HTMLDivElement> {
  name: string;
}

export const NoirNameplate: React.FC<NoirNameplateProps> = ({
  name,
  className = "",
  ...rest
}) => {
  return (
    <div className={`absolute -top-6 left-6 ${className}`} {...rest}>
      <div className="bg-[#1e1a14] border-l-4 border-primary px-5 py-2 transform -skew-x-12 shadow-xl">
        <h4 className="text-primary text-xs font-black leading-none tracking-[0.25em] transform skew-x-12 uppercase">
          {name}
        </h4>
      </div>
    </div>
  );
};
