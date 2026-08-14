import { useEffect, useMemo, useRef, useState } from "react";
import { useTournamentActions } from "../hooks/useTournamentActions";
import { REQUIRE_REFEREE_DIVISION_EVENT } from "../components/RefereeDivisionGuard";
import {
  generateRefereeToken,
  getRefereeConnectionUrl,
  REFEREE_ALL_DIVISIONS,
  REFEREE_OTHER_CLUB,
  findRefereeMissingDivision,
  refereeCoversDivision,
  refereeHasDivision,
  registerRefereeLink,
  stableRefereeToken,
} from "../utils/helpers";
import { REFEREE_EXPERIENCE_OPTIONS } from "../utils/refereeExperience";
import { downloadConnectionQrJpeg, formatConnectionLinkLabel } from "../utils/qrCode";

const BOOLEAN_FIELDS = new Set(["present", "disponible"]);
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const REFEREE_LEVELS = [
  { id: "officiel", label: "Officiel", value: "Officiel" },
  { id: "benevole", label: "Bénévole", value: "Bénévole" },
  { id: "joueur", label: "Joueur-arbitre", value: "Joueur-arbitre" },
];

function isCheckboxField(field) {
  if (!field) return false;
  if (typeof field === "string") return BOOLEAN_FIELDS.has(field);
  return BOOLEAN_FIELDS.has(field.id) || field.inputType === "checkbox";
}

function isValidEmail(value) {
  const email = String(value ?? "").trim();
  return email !== "" && EMAIL_PATTERN.test(email);
}

function getRefereeFieldValue(ref, fieldId, fieldMeta) {
  if (fieldId === "name") return ref.name ?? "";
  if (fieldId === "email") return ref.email ?? "";
  if (fieldId === "telephone") return ref.telephone ?? "";
  if (fieldId === "club") return ref.club ?? "";
  if (fieldId === "niveau") return ref.niveau ?? "";
  if (fieldId === "experience") return ref.experience ?? "";
  if (fieldId === "pays") return ref.pays ?? "";
  if (fieldId === "divisions") return ref.divisions ?? "";
  if (BOOLEAN_FIELDS.has(fieldId)) return Boolean(ref[fieldId]);
  if (fieldMeta?.inputType === "checkbox") {
    return Boolean(ref.fields?.[fieldId] ?? ref[fieldId]);
  }
  if (fieldId === "lien") return ref.connectionToken ? getRefereeConnectionUrl(ref.connectionToken) : "";
  return ref.fields?.[fieldId] ?? ref[fieldId] ?? "";
}

function compareValues(a, b) {
  if (typeof a === "boolean" && typeof b === "boolean") return Number(a) - Number(b);
  if (typeof a === "number" && typeof b === "number") return a - b;
  return String(a ?? "").localeCompare(String(b ?? ""), "fr", { sensitivity: "base" });
}

function refereeMatchesDivision(ref, division) {
  return refereeCoversDivision(ref.divisions, division);
}

