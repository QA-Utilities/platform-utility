import { NavLink } from "react-router-dom";
import "../styles/components/sidebar.css";

export default function Sidebar({ utilities, isCompact, onToggleCompact, activeUtility }) {
  return (
    <aside className="sidebar">
      <div className="sidebar-brand">
        <div className="brand-title">
          <span className="brand-dot" />
          {!isCompact && <strong>QA Hub</strong>}
        </div>
        <button
          type="button"
          className="sidebar-toggle"
          onClick={onToggleCompact}
          aria-pressed={isCompact}
          aria-label={isCompact ? "Expandir sidebar" : "Compactar sidebar"}
          title={isCompact ? "Expandir sidebar" : "Compactar sidebar"}
        >
          {isCompact ? ">" : "<"}
        </button>
      </div>

      <div className="sidebar-search">
        <input type="search" placeholder="Buscar utilitario" aria-label="Buscar utilitario" />
      </div>

      <nav className="utility-nav sidebar-main-nav" aria-label="Utilitarios de QA">
        {utilities.map((item) => (
          <NavLink
            key={item.id}
            to={item.path}
            end={item.path === "/"}
            className={({ isActive }) => (isActive ? "utility-link active" : "utility-link")}
            title={item.label}
          >
            {isCompact ? item.icon : item.label}
          </NavLink>
        ))}
      </nav>

    </aside>
  );
}