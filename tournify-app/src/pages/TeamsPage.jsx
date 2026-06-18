import { useState } from "react";
import { useTournament } from "../context/TournamentContext";

export default function TeamsPage() {
  const { data } = useTournament();

  return (
    <div className="page-container-wide">
      <div className="config-card">
        <h3>Informations sur les équipes</h3>
        <div className="info-box-gray">
          Pas de sport d&apos;équipe ? Cliquez ici pour passer à un sport individuel.
        </div>
        <p className="section-desc" style={{ marginTop: 16 }}>
          Champs d&apos;information standard
        </p>
        <ul className="field-list">
          {data.teamFields.map((f) => (
            <li key={f.id}>
              <span>{f.label}</span>
              <input type="checkbox" className="mui-checkbox" defaultChecked={f.enabled} />
            </li>
          ))}
        </ul>
        <button type="button" className="btn-outlined primary btn-full">
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
                <span className="material-icons md-20" style={{ color: "var(--text-secondary)" }}>
                  edit
                </span>
                <input type="checkbox" className="mui-checkbox" defaultChecked={f.enabled} />
              </div>
            </li>
          ))}
        </ul>
        <button type="button" className="btn-outlined primary btn-full">
          Ajouter un champ d&apos;information
        </button>
      </div>

      <div className="data-table-wrap">
        <div className="data-table-toolbar">
          <button type="button" className="btn-outlined">Exporter</button>
          <button type="button" className="btn-outlined primary">Ajouter une équipe</button>
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
                <td><input type="checkbox" className="mui-checkbox" /></td>
                <td>{team.name}</td>
                <td>{team.email || "—"}</td>
                <td>
                  <span className="material-icons md-20" style={{ color: "var(--text-secondary)" }}>
                    cloud_upload
                  </span>
                </td>
                <td>
                  <span className="material-icons md-18" style={{ verticalAlign: "middle" }}>
                    person
                  </span>
                  +{team.players}
                </td>
                <td>{team.region || "—"}</td>
                <td>
                  <button type="button" className="list-row-edit">
                    <span className="material-icons md-20">edit</span>
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        <div className="data-table-footer">
          <span>Nombre de lignes par page: 100</span>
          <span>1-{data.teams.length} de {data.teams.length}</span>
        </div>
      </div>
    </div>
  );
}
