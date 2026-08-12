import { useEffect, useMemo, useRef, useState } from "react";
import LocationMap from "./LocationMap";
import { geocodeAddress, reverseGeocode, searchAddresses } from "../utils/geocoding";
import {
  applyNoeLambertPreset,
  isNoeLambertLabel,
  isPointInNoeLambertArea,
  NOE_LAMBERT_LABEL,
} from "../utils/locationArea";

export default function LocationEditorSection({ modal, formId, onMapOverlayChange }) {
  const initial = modal.defaultLocation ?? {
    label: "",
    lat: null,
    lng: null,
    area: null,
    showLogo: false,
    logo: null,
  };

  const locationKey = useMemo(
    () => JSON.stringify({ title: modal.title, location: modal.defaultLocation }),
    [modal.title, modal.defaultLocation]
  );

  const [address, setAddress] = useState(initial.label ?? "");
  const [lat, setLat] = useState(initial.lat ?? null);
  const [lng, setLng] = useState(initial.lng ?? null);
  const [area, setArea] = useState(initial.area ?? null);
  const [showLogo, setShowLogo] = useState(Boolean(initial.showLogo));
  const [logo, setLogo] = useState(initial.logo ?? null);
  const [suggestions, setSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [showMapOverlay, setShowMapOverlay] = useState(false);
  const [mapDraft, setMapDraft] = useState({ address: "", lat: null, lng: null });
  const [loadingSuggestions, setLoadingSuggestions] = useState(false);
  const [loadingMap, setLoadingMap] = useState(false);
  const [addressValidationError, setAddressValidationError] = useState("");
  const [formError, setFormError] = useState("");
  const debounceRef = useRef(null);
  const skipSearchRef = useRef(false);
  const fileInputRef = useRef(null);
  const snapshotBeforeMap = useRef(null);

  useEffect(() => {
    const next = modal.defaultLocation ?? {
      label: "",
      lat: null,
      lng: null,
      area: null,
      showLogo: false,
      logo: null,
    };
    setAddress(next.label ?? "");
    setLat(next.lat ?? null);
    setLng(next.lng ?? null);
    setArea(next.area ?? null);
    setShowLogo(Boolean(next.showLogo));
    setLogo(next.logo ?? null);
    setSuggestions([]);
    setShowSuggestions(false);
    setShowMapOverlay(false);
    setAddressValidationError("");
    setFormError("");
    onMapOverlayChange?.(false);
  }, [locationKey, onMapOverlayChange]);

  useEffect(() => {
    onMapOverlayChange?.(showMapOverlay);
  }, [showMapOverlay, onMapOverlayChange]);

  useEffect(() => {
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, []);

  const isAddressVerified = (nextLat = lat, nextLng = lng) =>
    Number.isFinite(nextLat) && Number.isFinite(nextLng);

  const applyLocation = (location) => {
    const enriched = applyNoeLambertPreset(location);
    skipSearchRef.current = true;
    setAddress(enriched.label);
    setLat(enriched.lat);
    setLng(enriched.lng);
    setArea(enriched.area ?? null);
    setSuggestions([]);
    setShowSuggestions(false);
    setAddressValidationError("");
    setFormError("");
  };

  const validateAddress = async (value = address, currentLat = lat, currentLng = lng) => {
    const trimmed = value.trim();
    if (!trimmed) {
      setAddressValidationError("Le lieu est obligatoire.");
      return false;
    }

    if (isAddressVerified(currentLat, currentLng)) {
      setAddressValidationError("");
      return true;
    }

    try {
      const result = await geocodeAddress(trimmed);
      if (result) {
        applyLocation(result);
        return true;
      }
    } catch {
      // fall through
    }

    setAddressValidationError(
      "Cette adresse n'est pas valide. Choisissez une suggestion ou utilisez la carte."
    );
    return false;
  };

  const handleAddressChange = (value) => {
    setAddress(value);
    setAddressValidationError("");
    setFormError("");
    setLat(null);
    setLng(null);
    if (!isNoeLambertLabel(value)) {
      setArea(null);
    }

    if (skipSearchRef.current) {
      skipSearchRef.current = false;
      return;
    }

    if (debounceRef.current) clearTimeout(debounceRef.current);

    if (value.trim().length < 3) {
      setSuggestions([]);
      setShowSuggestions(false);
      if (!value.trim()) {
        setAddressValidationError("Le lieu est obligatoire.");
      }
      return;
    }

    debounceRef.current = setTimeout(async () => {
      setLoadingSuggestions(true);
      try {
        const results = await searchAddresses(value);
        setSuggestions(results);
        setShowSuggestions(results.length > 0);
        if (results.length === 0) {
          setAddressValidationError(
            "Cette adresse n'est pas valide. Choisissez une suggestion ou utilisez la carte."
          );
        }
      } catch {
        setSuggestions([]);
        setShowSuggestions(false);
      } finally {
        setLoadingSuggestions(false);
      }
    }, 350);
  };

  const handleAddressBlur = () => {
    setTimeout(() => setShowSuggestions(false), 150);
    if (address.trim().length >= 3 && !isAddressVerified()) {
      validateAddress();
    }
  };

  const handleMapPick = async (nextLat, nextLng) => {
    setLoadingMap(true);
    try {
      if (isPointInNoeLambertArea(nextLat, nextLng)) {
        setMapDraft({
          lat: nextLat,
          lng: nextLng,
          address: NOE_LAMBERT_LABEL,
        });
      } else {
        const result = await reverseGeocode(nextLat, nextLng);
        setMapDraft({
          lat: nextLat,
          lng: nextLng,
          address: result?.label ?? `${nextLat.toFixed(5)}, ${nextLng.toFixed(5)}`,
        });
      }
      setAddressValidationError("");
    } finally {
      setLoadingMap(false);
    }
  };

  const openMapOverlay = async () => {
    snapshotBeforeMap.current = { address, lat, lng, area };
    setMapDraft({ address, lat, lng });
    setShowMapOverlay(true);

    if (Number.isFinite(lat) && Number.isFinite(lng)) return;
    if (!address.trim()) return;

    setLoadingMap(true);
    try {
      const result = await geocodeAddress(address);
      if (result) {
        setMapDraft({ address: result.label, lat: result.lat, lng: result.lng });
      }
    } finally {
      setLoadingMap(false);
    }
  };

  const confirmMap = () => {
    if (Number.isFinite(mapDraft.lat) && Number.isFinite(mapDraft.lng)) {
      applyLocation({
        label: mapDraft.address || address,
        lat: mapDraft.lat,
        lng: mapDraft.lng,
      });
    }
    setShowMapOverlay(false);
  };

  const cancelMap = () => {
    const snap = snapshotBeforeMap.current;
    if (snap) {
      setAddress(snap.address);
      setLat(snap.lat);
      setLng(snap.lng);
      setArea(snap.area);
    }
    setShowMapOverlay(false);
  };

  const pickLogo = () => {
    fileInputRef.current?.click();
  };

  const handleLogoChange = (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      setFormError("Le logo doit être une image.");
      return;
    }

    if (file.size > 2 * 1024 * 1024) {
      setFormError("Le logo ne doit pas dépasser 2 Mo.");
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      setLogo(typeof reader.result === "string" ? reader.result : null);
      setFormError("");
    };
    reader.readAsDataURL(file);
    event.target.value = "";
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setFormError("");

    const trimmed = address.trim();
    if (!trimmed) {
      setAddressValidationError("Le lieu est obligatoire.");
      return;
    }

    let submitLat = lat;
    let submitLng = lng;
    let submitArea = area;

    if (!isAddressVerified(submitLat, submitLng)) {
      try {
        const result = await geocodeAddress(trimmed);
        if (!result) {
          setAddressValidationError(
            "Cette adresse n'est pas valide. Choisissez une suggestion ou utilisez la carte."
          );
          return;
        }
        submitLat = result.lat;
        submitLng = result.lng;
        submitArea = result.area ?? submitArea;
        applyLocation(result);
      } catch {
        setAddressValidationError(
          "Cette adresse n'est pas valide. Choisissez une suggestion ou utilisez la carte."
        );
        return;
      }
    }

    const finalLocation = applyNoeLambertPreset({
      label: trimmed,
      lat: submitLat,
      lng: submitLng,
      area: submitArea,
    });

    modal.onSubmit({
      label: finalLocation.label,
      lat: finalLocation.lat,
      lng: finalLocation.lng,
      area: finalLocation.area,
      showLogo,
      logo: showLogo ? logo : null,
    });
  };

  const mapLat = showMapOverlay ? mapDraft.lat : lat;
  const mapLng = showMapOverlay ? mapDraft.lng : lng;

  return (
    <>
      <form
        id={formId}
        className={showLogo ? "location-form" : "location-form location-form--compact"}
        onSubmit={handleSubmit}
      >
        <label className="mui-input-label" htmlFor="location-address-input">
          Lieu
        </label>
        <div className="location-input-row">
          <div className="location-input-wrap">
            <input
              id="location-address-input"
              className="mui-input location-input-text"
              value={address}
              onChange={(e) => handleAddressChange(e.target.value)}
              onFocus={() => suggestions.length > 0 && setShowSuggestions(true)}
              onBlur={handleAddressBlur}
              placeholder="Saisissez une adresse"
              autoComplete="off"
              autoFocus
            />
            {showSuggestions && suggestions.length > 0 && (
              <ul className="location-suggestions">
                {suggestions.map((item) => (
                  <li key={`${item.lat}-${item.lng}-${item.label}`}>
                    <button type="button" onMouseDown={() => applyLocation(item)}>
                      {item.label}
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
          <button
            type="button"
            className="location-picker-btn"
            onClick={openMapOverlay}
            aria-label="Afficher la carte"
          >
            <span className="material-icons md-20">place</span>
          </button>
        </div>

        {addressValidationError && (
          <p className="auth-error location-address-error">{addressValidationError}</p>
        )}

        {loadingSuggestions && <p className="location-hint">Recherche d&apos;adresses...</p>}

        <div className="location-logo-toggle">
          <span>Logo de localisation</span>
          <label className="mui-toggle">
            <input
              type="checkbox"
              checked={showLogo}
              onChange={(e) => setShowLogo(e.target.checked)}
            />
            <span className="mui-toggle-slider" />
          </label>
        </div>

        {showLogo && (
          <div className="location-logo-upload">
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="location-logo-input"
              onChange={handleLogoChange}
            />
            {logo ? (
              <div className="location-logo-preview">
                <img src={logo} alt="Logo du lieu" />
                <div className="location-logo-actions">
                  <button type="button" className="btn-text" onClick={pickLogo}>
                    Changer
                  </button>
                  <button type="button" className="btn-text" onClick={() => setLogo(null)}>
                    Retirer
                  </button>
                </div>
              </div>
            ) : (
              <button type="button" className="btn-outlined btn-full" onClick={pickLogo}>
                Télécharger un logo
              </button>
            )}
            <p className="location-hint">Format recommandé : PNG transparent, max 2 Mo.</p>
          </div>
        )}

        {formError && <p className="auth-error">{formError}</p>}
      </form>

      {showMapOverlay && (
        <div className="location-map-overlay" onClick={(e) => e.stopPropagation()}>
          <div className="location-map-overlay-panel">
            {loadingMap && <p className="location-hint">Mise à jour de la carte...</p>}
            <LocationMap lat={mapLat} lng={mapLng} onLocationPick={handleMapPick} />
            <p className="location-hint">Cliquez sur la carte pour placer le point.</p>
            <div className="location-map-overlay-footer">
              <button type="button" className="btn-text" onClick={cancelMap}>
                Annuler
              </button>
              <button type="button" className="btn-contained" onClick={confirmMap}>
                OK
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
