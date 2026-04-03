import "./index.css";
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { ConvexProvider, ConvexReactClient } from "convex/react";
import App from "./App";

const convexUrl = import.meta.env.VITE_CONVEX_URL as string;
if (!convexUrl) {
  throw new Error("Missing VITE_CONVEX_URL env var. Create apps/infra-viz/.env.local with VITE_CONVEX_URL=<your-convex-url>");
}

const convex = new ConvexReactClient(convexUrl);

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <ConvexProvider client={convex}>
      <App />
    </ConvexProvider>
  </StrictMode>,
);
