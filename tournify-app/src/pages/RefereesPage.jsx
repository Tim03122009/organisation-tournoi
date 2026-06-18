import { useTournament } from "../context/TournamentContext";

export default function RefereesPage() {
  const { data } = useTournament();

  return (
    <div className="page-container-wide">
      <div className="config-card">
        <h3>Informations sur l&apos;arbitre</h3>
        <p className="section-desc">Champs d&apos;information standard</p>
        <ul className="field-list">
          {data.refereeFields.map((f) => (
            <li key={f.id}>
              <span>{f.label}</span>
              <input type="checkbox" className="mui-checkbox" defaultChecked={f.enabled} />
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
          <button type="button" className="btn-contained">Ajouter un arbitre</button>
        </div>
        <table className="data-table">
          <thead>
            <tr>
              <th style={{ width: 40 }} />
              <th>Nom ↓</th>
              <th>Lien de connexion</th>
              <th>Divisions</th>
              <th style={{ width: 40 }} />
            </tr>
          </thead>
          <tbody>
            {data.referees.map((ref) => (
              <tr key={ref.id}>
                <td><input type="checkbox" className="mui-checkbox" /></td>
                <td>{ref.name}</td>
                <td>{ref.link || "—"}</td>
                <td>{ref.divisions || "—"}</td>
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
          <span>1-{data.referees.length} de {data.referees.length}</span>
        </div>
      </div>
    </div>
  );
}
