import { useEffect } from "react";
import "./VnSkillCheckToast.css";

export interface VnSkillCheckToastData {
  resultKey: string;
  checkId: string;
  voiceLabel: string;
  roll: number;
  voiceLevel: number;
  difficulty: number;
  passed: boolean;
}

interface VnSkillCheckToastProps {
  toast: VnSkillCheckToastData | null;
  onClose: () => void;
}

export const VnSkillCheckToast = ({
  toast,
  onClose,
}: VnSkillCheckToastProps) => {
  useEffect(() => {
    if (!toast) {
      return;
    }

    const timeoutId = window.setTimeout(() => {
      onClose();
    }, 3000);

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [onClose, toast]);

  if (!toast) {
    return null;
  }

  const total = toast.roll + toast.voiceLevel;

  return (
    <aside
      className={[
        "vn-skill-toast",
        toast.passed ? "is-success" : "is-fail",
      ].join(" ")}
      role="status"
      aria-live="polite"
    >
      <p className="vn-skill-toast__title">{`${toast.voiceLabel} Check`}</p>
      <p>{`Roll: ${toast.roll} + ${toast.voiceLevel} = ${total}`}</p>
      <p>{`DC: ${toast.difficulty}`}</p>
      <p className="vn-skill-toast__result">
        {toast.passed ? "Success" : "Fail"}
      </p>
    </aside>
  );
};
