import { useEffect, useMemo, useState } from "react";
import {
  TIE_BREAK_CRITERIA,
  tieBreakerLabel,
} from "../data/scoringDefaults";

export default function TieBreakEditorSection({ modal, formId }) {
  const initial = Array.isArray(modal.defaultCriteria) ? modal.defaultCriteria : [];
  const criteriaKey = useMemo(
    () => JSON.stringify({ title: modal.title, criteria: modal.defaultCriteria }),
    [modal.title, modal.defaultCriteria]
  );

  const [criteria, setCriteria] = useState(initial);
  const [dragIndex, setDragIndex] = useState(null);

  useEffect(() => {
    setCriteria(Array.isArray(modal.defaultCriteria) ? [...modal.defaultCriteria] : []);
    setDragIndex(null);
  }, [criteriaKey]);

  const available = Object.values(TIE_BREAK_CRITERIA).filter(
    (item) => !criteria.includes(item.id)
  );

  const moveItem = (from, to) => {
    if (to < 0 || to >= criteria.length || from === to) return;
    setCriteria((prev) => {
      const next = [...prev];
      const [item] = next.splice(from, 1);
      next.splice(to, 0, item);
      return next;
    });
  };

  const removeItem = (index) => {
    setCriteria((prev) => prev.filter((_, i) => i !== index));
  };

  const addCriterion = () => {
    if (!available.length) return;
    setCriteria((prev) => [...prev, available[0].id]);
  };

  const handleSubmit = (event) => {
    event.preventDefault();
    if (!criteria.length) return;
    modal.onSubmit(criteria);
  };

  return (
    <form id={formId} className="tiebreak-form" onSubmit={handleSubmit}>
      <p className="section-desc">
        Veuillez ajouter les critères que vous souhaitez utiliser et faites-les glisser dans
        l&apos;ordre de votre choix.
      </p>

      <ol className="tiebreak-list">
        {criteria.map((id, index) => (
          <li
            key={`${id}-${index}`}
            className={`tiebreak-item${dragIndex === index ? " dragging" : ""}`}
            draggable
            onDragStart={() => setDragIndex(index)}
            onDragOver={(e) => {
              e.preventDefault();
              if (dragIndex === null || dragIndex === index) return;
              moveItem(dragIndex, index);
              setDragIndex(index);
            }}
            onDragEnd={() => setDragIndex(null)}
          >
            <span className="tiebreak-item-num">{index + 1}</span>
            <span className="tiebreak-item-label">{tieBreakerLabel(id)}</span>
            <button
              type="button"
              className="icon-btn"
              aria-label="Supprimer le critère"
              onClick={() => removeItem(index)}
            >
              <span className="material-icons md-20">delete</span>
            </button>
          </li>
        ))}
      </ol>

      <button
        type="button"
        className="btn-outlined btn-full"
        onClick={addCriterion}
        disabled={!available.length}
      >
        Ajouter un critère
      </button>
    </form>
  );
}
