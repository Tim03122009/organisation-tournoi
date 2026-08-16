import { createContext, useContext, useEffect, useMemo, useRef, useState } from "react";
import { collection, deleteDoc, doc, getDoc, getDocs, onSnapshot, query, setDoc, where } from "firebase/firestore";
import { defaultTournament, createAccountShell, createBlankTournament, looksLikeSeedTournament } from "../data/defaultData";
import { normalizePointSchemes } from "../data/scoringDefaults";
import { applyNoeLambertPreset } from "../utils/locationArea";
import { db, isFirebaseConfigured } from "../firebase";
import { useAuth } from "./AuthContext";
import { generateRefereeToken, generateTeamToken, nextId, registerRefereeLink, registerTeamLink, stableRefereeToken, stableTeamToken } from "../utils/helpers";
import { normalizeRefereeExperience } from "../utils/refereeExperience";
import { normalizeEmail } from "../utils/userLookup";
import { ALL_RIGHT_IDS, findAdminRecord, hasAdminRight } from "../utils/adminRights";
import {
  adminIndexFields,
  deleteAdminAccess,
  deleteAllAccessForTournament,
  isTournamentCreator,
  isTournamentOwner,
  listAdminAccessForUser,
  syncAdminAccessDocs,
  writeAdminAccess,
} from "../utils/tournamentAccess";
import { ALL_RIGHT_IDS } from "../utils/adminRights";

const STORAGE_KEY = "gestion-tournoi-data";

function storageKey(uid) {
  return uid ? `${STORAGE_KEY}-${uid}` : STORAGE_KEY;
}

