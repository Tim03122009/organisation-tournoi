import { useEffect, useMemo, useRef, useState } from "react";
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

function TournamentCard({
  tournament,
  menuId,
  menuRef,
  setMenuId,
  onOpen,
  onDuplicate,
  onDelete,
}) {
  const shared = Boolean(tournament.shared);
  const canCopy = Boolean(tournament.isOwner);
  const menuOpen = menuId === tournament.id;

  return (
    <li className="tournoi-item">
      <div className={`tournoi-card${shared ? " tournoi-card--shared" : ""}`}>
        <button type="button" className="tournoi-card-main" onClick={() => onOpen(tournament.id)}>
          <span className={`tournoi-card-icon${shared ? " tournoi-card-icon--shared" : ""}`} aria-hidden="true">
            <span className="material-icons">emoji_events</span>
          </span>
          <span className="tournoi-card-body">
            <span className="tournoi-card-name">{tournament.name}</span>
            <span className="tournoi-card-date">{formatListDate(tournament.date)}</span>
            {shared ? (
              <span className="tournoi-card-badge">
                {tournament.isOwner ? "Propriétaire" : "Administrateur"}
              </span>
            ) : null}
          </span>
        </button>
        <div className="tournoi-card-menu" ref={menuOpen ? menuRef : null}>
          <button
            type="button"
            className="tournoi-card-menu-btn"
            aria-label="Actions du tournoi"
            aria-expanded={menuOpen}
            onClick={(e) => {
              e.stopPropagation();
              setMenuId((current) => (current === tournament.id ? null : tournament.id));
            }}
          >
            <span className="material-icons">more_vert</span>
          </button>
          {menuOpen ? (
            <div className="tournoi-card-dropdown" role="menu">
              {canCopy ? (
                <>
                  <button type="button" role="menuitem" onClick={() => onDuplicate(tournament.id, true)}>
                    Copier le tournoi (Avec les équipes)
                  </button>
                  <button type="button" role="menuitem" onClick={() => onDuplicate(tournament.id, false)}>
                    Copier le tournoi (Sans équipes)
                  </button>
                </>
              ) : null}
              <button
                type="button"
                role="menuitem"
                className="tournoi-card-dropdown-danger"
                onClick={() => onDelete(tournament)}
              >
                Supprimer un tournoi
              </button>
            </div>
          ) : null}
        </div>
      </div>
    </li>
  );
}

export default function TournoisPage() {
  const navigate = useNavigate();
  const { logout, user } = useAuth();
  const { tournaments, createTournament, openTournament, duplicateTournament, deleteTournament, leaveTournament } = useTournament();
  const { showSupport, openPrompt, openConfirm, showToast } = useTournamentActions();
  const [query, setQuery] = useState("");
  const [sort, setSort] = useState("recent");
  const [menuId, setMenuId] = useState(null);
  const menuRef = useRef(null);

  const filtered = useMemo(() => {
    const needle = query.trim().toLowerCase();
    const list = tournaments.filter((item) =>
      !needle ? true : item.name.toLowerCase().includes(needle)
    );
    return [...list].sort((a, b) => {
      if (sort === "name") return a.name.localeCompare(b.name, "fr");
      return (b.createdAt || 0) - (a.createdAt || 0) || (b.date || "").localeCompare(a.date || "");
    });
  }, [tournaments, query, sort]);

  const sharedTournaments = filtered.filter((item) => item.shared);
  const ownedTournaments = filtered.filter((item) => !item.shared);

  useEffect(() => {
    if (!menuId) return undefined;

    const onPointerDown = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setMenuId(null);
      }
    };
    const onKeyDown = (event) => {
      if (event.key === "Escape") setMenuId(null);
    };

    document.addEventListener("pointerdown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("pointerdown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [menuId]);

  const handleCreate = () => {
    openPrompt({
      title: "Nouveau tournoi",
      label: "Nom du tournoi",
      defaultValue: "",
      confirmText: "Créer",
      onSubmit: (name) => {
        createTournament(name);
        showToast("Tournoi créé");
        navigate("/general");
      },
    });
  };

  const handleOpen = (id) => {
    openTournament(id);
    navigate("/general");
  };

  const handleDuplicate = (id, withTeams) => {
    setMenuId(null);
    const copied = duplicateTournament(id, { withTeams });
    if (copied) {
      showToast(withTeams ? "Tournoi copié avec les équipes" : "Tournoi copié sans les équipes");
    }
  };

  const handleDelete = (tournament) => {
    setMenuId(null);
    if (!tournament.isCreator) {
      openConfirm({
        title: "Quitter ce tournoi",
        message: `Vous allez sortir de la liste des administrateurs de « ${tournament.name} ». Le tournoi ne vous apparaîtra plus, mais il restera chez son propriétaire.`,
        confirmText: "Quitter",
        onConfirm: () => {
          leaveTournament(tournament.id);
          showToast("Vous n'êtes plus administrateur de ce tournoi");
        },
      });
      return;
    }
    openConfirm({
      title: "Supprimer un tournoi",
      message: `Supprimer définitivement « ${tournament.name} » ? Il disparaîtra aussi chez tous les administrateurs.`,
      confirmText: "Supprimer",
      onConfirm: () => {
        deleteTournament(tournament.id);
        showToast("Tournoi supprimé");
      },
    });
  };

  const cardProps = {
    menuId,
    menuRef,
    setMenuId,
    onOpen: handleOpen,
    onDuplicate: handleDuplicate,
    onDelete: handleDelete,
  };

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
          <button type="button" className="btn-outlined" onClick={handleCreate}>
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

        {filtered.length === 0 ? (
          <div className="tournois-empty">
            <span className="material-icons">emoji_events</span>
            <p>Aucun tournoi sur ce compte.</p>
          </div>
        ) : (
          <>
            {sharedTournaments.length > 0 ? (
              <section className="tournois-section">
                <h2 className="tournois-section-title">Tournois partagés</h2>
                <ul className="tournois-list">
                  {sharedTournaments.map((tournament) => (
                    <TournamentCard key={tournament.id} tournament={tournament} {...cardProps} />
                  ))}
                </ul>
              </section>
            ) : null}

            {ownedTournaments.length > 0 ? (
              <section className="tournois-section">
                {sharedTournaments.length > 0 ? (
                  <h2 className="tournois-section-title">Mes tournois</h2>
                ) : null}
                <ul className="tournois-list">
                  {ownedTournaments.map((tournament) => (
                    <TournamentCard key={tournament.id} tournament={tournament} {...cardProps} />
                  ))}
                </ul>
              </section>
            ) : null}
          </>
        )}
      </main>
    </div>
  );
}
