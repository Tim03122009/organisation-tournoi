import { createContext, useContext, useEffect, useRef, useState } from "react";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { defaultTournament } from "../data/defaultData";
import { normalizePointSchemes } from "../data/scoringDefaults";
import { applyNoeLambertPreset } from "../utils/locationArea";
import { db, isFirebaseConfigured } from "../firebase";
import { useAuth } from "./AuthContext";
import { registerRefereeLink, registerTeamLink, stableRefereeToken, stableTeamToken } from "../utils/helpers";
import { normalizeRefereeExperience } from "../utils/refereeExperience";

const STORAGE_KEY = "gestion-tournoi-data";

function storageKey(uid) {
  return uid ? `${STORAGE_KEY}-${uid}` : STORAGE_KEY;
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
  const locations = Array.isArray(parsed.locations)
    ? parsed.locations.map((location) => applyNoeLambertPreset(location))
    : defaultTournament.locations;

  const hasNewTeamFields =
    Array.isArray(parsed.teamFields) && parsed.teamFields.some((f) => f.id === "present");

  const teamFields = hasNewTeamFields
    ? parsed.teamFields.map((field) =>
        field.id === "lien" ? { ...field, help: true } : field
      )
    : defaultTournament.teamFields;

  return {
    ...defaultTournament,
    ...parsed,
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
      : ensureTeamTokens(defaultTournament.teams, null),
    refereeFields: mergeRefereeFields(parsed.refereeFields),
    referees: Array.isArray(parsed.referees)
      ? ensureRefereeTokens(parsed.referees, null)
      : ensureRefereeTokens(defaultTournament.referees, null),
    pointSchemes: normalizePointSchemes(parsed.pointSchemes),
    extraPointTypes: Array.isArray(parsed.extraPointTypes) ? parsed.extraPointTypes : [],
    playerStatTypes: Array.isArray(parsed.playerStatTypes) ? parsed.playerStatTypes : [],
    teamsAsReferees: Boolean(parsed.teamsAsReferees),
    presentation: { ...defaultTournament.presentation, ...parsed.presentation },
    scores: { ...defaultTournament.scores, ...parsed.scores },
  };
}

function loadLocalData(uid) {
  const keys = uid ? [storageKey(uid), STORAGE_KEY] : [STORAGE_KEY];

  for (const key of keys) {
    try {
      const saved = localStorage.getItem(key);
      if (!saved) continue;
      return mergeWithDefaults(JSON.parse(saved));
    } catch {
      // try next key
    }
  }

  return defaultTournament;
}

const TournamentContext = createContext(null);

export function TournamentProvider({ children }) {
  const { user } = useAuth();
  const userId = user?.uid;

  const [data, setData] = useState(() => loadLocalData(userId));
  const [syncReady, setSyncReady] = useState(false);

  const skipNextSave = useRef(false);
  const dirtySinceLoad = useRef(false);
  const syncingUserId = useRef(null);

  useEffect(() => {
    if (!userId) return;

    let cancelled = false;
    dirtySinceLoad.current = false;
    syncingUserId.current = userId;
    setSyncReady(false);

    const cached = loadLocalData(userId);
    skipNextSave.current = true;
    setData(cached);

    async function syncFromCloud() {
      if (!isFirebaseConfigured || !db || userId === "local-demo") {
        if (!cancelled && syncingUserId.current === userId) setSyncReady(true);
        return;
      }

      try {
        const docRef = doc(db, "users", userId, "data", "tournament");
        const snap = await getDoc(docRef);

        if (cancelled || syncingUserId.current !== userId) return;

        if (snap.exists()) {
          if (!dirtySinceLoad.current) {
            skipNextSave.current = true;
            setData(mergeWithDefaults(snap.data()));
          }
        } else {
          await setDoc(docRef, cached);
        }
      } catch (err) {
        console.warn("Synchronisation Firestore en arrière-plan impossible:", err);
      } finally {
        if (!cancelled && syncingUserId.current === userId) {
          setSyncReady(true);
        }
      }
    }

    syncFromCloud();

    return () => {
      cancelled = true;
    };
  }, [userId]);

  useEffect(() => {
    if (!userId) return;

    try {
      const key = storageKey(userId);
      const withLinks = {
        ...data,
        teams: ensureTeamTokens(data.teams, key),
        referees: ensureRefereeTokens(data.referees, key),
      };
      localStorage.setItem(key, JSON.stringify(withLinks));
      localStorage.setItem(STORAGE_KEY, JSON.stringify(withLinks));
    } catch (err) {
      console.warn("Sauvegarde locale impossible:", err);
    }
  }, [data, userId]);

  useEffect(() => {
    if (!userId || !syncReady) return;

    if (skipNextSave.current) {
      skipNextSave.current = false;
      return;
    }

    const timer = setTimeout(async () => {
      if (!isFirebaseConfigured || !db || userId === "local-demo") return;
      try {
        const docRef = doc(db, "users", userId, "data", "tournament");
        await setDoc(docRef, data);
      } catch (err) {
        console.warn("Synchronisation Firestore impossible:", err);
      }
    }, 800);

    return () => clearTimeout(timer);
  }, [data, userId, syncReady]);

  const setDataTracked = (updater) => {
    dirtySinceLoad.current = true;
    setData(updater);
  };

  const update = (patch) => setDataTracked((prev) => ({ ...prev, ...patch }));

  return (
    <TournamentContext.Provider value={{ data, setData: setDataTracked, update }}>
      {children}
    </TournamentContext.Provider>
  );
}

export function useTournament() {
  const ctx = useContext(TournamentContext);
  if (!ctx) throw new Error("useTournament must be used within TournamentProvider");
  return ctx;
}
