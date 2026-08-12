import { useCallback } from "react";
import { useTournament } from "../context/TournamentContext";
import { useAppUI } from "../context/AppUIContext";
import {
  DIVISION_COLORS,
  downloadText,
  formatFrenchDayLabel,
  generateAdminLink,
  generateTeamToken,
  inferDayDate,
  nextId,
  parseCsv,
  toCsv,
} from "../utils/helpers";

export function useTournamentActions() {
  const { data, setData, update } = useTournament();
  const { showToast, openPrompt, openConfirm, openAlert, openDayEditor, openLocationEditor, openDivisionEditor, openInfoFieldEditor, openChoiceList, openTeamEditor, openPlayersEditor } = useAppUI();

  const patch = useCallback(
    (fn) =>
      setData((prev) => {
        const next = typeof fn === "function" ? fn(prev) : fn;
        return { ...prev, ...next };
      }),
    [setData]
  );

  const patchPresentation = useCallback(
    (fn) =>
      setData((prev) => ({
        ...prev,
        presentation: typeof fn === "function" ? fn(prev.presentation) : { ...prev.presentation, ...fn },
      })),
    [setData]
  );

  // ——— Général ———
  const editTournamentName = () =>
    openPrompt({
      title: "Nom du tournoi",
      defaultValue: data.name,
      confirmText: "Sauvegarder",
      onSubmit: (name) => {
        update({ name });
        showToast("Nom du tournoi mis à jour");
      },
    });

  const addDay = () =>
    openDayEditor({
      title: "Ajouter un jour",
      defaultDate: new Date().toISOString().slice(0, 10),
      onSubmit: (date) => {
        patch((p) => ({
          days: [...p.days, { id: nextId(p.days), date, label: formatFrenchDayLabel(date) }],
        }));
        showToast("Journée ajoutée");
      },
    });

  const editDay = (id) => {
    const day = data.days.find((d) => d.id === id);
    openDayEditor({
      title: "Modifier le jour",
      defaultDate: inferDayDate(day),
      confirmText: "Sauvegarder",
      onSubmit: (date) => {
        patch((p) => ({
          days: p.days.map((d) =>
            d.id === id ? { ...d, date, label: formatFrenchDayLabel(date) } : d
          ),
        }));
        showToast("Journée mise à jour");
      },
      onDelete: () => {
        patch((p) => ({ days: p.days.filter((d) => d.id !== id) }));
        showToast("Journée supprimée");
      },
      deleteDisabled: data.days.length <= 1,
    });
  };

  const addLocation = () =>
    openLocationEditor({
      title: "Ajouter un lieu",
      defaultLocation: { label: "", lat: null, lng: null, area: null, showLogo: false, logo: null },
      onSubmit: ({ label, lat, lng, area, showLogo, logo }) => {
        patch((p) => ({
          locations: [
            ...p.locations,
            {
              id: nextId(p.locations),
              label,
              lat,
              lng,
              area: area || null,
              showLogo: Boolean(showLogo),
              logo: logo || null,
            },
          ],
        }));
        showToast("Lieu ajouté");
      },
    });

  const editLocation = (id) => {
    const loc = data.locations.find((l) => l.id === id);
    openLocationEditor({
      title: "Modifier le lieu",
      defaultLocation: {
        label: loc?.label ?? "",
        lat: loc?.lat ?? null,
        lng: loc?.lng ?? null,
        area: loc?.area ?? null,
        showLogo: loc?.showLogo ?? false,
        logo: loc?.logo ?? null,
      },
      confirmText: "Sauvegarder",
      onSubmit: ({ label, lat, lng, area, showLogo, logo }) => {
        patch((p) => ({
          locations: p.locations.map((l) =>
            l.id === id
              ? { ...l, label, lat, lng, area: area || null, showLogo: Boolean(showLogo), logo: logo || null }
              : l
          ),
        }));
        showToast("Lieu mis à jour");
      },
      onDelete: () => {
        patch((p) => ({ locations: p.locations.filter((l) => l.id !== id) }));
        showToast("Lieu supprimé");
      },
      deleteDisabled: data.locations.length <= 1,
    });
  };

  const addDivision = () =>
    openDivisionEditor({
      title: "Ajouter une division",
      defaultDivision: { name: "", showLogo: false, logo: null },
      onSubmit: ({ name, showLogo, logo }) => {
        patch((p) => ({
          divisions: [
            ...p.divisions,
            {
              id: nextId(p.divisions),
              name,
              color: DIVISION_COLORS[p.divisions.length % DIVISION_COLORS.length],
              showLogo: Boolean(showLogo),
              logo: logo || null,
            },
          ],
        }));
        showToast("Division ajoutée");
      },
    });

  const editDivision = (id) => {
    const div = data.divisions.find((d) => d.id === id);
    openDivisionEditor({
      title: "Éditer la division",
      defaultDivision: {
        name: div?.name ?? "",
        showLogo: div?.showLogo ?? false,
        logo: div?.logo ?? null,
      },
      confirmText: "Sauvegarder",
      onSubmit: ({ name, showLogo, logo }) => {
        patch((p) => ({
          divisions: p.divisions.map((d) =>
            d.id === id
              ? { ...d, name, showLogo: Boolean(showLogo), logo: showLogo ? logo || null : null }
              : d
          ),
        }));
        showToast("Division mise à jour");
      },
      onDelete: () => {
        patch((p) => ({ divisions: p.divisions.filter((d) => d.id !== id) }));
        showToast("Division supprimée");
      },
      deleteDisabled: data.divisions.length <= 1,
    });
  };

  const toggleSection = (key) => patch((p) => ({ [key]: !p[key] }));

  // ——— Équipes ———
  const toggleTeamField = (id) =>
    patch((p) => ({
      teamFields: p.teamFields.map((f) => (f.id === id ? { ...f, enabled: !f.enabled } : f)),
    }));

  const addTeamField = () =>
    openInfoFieldEditor({
      onSubmit: ({ label, publicOnTeamPage, answerWithCheckbox }) => {
        patch((p) => ({
          teamFields: [
            ...p.teamFields,
            {
              id: `tf_${nextId(p.teamFields)}`,
              label,
              standard: false,
              enabled: true,
              publicOnTeamPage,
              ...(answerWithCheckbox ? { inputType: "checkbox" } : {}),
            },
          ],
        }));
        showToast("Champ ajouté");
      },
    });

  const editTeamField = (id) => {
    const field = data.teamFields.find((f) => f.id === id);
    openPrompt({
      title: "Modifier le champ",
      label: "Nom",
      defaultValue: field?.label,
      confirmText: "Sauvegarder",
      onSubmit: (label) => {
        patch((p) => ({
          teamFields: p.teamFields.map((f) => (f.id === id ? { ...f, label } : f)),
        }));
        showToast("Champ mis à jour");
      },
    });
  };

  const deleteTeamField = (id) =>
    openConfirm({
      title: "Supprimer le champ",
      message: "Supprimer ce champ d'information ?",
      confirmText: "Supprimer",
      onConfirm: () => {
        patch((p) => ({
          teamFields: p.teamFields.filter((f) => f.id !== id),
        }));
        showToast("Champ supprimé");
      },
    });

  const togglePlayerField = (id) =>
    patch((p) => ({
      playerFields: p.playerFields.map((f) =>
        f.id === id && !f.locked ? { ...f, enabled: !f.enabled } : f
      ),
    }));

  const addPlayerField = () =>
    openInfoFieldEditor({
      onSubmit: ({ label, publicOnTeamPage, answerWithCheckbox }) => {
        patch((p) => ({
          playerFields: [
            ...p.playerFields,
            {
              id: `p_${nextId(p.playerFields)}`,
              label,
              enabled: true,
              custom: true,
              publicOnTeamPage,
              ...(answerWithCheckbox ? { inputType: "checkbox" } : {}),
            },
          ],
        }));
        showToast("Champ joueur ajouté");
      },
    });

  const editPlayerField = (id) => {
    const field = data.playerFields.find((f) => f.id === id);
    openPrompt({
      title: "Modifier le champ joueur",
      label: "Nom",
      defaultValue: field?.label,
      confirmText: "Sauvegarder",
      onSubmit: (label) => {
        patch((p) => ({
          playerFields: p.playerFields.map((f) => (f.id === id ? { ...f, label } : f)),
        }));
        showToast("Champ mis à jour");
      },
    });
  };

  const deletePlayerField = (id) =>
    openConfirm({
      title: "Supprimer le champ",
      message: "Supprimer ce champ d'information ?",
      confirmText: "Supprimer",
      onConfirm: () => {
        patch((p) => ({
          playerFields: p.playerFields.filter((f) => f.id !== id),
        }));
        showToast("Champ supprimé");
      },
    });

  const toggleInscriptionQuestion = (id) =>
    patch((p) => ({
      inscriptionQuestions: (p.inscriptionQuestions || []).map((q) =>
        q.id === id ? { ...q, enabled: !q.enabled } : q
      ),
    }));

  const switchToIndividualSport = () =>
    openConfirm({
      title: "Sport individuel",
      message: "Passer en mode sport individuel ? Les équipes seront remplacées par des participants.",
      onConfirm: () => {
        patch({ sportType: "individual" });
        showToast("Mode sport individuel activé");
      },
    });

  const addTeam = () =>
    openPrompt({
      title: "Ajouter une équipe",
      label: "Nom de l'équipe",
      onSubmit: (name) => {
        patch((p) => ({
          teams: [
            ...p.teams,
            {
              id: nextId(p.teams),
              name,
              email: "",
              players: 0,
              region: "",
              departement: "",
              present: false,
              paye: false,
              ajoute: true,
              division: p.selectedDivision || p.divisions?.[0]?.name || "",
              connectionToken: generateTeamToken(),
              playerList: [],
              fields: {},
            },
          ],
        }));
        showToast("Équipe ajoutée");
      },
    });

  const editTeam = (id) => {
    const team = data.teams.find((t) => t.id === id);
    if (!team) return;

    const gridOnly = new Set(["present", "paye", "ajoute", "lien", "logo", "joueurs"]);
    const fields = [
      ...(data.teamFields || []).filter(
        (f) => (f.standard === false || f.enabled) && !gridOnly.has(f.id)
      ),
      ...(data.inscriptionQuestions || [])
        .filter((q) => q.enabled)
        .map((q) => ({ id: q.id, label: q.label })),
    ];

    openTeamEditor({
      title: "Modifier l'équipe",
      team,
      fields,
      divisions: data.divisions || [],
      onSubmit: (next) => {
        patch((p) => ({
          teams: p.teams.map((t) =>
            t.id === id
              ? {
                  ...t,
                  name: next.name,
                  division: next.division,
                  email: next.email,
                  departement: next.departement ?? next.region ?? "",
                  region: next.departement ?? next.region ?? "",
                  pays: next.pays,
                  vestiaire: next.vestiaire,
                  fields: { ...(t.fields || {}), ...(next.fields || {}) },
                }
              : t
          ),
        }));
        showToast("Équipe mise à jour");
      },
    });
  };

  const openTeamPlayers = (id) => {
    const team = data.teams.find((t) => t.id === id);
    if (!team) return;

    const playerList = Array.isArray(team.playerList) ? team.playerList : [];

    openPlayersEditor({
      title: "Joueurs",
      team,
      players: playerList,
      playerFields: data.playerFields || [],
      onChange: (players) => {
        patch((p) => ({
          teams: p.teams.map((t) =>
            t.id === id
              ? {
                  ...t,
                  playerList: players,
                  players: players.length,
                }
              : t
          ),
        }));
      },
    });
  };

  const deleteSelectedTeams = (ids, onDone) => {
    if (!ids.length) return showToast("Sélectionnez au moins une équipe");
    openConfirm({
      title: "Supprimer des équipes",
      message:
        "Êtes-vous sûr de vouloir supprimer les équipes sélectionnées ? Ces équipes seront également retirées de toutes les poules et de tous les matches.",
      confirmText: "Supprimer",
      confirmContained: true,
      onConfirm: () => {
        const names = new Set(
          data.teams.filter((t) => ids.includes(t.id)).map((t) => t.name)
        );
        patch((p) => ({
          teams: p.teams.filter((t) => !ids.includes(t.id)),
          phases: (p.phases || []).map((phase) => ({
            ...phase,
            items: (phase.items || []).map((item) => ({
              ...item,
              teams: (item.teams || []).filter((teamName) => !names.has(teamName)),
            })),
          })),
        }));
        onDone?.();
        showToast("Équipe(s) supprimée(s)");
      },
    });
  };

  const duplicateSelectedTeams = (ids, onDone) => {
    if (!ids.length) return showToast("Sélectionnez au moins une équipe");
    patch((p) => {
      const copies = p.teams
        .filter((t) => ids.includes(t.id))
        .map((t, index) => ({
          ...t,
          id: nextId(p.teams) + index,
          name: `${t.name} (copie)`,
          connectionToken: generateTeamToken(),
          fields: { ...(t.fields || {}) },
        }));
      return { teams: [...p.teams, ...copies] };
    });
    onDone?.();
    showToast(ids.length > 1 ? "Équipes dupliquées" : "Équipe dupliquée");
  };

  const moveSelectedTeams = (ids, onDone) => {
    if (!ids.length) return showToast("Sélectionnez au moins une équipe");
    openChoiceList({
      title: "Déplacé vers une autre division",
      message: "Choisissez la division dans laquelle vous voulez déplacer les équipes",
      options: (data.divisions || []).map((d) => ({
        id: d.id,
        label: d.name,
        value: d.name,
      })),
      onSelect: (option) => {
        patch((p) => ({
          teams: p.teams.map((t) =>
            ids.includes(t.id) ? { ...t, division: option.value } : t
          ),
        }));
        onDone?.();
        showToast(`Équipe(s) déplacée(s) vers ${option.label}`);
      },
    });
  };

  const getTeamCsvFields = (source = data) => [
    ...(source.teamFields || []).filter(
      (f) =>
        (f.standard === false || f.enabled) &&
        f.id !== "lien" &&
        f.id !== "logo"
    ),
    ...(source.inscriptionQuestions || []).filter((q) => q.enabled),
  ];

  const serializePlayersForCsv = (team) => {
    const list = Array.isArray(team.playerList) ? team.playerList : [];
    if (!list.length) return String(team.players ?? 0);
    // Compact JSON (non lisible volontairement) pour conserver les joueurs
    return JSON.stringify(
      list.map((player) => {
        const { id, ...rest } = player;
        return rest;
      })
    );
  };

  const parsePlayersFromCsv = (raw) => {
    const trimmed = String(raw ?? "").trim();
    if (!trimmed) return null;
    if (trimmed.startsWith("[")) {
      try {
        const parsed = JSON.parse(trimmed);
        if (Array.isArray(parsed)) {
          const playerList = parsed.map((player, index) => ({
            id: player?.id ?? index + 1,
            ...(typeof player === "object" && player ? player : { nom: String(player) }),
          }));
          return { playerList, players: playerList.length };
        }
      } catch {
        // fallback numérique ci-dessous
      }
    }
    const n = Number.parseInt(trimmed, 10);
    if (Number.isFinite(n)) return { players: n };
    return null;
  };

  const exportTeams = (teamIds) => {
    const idSet = Array.isArray(teamIds) && teamIds.length ? new Set(teamIds) : null;
    const teams = idSet ? data.teams.filter((t) => idSet.has(t.id)) : data.teams;
    if (!teams.length) {
      showToast("Aucune équipe à exporter");
      return;
    }

    const enabledFields = getTeamCsvFields().filter((f) => f.id !== "lien");
    const rows = teams.map((team) => {
      const row = { Nom: team.name };
      enabledFields.forEach((field) => {
        if (field.id === "joueurs") row[field.label] = serializePlayersForCsv(team);
        else if (field.id === "email") row[field.label] = team.email ?? "";
        else if (field.id === "departement" || field.id === "region")
          row[field.label] = team.departement ?? team.region ?? "";
        else if (["present", "paye", "ajoute"].includes(field.id) || field.inputType === "checkbox") {
          const rawValue =
            field.inputType === "checkbox"
              ? team.fields?.[field.id] ?? team[field.id]
              : team[field.id];
          row[field.label] = rawValue ? "oui" : "non";
        } else {
          const value = team.fields?.[field.id] ?? team[field.id] ?? "";
          row[field.label] = typeof value === "boolean" ? (value ? "oui" : "non") : value;
        }
      });
      return row;
    });
    const columns = ["Nom", ...enabledFields.map((f) => f.label)];
    // ; + BOM : colonnes lisibles dans Excel FR / éditeur de texte
    const csv = toCsv(rows, columns, { delimiter: ";", bom: true });
    downloadText("equipes.csv", csv, "text/csv;charset=utf-8");
    showToast(
      idSet
        ? `${teams.length} équipe${teams.length > 1 ? "s" : ""} exportée${teams.length > 1 ? "s" : ""}`
        : "Export téléchargé"
    );
  };

  const parseOuiNon = (value) => {
    const v = String(value ?? "")
      .trim()
      .toLowerCase();
    return ["oui", "yes", "true", "1", "x"].includes(v);
  };

  const slugifyFieldId = (label) => {
    const base = String(label ?? "")
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "_")
      .replace(/^_|_$/g, "")
      .slice(0, 40);
    return base || `champ_${Date.now()}`;
  };

  const applyImportedCell = (field, raw, topLevel, fieldValues) => {
    if (raw === undefined || raw === "") return;
    if (field.id === "lien" || field.id === "logo") return;
    if (field.id === "joueurs") {
      const parsed = parsePlayersFromCsv(raw);
      if (parsed) Object.assign(topLevel, parsed);
    } else if (field.id === "email") {
      topLevel.email = String(raw);
    } else if (field.id === "departement" || field.id === "region") {
      topLevel.departement = String(raw);
    } else if (["present", "paye", "ajoute"].includes(field.id)) {
      topLevel[field.id] = parseOuiNon(raw);
    } else if (field.inputType === "checkbox") {
      fieldValues[field.id] = parseOuiNon(raw);
    } else if (["pays", "vestiaire"].includes(field.id)) {
      topLevel[field.id] = String(raw);
    } else {
      fieldValues[field.id] = String(raw);
    }
  };

  const importTeams = (csvText) => {
    const { headers, rows } = parseCsv(csvText);
    if (!headers.length || !rows.length) {
      showToast("Fichier CSV vide ou invalide");
      return;
    }

    const nameHeader =
      headers.find((h) => /^nom$/i.test(h)) ||
      headers.find((h) => /^name$/i.test(h)) ||
      headers[0];

    const skipHeaders = new Set(
      [nameHeader, "lien", "lien de connexion", "logo"].map((h) => String(h).trim().toLowerCase())
    );

    let teamFields = [...(data.teamFields || [])];
    let inscriptionQuestions = [...(data.inscriptionQuestions || [])];
    const importFields = [];
    let columnsActivated = 0;

    const findByLabelOrId = (list, header) => {
      const key = header.trim().toLowerCase();
      return list.find(
        (item) =>
          String(item.label).trim().toLowerCase() === key ||
          String(item.id).trim().toLowerCase() === key
      );
    };

    headers.forEach((header) => {
      const key = header.trim().toLowerCase();
      if (!key || skipHeaders.has(key)) return;

      const hasAnyValue = rows.some((row) => String(row[header] ?? "").trim() !== "");
      if (!hasAnyValue) return;

      const existingField = findByLabelOrId(teamFields, header);
      if (existingField) {
        if (existingField.id === "lien" || existingField.id === "logo") return;
        if (existingField.standard !== false && !existingField.enabled) {
          teamFields = teamFields.map((f) =>
            f.id === existingField.id ? { ...f, enabled: true } : f
          );
          columnsActivated += 1;
        }
        importFields.push({ ...existingField, enabled: true, csvHeader: header });
        return;
      }

      const existingQuestion = findByLabelOrId(inscriptionQuestions, header);
      if (existingQuestion) {
        if (!existingQuestion.enabled) {
          inscriptionQuestions = inscriptionQuestions.map((q) =>
            q.id === existingQuestion.id ? { ...q, enabled: true } : q
          );
          columnsActivated += 1;
        }
        importFields.push({ ...existingQuestion, enabled: true, csvHeader: header });
        return;
      }

      // Colonne inconnue → nouveau champ d'information
      let id = slugifyFieldId(header);
      const usedIds = new Set([
        ...teamFields.map((f) => f.id),
        ...inscriptionQuestions.map((q) => q.id),
        ...importFields.map((f) => f.id),
      ]);
      if (usedIds.has(id)) {
        let n = 2;
        while (usedIds.has(`${id}_${n}`)) n += 1;
        id = `${id}_${n}`;
      }
      const newField = { id, label: header.trim(), standard: false, enabled: true };
      teamFields = [...teamFields, newField];
      importFields.push({ ...newField, csvHeader: header });
      columnsActivated += 1;
    });

    const teams = [...data.teams];
    let idCounter = nextId(teams);
    const defaultDivision = data.selectedDivision || data.divisions?.[0]?.name || "";
    let added = 0;
    let updated = 0;

    rows.forEach((row) => {
      const name = String(row[nameHeader] ?? "").trim();
      if (!name) return;

      const topLevel = {};
      const fieldValues = {};
      importFields.forEach((field) => {
        applyImportedCell(field, row[field.csvHeader], topLevel, fieldValues);
      });

      const existingIndex = teams.findIndex((t) => t.name.toLowerCase() === name.toLowerCase());
      if (existingIndex >= 0) {
        const current = teams[existingIndex];
        teams[existingIndex] = {
          ...current,
          ...topLevel,
          fields: { ...(current.fields || {}), ...fieldValues },
        };
        updated += 1;
      } else {
        teams.push({
          id: idCounter,
          name,
          email: "",
          players: 0,
          region: "",
          departement: "",
          present: false,
          paye: false,
          ajoute: true,
          division: defaultDivision,
          connectionToken: generateTeamToken(),
          playerList: [],
          fields: { ...fieldValues },
          ...topLevel,
        });
        idCounter += 1;
        added += 1;
      }
    });

    if (!added && !updated) {
      showToast("Aucune équipe importée");
      return;
    }

    patch({ teams, teamFields, inscriptionQuestions });
    showToast(
      [
        added ? `${added} ajoutée${added > 1 ? "s" : ""}` : null,
        updated ? `${updated} mise${updated > 1 ? "s" : ""} à jour` : null,
        columnsActivated
          ? `${columnsActivated} colonne${columnsActivated > 1 ? "s" : ""} ajoutée${columnsActivated > 1 ? "s" : ""}`
          : null,
      ]
        .filter(Boolean)
        .join(", ")
    );
  };

  // ——— Arbitres ———
  const toggleRefereeField = (id) =>
    patch((p) => ({
      refereeFields: p.refereeFields.map((f) => (f.id === id ? { ...f, enabled: !f.enabled } : f)),
    }));

  const addRefereeField = () =>
    openPrompt({
      title: "Nouveau champ arbitre",
      label: "Libellé",
      onSubmit: (label) => {
        patch((p) => ({
          refereeFields: [...p.refereeFields, { id: `r_${nextId(p.refereeFields)}`, label, enabled: true }],
        }));
        showToast("Champ ajouté");
      },
    });

  const addReferee = () =>
    openPrompt({
      title: "Ajouter un arbitre",
      label: "Nom",
      onSubmit: (name) => {
        patch((p) => ({
          referees: [...p.referees, { id: nextId(p.referees), name, link: "", divisions: "" }],
        }));
        showToast("Arbitre ajouté");
      },
    });

  const editReferee = (id) => {
    const ref = data.referees.find((r) => r.id === id);
    openPrompt({
      title: "Modifier l'arbitre",
      defaultValue: ref?.name,
      onSubmit: (name) => {
        patch((p) => ({
          referees: p.referees.map((r) => (r.id === id ? { ...r, name } : r)),
        }));
        showToast("Arbitre mis à jour");
      },
    });
  };

  const exportReferees = () => {
    const csv = toCsv(data.referees, ["name", "link", "divisions"]);
    downloadText("arbitres.csv", csv, "text/csv;charset=utf-8");
    showToast("Export téléchargé");
  };

  // ——— Admins ———
  const addAdmin = (email, rights) => {
    if (!email) return;
    patch((p) => ({
      admins: [...p.admins, { id: nextId(p.admins), email, rights }],
    }));
    showToast("Administrateur ajouté");
  };

  const removeAdmin = (id) =>
    openConfirm({
      title: "Retirer l'administrateur",
      message: "Confirmer la suppression ?",
      onConfirm: () => {
        patch((p) => ({ admins: p.admins.filter((a) => a.id !== id) }));
        showToast("Administrateur retiré");
      },
    });

  // ——— Structure ———
  const setStructureDivision = (division) => update({ selectedDivision: division });

  const addPhase = () =>
    openPrompt({
      title: "Nouvelle phase",
      label: "Nom de la phase",
      defaultValue: `Phase ${data.phases.length + 1}`,
      onSubmit: (name) => {
        patch((p) => ({
          phases: [
            ...p.phases,
            { id: nextId(p.phases), name, division: p.selectedDivision || "U11", items: [] },
          ],
        }));
        showToast("Phase ajoutée");
      },
    });

  const editPhase = (phaseId) => {
    const phase = data.phases.find((p) => p.id === phaseId);
    openPrompt({
      title: "Renommer la phase",
      defaultValue: phase?.name,
      onSubmit: (name) => {
        patch((p) => ({
          phases: p.phases.map((ph) => (ph.id === phaseId ? { ...ph, name } : ph)),
        }));
        showToast("Phase renommée");
      },
    });
  };

  const removePhase = (phaseId) =>
    openConfirm({
      title: "Supprimer la phase",
      message: "Tous les éléments de cette phase seront supprimés.",
      onConfirm: () => {
        patch((p) => ({ phases: p.phases.filter((ph) => ph.id !== phaseId) }));
        showToast("Phase supprimée");
      },
    });

  const addStructureItem = (phaseId, type) => {
    const defaults = {
      poule: { type: "poule", name: "Nouvelle poule", teams: [] },
      bracket: { type: "bracket", name: "Nouveau bracket", teams: [] },
      friendly: { type: "friendly", name: "Match amical", teams: ["Équipe 1", "Équipe 2"] },
    };
    const template = defaults[type];
    if (!template) return;

    if (type === "poule" || type === "bracket") {
      openPrompt({
        title: type === "poule" ? "Nouvelle poule" : "Nouveau bracket",
        label: "Nom",
        defaultValue: template.name,
        onSubmit: (name) => {
          patch((p) => ({
            phases: p.phases.map((ph) =>
              ph.id === phaseId
                ? { ...ph, items: [...ph.items, { id: nextId(ph.items), ...template, name }] }
                : ph
            ),
          }));
          showToast("Élément ajouté");
        },
      });
    } else {
      patch((p) => ({
        phases: p.phases.map((ph) =>
          ph.id === phaseId
            ? { ...ph, items: [...ph.items, { id: nextId(ph.items), ...template }] }
            : ph
        ),
      }));
      showToast("Match amical ajouté");
    }
  };

  const editStructureItem = (phaseId, itemId) => {
    const phase = data.phases.find((p) => p.id === phaseId);
    const item = phase?.items.find((i) => i.id === itemId);
    openPrompt({
      title: "Renommer",
      defaultValue: item?.name,
      onSubmit: (name) => {
        patch((p) => ({
          phases: p.phases.map((ph) =>
            ph.id === phaseId
              ? { ...ph, items: ph.items.map((i) => (i.id === itemId ? { ...i, name } : i)) }
              : ph
          ),
        }));
        showToast("Mis à jour");
      },
    });
  };

  const addTeamToItem = (phaseId, itemId) =>
    openPrompt({
      title: "Ajouter une équipe",
      label: "Nom de l'équipe",
      onSubmit: (team) => {
        patch((p) => ({
          phases: p.phases.map((ph) =>
            ph.id === phaseId
              ? {
                  ...ph,
                  items: ph.items.map((i) =>
                    i.id === itemId ? { ...i, teams: [...i.teams, team] } : i
                  ),
                }
              : ph
          ),
        }));
        showToast("Équipe ajoutée à la poule");
      },
    });

  // ——— Calendrier ———
  const setMatchDuration = () =>
    openPrompt({
      title: "Durée du match",
      label: "Minutes",
      defaultValue: String(data.matchDuration || 17),
      onSubmit: (val) => {
        const n = parseInt(val, 10);
        if (n > 0) {
          update({ matchDuration: n });
          showToast(`Durée fixée à ${n} minutes`);
        }
      },
    });

  const toggleCalendarLock = () => {
    update({ calendarLocked: !data.calendarLocked });
    showToast(data.calendarLocked ? "Calendrier déverrouillé" : "Calendrier verrouillé");
  };

  const addTerrain = () =>
    openPrompt({
      title: "Nouveau terrain",
      label: "Nom",
      defaultValue: `Terrain ${data.terrains.length + 1}`,
      onSubmit: (name) => {
        patch((p) => ({
          terrains: [...p.terrains, { id: nextId(p.terrains), name, events: [] }],
        }));
        showToast("Terrain ajouté");
      },
    });

  const editTerrain = (id) => {
    const t = data.terrains.find((x) => x.id === id);
    openPrompt({
      title: "Renommer le terrain",
      defaultValue: t?.name,
      onSubmit: (name) => {
        patch((p) => ({
          terrains: p.terrains.map((x) => (x.id === id ? { ...x, name } : x)),
        }));
        showToast("Terrain renommé");
      },
    });
  };

  const addCalendarEvent = (terrainId, eventType = "match") => {
    if (eventType === "pause") {
      openPrompt({
        title: "Ajouter une pause",
        label: "Durée (ex: 30 minutes)",
        defaultValue: "30 minutes",
        onSubmit: (duration) => {
          patch((p) => ({
            terrains: p.terrains.map((t) =>
              t.id === terrainId
                ? {
                    ...t,
                    events: [
                      ...t.events,
                      { id: nextId(t.events), time: "12:00", type: "pause", duration },
                    ],
                  }
                : t
            ),
          }));
          showToast("Pause ajoutée");
        },
      });
      return;
    }

    openPrompt({
      title: "Nouveau match",
      label: "Équipe 1 - Équipe 2",
      onSubmit: (teams) => {
        const [team1, team2] = teams.split("-").map((s) => s.trim());
        if (!team1 || !team2) {
          showToast("Format: Équipe A - Équipe B");
          return;
        }
        patch((p) => ({
          terrains: p.terrains.map((t) =>
            t.id === terrainId
              ? {
                  ...t,
                  events: [
                    ...t.events,
                    {
                      id: nextId(t.events),
                      time: "11:00",
                      type: "match",
                      team1,
                      team2,
                      poule: "Poule A",
                      referee: p.referees[0]?.name || "",
                    },
                  ],
                }
              : t
          ),
        }));
        showToast("Match ajouté");
      },
    });
  };

  const planAll = () => {
    const count = Math.min(data.unscheduledMatches, data.terrains.length * 3);
    patch((p) => ({
      unscheduledMatches: Math.max(0, p.unscheduledMatches - count),
      unscheduledSlots: (p.unscheduledSlots || []).slice(count),
    }));
    showToast(`${count} match(s) planifié(s)`);
  };

  const clearSchedule = () =>
    openConfirm({
      title: "Vider le schéma",
      message: "Supprimer tous les événements de tous les terrains ?",
      onConfirm: () => {
        patch((p) => ({
          terrains: p.terrains.map((t) => ({ ...t, events: [] })),
          unscheduledMatches: p.totalMatches,
        }));
        showToast("Schéma vidé");
      },
    });

  const assignRefereeToAll = (refereeName) => {
    patch((p) => ({
      terrains: p.terrains.map((t) => ({
        ...t,
        events: t.events.map((e) =>
          e.type === "match" ? { ...e, referee: refereeName } : e
        ),
      })),
    }));
    showToast(`Arbitre ${refereeName} assigné à tous les matchs`);
  };

  const exportCalendar = () => {
    const rows = [];
    data.terrains.forEach((t) => {
      t.events.forEach((e) => {
        if (e.type === "match") {
          rows.push({
            terrain: t.name,
            time: e.time,
            team1: e.team1,
            team2: e.team2,
            poule: e.poule,
            referee: e.referee,
          });
        }
      });
    });
    const csv = toCsv(rows, ["terrain", "time", "team1", "team2", "poule", "referee"]);
    downloadText("calendrier.csv", csv, "text/csv;charset=utf-8");
    showToast("Calendrier exporté");
  };

  // ——— Présentation ———
  const copyWebsiteUrl = () => {
    navigator.clipboard?.writeText(data.presentation.websiteUrl);
    showToast("Lien copié");
  };

  const toggleShowInApp = (checked) =>
    patchPresentation({ showInApp: checked });

  const toggleWebsiteActive = () =>
    patchPresentation({ websiteActive: !data.presentation.websiteActive });

  const togglePageEnabled = (pageId) =>
    patchPresentation((pres) => ({
      pages: pres.pages.map((p) => (p.id === pageId ? { ...p, enabled: !p.enabled } : p)),
    }));

  const toggleGeneralSetting = (key) =>
    patchPresentation((pres) => ({
      generalSettings: {
        ...pres.generalSettings,
        [key]: !pres.generalSettings?.[key],
      },
    }));

  const toggleStandingsColumn = (row, col) =>
    patchPresentation((pres) => {
      const cols = { ...pres.standingsColumns };
      const key = `${row}_${col}`;
      cols[key] = !cols[key];
      return { standingsColumns: cols };
    });

  const resetAdminLink = () => {
    const link = generateAdminLink();
    patchPresentation({ adminLink: link });
    showToast("Lien réinitialisé");
  };

  const addSlideshowSlide = () =>
    openPrompt({
      title: "Nouvelle diapositive",
      label: "Titre",
      onSubmit: (title) => {
        patchPresentation((pres) => ({
          slideshow: [...pres.slideshow, { id: nextId(pres.slideshow), title, duration: 10, active: true }],
        }));
        showToast("Diapositive ajoutée");
      },
    });

  const editSlideshowSlide = (id) => {
    const slide = data.presentation.slideshow.find((s) => s.id === id);
    openPrompt({
      title: "Modifier la diapositive",
      defaultValue: slide?.title,
      onSubmit: (title) => {
        patchPresentation((pres) => ({
          slideshow: pres.slideshow.map((s) => (s.id === id ? { ...s, title } : s)),
        }));
        showToast("Diapositive mise à jour");
      },
    });
  };

  const toggleSlideshowSlide = (id) =>
    patchPresentation((pres) => ({
      slideshow: pres.slideshow.map((s) => (s.id === id ? { ...s, active: !s.active } : s)),
    }));

  const deleteSlideshowSlide = (id) =>
    openConfirm({
      title: "Supprimer",
      message: "Supprimer cette diapositive ?",
      onConfirm: () => {
        patchPresentation((pres) => ({
          slideshow: pres.slideshow.filter((s) => s.id !== id),
        }));
        showToast("Diapositive supprimée");
      },
    });

  const toggleSlideshowSetting = (key) =>
    patchPresentation((pres) => ({
      slideshowSettings: { ...pres.slideshowSettings, [key]: !pres.slideshowSettings?.[key] },
    }));

  const setDesignColor = (color) => patchPresentation({ designColor: color });

  const uploadDesignAsset = (key) => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = "image/*";
    input.onchange = (e) => {
      const file = e.target.files?.[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = () => {
        patchPresentation((pres) => ({
          designAssets: { ...pres.designAssets, [key]: reader.result },
        }));
        showToast(`${key} téléchargé`);
      };
      reader.readAsDataURL(file);
    };
    input.click();
  };

  const addSponsorBlock = () => {
    patchPresentation((pres) => ({
      sponsorBlocks: [...(pres.sponsorBlocks || []), { id: nextId(pres.sponsorBlocks || []), name: "Nouveau bloc" }],
    }));
    showToast("Bloc de parrainage ajouté");
  };

  const updatePageContent = (pageId, field, value) =>
    patchPresentation((pres) => ({
      pageContent: {
        ...pres.pageContent,
        [pageId]: { ...pres.pageContent?.[pageId], [field]: value },
      },
    }));

  const addRegistrationQuestion = () =>
    openPrompt({
      title: "Nouvelle question",
      label: "Question",
      onSubmit: (text) => {
        patchPresentation((pres) => ({
          registrationQuestions: [...(pres.registrationQuestions || []), { id: nextId(pres.registrationQuestions || []), text }],
        }));
        showToast("Question ajoutée");
      },
    });

  const deleteRegistrationQuestion = (id) =>
    patchPresentation((pres) => ({
      registrationQuestions: (pres.registrationQuestions || []).filter((q) => q.id !== id),
    }));

  const downloadPoster = () => {
    openAlert({
      title: "Affiche",
      message: "L'affiche promotionnelle sera générée dans une prochaine version.",
    });
  };

  const showSupport = () =>
    openAlert({
      title: "Assistance",
      message: "Contactez le support : support@gestion-tournoi.local",
    });

  const openPresentationMode = () => {
    window.open("/presentation", "_blank");
    showToast("Mode présentation ouvert");
  };

  // ——— Scores ———
  const updateScore = (slotIndex, matchIndex, score1, score2) => {
    patch((p) => {
      const slots = [...p.scores.matchSlots];
      const slot = { ...slots[slotIndex], matches: [...slots[slotIndex].matches] };
      slot.matches[matchIndex] = { ...slot.matches[matchIndex], score1, score2 };
      slots[slotIndex] = slot;

      let done = 0;
      let total = 0;
      slots.forEach((s) => {
        s.matches.forEach((m) => {
          total++;
          if (m.score1 !== null && m.score2 !== null) done++;
        });
      });
      const phases = [...p.scores.phases];
      if (phases[0]) phases[0] = { ...phases[0], done, total: total || phases[0].total };

      return { scores: { ...p.scores, matchSlots: slots, phases } };
    });
    showToast("Score enregistré");
  };

  const exportScores = () => {
    const rows = [];
    data.scores.matchSlots.forEach((slot) => {
      slot.matches.forEach((m) => {
        rows.push({
          time: slot.time,
          terrain: m.terrain,
          team1: m.team1,
          score1: m.score1 ?? "",
          score2: m.score2 ?? "",
          team2: m.team2,
          poule: m.poule,
        });
      });
    });
    const csv = toCsv(rows, ["time", "terrain", "team1", "score1", "score2", "team2", "poule"]);
    downloadText("scores.csv", csv, "text/csv;charset=utf-8");
    showToast("Scores exportés");
  };

  const showStandings = () =>
    openAlert({
      title: "Classement",
      message: "Le classement est calculé à partir des scores saisis. Consultez l'onglet Classement pour la structure.",
    });

  return {
    data,
    update,
    patch,
    patchPresentation,
    editTournamentName,
    addDay,
    editDay,
    addLocation,
    editLocation,
    addDivision,
    editDivision,
    toggleSection,
    toggleTeamField,
    addTeamField,
    editTeamField,
    deleteTeamField,
    togglePlayerField,
    addPlayerField,
    editPlayerField,
    deletePlayerField,
    toggleInscriptionQuestion,
    switchToIndividualSport,
    addTeam,
    editTeam,
    openTeamPlayers,
    deleteSelectedTeams,
    duplicateSelectedTeams,
    moveSelectedTeams,
    exportTeams,
    importTeams,
    toggleRefereeField,
    addRefereeField,
    addReferee,
    editReferee,
    exportReferees,
    addAdmin,
    removeAdmin,
    setStructureDivision,
    addPhase,
    editPhase,
    removePhase,
    addStructureItem,
    editStructureItem,
    addTeamToItem,
    setMatchDuration,
    toggleCalendarLock,
    addTerrain,
    editTerrain,
    addCalendarEvent,
    planAll,
    clearSchedule,
    assignRefereeToAll,
    exportCalendar,
    copyWebsiteUrl,
    toggleShowInApp,
    toggleWebsiteActive,
    togglePageEnabled,
    toggleGeneralSetting,
    toggleStandingsColumn,
    resetAdminLink,
    addSlideshowSlide,
    editSlideshowSlide,
    toggleSlideshowSlide,
    deleteSlideshowSlide,
    toggleSlideshowSetting,
    setDesignColor,
    uploadDesignAsset,
    addSponsorBlock,
    updatePageContent,
    addRegistrationQuestion,
    deleteRegistrationQuestion,
    downloadPoster,
    showSupport,
    openPresentationMode,
    updateScore,
    exportScores,
    showStandings,
    showToast,
    openPrompt,
    openConfirm,
    openAlert,
  };
}
