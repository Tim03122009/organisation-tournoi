import { useEffect, useId, useRef, useState } from "react";
import { searchFrenchDepartments } from "../utils/frenchDepartments";

export default function DepartementAutocomplete({
  id,
  value,
  onChange,
  className = "mui-input",
  placeholder = "Ex. 75 - Paris, Gironde…",
  autoFocus = false,
  required = false,
}) {
  const generatedId = useId();
  const inputId = id || generatedId;
  const wrapRef = useRef(null);
  const [query, setQuery] = useState(value ?? "");
  const [suggestions, setSuggestions] = useState([]);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    setQuery(value ?? "");
  }, [value]);

  useEffect(() => {
    const onDocMouseDown = (event) => {
      if (!wrapRef.current?.contains(event.target)) setOpen(false);
    };
    document.addEventListener("mousedown", onDocMouseDown);
    return () => document.removeEventListener("mousedown", onDocMouseDown);
  }, []);

  const updateSuggestions = (nextQuery) => {
    setSuggestions(searchFrenchDepartments(nextQuery));
  };

  const handleChange = (event) => {
    const next = event.target.value;
    setQuery(next);
    onChange?.(next);
    updateSuggestions(next);
    setOpen(true);
  };

  const pick = (department) => {
    setQuery(department);
    onChange?.(department);
    setSuggestions([]);
    setOpen(false);
  };

  return (
    <div className="region-autocomplete" ref={wrapRef}>
      <input
        id={inputId}
        className={className}
        value={query}
        onChange={handleChange}
        onFocus={() => {
          updateSuggestions(query);
          setOpen(true);
        }}
        placeholder={placeholder}
        autoComplete="off"
        autoFocus={autoFocus}
        required={required}
      />
      {open && suggestions.length > 0 && (
        <ul className="location-suggestions region-suggestions">
          {suggestions.map((department) => (
            <li key={department}>
              <button
                type="button"
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => pick(department)}
              >
                {department}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
