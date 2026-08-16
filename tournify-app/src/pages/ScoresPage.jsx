import { useState } from "react";
import { useTournamentActions } from "../hooks/useTournamentActions";
import { AppLayout } from "../components/Layout";
import RightsLock from "../components/RightsLock";

function progressPhasesFrom(data) {
  const structure = data.phases || [];
  const scores = data.scores?.phases || [];
  if (structure.length) {
    return structure.map((phase, index) => ({
      id: phase.id,
      name: phase.name,
      done: scores[index]?.done ?? 0,
      total: scores[index]?.total ?? 0,
      started: Boolean(phase.started) || index === 0,
    }));
  }
  return scores.map((phase, index) => ({
    id: phase.id ?? `score-phase-${index}`,
    name: phase.name,
    done: phase.done ?? 0,
    total: phase.total ?? 0,
    started: Boolean(phase.started) || index === 0,
  }));
}

export default function ScoresPage() {
  const { data, can, updateScore, exportScores, showStandings, startTournamentPhase, openPrompt, showToast } =
    useTournamentActions();

  const [expanded, setExpanded] = useState(() =>
    data.scores.matchSlots.reduce((acc, slot, i) => {
      if (slot.expanded) acc[i] = true;
      return acc;
    }, {})
  );

  const toggleSlot = (index) => {
    setExpanded((prev) => ({ ...prev, [index]: !prev[index] }));
  };

  const editScore = (slotIndex, matchIndex, match) => {
    openPrompt({
      title: "Saisir le score",
      label: "Format: 4 - 2",
      defaultValue:
        match.score1 !== null ? `${match.score1} - ${match.score2}` : "",
      onSubmit: (val) => {
        const parts = val.split("-").map((s) => parseInt(s.trim(), 10));
        if (parts.length === 2 && !isNaN(parts[0]) && !isNaN(parts[1])) {
          updateScore(slotIndex, matchIndex, parts[0], parts[1]);
        } else {
          showToast("Format invalide (ex: 4 - 2)");
        }
      },
    });
  };

  const progressPhases = progressPhasesFrom(data);
  const canStartPhases = can("scores_phases");

  return (
    <AppLayout title="Gestion tournoi">
      <RightsLock right="scores">
      <div className="page-container-wide">
        <h2 className="section-title">Progrès</h2>
        <div className="progress-cards">
          {progressPhases.map((phase, i) => {
            const previous = progressPhases[i - 1];
            const previousReady = i === 0 || Boolean(previous?.started);
            const showStart = !phase.started && previousReady;
            return (
              <div
                key={phase.id}
                className={`progress-card${phase.started ? "" : " gray"}`}
              >
                <h4>{phase.name}</h4>
                <div className="count">
                  {phase.done}/{phase.total}
                </div>
                {phase.started ? (
                  <p className="section-desc" style={{ marginTop: 8 }}>En cours</p>
                ) : null}
                {showStart ? (
                  <RightsLock right="scores_phases">
                    <button
                      type="button"
                      className="btn-contained"
                      style={{ marginTop: 12 }}
                      disabled={!canStartPhases}
                      onClick={() => startTournamentPhase(phase.id)}
                    >
                      Démarrer
                    </button>
                  </RightsLock>
                ) : null}
              </div>
            );
          })}
        </div>

        <div className="scores-section-header">
          <h2>Matchs</h2>
          <div style={{ display: "flex", gap: 8 }}>
            <button type="button" className="btn-outlined" onClick={showStandings}>
              Classement ▾
            </button>
            <button type="button" className="btn-outlined" onClick={exportScores}>
              <span className="material-icons md-18">cloud_download</span>
              Exporter
            </button>
          </div>
        </div>

        <div
          style={{
            background: "var(--bg-white)",
            border: "1px solid var(--border-light)",
            borderRadius: "var(--radius)",
          }}
        >
          {data.scores.matchSlots.map((slot, index) => (
            <div key={slot.time} className="time-slot">
              <button type="button" className="time-slot-header" onClick={() => toggleSlot(index)}>
                <span>{slot.time}</span>
                <span className="material-icons">{expanded[index] ? "expand_less" : "expand_more"}</span>
              </button>
              {expanded[index] && slot.matches.length > 0 && (
                <div className="time-slot-body">
                  {slot.matches.map((match, mi) => (
                    <div key={match.terrain + match.team1} className="score-row">
                      <span style={{ color: "var(--text-secondary)" }}>{match.terrain}</span>
                      <span style={{ textAlign: "right" }}>{match.team1}</span>
                      <button
                        type="button"
                        className="score-box"
                        onClick={() => editScore(index, mi, match)}
                      >
                        {match.score1 !== null ? `${match.score1} - ${match.score2}` : "—"}
                      </button>
                      <span>{match.team2}</span>
                      <span style={{ color: "var(--text-secondary)", fontSize: "0.75rem" }}>
                        {match.poule} - {match.division}
                      </span>
                      <span>{match.referee}{match.referee2 ? ` + ${match.referee2}` : ""}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
      </RightsLock>
    </AppLayout>
  );
}
