import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { SpacetimeDBProvider } from "spacetimedb/react";
import { Identity } from "spacetimedb";
import { SPACETIMEDB_DB_NAME, SPACETIMEDB_HOST } from "../config";
import { DbConnection, type ErrorContext } from "../shared/spacetime/bindings";
import { ErrorBoundary } from "../shared/ui/ErrorBoundary";
import { OperatorShell } from "./OperatorShell";
import "../index.css";

// Separate entry for the operator-only Feedback Center. It reuses the same
// SpacetimeDB connection/token as the game but mounts only the operator shell,
// which gates on the admin-only `my_admin_identity` view.
const TOKEN_KEY = `${SPACETIMEDB_HOST}/${SPACETIMEDB_DB_NAME}/auth_token`;
const storedAuthToken = localStorage.getItem(TOKEN_KEY) || undefined;

const onConnect = (_conn: DbConnection, identity: Identity, token: string) => {
  localStorage.setItem(TOKEN_KEY, token);
  console.info("Operator connected as", identity.toHexString());
};

const onConnectError = (_ctx: ErrorContext, error: Error) => {
  console.error("SpacetimeDB connection error", error);
};

const connectionBuilder = DbConnection.builder()
  .withUri(SPACETIMEDB_HOST)
  .withDatabaseName(SPACETIMEDB_DB_NAME)
  .withToken(storedAuthToken)
  .onConnect(onConnect)
  .onConnectError(onConnectError);

createRoot(document.getElementById("operator-root")!).render(
  <StrictMode>
    <ErrorBoundary boundaryId="operator-root">
      <SpacetimeDBProvider connectionBuilder={connectionBuilder}>
        <OperatorShell />
      </SpacetimeDBProvider>
    </ErrorBoundary>
  </StrictMode>,
);
