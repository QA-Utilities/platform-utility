import { useEffect, useState } from "react";
import { useLocation } from "react-router-dom";
import Sidebar from "./components/Sidebar";
import { getUtilityByPath, utilities } from "./config/utilities";
import AppRouter from "./router/AppRouter";
import "./styles/app.css";

export default function App() {
  const [isCompactSidebar, setIsCompactSidebar] = useState(false);
  const location = useLocation();

  useEffect(() => {
    const saved = window.localStorage.getItem("qa-sidebar-compact");
    setIsCompactSidebar(saved === "true");
  }, []);

  useEffect(() => {
    window.localStorage.setItem("qa-sidebar-compact", String(isCompactSidebar));
  }, [isCompactSidebar]);

  const activeUtility = getUtilityByPath(location.pathname);

  return (
    <div className="page">
      <div className={isCompactSidebar ? "workspace compact" : "workspace"}>
        <Sidebar
          utilities={utilities}
          isCompact={isCompactSidebar}
          onToggleCompact={() => setIsCompactSidebar((current) => !current)}
          activeUtility={activeUtility}
        />

        <main className="content">
          <header className="hero">
            <h1>{activeUtility.label}</h1>
            <p>
              <span className="utility-icon">{activeUtility.icon}</span>
              <span className="utility-meta">
                <small>{activeUtility.description}</small>
              </span>
            </p>
          </header>
          <AppRouter />
        </main>
      </div>
    </div>
  );
}