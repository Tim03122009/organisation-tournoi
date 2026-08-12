/** Contour OpenStreetMap du Centre Sportif Noë Lambert (way 887015555). */
export const NOE_LAMBERT_AREA = [
  [47.2308042, -1.5280022],
  [47.2304282, -1.5276696],
  [47.2303371, -1.5276052],
  [47.2303, -1.5276102],
  [47.2302729, -1.527626],
  [47.2302183, -1.5276776],
  [47.2293053, -1.5264492],
  [47.229757, -1.5255868],
  [47.2294883, -1.5251336],
  [47.2303016, -1.5241116],
  [47.2308279, -1.5248814],
  [47.2311995, -1.5254273],
  [47.2313698, -1.5255761],
  [47.2314762, -1.5256819],
  [47.2309982, -1.5269666],
  [47.2311751, -1.5272404],
  [47.2311689, -1.5272573],
  [47.2310849, -1.527475],
  [47.2309281, -1.5278855],
];

export const NOE_LAMBERT_LABEL =
  "Touch & Rugby 1er club de Nantes-Est - Noë Lambert Rugby, Route de Sainte-Luce, Nantes, France";

export const NOE_LAMBERT_CENTER = polygonCenter(NOE_LAMBERT_AREA);

export function polygonCenter(area) {
  if (!area?.length) return { lat: null, lng: null };
  const lat = area.reduce((sum, point) => sum + point[0], 0) / area.length;
  const lng = area.reduce((sum, point) => sum + point[1], 0) / area.length;
  return { lat, lng };
}

export function isPointInPolygon(lat, lng, polygon) {
  if (!Number.isFinite(lat) || !Number.isFinite(lng) || !polygon?.length) return false;

  let inside = false;
  for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
    const [yi, xi] = polygon[i];
    const [yj, xj] = polygon[j];
    const intersects =
      yi > lat !== yj > lat && lng < ((xj - xi) * (lat - yi)) / (yj - yi) + xi;
    if (intersects) inside = !inside;
  }

  return inside;
}

export function isPointInNoeLambertArea(lat, lng) {
  return isPointInPolygon(lat, lng, NOE_LAMBERT_AREA);
}

export function isNoeLambertLabel(label) {
  const normalized = String(label ?? "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
  return (
    normalized.includes("noe lambert") ||
    normalized.includes("touch & rugby") ||
    normalized.includes("route de sainte-luce")
  );
}

export function applyNoeLambertPreset(location) {
  const inZone =
    isNoeLambertLabel(location?.label) ||
    isPointInNoeLambertArea(location?.lat, location?.lng);

  if (!inZone) {
    return { ...location, area: null };
  }

  return {
    ...location,
    label: NOE_LAMBERT_LABEL,
    lat: location.lat,
    lng: location.lng,
    area: NOE_LAMBERT_AREA,
  };
}
