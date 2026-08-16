import { NavLink, Outlet, useLocation } from "react-router-dom";
import { AppLayout } from "../components/Layout";
import RightsLock from "../components/RightsLock";
import PointCountingSection from "../components/PointCountingSection";
import { useTournamentActions } from "../hooks/useTournamentActions";
import "../styles/pages.css";

export default function GeneralPage() {
  const {
    data,
    update,
    editTournamentName,
    addDay,
    editDay,
    addLocation,
    editLocation,
    addDivision,
    editDivision,
    toggleSection,
  } = useTournamentActions();

  return (
    <AppLayout title={data.name}>
      <RightsLock right="general">
      <div className="page-container">
        <section className="form-section">
          <button type="button" className="name-field-btn" onClick={editTournamentName}>
            <span className="name-field-label">Nom du tournoi</span>
            <span className="name-field-value">{data.name}</span>
          </button>
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
              {loc.showLogo ? (
                <div className="list-row-logo">
                  {loc.logo ? <img src={loc.logo} alt="" /> : null}
                </div>
              ) : (
                <div className="list-row-num">{loc.id}</div>
              )}
              <div className="list-row-content">{loc.label}</div>
              <button type="button" className="list-row-edit" onClick={() => editLocation(loc.id)}>
                <span className="material-icons md-20">edit</span>
              </button>
            </div>
          ))}
          <button type="button" className="btn-outlined btn-full" style={{ marginTop: 12 }} onClick={addLocation}>
            Ajouter un lieu
          </button>
        </section>

        <hr className="divider" />

        <section className="form-section">
          <h2 className="section-title">Divisions</h2>
          {data.divisions.map((div) => (
            <div key={div.id} className="list-row">
              {div.showLogo ? (
                <div className="list-row-logo">
                  {div.logo ? <img src={div.logo} alt="" /> : null}
                </div>
              ) : (
                <div className="division-swatch" style={{ backgroundColor: div.color }} />
              )}
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
          <div className="languages-row languages-row-fixed">
            <span className="flag-fr" title="Français" aria-label="Français" />
            <span className="flag-en" title="English" aria-label="English" />
          </div>
          <p className="section-desc">
            Le site est disponible en français et en anglais selon la langue du navigateur du
            visiteur.
          </p>
        </section>

        <hr className="divider" />

        <button type="button" className="collapsible-header" onClick={() => toggleSection("pointsOpen")}>
          Comptage de points
          <span className="material-icons">{data.pointsOpen ? "expand_less" : "expand_more"}</span>
        </button>
        {data.pointsOpen && (
          <div className="collapsible-body">
            <PointCountingSection
              schemes={data.pointSchemes ?? []}
              onUpdateSchemes={(pointSchemes) => update({ pointSchemes })}
              extraPointTypes={data.extraPointTypes ?? []}
              onUpdateExtraPointTypes={(extraPointTypes) => update({ extraPointTypes })}
              playerStatTypes={data.playerStatTypes ?? []}
              onUpdatePlayerStatTypes={(playerStatTypes) => update({ playerStatTypes })}
            />
          </div>
        )}
        {!data.pointsOpen && (
          <p className="section-desc">
            L&apos;utilisation de points ou de sets, les critères de départage des groupes, les points
            personnalisés et les statistiques des joueurs
          </p>
        )}
      </div>
      </RightsLock>
    </AppLayout>
  );
}

export function ParticipantsLayout() {
  const { can, isOwner } = useTournamentActions();
  const location = useLocation();
  const locked = !can("participants");
  const adminsLocked = !isOwner;
  const onAdminsPage = location.pathname.includes("/admins");
  return (
    <AppLayout title="Gestion tournoi">
      <div className="page-tabs">
        <NavLink
          to="/participants/teams"
          className={({ isActive }) => `page-tab${isActive ? " active" : ""}${locked ? " is-locked" : ""}`}
        >
          Équipes
        </NavLink>
        <NavLink
          to="/participants/referees"
          className={({ isActive }) => `page-tab${isActive ? " active" : ""}${locked ? " is-locked" : ""}`}
        >
          Arbitres
        </NavLink>
        <NavLink
          to="/participants/admins"
          className={({ isActive }) => `page-tab${isActive ? " active" : ""}${adminsLocked ? " is-locked" : ""}`}
        >
          Administrateurs
        </NavLink>
      </div>
      {onAdminsPage ? (
        <Outlet />
      ) : (
        <RightsLock right="participants">
          <Outlet />
        </RightsLock>
      )}
    </AppLayout>
  );
}
