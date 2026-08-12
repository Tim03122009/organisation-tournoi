import { useEffect, useMemo, useState } from "react";
import { nextId } from "../utils/helpers";

function emptyPlayer(fields, id) {
  const player = { id };
  fields.forEach((field) => {
    player[field.id] = field.inputType === "checkbox" ? false : "";
  });
  return player;
}

export default function PlayersEditorSection({ modal, formId }) {
  const fields = useMemo(() => {
    const list = modal.playerFields || [];
    const enabled = list.filter((f) => f.enabled || f.locked || f.id === "nom");
    if (enabled.some((f) => f.id === "nom")) return enabled;
    return [{ id: "nom", label: "Nom", locked: true }, ...enabled];
  }, [modal.playerFields]);

  const teamName = modal.team?.name || "l'équipe";

  const formKey = useMemo(
    () => JSON.stringify({ teamId: modal.team?.id, fields: fields.map((f) => f.id) }),
    [modal.team?.id, fields]
  );

  const [players, setPlayers] = useState(() =>
    Array.isArray(modal.players) ? modal.players.map((p) => ({ ...p })) : []
  );
  const [draft, setDraft] = useState(null);

  useEffect(() => {
    setPlayers(Array.isArray(modal.players) ? modal.players.map((p) => ({ ...p })) : []);
    setDraft(null);
  }, [formKey]);

  const persist = (next) => {
    setPlayers(next);
    modal.onChange?.(next);
  };

  const startAdd = () => {
    setDraft(emptyPlayer(fields, nextId(players)));
  };

  const startEdit = (player) => {
    const values = { id: player.id };
    fields.forEach((field) => {
      if (field.inputType === "checkbox") {
        values[field.id] = Boolean(player[field.id]);
      } else {
        values[field.id] = player[field.id] ?? "";
      }
    });
    setDraft(values);
  };

  const cancelDraft = () => setDraft(null);

  const deletePlayer = (playerId) => {
    if (draft?.id === playerId) setDraft(null);
    persist(players.filter((p) => p.id !== playerId));
  };

  const saveDraft = (event) => {
    event.preventDefault();
    if (!draft) return;
    const nom = String(draft.nom ?? "").trim();
    if (!nom) return;

    const cleaned = { id: draft.id };
    fields.forEach((field) => {
      if (field.inputType === "checkbox") {
        cleaned[field.id] = Boolean(draft[field.id]);
      } else {
        cleaned[field.id] = String(draft[field.id] ?? "").trim();
      }
    });

    const exists = players.some((p) => p.id === cleaned.id);
    const next = exists
      ? players.map((p) => (p.id === cleaned.id ? cleaned : p))
      : [...players, cleaned];

    persist(next);
    setDraft(null);
  };

  const formatCell = (player, field) => {
    if (field.inputType === "checkbox") return player[field.id] ? "oui" : "non";
    return player[field.id] || "—";
  };

  return (
    <div id={formId} className="players-editor">
      <p className="section-desc">
        Ajouter des joueurs et gérer les joueurs de {teamName}. Sur la page Général, vous pouvez
        choisir les statistiques des joueurs que vous souhaitez conserver.
      </p>

      {draft && (
        <form className="players-editor-draft" onSubmit={saveDraft}>
          {fields.map((field) => (
            <div key={field.id} className="mui-field">
              {field.inputType === "checkbox" ? (
                <label className="info-field-public" htmlFor={`player-draft-${field.id}`}>
                  <input
                    id={`player-draft-${field.id}`}
                    type="checkbox"
                    className="mui-checkbox"
                    checked={Boolean(draft[field.id])}
                    onChange={(e) =>
                      setDraft((prev) => ({ ...prev, [field.id]: e.target.checked }))
                    }
                  />
                  <span>{field.label}</span>
                </label>
              ) : (
                <>
                  <label className="mui-input-label" htmlFor={`player-draft-${field.id}`}>
                    {field.label}
                  </label>
                  <input
                    id={`player-draft-${field.id}`}
                    className="mui-input"
                    value={draft[field.id] ?? ""}
                    onChange={(e) => setDraft((prev) => ({ ...prev, [field.id]: e.target.value }))}
                    autoFocus={field.id === "nom"}
                    required={field.id === "nom"}
                  />
                </>
              )}
            </div>
          ))}
          <div className="players-editor-draft-actions">
            <button type="button" className="btn-text" onClick={cancelDraft}>
              Annuler
            </button>
            <button type="submit" className="btn-contained">
              Sauvegarder
            </button>
          </div>
        </form>
      )}

      <div className="players-editor-table-wrap">
        <table className="players-editor-table">
          <thead>
            <tr>
              {fields.map((field) => (
                <th key={field.id}>{field.label}</th>
              ))}
              <th style={{ width: 72 }} />
            </tr>
          </thead>
          <tbody>
            {players.length === 0 ? (
              <tr>
                <td colSpan={fields.length + 1} className="players-editor-empty">
                  Aucun joueur pour le moment
                </td>
              </tr>
            ) : (
              players.map((player) => (
                <tr key={player.id}>
                  {fields.map((field) => (
                    <td key={field.id}>{formatCell(player, field)}</td>
                  ))}
                  <td>
                    <div className="field-list-actions">
                      <button
                        type="button"
                        className="list-row-edit"
                        onClick={() => startEdit(player)}
                        aria-label="Modifier le joueur"
                      >
                        <span className="material-icons md-20" style={{ color: "var(--text-secondary)" }}>
                          edit
                        </span>
                      </button>
                      <button
                        type="button"
                        className="list-row-edit"
                        onClick={() => deletePlayer(player.id)}
                        aria-label="Supprimer le joueur"
                      >
                        <span className="material-icons md-20" style={{ color: "var(--text-secondary)" }}>
                          delete
                        </span>
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {!draft && (
        <button type="button" className="btn-outlined primary" onClick={startAdd}>
          Ajouter un joueur
        </button>
      )}
    </div>
  );
}
