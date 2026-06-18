import { useTournament } from "../context/TournamentContext";
import { AppLayout } from "../components/Layout";

export default function StructurePage() {
  const { data } = useTournament();

  return (
    <AppLayout title="Gestion tournoi">
      <div className="structure-page">
        <div className="structure-toolbar">
          <select className="division-select" defaultValue="U11">
            <option>U11</option>
            {data.divisions.map((d) => (
              <option key={d.id}>{d.name}</option>
            ))}
          </select>
        </div>

        <div style={{ position: "relative" }}>
          <button type="button" className="scroll-arrow left" aria-hidden>
            ‹
          </button>
          <div className="phases-scroll">
            {data.phases.map((phase) => (
              <div key={phase.id} className="phase-column">
                <div className="phase-header">
                  <h3>{phase.name}</h3>
                  <div className="phase-actions">
                    <button type="button"><span className="material-icons md-20">edit</span></button>
                    {phase.id > 1 && (
                      <button type="button"><span className="material-icons md-20">close</span></button>
                    )}
                  </div>
                </div>
                {phase.items.map((item) => (
                  <div key={item.id} className="poule-card">
                    <div className="poule-card-header">
                      <span>{item.name}</span>
                      <button type="button"><span className="material-icons md-18">edit</span></button>
                    </div>
                    <div className="poule-card-body">
                      {item.teams.map((team, i) => (
                        <div
                          key={team}
                          className={`poule-team${item.type === "bracket" && i === 0 ? " highlight" : ""}`}
                        >
                          {team}
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
                <div className="phase-buttons">
                  <button type="button" className="btn-outlined btn-full">+ Poule</button>
                  <button type="button" className="btn-outlined btn-full">+ Bracket</button>
                  <button type="button" className="btn-outlined btn-full">+ Match amical</button>
                </div>
              </div>
            ))}
            <div className="phase-column phase-add-column">
              <h3>Ajouter une phase</h3>
              <p className="section-desc">
                Ajoutez une nouvelle phase pour organiser votre tournoi en plusieurs étapes.
              </p>
              <div className="phase-buttons">
                <button type="button" className="btn-outlined btn-full">+ Poule</button>
                <button type="button" className="btn-outlined btn-full">+ Bracket</button>
                <button type="button" className="btn-outlined btn-full">+ Match amical</button>
              </div>
            </div>
          </div>
          <button type="button" className="scroll-arrow right" aria-hidden>
            ›
          </button>
        </div>
      </div>
    </AppLayout>
  );
}
