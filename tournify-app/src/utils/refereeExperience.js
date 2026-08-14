export const REFEREE_EXPERIENCE = {
  NOVICE: "Novice",
  NORMAL: "Normal",
  ACCOMPAGNATEUR: "Accompagnateur",
};

export const REFEREE_EXPERIENCE_OPTIONS = [
  { value: REFEREE_EXPERIENCE.NOVICE, label: "Novice" },
  { value: REFEREE_EXPERIENCE.NORMAL, label: "Normal" },
  { value: REFEREE_EXPERIENCE.ACCOMPAGNATEUR, label: "Accompagnateur" },
];

export function normalizeRefereeExperience(value) {
  const v = String(value ?? "").trim().toLowerCase();
  if (v.startsWith("nov")) return REFEREE_EXPERIENCE.NOVICE;
  if (v.startsWith("acc")) return REFEREE_EXPERIENCE.ACCOMPAGNATEUR;
  return REFEREE_EXPERIENCE.NORMAL;
}

export function findPendingBinomeMatch(terrains) {
  for (const terrain of terrains || []) {
    for (const event of terrain.events || []) {
      if (event.type === "match" && event.binomeStatus === "needs-validation") {
        return { terrainId: terrain.id, eventId: event.id };
      }
    }
  }
  return null;
}

function experienceOf(ref) {
  if (!ref) return "";
  return normalizeRefereeExperience(ref.experience);
}

/**
 * Place les arbitres en les gardant sur un même terrain.
 * Les novices restent sur un seul terrain, jumelés d'abord avec un
 * accompagnateur ; s'il n'y en a pas, avec un normal (binôme à valider).
 */
export function assignRefereesPreferringTerrain(terrains, referees) {
  const available = (referees || []).filter((ref) => ref.disponible !== false);
  const mentors = available.filter((ref) => experienceOf(ref) === REFEREE_EXPERIENCE.ACCOMPAGNATEUR);
  const normals = available.filter((ref) => experienceOf(ref) === REFEREE_EXPERIENCE.NORMAL);
  const novices = available.filter((ref) => experienceOf(ref) === REFEREE_EXPERIENCE.NOVICE);
  const homes = [...mentors, ...normals];
  const list = terrains || [];

  const homeByTerrain = new Map();
  list.forEach((terrain, index) => {
    if (homes.length) homeByTerrain.set(terrain.id, homes[index % homes.length]);
  });

  const mentorTerrains = list.filter(
    (terrain) => experienceOf(homeByTerrain.get(terrain.id)) === REFEREE_EXPERIENCE.ACCOMPAGNATEUR
  );
  const normalTerrains = list.filter(
    (terrain) => experienceOf(homeByTerrain.get(terrain.id)) === REFEREE_EXPERIENCE.NORMAL
  );
  const hostTerrains = mentorTerrains.length ? mentorTerrains : normalTerrains;
  const pairStatus = mentorTerrains.length ? "ok" : hostTerrains.length && novices.length ? "needs-validation" : "";

  const novicesByTerrain = new Map();
  if (hostTerrains.length && novices.length) {
    novices.forEach((novice, index) => {
      const terrain = hostTerrains[index % hostTerrains.length];
      const assigned = novicesByTerrain.get(terrain.id) || [];
      assigned.push(novice);
      novicesByTerrain.set(terrain.id, assigned);
    });
  }

  return list.map((terrain) => {
    const home = homeByTerrain.get(terrain.id);
    const assignedNovices = novicesByTerrain.get(terrain.id) || [];
    let matchIndex = 0;
    return {
      ...terrain,
      events: (terrain.events || []).map((event) => {
        if (event.type !== "match") return event;
        const partner = assignedNovices.length
          ? assignedNovices[matchIndex++ % assignedNovices.length]
          : null;
        const partnerName = partner?.name || "";
        const status = partner ? pairStatus : "";
        const samePair =
          event.referee === (home?.name || "") &&
          (event.referee2 || "") === partnerName &&
          event.binomeStatus === "validated";
        return {
          ...event,
          referee: home?.name || event.referee || "",
          referee2: partnerName,
          binomeStatus: samePair ? "validated" : status,
        };
      }),
    };
  });
}
