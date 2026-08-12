import { useEffect, useMemo, useState } from "react";
import DepartementAutocomplete from "./DepartementAutocomplete";

const GRID_ONLY_FIELDS = new Set(["present", "paye", "ajoute", "lien", "logo", "joueurs"]);
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function isWritableField(field) {
  if (!field?.id) return false;
  if (GRID_ONLY_FIELDS.has(field.id)) return false;
  if (field.inputType === "checkbox") return false;
  return true;
}

function readFieldValue(team, fieldId) {
  if (fieldId === "email") return team?.email ?? "";
  if (fieldId === "departement" || fieldId === "region") {
    return team?.departement ?? team?.region ?? "";
  }
  if (fieldId === "pays") return team?.pays ?? team?.fields?.pays ?? "";
  if (fieldId === "vestiaire") return team?.vestiaire ?? team?.fields?.vestiaire ?? "";
  return team?.fields?.[fieldId] ?? team?.[fieldId] ?? "";
}

function getInitialValues(team, fields) {
  const values = {
    name: team?.name ?? "",
    division: team?.division ?? "",
  };

  fields.filter(isWritableField).forEach((field) => {
    values[field.id] = readFieldValue(team, field.id);
  });

  return values;
}

export default function TeamEditorSection({ modal, formId }) {
  const team = modal.team ?? {};
  const fields = useMemo(
    () => (modal.fields ?? []).filter(isWritableField),
    [modal.fields]
  );
  const divisions = modal.divisions ?? [];

  const formKey = useMemo(
    () => JSON.stringify({ id: team.id, fields: fields.map((f) => f.id) }),
    [team.id, fields]
  );

  const [values, setValues] = useState(() => getInitialValues(team, fields));

  useEffect(() => {
    setValues(getInitialValues(modal.team ?? {}, (modal.fields ?? []).filter(isWritableField)));
  }, [formKey]);

  const setField = (id, value) => {
    setValues((prev) => ({ ...prev, [id]: value }));
  };

  const handleSubmit = (event) => {
    event.preventDefault();
    const name = String(values.name ?? "").trim();
    if (!name) return;

    const next = {
      name,
      division: values.division ?? team.division ?? "",
      email: team.email ?? "",
      departement: team.departement ?? team.region ?? "",
      pays: team.pays ?? "",
      vestiaire: team.vestiaire ?? "",
      fields: { ...(team.fields || {}) },
    };

    fields.forEach((field) => {
      const value = values[field.id] ?? "";
      if (field.id === "email") {
        next.email = value;
        return;
      }
      if (field.id === "departement" || field.id === "region") {
        next.departement = value;
        return;
      }
      if (field.id === "pays") {
        next.pays = value;
        next.fields.pays = value;
        return;
      }
      if (field.id === "vestiaire") {
        next.vestiaire = value;
        next.fields.vestiaire = value;
        return;
      }
      next.fields[field.id] = value;
    });

    modal.onSubmit(next);
  };

  const emailValue = String(values.email ?? "");
  const emailInvalid = emailValue.trim() !== "" && !EMAIL_PATTERN.test(emailValue.trim());

  return (
    <form id={formId} className="team-editor-form" onSubmit={handleSubmit}>
      <div className="mui-field">
        <label className="mui-input-label" htmlFor="team-editor-name">
          Nom
        </label>
        <input
          id="team-editor-name"
          className="mui-input"
          value={values.name ?? ""}
          onChange={(e) => setField("name", e.target.value)}
          autoFocus
          required
        />
      </div>

      {divisions.length > 0 && (
        <div className="mui-field">
          <label className="mui-input-label" htmlFor="team-editor-division">
            Catégorie
          </label>
          <select
            id="team-editor-division"
            className="mui-select"
            value={values.division ?? ""}
            onChange={(e) => setField("division", e.target.value)}
          >
            {divisions.map((d) => (
              <option key={d.id} value={d.name}>
                {d.name}
              </option>
            ))}
          </select>
        </div>
      )}

      {fields.map((field) => (
        <div key={field.id} className="mui-field">
          <label className="mui-input-label" htmlFor={`team-editor-${field.id}`}>
            {field.label}
          </label>
          {field.id === "departement" || field.id === "region" ? (
            <DepartementAutocomplete
              id={`team-editor-${field.id}`}
              value={values[field.id] ?? ""}
              onChange={(next) => setField(field.id, next)}
            />
          ) : (
            <input
              id={`team-editor-${field.id}`}
              className={`mui-input${field.id === "email" && emailInvalid ? " is-invalid" : ""}`}
              type={field.id === "email" ? "email" : "text"}
              value={values[field.id] ?? ""}
              onChange={(e) => setField(field.id, e.target.value)}
            />
          )}
          {field.id === "email" && emailInvalid && (
            <p className="auth-error">Adresse e-mail invalide</p>
          )}
        </div>
      ))}

      {fields.length === 0 && (
        <p className="section-desc">
          Activez des champs texte (E-mail, Pays, Vestiaire, questions d&apos;inscription…)
          pour les modifier ici. Les cases à cocher se gèrent depuis le tableau.
        </p>
      )}
    </form>
  );
}
