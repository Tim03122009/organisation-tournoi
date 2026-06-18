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
    ({ title, label, defaultValue = "", confirmText = "OK", onSubmit }) => {
      setModal({
        type: "prompt",
        title,
        label,
        value: defaultValue,
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

  const openConfirm = useCallback(
    ({ title, message, confirmText = "Confirmer", onConfirm }) => {
      setModal({
        type: "confirm",
        title,
        message,
        confirmText,
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

  return (
    <AppUIContext.Provider
      value={{ toast, showToast, modal, setModal, closeModal, openPrompt, openConfirm, openAlert }}
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
