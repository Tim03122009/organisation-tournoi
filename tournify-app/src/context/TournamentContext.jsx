import { createContext, useContext, useEffect, useState } from "react";
import { defaultTournament } from "../data/defaultData";

const STORAGE_KEY = "gestion-tournoi-data";

const TournamentContext = createContext(null);

export function TournamentProvider({ children }) {
  const [data, setData] = useState(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      return saved ? JSON.parse(saved) : defaultTournament;
    } catch {
      return defaultTournament;
    }
  });

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
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
