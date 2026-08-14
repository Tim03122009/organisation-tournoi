import { useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useTournament } from "../context/TournamentContext";
import { findRefereeMissingDivision } from "../utils/helpers";
import { findPendingBinomeMatch } from "../utils/refereeExperience";

const CALENDAR_PATH = "/calendar";
export const REQUIRE_REFEREE_BINOME_EVENT = "tournify:require-referee-binome";

function closestElement(target, selector) {
  if (!target) return null;
  if (typeof target.closest === "function") return target.closest(selector);
  return target.parentElement?.closest?.(selector) ?? null;
}

function isPendingBinome(el) {
  return Boolean(closestElement(el, "[data-binome-pending]"));
}

export default function RefereeBinomeGuard() {
  const { data } = useTournament();
  const location = useLocation();
  const navigate = useNavigate();
  const missingDivision = findRefereeMissingDivision(data?.referees);
  const pending = findPendingBinomeMatch(data?.terrains);
  const locked = Boolean(pending) && !missingDivision;

  useEffect(() => {
    document.body.classList.toggle("referee-binome-lock", locked);
    return () => document.body.classList.remove("referee-binome-lock");
  }, [locked]);

  useEffect(() => {
    if (!locked) return;
    if (location.pathname !== CALENDAR_PATH) {
      navigate(CALENDAR_PATH, { replace: true });
    }
  }, [locked, location.pathname, navigate]);

  useEffect(() => {
    if (!locked) return undefined;

    const requireBinome = () => {
      window.dispatchEvent(new CustomEvent(REQUIRE_REFEREE_BINOME_EVENT));
      const card = document.querySelector("[data-binome-pending]");
      card?.scrollIntoView({ block: "center", behavior: "smooth" });
      card?.querySelector("button")?.focus();
    };

    const block = (event) => {
      if (isPendingBinome(event.target)) return;
      event.preventDefault();
      event.stopPropagation();
      event.stopImmediatePropagation();
      requireBinome();
    };

    const onKeyDown = (event) => {
      if (event.key === "F5" || event.key === "F12") return;
      if (event.ctrlKey || event.metaKey) return;
      if (isPendingBinome(event.target)) return;
      event.preventDefault();
      event.stopPropagation();
      event.stopImmediatePropagation();
      requireBinome();
    };

    const onPopState = () => {
      navigate(CALENDAR_PATH, { replace: true });
      requireBinome();
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
