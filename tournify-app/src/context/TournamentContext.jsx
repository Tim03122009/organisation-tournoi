import { createContext, useContext, useEffect, useState } from "react";
import { defaultTournament } from "../data/defaultData";

const STORAGE_KEY = "gestion-tournoi-data";

function loadData() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (!saved) return defaultTournament;
    const parsed = JSON.parse(saved);
    return {
      ...defaultTournament,
      ...parsed,
      presentation: { ...defaultTournament.presentation, ...parsed.presentation },
      scores: { ...defaultTournament.scores, ...parsed.scores },
    };
  } catch {
    return defaultTournament;
  }
}

const TournamentContext = createContext(null);

export function TournamentProvider({ children }) {
  const [data, setData] = useState(loadData);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    } catch (err) {
      console.warn("Sauvegarde locale impossible:", err);
    }
  }, [data]);

  const update = (patch) => setData((prev) => ({ ...prev, ...patch }));

  return (
    <TournamentContext.Provider value={{ data, setData, update }}>
      {children}
    </TournamentContext.Provider>
  );
}

export function useTournament() {
  const ctx = useContext(TournamentContext);
  if (!ctx) throw new Error("useTournament must be used within TournamentProvider");
  return ctx;
}
