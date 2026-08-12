export const TIE_BREAK_CRITERIA = {
  points: { id: "points", label: "Nombre de points" },
  matchPoints: { id: "matchPoints", label: "Nombre de points de match" },
  matchesWon: { id: "matchesWon", label: "Nombre de matchs gagnés" },
  goalDiff: { id: "goalDiff", label: "Différence de buts" },
  goalsFor: { id: "goalsFor", label: "Nombre de buts marqués" },
  headToHead: { id: "headToHead", label: "Résultat respectif" },
  setDiff: { id: "setDiff", label: "Différence de sets" },
  setPointsDiff: { id: "setPointsDiff", label: "Différence de points dans les sets" },
  fairPlay: { id: "fairPlay", label: "Fair-play" },
  coinToss: { id: "coinToss", label: "Tirage au sort" },
};

export const DEFAULT_TIE_BREAKERS_POINTS = ["points", "goalDiff", "goalsFor", "headToHead"];
export const DEFAULT_TIE_BREAKERS_SETS = [
  "matchPoints",
  "matchesWon",
  "headToHead",
  "setDiff",
  "setPointsDiff",
];

export const SETS_ATTRIBUTION_OPTIONS = [
  { value: "total", label: "Basés sur les résultats totaux" },
];

export function createDefaultPointScheme(id = 1) {
  return {
    id,
    name: `Comptage de points ${id}`,
    mode: "points",
    advanced: false,
    pointsWin: 3,
    pointsDraw: 1,
    pointsLoss: 0,
    pointsWideWin: 3,
    wideWinMargin: 2,
    pointsWinAfterET: 3,
    pointsDrawWithGoals: 1,
    pointsDrawWithoutGoals: 1,
    pointsLossAfterET: 0,
    disallowDrawInGroup: false,
    goalsAsPoints: false,
    enterPenaltyScores: false,
    setsCount: 2,
    decisiveSet: false,
    decisiveSetInGoalBalance: false,
    setsPointAttribution: "total",
    setsScorePoints: {
      "2-0": { winner: 2, loser: 0 },
      "2-1": { winner: 2, loser: 0 },
      "1-1": { both: 1 },
    },
    tieBreakers: [...DEFAULT_TIE_BREAKERS_POINTS],
  };
}

export function normalizePointScheme(scheme, index = 0) {
  const base = createDefaultPointScheme(scheme?.id ?? index + 1);
  if (!scheme || typeof scheme !== "object") return base;

  const mode = scheme.mode === "sets" ? "sets" : "points";
  const defaultTie =
    mode === "sets" ? DEFAULT_TIE_BREAKERS_SETS : DEFAULT_TIE_BREAKERS_POINTS;

  const tieBreakers = Array.isArray(scheme.tieBreakers)
    ? scheme.tieBreakers.filter((id) => TIE_BREAK_CRITERIA[id])
    : defaultTie;

  return {
    ...base,
    ...scheme,
    id: scheme.id ?? base.id,
    name: scheme.name?.trim() || `Comptage de points ${scheme.id ?? index + 1}`,
    mode,
    advanced: Boolean(scheme.advanced),
    setsScorePoints: {
      ...base.setsScorePoints,
      ...(scheme.setsScorePoints || {}),
    },
    tieBreakers: tieBreakers.length ? tieBreakers : defaultTie,
  };
}

export function normalizePointSchemes(schemes) {
  if (!Array.isArray(schemes) || schemes.length === 0) {
    return [createDefaultPointScheme(1)];
  }
  return schemes.map((scheme, index) => normalizePointScheme(scheme, index));
}

export function tieBreakerLabel(id) {
  return TIE_BREAK_CRITERIA[id]?.label ?? id;
}
