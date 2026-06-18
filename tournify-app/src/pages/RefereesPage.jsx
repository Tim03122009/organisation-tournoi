import { useTournamentActions } from "../hooks/useTournamentActions";

export default function RefereesPage() {
  const {
    data,
    toggleRefereeField,
    addRefereeField,
    addReferee,
    editReferee,
    exportReferees,
    openPrompt,
    patch,
    showToast,
  } = useTournamentActions();

  const editRefereeField = (ref, field) => {
    openPrompt({
      title: `Modifier ${field}`,
      defaultValue: ref[field],
      onSubmit: (val) => {
        patch((p) => ({
          referees: p.referees.map((r) => (r.id === ref.id ? { ...r, [field]: val } : r)),
        }));
        showToast("Mis à jour");
      },
    });
  };

  return (
    <div className="page-container-wide">
      <div className="config-card">
        <h3>Informations sur l&apos;arbitre</h3>
        <p className="section-desc">Champs d&apos;information standard</p>
        <ul className="field-list">
          {data.refereeFields.map((f) => (
            <li key={f.id}>
              <span>{f.label}</span>
              <input
                type="checkbox"
                className="mui-checkbox"
                checked={f.enabled}
                onChange={() => toggleRefereeField(f.id)}
              />
            </li>
          ))}
        </ul>
        <button type="button" className="btn-outlined primary btn-full" onClick={addRefereeField}>
          Ajouter un champ d&apos;information
        </button>
      </div>

      <div className="data-table-wrap">
        <div className="data-table-toolbar">
          <button type="button" className="btn-outlined" onClick={exportReferees}>
            Exporter
          </button>
          <button type="button" className="btn-contained" onClick={addReferee}>
            Ajouter un arbitre
          </button>
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
                <td>
                  <input type="checkbox" className="mui-checkbox" />
                </td>
                <td>{ref.name}</td>
                <td>
                  <button
                    type="button"
                    className="btn-text"
                    style={{ padding: 0, textTransform: "none" }}
                    onClick={() => editRefereeField(ref, "link")}
                  >
                    {ref.link || "Ajouter"}
                  </button>
                </td>
                <td>
                  <button
                    type="button"
                    className="btn-text"
                    style={{ padding: 0, textTransform: "none" }}
                    onClick={() => editRefereeField(ref, "divisions")}
                  >
                    {ref.divisions || "Ajouter"}
                  </button>
                </td>
                <td>
                  <button type="button" className="list-row-edit" onClick={() => editReferee(ref.id)}>
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
            1-{data.referees.length} de {data.referees.length}
          </span>
        </div>
      </div>
    </div>
  );
}
