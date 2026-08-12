import { useEffect, useRef } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import markerIcon2x from "leaflet/dist/images/marker-icon-2x.png";
import markerIcon from "leaflet/dist/images/marker-icon.png";
import markerShadow from "leaflet/dist/images/marker-shadow.png";

delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: markerIcon2x,
  iconUrl: markerIcon,
  shadowUrl: markerShadow,
});

export default function LocationMap({ lat, lng, onLocationPick }) {
  const containerRef = useRef(null);
  const mapRef = useRef(null);
  const markerRef = useRef(null);
  const onPickRef = useRef(onLocationPick);

  useEffect(() => {
    onPickRef.current = onLocationPick;
  }, [onLocationPick]);

  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;

    const hasCoords = Number.isFinite(lat) && Number.isFinite(lng);
    const center = hasCoords ? [lat, lng] : [46.6, 2.4];

    const map = L.map(containerRef.current).setView(center, hasCoords ? 16 : 6);
    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
    }).addTo(map);

    if (hasCoords) {
      markerRef.current = L.marker([lat, lng]).addTo(map);
    }

    map.on("click", (event) => {
      const { lat: clickLat, lng: clickLng } = event.latlng;
      if (markerRef.current) {
        markerRef.current.setLatLng(event.latlng);
      } else {
        markerRef.current = L.marker(event.latlng).addTo(map);
      }
      onPickRef.current(clickLat, clickLng);
    });

    mapRef.current = map;

    setTimeout(() => map.invalidateSize(), 0);

    return () => {
      map.remove();
      mapRef.current = null;
      markerRef.current = null;
    };
  }, []);

  useEffect(() => {
    if (!mapRef.current || !Number.isFinite(lat) || !Number.isFinite(lng)) return;

    const position = [lat, lng];
    mapRef.current.setView(position, 16);

    if (markerRef.current) {
      markerRef.current.setLatLng(position);
    } else {
      markerRef.current = L.marker(position).addTo(mapRef.current);
    }
  }, [lat, lng]);

  return <div ref={containerRef} className="location-map" aria-label="Carte du lieu" />;
}
