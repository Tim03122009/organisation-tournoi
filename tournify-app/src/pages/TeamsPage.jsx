import { useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { useTournamentActions } from "../hooks/useTournamentActions";
import { generateTeamToken, getTeamConnectionUrl, registerTeamLink, stableTeamToken } from "../utils/helpers";
import { mapStoredTournaments } from "../utils/storedTournaments";
import { downloadConnectionQrJpeg, formatConnectionLinkLabel } from "../utils/qrCode";
import EmptyJersey from "../components/EmptyJersey";

const BOOLEAN_FIELDS = new Set(["present", "paye", "ajoute"]);
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function isCheckboxField(field) {
  if (!field) return false;
  if (typeof field === "string") return BOOLEAN_FIELDS.has(field);
  return BOOLEAN_FIELDS.has(field.id) || field.inputType === "checkbox";
}

function isTruthyCheckbox(value) {
  if (typeof value === "boolean") return value;
  const v = String(value ?? "")
    .trim()
    .toLowerCase();
  return ["oui", "yes", "true", "1", "x"].includes(v);
}

function isValidEmail(value) {
  const email = String(value ?? "").trim();
  return email !== "" && EMAIL_PATTERN.test(email);
}

function getPlayerCount(team) {
  if (Array.isArray(team?.playerList)) return team.playerList.length;
  return Number(team?.players) || 0;
}

function getTeamFieldValue(team, fieldId, fieldMeta) {
  if (fieldId === "name") return team.name ?? "";
  if (fieldId === "joueurs") return getPlayerCount(team);
  if (fieldId === "email") return team.email ?? "";
  if (fieldId === "departement" || fieldId === "region") {
    return team.departement ?? team.region ?? "";
  }
  if (fieldId === "division") return team.division ?? "";
  if (BOOLEAN_FIELDS.has(fieldId)) return Boolean(team[fieldId]);
  if (fieldMeta?.inputType === "checkbox") {
    return isTruthyCheckbox(team.fields?.[fieldId] ?? team[fieldId]);
  }
  if (fieldId === "logo") return team.logo ?? null;
  if (fieldId === "lien") return team.connectionToken ? getTeamConnectionUrl(team.connectionToken) : "";
  return team.fields?.[fieldId] ?? team[fieldId] ?? "";
}

function compareValues(a, b) {
  if (typeof a === "boolean" && typeof b === "boolean") return Number(a) - Number(b);
  if (typeof a === "number" && typeof b === "number") return a - b;
  return String(a ?? "").localeCompare(String(b ?? ""), "fr", { sensitivity: "base" });
}

function hasCriterionValue(team, fieldId, fieldMeta) {
  const value = getTeamFieldValue(team, fieldId, fieldMeta);
  if (fieldId === "email") return isValidEmail(value);
  if (isCheckboxField(fieldMeta || fieldId)) return Boolean(value);
  if (fieldId === "joueurs") return Number(value) > 0;
  if (fieldId === "logo") return Boolean(value);
  return String(value ?? "").trim() !== "";
}

function teamMatchesFilters(team, category, criterion, criterionAsc, fieldMeta) {
  if (category && category !== "all" && (team.division || "") !== category) {
    return false;
  }
  if (!criterion || criterion === "none") return true;
  const positive = hasCriterionValue(team, criterion, fieldMeta);
  return criterionAsc ? positive : !positive;
}

export default function TeamsPage() {
  const {
    data,
    toggleTeamField,
    addTeamField,
    editTeamField,
    deleteTeamField,
    togglePlayerField,
    addPlayerField,
    editPlayerField,
    deletePlayerField,
    toggleInscriptionQuestion,
    switchToIndividualSport,
    addTeam,
    editTeam,
    openTeamPlayers,
    deleteSelectedTeams,
    duplicateSelectedTeams,
    moveSelectedTeams,
    exportTeams,
    importTeams,
    openPrompt,
    patch,
    showToast,
  } = useTournamentActions();

  const [selected, setSelected] = useState([]);
  const [teamsInfoOpen, setTeamsInfoOpen] = useState(false);
  const [category, setCategory] = useState("all");
  const [criterion, setCriterion] = useState("none");
  const [criterionAsc, setCriterionAsc] = useState(true);
  const [sort, setSort] = useState({ key: "name", dir: "asc" });
  const [emailMenu, setEmailMenu] = useState(null);
  const [logoPreview, setLogoPreview] = useState(null);
  const importInputRef = useRef(null);
  const logoInputRef = useRef(null);
  const logoTargetIdRef = useRef(null);

  const handleImportCsv = (event) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => importTeams(String(reader.result ?? ""));
    reader.onerror = () => showToast("Impossible de lire le fichier");
    reader.readAsText(file, "UTF-8");
  };

  const inscriptionQuestions = data.inscriptionQuestions || [];
  const standardTeamFields = data.teamFields.filter((f) => f.standard !== false);
  const extraTeamFields = data.teamFields.filter((f) => f.standard === false);

  const tableColumns = [
    ...standardTeamFields.filter((f) => f.enabled),
    ...extraTeamFields,
    ...inscriptionQuestions.filter((q) => q.enabled).map((q) => ({
      id: q.id,
      label: q.label,
      kind: "inscription",
    })),
  ];

  const fieldsById = useMemo(() => {
    const map = new Map();
    (data.teamFields || []).forEach((f) => map.set(f.id, f));
    inscriptionQuestions.forEach((q) => map.set(q.id, q));
    return map;
  }, [data.teamFields, inscriptionQuestions]);

  const categoryOptions = useMemo(() => {
    const options = [{ value: "all", label: "Toutes les catégories" }];
    (data.divisions || []).forEach((d) => {
      options.push({ value: d.name, label: d.name });
    });
    return options;
  }, [data.divisions]);

  const criterionOptions = useMemo(() => {
    const options = [{ value: "none", label: "Aucun critère" }];
    const seen = new Set();

    const pushOption = (id, label) => {
      if (!id || id === "lien" || seen.has(id)) return;
      seen.add(id);
      options.push({ value: id, label });
    };

    // Critères fixes (toujours proposés)
    [
      { id: "present", label: "Présent" },
      { id: "paye", label: "Payé" },
      { id: "email", label: "E-mail" },
      { id: "ajoute", label: "Ajouté" },
      { id: "pays", label: "Pays" },
      { id: "logo", label: "Logo" },
      { id: "vestiaire", label: "Vestiaire" },
      { id: "joueurs", label: "Joueurs" },
    ].forEach((f) => pushOption(f.id, f.label));

    // Champs supplémentaires + questions d'inscription
    extraTeamFields.forEach((f) => pushOption(f.id, f.label));
    inscriptionQuestions
      .filter((q) => q.enabled)
      .forEach((q) => pushOption(q.id, q.label));

    return options;
  }, [extraTeamFields, inscriptionQuestions]);

  const displayedTeams = useMemo(() => {
    const inCategory = data.teams.filter(
      (team) => category === "all" || (team.division || "") === category
    );

    const withMeta = inCategory.map((team) => ({
      team,
      matches: teamMatchesFilters(
        team,
        "all",
        criterion,
        criterionAsc,
        fieldsById.get(criterion)
      ),
    }));

    withMeta.sort((a, b) => {
      if (a.matches !== b.matches) return a.matches ? -1 : 1;

      if (criterion && criterion !== "none") {
        const meta = fieldsById.get(criterion);
        const av = getTeamFieldValue(a.team, criterion, meta);
        const bv = getTeamFieldValue(b.team, criterion, meta);
        const cmp = compareValues(av, bv);
        if (cmp !== 0) return criterionAsc ? cmp : -cmp;
      }

      const sortMeta = fieldsById.get(sort.key);
      const av = getTeamFieldValue(a.team, sort.key, sortMeta);
      const bv = getTeamFieldValue(b.team, sort.key, sortMeta);
      const cmp = compareValues(av, bv);
      return sort.dir === "asc" ? cmp : -cmp;
    });

    return withMeta;
  }, [data.teams, category, criterion, criterionAsc, sort, fieldsById]);

  const allVisibleIds = displayedTeams.map(({ team }) => team.id);
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
      if (prev.key === key) {
        return { key, dir: prev.dir === "asc" ? "desc" : "asc" };
      }
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

  const updateTeam = (teamId, updater) => {
    patch((p) => ({
      teams: p.teams.map((t) => (t.id === teamId ? updater(t) : t)),
    }));
  };

  const setTeamFieldValue = (team, fieldId, value, fieldMeta) => {
    if (fieldId === "joueurs") return { ...team, players: value };
    if (fieldId === "email") return { ...team, email: value };
    if (fieldId === "departement" || fieldId === "region") {
      return { ...team, departement: value, region: value };
    }
    if (BOOLEAN_FIELDS.has(fieldId)) return { ...team, [fieldId]: value };
    if (fieldMeta?.inputType === "checkbox") {
      return {
        ...team,
        fields: { ...(team.fields || {}), [fieldId]: Boolean(value) },
      };
    }
    if (fieldId === "logo") return { ...team, logo: value };
    return {
      ...team,
      fields: { ...(team.fields || {}), [fieldId]: value },
    };
  };

  const editTextField = (team, field) => {
    openPrompt({
      title: field.label,
      label: field.label,
      defaultValue: String(getTeamFieldValue(team, field.id, field) || ""),
      autocomplete:
        field.id === "departement" || field.id === "region" ? "frenchDepartments" : null,
      onSubmit: (value) => {
        updateTeam(team.id, (t) => setTeamFieldValue(t, field.id, value, field));
        showToast("Mis à jour");
      },
    });
  };

  const toggleBooleanField = (team, field) => {
    const fieldMeta = typeof field === "object" ? field : fieldsById.get(field);
    const fieldId = typeof field === "object" ? field.id : field;
    updateTeam(team.id, (t) =>
      setTeamFieldValue(
        t,
        fieldId,
        !getTeamFieldValue(t, fieldId, fieldMeta),
        fieldMeta
      )
    );
  };

  const ensureTeamLink = (team) => {
    const token = team.connectionToken || stableTeamToken(team.id) || generateTeamToken();
    if (team.connectionToken !== token) {
      updateTeam(team.id, (t) => ({ ...t, connectionToken: token }));
    }
    try {
      registerTeamLink(token, team.id, null);
      // Flush current tournament snapshot so /equipe/:token finds the team immediately
      const rawKeys = Object.keys(localStorage).filter(
        (key) => key === "gestion-tournoi-data" || key.startsWith("gestion-tournoi-data-")
      );
      rawKeys.forEach((key) => {
        try {
          const parsed = JSON.parse(localStorage.getItem(key) || "null");
          if (!parsed) return;
          const next = mapStoredTournaments(parsed, (tournament) => {
            if (!(tournament.teams || []).some((t) => t.id === team.id)) return tournament;
            return {
              ...tournament,
              teams: tournament.teams.map((t) =>
                t.id === team.id ? { ...t, connectionToken: token } : t
              ),
            };
          });
          localStorage.setItem(key, JSON.stringify(next));
          registerTeamLink(token, team.id, key);
        } catch {
          // ignore per-key errors
        }
      });
    } catch {
      // ignore
    }
    return token;
  };

  const copyTeamLink = async (team) => {
    const token = ensureTeamLink(team);
    const url = getTeamConnectionUrl(token);
    try {
      await navigator.clipboard.writeText(url);
      showToast("Lien de connexion copié");
    } catch {
      showToast("Impossible de copier le lien");
    }
  };

  const openTeamLink = (team) => {
    const token = ensureTeamLink(team);
    window.open(getTeamConnectionUrl(token), "_blank", "noopener,noreferrer");
  };

  const downloadTeamQr = async (team) => {
    const token = ensureTeamLink(team);
    const url = getTeamConnectionUrl(token);
    try {
      const filename = await downloadConnectionQrJpeg(url, team.name, data.name || "tournoi");
      showToast(`QR code téléchargé (${filename})`);
    } catch {
      showToast("Impossible de générer le QR code");
    }
  };

  const openEmailComposeMenu = (event, email) => {
    event.preventDefault();
    event.stopPropagation();
    setEmailMenu({
      email,
      x: event.clientX,
      y: event.clientY,
    });
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

  const openLogoPicker = (teamId) => {
    logoTargetIdRef.current = teamId;
    logoInputRef.current?.click();
  };

  const removeTeamLogo = (teamId) => {
    updateTeam(teamId, (t) => ({ ...t, logo: null }));
    showToast("Logo retiré");
  };

  const handleLogoFileChange = (event) => {
    const file = event.target.files?.[0];
    const teamId = logoTargetIdRef.current;
    event.target.value = "";
    logoTargetIdRef.current = null;
    if (!file || teamId == null) return;

    if (!file.type.startsWith("image/")) {
      showToast("Le logo doit être une image");
      return;
    }
    if (file.size > 2 * 1024 * 1024) {
      showToast("Le logo ne doit pas dépasser 2 Mo");
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = typeof reader.result === "string" ? reader.result : null;
      if (!dataUrl) {
        showToast("Impossible de lire le fichier");
        return;
      }
      updateTeam(teamId, (t) => ({ ...t, logo: dataUrl }));
      showToast("Logo ajouté");
    };
    reader.onerror = () => showToast("Impossible de lire le fichier");
    reader.readAsDataURL(file);
  };

  const renderColumnCell = (team, field) => {
    const value = getTeamFieldValue(team, field.id, field);

    if (isCheckboxField(field)) {
      return (
        <input
          type="checkbox"
          className="mui-checkbox"
          checked={Boolean(value)}
          onChange={() => toggleBooleanField(team, field)}
        />
      );
    }

    if (field.id === "logo") {
      if (team.logo) {
        return (
          <div className="team-logo-cell">
            <button
              type="button"
              className="team-logo-thumb"
              onClick={() => openLogoPicker(team.id)}
              onContextMenu={(e) => {
                if (!e.ctrlKey && !e.metaKey) return;
                e.preventDefault();
                setLogoPreview({ src: team.logo, name: team.name });
              }}
              title="Changer le logo — Ctrl + clic droit pour agrandir"
              aria-label={`Changer le logo de ${team.name}`}
            >
              <img src={team.logo} alt="" />
            </button>
            <button
              type="button"
              className="list-row-edit"
              onClick={() => removeTeamLogo(team.id)}
              title="Supprimer le logo"
              aria-label={`Supprimer le logo de ${team.name}`}
            >
              <span className="material-icons md-18">close</span>
            </button>
          </div>
        );
      }
      return (
        <button
          type="button"
          className="list-row-edit"
          onClick={() => openLogoPicker(team.id)}
          title="Ajouter un logo"
          aria-label={`Ajouter un logo pour ${team.name}`}
        >
          <span className="material-icons md-20" style={{ color: "var(--text-secondary)" }}>
            cloud_upload
          </span>
        </button>
      );
    }

    if (field.id === "joueurs") {
      const count = getPlayerCount(team);
      return (
        <button
          type="button"
          className="btn-text team-players-count"
          style={{ padding: 0, textTransform: "none" }}
          onClick={() => openTeamPlayers(team.id)}
          title="Gérer les joueurs"
        >
          <span className="team-players-plus">+</span>
          <span className="material-icons md-18" aria-hidden="true">
            person
          </span>
          <span className="team-players-num">({count})</span>
        </button>
      );
    }

    if (field.id === "lien") {
      const label = team.connectionToken
        ? formatConnectionLinkLabel(getTeamConnectionUrl(team.connectionToken))
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
              openTeamLink(team);
            }}
            title="Ctrl + clic droit pour ouvrir le lien"
          >
            {label}
          </button>
          <button
            type="button"
            className="list-row-edit"
            onClick={() => downloadTeamQr(team)}
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
            onClick={() => copyTeamLink(team)}
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
          onClick={() => editTextField(team, field)}
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

    return (
      <button
        type="button"
        className="btn-text"
        style={{ padding: 0, textTransform: "none" }}
        onClick={() => editTextField(team, field)}
      >
        {value || "Ajouter"}
      </button>
    );
  };

  const filterControl = (
    <div className="teams-filter-bar">
      <label className="teams-filter">
        <span className="teams-filter-label">Catégorie</span>
        <select
          className="teams-filter-select"
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          aria-label="Catégorie"
        >
          {categoryOptions.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
      </label>

      <label className="teams-filter">
        <span className="teams-filter-label">Filtre</span>
        <select
          className="teams-filter-select"
          value={criterion}
          onChange={(e) => setCriterion(e.target.value)}
          aria-label="Critère de filtre"
        >
          {criterionOptions.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
      </label>

      <button
        type="button"
        className="teams-filter-dir-btn"
        onClick={() => setCriterionAsc((prev) => !prev)}
        disabled={criterion === "none"}
        aria-label={criterionAsc ? "Sens du critère : haut" : "Sens du critère : bas"}
        title={criterionAsc ? "Sens : haut" : "Sens : bas"}
      >
        <span className="material-icons" aria-hidden="true">
          {criterionAsc ? "arrow_upward" : "arrow_downward"}
        </span>
      </button>
    </div>
  );

  return (
    <div className="page-container-wide">
      {emailMenu && (
        <>
          <button type="button" className="email-menu-backdrop" aria-label="Fermer" onClick={closeEmailMenu} />
          <div
            className="email-compose-menu"
            style={{ top: emailMenu.y, left: emailMenu.x }}
            role="menu"
          >
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
      {logoPreview && (
        <div
          className="team-logo-lightbox"
          role="dialog"
          aria-modal="true"
          aria-label={logoPreview.name ? `Logo de ${logoPreview.name}` : "Logo"}
          onClick={() => setLogoPreview(null)}
          onKeyDown={(e) => {
            if (e.key === "Escape") setLogoPreview(null);
          }}
        >
          <button
            type="button"
            className="team-logo-lightbox-close"
            aria-label="Fermer"
            onClick={() => setLogoPreview(null)}
          >
            <span className="material-icons">close</span>
          </button>
          <img
            src={logoPreview.src}
            alt={logoPreview.name ? `Logo de ${logoPreview.name}` : "Logo"}
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      )}
      <div className={`config-card config-card-collapsible teams-info-card${teamsInfoOpen ? " is-open" : ""}`}>
        <button
          type="button"
          className="config-card-toggle"
          onClick={() => setTeamsInfoOpen((open) => !open)}
          aria-expanded={teamsInfoOpen}
        >
          Informations sur les équipes
          <span className="material-icons" aria-hidden="true">
            {teamsInfoOpen ? "expand_less" : "expand_more"}
          </span>
        </button>
        {teamsInfoOpen && (
          <div className="config-card-body">
            <p className="section-desc teams-info-intro">
              Indiquez quelles sont les informations sur les équipes qui vous intéressent.
            </p>

            <h4 className="config-card-section-title">Champs d&apos;information standard</h4>
            <ul className="field-list">
              {standardTeamFields.map((f) => (
                <li key={f.id}>
                  <span className="field-list-label">
                    {f.label}
                    {f.help && (
                      <span
                        className="field-help"
                        tabIndex={0}
                        aria-label="Au moyen d'un lien de connexion unique, les participants peuvent remplir les résultats de leurs matches via le site web public du tournoi."
                      >
                        <span className="material-icons md-18" aria-hidden="true">
                          help_outline
                        </span>
                        <span className="field-help-tooltip" role="tooltip">
                          Au moyen d&apos;un lien de connexion unique, les participants peuvent
                          remplir les résultats de leurs matches via le site web public du tournoi.
                        </span>
                      </span>
                    )}
                  </span>
                  <input
                    type="checkbox"
                    className="mui-checkbox"
                    checked={f.enabled}
                    onChange={() => toggleTeamField(f.id)}
                  />
                </li>
              ))}
            </ul>

            {extraTeamFields.length > 0 && (
              <>
                <h4 className="config-card-section-title">Champs d&apos;information supplémentaires</h4>
                <ul className="field-list">
                  {extraTeamFields.map((f) => (
                    <li key={f.id}>
                      <span>
                        {f.label}
                        {f.inputType === "checkbox" ? (
                          <span className="field-type-hint"> (case à cocher)</span>
                        ) : null}
                      </span>
                      <div className="field-list-actions">
                        <button type="button" className="list-row-edit" onClick={() => editTeamField(f.id)} aria-label="Modifier">
                          <span className="material-icons md-20" style={{ color: "var(--text-secondary)" }}>
                            edit
                          </span>
                        </button>
                        <button type="button" className="list-row-edit" onClick={() => deleteTeamField(f.id)} aria-label="Supprimer">
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

            <button type="button" className="btn-outlined btn-full" onClick={addTeamField}>
              Ajouter un champ d&apos;information
            </button>

            <h4 className="config-card-section-title">Questions sur l&apos;inscription</h4>
            <ul className="field-list">
              {inscriptionQuestions.map((q) => (
                <li key={q.id}>
                  <span>{q.label}</span>
                  <input
                    type="checkbox"
                    className="mui-checkbox"
                    checked={q.enabled}
                    onChange={() => toggleInscriptionQuestion(q.id)}
                  />
                </li>
              ))}
            </ul>

            <h4 className="config-card-section-title">Champs d&apos;information des joueurs</h4>
            <ul className="field-list">
              {data.playerFields.map((f) => (
                <li key={f.id}>
                  <span>
                    {f.label}
                    {f.inputType === "checkbox" ? (
                      <span className="field-type-hint"> (case à cocher)</span>
                    ) : null}
                  </span>
                  <div className="field-list-actions">
                    <button type="button" className="list-row-edit" onClick={() => editPlayerField(f.id)} aria-label="Modifier">
                      <span className="material-icons md-20" style={{ color: "var(--text-secondary)" }}>
                        edit
                      </span>
                    </button>
                    {f.custom ? (
                      <button type="button" className="list-row-edit" onClick={() => deletePlayerField(f.id)} aria-label="Supprimer">
                        <span className="material-icons md-20" style={{ color: "var(--text-secondary)" }}>
                          delete
                        </span>
                      </button>
                    ) : (
                      <input
                        type="checkbox"
                        className="mui-checkbox"
                        checked={f.enabled}
                        disabled={f.locked}
                        onChange={() => togglePlayerField(f.id)}
                      />
                    )}
                  </div>
                </li>
              ))}
            </ul>
            <button type="button" className="btn-outlined btn-full" onClick={addPlayerField}>
              Ajouter un champ d&apos;information
            </button>
          </div>
        )}
      </div>

      {displayedTeams.length === 0 ? (
        <>
          <div className="empty-state-toolbar">{filterControl}</div>
          <div className="empty-state">
            <EmptyJersey variant="team" />
            <h2>Ajouter des équipes à cette division</h2>
            <p>
              Ou commençant avec par{" "}
              <Link to="/structure" className="empty-state-link">
                classement
              </Link>{" "}
              et ajouter les équipes plus tard.
            </p>
            <button
              type="button"
              className="btn-outlined"
              onClick={() => addTeam(category !== "all" ? category : undefined)}
            >
              Ajouter une équipe
            </button>
            <p className="empty-state-footer">
              Pas de sport d&apos;équipe ?{" "}
              <button type="button" className="empty-state-footer-link" onClick={switchToIndividualSport}>
                Cliquez ici
              </button>{" "}
              pour passer à un sport individuel.
            </p>
          </div>
        </>
      ) : (
      <div className="data-table-wrap">
        {selected.length > 0 ? (
          <div className="teams-selection-banner">
            <span className="teams-selection-count">
              {selected.length} sélectionné{selected.length > 1 ? "s" : ""}
            </span>
            <div className="teams-selection-actions">
              {filterControl}
              <button
                type="button"
                className="teams-selection-btn"
                onClick={() => exportTeams(selected)}
              >
                Exporter
                <span className="material-icons md-18">download</span>
              </button>
              <button
                type="button"
                className="teams-selection-btn"
                onClick={() => moveSelectedTeams(selected, clearSelection)}
              >
                Déplacé
                <span className="material-icons md-18">arrow_forward</span>
              </button>
              <button
                type="button"
                className="teams-selection-btn"
                onClick={() => duplicateSelectedTeams(selected, clearSelection)}
              >
                Dupliqué
                <span className="material-icons md-18">content_copy</span>
              </button>
              <button
                type="button"
                className="teams-selection-btn"
                onClick={() => deleteSelectedTeams(selected, clearSelection)}
              >
                Supprimé
                <span className="material-icons md-18">delete</span>
              </button>
            </div>
          </div>
        ) : (
          <div className="data-table-toolbar">
            {filterControl}
            <div className="data-table-toolbar-actions">
              <button
                type="button"
                className="btn-outlined"
                onClick={() => importInputRef.current?.click()}
              >
                Importer CSV
              </button>
              <button type="button" className="btn-outlined primary" onClick={addTeam}>
                Ajouter une équipe
              </button>
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
        <input
          ref={logoInputRef}
          type="file"
          accept="image/*"
          hidden
          onChange={handleLogoFileChange}
        />
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
            {displayedTeams.map(({ team, matches }) => {
              const isSelected = selected.includes(team.id);
              return (
                <tr
                  key={team.id}
                  className={`${isSelected ? "is-selected" : ""}${matches ? "" : " is-filtered-out"}`}
                >
                  <td>
                    <input
                      type="checkbox"
                      className="mui-checkbox"
                      checked={isSelected}
                      onChange={() => toggleSelect(team.id)}
                    />
                  </td>
                  <td>{team.name}</td>
                  {tableColumns.map((col) => (
                    <td key={col.id}>{renderColumnCell(team, col)}</td>
                  ))}
                  <td>
                    <button type="button" className="list-row-edit" onClick={() => editTeam(team.id)}>
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
            1-{displayedTeams.length} de {displayedTeams.length}
          </span>
        </div>
      </div>
      )}
    </div>
  );
}
