import { createContext, useCallback, useContext, useState } from "react";

const AppUIContext = createContext(null);

export function AppUIProvider({ children }) {
  const [toast, setToast] = useState(null);
  const [modal, setModal] = useState(null);

  const showToast = useCallback((message, duration = 3000) => {
    setToast(message);
    setTimeout(() => setToast(null), duration);
  }, []);

  const closeModal = useCallback(() => setModal(null), []);

  const openPrompt = useCallback(
    ({ title, label, defaultValue = "", confirmText = "OK", autocomplete = null, onSubmit }) => {
      setModal({
        type: "prompt",
        title,
        label,
        defaultValue,
        confirmText,
        autocomplete,
        onSubmit: (value) => {
          try {
            onSubmit(value);
          } catch (err) {
            console.error(err);
          }
          closeModal();
        },
      });
    },
    [closeModal]
  );

  const openConfirm = useCallback(
    ({ title, message, confirmText = "Confirmer", confirmContained = false, onConfirm }) => {
      setModal({
        type: "confirm",
        title,
        message,
        confirmText,
        confirmContained,
        onConfirm: () => {
          try {
            onConfirm();
          } catch (err) {
            console.error(err);
          }
          closeModal();
        },
      });
    },
    [closeModal]
  );

  const openAlert = useCallback(
    ({ title, message }) => {
      setModal({ type: "alert", title, message });
    },
    []
  );

  const openDayEditor = useCallback(
    ({ title, defaultDate, confirmText = "Sauvegarder", onSubmit, onDelete, deleteDisabled = false }) => {
      setModal({
        type: "dayEditor",
        title,
        defaultDate,
        confirmText,
        deleteDisabled,
        onSubmit: (value) => {
          try {
            onSubmit(value);
          } catch (err) {
            console.error(err);
          }
          closeModal();
        },
        onDelete: onDelete
          ? () => {
              if (deleteDisabled) return;
              try {
                onDelete();
              } catch (err) {
                console.error(err);
              }
              closeModal();
            }
          : undefined,
      });
    },
    [closeModal]
  );

  const openLocationEditor = useCallback(
    ({ title, defaultLocation, confirmText = "Sauvegarder", onSubmit, onDelete, deleteDisabled = false }) => {
      setModal({
        type: "locationEditor",
        title,
        defaultLocation,
        confirmText,
        deleteDisabled,
        onSubmit: (location) => {
          try {
            onSubmit(location);
          } catch (err) {
            console.error(err);
          }
          closeModal();
        },
        onDelete: onDelete
          ? () => {
              if (deleteDisabled) return;
              try {
                onDelete();
              } catch (err) {
                console.error(err);
              }
              closeModal();
            }
          : undefined,
      });
    },
    [closeModal]
  );

  const openDivisionEditor = useCallback(
    ({ title, defaultDivision, confirmText = "Sauvegarder", onSubmit, onDelete, deleteDisabled = false }) => {
      setModal({
        type: "divisionEditor",
        title,
        defaultDivision,
        confirmText,
        deleteDisabled,
        onSubmit: (division) => {
          try {
            onSubmit(division);
          } catch (err) {
            console.error(err);
          }
          closeModal();
        },
        onDelete: onDelete
          ? () => {
              if (deleteDisabled) return;
              try {
                onDelete();
              } catch (err) {
                console.error(err);
              }
              closeModal();
            }
          : undefined,
      });
    },
    [closeModal]
  );

  const openTieBreakEditor = useCallback(
    ({ title, defaultCriteria = [], confirmText = "Sauvegarder", onSubmit }) => {
      setModal({
        type: "tieBreakEditor",
        title,
        defaultCriteria,
        confirmText,
        onSubmit: (criteria) => {
          try {
            onSubmit(criteria);
          } catch (err) {
            console.error(err);
          }
          closeModal();
        },
      });
    },
    [closeModal]
  );

  const openExtraPointsEditor = useCallback(
    ({
      title = "Enregistrer plus de points",
      defaultValue,
      confirmText = "Ajouter",
      onSubmit,
    }) => {
      setModal({
        type: "extraPointsEditor",
        title,
        defaultValue,
        confirmText,
        onSubmit: (value) => {
          try {
            onSubmit(value);
          } catch (err) {
            console.error(err);
          }
          closeModal();
        },
      });
    },
    [closeModal]
  );

  const openPlayerStatsEditor = useCallback(
    ({
      title = "Suivre les statistiques des joueurs",
      defaultValue,
      confirmText = "Ajouter",
      onSubmit,
    }) => {
      setModal({
        type: "playerStatsEditor",
        title,
        defaultValue,
        confirmText,
        onSubmit: (value) => {
          try {
            onSubmit(value);
          } catch (err) {
            console.error(err);
          }
          closeModal();
        },
      });
    },
    [closeModal]
  );

  const openInfoFieldEditor = useCallback(
    ({
      title = "Ajouter un champ d'information",
      confirmText = "Ajouter",
      onSubmit,
    }) => {
      setModal({
        type: "infoFieldEditor",
        title,
        confirmText,
        onSubmit: (value) => {
          try {
            onSubmit(value);
          } catch (err) {
            console.error(err);
          }
          closeModal();
        },
      });
    },
    [closeModal]
  );

  const openChoiceList = useCallback(
    ({ title, message, options = [], onSelect }) => {
      setModal({
        type: "choiceList",
        title,
        message,
        options,
        onSelect: (option) => {
          try {
            onSelect(option);
          } catch (err) {
            console.error(err);
          }
          closeModal();
        },
      });
    },
    [closeModal]
  );

  const openTeamEditor = useCallback(
    ({
      title = "Modifier l'équipe",
      team,
      fields = [],
      divisions = [],
      confirmText = "Sauvegarder",
      onSubmit,
    }) => {
      setModal({
        type: "teamEditor",
        title,
        team,
        fields,
        divisions,
        confirmText,
        onSubmit: (value) => {
          try {
            onSubmit(value);
          } catch (err) {
            console.error(err);
          }
          closeModal();
        },
      });
    },
    [closeModal]
  );

  const openRefereeEditor = useCallback(
    ({
      title = "Modifier l'arbitre",
      referee,
      fields = [],
      divisions = [],
      teams = [],
      confirmText = "Sauvegarder",
      onSubmit,
    }) => {
      setModal({
        type: "refereeEditor",
        title,
        referee,
        fields,
        divisions,
        teams,
        confirmText,
        onSubmit: (value) => {
          try {
            onSubmit(value);
          } catch (err) {
            console.error(err);
          }
          closeModal();
        },
      });
    },
    [closeModal]
  );

  const openPlayersEditor = useCallback(
    ({ title = "Joueurs", team, players = [], playerFields = [], onChange }) => {
      setModal({
        type: "playersEditor",
        title,
        team,
        players,
        playerFields,
        onChange,
      });
    },
    []
  );

  return (
    <AppUIContext.Provider
      value={{
        toast,
        showToast,
        modal,
        setModal,
        closeModal,
        openPrompt,
        openConfirm,
        openAlert,
        openDayEditor,
        openLocationEditor,
        openDivisionEditor,
        openTieBreakEditor,
        openExtraPointsEditor,
        openPlayerStatsEditor,
        openInfoFieldEditor,
        openChoiceList,
        openTeamEditor,
        openRefereeEditor,
        openPlayersEditor,
      }}
    >
      {children}
    </AppUIContext.Provider>
  );
}

export function useAppUI() {
  const ctx = useContext(AppUIContext);
  if (!ctx) throw new Error("useAppUI must be used within AppUIProvider");
  return ctx;
}
