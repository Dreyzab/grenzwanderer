import { useTable } from "spacetimedb/react";
import { tables } from "../shared/spacetime/bindings";
import { FeedbackCenter } from "../features/operator/feedback/FeedbackCenter";
import { useUiLanguage } from "../shared/hooks/useUiLanguage";
import { getOperatorStrings } from "../features/i18n/uiStrings";

const shellStyle: React.CSSProperties = {
  minHeight: "100vh",
  background: "#0b1120",
  color: "#e2e8f0",
  fontFamily: "'IBM Plex Sans', system-ui, sans-serif",
  padding: 24,
};

// Operator-only gate. The `my_admin_identity` view returns a row only when the
// connected identity is an admin; non-admins (and unauthenticated viewers) see
// the locked screen and never the Feedback Center.
export const OperatorShell = (): JSX.Element => {
  const [adminRows, isLoading] = useTable(tables.myAdminIdentity);
  const isAdmin = adminRows.length > 0;
  const language = useUiLanguage({});
  const op = getOperatorStrings(language);

  if (isLoading) {
    return (
      <div style={shellStyle}>
        <p>{op.connecting}</p>
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div style={shellStyle}>
        <h1 style={{ fontSize: 20 }}>{op.feedbackCenter}</h1>
        <p style={{ color: "#94a3b8" }}>{op.accessDenied}</p>
      </div>
    );
  }

  return (
    <div style={shellStyle}>
      <FeedbackCenter />
    </div>
  );
};
