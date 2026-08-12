import { Link, NavLink, Outlet, useParams } from "react-router-dom";
import { AppLayout } from "../components/Layout";
import { useTournamentActions } from "../hooks/useTournamentActions";

const GENERAL_SETTINGS = [
  { key: "showLogo", label: "Afficher le logo" },
  { key: "showSponsors", label: "Afficher les sponsors" },
  { key: "showStandings", label: "Afficher le classement" },
];

const STANDINGS_COLS = ["J", "G", "N", "P", "PTS", "+/-", "BP", "BC"];
const STANDINGS_ROWS = ["Normal", "Mobile/diaporama"];

export function PresentationLayout() {
  return (
    <AppLayout title="Gestion tournoi">
      <div className="page-tabs">
        <NavLink to="/presentation" end className={({ isActive }) => `page-tab${isActive ? " active" : ""}`}>
          Site web et application
        </NavLink>
        <NavLink to="/presentation/slideshow" className={({ isActive }) => `page-tab${isActive ? " active" : ""}`}>
          Diaporama
        </NavLink>
        <NavLink to="/presentation/design" className={({ isActive }) => `page-tab${isActive ? " active" : ""}`}>
          Design
        </NavLink>
      </div>
      <Outlet />
    </AppLayout>
  );
}

export function PresentationWebsitePage() {
  const {
    data,
    copyWebsiteUrl,
    toggleShowInApp,
    toggleWebsiteActive,
    togglePageEnabled,
    toggleGeneralSetting,
    toggleStandingsColumn,
    resetAdminLink,
    downloadPoster,
    patchPresentation,
    showToast,
    openAlert,
  } = useTournamentActions();

  const pres = data.presentation;
  const gs = pres.generalSettings || {};

  return (
    <div className="page-container">
      <div className="website-cards">
        <div className="website-card">
          <button type="button" className="badge-active" onClick={toggleWebsiteActive}>
            {pres.websiteActive ? "Actif" : "Inactif"}
          </button>
          <h3 style={{ margin: "12px 0 8px" }}>Site web</h3>
          <p className="section-desc">Partagez ce lien pour que les visiteurs puissent consulter le tournoi.</p>
          <div className="url-field">
            <span style={{ flex: 1, fontSize: "0.875rem" }}>{pres.websiteUrl}</span>
            <button type="button" className="list-row-edit" onClick={copyWebsiteUrl}>
              <span className="material-icons md-20">content_copy</span>
            </button>
          </div>
          <button type="button" className="btn-outlined" onClick={() => showToast("Code QR généré (à venir)")}>
            Code QR
          </button>
        </div>
        <div className="website-card">
          <div style={{ display: "flex", gap: 12, marginBottom: 12 }}>
            <span className="material-icons">phone_iphone</span>
            <span className="material-icons">android</span>
          </div>
          <div className="toggle-row">
            <span>Afficher le tournoi dans l&apos;appli</span>
            <label className="mui-toggle">
              <input
                type="checkbox"
                checked={pres.showInApp}
                onChange={(e) => toggleShowInApp(e.target.checked)}
              />
              <span className="mui-toggle-slider" />
            </label>
          </div>
          <button
            type="button"
            className="btn-outlined btn-full"
            style={{ marginTop: 16 }}
            onClick={() => openAlert({ title: "Notifications", message: "Gestion des notifications push — à configurer." })}
          >
            Gérer les notifications push
          </button>
        </div>
      </div>

      <div className="banner-promo">
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <span className="material-icons" style={{ color: "var(--primary)" }}>
            campaign
          </span>
          <span>Promouvez votre tournoi avec une affiche personnalisée</span>
        </div>
        <button type="button" className="btn-outlined primary" onClick={downloadPoster}>
          Télécharger l&apos;affiche
        </button>
      </div>

      <h2 className="section-title">Pages</h2>
      <div className="pages-grid">
        {pres.pages.map((page) => (
          <div key={page.id} className="page-card">
            <div className="page-card-header">
              <span>{page.name}</span>
              <input
                type="checkbox"
                className="mui-checkbox"
                checked={page.enabled}
                onChange={() => togglePageEnabled(page.id)}
              />
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
        {GENERAL_SETTINGS.map(({ key, label }) => (
          <li key={key}>
            <span>{label}</span>
            <input
              type="checkbox"
              className="mui-checkbox"
              checked={!!gs[key]}
              onChange={() => toggleGeneralSetting(key)}
            />
          </li>
        ))}
      </ul>

      <h2 className="section-title" style={{ marginTop: 32 }}>
        Tableaux de classement
      </h2>
      <div className="toggle-row">
        <span>Points</span>
        <label className="mui-toggle">
          <input
            type="checkbox"
            checked={pres.standingsShowPoints}
            onChange={() => patchPresentation({ standingsShowPoints: !pres.standingsShowPoints })}
          />
          <span className="mui-toggle-slider" />
        </label>
      </div>
      <table className="standings-table">
        <thead>
          <tr>
            <th />
            {STANDINGS_COLS.map((c) => (
              <th key={c}>{c}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {STANDINGS_ROWS.map((row, ri) => (
            <tr key={row}>
              <td style={{ textAlign: "left" }}>{row}</td>
              {STANDINGS_COLS.map((col, ci) => {
                const key = `${ri}_${ci}`;
                const checked = pres.standingsColumns?.[key] ?? ci < 5;
                return (
                  <td key={col}>
                    <input
                      type="checkbox"
                      className="mui-checkbox"
                      checked={checked}
                      onChange={() => toggleStandingsColumn(ri, ci)}
                    />
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>

      <h2 className="section-title" style={{ marginTop: 32 }}>
        Lien de connexion administrateur
      </h2>
      <div className="url-field">
        <span style={{ flex: 1, fontSize: "0.75rem" }}>{pres.adminLink || "••••••••••••••••"}</span>
      </div>
      <button type="button" className="btn-contained" onClick={resetAdminLink}>
        Réinitialiser
      </button>

      <div className="info-box" style={{ marginTop: 32 }}>
        💡 Ce lien permet aux administrateurs de se connecter sans compte. Partagez-le uniquement avec
        les personnes de confiance.
      </div>
    </div>
  );
}

export function PresentationSlideshowPage() {
  const {
    data,
    addSlideshowSlide,
    editSlideshowSlide,
    toggleSlideshowSlide,
    deleteSlideshowSlide,
    toggleSlideshowSetting,
  } = useTournamentActions();

  const ss = data.presentation.slideshowSettings || {};

  return (
    <div className="page-container">
      <h2 className="section-title">Diaporama</h2>
      <p className="section-desc">Configurez les diapositives affichées sur un écran pendant le tournoi.</p>

      <div className="toggle-row">
        <span>Afficher le nom du tournoi sur chaque diapositive</span>
        <label className="mui-toggle">
          <input
            type="checkbox"
            checked={ss.showTournamentName !== false}
            onChange={() => toggleSlideshowSetting("showTournamentName")}
          />
          <span className="mui-toggle-slider" />
        </label>
      </div>
      <div className="toggle-row">
        <span>Afficher l&apos;heure actuelle</span>
        <label className="mui-toggle">
          <input
            type="checkbox"
            checked={ss.showCurrentTime !== false}
            onChange={() => toggleSlideshowSetting("showCurrentTime")}
          />
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
                <input
                  type="checkbox"
                  className="mui-checkbox"
                  checked={slide.active}
                  onChange={() => toggleSlideshowSlide(slide.id)}
                />
                Actif
              </label>
              <button type="button" className="list-row-edit" onClick={() => editSlideshowSlide(slide.id)}>
                <span className="material-icons md-20" style={{ color: "var(--primary)" }}>
                  edit
                </span>
              </button>
              <button type="button" className="list-row-edit" onClick={() => deleteSlideshowSlide(slide.id)}>
                <span className="material-icons md-20">delete</span>
              </button>
            </div>
          </div>
        </div>
      ))}

      <button type="button" className="btn-outlined btn-full" style={{ marginTop: 16 }} onClick={addSlideshowSlide}>
        + Ajouter une diapositive
      </button>
    </div>
  );
}

export function PresentationDesignPage() {
  const { data, setDesignColor, uploadDesignAsset, addSponsorBlock, openPrompt, patchPresentation, showToast } =
    useTournamentActions();

  const assets = data.presentation.designAssets || {};

  return (
    <div className="page-container">
      <h2 className="section-title">Design</h2>

      <section style={{ marginBottom: 32 }}>
        <h3 className="section-title">Couleur</h3>
        <p className="section-desc">Choisissez la couleur principale de votre tournoi.</p>
        <div className="color-picker-area">
          <div className="color-preview" style={{ background: data.presentation.designColor }} />
          <input
            className="mui-input"
            type="color"
            value={data.presentation.designColor}
            onChange={(e) => setDesignColor(e.target.value)}
            style={{ maxWidth: 60, height: 40, padding: 0, border: "none" }}
          />
          <input
            className="mui-input"
            value={data.presentation.designColor}
            onChange={(e) => setDesignColor(e.target.value)}
            style={{ maxWidth: 120 }}
          />
        </div>
      </section>

      {[
        { key: "logo", title: "Logo", desc: "Format recommandé : PNG transparent, max 2 Mo" },
        { key: "context", title: "Contexte général", desc: "Image de fond pour le site public (2:1)" },
        { key: "sponsors", title: "Sponsors", desc: "Ajoutez les logos de vos partenaires" },
      ].map((section) => (
        <section key={section.key} style={{ marginBottom: 32 }}>
          <h3 className="section-title">{section.title}</h3>
          <p className="section-desc">{section.desc}</p>
          <button type="button" className="btn-outlined primary" onClick={() => uploadDesignAsset(section.key)}>
            <span className="material-icons md-18">cloud_upload</span>
            Télécharger
          </button>
          <div className="upload-placeholder">
            {assets[section.key] ? (
              <img src={assets[section.key]} alt={section.title} style={{ maxHeight: "100%", maxWidth: "100%" }} />
            ) : (
              section.title
            )}
          </div>
        </section>
      ))}

      {(data.presentation.sponsorBlocks || []).map((block) => (
        <div key={block.id}>
          <div className="sponsor-block-header">
            <span>{block.name}</span>
            <button
              type="button"
              style={{ background: "none", border: "none", color: "#fff", cursor: "pointer" }}
              onClick={() =>
                openPrompt({
                  title: "Renommer le bloc",
                  defaultValue: block.name,
                  onSubmit: (name) => {
                    patchPresentation((pres) => ({
                      sponsorBlocks: pres.sponsorBlocks.map((b) => (b.id === block.id ? { ...b, name } : b)),
                    }));
                    showToast("Bloc renommé");
                  },
                })
              }
            >
              <span className="material-icons md-18">edit</span>
            </button>
          </div>
        </div>
      ))}
      <button type="button" className="btn-contained btn-full" style={{ borderRadius: "0 0 4px 4px" }} onClick={addSponsorBlock}>
        Nouveau bloc de parrainage
      </button>
    </div>
  );
}

export function PresentationPageEdit() {
  const { pageId } = useParams();
  const {
    data,
    updatePageContent,
    addRegistrationQuestion,
    deleteRegistrationQuestion,
    openPrompt,
    patchPresentation,
    showToast,
  } = useTournamentActions();

  const titles = {
    tournoi: "Page d'information sur les tournois",
    inscrire: "Page d'abonnement",
  };

  const tournoi = data.presentation.pageContent?.tournoi || {};
  const inscrire = data.presentation.pageContent?.inscrire || {};
  const questions = data.presentation.registrationQuestions || [];

  const addAttachment = () => {
    openPrompt({
      title: "Pièce jointe",
      label: "Nom du fichier",
      onSubmit: (name) => {
        patchPresentation((pres) => ({
          pageContent: {
            ...pres.pageContent,
            tournoi: {
              ...pres.pageContent?.tournoi,
              attachments: [...(pres.pageContent?.tournoi?.attachments || []), name],
            },
          },
        }));
        showToast("Pièce jointe ajoutée");
      },
    });
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
            <textarea
              className="mui-input"
              placeholder="Bienvenue au tournoi..."
              value={tournoi.description || ""}
              onChange={(e) => updatePageContent("tournoi", "description", e.target.value)}
            />
          </section>
          <section style={{ marginBottom: 32 }}>
            <h3 className="section-title">Pièces jointes</h3>
            <p className="section-desc">Taille max. 5 Mo.</p>
            {(tournoi.attachments || []).map((a) => (
              <div key={a} className="list-row">
                <span>{a}</span>
              </div>
            ))}
            <button type="button" className="btn-outlined btn-full" onClick={addAttachment}>
              + Ajouter une pièce jointe
            </button>
          </section>
          <section style={{ marginBottom: 32 }}>
            <h3 className="section-title">Images</h3>
            <p className="section-desc">Format recommandé : 2:1.</p>
            <button
              type="button"
              className="btn-outlined btn-full"
              onClick={() => showToast("Upload image — utilisez Design pour les images")}
            >
              Ajouter une image
            </button>
          </section>
          <section>
            <h3 className="section-title">Sponsors</h3>
            <label className="checkbox-row">
              <input
                type="checkbox"
                className="mui-checkbox"
                checked={!!tournoi.mergeSponsors}
                onChange={(e) => updatePageContent("tournoi", "mergeSponsors", e.target.checked)}
              />
              Fusionner les blocs de parrainage
            </label>
          </section>
        </>
      )}

      {(pageId === "inscrire" || !titles[pageId]) && pageId !== "tournoi" && (
        <>
          <div className="toggle-row">
            <span>Inscription ouverte</span>
            <label className="mui-toggle">
              <input
                type="checkbox"
                checked={inscrire.open !== false}
                onChange={(e) => updatePageContent("inscrire", "open", e.target.checked)}
              />
              <span className="mui-toggle-slider" />
            </label>
          </div>
          <section style={{ margin: "24px 0" }}>
            <h3 className="section-title">Introduction</h3>
            <textarea
              className="mui-input"
              value={inscrire.intro || ""}
              onChange={(e) => updatePageContent("inscrire", "intro", e.target.value)}
            />
          </section>
          <section style={{ marginBottom: 24 }}>
            <h3 className="section-title">Nombre max. d&apos;inscriptions</h3>
            <input
              className="mui-input"
              type="number"
              value={inscrire.maxRegistrations || ""}
              onChange={(e) => updatePageContent("inscrire", "maxRegistrations", e.target.value)}
            />
          </section>
          <section style={{ marginBottom: 24 }}>
            <h3 className="section-title">Frais d&apos;inscription</h3>
            <input
              className="mui-input"
              placeholder="EUR"
              value={inscrire.fee || ""}
              onChange={(e) => updatePageContent("inscrire", "fee", e.target.value)}
            />
          </section>
          <section>
            <h3 className="section-title">Formulaire d&apos;inscription</h3>
            {questions.map((q) => (
              <div key={q.id} className="form-question-row">
                <span>{q.text}</span>
                <div className="actions">
                  <button
                    type="button"
                    className="list-row-edit"
                    onClick={() =>
                      openPrompt({
                        title: "Modifier la question",
                        defaultValue: q.text,
                        onSubmit: (text) => {
                          patchPresentation((pres) => ({
                            registrationQuestions: pres.registrationQuestions.map((x) =>
                              x.id === q.id ? { ...x, text } : x
                            ),
                          }));
                          showToast("Question mise à jour");
                        },
                      })
                    }
                  >
                    <span className="material-icons md-20">edit</span>
                  </button>
                  <button type="button" className="list-row-edit" onClick={() => deleteRegistrationQuestion(q.id)}>
                    <span className="material-icons md-20">delete</span>
                  </button>
                </div>
              </div>
            ))}
            <button type="button" className="btn-outlined btn-full" style={{ marginTop: 12 }} onClick={addRegistrationQuestion}>
              Ajouter une question supplémentaire
            </button>
          </section>
        </>
      )}
    </div>
  );
}
