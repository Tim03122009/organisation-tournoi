import { useRef } from "react";
import { useTournamentActions } from "../hooks/useTournamentActions";
import { AppLayout } from "../components/Layout";
import RightsLock from "../components/RightsLock";

export default function StructurePage() {
  const {
    data,
    setStructureDivision,
    addPhase,
    editPhase,
    removePhase,
    addStructureItem,
    editStructureItem,
    addTeamToItem,
  } = useTournamentActions();

  const scrollRef = useRef(null);

  const scroll = (dir) => {
    if (scrollRef.current) scrollRef.current.scrollBy({ left: dir * 300, behavior: "smooth" });
  };

  return (
    <AppLayout title="Gestion tournoi">
      <RightsLock right="layout">
      <div className="structure-page">
        <div className="structure-toolbar">
          <select
            className="division-select"
            value={data.selectedDivision || "U11"}
            onChange={(e) => setStructureDivision(e.target.value)}
          >
            {data.divisions.map((d) => (
              <option key={d.id} value={d.name}>
                {d.name}
              </option>
            ))}
          </select>
        </div>

        <div style={{ position: "relative" }}>
          <button type="button" className="scroll-arrow left" onClick={() => scroll(-1)}>
            ‹
          </button>
          <div className="phases-scroll" ref={scrollRef}>
            {data.phases.map((phase) => (
              <div key={phase.id} className="phase-column">
                <div className="phase-header">
                  <h3>{phase.name}</h3>
                  <div className="phase-actions">
                    <button type="button" onClick={() => editPhase(phase.id)}>
                      <span className="material-icons md-20">edit</span>
                    </button>
                    {data.phases.length > 1 && (
                      <button type="button" onClick={() => removePhase(phase.id)}>
                        <span className="material-icons md-20">close</span>
                      </button>
                    )}
                  </div>
                </div>
                {phase.items.map((item) => (
                  <div key={item.id} className="poule-card">
                    <div className="poule-card-header">
                      <span>{item.name}</span>
                      <button type="button" onClick={() => editStructureItem(phase.id, item.id)}>
                        <span className="material-icons md-18">edit</span>
                      </button>
                    </div>
                    <div className="poule-card-body">
                      {item.teams.map((team, i) => (
                        <div
                          key={team + i}
                          className={`poule-team${item.type === "bracket" && i === 0 ? " highlight" : ""}`}
                          onDoubleClick={() => addTeamToItem(phase.id, item.id)}
                          title="Double-clic pour ajouter une équipe"
                        >
                          {team}
                        </div>
                      ))}
                      {item.teams.length === 0 && (
                        <button
                          type="button"
                          className="btn-text"
                          style={{ margin: "8px 12px" }}
                          onClick={() => addTeamToItem(phase.id, item.id)}
                        >
                          + Équipe
                        </button>
                      )}
                    </div>
                  </div>
                ))}
                <div className="phase-buttons">
                  <button type="button" className="btn-outlined btn-full" onClick={() => addStructureItem(phase.id, "poule")}>
                    + Poule
                  </button>
                  <button type="button" className="btn-outlined btn-full" onClick={() => addStructureItem(phase.id, "bracket")}>
                    + Bracket
                  </button>
                  <button type="button" className="btn-outlined btn-full" onClick={() => addStructureItem(phase.id, "friendly")}>
                    + Match amical
                  </button>
                </div>
              </div>
            ))}
            <div className="phase-column phase-add-column">
              <h3>Ajouter une phase</h3>
              <p className="section-desc">
                Ajoutez une nouvelle phase pour organiser votre tournoi en plusieurs étapes.
              </p>
              <button type="button" className="btn-outlined btn-full" style={{ marginBottom: 12 }} onClick={addPhase}>
                + Nouvelle phase
              </button>
              <div className="phase-buttons">
                <button type="button" className="btn-outlined btn-full" onClick={addPhase}>
                  + Poule
                </button>
                <button type="button" className="btn-outlined btn-full" onClick={addPhase}>
                  + Bracket
                </button>
                <button type="button" className="btn-outlined btn-full" onClick={addPhase}>
                  + Match amical
                </button>
              </div>
            </div>
          </div>
          <button type="button" className="scroll-arrow right" onClick={() => scroll(1)}>
            ›
          </button>
        </div>
      </div>
      </RightsLock>
    </AppLayout>
  );
}
