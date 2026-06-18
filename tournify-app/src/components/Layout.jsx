import { NavLink, useLocation, useNavigate } from "react-router-dom";
import { useTournamentActions } from "../hooks/useTournamentActions";

export default function TopBar({ title }) {
  const navigate = useNavigate();
  const { showUpgrade, openPresentationMode, showSupport } = useTournamentActions();

  return (
    <header className="topbar">
      <div className="topbar-left">
        <button type="button" aria-label="Retour" onClick={() => navigate("/general")}>
          <span className="material-icons">arrow_back</span>
        </button>
        <span>{title}</span>
      </div>
      <div className="topbar-right">
        <button type="button" className="topbar-action" onClick={showUpgrade}>
          <span className="material-icons">emoji_events</span>
          Mise à niveau
        </button>
        <button type="button" className="topbar-action" onClick={openPresentationMode}>
          <span className="material-icons">desktop_windows</span>
          Présentation
        </button>
        <button type="button" className="topbar-action" onClick={showSupport}>
          <span className="material-icons">help_outline</span>
          Assistance
        </button>
      </div>
    </header>
  );
}

export function Sidebar() {
  const location = useLocation();
  const items = [
    { to: "/general", icon: "settings", label: "Général", prefix: "/general" },
    { to: "/participants/teams", icon: "people", label: "Participants", prefix: "/participants" },
    { to: "/structure", icon: "emoji_events", label: "Classement", prefix: "/structure" },
    { to: "/calendar", icon: "event", label: "Calendrier", prefix: "/calendar" },
    { to: "/presentation", icon: "desktop_windows", label: "Présentation", prefix: "/presentation" },
    { to: "/scores", icon: "assessment", label: "Scores", prefix: "/scores" },
  ];

  return (
    <nav className="sidebar">
      {items.map((item) => {
        const active = location.pathname.startsWith(item.prefix);
        return (
          <NavLink key={item.to} to={item.to} className={`sidebar-item${active ? " active" : ""}`}>
            <span className="material-icons">{item.icon}</span>
            <span>{item.label}</span>
          </NavLink>
        );
      })}
    </nav>
  );
}

export function AppLayout({ title, children, rightPanel }) {
  return (
    <div className="app-layout">
      <TopBar title={title} />
      <div className="app-body">
        <Sidebar />
        <main className={`main-content${rightPanel ? " with-right-panel" : ""}`}>
          {children}
        </main>
        {rightPanel}
      </div>
    </div>
  );
}
