import { useMemo, useState } from "react";
import { useParams } from "react-router-dom";
import { defaultTournament } from "../data/defaultData";
import { lookupTeamLink } from "../utils/helpers";
import { extractStoredTournaments } from "../utils/storedTournaments";

const STORAGE_KEY = "gestion-tournoi-data";

function readJson(key) {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

function loadTournamentByTeamToken(token) {
  if (!token) return null;

  const keys = new Set(
    Object.keys(localStorage).filter(
      (key) => key === STORAGE_KEY || key.startsWith(`${STORAGE_KEY}-`)
    )
  );

  const registered = lookupTeamLink(token);
  if (registered?.storageKey) keys.add(registered.storageKey);

  for (const key of keys) {
    const parsed = readJson(key);
    const tournaments = extractStoredTournaments(parsed);
    for (const data of tournaments) {
      const team = (data.teams || []).find(
        (t) =>
          t.connectionToken === token ||
          (registered?.teamId != null && t.id === registered.teamId)
      );
      if (team) {
        return {
          data: { ...defaultTournament, ...data },
          team: { ...team, connectionToken: team.connectionToken || token },
        };
      }
    }
  }

  return null;
}

function findTeamMatches(data, teamName) {
  const slots = data?.scores?.matchSlots || [];
  const matches = [];
  slots.forEach((slot) => {
    (slot.matches || []).forEach((match) => {
      if (match.team1 === teamName || match.team2 === teamName) {
        matches.push({ ...match, time: slot.time, day: slot.day });
      }
    });
  });
  return matches;
}

export default function TeamPortalPage() {
  const { token } = useParams();
  const resolved = useMemo(() => loadTournamentByTeamToken(token), [token]);
  const [tab, setTab] = useState("calendrier");

  if (!resolved) {
    return (
      <div className="team-portal">
        <div className="team-portal-topbar" />
        <div className="team-portal-shell">
          <div className="team-portal-card team-portal-card-empty">
            <div className="team-portal-empty">
              <span className="material-icons team-portal-scoreboard" aria-hidden="true">
                scoreboard
              </span>
              <h2>Lien invalide</h2>
              <p>Ce lien de connexion ne correspond à aucune équipe.</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const { data, team } = resolved;
  const matches = findTeamMatches(data, team.name);

  return (
    <div className="team-portal">
      <div className="team-portal-topbar" />
      <div className="team-portal-shell">
        <header className="team-portal-header">
          <div>
            <h1>{team.name}</h1>
            <p className="team-portal-division">{team.division || data.selectedDivision || "—"}</p>
          </div>
          <span className="material-icons team-portal-jersey" aria-hidden="true">
            checkroom
          </span>
        </header>

        <div className="team-portal-tabs">
          <button
            type="button"
            className={`team-portal-tab${tab === "calendrier" ? " active" : ""}`}
            onClick={() => setTab("calendrier")}
          >
            Calendrier
          </button>
          <button
            type="button"
            className={`team-portal-tab${tab === "classements" ? " active" : ""}`}
            onClick={() => setTab("classements")}
          >
            Classements
          </button>
        </div>

        <section className="team-portal-card">
          {tab === "calendrier" &&
            (matches.length === 0 ? (
              <div className="team-portal-empty">
                <span className="material-icons team-portal-scoreboard" aria-hidden="true">
                  scoreboard
                </span>
                <h2>Aucun match trouvé</h2>
                <p>Dès que vos matchs seront programmés, vous les verrez ici</p>
              </div>
            ) : (
              <ul className="team-portal-match-list">
                {matches.map((match, index) => (
                  <li key={`${match.team1}-${match.team2}-${index}`}>
                    <strong>
                      {match.team1} vs {match.team2}
                    </strong>
                    <span>
                      {match.time || "—"}
                      {match.terrain ? ` · Terrain ${match.terrain}` : ""}
                    </span>
                  </li>
                ))}
              </ul>
            ))}

          {tab === "classements" && (
            <div className="team-portal-empty">
              <span className="material-icons team-portal-scoreboard" aria-hidden="true">
                emoji_events
              </span>
              <h2>Classements</h2>
              <p>Les classements de votre poule apparaîtront ici.</p>
            </div>
          )}
        </section>

        <footer className="team-portal-footer">
          <span>Logiciel de tournoi</span>
          <span className="team-portal-slideshow">
            <span className="material-icons md-18" aria-hidden="true">
              desktop_windows
            </span>
            Lancez le diaporama
          </span>
        </footer>
      </div>
    </div>
  );
}
