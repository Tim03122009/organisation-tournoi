import { NavLink } from "react-router-dom";

export default function TopBar({ title }) {
  return (
    <header className="topbar">
      <div className="topbar-left">
        <button type="button" aria-label="Retour">
          <span className="material-icons">arrow_back</span>
        </button>
        <span>{title}</span>
      </div>
      <div className="topbar-right">
        <button type="button" className="topbar-action">
          <span className="material-icons">emoji_events</span>
          Mise à niveau
        </button>
        <button type="button" className="topbar-action">
          <span className="material-icons">desktop_windows</span>
          Présentation
        </button>
        <button type="button" className="topbar-action">
          <span className="material-icons">help_outline</span>
          Assistance
        </button>
      </div>
    </header>
  );
}

export function Sidebar() {
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
      {items.map((item) => (
        <NavLink
          key={item.to}
          to={item.to}
          className={({ isActive }) => `sidebar-item${isActive ? " active" : ""}`}
          isActive={(_, location) => location.pathname.startsWith(item.prefix)}
        >
          <span className="material-icons">{item.icon}</span>
          <span>{item.label}</span>
        </NavLink>
      ))}
    </nav>
  );
}

export function AppLayout({ title, children, wide, rightPanel }) {
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
