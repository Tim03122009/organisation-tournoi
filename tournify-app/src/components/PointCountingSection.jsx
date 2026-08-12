import { useAppUI } from "../context/AppUIContext";
import {
  createDefaultPointScheme,
  DEFAULT_TIE_BREAKERS_POINTS,
  DEFAULT_TIE_BREAKERS_SETS,
  SETS_ATTRIBUTION_OPTIONS,
  tieBreakerLabel,
} from "../data/scoringDefaults";

function ToggleRow({ label, checked, onChange, hint }) {
  return (
    <div className="scoring-toggle-block">
      <label className="scoring-toggle-leading">
        <span className="mui-toggle">
          <input type="checkbox" checked={checked} onChange={(e) => onChange(e.target.checked)} />
          <span className="mui-toggle-slider" />
        </span>
        <span className="scoring-toggle-copy">
          <span className="scoring-toggle-label">{label}</span>
          {hint ? <span className="scoring-hint">{hint}</span> : null}
        </span>
      </label>
    </div>
  );
}

function PointField({ label, value, onChange, suffix }) {
  return (
    <div className="scoring-point-field">
      <label className="mui-input-label">{label}</label>
      <div className={`scoring-point-field-row${suffix ? " has-suffix" : ""}`}>
        <input
          className="mui-input scoring-point-input"
          type="number"
          value={value}
          onChange={(e) => onChange(Number(e.target.value))}
        />
        {suffix}
      </div>
    </div>
  );
}

function TieBreakFlow({ criteria, onEdit }) {
  return (
    <div className="scoring-tiebreak">
      <h3 className="scoring-subtitle">Règles en cas d&apos;égalité dans une poule</h3>
      <p className="section-desc scoring-tiebreak-desc">
        Vous pouvez choisir comment le classement des équipes sera déterminé dans les groupes.
      </p>
      <div className="scoring-tiebreak-flow">
        {criteria.map((id, index) => (
          <div key={`${id}-${index}`} className="scoring-tiebreak-flow-item-wrap">
            {index > 0 ? <span className="scoring-tiebreak-gt">&gt;</span> : null}
            <span className="scoring-tiebreak-chip">{tieBreakerLabel(id)}</span>
          </div>
        ))}
      </div>
      <button type="button" className="btn-outlined btn-full scoring-criteria-btn" onClick={onEdit}>
        Modifier les critères
      </button>
    </div>
  );
}

