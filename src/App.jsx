import { Routes, Route } from "react-router-dom";
import Landing from "./Landing";
import Auth from "./pages/Auth";
import Onboarding from "./pages/Onboarding";
import Dashboard from "./pages/Dashboard";
import Invite from "./pages/Invite";
import OurTime from "./pages/OurTime";
import OurStory from "./pages/OurStory";
import Memories from "./pages/Memories";
import Settings from "./pages/Settings";

function App() {
  return (
    <Routes>

      {/* LANDING */}
      <Route
        path="/"
        element={<Landing />}
      />

      {/* AUTH */}
      <Route
        path="/auth"
        element={<Auth />}
      />

      {/* ONBOARDING */}
      <Route
        path="/onboarding"
        element={<Onboarding />}
      />

      {/* DASHBOARD */}
      <Route
        path="/dashboard"
        element={<Dashboard />}
      />

      {/* OUR TIME */}
      <Route
        path="/our-time"
        element={<OurTime />}
      />

      {/* OUR STORY */}
      <Route
        path="/our-story"
        element={<OurStory />}
      />

      {/* MEMORIES */}
      <Route
        path="/memories"
        element={<Memories />}
      />

      {/* SETTINGS */}
      <Route
        path="/settings"
        element={<Settings />}
      />

      {/* INVITE */}
      <Route
        path="/invite/:token"
        element={<Invite />}
      />

    </Routes>
  );
}

export default App;