import { useState } from "react";
import { useTournamentActions } from "../hooks/useTournamentActions";

export default function TeamsPage() {
  const {
    data,
    toggleTeamField,
    addTeamField,
    editTeamField,
    togglePlayerField,
    addPlayerField,
    editPlayerField,
    switchToIndividualSport,
    addTeam,
    editTeam,
    exportTeams,
    openPrompt,
    patch,
    showToast,
  } = useTournamentActions();

  const [selected, setSelected] = useState([]);

  const toggleSelect = (id) => {
    setSelected((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  };

  const editTeamDetails = (team) => {
    openPrompt({
      title: "E-mail de l'équipe",
      label: "E-mail",
      defaultValue: team.email,
      onSubmit: (email) => {
        patch((p) => ({
          teams: p.teams.map((t) => (t.id === team.id ? { ...t, email } : t)),
        }));
        showToast("E-mail mis à jour");
      },
    });
  };

  const editRegion = (team) => {
    openPrompt({
      title: "Région",
      label: "De quelle région ?",
      defaultValue: team.region,
      onSubmit: (region) => {
        patch((p) => ({
          teams: p.teams.map((t) => (t.id === team.id ? { ...t, region } : t)),
        }));
        showToast("Région mise à jour");
      },
    });
  };

  const addPlayer = (teamId) => {
    patch((p) => ({
      teams: p.teams.map((t) => (t.id === teamId ? { ...t, players: t.players + 1 } : t)),
    }));
    showToast("Joueur ajouté");
  };

  return (
    <div className="page-container-wide">
      <div className="config-card">
        <h3>Informations sur les équipes</h3>
        <div className="info-box-gray clickable-info" onClick={switchToIndividualSport} role="button" tabIndex={0}>
          Pas de sport d&apos;équipe ? Cliquez ici pour passer à un sport individuel.
        </div>
        <p className="section-desc" style={{ marginTop: 16 }}>
          Champs d&apos;information standard
        </p>
        <ul className="field-list">
          {data.teamFields.map((f) => (
            <li key={f.id}>
              <span>{f.label}</span>
              <input
                type="checkbox"
                className="mui-checkbox"
                checked={f.enabled}
                onChange={() => toggleTeamField(f.id)}
              />
            </li>
          ))}
        </ul>
        <button type="button" className="btn-outlined primary btn-full" onClick={addTeamField}>
          Ajouter un champ d&apos;information
        </button>

        <p className="section-desc" style={{ marginTop: 24 }}>
          Champs d&apos;information des joueurs
        </p>
        <ul className="field-list">
          {data.playerFields.map((f) => (
            <li key={f.id}>
              <span>{f.label}</span>
              <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                <button type="button" className="list-row-edit" onClick={() => editPlayerField(f.id)}>
                  <span className="material-icons md-20" style={{ color: "var(--text-secondary)" }}>
                    edit
                  </span>
                </button>
                <input
                  type="checkbox"
                  className="mui-checkbox"
                  checked={f.enabled}
                  onChange={() => togglePlayerField(f.id)}
                />
              </div>
            </li>
          ))}
        </ul>
        <button type="button" className="btn-outlined primary btn-full" onClick={addPlayerField}>
          Ajouter un champ d&apos;information
        </button>
      </div>

      <div className="data-table-wrap">
        <div className="data-table-toolbar">
          <button type="button" className="btn-outlined" onClick={exportTeams}>
            Exporter
          </button>
          <button type="button" className="btn-outlined primary" onClick={addTeam}>
            Ajouter une équipe
          </button>
        </div>
        <table className="data-table">
          <thead>
            <tr>
              <th style={{ width: 40 }} />
              <th>Nom</th>
              <th>E-mail</th>
              <th>Logo</th>
              <th>Joueurs</th>
              <th>De quelle région ?</th>
              <th style={{ width: 40 }} />
            </tr>
          </thead>
          <tbody>
            {data.teams.map((team) => (
              <tr key={team.id}>
                <td>
                  <input
                    type="checkbox"
                    className="mui-checkbox"
                    checked={selected.includes(team.id)}
                    onChange={() => toggleSelect(team.id)}
                  />
                </td>
                <td>{team.name}</td>
                <td>
                  <button type="button" className="btn-text" style={{ padding: 0, textTransform: "none" }} onClick={() => editTeamDetails(team)}>
                    {team.email || "Ajouter"}
                  </button>
                </td>
                <td>
                  <button type="button" className="list-row-edit" onClick={() => showToast("Upload logo : à venir")}>
                    <span className="material-icons md-20" style={{ color: "var(--text-secondary)" }}>
                      cloud_upload
                    </span>
                  </button>
                </td>
                <td>
                  <button type="button" className="btn-text" style={{ padding: 0, textTransform: "none" }} onClick={() => addPlayer(team.id)}>
                    <span className="material-icons md-18" style={{ verticalAlign: "middle" }}>
                      person
                    </span>
                    +{team.players}
                  </button>
                </td>
                <td>
                  <button type="button" className="btn-text" style={{ padding: 0, textTransform: "none" }} onClick={() => editRegion(team)}>
                    {team.region || "Ajouter"}
                  </button>
                </td>
                <td>
                  <button type="button" className="list-row-edit" onClick={() => editTeam(team.id)}>
                    <span className="material-icons md-20">edit</span>
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        <div className="data-table-footer">
          <span>Nombre de lignes par page: 100</span>
          <span>
            1-{data.teams.length} de {data.teams.length}
          </span>
        </div>
      </div>
    </div>
  );
}
