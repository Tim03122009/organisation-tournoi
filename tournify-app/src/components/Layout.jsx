import { useEffect, useState } from "react";
import { NavLink, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useTournament } from "../context/TournamentContext";
import { useTournamentActions } from "../hooks/useTournamentActions";

const NAV_ITEMS = [
  { to: "/general", icon: "settings", label: "Général", prefix: "/general", right: "general" },
  { to: "/participants/teams", icon: "people", label: "Participants", prefix: "/participants", right: "participants" },
  { to: "/structure", icon: "emoji_events", label: "Classement", prefix: "/structure", right: "layout" },
  { to: "/calendar", icon: "event", label: "Calendrier", prefix: "/calendar", right: "calendar" },
  { to: "/presentation", icon: "desktop_windows", label: "Présentation", prefix: "/presentation", right: "presentation" },
  { to: "/scores", icon: "assessment", label: "Scores", prefix: "/scores", right: "scores" },
];

export default function TopBar({ title, navOpen, onToggleNav }) {
  const navigate = useNavigate();
  const { logout } = useAuth();
  const { can, openPresentationMode, showSupport } = useTournamentActions();

  return (
    <header className="topbar">
      <div className="topbar-left">
        <button
          type="button"
          className="topbar-back"
          aria-label="Retour"
          onClick={() => navigate("/tournois")}
        >
          <span className="material-icons">arrow_back</span>
        </button>
        <button
          type="button"
          className="topbar-menu"
          aria-label={navOpen ? "Fermer le menu" : "Ouvrir le menu"}
          aria-expanded={navOpen}
          aria-controls="app-sidebar"
          onClick={onToggleNav}
        >
          <span className="material-icons">menu</span>
        </button>
        <span>{title}</span>
      </div>
      <div className="topbar-right">
        <button
          type="button"
          className="topbar-action"
          onClick={openPresentationMode}
          disabled={!can("presentation")}
          title={can("presentation") ? "Présentation" : "Droit de présentation requis"}
        >
          <span className="material-icons">desktop_windows</span>
          <span className="topbar-action-label">Présentation</span>
        </button>
        <button type="button" className="topbar-action" onClick={showSupport}>
          <span className="material-icons">help_outline</span>
          <span className="topbar-action-label">Assistance</span>
        </button>
        <button type="button" className="topbar-action topbar-action-logout" onClick={logout}>
          <span className="material-icons">logout</span>
          <span className="topbar-action-label">Déconnexion</span>
        </button>
      </div>
    </header>
  );
}

function useIsMobileNav() {
  const [isMobile, setIsMobile] = useState(
    () => typeof window !== "undefined" && window.matchMedia("(max-width: 767px)").matches
  );

  useEffect(() => {
    const media = window.matchMedia("(max-width: 767px)");
    const onChange = () => setIsMobile(media.matches);
    onChange();
    media.addEventListener("change", onChange);
    return () => media.removeEventListener("change", onChange);
  }, []);

  return isMobile;
}

export function Sidebar({ open, onClose }) {
  const location = useLocation();
  const navigate = useNavigate();
  const isMobile = useIsMobileNav();
  const { can } = useTournament();
  const drawerHidden = isMobile && !open;

  return (
    <>
      <div
        className={`sidebar-backdrop${open ? " open" : ""}`}
        onClick={onClose}
        aria-hidden={!open}
      />
      <nav
        id="app-sidebar"
        className={`sidebar${open ? " open" : ""}`}
        aria-hidden={drawerHidden}
      >
        <button
          type="button"
          className="sidebar-back"
          tabIndex={drawerHidden ? -1 : undefined}
          onClick={() => {
            onClose();
            navigate("/tournois");
          }}
        >
          <span className="material-icons">arrow_back</span>
          <span>Retour vers</span>
        </button>
        {NAV_ITEMS.map((item) => {
          const active = location.pathname.startsWith(item.prefix);
          const locked = !can(item.right);
          return (
            <NavLink
              key={item.to}
              to={item.to}
              className={`sidebar-item${active ? " active" : ""}${locked ? " is-locked" : ""}`}
              tabIndex={drawerHidden ? -1 : undefined}
              onClick={onClose}
              title={locked ? "Consultation uniquement : droit non accordé" : item.label}
            >
              <span className="material-icons">{item.icon}</span>
              <span>{item.label}</span>
            </NavLink>
          );
        })}
      </nav>
    </>
  );
}

export function AppLayout({ title, children, rightPanel }) {
  const [navOpen, setNavOpen] = useState(false);
  const location = useLocation();

  useEffect(() => {
    setNavOpen(false);
  }, [location.pathname]);

  useEffect(() => {
    const onResize = () => {
      if (window.matchMedia("(min-width: 768px)").matches) {
        setNavOpen(false);
      }
    };
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  useEffect(() => {
    document.body.classList.toggle("nav-drawer-open", navOpen);
    return () => document.body.classList.remove("nav-drawer-open");
  }, [navOpen]);

  useEffect(() => {
    if (!navOpen) return undefined;
    const onKeyDown = (event) => {
      if (event.key === "Escape") setNavOpen(false);
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [navOpen]);

  return (
    <div className="app-layout">
      <TopBar
        title={title}
        navOpen={navOpen}
        onToggleNav={() => setNavOpen((open) => !open)}
      />
      <div className="app-body">
        <Sidebar open={navOpen} onClose={() => setNavOpen(false)} />
        <main className={`main-content${rightPanel ? " with-right-panel" : ""}`}>
          {children}
        </main>
        {rightPanel}
      </div>
    </div>
  );
}