export default function RefereesPage() {
  const {
    data,
    toggleRefereeField,
    addRefereeField,
    editRefereeField,
    deleteRefereeField,
    addReferee,
    editReferee,
    deleteSelectedReferees,
    duplicateSelectedReferees,
    exportReferees,
    importReferees,
    toggleTeamsAsReferees,
    openPrompt,
    openChoiceList,
    patch,
    showToast,
  } = useTournamentActions();

  const [selected, setSelected] = useState([]);
  const [infoOpen, setInfoOpen] = useState(false);
  const [divisionFilter, setDivisionFilter] = useState("all");
  const [sort, setSort] = useState({ key: "name", dir: "asc" });
  const [emailMenu, setEmailMenu] = useState(null);
  const [invalidDivisionIds, setInvalidDivisionIds] = useState(() => new Set());
  const importInputRef = useRef(null);
  const divisionSelectRefs = useRef(new Map());
  const knownRefereeIdsRef = useRef(null);

  const handleImportCsv = (event) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => importReferees(String(reader.result ?? ""));
    reader.onerror = () => showToast("Impossible de lire le fichier");
    reader.readAsText(file, "UTF-8");
  };

  const standardFields = (data.refereeFields || []).filter((f) => f.standard !== false);
  const extraFields = (data.refereeFields || []).filter((f) => f.standard === false);
  const tableColumns = [...standardFields.filter((f) => f.enabled), ...extraFields];

  const fieldsById = useMemo(() => {
    const map = new Map();
    (data.refereeFields || []).forEach((f) => map.set(f.id, f));
    return map;
  }, [data.refereeFields]);

  const divisionOptions = useMemo(() => {
    const options = [{ value: "all", label: REFEREE_ALL_DIVISIONS }];
    (data.divisions || []).forEach((d) => {
      options.push({ value: d.name, label: d.name });
    });
    return options;
  }, [data.divisions]);

  const clubOptions = useMemo(() => {
    const names = [...new Set((data.teams || []).map((t) => t.name).filter(Boolean))].sort((a, b) =>
      a.localeCompare(b, "fr", { sensitivity: "base" })
    );
    return [
      { value: REFEREE_OTHER_CLUB, label: REFEREE_OTHER_CLUB },
      ...names.map((name) => ({ value: name, label: name })),
    ];
  }, [data.teams]);

  const emptyDivisionReferee = useMemo(
    () => findRefereeMissingDivision(data.referees),
    [data.referees]
  );

  const displayedReferees = useMemo(() => {
    const filtered = (data.referees || []).filter((ref) =>
      refereeMatchesDivision(ref, divisionFilter)
    );
    if (emptyDivisionReferee && !filtered.some((ref) => ref.id === emptyDivisionReferee.id)) {
      filtered.unshift(emptyDivisionReferee);
    }
    const sorted = [...filtered];
    sorted.sort((a, b) => {
      const meta = fieldsById.get(sort.key);
      const av = getRefereeFieldValue(a, sort.key, meta);
      const bv = getRefereeFieldValue(b, sort.key, meta);
      const cmp = compareValues(av, bv);
      return sort.dir === "asc" ? cmp : -cmp;
    });
    return sorted;
  }, [data.referees, divisionFilter, sort, fieldsById, emptyDivisionReferee]);

  const markDivisionInvalid = (id) => {
    setInvalidDivisionIds((prev) => {
      if (prev.has(id)) return prev;
      const next = new Set(prev);
      next.add(id);
      return next;
    });
  };

  const clearDivisionInvalid = (id) => {
    setInvalidDivisionIds((prev) => {
      if (!prev.has(id)) return prev;
      const next = new Set(prev);
      next.delete(id);
      return next;
    });
  };

  const focusDivisionSelect = (id) => {
    const el = divisionSelectRefs.current.get(id);
    if (!el) return;
    el.focus();
  };

  useEffect(() => {
    const ids = new Set((data.referees || []).map((ref) => ref.id));
    if (knownRefereeIdsRef.current == null) {
      knownRefereeIdsRef.current = ids;
      return;
    }
    const added = [...ids].filter((id) => !knownRefereeIdsRef.current.has(id));
    knownRefereeIdsRef.current = ids;
    const newEmpty = added
      .map((id) => (data.referees || []).find((ref) => ref.id === id))
      .find((ref) => ref && !refereeHasDivision(ref));
    if (!newEmpty) return;
    const frame = requestAnimationFrame(() => focusDivisionSelect(newEmpty.id));
    return () => cancelAnimationFrame(frame);
  }, [data.referees]);

  useEffect(() => {
    const onRequire = () => {
      const missing = findRefereeMissingDivision(data.referees);
      if (!missing) return;
      markDivisionInvalid(missing.id);
      requestAnimationFrame(() => {
        const el = divisionSelectRefs.current.get(missing.id);
        if (!el) return;
        el.focus();
        if (typeof el.showPicker === "function") {
          try {
            el.showPicker();
          } catch {
            // showPicker can fail if not triggered by a user gesture
          }
        }
      });
    };
    window.addEventListener(REQUIRE_REFEREE_DIVISION_EVENT, onRequire);
    return () => window.removeEventListener(REQUIRE_REFEREE_DIVISION_EVENT, onRequire);
  }, [data.referees]);

  useEffect(() => {
    setInvalidDivisionIds((prev) => {
      const validIds = new Set((data.referees || []).map((ref) => ref.id));
      let changed = false;
      const next = new Set();
      prev.forEach((id) => {
        if (!validIds.has(id)) {
          changed = true;
          return;
        }
        const ref = (data.referees || []).find((r) => r.id === id);
        if (ref && refereeHasDivision(ref)) {
          changed = true;
          return;
        }
        next.add(id);
      });
      return changed ? next : prev;
    });
  }, [data.referees]);

  const allVisibleIds = displayedReferees.map((ref) => ref.id);
  const allSelected = allVisibleIds.length > 0 && allVisibleIds.every((id) => selected.includes(id));

  const toggleSelect = (id) => {
    setSelected((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  };

  const toggleSelectAll = () => {
    setSelected((prev) => {
      if (allSelected) return prev.filter((id) => !allVisibleIds.includes(id));
      return [...new Set([...prev, ...allVisibleIds])];
    });
  };

  const clearSelection = () => setSelected([]);

  const toggleSort = (key) => {
    setSort((prev) => {
      if (prev.key === key) return { key, dir: prev.dir === "asc" ? "desc" : "asc" };
      return { key, dir: "asc" };
    });
  };

  const sortIcon = (key) => {
    if (sort.key !== key) return null;
    return (
      <span className="material-icons md-18 sort-icon" aria-hidden="true">
        {sort.dir === "asc" ? "arrow_upward" : "arrow_downward"}
      </span>
    );
  };

  const updateReferee = (refereeId, updater) => {
    patch((p) => ({
      referees: p.referees.map((r) => (r.id === refereeId ? updater(r) : r)),
    }));
  };

  const setRefereeFieldValue = (ref, fieldId, value, fieldMeta) => {
    if (fieldId === "email") return { ...ref, email: value };
    if (fieldId === "telephone") return { ...ref, telephone: value };
    if (fieldId === "club") return { ...ref, club: value };
    if (fieldId === "niveau") return { ...ref, niveau: value };
    if (fieldId === "experience") return { ...ref, experience: value };
    if (fieldId === "pays") return { ...ref, pays: value };
    if (fieldId === "divisions") return { ...ref, divisions: value };
    if (BOOLEAN_FIELDS.has(fieldId)) return { ...ref, [fieldId]: value };
    if (fieldMeta?.inputType === "checkbox") {
      return { ...ref, fields: { ...(ref.fields || {}), [fieldId]: Boolean(value) } };
    }
    return { ...ref, fields: { ...(ref.fields || {}), [fieldId]: value } };
  };

  const editTextField = (ref, field) => {
    openPrompt({
      title: field.label,
      label: field.label,
      defaultValue: String(getRefereeFieldValue(ref, field.id, field) || ""),
      onSubmit: (value) => {
        updateReferee(ref.id, (r) => setRefereeFieldValue(r, field.id, value, field));
        showToast("Mis à jour");
      },
    });
  };

  const editNiveau = (ref) => {
    openChoiceList({
      title: "Niveau",
      message: "Choisissez le niveau de l'arbitre",
      options: REFEREE_LEVELS,
      onSelect: (option) => {
        updateReferee(ref.id, (r) => ({ ...r, niveau: option.value }));
        showToast("Mis à jour");
      },
    });
  };

  const toggleBooleanField = (ref, field) => {
    const fieldMeta = typeof field === "object" ? field : fieldsById.get(field);
    const fieldId = typeof field === "object" ? field.id : field;
    updateReferee(ref.id, (r) =>
      setRefereeFieldValue(r, fieldId, !getRefereeFieldValue(r, fieldId, fieldMeta), fieldMeta)
    );
  };

  const ensureRefereeLink = (ref) => {
    const token = ref.connectionToken || stableRefereeToken(ref.id) || generateRefereeToken();
    if (ref.connectionToken !== token) {
      updateReferee(ref.id, (r) => ({ ...r, connectionToken: token }));
    }
    try {
      registerRefereeLink(token, ref.id, null);
      const rawKeys = Object.keys(localStorage).filter(
        (key) => key === "gestion-tournoi-data" || key.startsWith("gestion-tournoi-data-")
      );
      rawKeys.forEach((key) => {
        try {
          const parsed = JSON.parse(localStorage.getItem(key) || "null");
          if (!parsed?.referees) return;
          const nextReferees = parsed.referees.map((r) =>
            r.id === ref.id ? { ...r, connectionToken: token } : r
          );
          localStorage.setItem(key, JSON.stringify({ ...parsed, referees: nextReferees }));
          registerRefereeLink(token, ref.id, key);
        } catch {
          // ignore per-key errors
        }
      });
    } catch {
      // ignore
    }
    return token;
  };

  const copyRefereeLink = async (ref) => {
    const token = ensureRefereeLink(ref);
    const url = getRefereeConnectionUrl(token);
    try {
      await navigator.clipboard.writeText(url);
      showToast("Lien de connexion copié");
    } catch {
      showToast("Impossible de copier le lien");
    }
  };

  const openRefereeLink = (ref) => {
    const token = ensureRefereeLink(ref);
    window.open(getRefereeConnectionUrl(token), "_blank", "noopener,noreferrer");
  };

  const downloadRefereeQr = async (ref) => {
    const token = ensureRefereeLink(ref);
    const url = getRefereeConnectionUrl(token);
    try {
      const filename = await downloadConnectionQrJpeg(url, ref.name, data.name || "tournoi");
      showToast(`QR code téléchargé (${filename})`);
    } catch {
      showToast("Impossible de générer le QR code");
    }
  };

  const openEmailComposeMenu = (event, email) => {
    event.preventDefault();
    event.stopPropagation();
    setEmailMenu({ email, x: event.clientX, y: event.clientY });
  };

  const closeEmailMenu = () => setEmailMenu(null);

  const openGmailCompose = (email) => {
    window.open(
      `https://mail.google.com/mail/?view=cm&fs=1&to=${encodeURIComponent(email)}`,
      "_blank",
      "noopener,noreferrer"
    );
    closeEmailMenu();
  };

  const openOutlookCompose = (email) => {
    window.open(
      `https://outlook.live.com/mail/0/deeplink/compose?to=${encodeURIComponent(email)}`,
      "_blank",
      "noopener,noreferrer"
    );
    closeEmailMenu();
  };

  const copyEmailAddress = async (email) => {
    try {
      await navigator.clipboard.writeText(email);
      showToast("Adresse e-mail copiée");
    } catch {
      showToast("Impossible de copier l'adresse");
    }
    closeEmailMenu();
  };

  const renderColumnCell = (ref, field) => {
    const value = getRefereeFieldValue(ref, field.id, field);

    if (isCheckboxField(field)) {
      return (
        <input
          type="checkbox"
          className="mui-checkbox"
          checked={Boolean(value)}
          onChange={() => toggleBooleanField(ref, field)}
        />
      );
    }

    if (field.id === "lien") {
      const label = ref.connectionToken
        ? formatConnectionLinkLabel(getRefereeConnectionUrl(ref.connectionToken))
        : formatConnectionLinkLabel(window.location.origin);
      return (
        <div className="team-link-actions">
          <button
            type="button"
            className="btn-text team-link-label"
            style={{ padding: 0, textTransform: "none" }}
            onContextMenu={(e) => {
              if (!e.ctrlKey && !e.metaKey) return;
              e.preventDefault();
              openRefereeLink(ref);
            }}
            title="Ctrl + clic droit pour ouvrir le lien"
          >
            {label}
          </button>
          <button
            type="button"
            className="list-row-edit"
            onClick={() => downloadRefereeQr(ref)}
            aria-label="Télécharger le QR code"
            title="Télécharger le QR code (JPEG)"
          >
            <span className="material-icons md-20" style={{ color: "var(--text-secondary)" }}>
              qr_code_2
            </span>
          </button>
          <button
            type="button"
            className="list-row-edit"
            onClick={() => copyRefereeLink(ref)}
            aria-label="Copier le lien de connexion"
            title="Copier le lien"
          >
            <span className="material-icons md-20" style={{ color: "var(--text-secondary)" }}>
              content_copy
            </span>
          </button>
        </div>
      );
    }

    if (field.id === "email") {
      const email = String(value || "").trim();
      const valid = isValidEmail(email);
      return (
        <button
          type="button"
          className={`btn-text${email && !valid ? " btn-text-invalid" : ""}`}
          style={{ padding: 0, textTransform: "none" }}
          onClick={() => editTextField(ref, field)}
          onContextMenu={(e) => {
            if (!e.ctrlKey && !e.metaKey) return;
            if (!valid) return;
            openEmailComposeMenu(e, email);
          }}
          title={valid ? "Ctrl + clic droit pour envoyer un e-mail" : undefined}
        >
          {email || "Ajouter"}
        </button>
      );
    }

    if (field.id === "divisions") {
      const options = [...divisionOptions.filter((opt) => opt.value !== "all")];
      options.unshift({ value: REFEREE_ALL_DIVISIONS, label: REFEREE_ALL_DIVISIONS });
      if (value && !options.some((opt) => opt.value === value)) {
        options.push({ value, label: value });
      }
      const isInvalid = invalidDivisionIds.has(ref.id);
      const isRequiredSelect = emptyDivisionReferee?.id === ref.id;
      return (
        <select
          ref={(el) => {
            if (el) divisionSelectRefs.current.set(ref.id, el);
            else divisionSelectRefs.current.delete(ref.id);
          }}
          className={`table-cell-select${isInvalid ? " is-invalid" : ""}`}
          value={value || ""}
          required
          aria-required="true"
          aria-invalid={isInvalid}
          data-referee-division-select={isRequiredSelect ? "true" : undefined}
          onChange={(e) => {
            const next = e.target.value;
            updateReferee(ref.id, (r) => ({ ...r, divisions: next }));
            if (next) clearDivisionInvalid(ref.id);
            else markDivisionInvalid(ref.id);
          }}
          onBlur={(e) => {
            if (String(e.target.value || "").trim()) {
              clearDivisionInvalid(ref.id);
              return;
            }
            markDivisionInvalid(ref.id);
            requestAnimationFrame(() => focusDivisionSelect(ref.id));
          }}
          aria-label="Division"
        >
          {!value ? <option value="">Choisir</option> : null}
          {options.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
      );
    }

    if (field.id === "club") {
      const options = [...clubOptions];
      if (value && !options.some((opt) => opt.value === value)) {
        options.splice(1, 0, { value, label: value });
      }
      return (
        <select
          className="table-cell-select"
          value={value || ""}
          onChange={(e) => updateReferee(ref.id, (r) => ({ ...r, club: e.target.value }))}
          aria-label="Club"
          title={
            value === REFEREE_OTHER_CLUB
              ? "Aucune appartenance aux clubs du tournoi — pas de conflit d'arbitrage"
              : undefined
          }
        >
          <option value="">Choisir</option>
          {options.map((opt) => (
            <option
              key={opt.value}
              value={opt.value}
              title={
                opt.value === REFEREE_OTHER_CLUB
                  ? "Aucune appartenance aux clubs du tournoi — pas de conflit d'arbitrage"
                  : undefined
              }
            >
              {opt.label}
            </option>
          ))}
        </select>
      );
    }

    if (field.id === "niveau") {
      return (
        <button
          type="button"
          className="btn-text"
          style={{ padding: 0, textTransform: "none" }}
          onClick={() => editNiveau(ref)}
        >
          {value || "Ajouter"}
        </button>
      );
    }

    if (field.id === "experience") {
      return (
        <select
          className="table-cell-select"
          value={value || "Normal"}
          onChange={(e) => updateReferee(ref.id, (r) => ({ ...r, experience: e.target.value }))}
          aria-label="Expérience"
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
      <button
        type="button"
        className="btn-text"
        style={{ padding: 0, textTransform: "none" }}
        onClick={() => editTextField(ref, field)}
      >
        {value || "Ajouter"}
      </button>
    );
  };

  const filterControl = (
    <div className="teams-filter-bar">
      <label className="teams-filter">
        <span className="teams-filter-label">Division</span>
        <select
          className="teams-filter-select"
          value={divisionFilter}
          onChange={(e) => setDivisionFilter(e.target.value)}
          aria-label="Filtrer par division"
        >
          {divisionOptions.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
      </label>
    </div>
  );

  const hasReferees = (data.referees || []).length > 0;

  const teamsAsRefereesToggle = (
    <label className="referees-teams-toggle">
      <span className="mui-toggle">
        <input
          type="checkbox"
          checked={Boolean(data.teamsAsReferees)}
          onChange={toggleTeamsAsReferees}
        />
        <span className="mui-toggle-slider" />
      </span>
      <span>Équipes en qualité d&apos;arbitres</span>
    </label>
  );

  return (
    <div className="page-container-wide">
      {emailMenu && (
        <>
          <button type="button" className="email-menu-backdrop" aria-label="Fermer" onClick={closeEmailMenu} />
          <div className="email-compose-menu" style={{ top: emailMenu.y, left: emailMenu.x }} role="menu">
            <button type="button" role="menuitem" onClick={() => openGmailCompose(emailMenu.email)}>
              Écrire avec Gmail
            </button>
            <button type="button" role="menuitem" onClick={() => openOutlookCompose(emailMenu.email)}>
              Écrire avec Outlook
            </button>
            <button type="button" role="menuitem" onClick={() => copyEmailAddress(emailMenu.email)}>
              Copier l&apos;adresse
            </button>
          </div>
        </>
      )}

      <div className={`config-card config-card-collapsible teams-info-card${infoOpen ? " is-open" : ""}`}>
        <button
          type="button"
          className="config-card-toggle"
          onClick={() => setInfoOpen((open) => !open)}
          aria-expanded={infoOpen}
        >
          Informations sur l&apos;arbitre
          <span className="material-icons" aria-hidden="true">
            {infoOpen ? "expand_less" : "expand_more"}
          </span>
        </button>
        {infoOpen && (
          <div className="config-card-body">
            <p className="section-desc teams-info-intro">
              Indiquez quelles sont les informations sur les arbitres qui vous intéressent.
            </p>

            <h4 className="config-card-section-title">Champs d&apos;information standard</h4>
            <ul className="field-list">
              {standardFields.map((f) => (
                <li key={f.id}>
                  <span className="field-list-label">
                    {f.label}
                    {f.help && (
                      <span
                        className="field-help"
                        tabIndex={0}
                        aria-label={
                          f.id === "experience"
                            ? "Novice : besoin d'un accompagnateur. Normal : arbitre seul. Accompagnateur : peut aussi encadrer un novice."
                            : "Au moyen d'un lien de connexion unique, l'arbitre peut consulter ses matchs et saisir les scores via le site public du tournoi."
                        }
                      >
                        <span className="material-icons md-18" aria-hidden="true">
                          help_outline
                        </span>
                        <span className="field-help-tooltip" role="tooltip">
                          {f.id === "experience" ? (
                            <>
                              Novice : besoin d&apos;un accompagnateur sur le terrain. Normal :
                              peut arbitrer seul. Accompagnateur : peut arbitrer seul et encadrer
                              un novice. Le placement garde chaque arbitre sur un même terrain.
                            </>
                          ) : (
                            <>
                              Au moyen d&apos;un lien de connexion unique, l&apos;arbitre peut
                              consulter ses matchs, terrains et scores via le site public du
                              tournoi.
                            </>
                          )}
                        </span>
                      </span>
                    )}
                  </span>
                  <input
                    type="checkbox"
                    className="mui-checkbox"
                    checked={f.enabled}
                    onChange={() => toggleRefereeField(f.id)}
                  />
                </li>
              ))}
            </ul>

            {extraFields.length > 0 && (
              <>
                <h4 className="config-card-section-title">Champs d&apos;information supplémentaires</h4>
                <ul className="field-list">
                  {extraFields.map((f) => (
                    <li key={f.id}>
                      <span>
                        {f.label}
                        {f.inputType === "checkbox" ? (
                          <span className="field-type-hint"> (case à cocher)</span>
                        ) : null}
                      </span>
                      <div className="field-list-actions">
                        <button
                          type="button"
                          className="list-row-edit"
                          onClick={() => editRefereeField(f.id)}
                          aria-label="Modifier"
                        >
                          <span className="material-icons md-20" style={{ color: "var(--text-secondary)" }}>
                            edit
                          </span>
                        </button>
                        <button
                          type="button"
                          className="list-row-edit"
                          onClick={() => deleteRefereeField(f.id)}
                          aria-label="Supprimer"
                        >
                          <span className="material-icons md-20" style={{ color: "var(--text-secondary)" }}>
                            delete
                          </span>
                        </button>
                      </div>
                    </li>
                  ))}
                </ul>
              </>
            )}

            <button type="button" className="btn-outlined btn-full" onClick={addRefereeField}>
              Ajouter un champ d&apos;information
            </button>
          </div>
        )}
      </div>

      {!hasReferees ? (
        <div className="empty-state">
          <div className="admin-empty-icon material-icons">sports</div>
          <h2>Ajouter des arbitres</h2>
          <p>
            Gérez la liste des arbitres du tournoi, leurs informations et leur lien de connexion
            pour consulter leurs matchs.
          </p>
          <div className="referees-empty-toggle">{teamsAsRefereesToggle}</div>
          <div className="data-table-toolbar-actions" style={{ justifyContent: "center" }}>
            <button type="button" className="btn-outlined" onClick={() => importInputRef.current?.click()}>
              Importer CSV
            </button>
            <button type="button" className="btn-outlined primary" onClick={addReferee}>
              Ajouter un arbitre
            </button>
          </div>
        </div>
      ) : (
        <div className="data-table-wrap">
          {selected.length > 0 ? (
            <div className="teams-selection-banner">
              <span className="teams-selection-count">
                {selected.length} sélectionné{selected.length > 1 ? "s" : ""}
              </span>
              <div className="teams-selection-actions">
                {teamsAsRefereesToggle}
                {filterControl}
                <button type="button" className="teams-selection-btn" onClick={() => exportReferees(selected)}>
                  Exporter
                  <span className="material-icons md-18">download</span>
                </button>
                <button
                  type="button"
                  className="teams-selection-btn"
                  onClick={() => duplicateSelectedReferees(selected, clearSelection)}
                >
                  Dupliqué
                  <span className="material-icons md-18">content_copy</span>
                </button>
                <button
                  type="button"
                  className="teams-selection-btn"
                  onClick={() => deleteSelectedReferees(selected, clearSelection)}
                >
                  Supprimé
                  <span className="material-icons md-18">delete</span>
                </button>
              </div>
            </div>
          ) : (
            <div className="data-table-toolbar">
              <div className="referees-toolbar-start">
                {teamsAsRefereesToggle}
                {filterControl}
              </div>
              <div className="data-table-toolbar-actions">
                <button type="button" className="btn-outlined" onClick={() => importInputRef.current?.click()}>
                  Importer CSV
                </button>
                <button type="button" className="btn-outlined" onClick={() => exportReferees()}>
                  Exporter
                </button>
                <button type="button" className="btn-outlined primary" onClick={addReferee}>
                  Ajouter un arbitre
                </button>
              </div>
            </div>
          )}
          <table className="data-table">
            <thead>
              <tr>
                <th style={{ width: 40 }}>
                  <input
                    type="checkbox"
                    className="mui-checkbox"
                    checked={allSelected}
                    onChange={toggleSelectAll}
                    aria-label="Tout sélectionner"
                  />
                </th>
                <th>
                  <button type="button" className="th-sort-btn" onClick={() => toggleSort("name")}>
                    Nom
                    {sortIcon("name")}
                  </button>
                </th>
                {tableColumns.map((col) => (
                  <th key={col.id}>
                    <button type="button" className="th-sort-btn" onClick={() => toggleSort(col.id)}>
                      {col.label}
                      {sortIcon(col.id)}
                    </button>
                  </th>
                ))}
                <th style={{ width: 40 }} />
              </tr>
            </thead>
            <tbody>
              {displayedReferees.map((ref) => {
                const isSelected = selected.includes(ref.id);
                return (
                  <tr key={ref.id} className={isSelected ? "is-selected" : ""}>
                    <td>
                      <input
                        type="checkbox"
                        className="mui-checkbox"
                        checked={isSelected}
                        onChange={() => toggleSelect(ref.id)}
                      />
                    </td>
                    <td>{ref.name}</td>
                    {tableColumns.map((col) => (
                      <td key={col.id}>{renderColumnCell(ref, col)}</td>
                    ))}
                    <td>
                      <button type="button" className="list-row-edit" onClick={() => editReferee(ref.id)}>
                        <span className="material-icons md-20">edit</span>
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          <div className="data-table-footer">
            <span>Nombre de lignes par page: 100</span>
            <span>
              1-{displayedReferees.length} de {displayedReferees.length}
            </span>
          </div>
        </div>
      )}

      <input
        ref={importInputRef}
        type="file"
        accept=".csv,text/csv"
        hidden
        onChange={handleImportCsv}
      />
    </div>
  );
}
