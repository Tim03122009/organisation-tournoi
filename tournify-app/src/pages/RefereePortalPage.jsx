import { useMemo, useState } from "react";
import { useParams } from "react-router-dom";
import { defaultTournament } from "../data/defaultData";
import { lookupRefereeLink } from "../utils/helpers";

const STORAGE_KEY = "gestion-tournoi-data";

function readJson(key) {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

function loadTournamentByRefereeToken(token) {
  if (!token) return null;

  const keys = new Set(
    Object.keys(localStorage).filter(
      (key) => key === STORAGE_KEY || key.startsWith(`${STORAGE_KEY}-`)
    )
  );

  const registered = lookupRefereeLink(token);
  if (registered?.storageKey) keys.add(registered.storageKey);

  for (const key of keys) {
    const parsed = readJson(key);
    if (!parsed?.referees) continue;
    const referee = parsed.referees.find(
      (r) =>
        r.connectionToken === token ||
        (registered?.refereeId != null && r.id === registered.refereeId)
    );
    if (referee) {
      return {
        storageKey: key,
        data: { ...defaultTournament, ...parsed },
        referee: { ...referee, connectionToken: referee.connectionToken || token },
      };
    }
  }

  return null;
}

function findRefereeMatches(data, refereeName) {
  const matches = [];
  const seen = new Set();

  (data?.scores?.matchSlots || []).forEach((slot, slotIndex) => {
    (slot.matches || []).forEach((match, matchIndex) => {
      if (match.referee !== refereeName && match.referee2 !== refereeName) return;
      const key = `${match.team1}|${match.team2}|${slot.time}|${match.terrain}`;
      seen.add(key);
      matches.push({
        ...match,
        time: slot.time,
        day: slot.day,
        slotIndex,
        matchIndex,
        source: "scores",
      });
    });
  });

  (data?.terrains || []).forEach((terrain) => {
    (terrain.events || []).forEach((event) => {
      if (event.type !== "match" || (event.referee !== refereeName && event.referee2 !== refereeName)) return;
      const key = `${event.team1}|${event.team2}|${event.time}|${terrain.name}`;
      if (seen.has(key)) return;
      matches.push({
        team1: event.team1,
        team2: event.team2,
        time: event.time,
        terrain: terrain.name,
        poule: event.poule,
        referee: event.referee,
        score1: null,
        score2: null,
        source: "calendar",
      });
    });
  });

  return matches;
}

function formatScore(match) {
  if (match.score1 == null || match.score2 == null) return "Score non saisi";
  return `${match.score1} - ${match.score2}`;
}

function patchStoredScore(storageKey, slotIndex, matchIndex, score1, score2) {
  const parsed = readJson(storageKey);
  if (!parsed?.scores?.matchSlots?.[slotIndex]?.matches?.[matchIndex]) return null;

  const slots = parsed.scores.matchSlots.map((slot, sIndex) => {
    if (sIndex !== slotIndex) return slot;
    return {
      ...slot,
      matches: (slot.matches || []).map((item, mIndex) =>
        mIndex === matchIndex ? { ...item, score1, score2 } : item
      ),
    };
  });

  let done = 0;
  let total = 0;
  slots.forEach((slot) => {
    (slot.matches || []).forEach((item) => {
      total += 1;
      if (item.score1 !== null && item.score2 !== null) done += 1;
    });
  });
  const phases = [...(parsed.scores.phases || [])];
  if (phases[0]) phases[0] = { ...phases[0], done, total: total || phases[0].total };

  const next = { ...parsed, scores: { ...parsed.scores, matchSlots: slots, phases } };
  try {
    localStorage.setItem(storageKey, JSON.stringify(next));
    if (storageKey !== STORAGE_KEY) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    }
  } catch {
    // ignore
  }
  return next;
}

