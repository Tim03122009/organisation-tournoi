import { useEffect, useState } from "react";
import { useAppUI } from "../context/AppUIContext";

export default function AppModal() {
  const { modal, closeModal } = useAppUI();
  const [value, setValue] = useState("");

  useEffect(() => {
    if (modal?.type === "prompt") setValue(modal.defaultValue || "");
  }, [modal]);

  if (!modal) return null;

  const handlePromptSubmit = (e) => {
    e.preventDefault();
    if (value.trim()) modal.onSubmit(value.trim());
  };

  return (
    <div className="modal-overlay" onClick={closeModal}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">{modal.title}</div>
        <div className="modal-body">
          {modal.type === "confirm" && <p className="section-desc">{modal.message}</p>}
          {modal.type === "alert" && <p className="section-desc">{modal.message}</p>}
          {modal.type === "prompt" && (
            <form id="prompt-form" onSubmit={handlePromptSubmit}>
              {modal.label && <label className="mui-input-label">{modal.label}</label>}
              <input
                className="mui-input"
                value={value}
                onChange={(e) => setValue(e.target.value)}
                autoFocus
              />
            </form>
          )}
        </div>
        <div className="modal-footer">
          {modal.type !== "alert" && (
            <button type="button" className="btn-text" onClick={closeModal}>
              Annuler
            </button>
          )}
          {modal.type === "prompt" && (
            <button type="submit" form="prompt-form" className="btn-text">
              {modal.confirmText}
            </button>
          )}
          {modal.type === "confirm" && (
            <button type="button" className="btn-text" onClick={modal.onConfirm}>
              {modal.confirmText}
            </button>
          )}
          {modal.type === "alert" && (
            <button type="button" className="btn-text" onClick={closeModal}>
              OK
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
