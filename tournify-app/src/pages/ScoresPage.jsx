import { useState } from "react";
import { useTournament } from "../context/TournamentContext";
import { AppLayout } from "../components/Layout";

export default function ScoresPage() {
  const { data } = useTournament();
  const [expanded, setExpanded] = useState(
    () =>
      data.scores.matchSlots.reduce((acc, slot, i) => {
        if (slot.expanded) acc[i] = true;
        return acc;
      }, {})
  );

  const toggleSlot = (index) => {
    setExpanded((prev) => ({ ...prev, [index]: !prev[index] }));
  };

  return (
    <AppLayout title="Gestion tournoi">
      <div className="page-container-wide">
        <h2 className="section-title">Progrès</h2>
        <div className="progress-cards">
          {data.scores.phases.map((phase, i) => (
            <div
              key={phase.name + i}
              className={`progress-card${i === 1 ? " red" : i === 2 ? " gray" : ""}`}
            >
              <h4>{phase.name}</h4>
              <div className="count">
                {phase.done}/{phase.total}
              </div>
              {i === 0 && phase.done === phase.total && (
                <button type="button" className="btn-contained" style={{ marginTop: 12 }}>
                  Retour vers
                </button>
              )}
            </div>
          ))}
        </div>

        <div className="scores-section-header">
          <h2>Matchs</h2>
          <div style={{ display: "flex", gap: 8 }}>
            <button type="button" className="btn-outlined">
              Classement ▾
            </button>
            <button type="button" className="btn-outlined">
              <span className="material-icons md-18">cloud_download</span>
              Exporter
            </button>
          </div>
        </div>

        <div style={{ background: "var(--bg-white)", border: "1px solid var(--border-light)", borderRadius: "var(--radius)" }}>
          {data.scores.matchSlots.map((slot, index) => (
            <div key={slot.time} className="time-slot">
              <button
                type="button"
                className="time-slot-header"
                onClick={() => toggleSlot(index)}
              >
                <span>{slot.time}</span>
                <span className="material-icons">
                  {expanded[index] ? "expand_less" : "expand_more"}
                </span>
              </button>
              {expanded[index] && slot.matches.length > 0 && (
                <div className="time-slot-body">
                  {slot.matches.map((match) => (
                    <div key={match.terrain + match.team1} className="score-row">
                      <span style={{ color: "var(--text-secondary)" }}>{match.terrain}</span>
                      <span style={{ textAlign: "right" }}>{match.team1}</span>
                      <span className="score-box">
                        {match.score1 !== null ? `${match.score1} - ${match.score2}` : "—"}
                      </span>
                      <span>{match.team2}</span>
                      <span style={{ color: "var(--text-secondary)", fontSize: "0.75rem" }}>
                        {match.poule} - {match.division}
                      </span>
                      <span>{match.referee}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </AppLayout>
  );
}
