import React from "react";
import { VnChoice } from "../types";
import { NoirButton } from "../../../shared/ui/NoirButton";

interface VnChoiceListProps {
  choices: VnChoice[];
  onSelect: (choiceId: string) => void;
  className?: string;
}

export const VnChoiceList: React.FC<VnChoiceListProps> = ({
  choices,
  onSelect,
  className = "",
}) => {
  return (
    <div className={`flex flex-col gap-3 px-6 py-8 w-full ${className}`}>
      {choices.map((choice) => (
        <NoirButton
          key={choice.id}
          variant={choice.choiceType === "action" ? "highlighted" : "default"}
          label={choice.choiceType === "action" ? "Action" : undefined}
          actionText={choice.text}
          onClick={() => onSelect(choice.id)}
        />
      ))}
    </div>
  );
};