export default function RefereePortalPage() {
  const { token } = useParams();
  const initial = useMemo(() => loadTournamentByRefereeToken(token), [token]);
  const [resolved, setResolved] = useState(initial);
  const [scoreDraft, setScoreDraft] = useState(null);
  const [scoreError, setScoreError] = useState("");

  if (!resolved) {
    return (
      <div className="team-portal">
        <div className="team-portal-topbar" />
        <div className="team-portal-shell">
          <div className="team-portal-card team-portal-card-empty">
            <div className="team-portal-empty">
              <span className="material-icons team-portal-scoreboard" aria-hidden="true">
                sports
              </span>
              <h2>Lien invalide</h2>
              <p>Ce lien de connexion ne correspond à aucun arbitre.</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const { data, referee, storageKey } = resolved;
  const matches = findRefereeMatches(data, referee.name);

  const saveScore = (match) => {
    if (match.source !== "scores") return;
    const parts = String(scoreDraft?.value ?? "")
      .split("-")
      .map((s) => parseInt(s.trim(), 10));
    if (parts.length !== 2 || Number.isNaN(parts[0]) || Number.isNaN(parts[1])) {
      setScoreError("Format invalide (ex: 4 - 2)");
      return;
    }

    const next = patchStoredScore(storageKey, match.slotIndex, match.matchIndex, parts[0], parts[1]);
    if (!next) {
      setScoreError("Impossible d'enregistrer le score");
      return;
    }
    setResolved({
      ...resolved,
      data: { ...defaultTournament, ...next },
    });
    setScoreDraft(null);
    setScoreError("");
  };

  return (
    <div className="team-portal">
      <div className="team-portal-topbar" />
      <div className="team-portal-shell">
        <header className="team-portal-header">
          <div>
            <h1>{referee.name}</h1>
            <p className="team-portal-division">
              {referee.divisions || "Arbitre"}
              {referee.niveau ? ` · ${referee.niveau}` : ""}
            </p>
          </div>
          <span className="material-icons team-portal-jersey" aria-hidden="true">
            sports
          </span>
        </header>

        <section className="team-portal-card">
          {matches.length === 0 ? (
            <div className="team-portal-empty">
              <span className="material-icons team-portal-scoreboard" aria-hidden="true">
                scoreboard
              </span>
              <h2>Aucun match trouvé</h2>
              <p>Dès que des matchs vous seront assignés, vous les verrez ici.</p>
            </div>
          ) : (
            <ul className="team-portal-match-list">
              {matches.map((match, index) => {
                const editing =
                  scoreDraft &&
                  scoreDraft.slotIndex === match.slotIndex &&
                  scoreDraft.matchIndex === match.matchIndex;
                return (
                  <li key={`${match.team1}-${match.team2}-${match.time}-${index}`}>
                    <strong>
                      {match.team1} vs {match.team2}
                    </strong>
                    <span>
                      {match.time || "—"}
                      {match.terrain ? ` · ${match.terrain}` : ""}
                      {match.poule ? ` · ${match.poule}` : ""}
                      {match.division ? ` · ${match.division}` : ""}
                    </span>
                    <span className="referee-portal-score">{formatScore(match)}</span>
                    {match.source === "scores" &&
                      (editing ? (
                        <div className="referee-portal-score-edit">
                          <input
                            type="text"
                            value={scoreDraft.value}
                            onChange={(e) => {
                              setScoreDraft({ ...scoreDraft, value: e.target.value });
                              setScoreError("");
                            }}
                            placeholder="4 - 2"
                            aria-label="Score"
                          />
                          <button type="button" className="btn-contained" onClick={() => saveScore(match)}>
                            Enregistrer
                          </button>
                          <button
                            type="button"
                            className="btn-text"
                            onClick={() => {
                              setScoreDraft(null);
                              setScoreError("");
                            }}
                          >
                            Annuler
                          </button>
                          {scoreError ? <em>{scoreError}</em> : null}
                        </div>
                      ) : (
                        <button
                          type="button"
                          className="btn-text"
                          style={{ padding: 0, textTransform: "none", alignSelf: "flex-start" }}
                          onClick={() =>
                            setScoreDraft({
                              slotIndex: match.slotIndex,
                              matchIndex: match.matchIndex,
                              value:
                                match.score1 != null ? `${match.score1} - ${match.score2}` : "",
                            })
                          }
                        >
                          {match.score1 != null ? "Modifier le score" : "Saisir le score"}
                        </button>
                      ))}
                  </li>
                );
              })}
            </ul>
          )}
        </section>

        <footer className="team-portal-footer">
          <span>Logiciel de tournoi</span>
        </footer>
      </div>
    </div>
  );
}
