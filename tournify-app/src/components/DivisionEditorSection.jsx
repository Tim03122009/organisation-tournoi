import { useEffect, useMemo, useRef, useState } from "react";

export default function DivisionEditorSection({ modal, formId }) {
  const initial = modal.defaultDivision ?? {
    name: "",
    showLogo: false,
    logo: null,
  };

  const divisionKey = useMemo(
    () => JSON.stringify({ title: modal.title, division: modal.defaultDivision }),
    [modal.title, modal.defaultDivision]
  );

  const [name, setName] = useState(initial.name ?? "");
  const [showLogo, setShowLogo] = useState(Boolean(initial.showLogo));
  const [logo, setLogo] = useState(initial.logo ?? null);
  const [nameError, setNameError] = useState("");
  const [formError, setFormError] = useState("");
  const fileInputRef = useRef(null);

  useEffect(() => {
    const next = modal.defaultDivision ?? { name: "", showLogo: false, logo: null };
    setName(next.name ?? "");
    setShowLogo(Boolean(next.showLogo));
    setLogo(next.logo ?? null);
    setNameError("");
    setFormError("");
  }, [divisionKey]);

  const pickLogo = () => {
    fileInputRef.current?.click();
  };

  const handleLogoChange = (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      setFormError("Le logo doit être une image.");
      return;
    }

    if (file.size > 2 * 1024 * 1024) {
      setFormError("Le logo ne doit pas dépasser 2 Mo.");
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      setLogo(typeof reader.result === "string" ? reader.result : null);
      setFormError("");
    };
    reader.readAsDataURL(file);
    event.target.value = "";
  };

  const handleSubmit = (event) => {
    event.preventDefault();
    setFormError("");

    const trimmed = name.trim();
    if (!trimmed) {
      setNameError("Le nom est obligatoire.");
      return;
    }

    modal.onSubmit({
      name: trimmed,
      showLogo,
      logo: showLogo ? logo : null,
    });
  };

  return (
    <form
      id={formId}
      className={showLogo ? "location-form" : "location-form location-form--compact"}
      onSubmit={handleSubmit}
    >
      <p className="section-desc">
        Les catégories d&apos;âge sont utilisées pour créer des divisions. Les divisions sont ensuite
        utilisées pour organiser les participants en catégories, et pour organiser les phases de
        compétition.
      </p>

      <label className="mui-input-label" htmlFor="division-name-input">
        Nom
      </label>
      <input
        id="division-name-input"
        className="mui-input"
        value={name}
        onChange={(e) => {
          setName(e.target.value);
          setNameError("");
        }}
        autoFocus
      />
      {nameError && <p className="auth-error">{nameError}</p>}

      <div className="location-logo-toggle">
        <span>Logo de la division</span>
        <label className="mui-toggle">
          <input
            type="checkbox"
            checked={showLogo}
            onChange={(e) => setShowLogo(e.target.checked)}
          />
          <span className="mui-toggle-slider" />
        </label>
      </div>

      {showLogo && (
        <div className="location-logo-upload">
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            className="location-logo-input"
            onChange={handleLogoChange}
          />
          {logo ? (
            <div className="location-logo-preview">
              <img src={logo} alt="Logo de la division" />
              <div className="location-logo-actions">
                <button type="button" className="btn-text" onClick={pickLogo}>
                  Changer
                </button>
                <button type="button" className="btn-text" onClick={() => setLogo(null)}>
                  Retirer
                </button>
              </div>
            </div>
          ) : (
            <button type="button" className="btn-outlined btn-full" onClick={pickLogo}>
              Télécharger un logo
            </button>
          )}
          <p className="location-hint">Format recommandé : PNG transparent, max 2 Mo.</p>
        </div>
      )}

      {formError && <p className="auth-error">{formError}</p>}
    </form>
  );
}
