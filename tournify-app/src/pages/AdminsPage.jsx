import { useState } from "react";
import { useTournament } from "../context/TournamentContext";

const ADMIN_RIGHTS = [
  { id: "general", label: "Gestion générale", icon: "settings" },
  { id: "participants", label: "Gérer les participants", icon: "people" },
  { id: "layout", label: "Gérer la mise en page", icon: "view_quilt" },
  { id: "calendar", label: "Gérer le calendrier", icon: "event" },
  { id: "presentation", label: "Gérer la présentation", icon: "desktop_windows" },
  { id: "scores", label: "Gérer les scores", icon: "assessment" },
];

export default function AdminsPage() {
  const { data } = useTournament();
  const [showModal, setShowModal] = useState(false);
  const [email, setEmail] = useState("");
  const [rights, setRights] = useState([]);

  const toggleRight = (id) => {
    setRights((prev) =>
      prev.includes(id) ? prev.filter((r) => r !== id) : [...prev, id]
    );
  };

  if (data.admins.length === 0 && !showModal) {
    return (
      <div className="page-container">
        <div className="empty-state">
          <div className="admin-empty-icon material-icons">sports</div>
          <h2>Ajouter des administrateurs</h2>
          <p>
            Cette option vous permet de collaborer avec d&apos;autres organisateurs
            sur ce tournoi. Chaque administrateur peut se voir attribuer des droits
            spécifiques.
          </p>
          <button
            type="button"
            className="btn-outlined"
            onClick={() => setShowModal(true)}
          >
            Ajouter un administrateur
          </button>
        </div>
        {showModal && (
          <AdminModal
            email={email}
            setEmail={setEmail}
            rights={rights}
            toggleRight={toggleRight}
            onClose={() => setShowModal(false)}
          />
        )}
      </div>
    );
  }

  return (
    <div className="page-container-wide">
      <div className="data-table-toolbar" style={{ justifyContent: "flex-end", marginBottom: 16 }}>
        <button type="button" className="btn-contained" onClick={() => setShowModal(true)}>
          Ajouter un administrateur
        </button>
      </div>
      {showModal && (
        <AdminModal
          email={email}
          setEmail={setEmail}
          rights={rights}
          toggleRight={toggleRight}
          onClose={() => setShowModal(false)}
        />
      )}
    </div>
  );
}

function AdminModal({ email, setEmail, rights, toggleRight, onClose }) {
  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">Ajouter un administrateur</div>
        <div className="modal-body">
          <p className="section-desc">
            Vous ne pouvez ajouter qu&apos;une seule adresse e-mail avec laquelle un
            compte a déjà été créé.
          </p>
          <label className="mui-input-label">Adresse e-mail</label>
          <input
            className="mui-input"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
          <p className="section-title" style={{ marginTop: 20 }}>Droits :</p>
          <ul className="rights-list">
            {ADMIN_RIGHTS.map((r) => (
              <li key={r.id}>
                <input
                  type="checkbox"
                  className="mui-checkbox"
                  checked={rights.includes(r.id)}
                  onChange={() => toggleRight(r.id)}
                />
                <span className="material-icons md-18">{r.icon}</span>
                {r.label}
              </li>
            ))}
          </ul>
        </div>
        <div className="modal-footer">
          <button type="button" className="btn-text" onClick={onClose}>
            Annuler
          </button>
          <button type="button" className="btn-text" disabled={!email}>
            Ajouter
          </button>
        </div>
      </div>
    </div>
  );
}
