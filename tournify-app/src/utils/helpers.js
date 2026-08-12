export function nextId(items) {
  if (!items?.length) return 1;
  return Math.max(...items.map((i) => i.id)) + 1;
}

export function downloadText(filename, content, mime = "text/plain;charset=utf-8") {
  const blob = new Blob([content], { type: mime });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

export function toCsv(rows, headers, { delimiter = ",", bom = false } = {}) {
  const needsQuotes = (value) => {
    const s = String(value ?? "");
    return s.includes('"') || s.includes("\n") || s.includes("\r") || s.includes(delimiter);
  };
  const escape = (v) => {
    const s = String(v ?? "");
    if (!needsQuotes(s)) return s;
    return `"${s.replace(/"/g, '""')}"`;
  };
  const lines = [headers.map(escape).join(delimiter)];
  rows.forEach((row) => lines.push(headers.map((h) => escape(row[h])).join(delimiter)));
  const body = lines.join("\n");
  return bom ? `\uFEFF${body}` : body;
}

function splitCsvLine(line, delimiter) {
  const cells = [];
  let current = "";
  let inQuotes = false;

  for (let i = 0; i < line.length; i += 1) {
    const ch = line[i];
    if (inQuotes) {
      if (ch === '"') {
        if (line[i + 1] === '"') {
          current += '"';
          i += 1;
        } else {
          inQuotes = false;
        }
      } else {
        current += ch;
      }
    } else if (ch === '"') {
      inQuotes = true;
    } else if (ch === delimiter) {
      cells.push(current);
      current = "";
    } else {
      current += ch;
    }
  }
  cells.push(current);
  return cells;
}

/** Parse CSV text into { headers, rows }. Supports comma/semicolon and quoted fields. */
export function parseCsv(text) {
  const normalized = String(text ?? "")
    .replace(/^\uFEFF/, "")
    .replace(/\r\n/g, "\n")
    .replace(/\r/g, "\n")
    .trim();
  if (!normalized) return { headers: [], rows: [] };

  const rawLines = normalized.split("\n").filter((line) => line.trim().length > 0);
  if (!rawLines.length) return { headers: [], rows: [] };

  const sample = rawLines[0];
  const commaCount = (sample.match(/,/g) || []).length;
  const semiCount = (sample.match(/;/g) || []).length;
  const delimiter = semiCount > commaCount ? ";" : ",";

  const headers = splitCsvLine(rawLines[0], delimiter).map((h) => h.trim());
  const rows = rawLines.slice(1).map((line) => {
    const cells = splitCsvLine(line, delimiter);
    const row = {};
    headers.forEach((header, index) => {
      row[header] = (cells[index] ?? "").trim();
    });
    return row;
  });

  return { headers, rows };
}

export const DIVISION_COLORS = ["#e53935", "#fb8c00", "#1e88e5", "#43a047", "#ec407a", "#8e24aa", "#00acc1"];

export function generateAdminLink() {
  return `https://gestion-tournoi.local/admin/${Math.random().toString(36).slice(2, 14)}`;
}

export function generateTeamToken() {
  return Math.random().toString(36).slice(2, 12);
}

export function stableTeamToken(teamId) {
  return `t${String(teamId)}`;
}

export function getPublicAppOrigin() {
  const fromEnv = import.meta.env.VITE_PUBLIC_APP_URL;
  if (fromEnv) return String(fromEnv).replace(/\/$/, "");
  if (typeof window !== "undefined") return window.location.origin;
  return "";
}

export function getTeamConnectionPath(token) {
  return `/equipe/${token}`;
}

export function getTeamConnectionUrl(token) {
  return `${getPublicAppOrigin()}${getTeamConnectionPath(token)}`;
}

const TEAM_LINKS_KEY = "gestion-tournoi-team-links";

export function registerTeamLink(token, teamId, storageKeyName) {
  if (!token || typeof localStorage === "undefined") return;
  try {
    const map = JSON.parse(localStorage.getItem(TEAM_LINKS_KEY) || "{}");
    map[token] = { teamId, storageKey: storageKeyName || null, updatedAt: Date.now() };
    localStorage.setItem(TEAM_LINKS_KEY, JSON.stringify(map));
  } catch {
    // ignore
  }
}

export function lookupTeamLink(token) {
  if (!token || typeof localStorage === "undefined") return null;
  try {
    const map = JSON.parse(localStorage.getItem(TEAM_LINKS_KEY) || "{}");
    return map[token] || null;
  } catch {
    return null;
  }
}

const FRENCH_MONTHS = {
  janvier: "01",
  fevrier: "02",
  février: "02",
  mars: "03",
  avril: "04",
  mai: "05",
  juin: "06",
  juillet: "07",
  aout: "08",
  août: "08",
  septembre: "09",
  octobre: "10",
  novembre: "11",
  decembre: "12",
  décembre: "12",
};

export function toDisplayDate(isoDate) {
  if (!isoDate) return "";
  const [y, m, d] = isoDate.split("-");
  if (!y || !m || !d) return "";
  return `${d}-${m}-${y}`;
}

export function parseDateInput(text) {
  const trimmed = text.trim();
  if (!trimmed) return null;

  if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) return trimmed;

  const slashMatch = trimmed.match(/^(\d{1,2})[-/](\d{1,2})[-/](\d{4})$/);
  if (slashMatch) {
    const [, d, mo, y] = slashMatch;
    return `${y}-${mo.padStart(2, "0")}-${d.padStart(2, "0")}`;
  }

  return null;
}

export function formatFrenchDayLabel(isoDate) {
  const date = new Date(`${isoDate}T12:00:00`);
  if (Number.isNaN(date.getTime())) return isoDate;

  const label = date.toLocaleDateString("fr-FR", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  return label.charAt(0).toUpperCase() + label.slice(1);
}

export function inferDayDate(day) {
  if (day?.date) return day.date;
  if (!day?.label) return new Date().toISOString().slice(0, 10);

  const match = day.label.match(/(\d{1,2})\s+([A-Za-zÀ-ÿ]+)\s+(\d{4})/);
  if (match) {
    const [, d, monthName, y] = match;
    const mo = FRENCH_MONTHS[monthName.toLowerCase()];
    if (mo) return `${y}-${mo}-${d.padStart(2, "0")}`;
  }

  return new Date().toISOString().slice(0, 10);
}

