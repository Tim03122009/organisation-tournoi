import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useTournament } from "../context/TournamentContext";
import { useTournamentActions } from "../hooks/useTournamentActions";

function formatListDate(isoDate) {
  if (!isoDate) return "";
  const [year, month, day] = isoDate.split("-");
  if (!year || !month || !day) return isoDate;
  return `${day}-${month}-${year}`;
}

export default function TournoisPage() {
  const navigate = useNavigate();
  const { logout, user } = useAuth();
  const { data } = useTournament();
  const { showSupport, openAlert } = useTournamentActions();
  const [query, setQuery] = useState("");
  const [sort, setSort] = useState("recent");

  const tournaments = useMemo(() => {
    const firstDay = data.days?.[0]?.date || "";
    return [
      {
        id: "current",
        name: data.name || "Tournoi",
        date: firstDay,
      },
    ];
  }, [data.days, data.name]);

  const filtered = useMemo(() => {
    const needle = query.trim().toLowerCase();
    const list = tournaments.filter((item) =>
      !needle ? true : item.name.toLowerCase().includes(needle)
    );
    return [...list].sort((a, b) => {
      if (sort === "name") return a.name.localeCompare(b.name, "fr");
      return (b.date || "").localeCompare(a.date || "");
    });
  }, [tournaments, query, sort]);

  return (
    <div className="tournois-page">
      <header className="tournois-topbar">
        <div className="tournois-brand">tournify</div>
        <div className="tournois-topbar-actions">
          <button type="button" className="topbar-action" disabled>
            <span className="material-icons">language</span>
            <span className="topbar-action-label">Français</span>
          </button>
          <button type="button" className="topbar-action" onClick={showSupport}>
            <span className="material-icons">help_outline</span>
            <span className="topbar-action-label">Assistance</span>
          </button>
          <button type="button" className="topbar-action" onClick={logout} title={user?.email || "Compte"}>
            <span className="material-icons">person</span>
            <span className="topbar-action-label">Compte</span>
          </button>
        </div>
      </header>

      <main className="tournois-main">
        <div className="tournois-header">
          <h1>Tournois</h1>
          <button
            type="button"
            className="btn-outlined"
            onClick={() =>
              openAlert({
                title: "Nouveau tournoi",
                message: "La création de plusieurs tournois sera disponible bientôt.",
              })
            }
          >
            + Nouveau tournoi
          </button>
        </div>

        <div className="tournois-toolbar">
          <label className="tournois-search">
            <span className="material-icons">search</span>
            <input
              type="search"
              placeholder="Rechercher un tournoi..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
          </label>
          <select
            className="tournois-sort"
            value={sort}
            onChange={(e) => setSort(e.target.value)}
            aria-label="Trier les tournois"
          >
            <option value="recent">Date (la plus récente)</option>
            <option value="name">Nom (A → Z)</option>
          </select>
        </div>

        <ul className="tournois-list">
          {filtered.map((tournament) => (
            <li key={tournament.id}>
              <button
                type="button"
                className="tournoi-card"
                onClick={() => navigate("/general")}
              >
                <span className="tournoi-card-icon" aria-hidden="true">
                  <span className="material-icons">emoji_events</span>
                </span>
                <span className="tournoi-card-body">
                  <span className="tournoi-card-name">{tournament.name}</span>
                  <span className="tournoi-card-date">{formatListDate(tournament.date)}</span>
                </span>
                <span
                  className="tournoi-card-menu"
                  role="presentation"
                  onClick={(e) => e.stopPropagation()}
                >
                  <span className="material-icons">more_vert</span>
                </span>
              </button>
            </li>
          ))}
        </ul>
      </main>
    </div>
  );
}
