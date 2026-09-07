import { ConvexProvider } from "convex/react";
import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { convex } from "./convex";
import { LandingRoute } from "./routes/LandingRoute";
import { LocalMatchRoute } from "./routes/LocalMatchRoute";
import { NewMatchRoute } from "./routes/NewMatchRoute";
import { PersistedMatchRoute } from "./routes/PersistedMatchRoute";

export function App() {
  // No deployment configured yet: run the in-memory skeleton so the app still
  // works before `npx convex dev` has been run (SPEC §3, and src/convex.ts).
  if (!convex) return <LocalMatchRoute />;

  return (
    <ConvexProvider client={convex}>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<LandingRoute />} />
          <Route path="/new" element={<NewMatchRoute />} />
          <Route path="/match/:matchId" element={<PersistedMatchRoute />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </ConvexProvider>
  );
}
