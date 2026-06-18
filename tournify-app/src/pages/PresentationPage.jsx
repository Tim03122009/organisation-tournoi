import { Link, NavLink, Outlet, useParams } from "react-router-dom";
import { AppLayout } from "../components/Layout";
import { useTournament } from "../context/TournamentContext";

export function PresentationLayout() {
  return (
    <AppLayout title="Gestion tournoi">
      <div className="page-tabs">
        <NavLink
          to="/presentation"
          end
          className={({ isActive }) => `page-tab${isActive ? " active" : ""}`}
        >
          Site web et application
        </NavLink>
        <NavLink
          to="/presentation/slideshow"
          className={({ isActive }) => `page-tab${isActive ? " active" : ""}`}
        >
          Diaporama
        </NavLink>
        <NavLink
          to="/presentation/design"
          className={({ isActive }) => `page-tab${isActive ? " active" : ""}`}
        >
          Design
        </NavLink>
      </div>
      <Outlet />
    </AppLayout>
  );
}

export function PresentationWebsitePage() {
  const { data } = useTournament();

  return (
    <div className="page-container">
      <div className="website-cards">
        <div className="website-card">
          <span className="badge-active">Actif</span>
          <h3 style={{ margin: "12px 0 8px" }}>Site web</h3>
          <p className="section-desc">
            Partagez ce lien pour que les visiteurs puissent consulter le tournoi.
          </p>
          <div className="url-field">
            <span style={{ flex: 1, fontSize: "0.875rem" }}>{data.presentation.websiteUrl}</span>
            <button type="button" className="list-row-edit">
              <span className="material-icons md-20">content_copy</span>
            </button>
          </div>
          <button type="button" className="btn-outlined">Code QR</button>
        </div>
        <div className="website-card">
          <div style={{ display: "flex", gap: 12, marginBottom: 12 }}>
            <span className="material-icons">phone_iphone</span>
            <span className="material-icons">android</span>
          </div>
          <div className="toggle-row">
            <span>Afficher le tournoi dans l&apos;appli</span>
            <label className="mui-toggle">
              <input type="checkbox" defaultChecked={data.presentation.showInApp} />
              <span className="mui-toggle-slider" />
            </label>
          </div>
          <button type="button" className="btn-outlined btn-full" style={{ marginTop: 16 }}>
            Gérer les notifications push
          </button>
        </div>
      </div>

      <div className="banner-promo">
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <span className="material-icons" style={{ color: "var(--primary)" }}>campaign</span>
          <span>Promouvez votre tournoi avec une affiche personnalisée</span>
        </div>
        <button type="button" className="btn-outlined primary">Télécharger l&apos;affiche</button>
      </div>

      <h2 className="section-title">Pages</h2>
      <div className="pages-grid">
        {data.presentation.pages.map((page) => (
          <div key={page.id} className="page-card">
            <div className="page-card-header">
              <span>{page.name}</span>
              <input type="checkbox" className="mui-checkbox" defaultChecked={page.enabled} />
            </div>
            <div className="page-card-body">Aperçu</div>
            <div className="page-card-footer">
              <NavLink to={`/presentation/page/${page.id}`} className="btn-outlined" style={{ textDecoration: "none" }}>
                Modifier la page
              </NavLink>
            </div>
          </div>
        ))}
      </div>

      <h2 className="section-title">Paramètres généraux</h2>
      <ul className="field-list">
        {["Afficher le logo", "Afficher les sponsors", "Afficher le classement"].map((label) => (
          <li key={label}>
            <span>{label}</span>
            <input type="checkbox" className="mui-checkbox" defaultChecked />
          </li>
        ))}
      </ul>

      <h2 className="section-title" style={{ marginTop: 32 }}>Tableaux de classement</h2>
      <div className="toggle-row">
        <span>Points</span>
        <label className="mui-toggle">
          <input type="checkbox" defaultChecked />
          <span className="mui-toggle-slider" />
        </label>
      </div>
      <table className="standings-table">
        <thead>
          <tr>
            <th />
            {["J", "G", "N", "P", "PTS", "+/-", "BP", "BC"].map((c) => (
              <th key={c}>{c}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {["Normal", "Mobile/diaporama"].map((row) => (
            <tr key={row}>
              <td style={{ textAlign: "left" }}>{row}</td>
              {Array.from({ length: 8 }).map((_, i) => (
                <td key={i}>
                  <input type="checkbox" className="mui-checkbox" defaultChecked={i < 5} />
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>

      <h2 className="section-title" style={{ marginTop: 32 }}>Lien de connexion administrateur</h2>
      <div className="url-field">
        <span style={{ flex: 1 }}>••••••••••••••••</span>
      </div>
      <button type="button" className="btn-contained">Réinitialiser</button>

      <div className="info-box" style={{ marginTop: 32 }}>
        💡 Ce lien permet aux administrateurs de se connecter sans compte. Partagez-le
        uniquement avec les personnes de confiance.
      </div>
    </div>
  );
}

export function PresentationSlideshowPage() {
  const { data } = useTournament();

  return (
    <div className="page-container">
      <h2 className="section-title">Diaporama</h2>
      <p className="section-desc">
        Configurez les diapositives affichées sur un écran pendant le tournoi.
      </p>

      <div className="toggle-row">
        <span>Afficher le nom du tournoi sur chaque diapositive</span>
        <label className="mui-toggle">
          <input type="checkbox" defaultChecked />
          <span className="mui-toggle-slider" />
        </label>
      </div>
      <div className="toggle-row">
        <span>Afficher l&apos;heure actuelle</span>
        <label className="mui-toggle">
          <input type="checkbox" defaultChecked />
          <span className="mui-toggle-slider" />
        </label>
      </div>

      <select className="division-select" style={{ margin: "16px 0", width: "100%", padding: 10 }}>
        <option>DIAPORAMA 1</option>
      </select>

      {data.presentation.slideshow.map((slide, i) => (
        <div key={slide.id} className="slideshow-card">
          <div className="slideshow-card-header">
            Diapositive {i + 1}: {slide.duration} secondes
          </div>
          <div className="slideshow-card-body">
            <span>{slide.title}</span>
            <div className="slideshow-card-actions">
              <label style={{ display: "flex", alignItems: "center", gap: 4, fontSize: "0.75rem" }}>
                <input type="checkbox" className="mui-checkbox" defaultChecked={slide.active} />
                Actif
              </label>
              <button type="button" className="list-row-edit">
                <span className="material-icons md-20" style={{ color: "var(--primary)" }}>edit</span>
              </button>
              <button type="button" className="list-row-edit">
                <span className="material-icons md-20">delete</span>
              </button>
            </div>
          </div>
        </div>
      ))}

      <button type="button" className="btn-outlined btn-full" style={{ marginTop: 16 }}>
        + Ajouter une diapositive
      </button>
    </div>
  );
}

export function PresentationDesignPage() {
  const { data } = useTournament();

  return (
    <div className="page-container">
      <div className="banner-promo">
        <span>Découvrez les forfaits premium pour personnaliser votre tournoi</span>
        <button type="button" className="btn-outlined primary">Voir les forfaits</button>
      </div>

      <h2 className="section-title">Design</h2>

      <section style={{ marginBottom: 32 }}>
        <h3 className="section-title">Couleur</h3>
        <p className="section-desc">Choisissez la couleur principale de votre tournoi.</p>
        <div className="color-picker-area">
          <div
            className="color-preview"
            style={{ background: data.presentation.designColor }}
          />
          <input
            className="mui-input"
            value={data.presentation.designColor}
            readOnly
            style={{ maxWidth: 120 }}
          />
        </div>
      </section>

      {[
        { title: "Logo", desc: "Format recommandé : PNG transparent, max 2 Mo" },
        { title: "Contexte général", desc: "Image de fond pour le site public (2:1)" },
        { title: "Sponsors", desc: "Ajoutez les logos de vos partenaires" },
      ].map((section) => (
        <section key={section.title} style={{ marginBottom: 32 }}>
          <h3 className="section-title">{section.title}</h3>
          <p className="section-desc">{section.desc}</p>
          <button type="button" className="btn-outlined primary">
            <span className="material-icons md-18">cloud_upload</span>
            Télécharger
          </button>
          <div className="upload-placeholder">{section.title}</div>
        </section>
      ))}

      <div className="sponsor-block-header">
        <span>Bloc 1</span>
        <button type="button" style={{ background: "none", border: "none", color: "#fff", cursor: "pointer" }}>
          <span className="material-icons md-18">edit</span>
        </button>
      </div>
      <button type="button" className="btn-contained btn-full" style={{ borderRadius: "0 0 4px 4px" }}>
        Nouveau bloc de parrainage
      </button>
    </div>
  );
}

export function PresentationPageEdit() {
  const { pageId } = useParams();

  const titles = {
    tournoi: "Page d'information sur les tournois",
    inscrire: "Page d'abonnement",
  };

  return (
    <div className="page-container">
      <Link to="/presentation" style={{ color: "var(--text-secondary)", fontSize: "0.8125rem" }}>
        ← RETOUR VERS
      </Link>
      <h1 style={{ fontSize: "1.5rem", fontWeight: 500, margin: "16px 0 24px" }}>
        {titles[pageId] || "Modifier la page"}
      </h1>

      {pageId === "tournoi" && (
        <>
          <section style={{ marginBottom: 32 }}>
            <h3 className="section-title">Description</h3>
            <p className="section-desc">Accueillez les visiteurs avec une introduction personnalisée.</p>
            <textarea className="mui-input" placeholder="Bienvenue au tournoi..." />
          </section>
          <section style={{ marginBottom: 32 }}>
            <h3 className="section-title">Pièces jointes</h3>
            <p className="section-desc">Taille max. 5 Mo.</p>
            <button type="button" className="btn-outlined btn-full">+ Ajouter une pièce jointe</button>
          </section>
          <section style={{ marginBottom: 32 }}>
            <h3 className="section-title">Images</h3>
            <p className="section-desc">Format recommandé : 2:1.</p>
            <button type="button" className="btn-outlined btn-full">Ajouter une image</button>
          </section>
          <section>
            <h3 className="section-title">Sponsors</h3>
            <label className="checkbox-row">
              <input type="checkbox" className="mui-checkbox" />
              Fusionner les blocs de parrainage
            </label>
          </section>
        </>
      )}

      {pageId === "inscrire" && (
        <>
          <div className="toggle-row">
            <span>Inscription ouverte</span>
            <label className="mui-toggle">
              <input type="checkbox" defaultChecked />
              <span className="mui-toggle-slider" />
            </label>
          </div>
          <section style={{ margin: "24px 0" }}>
            <h3 className="section-title">Introduction</h3>
            <textarea className="mui-input" />
          </section>
          <section style={{ marginBottom: 24 }}>
            <h3 className="section-title">Nombre max. d&apos;inscriptions</h3>
            <input className="mui-input" type="number" />
          </section>
          <section style={{ marginBottom: 24 }}>
            <h3 className="section-title">Frais d&apos;inscription</h3>
            <input className="mui-input" placeholder="EUR" />
          </section>
          <section>
            <h3 className="section-title">Formulaire d&apos;inscription</h3>
            {[
              "Quel est le nom de votre équipe ?",
              "Quel est votre logo ?",
              "Quelle division ?",
            ].map((q) => (
              <div key={q} className="form-question-row">
                <span>{q}</span>
                <div className="actions">
                  <span className="material-icons md-20">edit</span>
                  <span className="material-icons md-20">delete</span>
                </div>
              </div>
            ))}
            <button type="button" className="btn-outlined btn-full" style={{ marginTop: 12 }}>
              Ajouter une question supplémentaire
            </button>
          </section>
        </>
      )}
    </div>
  );
}
