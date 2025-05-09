import { ConvexAuthProvider } from "@convex-dev/auth/react";
import React from "react";
import ReactDOM from "react-dom/client";
import { ConvexReactClient } from "convex/react";
import App from "./App";
import "./app/styles/global.css";
import QueryProvider from "./app/providers/QueryProvider";

// Используем URL из переменной окружения или фолбэк для продакшена
const convexUrl = import.meta.env.VITE_CONVEX_URL || "https://loyal-kookabura-274.convex.cloud";
const convex = new ConvexReactClient(convexUrl);

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <ConvexAuthProvider client={convex}>
      <QueryProvider>
        <App />
      </QueryProvider>
    </ConvexAuthProvider>
  </React.StrictMode>
);
