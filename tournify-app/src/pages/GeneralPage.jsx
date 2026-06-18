import { NavLink, Outlet } from "react-router-dom";
import { AppLayout } from "../components/Layout";
import { useTournamentActions } from "../hooks/useTournamentActions";
import "../styles/pages.css";

export default function GeneralPage() {
  const {
    data,
    update,
    addDay,
    editDay,
    addLocation,
    editLocation,
    addDivision,
    editDivision,
    addLanguage,
    toggleSection,
  } = useTournamentActions();

  return (
    <AppLayout title={data.name}>
      <div className="page-container">
        <section className="form-section">
          <h2 className="section-title">Nom du tournoi</h2>
          <input
            className="mui-input"
            value={data.name}
            onChange={(e) => update({ name: e.target.value })}
          />
        </section>

        <hr className="divider" />

        <section className="form-section">
          <h2 className="section-title">Journées de matchs</h2>
          {data.days.map((day) => (
            <div key={day.id} className="list-row">
              <div className="list-row-num">{day.id}</div>
              <div className="list-row-content">{day.label}</div>
              <button type="button" className="list-row-edit" onClick={() => editDay(day.id)}>
                <span className="material-icons md-20">edit</span>
              </button>
            </div>
          ))}
          <button type="button" className="btn-outlined btn-full" style={{ marginTop: 12 }} onClick={addDay}>
            Ajouter un jour
          </button>
        </section>

        <hr className="divider" />

        <section className="form-section">
          <h2 className="section-title">Lieux</h2>
          {data.locations.map((loc) => (
            <div key={loc.id} className="list-row">
              <div className="list-row-num">{loc.id}</div>
              <div className="list-row-content">{loc.label}</div>
              <button type="button" className="list-row-edit" onClick={() => editLocation(loc.id)}>
                <span className="material-icons md-20">edit</span>
              </button>
            </div>
          ))}
          <button type="button" className="btn-outlined btn-full" style={{ marginTop: 12 }} onClick={addLocation}>
            Ajouter un lieu
          </button>
          <label className="checkbox-row" style={{ marginTop: 16 }}>
            <input
              type="checkbox"
              className="mui-checkbox"
              checked={data.isOnline}
              onChange={(e) => update({ isOnline: e.target.checked })}
            />
            Il s&apos;agit d&apos;un tournoi en ligne (eSport)
          </label>
        </section>

        <hr className="divider" />

        <section className="form-section">
          <h2 className="section-title">Divisions</h2>
          {data.divisions.map((div) => (
            <div key={div.id} className="list-row">
              <div className="division-swatch" style={{ backgroundColor: div.color }} />
              <div className="list-row-content">{div.name}</div>
              <button type="button" className="list-row-edit" onClick={() => editDivision(div.id)}>
                <span className="material-icons md-20">edit</span>
              </button>
            </div>
          ))}
          <button type="button" className="btn-outlined btn-full" style={{ marginTop: 12 }} onClick={addDivision}>
            Ajouter une division
          </button>
        </section>

        <hr className="divider" />

        <section className="form-section">
          <h2 className="section-title">Langues</h2>
          <div className="languages-row">
            {data.languages.map((lang) => (
              <span key={lang} className={lang === "fr" ? "flag-fr" : "add-lang-btn"} title={lang}>
                {lang !== "fr" ? lang.toUpperCase() : ""}
              </span>
            ))}
            <button type="button" className="add-lang-btn" onClick={addLanguage}>
              +
            </button>
          </div>
          <p className="section-desc">
            Les visiteurs verront le site dans la langue de leur navigateur si elle est
            disponible. Sinon, la première langue de cette liste sera utilisée.
          </p>
        </section>

        <hr className="divider" />

        <button type="button" className="collapsible-header" onClick={() => toggleSection("audienceOpen")}>
          Audience
          <span className="material-icons">{data.audienceOpen ? "expand_less" : "expand_more"}</span>
        </button>
        {data.audienceOpen && (
          <div className="collapsible-body">
            <label className="checkbox-row">
              <input
                type="checkbox"
                className="mui-checkbox"
                checked={data.audienceFamily ?? true}
                onChange={(e) => update({ audienceFamily: e.target.checked })}
              />
              Tournoi avec des joueurs inexpérimentés (familial)
            </label>
            <label className="checkbox-row">
              <input
                type="checkbox"
                className="mui-checkbox"
                checked={data.audienceClub ?? false}
                onChange={(e) => update({ audienceClub: e.target.checked })}
              />
              Tournoi avec joueurs expérimentés (club)
            </label>
          </div>
        )}

        <hr className="divider" />

        <button type="button" className="collapsible-header" onClick={() => toggleSection("pointsOpen")}>
          Comptage de points
          <span className="material-icons">{data.pointsOpen ? "expand_less" : "expand_more"}</span>
        </button>
        {data.pointsOpen && (
          <div className="collapsible-body">
            <label className="mui-input-label">Points victoire</label>
            <input
              className="mui-input"
              type="number"
              value={data.pointsWin ?? 3}
              onChange={(e) => update({ pointsWin: +e.target.value })}
            />
            <label className="mui-input-label" style={{ marginTop: 12 }}>
              Points nul
            </label>
            <input
              className="mui-input"
              type="number"
              value={data.pointsDraw ?? 1}
              onChange={(e) => update({ pointsDraw: +e.target.value })}
            />
          </div>
        )}
        {!data.pointsOpen && (
          <p className="section-desc">Configurez ici les points, le classement des groupes, etc.</p>
        )}
      </div>
    </AppLayout>
  );
}

export function ParticipantsLayout() {
  return (
    <AppLayout title="Gestion tournoi">
      <div className="page-tabs">
        <NavLink to="/participants/teams" className={({ isActive }) => `page-tab${isActive ? " active" : ""}`}>
          Équipes
        </NavLink>
        <NavLink to="/participants/referees" className={({ isActive }) => `page-tab${isActive ? " active" : ""}`}>
          Arbitres
        </NavLink>
        <NavLink to="/participants/admins" className={({ isActive }) => `page-tab${isActive ? " active" : ""}`}>
          Administrateurs
        </NavLink>
      </div>
      <Outlet />
    </AppLayout>
  );
}
