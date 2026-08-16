import { useMemo, useState, useEffect, useRef } from "react";
import { useTournamentActions } from "../hooks/useTournamentActions";
import { useAuth } from "../context/AuthContext";
import { normalizeEmail, validateAdminEmail, registerCurrentUserEmail } from "../utils/userLookup";
import EmptyJersey from "../components/EmptyJersey";

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const ADMIN_HEADER_LINES = {
  general: ["Gestion", "générale"],
  participants: ["Gérer les", "participants"],
  layout: ["Gérer la", "mise en page"],
  calendar: ["Gérer le", "calendrier"],
  presentation: ["Gérer la", "présentation"],
  presentation_website: ["Gérer un site", "internet public"],
  presentation_slideshow: ["Gérer le", "diaporama"],
  presentation_design: ["Gérer la", "conception"],
  scores: ["Gérer les", "scores"],
  scores_phases: ["Gérer", "l'avancement", "des phases"],
};

export const ADMIN_RIGHTS = [
  { id: "general", label: "Gestion générale" },
  { id: "participants", label: "Gérer les participants" },
  { id: "layout", label: "Gérer la mise en page" },
  { id: "calendar", label: "Gérer le calendrier" },
  {
    id: "presentation",
    label: "Gérer la présentation",
    children: [
      { id: "presentation_website", label: "Gérer un site internet public" },
      { id: "presentation_slideshow", label: "Gérer le diaporama" },
      { id: "presentation_design", label: "Gérer la conception" },
    ],
  },
  {
    id: "scores",
    label: "Gérer les scores",
    children: [
      {
        id: "scores_phases",
        label: "Gérer l'avancement des phases",
        hint: "Donner à l'administrateur le droit de démarrer les phases du tournoi",
      },
    ],
  },
];

export const ADMIN_TABLE_COLUMNS = ADMIN_RIGHTS.flatMap((right) =>
  right.children ? [right, ...right.children] : [right]
);

function AdminHeaderLabel({ column }) {
  const lines = ADMIN_HEADER_LINES[column.id] ?? [column.label];
  return (
    <span className="admin-right-col-label">
      {lines.map((line) => (
        <span key={line} className="admin-right-col-line">
          {line}
        </span>
      ))}
    </span>
  );
}

function childIdsFor(parentId) {
  const parent = ADMIN_RIGHTS.find((right) => right.id === parentId);
  return parent?.children?.map((child) => child.id) ?? [];
}

function hasRight(rights, id) {
  return Array.isArray(rights) && rights.includes(id);
}

function RightStatusIcon({ granted }) {
  return (
    <span
      className={`admin-right-icon ${granted ? "admin-right-icon--yes" : "admin-right-icon--no"}`}
      aria-label={granted ? "Autorisé" : "Refusé"}
    >
      <span className="material-icons">{granted ? "check" : "remove"}</span>
    </span>
  );
}

