import { useCallback } from "react";
import { useTournament } from "../context/TournamentContext";
import { useAppUI } from "../context/AppUIContext";
import {
  DIVISION_COLORS,
  downloadText,
  generateAdminLink,
  nextId,
  toCsv,
} from "../utils/helpers";

export function useTournamentActions() {
  const { data, setData, update } = useTournament();
  const { showToast, openPrompt, openConfirm, openAlert } = useAppUI();

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
  const addDay = () =>
    openPrompt({
      title: "Ajouter un jour",
      label: "Date / libellé",
      onSubmit: (label) => {
        patch((p) => ({ days: [...p.days, { id: nextId(p.days), label }] }));
        showToast("Journée ajoutée");
      },
    });

  const editDay = (id) => {
    const day = data.days.find((d) => d.id === id);
    openPrompt({
      title: "Modifier la journée",
      label: "Date / libellé",
      defaultValue: day?.label,
      onSubmit: (label) => {
        patch((p) => ({
          days: p.days.map((d) => (d.id === id ? { ...d, label } : d)),
        }));
        showToast("Journée mise à jour");
      },
    });
  };

  const addLocation = () =>
    openPrompt({
      title: "Ajouter un lieu",
      label: "Adresse",
      onSubmit: (label) => {
        patch((p) => ({ locations: [...p.locations, { id: nextId(p.locations), label }] }));
        showToast("Lieu ajouté");
      },
    });

  const editLocation = (id) => {
    const loc = data.locations.find((l) => l.id === id);
    openPrompt({
      title: "Modifier le lieu",
      label: "Adresse",
      defaultValue: loc?.label,
      onSubmit: (label) => {
        patch((p) => ({
          locations: p.locations.map((l) => (l.id === id ? { ...l, label } : l)),
        }));
        showToast("Lieu mis à jour");
      },
    });
  };

  const addDivision = () =>
    openPrompt({
      title: "Ajouter une division",
      label: "Nom (ex: U11)",
      onSubmit: (name) => {
        patch((p) => ({
          divisions: [
            ...p.divisions,
            { id: nextId(p.divisions), name, color: DIVISION_COLORS[p.divisions.length % DIVISION_COLORS.length] },
          ],
        }));
        showToast("Division ajoutée");
      },
    });

  const editDivision = (id) => {
    const div = data.divisions.find((d) => d.id === id);
    openPrompt({
      title: "Modifier la division",
      label: "Nom",
      defaultValue: div?.name,
      onSubmit: (name) => {
        patch((p) => ({
          divisions: p.divisions.map((d) => (d.id === id ? { ...d, name } : d)),
        }));
        showToast("Division mise à jour");
      },
    });
  };

  const addLanguage = () =>
    openPrompt({
      title: "Ajouter une langue",
      label: "Code langue (ex: en, de, es)",
      onSubmit: (code) => {
        const lang = code.toLowerCase().slice(0, 2);
        if (data.languages.includes(lang)) {
          showToast("Cette langue est déjà ajoutée");
          return;
        }
        patch((p) => ({ languages: [...p.languages, lang] }));
        showToast(`Langue ${lang} ajoutée`);
      },
    });

  const toggleSection = (key) => patch((p) => ({ [key]: !p[key] }));

  // ——— Équipes ———
  const toggleTeamField = (id) =>
    patch((p) => ({
      teamFields: p.teamFields.map((f) => (f.id === id ? { ...f, enabled: !f.enabled } : f)),
    }));

  const addTeamField = () =>
    openPrompt({
      title: "Nouveau champ équipe",
      label: "Libellé du champ",
      onSubmit: (label) => {
        const id = label.toLowerCase().replace(/\s+/g, "_");
        patch((p) => ({
          teamFields: [...p.teamFields, { id, label, standard: false, enabled: true }],
        }));
        showToast("Champ ajouté");
      },
    });

  const editTeamField = (id) => {
    const field = data.teamFields.find((f) => f.id === id);
    openPrompt({
      title: "Modifier le champ",
      defaultValue: field?.label,
      onSubmit: (label) => {
        patch((p) => ({
          teamFields: p.teamFields.map((f) => (f.id === id ? { ...f, label } : f)),
        }));
        showToast("Champ mis à jour");
      },
    });
  };

  const togglePlayerField = (id) =>
    patch((p) => ({
      playerFields: p.playerFields.map((f) => (f.id === id ? { ...f, enabled: !f.enabled } : f)),
    }));

  const addPlayerField = () =>
    openPrompt({
      title: "Nouveau champ joueur",
      label: "Libellé",
      onSubmit: (label) => {
        patch((p) => ({
          playerFields: [...p.playerFields, { id: `p_${nextId(p.playerFields)}`, label, enabled: true }],
        }));
        showToast("Champ joueur ajouté");
      },
    });

  const editPlayerField = (id) => {
    const field = data.playerFields.find((f) => f.id === id);
    openPrompt({
      title: "Modifier le champ joueur",
      defaultValue: field?.label,
      onSubmit: (label) => {
        patch((p) => ({
          playerFields: p.playerFields.map((f) => (f.id === id ? { ...f, label } : f)),
        }));
        showToast("Champ mis à jour");
      },
    });
  };

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
          teams: [...p.teams, { id: nextId(p.teams), name, email: "", players: 0, region: "" }],
        }));
        showToast("Équipe ajoutée");
      },
    });

  const editTeam = (id) => {
    const team = data.teams.find((t) => t.id === id);
    openPrompt({
      title: "Modifier l'équipe",
      defaultValue: team?.name,
      onSubmit: (name) => {
        patch((p) => ({
          teams: p.teams.map((t) => (t.id === id ? { ...t, name } : t)),
        }));
        showToast("Équipe mise à jour");
      },
    });
  };

  const deleteSelectedTeams = (ids) => {
    if (!ids.length) return showToast("Sélectionnez au moins une équipe");
    openConfirm({
      title: "Supprimer",
      message: `Supprimer ${ids.length} équipe(s) ?`,
      onConfirm: () => {
        patch((p) => ({ teams: p.teams.filter((t) => !ids.includes(t.id)) }));
        showToast("Équipe(s) supprimée(s)");
      },
    });
  };

  const exportTeams = () => {
    const csv = toCsv(data.teams, ["name", "email", "players", "region"]);
    downloadText("equipes.csv", csv, "text/csv;charset=utf-8");
    showToast("Export téléchargé");
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

  const showUpgrade = () =>
    openAlert({
      title: "Mise à niveau",
      message: "Découvrez les fonctionnalités premium : paiements en ligne, notifications push, domaine personnalisé…",
    });

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
    addDay,
    editDay,
    addLocation,
    editLocation,
    addDivision,
    editDivision,
    addLanguage,
    toggleSection,
    toggleTeamField,
    addTeamField,
    editTeamField,
    togglePlayerField,
    addPlayerField,
    editPlayerField,
    switchToIndividualSport,
    addTeam,
    editTeam,
    deleteSelectedTeams,
    exportTeams,
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
    showUpgrade,
    showSupport,
    openPresentationMode,
    updateScore,
    exportScores,
    showStandings,
    showToast,
    openPrompt,
    openConfirm,
  };
}
