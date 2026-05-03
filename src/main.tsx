import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { SpacetimeDBProvider } from "spacetimedb/react";
import { Identity } from "spacetimedb";
import App from "./App";
import { I18nProvider } from "./features/i18n/I18nProvider";
import { SPACETIMEDB_DB_NAME, SPACETIMEDB_HOST } from "./config";
import { DbConnection, ErrorContext } from "./module_bindings";
import { PlayerBindingsProvider } from "./entities/player/hooks/usePlayerBindings";
import {
  captureMonitoringException,
  clearMonitoringIdentity,
  initializeMonitoring,
  setMonitoringIdentity,
} from "./shared/monitoring/sentry";
import "./index.css";

const TOKEN_KEY = `${SPACETIMEDB_HOST}/${SPACETIMEDB_DB_NAME}/auth_token`;

initializeMonitoring();

const onConnect = (_conn: DbConnection, identity: Identity, token: string) => {
  localStorage.setItem(TOKEN_KEY, token);
  setMonitoringIdentity(identity.toHexString());
  console.info("Connected as", identity.toHexString());
};

const onDisconnect = () => {
  clearMonitoringIdentity();
  console.warn("Disconnected from SpacetimeDB");
};

const onConnectError = (_ctx: ErrorContext, error: Error) => {
  captureMonitoringException(error, { stage: "spacetimedb_connect" });
  console.error("SpacetimeDB connection error", error);
};

const connectionBuilder = DbConnection.builder()
  .withUri(SPACETIMEDB_HOST)
  .withDatabaseName(SPACETIMEDB_DB_NAME)
  .withToken(localStorage.getItem(TOKEN_KEY) || undefined)
  .onConnect(onConnect)
  .onDisconnect(onDisconnect)
  .onConnectError(onConnectError);

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <SpacetimeDBProvider connectionBuilder={connectionBuilder}>
      <PlayerBindingsProvider>
        <I18nProvider>
          <App />
        </I18nProvider>
      </PlayerBindingsProvider>
    </SpacetimeDBProvider>
  </StrictMode>,
);