export default function AdminsPage() {
  const { data, isOwner, addAdmin, updateAdmin, deleteSelectedAdmins, promoteSelectedAdmins, demoteSelectedAdmins } = useTournamentActions();
  const [showModal, setShowModal] = useState(false);
  const [editingAdmin, setEditingAdmin] = useState(null);
  const [selected, setSelected] = useState([]);
  const [sortAsc, setSortAsc] = useState(true);

  const admins = data.admins || [];
  const hasAdmins = admins.length > 0;

  const sortedAdmins = useMemo(() => {
    const copy = [...admins];
    copy.sort((a, b) => {
      const cmp = String(a.email).localeCompare(String(b.email), "fr", { sensitivity: "base" });
      return sortAsc ? cmp : -cmp;
    });
    return copy;
  }, [admins, sortAsc]);

  const allSelected = hasAdmins && selected.length === admins.length;
  const selectedAdmins = admins.filter((admin) => selected.includes(admin.id));
  const canPromote = selectedAdmins.some((admin) => admin.role !== "owner");
  const canDemote = selectedAdmins.some((admin) => admin.role === "owner");

  const toggleSelectAll = () => {
    setSelected(allSelected ? [] : admins.map((admin) => admin.id));
  };

  const toggleSelect = (id) => {
    setSelected((prev) => (prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]));
  };

  const clearSelection = () => setSelected([]);

  const openAddModal = () => {
    setEditingAdmin(null);
    setShowModal(true);
  };

  const openEditModal = (admin) => {
    setEditingAdmin(admin);
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setEditingAdmin(null);
  };

  const handleSave = async ({ email, rights }) => {
    if (!isOwner) return;
    if (editingAdmin) {
      updateAdmin(editingAdmin.id, { email, rights });
      closeModal();
      return;
    }
    const added = await addAdmin(email, rights);
    if (added) closeModal();
  };

  if (!isOwner) {
    return (
      <div className="page-container">
        <div className="empty-state page-blocked">
          <span className="material-icons page-blocked-icon">lock</span>
          <h2>Page bloquée</h2>
          <p>Cette page est bloquée car vous n&apos;êtes pas propriétaire du tournoi.</p>
        </div>
      </div>
    );
  }

  return (
    <div className={hasAdmins ? "page-container-wide" : "page-container"}>
      {!hasAdmins ? (
        <div className="empty-state">
          <EmptyJersey variant="admin" />
          <h2>Ajouter des administrateurs</h2>
          <p>
            Cette option vous permet de collaborer avec plusieurs organisateurs de tournois sur ce
            tournoi. Vous pouvez partager l&apos;intégralité du tournoi avec un autre compte
            Tournify ou attribuer des droits spécifiques.
          </p>
          <button type="button" className="btn-outlined" onClick={openAddModal}>
            Ajouter un administrateur
          </button>
        </div>
      ) : (
        <div className="data-table-wrap">
          {selected.length > 0 ? (
            <div className="teams-selection-banner">
              <span className="teams-selection-count">
                {selected.length} sélectionné{selected.length > 1 ? "s" : ""}
              </span>
              <div className="teams-selection-actions">
                {canPromote ? (
                  <button
                    type="button"
                    className="teams-selection-btn"
                    onClick={() =>
                      promoteSelectedAdmins(
                        selectedAdmins.filter((admin) => admin.role !== "owner").map((admin) => admin.id),
                        clearSelection
                      )
                    }
                  >
                    Passer en propriétaire
                    <span className="material-icons md-18">vpn_key</span>
                  </button>
                ) : null}
                {canDemote ? (
                  <button
                    type="button"
                    className="teams-selection-btn"
                    onClick={() =>
                      demoteSelectedAdmins(
                        selectedAdmins.filter((admin) => admin.role === "owner").map((admin) => admin.id),
                        clearSelection
                      )
                    }
                  >
                    Passer en administrateur
                    <span className="material-icons md-18">person</span>
                  </button>
                ) : null}
                <button
                  type="button"
                  className="teams-selection-btn"
                  onClick={() => deleteSelectedAdmins(selected, clearSelection)}
                >
                  Supprimé
                  <span className="material-icons md-18">delete</span>
                </button>
              </div>
            </div>
          ) : (
            <div className="data-table-toolbar">
              <div />
              <div className="data-table-toolbar-actions">
                <button type="button" className="btn-outlined primary" onClick={openAddModal}>
                  Ajouter un administrateur
                </button>
              </div>
            </div>
          )}

          <div className="admins-table-scroll">
            <table className="data-table admins-table">
              <thead>
                <tr>
                  <th style={{ width: 40 }}>
                    {isOwner ? (
                      <input
                        type="checkbox"
                        className="mui-checkbox"
                        checked={allSelected}
                        onChange={toggleSelectAll}
                        aria-label="Tout sélectionner"
                      />
                    ) : null}
                  </th>
                  <th className="admins-name-col">
                    <button
                      type="button"
                      className="th-sort-btn"
                      onClick={() => setSortAsc((value) => !value)}
                    >
                      Nom
                      <span className="material-icons sort-icon">
                        {sortAsc ? "arrow_upward" : "arrow_downward"}
                      </span>
                    </button>
                  </th>
                  {ADMIN_TABLE_COLUMNS.map((column) => (
                    <th key={column.id} className="admin-right-col">
                      <AdminHeaderLabel column={column} />
                    </th>
                  ))}
                  <th style={{ width: 40 }} />
                </tr>
              </thead>
              <tbody>
                {sortedAdmins.map((admin) => {
                  const isSelected = selected.includes(admin.id);
                  return (
                    <tr key={admin.id} className={isSelected ? "is-selected" : ""}>
                      <td>
                        {isOwner ? (
                          <input
                            type="checkbox"
                            className="mui-checkbox"
                            checked={isSelected}
                            onChange={() => toggleSelect(admin.id)}
                            aria-label={`Sélectionner ${admin.email}`}
                          />
                        ) : null}
                      </td>
                      <td className="admins-name-col">
                        <span>{admin.email}</span>
                        {admin.role === "owner" ? (
                          <span className="admin-role-badge">Propriétaire</span>
                        ) : null}
                      </td>
                      {ADMIN_TABLE_COLUMNS.map((column) => (
                        <td key={column.id} className="admin-right-col">
                          <RightStatusIcon granted={hasRight(admin.rights, column.id)} />
                        </td>
                      ))}
                      <td>
                        {isOwner ? (
                          <button
                            type="button"
                            className="list-row-edit"
                            onClick={() => openEditModal(admin)}
                            aria-label={`Modifier ${admin.email}`}
                          >
                            <span className="material-icons md-20">edit</span>
                          </button>
                        ) : null}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          <div className="data-table-footer">
            <span>Nombre de lignes par page: 100</span>
            <span>
              1-{sortedAdmins.length} de {sortedAdmins.length}
            </span>
          </div>
        </div>
      )}

      {showModal && (
        <AdminModal
          key={editingAdmin?.id ?? "new"}
          admin={editingAdmin}
          onClose={closeModal}
          onSave={handleSave}
        />
      )}
    </div>
  );
}

function RightsToggle({ id, label, hint, checked, onToggle }) {
  return (
    <div className="rights-item">
      <label className="rights-toggle">
        <span className="mui-toggle">
          <input type="checkbox" checked={checked} onChange={() => onToggle(id)} />
          <span className="mui-toggle-slider" />
        </span>
        <span>{label}</span>
      </label>
      {hint && <p className="rights-hint">*{hint}</p>}
    </div>
  );
}

function AdminModal({ admin, onClose, onSave }) {
  const { user } = useAuth();
  const isEdit = Boolean(admin);
  const originalEmail = normalizeEmail(admin?.email);
  const [email, setEmail] = useState(admin?.email ?? "");
  const [rights, setRights] = useState(admin?.rights ?? []);
  const [emailError, setEmailError] = useState("");
  const [checkingEmail, setCheckingEmail] = useState(false);
  const [emailValid, setEmailValid] = useState(isEdit);
  const debounceRef = useRef(null);
  const requestIdRef = useRef(0);

  useEffect(() => {
    if (user?.email) {
      registerCurrentUserEmail(user.email);
    }
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [user?.email]);

  const runEmailValidation = async (value) => {
    const trimmed = value.trim();
    if (!EMAIL_PATTERN.test(trimmed)) {
      setEmailError("");
      setEmailValid(false);
      setCheckingEmail(false);
      return;
    }

    const skipLookup = isEdit && normalizeEmail(trimmed) === originalEmail;
    const requestId = ++requestIdRef.current;
    setCheckingEmail(true);
    setEmailError("");

    try {
      const result = await validateAdminEmail(trimmed, user?.email, { skipLookup });
      if (requestId !== requestIdRef.current) return;

      if (result.status === "valid") {
        setEmailError("");
        setEmailValid(true);
      } else if (result.message) {
        setEmailError(result.message);
        setEmailValid(false);
      } else {
        setEmailError("");
        setEmailValid(false);
      }
    } catch {
      if (requestId !== requestIdRef.current) return;
      setEmailError("Impossible de vérifier cette adresse e-mail.");
      setEmailValid(false);
    } finally {
      if (requestId === requestIdRef.current) {
        setCheckingEmail(false);
      }
    }
  };

  const scheduleEmailValidation = (value) => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      runEmailValidation(value);
    }, 400);
  };

  const handleEmailChange = (value) => {
    setEmail(value);
    setEmailValid(false);
    setEmailError("");

    const trimmed = value.trim();
    if (!trimmed) {
      setCheckingEmail(false);
      return;
    }

    if (!EMAIL_PATTERN.test(trimmed)) {
      setCheckingEmail(false);
      return;
    }

    setCheckingEmail(true);
    scheduleEmailValidation(value);
  };

  const handleEmailBlur = () => {
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
      debounceRef.current = null;
    }
    runEmailValidation(email);
  };

  const toggleRight = (id) => {
    const childIds = childIdsFor(id);

    setRights((prev) => {
      if (prev.includes(id)) {
        return prev.filter((item) => item !== id && !childIds.includes(item));
      }
      return [...prev, id];
    });
  };

  const canSave = EMAIL_PATTERN.test(email.trim()) && emailValid && !checkingEmail;

  const handleSubmit = (event) => {
    event.preventDefault();
    if (!canSave) return;
    onSave({ email: email.trim(), rights });
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div
        className="modal modal-wide"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-labelledby="admin-modal-title"
      >
        <div className="modal-header" id="admin-modal-title">
          {isEdit ? "Éditer l'administrateur" : "Ajouter un administrateur"}
        </div>
        <form id="admin-form" className="modal-body" onSubmit={handleSubmit}>
          {!isEdit && (
            <p className="section-desc">
              Vous ne pouvez ajouter qu&apos;une seule adresse e-mail avec laquelle un compte a
              déjà été créé.
            </p>
          )}
          <div className="mui-field">
            <label className="mui-input-label" htmlFor="admin-email">
              Adresse e-mail
            </label>
            <input
              id="admin-email"
              className={`mui-input${emailError ? " is-invalid" : ""}`}
              type="email"
              value={email}
              onChange={(e) => handleEmailChange(e.target.value)}
              onBlur={handleEmailBlur}
              autoFocus
            />
            {emailError && <p className="auth-error">{emailError}</p>}
            {checkingEmail && !emailError && (
              <p className="location-hint">Vérification de l&apos;adresse e-mail...</p>
            )}
          </div>
          <p className="section-title" style={{ marginTop: 24 }}>
            Droits :
          </p>
          <ul className="rights-list">
            {ADMIN_RIGHTS.map((right) => (
              <li key={right.id}>
                <RightsToggle
                  id={right.id}
                  label={right.label}
                  checked={rights.includes(right.id)}
                  onToggle={toggleRight}
                />
                {right.children && rights.includes(right.id) && (
                  <ul className="rights-list rights-list-nested">
                    {right.children.map((child) => (
                      <li key={child.id}>
                        <RightsToggle
                          id={child.id}
                          label={child.label}
                          hint={child.hint}
                          checked={rights.includes(child.id)}
                          onToggle={toggleRight}
                        />
                      </li>
                    ))}
                  </ul>
                )}
              </li>
            ))}
          </ul>
        </form>
        <div className="modal-footer">
          <button type="button" className="btn-text" onClick={onClose}>
            Annuler
          </button>
          <button type="submit" form="admin-form" className="btn-contained" disabled={!canSave}>
            {isEdit ? "Sauvegarder" : "Ajouter"}
          </button>
        </div>
      </div>
    </div>
  );
}
