import { useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useTournament } from "../context/TournamentContext";
import { findRefereeMissingDivision } from "../utils/helpers";

const REFEREES_PATH = "/participants/referees";
export const REQUIRE_REFEREE_DIVISION_EVENT = "tournify:require-referee-division";

function closestElement(target, selector) {
  if (!target) return null;
  if (typeof target.closest === "function") return target.closest(selector);
  return target.parentElement?.closest?.(selector) ?? null;
}

function isDivisionSelect(el) {
  return Boolean(closestElement(el, "[data-referee-division-select]"));
}

export default function RefereeDivisionGuard() {
  const { data } = useTournament();
  const location = useLocation();
  const navigate = useNavigate();
  const missing = findRefereeMissingDivision(data?.referees);
  const locked = Boolean(missing);

  useEffect(() => {
    document.body.classList.toggle("referee-division-lock", locked);
    return () => document.body.classList.remove("referee-division-lock");
  }, [locked]);

  useEffect(() => {
    if (!locked) return;
    if (location.pathname !== REFEREES_PATH) {
      navigate(REFEREES_PATH, { replace: true });
    }
  }, [locked, location.pathname, navigate]);

  useEffect(() => {
    if (!locked) return undefined;

    const requireDivision = () => {
      window.dispatchEvent(new CustomEvent(REQUIRE_REFEREE_DIVISION_EVENT));
    };

    const block = (event) => {
      if (isDivisionSelect(event.target)) return;
      if (document.activeElement?.hasAttribute?.("data-referee-division-select")) {
        const goingElsewhere = closestElement(
          event.target,
          "a, button, .sidebar, .topbar, .page-tabs, .sidebar-item, .page-tab"
        );
        if (!goingElsewhere) return;
      }

      event.preventDefault();
      event.stopPropagation();
      event.stopImmediatePropagation();
      requireDivision();
    };

    const onKeyDown = (event) => {
      if (event.key === "F5" || event.key === "F12") return;
      if (event.ctrlKey || event.metaKey) return;

      if (isDivisionSelect(event.target)) {
        if (event.key === "Tab") {
          event.preventDefault();
          event.stopPropagation();
          requireDivision();
        }
        return;
      }

      event.preventDefault();
      event.stopPropagation();
      event.stopImmediatePropagation();
      requireDivision();
    };

    const onPopState = () => {
      navigate(REFEREES_PATH, { replace: true });
      requireDivision();
    };

    const opts = { capture: true };
    document.addEventListener("pointerdown", block, opts);
    document.addEventListener("click", block, opts);
    document.addEventListener("keydown", onKeyDown, opts);
    window.addEventListener("popstate", onPopState);

    return () => {
      document.removeEventListener("pointerdown", block, opts);
      document.removeEventListener("click", block, opts);
      document.removeEventListener("keydown", onKeyDown, opts);
      window.removeEventListener("popstate", onPopState);
    };
  }, [locked, navigate]);

  return null;
}
