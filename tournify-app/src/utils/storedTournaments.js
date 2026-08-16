export function extractStoredTournaments(parsed) {
  if (!parsed || typeof parsed !== "object") return [];
  if (parsed.tournaments && typeof parsed.tournaments === "object" && !Array.isArray(parsed.tournaments)) {
    return Object.values(parsed.tournaments);
  }
  if (Array.isArray(parsed.teams) || Array.isArray(parsed.referees) || parsed.hasTournament) {
    return [parsed];
  }
  return [];
}

export function mapStoredTournaments(parsed, mapper) {
  if (!parsed || typeof parsed !== "object") return parsed;
  if (parsed.tournaments && typeof parsed.tournaments === "object" && !Array.isArray(parsed.tournaments)) {
    const tournaments = {};
    Object.entries(parsed.tournaments).forEach(([id, item]) => {
      tournaments[id] = mapper(item, id) || item;
    });
    return { ...parsed, tournaments };
  }
  return mapper(parsed, parsed.id) || parsed;
}
