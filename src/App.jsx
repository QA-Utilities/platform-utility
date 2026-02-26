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

      <a
        className="contribution-button"
        href="https://github.com/QA-Utilities/platform-utility"
        target="_blank"
        rel="noreferrer"
        aria-label="Contribuir com o projeto no GitHub"
      >
        <svg
          viewBox="0 0 16 16"
          aria-hidden="true"
          focusable="false"
        >
          <path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49C4 14.09 3.48 13.22 3.32 12.77c-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.5-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.01.08-2.1 0 0 .67-.21 2.2.82a7.55 7.55 0 0 1 4 0c1.53-1.04 2.2-.82 2.2-.82.44 1.09.16 1.9.08 2.1.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.19 0 .21.15.46.55.38A8.01 8.01 0 0 0 16 8c0-4.42-3.58-8-8-8Z" />
        </svg>
        Contribuir
      </a>
    </div>
  );
}