function newTournamentId() {
  if (typeof crypto !== "undefined" && crypto.randomUUID) return crypto.randomUUID();
  return `t-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function ensureTeamTokens(teams, keyName) {
  return (teams || []).map((team) => {
    const connectionToken = team.connectionToken || stableTeamToken(team.id);
    registerTeamLink(connectionToken, team.id, keyName);
    return {
      ...team,
      connectionToken,
    };
  });
}

function ensureRefereeTokens(referees, keyName) {
  return (referees || []).map((ref) => {
    const connectionToken = ref.connectionToken || stableRefereeToken(ref.id);
    registerRefereeLink(connectionToken, ref.id, keyName);
    return {
      ...ref,
      connectionToken,
      email: ref.email ?? "",
      telephone: ref.telephone ?? "",
      club: ref.club ?? "",
      niveau: ref.niveau ?? "",
      experience: normalizeRefereeExperience(ref.experience),
      pays: ref.pays ?? "",
      divisions: ref.divisions ?? "",
      present: Boolean(ref.present),
      disponible: ref.disponible !== false,
      fromTeamId: ref.fromTeamId ?? null,
      fields: ref.fields || {},
    };
  });
}

function mergeRefereeFields(parsedFields) {
  const existing = Array.isArray(parsedFields) ? parsedFields : [];
  const hasNewShape = existing.some((f) => f.id === "present" || f.standard === true);
  if (hasNewShape) {
    const mapped = existing.map((field) => {
      if (field.id === "lien") return { ...field, help: true, standard: field.standard !== false };
      if (field.id === "club") return { ...field, enabled: true, standard: true };
      if (field.id === "experience") return { ...field, enabled: true, standard: true, help: true };
      if (field.id === "divisions") return { ...field, label: "Division", standard: true };
      return field;
    });
    if (!mapped.some((f) => f.id === "experience")) {
      const insertAt = mapped.findIndex((f) => f.id === "divisions");
      const experienceField = {
        id: "experience",
        label: "Expérience",
        standard: true,
        enabled: true,
        help: true,
      };
      if (insertAt >= 0) mapped.splice(insertAt, 0, experienceField);
      else mapped.push(experienceField);
    }
    return mapped;
  }

  const byId = new Map(existing.map((f) => [f.id, f]));
  const mergedStandard = defaultTournament.refereeFields.map((field) => {
    const prev = byId.get(field.id);
    if (!prev) return field;
    return { ...field, enabled: prev.enabled, label: prev.label || field.label };
  });
  const extras = existing
    .filter((f) => !defaultTournament.refereeFields.some((d) => d.id === f.id))
    .map((f) => ({ ...f, standard: false, enabled: f.enabled !== false }));
  return [...mergedStandard, ...extras];
}

function mergeWithDefaults(parsed) {
  if (!parsed || looksLikeSeedTournament(parsed) || parsed.hasTournament === false) {
    return createAccountShell();
  }

  const locations = Array.isArray(parsed.locations)
    ? parsed.locations.map((location) => applyNoeLambertPreset(location))
    : [];

  const hasNewTeamFields =
    Array.isArray(parsed.teamFields) && parsed.teamFields.some((f) => f.id === "present");

  const teamFields = hasNewTeamFields
    ? parsed.teamFields.map((field) =>
        field.id === "lien" ? { ...field, help: true } : field
      )
    : defaultTournament.teamFields;

  return {
    ...createAccountShell(),
    ...parsed,
    hasTournament: true,
    locations,
    languages: defaultTournament.languages,
    teamFields,
    inscriptionQuestions: Array.isArray(parsed.inscriptionQuestions)
      ? parsed.inscriptionQuestions.map((q) =>
          q.id === "region"
            ? { ...q, id: "departement", label: q.label?.includes("région") ? "De quel département ?" : q.label }
            : q
        )
      : defaultTournament.inscriptionQuestions,
    playerFields: Array.isArray(parsed.playerFields)
      ? parsed.playerFields.map((f) =>
          f.id === "nom" ? { ...f, locked: f.locked ?? true } : f
        )
      : defaultTournament.playerFields,
    teams: Array.isArray(parsed.teams)
      ? ensureTeamTokens(
          parsed.teams.map((team) => {
            const playerList = Array.isArray(team.playerList) ? team.playerList : [];
            return {
              ...team,
              division: team.division || defaultTournament.selectedDivision || defaultTournament.divisions?.[0]?.name || "",
              departement: team.departement ?? team.region ?? "",
              present: Boolean(team.present),
              paye: Boolean(team.paye),
              ajoute: Boolean(team.ajoute),
              fields: team.fields || {},
              playerList,
              players: playerList.length,
              logo: team.logo || null,
            };
          }),
          null
        )
      : [],
    refereeFields: mergeRefereeFields(parsed.refereeFields),
    referees: Array.isArray(parsed.referees)
      ? ensureRefereeTokens(parsed.referees, null)
      : [],
    days: Array.isArray(parsed.days) ? parsed.days : [],
    phases: Array.isArray(parsed.phases) ? parsed.phases : [],
    terrains: Array.isArray(parsed.terrains) ? parsed.terrains : [],
    unscheduledSlots: Array.isArray(parsed.unscheduledSlots) ? parsed.unscheduledSlots : [],
    pointSchemes: normalizePointSchemes(parsed.pointSchemes),
    extraPointTypes: Array.isArray(parsed.extraPointTypes) ? parsed.extraPointTypes : [],
    playerStatTypes: Array.isArray(parsed.playerStatTypes) ? parsed.playerStatTypes : [],
    teamsAsReferees: Boolean(parsed.teamsAsReferees),
    admins: Array.isArray(parsed.admins) ? parsed.admins : [],
    ...adminIndexFields(Array.isArray(parsed.admins) ? parsed.admins : []),
    presentation: { ...defaultTournament.presentation, ...parsed.presentation },
    scores: {
      phases: Array.isArray(parsed.scores?.phases) ? parsed.scores.phases : [],
      matchSlots: Array.isArray(parsed.scores?.matchSlots) ? parsed.scores.matchSlots : [],
    },
  };
}

function withOwner(data, user) {
  return {
    ...data,
    ownerUid: data.ownerUid || user?.uid || "",
    ownerEmail: data.ownerEmail || user?.email || "",
    ownerPhone: data.ownerPhone || user?.phoneNumber || "",
  };
}

function emptyStore(user) {
  return withOwner(
    {
      version: 2,
      currentId: null,
      tournaments: {},
    },
    user
  );
}

function stampTournament(tournament, key) {
  return {
    ...tournament,
    teams: ensureTeamTokens(tournament.teams, key),
    referees: ensureRefereeTokens(tournament.referees, key),
  };
}

function copyName(name) {
  const base = String(name || "").trim() || "Tournoi";
  return `Copie de ${base}`;
}

function cloneTournament(source, { withTeams, newId, name, user }) {
  const cloned = JSON.parse(JSON.stringify(source));
  cloned.id = newId;
  cloned.name = name;
  cloned.createdAt = Date.now();
  cloned.hasTournament = true;
  cloned.ownerUid = user?.uid || "";
  cloned.ownerEmail = user?.email || "";
  cloned.ownerPhone = user?.phoneNumber || "";
  cloned.admins = [];
  cloned.adminUids = [];
  cloned.adminEmails = [];

  cloned.referees = (cloned.referees || []).map((ref) => ({
    ...ref,
    connectionToken: generateRefereeToken(),
    fromTeamId: withTeams ? ref.fromTeamId ?? null : null,
  }));

  if (withTeams) {
    cloned.teams = (cloned.teams || []).map((team) => ({
      ...team,
      connectionToken: generateTeamToken(),
    }));
    return cloned;
  }

  cloned.teams = [];
  cloned.phases = (cloned.phases || []).map((phase) => ({
    ...phase,
    items: (phase.items || []).map((item) => ({ ...item, teams: [] })),
  }));
  cloned.terrains = (cloned.terrains || []).map((terrain) => ({
    ...terrain,
    events: [],
  }));
  cloned.scores = { phases: [], matchSlots: [] };
  cloned.unscheduledMatches = 0;
  cloned.totalMatches = 0;
  cloned.unscheduledSlots = [];
  return cloned;
}

function normalizeTournamentMap(rawMap, user) {
  const tournaments = {};
  Object.entries(rawMap || {}).forEach(([id, item]) => {
    const merged = mergeWithDefaults(item);
    if (!merged.hasTournament) return;
    const tournamentId = item?.id || id;
    tournaments[tournamentId] = withOwner({ ...merged, id: tournamentId }, user);
  });
  return tournaments;
}

function migrateToStore(parsed, user) {
  if (!parsed || typeof parsed !== "object") return emptyStore(user);

  if (parsed.version === 2 && parsed.tournaments && typeof parsed.tournaments === "object") {
    if (parsed.ownerUid && parsed.ownerUid !== user?.uid) return emptyStore(user);
    const tournaments = normalizeTournamentMap(parsed.tournaments, user);
    const currentId = tournaments[parsed.currentId] ? parsed.currentId : Object.keys(tournaments)[0] || null;
    return withOwner({ version: 2, currentId, tournaments }, user);
  }

  if (parsed.ownerUid && parsed.ownerUid !== user?.uid) return emptyStore(user);

  const merged = mergeWithDefaults(parsed);
  if (!merged.hasTournament) return emptyStore(user);

  const id = parsed.id || newTournamentId();
  return withOwner(
    {
      version: 2,
      currentId: id,
      tournaments: { [id]: withOwner({ ...merged, id }, user) },
    },
    user
  );
}

function loadLocalStore(uid, user) {
  if (!uid) return emptyStore(user);
  try {
    const saved = localStorage.getItem(storageKey(uid));
    if (!saved) return emptyStore(user);
    return migrateToStore(JSON.parse(saved), user);
  } catch {
    return emptyStore(user);
  }
}

function tournamentDocRef(userId, tournamentId) {
  return doc(db, "users", userId, "tournaments", tournamentId);
}

function toCloudTournament(item, user) {
  const ownerUid = item.ownerUid || user?.uid || "";
  return {
    ...item,
    ownerUid,
    ownerEmail: item.ownerEmail || user?.email || "",
    ownerPhone: item.ownerPhone || user?.phoneNumber || "",
    ...adminIndexFields(item.admins),
  };
}

async function loadSharedTournaments(userId) {
  const accessList = await listAdminAccessForUser(userId);
  const shared = {};
  await Promise.all(
    accessList.map(async (access) => {
      if (!access.ownerUid || access.ownerUid === userId || !access.tournamentId) return;
      const snap = await getDoc(tournamentDocRef(access.ownerUid, access.tournamentId));
      if (!snap.exists()) return;
      const merged = mergeWithDefaults({ ...snap.data(), id: snap.id });
      if (!merged.hasTournament) return;
      shared[snap.id] = {
        ...merged,
        id: snap.id,
        ownerUid: merged.ownerUid || access.ownerUid,
        ownerEmail: merged.ownerEmail || access.email || "",
      };
    })
  );
  return { accessList, shared };
}

const TournamentContext = createContext(null);

export function TournamentProvider({ children }) {
  const { user } = useAuth();
  const userId = user?.uid;

  const [store, setStore] = useState(() => loadLocalStore(userId, user));
  const [syncReady, setSyncReady] = useState(false);

  const skipNextSave = useRef(false);
  const dirtySinceLoad = useRef(false);
  const syncingUserId = useRef(null);
  const deletedIds = useRef(new Set());

  const data = useMemo(() => {
    const current = store.currentId ? store.tournaments[store.currentId] : null;
    return current || createAccountShell();
  }, [store]);

  const tournaments = useMemo(
    () =>
      Object.values(store.tournaments).map((item) => ({
        id: item.id,
        name: item.name || "Tournoi",
        date: item.days?.[0]?.date || "",
        createdAt: item.createdAt || 0,
        shared: !isTournamentCreator(item, userId),
        isCreator: isTournamentCreator(item, userId),
        isOwner: isTournamentOwner(item, userId),
        ownerEmail: item.ownerEmail || "",
      })),
    [store.tournaments, userId]
  );

  const isCreator = isTournamentCreator(data, userId);
  const isOwner = isTournamentOwner(data, userId);
  const myAdmin = useMemo(() => (isOwner ? null : findAdminRecord(data.admins, user)), [data.admins, isOwner, user]);
  const myRights = myAdmin?.rights || [];
  const can = (rightId) => hasAdminRight(myRights, rightId, isOwner);

  useEffect(() => {
    if (!userId) return undefined;

    let cancelled = false;
    dirtySinceLoad.current = false;
    deletedIds.current = new Set();
    syncingUserId.current = userId;
    setSyncReady(false);

    const cached = loadLocalStore(userId, user);
    skipNextSave.current = true;
    setStore(cached);

    async function syncFromCloud() {
      if (!isFirebaseConfigured || !db || userId === "local-demo") {
        if (!cancelled && syncingUserId.current === userId) setSyncReady(true);
        return;
      }

      try {
        const snaps = await getDocs(collection(db, "users", userId, "tournaments"));
        let tournamentsMap = {};
        snaps.forEach((item) => {
          const merged = mergeWithDefaults({ ...item.data(), id: item.id });
          if (!merged.hasTournament) return;
          tournamentsMap[item.id] = withOwner({ ...merged, id: item.id }, user);
        });

        if (Object.keys(tournamentsMap).length === 0) {
          const legacySnap = await getDoc(doc(db, "users", userId, "data", "tournament"));
          if (legacySnap.exists()) {
            const remote = legacySnap.data();
            const notOwned = Boolean(remote?.ownerUid && remote.ownerUid !== userId);
            if (!notOwned && !looksLikeSeedTournament(remote)) {
              const merged = mergeWithDefaults(remote);
              if (merged.hasTournament) {
                const id = newTournamentId();
                tournamentsMap = { [id]: withOwner({ ...merged, id }, user) };
                await setDoc(tournamentDocRef(userId, id), tournamentsMap[id]);
              }
            }
          }
        }

        const { shared } = await loadSharedTournaments(userId);
        const sharedIds = new Set(Object.keys(shared));
        tournamentsMap = { ...tournamentsMap, ...shared };

        const metaSnap = await getDoc(doc(db, "users", userId, "data", "meta"));
        const metaCurrent = metaSnap.exists() ? metaSnap.data()?.currentId : null;
        const currentId = tournamentsMap[metaCurrent]
          ? metaCurrent
          : tournamentsMap[cached.currentId]
            ? cached.currentId
            : Object.keys(tournamentsMap)[0] || null;

        if (cancelled || syncingUserId.current !== userId) return;

        setStore((prev) => {
          const mergedTournaments = dirtySinceLoad.current
            ? { ...tournamentsMap, ...prev.tournaments }
            : tournamentsMap;
          Object.keys(mergedTournaments).forEach((id) => {
            if (deletedIds.current.has(id)) {
              delete mergedTournaments[id];
              return;
            }
            const item = mergedTournaments[id];
            if (!isTournamentCreator(item, userId) && !sharedIds.has(id)) {
              delete mergedTournaments[id];
            }
          });
          const nextCurrent = mergedTournaments[prev.currentId]
            ? prev.currentId
            : mergedTournaments[currentId]
              ? currentId
              : Object.keys(mergedTournaments)[0] || null;
          skipNextSave.current = true;
          return withOwner(
            {
              version: 2,
              currentId: nextCurrent,
              tournaments: mergedTournaments,
            },
            user
          );
        });
      } catch (err) {
        console.warn("Synchronisation Firestore en arrière-plan impossible:", err);
      } finally {
        if (!cancelled && syncingUserId.current === userId) {
          setSyncReady(true);
        }
      }
    }

    syncFromCloud();

    let unsubAccess = () => {};
    if (isFirebaseConfigured && db && userId !== "local-demo") {
      unsubAccess = onSnapshot(
        query(collection(db, "tournamentAccess"), where("uid", "==", userId)),
        async (snap) => {
          if (cancelled || syncingUserId.current !== userId) return;
          const accessList = snap.docs
            .map((item) => item.data())
            .filter((item) => item.role === "admin" && item.tournamentId && item.ownerUid && item.ownerUid !== userId);
          const shared = {};
          await Promise.all(
            accessList.map(async (access) => {
              const remote = await getDoc(tournamentDocRef(access.ownerUid, access.tournamentId));
              if (!remote.exists()) return;
              const merged = mergeWithDefaults({ ...remote.data(), id: remote.id });
              if (!merged.hasTournament) return;
              shared[remote.id] = {
                ...merged,
                id: remote.id,
                ownerUid: merged.ownerUid || access.ownerUid,
              };
            })
          );
          if (cancelled || syncingUserId.current !== userId) return;
          setStore((prev) => {
            const nextTournaments = { ...prev.tournaments };
            Object.keys(nextTournaments).forEach((id) => {
              if (deletedIds.current.has(id)) {
                delete nextTournaments[id];
                return;
              }
              if (!isTournamentCreator(nextTournaments[id], userId) && !shared[id]) {
                delete nextTournaments[id];
              }
            });
            Object.entries(shared).forEach(([id, item]) => {
              if (dirtySinceLoad.current && prev.currentId === id && prev.tournaments[id]) return;
              nextTournaments[id] = item;
            });
            const nextCurrent = nextTournaments[prev.currentId]
              ? prev.currentId
              : Object.keys(nextTournaments)[0] || null;
            if (!dirtySinceLoad.current) skipNextSave.current = true;
            return withOwner(
              {
                version: 2,
                currentId: nextCurrent,
                tournaments: nextTournaments,
              },
              user
            );
          });
        },
        (err) => {
          console.warn("Écoute des tournois partagés impossible:", err);
        }
      );
    }

    return () => {
      cancelled = true;
      unsubAccess();
    };
  }, [user, userId]);

  useEffect(() => {
    if (!userId) return;

    try {
      const key = storageKey(userId);
      const tournamentsMap = {};
      Object.entries(store.tournaments).forEach(([id, item]) => {
        tournamentsMap[id] = stampTournament(item, key);
      });
      localStorage.setItem(
        key,
        JSON.stringify(
          withOwner(
            {
              version: 2,
              currentId: store.currentId,
              tournaments: tournamentsMap,
            },
            user
          )
        )
      );
    } catch (err) {
      console.warn("Sauvegarde locale impossible:", err);
    }
  }, [store, user, userId]);

  useEffect(() => {
    if (!userId || !syncReady) return undefined;

    if (skipNextSave.current) {
      skipNextSave.current = false;
      return undefined;
    }

    const timer = setTimeout(async () => {
      if (!isFirebaseConfigured || !db || userId === "local-demo") return;
      try {
        await Promise.all(
          Object.entries(store.tournaments).map(([id, item]) => {
            const payload = toCloudTournament({ ...item, id }, user);
            const ownerId = payload.ownerUid || userId;
            return setDoc(tournamentDocRef(ownerId, id), payload);
          })
        );
        await setDoc(doc(db, "users", userId, "data", "meta"), {
          currentId: store.currentId,
          updatedAt: Date.now(),
        });
      } catch (err) {
        console.warn("Synchronisation Firestore impossible:", err);
      }
    }, 800);

    return () => clearTimeout(timer);
  }, [store, user, userId, syncReady]);

  const setDataTracked = (updater) => {
    dirtySinceLoad.current = true;
    setStore((prev) => {
      const id = prev.currentId;
      if (!id || !prev.tournaments[id]) return prev;
      const current = prev.tournaments[id];
      const next = typeof updater === "function" ? updater(current) : updater;
      return {
        ...prev,
        tournaments: {
          ...prev.tournaments,
          [id]: { ...next, id },
        },
      };
    });
  };

  const update = (patch) => setDataTracked((prev) => ({ ...prev, ...patch }));

  const createTournament = (name) => {
    const id = newTournamentId();
    const created = withOwner({ ...createBlankTournament(name), id }, user);
    dirtySinceLoad.current = true;
    setStore((prev) => ({
      ...prev,
      currentId: id,
      tournaments: { ...prev.tournaments, [id]: created },
    }));
    return id;
  };

  const openTournament = (id) => {
    if (!store.tournaments[id]) return;
    dirtySinceLoad.current = true;
    setStore((prev) => ({ ...prev, currentId: id }));
  };

  const duplicateTournament = (id, { withTeams = true } = {}) => {
    const source = store.tournaments[id];
    if (!source || !isTournamentOwner(source, userId)) return null;
    const newId = newTournamentId();
    const created = withOwner(
      cloneTournament(source, {
        withTeams,
        newId,
        name: copyName(source.name),
        user,
      }),
      user
    );
    dirtySinceLoad.current = true;
    setStore((prev) => ({
      ...prev,
      tournaments: { ...prev.tournaments, [newId]: created },
    }));
    return newId;
  };

  const persistNow = (item) => {
    if (!isFirebaseConfigured || !db || !userId || userId === "local-demo" || !item?.id) return Promise.resolve();
    const payload = toCloudTournament(item, user);
    const ownerId = payload.ownerUid || userId;
    return setDoc(tournamentDocRef(ownerId, item.id), payload);
  };

  const leaveTournament = (id) => {
    const item = store.tournaments[id];
    if (!item || isTournamentCreator(item, userId)) return;
    deletedIds.current.add(id);
    dirtySinceLoad.current = true;
    const nextAdmins = (item.admins || []).filter(
      (admin) => admin.uid !== userId && normalizeEmail(admin.email) !== normalizeEmail(user?.email)
    );
    const updated = { ...item, admins: nextAdmins, ...adminIndexFields(nextAdmins) };
    setStore((prev) => {
      const nextTournaments = { ...prev.tournaments };
      delete nextTournaments[id];
      const remainingIds = Object.keys(nextTournaments);
      const currentId =
        prev.currentId === id ? remainingIds[0] || null : prev.currentId;
      return { ...prev, currentId, tournaments: nextTournaments };
    });
    persistNow(updated)
      .then(() => deleteAdminAccess(userId, id))
      .catch((err) => console.warn("Sortie du tournoi impossible:", err));
  };

  const deleteTournament = (id) => {
    const item = store.tournaments[id];
    if (!item) return;
    if (!isTournamentCreator(item, userId)) {
      leaveTournament(id);
      return;
    }
    deletedIds.current.add(id);
    dirtySinceLoad.current = true;
    setStore((prev) => {
      const nextTournaments = { ...prev.tournaments };
      delete nextTournaments[id];
      const remainingIds = Object.keys(nextTournaments);
      const currentId =
        prev.currentId === id ? remainingIds[0] || null : prev.currentId;
      return { ...prev, currentId, tournaments: nextTournaments };
    });
    if (isFirebaseConfigured && db && userId && userId !== "local-demo") {
      Promise.all([
        deleteDoc(tournamentDocRef(userId, id)),
        deleteAllAccessForTournament(userId, id),
      ]).catch((err) => {
        console.warn("Suppression Firestore impossible:", err);
      });
    }
  };

  const addTournamentAdmin = ({ email, uid, rights }) => {
    const id = store.currentId;
    const current = id ? store.tournaments[id] : null;
    if (!current || !uid || !isTournamentOwner(current, userId)) return false;
    const normalized = normalizeEmail(email);
    const previousAdmins = current.admins || [];
    if (
      previousAdmins.some(
        (admin) => admin.uid === uid || normalizeEmail(admin.email) === normalized
      )
    ) {
      return false;
    }
    const admins = [...previousAdmins, { id: nextId(previousAdmins), email: normalized, uid, rights, role: "admin" }];
    const next = { ...current, id, admins, ...adminIndexFields(admins) };
    dirtySinceLoad.current = true;
    setStore((prev) => ({
      ...prev,
      tournaments: { ...prev.tournaments, [id]: next },
    }));
    persistNow(next)
      .then(() =>
        writeAdminAccess({
          tournamentId: id,
          ownerUid: current.ownerUid || userId,
          uid,
          email: normalized,
        })
      )
      .catch((err) => console.warn("Partage administrateur impossible:", err));
    return true;
  };

  const updateTournamentAdmin = (adminId, { email, rights }) => {
    const id = store.currentId;
    const current = id ? store.tournaments[id] : null;
    if (!current || !isTournamentOwner(current, userId)) return;
    const previousAdmins = current.admins || [];
    const admins = previousAdmins.map((admin) =>
      admin.id === adminId ? { ...admin, email: normalizeEmail(email || admin.email), rights } : admin
    );
    const next = { ...current, id, admins, ...adminIndexFields(admins) };
    dirtySinceLoad.current = true;
    setStore((prev) => ({
      ...prev,
      tournaments: { ...prev.tournaments, [id]: next },
    }));
    persistNow(next)
      .then(() => syncAdminAccessDocs(next, previousAdmins))
      .catch((err) => console.warn("Mise à jour administrateur impossible:", err));
  };

  const removeTournamentAdmins = (adminIds) => {
    const id = store.currentId;
    const current = id ? store.tournaments[id] : null;
    if (!current || !isTournamentOwner(current, userId)) return;
    const idSet = new Set(adminIds);
    const previousAdmins = current.admins || [];
    const admins = previousAdmins.filter((admin) => !idSet.has(admin.id));
    const next = { ...current, id, admins, ...adminIndexFields(admins) };
    dirtySinceLoad.current = true;
    setStore((prev) => ({
      ...prev,
      tournaments: { ...prev.tournaments, [id]: next },
    }));
    persistNow(next)
      .then(() => syncAdminAccessDocs(next, previousAdmins))
      .catch((err) => console.warn("Retrait administrateur impossible:", err));
  };

  const setAdminsOwnerRole = (adminIds, makeOwner) => {
    const id = store.currentId;
    const current = id ? store.tournaments[id] : null;
    if (!current || !isTournamentOwner(current, userId) || !adminIds?.length) return;
    const idSet = new Set(adminIds);
    const previousAdmins = current.admins || [];
    const admins = previousAdmins.map((admin) => {
      if (!idSet.has(admin.id)) return admin;
      if (admin.uid && admin.uid === current.ownerUid) return admin;
      if (makeOwner) {
        return {
          ...admin,
          role: "owner",
          previousRights: admin.role === "owner" ? admin.previousRights : admin.rights,
          rights: [...ALL_RIGHT_IDS],
        };
      }
      return {
        ...admin,
        role: "admin",
        rights: admin.previousRights || admin.rights,
        previousRights: undefined,
      };
    });
    const next = { ...current, id, admins, ...adminIndexFields(admins) };
    dirtySinceLoad.current = true;
    setStore((prev) => ({
      ...prev,
      tournaments: { ...prev.tournaments, [id]: next },
    }));
    persistNow(next).catch((err) => console.warn("Changement de rôle impossible:", err));
  };

  return (
    <TournamentContext.Provider
      value={{
        data,
        setData: setDataTracked,
        update,
        tournaments,
        currentId: store.currentId,
        isOwner,
        isCreator,
        can,
        createTournament,
        openTournament,
        duplicateTournament,
        deleteTournament,
        leaveTournament,
        addTournamentAdmin,
        updateTournamentAdmin,
        removeTournamentAdmins,
        setAdminsOwnerRole,
      }}
    >
      {children}
    </TournamentContext.Provider>
  );
}

export function useTournament() {
  const ctx = useContext(TournamentContext);
  if (!ctx) throw new Error("useTournament must be used within TournamentProvider");
  return ctx;
}
