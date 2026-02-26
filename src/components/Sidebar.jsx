import { useMemo, useState } from "react";
import { NavLink } from "react-router-dom";
import "../styles/components/sidebar.css";

function normalizeSearch(value) {
  return (value || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();
}

export default function Sidebar({ utilities, isCompact, onToggleCompact, activeUtility }) {
  const [searchTerm, setSearchTerm] = useState("");
  const normalizedSearch = useMemo(() => normalizeSearch(searchTerm), [searchTerm]);
  const filteredUtilities = useMemo(() => {
    if (!normalizedSearch) return utilities;

    return utilities.filter((item) => {
      const searchable = normalizeSearch(`${item.label} ${item.description} ${item.id} ${item.path}`);
      return searchable.includes(normalizedSearch);
    });
  }, [utilities, normalizedSearch]);

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
        <input
          type="search"
          placeholder="Buscar utilitario"
          aria-label="Buscar utilitario"
          value={searchTerm}
          onChange={(event) => setSearchTerm(event.target.value)}
        />
      </div>

      <nav className="utility-nav sidebar-main-nav" aria-label="Utilitarios de QA">
        {filteredUtilities.map((item) => (
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
        {filteredUtilities.length === 0 && (
          <p className="sidebar-empty">Nenhum utilitario encontrado.</p>
        )}
      </nav>

    </aside>
  );
}
