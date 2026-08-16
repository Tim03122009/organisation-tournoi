import { useTournament } from "../context/TournamentContext";

export default function RightsLock({ right, children, className = "" }) {
  const { can } = useTournament();
  const allowed = !right || can(right);

  if (allowed) return children;

  return (
    <div className={`rights-locked${className ? ` ${className}` : ""}`} inert>
      {children}
    </div>
  );
}
