import React from "react";

export interface VnHeaderProps {
  title: string;
  statusLine: string;
  error: string | null;
  onClose: () => void;
}

export const VnHeader: React.FC<VnHeaderProps> = ({
  title,
  statusLine,
  error,
  onClose,
}) => {
  return (
    <div className="vn-header">
      <div className="vn-header-top">
        <h1>{title}</h1>
        <button onClick={onClose} className="vn-close-btn">
          ×
        </button>
      </div>
      <div className={`vn-status-bar ${error ? "has-error" : ""}`}>
        <span className="status-text">{error || statusLine}</span>
      </div>
    </div>
  );
};
