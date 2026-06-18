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

export function toCsv(rows, headers) {
  const escape = (v) => `"${String(v ?? "").replace(/"/g, '""')}"`;
  const lines = [headers.map(escape).join(",")];
  rows.forEach((row) => lines.push(headers.map((h) => escape(row[h])).join(",")));
  return lines.join("\n");
}

export const DIVISION_COLORS = ["#e53935", "#fb8c00", "#1e88e5", "#43a047", "#ec407a", "#8e24aa", "#00acc1"];

export function generateAdminLink() {
  return `https://gestion-tournoi.local/admin/${Math.random().toString(36).slice(2, 14)}`;
}
