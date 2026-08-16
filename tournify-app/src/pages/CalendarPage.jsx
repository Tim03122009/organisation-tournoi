import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useTournamentActions } from "../hooks/useTournamentActions";
import { AppLayout } from "../components/Layout";
import RightsLock from "../components/RightsLock";

export default function CalendarPage() {
  const navigate = useNavigate();
  const {
    data,
    can,
    update,
    setMatchDuration,
    toggleCalendarLock,
    addTerrain,
    editTerrain,
    addCalendarEvent,
    planAll,
    clearSchedule,
    assignRefereeToAll,
    assignRefereesByExperience,
    validateRefereeBinome,
    exportCalendar,
  } = useTournamentActions();

  const [panelMode, setPanelMode] = useState("plan");
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("all");

  const filteredSlots = (data.unscheduledSlots || []).filter((s) => {
    if (filter !== "all" && s.poule !== filter) return false;
    if (search && !s.label.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  const calendarLocked = !can("calendar");

  const rightPanel = (
    <aside className={`right-panel${calendarLocked ? " rights-locked" : ""}`} inert={calendarLocked || undefined}>
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
            <select
              value={data.planSelection?.poules || ""}
              onChange={(e) => update({ planSelection: { ...data.planSelection, poules: e.target.value } })}
            >
              <option value="">Sélectionner les poules/brackets</option>
              <option value="poule-a">Poule A</option>
              <option value="poule-b">Poule B</option>
            </select>
            <select
              value={data.planSelection?.days || ""}
              onChange={(e) => update({ planSelection: { ...data.planSelection, days: e.target.value } })}
            >
              <option value="">Sélectionner les jours</option>
              {data.days.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.label}
                </option>
              ))}
            </select>
            <select
              value={data.planSelection?.terrains || ""}
              onChange={(e) => update({ planSelection: { ...data.planSelection, terrains: e.target.value } })}
            >
              <option value="">Sélectionner les terrains</option>
              {data.terrains.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.name}
                </option>
              ))}
            </select>
            <button type="button" className="btn-outlined btn-full" style={{ marginTop: 8 }} onClick={planAll}>
              Tout planifier
            </button>
            <button type="button" className="btn-outlined btn-full" style={{ marginTop: 8 }} onClick={clearSchedule}>
              Vider le schéma
            </button>
          </>
        )}
        {panelMode === "referees" && (
          <>
            <h3>Arbitres</h3>
            <select
              value={data.refereeMode || "one_per_match"}
              onChange={(e) => update({ refereeMode: e.target.value })}
            >
              <option value="one_per_match">Un arbitre par match</option>
              <option value="shared">Arbitres partagés</option>
            </select>
            <button
              type="button"
              className="btn-outlined btn-full"
              style={{ marginTop: 8 }}
              onClick={() => navigate("/participants/referees")}
            >
              Gestion des arbitres
            </button>
            <button
              type="button"
              className="btn-outlined btn-full"
              style={{ marginTop: 8 }}
              onClick={assignRefereesByExperience}
            >
              Placer selon l&apos;expérience
            </button>
            <button
              type="button"
              className="btn-outlined btn-full"
              style={{ marginTop: 8 }}
              onClick={() => data.referees.forEach((r) => assignRefereeToAll(r.name))}
            >
              Tous les arbitres...
            </button>
            <button
              type="button"
              className="btn-outlined btn-full"
              style={{ marginTop: 8 }}
              onClick={() => {
                const ref = data.referees[0];
                if (ref) assignRefereeToAll(ref.name);
              }}
            >
              Assigner à...
            </button>
            <ul style={{ listStyle: "none", padding: 0, marginTop: 16 }}>
              {data.referees.map((r, i) => (
                <li
                  key={r.id}
                  style={{ padding: "8px 0", display: "flex", alignItems: "center", gap: 8, cursor: "pointer" }}
                  onClick={() => assignRefereeToAll(r.name)}
                >
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
            <input
              className="search-input"
              placeholder="Rechercher équipes"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
            <select className="search-input" value={filter} onChange={(e) => setFilter(e.target.value)}>
              <option value="all">Filtrer les matchs</option>
              <option value="Poule A">Poule A</option>
              <option value="Poule B">Poule B</option>
            </select>
            {filteredSlots.slice(0, 20).map((slot) => (
              <div key={slot.id} className="unscheduled-card">
                <div className="slot-label">{slot.label}</div>
                <span className="poule-badge">{slot.poule}</span>
              </div>
            ))}
          </>
        )}
      </div>
    </aside>
  );

  return (
    <AppLayout title="Gestion tournoi" rightPanel={rightPanel}>
      <RightsLock right="calendar">
      <div className="calendar-page">
        <div className="sub-toolbar">
          <button type="button" className="btn-outlined" onClick={setMatchDuration}>
            <span className="material-icons md-18">timer</span>
            Durée du match ({data.matchDuration || 17} min)
          </button>
          <button type="button" className="btn-outlined" onClick={exportCalendar}>
            <span className="material-icons md-18">cloud_download</span>
            Exporter
          </button>
          <button
            type="button"
            className="list-row-edit"
            onClick={toggleCalendarLock}
            title={data.calendarLocked ? "Déverrouiller" : "Verrouiller"}
          >
            <span className="material-icons">{data.calendarLocked ? "lock" : "lock_open"}</span>
          </button>
        </div>
        <div className="calendar-grid">
          {data.terrains.map((terrain) => (
            <div key={terrain.id} className="terrain-column">
              <div className="terrain-header">
                <span>{terrain.name}</span>
                <button type="button" onClick={() => editTerrain(terrain.id)} disabled={data.calendarLocked}>
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
                    <div
                      key={ev.id}
                      className={`match-card${ev.binomeStatus === "needs-validation" ? " is-binome-pending" : ""}`}
                      data-binome-pending={ev.binomeStatus === "needs-validation" ? "true" : undefined}
                    >
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
                            {ev.referee2 ? ` + ${ev.referee2}` : ""}
                          </>
                        )}
                      </div>
                      {ev.binomeStatus === "needs-validation" && (
                        <button
                          type="button"
                          className="btn-outlined btn-full"
                          style={{ marginTop: 8 }}
                          onClick={() => validateRefereeBinome(terrain.id, ev.id)}
                        >
                          Valider le binôme
                        </button>
                      )}
                    </div>
                  )
                )}
              </div>
              <div className="terrain-footer">
                <button
                  type="button"
                  className="btn-outlined"
                  disabled={data.calendarLocked}
                  onClick={() => !data.calendarLocked && addCalendarEvent(terrain.id, "match")}
                >
                  + Match
                </button>
                <button
                  type="button"
                  className="btn-outlined"
                  style={{ marginTop: 4 }}
                  disabled={data.calendarLocked}
                  onClick={() => !data.calendarLocked && addCalendarEvent(terrain.id, "pause")}
                >
                  + Pause
                </button>
              </div>
            </div>
          ))}
          <div style={{ display: "flex", alignItems: "flex-start", paddingTop: 40 }}>
            <button type="button" className="btn-outlined" onClick={addTerrain} disabled={data.calendarLocked}>
              Ajouter un terrain
            </button>
          </div>
        </div>
      </div>
      </RightsLock>
    </AppLayout>
  );
}
