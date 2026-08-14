import { useEffect, useMemo, useState } from "react";
import {
  REFEREE_ALL_DIVISIONS,
  REFEREE_OTHER_CLUB,
} from "../utils/helpers";
import { REFEREE_EXPERIENCE_OPTIONS } from "../utils/refereeExperience";

const GRID_ONLY_FIELDS = new Set(["present", "disponible", "lien"]);
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const REFEREE_LEVELS = ["Officiel", "Bénévole", "Joueur-arbitre"];

function isWritableField(field) {
  if (!field?.id) return false;
  if (GRID_ONLY_FIELDS.has(field.id)) return false;
  if (field.inputType === "checkbox") return false;
  return true;
}

function readFieldValue(referee, fieldId) {
  if (fieldId === "email") return referee?.email ?? "";
  if (fieldId === "telephone") return referee?.telephone ?? "";
  if (fieldId === "club") return referee?.club ?? "";
  if (fieldId === "niveau") return referee?.niveau ?? "";
  if (fieldId === "experience") return referee?.experience ?? "Normal";
  if (fieldId === "pays") return referee?.pays ?? "";
  if (fieldId === "divisions") return referee?.divisions ?? "";
  return referee?.fields?.[fieldId] ?? referee?.[fieldId] ?? "";
}

function getInitialValues(referee, fields) {
  const values = { name: referee?.name ?? "" };
  fields.filter(isWritableField).forEach((field) => {
    values[field.id] = readFieldValue(referee, field.id);
  });
  return values;
}

export default function RefereeEditorSection({ modal, formId }) {
  const referee = modal.referee ?? {};
  const fields = useMemo(
    () => (modal.fields ?? []).filter(isWritableField),
    [modal.fields]
  );
  const divisions = modal.divisions ?? [];
  const teams = modal.teams ?? [];

  const formKey = useMemo(
    () => JSON.stringify({ id: referee.id, fields: fields.map((f) => f.id) }),
    [referee.id, fields]
  );

  const [values, setValues] = useState(() => getInitialValues(referee, fields));

  useEffect(() => {
    setValues(getInitialValues(modal.referee ?? {}, (modal.fields ?? []).filter(isWritableField)));
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
      email: referee.email ?? "",
      telephone: referee.telephone ?? "",
      club: referee.club ?? "",
      niveau: referee.niveau ?? "",
      experience: referee.experience ?? "Normal",
      pays: referee.pays ?? "",
      divisions: referee.divisions ?? "",
      fields: { ...(referee.fields || {}) },
    };

    fields.forEach((field) => {
      const value = values[field.id] ?? "";
      if (field.id === "email") {
        next.email = value;
        return;
      }
      if (field.id === "telephone") {
        next.telephone = value;
        return;
      }
      if (field.id === "club") {
        next.club = value;
        return;
      }
      if (field.id === "niveau") {
        next.niveau = value;
        return;
      }
      if (field.id === "experience") {
        next.experience = value;
        return;
      }
      if (field.id === "pays") {
        next.pays = value;
        return;
      }
      if (field.id === "divisions") {
        next.divisions = value;
        return;
      }
      next.fields[field.id] = value;
    });

    if (!String(next.divisions ?? "").trim()) return;
    modal.onSubmit(next);
  };

  const emailValue = String(values.email ?? "");
  const emailInvalid = emailValue.trim() !== "" && !EMAIL_PATTERN.test(emailValue.trim());
  const clubNames = [...new Set(teams.map((t) => t.name).filter(Boolean))].sort((a, b) =>
    a.localeCompare(b, "fr", { sensitivity: "base" })
  );

  const renderFieldInput = (field) => {
    const id = `referee-editor-${field.id}`;
    const value = values[field.id] ?? "";

    if (field.id === "divisions") {
      return (
        <select
          id={id}
          className="mui-select"
          value={value}
          required
          onChange={(e) => setField(field.id, e.target.value)}
        >
          {!value ? <option value="">Choisir</option> : null}
          <option value={REFEREE_ALL_DIVISIONS}>{REFEREE_ALL_DIVISIONS}</option>
          {divisions.map((d) => (
            <option key={d.id} value={d.name}>
              {d.name}
            </option>
          ))}
        </select>
      );
    }

    if (field.id === "club") {
      return (
        <select
          id={id}
          className="mui-select"
          value={value}
          onChange={(e) => setField(field.id, e.target.value)}
        >
          {!value ? <option value="">Choisir</option> : null}
          <option value={REFEREE_OTHER_CLUB}>{REFEREE_OTHER_CLUB}</option>
          {clubNames.map((name) => (
            <option key={name} value={name}>
              {name}
            </option>
          ))}
          {value && value !== REFEREE_OTHER_CLUB && !clubNames.includes(value) ? (
            <option value={value}>{value}</option>
          ) : null}
        </select>
      );
    }

    if (field.id === "niveau") {
      return (
        <select
          id={id}
          className="mui-select"
          value={value}
          onChange={(e) => setField(field.id, e.target.value)}
        >
          {!value ? <option value="">Choisir</option> : null}
          {REFEREE_LEVELS.map((level) => (
            <option key={level} value={level}>
              {level}
            </option>
          ))}
        </select>
      );
    }

    if (field.id === "experience") {
      return (
        <select
          id={id}
          className="mui-select"
          value={value || "Normal"}
          onChange={(e) => setField(field.id, e.target.value)}
        >
          {REFEREE_EXPERIENCE_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
      );
    }

    return (
      <input
        id={id}
        className={`mui-input${field.id === "email" && emailInvalid ? " is-invalid" : ""}`}
        type={field.id === "email" ? "email" : "text"}
        value={value}
        onChange={(e) => setField(field.id, e.target.value)}
      />
    );
  };

  return (
    <form id={formId} className="team-editor-form" onSubmit={handleSubmit}>
      <div className="mui-field">
        <label className="mui-input-label" htmlFor="referee-editor-name">
          Nom
        </label>
        <input
          id="referee-editor-name"
          className="mui-input"
          value={values.name ?? ""}
          onChange={(e) => setField("name", e.target.value)}
          autoFocus
          required
        />
      </div>

      {fields.map((field) => (
        <div key={field.id} className="mui-field">
          <label className="mui-input-label" htmlFor={`referee-editor-${field.id}`}>
            {field.label}
          </label>
          {renderFieldInput(field)}
          {field.id === "email" && emailInvalid && (
            <p className="auth-error">Adresse e-mail invalide</p>
          )}
        </div>
      ))}

      {fields.length === 0 && (
        <p className="section-desc">
          Activez des champs texte (E-mail, Téléphone, Club, Division…) pour les modifier ici.
          Les cases à cocher se gèrent depuis le tableau.
        </p>
      )}
    </form>
  );
}
