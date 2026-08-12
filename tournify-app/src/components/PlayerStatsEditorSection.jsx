import { useEffect, useMemo, useState } from "react";

export const PLAYER_STAT_TYPES = [
  { value: "goals", label: "Buts", defaultName: "Buts", defaultAbbr: "BUT" },
  { value: "attendance", label: "Présence", defaultName: "Présence", defaultAbbr: "PRE" },
  { value: "yellow", label: "Cartons jaunes", defaultName: "Cartons jaunes", defaultAbbr: "CJ" },
  { value: "red", label: "Cartons rouges", defaultName: "Cartons rouges", defaultAbbr: "CR" },
  {
    value: "select_multi",
    label: "Sélectionner un joueur (plusieurs)",
    defaultName: "",
    defaultAbbr: "",
  },
  {
    value: "select_one",
    label: "Sélectionner un joueur (un)",
    defaultName: "",
    defaultAbbr: "",
  },
];

function defaultsForType(type) {
  const found = PLAYER_STAT_TYPES.find((item) => item.value === type) ?? PLAYER_STAT_TYPES[0];
  return {
    type: found.value,
    name: found.defaultName,
    abbreviation: found.defaultAbbr,
  };
}

export default function PlayerStatsEditorSection({ modal, formId, onValidityChange }) {
  const initial = modal.defaultValue ?? {
    type: "goals",
    name: "",
    abbreviation: "",
  };

  const formKey = useMemo(
    () => JSON.stringify({ title: modal.title, value: modal.defaultValue }),
    [modal.title, modal.defaultValue]
  );

  const [type, setType] = useState(initial.type ?? "goals");
  const [name, setName] = useState(initial.name ?? "");
  const [abbreviation, setAbbreviation] = useState(initial.abbreviation ?? "");

  const canSubmit = name.trim().length > 0 && abbreviation.trim().length > 0;

  useEffect(() => {
    const next = modal.defaultValue ?? {
      type: "goals",
      name: "",
      abbreviation: "",
    };
    setType(next.type ?? "goals");
    setName(next.name ?? "");
    setAbbreviation(next.abbreviation ?? "");
  }, [formKey]);

  useEffect(() => {
    onValidityChange?.(canSubmit);
  }, [canSubmit, onValidityChange]);

  const handleTypeChange = (nextType) => {
    setType(nextType);
    const defaults = defaultsForType(nextType);
    if (defaults.name || defaults.abbreviation) {
      setName(defaults.name);
      setAbbreviation(defaults.abbreviation);
    } else {
      setName("");
      setAbbreviation("");
    }
  };

  const handleSubmit = (event) => {
    event.preventDefault();
    if (!canSubmit) return;
    modal.onSubmit({
      type,
      name: name.trim(),
      abbreviation: abbreviation.trim().slice(0, 3),
    });
  };

  return (
    <form id={formId} className="player-stats-form" onSubmit={handleSubmit}>
      <label className="mui-input-label" htmlFor="player-stat-type">
        Type
      </label>
      <select
        id="player-stat-type"
        className="mui-input player-stats-select"
        value={type}
        onChange={(e) => handleTypeChange(e.target.value)}
      >
        {PLAYER_STAT_TYPES.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>

      <label className="mui-input-label" htmlFor="player-stat-name" style={{ marginTop: 20 }}>
        Nom
      </label>
      <input
        id="player-stat-name"
        className="mui-input"
        value={name}
        onChange={(e) => setName(e.target.value)}
        autoFocus
      />

      <label className="mui-input-label" htmlFor="player-stat-abbr" style={{ marginTop: 20 }}>
        Abréviation
      </label>
      <input
        id="player-stat-abbr"
        className="mui-input"
        value={abbreviation}
        maxLength={3}
        onChange={(e) => setAbbreviation(e.target.value.slice(0, 3))}
      />
      <p className="scoring-hint player-stats-hint">Maximum 3 caractères</p>
    </form>
  );
}
