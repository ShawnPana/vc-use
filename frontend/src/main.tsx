import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import { ConvexReactClient } from "convex/react";
import { ConvexAuthProvider } from "@convex-dev/auth/react";
import "./index.css";
import App from "./App.tsx";
import { ThemeProvider } from "@/contexts/ThemeProvider";

const convex = new ConvexReactClient(import.meta.env.VITE_CONVEX_URL as string);
createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <BrowserRouter>
      <ConvexAuthProvider client={convex}>
        <ThemeProvider>
          <App />
        </ThemeProvider>
      </ConvexAuthProvider>
    </BrowserRouter>
  </StrictMode>,
);
