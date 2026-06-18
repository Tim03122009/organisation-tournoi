import { useState } from "react";
import { useTournament } from "../context/TournamentContext";
import { AppLayout } from "../components/Layout";

export default function CalendarPage() {
  const { data } = useTournament();
  const [panelMode, setPanelMode] = useState("plan"); // plan | referees | unscheduled

  const rightPanel = (
    <aside className="right-panel">
      <div className="right-panel-tabs">
        <button
          type="button"
          className={`right-panel-tab${panelMode === "plan" ? " active" : ""}`}
          onClick={() => setPanelMode("plan")}
        >
          <span className="material-icons md-20">event_note</span>
        </button>
        <button
          type="button"
          className={`right-panel-tab${panelMode === "referees" ? " active" : ""}`}
          onClick={() => setPanelMode("referees")}
        >
          <span className="material-icons md-20">sports</span>
        </button>
        <button
          type="button"
          className={`right-panel-tab${panelMode === "unscheduled" ? " active" : ""}`}
          onClick={() => setPanelMode("unscheduled")}
        >
          <span className="material-icons md-20">list</span>
        </button>
      </div>
      <div className="right-panel-content">
        {panelMode === "plan" && (
          <>
            <h3>Planifier</h3>
            <select defaultValue="">
              <option value="">Sélectionner les poules/brackets</option>
            </select>
            <select defaultValue="">
              <option value="">Sélectionner les jours</option>
            </select>
            <select defaultValue="">
              <option value="">Sélectionner les terrains</option>
            </select>
            <button type="button" className="btn-outlined btn-full" style={{ marginTop: 8 }}>
              Tout planifier
            </button>
            <button type="button" className="btn-outlined btn-full" style={{ marginTop: 8 }}>
              Vider le schéma
            </button>
          </>
        )}
        {panelMode === "referees" && (
          <>
            <h3>Arbitres</h3>
            <select defaultValue="">
              <option>Un arbitre par match</option>
            </select>
            <button type="button" className="btn-outlined btn-full" style={{ marginTop: 8 }}>
              Gestion des arbitres
            </button>
            <button type="button" className="btn-outlined btn-full" style={{ marginTop: 8 }}>
              Tous les arbitres...
            </button>
            <button type="button" className="btn-outlined btn-full" style={{ marginTop: 8 }}>
              Assigner à...
            </button>
            <ul style={{ listStyle: "none", padding: 0, marginTop: 16 }}>
              {data.referees.map((r, i) => (
                <li key={r.id} style={{ padding: "8px 0", display: "flex", alignItems: "center", gap: 8 }}>
                  <span
                    style={{
                      width: 8,
                      height: 8,
                      borderRadius: "50%",
                      background: ["#4caf50", "#f44336", "#ff9800"][i % 3],
                    }}
                  />
                  {r.name}
                </li>
              ))}
            </ul>
          </>
        )}
        {panelMode === "unscheduled" && (
          <>
            <h3>
              Pas de planifié ({data.unscheduledMatches}/{data.totalMatches})
            </h3>
            <input className="search-input" placeholder="Rechercher équipes" />
            <select className="search-input">
              <option>Filtrer les matchs</option>
            </select>
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="unscheduled-card">
                <div className="slot-label">Emplacement vide</div>
                <span className="poule-badge">Poule A</span>
              </div>
            ))}
          </>
        )}
      </div>
    </aside>
  );

  return (
    <AppLayout title="Gestion tournoi" rightPanel={rightPanel}>
      <div className="calendar-page">
        <div className="sub-toolbar">
          <button type="button" className="btn-outlined">
            <span className="material-icons md-18">timer</span>
            Durée du match
          </button>
          <button type="button" className="btn-outlined">
            <span className="material-icons md-18">cloud_download</span>
            Exporter
          </button>
          <button type="button" className="list-row-edit">
            <span className="material-icons">lock</span>
          </button>
        </div>
        <div className="calendar-grid">
          {data.terrains.map((terrain) => (
            <div key={terrain.id} className="terrain-column">
              <div className="terrain-header">
                <span>{terrain.name}</span>
                <button type="button">
                  <span className="material-icons md-18">edit</span>
                </button>
              </div>
              <div className="terrain-body">
                {terrain.events.map((ev) =>
                  ev.type === "pause" ? (
                    <div key={ev.id} className="pause-card">
                      <strong>PAUSE</strong>
                      <div>{ev.duration}</div>
                    </div>
                  ) : (
                    <div key={ev.id} className="match-card">
                      <div className="time">{ev.time}</div>
                      <div className="teams">
                        {ev.team1} - {ev.team2}
                      </div>
                      <div className="meta">
                        <span className="poule-badge">{ev.poule}</span>
                        {ev.referee && (
                          <>
                            <span className="material-icons md-18">person</span>
                            {ev.referee}
                          </>
                        )}
                      </div>
                    </div>
                  )
                )}
              </div>
              <div className="terrain-footer">
                <button type="button" className="btn-outlined">+ Événement</button>
              </div>
            </div>
          ))}
          <div style={{ display: "flex", alignItems: "flex-start", paddingTop: 40 }}>
            <button type="button" className="btn-outlined">
              Ajouter un terrain
            </button>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