function PointSchemeCard({ scheme, index, canDelete, onDelete, onPatch, onEditTieBreakers }) {
  const isSets = scheme.mode === "sets";

  const setMode = (mode) => {
    onPatch({
      mode,
      tieBreakers: mode === "sets" ? [...DEFAULT_TIE_BREAKERS_SETS] : [...DEFAULT_TIE_BREAKERS_POINTS],
    });
  };

  const updateSetScore = (scoreKey, side, value) => {
    onPatch({
      setsScorePoints: {
        ...scheme.setsScorePoints,
        [scoreKey]: {
          ...scheme.setsScorePoints[scoreKey],
          [side]: value,
        },
      },
    });
  };

  return (
    <article className="scoring-scheme-card">
      <div className="scoring-scheme-header">
        <div className="scoring-scheme-title">
          <span className="scoring-scheme-num">{index + 1}</span>
          <span className="scoring-scheme-name">{scheme.name}</span>
        </div>
        {canDelete ? (
          <button
            type="button"
            className="scoring-scheme-delete"
            aria-label="Supprimer le comptage de points"
            title="Supprimer"
            onClick={onDelete}
          >
            <span className="material-icons md-20">delete</span>
          </button>
        ) : (
          <button type="button" className="scoring-standard-btn" title="Profil Standard">
            Standard
            <span className="scoring-standard-help" aria-hidden="true">
              ?
            </span>
          </button>
        )}
      </div>

      <div className="scoring-scheme-body">
        <div className="scoring-mode-row">
          <div className="scoring-mode-radios">
            <label className="scoring-radio">
              <span className="scoring-radio-label">Utiliser les points</span>
              <input
                type="radio"
                name={`scoring-mode-${scheme.id}`}
                checked={!isSets}
                onChange={() => setMode("points")}
              />
            </label>
            <label className="scoring-radio">
              <span className="scoring-radio-label">Utiliser les sets</span>
              <input
                type="radio"
                name={`scoring-mode-${scheme.id}`}
                checked={isSets}
                onChange={() => setMode("sets")}
              />
            </label>
          </div>
          {!isSets ? (
            <label className="scoring-advanced-toggle">
              <span className="mui-toggle">
                <input
                  type="checkbox"
                  checked={Boolean(scheme.advanced)}
                  onChange={(e) => onPatch({ advanced: e.target.checked })}
                />
                <span className="mui-toggle-slider" />
              </span>
              <span>Paramètres avancés</span>
            </label>
          ) : null}
        </div>

        {!isSets ? (
          <>
            <p className="section-desc scoring-intro">
              Définir le nombre de points qu&apos;une équipe obtient dans une poule en cas de
              victoire, de défaite et de match nul.
            </p>

            {scheme.advanced ? (
              <>
                <PointField
                  label="Pour une large victoire"
                  value={scheme.pointsWideWin}
                  onChange={(v) => onPatch({ pointsWideWin: v })}
                  suffix={
                    <label className="scoring-margin-select">
                      <span>+ </span>
                      <select
                        value={scheme.wideWinMargin}
                        onChange={(e) => onPatch({ wideWinMargin: Number(e.target.value) })}
                      >
                        {[1, 2, 3, 4, 5].map((n) => (
                          <option key={n} value={n}>
                            {n} but{n > 1 ? "s" : ""}
                          </option>
                        ))}
                      </select>
                    </label>
                  }
                />
                <PointField
                  label="Pour une victoire après prolongation, aux tirs au but ou au but en or"
                  value={scheme.pointsWinAfterET}
                  onChange={(v) => onPatch({ pointsWinAfterET: v })}
                />
                <PointField
                  label="En cas de victoire"
                  value={scheme.pointsWin}
                  onChange={(v) => onPatch({ pointsWin: v })}
                />
                <PointField
                  label="En cas de match nul avec buts"
                  value={scheme.pointsDrawWithGoals}
                  onChange={(v) => onPatch({ pointsDrawWithGoals: v })}
                />
                <PointField
                  label="En cas de match nul sans buts"
                  value={scheme.pointsDrawWithoutGoals}
                  onChange={(v) => onPatch({ pointsDrawWithoutGoals: v })}
                />
                <PointField
                  label="En cas de perte"
                  value={scheme.pointsLoss}
                  onChange={(v) => onPatch({ pointsLoss: v })}
                />
                <PointField
                  label="Pour une défaite après prolongation, aux tirs au but ou sur un but en or"
                  value={scheme.pointsLossAfterET}
                  onChange={(v) => onPatch({ pointsLossAfterET: v })}
                />
                <ToggleRow
                  label="Ne permettez pas de match nul comme résultat final dans un match de poule"
                  checked={Boolean(scheme.disallowDrawInGroup)}
                  onChange={(v) => onPatch({ disallowDrawInGroup: v })}
                  hint="Si activé, vous devez marquer le gagnant lorsque le match se termine par un match nul, même pour les matchs de poule"
                />
                <ToggleRow
                  label="Buts en nombre de points"
                  checked={Boolean(scheme.goalsAsPoints)}
                  onChange={(v) => onPatch({ goalsAsPoints: v })}
                  hint="Utilisez le nombre de buts/scores de chaque match comme nombre de points."
                />
                <ToggleRow
                  label="Entrez les scores de la séance de tirs au but pour KO- matches se sont terminés par un match nul"
                  checked={Boolean(scheme.enterPenaltyScores)}
                  onChange={(v) => onPatch({ enterPenaltyScores: v })}
                  hint="Au lieu de marquer le gagnant, entrez le résultat complet de la séance de tirs au but."
                />
              </>
            ) : (
              <>
                <div className="scoring-simple-points">
                  <PointField
                    label="En cas de victoire"
                    value={scheme.pointsWin}
                    onChange={(v) => onPatch({ pointsWin: v })}
                  />
                  <PointField
                    label="En cas de match nul"
                    value={scheme.pointsDraw}
                    onChange={(v) => onPatch({ pointsDraw: v })}
                  />
                  <PointField
                    label="En cas de perte"
                    value={scheme.pointsLoss}
                    onChange={(v) => onPatch({ pointsLoss: v })}
                  />
                </div>
                <ToggleRow
                  label="Entrez les scores de la séance de tirs au but pour KO- matches se sont terminés par un match nul"
                  checked={Boolean(scheme.enterPenaltyScores)}
                  onChange={(v) => onPatch({ enterPenaltyScores: v })}
                  hint="Au lieu de marquer le gagnant, entrez le résultat complet de la séance de tirs au but."
                />
              </>
            )}
          </>
        ) : (
          <>
            <PointField
              label="Nombre de sets"
              value={scheme.setsCount}
              onChange={(v) => onPatch({ setsCount: v })}
            />
            <ToggleRow
              label="Set décisif"
              checked={Boolean(scheme.decisiveSet)}
              onChange={(v) => onPatch({ decisiveSet: v })}
            />
            {scheme.decisiveSet ? (
              <ToggleRow
                label="Laisser le jeu décisif compter dans l'équilibre des objectifs"
                checked={Boolean(scheme.decisiveSetInGoalBalance)}
                onChange={(v) => onPatch({ decisiveSetInGoalBalance: v })}
              />
            ) : null}

            <label className="mui-input-label">Attribution de points</label>
            <select
              className="mui-input"
              value={scheme.setsPointAttribution}
              onChange={(e) => onPatch({ setsPointAttribution: e.target.value })}
            >
              {SETS_ATTRIBUTION_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>

            <div className="scoring-sets-scores">
              <div className="scoring-sets-score-block">
                <p className="scoring-sets-score-title">Points par score 2-0</p>
                <div className="scoring-sets-score-fields">
                  <PointField
                    label="Gagnant"
                    value={scheme.setsScorePoints["2-0"]?.winner ?? 2}
                    onChange={(v) => updateSetScore("2-0", "winner", v)}
                  />
                  <PointField
                    label="Perdant"
                    value={scheme.setsScorePoints["2-0"]?.loser ?? 0}
                    onChange={(v) => updateSetScore("2-0", "loser", v)}
                  />
                </div>
              </div>

              {scheme.decisiveSet ? (
                <div className="scoring-sets-score-block">
                  <p className="scoring-sets-score-title">Points par score 2-1</p>
                  <div className="scoring-sets-score-fields">
                    <PointField
                      label="Gagnant"
                      value={scheme.setsScorePoints["2-1"]?.winner ?? 2}
                      onChange={(v) => updateSetScore("2-1", "winner", v)}
                    />
                    <PointField
                      label="Perdant"
                      value={scheme.setsScorePoints["2-1"]?.loser ?? 0}
                      onChange={(v) => updateSetScore("2-1", "loser", v)}
                    />
                  </div>
                </div>
              ) : (
                <div className="scoring-sets-score-block">
                  <p className="scoring-sets-score-title">Points par score 1-1</p>
                  <div className="scoring-sets-score-fields">
                    <PointField
                      label="Les deux équipes"
                      value={scheme.setsScorePoints["1-1"]?.both ?? 1}
                      onChange={(v) => updateSetScore("1-1", "both", v)}
                    />
                  </div>
                </div>
              )}
            </div>
          </>
        )}

        <TieBreakFlow
          criteria={scheme.tieBreakers}
          onEdit={() => onEditTieBreakers(scheme.id, scheme.tieBreakers)}
        />
      </div>
    </article>
  );
}

export default function PointCountingSection({
  schemes,
  onUpdateSchemes,
  extraPointTypes = [],
  onUpdateExtraPointTypes,
  playerStatTypes = [],
  onUpdatePlayerStatTypes,
}) {
  const { openTieBreakEditor, openExtraPointsEditor, openPlayerStatsEditor, showToast } = useAppUI();

  const patchScheme = (id, partial) => {
    onUpdateSchemes(schemes.map((s) => (s.id === id ? { ...s, ...partial } : s)));
  };

  const addScheme = () => {
    const nextId = schemes.reduce((max, s) => Math.max(max, s.id), 0) + 1;
    onUpdateSchemes([...schemes, createDefaultPointScheme(nextId)]);
    showToast("Comptage de points ajouté");
  };

  const removeScheme = (id) => {
    if (schemes.length <= 1) return;
    onUpdateSchemes(schemes.filter((s) => s.id !== id));
    showToast("Comptage de points supprimé");
  };

  const openExtraPointsModal = (existing) => {
    openExtraPointsEditor({
      title: "Enregistrer plus de points",
      confirmText: existing ? "Sauvegarder" : "Ajouter",
      defaultValue: existing
        ? {
            name: existing.name,
            abbreviation: existing.abbreviation,
            showOnMatchResult: existing.showOnMatchResult,
            includeInStandings: existing.includeInStandings,
          }
        : undefined,
      onSubmit: (value) => {
        if (existing) {
          onUpdateExtraPointTypes(
            extraPointTypes.map((item) =>
              item.id === existing.id ? { ...item, ...value } : item
            )
          );
          showToast("Points supplémentaires mis à jour");
          return;
        }
        const nextId = extraPointTypes.reduce((max, item) => Math.max(max, item.id), 0) + 1;
        onUpdateExtraPointTypes([...extraPointTypes, { id: nextId, ...value }]);
        showToast("Points supplémentaires ajoutés");
      },
    });
  };

  const removeExtraPointType = (id) => {
    onUpdateExtraPointTypes(extraPointTypes.filter((item) => item.id !== id));
    showToast("Points supplémentaires supprimés");
  };

  const openPlayerStatsModal = (existing) => {
    openPlayerStatsEditor({
      title: "Suivre les statistiques des joueurs",
      confirmText: existing ? "Sauvegarder" : "Ajouter",
      defaultValue: existing
        ? {
            type: existing.type,
            name: existing.name,
            abbreviation: existing.abbreviation,
          }
        : undefined,
      onSubmit: (value) => {
        if (existing) {
          onUpdatePlayerStatTypes(
            playerStatTypes.map((item) =>
              item.id === existing.id ? { ...item, ...value } : item
            )
          );
          showToast("Statistique joueur mise à jour");
          return;
        }
        const nextId = playerStatTypes.reduce((max, item) => Math.max(max, item.id), 0) + 1;
        onUpdatePlayerStatTypes([...playerStatTypes, { id: nextId, ...value }]);
        showToast("Statistique joueur ajoutée");
      },
    });
  };

  const removePlayerStatType = (id) => {
    onUpdatePlayerStatTypes(playerStatTypes.filter((item) => item.id !== id));
    showToast("Statistique joueur supprimée");
  };

  const editTieBreakers = (schemeId, criteria) => {
    openTieBreakEditor({
      title: "Règles en cas d'égalité dans une poule",
      defaultCriteria: criteria,
      onSubmit: (nextCriteria) => {
        patchScheme(schemeId, { tieBreakers: nextCriteria });
        showToast("Critères mis à jour");
      },
    });
  };

  return (
    <div className="scoring-section">
      <p className="section-desc scoring-section-intro">
        L&apos;utilisation de points ou de sets, les critères de départage des groupes, les points
        personnalisés et les statistiques des joueurs
      </p>

      {schemes.map((scheme, index) => (
        <PointSchemeCard
          key={scheme.id}
          scheme={scheme}
          index={index}
          canDelete={index > 0}
          onDelete={() => removeScheme(scheme.id)}
          onPatch={(partial) => patchScheme(scheme.id, partial)}
          onEditTieBreakers={editTieBreakers}
        />
      ))}

      <button type="button" className="btn-outlined btn-full scoring-add-scheme" onClick={addScheme}>
        Ajouter comptage de points
      </button>

      <div className="scoring-extra-block">
        <h3 className="scoring-subtitle">Enregistrer plus de points</h3>
        <p className="section-desc">
          En plus des résultats du match dans une poule, remplissez également les résultats d&apos;un
          classement supplémentaire. Par exemple, pour une compétition de fair-play ou de pénalité.
        </p>

        {extraPointTypes.map((item) => (
          <div key={item.id} className="scoring-extra-row">
            <button
              type="button"
              className="scoring-extra-row-main"
              onClick={() => openExtraPointsModal(item)}
            >
              <span className="scoring-extra-abbr">{item.abbreviation}</span>
              <span className="scoring-extra-name">{item.name}</span>
            </button>
            <button
              type="button"
              className="scoring-scheme-delete"
              aria-label={`Supprimer ${item.name}`}
              onClick={() => removeExtraPointType(item.id)}
            >
              <span className="material-icons md-20">delete</span>
            </button>
          </div>
        ))}

        <button
          type="button"
          className="btn-outlined btn-full scoring-extra-btn"
          onClick={() => openExtraPointsModal()}
        >
          Enregistrer plus de points
        </button>
      </div>

      <div className="scoring-extra-block">
        <h3 className="scoring-subtitle">Suivre les statistiques des joueurs</h3>
        <p className="section-desc">
          Si des joueurs ont été ajoutés aux équipes, vous pouvez choisir quelles statistiques suivre
          (par exemple pour les gardiens ou des stats personnalisées).
        </p>

        {playerStatTypes.map((item) => (
          <div key={item.id} className="scoring-extra-row">
            <button
              type="button"
              className="scoring-extra-row-main"
              onClick={() => openPlayerStatsModal(item)}
            >
              <span className="scoring-extra-abbr">{item.abbreviation}</span>
              <span className="scoring-extra-name">{item.name}</span>
            </button>
            <button
              type="button"
              className="scoring-scheme-delete"
              aria-label={`Supprimer ${item.name}`}
              onClick={() => removePlayerStatType(item.id)}
            >
              <span className="material-icons md-20">delete</span>
            </button>
          </div>
        ))}

        <button
          type="button"
          className="btn-outlined btn-full scoring-extra-btn"
          onClick={() => openPlayerStatsModal()}
        >
          Suivre les statistiques des joueurs
        </button>
      </div>
    </div>
  );
}
