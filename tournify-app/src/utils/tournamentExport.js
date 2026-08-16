export const TOURNAMENT_EXPORT_FORMAT = "tournify-tournament";
export const TOURNAMENT_EXPORT_VERSION = 1;

const OWNERSHIP_KEYS = [
  "ownerUid",
  "ownerEmail",
  "ownerPhone",
  "admins",
  "adminUids",
  "adminEmails",
  "coOwnerUids",
  "shared",
  "isOwner",
  "isCreator",
];

function looksLikeTournament(value) {
  if (!value || typeof value !== "object" || Array.isArray(value)) return false;
  if (value.tournaments && typeof value.tournaments === "object" && !Array.isArray(value.tournaments)) {
    return false;
  }
  return (
    value.hasTournament === true ||
    Array.isArray(value.teams) ||
    Array.isArray(value.referees) ||
    Array.isArray(value.phases) ||
    Array.isArray(value.days) ||
    typeof value.name === "string"
  );
}

function stripOwnership(tournament) {
  const data = JSON.parse(JSON.stringify(tournament || {}));
  OWNERSHIP_KEYS.forEach((key) => {
    delete data[key];
  });
  return data;
}

export function buildTournamentExport(tournament) {
  return {
    format: TOURNAMENT_EXPORT_FORMAT,
    version: TOURNAMENT_EXPORT_VERSION,
    exportedAt: new Date().toISOString(),
    tournament: stripOwnership(tournament),
  };
}

export function parseTournamentImport(raw) {
  if (!raw || typeof raw !== "object") return null;

  if (raw.format === TOURNAMENT_EXPORT_FORMAT && looksLikeTournament(raw.tournament)) {
    return { ...stripOwnership(raw.tournament), hasTournament: true };
  }

  if (raw.version === 2 && raw.tournaments && typeof raw.tournaments === "object") {
    const map = raw.tournaments;
    const current = raw.currentId && map[raw.currentId] ? map[raw.currentId] : Object.values(map)[0];
    return looksLikeTournament(current) ? { ...stripOwnership(current), hasTournament: true } : null;
  }

  if (looksLikeTournament(raw)) return { ...stripOwnership(raw), hasTournament: true };
  return null;
}

export function tournamentExportFilename(name) {
  const slug =
    String(name || "tournoi")
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-zA-Z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .toLowerCase()
      .slice(0, 48) || "tournoi";
  return `${slug}.json`;
}
