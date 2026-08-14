import { useEffect, useRef, useState } from "react";
import { useAppUI } from "../context/AppUIContext";
import LocationEditorSection from "./LocationEditorSection";
import DivisionEditorSection from "./DivisionEditorSection";
import TieBreakEditorSection from "./TieBreakEditorSection";
import ExtraPointsEditorSection from "./ExtraPointsEditorSection";
import PlayerStatsEditorSection from "./PlayerStatsEditorSection";
import TeamEditorSection from "./TeamEditorSection";
import RefereeEditorSection from "./RefereeEditorSection";
import PlayersEditorSection from "./PlayersEditorSection";
import DepartementAutocomplete from "./DepartementAutocomplete";
import { parseDateInput, toDisplayDate } from "../utils/helpers";

export default function AppModal() {
  const { modal, closeModal } = useAppUI();
  const [value, setValue] = useState("");
  const [displayDate, setDisplayDate] = useState("");
  const [isoDate, setIsoDate] = useState("");
  const [dateError, setDateError] = useState("");
  const [locationMapOpen, setLocationMapOpen] = useState(false);
  const [extraPointsValid, setExtraPointsValid] = useState(false);
  const [playerStatsValid, setPlayerStatsValid] = useState(false);
  const [publicOnTeamPage, setPublicOnTeamPage] = useState(false);
  const [answerWithCheckbox, setAnswerWithCheckbox] = useState(false);
  const datePickerRef = useRef(null);

  useEffect(() => {
    setLocationMapOpen(false);
    setExtraPointsValid(false);
    setPlayerStatsValid(false);
    setPublicOnTeamPage(false);
    setAnswerWithCheckbox(false);

    if (modal?.type === "prompt") {
      setValue(modal.defaultValue ?? "");
      setDateError("");
    }

    if (modal?.type === "infoFieldEditor") {
      setValue("");
      setPublicOnTeamPage(false);
      setAnswerWithCheckbox(false);
    }

    if (modal?.type === "dayEditor") {
      const nextIso = modal.defaultDate ?? "";
      setIsoDate(nextIso);
      setDisplayDate(toDisplayDate(nextIso));
      setDateError("");
    }
  }, [modal]);

  if (!modal) return null;

  const handlePromptSubmit = (e) => {
    e.preventDefault();
    if (value.trim()) modal.onSubmit(value.trim());
  };

  const handleInfoFieldSubmit = (e) => {
    e.preventDefault();
    const label = value.trim();
    if (!label) return;
    modal.onSubmit({ label, publicOnTeamPage, answerWithCheckbox });
  };

  const syncFromDisplay = (nextDisplay) => {
    setDisplayDate(nextDisplay);
    const parsed = parseDateInput(nextDisplay);
    if (parsed) {
      setIsoDate(parsed);
      setDateError("");
    } else if (nextDisplay.trim()) {
      setDateError("Format attendu : jj-mm-aaaa");
    } else {
      setDateError("");
    }
  };

  const syncFromPicker = (nextIso) => {
    setIsoDate(nextIso);
    setDisplayDate(toDisplayDate(nextIso));
    setDateError("");
  };

  const handleDaySubmit = (e) => {
    e.preventDefault();
    const parsed = parseDateInput(displayDate) || isoDate;
    if (!parsed) {
      setDateError("Indiquez une date valide.");
      return;
    }
    modal.onSubmit(parsed);
  };

  const openCalendar = () => {
    const picker = datePickerRef.current;
    if (!picker) return;
    if (typeof picker.showPicker === "function") {
      picker.showPicker();
      return;
    }
    picker.click();
  };

  const footerRight = (
    <>
      {modal.type !== "alert" && modal.type !== "playersEditor" && (
        <button type="button" className="btn-text" onClick={closeModal}>
          Annuler
        </button>
      )}
      {modal.type === "prompt" && (
        <button type="submit" form="prompt-form" className="btn-contained">
          {modal.confirmText}
        </button>
      )}
      {modal.type === "infoFieldEditor" && (
        <button
          type="submit"
          form="info-field-form"
          className="btn-contained"
          disabled={!value.trim()}
        >
          {modal.confirmText}
        </button>
      )}
      {modal.type === "teamEditor" && (
        <button type="submit" form="team-editor-form" className="btn-contained">
          {modal.confirmText}
        </button>
      )}
      {modal.type === "refereeEditor" && (
        <button type="submit" form="referee-editor-form" className="btn-contained">
          {modal.confirmText}
        </button>
      )}
      {modal.type === "playersEditor" && (
        <button type="button" className="btn-text" onClick={closeModal}>
          Fermer
        </button>
      )}
      {modal.type === "dayEditor" && (
        <button type="submit" form="day-form" className="btn-contained">
          {modal.confirmText}
        </button>
      )}
      {modal.type === "locationEditor" && (
        <button type="submit" form="location-form" className="btn-contained">
          {modal.confirmText}
        </button>
      )}
      {modal.type === "divisionEditor" && (
        <button type="submit" form="division-form" className="btn-contained">
          {modal.confirmText}
        </button>
      )}
      {modal.type === "tieBreakEditor" && (
        <button type="submit" form="tiebreak-form" className="btn-contained">
          {modal.confirmText}
        </button>
      )}
      {modal.type === "extraPointsEditor" && (
        <button
          type="submit"
          form="extra-points-form"
          className="btn-contained"
          disabled={!extraPointsValid}
        >
          {modal.confirmText}
        </button>
      )}
      {modal.type === "playerStatsEditor" && (
        <button
          type="submit"
          form="player-stats-form"
          className="btn-contained"
          disabled={!playerStatsValid}
        >
          {modal.confirmText}
        </button>
      )}
      {modal.type === "confirm" && (
        <button
          type="button"
          className={modal.confirmContained ? "btn-contained" : "btn-text"}
          onClick={modal.onConfirm}
        >
          {modal.confirmText}
        </button>
      )}
      {modal.type === "choiceList" && null}
      {modal.type === "alert" && (
        <button type="button" className="btn-text" onClick={closeModal}>
          OK
        </button>
      )}
    </>
  );

  const isWideEditor =
    modal.type === "locationEditor" ||
    modal.type === "divisionEditor" ||
    modal.type === "playersEditor";

  return (
    <div className="modal-overlay" onClick={closeModal}>
      <div
        className={`modal${isWideEditor ? " modal-wide" : ""}${
          locationMapOpen ? " modal-map-open" : ""
        }`}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="modal-header">{modal.title}</div>
        <div className={`modal-body${isWideEditor ? " modal-body-location" : ""}`}>
          {modal.type === "confirm" && <p className="section-desc">{modal.message}</p>}
          {modal.type === "alert" && <p className="section-desc">{modal.message}</p>}
          {modal.type === "choiceList" && (
            <div className="choice-list">
              {modal.message && <p className="section-desc">{modal.message}</p>}
              <ul className="choice-list-options">
                {(modal.options || []).map((option) => (
                  <li key={option.id}>
                    <button
                      type="button"
                      className={`choice-list-option${option.disabled ? " is-disabled" : ""}`}
                      onClick={() => {
                        if (option.disabled) return;
                        modal.onSelect(option);
                      }}
                      disabled={option.disabled}
                    >
                      {option.label}
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          )}
          {modal.type === "prompt" && (
            <form id="prompt-form" onSubmit={handlePromptSubmit}>
              {modal.label && (
                <label className="mui-input-label" htmlFor="prompt-input">
                  {modal.label}
                </label>
              )}
              {modal.autocomplete === "frenchDepartments" ? (
                <DepartementAutocomplete
                  id="prompt-input"
                  value={value}
                  onChange={setValue}
                  autoFocus
                />
              ) : (
                <input
                  id="prompt-input"
                  className="mui-input"
                  value={value}
                  onChange={(e) => setValue(e.target.value)}
                  autoFocus
                />
              )}
            </form>
          )}
          {modal.type === "infoFieldEditor" && (
            <form id="info-field-form" className="info-field-form" onSubmit={handleInfoFieldSubmit}>
              <div className="mui-field">
                <label className="mui-input-label" htmlFor="info-field-name">
                  Nom
                </label>
                <input
                  id="info-field-name"
                  className="mui-input"
                  value={value}
                  onChange={(e) => setValue(e.target.value)}
                  autoFocus
                />
              </div>
              <label className="info-field-public">
                <input
                  type="checkbox"
                  className="mui-checkbox"
                  checked={answerWithCheckbox}
                  onChange={(e) => setAnswerWithCheckbox(e.target.checked)}
                />
                <span>Répondre par une case à cocher</span>
              </label>
              <label className="info-field-public">
                <input
                  type="checkbox"
                  className="mui-checkbox"
                  checked={publicOnTeamPage}
                  onChange={(e) => setPublicOnTeamPage(e.target.checked)}
                />
                <span>Afficher publiquement sur la page Mon équipe</span>
              </label>
            </form>
          )}
          {modal.type === "dayEditor" && (
            <form id="day-form" onSubmit={handleDaySubmit}>
              <label className="mui-input-label" htmlFor="day-date-input">
                Date
              </label>
              <div className="date-input-row">
                <input
                  id="day-date-input"
                  className="mui-input date-input-text"
                  value={displayDate}
                  onChange={(e) => syncFromDisplay(e.target.value)}
                  placeholder="jj-mm-aaaa"
                  autoFocus
                />
                <button type="button" className="date-picker-btn" onClick={openCalendar} aria-label="Choisir une date">
                  <span className="material-icons md-20">calendar_today</span>
                </button>
                <input
                  ref={datePickerRef}
                  type="date"
                  className="date-picker-native"
                  value={isoDate}
                  onChange={(e) => syncFromPicker(e.target.value)}
                  tabIndex={-1}
                  aria-hidden="true"
                />
              </div>
              {dateError && <p className="auth-error">{dateError}</p>}
            </form>
          )}
          {modal.type === "locationEditor" && (
            <LocationEditorSection
              modal={modal}
              formId="location-form"
              onMapOverlayChange={setLocationMapOpen}
            />
          )}
          {modal.type === "divisionEditor" && (
            <DivisionEditorSection modal={modal} formId="division-form" />
          )}
          {modal.type === "tieBreakEditor" && (
            <TieBreakEditorSection modal={modal} formId="tiebreak-form" />
          )}
          {modal.type === "extraPointsEditor" && (
            <ExtraPointsEditorSection
              modal={modal}
              formId="extra-points-form"
              onValidityChange={setExtraPointsValid}
            />
          )}
          {modal.type === "playerStatsEditor" && (
            <PlayerStatsEditorSection
              modal={modal}
              formId="player-stats-form"
              onValidityChange={setPlayerStatsValid}
            />
          )}
          {modal.type === "teamEditor" && (
            <TeamEditorSection modal={modal} formId="team-editor-form" />
          )}
          {modal.type === "refereeEditor" && (
            <RefereeEditorSection modal={modal} formId="referee-editor-form" />
          )}
          {modal.type === "playersEditor" && (
            <PlayersEditorSection modal={modal} formId="players-editor" />
          )}
        </div>
        {!locationMapOpen && (
        <div
          className={`modal-footer${
            (modal.type === "dayEditor" ||
              modal.type === "locationEditor" ||
              modal.type === "divisionEditor") &&
            modal.onDelete
              ? " modal-footer-split"
              : ""
          }`}
        >
          {(modal.type === "dayEditor" ||
            modal.type === "locationEditor" ||
            modal.type === "divisionEditor") &&
            modal.onDelete && (
            <button
              type="button"
              className={`btn-text${modal.deleteDisabled ? " btn-text-muted" : ""}`}
              onClick={modal.onDelete}
              disabled={modal.deleteDisabled}
            >
              Supprimer
            </button>
          )}
          <div className="modal-footer-actions">{footerRight}</div>
        </div>
        )}
      </div>
    </div>
  );
}
