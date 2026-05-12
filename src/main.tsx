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
import { installDevLogger } from "./shared/devtools";
import "./index.css";

const TOKEN_KEY = `${SPACETIMEDB_HOST}/${SPACETIMEDB_DB_NAME}/auth_token`;
const TOKEN_RETRY_KEY = `${TOKEN_KEY}/retry_without_token`;
const storedAuthToken = localStorage.getItem(TOKEN_KEY) || undefined;
let connectedOnce = false;

const retryWithoutStoredToken = () => {
  if (!storedAuthToken || connectedOnce) {
    return false;
  }
  if (sessionStorage.getItem(TOKEN_RETRY_KEY) === "1") {
    return false;
  }

  localStorage.removeItem(TOKEN_KEY);
  sessionStorage.setItem(TOKEN_RETRY_KEY, "1");
  window.location.reload();
  return true;
};

initializeMonitoring();
installDevLogger();

const onConnect = (_conn: DbConnection, identity: Identity, token: string) => {
  connectedOnce = true;
  sessionStorage.removeItem(TOKEN_RETRY_KEY);
  localStorage.setItem(TOKEN_KEY, token);
  setMonitoringIdentity(identity.toHexString());
  console.info("Connected as", identity.toHexString());
};

const onDisconnect = () => {
  clearMonitoringIdentity();
  console.warn("Disconnected from SpacetimeDB");
  retryWithoutStoredToken();
};

const onConnectError = (_ctx: ErrorContext, error: Error) => {
  captureMonitoringException(error, { stage: "spacetimedb_connect" });
  console.error("SpacetimeDB connection error", error);
  retryWithoutStoredToken();
};

const connectionBuilder = DbConnection.builder()
  .withUri(SPACETIMEDB_HOST)
  .withDatabaseName(SPACETIMEDB_DB_NAME)
  .withToken(storedAuthToken)
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
