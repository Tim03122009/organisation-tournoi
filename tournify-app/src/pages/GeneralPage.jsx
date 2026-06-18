import { NavLink, Outlet } from "react-router-dom";
import { AppLayout } from "../components/Layout";
import { useTournament } from "../context/TournamentContext";
import "../styles/pages.css";

export default function GeneralPage() {
  const { data, update } = useTournament();

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
              <button type="button" className="list-row-edit">
                <span className="material-icons md-20">edit</span>
              </button>
            </div>
          ))}
          <button type="button" className="btn-outlined btn-full" style={{ marginTop: 12 }}>
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
              <button type="button" className="list-row-edit">
                <span className="material-icons md-20">edit</span>
              </button>
            </div>
          ))}
          <button type="button" className="btn-outlined btn-full" style={{ marginTop: 12 }}>
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
              <div
                className="division-swatch"
                style={{ backgroundColor: div.color }}
              />
              <div className="list-row-content">{div.name}</div>
              <button type="button" className="list-row-edit">
                <span className="material-icons md-20">edit</span>
              </button>
            </div>
          ))}
          <button type="button" className="btn-outlined btn-full" style={{ marginTop: 12 }}>
            Ajouter une division
          </button>
        </section>

        <hr className="divider" />

        <section className="form-section">
          <h2 className="section-title">Langues</h2>
          <div className="languages-row">
            <span className="flag-fr" title="Français" />
            <button type="button" className="add-lang-btn">+</button>
          </div>
          <p className="section-desc">
            Les visiteurs verront le site dans la langue de leur navigateur si elle est
            disponible. Sinon, la première langue de cette liste sera utilisée.
          </p>
        </section>

        <hr className="divider" />

        <button type="button" className="collapsible-header">
          Audience
          <span className="material-icons">expand_more</span>
        </button>

        <hr className="divider" />

        <button type="button" className="collapsible-header">
          Comptage de points
          <span className="material-icons">expand_more</span>
        </button>
        <p className="section-desc">
          Configurez ici les points, le classement des groupes, etc.
        </p>
      </div>
    </AppLayout>
  );
}

export function ParticipantsLayout() {
  return (
    <AppLayout title="Gestion tournoi">
      <div className="page-tabs">
        <NavLink
          to="/participants/teams"
          className={({ isActive }) => `page-tab${isActive ? " active" : ""}`}
        >
          Équipes
        </NavLink>
        <NavLink
          to="/participants/referees"
          className={({ isActive }) => `page-tab${isActive ? " active" : ""}`}
        >
          Arbitres
        </NavLink>
        <NavLink
          to="/participants/admins"
          className={({ isActive }) => `page-tab${isActive ? " active" : ""}`}
        >
          Administrateurs
        </NavLink>
      </div>
      <Outlet />
    </AppLayout>
  );
}
