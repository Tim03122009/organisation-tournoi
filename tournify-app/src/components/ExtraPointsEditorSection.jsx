import { useEffect, useMemo, useState } from "react";

export default function ExtraPointsEditorSection({ modal, formId, onValidityChange }) {
  const initial = modal.defaultValue ?? {
    name: "",
    abbreviation: "",
    showOnMatchResult: true,
    includeInStandings: false,
  };

  const formKey = useMemo(
    () => JSON.stringify({ title: modal.title, value: modal.defaultValue }),
    [modal.title, modal.defaultValue]
  );

  const [name, setName] = useState(initial.name ?? "");
  const [abbreviation, setAbbreviation] = useState(initial.abbreviation ?? "");
  const [showOnMatchResult, setShowOnMatchResult] = useState(
    initial.showOnMatchResult !== false
  );
  const [includeInStandings, setIncludeInStandings] = useState(
    Boolean(initial.includeInStandings)
  );

  const canSubmit = name.trim().length > 0 && abbreviation.trim().length > 0;

  useEffect(() => {
    const next = modal.defaultValue ?? {
      name: "",
      abbreviation: "",
      showOnMatchResult: true,
      includeInStandings: false,
    };
    setName(next.name ?? "");
    setAbbreviation(next.abbreviation ?? "");
    setShowOnMatchResult(next.showOnMatchResult !== false);
    setIncludeInStandings(Boolean(next.includeInStandings));
  }, [formKey]);

  useEffect(() => {
    onValidityChange?.(canSubmit);
  }, [canSubmit, onValidityChange]);

  const handleSubmit = (event) => {
    event.preventDefault();
    if (!canSubmit) return;
    modal.onSubmit({
      name: name.trim(),
      abbreviation: abbreviation.trim().slice(0, 3),
      showOnMatchResult,
      includeInStandings,
    });
  };

  return (
    <form id={formId} className="extra-points-form" onSubmit={handleSubmit}>
      <label className="mui-input-label" htmlFor="extra-points-name">
        Nom
      </label>
      <input
        id="extra-points-name"
        className="mui-input"
        value={name}
        onChange={(e) => setName(e.target.value)}
        autoFocus
      />

      <label className="mui-input-label" htmlFor="extra-points-abbr" style={{ marginTop: 20 }}>
        Abréviation
      </label>
      <input
        id="extra-points-abbr"
        className="mui-input"
        value={abbreviation}
        maxLength={3}
        onChange={(e) => setAbbreviation(e.target.value.slice(0, 3))}
      />
      <p className="scoring-hint extra-points-hint">Maximum 3 caractères</p>

      <label className="scoring-toggle-leading extra-points-toggle">
        <span className="mui-toggle">
          <input
            type="checkbox"
            checked={showOnMatchResult}
            onChange={(e) => setShowOnMatchResult(e.target.checked)}
          />
          <span className="mui-toggle-slider" />
        </span>
        <span className="scoring-toggle-label">Afficher les points au résultat du match</span>
      </label>

      <label className="scoring-toggle-leading extra-points-toggle">
        <span className="mui-toggle">
          <input
            type="checkbox"
            checked={includeInStandings}
            onChange={(e) => setIncludeInStandings(e.target.checked)}
          />
          <span className="mui-toggle-slider" />
        </span>
        <span className="scoring-toggle-copy">
          <span className="scoring-toggle-label">Inclure des points dans le classement du groupe</span>
          <span className="scoring-hint">
            Additionne automatiquement les points de ce score avec les points attribués en fonction
            du résultat du match.
          </span>
        </span>
      </label>
    </form>
  );
}
