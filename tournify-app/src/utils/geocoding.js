import { applyNoeLambertPreset } from "./locationArea";

const NOMINATIM_BASE = "https://nominatim.openstreetmap.org";
const USER_AGENT = "GestionTournoi/1.0";

function mapSearchResult(item) {
  return applyNoeLambertPreset({
    label: item.display_name,
    lat: parseFloat(item.lat),
    lng: parseFloat(item.lon),
  });
}

export async function searchAddresses(query) {
  const trimmed = query?.trim();
  if (!trimmed || trimmed.length < 3) return [];

  const params = new URLSearchParams({
    q: trimmed,
    format: "json",
    addressdetails: "1",
    limit: "5",
  });

  const response = await fetch(`${NOMINATIM_BASE}/search?${params}`, {
    headers: {
      "Accept-Language": "fr",
      "User-Agent": USER_AGENT,
    },
  });

  if (!response.ok) return [];

  const data = await response.json();
  return Array.isArray(data) ? data.map(mapSearchResult) : [];
}

export async function geocodeAddress(query) {
  const results = await searchAddresses(query);
  return results[0] ?? null;
}

export async function reverseGeocode(lat, lng) {
  const params = new URLSearchParams({
    lat: String(lat),
    lon: String(lng),
    format: "json",
  });

  const response = await fetch(`${NOMINATIM_BASE}/reverse?${params}`, {
    headers: {
      "Accept-Language": "fr",
      "User-Agent": USER_AGENT,
    },
  });

  if (!response.ok) return null;

  const data = await response.json();
  if (!data?.display_name) return null;

  return {
    label: data.display_name,
    lat,
    lng,
  };
}
